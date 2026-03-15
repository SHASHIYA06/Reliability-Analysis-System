import { Router, type IRouter } from "express";
import { db, gatePassTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/gate-pass", async (req, res) => {
  try {
    const { status } = req.query;
    const rows = await db.select().from(gatePassTable).orderBy(desc(gatePassTable.createdAt));
    const filtered = status ? rows.filter(r => r.status === status) : rows;
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/gate-pass/:id", async (req, res) => {
  try {
    const rows = await db.select().from(gatePassTable).where(eq(gatePassTable.id, req.params.id));
    if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/gate-pass", async (req, res) => {
  try {
    const body = req.body;
    if (!body.id) body.id = `GP-${Date.now()}`;
    body.updatedAt = new Date();
    const [row] = await db.insert(gatePassTable).values(body).returning();
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/gate-pass/:id", async (req, res) => {
  try {
    const body = { ...req.body, updatedAt: new Date() };
    delete body.id;
    delete body.createdAt;
    const [row] = await db.update(gatePassTable).set(body).where(eq(gatePassTable.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/gate-pass/:id", async (req, res) => {
  try {
    await db.delete(gatePassTable).where(eq(gatePassTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/gate-pass/stats/counts", async (req, res) => {
  try {
    const rows = await db.select({ status: gatePassTable.status }).from(gatePassTable);
    const open = rows.filter(r => r.status === "OPEN").length;
    const closed = rows.filter(r => r.status === "CLOSED").length;
    res.json({ open, closed, total: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
