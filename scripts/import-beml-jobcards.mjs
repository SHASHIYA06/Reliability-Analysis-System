/**
 * BEML Master Job Card Import Script
 * Reads the attached CSV, clears existing data, and imports all records.
 * Run: node scripts/import-beml-jobcards.mjs
 */
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pg = require("/home/runner/workspace/lib/db/node_modules/pg");
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_FILE = join(__dirname, "..", "attached_assets", "BEML_Master_Job_card_details_as_on_05.03.26_(TS#01_to_14)_1773485868635.csv");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let r = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { r.push(cur); cur = ""; }
      else if (ch === '\n') { r.push(cur); rows.push(r); r = []; cur = ""; }
      else if (ch === '\r') {}
      else cur += ch;
    }
  }
  if (cur || r.length) { r.push(cur); rows.push(r); }
  return rows;
}

// ─── Date Normalizer ──────────────────────────────────────────────────────────
function normDate(v) {
  if (!v || !String(v).trim()) return null;
  const s = String(v).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  // DD/MM/YYYY
  const dmySlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmySlash) return `${dmySlash[3]}-${dmySlash[2].padStart(2,"0")}-${dmySlash[1].padStart(2,"0")}`;
  // DD/MM/YY (2-digit year → assume 20XX)
  const dmyShort = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (dmyShort) return `20${dmyShort[3]}-${dmyShort[2].padStart(2,"0")}-${dmyShort[1].padStart(2,"0")}`;
  // DD-MM-YYYY
  const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dmyDash) return `${dmyDash[3]}-${dmyDash[2].padStart(2,"0")}-${dmyDash[1].padStart(2,"0")}`;
  // DD.MM.YYYY
  const dmyDot = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dmyDot) return `${dmyDot[3]}-${dmyDot[2].padStart(2,"0")}-${dmyDot[1].padStart(2,"0")}`;
  // Try JS Date
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
  return null;
}

function normBool(v) {
  if (!v) return false;
  const s = String(v).toLowerCase().trim();
  // "_" is used as a checkbox/mark in BEML CSV format to indicate "Yes"
  if (s === "_") return true;
  return ["yes", "y", "true", "1"].includes(s);
}

function normText(v) {
  const s = String(v || "").trim();
  return s || null;
}

function normNum(v) {
  if (!v) return null;
  const n = parseFloat(String(v).replace(/,/g, "").trim());
  return isNaN(n) ? null : n;
}

function normInt(v) {
  if (!v) return null;
  const n = parseInt(String(v).trim());
  return isNaN(n) ? null : n;
}

// Map train number to train set
function mapTrainSet(trainNo) {
  if (!trainNo) return null;
  const m = trainNo.match(/MR(\d+)/i);
  if (m) {
    const n = parseInt(m[1]) - 600;
    if (n > 0 && n <= 17) return `TS${String(n).padStart(2, "0")}`;
  }
  return trainNo;
}

// Map system name to code
const SYS_CODE_MAP = {
  "papis": "PAPIS", "fdi": "PAPIS", "tni": "PAPIS", "cctv": "CCTV",
  "bogie": "BGE", "gear": "BGE",
  "brake": "BRK", "ebcu": "BRK", "compressor": "BRK", "pneumatic": "BRK",
  "door": "DOR", "dcu": "DOR",
  "vac": "ACU", "hvac": "ACU", "air conditioning": "ACU",
  "propulsion": "TRN", "traction": "TRN",
  "tcms": "TIM", "atp": "TIM", "ato": "TIM",
  "underframe": "STR",
  "communication": "COM", "psd": "PSD",
  "fire": "FDS",
  "vcc": "VCC",
  "pa": "PAPIS",
};

function getSysCode(sysName) {
  if (!sysName) return "GEN";
  const sl = sysName.toLowerCase();
  for (const [key, code] of Object.entries(SYS_CODE_MAP)) {
    if (sl.includes(key)) return code;
  }
  return sysName.toUpperCase().substring(0, 6) || "GEN";
}

/**
 * Parse delay duration into minutes.
 * Handles: "00/00/03" (DD/HH/MM) → 3 min, "3 MINS" → 3, "0.5" hr → 30, etc.
 */
function parseDelayMinutes(delayTime, delayDuration) {
  for (const raw of [delayTime, delayDuration]) {
    if (!raw || String(raw).trim() === "_" || String(raw).trim() === "") continue;
    const s = String(raw).trim();

    // DD/HH/MM format: "00/00/05" → 5 mins
    const dhm = s.match(/^(\d+)\/(\d+)\/(\d+)$/);
    if (dhm) {
      const mins = parseInt(dhm[1]) * 1440 + parseInt(dhm[2]) * 60 + parseInt(dhm[3]);
      if (mins > 0) return mins;
    }
    // "X MINS" or "X MIN"
    const minMatch = s.match(/^(\d+)\s*min/i);
    if (minMatch) return parseInt(minMatch[1]);
    // "X HOURS" or "Xhr"
    const hrMatch = s.match(/^(\d+(?:\.\d+)?)\s*h(?:r|ours?)?/i);
    if (hrMatch) return Math.round(parseFloat(hrMatch[1]) * 60);
    // Just a number — treat as minutes
    const n = parseFloat(s);
    if (!isNaN(n) && n > 0 && n < 1440) return Math.round(n);
  }
  return null;
}

// Generate FRACAS number
let fracasCounter = 1;
function genFracasNumber(sn, issuedDate) {
  const d = issuedDate ? new Date(issuedDate) : new Date("2020-02-14");
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const num = String(fracasCounter++).padStart(5, "0");
  return `FRACAS-RS3R-${year}${month}-${num}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Reading CSV...");
  const raw = readFileSync(CSV_FILE, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCSV(raw);
  console.log(`Total rows (with header): ${rows.length}`);

  // Row 0 = title, Row 1 = headers, Row 2+ = data
  const headers = rows[1];
  // Skip blank rows; include rows where SN is a number OR "NIL" (mainline incidents)
  const dataRows = rows.slice(2).filter(r => {
    const sn = String(r[0] || "").trim();
    return sn && (sn !== "SN") && r.some(c => c && String(c).trim());
  });
  console.log(`Data rows to import: ${dataRows.length}`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Clear all existing failures
    console.log("Clearing existing job cards...");
    const { rowCount: deleted } = await client.query("DELETE FROM failures");
    console.log(`Deleted ${deleted} existing records`);

    // Import in batches
    const BATCH = 100;
    let imported = 0, skipped = 0;

    for (let i = 0; i < dataRows.length; i += BATCH) {
      const batch = dataRows.slice(i, i + BATCH);
      for (const row of batch) {
        const c = (idx) => normText(row[idx]);
        const issuedDate = normDate(c(8)) || normDate(c(3)) || "2020-01-01";
        const failureDate = normDate(c(3)) || normDate(c(5)) || issuedDate;
        const trainNo = c(14);
        const sysName = c(30) || "General";
        const jcNum = c(1) ? `JC-${String(c(1)).replace(/\//g, "-")}` : null;
        const sn = c(0);

        // Repair duration: col 47 is in hours
        const repHours = normNum(c(47));
        const repMins = repHours != null ? Math.round(repHours * 60) : null;

        const record = {
          id: randomUUID(),
          job_card_number: jcNum,
          fracas_number: genFracasNumber(sn, issuedDate),
          train_id: trainNo || "UNASSIGNED",
          train_number: trainNo || "",
          train_set: mapTrainSet(trainNo),
          car_number: c(15),
          depot: "KMRCL",
          reporting_location: c(11),
          order_type: c(12),
          job_card_issued_to: c(2),
          reported_by: c(23),
          inspector: c(24),
          organization: "BEML",
          issued_date: issuedDate,
          issued_time: c(7),
          failure_date: failureDate,
          failure_time: c(4),
          depot_arrival_date: normDate(c(5)),
          depot_arrival_time: c(6),
          expected_complete_date: normDate(c(9)),
          expected_complete_time: c(10),
          close_date: normDate(c(49)),
          close_time: c(50),
          report_date: issuedDate,
          location: c(11),
          system_code: getSysCode(sysName),
          system_name: sysName,
          subsystem_code: c(31),
          subsystem_name: c(31),
          equipment: c(32),
          component: c(33),
          equipment_part_number: c(34),
          failure_description: c(16) || "Not specified",
          failure_name: c(38),
          failure_location: c(37),
          failure_class: "relevant",
          failure_category: c(53),
          job_operating_conditions: c(25),
          effects_on_train_service: c(26),
          ncr_number: c(35),
          serial_number: c(36),
          work_pending: normBool(c(17)),
          can_be_energized: normBool(c(18)),
          can_be_moved: normBool(c(19)),
          withdrawal_required: normBool(c(20)),
          withdrawal_reason: null,
          delay: normBool(c(21)),
          delay_time: c(22),
          service_distinction: c(27),
          delay_duration: c(28),
          delay_minutes: parseDelayMinutes(c(22), c(28)),
          service_checks: c(29),
          car_lifting_required: normBool(c(45)),
          no_of_men: normInt(c(46)),
          part_out_serial_number: c(42),
          part_out_date: normDate(c(41)),
          part_in_serial_number: c(44),
          part_in_date: normDate(c(43)),
          part_replaced: c(40) === "YES" || c(40) === "Yes" || c(40) === "1" ? c(33) || c(34) : null,
          part_number: c(34),
          replace_change_info: normBool(c(40)),
          action_taken: c(39),
          repair_duration_hours: repHours,
          repair_duration_minutes: repMins,
          train_distance_at_failure: normNum(c(13)),
          root_cause: c(48),
          corrective_action: c(39),
          action_endorsement_name: c(51),
          action_endorsement_date: normDate(c(52)),
          status: "closed",
          notes: null,
        };

        try {
          await client.query(`
            INSERT INTO failures (
              id, job_card_number, fracas_number,
              train_id, train_number, train_set, car_number,
              depot, reporting_location, order_type,
              job_card_issued_to, reported_by, inspector, organization,
              issued_date, issued_time, failure_date, failure_time,
              depot_arrival_date, depot_arrival_time,
              expected_complete_date, expected_complete_time,
              close_date, close_time, report_date, location,
              system_code, system_name, subsystem_code, subsystem_name,
              equipment, component, equipment_part_number,
              failure_description, failure_name, failure_location,
              failure_class, failure_category, job_operating_conditions,
              effects_on_train_service, ncr_number, serial_number,
              work_pending, can_be_energized, can_be_moved,
              withdrawal_required, delay, delay_time,
              service_distinction, delay_duration,
              service_checks, car_lifting_required, no_of_men,
              part_out_serial_number, part_out_date,
              part_in_serial_number, part_in_date,
              part_replaced, part_number, replace_change_info,
              action_taken, repair_duration_hours, repair_duration_minutes,
              train_distance_at_failure, root_cause, corrective_action,
              action_endorsement_name, action_endorsement_date,
              status
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
              $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
              $31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,
              $45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,
              $59,$60,$61,$62,$63,$64,$65,$66,$67,$68,$69
            )
            ON CONFLICT (job_card_number) DO NOTHING
          `, [
            record.id, record.job_card_number, record.fracas_number,
            record.train_id, record.train_number, record.train_set, record.car_number,
            record.depot, record.reporting_location, record.order_type,
            record.job_card_issued_to, record.reported_by, record.inspector, record.organization,
            record.issued_date, record.issued_time, record.failure_date, record.failure_time,
            record.depot_arrival_date, record.depot_arrival_time,
            record.expected_complete_date, record.expected_complete_time,
            record.close_date, record.close_time, record.report_date, record.location,
            record.system_code, record.system_name, record.subsystem_code, record.subsystem_name,
            record.equipment, record.component, record.equipment_part_number,
            record.failure_description, record.failure_name, record.failure_location,
            record.failure_class, record.failure_category, record.job_operating_conditions,
            record.effects_on_train_service, record.ncr_number, record.serial_number,
            record.work_pending, record.can_be_energized, record.can_be_moved,
            record.withdrawal_required, record.delay, record.delay_time,
            record.service_distinction, record.delay_duration,
            record.service_checks, record.car_lifting_required, record.no_of_men,
            record.part_out_serial_number, record.part_out_date,
            record.part_in_serial_number, record.part_in_date,
            record.part_replaced, record.part_number, record.replace_change_info,
            record.action_taken, record.repair_duration_hours, record.repair_duration_minutes,
            record.train_distance_at_failure, record.root_cause, record.corrective_action,
            record.action_endorsement_name, record.action_endorsement_date,
            record.status,
          ]);
          imported++;
        } catch (e) {
          skipped++;
          if (skipped <= 5) console.error(`  Skip row SN=${sn}:`, e.message.substring(0, 100));
        }
      }
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH, dataRows.length)}/${dataRows.length} (${imported} imported, ${skipped} skipped)`);
    }

    await client.query("COMMIT");
    console.log(`\n\n✅ Import complete! ${imported} records imported, ${skipped} skipped.`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Import failed:", e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
