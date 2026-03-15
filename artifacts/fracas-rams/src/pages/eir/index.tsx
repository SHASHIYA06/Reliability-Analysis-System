import { useState } from "react";
import { format } from "date-fns";
import { ClipboardCheck, Plus, Search, Download, Filter, Eye, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TRAIN_NUMBERS, CAR_NUMBERS, BEML_USERS } from "@/lib/taxonomy";

const MOCK_EIR = [
  { id: "EIR-2025-001", date: "2025-03-10", trainNo: "MR601", carNo: "DMC1", inspector: "AKHILESH KUMAR YADAV", status: "Completed", remarks: "All systems inspected OK. Minor door sensor issue noted." },
  { id: "EIR-2025-002", date: "2025-03-11", trainNo: "MR603", carNo: "TC1",  inspector: "CHANDAN KUMAR",        status: "Pending",   remarks: "Brake inspection pending." },
  { id: "EIR-2025-003", date: "2025-03-12", trainNo: "MR605", carNo: "MC1",  inspector: "ARAGHYA KAR",          status: "Completed", remarks: "Traction motor inspected — NFF." },
];

const STATUS_COLORS: Record<string, string> = {
  Completed: "bg-green-500/10 text-green-400 border-green-500/30",
  Pending:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Failed:    "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function EIRPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTrain, setFilterTrain] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [records, setRecords] = useState(MOCK_EIR);

  // Form state
  const [form, setForm] = useState({
    trainNo: "", carNo: "", inspector: "", date: format(new Date(), "yyyy-MM-dd"),
    checkItems: { propulsion: false, brakes: false, doors: false, vac: false, tims: false, bogie: false, lighting: false, gangway: false },
    remarks: "", status: "Pending",
  });

  const filtered = records.filter(r => {
    if (filterTrain && r.trainNo !== filterTrain) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (search && !r.id.includes(search.toUpperCase()) && !r.inspector.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = () => {
    if (!form.trainNo || !form.carNo || !form.inspector) {
      toast({ title: "Required Fields Missing", description: "Please fill Train, Car, and Inspector.", variant: "destructive" }); return;
    }
    const n = `EIR-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, "0")}`;
    setRecords(prev => [{ id: n, date: form.date, trainNo: form.trainNo, carNo: form.carNo, inspector: form.inspector, status: form.status, remarks: form.remarks }, ...prev]);
    toast({ title: "EIR Created", description: `${n} saved successfully.` });
    setShowForm(false);
    setForm({ trainNo: "", carNo: "", inspector: "", date: format(new Date(), "yyyy-MM-dd"), checkItems: { propulsion: false, brakes: false, doors: false, vac: false, tims: false, bogie: false, lighting: false, gangway: false }, remarks: "", status: "Pending" });
  };

  const exportCSV = () => {
    const rows = [["EIR No", "Date", "Train No", "Car No", "Inspector", "Status", "Remarks"]];
    for (const r of filtered) rows.push([r.id, r.date, r.trainNo, r.carNo, r.inspector, r.status, r.remarks]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `EIR_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary" /> Equipment Inspection Report (EIR)
          </h1>
          <p className="text-muted-foreground mt-1">Record and track periodic equipment inspection reports for rolling stock.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> New EIR
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total EIRs",  value: records.length,                            color: "text-foreground" },
          { label: "Completed",   value: records.filter(r => r.status === "Completed").length, color: "text-green-400" },
          { label: "Pending",     value: records.filter(r => r.status === "Pending").length,   color: "text-yellow-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search EIR No. or Inspector..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filterTrain || "__all__"} onValueChange={v => setFilterTrain(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-36 bg-card border-border"><SelectValue placeholder="All Trains" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Trains</SelectItem>
            {TRAIN_NUMBERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus || "__all__"} onValueChange={v => setFilterStatus(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-36 bg-card border-border"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            {["Completed", "Pending", "Failed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterTrain || filterStatus || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterTrain(""); setFilterStatus(""); setSearch(""); }}>Clear</Button>
        )}
      </div>

      {/* Table */}
      <Card className="bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">EIR No.</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Train No.</th>
                <th className="px-4 py-3 text-left">Car No.</th>
                <th className="px-4 py-3 text-left">Inspector</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Remarks</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">No EIR records found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{r.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{r.trainNo}</td>
                  <td className="px-4 py-3">{r.carNo}</td>
                  <td className="px-4 py-3 text-sm">{r.inspector}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate">{r.remarks}</td>
                  <td className="px-4 py-3 text-center">
                    <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New EIR Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Equipment Inspection Report</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>✕</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Date *</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Train No. *</label>
                <Select value={form.trainNo} onValueChange={v => setForm(f => ({ ...f, trainNo: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select train" /></SelectTrigger>
                  <SelectContent>{TRAIN_NUMBERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Car No. *</label>
                <Select value={form.carNo} onValueChange={v => setForm(f => ({ ...f, carNo: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select car" /></SelectTrigger>
                  <SelectContent>{CAR_NUMBERS.map(c => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Inspector *</label>
                <Select value={form.inspector} onValueChange={v => setForm(f => ({ ...f, inspector: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select inspector" /></SelectTrigger>
                  <SelectContent>{BEML_USERS.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">Inspection Checklist</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(form.checkItems).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={val} onChange={e => setForm(f => ({ ...f, checkItems: { ...f.checkItems, [key]: e.target.checked } }))} />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Status</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{["Pending", "Completed", "Failed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Remarks</label>
              <textarea rows={3} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                className="w-full bg-background border border-border rounded-md p-2 text-sm resize-none" placeholder="Inspection observations..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>Save EIR</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
