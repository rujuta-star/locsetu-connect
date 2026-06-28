import { pgTable, text, serial, timestamp, boolean, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const verificationStatusEnum = pgEnum("verification_status", ["none", "pending", "approved", "rejected"]);

export const workerProfilesTable = pgTable("worker_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  skills: text("skills").array().notNull().default([]),
  location: text("location").notNull().default(""),
  isAvailable: boolean("is_available").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("none"),
  experience: text("experience"),
  about: text("about"),
  languages: text("languages").array().notNull().default([]),
  idProofUrl: text("id_proof_url"),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  completedJobs: integer("completed_jobs").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWorkerProfileSchema = createInsertSchema(workerProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkerProfile = z.infer<typeof insertWorkerProfileSchema>;
export type WorkerProfile = typeof workerProfilesTable.$inferSelect;
