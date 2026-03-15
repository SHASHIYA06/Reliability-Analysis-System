import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowRightLeft, Plus, Search, Download, Printer, CheckCircle, Edit2, Trash2, MoreVertical, Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TRAIN_NUMBERS, CAR_NUMBERS, BEML_USERS } from "@/lib/taxonomy";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GatePass = {
  id: string; date: string; type: string; trainNo: string; carNo: string; itemDescription: string;
  partNo: string; srNoFaulty: string; destination: string; reason: string; issuedBy: string;
  status: string; ncrRef: string; returnDate: string; remarks: string;
};

const INITIAL_GP: GatePass[] = [
  { id: "GP-2025-001", date: "2025-03-10", type: "Out", trainNo: "MR601", carNo: "DMC1", itemDescription: "Door Drive Unit",           partNo: "DDU-4200", srNoFaulty: "DDU-4200-A012",    destination: "OEM (Faiveley)", reason: "Warranty Claim",    issuedBy: "AKHILESH KUMAR YADAV", status: "Open",   ncrRef: "NCR-2025-012", returnDate: "", remarks: "" },
  { id: "GP-2025-002", date: "2025-03-12", type: "In",  trainNo: "MR601", carNo: "DMC1", itemDescription: "Door Drive Unit (Repaired)", partNo: "DDU-4200", srNoFaulty: "DDU-4200-A012-R", destination: "CPD Depot",      reason: "Return from Repair",issuedBy: "CHANDAN KUMAR",          status: "Closed", ncrRef: "NCR-2025-012", returnDate: "2025-03-12", remarks: "Repaired by Faiveley" },
  { id: "GP-2025-003", date: "2025-03-15", type: "Out", trainNo: "MR605", carNo: "MC1",  itemDescription: "VVVF Inverter",              partNo: "INV-5030", srNoFaulty: "INV-5030-B003",    destination: "Hitachi (OEM)",  reason: "Failure Analysis",  issuedBy: "ARAGHYA KAR",           status: "Open",   ncrRef: "NCR-2025-018", returnDate: "", remarks: "" },
  { id: "GP-2025-004", date: "2025-02-20", type: "Out", trainNo: "MR608", carNo: "TC",   itemDescription: "TCMS Display Unit",          partNo: "TCMS-D01", srNoFaulty: "TCMS-D01-C008",    destination: "Mitsubishi (OEM)",reason: "Warranty Repair",   issuedBy: "SOORAJ SURESH",         status: "Open",   ncrRef: "NCR-2025-009", returnDate: "", remarks: "" },
  { id: "GP-2025-005", date: "2025-01-15", type: "In",  trainNo: "MR603", carNo: "DMC1", itemDescription: "Pantograph Assembly",        partNo: "PAN-001",  srNoFaulty: "PAN-001-A003",     destination: "CPD Depot",      reason: "Repaired Return",   issuedBy: "AKHILESH KUMAR YADAV", status: "Closed", ncrRef: "NCR-2025-003", returnDate: "2025-01-15", remarks: "New unit installed" },
];

const TYPE_COLORS: Record<string, string> = {
  Out: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  In:  "bg-green-500/10 text-green-400 border-green-500/30",
};

const BLANK_FORM = { date: format(new Date(), "yyyy-MM-dd"), type: "Out", trainNo: "", carNo: "", itemDescription: "", partNo: "", srNoFaulty: "", destination: "", reason: "", issuedBy: "", ncrRef: "", remarks: "" };

export default function GatePassPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewGP, setViewGP] = useState<GatePass | null>(null);
  const [records, setRecords] = useState<GatePass[]>(INITIAL_GP);
  const [form, setForm] = useState<typeof BLANK_FORM>({ ...BLANK_FORM });

  const filtered = records.filter(r => {
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (search) {
      const q = search.toUpperCase();
      if (!r.id.includes(q) && !r.itemDescription.toUpperCase().includes(q) && !r.trainNo.includes(q)) return false;
    }
    return true;
  });

  const openAdd = () => { setEditId(null); setForm({ ...BLANK_FORM }); setShowForm(true); };
  const openEdit = (gp: GatePass) => {
    setEditId(gp.id);
    setForm({ date: gp.date, type: gp.type, trainNo: gp.trainNo, carNo: gp.carNo, itemDescription: gp.itemDescription, partNo: gp.partNo, srNoFaulty: gp.srNoFaulty, destination: gp.destination, reason: gp.reason, issuedBy: gp.issuedBy, ncrRef: gp.ncrRef, remarks: gp.remarks || "" });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.itemDescription || !form.trainNo || !form.issuedBy) {
      toast({ title: "Required Fields Missing", description: "Item Description, Train No., and Issued By are required.", variant: "destructive" }); return;
    }
    if (editId) {
      setRecords(prev => prev.map(r => r.id === editId ? { ...r, ...form } : r));
      toast({ title: "Gate Pass Updated", description: `${editId} updated successfully.` });
    } else {
      const n = `GP-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, "0")}`;
      setRecords(prev => [{ id: n, ...form, status: "Open", returnDate: "" }, ...prev]);
      toast({ title: "Gate Pass Created", description: `${n} created successfully.` });
    }
    setShowForm(false);
  };

  const handleClose = (gp: GatePass) => {
    setRecords(prev => prev.map(r => r.id === gp.id ? { ...r, status: "Closed", returnDate: format(new Date(), "yyyy-MM-dd") } : r));
    toast({ title: "Gate Pass Closed", description: `${gp.id} marked as closed.` });
  };

  const handleDelete = (gp: GatePass) => {
    setRecords(prev => prev.filter(r => r.id !== gp.id));
    toast({ title: "Gate Pass Deleted", description: `${gp.id} deleted.` });
  };

  const handlePrint = (gp: GatePass) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
<title>Gate Pass — ${gp.id}</title>
<style>
  @page { size: A5 landscape; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 9pt; color: #000; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 8px; }
  .logo { font-weight: 900; font-size: 18pt; color: #E31E24; }
  .title { font-size: 13pt; font-weight: bold; text-align: center; flex: 1; }
  .ref { font-size: 7pt; text-align: right; }
  .badge { background: ${gp.type === "Out" ? "#EA580C" : "#16A34A"}; color: #fff; padding: 2px 8px; font-weight: bold; border-radius: 3px; font-size: 9pt; }
  .body { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 24px; margin: 6px 0; }
  .field { display: flex; gap: 4px; font-size: 8.5pt; align-items: flex-end; }
  .field label { font-weight: bold; white-space: nowrap; min-width: 110px; }
  .field span { border-bottom: 1px solid #999; flex: 1; min-height: 14px; padding-bottom: 1px; }
  .sign { display: flex; justify-content: space-between; margin-top: 18px; }
  .sign-field { flex: 1; text-align: center; border-top: 1px solid #000; margin: 0 8px; padding-top: 3px; font-size: 7.5pt; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="header">
  <div class="logo">BEML</div>
  <div class="title">GATE PASS &nbsp;<span class="badge">${gp.type === "Out" ? "OUT" : "IN"}</span></div>
  <div class="ref">KMRCL RS-3R Project<br/>GP No: <strong>${gp.id}</strong><br/>Date: ${gp.date}</div>
</div>
<div class="body">
  <div class="field"><label>Train No.:</label><span>${gp.trainNo}</span></div>
  <div class="field"><label>Car No.:</label><span>${gp.carNo}</span></div>
  <div class="field"><label>Item Description:</label><span>${gp.itemDescription}</span></div>
  <div class="field"><label>Part No.:</label><span>${gp.partNo}</span></div>
  <div class="field"><label>Faulty Sr. No.:</label><span>${gp.srNoFaulty}</span></div>
  <div class="field"><label>Destination / Source:</label><span>${gp.destination}</span></div>
  <div class="field"><label>Reason:</label><span>${gp.reason}</span></div>
  <div class="field"><label>NCR Ref.:</label><span>${gp.ncrRef}</span></div>
  <div class="field"><label>Issued By:</label><span>${gp.issuedBy}</span></div>
  <div class="field"><label>Status:</label><span>${gp.status}${gp.returnDate ? " · Returned: " + gp.returnDate : ""}</span></div>
  ${gp.remarks ? `<div class="field" style="grid-column:span 2"><label>Remarks:</label><span>${gp.remarks}</span></div>` : ""}
</div>
<div class="sign">
  <div class="sign-field">Issued By<br/>(Name &amp; Sign)</div>
  <div class="sign-field">Security<br/>(Name &amp; Sign)</div>
  <div class="sign-field">Depot Incharge<br/>(Name &amp; Sign)</div>
  <div class="sign-field">Recipient<br/>(Name &amp; Sign)</div>
</div>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const exportCSV = () => {
    const rows = [["GP No", "Date", "Type", "Train No", "Car No", "Item Description", "Part No", "Faulty Sr No", "Destination", "Reason", "Issued By", "NCR Ref", "Status", "Return Date", "Remarks"]];
    for (const r of filtered) rows.push([r.id, r.date, r.type, r.trainNo, r.carNo, r.itemDescription, r.partNo, r.srNoFaulty, r.destination, r.reason, r.issuedBy, r.ncrRef, r.status, r.returnDate, r.remarks || ""]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `GatePass_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-primary" /> Gate Pass Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track items sent out for repair/warranty and items returned from repair.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1.5" /> Export</Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> New Gate Pass
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: records.length,                               color: "text-foreground" },
          { label: "Out (Open)",  value: records.filter(r => r.type === "Out" && r.status === "Open").length, color: "text-orange-400" },
          { label: "In (Closed)", value: records.filter(r => r.status === "Closed").length, color: "text-green-400" },
          { label: "Pending",     value: records.filter(r => r.status === "Open").length, color: "text-yellow-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border/50">
            <CardContent className="p-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">Gate Pass — {s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search GP No, item or train..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border text-sm" />
        </div>
        <Select value={filterType || "__all__"} onValueChange={v => setFilterType(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-32 bg-card border-border text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Types</SelectItem>
            <SelectItem value="Out">Out</SelectItem>
            <SelectItem value="In">In</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus || "__all__"} onValueChange={v => setFilterStatus(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-32 bg-card border-border text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        {(filterType || filterStatus || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterType(""); setFilterStatus(""); setSearch(""); }}>Clear</Button>}
        <span className="text-xs text-muted-foreground self-center">{filtered.length} of {records.length}</span>
      </div>

      <Card className="bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">GP No.</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-left">Train</th>
                <th className="px-4 py-3 text-left">Car</th>
                <th className="px-4 py-3 text-left">Item Description</th>
                <th className="px-4 py-3 text-left">Destination / Source</th>
                <th className="px-4 py-3 text-left">NCR Ref.</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-8 text-center text-muted-foreground">No gate pass records found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono font-bold text-primary text-xs">{r.id}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[r.type]}`}>{r.type}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-xs">{r.trainNo}</td>
                  <td className="px-4 py-2.5 text-xs">{r.carNo}</td>
                  <td className="px-4 py-2.5 text-sm max-w-44 truncate" title={r.itemDescription}>{r.itemDescription}</td>
                  <td className="px-4 py-2.5 text-xs max-w-32 truncate">{r.destination}</td>
                  <td className="px-4 py-2.5 text-xs font-mono">{r.ncrRef}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={r.status === "Closed" ? "text-[10px] bg-green-500/10 text-green-400 border-green-500/30" : "text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/30"}>
                      {r.status}
                    </Badge>
                    {r.returnDate && <div className="text-[9px] text-muted-foreground mt-0.5">{r.returnDate}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setViewGP(r)}>
                          <Eye className="w-3.5 h-3.5 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(r)}>
                          <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint(r)}>
                          <Printer className="w-3.5 h-3.5 mr-2" /> Print
                        </DropdownMenuItem>
                        {r.status === "Open" && (
                          <DropdownMenuItem onClick={() => handleClose(r)}>
                            <CheckCircle className="w-3.5 h-3.5 mr-2" /> Mark Closed
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(r)}>
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Modal */}
      {viewGP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-mono text-primary">{viewGP.id}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={TYPE_COLORS[viewGP.type]}>{viewGP.type}</Badge>
                  <Badge variant="outline" className={viewGP.status === "Closed" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"}>{viewGP.status}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewGP(null)}>✕</Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Date", value: viewGP.date },
                { label: "Train / Car", value: `${viewGP.trainNo} / ${viewGP.carNo}` },
                { label: "Item Description", value: viewGP.itemDescription },
                { label: "Part No.", value: viewGP.partNo },
                { label: "Faulty Sr. No.", value: viewGP.srNoFaulty },
                { label: "Destination / Source", value: viewGP.destination },
                { label: "Reason", value: viewGP.reason },
                { label: "NCR Ref.", value: viewGP.ncrRef },
                { label: "Issued By", value: viewGP.issuedBy },
                { label: "Return Date", value: viewGP.returnDate || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
                  <p className="font-medium text-xs text-foreground">{value || "—"}</p>
                </div>
              ))}
            </div>
            {viewGP.remarks && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">Remarks</p>
                <p className="text-xs text-foreground">{viewGP.remarks}</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => handlePrint(viewGP)}><Printer className="w-3.5 h-3.5 mr-1.5" /> Print</Button>
              <Button variant="outline" size="sm" onClick={() => { openEdit(viewGP); setViewGP(null); }}><Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setViewGP(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Gate Pass Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editId ? "Edit Gate Pass" : "New Gate Pass"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>✕</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Date</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Type (Out/In)</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Out">Out (Sending for Repair)</SelectItem>
                    <SelectItem value="In">In (Returning from Repair)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Train No. *</label>
                <Select value={form.trainNo} onValueChange={v => setForm(f => ({ ...f, trainNo: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select train" /></SelectTrigger>
                  <SelectContent>{TRAIN_NUMBERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Car No.</label>
                <Select value={form.carNo} onValueChange={v => setForm(f => ({ ...f, carNo: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select car" /></SelectTrigger>
                  <SelectContent>{CAR_NUMBERS.map(c => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Item Description *</label>
                <Input value={form.itemDescription} onChange={e => setForm(f => ({ ...f, itemDescription: e.target.value }))} placeholder="e.g. Door Drive Unit" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Part No.</label>
                <Input value={form.partNo} onChange={e => setForm(f => ({ ...f, partNo: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Faulty Serial No.</label>
                <Input value={form.srNoFaulty} onChange={e => setForm(f => ({ ...f, srNoFaulty: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Destination / Source</label>
                <Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="OEM / Depot name" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">NCR Ref.</label>
                <Input value={form.ncrRef} onChange={e => setForm(f => ({ ...f, ncrRef: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Reason</label>
                <Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Warranty Claim" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Issued By *</label>
                <Select value={form.issuedBy} onValueChange={v => setForm(f => ({ ...f, issuedBy: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>{BEML_USERS.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Remarks</label>
                <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional remarks" className="bg-background border-border" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>{editId ? "Update Gate Pass" : "Create Gate Pass"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
