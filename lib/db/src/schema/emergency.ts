import { pgTable, text, serial, timestamp, integer, real, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const emergencyStatusEnum = pgEnum("emergency_status", ["pending", "accepted", "completed", "cancelled"]);

export const emergencyRequestsTable = pgTable("emergency_requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  workerId: integer("worker_id").references(() => usersTable.id, { onDelete: "set null" }),
  skill: text("skill").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  status: emergencyStatusEnum("status").notNull().default("pending"),
  estimatedArrival: integer("estimated_arrival"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEmergencyRequestSchema = createInsertSchema(emergencyRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmergencyRequest = z.infer<typeof insertEmergencyRequestSchema>;
export type EmergencyRequest = typeof emergencyRequestsTable.$inferSelect;
