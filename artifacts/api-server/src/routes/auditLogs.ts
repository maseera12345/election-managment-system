import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// GET /api/audit-logs
router.get("/audit-logs", requireAuth, requireRole("super_admin", "election_creator"), async (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const actionFilter = req.query.action as string | undefined;
    const userIdFilter = req.query.userId ? Number(req.query.userId) : undefined;
    const electionIdFilter = req.query.electionId ? Number(req.query.electionId) : undefined;

    const conditions = [];
    if (actionFilter) conditions.push(eq(auditLogsTable.action, actionFilter));
    if (userIdFilter) conditions.push(eq(auditLogsTable.userId, userIdFilter));
    if (electionIdFilter) conditions.push(eq(auditLogsTable.entityId, electionIdFilter));

    // Election creators can only see their own logs
    if (req.user!.role === "election_creator") {
      conditions.push(eq(auditLogsTable.userId, req.user!.id));
    }

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const logs = await db.select().from(auditLogsTable)
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${auditLogsTable.createdAt} DESC`);

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(auditLogsTable).where(where);
    const total = Number(countResult.count);

    const formatted = await Promise.all(logs.map(async (log) => {
      const users = log.userId ? await db.select().from(usersTable).where(eq(usersTable.id, log.userId)).limit(1) : [];
      const user = users[0];
      return {
        id: log.id,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
        user: user ? { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status, orgName: user.orgName, electionPurpose: user.electionPurpose, createdAt: user.createdAt } : undefined,
      };
    }));

    res.json({ logs: formatted, total, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
