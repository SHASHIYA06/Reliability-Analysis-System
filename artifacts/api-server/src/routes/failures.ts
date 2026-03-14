import { Router, type IRouter } from "express";
import { db, failuresTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

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
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `FRACAS-RS3R-${year}${month}-${rand}`;
}

/** Normalize a boolean from various string inputs */
function toBoolean(v: any): boolean {
  if (v === null || v === undefined || v === "") return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v).toLowerCase().trim();
  return ["yes", "y", "true", "1", "✓", "x"].includes(s);
}

/** Convert date strings: DD/MM/YYYY, DD-MM-YYYY → YYYY-MM-DD. Pass through YYYY-MM-DD unchanged. */
function normalizeDate(v: any): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  // DD/MM/YYYY or D/M/YYYY
  const dmySlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmySlash) return `${dmySlash[3]}-${dmySlash[2].padStart(2,"0")}-${dmySlash[1].padStart(2,"0")}`;
  // DD-MM-YYYY
  const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dmyDash) return `${dmyDash[3]}-${dmyDash[2].padStart(2,"0")}-${dmyDash[1].padStart(2,"0")}`;
  // DD.MM.YYYY
  const dmyDot = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dmyDot) return `${dmyDot[3]}-${dmyDot[2].padStart(2,"0")}-${dmyDot[1].padStart(2,"0")}`;
  // Try JS Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
  return s;
}

/** Normalize failure class */
function normalizeClass(v: any): "relevant" | "non-relevant" | "service-failure" {
  if (!v) return "relevant";
  const s = String(v).toLowerCase().replace(/[-_ ]/g, "");
  if (s.includes("service")) return "service-failure";
  if (s.includes("nonrelevant") || s.includes("notrelevant") || s.includes("irrelevant") || s.includes("norelevant")) return "non-relevant";
  return "relevant";
}

/** Normalize status */
function normalizeStatus(v: any): "open" | "in-progress" | "closed" {
  if (!v) return "open";
  const s = String(v).toLowerCase();
  if (s.includes("progress") || s.includes("wip") || s.includes("ongoing")) return "in-progress";
  if (s.includes("clos") || s.includes("done") || s.includes("complet") || s.includes("finish")) return "closed";
  return "open";
}

/** Build a fully-populated failure record from raw body/import data */
function buildRecord(body: any, generateNumbers = true): Record<string, any> {
  const trainNumber = (body.trainNumber || body.trainId || "").trim();
  const trainId = trainNumber || "UNASSIGNED";

  const failureDate = normalizeDate(body.failureDate) || new Date().toISOString().substring(0, 10);

  return {
    id: body.id || randomUUID(),
    jobCardNumber: body.jobCardNumber || (generateNumbers ? generateJobCardNumber() : null),
    fracasNumber: body.fracasNumber || (generateNumbers ? generateFracasNumber() : null),

    trainId: body.trainId || trainId,
    trainNumber: trainNumber,
    trainSet: body.trainSet || null,
    carNumber: body.carNumber || null,

    depot: body.depot || null,
    reportingLocation: body.reportingLocation || body.location || null,
    orderType: body.orderType || null,

    jobCardIssuedTo: body.jobCardIssuedTo || null,
    organization: body.organization || null,
    issuedDate: normalizeDate(body.issuedDate) || null,
    issuedTime: body.issuedTime || null,

    failureDate,
    failureTime: body.failureTime || null,
    depotArrivalDate: normalizeDate(body.depotArrivalDate) || null,
    depotArrivalTime: body.depotArrivalTime || null,
    expectedCompleteDate: normalizeDate(body.expectedCompleteDate) || null,
    expectedCompleteTime: body.expectedCompleteTime || null,

    reportDate: normalizeDate(body.reportDate) || new Date().toISOString().substring(0, 10),

    systemCode: body.systemCode || "GEN",
    systemName: body.systemName || "General",
    subsystemCode: body.subsystemCode || null,
    subsystemName: body.subsystemName || null,
    equipment: body.equipment || null,
    equipmentPartNumber: body.equipmentPartNumber || null,

    failureDescription: body.failureDescription || "Not specified",
    failureClass: normalizeClass(body.failureClass),

    workPending: toBoolean(body.workPending),
    canBeEnergized: toBoolean(body.canBeEnergized),
    canBeMoved: toBoolean(body.canBeMoved),
    withdrawalRequired: toBoolean(body.withdrawalRequired),
    withdrawalReason: body.withdrawalReason || null,
    scenarioCode: body.scenarioCode || null,
    delay: toBoolean(body.delay),
    serviceDistinction: body.serviceDistinction || null,
    delayDuration: body.delayDuration || null,
    delayMinutes: body.delayMinutes ? parseInt(String(body.delayMinutes)) : null,
    serviceChecks: body.serviceChecks || null,

    mainLineAction: body.mainLineAction || null,
    inspectionInCharge: body.inspectionInCharge || null,
    sicRequired: toBoolean(body.sicRequired),
    sicVerifier: body.sicVerifier || null,
    powerBlockRequired: toBoolean(body.powerBlockRequired),

    partReplaced: body.partReplaced || null,
    partNumber: body.partNumber || null,
    partInSerialNumber: body.partInSerialNumber || null,
    partOutSerialNumber: body.partOutSerialNumber || null,

    actionTaken: body.actionTaken || null,
    repairStartTime: body.repairStartTime || null,
    repairEndTime: body.repairEndTime || null,
    repairDurationMinutes: body.repairDurationMinutes ? parseInt(String(body.repairDurationMinutes)) : null,
    trainDistanceAtFailure: body.trainDistanceAtFailure ? parseFloat(String(body.trainDistanceAtFailure)) : null,
    rootCause: body.rootCause || null,
    correctiveAction: body.correctiveAction || null,
    technicianId: body.technicianId || null,

    status: normalizeStatus(body.status),
    notes: body.notes || null,
  };
}

// ─── GET /failures ────────────────────────────────────────────────────────────
router.get("/failures", async (req, res) => {
  try {
    const { trainId, system, failureClass, startDate, endDate, depot, status, trainSet } = req.query as Record<string, string>;
    const conditions: any[] = [];

    if (trainId) conditions.push(eq(failuresTable.trainId, trainId));
    if (system) conditions.push(eq(failuresTable.systemCode, system));
    if (failureClass) conditions.push(eq(failuresTable.failureClass, failureClass as any));
    if (startDate) conditions.push(gte(failuresTable.failureDate, startDate));
    if (endDate) conditions.push(lte(failuresTable.failureDate, endDate));
    if (status) conditions.push(eq(failuresTable.status, status as any));
    if (depot) conditions.push(eq(failuresTable.depot, depot));
    if (trainSet) conditions.push(eq(failuresTable.trainSet, trainSet));

    const failures = conditions.length > 0
      ? await db.select().from(failuresTable).where(and(...conditions)).orderBy(sql`${failuresTable.failureDate} DESC`)
      : await db.select().from(failuresTable).orderBy(sql`${failuresTable.failureDate} DESC`);

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
    const [created] = await db.insert(failuresTable).values(record).returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create failure report" });
  }
});

// ─── GET /failures/export ─────────────────────────────────────────────────────
router.get("/failures/export", async (_req, res) => {
  try {
    const failures = await db.select().from(failuresTable).orderBy(sql`${failuresTable.failureDate} DESC`);
    res.json({
      records: failures,
      exportedAt: new Date().toISOString(),
      totalRecords: failures.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export failures" });
  }
});

// ─── POST /failures/import ────────────────────────────────────────────────────
router.post("/failures/import", async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "records must be a non-empty array" });
    }

    let imported = 0;
    const errors: string[] = [];
    const skipped: string[] = [];

    for (const raw of records) {
      try {
        const record = buildRecord(raw, true);

        // Validate minimum required fields
        if (!record.trainNumber && !record.trainId) {
          skipped.push(`Row: missing train number`);
          continue;
        }
        if (!record.failureDate) {
          skipped.push(`${record.jobCardNumber}: missing failure date`);
          continue;
        }

        await db
          .insert(failuresTable)
          .values(record)
          .onConflictDoUpdate({
            target: failuresTable.jobCardNumber,
            set: {
              trainNumber: record.trainNumber,
              trainSet: record.trainSet,
              carNumber: record.carNumber,
              depot: record.depot,
              orderType: record.orderType,
              jobCardIssuedTo: record.jobCardIssuedTo,
              organization: record.organization,
              issuedDate: record.issuedDate,
              issuedTime: record.issuedTime,
              failureDate: record.failureDate,
              failureTime: record.failureTime,
              depotArrivalDate: record.depotArrivalDate,
              depotArrivalTime: record.depotArrivalTime,
              expectedCompleteDate: record.expectedCompleteDate,
              expectedCompleteTime: record.expectedCompleteTime,
              reportingLocation: record.reportingLocation,
              trainDistanceAtFailure: record.trainDistanceAtFailure,
              systemCode: record.systemCode,
              systemName: record.systemName,
              subsystemCode: record.subsystemCode,
              subsystemName: record.subsystemName,
              equipment: record.equipment,
              failureDescription: record.failureDescription,
              failureClass: record.failureClass,
              workPending: record.workPending,
              canBeEnergized: record.canBeEnergized,
              canBeMoved: record.canBeMoved,
              withdrawalRequired: record.withdrawalRequired,
              withdrawalReason: record.withdrawalReason,
              scenarioCode: record.scenarioCode,
              delay: record.delay,
              serviceDistinction: record.serviceDistinction,
              delayDuration: record.delayDuration,
              delayMinutes: record.delayMinutes,
              serviceChecks: record.serviceChecks,
              mainLineAction: record.mainLineAction,
              inspectionInCharge: record.inspectionInCharge,
              sicRequired: record.sicRequired,
              sicVerifier: record.sicVerifier,
              powerBlockRequired: record.powerBlockRequired,
              partReplaced: record.partReplaced,
              partNumber: record.partNumber,
              partInSerialNumber: record.partInSerialNumber,
              partOutSerialNumber: record.partOutSerialNumber,
              rootCause: record.rootCause,
              actionTaken: record.actionTaken,
              correctiveAction: record.correctiveAction,
              repairDurationMinutes: record.repairDurationMinutes,
              status: record.status,
              notes: record.notes,
              updatedAt: new Date(),
            },
          });
        imported++;
      } catch (e: any) {
        const jcn = raw.jobCardNumber || raw["JC No"] || "unknown";
        errors.push(`${jcn}: ${e.message}`);
        console.error("Import row error:", e.message, raw);
      }
    }

    res.json({ imported, skipped: skipped.length, failed: errors.length, errors, skippedDetails: skipped });
  } catch (err) {
    console.error("Import bulk error:", err);
    res.status(500).json({ error: "Failed to import failures", detail: String(err) });
  }
});

// ─── GET /failures/:id ────────────────────────────────────────────────────────
router.get("/failures/:id", async (req, res) => {
  try {
    const [failure] = await db.select().from(failuresTable).where(eq(failuresTable.id, req.params.id));
    if (!failure) return res.status(404).json({ error: "Failure report not found" });
    res.json(failure);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch failure report" });
  }
});

// ─── PUT /failures/:id ────────────────────────────────────────────────────────
router.put("/failures/:id", async (req, res) => {
  try {
    const record = buildRecord(req.body, false);
    const [updated] = await db
      .update(failuresTable)
      .set({
        ...record,
        id: undefined,         // don't overwrite ID
        updatedAt: new Date(),
      })
      .where(eq(failuresTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Failure report not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update failure report" });
  }
});

// ─── DELETE /failures/:id ─────────────────────────────────────────────────────
router.delete("/failures/:id", async (req, res) => {
  try {
    await db.delete(failuresTable).where(eq(failuresTable.id, req.params.id));
    res.json({ success: true, message: "Failure report deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete failure report" });
  }
});

export default router;
