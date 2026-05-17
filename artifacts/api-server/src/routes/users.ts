import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, ilike, or, sql } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    orgName: u.orgName,
    electionPurpose: u.electionPurpose,
    createdAt: u.createdAt,
  };
}

// GET /api/users
router.get("/users", requireAuth, requireRole("super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const roleFilter = req.query.role as string | undefined;
    const statusFilter = req.query.status as string | undefined;

    let query = db.select().from(usersTable);

    const conditions = [];
    if (search) {
      conditions.push(or(
        ilike(usersTable.fullName, `%${search}%`),
        ilike(usersTable.email, `%${search}%`)
      ));
    }
    if (roleFilter) {
      conditions.push(eq(usersTable.role, roleFilter as "super_admin" | "election_creator" | "voter"));
    }
    if (statusFilter) {
      conditions.push(eq(usersTable.status, statusFilter as "active" | "blocked" | "pending"));
    }

    const users = await db.select().from(usersTable)
      .where(conditions.length ? (conditions.length === 1 ? conditions[0] : sql`${conditions.join(" AND ")}`) : undefined)
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const total = Number(countResult[0].count);

    res.json({ users: users.map(formatUser), total, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id
router.get("/users/:id", requireAuth, requireRole("super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!users.length) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(formatUser(users[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id
router.patch("/users/:id", requireAuth, requireRole("super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status, role } = req.body;

    const updateData: Record<string, string> = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;

    const [updated] = await db.update(usersTable)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(formatUser(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
