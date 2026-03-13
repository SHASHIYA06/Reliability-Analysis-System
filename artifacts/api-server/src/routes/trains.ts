import { Router, type IRouter } from "express";
import { db, trainsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/trains", async (_req, res) => {
  try {
    const trains = await db.select().from(trainsTable).orderBy(trainsTable.trainNumber);
    res.json(trains);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trains" });
  }
});

router.post("/trains", async (req, res) => {
  try {
    const body = req.body;
    const train = {
      id: randomUUID(),
      trainNumber: body.trainNumber,
      formation: body.formation,
      inServiceDate: body.inServiceDate,
      status: body.status || "active",
      notes: body.notes || null,
    };
    const [created] = await db.insert(trainsTable).values(train).returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create train" });
  }
});

router.get("/trains/:id", async (req, res) => {
  try {
    const [train] = await db.select().from(trainsTable).where(eq(trainsTable.id, req.params.id));
    if (!train) return res.status(404).json({ error: "Train not found" });
    res.json(train);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch train" });
  }
});

router.put("/trains/:id", async (req, res) => {
  try {
    const body = req.body;
    const [updated] = await db
      .update(trainsTable)
      .set({
        trainNumber: body.trainNumber,
        formation: body.formation,
        inServiceDate: body.inServiceDate,
        status: body.status,
        notes: body.notes,
      })
      .where(eq(trainsTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Train not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update train" });
  }
});

router.delete("/trains/:id", async (req, res) => {
  try {
    await db.delete(trainsTable).where(eq(trainsTable.id, req.params.id));
    res.json({ success: true, message: "Train deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete train" });
  }
});

export default router;
