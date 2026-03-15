import { Router, type IRouter } from "express";
import { db, eirTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/eir", async (req, res) => {
  try {
    const { status } = req.query;
    let q = db.select().from(eirTable).orderBy(desc(eirTable.createdAt));
    const rows = await q;
    const filtered = status ? rows.filter(r => r.status === status) : rows;
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/eir/:id", async (req, res) => {
  try {
    const rows = await db.select().from(eirTable).where(eq(eirTable.id, req.params.id));
    if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/eir", async (req, res) => {
  try {
    const body = req.body;
    if (!body.id) body.id = `EIR-${Date.now()}`;
    body.updatedAt = new Date();
    const [row] = await db.insert(eirTable).values(body).returning();
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/eir/:id", async (req, res) => {
  try {
    const body = { ...req.body, updatedAt: new Date() };
    delete body.id;
    delete body.createdAt;
    const [row] = await db.update(eirTable).set(body).where(eq(eirTable.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/eir/:id", async (req, res) => {
  try {
    await db.delete(eirTable).where(eq(eirTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/eir/stats/counts", async (req, res) => {
  try {
    const rows = await db.select({ status: eirTable.status }).from(eirTable);
    const open = rows.filter(r => r.status === "OPEN").length;
    const inProgress = rows.filter(r => r.status === "IN PROGRESS").length;
    const closed = rows.filter(r => r.status === "CLOSED").length;
    res.json({ open, inProgress, closed, total: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
