import { Router } from "express";
import { db } from "@workspace/db";
import { votesTable, votersTable, candidatesTable, electionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /api/elections/:electionId/results
router.get("/elections/:electionId/results", async (req, res) => {
  try {
    const electionId = Number(req.params.electionId);

    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!elections.length) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    const candidates = await db.select().from(candidatesTable).where(eq(candidatesTable.electionId, electionId));

    const [totalVotesRow] = await db.select({ count: sql<number>`count(*)` })
      .from(votesTable).where(eq(votesTable.electionId, electionId));
    const totalVotes = Number(totalVotesRow.count);

    const [totalVotersRow] = await db.select({ count: sql<number>`count(*)` })
      .from(votersTable).where(eq(votersTable.electionId, electionId));
    const totalVoters = Number(totalVotersRow.count);

    const turnoutPercentage = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100 * 10) / 10 : 0;

    const candidateResults = await Promise.all(candidates.map(async (c) => {
      const [voteRow] = await db.select({ count: sql<number>`count(*)` })
        .from(votesTable)
        .where(eq(votesTable.candidateId, c.id));
      const voteCount = Number(voteRow.count);
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100 * 10) / 10 : 0;
      return {
        candidateId: c.id,
        name: c.name,
        photoUrl: c.photoUrl,
        designation: c.designation,
        voteCount,
        percentage,
      };
    }));

    candidateResults.sort((a, b) => b.voteCount - a.voteCount);

    const winner = candidateResults.length > 0 ? candidateResults[0] : undefined;

    res.json({
      electionId,
      totalVotes,
      totalVoters,
      turnoutPercentage,
      winner: winner ?? null,
      candidates: candidateResults,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
