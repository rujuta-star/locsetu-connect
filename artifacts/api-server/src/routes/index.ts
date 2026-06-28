import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import workersRouter from "./workers";
import jobsRouter from "./jobs";
import reviewsRouter from "./reviews";
import savedWorkersRouter from "./saved_workers";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import buzzRouter from "./buzz";
import emergencyRouter from "./emergency";
import pricingRouter from "./pricing";
import learningRouter from "./learning";
import availabilityRouter from "./availability";
import portfolioRouter from "./portfolio";
import sosRouter from "./sos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(workersRouter);
router.use(jobsRouter);
router.use(reviewsRouter);
router.use(savedWorkersRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(buzzRouter);
router.use(emergencyRouter);
router.use(pricingRouter);
router.use(learningRouter);
router.use(availabilityRouter);
router.use(portfolioRouter);
router.use(sosRouter);

export default router;
