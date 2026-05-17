import { Router } from "express";
import { db } from "@workspace/db";
import { votesTable, votersTable, secretIdsTable, candidatesTable, electionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { auditLogsTable } from "@workspace/db";

const router = Router();

// POST /api/elections/:electionId/vote
router.post("/elections/:electionId/vote", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);
    const { candidateId, secretId } = req.body;
    const userId = req.user!.id;

    if (!candidateId || !secretId) {
      res.status(400).json({ error: "Candidate ID and secret ID required" });
      return;
    }

    // Check election exists and is active
    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!elections.length || elections[0].status !== "active") {
      res.status(400).json({ error: "Election is not active" });
      return;
    }

    // Check voter is registered and finalized
    const voters = await db.select().from(votersTable)
      .where(and(eq(votersTable.electionId, electionId), eq(votersTable.userId, userId)))
      .limit(1);

    if (!voters.length) {
      res.status(400).json({ error: "You are not registered for this election" });
      return;
    }

    const voter = voters[0];
    if (voter.status !== "finalized") {
      res.status(400).json({ error: "Your voter status is not finalized" });
      return;
    }

    if (voter.hasVoted) {
      res.status(400).json({ error: "You have already voted in this election" });
      return;
    }

    // Validate secret ID
    const secretIds = await db.select().from(secretIdsTable)
      .where(and(
        eq(secretIdsTable.electionId, electionId),
        eq(secretIdsTable.voterId, voter.id),
        eq(secretIdsTable.secretId, secretId.toUpperCase())
      ))
      .limit(1);

    if (!secretIds.length) {
      res.status(400).json({ error: "Invalid secret ID" });
      return;
    }

    if (secretIds[0].isUsed) {
      res.status(400).json({ error: "Secret ID has already been used" });
      return;
    }

    // Validate candidate belongs to this election
    const candidates = await db.select().from(candidatesTable)
      .where(and(eq(candidatesTable.id, candidateId), eq(candidatesTable.electionId, electionId)))
      .limit(1);

    if (!candidates.length) {
      res.status(400).json({ error: "Invalid candidate" });
      return;
    }

    // Cast vote
    await db.insert(votesTable).values({
      electionId,
      candidateId,
      voterId: voter.id,
    });

    // Mark voter as voted
    await db.update(votersTable)
      .set({ hasVoted: true, updatedAt: new Date() })
      .where(eq(votersTable.id, voter.id));

    // Mark secret ID as used
    await db.update(secretIdsTable)
      .set({ isUsed: true })
      .where(eq(secretIdsTable.id, secretIds[0].id));

    await db.insert(auditLogsTable).values({
      userId,
      action: "vote_cast",
      entityType: "election",
      entityId: electionId,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: "Vote cast successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/elections/:electionId/my-vote
router.get("/elections/:electionId/my-vote", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);
    const userId = req.user!.id;

    const voters = await db.select().from(votersTable)
      .where(and(eq(votersTable.electionId, electionId), eq(votersTable.userId, userId)))
      .limit(1);

    if (!voters.length) {
      res.json({ hasVoted: false, votedAt: null });
      return;
    }

    const voter = voters[0];
    if (!voter.hasVoted) {
      res.json({ hasVoted: false, votedAt: null });
      return;
    }

    const votes = await db.select().from(votesTable)
      .where(and(eq(votesTable.electionId, electionId), eq(votesTable.voterId, voter.id)))
      .limit(1);

    res.json({
      hasVoted: true,
      votedAt: votes.length ? votes[0].votedAt : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
