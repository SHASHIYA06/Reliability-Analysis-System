/**
 * BEML NCR Master List Import Script
 * Source: NCRs_master_list_as_on_date_11.02.26
 * Imports NCR records into ncr_reports table
 * Run: node scripts/import-ncr-masterlist.mjs
 */
import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pg = require("/home/runner/workspace/lib/db/node_modules/pg");
import { randomUUID } from "crypto";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not found");

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

// === Minimal CSV parser (handles quoted fields with commas/newlines) ===
function parseCSV(text) {
  const rows = [];
  let r = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ',') {
      r.push(cur); cur = "";
    } else if (ch === '\n') {
      r.push(cur); rows.push(r); r = []; cur = "";
    } else if (ch !== '\r') {
      cur += ch;
    }
  }
  if (cur || r.length) { r.push(cur); rows.push(r); }
  return rows;
}

const CSV_FILE = path.join(__dirname, "../attached_assets/NCRs_master_list_as_on_date_11.02.26_1773549490387.csv");
const raw = readFileSync(CSV_FILE, "utf8").replace(/^\uFEFF/, ""); // strip BOM
const allRows = parseCSV(raw);
const header = allRows[0].map(h => h.trim());
const dataRows = allRows.slice(1);

console.log(`Headers: [${header.slice(0,10).join(", ")}...]`);
console.log(`Total data rows: ${dataRows.length}`);

// Map header to index
function idx(name) {
  const i = header.indexOf(name);
  return i >= 0 ? i : -1;
}
function get(row, name) {
  const i = idx(name);
  const val = i >= 0 && i < row.length ? row[i] : "";
  return val?.trim() === "" || val?.trim() === "___" ? null : val?.trim() || null;
}

// Date parser: "03/May/18" → "2018-05-03"
const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
function parseDate(raw) {
  if (!raw) return null;
  raw = raw.trim();
  const m1 = raw.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})$/);
  if (m1) {
    const day = parseInt(m1[1]);
    const mon = MONTHS[m1[2].toLowerCase()];
    const yr = m1[3].length === 2 ? 2000 + parseInt(m1[3]) : parseInt(m1[3]);
    if (mon && day && yr > 2000) return `${yr}-${String(mon).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }
  const m2 = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m2) {
    const day = parseInt(m2[1]), mon = parseInt(m2[2]);
    const yr = m2[3].length === 2 ? 2000 + parseInt(m2[3]) : parseInt(m2[3]);
    if (yr > 2000) return `${yr}-${String(mon).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }
  return raw;
}

function normalizeStatus(raw) {
  const v = (raw || "").trim().toUpperCase();
  if (v === "CLOSED") return "CLOSED";
  if (v === "CANCELED" || v === "CANCELLED") return "CANCELED";
  return "OPEN";
}

// Clear table
console.log("Clearing existing NCR records...");
await client.query("DELETE FROM ncr_reports");

let imported = 0, skipped = 0;
const errors = [];

for (const row of dataRows) {
  const ncrNum = get(row, "NCR REPORT NO.");
  if (!ncrNum) { skipped++; continue; }

  const trainNo = get(row, "Train No") || get(row, " Train No");
  const car = get(row, "CAR");
  const trainNoNum = trainNo ? trainNo.replace(/[^0-9]/g, "").padStart(2,"0") : null;
  const vehicleNo = [trainNoNum ? `TS#${trainNoNum}` : null, car].filter(Boolean).join(" ") || null;

  try {
    await client.query(`
      INSERT INTO ncr_reports (
        id, ncr_number, sl,
        date_of_ncr, date_of_detection,
        item_description, ncr_description,
        part_number, modified_or_unmodified_fmi, failure_after_fmi,
        faulty_sl_no, healthy_sl_no,
        issued_by, qty,
        sub_system, train_no, car,
        responsibility, status,
        item_repaired_recouped, item_replaced, date_of_repaired_replaced,
        source, investigation_report_date,
        ncr_closed_by_doc, gate_pass_no,
        remarks, ir_printed,
        vehicle_no, project_name,
        created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        NOW(),NOW()
      )
      ON CONFLICT (ncr_number) DO UPDATE SET
        date_of_ncr = EXCLUDED.date_of_ncr,
        item_description = EXCLUDED.item_description,
        ncr_description = EXCLUDED.ncr_description,
        status = EXCLUDED.status,
        updated_at = NOW()
    `, [
      randomUUID(), ncrNum,
      get(row, "SL."),
      parseDate(get(row, "DATE OF NCR ")),
      parseDate(get(row, "DATE  OF DETECTION")),
      get(row, "ITEM DESCRIPTION"),
      get(row, "NCR Description"),
      get(row, "Part Number"),
      get(row, "Modified or Unmodified\nFMI") || get(row, "Modified or Unmodified FMI"),
      get(row, "Failure After FMI"),
      get(row, "Faulty Sl. No."),
      get(row, "Healthy Sl. No."),
      get(row, "ISSUED BY"),
      get(row, "Qty."),
      get(row, "SUB-SYSTEM"),
      trainNo,
      car,
      get(row, "RESPONSIBILITY (VENDOR/BEML)"),
      normalizeStatus(get(row, "STATUS")),
      get(row, "ITEM REPAIRED/ RECOUPED"),
      get(row, "ITEM REPLACED (IF ANY)"),
      parseDate(get(row, "DATE OF REPAIRED/REPLACED")),
      get(row, "SOURCE"),
      parseDate(get(row, "DATE OF INVESTIGATION REPORT RECEIVED")),
      get(row, "NCR CLOSED BY DOC.,"),
      get(row, "GATE PASS           S/No"),
      get(row, "Remarks"),
      get(row, "IR Printed"),
      vehicleNo,
      "KMRCL RS-3R",
    ]);
    imported++;
    if (imported % 500 === 0) console.log(`  Imported ${imported}...`);
  } catch (e) {
    errors.push(`${ncrNum}: ${e.message?.substring(0, 100)}`);
    if (errors.length <= 3) console.error(`  Error: ${ncrNum}: ${e.message?.substring(0,100)}`);
  }
}

await client.end();
console.log(`\n=== NCR Import Complete ===`);
console.log(`  Imported: ${imported}`);
console.log(`  Skipped (no NCR#): ${skipped}`);
console.log(`  Errors: ${errors.length}`);
if (errors.length > 0 && errors.length <= 10) errors.forEach(e => console.log(" ", e));
