import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const inventoryTable = pgTable("inventory_items", {
  id: text("id").primaryKey(),
  partNo: text("part_no").notNull(),
  description: text("description").notNull(),
  system: text("system"), // traction, brake, etc
  category: text("category").default("Spare Part"), // Spare, Consumable, LRU
  qty: integer("qty").notNull().default(0),
  reservedQty: integer("reserved_qty").notNull().default(0), // For pending NCR/Job Cards
  minQty: integer("min_qty").notNull().default(1), // Reorder level
  recommendedQty: integer("recommended_qty").notNull().default(5),
  unit: text("unit").default("Nos"),
  location: text("location").default("Central Store"),
  vendor: text("vendor"),
  unitCost: real("unit_cost").default(0),
  isCritical: integer("is_critical").default(0), // 0 or 1
  expiryDate: text("expiry_date"),
  condition: text("condition").default("New"),
  lastReceived: text("last_received"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inventoryTransactionsTable = pgTable("inventory_transactions", {
  id: text("id").primaryKey(),
  itemId: text("item_id").notNull(),
  partNo: text("part_no").notNull(),
  type: text("type").notNull(), // Receipt, Issue, Return, Transfer, Adjustment
  qty: integer("qty").notNull(),
  qtyBefore: integer("qty_before"),
  qtyAfter: integer("qty_after"),
  fromLocation: text("from_location"),
  toLocation: text("to_location"),
  referenceId: text("reference_id"), // NCR, Job Card, PO
  referenceType: text("reference_type"),
  initiatedBy: text("initiated_by"),
  remarks: text("remarks"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ createdAt: true, updatedAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InventoryItem = typeof inventoryTable.$inferSelect;

export const insertInventoryTxnSchema = createInsertSchema(inventoryTransactionsTable);
export type InventoryTransaction = typeof inventoryTransactionsTable.$inferSelect;
