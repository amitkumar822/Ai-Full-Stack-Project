import { integer, pgTable, varchar, text, json } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credit: integer(),
});

export const SessionChartTable = pgTable('sessionChartTable', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar().notNull(),
  notes: text(),
  conversation: json(),
  selectedDoctor: json(),
  report: json(),
  createdBy: varchar().references(() => usersTable.email),
  createdOn: varchar(),
});
