import { Router, type IRouter } from "express";
import { db, fleetDistancesTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/fleet-distances", async (_req, res) => {
  try {
    const distances = await db.select().from(fleetDistancesTable).orderBy(fleetDistancesTable.recordDate);
    res.json(distances);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch fleet distances" });
  }
});

router.post("/fleet-distances", async (req, res) => {
  try {
    const body = req.body;
    const record = {
      id: randomUUID(),
      trainId: body.trainId,
      trainNumber: body.trainNumber,
      recordDate: body.recordDate,
      cumulativeDistanceKm: body.cumulativeDistanceKm,
      dailyDistanceKm: body.dailyDistanceKm || null,
      notes: body.notes || null,
    };
    const [created] = await db.insert(fleetDistancesTable).values(record).returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create fleet distance record" });
  }
});

export default router;
