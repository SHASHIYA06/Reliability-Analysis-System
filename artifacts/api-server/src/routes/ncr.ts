import { Router, type IRouter } from "express";
import { db, ncrTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function generateNcrNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900) + 100;
  return `NCR-BEML-RS3R-${year}${month}-${rand}`;
}

router.get("/ncr", async (_req, res) => {
  try {
    const records = await db.select().from(ncrTable).orderBy(sql`${ncrTable.createdAt} DESC`);
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch NCR records" });
  }
});

router.post("/ncr", async (req, res) => {
  try {
    const body = req.body;
    const record = {
      id: randomUUID(),
      ncrNumber: body.ncrNumber || generateNcrNumber(),
      projectName: body.projectName || "KMRCL RS-3R",
      vehicleNumber: body.vehicleNumber || null,
      productName: body.productName || null,
      assemblyDrawingNumber: body.assemblyDrawingNumber || null,
      quantity: body.quantity || null,
      supplier: body.supplier || null,
      detectionDate: body.detectionDate || null,
      place: body.place || null,
      storedAt: body.storedAt || null,
      severity: body.severity || null,
      responsibleParty: body.responsibleParty || null,
      materialStatus: body.materialStatus || null,
      partNumber: body.partNumber || null,
      partSerialNumber: body.partSerialNumber || null,
      assemblySerialNumber: body.assemblySerialNumber || null,
      blNumber: body.blNumber || null,
      invoiceNumber: body.invoiceNumber || null,
      distributionTo: body.distributionTo || null,
      description: body.description,
      attachedDocuments: body.attachedDocuments || null,
      pictureUrl: body.pictureUrl || null,
      issuedBy: body.issuedBy || null,
      issuedByTeam: body.issuedByTeam || null,
      reviewedApprovedBy: body.reviewedApprovedBy || null,
      issueDate: body.issueDate || new Date().toISOString().split("T")[0],
      causeOfNonConformity: body.causeOfNonConformity || null,
      correctionAction: body.correctionAction || null,
      correctionActionDate: body.correctionActionDate || null,
      correctionActionBy: body.correctionActionBy || null,
      correctionReviewedBy: body.correctionReviewedBy || null,
      decision: body.decision || null,
      repairProcedureRequired: body.repairProcedureRequired || null,
      verificationOnCorrection: body.verificationOnCorrection || null,
      verificationOnCorrectiveAction: body.verificationOnCorrectiveAction || null,
      status: body.status || "open",
      linkedJobCardId: body.linkedJobCardId || null,
      linkedJobCardNumber: body.linkedJobCardNumber || null,
    };
    const [created] = await db.insert(ncrTable).values(record).returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create NCR" });
  }
});

router.get("/ncr/:id", async (req, res) => {
  try {
    const [record] = await db.select().from(ncrTable).where(eq(ncrTable.id, req.params.id));
    if (!record) return res.status(404).json({ error: "NCR not found" });
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch NCR" });
  }
});

router.put("/ncr/:id", async (req, res) => {
  try {
    const body = req.body;
    const [updated] = await db
      .update(ncrTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(ncrTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "NCR not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update NCR" });
  }
});

router.delete("/ncr/:id", async (req, res) => {
  try {
    await db.delete(ncrTable).where(eq(ncrTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete NCR" });
  }
});

export default router;
