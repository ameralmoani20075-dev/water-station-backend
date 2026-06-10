import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { stationsTable } from "./stations";

export const tanksTable = pgTable("tanks", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").notNull().references(() => stationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isFull: boolean("is_full").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTankSchema = createInsertSchema(tanksTable).omit({ id: true, createdAt: true });
export type InsertTank = z.infer<typeof insertTankSchema>;
export type Tank = typeof tanksTable.$inferSelect;
