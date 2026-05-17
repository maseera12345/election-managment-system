import { Router } from "express";
import { db } from "@workspace/db";
import { votersTable, usersTable, electionsTable, secretIdsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { auditLogsTable } from "@workspace/db";
import crypto from "crypto";

const router = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, role: u.role, status: u.status, orgName: u.orgName, electionPurpose: u.electionPurpose, createdAt: u.createdAt };
}

async function formatVoter(v: typeof votersTable.$inferSelect) {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, v.userId)).limit(1);
  return {
    id: v.id,
    electionId: v.electionId,
    userId: v.userId,
    status: v.status,
    hasVoted: v.hasVoted,
    joinedAt: v.joinedAt,
    user: users[0] ? formatUser(users[0]) : undefined,
  };
}

// GET /api/elections/:electionId/voters
router.get("/elections/:electionId/voters", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);

    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!elections.length) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    if (req.user!.role !== "super_admin" && elections[0].creatorId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const voters = await db.select().from(votersTable)
      .where(eq(votersTable.electionId, electionId));

    const formatted = await Promise.all(voters.map(formatVoter));
    res.json(formatted);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/elections/:electionId/voters (join election)
router.post("/elections/:electionId/voters", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);
    const userId = req.user!.id;

    const existing = await db.select().from(votersTable)
      .where(and(eq(votersTable.electionId, electionId), eq(votersTable.userId, userId)))
      .limit(1);

    if (existing.length) {
      res.status(400).json({ error: "Already joined this election" });
      return;
    }

    const [voter] = await db.insert(votersTable).values({
      electionId,
      userId,
    }).returning();

    await db.insert(auditLogsTable).values({
      userId,
      action: "voter_joined",
      entityType: "election",
      entityId: electionId,
      ipAddress: req.ip,
    });

    res.status(201).json(await formatVoter(voter));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/elections/:electionId/voters/:voterId/approve
router.post("/elections/:electionId/voters/:voterId/approve", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);
    const voterId = Number(req.params.voterId);

    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!elections.length || (req.user!.role !== "super_admin" && elections[0].creatorId !== req.user!.id)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [updated] = await db.update(votersTable)
      .set({ status: "approved", updatedAt: new Date() })
      .where(and(eq(votersTable.id, voterId), eq(votersTable.electionId, electionId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Voter not found" });
      return;
    }

    res.json(await formatVoter(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/elections/:electionId/secret-ids
router.get("/elections/:electionId/secret-ids", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);

    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!elections.length || (req.user!.role !== "super_admin" && elections[0].creatorId !== req.user!.id)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const secretIds = await db.select().from(secretIdsTable).where(eq(secretIdsTable.electionId, electionId));

    const masked = secretIds.map(s => ({
      id: s.id,
      voterId: s.voterId,
      electionId: s.electionId,
      maskedSecretId: s.secretId.slice(0, 4) + "****" + s.secretId.slice(-4),
      isUsed: s.isUsed,
      createdAt: s.createdAt,
    }));

    res.json(masked);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/elections/:electionId/my-secret-id (voter gets their own secret ID)
router.get("/elections/:electionId/my-secret-id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);
    const userId = req.user!.id;

    const voters = await db.select().from(votersTable)
      .where(and(eq(votersTable.electionId, electionId), eq(votersTable.userId, userId)))
      .limit(1);

    if (!voters.length) {
      res.status(404).json({ error: "You are not registered for this election" });
      return;
    }

    const voter = voters[0];
    const secretIds = await db.select().from(secretIdsTable)
      .where(and(eq(secretIdsTable.voterId, voter.id), eq(secretIdsTable.electionId, electionId)))
      .limit(1);

    if (!secretIds.length) {
      res.json({ voter: { id: voter.id, status: voter.status, hasVoted: voter.hasVoted }, secretId: null });
      return;
    }

    res.json({ voter: { id: voter.id, status: voter.status, hasVoted: voter.hasVoted }, secretId: secretIds[0].secretId, isUsed: secretIds[0].isUsed });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/elections/:electionId/secret-ids (generate)
router.post("/elections/:electionId/secret-ids", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);

    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!elections.length || (req.user!.role !== "super_admin" && elections[0].creatorId !== req.user!.id)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const finalizedVoters = await db.select().from(votersTable)
      .where(and(eq(votersTable.electionId, electionId), eq(votersTable.status, "finalized")));

    let generated = 0;
    for (const voter of finalizedVoters) {
      // Check if already has a secret ID
      const existing = await db.select().from(secretIdsTable)
        .where(and(eq(secretIdsTable.voterId, voter.id), eq(secretIdsTable.electionId, electionId)))
        .limit(1);

      if (!existing.length) {
        const secretId = crypto.randomBytes(16).toString("hex").toUpperCase();
        await db.insert(secretIdsTable).values({
          voterId: voter.id,
          electionId,
          secretId,
        });
        generated++;
      }
    }

    res.status(201).json({ success: true, message: `Generated ${generated} secret IDs` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
