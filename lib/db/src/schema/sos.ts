import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const sosEventsTable = pgTable("sos_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  latitude: text("latitude"),
  longitude: text("longitude"),
  locationAddress: text("location_address"),
  emergencyContact: text("emergency_contact"),
  message: text("message"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSosEventSchema = createInsertSchema(sosEventsTable).omit({ id: true, createdAt: true });
export type InsertSosEvent = z.infer<typeof insertSosEventSchema>;
export type SosEvent = typeof sosEventsTable.$inferSelect;
