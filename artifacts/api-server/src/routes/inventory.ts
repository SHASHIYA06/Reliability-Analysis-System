import { Router, type IRouter } from "express";
import { db, inventoryTable, inventoryTransactionsTable } from "@workspace/db";
import { eq, desc, lt, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/inventory", async (req, res) => {
  try {
    const rows = await db.select().from(inventoryTable).orderBy(desc(inventoryTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/inventory/transactions", async (req, res) => {
  try {
    const rows = await db.select().from(inventoryTransactionsTable).orderBy(desc(inventoryTransactionsTable.timestamp));
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

    // Log creation as initial receipt if qty > 0
    if (row && row.qty > 0) {
      await db.insert(inventoryTransactionsTable).values({
        id: `TXN-${Date.now()}`,
        itemId: row.id,
        partNo: row.partNo,
        type: "Adjustment",
        qty: row.qty,
        qtyAfter: row.qty,
        remarks: "Initial stock registration",
        timestamp: new Date()
      });
    }

    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/inventory/:id", async (req, res) => {
  try {
    const rows = await db.select().from(inventoryTable).where(eq(inventoryTable.id, req.params.id));
    if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
    const old = rows[0];

    const body = { ...req.body, updatedAt: new Date() };
    delete body.id;
    delete body.createdAt;
    const [row] = await db.update(inventoryTable).set(body).where(eq(inventoryTable.id, req.params.id)).returning();

    // Log transaction if qty changed
    if (row && row.qty !== old.qty) {
      await db.insert(inventoryTransactionsTable).values({
        id: `TXN-${Date.now()}`,
        itemId: row.id,
        partNo: row.partNo,
        type: "Adjustment",
        qty: row.qty - old.qty,
        qtyBefore: old.qty,
        qtyAfter: row.qty,
        remarks: "Stock level manual adjustment",
        timestamp: new Date()
      });
    }

    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/inventory/transaction", async (req, res) => {
  try {
    const { itemId, type, qty, referenceId, referenceType, remarks } = req.body;
    const rows = await db.select().from(inventoryTable).where(eq(inventoryTable.id, itemId));
    if (!rows.length) { res.status(404).json({ error: "Item not found" }); return; }
    const item = rows[0];

    let newQty = item.qty;
    let newReserved = item.reservedQty;

    if (type === "Receipt" || type === "Return") {
      newQty += qty;
    } else if (type === "Issue") {
      newQty -= qty;
      // If issuing from a reservation
      if (referenceType === "NCR" || referenceType === "Job Card") {
        newReserved = Math.max(0, newReserved - qty);
      }
    } else if (type === "Reserve") {
      newReserved += qty;
    } else if (type === "Cancel-Reserve") {
      newReserved = Math.max(0, newReserved - qty);
    }

    const [updated] = await db.update(inventoryTable)
      .set({ qty: newQty, reservedQty: newReserved, updatedAt: new Date() })
      .where(eq(inventoryTable.id, itemId))
      .returning();

    const [txn] = await db.insert(inventoryTransactionsTable).values({
      id: `TXN-${Date.now()}`,
      itemId,
      partNo: item.partNo,
      type,
      qty,
      qtyBefore: item.qty,
      qtyAfter: newQty,
      referenceId,
      referenceType,
      remarks,
      timestamp: new Date()
    }).returning();

    res.json({ item: updated, transaction: txn });
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

    const toInsert = records.map((r, i) => ({
      ...r,
      id: r.id || `INV-IMP-${Date.now()}-${i}`,
      qty: Number(r.qty) || 0,
      minQty: Number(r.minQty) || 1,
      recommendedQty: Number(r.recommendedQty) || 5,
      isCritical: r.isCritical === "Y" || r.isCritical === 1 || r.isCritical === "1" ? 1 : 0,
      updatedAt: new Date()
    }));

    // Split into chunks to avoid parameter limits
    const CHUNK_SIZE = 50;
    let importedCount = 0;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      await db.insert(inventoryTable).values(chunk).onConflictDoUpdate({
        target: inventoryTable.id,
        set: {
          partNo: sql`EXCLUDED.part_no`,
          description: sql`EXCLUDED.description`,
          system: sql`EXCLUDED.system`,
          category: sql`EXCLUDED.category`,
          qty: sql`EXCLUDED.qty`,
          minQty: sql`EXCLUDED.min_qty`,
          recommendedQty: sql`EXCLUDED.recommended_qty`,
          unit: sql`EXCLUDED.unit`,
          location: sql`EXCLUDED.location`,
          vendor: sql`EXCLUDED.vendor`,
          unitCost: sql`EXCLUDED.unit_cost`,
          isCritical: sql`EXCLUDED.is_critical`,
          expiryDate: sql`EXCLUDED.expiry_date`,
          lastReceived: sql`EXCLUDED.last_received`,
          condition: sql`EXCLUDED.condition`,
          updatedAt: new Date()
        }
      });
      importedCount += chunk.length;
    }

    res.json({ imported: importedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/inventory/stats/low-stock", async (req, res) => {
  try {
    const rows = await db.select({
      id: inventoryTable.id,
      qty: inventoryTable.qty,
      minQty: inventoryTable.minQty,
      isCritical: inventoryTable.isCritical
    }).from(inventoryTable);

    const lowStock = rows.filter(r => r.qty <= r.minQty).length;
    const critical = rows.filter(r => r.qty === 0 && r.isCritical === 1).length;
    res.json({ lowStock, critical, total: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
