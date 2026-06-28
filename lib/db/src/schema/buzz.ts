import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const buzzPostsTable = pgTable("buzz_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("other"),
  city: text("city").notNull(),
  area: text("area"),
  contactPhone: text("contact_phone"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBuzzPostSchema = createInsertSchema(buzzPostsTable).omit({ id: true, createdAt: true });
export type InsertBuzzPost = z.infer<typeof insertBuzzPostSchema>;
export type BuzzPost = typeof buzzPostsTable.$inferSelect;
