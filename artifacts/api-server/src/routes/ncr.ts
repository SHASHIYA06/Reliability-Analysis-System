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

router.post("/ncr/import", async (req, res) => {
  try {
    const { records, clearFirst } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "records must be a non-empty array" });
    }
    if (clearFirst) await db.delete(ncrTable);
    let imported = 0;
    const errors: string[] = [];
    for (const row of records) {
      try {
        const record = {
          id: randomUUID(),
          ncrNumber: row.ncrNumber || row["NCR Number"] || row["NCR No"] || generateNcrNumber(),
          projectName: row.projectName || row["Project"] || "KMRCL RS-3R",
          vehicleNumber: row.vehicleNumber || row["Vehicle Number"] || row["Vehicle No"] || null,
          productName: row.productName || row["Product"] || row["Component"] || null,
          supplier: row.supplier || row["Supplier"] || row["OEM"] || null,
          detectionDate: row.detectionDate || row["Detection Date"] || row["Date"] || null,
          place: row.place || row["Place"] || null,
          severity: (row.severity || row["Severity"] || "minor").toLowerCase(),
          responsibleParty: row.responsibleParty || row["Responsible Party"] || null,
          description: row.description || row["Description"] || row["Non-Conformance Description"] || "Imported NCR",
          issuedBy: row.issuedBy || row["Issued By"] || null,
          issueDate: row.issueDate || row["Issue Date"] || row.detectionDate || null,
          decision: row.decision || row["Decision"] || null,
          status: (row.status || row["Status"] || "open").toLowerCase(),
          linkedJobCardNumber: row.linkedJobCardNumber || row["Job Card No"] || row["JC No"] || null,
        };
        await db.insert(ncrTable).values(record as any);
        imported++;
      } catch (e: any) {
        errors.push(`${row.ncrNumber || "row"}: ${e.message}`);
      }
    }
    res.json({ imported, failed: errors.length, errors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to import NCRs" });
  }
});

export default router;
