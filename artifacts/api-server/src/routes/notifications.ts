import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// GET /api/notifications
router.get("/notifications", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const notifications = await db.select().from(notificationsTable)
      .orderBy(sql`${notificationsTable.createdAt} DESC`)
      .limit(50);
    res.json(notifications);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/notifications
router.post("/notifications", requireAuth, requireRole("super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const { title, message, targetRole } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: "Title and message required" });
      return;
    }

    const [notification] = await db.insert(notificationsTable).values({
      title,
      message,
      targetRole: targetRole ?? null,
    }).returning();

    res.status(201).json(notification);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
