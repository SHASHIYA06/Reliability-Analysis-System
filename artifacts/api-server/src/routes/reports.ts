import { Router, type IRouter } from "express";
import { db, failuresTable, trainsTable, fleetDistancesTable } from "@workspace/db";
import { gte, lte, and, sql, eq } from "drizzle-orm";

const router: IRouter = Router();

const MDBF_TARGET = 30000;   // km per RAMS plan GR-TD-3457
const MDBCF_TARGET = 50000;  // km per RAMS plan
const MTTR_TARGET = 240;     // minutes (4 hours) per RAMS plan
const AVAILABILITY_TARGET = 0.95; // 95%
const HOURS_PER_DAY = 20;    // KMRC metro operating hours per day
const PATTERN_WINDOW_MONTHS = 18;

function buildDateFilter(startDate?: string, endDate?: string) {
  const conditions = [];
  if (startDate) conditions.push(gte(failuresTable.failureDate, startDate));
  if (endDate) conditions.push(lte(failuresTable.failureDate, endDate));
  return conditions;
}

/**
 * Get fleet distance using SQL max-odometer-per-trainset approach
 * This is the most accurate method using real job card odometer readings
 */
async function getFleetDistance(): Promise<number> {
  const result = await db.execute(sql`
    SELECT COALESCE(SUM(max_km), 0)::float as total
    FROM (
      SELECT train_set, MAX(train_distance_at_failure) as max_km
      FROM failures
      WHERE train_set IS NOT NULL
        AND train_set ~ '^TS'
        AND train_distance_at_failure > 0
      GROUP BY train_set
    ) t
  `);
  return parseFloat(String((result.rows[0] as any)?.total || 0));
}

/**
 * Service failure per RAMS specification (BEML KMRC):
 * A failure is service-affecting if:
 *   - withdrawal_required = TRUE (train withdrawn from service)
 *   - OR delay = TRUE (any recorded service delay — checkbox marked)
 *   - OR delay_minutes >= 3 (explicit 3+ minute delay where duration known)
 *
 * Note: BEML KMRC CSV uses "_" checkbox for delay field. When delay=true and
 * delay_minutes is null, the delay still counts as a service failure since
 * any delay recorded in Part D of the job card is ≥3 min per KMRC SLA.
 */
function isServiceFailure(f: any): boolean {
  return f.withdrawalRequired === true ||
         f.delay === true ||
         (f.delayMinutes != null && Number(f.delayMinutes) >= 3);
}

// MDBF Report
// MDBF = Fleet Distance / Service Failures
// Service failure = Withdraw=YES OR Delay >= 3 minutes (per RAMS plan)
router.get("/reports/mdbf", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const conditions = buildDateFilter(startDate, endDate);

    const allJobCards = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalFleetDistance = await getFleetDistance();
    const serviceFailures = allJobCards.filter(isServiceFailure);
    const mdbf = serviceFailures.length > 0 ? totalFleetDistance / serviceFailures.length : totalFleetDistance;

    // By train set
    const trainFailures: Record<string, number> = {};
    const trainDistances: Record<string, number> = {};
    for (const f of allJobCards) {
      const ts = f.trainSet || f.trainNumber;
      if (!ts) continue;
      if (f.trainDistanceAtFailure) {
        const d = Number(f.trainDistanceAtFailure);
        if (!trainDistances[ts] || d > trainDistances[ts]) trainDistances[ts] = d;
      }
      if (isServiceFailure(f)) trainFailures[ts] = (trainFailures[ts] || 0) + 1;
    }

    const byTrain = Object.keys(trainDistances).sort().map(ts => ({
      trainNumber: ts,
      distance: trainDistances[ts] || 0,
      serviceFailures: trainFailures[ts] || 0,
      mdbf: (trainFailures[ts] || 0) > 0 ? (trainDistances[ts] || 0) / trainFailures[ts] : trainDistances[ts] || 0,
    }));

    // Monthly trend
    const monthlyMap: Record<string, { failures: number }> = {};
    for (const f of serviceFailures) {
      const month = f.failureDate.substring(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { failures: 0 };
      monthlyMap[month].failures++;
    }
    const trend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        failures: data.failures,
        mdbf: data.failures > 0 ? totalFleetDistance / serviceFailures.length : 0,
      }));

    res.json({
      totalFleetDistance,
      totalServiceFailures: serviceFailures.length,
      mdbf,
      target: MDBF_TARGET,
      compliance: mdbf >= MDBF_TARGET,
      withdrawalCount: allJobCards.filter(f => f.withdrawalRequired).length,
      delayCount: allJobCards.filter(f => f.delayMinutes != null && Number(f.delayMinutes) >= 3).length,
      byTrain,
      trend,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate MDBF report" });
  }
});

// MDBCF Report
// MDBCF = Fleet Distance * Component Population / Component Failures
// Component failures = all CM (corrective maintenance) job cards
router.get("/reports/mdbcf", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const conditions = buildDateFilter(startDate, endDate);

    const allJobCards = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalFleetDistance = await getFleetDistance();

    // Component populations per system per trainset
    const systemPopulations: Record<string, number> = {
      "General": 1, "Traction System": 2, "Brake System": 4, "Door System": 96,
      "Air Conditioning System": 12, "Bogie & Suspension": 8,
      "Train Integrated Management System": 2, "Communication System": 5,
      "Fire Detection System": 12, "Vehicle Control System": 2,
      "Auxiliary Electric System": 2, "Lighting System": 6, "Gangway & Coupler": 5,
    };

    const systemMap: Record<string, { systemName: string; failures: number; population: number }> = {};
    for (const f of allJobCards) {
      const key = f.systemName || f.systemCode;
      if (!systemMap[key]) {
        systemMap[key] = {
          systemName: f.systemName,
          failures: 0,
          population: systemPopulations[f.systemName] || 1,
        };
      }
      systemMap[key].failures++;
    }

    const bySystem = Object.entries(systemMap)
      .map(([systemCode, data]) => ({
        systemCode,
        systemName: data.systemName,
        population: data.population,
        totalDistance: totalFleetDistance,
        componentFailures: data.failures,
        mdbcf: data.failures > 0 ? (totalFleetDistance * data.population) / data.failures : 0,
      }))
      .sort((a, b) => b.componentFailures - a.componentFailures);

    const totalCmFailures = allJobCards.filter(f => f.orderType === "CM").length;
    const overallMdbcf = totalCmFailures > 0 ? totalFleetDistance / totalCmFailures : 0;

    res.json({
      totalFleetDistance,
      totalComponentFailures: totalCmFailures,
      mdbcf: overallMdbcf,
      target: MDBCF_TARGET,
      compliance: overallMdbcf >= MDBCF_TARGET,
      bySystem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate MDBCF report" });
  }
});

// MTTR Report
// MTTR = Total Repair Duration / Number of Failures (per system)
router.get("/reports/mttr", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const conditions = buildDateFilter(startDate, endDate);

    const allJobCards = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const withRepairTime = allJobCards.filter(f => f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const totalRepairTime = withRepairTime.reduce((sum, f) => sum + (f.repairDurationMinutes || 0), 0);
    const overallMTTR = withRepairTime.length > 0 ? totalRepairTime / withRepairTime.length : 0;

    // By system
    const systemMap: Record<string, { systemName: string; repairs: number; totalTime: number }> = {};
    for (const f of withRepairTime) {
      const key = f.systemCode || f.systemName;
      if (!systemMap[key]) systemMap[key] = { systemName: f.systemName, repairs: 0, totalTime: 0 };
      systemMap[key].repairs++;
      systemMap[key].totalTime += f.repairDurationMinutes || 0;
    }

    const bySystem = Object.entries(systemMap)
      .map(([systemCode, data]) => ({
        systemCode,
        systemName: data.systemName,
        totalRepairs: data.repairs,
        totalRepairTime: data.totalTime,
        mttr: data.repairs > 0 ? data.totalTime / data.repairs : 0,
      }))
      .sort((a, b) => b.mttr - a.mttr);

    const distribution = [
      { label: "0-30 min", min: 0, max: 30 },
      { label: "30-60 min", min: 30, max: 60 },
      { label: "1-2 hrs", min: 60, max: 120 },
      { label: "2-4 hrs", min: 120, max: 240 },
      { label: "4-8 hrs", min: 240, max: 480 },
      { label: ">8 hrs", min: 480, max: Infinity },
    ].map(r => ({
      range: r.label,
      count: withRepairTime.filter(f => (f.repairDurationMinutes || 0) >= r.min && (f.repairDurationMinutes || 0) < r.max).length,
    }));

    res.json({ overallMTTR, target: MTTR_TARGET, compliance: overallMTTR <= MTTR_TARGET || overallMTTR === 0, bySystem, distribution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate MTTR report" });
  }
});

// Availability Report
// AVAILABILITY = 1 - (DT(OPM) + DT(CM)) / Total Time
// Total Time = Assessment Period Hours × Number of trains
// DT(CM) = Downtime from CM job cards
// DT(OPM) = Downtime from OPM/PM job cards with repair time recorded
router.get("/reports/availability", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const conditions = buildDateFilter(startDate, endDate);

    const allJobCards = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const allTrains = await db.select().from(trainsTable);

    // Assessment period
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const end = endDate ? new Date(endDate) : now;
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // Determine number of active trains (from job cards or trains table)
    const activeTrainSets = new Set(allJobCards.map(f => f.trainSet).filter(ts => ts && /^TS\d+$/i.test(ts)));
    const numTrains = Math.max(allTrains.length, activeTrainSets.size, 14);
    const totalScheduledHours = numTrains * days * HOURS_PER_DAY;

    // DT(CM) = downtime from CM job cards with repair time
    const cmJobCards = allJobCards.filter(f => f.orderType === "CM" && f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const dtCmMinutes = cmJobCards.reduce((sum, f) => sum + (f.repairDurationMinutes || 0), 0);

    // DT(OPM) = downtime from PM/OPM job cards with repair time
    const opmJobCards = allJobCards.filter(f => (f.orderType === "PM" || f.orderType === "OPM") && f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const dtOpmMinutes = opmJobCards.reduce((sum, f) => sum + (f.repairDurationMinutes || 0), 0);

    const totalDowntimeHours = (dtCmMinutes + dtOpmMinutes) / 60;
    const overallAvailability = totalScheduledHours > 0
      ? Math.max(0, 1 - totalDowntimeHours / totalScheduledHours)
      : 1;

    // By train set
    const trainDowntime: Record<string, number> = {};
    for (const f of [...cmJobCards, ...opmJobCards]) {
      const ts = f.trainSet || f.trainId;
      trainDowntime[ts] = (trainDowntime[ts] || 0) + (f.repairDurationMinutes || 0);
    }

    const scheduledHoursPerTrain = days * HOURS_PER_DAY;
    const byTrain = Array.from(activeTrainSets).sort().map(ts => {
      const downtime = (trainDowntime[ts] || 0) / 60;
      return {
        trainNumber: ts,
        availability: scheduledHoursPerTrain > 0 ? Math.max(0, 1 - downtime / scheduledHoursPerTrain) : 1,
        downtimeHours: downtime,
      };
    });

    // Monthly trend
    const monthlyMap: Record<string, number> = {};
    for (const f of [...cmJobCards, ...opmJobCards]) {
      const month = f.failureDate.substring(0, 7);
      monthlyMap[month] = (monthlyMap[month] || 0) + (f.repairDurationMinutes || 0);
    }
    const trend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, downMinutes]) => ({
        period,
        availability: Math.max(0, 1 - downMinutes / (numTrains * HOURS_PER_DAY * 60)),
      }));

    res.json({
      overallAvailability,
      target: AVAILABILITY_TARGET,
      compliance: overallAvailability >= AVAILABILITY_TARGET,
      assessmentDays: days,
      numTrains,
      totalScheduledHours,
      dtCmHours: dtCmMinutes / 60,
      dtOpmHours: dtOpmMinutes / 60,
      totalDowntimeHours,
      byTrain,
      trend,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate availability report" });
  }
});

// Pattern Failure Report
// Threshold: >= 3 failures OR >= 20% fleet affected
router.get("/reports/pattern-failures", async (req, res) => {
  try {
    const { windowMonths } = req.query as Record<string, string>;
    const months = parseInt(windowMonths || "18", 10);

    const windowStart = new Date();
    windowStart.setMonth(windowStart.getMonth() - months);
    const windowStartStr = windowStart.toISOString().split("T")[0];

    const failures = await db.select().from(failuresTable)
      .where(gte(failuresTable.failureDate, windowStartStr));

    const allTrains = await db.select().from(trainsTable);
    const activeTrainSets = new Set(failures.map(f => f.trainSet).filter(ts => ts && /^TS\d+$/i.test(ts)));
    const totalTrains = Math.max(allTrains.length, activeTrainSets.size, 14);

    // Group by component/system
    const componentMap: Record<string, {
      partNumber: string; partDescription: string; systemCode: string;
      systemName: string; occurrences: number; trainIds: Set<string>; dates: string[];
    }> = {};

    for (const f of failures) {
      const key = `${f.partNumber || f.component || f.failureName}|${f.systemCode}`;
      if (!key.startsWith("|")) {
        if (!componentMap[key]) {
          componentMap[key] = {
            partNumber: f.partNumber || f.component || f.failureName || "Unknown",
            partDescription: f.partReplaced || f.failureName || f.component || "",
            systemCode: f.systemCode, systemName: f.systemName,
            occurrences: 0, trainIds: new Set(), dates: [],
          };
        }
        componentMap[key].occurrences++;
        if (f.trainSet) componentMap[key].trainIds.add(f.trainSet);
        componentMap[key].dates.push(f.failureDate);
      }
    }

    const patterns = Object.values(componentMap)
      .filter(p => p.occurrences >= 3)
      .map(p => {
        const populationAffected = p.trainIds.size;
        const percentageAffected = totalTrains > 0 ? (populationAffected / totalTrains) * 100 : 0;
        const isPattern = p.occurrences >= 3 || percentageAffected >= 20;
        let patternType = "";
        if (p.occurrences >= 3 && percentageAffected >= 20) patternType = "Rate & Fleet";
        else if (p.occurrences >= 3) patternType = "Frequent Failure";
        else if (percentageAffected >= 20) patternType = "Fleet Affected";
        const sortedDates = p.dates.sort();
        return {
          partNumber: p.partNumber, partDescription: p.partDescription,
          systemCode: p.systemCode, systemName: p.systemName,
          occurrences: p.occurrences, populationAffected, totalPopulation: totalTrains,
          percentageAffected, isPattern, patternType,
          firstOccurrence: sortedDates[0] || "", lastOccurrence: sortedDates[sortedDates.length - 1] || "",
        };
      })
      .sort((a, b) => b.occurrences - a.occurrences);

    res.json({ windowMonths: months, analysisDate: new Date().toISOString().split("T")[0], patterns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate pattern failure report" });
  }
});

// Summary Dashboard Report
router.get("/reports/summary", async (_req, res) => {
  try {
    const [allFailures, allTrains, distances] = await Promise.all([
      db.select().from(failuresTable),
      db.select().from(trainsTable),
      db.select().from(fleetDistancesTable),
    ]);

    // Fleet distance from real odometer data
    const kmResult = await db.execute(sql`
      SELECT COALESCE(SUM(max_km), 0)::float as total
      FROM (
        SELECT train_set, MAX(train_distance_at_failure) as max_km
        FROM failures
        WHERE train_set IS NOT NULL AND train_set ~ '^TS' AND train_distance_at_failure > 0
        GROUP BY train_set
      ) t
    `);
    let totalFleetDistance = parseFloat(String((kmResult.rows[0] as any)?.total || 0));
    if (totalFleetDistance === 0 && distances.length > 0) {
      const dm: Record<string, number> = {};
      for (const d of distances) {
        if (!dm[d.trainId] || d.cumulativeDistanceKm > dm[d.trainId]) dm[d.trainId] = d.cumulativeDistanceKm;
      }
      totalFleetDistance = Object.values(dm).reduce((s, d) => s + d, 0);
    }

    // Service failures (per RAMS spec)
    const serviceFailures = allFailures.filter(isServiceFailure);
    const mdbf = serviceFailures.length > 0 ? totalFleetDistance / serviceFailures.length : 0;

    // MTTR
    const withRepair = allFailures.filter(f => f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const mttr = withRepair.length > 0
      ? withRepair.reduce((sum, f) => sum + (f.repairDurationMinutes || 0), 0) / withRepair.length
      : 0;

    // Availability per RAMS formula
    const activeTrainSets = new Set(allFailures.map(f => f.trainSet).filter(ts => ts && /^TS\d+$/i.test(ts)));
    const numTrains = Math.max(allTrains.length, activeTrainSets.size, 14);
    const days = 365;
    const totalScheduledHours = numTrains * days * HOURS_PER_DAY;
    const cmDown = allFailures.filter(f => f.orderType === "CM" && f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const opmDown = allFailures.filter(f => (f.orderType === "PM" || f.orderType === "OPM") && f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const totalDownMinutes = [...cmDown, ...opmDown].reduce((s, f) => s + (f.repairDurationMinutes || 0), 0);
    const availability = totalScheduledHours > 0 ? Math.max(0, 1 - totalDownMinutes / 60 / totalScheduledHours) : 1;

    // Open job cards
    const openJobCards = allFailures.filter(f => f.status === "open" || f.status === "in-progress");

    // Pattern failures
    const windowStart = new Date();
    windowStart.setMonth(windowStart.getMonth() - PATTERN_WINDOW_MONTHS);
    const recentFailures = allFailures.filter(f => f.failureDate >= windowStart.toISOString().split("T")[0]);
    const partCounts: Record<string, number> = {};
    for (const f of recentFailures) {
      const key = f.partNumber || f.component || f.failureName;
      if (key) partCounts[key] = (partCounts[key] || 0) + 1;
    }
    const patternFailureCount = Object.values(partCounts).filter(c => c >= 3).length;

    // By system
    const systemCounts: Record<string, number> = {};
    for (const f of allFailures) {
      const key = f.systemName || "General";
      systemCounts[key] = (systemCounts[key] || 0) + 1;
    }
    const failuresBySystem = Object.entries(systemCounts)
      .map(([systemName, count]) => ({ systemName, count }))
      .sort((a, b) => b.count - a.count).slice(0, 12);

    // Monthly trend
    const monthlyMap: Record<string, { total: number; service: number }> = {};
    for (const f of allFailures) {
      const month = (f.failureDate || "").substring(0, 7);
      if (!month) continue;
      if (!monthlyMap[month]) monthlyMap[month] = { total: 0, service: 0 };
      monthlyMap[month].total++;
      if (isServiceFailure(f)) monthlyMap[month].service++;
    }
    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b)).slice(-18)
      .map(([period, d]) => ({ period, failures: d.total, serviceFailures: d.service }));

    // By trainSet
    const byTrainSet: Record<string, number> = {};
    for (const f of allFailures) {
      const ts = f.trainSet || "Other";
      byTrainSet[ts] = (byTrainSet[ts] || 0) + 1;
    }
    const failuresByTrainSet = Object.entries(byTrainSet)
      .map(([trainSet, count]) => ({ trainSet, count }))
      .sort((a, b) => a.trainSet.localeCompare(b.trainSet));

    res.json({
      totalTrains: numTrains,
      totalFailures: allFailures.length,
      serviceFailures: serviceFailures.length,
      withdrawalCount: allFailures.filter(f => f.withdrawalRequired).length,
      delayCount: allFailures.filter(f => f.delay === true || (f.delayMinutes != null && Number(f.delayMinutes) >= 3)).length,
      openJobCards: openJobCards.length,
      totalFleetDistance,
      mdbf,
      mdbfTarget: MDBF_TARGET,
      mttr,
      mttrTarget: MTTR_TARGET,
      availability,
      availabilityTarget: AVAILABILITY_TARGET,
      patternFailureCount,
      recentFailures: allFailures.sort((a, b) => b.failureDate.localeCompare(a.failureDate)).slice(0, 5),
      failuresBySystem,
      monthlyTrend,
      failuresByTrainSet,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate summary report" });
  }
});

export default router;
