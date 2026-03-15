import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ncrTable = pgTable("ncr_reports", {
  id: text("id").primaryKey(),

  // === Master List CSV Columns (exact NCRs_master_list column mapping) ===
  sl: text("sl"),
  ncrNumber: text("ncr_number").unique().notNull(),
  dateOfNcr: text("date_of_ncr"),
  dateOfDetection: text("date_of_detection"),
  itemDescription: text("item_description"),
  ncrDescription: text("ncr_description"),
  partNumber: text("part_number"),
  modifiedOrUnmodifiedFmi: text("modified_or_unmodified_fmi"),
  failureAfterFmi: text("failure_after_fmi"),
  faultySlNo: text("faulty_sl_no"),
  healthySlNo: text("healthy_sl_no"),
  issuedBy: text("issued_by"),
  qty: text("qty"),
  subSystem: text("sub_system"),
  trainNo: text("train_no"),
  car: text("car"),
  responsibility: text("responsibility"),
  status: text("status").notNull().default("OPEN"),
  itemRepairedRecouped: text("item_repaired_recouped"),
  itemReplaced: text("item_replaced"),
  dateOfRepairedReplaced: text("date_of_repaired_replaced"),
  source: text("source"),
  investigationReportDate: text("investigation_report_date"),
  ncrClosedByDoc: text("ncr_closed_by_doc"),
  gatePassNo: text("gate_pass_no"),
  remarks: text("remarks"),
  irPrinted: text("ir_printed"),

  // === NCR-870 Format Fields (for formatted A4 print view) ===
  projectName: text("project_name").default("KMRCL RS-3R"),
  vehicleNo: text("vehicle_no"),
  productName: text("product_name"),
  assemblyDrawingNo: text("assembly_drawing_no"),
  revision: text("revision"),
  quantity: text("quantity"),
  supplier: text("supplier"),
  assemblySerialNo: text("assembly_serial_no"),
  partSerialNo: text("part_serial_no"),
  place: text("place").default("CPD Depot"),
  blNumber: text("bl_number"),
  storedAt: text("stored_at").default("CPD Depot"),
  invoiceNo: text("invoice_no"),
  severity: text("severity").default("Minor"),
  responsibleParty: text("responsible_party"),
  materialStatus: text("material_status").default("Installed"),
  distributionTo: text("distribution_to").default("OEM/ SBU-S&M / R&D/ PM/Purchase/ Quality"),
  descriptionOfNonConformity: text("description_of_non_conformity"),
  attachedDocuments: text("attached_documents").default("Picture attached"),
  issuedByTeam: text("issued_by_team").default("BEML (S&M)"),
  reviewedApprovedBy: text("reviewed_approved_by").default("Shashi Shekhar Mishra"),
  issueDate: text("issue_date"),
  causeOfNonConformity: text("cause_of_non_conformity"),
  correctionAction: text("correction_action"),
  healthySlNoIn: text("healthy_sl_no_in"),
  faultySlNoOut: text("faulty_sl_no_out"),
  correctionActionDate: text("correction_action_date"),
  correctionActionBy: text("correction_action_by"),
  correctionReviewedBy: text("correction_reviewed_by"),
  decision: text("decision"),
  repairProcedureRequired: text("repair_procedure_required").default("No"),
  verificationOnCorrection: text("verification_on_correction"),
  verificationOnCorrectiveAction: text("verification_on_corrective_action"),
  approvedByName: text("approved_by_name").default("Shashi Shekhar Mishra"),
  approvedByPosition: text("approved_by_position"),
  approvedByEntity: text("approved_by_entity"),

  // Linking to Job Cards
  linkedJobCardId: text("linked_job_card_id"),
  linkedJobCardNumber: text("linked_job_card_number"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNcrSchema = createInsertSchema(ncrTable).omit({ createdAt: true, updatedAt: true });
export type InsertNcr = z.infer<typeof insertNcrSchema>;
export type Ncr = typeof ncrTable.$inferSelect;
