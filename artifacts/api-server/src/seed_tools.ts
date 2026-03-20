import { db, toolsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import fs from "fs";

async function main() {
    console.log("Reading seed data...");
    const data = JSON.parse(fs.readFileSync("/tmp/tools_seed.json", "utf-8"));

    const records = data.map((r: any) => ({
        id: `TOOL-SEED-${Date.now()}-${r.sl}`,
        toolId: `TL-${String(r.sl).padStart(3, '0')}`,
        toolName: r.name,
        toolNumber: null,
        category: r.type,
        location: r.place,
        condition: "Good",
        qty: r.qty,
        remarks: r.ref,
        updatedAt: new Date(),
    }));

    console.log(`Upserting ${records.length} tools...`);

    await db
        .insert(toolsTable)
        .values(records)
        .onConflictDoUpdate({
            target: toolsTable.toolId,
            set: {
                toolName: sql`EXCLUDED.tool_name`,
                category: sql`EXCLUDED.category`,
                location: sql`EXCLUDED.location`,
                qty: sql`EXCLUDED.qty`,
                remarks: sql`EXCLUDED.remarks`,
                updatedAt: new Date(),
            },
        });

    console.log("Seed successful.");
    process.exit(0);
}

main().catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
});
