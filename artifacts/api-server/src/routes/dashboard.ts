import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, electionsTable, votesTable, votersTable, electionRequestsTable, auditLogsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// GET /api/dashboard/admin
router.get("/dashboard/admin", requireAuth, requireRole("super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const [totalUsersRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [totalElectionsRow] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable);
    const [activeElectionsRow] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable).where(eq(electionsTable.status, "active"));
    const [pendingRequestsRow] = await db.select({ count: sql<number>`count(*)` }).from(electionRequestsTable).where(eq(electionRequestsTable.status, "pending"));
    const [totalVotesRow] = await db.select({ count: sql<number>`count(*)` }).from(votesTable);

    const recentLogs = await db.select().from(auditLogsTable)
      .orderBy(sql`${auditLogsTable.createdAt} DESC`)
      .limit(10);

    const recentActivity = await Promise.all(recentLogs.map(async (log) => {
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

    // Election by status
    const statuses = ["draft", "published", "active", "completed", "suspended"];
    const electionsByStatus = await Promise.all(statuses.map(async (status) => {
      const [row] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable)
        .where(eq(electionsTable.status, status as "draft" | "published" | "active" | "completed" | "suspended"));
      return { status, count: Number(row.count) };
    }));

    // Users by role
    const roles = ["super_admin", "election_creator", "voter"];
    const usersByRole = await Promise.all(roles.map(async (role) => {
      const [row] = await db.select({ count: sql<number>`count(*)` }).from(usersTable)
        .where(eq(usersTable.role, role as "super_admin" | "election_creator" | "voter"));
      return { role, count: Number(row.count) };
    }));

    res.json({
      totalUsers: Number(totalUsersRow.count),
      totalElections: Number(totalElectionsRow.count),
      activeElections: Number(activeElectionsRow.count),
      pendingRequests: Number(pendingRequestsRow.count),
      totalVotes: Number(totalVotesRow.count),
      recentActivity,
      electionsByStatus,
      usersByRole,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/creator
router.get("/dashboard/creator", requireAuth, requireRole("election_creator", "super_admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const creatorId = req.user!.id;

    const [totalElectionsRow] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable).where(eq(electionsTable.creatorId, creatorId));
    const [activeRow] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable).where(and(eq(electionsTable.creatorId, creatorId), eq(electionsTable.status, "active")));
    const [upcomingRow] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable).where(and(eq(electionsTable.creatorId, creatorId), eq(electionsTable.status, "published")));
    const [completedRow] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable).where(and(eq(electionsTable.creatorId, creatorId), eq(electionsTable.status, "completed")));

    const myElectionIds = await db.select({ id: electionsTable.id }).from(electionsTable).where(eq(electionsTable.creatorId, creatorId));
    const idList = myElectionIds.map(e => e.id);

    let totalVoters = 0;
    let totalVotes = 0;

    if (idList.length) {
      for (const id of idList) {
        const [vRow] = await db.select({ count: sql<number>`count(*)` }).from(votersTable).where(eq(votersTable.electionId, id));
        const [vtRow] = await db.select({ count: sql<number>`count(*)` }).from(votesTable).where(eq(votesTable.electionId, id));
        totalVoters += Number(vRow.count);
        totalVotes += Number(vtRow.count);
      }
    }

    const recentElections = await db.select().from(electionsTable)
      .where(eq(electionsTable.creatorId, creatorId))
      .orderBy(sql`${electionsTable.createdAt} DESC`)
      .limit(5);

    const formattedElections = await Promise.all(recentElections.map(async (e) => {
      const [cc] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable).where(eq(electionsTable.id, e.id));
      return {
        id: e.id, creatorId: e.creatorId, title: e.title, description: e.description,
        category: e.category, bannerUrl: e.bannerUrl, startDate: e.startDate, endDate: e.endDate,
        registrationDeadline: e.registrationDeadline, maxVoters: e.maxVoters, status: e.status,
        votersFinalized: e.votersFinalized, createdAt: e.createdAt,
        candidateCount: null, voterCount: null, voteCount: null, creator: null
      };
    }));

    res.json({
      totalElections: Number(totalElectionsRow.count),
      activeElections: Number(activeRow.count),
      upcomingElections: Number(upcomingRow.count),
      completedElections: Number(completedRow.count),
      totalVoters,
      totalVotes,
      recentElections: formattedElections,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/voter
router.get("/dashboard/voter", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const participations = await db.select().from(votersTable).where(eq(votersTable.userId, userId));
    const joinedElections = participations.length;
    const votedCount = participations.filter(v => v.hasVoted).length;

    const electionDetails = await Promise.all(participations.map(async (v) => {
      const elections = await db.select().from(electionsTable).where(eq(electionsTable.id, v.electionId)).limit(1);
      const election = elections[0];
      return {
        election: election ? {
          id: election.id, creatorId: election.creatorId, title: election.title,
          description: election.description, category: election.category, bannerUrl: election.bannerUrl,
          startDate: election.startDate, endDate: election.endDate, registrationDeadline: election.registrationDeadline,
          maxVoters: election.maxVoters, status: election.status, votersFinalized: election.votersFinalized,
          createdAt: election.createdAt, candidateCount: null, voterCount: null, voteCount: null, creator: null
        } : null,
        voter: {
          id: v.id, electionId: v.electionId, userId: v.userId,
          status: v.status, hasVoted: v.hasVoted, joinedAt: v.joinedAt
        },
      };
    }));

    const upcoming = electionDetails.filter(p => p.election?.status === "published" || p.election?.status === "active").length;

    res.json({
      joinedElections,
      votedCount,
      upcomingElections: upcoming,
      participations: electionDetails,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/public-stats
router.get("/dashboard/public-stats", async (req, res) => {
  try {
    const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable);
    const [activeRow] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable).where(eq(electionsTable.status, "active"));
    const [completedRow] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable).where(eq(electionsTable.status, "completed"));
    const [upcomingRow] = await db.select({ count: sql<number>`count(*)` }).from(electionsTable).where(eq(electionsTable.status, "published"));
    const [votesRow] = await db.select({ count: sql<number>`count(*)` }).from(votesTable);

    const recentElections = await db.select().from(electionsTable)
      .where(eq(electionsTable.status, "active"))
      .orderBy(sql`${electionsTable.createdAt} DESC`)
      .limit(6);

    const formatted = recentElections.map(e => ({
      id: e.id, creatorId: e.creatorId, title: e.title, description: e.description,
      category: e.category, bannerUrl: e.bannerUrl, startDate: e.startDate, endDate: e.endDate,
      registrationDeadline: e.registrationDeadline, maxVoters: e.maxVoters, status: e.status,
      votersFinalized: e.votersFinalized, createdAt: e.createdAt,
      candidateCount: null, voterCount: null, voteCount: null, creator: null
    }));

    res.json({
      totalElections: Number(totalRow.count),
      activeElections: Number(activeRow.count),
      completedElections: Number(completedRow.count),
      upcomingElections: Number(upcomingRow.count),
      totalVotes: Number(votesRow.count),
      recentElections: formatted,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
