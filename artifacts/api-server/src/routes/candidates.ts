import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable, electionsTable, votesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// GET /api/elections/:electionId/candidates
router.get("/elections/:electionId/candidates", async (req, res) => {
  try {
    const electionId = Number(req.params.electionId);
    const candidates = await db.select().from(candidatesTable)
      .where(eq(candidatesTable.electionId, electionId))
      .orderBy(candidatesTable.name);

    const withVotes = await Promise.all(candidates.map(async (c) => {
      const [voteCount] = await db.select({ count: sql<number>`count(*)` })
        .from(votesTable).where(eq(votesTable.candidateId, c.id));
      return {
        id: c.id,
        electionId: c.electionId,
        name: c.name,
        photoUrl: c.photoUrl,
        designation: c.designation,
        manifesto: c.manifesto,
        description: c.description,
        voteCount: Number(voteCount.count),
        createdAt: c.createdAt,
      };
    }));

    res.json(withVotes);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/elections/:electionId/candidates
router.post("/elections/:electionId/candidates", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);
    const { name, photoUrl, designation, manifesto, description } = req.body;

    if (!name) {
      res.status(400).json({ error: "Candidate name required" });
      return;
    }

    // Verify ownership
    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!elections.length) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    if (req.user!.role !== "super_admin" && elections[0].creatorId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [candidate] = await db.insert(candidatesTable).values({
      electionId,
      name,
      photoUrl: photoUrl ?? null,
      designation: designation ?? null,
      manifesto: manifesto ?? null,
      description: description ?? null,
    }).returning();

    res.status(201).json({ ...candidate, voteCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/elections/:electionId/candidates/:candidateId
router.patch("/elections/:electionId/candidates/:candidateId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);
    const candidateId = Number(req.params.candidateId);

    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!elections.length) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    if (req.user!.role !== "super_admin" && elections[0].creatorId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { name, photoUrl, designation, manifesto, description } = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (designation !== undefined) updateData.designation = designation;
    if (manifesto !== undefined) updateData.manifesto = manifesto;
    if (description !== undefined) updateData.description = description;

    const [updated] = await db.update(candidatesTable).set(updateData)
      .where(eq(candidatesTable.id, candidateId)).returning();

    if (!updated) {
      res.status(404).json({ error: "Candidate not found" });
      return;
    }

    const [voteCount] = await db.select({ count: sql<number>`count(*)` })
      .from(votesTable).where(eq(votesTable.candidateId, candidateId));

    res.json({ ...updated, voteCount: Number(voteCount.count) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/elections/:electionId/candidates/:candidateId
router.delete("/elections/:electionId/candidates/:candidateId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const electionId = Number(req.params.electionId);
    const candidateId = Number(req.params.candidateId);

    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!elections.length || (req.user!.role !== "super_admin" && elections[0].creatorId !== req.user!.id)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(candidatesTable).where(eq(candidatesTable.id, candidateId));
    res.json({ success: true, message: "Candidate removed" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
