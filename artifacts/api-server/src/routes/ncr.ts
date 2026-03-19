import { Router, type IRouter } from "express";
import { db, ncrTable } from "@workspace/db";
import { eq, sql, desc, like, or } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/ncr", async (req, res) => {
  try {
    const { trainNo, subSystem, status, search, limit, offset } = req.query as Record<string, string>;
    let query = db.select().from(ncrTable);
    const conditions: any[] = [];
    if (trainNo) conditions.push(eq(ncrTable.trainNo, trainNo));
    if (subSystem) conditions.push(eq(ncrTable.subSystem, subSystem));
    if (status) conditions.push(eq(ncrTable.status, status.toUpperCase()));
    if (search) {
      conditions.push(or(
        like(ncrTable.ncrNumber, `%${search}%`),
        like(ncrTable.itemDescription, `%${search}%`),
        like(ncrTable.ncrDescription, `%${search}%`),
        like(ncrTable.faultySlNo, `%${search}%`),
        like(ncrTable.responsibility, `%${search}%`),
      ));
    }
    const records = await db.select().from(ncrTable)
      .where(conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined)
      .orderBy(desc(ncrTable.createdAt))
      .limit(parseInt(limit || "200"))
      .offset(parseInt(offset || "0"));
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
      ncrNumber: body.ncrNumber || `NCR-BEML-RS3R-${Date.now()}`,
      sl: body.sl || null,
      dateOfNcr: body.dateOfNcr || new Date().toISOString().split("T")[0],
      dateOfDetection: body.dateOfDetection || null,
      itemDescription: body.itemDescription || null,
      ncrDescription: body.ncrDescription || null,
      partNumber: body.partNumber || null,
      modifiedOrUnmodifiedFmi: body.modifiedOrUnmodifiedFmi || null,
      failureAfterFmi: body.failureAfterFmi || null,
      faultySlNo: body.faultySlNo || null,
      healthySlNo: body.healthySlNo || null,
      issuedBy: body.issuedBy || null,
      qty: body.qty || null,
      subSystem: body.subSystem || null,
      trainNo: body.trainNo || null,
      car: body.car || null,
      responsibility: body.responsibility || null,
      status: (body.status || "OPEN").toUpperCase(),
      itemRepairedRecouped: body.itemRepairedRecouped || null,
      itemReplaced: body.itemReplaced || null,
      dateOfRepairedReplaced: body.dateOfRepairedReplaced || null,
      source: body.source || null,
      investigationReportDate: body.investigationReportDate || null,
      ncrClosedByDoc: body.ncrClosedByDoc || null,
      gatePassNo: body.gatePassNo || null,
      remarks: body.remarks || null,
      irPrinted: body.irPrinted || null,
      // NCR-870 format fields
      projectName: body.projectName || "KMRCL RS-3R",
      vehicleNo: body.vehicleNo || null,
      productName: body.productName || null,
      assemblyDrawingNo: body.assemblyDrawingNo || null,
      revision: body.revision || null,
      quantity: body.quantity || null,
      supplier: body.supplier || null,
      assemblySerialNo: body.assemblySerialNo || null,
      partSerialNo: body.partSerialNo || null,
      place: body.place || "CPD Depot",
      blNumber: body.blNumber || null,
      storedAt: body.storedAt || "CPD Depot",
      invoiceNo: body.invoiceNo || null,
      severity: body.severity || "Minor",
      responsibleParty: body.responsibleParty || null,
      materialStatus: body.materialStatus || "Installed",
      distributionTo: body.distributionTo || "OEM/ SBU-S&M / R&D/ PM/Purchase/ Quality",
      descriptionOfNonConformity: body.descriptionOfNonConformity || body.ncrDescription || null,
      attachedDocuments: body.attachedDocuments || "Picture attached",
      issuedByTeam: body.issuedByTeam || "BEML (S&M)",
      reviewedApprovedBy: body.reviewedApprovedBy || "Shashi Shekhar Mishra",
      issueDate: body.issueDate || body.dateOfNcr || null,
      causeOfNonConformity: body.causeOfNonConformity || null,
      correctionAction: body.correctionAction || null,
      healthySlNoIn: body.healthySlNoIn || body.healthySlNo || null,
      faultySlNoOut: body.faultySlNoOut || body.faultySlNo || null,
      correctionActionDate: body.correctionActionDate || null,
      correctionActionBy: body.correctionActionBy || null,
      correctionReviewedBy: body.correctionReviewedBy || null,
      decision: body.decision || null,
      repairProcedureRequired: body.repairProcedureRequired || "No",
      verificationOnCorrection: body.verificationOnCorrection || null,
      verificationOnCorrectiveAction: body.verificationOnCorrectiveAction || null,
      approvedByName: body.approvedByName || "Shashi Shekhar Mishra",
      approvedByPosition: body.approvedByPosition || null,
      approvedByEntity: body.approvedByEntity || null,
      linkedJobCardId: body.linkedJobCardId || null,
      linkedJobCardNumber: body.linkedJobCardNumber || null,
    };
    const [created] = await db.insert(ncrTable).values(record as any).returning();
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

// Bulk import from CSV
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
        const ncrNum = row["NCR REPORT NO."] || row["NCR REPORT NO"] || row.ncrNumber || row["NCR No"];
        if (!ncrNum) continue;
        const trainNo = row[" Train No"] || row["Train No"] || row["Train No."] || row.trainNo;
        const car = row["CAR"] || row["Car"] || row.car;
        const rawStatus = (row["STATUS"] || row.status || "OPEN").toUpperCase();
        const status = rawStatus === "CLOSED" ? "CLOSED" : rawStatus === "CANCELED" || rawStatus === "CANCELLED" ? "CANCELED" : "OPEN";
        const record = {
          id: randomUUID(),
          sl: row["SL."] || row["SL"] || row.sl || null,
          ncrNumber: ncrNum,
          dateOfNcr: row["DATE OF NCR "] || row["DATE OF NCR"] || row.dateOfNcr || null,
          dateOfDetection: row["DATE  OF DETECTION"] || row["DATE OF DETECTION"] || row.dateOfDetection || null,
          itemDescription: row["ITEM DESCRIPTION"] || row.itemDescription || null,
          ncrDescription: row["NCR Description"] || row.ncrDescription || null,
          partNumber: row["Part Number"] || row.partNumber || null,
          modifiedOrUnmodifiedFmi: row["Modified or Unmodified\nFMI"] || row.modifiedOrUnmodifiedFmi || null,
          failureAfterFmi: row["Failure After FMI"] || row.failureAfterFmi || null,
          faultySlNo: row["Faulty Sl. No."] || row.faultySlNo || null,
          healthySlNo: row["Healthy Sl. No."] || row.healthySlNo || null,
          issuedBy: row["ISSUED BY"] || row.issuedBy || null,
          qty: row["Qty."] || row.qty || null,
          subSystem: row["SUB-SYSTEM"] || row.subSystem || null,
          trainNo: trainNo || null,
          car: car || null,
          responsibility: row["RESPONSIBILITY (VENDOR/BEML)"] || row.responsibility || null,
          status,
          itemRepairedRecouped: row["ITEM REPAIRED/ RECOUPED"] || row.itemRepairedRecouped || null,
          itemReplaced: row["ITEM REPLACED (IF ANY)"] || row.itemReplaced || null,
          dateOfRepairedReplaced: row["DATE OF REPAIRED/REPLACED"] || row.dateOfRepairedReplaced || null,
          source: row["SOURCE"] || row.source || null,
          investigationReportDate: row["DATE OF INVESTIGATION REPORT RECEIVED"] || row.investigationReportDate || null,
          ncrClosedByDoc: row["NCR CLOSED BY DOC.,"] || row.ncrClosedByDoc || null,
          gatePassNo: row["GATE PASS           S/No"] || row["GATE PASS S/No"] || row.gatePassNo || null,
          remarks: row["Remarks"] || row.remarks || null,
          irPrinted: row["IR Printed"] || row.irPrinted || null,
          vehicleNo: trainNo ? `TS#${String(trainNo).padStart(2, "0")} ${car || ""}`.trim() : null,
          projectName: "KMRCL RS-3R",
        };
        await db.insert(ncrTable).values(record as any)
          .onConflictDoUpdate({
            target: ncrTable.ncrNumber,
            set: {
              sl: sql`EXCLUDED.sl`,
              dateOfNcr: sql`EXCLUDED.date_of_ncr`,
              dateOfDetection: sql`EXCLUDED.date_of_detection`,
              itemDescription: sql`EXCLUDED.item_description`,
              ncrDescription: sql`EXCLUDED.ncr_description`,
              partNumber: sql`EXCLUDED.part_number`,
              modifiedOrUnmodifiedFmi: sql`EXCLUDED.modified_or_unmodified_fmi`,
              failureAfterFmi: sql`EXCLUDED.failure_after_fmi`,
              faultySlNo: sql`EXCLUDED.faulty_sl_no`,
              healthySlNo: sql`EXCLUDED.healthy_sl_no`,
              issuedBy: sql`EXCLUDED.issued_by`,
              qty: sql`EXCLUDED.qty`,
              subSystem: sql`EXCLUDED.sub_system`,
              trainNo: sql`EXCLUDED.train_no`,
              car: sql`EXCLUDED.car`,
              responsibility: sql`EXCLUDED.responsibility`,
              status: sql`EXCLUDED.status`,
              itemRepairedRecouped: sql`EXCLUDED.item_repaired_recouped`,
              itemReplaced: sql`EXCLUDED.item_replaced`,
              dateOfRepairedReplaced: sql`EXCLUDED.date_of_repaired_replaced`,
              source: sql`EXCLUDED.source`,
              investigationReportDate: sql`EXCLUDED.investigation_report_date`,
              ncrClosedByDoc: sql`EXCLUDED.ncr_closed_by_doc`,
              gatePassNo: sql`EXCLUDED.gate_pass_no`,
              remarks: sql`EXCLUDED.remarks`,
              irPrinted: sql`EXCLUDED.ir_printed`,
              vehicleNo: sql`EXCLUDED.vehicle_no`,
              updatedAt: new Date()
            }
          });
        imported++;
      } catch (e: any) {
        errors.push(`${row.ncrNumber || "row"}: ${e.message?.substring(0, 80)}`);
      }
    }
    res.json({ imported, failed: errors.length, errors: errors.slice(0, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to import NCRs" });
  }
});

export default router;
