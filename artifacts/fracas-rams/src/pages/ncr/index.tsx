import { useState, useRef } from "react";
import { format } from "date-fns";
import { Plus, Search, Edit, Trash2, ClipboardList, Download, Filter, X, Upload, Printer, Eye } from "lucide-react";
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
  id: string; ncrNumber: string; projectName?: string; vehicleNumber?: string;
  productName?: string; supplier?: string; detectionDate?: string; place?: string;
  severity?: string; responsibleParty?: string; description: string;
  issuedBy?: string; issueDate?: string; status: string; decision?: string;
  linkedJobCardNumber?: string;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchNcr(): Promise<Ncr[]> {
  const res = await fetch(`${BASE}/api/ncr`);
  if (!res.ok) throw new Error("Failed to fetch NCR");
  return res.json();
}

async function deleteNcr(id: string) {
  const res = await fetch(`${BASE}/api/ncr/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete NCR");
}

const statusBadge: Record<string, { variant: any; label: string }> = {
  "open": { variant: "destructive", label: "Open" },
  "under-investigation": { variant: "secondary", label: "Under Investigation" },
  "corrective-action": { variant: "secondary", label: "Corrective Action" },
  "closed": { variant: "outline", label: "Closed" },
  "rejected": { variant: "outline", label: "Rejected" },
};

async function importNcr(records: any[]): Promise<void> {
  const res = await fetch(`${BASE}/api/ncr/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });
  if (!res.ok) throw new Error("Import failed");
}

function printNcr(ncr: Ncr): void {
  const date = (d?: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—";
  const content = `
    <html><head><title>NCR - ${ncr.ncrNumber}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10pt;color:#000;padding:15mm 20mm}
      .hdr{border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:flex-start}
      .brand{display:flex;gap:8px;align-items:center}.logo{width:40px;height:40px;background:#E31E24;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:18pt}
      .title{text-align:center;flex:1}.title h2{font-size:15pt;font-weight:bold;letter-spacing:2px}.title p{font-size:8pt;color:#555}
      .docref{text-align:right;font-size:8pt;font-family:monospace}
      .meta{display:flex;gap:20px;margin:8px 0;font-size:9pt;flex-wrap:wrap}
      .part{border:1px solid #000;margin-bottom:8px}.ph{background:#ddd;font-weight:bold;padding:3px 6px;border-bottom:1px solid #000;font-size:9pt}
      .pb{padding:6px 8px;font-size:9pt}.row{display:flex;gap:16px;margin-bottom:4px;flex-wrap:wrap}
      .fld{flex:1;min-width:150px}.fld label{font-weight:bold;display:block;font-size:8.5pt}.fld span{border-bottom:1px solid #aaa;display:block;min-height:14px;font-size:9pt}
      .desc{border:1px solid #aaa;min-height:36px;padding:3px;white-space:pre-wrap;font-size:9pt}
      .sig{display:flex;justify-content:space-between;margin-top:12px}.sblk{text-align:center;flex:1;margin:0 8px}
      .sblk span{display:block;border-top:1px solid #000;padding-top:2px;font-size:8pt}
      .sev{padding:2px 10px;border-radius:12px;font-weight:bold;font-size:9pt;${ncr.severity==="major"?"background:#ffe0e0;color:#c00":"background:#fff7e0;color:#a06000"}}
    </style></head><body>
      <div class="hdr">
        <div class="brand"><div class="logo">B</div><div><div style="font-weight:bold;color:#E31E24;font-size:13pt">BEML</div><div style="font-size:7pt">BHARAT EARTH MOVERS LTD.</div></div></div>
        <div class="title"><h2>NON-CONFORMITY REPORT</h2><p>KMRCL RS-3R Rolling Stock · ${ncr.projectName || "KMRC Project"}</p></div>
        <div class="docref"><div><strong>${ncr.ncrNumber}</strong></div><div>FM/RS/NCR/01/00</div></div>
      </div>
      <div class="meta">
        <span><strong>NCR Number:</strong> <b>${ncr.ncrNumber}</b></span>
        <span><strong>Date Raised:</strong> ${date(ncr.issueDate || ncr.detectionDate)}</span>
        <span><strong>Severity:</strong> <span class="sev">${(ncr.severity||"—").toUpperCase()}</span></span>
        <span><strong>Status:</strong> ${ncr.status?.toUpperCase() || "—"}</span>
      </div>
      <div class="part"><div class="ph">Section A: Non-Conformance Identification</div><div class="pb">
        <div class="row">
          <div class="fld"><label>Vehicle/Train Number</label><span>${ncr.vehicleNumber||"—"}</span></div>
          <div class="fld"><label>Product/Component</label><span>${ncr.productName||"—"}</span></div>
          <div class="fld"><label>Supplier/OEM</label><span>${ncr.supplier||"—"}</span></div>
        </div>
        <div class="row">
          <div class="fld"><label>Place of Detection</label><span>${ncr.place||"—"}</span></div>
          <div class="fld"><label>Date of Detection</label><span>${date(ncr.detectionDate)}</span></div>
          <div class="fld"><label>Responsible Party</label><span>${ncr.responsibleParty||"—"}</span></div>
        </div>
        <div style="margin-top:6px"><label style="font-weight:bold">Non-Conformance Description:</label>
          <div class="desc">${ncr.description||"—"}</div></div>
        ${ncr.linkedJobCardNumber ? `<div style="margin-top:4px"><strong>Linked Job Card:</strong> ${ncr.linkedJobCardNumber}</div>` : ""}
      </div></div>
      <div class="part"><div class="ph">Section B: Disposition & Decision</div><div class="pb">
        <div class="row">
          <div class="fld" style="min-width:300px"><label>Disposition Decision</label><span>${ncr.decision||"—"}</span></div>
        </div>
        <div style="margin-top:4px"><label style="font-weight:bold">Follow-up Action Required:</label>
          <div class="desc" style="min-height:24px">&nbsp;</div></div>
      </div></div>
      <div class="part"><div class="ph">Section C: Verification of Closure</div><div class="pb">
        <div class="row">
          <div class="fld"><label>Issued By</label><span>${ncr.issuedBy||"—"}</span></div>
          <div class="fld"><label>Issue Date</label><span>${date(ncr.issueDate)}</span></div>
        </div>
        <div class="sig">
          <div class="sblk"><span>BEML Site Engineer</span></div>
          <div class="sblk"><span>PPIO Shift Engineer</span></div>
          <div class="sblk"><span>Quality Assurance</span></div>
          <div class="sblk"><span>Date of Closure</span></div>
        </div>
      </div></div>
      <div style="text-align:center;font-size:8pt;color:#555;margin-top:8px">BEML Rolling Stock Division · KMRC RS-3R · ${ncr.ncrNumber}</div>
    </body></html>`;
  const w = window.open("","_blank");
  if(!w) return;
  w.document.write(content);
  w.document.close();
  setTimeout(()=>w.print(), 300);
}

export default function NCR() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
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
      toast({ title: "Deleted", description: "NCR deleted successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete NCR.", variant: "destructive" }),
  });

  const filtered = ncrs.filter(n => {
    const m = !search || n.ncrNumber.toLowerCase().includes(search.toLowerCase()) ||
      n.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase()) ||
      n.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      n.linkedJobCardNumber?.toLowerCase().includes(search.toLowerCase());
    const ms = !filterStatus || n.status === filterStatus;
    const mv = !filterSeverity || n.severity === filterSeverity;
    return m && ms && mv;
  });

  const handleExport = () => {
    const csv = Papa.unparse(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BEML_NCR_Export_${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
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
          await importNcr(records);
          queryClient.invalidateQueries({ queryKey: ["ncr"] });
          toast({ title: `${records.length} NCRs imported` });
        } catch (err: any) {
          toast({ title: "Import failed", description: err?.message, variant: "destructive" });
        }
      }
    });
  };

  const hasFilters = filterStatus || filterSeverity;

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
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => { setEditing(null); setIsFormOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-1.5" />New NCR
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total NCRs", value: ncrs.length, color: "text-foreground" },
          { label: "Open", value: ncrs.filter(n => n.status === "open").length, color: "text-destructive" },
          { label: "Under Investigation", value: ncrs.filter(n => n.status === "under-investigation").length, color: "text-amber-400" },
          { label: "Closed", value: ncrs.filter(n => n.status === "closed").length, color: "text-green-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card/40 border-border/50 p-4">
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border/50 shadow-lg shadow-black/20">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by NCR#, Vehicle, Supplier, JC#..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-background border-border/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className={showFilters ? "bg-primary/10 text-primary border-primary/30" : ""}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filters
              {hasFilters && <span className="ml-1.5 w-2 h-2 rounded-full bg-primary" />}
            </Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-200">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under-investigation">Under Investigation</SelectItem>
                  <SelectItem value="corrective-action">Corrective Action</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severity</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-9" onClick={() => { setFilterStatus(""); setFilterSeverity(""); }}>
                  <X className="w-4 h-4 mr-1" />Clear
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">NCR Number</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Vehicle / Product</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Linked JC</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">Loading NCR records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  {search || hasFilters ? "No NCRs match your filters." : "No NCR records yet. Create one using the button above."}
                </td></tr>
              ) : (
                filtered.map(ncr => {
                  const sb = statusBadge[ncr.status] || { variant: "outline", label: ncr.status };
                  return (
                    <tr key={ncr.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{ncr.ncrNumber}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {ncr.detectionDate ? format(new Date(ncr.detectionDate), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium">{ncr.vehicleNumber || "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{ncr.productName || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{ncr.supplier || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs truncate max-w-[200px]">{ncr.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        {ncr.severity && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                            ncr.severity === "major" ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }`}>
                            {ncr.severity.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{ncr.linkedJobCardNumber || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={sb.variant} className="text-[10px] uppercase tracking-wider">{sb.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-blue-400" onClick={() => printNcr(ncr)} title="Print / Save PDF">
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary" onClick={() => { setEditing(ncr); setIsFormOpen(true); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => { if (confirm("Delete this NCR?")) deleteMutation.mutate(ncr.id); }}>
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
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of <span className="font-medium text-foreground">{ncrs.length}</span> NCR records
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
