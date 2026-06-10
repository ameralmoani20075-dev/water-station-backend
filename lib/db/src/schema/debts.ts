import { pgTable, text, serial, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { stationsTable } from "./stations";

export const debtsTable = pgTable("debts", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").notNull().references(() => stationsTable.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 3 }).notNull(),
  note: text("note").notNull().default(""),
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDebtSchema = createInsertSchema(debtsTable).omit({ id: true, createdAt: true });
export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type Debt = typeof debtsTable.$inferSelect;
