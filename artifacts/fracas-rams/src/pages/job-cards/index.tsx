import { useState, useRef } from "react";
import { format } from "date-fns";
import Papa from "papaparse";
import { Plus, Search, Filter, Download, Upload, Trash2, Edit, X, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { 
  useListFailures, 
  useDeleteFailure, 
  useImportFailures,
  type FailureReport 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { JobCardForm } from "./job-card-form";
import { DEPOTS, SYSTEM_TAXONOMY, TRAIN_SETS } from "@/lib/taxonomy";

// ─── Utility functions ─────────────────────────────────────────────────────────

function normBool(v: any): boolean {
  if (v === null || v === undefined || v === "") return false;
  if (typeof v === "boolean") return v;
  return ["yes", "y", "true", "1", "✓", "x"].includes(String(v).toLowerCase().trim());
}

function normClass(v: string): string {
  const s = (v || "").toLowerCase().replace(/[-_ ]/g, "");
  if (s.includes("service")) return "service-failure";
  if (s.includes("nonrelevant") || s.includes("notrelevant") || s.includes("irrelevant")) return "non-relevant";
  return "relevant";
}

function normStatus(v: string): string {
  const s = (v || "").toLowerCase();
  if (s.includes("progress") || s.includes("wip") || s.includes("ongoing")) return "in-progress";
  if (s.includes("clos") || s.includes("done") || s.includes("complet") || s.includes("finish")) return "closed";
  return "open";
}

/** Convert DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD all → YYYY-MM-DD */
function normDate(v: any): string {
  if (!v) return "";
  const s = String(v).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
  return s;
}

/** Normalize a header cell to lowercase, no special chars, for keyword matching */
function normHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

// ─── Smart column index finder ────────────────────────────────────────────────
// Scans the header row and returns {fieldName: colIndex} using keyword matching.
// This avoids ALL issues with duplicate/renamed headers.

interface ColMap {
  [field: string]: number;
}

function buildColumnMap(headers: string[]): ColMap {
  const map: ColMap = {};
  const nh = headers.map(normHeader);

  function find(keywords: string[], must?: string): number {
    for (let i = 0; i < nh.length; i++) {
      const h = nh[i];
      if (must && !h.includes(must)) continue;
      if (keywords.some(k => h.includes(k))) return i;
    }
    return -1;
  }

  // SN / Serial No
  map.fracasNumber = find(["sn", "s n", "serial no", "sl no", "sr no"], undefined);
  if (map.fracasNumber === -1) map.fracasNumber = 0; // fallback: column 0

  // JC No
  map.jobCardNumber = find(["jc no", "job card no", "jobcard", "jc number"]);

  // Job Card Issued To
  map.jobCardIssuedTo = find(["issued to", "issuedto", "card issued to"]);

  // Failure Occurred Date — match "failure" + "date" OR "occurred date"
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("failure") && nh[i].includes("date") && !nh[i].includes("arrival") && !nh[i].includes("complete") && !nh[i].includes("issued")) {
      map.failureDate = i; break;
    }
  }
  if (map.failureDate === undefined) map.failureDate = find(["occurred date", "failure date"]);

  // Failure Occurred Time
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("failure") && nh[i].includes("time") && !nh[i].includes("arrival") && !nh[i].includes("complete") && !nh[i].includes("issued")) {
      map.failureTime = i; break;
    }
  }
  if (map.failureTime === undefined) map.failureTime = find(["occurred time", "failure time"]);

  // Depot Arriving Date
  for (let i = 0; i < nh.length; i++) {
    if ((nh[i].includes("depot") || nh[i].includes("arriving") || nh[i].includes("arrival")) && nh[i].includes("date")) {
      map.depotArrivalDate = i; break;
    }
  }

  // Depot Arriving Time
  for (let i = 0; i < nh.length; i++) {
    if ((nh[i].includes("depot") || nh[i].includes("arriving") || nh[i].includes("arrival")) && nh[i].includes("time")) {
      map.depotArrivalTime = i; break;
    }
  }

  // Job Card Issued Time
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("issued") && nh[i].includes("time") && !nh[i].includes("failure") && !nh[i].includes("depot")) {
      map.issuedTime = i; break;
    }
  }

  // Job Card Issued Date
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("issued") && nh[i].includes("date") && !nh[i].includes("failure") && !nh[i].includes("depot") && !nh[i].includes("expected")) {
      map.issuedDate = i; break;
    }
  }

  // Expected Complete Date
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("expected") && nh[i].includes("date")) { map.expectedCompleteDate = i; break; }
  }

  // Expected Complete Time
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("expected") && nh[i].includes("time")) { map.expectedCompleteTime = i; break; }
  }

  // Reporting Location
  map.reportingLocation = find(["reporting location", "location", "reporting loc"]);

  // CM/PM/OPM — Order Type
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("cm") && nh[i].includes("pm") && nh[i].includes("opm")) { map.orderType = i; break; }
    if (nh[i] === "order type" || nh[i] === "ordertype" || nh[i] === "cm pm opm") { map.orderType = i; break; }
  }

  // Odometer / Train KM
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("odometer") || nh[i].includes("odomet") || nh[i].includes("in kms") || nh[i].includes("km reading") || nh[i].includes("odometer reading")) {
      map.trainDistanceAtFailure = i; break;
    }
  }

  // Train No.
  for (let i = 0; i < nh.length; i++) {
    if ((nh[i].includes("train") && nh[i].includes("no")) && !nh[i].includes("train set") && !nh[i].includes("trainset")) {
      map.trainNumber = i; break;
    }
  }
  if (map.trainNumber === undefined) map.trainNumber = find(["train no", "trainno", "train number"]);

  // Train Set
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("train set") || nh[i] === "trainset" || nh[i] === "ts no") {
      map.trainSet = i; break;
    }
  }

  // Car No
  for (let i = 0; i < nh.length; i++) {
    if (nh[i] === "car no" || nh[i] === "carno" || nh[i] === "car number" || nh[i] === "car no ") {
      map.carNumber = i; break;
    }
  }
  if (map.carNumber === undefined) {
    for (let i = 0; i < nh.length; i++) {
      if (nh[i].includes("car no") && !nh[i].includes("work") && !nh[i].includes("job")) { map.carNumber = i; break; }
    }
  }

  // Failure Description
  map.failureDescription = find(["failure description", "description", "failure desc", "defect description"]);

  // Failure Class
  map.failureClass = find(["failure class", "classification", "class"]);

  // Work Pending
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("work pending") || (nh[i].includes("pending") && !nh[i].includes("energiz") && !nh[i].includes("moved"))) {
      map.workPending = i; break;
    }
  }

  // Can be Energized
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("energi")) { map.canBeEnergized = i; break; }
  }

  // Can be Moved
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("can be moved") || (nh[i].includes("moved") && !nh[i].includes("energi"))) { map.canBeMoved = i; break; }
  }

  // Withdrawal
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("withdraw") && !nh[i].includes("reason")) { map.withdrawalRequired = i; break; }
  }

  // Withdrawal Reason
  map.withdrawalReason = find(["withdrawal reason", "withdraw reason"]);

  // Delay?
  for (let i = 0; i < nh.length; i++) {
    if (nh[i] === "delay" || nh[i].includes("delay ?") || (nh[i].includes("delay") && nh[i].includes("yes") && !nh[i].includes("duration"))) {
      map.delay = i; break;
    }
  }

  // Service Distinction
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("service") && (nh[i].includes("distin") || nh[i].includes("distiction") || nh[i].includes("distinction"))) {
      map.serviceDistinction = i; break;
    }
  }

  // Delay Duration
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("delay") && nh[i].includes("duration")) { map.delayDuration = i; break; }
  }

  // Service Checks (PM)
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("service check") || (nh[i].includes("service") && nh[i].includes("pm") && nh[i].includes("check"))) {
      map.serviceChecks = i; break;
    }
  }

  // System
  for (let i = 0; i < nh.length; i++) {
    if (nh[i] === "system" || nh[i] === "system name" || nh[i] === "system code") { map.systemCode = i; break; }
  }
  if (map.systemCode === undefined) map.systemCode = find(["system"]);

  // Sub-System
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("sub") && nh[i].includes("system")) { map.subsystemCode = i; break; }
  }
  if (map.subsystemCode === undefined) map.subsystemCode = find(["subsystem"]);

  // Equipment
  for (let i = 0; i < nh.length; i++) {
    if (nh[i] === "equipment" || nh[i] === "equipment name" || nh[i].startsWith("equipment")) { map.equipment = i; break; }
  }

  // Depot (often not in standard BEML CSV, but included in some versions)
  map.depot = find(["depot name", "depot", "base depot"]);

  // Failure Class
  map.failureClass = map.failureClass ?? find(["class", "failure class"]);

  // Part In/Out Serial Numbers
  for (let i = 0; i < nh.length; i++) {
    if ((nh[i].includes("part") || nh[i].includes("sr")) && (nh[i].includes("in") || nh[i].includes("fitted")) && !nh[i].includes("out")) {
      map.partInSerialNumber = i; break;
    }
  }
  for (let i = 0; i < nh.length; i++) {
    if ((nh[i].includes("part") || nh[i].includes("sr")) && (nh[i].includes("out") || nh[i].includes("removed")) && !nh[i].includes(" in ")) {
      map.partOutSerialNumber = i; break;
    }
  }

  // Root Cause
  map.rootCause = find(["root cause", "rootcause", "cause of failure"]);

  // Action Taken
  map.actionTaken = find(["action taken", "action", "corrective action", "remedy"]);

  // Repair Duration
  map.repairDurationMinutes = find(["repair duration", "repair time", "duration minutes", "time taken"]);

  // Status
  map.status = find(["status", "job status", "card status"]);

  // Part Replaced
  map.partReplaced = find(["part replaced", "part name", "replaced part"]);

  // SIC Required
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("sic") && !nh[i].includes("verif")) { map.sicRequired = i; break; }
  }

  // Power Block
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].includes("power block")) { map.powerBlockRequired = i; break; }
  }

  // Notes / Remarks
  map.notes = find(["notes", "remarks", "remark", "comments"]);

  // Organisation
  map.organization = find(["organisation", "organization", "org"]);

  return map;
}

function getCellValue(row: string[], colIndex: number | undefined): string {
  if (colIndex === undefined || colIndex < 0 || colIndex >= row.length) return "";
  return (row[colIndex] ?? "").trim();
}

/** Build a job card record from a raw row using the column map */
function mapRowToRecord(row: string[], colMap: ColMap): Record<string, any> {
  const g = (field: string) => getCellValue(row, colMap[field]);

  const trainNumber = g("trainNumber") || g("trainSet") || "";
  const trainSet = g("trainSet") || g("trainNumber") || "";

  const systemRaw = g("systemCode");
  const subsystemRaw = g("subsystemCode");

  const failureDateRaw = g("failureDate");
  const failureDate = normDate(failureDateRaw) || new Date().toISOString().substring(0, 10);

  const distanceRaw = g("trainDistanceAtFailure");
  const distance = distanceRaw ? parseFloat(distanceRaw.replace(/,/g, "")) : undefined;

  const repairRaw = g("repairDurationMinutes");
  const repairMins = repairRaw ? parseInt(repairRaw) : undefined;

  const jcNumber = g("jobCardNumber");
  const sn = g("fracasNumber");

  // Map system to code/name using known systems
  const systemMap: Record<string, string> = {
    "traction": "TRN", "brake": "BRK", "door": "DOR", "air conditioning": "ACU",
    "hvac": "ACU", "ac": "ACU", "bogie": "BGE", "tims": "TIM", "communication": "COM",
    "fire": "FDS", "vcs": "VCS", "auxiliary": "AUX", "lighting": "LIT",
    "gangway": "GAN", "structure": "STR", "general": "GEN", "pantograph": "PAN",
    "coupler": "CPL", "passenger": "PIS",
  };
  const sysNorm = systemRaw.toLowerCase();
  let sysCode = systemRaw;
  let sysName = systemRaw;
  for (const [keyword, code] of Object.entries(systemMap)) {
    if (sysNorm.includes(keyword)) { sysCode = code; sysName = systemRaw; break; }
  }
  if (!sysCode) { sysCode = "GEN"; sysName = "General"; }

  return {
    jobCardNumber: jcNumber || undefined,
    fracasNumber: sn || undefined,
    depot: g("depot") || undefined,
    orderType: g("orderType") || undefined,
    trainNumber: trainNumber || undefined,
    trainId: trainNumber || undefined,
    trainSet: trainSet || undefined,
    carNumber: g("carNumber") || undefined,
    jobCardIssuedTo: g("jobCardIssuedTo") || undefined,
    organization: g("organization") || undefined,
    issuedDate: normDate(g("issuedDate")) || undefined,
    issuedTime: g("issuedTime") || undefined,
    failureDate,
    failureTime: g("failureTime") || undefined,
    depotArrivalDate: normDate(g("depotArrivalDate")) || undefined,
    depotArrivalTime: g("depotArrivalTime") || undefined,
    expectedCompleteDate: normDate(g("expectedCompleteDate")) || undefined,
    expectedCompleteTime: g("expectedCompleteTime") || undefined,
    reportingLocation: g("reportingLocation") || undefined,
    trainDistanceAtFailure: isNaN(distance as number) ? undefined : distance,
    systemCode: sysCode,
    systemName: sysName,
    subsystemCode: subsystemRaw || undefined,
    subsystemName: subsystemRaw || undefined,
    equipment: g("equipment") || undefined,
    failureDescription: g("failureDescription") || "Not specified",
    failureClass: normClass(g("failureClass")),
    workPending: normBool(g("workPending")),
    canBeEnergized: normBool(g("canBeEnergized")),
    canBeMoved: normBool(g("canBeMoved")),
    withdrawalRequired: normBool(g("withdrawalRequired")),
    withdrawalReason: g("withdrawalReason") || undefined,
    delay: normBool(g("delay")),
    serviceDistinction: g("serviceDistinction") || undefined,
    delayDuration: g("delayDuration") || undefined,
    serviceChecks: g("serviceChecks") || undefined,
    partReplaced: g("partReplaced") || undefined,
    partInSerialNumber: g("partInSerialNumber") || undefined,
    partOutSerialNumber: g("partOutSerialNumber") || undefined,
    repairDurationMinutes: isNaN(repairMins as number) ? undefined : repairMins,
    rootCause: g("rootCause") || undefined,
    actionTaken: g("actionTaken") || undefined,
    correctiveAction: g("actionTaken") || undefined,
    sicRequired: normBool(g("sicRequired")),
    powerBlockRequired: normBool(g("powerBlockRequired")),
    notes: g("notes") || undefined,
    status: normStatus(g("status")),
    reportDate: new Date().toISOString().substring(0, 10),
  };
}

// ─── Export column list ───────────────────────────────────────────────────────
const EXPORT_COLUMNS = [
  "jobCardNumber", "fracasNumber", "depot", "orderType",
  "trainNumber", "trainSet", "carNumber", "jobCardIssuedTo", "organization",
  "issuedDate", "issuedTime",
  "failureDate", "failureTime",
  "depotArrivalDate", "depotArrivalTime",
  "expectedCompleteDate", "expectedCompleteTime",
  "reportingLocation", "trainDistanceAtFailure",
  "systemCode", "systemName", "subsystemCode", "subsystemName", "equipment",
  "failureDescription", "failureClass",
  "workPending", "canBeEnergized", "canBeMoved",
  "withdrawalRequired", "withdrawalReason", "scenarioCode",
  "delay", "serviceDistinction", "delayDuration", "serviceChecks",
  "mainLineAction", "inspectionInCharge", "sicRequired", "powerBlockRequired",
  "partReplaced", "partNumber", "partInSerialNumber", "partOutSerialNumber",
  "repairDurationMinutes", "rootCause", "actionTaken", "correctiveAction",
  "notes", "status",
];

// ─── Template CSV (matches BEML job card column format) ───────────────────────
const TEMPLATE_HEADERS = [
  "SN", "JC No", "Job Card Issued to", "Failure Occurred Date", "Failure Occurred Time",
  "Depot Arriving Date", "Depot Arriving Time", "Job Card Issued Time", "Job card issued Date",
  "Expected Complete Date", "Expected Complete Time", "Reporting Location", "CM/PM/OPM",
  "TRAIN ODOMETRE READING DATA (in kms)", "Train No.", "Car No", "Failure Descriptions",
  "Work Pending? (Yes or No)", "Can be energized ? (Yes or No)", "Can be moved ? (Yes or No)",
  "Withdraw ? (Yes or No)", "Delay ? (Yes or No)",
  "Service Distiction (Case CM)", "Delay Duration (Case CM)", "Service Checks (Case PM)",
  "System", "Sub-System", "Equipment", "failureClass", "Depot", "status",
  "Root Cause", "Action Taken", "Repair Duration (minutes)",
  "Part In Sr No", "Part Out Sr No",
];

const TEMPLATE_SAMPLE = [
  "1", "BEML-JC-202601-0001", "AKHILESH KUMAR YADAV",
  "15/01/2026", "10:30", "15/01/2026", "11:00", "11:30", "15/01/2026",
  "16/01/2026", "18:00", "CPD", "CM",
  "45000", "RS-3R-01", "DMC1", "Door failed to close",
  "No", "Yes", "Yes", "No", "Yes",
  "6", "2-min", "",
  "DOR", "DOR-01", "Door Panel", "relevant", "KMRCL", "closed",
  "Faulty door sensor", "Replaced door sensor", "45",
  "SN-IN-123456", "SN-OUT-654321",
];

export default function JobCards() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FailureReport | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDepot, setFilterDepot] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterTrainSet, setFilterTrainSet] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: string[]; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: failures = [], isLoading, refetch } = useListFailures();
  const deleteMutation = useDeleteFailure();
  const importMutation = useImportFailures();
  const { toast } = useToast();

  const filteredFailures = failures.filter(f => {
    const fa = f as any;
    const matchSearch = !searchTerm ||
      f.jobCardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.trainNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.systemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.failureDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fa.fracasNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fa.trainSet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fa.carNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fa.jobCardIssuedTo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDepot = !filterDepot || fa.depot === filterDepot;
    const matchSystem = !filterSystem || f.systemCode === filterSystem;
    const matchStatus = !filterStatus || f.status === filterStatus;
    const matchClass = !filterClass || f.failureClass === filterClass;
    const matchTrainSet = !filterTrainSet || fa.trainSet === filterTrainSet || f.trainNumber === filterTrainSet;
    return matchSearch && matchDepot && matchSystem && matchStatus && matchClass && matchTrainSet;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job card permanently?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Deleted", description: "Job card deleted." });
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const handleExport = () => {
    const rows = failures.map(f => {
      const fa = f as any;
      return EXPORT_COLUMNS.reduce((acc: any, col) => {
        acc[col] = fa[col] ?? "";
        return acc;
      }, {});
    });
    const csv = Papa.unparse(rows, { columns: EXPORT_COLUMNS });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BEML_FRACAS_Export_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── CSV Import (array mode — bypasses duplicate header issue) ──────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setImportResult(null);

    // Parse as raw array (no header processing) to avoid duplicate-header renaming
    Papa.parse(file, {
      header: false,
      skipEmptyLines: "greedy",
      complete: async (results) => {
        const allRows = results.data as string[][];
        if (!allRows || allRows.length < 2) {
          toast({ title: "Import Failed", description: "File is empty or has no data rows.", variant: "destructive" });
          return;
        }

        // ── Find the header row (scan first 5 rows for row with BEML column keywords)
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(5, allRows.length); i++) {
          const rowStr = allRows[i].join(" ").toLowerCase();
          if (
            rowStr.includes("jc no") ||
            rowStr.includes("failure occurred") ||
            rowStr.includes("train no") ||
            rowStr.includes("failure description") ||
            rowStr.includes("jobcardnumber") ||
            rowStr.includes("jobc")
          ) {
            headerRowIdx = i;
            break;
          }
        }

        const headerRow = allRows[headerRowIdx].map(h => String(h).trim());
        const dataRows = allRows.slice(headerRowIdx + 1);

        if (dataRows.length === 0) {
          toast({ title: "Import Failed", description: "No data rows found after the header.", variant: "destructive" });
          return;
        }

        // ── Build column map
        const colMap = buildColumnMap(headerRow);
        console.log("[Import] Detected column map:", colMap);
        console.log("[Import] Header row:", headerRow);
        console.log("[Import] Data rows count:", dataRows.length);

        // ── Map each data row to a record
        const records: Record<string, any>[] = [];
        for (const row of dataRows) {
          if (row.every(c => !c || String(c).trim() === "")) continue; // skip blank rows
          const record = mapRowToRecord(row, colMap);
          records.push(record);
        }

        if (records.length === 0) {
          toast({ title: "Import Failed", description: "No valid records found in the file.", variant: "destructive" });
          return;
        }

        console.log("[Import] Mapped records sample:", records[0]);

        try {
          const result = await importMutation.mutateAsync({ data: { records } }) as any;
          const imported = result?.imported ?? records.length;
          const failed = result?.failed ?? 0;
          const errors = result?.errors ?? [];
          const skipped = result?.skipped ?? 0;

          setImportResult({ imported, failed, errors, skipped });

          toast({
            title: failed === 0 ? "Import Successful" : "Import Completed with Errors",
            description: `${imported} imported${skipped > 0 ? `, ${skipped} skipped` : ""}${failed > 0 ? `, ${failed} failed` : ""}.`,
            variant: failed > 0 ? "destructive" : "default",
          });
          refetch();
        } catch (err: any) {
          console.error("[Import] API error:", err);
          toast({
            title: "Import Failed",
            description: err?.message || "Server error — check console for details.",
            variant: "destructive",
          });
        }
      },
      error: (err: any) => {
        toast({ title: "Parse Error", description: err.message || "Could not read the file.", variant: "destructive" });
      }
    });
  };

  // ─── Download CSV Template ──────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const csv = Papa.unparse({ fields: TEMPLATE_HEADERS, data: [TEMPLATE_SAMPLE] });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "BEML_FRACAS_Import_Template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const classColor: Record<string, string> = {
    "service-failure": "bg-destructive/20 text-destructive border-destructive/30",
    "relevant": "bg-primary/20 text-primary border-primary/30",
    "non-relevant": "bg-muted text-muted-foreground border-border",
  };

  const clearFilters = () => {
    setFilterDepot(""); setFilterSystem(""); setFilterStatus("");
    setFilterClass(""); setFilterTrainSet("");
  };
  const hasFilters = filterDepot || filterSystem || filterStatus || filterClass || filterTrainSet;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Job Cards</h1>
          <p className="text-muted-foreground mt-1">BEML FRACAS — Failure Reporting & Corrective Action System · RS-3R</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="border-border hover:bg-accent" onClick={handleDownloadTemplate}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            CSV Template
          </Button>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              id="csv-upload-main"
              className="hidden"
              accept=".csv,.CSV"
              onChange={handleImport}
            />
            <Button variant="outline" size="sm" className="border-border hover:bg-accent" asChild>
              <label htmlFor="csv-upload-main" className="cursor-pointer">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Import CSV
              </label>
            </Button>
          </div>
          <Button variant="outline" size="sm" className="border-border hover:bg-accent" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            onClick={() => { setEditingCard(null); setIsFormOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Job Card
          </Button>
        </div>
      </div>

      {/* Import Result Banner */}
      {importResult && (
        <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 text-sm ${importResult.failed > 0 ? "bg-destructive/10 border-destructive/30" : "bg-green-500/10 border-green-500/30"}`}>
          {importResult.failed > 0 ? (
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium">
              {importResult.imported} records imported
              {importResult.skipped > 0 && `, ${importResult.skipped} skipped`}
              {importResult.failed > 0 && `, ${importResult.failed} failed`}
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
                {importResult.errors.slice(0, 5).map((e, i) => <li key={i} className="truncate">• {e}</li>)}
                {importResult.errors.length > 5 && <li>...and {importResult.errors.length - 5} more errors</li>}
              </ul>
            )}
          </div>
          <button onClick={() => setImportResult(null)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters + Table */}
      <Card className="bg-card border-border/50 shadow-lg shadow-black/20">
        <div className="p-4 border-b border-border/50 flex flex-col gap-4 bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search JC#, Train, System, Description, Technician..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background border-border/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                className={`border-border ${showFilters ? "bg-primary/10 text-primary border-primary/30" : ""}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1.5" />
                Filters
                {hasFilters && <span className="ml-1.5 w-2 h-2 rounded-full bg-primary" />}
              </Button>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <Select value={filterDepot} onValueChange={setFilterDepot}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Depots" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Depots</SelectItem>
                  {DEPOTS.map(d => <SelectItem key={d.value} value={d.value}>{d.value}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterTrainSet} onValueChange={setFilterTrainSet}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Trains" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Trains</SelectItem>
                  {TRAIN_SETS.map(ts => <SelectItem key={ts} value={ts}>{ts}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSystem} onValueChange={setFilterSystem}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Systems" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Systems</SelectItem>
                  {SYSTEM_TAXONOMY.map(s => <SelectItem key={s.code} value={s.code}>{s.code} — {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  <SelectItem value="relevant">Relevant</SelectItem>
                  <SelectItem value="non-relevant">Non-Relevant</SelectItem>
                  <SelectItem value="service-failure">Service Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">JC # / FRACAS #</th>
                <th className="px-4 py-3 font-medium">Failure Date</th>
                <th className="px-4 py-3 font-medium">Train / Car</th>
                <th className="px-4 py-3 font-medium">Depot / KM</th>
                <th className="px-4 py-3 font-medium">System / Description</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">Loading records...</td></tr>
              ) : filteredFailures.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Info className="w-8 h-8 opacity-40" />
                    <p>{searchTerm || hasFilters ? "No records match your filters." : "No job cards yet. Create one or import a CSV file."}</p>
                    {!searchTerm && !hasFilters && (
                      <p className="text-xs">Use the <strong>CSV Template</strong> button to download the correct import format.</p>
                    )}
                  </div>
                </td></tr>
              ) : (
                filteredFailures.map((failure) => {
                  const fa = failure as any;
                  let dateDisplay = "—";
                  try { dateDisplay = format(new Date(failure.failureDate + "T00:00:00"), "dd MMM yyyy"); } catch {}
                  return (
                    <tr key={failure.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-mono font-medium text-primary text-xs">{failure.jobCardNumber}</div>
                        {fa.fracasNumber && <div className="text-[10px] text-muted-foreground font-mono">SN: {fa.fracasNumber}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <div>{dateDisplay}</div>
                        {failure.failureTime && <div className="text-[10px] text-muted-foreground">{failure.failureTime}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-medium">{fa.trainSet || failure.trainNumber}</div>
                        {fa.carNumber && <div className="text-[10px] text-muted-foreground">{fa.carNumber}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">{fa.depot || "—"}</div>
                        {fa.trainDistanceAtFailure != null && (
                          <div className="text-[10px] text-muted-foreground">{Number(fa.trainDistanceAtFailure).toLocaleString()} km</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-xs">{failure.systemName}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5">{failure.failureDescription}</div>
                      </td>
                      <td className="px-4 py-3">
                        {fa.orderType && (
                          <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground font-mono">{fa.orderType}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${classColor[failure.failureClass] || classColor["relevant"]}`}>
                          {failure.failureClass.replace(/-/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={failure.status === "open" ? "destructive" : failure.status === "in-progress" ? "secondary" : "outline"}
                          className="uppercase text-[10px] tracking-wider"
                        >
                          {failure.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => { setEditingCard(failure); setIsFormOpen(true); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(failure.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border/50 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <span className="font-medium text-foreground">{filteredFailures.length}</span> of{" "}
            <span className="font-medium text-foreground">{failures.length}</span> records
          </span>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive" onClick={clearFilters}>
              <X className="w-3 h-3 mr-1" />Clear filters
            </Button>
          )}
        </div>
      </Card>

      {isFormOpen && (
        <JobCardForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editingCard}
          onSuccess={() => { refetch(); setImportResult(null); }}
        />
      )}
    </div>
  );
}
