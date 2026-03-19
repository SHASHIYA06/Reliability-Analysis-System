// @ts-nocheck
import { db, failuresTable, trainsTable, fleetDistancesTable } from "@workspace/db";
import { gte, lte, and, sql, eq } from "drizzle-orm";

const router: IRouter = Router();

// Per RAMS Plan DRCA No. RS(3R)/PP/F/B864/A1 targets
const MDBF_TARGET_6MO = 60000;   // km — 6-car fleet, after 6 months revenue service
const MDBF_TARGET_12MO = 100000; // km — 6-car fleet, after 12 months revenue service
const MDBF_TARGET = 60000;       // Use 6-month target as the primary target
const MTTR_TARGET = 240;         // minutes overall; per-system targets in MTTR_TARGETS_MIN
const AVAILABILITY_TARGET = 0.95;
const HOURS_PER_DAY = 20;
const PATTERN_WINDOW_MONTHS = 18;
const TOTAL_FLEET_TRAINS = 14;   // TS01–TS14 active trainsets

// MDBCF targets (km) per system per RAMS Plan Table 2 (3-car train-km)
const MDBCF_TARGETS: Record<string, number> = {
  "Traction": 500000,
  "Traction System": 500000,
  "Brake": 700000,
  "Brake System": 700000,
  "Door": 1000000,
  "Door System": 1000000,
  "AC": 800000,
  "VAC": 800000,
  "Air Conditioning System": 800000,
  "Bogie": 3650000,
  "Bogie & Suspension": 3650000,
  "Communication System": 1450000,
  "PAPIS": 1450000,
  "Fire Detection System": 1450000,
  "TCMS": 2500000,
  "Train Integrated Management System": 2500000,
  "Auxiliary Electric System": 1050000,
  "Aux Electric": 1050000,
  "Lighting": 7450000,
  "Gangway": 6952000,
  "Vehicle Control": 2500000,
  "Vehicle Control System": 2500000,
};

// MTTR targets per system (minutes) per RAMS Plan Table 3
const MTTR_TARGETS_MIN: Record<string, number> = {
  "Traction": 150, // 2.5 hr
  "Traction System": 150,
  "Brake": 120, // 2.0 hr
  "Brake System": 120,
  "Door": 72,  // 1.2 hr
  "Door System": 72,
  "AC": 90,  // 1.5 hr
  "VAC": 90,
  "Air Conditioning System": 90,
  "Communication System": 72, // 1.2 hr
  "PAPIS": 72,
  "Fire Detection System": 72,
  "Bogie": 120, // 2.0 hr
  "Bogie & Suspension": 120,
  "TCMS": 90,  // 1.5 hr
  "Train Integrated Management System": 90,
  "Aux Electric": 102, // 1.7 hr
  "Auxiliary Electric System": 102,
  "Lighting": 60,  // 1.0 hr
  "Gangway": 60,
  "Vehicle Control": 90,
  "Vehicle Control System": 90,
};

function buildDateFilter(startDate?: string, endDate?: string) {
  const conditions = [];
  if (startDate) conditions.push(gte(failuresTable.failureDate, startDate));
  if (endDate) conditions.push(lte(failuresTable.failureDate, endDate));
  return conditions;
}

// New generic filter builder that adds optional system and trainSet filters
function buildFilters(params: {
  startDate?: string;
  endDate?: string;
  system?: string;
  trainSet?: string;
}) {
  const { startDate, endDate, system, trainSet } = params;
  const conditions = buildDateFilter(startDate, endDate);
  if (system) conditions.push(eq(failuresTable.systemName, system));
  if (trainSet) conditions.push(eq(failuresTable.trainSet, trainSet));
  return conditions;
}

async function getFleetDistance(trainSet?: string): Promise<number> {
  let query = sql`
    SELECT COALESCE(SUM(max_km), 0)::float as total
    FROM (
      SELECT train_set, MAX(train_distance_at_failure) as max_km
      FROM failures
      WHERE train_set IS NOT NULL
        AND train_set ~ '^TS'
        AND train_distance_at_failure > 0
        ${trainSet ? sql`AND train_set = ${trainSet}` : sql``}
      GROUP BY train_set
    ) t
  `;
  const result = await db.execute(query);
  return Number((result.rows[0] as any)?.total || 0);
}

/**
 * Service failure per RAMS Plan Section 7.3:
 * Relevant failure causing: withdrawal, or delay ≥3 minutes
 * BEML CSV uses "_" checkbox marker for withdrawal/delay flags.
 */
function isServiceFailure(f: any): boolean {
  return f.withdrawalRequired === true ||
    f.delay === true ||
    (f.delayMinutes != null && Number(f.delayMinutes) >= 3);
}

// ─── MDBF ────────────────────────────────────────────────────────────────────
router.get("/reports/mdbf", async (req, res) => {
  try {
    const { startDate, endDate, system, trainSet } = req.query as Record<string, string>;
    const conditions = buildFilters({ startDate, endDate, system, trainSet });
    const allJobCards = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalFleetDistance = await getFleetDistance(trainSet);
    const serviceFailures = allJobCards.filter(isServiceFailure);
    const mdbf = serviceFailures.length > 0 ? totalFleetDistance / serviceFailures.length : totalFleetDistance;

    // Per-train breakdown
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
      mdbf: (trainFailures[ts] || 0) > 0
        ? Math.round((trainDistances[ts] || 0) / trainFailures[ts])
        : trainDistances[ts] || 0,
    }));

    // Monthly trend
    const monthlyMap: Record<string, { failures: number }> = {};
    for (const f of serviceFailures) {
      const month = (f.failureDate || "").substring(0, 7);
      if (!month) continue;
      if (!monthlyMap[month]) monthlyMap[month] = { failures: 0 };
      monthlyMap[month].failures++;
    }
    const trend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        failures: data.failures,
        mdbf: data.failures > 0 ? Math.round(totalFleetDistance / serviceFailures.length) : 0,
      }));

    res.json({
      totalFleetDistance,
      totalServiceFailures: serviceFailures.length,
      mdbf: Math.round(mdbf),
      target: MDBF_TARGET,
      target6mo: MDBF_TARGET_6MO,
      target12mo: MDBF_TARGET_12MO,
      compliance: mdbf >= MDBF_TARGET,
      withdrawalCount: allJobCards.filter(f => f.withdrawalRequired).length,
      delayCount: allJobCards.filter(f => f.delay === true || (f.delayMinutes != null && Number(f.delayMinutes) >= 3)).length,
      byTrain,
      trend,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate MDBF report" });
  }
});

// ─── MDBCF ───────────────────────────────────────────────────────────────────
// MDBCF = Total Fleet Distance / Service Failures of identical items
// Grouped by system (component level = subsystem_name)
router.get("/reports/mdbcf", async (req, res) => {
  try {
    const { startDate, endDate, system, trainSet } = req.query as Record<string, string>;
    const conditions = buildFilters({ startDate, endDate, system, trainSet });
    const allJobCards = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalFleetDistance = await getFleetDistance(trainSet);
    const serviceFailures = allJobCards.filter(isServiceFailure);

    // Group service failures by systemName
    const systemMap: Record<string, {
      systemName: string;
      serviceFailures: number;
      totalFailures: number;
      target: number;
    }> = {};

    for (const f of allJobCards) {
      const key = f.systemName || "General";
      if (!systemMap[key]) {
        systemMap[key] = {
          systemName: key,
          serviceFailures: 0,
          totalFailures: 0,
          target: MDBCF_TARGETS[key] || 500000,
        };
      }
      systemMap[key].totalFailures++;
      if (isServiceFailure(f)) systemMap[key].serviceFailures++;
    }

    const bySystem = Object.entries(systemMap)
      .map(([systemCode, data]) => {
        const mdbcf = data.serviceFailures > 0
          ? Math.round(totalFleetDistance / data.serviceFailures)
          : null;
        return {
          systemCode,
          systemName: data.systemName,
          totalFailures: data.totalFailures,
          serviceFailures: data.serviceFailures,
          mdbcf,
          target: data.target,
          compliance: mdbcf != null ? mdbcf >= data.target : true,
        };
      })
      .filter(s => s.totalFailures > 0)
      .sort((a, b) => b.totalFailures - a.totalFailures);

    const totalServiceFailures = serviceFailures.length;
    const overallMdbcf = totalServiceFailures > 0
      ? Math.round(totalFleetDistance / totalServiceFailures)
      : 0;

    // Subsystem-level breakdown (component level per PRD)
    const subsystemMap: Record<string, {
      subsystemName: string;
      systemName: string;
      serviceFailures: number;
      totalFailures: number;
    }> = {};
    for (const f of allJobCards) {
      const sub = f.subsystemName && f.subsystemName !== "_" ? f.subsystemName : null;
      if (!sub) continue;
      const key = `${f.systemName}|${sub}`;
      if (!subsystemMap[key]) {
        subsystemMap[key] = {
          subsystemName: sub,
          systemName: f.systemName || "General",
          serviceFailures: 0,
          totalFailures: 0,
        };
      }
      subsystemMap[key].totalFailures++;
      if (isServiceFailure(f)) subsystemMap[key].serviceFailures++;
    }
    const bySubsystem = Object.entries(subsystemMap)
      .map(([key, data]) => ({
        key,
        subsystemName: data.subsystemName,
        systemName: data.systemName,
        totalFailures: data.totalFailures,
        serviceFailures: data.serviceFailures,
        mdbcf: data.serviceFailures > 0
          ? Math.round(totalFleetDistance / data.serviceFailures)
          : null,
      }))
      .filter(s => s.totalFailures >= 3)
      .sort((a, b) => b.totalFailures - a.totalFailures);

    res.json({
      totalFleetDistance,
      totalServiceFailures,
      mdbcf: overallMdbcf,
      target: MDBF_TARGET,
      compliance: overallMdbcf >= MDBF_TARGET,
      bySystem,
      bySubsystem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate MDBCF report" });
  }
});

// ─── MTTR ────────────────────────────────────────────────────────────────────
router.get("/reports/mttr", async (req, res) => {
  try {
    const { startDate, endDate, system, trainSet } = req.query as Record<string, string>;
    const conditions = buildFilters({ startDate, endDate, system, trainSet });
    const allJobCards = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const withRepairTime = allJobCards.filter(
      f => f.repairDurationMinutes != null && f.repairDurationMinutes > 0
    );
    const totalRepairTime = withRepairTime.reduce((sum, f) => sum + (f.repairDurationMinutes || 0), 0);
    const overallMTTR = withRepairTime.length > 0 ? totalRepairTime / withRepairTime.length : 0;

    const systemMap: Record<string, {
      systemName: string; repairs: number; totalTime: number; target: number;
    }> = {};
    for (const f of withRepairTime) {
      const key = f.systemName || f.systemCode || "General";
      if (!systemMap[key]) {
        systemMap[key] = {
          systemName: key,
          repairs: 0,
          totalTime: 0,
          target: MTTR_TARGETS_MIN[key] || MTTR_TARGET,
        };
      }
      systemMap[key].repairs++;
      systemMap[key].totalTime += f.repairDurationMinutes || 0;
    }

    const bySystem = Object.entries(systemMap)
      .map(([systemCode, data]) => ({
        systemCode,
        systemName: data.systemName,
        totalRepairs: data.repairs,
        totalRepairTime: data.totalTime,
        mttr: data.repairs > 0 ? Math.round(data.totalTime / data.repairs) : 0,
        target: data.target,
        compliance: data.repairs > 0 ? (data.totalTime / data.repairs) <= data.target : true,
      }))
      .sort((a, b) => b.mttr - a.mttr);

    const distribution = [
      { label: "0–30 min", min: 0, max: 30 },
      { label: "30–60 min", min: 30, max: 60 },
      { label: "1–2 hrs", min: 60, max: 120 },
      { label: "2–4 hrs", min: 120, max: 240 },
      { label: "4–8 hrs", min: 240, max: 480 },
      { label: ">8 hrs", min: 480, max: Infinity },
    ].map(r => ({
      range: r.label,
      count: withRepairTime.filter(
        f => (f.repairDurationMinutes || 0) >= r.min && (f.repairDurationMinutes || 0) < r.max
      ).length,
    }));

    res.json({
      overallMTTR: Math.round(overallMTTR),
      target: MTTR_TARGET,
      compliance: overallMTTR <= MTTR_TARGET || overallMTTR === 0,
      totalRepairs: withRepairTime.length,
      bySystem,
      distribution,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate MTTR report" });
  }
});

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────
// Availability = [1 - (DT(OPM) + DT(CM)) / Total Time] × 100
// Per RAMS Plan Section 19.4.1
router.get("/reports/availability", async (req, res) => {
  try {
    const { startDate, endDate, system, trainSet } = req.query as Record<string, string>;
    const conditions = buildFilters({ startDate, endDate, system, trainSet });
    const allJobCards = await db.select().from(failuresTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const allTrains = await db.select().from(trainsTable);

    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const end = endDate ? new Date(endDate) : now;
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const activeTrainSets = new Set(
      allJobCards.map(f => f.trainSet).filter(ts => ts && /^TS\d+$/i.test(ts))
    );
    const numTrains = Math.max(allTrains.length, activeTrainSets.size, TOTAL_FLEET_TRAINS);
    const totalScheduledHours = numTrains * days * HOURS_PER_DAY;

    // DT(CM) — downtime from Corrective Maintenance job cards with recorded repair time
    const cmCards = allJobCards.filter(
      f => f.orderType === "CM" && f.repairDurationMinutes != null && f.repairDurationMinutes > 0
    );
    const dtCmMinutes = cmCards.reduce((s, f) => s + (f.repairDurationMinutes || 0), 0);

    // DT(OPM) — downtime from PM/OPM job cards (excluding routine service checks counted as PM)
    const opmCards = allJobCards.filter(
      f => (f.orderType === "PM" || f.orderType === "OPM") &&
        f.repairDurationMinutes != null && f.repairDurationMinutes > 0
    );
    const dtOpmMinutes = opmCards.reduce((s, f) => s + (f.repairDurationMinutes || 0), 0);

    const totalDowntimeHours = (dtCmMinutes + dtOpmMinutes) / 60;
    const overallAvailability = totalScheduledHours > 0
      ? Math.max(0, 1 - totalDowntimeHours / totalScheduledHours)
      : 1;

    // Per-trainset breakdown
    const trainDowntime: Record<string, { cm: number; opm: number }> = {};
    for (const f of [...cmCards, ...opmCards]) {
      const ts = f.trainSet || f.trainId;
      if (!ts) continue;
      if (!trainDowntime[ts]) trainDowntime[ts] = { cm: 0, opm: 0 };
      if (f.orderType === "CM") trainDowntime[ts].cm += f.repairDurationMinutes || 0;
      else trainDowntime[ts].opm += f.repairDurationMinutes || 0;
    }

    const scheduledHoursPerTrain = days * HOURS_PER_DAY;
    const byTrain = Array.from(activeTrainSets).sort().map(ts => {
      const dt = trainDowntime[ts] || { cm: 0, opm: 0 };
      const downtimeH = (dt.cm + dt.opm) / 60;
      return {
        trainNumber: ts,
        dtCmHours: parseFloat((dt.cm / 60).toFixed(2)),
        dtOpmHours: parseFloat((dt.opm / 60).toFixed(2)),
        downtimeHours: parseFloat(downtimeH.toFixed(2)),
        availability: parseFloat(
          Math.max(0, 1 - downtimeH / scheduledHoursPerTrain).toFixed(4)
        ),
      };
    });

    // Monthly trend
    const monthlyMap: Record<string, { cm: number; opm: number }> = {};
    for (const f of [...cmCards, ...opmCards]) {
      const month = (f.failureDate || "").substring(0, 7);
      if (!month) continue;
      if (!monthlyMap[month]) monthlyMap[month] = { cm: 0, opm: 0 };
      if (f.orderType === "CM") monthlyMap[month].cm += f.repairDurationMinutes || 0;
      else monthlyMap[month].opm += f.repairDurationMinutes || 0;
    }
    const trend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, dt]) => {
        const dtH = (dt.cm + dt.opm) / 60;
        // Scheduled hours for the month: trains × operating hours/day × days in that month
        const [yr, mo] = period.split("-").map(Number);
        const daysInMonth = yr && mo ? new Date(yr, mo, 0).getDate() : 30;
        const scheduledH = numTrains * HOURS_PER_DAY * daysInMonth;
        return {
          period,
          dtHours: parseFloat(dtH.toFixed(2)),
          availability: parseFloat(Math.max(0, 1 - dtH / scheduledH).toFixed(4)),
        };
      });

    res.json({
      overallAvailability: parseFloat(overallAvailability.toFixed(4)),
      target: AVAILABILITY_TARGET,
      compliance: overallAvailability >= AVAILABILITY_TARGET,
      assessmentDays: days,
      numTrains,
      totalScheduledHours: parseFloat(totalScheduledHours.toFixed(1)),
      dtCmHours: parseFloat((dtCmMinutes / 60).toFixed(2)),
      dtOpmHours: parseFloat((dtOpmMinutes / 60).toFixed(2)),
      totalDowntimeHours: parseFloat(totalDowntimeHours.toFixed(2)),
      byTrain,
      trend,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate availability report" });
  }
});

// ─── PATTERN FAILURES ─────────────────────────────────────────────────────────
// Component-level: group by subsystem_name (equipment/item level) per PRD Section 19.2.6(iv)
// Threshold: ≥3 failures of same item/component OR ≥20% fleet penetration
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
    const activeTrainSets = new Set(
      failures.map(f => f.trainSet).filter(ts => ts && /^TS\d+$/i.test(ts))
    );
    const totalTrains = Math.max(allTrains.length, activeTrainSets.size, TOTAL_FLEET_TRAINS);

    // Group at component/item level using subsystem_name as the component identifier
    // (equipment column is "_" checkbox in BEML CSV, so subsystem is the lowest useful grouping)
    const componentMap: Record<string, {
      itemName: string;
      systemName: string;
      occurrences: number;
      serviceFailures: number;
      trainIds: Set<string>;
      dates: string[];
      jobCardIds: string[];
    }> = {};

    for (const f of failures) {
      // Use subsystem_name as component key; fall back to system_name if no subsystem
      const subsystem = f.subsystemName && f.subsystemName !== "_" ? f.subsystemName : null;
      const itemName = subsystem || f.systemName || "Unknown";
      const key = `${f.systemName}|${itemName}`;

      if (!componentMap[key]) {
        componentMap[key] = {
          itemName,
          systemName: f.systemName || "General",
          occurrences: 0,
          serviceFailures: 0,
          trainIds: new Set(),
          dates: [],
          jobCardIds: [],
        };
      }
      componentMap[key].occurrences++;
      if (isServiceFailure(f)) componentMap[key].serviceFailures++;
      if (f.trainSet) componentMap[key].trainIds.add(f.trainSet);
      componentMap[key].dates.push(f.failureDate);
      componentMap[key].jobCardIds.push(f.jobCardNumber || f.id);
    }

    const patterns = Object.entries(componentMap)
      .filter(([, p]) => p.occurrences >= 3)
      .map(([key, p]) => {
        const trainsAffected = p.trainIds.size;
        const percentageAffected = totalTrains > 0 ? (trainsAffected / totalTrains) * 100 : 0;
        const sortedDates = [...p.dates].sort();

        let patternType = "";
        if (p.occurrences >= 3 && percentageAffected >= 20) patternType = "Rate & Fleet";
        else if (percentageAffected >= 20) patternType = "Fleet Affected (≥20%)";
        else patternType = "Frequent Failure (≥3)";

        return {
          key,
          itemName: p.itemName,
          systemName: p.systemName,
          occurrences: p.occurrences,
          serviceFailures: p.serviceFailures,
          trainsAffected,
          totalTrains,
          percentageAffected: parseFloat(percentageAffected.toFixed(1)),
          patternType,
          firstOccurrence: sortedDates[0] || "",
          lastOccurrence: sortedDates[sortedDates.length - 1] || "",
          jobCardIds: p.jobCardIds.slice(0, 20),
        };
      })
      .sort((a, b) => b.occurrences - a.occurrences);

    res.json({
      windowMonths: months,
      analysisDate: new Date().toISOString().split("T")[0],
      totalPatterns: patterns.length,
      patterns,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate pattern failure report" });
  }
});

// ─── SUMMARY DASHBOARD ───────────────────────────────────────────────────────
router.get("/reports/summary", async (_req, res) => {
  try {
    const [allFailures, allTrains, distances] = await Promise.all([
      db.select().from(failuresTable),
      db.select().from(trainsTable),
      db.select().from(fleetDistancesTable),
    ]);

    const kmResult = await db.execute(sql`
      SELECT COALESCE(SUM(max_km), 0)::float as total
      FROM (
        SELECT train_set, MAX(train_distance_at_failure) as max_km
        FROM failures
        WHERE train_set IS NOT NULL AND train_set ~ '^TS' AND train_distance_at_failure > 0
        GROUP BY train_set
      ) t
    `);
    let totalFleetDistance = Number((kmResult.rows[0] as any)?.total || 0);
    if (totalFleetDistance === 0 && distances.length > 0) {
      const dm: Record<string, number> = {};
      for (const d of distances) {
        if (!dm[d.trainId] || d.cumulativeDistanceKm > dm[d.trainId]) dm[d.trainId] = d.cumulativeDistanceKm;
      }
      totalFleetDistance = Object.values(dm).reduce((s, d) => s + d, 0);
    }

    const serviceFailures = allFailures.filter(isServiceFailure);
    const mdbf = serviceFailures.length > 0 ? Math.round(totalFleetDistance / serviceFailures.length) : 0;

    const withRepair = allFailures.filter(f => f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const mttr = withRepair.length > 0
      ? Math.round(withRepair.reduce((s, f) => s + (f.repairDurationMinutes || 0), 0) / withRepair.length)
      : 0;

    const activeTrainSets = new Set(allFailures.map(f => f.trainSet).filter(ts => ts && /^TS\d+$/i.test(ts)));
    const numTrains = Math.max(allTrains.length, activeTrainSets.size, TOTAL_FLEET_TRAINS);
    const days = 365;
    const totalScheduledHours = numTrains * days * HOURS_PER_DAY;
    const cmDown = allFailures.filter(f => f.orderType === "CM" && f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const opmDown = allFailures.filter(f => (f.orderType === "PM" || f.orderType === "OPM") && f.repairDurationMinutes != null && f.repairDurationMinutes > 0);
    const totalDownMinutes = [...cmDown, ...opmDown].reduce((s, f) => s + (f.repairDurationMinutes || 0), 0);
    const availability = totalScheduledHours > 0 ? Math.max(0, 1 - totalDownMinutes / 60 / totalScheduledHours) : 1;

    const openJobCards = allFailures.filter(f => f.status === "open" || f.status === "in-progress");

    const windowStart = new Date();
    windowStart.setMonth(windowStart.getMonth() - PATTERN_WINDOW_MONTHS);
    const recentFailures = allFailures.filter(f => f.failureDate >= windowStart.toISOString().split("T")[0]);
    const subsystemCounts: Record<string, number> = {};
    for (const f of recentFailures) {
      const key = `${f.systemName}|${f.subsystemName || f.systemName}`;
      if (key) subsystemCounts[key] = (subsystemCounts[key] || 0) + 1;
    }
    const patternFailureCount = Object.values(subsystemCounts).filter(c => c >= 3).length;

    const systemCounts: Record<string, number> = {};
    for (const f of allFailures) {
      const key = f.systemName || "General";
      systemCounts[key] = (systemCounts[key] || 0) + 1;
    }
    const failuresBySystem = Object.entries(systemCounts)
      .map(([systemName, count]) => ({ systemName, count }))
      .sort((a, b) => b.count - a.count).slice(0, 12);

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

// New endpoint for dashboard filtering UI
router.get("/reports/filters", async (_req, res) => {
  try {
    const rawSystems = await db.execute(sql`SELECT DISTINCT system_name FROM failures WHERE system_name IS NOT NULL ORDER BY system_name ASC`);
    const rawTrainSets = await db.execute(sql`SELECT DISTINCT train_set FROM failures WHERE train_set IS NOT NULL ORDER BY train_set ASC`);

    res.json({
      systems: rawSystems.rows.map((r: any) => r.system_name),
      trainSets: rawTrainSets.rows.map((r: any) => r.train_set),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

export default router;
