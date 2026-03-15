import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryTable = pgTable("inventory_items", {
  id: text("id").primaryKey(),
  partNo: text("part_no").notNull(),
  description: text("description").notNull(),
  system: text("system"),
  category: text("category").default("Spare Part"),
  qty: integer("qty").notNull().default(0),
  minQty: integer("min_qty").notNull().default(1),
  unit: text("unit").default("Nos"),
  location: text("location"),
  vendor: text("vendor"),
  unitCost: real("unit_cost").default(0),
  lastReceived: text("last_received"),
  condition: text("condition").default("New"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ createdAt: true, updatedAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InventoryItem = typeof inventoryTable.$inferSelect;
