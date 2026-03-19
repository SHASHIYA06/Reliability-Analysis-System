import { Router, type IRouter } from "express";
import { db, toolsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/tools", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(toolsTable)
      .orderBy(desc(toolsTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/tools/:id", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(toolsTable)
      .where(eq(toolsTable.id, req.params.id));

    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tools", async (req, res) => {
  try {
    const body = req.body || {};

    const data = {
      id: body.id || `TOOL-${Date.now()}`,
      toolId: body.toolId ?? body.tool_id,
      toolName: body.toolName ?? body.tool_name,
      toolNumber: body.toolNumber ?? body.tool_number ?? null,
      category: body.category ?? null,
      location: body.location ?? null,
      condition: body.condition ?? "Good",
      calibrationDue: body.calibrationDue ?? body.calibration_due ?? null,
      issuedTo: body.issuedTo ?? body.issued_to ?? null,
      issuedDate: body.issuedDate ?? body.issued_date ?? null,
      remarks: body.remarks ?? null,
      qty: body.qty != null ? Number(body.qty) : 1,
      updatedAt: new Date(),
    };

    if (!data.toolId || !data.toolName) {
      res.status(400).json({ error: "toolId and toolName are required" });
      return;
    }

    const [row] = await db.insert(toolsTable).values(data).returning();
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/tools/:id", async (req, res) => {
  try {
    const body = req.body || {};

    const data: any = {
      updatedAt: new Date(),
    };

    if (body.toolId !== undefined || body.tool_id !== undefined) {
      data.toolId = body.toolId ?? body.tool_id;
    }
    if (body.toolName !== undefined || body.tool_name !== undefined) {
      data.toolName = body.toolName ?? body.tool_name;
    }
    if (body.toolNumber !== undefined || body.tool_number !== undefined) {
      data.toolNumber = body.toolNumber ?? body.tool_number;
    }
    if (body.category !== undefined) data.category = body.category;
    if (body.location !== undefined) data.location = body.location;
    if (body.condition !== undefined) data.condition = body.condition;
    if (body.calibrationDue !== undefined || body.calibration_due !== undefined) {
      data.calibrationDue = body.calibrationDue ?? body.calibration_due;
    }
    if (body.issuedTo !== undefined || body.issued_to !== undefined) {
      data.issuedTo = body.issuedTo ?? body.issued_to;
    }
    if (body.issuedDate !== undefined || body.issued_date !== undefined) {
      data.issuedDate = body.issuedDate ?? body.issued_date;
    }
    if (body.remarks !== undefined) data.remarks = body.remarks;
    if (body.qty !== undefined) data.qty = Number(body.qty);

    const [row] = await db
      .update(toolsTable)
      .set(data)
      .where(eq(toolsTable.id, req.params.id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

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

    if (!records?.length) {
      res.status(400).json({ error: "No records" });
      return;
    }

    const toInsert = records.map((r, i) => ({
      id: r.id || `TOOL-IMP-${Date.now()}-${i}`,
      toolId: r.toolId ?? r.tool_id,
      toolName: r.toolName ?? r.tool_name,
      toolNumber: r.toolNumber ?? r.tool_number ?? null,
      category: r.category ?? null,
      location: r.location ?? null,
      condition: r.condition ?? "Good",
      calibrationDue: r.calibrationDue ?? r.calibration_due ?? null,
      issuedTo: r.issuedTo ?? r.issued_to ?? null,
      issuedDate: r.issuedDate ?? r.issued_date ?? null,
      remarks: r.remarks ?? null,
      qty: r.qty != null ? Number(r.qty) : 1,
      updatedAt: new Date(),
    }));

    const validRows = toInsert.filter((r) => r.toolId && r.toolName);

    if (!validRows.length) {
      res.status(400).json({ error: "No valid records. toolId and toolName are required." });
      return;
    }

    await db
      .insert(toolsTable)
      .values(validRows)
      .onConflictDoUpdate({
        target: toolsTable.toolId,
        set: {
          toolName: sql`EXCLUDED.tool_name`,
          toolNumber: sql`EXCLUDED.tool_number`,
          category: sql`EXCLUDED.category`,
          location: sql`EXCLUDED.location`,
          condition: sql`EXCLUDED.condition`,
          calibrationDue: sql`EXCLUDED.calibration_due`,
          issuedTo: sql`EXCLUDED.issued_to`,
          issuedDate: sql`EXCLUDED.issued_date`,
          remarks: sql`EXCLUDED.remarks`,
          qty: sql`EXCLUDED.qty`,
          updatedAt: new Date(),
        },
      });

    res.json({ imported: validRows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
