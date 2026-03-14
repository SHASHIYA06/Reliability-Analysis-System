import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ncrSeverityEnum = pgEnum("ncr_severity", ["major", "minor"]);
export const ncrDecisionEnum = pgEnum("ncr_decision", ["claim", "holding", "use-as-is", "rework", "waiver", "scrap", "repair"]);
export const ncrStatusEnum = pgEnum("ncr_status", ["open", "under-investigation", "corrective-action", "closed", "rejected"]);

export const ncrTable = pgTable("ncr", {
  id: text("id").primaryKey(),
  ncrNumber: text("ncr_number").unique().notNull(),
  projectName: text("project_name"),
  vehicleNumber: text("vehicle_number"),
  productName: text("product_name"),
  assemblyDrawingNumber: text("assembly_drawing_number"),
  quantity: text("quantity"),
  supplier: text("supplier"),
  detectionDate: text("detection_date"),
  place: text("place"),
  storedAt: text("stored_at"),
  severity: ncrSeverityEnum("severity"),
  responsibleParty: text("responsible_party"),
  materialStatus: text("material_status"),
  partNumber: text("part_number"),
  partSerialNumber: text("part_serial_number"),
  assemblySerialNumber: text("assembly_serial_number"),
  blNumber: text("bl_number"),
  invoiceNumber: text("invoice_number"),
  distributionTo: text("distribution_to"),
  description: text("description").notNull(),
  attachedDocuments: text("attached_documents"),
  pictureUrl: text("picture_url"),
  issuedBy: text("issued_by"),
  issuedByTeam: text("issued_by_team"),
  reviewedApprovedBy: text("reviewed_approved_by"),
  issueDate: text("issue_date"),
  causeOfNonConformity: text("cause_of_non_conformity"),
  correctionAction: text("correction_action"),
  correctionActionDate: text("correction_action_date"),
  correctionActionBy: text("correction_action_by"),
  correctionReviewedBy: text("correction_reviewed_by"),
  decision: ncrDecisionEnum("decision"),
  repairProcedureRequired: text("repair_procedure_required"),
  verificationOnCorrection: text("verification_on_correction"),
  verificationOnCorrectiveAction: text("verification_on_corrective_action"),
  status: ncrStatusEnum("status").notNull().default("open"),
  linkedJobCardId: text("linked_job_card_id"),
  linkedJobCardNumber: text("linked_job_card_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNcrSchema = createInsertSchema(ncrTable).omit({ createdAt: true, updatedAt: true });
export type InsertNcr = z.infer<typeof insertNcrSchema>;
export type Ncr = typeof ncrTable.$inferSelect;
