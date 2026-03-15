import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rsoiTable = pgTable("rsoi_records", {
  id: text("id").primaryKey(),
  rsoiNumber: text("rsoi_number").notNull(),
  failureDetectedJobCard: text("failure_detected_job_card"),
  depot: text("depot").notNull().default("MNSD"),
  status: text("status").notNull().default("OPEN"),
  startDatetime: text("start_datetime"),
  pdc: text("pdc"),
  completedDatetime: text("completed_datetime"),
  investigationReportReceived: boolean("investigation_report_received").default(false),
  investigationReportReceivedDate: text("investigation_report_received_date"),
  actionToBeTaken: text("action_to_be_taken"),
  oAndMSent: boolean("o_and_m_sent").default(false),
  oAndMSentDate: text("o_and_m_sent_date"),
  typeOfRsoi: text("type_of_rsoi").notNull().default("ELEC"),
  refRs3Fmi: text("ref_rs3_fmi"),
  refRs3HecpSecp: text("ref_rs3_hecp_secp"),
  remarksByDmrcJmrc: text("remarks_by_dmrc_jmrc"),
  system: text("system"),
  subSystem: text("sub_system"),
  equipment: text("equipment"),
  component: text("component"),
  part: text("part"),
  comments: text("comments"),
  jobCardsJson: text("job_cards_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRsoiSchema = createInsertSchema(rsoiTable).omit({ createdAt: true, updatedAt: true });
export type InsertRsoi = z.infer<typeof insertRsoiSchema>;
export type Rsoi = typeof rsoiTable.$inferSelect;
