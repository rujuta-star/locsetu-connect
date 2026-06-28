import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const learningCoursesTable = pgTable("learning_courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  duration: integer("duration").notNull().default(0),
  language: text("language").notNull().default("en"),
  isFree: boolean("is_free").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learningProgressTable = pgTable("learning_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => learningCoursesTable.id, { onDelete: "cascade" }),
  progressPercent: integer("progress_percent").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  certificateIssued: boolean("certificate_issued").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLearningCourseSchema = createInsertSchema(learningCoursesTable).omit({ id: true, createdAt: true });
export type InsertLearningCourse = z.infer<typeof insertLearningCourseSchema>;
export type LearningCourse = typeof learningCoursesTable.$inferSelect;

export const insertLearningProgressSchema = createInsertSchema(learningProgressTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLearningProgress = z.infer<typeof insertLearningProgressSchema>;
export type LearningProgress = typeof learningProgressTable.$inferSelect;
