import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eirTable = pgTable("eir_records", {
  id: text("id").primaryKey(),
  eirNumber: text("eir_number").notNull(),
  applicableTo: text("applicable_to").notNull().default("RS3R"),
  depot: text("depot").notNull().default("MNSD"),
  status: text("status").notNull().default("OPEN"),
  issueRevisionNo: text("issue_revision_no").default("0"),
  trainSet: text("train_set"),
  otherTrains: text("other_trains"),
  car: text("car"),
  otherCars: text("other_cars"),
  carEquipment: text("car_equipment"),
  closingJobCard: text("closing_job_card"),
  jobCardClosingDate: text("job_card_closing_date"),
  eventTime: text("event_time"),
  temperature: text("temperature"),
  location: text("location"),
  incidentDate: text("incident_date"),
  incidentDetails: text("incident_details"),
  reportedDate: text("reported_date"),
  actionAtDepot: text("action_at_depot"),
  actionAtMainLine: text("action_at_main_line"),
  furtherAction: text("further_action"),
  distributionJson: text("distribution_json"),
  system: text("system"),
  subSystem: text("sub_system"),
  equipment: text("equipment"),
  component: text("component"),
  part: text("part"),
  others: text("others"),
  repercussion: text("repercussion"),
  history: text("history"),
  investigationCause: text("investigation_cause"),
  concern: text("concern"),
  conclusion: text("conclusion"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEirSchema = createInsertSchema(eirTable).omit({ createdAt: true, updatedAt: true });
export type InsertEir = z.infer<typeof insertEirSchema>;
export type Eir = typeof eirTable.$inferSelect;
