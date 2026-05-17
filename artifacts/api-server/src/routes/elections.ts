import { Router } from "express";
import { db } from "@workspace/db";
import { electionsTable, usersTable, candidatesTable, votersTable, votesTable } from "@workspace/db";
import { eq, ilike, sql, and } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";
import { auditLogsTable } from "@workspace/db";

const router = Router();

async function formatElection(e: typeof electionsTable.$inferSelect, includeStats = false) {
  const creator = await db.select().from(usersTable).where(eq(usersTable.id, e.creatorId)).limit(1);
  
  let candidateCount: number | undefined;
  let voterCount: number | undefined;
  let voteCount: number | undefined;

  if (includeStats) {
    const [cc] = await db.select({ count: sql<number>`count(*)` }).from(candidatesTable).where(eq(candidatesTable.electionId, e.id));
    const [vc] = await db.select({ count: sql<number>`count(*)` }).from(votersTable).where(eq(votersTable.electionId, e.id));
    const [votes] = await db.select({ count: sql<number>`count(*)` }).from(votesTable).where(eq(votesTable.electionId, e.id));
    candidateCount = Number(cc.count);
    voterCount = Number(vc.count);
    voteCount = Number(votes.count);
  }

  const c = creator[0];
  return {
    id: e.id,
    creatorId: e.creatorId,
    title: e.title,
    description: e.description,
    category: e.category,
    bannerUrl: e.bannerUrl,
    startDate: e.startDate,
    endDate: e.endDate,
    registrationDeadline: e.registrationDeadline,
    maxVoters: e.maxVoters,
    status: e.status,
    votersFinalized: e.votersFinalized,
    createdAt: e.createdAt,
    creator: c ? { id: c.id, fullName: c.fullName, email: c.email, phone: c.phone, role: c.role, status: c.status, orgName: c.orgName, electionPurpose: c.electionPurpose, createdAt: c.createdAt } : undefined,
    candidateCount,
    voterCount,
    voteCount,
  };
}

// GET /api/elections
router.get("/elections", async (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string | undefined;
    const categoryFilter = req.query.category as string | undefined;
    const searchFilter = req.query.search as string | undefined;
    const creatorId = req.query.creatorId ? Number(req.query.creatorId) : undefined;

    const conditions = [];
    if (statusFilter) conditions.push(eq(electionsTable.status, statusFilter as "draft" | "published" | "active" | "completed" | "suspended"));
    if (categoryFilter) conditions.push(eq(electionsTable.category, categoryFilter));
    if (searchFilter) conditions.push(ilike(electionsTable.title, `%${searchFilter}%`));
    if (creatorId) conditions.push(eq(electionsTable.creatorId, creatorId));

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const elections = await db.select().from(electionsTable)
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${electionsTable.createdAt} DESC`);

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable).where(where);
    const total = Number(countResult.count);

    const formatted = await Promise.all(elections.map(e => formatElection(e, true)));
    res.json({ elections: formatted, total, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/elections
router.post("/elections", requireAuth, requireRole("election_creator", "super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, category, bannerUrl, startDate, endDate, registrationDeadline, maxVoters } = req.body;

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const [election] = await db.insert(electionsTable).values({
      creatorId: req.user!.id,
      title,
      description: description ?? null,
      category: category ?? null,
      bannerUrl: bannerUrl ?? null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      maxVoters: maxVoters ?? null,
      status: "draft",
    }).returning();

    await db.insert(auditLogsTable).values({
      userId: req.user!.id,
      action: "election_created",
      entityType: "election",
      entityId: election.id,
      details: title,
      ipAddress: req.ip,
    });

    res.status(201).json(await formatElection(election, true));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/elections/:id
router.get("/elections/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, id)).limit(1);
    if (!elections.length) {
      res.status(404).json({ error: "Election not found" });
      return;
    }
    res.json(await formatElection(elections[0], true));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/elections/:id
router.patch("/elections/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, id)).limit(1);
    if (!elections.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const election = elections[0];
    if (req.user!.role !== "super_admin" && election.creatorId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { title, description, category, bannerUrl, startDate, endDate, registrationDeadline, maxVoters, status } = req.body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (registrationDeadline !== undefined) updateData.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    if (maxVoters !== undefined) updateData.maxVoters = maxVoters;
    if (status !== undefined) updateData.status = status;

    const [updated] = await db.update(electionsTable).set(updateData).where(eq(electionsTable.id, id)).returning();
    res.json(await formatElection(updated, true));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/elections/:id
router.delete("/elections/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, id)).limit(1);
    if (!elections.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (req.user!.role !== "super_admin" && elections[0].creatorId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(electionsTable).where(eq(electionsTable.id, id));

    await db.insert(auditLogsTable).values({
      userId: req.user!.id,
      action: "election_deleted",
      entityType: "election",
      entityId: id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "Election deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/elections/:id/publish
router.post("/elections/:id/publish", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, id)).limit(1);
    if (!elections.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (req.user!.role !== "super_admin" && elections[0].creatorId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [updated] = await db.update(electionsTable)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(electionsTable.id, id))
      .returning();

    await db.insert(auditLogsTable).values({
      userId: req.user!.id,
      action: "election_published",
      entityType: "election",
      entityId: id,
      ipAddress: req.ip,
    });

    res.json(await formatElection(updated, true));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/elections/:id/suspend
router.post("/elections/:id/suspend", requireAuth, requireRole("super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [updated] = await db.update(electionsTable)
      .set({ status: "suspended", updatedAt: new Date() })
      .where(eq(electionsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    await db.insert(auditLogsTable).values({
      userId: req.user!.id,
      action: "election_suspended",
      entityType: "election",
      entityId: id,
      ipAddress: req.ip,
    });

    res.json(await formatElection(updated, true));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/elections/:id/finalize-voters
router.post("/elections/:id/finalize-voters", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, id)).limit(1);
    if (!elections.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (req.user!.role !== "super_admin" && elections[0].creatorId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Set all approved voters to finalized
    await db.update(votersTable)
      .set({ status: "finalized", updatedAt: new Date() })
      .where(and(eq(votersTable.electionId, id), eq(votersTable.status, "approved")));

    await db.update(electionsTable)
      .set({ votersFinalized: true, updatedAt: new Date() })
      .where(eq(electionsTable.id, id));

    await db.insert(auditLogsTable).values({
      userId: req.user!.id,
      action: "voters_finalized",
      entityType: "election",
      entityId: id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "Voters finalized" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
