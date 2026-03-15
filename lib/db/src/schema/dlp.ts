import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dlpTable = pgTable("dlp_items", {
  id: text("id").primaryKey(),
  itemDescription: text("item_description").notNull(),
  partNumber: text("part_number"),
  system: text("system"),
  subsystem: text("subsystem"),
  trainNo: text("train_no").default("ALL"),
  qty: integer("qty").notNull().default(0),
  dlpExpiry: text("dlp_expiry").notNull(),
  vendor: text("vendor"),
  status: text("status").default("Active"),
  ncrCount: integer("ncr_count").default(0),
  replacementDue: text("replacement_due"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDlpSchema = createInsertSchema(dlpTable).omit({ createdAt: true, updatedAt: true });
export type InsertDlp = z.infer<typeof insertDlpSchema>;
export type DlpItem = typeof dlpTable.$inferSelect;
