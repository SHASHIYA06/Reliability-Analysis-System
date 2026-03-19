import { Router, type IRouter } from "express";
import { db, toolsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/tools", async (req, res) => {
  try {
    const rows = await db.select().from(toolsTable).orderBy(desc(toolsTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/tools/:id", async (req, res) => {
  try {
    const rows = await db.select().from(toolsTable).where(eq(toolsTable.id, req.params.id));
    if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tools", async (req, res) => {
  try {
    const body = req.body;
    if (!body.id) body.id = `TOOL-${Date.now()}`;
    body.updatedAt = new Date();
    if (body.consumable !== undefined) {
      body.consumable = String(body.consumable).toLowerCase() === "true" || String(body.consumable).toLowerCase() === "yes" || body.consumable === true;
    }
    const [row] = await db.insert(toolsTable).values(body).returning();
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/tools/:id", async (req, res) => {
  try {
    const body = { ...req.body, updatedAt: new Date() };
    if (body.consumable !== undefined) {
      body.consumable = String(body.consumable).toLowerCase() === "true" || String(body.consumable).toLowerCase() === "yes" || body.consumable === true;
    }
    delete body.id;
    delete body.createdAt;
    const [row] = await db.update(toolsTable).set(body).where(eq(toolsTable.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/tools/:id", async (req, res) => {
  try {
    await db.delete(toolsTable).where(eq(toolsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tools/import", async (req, res) => {
  try {
    const { records } = req.body as { records: any[] };
    if (!records?.length) { res.status(400).json({ error: "No records" }); return; }
    const toInsert = records.map((r, i) => {
      let cons = false;
      if (r.consumable !== undefined) {
        cons = String(r.consumable).toLowerCase() === "true" || String(r.consumable).toLowerCase() === "yes" || r.consumable === true;
      }
      return { ...r, consumable: cons, id: r.id || `TOOL-IMP-${Date.now()}-${i}`, updatedAt: new Date() };
    });
    await db.insert(toolsTable).values(toInsert).onConflictDoUpdate({
      target: toolsTable.toolId,
      set: {
        toolName: sql`EXCLUDED.tool_name`,
        itemCode: sql`EXCLUDED.item_code`,
        inventoryId: sql`EXCLUDED.inventory_id`,
        category: sql`EXCLUDED.category`,
        location: sql`EXCLUDED.location`,
        condition: sql`EXCLUDED.condition`,
        qty: sql`EXCLUDED.qty`,
        remarks: sql`EXCLUDED.remarks`,
        referenceSpec: sql`EXCLUDED.reference_spec`,
        supplier: sql`EXCLUDED.supplier`,
        manufacturer: sql`EXCLUDED.manufacturer`,
        modelNumber: sql`EXCLUDED.model_number`,
        serialNumber: sql`EXCLUDED.serial_number`,
        lastUpdated: sql`EXCLUDED.last_updated`,
        updatedAt: new Date()
      }
    });
    res.json({ imported: toInsert.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
