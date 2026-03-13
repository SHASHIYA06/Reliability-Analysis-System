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
  return `JC-${year}${month}-${rand}`;
}

router.get("/failures", async (req, res) => {
  try {
    const { trainId, system, failureClass, startDate, endDate } = req.query as Record<string, string>;
    const conditions = [];

    if (trainId) conditions.push(eq(failuresTable.trainId, trainId));
    if (system) conditions.push(eq(failuresTable.systemCode, system));
    if (failureClass) conditions.push(eq(failuresTable.failureClass, failureClass as any));
    if (startDate) conditions.push(gte(failuresTable.failureDate, startDate));
    if (endDate) conditions.push(lte(failuresTable.failureDate, endDate));

    const failures = conditions.length > 0
      ? await db.select().from(failuresTable).where(and(...conditions)).orderBy(sql`${failuresTable.failureDate} DESC`)
      : await db.select().from(failuresTable).orderBy(sql`${failuresTable.failureDate} DESC`);

    res.json(failures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch failures" });
  }
});

router.post("/failures", async (req, res) => {
  try {
    const body = req.body;
    const failure = {
      id: randomUUID(),
      jobCardNumber: body.jobCardNumber || generateJobCardNumber(),
      trainId: body.trainId,
      trainNumber: body.trainNumber,
      reportDate: body.reportDate,
      failureDate: body.failureDate,
      failureTime: body.failureTime || null,
      location: body.location || null,
      systemCode: body.systemCode,
      systemName: body.systemName,
      subsystemCode: body.subsystemCode || null,
      subsystemName: body.subsystemName || null,
      scenarioCode: body.scenarioCode || null,
      failureDescription: body.failureDescription,
      failureClass: body.failureClass,
      withdrawalRequired: body.withdrawalRequired ?? false,
      withdrawalReason: body.withdrawalReason || null,
      actionTaken: body.actionTaken || null,
      repairStartTime: body.repairStartTime || null,
      repairEndTime: body.repairEndTime || null,
      repairDurationMinutes: body.repairDurationMinutes || null,
      trainDistanceAtFailure: body.trainDistanceAtFailure || null,
      rootCause: body.rootCause || null,
      correctiveAction: body.correctiveAction || null,
      partReplaced: body.partReplaced || null,
      partNumber: body.partNumber || null,
      technicianId: body.technicianId || null,
      status: body.status || "open",
      delayMinutes: body.delayMinutes || null,
      notes: body.notes || null,
    };
    const [created] = await db.insert(failuresTable).values(failure).returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create failure report" });
  }
});

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

router.post("/failures/import", async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: "records must be an array" });
    }
    let imported = 0;
    const errors: string[] = [];
    for (const record of records) {
      try {
        const failure = {
          id: record.id || randomUUID(),
          jobCardNumber: record.jobCardNumber || generateJobCardNumber(),
          trainId: record.trainId,
          trainNumber: record.trainNumber,
          reportDate: record.reportDate || new Date().toISOString().split("T")[0],
          failureDate: record.failureDate,
          failureTime: record.failureTime || null,
          location: record.location || null,
          systemCode: record.systemCode,
          systemName: record.systemName,
          subsystemCode: record.subsystemCode || null,
          subsystemName: record.subsystemName || null,
          scenarioCode: record.scenarioCode || null,
          failureDescription: record.failureDescription,
          failureClass: record.failureClass || "relevant",
          withdrawalRequired: record.withdrawalRequired ?? false,
          withdrawalReason: record.withdrawalReason || null,
          actionTaken: record.actionTaken || null,
          repairStartTime: record.repairStartTime || null,
          repairEndTime: record.repairEndTime || null,
          repairDurationMinutes: record.repairDurationMinutes || null,
          trainDistanceAtFailure: record.trainDistanceAtFailure || null,
          rootCause: record.rootCause || null,
          correctiveAction: record.correctiveAction || null,
          partReplaced: record.partReplaced || null,
          partNumber: record.partNumber || null,
          technicianId: record.technicianId || null,
          status: record.status || "open",
          delayMinutes: record.delayMinutes || null,
          notes: record.notes || null,
        };
        await db.insert(failuresTable).values(failure).onConflictDoNothing();
        imported++;
      } catch (e) {
        errors.push(`Record ${record.jobCardNumber || "unknown"}: ${(e as Error).message}`);
      }
    }
    res.json({ imported, failed: errors.length, errors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to import failures" });
  }
});

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

router.put("/failures/:id", async (req, res) => {
  try {
    const body = req.body;
    const [updated] = await db
      .update(failuresTable)
      .set({
        failureDate: body.failureDate,
        failureTime: body.failureTime,
        location: body.location,
        systemCode: body.systemCode,
        systemName: body.systemName,
        subsystemCode: body.subsystemCode,
        subsystemName: body.subsystemName,
        scenarioCode: body.scenarioCode,
        failureDescription: body.failureDescription,
        failureClass: body.failureClass,
        withdrawalRequired: body.withdrawalRequired,
        withdrawalReason: body.withdrawalReason,
        actionTaken: body.actionTaken,
        repairStartTime: body.repairStartTime,
        repairEndTime: body.repairEndTime,
        repairDurationMinutes: body.repairDurationMinutes,
        trainDistanceAtFailure: body.trainDistanceAtFailure,
        rootCause: body.rootCause,
        correctiveAction: body.correctiveAction,
        partReplaced: body.partReplaced,
        partNumber: body.partNumber,
        technicianId: body.technicianId,
        status: body.status,
        delayMinutes: body.delayMinutes,
        notes: body.notes,
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
