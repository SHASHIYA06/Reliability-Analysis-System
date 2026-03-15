import { Router, type IRouter } from "express";
import healthRouter from "./health";
import trainsRouter from "./trains";
import failuresRouter from "./failures";
import reportsRouter from "./reports";
import fleetDistancesRouter from "./fleet_distances";
import ncrRouter from "./ncr";
import { aiRouter } from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(trainsRouter);
router.use(failuresRouter);
router.use(reportsRouter);
router.use(fleetDistancesRouter);
router.use(ncrRouter);
router.use(aiRouter);

export default router;
