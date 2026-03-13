import { pgTable, text, timestamp, integer, real, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const failureClassEnum = pgEnum("failure_class", ["relevant", "non-relevant", "service-failure"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "in-progress", "closed"]);

export const failuresTable = pgTable("failures", {
  id: text("id").primaryKey(),
  jobCardNumber: text("job_card_number").unique(),
  trainId: text("train_id").notNull(),
  trainNumber: text("train_number").notNull(),
  reportDate: text("report_date").notNull(),
  failureDate: text("failure_date").notNull(),
  failureTime: text("failure_time"),
  location: text("location"),
  systemCode: text("system_code").notNull(),
  systemName: text("system_name").notNull(),
  subsystemCode: text("subsystem_code"),
  subsystemName: text("subsystem_name"),
  scenarioCode: text("scenario_code"),
  failureDescription: text("failure_description").notNull(),
  failureClass: failureClassEnum("failure_class").notNull(),
  withdrawalRequired: boolean("withdrawal_required").notNull().default(false),
  withdrawalReason: text("withdrawal_reason"),
  actionTaken: text("action_taken"),
  repairStartTime: text("repair_start_time"),
  repairEndTime: text("repair_end_time"),
  repairDurationMinutes: integer("repair_duration_minutes"),
  trainDistanceAtFailure: real("train_distance_at_failure"),
  rootCause: text("root_cause"),
  correctiveAction: text("corrective_action"),
  partReplaced: text("part_replaced"),
  partNumber: text("part_number"),
  technicianId: text("technician_id"),
  status: jobStatusEnum("status").notNull().default("open"),
  delayMinutes: integer("delay_minutes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFailureSchema = createInsertSchema(failuresTable).omit({ createdAt: true, updatedAt: true });
export type InsertFailure = z.infer<typeof insertFailureSchema>;
export type Failure = typeof failuresTable.$inferSelect;
