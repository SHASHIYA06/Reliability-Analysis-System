import { Router, type IRouter } from "express";
import healthRouter from "./health";
import trainsRouter from "./trains";
import failuresRouter from "./failures";
import reportsRouter from "./reports";
import fleetDistancesRouter from "./fleet_distances";
import ncrRouter from "./ncr";
import { aiRouter } from "./ai";
import eirRouter from "./eir";
import rsoiRouter from "./rsoi";
import dlpRouter from "./dlp";
import toolsRouter from "./tools";
import inventoryRouter from "./inventory";
import gatePassRouter from "./gate_pass";

const router: IRouter = Router();

router.use(healthRouter);
router.use(trainsRouter);
router.use(failuresRouter);
router.use(reportsRouter);
router.use(fleetDistancesRouter);
router.use(ncrRouter);
router.use(aiRouter);
router.use(eirRouter);
router.use(rsoiRouter);
router.use(dlpRouter);
router.use(toolsRouter);
router.use(inventoryRouter);
router.use(gatePassRouter);

export default router;
