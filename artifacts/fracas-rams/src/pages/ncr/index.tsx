import { useState, useRef } from "react";
import { format, isValid } from "date-fns";
import { Plus, Search, Edit, Trash2, ClipboardList, Download, Filter, X, Upload, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NcrForm } from "./ncr-form";
import Papa from "papaparse";

type Ncr = {
  id: string;
  sl?: string;
  ncrNumber: string;
  dateOfNcr?: string;
  dateOfDetection?: string;
  itemDescription?: string;
  ncrDescription?: string;
  partNumber?: string;
  faultySlNo?: string;
  healthySlNo?: string;
  issuedBy?: string;
  qty?: string;
  subSystem?: string;
  trainNo?: string;
  car?: string;
  responsibility?: string;
  status: string;
  itemRepairedRecouped?: string;
  itemReplaced?: string;
  source?: string;
  remarks?: string;
  vehicleNo?: string;
  supplier?: string;
  severity?: string;
  linkedJobCardNumber?: string;
  gatePassNo?: string;
  ncrClosedByDoc?: string;
  investigationReportDate?: string;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchNcr(): Promise<Ncr[]> {
  const res = await fetch(`${BASE}/api/ncr?limit=2000`);
  if (!res.ok) throw new Error("Failed to fetch NCR");
  return res.json();
}

async function deleteNcr(id: string) {
  const res = await fetch(`${BASE}/api/ncr/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete NCR");
}

async function importNcr(records: any[]): Promise<void> {
  const res = await fetch(`${BASE}/api/ncr/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });
  if (!res.ok) throw new Error("Import failed");
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  "OPEN": { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30", label: "Open" },
  "CLOSED": { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30", label: "Closed" },
  "CANCELED": { bg: "bg-gray-500/15", text: "text-gray-400", border: "border-gray-500/30", label: "Canceled" },
};

function fmtDate(raw?: string | null) {
  if (!raw) return "—";
  try {
    const d = new Date(raw + "T00:00:00");
    if (isValid(d)) return format(d, "dd MMM yyyy");
  } catch {}
  return raw;
}

function printNcr870(ncr: Ncr): void {
  const d = (v?: string | null) => fmtDate(v);
  const v = (val?: string | null) => val || "—";

  const html = `<!DOCTYPE html><html><head><title>NCR - ${ncr.ncrNumber}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:9.5pt;color:#000;background:#fff}
  .page{width:210mm;min-height:297mm;margin:0 auto;padding:10mm 14mm}
  .hdr{border:2px solid #000;padding:6px 10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center}
  .logo-box{display:flex;gap:8px;align-items:center}
  .logo{width:44px;height:44px;background:#E31E24;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:20pt}
  .brand-name{font-size:13pt;font-weight:bold;color:#E31E24}
  .brand-sub{font-size:7pt;color:#444}
  .doc-title{text-align:center;flex:1}
  .doc-title h1{font-size:15pt;font-weight:bold;letter-spacing:1px}
  .doc-title p{font-size:8pt;color:#555}
  .doc-ref{text-align:right;font-size:8pt;font-family:monospace}
  .doc-ref strong{font-size:11pt;display:block;color:#E31E24}
  table.meta{width:100%;border-collapse:collapse;margin-bottom:6px;font-size:9pt}
  table.meta td{border:1px solid #000;padding:3px 6px;vertical-align:top}
  table.meta td.lbl{background:#f0f0f0;font-weight:bold;width:130px;white-space:nowrap}
  .section{border:1px solid #000;margin-bottom:5px}
  .sec-hdr{background:#000;color:#fff;padding:3px 8px;font-weight:bold;font-size:9pt;letter-spacing:0.5px}
  .sec-body{padding:6px 8px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:4px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 12px;margin-bottom:4px}
  .fld label{font-size:8pt;font-weight:bold;color:#333;display:block}
  .fld .val{border-bottom:1px solid #888;min-height:14px;font-size:9pt;padding:1px 0}
  .desc-box{border:1px solid #888;min-height:48px;padding:4px 6px;font-size:9pt;white-space:pre-wrap;word-break:break-word}
  .check-row{display:flex;gap:20px;margin:4px 0}
  .chk-item{display:flex;align-items:center;gap:4px;font-size:9pt}
  .chk{width:14px;height:14px;border:1px solid #000;display:inline-flex;align-items:center;justify-content:center;font-size:8pt;flex-shrink:0}
  .sign-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
  .sign-blk{text-align:center}
  .sign-blk .line{border-top:1px solid #000;padding-top:2px;font-size:8pt;margin-top:20px}
  .decision-row{display:flex;flex-wrap:wrap;gap:12px;margin:4px 0}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:8mm 10mm}}
</style></head><body><div class="page">
  <div class="hdr">
    <div class="logo-box">
      <div class="logo">B</div>
      <div><div class="brand-name">BEML</div><div class="brand-sub">BHARAT EARTH MOVERS LTD.<br>Rolling Stock Division</div></div>
    </div>
    <div class="doc-title">
      <h1>NON-CONFORMITY REPORT</h1>
      <p>KMRCL RS-3R Rolling Stock · CPD Depot</p>
    </div>
    <div class="doc-ref">
      <strong>${ncr.ncrNumber}</strong>
      <div>FM/RS/NCR/01/00</div>
      <div>Distribution: OEM/SBU-S&M/R&D/PM/Quality</div>
    </div>
  </div>

  <table class="meta">
    <tr>
      <td class="lbl">Project</td><td>${v(ncr.vehicleNo ? "KMRCL RS-3R" : "KMRCL RS-3R")}</td>
      <td class="lbl">Vehicle No.</td><td>${v(ncr.vehicleNo)}</td>
      <td class="lbl">Product</td><td>${v(ncr.itemDescription)}</td>
    </tr>
    <tr>
      <td class="lbl">Part Number</td><td>${v(ncr.partNumber)}</td>
      <td class="lbl">Supplier</td><td>${v(ncr.responsibility)}</td>
      <td class="lbl">Qty.</td><td>${v(ncr.qty)}</td>
    </tr>
    <tr>
      <td class="lbl">Date of NCR</td><td>${d(ncr.dateOfNcr)}</td>
      <td class="lbl">Date of Detection</td><td>${d(ncr.dateOfDetection)}</td>
      <td class="lbl">Sub-System</td><td>${v(ncr.subSystem)}</td>
    </tr>
    <tr>
      <td class="lbl">Faulty Sl. No.</td><td>${v(ncr.faultySlNo)}</td>
      <td class="lbl">Healthy Sl. No.</td><td>${v(ncr.healthySlNo)}</td>
      <td class="lbl">Status</td><td><strong>${v(ncr.status)}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Severity</td>
      <td><strong>${v(ncr.severity)}</strong>&nbsp;
        <input type="checkbox" ${ncr.severity === "Major" ? "checked" : ""}>&nbsp;Major&nbsp;
        <input type="checkbox" ${ncr.severity !== "Major" ? "checked" : ""}>&nbsp;Minor
      </td>
      <td class="lbl">Place</td><td>CPD Depot</td>
      <td class="lbl">Stored At</td><td>CPD Depot</td>
    </tr>
  </table>

  <div class="section">
    <div class="sec-hdr">Description of Non-Conformity</div>
    <div class="sec-body">
      <div class="desc-box">${v(ncr.ncrDescription)}</div>
      <div class="sign-row" style="grid-template-columns:1fr 1fr;margin-top:8px">
        <div class="fld"><label>Date</label><div class="val">${d(ncr.dateOfNcr)}</div></div>
        <div class="fld"><label>Issued By</label><div class="val">${v(ncr.issuedBy)} — BEML (S&M)</div></div>
      </div>
      <div class="sign-row" style="grid-template-columns:1fr 1fr;margin-top:4px">
        <div class="fld"><label>Reviewed &amp; Approved By</label><div class="val">Shashi Shekhar Mishra</div></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="sec-hdr">Correction / Corrective Action Result</div>
    <div class="sec-body">
      <div class="desc-box" style="min-height:60px">&nbsp;</div>
      <div class="grid2" style="margin-top:6px">
        <div class="fld"><label>In (Healthy) Sl. No.</label><div class="val">${v(ncr.healthySlNo)}</div></div>
        <div class="fld"><label>Out (Faulty) Sl. No.</label><div class="val">${v(ncr.faultySlNo)}</div></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="sec-hdr">Decision &amp; Verification</div>
    <div class="sec-body">
      <div style="margin-bottom:6px"><strong>Decision:</strong></div>
      <div class="decision-row">
        ${["Claim","Holding","Use as is","Rework","Waiver","Scrap","Repair"].map(d =>
          `<div class="chk-item"><div class="chk">&nbsp;</div> ${d}</div>`
        ).join("")}
      </div>
      <div class="grid2" style="margin-top:6px">
        <div class="fld"><label>Repair Procedure Required</label><div class="val">Yes / No</div></div>
        <div class="fld"><label>Gate Pass S/No</label><div class="val">${v(ncr.gatePassNo)}</div></div>
      </div>
      <div class="fld" style="margin-top:4px"><label>NCR Closed By Document</label><div class="val">${v(ncr.ncrClosedByDoc)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="sec-hdr">Item Repair / Replacement Details</div>
    <div class="sec-body">
      <div class="grid3">
        <div class="fld"><label>Item Repaired/Recouped</label><div class="val">${v(ncr.itemRepairedRecouped)}</div></div>
        <div class="fld"><label>Item Replaced (If Any)</label><div class="val">${v(ncr.itemReplaced)}</div></div>
        <div class="fld"><label>Source</label><div class="val">${v(ncr.source)}</div></div>
      </div>
      <div class="fld" style="margin-top:4px"><label>Remarks</label><div class="val" style="min-height:18px">${v(ncr.remarks)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="sec-hdr">Approval &amp; Verification</div>
    <div class="sec-body">
      <div class="sign-row">
        <div class="sign-blk"><div class="line">BEML Site Engineer</div></div>
        <div class="sign-blk"><div class="line">Quality Assurance</div></div>
        <div class="sign-blk"><div class="line">Reviewed By</div></div>
        <div class="sign-blk"><div class="line">Approved By (BEML)</div></div>
      </div>
    </div>
  </div>

  <div style="text-align:center;font-size:8pt;color:#777;margin-top:8px">
    BEML Rolling Stock Division · KMRC RS-3R · ${ncr.ncrNumber} · IR Printed: ${ncr.irPrinted || "—"}
  </div>
</div>
<script>window.onload=()=>{window.print()}</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export default function NCR() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSubSystem, setFilterSubSystem] = useState("");
  const [filterTrainNo, setFilterTrainNo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ncr | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: ncrs = [], isLoading } = useQuery({ queryKey: ["ncr"], queryFn: fetchNcr });

  const deleteMutation = useMutation({
    mutationFn: deleteNcr,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ncr"] });
      toast({ title: "Deleted", description: "NCR record deleted." });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete NCR.", variant: "destructive" }),
  });

  // Derive unique values for filters
  const subSystems = Array.from(new Set(ncrs.map(n => n.subSystem).filter(Boolean))).sort() as string[];
  const trainNos = Array.from(new Set(ncrs.map(n => n.trainNo).filter(Boolean))).sort((a, b) => Number(a) - Number(b)) as string[];

  const filtered = ncrs.filter(n => {
    const q = search.toLowerCase();
    const m = !search ||
      n.ncrNumber.toLowerCase().includes(q) ||
      (n.itemDescription || "").toLowerCase().includes(q) ||
      (n.ncrDescription || "").toLowerCase().includes(q) ||
      (n.faultySlNo || "").toLowerCase().includes(q) ||
      (n.responsibility || "").toLowerCase().includes(q) ||
      (n.trainNo || "").includes(q) ||
      (n.car || "").toLowerCase().includes(q);
    const ms = !filterStatus || n.status === filterStatus;
    const mss = !filterSubSystem || n.subSystem === filterSubSystem;
    const mt = !filterTrainNo || n.trainNo === filterTrainNo;
    return m && ms && mss && mt;
  });

  const hasFilters = !!(filterStatus || filterSubSystem || filterTrainNo);

  const handleExport = () => {
    const csv = Papa.unparse(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `BEML_NCR_Export_${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        try {
          const records = results.data as any[];
          const res = await fetch(`${BASE}/api/ncr/import`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records }),
          });
          const data = await res.json();
          queryClient.invalidateQueries({ queryKey: ["ncr"] });
          toast({ title: `${data.imported} NCRs imported${data.failed ? ` (${data.failed} errors)` : ""}` });
        } catch (err: any) {
          toast({ title: "Import failed", description: err?.message, variant: "destructive" });
        }
      }
    });
  };

  // Summary counts
  const openCount = ncrs.filter(n => n.status === "OPEN").length;
  const closedCount = ncrs.filter(n => n.status === "CLOSED").length;
  const canceledCount = ncrs.filter(n => n.status === "CANCELED").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">NCR Management</h1>
          <p className="text-muted-foreground mt-1">Non-Conformity Reports · BEML RS-3R · KMRC Project</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={handleImport} id="ncr-import" />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="ncr-import" className="cursor-pointer"><Upload className="w-3.5 h-3.5 mr-1.5" />Import CSV</label>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" />Export CSV
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />New NCR
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total NCRs", value: ncrs.length, color: "text-foreground" },
          { label: "Open", value: openCount, color: "text-red-400" },
          { label: "Closed", value: closedCount, color: "text-green-400" },
          { label: "Canceled", value: canceledCount, color: "text-gray-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card/40 border-border/50 p-4">
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border/50">
        {/* Search + Filter Bar */}
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search NCR#, item, serial no., vendor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-background border-border/50"
              />
            </div>
            <Button
              variant="outline" size="sm"
              className={showFilters ? "bg-primary/10 text-primary border-primary/30" : ""}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1.5" />Filters
              {hasFilters && <span className="ml-1.5 w-2 h-2 rounded-full bg-primary inline-block" />}
            </Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-200">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="CANCELED">Canceled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSubSystem} onValueChange={setFilterSubSystem}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Sub-Systems" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sub-Systems</SelectItem>
                  {subSystems.slice(0, 30).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterTrainNo} onValueChange={setFilterTrainNo}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Trains" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Trains</SelectItem>
                  {trainNos.slice(0, 20).map(t => <SelectItem key={t} value={t}>TS#{String(t).padStart(2,"0")}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-9"
                  onClick={() => { setFilterStatus(""); setFilterSubSystem(""); setFilterTrainNo(""); }}>
                  <X className="w-4 h-4 mr-1" />Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* NCR Table — matches master list columns exactly */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-3 font-medium">SL.</th>
                <th className="px-3 py-3 font-medium">NCR Report No.</th>
                <th className="px-3 py-3 font-medium">Date of NCR</th>
                <th className="px-3 py-3 font-medium">Date of Detection</th>
                <th className="px-3 py-3 font-medium">Item Description</th>
                <th className="px-3 py-3 font-medium max-w-[200px]">NCR Description</th>
                <th className="px-3 py-3 font-medium">Sub-System</th>
                <th className="px-3 py-3 font-medium">Train No.</th>
                <th className="px-3 py-3 font-medium">Car</th>
                <th className="px-3 py-3 font-medium">Responsibility</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={12} className="px-6 py-8 text-center text-muted-foreground">Loading NCR records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={12} className="px-6 py-12 text-center text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  {search || hasFilters ? "No NCRs match your filters." : "No NCR records yet."}
                </td></tr>
              ) : (
                filtered.map(ncr => {
                  const sc = STATUS_COLORS[ncr.status] || STATUS_COLORS["OPEN"];
                  return (
                    <tr key={ncr.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors group">
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{ncr.sl || "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-[10px] font-medium text-primary whitespace-nowrap">{ncr.ncrNumber}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{fmtDate(ncr.dateOfNcr)}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{fmtDate(ncr.dateOfDetection)}</td>
                      <td className="px-3 py-2.5 text-xs font-medium max-w-[140px]">
                        <div className="truncate" title={ncr.itemDescription || ""}>{ncr.itemDescription || "—"}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs max-w-[220px]">
                        <div className="truncate text-muted-foreground" title={ncr.ncrDescription || ""}>{ncr.ncrDescription || "—"}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{ncr.subSystem || "—"}</td>
                      <td className="px-3 py-2.5 text-xs font-medium">
                        {ncr.trainNo ? `TS#${String(ncr.trainNo).padStart(2,"0")}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs">{ncr.car || "—"}</td>
                      <td className="px-3 py-2.5 text-xs max-w-[120px]">
                        <div className="truncate" title={ncr.responsibility || ""}>{ncr.responsibility || "—"}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sc.bg} ${sc.text} ${sc.border}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-blue-400"
                            onClick={() => printNcr870(ncr)} title="Print NCR (NCR-870 Format)">
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary"
                            onClick={() => { setEditing(ncr); setIsFormOpen(true); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"
                            onClick={() => { if (confirm("Delete this NCR?")) deleteMutation.mutate(ncr.id); }}>
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
        <div className="px-4 py-3 border-t border-border/50 bg-muted/10 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{ncrs.length}</span> NCR records
        </div>
      </Card>

      {isFormOpen && (
        <NcrForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editing as any}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["ncr"] })}
        />
      )}
    </div>
  );
}
