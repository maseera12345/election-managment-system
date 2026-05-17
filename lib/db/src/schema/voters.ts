import { pgTable, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { electionsTable } from "./elections";
import { usersTable } from "./users";

export const voterStatusEnum = pgEnum("voter_status", ["pending", "approved", "waitlisted", "finalized"]);

export const votersTable = pgTable("voters", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull().references(() => electionsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  status: voterStatusEnum("status").notNull().default("pending"),
  hasVoted: boolean("has_voted").notNull().default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVoterSchema = createInsertSchema(votersTable).omit({
  id: true,
  joinedAt: true,
  updatedAt: true,
  hasVoted: true,
  status: true,
});

export type InsertVoter = z.infer<typeof insertVoterSchema>;
export type Voter = typeof votersTable.$inferSelect;
