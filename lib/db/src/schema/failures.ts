import { pgTable, text, timestamp, integer, real, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const failureClassEnum = pgEnum("failure_class", ["relevant", "non-relevant", "service-failure"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "in-progress", "closed"]);

export const failuresTable = pgTable("failures", {
  id: text("id").primaryKey(),
  jobCardNumber: text("job_card_number").unique(),
  fracasNumber: text("fracas_number"),

  trainId: text("train_id").notNull(),
  trainNumber: text("train_number").notNull(),
  trainSet: text("train_set"),
  carNumber: text("car_number"),

  depot: text("depot"),
  reportingLocation: text("reporting_location"),
  orderType: text("order_type"),

  jobCardIssuedTo: text("job_card_issued_to"),
  organization: text("organization"),
  issuedDate: text("issued_date"),
  issuedTime: text("issued_time"),

  failureDate: text("failure_date").notNull(),
  failureTime: text("failure_time"),
  depotArrivalDate: text("depot_arrival_date"),
  depotArrivalTime: text("depot_arrival_time"),
  expectedCompleteDate: text("expected_complete_date"),
  expectedCompleteTime: text("expected_complete_time"),

  reportDate: text("report_date").notNull(),
  location: text("location"),

  systemCode: text("system_code").notNull(),
  systemName: text("system_name").notNull(),
  subsystemCode: text("subsystem_code"),
  subsystemName: text("subsystem_name"),
  equipment: text("equipment"),
  equipmentPartNumber: text("equipment_part_number"),

  failureDescription: text("failure_description").notNull(),
  failureClass: failureClassEnum("failure_class").notNull(),
  scenarioCode: text("scenario_code"),

  workPending: boolean("work_pending").default(false),
  canBeEnergized: boolean("can_be_energized").default(false),
  canBeMoved: boolean("can_be_moved").default(false),
  withdrawalRequired: boolean("withdrawal_required").notNull().default(false),
  withdrawalReason: text("withdrawal_reason"),
  delay: boolean("delay").default(false),
  serviceDistinction: text("service_distinction"),
  delayDuration: text("delay_duration"),
  delayMinutes: integer("delay_minutes"),

  serviceChecks: text("service_checks"),

  partInSerialNumber: text("part_in_serial_number"),
  partOutSerialNumber: text("part_out_serial_number"),
  partReplaced: text("part_replaced"),
  partNumber: text("part_number"),

  mainLineAction: text("main_line_action"),
  inspectionInCharge: text("inspection_in_charge"),
  sicRequired: boolean("sic_required").default(false),
  sicVerifier: text("sic_verifier"),
  powerBlockRequired: boolean("power_block_required").default(false),

  actionTaken: text("action_taken"),
  repairStartTime: text("repair_start_time"),
  repairEndTime: text("repair_end_time"),
  repairDurationMinutes: integer("repair_duration_minutes"),
  trainDistanceAtFailure: real("train_distance_at_failure"),
  rootCause: text("root_cause"),
  correctiveAction: text("corrective_action"),
  technicianId: text("technician_id"),
  status: jobStatusEnum("status").notNull().default("open"),
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFailureSchema = createInsertSchema(failuresTable).omit({ createdAt: true, updatedAt: true });
export type InsertFailure = z.infer<typeof insertFailureSchema>;
export type Failure = typeof failuresTable.$inferSelect;
