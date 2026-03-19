import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const toolsTable = pgTable("tools", {
  id: text("id").primaryKey(),
  toolId: text("tool_id").notNull().unique(), // Maps to Inventory ID or similar
  toolName: text("tool_name").notNull(),
  toolNumber: text("tool_number"), // Renamed/Added to match snippet
  inventoryId: text("inventory_id"),
  category: text("category"),
  location: text("location"),
  condition: text("condition").default("Good"),
  qty: integer("qty").default(1),
  consumable: boolean("consumable").default(false),
  remarks: text("remarks"),
  referenceSpec: text("reference_spec"),
  calibrationDue: text("calibration_due"), // Added to match snippet
  supplier: text("supplier"),
  manufacturer: text("manufacturer"),
  modelNumber: text("model_number"),
  serialNumber: text("serial_number"),
  lastUpdated: text("last_updated"),
  issuedTo: text("issued_to"),
  issuedDate: text("issued_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertToolSchema = createInsertSchema(toolsTable).omit({ createdAt: true, updatedAt: true });
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof toolsTable.$inferSelect;
