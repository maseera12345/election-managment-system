import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateToken, requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { auditLogsTable } from "@workspace/db";

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

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { fullName, email, password, role, phone, orgName, electionPurpose } = req.body;

    if (!fullName || !email || !password || !role) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (!["voter", "election_creator"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing.length) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db.insert(usersTable).values({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone: phone ?? null,
      orgName: orgName ?? null,
      electionPurpose: electionPurpose ?? null,
      status: "active",
    }).returning();

    await db.insert(auditLogsTable).values({
      userId: user.id,
      action: "user_registered",
      entityType: "user",
      entityId: user.id,
      details: `User registered with role: ${role}`,
      ipAddress: req.ip,
    });

    const token = generateToken(user.id, user.email, user.role, user.fullName);
    res.status(201).json({ user: formatUser(user), token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (!users.length) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = users[0];

    if (user.status === "blocked") {
      res.status(401).json({ error: "Account is blocked" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    await db.insert(auditLogsTable).values({
      userId: user.id,
      action: "user_login",
      entityType: "user",
      entityId: user.id,
      ipAddress: req.ip,
    });

    const token = generateToken(user.id, user.email, user.role, user.fullName);
    res.json({ user: formatUser(user), token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", async (req, res) => {
  res.json({ success: true, message: "Logged out" });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!users.length) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json(formatUser(users[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/forgot-password
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email required" });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (users.length) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await db.update(usersTable)
        .set({ resetToken: token, resetTokenExpiry: expiry })
        .where(eq(usersTable.id, users[0].id));
    }

    // Always return success to prevent email enumeration
    res.json({ success: true, message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/reset-password
router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: "Token and password required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.resetToken, token)).limit(1);
    if (!users.length || !users[0].resetTokenExpiry || users[0].resetTokenExpiry < new Date()) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(usersTable)
      .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
      .where(eq(usersTable.id, users[0].id));

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
