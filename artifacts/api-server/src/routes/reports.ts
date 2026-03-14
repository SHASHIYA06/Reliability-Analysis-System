import { Router, type IRouter } from "express";
import { db, failuresTable, trainsTable, fleetDistancesTable } from "@workspace/db";
import { gte, lte, and, sql, eq } from "drizzle-orm";

const router: IRouter = Router();

const MDBF_TARGET = 30000; // km
const MTTR_TARGET = 240;   // minutes (4 hours)
const AVAILABILITY_TARGET = 0.95; // 95%
const PATTERN_WINDOW_MONTHS = 18;

function buildDateFilter(startDate?: string, endDate?: string) {
  const conditions = [];
  if (startDate) conditions.push(gte(failuresTable.failureDate, startDate));
  if (endDate) conditions.push(lte(failuresTable.failureDate, endDate));
  return conditions;
}

// MDBF Report
router.get("/reports/mdbf", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const conditions = buildDateFilter(startDate, endDate);
    const allConditions = [eq(failuresTable.failureClass, "service-failure"), ...conditions];

    const serviceFailures = await db.select().from(failuresTable).where(and(...allConditions));
    const allTrains = await db.select().from(trainsTable).where(eq(trainsTable.status, "active"));
    const distances = await db.select().from(fleetDistancesTable);
    const allJobCards = await db.select().from(failuresTable);

    // Calculate total fleet distance per train
    const trainDistances: Record<string, number> = {};
    for (const d of distances) {
      if (!trainDistances[d.trainId] || d.cumulativeDistanceKm > trainDistances[d.trainId]) {
        trainDistances[d.trainId] = d.cumulativeDistanceKm;
      }
    }
    if (Object.keys(trainDistances).length === 0) {
      for (const f of allJobCards) {
        const key = f.trainSet || f.trainId;
        if (key && f.trainDistanceAtFailure) {
          const dist = Number(f.trainDistanceAtFailure);
          if (!trainDistances[key] || dist > trainDistances[key]) trainDistances[key] = dist;
        }
      }
    }

    const totalFleetDistance = Object.values(trainDistances).reduce((sum, d) => sum + d, 0);
    const totalServiceFailures = serviceFailures.length;
    const mdbf = totalServiceFailures > 0 ? totalFleetDistance / totalServiceFailures : totalFleetDistance;

    // By train
    const failuresByTrain: Record<string, number> = {};
    for (const f of serviceFailures) {
      failuresByTrain[f.trainId] = (failuresByTrain[f.trainId] || 0) + 1;
    }

    const byTrain = allTrains.map(t => {
      const dist = trainDistances[t.id] || 0;
      const fails = failuresByTrain[t.id] || 0;
      return {
        trainNumber: t.trainNumber,
        distance: dist,
        serviceFailures: fails,
        mdbf: fails > 0 ? dist / fails : dist,
      };
    });

    // Monthly trend
    const monthlyData: Record<string, { failures: number }> = {};
    for (const f of serviceFailures) {
      const month = f.failureDate.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { failures: 0 };
      monthlyData[month].failures++;
    }
    const trend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        mdbf: data.failures > 0 ? (totalFleetDistance / Object.keys(monthlyData).length) / data.failures : 0,
        failures: data.failures,
      }));

    res.json({
      totalFleetDistance,
      totalServiceFailures,
      mdbf,
      target: MDBF_TARGET,
      compliance: mdbf >= MDBF_TARGET,
      byTrain,
      trend,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate MDBF report" });
  }
});

// MDBCF Report
router.get("/reports/mdbcf", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const conditions = buildDateFilter(startDate, endDate);

    const relevantFailures = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const distances = await db.select().from(fleetDistancesTable);
    const trainDistances: Record<string, number> = {};
    for (const d of distances) {
      if (!trainDistances[d.trainId] || d.cumulativeDistanceKm > trainDistances[d.trainId]) {
        trainDistances[d.trainId] = d.cumulativeDistanceKm;
      }
    }
    const totalFleetDistance = Object.values(trainDistances).reduce((sum, d) => sum + d, 0);

    // Group by system
    const systemMap: Record<string, { systemName: string; failures: number; population: number }> = {};
    const systemPopulations: Record<string, number> = {
      "1.1": 4, "1.2": 2, "1.3": 2, "1.4": 16, "2.1": 4, "2.2": 4, "2.3": 4,
      "3.0": 1, "4.0": 2, "4.1": 96, "5.0": 2, "5.1": 12, "6.0": 8, "7.0": 5,
      "8.0": 12, "9.1": 4, "9.2": 4, "10.1": 2, "10.2": 12, "10.3": 12, "10.4": 2,
      "10.5": 2, "11.2": 6, "11.3": 6, "12.0": 5,
    };

    for (const f of relevantFailures) {
      const key = f.systemCode;
      if (!systemMap[key]) {
        systemMap[key] = {
          systemName: f.systemName,
          failures: 0,
          population: systemPopulations[f.subsystemCode || key] || 1,
        };
      }
      systemMap[key].failures++;
    }

    const bySystem = Object.entries(systemMap).map(([systemCode, data]) => ({
      systemCode,
      systemName: data.systemName,
      population: data.population,
      totalDistance: totalFleetDistance,
      componentFailures: data.failures,
      mdbcf: data.failures > 0 ? (totalFleetDistance * data.population) / data.failures : 0,
    }));

    res.json({ bySystem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate MDBCF report" });
  }
});

// MTTR Report
router.get("/reports/mttr", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const conditions = buildDateFilter(startDate, endDate);

    const relevantFailures = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const withRepairTime = relevantFailures.filter(f => f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const totalRepairTime = withRepairTime.reduce((sum, f) => sum + (f.repairDurationMinutes || 0), 0);
    const overallMTTR = withRepairTime.length > 0 ? totalRepairTime / withRepairTime.length : 0;

    // By system
    const systemMap: Record<string, { systemName: string; repairs: number; totalTime: number }> = {};
    for (const f of withRepairTime) {
      if (!systemMap[f.systemCode]) {
        systemMap[f.systemCode] = { systemName: f.systemName, repairs: 0, totalTime: 0 };
      }
      systemMap[f.systemCode].repairs++;
      systemMap[f.systemCode].totalTime += f.repairDurationMinutes || 0;
    }

    const bySystem = Object.entries(systemMap).map(([systemCode, data]) => ({
      systemCode,
      systemName: data.systemName,
      totalRepairs: data.repairs,
      totalRepairTime: data.totalTime,
      mttr: data.repairs > 0 ? data.totalTime / data.repairs : 0,
    }));

    // Distribution histogram
    const ranges = [
      { label: "0-30 min", min: 0, max: 30 },
      { label: "30-60 min", min: 30, max: 60 },
      { label: "1-2 hours", min: 60, max: 120 },
      { label: "2-4 hours", min: 120, max: 240 },
      { label: "4-8 hours", min: 240, max: 480 },
      { label: ">8 hours", min: 480, max: Infinity },
    ];
    const distribution = ranges.map(r => ({
      range: r.label,
      count: withRepairTime.filter(f => (f.repairDurationMinutes || 0) >= r.min && (f.repairDurationMinutes || 0) < r.max).length,
    }));

    res.json({
      overallMTTR,
      target: MTTR_TARGET,
      compliance: overallMTTR <= MTTR_TARGET || overallMTTR === 0,
      bySystem,
      distribution,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate MTTR report" });
  }
});

// Availability Report
router.get("/reports/availability", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const conditions = buildDateFilter(startDate, endDate);

    const allTrains = await db.select().from(trainsTable);
    const serviceFailures = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(eq(failuresTable.failureClass, "service-failure"), ...conditions) : eq(failuresTable.failureClass, "service-failure"));

    // Estimate scheduled hours (18 hrs/day operation, 365 days)
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : now;
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 365;
    const hoursPerDay = 18;
    const scheduledHoursPerTrain = days * hoursPerDay;
    const totalScheduledHours = allTrains.length * scheduledHoursPerTrain;

    // Calculate unavailable hours from repair duration
    const totalUnavailableMinutes = serviceFailures.reduce((sum, f) => sum + (f.repairDurationMinutes || 0), 0);
    const unavailableHours = totalUnavailableMinutes / 60;

    const overallAvailability = totalScheduledHours > 0
      ? Math.max(0, (totalScheduledHours - unavailableHours) / totalScheduledHours)
      : 1;

    // By train
    const trainDowntime: Record<string, number> = {};
    for (const f of serviceFailures) {
      trainDowntime[f.trainId] = (trainDowntime[f.trainId] || 0) + (f.repairDurationMinutes || 0);
    }

    const byTrain = allTrains.map(t => {
      const downtime = (trainDowntime[t.id] || 0) / 60;
      const availability = scheduledHoursPerTrain > 0
        ? Math.max(0, (scheduledHoursPerTrain - downtime) / scheduledHoursPerTrain)
        : 1;
      return { trainNumber: t.trainNumber, availability, downtime };
    });

    // Monthly trend
    const monthlyData: Record<string, number> = {};
    for (const f of serviceFailures) {
      const month = f.failureDate.substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + (f.repairDurationMinutes || 0);
    }
    const trend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, downMinutes]) => ({
        period,
        availability: Math.max(0, 1 - downMinutes / (allTrains.length * hoursPerDay * 60)),
      }));

    res.json({
      overallAvailability,
      target: AVAILABILITY_TARGET,
      compliance: overallAvailability >= AVAILABILITY_TARGET,
      scheduledHours: totalScheduledHours,
      unavailableHours,
      byTrain,
      trend,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate availability report" });
  }
});

// Pattern Failure Report
router.get("/reports/pattern-failures", async (req, res) => {
  try {
    const { windowMonths } = req.query as Record<string, string>;
    const months = parseInt(windowMonths || "18", 10);

    const windowStart = new Date();
    windowStart.setMonth(windowStart.getMonth() - months);
    const windowStartStr = windowStart.toISOString().split("T")[0];

    const failures = await db.select().from(failuresTable)
      .where(and(
        eq(failuresTable.failureClass, "relevant"),
        gte(failuresTable.failureDate, windowStartStr)
      ));

    const allTrains = await db.select().from(trainsTable);
    const totalTrains = allTrains.length;

    // Group by part number + system
    const partMap: Record<string, {
      partNumber: string;
      partDescription: string;
      systemCode: string;
      systemName: string;
      occurrences: number;
      trainIds: Set<string>;
      dates: string[];
    }> = {};

    for (const f of failures) {
      if (!f.partNumber) continue;
      const key = `${f.partNumber}|${f.systemCode}`;
      if (!partMap[key]) {
        partMap[key] = {
          partNumber: f.partNumber,
          partDescription: f.partReplaced || f.partNumber,
          systemCode: f.systemCode,
          systemName: f.systemName,
          occurrences: 0,
          trainIds: new Set(),
          dates: [],
        };
      }
      partMap[key].occurrences++;
      partMap[key].trainIds.add(f.trainId);
      partMap[key].dates.push(f.failureDate);
    }

    // Pattern detection rules:
    // 1. 3+ occurrences AND rate at least 20% higher than predicted
    // 2. OR 20% of fleet affected
    const patterns = Object.values(partMap)
      .filter(p => p.occurrences >= 3)
      .map(p => {
        const populationAffected = p.trainIds.size;
        const percentageAffected = totalTrains > 0 ? (populationAffected / totalTrains) * 100 : 0;
        const predictedRate = 0.1; // 10% predicted base rate
        const actualRate = p.occurrences / months;
        const rateExceedance = predictedRate > 0 ? ((actualRate - predictedRate) / predictedRate) * 100 : 0;

        const isPattern =
          (p.occurrences >= 3 && rateExceedance >= 20) ||
          (p.occurrences >= 3 && percentageAffected >= 20);

        let patternType = "";
        if (isPattern) {
          if (rateExceedance >= 20 && percentageAffected >= 20) patternType = "Rate & Fleet";
          else if (rateExceedance >= 20) patternType = "Rate Exceedance";
          else patternType = "Fleet Affected";
        }

        const sortedDates = p.dates.sort();
        return {
          partNumber: p.partNumber,
          partDescription: p.partDescription,
          systemCode: p.systemCode,
          systemName: p.systemName,
          occurrences: p.occurrences,
          populationAffected,
          totalPopulation: totalTrains,
          percentageAffected,
          predictedRate,
          actualRate,
          rateExceedance,
          isPattern,
          patternType,
          firstOccurrence: sortedDates[0] || "",
          lastOccurrence: sortedDates[sortedDates.length - 1] || "",
        };
      });

    res.json({
      windowMonths: months,
      analysisDate: new Date().toISOString().split("T")[0],
      patterns,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate pattern failure report" });
  }
});

// Summary Report
router.get("/reports/summary", async (_req, res) => {
  try {
    const [allFailures, allTrains, distances] = await Promise.all([
      db.select().from(failuresTable),
      db.select().from(trainsTable),
      db.select().from(fleetDistancesTable),
    ]);

    const serviceFailures = allFailures.filter(f => f.failureClass === "service-failure");
    const relevantFailures = allFailures.filter(f => f.failureClass === "relevant");
    const nonRelevantFailures = allFailures.filter(f => f.failureClass === "non-relevant");
    const openJobCards = allFailures.filter(f => f.status === "open" || f.status === "in-progress");

    // Fleet distance — prefer real odometer data from job cards (most accurate)
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
    // Fallback: use fleet distances table if no job card KM data
    if (totalFleetDistance === 0 && distances.length > 0) {
      const trainDistancesMap: Record<string, number> = {};
      for (const d of distances) {
        if (!trainDistancesMap[d.trainId] || d.cumulativeDistanceKm > trainDistancesMap[d.trainId]) {
          trainDistancesMap[d.trainId] = d.cumulativeDistanceKm;
        }
      }
      totalFleetDistance = Object.values(trainDistancesMap).reduce((sum, d) => sum + d, 0);
    }

    // MDBF — service-affecting failures (CM corrective orders or delay=true or failureClass=service-failure)
    const cmFailures = allFailures.filter(f =>
      f.failureClass === "service-failure" ||
      f.orderType === "CM" ||
      f.delay === true
    );
    const mdbf = cmFailures.length > 0 ? totalFleetDistance / cmFailures.length : 0;

    // MTTR
    const withRepair = allFailures.filter(f => f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const mttr = withRepair.length > 0
      ? withRepair.reduce((sum, f) => sum + (f.repairDurationMinutes || 0), 0) / withRepair.length
      : 0;

    // Availability (simplified)
    const days = 365;
    const hoursPerDay = 18;
    const scheduledHoursPerTrain = days * hoursPerDay;
    // Count active train sets from job cards (TS01-TS14), min 14
    const activeTrainSets = new Set(allFailures.map(f => f.trainSet).filter(ts => ts && /^TS\d+$/i.test(ts)));
    const numTrains = Math.max(allTrains.length, activeTrainSets.size, 14);
    const totalScheduledHours = numTrains * scheduledHoursPerTrain;
    // Downtime from CM failures (service-affecting)
    const unavailableMinutes = cmFailures.reduce((sum, f) => sum + (f.repairDurationMinutes || 0), 0);
    const availability = totalScheduledHours > 0
      ? Math.max(0, (totalScheduledHours - unavailableMinutes / 60) / totalScheduledHours)
      : 1;

    // Pattern failures (quick check)
    const windowStart = new Date();
    windowStart.setMonth(windowStart.getMonth() - PATTERN_WINDOW_MONTHS);
    const recentRelevant = relevantFailures.filter(f => f.failureDate >= windowStart.toISOString().split("T")[0] && f.partNumber);
    const partCounts: Record<string, number> = {};
    for (const f of recentRelevant) {
      if (f.partNumber) partCounts[f.partNumber] = (partCounts[f.partNumber] || 0) + 1;
    }
    const patternFailureCount = Object.values(partCounts).filter(c => c >= 3).length;

    // Recent failures
    const recentFailures = allFailures
      .sort((a, b) => b.failureDate.localeCompare(a.failureDate))
      .slice(0, 5);

    // By system
    const systemCounts: Record<string, number> = {};
    for (const f of allFailures) {
      const key = f.systemName || "General";
      systemCounts[key] = (systemCounts[key] || 0) + 1;
    }
    const failuresBySystem = Object.entries(systemCounts)
      .map(([systemName, count]) => ({ systemName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Monthly trend
    const monthlyMap: Record<string, { total: number; service: number }> = {};
    for (const f of allFailures) {
      const month = (f.failureDate || "").substring(0, 7);
      if (!month) continue;
      if (!monthlyMap[month]) monthlyMap[month] = { total: 0, service: 0 };
      monthlyMap[month].total++;
      if (f.failureClass === "service-failure" || f.delay) monthlyMap[month].service++;
    }
    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-18)
      .map(([month, d]) => ({ period: month, failures: d.total, serviceFailures: d.service }));

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
      relevantFailures: relevantFailures.length,
      nonRelevantFailures: nonRelevantFailures.length,
      openJobCards: openJobCards.length,
      totalFleetDistance,
      mdbf,
      mdbfTarget: MDBF_TARGET,
      mttr,
      mttrTarget: MTTR_TARGET,
      availability,
      availabilityTarget: AVAILABILITY_TARGET,
      patternFailureCount,
      recentFailures,
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
