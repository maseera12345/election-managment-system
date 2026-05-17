import { pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { electionsTable } from "./elections";
import { candidatesTable } from "./candidates";
import { votersTable } from "./voters";

export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull().references(() => electionsTable.id, { onDelete: "cascade" }),
  candidateId: integer("candidate_id").notNull().references(() => candidatesTable.id, { onDelete: "cascade" }),
  voterId: integer("voter_id").notNull().references(() => votersTable.id),
  votedAt: timestamp("voted_at").defaultNow().notNull(),
});

export const insertVoteSchema = createInsertSchema(votesTable).omit({
  id: true,
  votedAt: true,
});

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;
