import { pgTable, text, serial, timestamp, integer, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workerProfilesTable } from "./workers";

export const availabilityStatusEnum = pgEnum("availability_status", ["available", "busy", "holiday"]);

export const workerAvailabilityTable = pgTable("worker_availability", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull().references(() => workerProfilesTable.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: availabilityStatusEnum("status").notNull().default("available"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkerAvailabilitySchema = createInsertSchema(workerAvailabilityTable).omit({ id: true, createdAt: true });
export type InsertWorkerAvailability = z.infer<typeof insertWorkerAvailabilitySchema>;
export type WorkerAvailability = typeof workerAvailabilityTable.$inferSelect;
