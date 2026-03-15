import { Router, type IRouter } from "express";
import { db, inventoryTable } from "@workspace/db";
import { eq, desc, lt } from "drizzle-orm";

const router: IRouter = Router();

router.get("/inventory", async (req, res) => {
  try {
    const rows = await db.select().from(inventoryTable).orderBy(desc(inventoryTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/inventory/:id", async (req, res) => {
  try {
    const rows = await db.select().from(inventoryTable).where(eq(inventoryTable.id, req.params.id));
    if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/inventory", async (req, res) => {
  try {
    const body = req.body;
    if (!body.id) body.id = `INV-${Date.now()}`;
    body.updatedAt = new Date();
    const [row] = await db.insert(inventoryTable).values(body).returning();
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/inventory/:id", async (req, res) => {
  try {
    const body = { ...req.body, updatedAt: new Date() };
    delete body.id;
    delete body.createdAt;
    const [row] = await db.update(inventoryTable).set(body).where(eq(inventoryTable.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/inventory/:id", async (req, res) => {
  try {
    await db.delete(inventoryTable).where(eq(inventoryTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/inventory/import", async (req, res) => {
  try {
    const { records } = req.body as { records: any[] };
    if (!records?.length) { res.status(400).json({ error: "No records" }); return; }
    const toInsert = records.map((r, i) => ({ ...r, id: r.id || `INV-IMP-${Date.now()}-${i}`, updatedAt: new Date() }));
    await db.insert(inventoryTable).values(toInsert).onConflictDoUpdate({ target: inventoryTable.id, set: { updatedAt: new Date() } });
    res.json({ imported: toInsert.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/inventory/stats/low-stock", async (req, res) => {
  try {
    const rows = await db.select({ id: inventoryTable.id, qty: inventoryTable.qty, minQty: inventoryTable.minQty }).from(inventoryTable);
    const lowStock = rows.filter(r => r.qty < r.minQty).length;
    const critical = rows.filter(r => r.qty === 0).length;
    res.json({ lowStock, critical, total: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
