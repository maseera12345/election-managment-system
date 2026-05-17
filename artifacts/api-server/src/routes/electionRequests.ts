import { Router } from "express";
import { db } from "@workspace/db";
import { electionRequestsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";
import { auditLogsTable } from "@workspace/db";

const router = Router();

async function formatRequest(r: typeof electionRequestsTable.$inferSelect) {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
  const user = users[0];
  return {
    id: r.id,
    userId: r.userId,
    orgName: r.orgName,
    electionPurpose: r.electionPurpose,
    status: r.status,
    rejectionReason: r.rejectionReason,
    createdAt: r.createdAt,
    user: user ? {
      id: user.id, fullName: user.fullName, email: user.email, phone: user.phone,
      role: user.role, status: user.status, orgName: user.orgName, electionPurpose: user.electionPurpose, createdAt: user.createdAt
    } : undefined,
  };
}

// GET /api/election-requests
router.get("/election-requests", requireAuth, requireRole("super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string | undefined;

    const conditions = statusFilter
      ? eq(electionRequestsTable.status, statusFilter as "pending" | "approved" | "rejected")
      : undefined;

    const requests = await db.select().from(electionRequestsTable)
      .where(conditions)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${electionRequestsTable.createdAt} DESC`);

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(electionRequestsTable)
      .where(conditions);
    const total = Number(countResult[0].count);

    const formatted = await Promise.all(requests.map(formatRequest));
    res.json({ requests: formatted, total, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/election-requests
router.post("/election-requests", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { orgName, electionPurpose } = req.body;
    if (!orgName || !electionPurpose) {
      res.status(400).json({ error: "Organization name and election purpose required" });
      return;
    }

    const [request] = await db.insert(electionRequestsTable).values({
      userId: req.user!.id,
      orgName,
      electionPurpose,
    }).returning();

    res.status(201).json(await formatRequest(request));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/election-requests/:id
router.get("/election-requests/:id", requireAuth, requireRole("super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const requests = await db.select().from(electionRequestsTable).where(eq(electionRequestsTable.id, id)).limit(1);
    if (!requests.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(await formatRequest(requests[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/election-requests/:id/approve
router.post("/election-requests/:id/approve", requireAuth, requireRole("super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [updated] = await db.update(electionRequestsTable)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(electionRequestsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Upgrade user role to election_creator
    await db.update(usersTable)
      .set({ role: "election_creator", updatedAt: new Date() })
      .where(eq(usersTable.id, updated.userId));

    await db.insert(auditLogsTable).values({
      userId: req.user!.id,
      action: "election_request_approved",
      entityType: "election_request",
      entityId: id,
      ipAddress: req.ip,
    });

    res.json(await formatRequest(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/election-requests/:id/reject
router.post("/election-requests/:id/reject", requireAuth, requireRole("super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;

    const [updated] = await db.update(electionRequestsTable)
      .set({ status: "rejected", rejectionReason: reason ?? null, updatedAt: new Date() })
      .where(eq(electionRequestsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    await db.insert(auditLogsTable).values({
      userId: req.user!.id,
      action: "election_request_rejected",
      entityType: "election_request",
      entityId: id,
      details: reason,
      ipAddress: req.ip,
    });

    res.json(await formatRequest(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
