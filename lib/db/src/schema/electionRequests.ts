import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);

export const electionRequestsTable = pgTable("election_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  orgName: text("org_name").notNull(),
  electionPurpose: text("election_purpose").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertElectionRequestSchema = createInsertSchema(electionRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  rejectionReason: true,
});

export type InsertElectionRequest = z.infer<typeof insertElectionRequestSchema>;
export type ElectionRequest = typeof electionRequestsTable.$inferSelect;
