import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { votersTable } from "./voters";
import { electionsTable } from "./elections";

export const secretIdsTable = pgTable("secret_ids", {
  id: serial("id").primaryKey(),
  voterId: integer("voter_id").notNull().references(() => votersTable.id, { onDelete: "cascade" }),
  electionId: integer("election_id").notNull().references(() => electionsTable.id, { onDelete: "cascade" }),
  secretId: text("secret_id").notNull().unique(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSecretIdSchema = createInsertSchema(secretIdsTable).omit({
  id: true,
  createdAt: true,
  isUsed: true,
});

export type InsertSecretId = z.infer<typeof insertSecretIdSchema>;
export type SecretId = typeof secretIdsTable.$inferSelect;
