import { useState, useRef, useMemo } from "react";
import { format } from "date-fns";
import Papa from "papaparse";
import {
  Plus, Search, Filter, Download, Upload, Trash2, Edit, X,
  AlertCircle, CheckCircle2, Info, FileText, ChevronLeft, ChevronRight, Eye
} from "lucide-react";
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
import { JobCardPrint } from "./job-card-print";
import { DEPOTS, SYSTEM_TAXONOMY, TRAIN_SETS } from "@/lib/taxonomy";

const PAGE_SIZE = 50;

// ─── CSV import utilities ─────────────────────────────────────────────────────
function normBool(v: any): boolean {
  if (!v) return false;
  return ["yes", "y", "true", "1"].includes(String(v).toLowerCase().trim());
}
function normClass(v: string): string {
  const s = (v || "").toLowerCase().replace(/[-_ ]/g, "");
  if (s.includes("service")) return "service-failure";
  if (s.includes("nonrelevant") || s.includes("notrelevant")) return "non-relevant";
  return "relevant";
}
function normStatus(v: string): string {
  const s = (v || "").toLowerCase();
  if (s.includes("progress") || s.includes("wip")) return "in-progress";
  if (s.includes("clos") || s.includes("done") || s.includes("complet")) return "closed";
  return "open";
}
function normDate(v: any): string {
  if (!v) return "";
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;
  const dmyS = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
  if (dmyS) return `20${dmyS[3]}-${dmyS[2].padStart(2,"0")}-${dmyS[1].padStart(2,"0")}`;
  return s;
}
function normHdr(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function parseCSVRaw(text: string): string[][] {
  const rows: string[][] = [];
  let r: string[] = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i+1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { r.push(cur); cur = ""; }
      else if (ch === '\n') { r.push(cur); rows.push(r); r = []; cur = ""; }
      else if (ch !== '\r') cur += ch;
    }
  }
  if (cur || r.length) { r.push(cur); rows.push(r); }
  return rows;
}

function buildColMap(headers: string[]): Record<string, number> {
  const nh = headers.map(normHdr);
  const map: Record<string, number> = {};
  const find = (kws: string[]) => nh.findIndex(h => kws.some(k => h.includes(k)));

  map.fracasNumber = find(["sn","serial no","s n","sl no"]) > -1 ? find(["sn","serial no"]) : 0;
  map.jobCardNumber = find(["jc no","job card no","jobcard"]);
  map.jobCardIssuedTo = find(["issued to","card issued to"]);
  for (let i=0;i<nh.length;i++) if(nh[i].includes("failure")&&nh[i].includes("date")&&!nh[i].includes("arrival")&&!nh[i].includes("complete")&&!nh[i].includes("issued")){map.failureDate=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("failure")&&nh[i].includes("time")&&!nh[i].includes("arrival")&&!nh[i].includes("complete")&&!nh[i].includes("issued")){map.failureTime=i;break;}
  for (let i=0;i<nh.length;i++) if((nh[i].includes("depot")||nh[i].includes("arriving"))&&nh[i].includes("date")){map.depotArrivalDate=i;break;}
  for (let i=0;i<nh.length;i++) if((nh[i].includes("depot")||nh[i].includes("arriving"))&&nh[i].includes("time")){map.depotArrivalTime=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("issued")&&nh[i].includes("time")&&!nh[i].includes("failure")&&!nh[i].includes("depot")){map.issuedTime=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("issued")&&nh[i].includes("date")&&!nh[i].includes("failure")&&!nh[i].includes("depot")&&!nh[i].includes("expected")){map.issuedDate=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("expected")&&nh[i].includes("date")){map.expectedCompleteDate=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("expected")&&nh[i].includes("time")){map.expectedCompleteTime=i;break;}
  map.reportingLocation = find(["reporting location","location"]);
  for (let i=0;i<nh.length;i++) if(nh[i].includes("cm")&&nh[i].includes("pm")&&nh[i].includes("opm")){map.orderType=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("odometer")||nh[i].includes("in kms")||nh[i].includes("odomet")){map.trainDistanceAtFailure=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("train")&&nh[i].includes("no")&&!nh[i].includes("set")){map.trainNumber=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i]==="car no"||nh[i]==="carno"||nh[i]==="car no "){map.carNumber=i;break;}
  if(!map.carNumber) for(let i=0;i<nh.length;i++) if(nh[i].includes("car no")&&!nh[i].includes("job")){map.carNumber=i;break;}
  map.failureDescription = find(["failure description","failure desc","descriptions","description"]);
  for (let i=0;i<nh.length;i++) if(nh[i].includes("work pending")){map.workPending=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("energi")){map.canBeEnergized=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("can be moved")||nh[i].includes("moved")&&!nh[i].includes("energi")){map.canBeMoved=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("withdraw")&&!nh[i].includes("reason")){map.withdrawalRequired=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("delay")&&!nh[i].includes("duration")&&!nh[i].includes("time")){map.delay=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("delay")&&nh[i].includes("time")){map.delayTime=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("service")&&(nh[i].includes("distin")||nh[i].includes("distiction"))){map.serviceDistinction=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("delay")&&nh[i].includes("duration")){map.delayDuration=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("service check")||(nh[i].includes("service")&&nh[i].includes("pm"))){map.serviceChecks=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i]==="system"||nh[i]==="system name"||nh[i]==="system code"){map.systemName=i;break;}
  if(!map.systemName) map.systemName = find(["system"]);
  for (let i=0;i<nh.length;i++) if(nh[i].includes("sub")&&nh[i].includes("system")){map.subsystemName=i;break;}
  map.equipment = find(["equipment name","equipments","equipment"]);
  map.component = find(["component"]);
  map.partNumber = find(["part no","part s ","part number"]);
  map.ncrNumber = find(["ncr no","ncr number"]);
  map.serialNumber = find(["serial no"]);
  map.failureLocation = find(["failure location","location rh"]);
  map.failureName = find(["failure name"]);
  map.actionTaken = find(["description of actions","action taken","actions taken"]);
  map.replaceChangeInfo = find(["replace","change info"]);
  for (let i=0;i<nh.length;i++) if(nh[i].includes("taken out")&&nh[i].includes("date")){map.partOutDate=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("taken out")&&nh[i].includes("serial")){map.partOutSerialNumber=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("taken in")&&nh[i].includes("date")){map.partInDate=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("taken in")&&nh[i].includes("serial")){map.partInSerialNumber=i;break;}
  map.carLiftingRequired = find(["car lifting"]);
  map.noOfMen = find(["no of men","number of men"]);
  for (let i=0;i<nh.length;i++) if(nh[i].includes("duration")&&(nh[i].includes("repair")||nh[i].includes("hr"))){map.repairDurationHours=i;break;}
  map.rootCause = find(["root cause"]);
  for (let i=0;i<nh.length;i++) if(nh[i].includes("close")&&nh[i].includes("date")){map.closeDate=i;break;}
  for (let i=0;i<nh.length;i++) if(nh[i].includes("close")&&nh[i].includes("time")){map.closeTime=i;break;}
  map.actionEndorsementName = find(["name of action","endorsement"]);
  map.failureCategory = find(["failure category","category"]);
  map.reportedBy = find(["reported by"]);
  map.inspector = find(["inspector"]);
  map.jobOperatingConditions = find(["job operating","operating condition"]);
  map.effectsOnTrainService = find(["effects on train","train service"]);
  map.depot = find(["depot name","depot"]);
  map.status = find(["status","job status"]);
  map.failureClass = find(["failure class","class","classification"]);
  map.notes = find(["notes","remarks"]);
  return map;
}

function mapRowToRecord(row: string[], colMap: Record<string, number>): Record<string, any> {
  const g = (f: string) => {
    const idx = colMap[f];
    if (idx === undefined || idx < 0 || idx >= row.length) return "";
    return String(row[idx] ?? "").trim();
  };
  const trainNumber = g("trainNumber");
  const dist = g("trainDistanceAtFailure");
  const repHours = g("repairDurationHours");
  const sysRaw = g("systemName");
  const SYS_MAP: Record<string,string> = { papis:"PAPIS",cctv:"CCTV",bogie:"BGE",gear:"BGE",brake:"BRK",ebcu:"BRK",door:"DOR",dcu:"DOR",vac:"ACU",hvac:"ACU",propulsion:"TRN",traction:"TRN",tcms:"TIM",atp:"TIM",underframe:"STR",psd:"PSD",fire:"FDS",vcc:"VCC",pa:"PAPIS",pneumatic:"BRK",compressor:"BRK" };
  const sl = sysRaw.toLowerCase();
  let sysCode = "GEN";
  for (const [k,v] of Object.entries(SYS_MAP)) if(sl.includes(k)){sysCode=v;break;}
  const issuedDate = normDate(g("issuedDate")) || normDate(g("failureDate")) || "";
  return {
    jobCardNumber: g("jobCardNumber") ? `JC-${g("jobCardNumber").replace(/\//g,"-")}` : undefined,
    fracasNumber: g("fracasNumber") || undefined,
    depot: g("depot") || "KMRCL",
    orderType: g("orderType") || undefined,
    trainNumber: trainNumber || undefined,
    trainId: trainNumber || undefined,
    carNumber: g("carNumber") || undefined,
    jobCardIssuedTo: g("jobCardIssuedTo") || undefined,
    reportedBy: g("reportedBy") || g("jobCardIssuedTo") || undefined,
    inspector: g("inspector") || undefined,
    issuedDate: issuedDate || undefined,
    issuedTime: g("issuedTime") || undefined,
    failureDate: normDate(g("failureDate")) || issuedDate || new Date().toISOString().substring(0,10),
    failureTime: g("failureTime") || undefined,
    depotArrivalDate: normDate(g("depotArrivalDate")) || undefined,
    depotArrivalTime: g("depotArrivalTime") || undefined,
    expectedCompleteDate: normDate(g("expectedCompleteDate")) || undefined,
    expectedCompleteTime: g("expectedCompleteTime") || undefined,
    closeDate: normDate(g("closeDate")) || undefined,
    closeTime: g("closeTime") || undefined,
    reportingLocation: g("reportingLocation") || undefined,
    trainDistanceAtFailure: dist ? parseFloat(dist.replace(/,/g,"")) : undefined,
    systemCode: sysCode,
    systemName: sysRaw || "General",
    subsystemCode: g("subsystemName") || undefined,
    subsystemName: g("subsystemName") || undefined,
    equipment: g("equipment") || undefined,
    component: g("component") || undefined,
    failureDescription: g("failureDescription") || "Not specified",
    failureName: g("failureName") || undefined,
    failureLocation: g("failureLocation") || undefined,
    failureClass: normClass(g("failureClass")),
    failureCategory: g("failureCategory") || undefined,
    ncrNumber: g("ncrNumber") || undefined,
    serialNumber: g("serialNumber") || undefined,
    jobOperatingConditions: g("jobOperatingConditions") || undefined,
    effectsOnTrainService: g("effectsOnTrainService") || undefined,
    workPending: normBool(g("workPending")),
    canBeEnergized: normBool(g("canBeEnergized")),
    canBeMoved: normBool(g("canBeMoved")),
    withdrawalRequired: normBool(g("withdrawalRequired")),
    delay: normBool(g("delay")),
    delayTime: g("delayTime") || undefined,
    serviceDistinction: g("serviceDistinction") || undefined,
    delayDuration: g("delayDuration") || undefined,
    serviceChecks: g("serviceChecks") || undefined,
    carLiftingRequired: normBool(g("carLiftingRequired")),
    noOfMen: g("noOfMen") ? parseInt(g("noOfMen")) : undefined,
    replaceChangeInfo: normBool(g("replaceChangeInfo")),
    partOutSerialNumber: g("partOutSerialNumber") || undefined,
    partOutDate: normDate(g("partOutDate")) || undefined,
    partInSerialNumber: g("partInSerialNumber") || undefined,
    partInDate: normDate(g("partInDate")) || undefined,
    actionTaken: g("actionTaken") || undefined,
    repairDurationHours: repHours ? parseFloat(repHours) : undefined,
    repairDurationMinutes: repHours ? Math.round(parseFloat(repHours)*60) : undefined,
    rootCause: g("rootCause") || undefined,
    actionEndorsementName: g("actionEndorsementName") || undefined,
    failureCategory2: g("failureCategory") || undefined,
    notes: g("notes") || undefined,
    status: normStatus(g("status")),
    reportDate: new Date().toISOString().substring(0,10),
  };
}

const EXPORT_COLS = [
  "jobCardNumber","fracasNumber","depot","orderType","trainNumber","trainSet","carNumber",
  "jobCardIssuedTo","reportedBy","inspector","organization",
  "issuedDate","issuedTime","failureDate","failureTime",
  "depotArrivalDate","depotArrivalTime","expectedCompleteDate","expectedCompleteTime",
  "closeDate","closeTime","reportingLocation","trainDistanceAtFailure",
  "systemCode","systemName","subsystemCode","subsystemName","equipment","component","failureDescription",
  "failureName","failureLocation","failureClass","failureCategory",
  "workPending","canBeEnergized","canBeMoved","withdrawalRequired","delay","delayTime",
  "serviceDistinction","delayDuration","serviceChecks","carLiftingRequired","noOfMen",
  "partInSerialNumber","partInDate","partOutSerialNumber","partOutDate","partNumber","ncrNumber","serialNumber",
  "repairDurationHours","repairDurationMinutes","rootCause","actionTaken","correctiveAction",
  "actionEndorsementName","actionEndorsementDate","status","notes",
];

const TEMPLATE_HEADERS = [
  "SN","JC No","Job Card Issued to","Failure Occurred Date","Failure Occurred Time",
  "Depot Arriving Date","Depot Arriving Time","Job Card Issued Time","Job card issued Date",
  "Expected Complete Date","Expected Complete Time","Reporting Location","CM/PM/OPM",
  "TRAIN ODOMETRE READING DATA (in kms)","Train No.","Car No","Failure Descriptions",
  "Work Pending? (Yes or No)","Can be energized ? (Yes or No)","Can be moved ? (Yes or No)",
  "Withdraw ? (Yes or No)","Delay ? (Yes or No)","Delay Time (DD/HH/MM)",
  "Reported By","Inspector","Job Operating Conditions","Effects on Train Service (Yes/No)",
  "Service Distiction (Case CM)","Delay Duration (Case CM)","Service Checks (Case PM)",
  "System","Sub-System","Equipments","Component","Part(s)","NCR No.","Serial No.",
  "Failure Location","Failure Name","Description of actions taken",
  "Replace / Change Info.(Yes or No)",
  "Components Taken Out Date","Serial No. of Components Taken Out",
  "Components Taken In Date","Serial No. of Components Taken In",
  "Car Lifting Required?(Yes or No)","No. of Men","Duration of Repair(hr)","Root Cause",
  "Job Card Close Date","Job Card Close Time","Name of Action Endorsement",
  "Date of Action Endorsement","Failure Category","status","failureClass",
];

export default function JobCards() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FailureReport | null>(null);
  const [viewingCard, setViewingCard] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDepot, setFilterDepot] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterTrainSet, setFilterTrainSet] = useState("");
  const [filterOrderType, setFilterOrderType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: failures = [], isLoading, refetch } = useListFailures();
  const deleteMutation = useDeleteFailure();
  const importMutation = useImportFailures();
  const { toast } = useToast();

  const filteredFailures = useMemo(() => {
    return (failures as any[]).filter((f: any) => {
      const matchSearch = !searchTerm || [
        f.jobCardNumber, f.fracasNumber, f.trainNumber, f.trainSet, f.carNumber,
        f.systemName, f.subsystemName, f.failureDescription, f.jobCardIssuedTo,
        f.reportedBy, f.depot, f.ncrNumber, f.failureName,
      ].some(v => v && String(v).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchDepot = !filterDepot || f.depot === filterDepot;
      const matchSystem = !filterSystem || f.systemCode === filterSystem || f.systemName === filterSystem;
      const matchStatus = !filterStatus || f.status === filterStatus;
      const matchClass = !filterClass || f.failureClass === filterClass;
      const matchTrainSet = !filterTrainSet || f.trainSet === filterTrainSet || f.trainNumber === filterTrainSet;
      const matchOrder = !filterOrderType || f.orderType === filterOrderType;
      const matchDateFrom = !filterDateFrom || f.failureDate >= filterDateFrom;
      const matchDateTo = !filterDateTo || f.failureDate <= filterDateTo;
      return matchSearch && matchDepot && matchSystem && matchStatus && matchClass && matchTrainSet && matchOrder && matchDateFrom && matchDateTo;
    });
  }, [failures, searchTerm, filterDepot, filterSystem, filterStatus, filterClass, filterTrainSet, filterOrderType, filterDateFrom, filterDateTo]);

  const totalPages = Math.ceil(filteredFailures.length / PAGE_SIZE);
  const pagedFailures = filteredFailures.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job card permanently?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Deleted" });
      refetch();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleExport = () => {
    const rows = (failures as any[]).map(f =>
      EXPORT_COLS.reduce((acc: any, col) => { acc[col] = (f as any)[col] ?? ""; return acc; }, {})
    );
    const csv = "\uFEFF" + Papa.unparse(rows, { columns: EXPORT_COLS });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BEML_FRACAS_Export_${format(new Date(),"yyyyMMdd_HHmm")}.csv`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = String(ev.target?.result || "").replace(/^\uFEFF/, "");
        const allRows = parseCSVRaw(text);
        if (allRows.length < 2) {
          toast({ title: "Empty file", variant: "destructive" }); return;
        }
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(5, allRows.length); i++) {
          const rowStr = allRows[i].join(" ").toLowerCase();
          if (rowStr.includes("jc no") || rowStr.includes("failure occurred") || rowStr.includes("train no") || rowStr.includes("failure description")) {
            headerRowIdx = i; break;
          }
        }
        const headerRow = allRows[headerRowIdx].map(h => String(h).trim());
        let dataStartIdx = headerRowIdx + 1;
        // Skip continuation header rows (rows where col 0 is not a number/SN and col 14/trainno area is empty)
        while (dataStartIdx < allRows.length) {
          const firstCell = String(allRows[dataStartIdx][0] || "").trim();
          if (firstCell && (firstCell !== "") && firstCell.toUpperCase() !== "(YES / NO)") break;
          dataStartIdx++;
        }
        const dataRows = allRows.slice(dataStartIdx).filter(r => r.some(c => c?.trim()));
        const colMap = buildColMap(headerRow);
        const records = dataRows.map(row => mapRowToRecord(row, colMap)).filter(r => r.failureDate);
        if (records.length === 0) {
          toast({ title: "No valid records found", variant: "destructive" }); return;
        }
        const result = await importMutation.mutateAsync({ data: { records } }) as any;
        setImportResult({ imported: result?.imported ?? records.length, failed: result?.failed ?? 0, errors: result?.errors ?? [], skipped: result?.skipped ?? 0 });
        toast({ title: `${result?.imported ?? records.length} records imported` });
        refetch();
        setPage(1);
      } catch (err: any) {
        toast({ title: "Import Failed", description: err?.message, variant: "destructive" });
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleDownloadTemplate = () => {
    const sampleRow = [
      "1","BEML-JC-202601-0001","AKHILESH KUMAR YADAV","15/01/2026","10:30",
      "15/01/2026","11:00","11:30","15/01/2026","16/01/2026","18:00","CPD","CM",
      "45000","MR601","1101","Door failed to close at R4 position",
      "No","Yes","Yes","No","Yes","00/00/02","AKHILESH KUMAR YADAV","ARAGHYA KAR",
      "Normal","Yes","6","2 Minutes","",
      "DOOR","DCU","Door Panel","Limit Switch","LS-0012A","NCR-001","SN-12345",
      "R4 Door","Door closure failure","Yes",
      "14/01/2026","ZO8071511","15/01/2026","ZO8422072",
      "No","3","1.5","Faulty limit switch",
      "16/01/2026","10:00","SHASHI SHEKHAR MISHRA","16/01/2026",
      "3","closed","relevant",
    ];
    const csv = "\uFEFF" + Papa.unparse({ fields: TEMPLATE_HEADERS, data: [sampleRow] });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "BEML_FRACAS_Import_Template.csv";
    link.click();
  };

  const clearFilters = () => {
    setFilterDepot(""); setFilterSystem(""); setFilterStatus("");
    setFilterClass(""); setFilterTrainSet(""); setFilterOrderType("");
    setFilterDateFrom(""); setFilterDateTo(""); setPage(1);
  };
  const hasFilters = filterDepot || filterSystem || filterStatus || filterClass || filterTrainSet || filterOrderType || filterDateFrom || filterDateTo;

  const classColor: Record<string, string> = {
    "service-failure": "bg-destructive/20 text-destructive border-destructive/30",
    "relevant": "bg-primary/20 text-primary border-primary/30",
    "non-relevant": "bg-muted text-muted-foreground border-border",
  };

  if (viewingCard) return <JobCardPrint data={viewingCard} onClose={() => setViewingCard(null)} />;

  return (
    <div className="space-y-4">
      {/* Title + Action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Cards</h1>
          <p className="text-xs text-muted-foreground mt-0.5">BEML FRACAS · RS-3R Rolling Stock · {(failures as any[]).length.toLocaleString()} total records</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="w-3.5 h-3.5 mr-1.5" />Template
          </Button>
          <div>
            <input ref={fileInputRef} type="file" id="csv-import" className="hidden" accept=".csv,.CSV" onChange={handleImport} />
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="csv-import" className="cursor-pointer">
                <Upload className="w-3.5 h-3.5 mr-1.5" />Import CSV
              </label>
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" />Export
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90"
            onClick={() => { setEditingCard(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />New Job Card
          </Button>
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 text-sm ${importResult.failed > 0 ? "bg-destructive/10 border-destructive/30" : "bg-green-500/10 border-green-500/30"}`}>
          {importResult.failed > 0 ? <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />}
          <div className="flex-1">
            <p className="font-medium">{importResult.imported} imported{importResult.skipped > 0 ? `, ${importResult.skipped} skipped` : ""}{importResult.failed > 0 ? `, ${importResult.failed} failed` : ""}</p>
            {importResult.errors.slice(0,3).map((e: string, i: number) => <p key={i} className="text-xs text-muted-foreground">• {e}</p>)}
          </div>
          <button onClick={() => setImportResult(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
      )}

      {/* Filters + Table */}
      <Card className="bg-card border-border/50 shadow-lg shadow-black/20">
        <div className="p-3 border-b border-border/50 bg-muted/20 space-y-3">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search JC#, FRACAS#, Train, Car, System, Description, NCR..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} className="pl-9 h-9 text-sm bg-background border-border/50" />
            </div>
            <Button variant="outline" size="sm" className={showFilters ? "bg-primary/10 border-primary/30 text-primary" : ""} onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-3.5 h-3.5 mr-1.5" />Filters{hasFilters && <span className="ml-1.5 w-2 h-2 rounded-full bg-primary" />}
            </Button>
            {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-3.5 h-3.5" /></Button>}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Select value={filterDepot || "__all__"} onValueChange={v => { setFilterDepot(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="All Depots" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Depots</SelectItem>
                  {DEPOTS.map(d => <SelectItem key={d.value} value={d.value}>{d.value}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterTrainSet || "__all__"} onValueChange={v => { setFilterTrainSet(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="All Trains" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Trains</SelectItem>
                  {TRAIN_SETS.map(ts => <SelectItem key={ts} value={ts}>{ts}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSystem || "__all__"} onValueChange={v => { setFilterSystem(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="All Systems" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Systems</SelectItem>
                  {SYSTEM_TAXONOMY.map(s => <SelectItem key={s.code} value={s.code}>{s.code}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterOrderType || "__all__"} onValueChange={v => { setFilterOrderType(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="All Orders" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Orders</SelectItem>
                  <SelectItem value="CM">CM — Corrective</SelectItem>
                  <SelectItem value="PM">PM — Preventive</SelectItem>
                  <SelectItem value="OPM">OPM — Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus || "__all__"} onValueChange={v => { setFilterStatus(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClass || "__all__"} onValueChange={v => { setFilterClass(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Classes</SelectItem>
                  <SelectItem value="relevant">Relevant</SelectItem>
                  <SelectItem value="non-relevant">Non-Relevant</SelectItem>
                  <SelectItem value="service-failure">Service Failure</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1 items-center col-span-2 md:col-span-2">
                <Input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }} className="h-8 text-xs bg-background" placeholder="From Date" />
                <span className="text-muted-foreground text-xs">—</span>
                <Input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }} className="h-8 text-xs bg-background" placeholder="To Date" />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-2 font-medium">FRACAS # / JC #</th>
                <th className="px-3 py-2 font-medium">Failure Date</th>
                <th className="px-3 py-2 font-medium">Issued To</th>
                <th className="px-3 py-2 font-medium">Train Set / Car</th>
                <th className="px-3 py-2 font-medium">System / Subsystem</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">KM</th>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Class</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Loading {(failures as any[]).length} records...</td></tr>
              ) : pagedFailures.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Info className="w-8 h-8 opacity-30" />
                    <p>{searchTerm || hasFilters ? "No records match your filters." : "No job cards. Import CSV or create new."}</p>
                  </div>
                </td></tr>
              ) : pagedFailures.map((failure: any) => {
                let dateDisplay = "—";
                try { if (failure.failureDate) dateDisplay = format(new Date(failure.failureDate + "T00:00:00"), "dd/MM/yyyy"); } catch {}
                return (
                  <tr key={failure.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => setViewingCard(failure)}>
                    <td className="px-3 py-2">
                      <div className="font-mono font-bold text-primary text-[10px]">{failure.fracasNumber || "—"}</div>
                      <div className="text-[9px] text-muted-foreground font-mono">{failure.jobCardNumber || "—"}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-medium">{dateDisplay}</div>
                      {failure.failureTime && <div className="text-[9px] text-muted-foreground">{failure.failureTime}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="truncate max-w-[100px]">{failure.jobCardIssuedTo || failure.reportedBy || "—"}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-mono font-medium">{failure.trainSet || failure.trainNumber || "—"}</div>
                      <div className="text-[9px] text-muted-foreground">{failure.carNumber || "—"}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{failure.systemName || failure.systemCode}</div>
                      <div className="text-[9px] text-muted-foreground">{failure.subsystemName || failure.subsystemCode || "—"}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="truncate max-w-[180px] text-[11px]">{failure.failureDescription}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right font-mono">
                      {failure.trainDistanceAtFailure != null ? Number(failure.trainDistanceAtFailure).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {failure.orderType && <span className="px-1.5 py-0.5 rounded border border-border text-[9px] font-mono">{failure.orderType}</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium border ${classColor[failure.failureClass] || classColor["relevant"]}`}>
                        {(failure.failureClass || "relevant").replace(/-/g," ")}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={failure.status === "open" ? "destructive" : failure.status === "in-progress" ? "secondary" : "outline"} className="text-[9px] uppercase">
                        {failure.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-blue-400" onClick={() => setViewingCard(failure)} title="View / Print">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => { setEditingCard(failure as FailureReport); setIsFormOpen(true); }} title="Edit">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(failure.id)} title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer + Pagination */}
        <div className="px-4 py-2 border-t border-border/50 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, filteredFailures.length)}</strong> of <strong className="text-foreground">{filteredFailures.length}</strong>
            {hasFilters && ` (filtered from ${(failures as any[]).length})`}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(1)}><ChevronLeft className="w-3 h-3" /><ChevronLeft className="w-3 h-3 -ml-2" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p-1)}><ChevronLeft className="w-3 h-3" /></Button>
            <span className="px-2">Page {page} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}><ChevronRight className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(totalPages)}><ChevronRight className="w-3 h-3" /><ChevronRight className="w-3 h-3 -ml-2" /></Button>
          </div>
        </div>
      </Card>

      {isFormOpen && (
        <JobCardForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editingCard}
          onSuccess={() => { refetch(); setPage(1); }}
        />
      )}
    </div>
  );
}
