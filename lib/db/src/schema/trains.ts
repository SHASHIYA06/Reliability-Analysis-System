import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainStatusEnum = pgEnum("train_status", ["active", "withdrawn", "maintenance"]);

export const trainsTable = pgTable("trains", {
  id: text("id").primaryKey(),
  trainNumber: text("train_number").notNull().unique(),
  formation: text("formation").notNull(),
  inServiceDate: text("in_service_date").notNull(),
  status: trainStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrainSchema = createInsertSchema(trainsTable).omit({ createdAt: true });
export type InsertTrain = z.infer<typeof insertTrainSchema>;
export type Train = typeof trainsTable.$inferSelect;
