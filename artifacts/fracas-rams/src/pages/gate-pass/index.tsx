import { useState } from "react";
import { format } from "date-fns";
import { ArrowRightLeft, Plus, Search, Download, Printer, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TRAIN_NUMBERS, CAR_NUMBERS, SYSTEM_TAXONOMY, DEPOTS, BEML_USERS } from "@/lib/taxonomy";

const MOCK_GP = [
  { id: "GP-2025-001", date: "2025-03-10", type: "Out",  trainNo: "MR601", carNo: "DMC1", itemDescription: "Door Drive Unit",           partNo: "DDU-4200", srNoFaulty: "DDU-4200-A012",    destination: "OEM (Faiveley)", reason: "Warranty Claim",  issuedBy: "AKHILESH KUMAR YADAV", status: "Open",   ncrRef: "NCR-2025-012", returnDate: "" },
  { id: "GP-2025-002", date: "2025-03-12", type: "In",   trainNo: "MR601", carNo: "DMC1", itemDescription: "Door Drive Unit (Repaired)", partNo: "DDU-4200", srNoFaulty: "DDU-4200-A012-R", destination: "CPD Depot",      reason: "Return from Repair", issuedBy: "CHANDAN KUMAR",       status: "Closed", ncrRef: "NCR-2025-012", returnDate: "2025-03-12" },
  { id: "GP-2025-003", date: "2025-03-15", type: "Out",  trainNo: "MR605", carNo: "MC1",  itemDescription: "VVVF Inverter",              partNo: "INV-5030", srNoFaulty: "INV-5030-B003",    destination: "Hitachi (OEM)",  reason: "Failure Analysis", issuedBy: "ARAGHYA KAR",         status: "Open",   ncrRef: "NCR-2025-018", returnDate: "" },
];

const TYPE_COLORS: Record<string, string> = {
  Out:  "bg-orange-500/10 text-orange-400 border-orange-500/30",
  In:   "bg-green-500/10 text-green-400 border-green-500/30",
};

export default function GatePassPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [printGP, setPrintGP] = useState<typeof MOCK_GP[0] | null>(null);
  const [records, setRecords] = useState(MOCK_GP);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"), type: "Out", trainNo: "", carNo: "", itemDescription: "",
    partNo: "", srNoFaulty: "", destination: "", reason: "", issuedBy: "", ncrRef: "",
  });

  const filtered = records.filter(r => {
    if (filterType && r.type !== filterType) return false;
    if (search && !r.id.includes(search.toUpperCase()) && !r.itemDescription.toLowerCase().includes(search.toLowerCase()) && !r.trainNo.includes(search.toUpperCase())) return false;
    return true;
  });

  const handleSave = () => {
    if (!form.itemDescription || !form.trainNo || !form.issuedBy) {
      toast({ title: "Required Fields Missing", description: "Please fill Item Description, Train No., and Issued By.", variant: "destructive" }); return;
    }
    const n = `GP-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, "0")}`;
    setRecords(prev => [{ id: n, ...form, status: "Open", returnDate: "" }, ...prev]);
    toast({ title: "Gate Pass Created", description: `${n} created successfully.` });
    setShowForm(false);
    setForm({ date: format(new Date(), "yyyy-MM-dd"), type: "Out", trainNo: "", carNo: "", itemDescription: "", partNo: "", srNoFaulty: "", destination: "", reason: "", issuedBy: "", ncrRef: "" });
  };

  const handlePrint = (gp: typeof MOCK_GP[0]) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
<title>Gate Pass — ${gp.id}</title>
<style>
  @page { size: A5 landscape; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 9pt; color: #000; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 5px; }
  .title { font-size: 14pt; font-weight: bold; text-align: center; flex: 1; }
  .logo { font-weight: 900; font-size: 18pt; color: #E31E24; }
  .ref { font-size: 7pt; text-align: right; }
  .body { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin: 8px 0; }
  .field { display: flex; gap: 4px; font-size: 8.5pt; }
  .field label { font-weight: bold; white-space: nowrap; min-width: 100px; }
  .field span { border-bottom: 1px solid #666; flex: 1; min-height: 12px; }
  .sign { display: flex; justify-content: space-between; margin-top: 15px; }
  .sign-field { flex: 1; text-align: center; border-top: 1px solid #000; margin: 0 8px; padding-top: 2px; font-size: 7.5pt; }
  .badge { background: ${gp.type === "Out" ? "#EA580C" : "#16A34A"}; color: #fff; padding: 2px 8px; font-weight: bold; border-radius: 3px; font-size: 9pt; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="header">
  <div class="logo">BEML</div>
  <div class="title">GATE PASS — <span class="badge">${gp.type === "Out" ? "OUT" : "IN"}</span></div>
  <div class="ref">KMRCL RS-3R Project<br/>GP No: <strong>${gp.id}</strong><br/>Date: ${gp.date}</div>
</div>
<div class="body">
  <div class="field"><label>Train No.:</label><span>${gp.trainNo}</span></div>
  <div class="field"><label>Car No.:</label><span>${gp.carNo}</span></div>
  <div class="field"><label>Item Description:</label><span>${gp.itemDescription}</span></div>
  <div class="field"><label>Part No.:</label><span>${gp.partNo}</span></div>
  <div class="field"><label>Faulty Sr. No.:</label><span>${gp.srNoFaulty}</span></div>
  <div class="field"><label>Destination:</label><span>${gp.destination}</span></div>
  <div class="field"><label>Reason:</label><span>${gp.reason}</span></div>
  <div class="field"><label>NCR Ref.:</label><span>${gp.ncrRef}</span></div>
  <div class="field"><label>Issued By:</label><span>${gp.issuedBy}</span></div>
  <div class="field"><label>Status:</label><span>${gp.status}</span></div>
</div>
<div class="sign">
  <div class="sign-field">Issued By<br/>(Name &amp; Sign)</div>
  <div class="sign-field">Security<br/>(Name &amp; Sign)</div>
  <div class="sign-field">Depot Incharge<br/>(Name &amp; Sign)</div>
  <div class="sign-field">Recipient<br/>(Name &amp; Sign)</div>
</div>
</body></html>`);
    win.document.close(); setTimeout(() => win.print(), 300);
  };

  const exportCSV = () => {
    const rows = [["GP No", "Date", "Type", "Train No", "Car No", "Item Description", "Part No", "Faulty Sr No", "Destination", "Reason", "Issued By", "NCR Ref", "Status"]];
    for (const r of filtered) rows.push([r.id, r.date, r.type, r.trainNo, r.carNo, r.itemDescription, r.partNo, r.srNoFaulty, r.destination, r.reason, r.issuedBy, r.ncrRef, r.status]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `GatePass_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8 text-primary" /> Gate Pass Management
          </h1>
          <p className="text-muted-foreground mt-1">Generate and track gate passes for faulty items sent out and received for repair/replacement.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Gate Pass
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",   value: records.length,                             color: "text-foreground" },
          { label: "Out",     value: records.filter(r => r.type === "Out").length, color: "text-orange-400" },
          { label: "In",      value: records.filter(r => r.type === "In").length,  color: "text-green-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-muted-foreground">Gate Pass — {s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search GP No, item or train..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filterType || "__all__"} onValueChange={v => setFilterType(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-32 bg-card border-border"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Types</SelectItem>
            <SelectItem value="Out">Out</SelectItem>
            <SelectItem value="In">In</SelectItem>
          </SelectContent>
        </Select>
        {(filterType || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterType(""); setSearch(""); }}>Clear</Button>}
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
                <th className="px-4 py-3 text-center">Print</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-8 text-center text-muted-foreground">No gate pass records found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{r.id}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={TYPE_COLORS[r.type]}>{r.type}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">{r.trainNo}</td>
                  <td className="px-4 py-3">{r.carNo}</td>
                  <td className="px-4 py-3 text-sm max-w-44 truncate">{r.itemDescription}</td>
                  <td className="px-4 py-3 text-xs">{r.destination}</td>
                  <td className="px-4 py-3 text-xs font-mono">{r.ncrRef}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={r.status === "Closed" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button size="sm" variant="ghost" onClick={() => handlePrint(r)}><Printer className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Gate Pass Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Gate Pass</h2>
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
                <Input value={form.partNo} onChange={e => setForm(f => ({ ...f, partNo: e.target.value }))} placeholder="Part number" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Faulty Serial No.</label>
                <Input value={form.srNoFaulty} onChange={e => setForm(f => ({ ...f, srNoFaulty: e.target.value }))} placeholder="Faulty item serial no." className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Destination / Source</label>
                <Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="OEM / Depot name" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">NCR Ref.</label>
                <Input value={form.ncrRef} onChange={e => setForm(f => ({ ...f, ncrRef: e.target.value }))} placeholder="NCR reference number" className="bg-background border-border" />
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
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>Create Gate Pass</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
