import { Router, type IRouter } from "express";
import { db, failuresTable } from "@workspace/db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

let _counter = 1;
function generateJobCardNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `BEML-JC-${year}${month}-${rand}`;
}

function generateFracasNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const n = String(_counter++).padStart(5, "0");
  return `FRACAS-RS3R-${year}${month}-${n}`;
}

function toBoolean(v: any): boolean {
  if (v === null || v === undefined || v === "") return false;
  if (typeof v === "boolean") return v;
  return ["yes", "y", "true", "1"].includes(String(v).toLowerCase().trim());
}

function normDate(v: any): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;
  const dmyS = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
  if (dmyS) return `20${dmyS[3]}-${dmyS[2].padStart(2,"0")}-${dmyS[1].padStart(2,"0")}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
  return s;
}

function normalizeClass(v: any): "relevant" | "non-relevant" | "service-failure" {
  if (!v) return "relevant";
  const s = String(v).toLowerCase().replace(/[-_ ]/g, "");
  if (s.includes("service")) return "service-failure";
  if (s.includes("nonrelevant") || s.includes("notrelevant") || s.includes("irrelevant")) return "non-relevant";
  return "relevant";
}

function normalizeStatus(v: any): "open" | "in-progress" | "closed" {
  if (!v) return "open";
  const s = String(v).toLowerCase();
  if (s.includes("progress") || s.includes("wip")) return "in-progress";
  if (s.includes("clos") || s.includes("done") || s.includes("complet")) return "closed";
  return "open";
}

function mapTrainSet(trainNo: string): string | null {
  if (!trainNo) return null;
  const m = trainNo.match(/MR(\d+)/i);
  if (m) {
    const n = parseInt(m[1]) - 600;
    if (n > 0 && n <= 17) return `TS${String(n).padStart(2, "0")}`;
  }
  // Already TS## format
  if (/^TS\d{2}$/i.test(trainNo.trim())) return trainNo.trim().toUpperCase();
  return trainNo;
}

function buildRecord(body: any, gen = true): Record<string, any> {
  const trainNumber = (body.trainNumber || body.trainId || "").trim();
  const trainSet = body.trainSet || mapTrainSet(trainNumber);
  const failureDate = normDate(body.failureDate) || new Date().toISOString().substring(0, 10);
  const repHours = body.repairDurationHours ? parseFloat(String(body.repairDurationHours)) : null;
  const repMins = body.repairDurationMinutes
    ? parseInt(String(body.repairDurationMinutes))
    : (repHours != null ? Math.round(repHours * 60) : null);

  return {
    id: body.id || randomUUID(),
    jobCardNumber: body.jobCardNumber || (gen ? generateJobCardNumber() : null),
    fracasNumber: body.fracasNumber || (gen ? generateFracasNumber() : null),
    trainId: body.trainId || trainNumber || "UNASSIGNED",
    trainNumber,
    trainSet,
    carNumber: body.carNumber || null,
    depot: body.depot || null,
    reportingLocation: body.reportingLocation || body.location || null,
    orderType: body.orderType || null,
    jobCardIssuedTo: body.jobCardIssuedTo || null,
    reportedBy: body.reportedBy || body.jobCardIssuedTo || null,
    inspector: body.inspector || null,
    organization: body.organization || "BEML",
    issuedDate: normDate(body.issuedDate) || null,
    issuedTime: body.issuedTime || null,
    failureDate,
    failureTime: body.failureTime || null,
    depotArrivalDate: normDate(body.depotArrivalDate) || null,
    depotArrivalTime: body.depotArrivalTime || null,
    expectedCompleteDate: normDate(body.expectedCompleteDate) || null,
    expectedCompleteTime: body.expectedCompleteTime || null,
    closeDate: normDate(body.closeDate) || null,
    closeTime: body.closeTime || null,
    reportDate: normDate(body.reportDate) || failureDate,
    location: body.location || body.reportingLocation || null,
    systemCode: body.systemCode || "GEN",
    systemName: body.systemName || "General",
    subsystemCode: body.subsystemCode || null,
    subsystemName: body.subsystemName || null,
    equipment: body.equipment || null,
    equipmentPartNumber: body.equipmentPartNumber || null,
    component: body.component || null,
    failureDescription: body.failureDescription || "Not specified",
    failureName: body.failureName || null,
    failureLocation: body.failureLocation || null,
    failureClass: normalizeClass(body.failureClass),
    failureCategory: body.failureCategory || null,
    jobOperatingConditions: body.jobOperatingConditions || null,
    effectsOnTrainService: body.effectsOnTrainService || null,
    scenarioCode: body.scenarioCode || null,
    ncrNumber: body.ncrNumber || null,
    serialNumber: body.serialNumber || null,
    workPending: toBoolean(body.workPending),
    canBeEnergized: toBoolean(body.canBeEnergized),
    canBeMoved: toBoolean(body.canBeMoved),
    withdrawalRequired: toBoolean(body.withdrawalRequired),
    withdrawalReason: body.withdrawalReason || null,
    delay: toBoolean(body.delay),
    delayTime: body.delayTime || null,
    serviceDistinction: body.serviceDistinction || null,
    delayDuration: body.delayDuration || null,
    delayMinutes: body.delayMinutes ? parseInt(String(body.delayMinutes)) : null,
    serviceChecks: body.serviceChecks || null,
    carLiftingRequired: toBoolean(body.carLiftingRequired),
    noOfMen: body.noOfMen ? parseInt(String(body.noOfMen)) : null,
    partInSerialNumber: body.partInSerialNumber || null,
    partInDate: normDate(body.partInDate) || null,
    partOutSerialNumber: body.partOutSerialNumber || null,
    partOutDate: normDate(body.partOutDate) || null,
    partReplaced: body.partReplaced || null,
    partNumber: body.partNumber || null,
    replaceChangeInfo: toBoolean(body.replaceChangeInfo),
    serialNumber2: body.serialNumber || null,
    mainLineAction: body.mainLineAction || null,
    inspectionInCharge: body.inspectionInCharge || null,
    sicRequired: toBoolean(body.sicRequired),
    sicVerifier: body.sicVerifier || null,
    powerBlockRequired: toBoolean(body.powerBlockRequired),
    actionTaken: body.actionTaken || null,
    repairStartTime: body.repairStartTime || null,
    repairEndTime: body.repairEndTime || null,
    repairDurationMinutes: repMins,
    repairDurationHours: repHours,
    trainDistanceAtFailure: body.trainDistanceAtFailure ? parseFloat(String(body.trainDistanceAtFailure)) : null,
    rootCause: body.rootCause || null,
    correctiveAction: body.correctiveAction || null,
    actionEndorsementName: body.actionEndorsementName || null,
    actionEndorsementDate: normDate(body.actionEndorsementDate) || null,
    technicianId: body.technicianId || null,
    status: normalizeStatus(body.status),
    notes: body.notes || null,
  };
}

// ─── GET /failures ────────────────────────────────────────────────────────────
router.get("/failures", async (req, res) => {
  try {
    const { trainId, system, failureClass, startDate, endDate, depot, status, trainSet, orderType } = req.query as Record<string, string>;
    const conditions: any[] = [];
    if (trainId) conditions.push(eq(failuresTable.trainId, trainId));
    if (system) conditions.push(eq(failuresTable.systemCode, system));
    if (failureClass) conditions.push(eq(failuresTable.failureClass, failureClass as any));
    if (startDate) conditions.push(gte(failuresTable.failureDate, startDate));
    if (endDate) conditions.push(lte(failuresTable.failureDate, endDate));
    if (status) conditions.push(eq(failuresTable.status, status as any));
    if (depot) conditions.push(eq(failuresTable.depot, depot));
    if (trainSet) conditions.push(eq(failuresTable.trainSet, trainSet));
    if (orderType) conditions.push(eq(failuresTable.orderType, orderType));

    const failures = conditions.length > 0
      ? await db.select().from(failuresTable).where(and(...conditions)).orderBy(desc(failuresTable.failureDate))
      : await db.select().from(failuresTable).orderBy(desc(failuresTable.failureDate));
    res.json(failures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch failures" });
  }
});

// ─── POST /failures ───────────────────────────────────────────────────────────
router.post("/failures", async (req, res) => {
  try {
    const record = buildRecord(req.body, true);
    const [created] = await db.insert(failuresTable).values(record as any).returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create failure report" });
  }
});

// ─── GET /failures/export ─────────────────────────────────────────────────────
router.get("/failures/export", async (_req, res) => {
  try {
    const failures = await db.select().from(failuresTable).orderBy(desc(failuresTable.failureDate));
    res.json({ records: failures, exportedAt: new Date().toISOString(), totalRecords: failures.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export failures" });
  }
});

// ─── GET /failures/stats ──────────────────────────────────────────────────────
router.get("/failures/stats", async (_req, res) => {
  try {
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(failuresTable);
    const [{ totalKm }] = await db.select({ totalKm: sql<number>`sum(train_distance_at_failure)` }).from(failuresTable);
    const [{ repairSum, repairCount }] = await db.select({
      repairSum: sql<number>`sum(repair_duration_minutes)`,
      repairCount: sql<number>`count(*) filter (where repair_duration_minutes > 0)::int`,
    }).from(failuresTable);
    const [{ serviceFailures }] = await db.select({
      serviceFailures: sql<number>`count(*) filter (where failure_class = 'service-failure')::int`,
    }).from(failuresTable);
    const [{ openCards }] = await db.select({
      openCards: sql<number>`count(*) filter (where status = 'open')::int`,
    }).from(failuresTable);
    const bySystem = await db.execute(sql`
      SELECT system_name, system_code, count(*)::int as count
      FROM failures GROUP BY system_name, system_code ORDER BY count DESC LIMIT 15
    `);
    const byTrainSet = await db.execute(sql`
      SELECT train_set, count(*)::int as count
      FROM failures WHERE train_set IS NOT NULL GROUP BY train_set ORDER BY train_set
    `);
    const byMonth = await db.execute(sql`
      SELECT substring(failure_date, 1, 7) as month, count(*)::int as count,
        count(*) filter (where failure_class = 'service-failure')::int as service_failures
      FROM failures WHERE failure_date IS NOT NULL
      GROUP BY month ORDER BY month DESC LIMIT 24
    `);
    res.json({ total, totalKm, repairSum, repairCount, serviceFailures, openCards, bySystem: bySystem.rows, byTrainSet: byTrainSet.rows, byMonth: byMonth.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── POST /failures/import ────────────────────────────────────────────────────
router.post("/failures/import", async (req, res) => {
  try {
    const { records, clearFirst } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "records must be a non-empty array" });
    }
    if (clearFirst) {
      await db.delete(failuresTable);
    }
    let imported = 0;
    const errors: string[] = [];
    for (const raw of records) {
      try {
        const record = buildRecord(raw, true);
        await db.insert(failuresTable).values(record as any)
          .onConflictDoUpdate({
            target: failuresTable.jobCardNumber,
            set: { ...record, id: undefined, updatedAt: new Date() },
          });
        imported++;
      } catch (e: any) {
        errors.push(`${raw.jobCardNumber || "unknown"}: ${e.message}`);
      }
    }
    res.json({ imported, failed: errors.length, errors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to import failures" });
  }
});

// ─── GET /failures/:id ────────────────────────────────────────────────────────
router.get("/failures/:id", async (req, res) => {
  try {
    const [failure] = await db.select().from(failuresTable).where(eq(failuresTable.id, req.params.id));
    if (!failure) return res.status(404).json({ error: "Not found" });
    res.json(failure);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch failure" });
  }
});

// ─── PUT /failures/:id ────────────────────────────────────────────────────────
router.put("/failures/:id", async (req, res) => {
  try {
    const record = buildRecord(req.body, false);
    const [updated] = await db.update(failuresTable)
      .set({ ...record, id: undefined, updatedAt: new Date() } as any)
      .where(eq(failuresTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update" });
  }
});

// ─── DELETE /failures/:id ─────────────────────────────────────────────────────
router.delete("/failures/:id", async (req, res) => {
  try {
    await db.delete(failuresTable).where(eq(failuresTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

// ─── DELETE /failures (bulk clear — admin only) ───────────────────────────────
router.delete("/failures", async (_req, res) => {
  try {
    const { rowCount } = await db.execute(sql`DELETE FROM failures`);
    res.json({ success: true, deleted: rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear all failures" });
  }
});

export default router;
