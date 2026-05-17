import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const electionStatusEnum = pgEnum("election_status", ["draft", "published", "active", "completed", "suspended"]);

export const electionsTable = pgTable("elections", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  bannerUrl: text("banner_url"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  registrationDeadline: timestamp("registration_deadline"),
  maxVoters: integer("max_voters"),
  status: electionStatusEnum("status").notNull().default("draft"),
  votersFinalized: boolean("voters_finalized").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertElectionSchema = createInsertSchema(electionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  votersFinalized: true,
});

export type InsertElection = z.infer<typeof insertElectionSchema>;
export type Election = typeof electionsTable.$inferSelect;
