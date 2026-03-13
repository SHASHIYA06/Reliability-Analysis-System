import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fleetDistancesTable = pgTable("fleet_distances", {
  id: text("id").primaryKey(),
  trainId: text("train_id").notNull(),
  trainNumber: text("train_number").notNull(),
  recordDate: text("record_date").notNull(),
  cumulativeDistanceKm: real("cumulative_distance_km").notNull(),
  dailyDistanceKm: real("daily_distance_km"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFleetDistanceSchema = createInsertSchema(fleetDistancesTable).omit({ createdAt: true });
export type InsertFleetDistance = z.infer<typeof insertFleetDistanceSchema>;
export type FleetDistance = typeof fleetDistancesTable.$inferSelect;
