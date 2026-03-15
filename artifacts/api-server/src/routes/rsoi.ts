import { Router, type IRouter } from "express";
import { db, rsoiTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/rsoi", async (req, res) => {
  try {
    const rows = await db.select().from(rsoiTable).orderBy(desc(rsoiTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/rsoi/:id", async (req, res) => {
  try {
    const rows = await db.select().from(rsoiTable).where(eq(rsoiTable.id, req.params.id));
    if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/rsoi", async (req, res) => {
  try {
    const body = req.body;
    if (!body.id) body.id = `RSOI-${Date.now()}`;
    body.updatedAt = new Date();
    const [row] = await db.insert(rsoiTable).values(body).returning();
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/rsoi/:id", async (req, res) => {
  try {
    const body = { ...req.body, updatedAt: new Date() };
    delete body.id;
    delete body.createdAt;
    const [row] = await db.update(rsoiTable).set(body).where(eq(rsoiTable.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/rsoi/:id", async (req, res) => {
  try {
    await db.delete(rsoiTable).where(eq(rsoiTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/rsoi/stats/counts", async (req, res) => {
  try {
    const rows = await db.select({ status: rsoiTable.status }).from(rsoiTable);
    const open = rows.filter(r => r.status === "OPEN").length;
    const inProgress = rows.filter(r => r.status === "IN PROGRESS").length;
    const closed = rows.filter(r => r.status === "CLOSE").length;
    res.json({ open, inProgress, closed, total: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
