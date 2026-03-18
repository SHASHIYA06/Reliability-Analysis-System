import { pgTable, text, timestamp, integer, real, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const failureClassEnum = pgEnum("failure_class", ["relevant", "non-relevant", "service-failure"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "in-progress", "closed"]);

export const failuresTable = pgTable("failures", {
  id: text("id").primaryKey(),
  jobCardNumber: text("job_card_number").unique(),
  fracasNumber: text("fracas_number"),

  // Train identification
  trainId: text("train_id").notNull(),
  trainNumber: text("train_number").notNull(),
  trainSet: text("train_set"),
  carNumber: text("car_number"),

  // Location & admin
  depot: text("depot"),
  reportingLocation: text("reporting_location"),
  orderType: text("order_type"),

  // Personnel
  jobCardIssuedTo: text("job_card_issued_to"),
  reportedBy: text("reported_by"),
  inspector: text("inspector"),
  organization: text("organization"),

  // Dates & times
  issuedDate: text("issued_date"),
  issuedTime: text("issued_time"),
  failureDate: text("failure_date").notNull(),
  failureTime: text("failure_time"),
  depotArrivalDate: text("depot_arrival_date"),
  depotArrivalTime: text("depot_arrival_time"),
  expectedCompleteDate: text("expected_complete_date"),
  expectedCompleteTime: text("expected_complete_time"),
  closeDate: text("close_date"),
  closeTime: text("close_time"),
  reportDate: text("report_date").notNull(),
  location: text("location"),

  // System taxonomy
  systemCode: text("system_code").notNull(),
  systemName: text("system_name").notNull(),
  subsystemCode: text("subsystem_code"),
  subsystemName: text("subsystem_name"),
  equipment: text("equipment"),
  equipmentPartNumber: text("equipment_part_number"),
  component: text("component"),

  // Failure details
  failureDescription: text("failure_description").notNull(),
  failureName: text("failure_name"),
  failureLocation: text("failure_location"),
  failureClass: failureClassEnum("failure_class").notNull(),
  failureCategory: text("failure_category"),
  jobOperatingConditions: text("job_operating_conditions"),
  effectsOnTrainService: text("effects_on_train_service"),
  scenarioCode: text("scenario_code"),
  ncrNumber: text("ncr_number"),

  // Work conditions
  workPending: boolean("work_pending").default(false),
  canBeEnergized: boolean("can_be_energized").default(false),
  canBeMoved: boolean("can_be_moved").default(false),
  withdrawalRequired: boolean("withdrawal_required").notNull().default(false),
  withdrawalReason: text("withdrawal_reason"),
  delay: boolean("delay").default(false),
  delayTime: text("delay_time"),
  serviceDistinction: text("service_distinction"),
  delayDuration: text("delay_duration"),
  delayMinutes: integer("delay_minutes"),
  serviceChecks: text("service_checks"),
  carLiftingRequired: boolean("car_lifting_required").default(false),
  noOfMen: integer("no_of_men"),

  // Parts replacement
  partInSerialNumber: text("part_in_serial_number"),
  partInDate: text("part_in_date"),
  partOutSerialNumber: text("part_out_serial_number"),
  partOutDate: text("part_out_date"),
  partReplaced: text("part_replaced"),
  partNumber: text("part_number"),
  serialNumber: text("serial_number"),
  replaceChangeInfo: boolean("replace_change_info").default(false),

  // Permissions
  mainLineAction: text("main_line_action"),
  inspectionInCharge: text("inspection_in_charge"),
  sicRequired: boolean("sic_required").default(false),
  sicVerifier: text("sic_verifier"),
  powerBlockRequired: boolean("power_block_required").default(false),

  // Resolution
  actionTaken: text("action_taken"),
  repairStartTime: text("repair_start_time"),
  repairEndTime: text("repair_end_time"),
  repairDurationMinutes: integer("repair_duration_minutes"),
  repairDurationHours: real("repair_duration_hours"),
  trainDistanceAtFailure: real("train_distance_at_failure"),
  rootCause: text("root_cause"),
  correctiveAction: text("corrective_action"),
  actionEndorsementName: text("action_endorsement_name"),
  actionEndorsementDate: text("action_endorsement_date"),
  technicianId: text("technician_id"),

  status: jobStatusEnum("status").notNull().default("open"),
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFailureSchema = createInsertSchema(failuresTable).omit({ createdAt: true, updatedAt: true });
export type InsertFailure = z.infer<typeof insertFailureSchema>;
export type Failure = typeof failuresTable.$inferSelect;
