import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import electionRequestsRouter from "./electionRequests";
import electionsRouter from "./elections";
import candidatesRouter from "./candidates";
import votersRouter from "./voters";
import votesRouter from "./votes";
import resultsRouter from "./results";
import dashboardRouter from "./dashboard";
import auditLogsRouter from "./auditLogs";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(electionRequestsRouter);
router.use(electionsRouter);
router.use(candidatesRouter);
router.use(votersRouter);
router.use(votesRouter);
router.use(resultsRouter);
router.use(dashboardRouter);
router.use(auditLogsRouter);
router.use(notificationsRouter);

export default router;
