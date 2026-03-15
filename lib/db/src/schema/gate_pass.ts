import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gatePassTable = pgTable("gate_passes", {
  id: text("id").primaryKey(),
  gpNumber: text("gp_number").notNull().unique(),
  gpDate: text("gp_date").notNull(),
  gpType: text("gp_type").notNull().default("Out"),
  trainNo: text("train_no"),
  car: text("car"),
  itemDescription: text("item_description").notNull(),
  partNo: text("part_no"),
  srNo: text("sr_no"),
  destination: text("destination"),
  handedOver: text("handed_over"),
  receiver: text("receiver"),
  remarks: text("remarks"),
  reason: text("reason"),
  ncrRef: text("ncr_ref"),
  carNo: text("car_no"),
  status: text("status").notNull().default("OPEN"),
  returnDate: text("return_date"),
  issuedBy: text("issued_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGatePassSchema = createInsertSchema(gatePassTable).omit({ createdAt: true, updatedAt: true });
export type InsertGatePass = z.infer<typeof insertGatePassSchema>;
export type GatePass = typeof gatePassTable.$inferSelect;
