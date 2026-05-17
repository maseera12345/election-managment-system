import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET ?? "election-system-secret-key";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    fullName: string;
  };
}

export function generateToken(userId: number, email: string, role: string, fullName: string): string {
  return jwt.sign({ id: userId, email, role, fullName }, JWT_SECRET, { expiresIn: "7d" });
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string; fullName: string };
    
    const users = await db.select().from(usersTable).where(eq(usersTable.id, payload.id)).limit(1);
    if (!users.length || users[0].status === "blocked") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = { id: payload.id, email: payload.email, role: payload.role, fullName: payload.fullName };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
