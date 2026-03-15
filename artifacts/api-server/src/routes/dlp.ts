import { Router, type IRouter } from "express";
import { db, dlpTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dlp", async (req, res) => {
  try {
    const rows = await db.select().from(dlpTable).orderBy(desc(dlpTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dlp/:id", async (req, res) => {
  try {
    const rows = await db.select().from(dlpTable).where(eq(dlpTable.id, req.params.id));
    if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/dlp", async (req, res) => {
  try {
    const body = req.body;
    if (!body.id) body.id = `DLP-${Date.now()}`;
    body.updatedAt = new Date();
    const [row] = await db.insert(dlpTable).values(body).returning();
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/dlp/:id", async (req, res) => {
  try {
    const body = { ...req.body, updatedAt: new Date() };
    delete body.id;
    delete body.createdAt;
    const [row] = await db.update(dlpTable).set(body).where(eq(dlpTable.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/dlp/:id", async (req, res) => {
  try {
    await db.delete(dlpTable).where(eq(dlpTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/dlp/import", async (req, res) => {
  try {
    const { records } = req.body as { records: any[] };
    if (!records?.length) { res.status(400).json({ error: "No records" }); return; }
    const toInsert = records.map((r, i) => ({ ...r, id: r.id || `DLP-IMP-${Date.now()}-${i}`, updatedAt: new Date() }));
    await db.insert(dlpTable).values(toInsert).onConflictDoUpdate({ target: dlpTable.id, set: { updatedAt: new Date() } });
    res.json({ imported: toInsert.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dlp/stats/counts", async (req, res) => {
  try {
    const rows = await db.select({ id: dlpTable.id, dlpExpiry: dlpTable.dlpExpiry, ncrCount: dlpTable.ncrCount }).from(dlpTable);
    const today = new Date();
    const expired = rows.filter(r => r.dlpExpiry && new Date(r.dlpExpiry) < today).length;
    const critical = rows.filter(r => {
      if (!r.dlpExpiry) return false;
      const daysLeft = Math.ceil((new Date(r.dlpExpiry).getTime() - today.getTime()) / 86400000);
      return daysLeft >= 0 && (daysLeft <= 90 || (r.ncrCount || 0) >= 3);
    }).length;
    res.json({ expired, critical, total: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
