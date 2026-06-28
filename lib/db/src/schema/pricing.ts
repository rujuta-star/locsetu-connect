import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const servicePricingTable = pgTable("service_pricing", {
  id: serial("id").primaryKey(),
  skill: text("skill").notNull(),
  serviceName: text("service_name").notNull(),
  serviceNameHi: text("service_name_hi"),
  serviceNameMr: text("service_name_mr"),
  minPrice: integer("min_price").notNull(),
  avgPrice: integer("avg_price").notNull(),
  maxPrice: integer("max_price").notNull(),
  unit: text("unit").notNull().default("per visit"),
});

export const insertServicePricingSchema = createInsertSchema(servicePricingTable).omit({ id: true });
export type InsertServicePricing = z.infer<typeof insertServicePricingSchema>;
export type ServicePricing = typeof servicePricingTable.$inferSelect;
