import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { stationsTable } from "./stations";

export const filtersTable = pgTable("filters", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").notNull().references(() => stationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isFull: boolean("is_full").notNull().default(true),
  lastChangedAt: timestamp("last_changed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFilterSchema = createInsertSchema(filtersTable).omit({ id: true, createdAt: true });
export type InsertFilter = z.infer<typeof insertFilterSchema>;
export type Filter = typeof filtersTable.$inferSelect;
