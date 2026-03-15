import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const toolsTable = pgTable("tools", {
  id: text("id").primaryKey(),
  toolId: text("tool_id").notNull().unique(),
  toolName: text("tool_name").notNull(),
  toolNumber: text("tool_number"),
  category: text("category"),
  location: text("location"),
  condition: text("condition").default("Good"),
  calibrationDue: text("calibration_due"),
  issuedTo: text("issued_to"),
  issuedDate: text("issued_date"),
  qty: integer("qty").default(1),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertToolSchema = createInsertSchema(toolsTable).omit({ createdAt: true, updatedAt: true });
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof toolsTable.$inferSelect;
