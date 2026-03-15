import { useState } from "react";
import { format } from "date-fns";
import { FileCheck, Plus, Search, Download, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TRAIN_NUMBERS, CAR_NUMBERS, BEML_USERS } from "@/lib/taxonomy";

const MOCK_RSOI = [
  { id: "RSOI-2025-001", date: "2025-01-15", trainNo: "MR601", carNo: "DMC1", vendor: "BEML",  description: "Rolling Stock Overhaul Inspection - Q1 2025", status: "Completed", nextDue: "2025-07-15" },
  { id: "RSOI-2025-002", date: "2025-02-20", trainNo: "MR602", carNo: "MC1",  vendor: "OEM",   description: "Major overhaul — traction system", status: "In Progress", nextDue: "2025-08-20" },
  { id: "RSOI-2025-003", date: "2025-03-01", trainNo: "MR603", carNo: "TC1",  vendor: "BEML",  description: "Periodic inspection — brake system", status: "Scheduled", nextDue: "2025-09-01" },
];

const STATUS_COLORS: Record<string, string> = {
  Completed:   "bg-green-500/10 text-green-400 border-green-500/30",
  "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Scheduled:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Failed:      "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function RSOIPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTrain, setFilterTrain] = useState("");
  const [records, setRecords] = useState(MOCK_RSOI);
  const [form, setForm] = useState({ trainNo: "", carNo: "", vendor: "BEML", description: "", status: "Scheduled", date: format(new Date(), "yyyy-MM-dd"), nextDue: "" });

  const filtered = records.filter(r => {
    if (filterTrain && r.trainNo !== filterTrain) return false;
    if (search && !r.id.includes(search.toUpperCase()) && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = () => {
    if (!form.trainNo || !form.description) {
      toast({ title: "Required Fields Missing", description: "Please fill Train No. and Description.", variant: "destructive" }); return;
    }
    const n = `RSOI-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, "0")}`;
    setRecords(prev => [{ id: n, date: form.date, trainNo: form.trainNo, carNo: form.carNo, vendor: form.vendor, description: form.description, status: form.status, nextDue: form.nextDue }, ...prev]);
    toast({ title: "RSOI Record Created", description: `${n} saved successfully.` });
    setShowForm(false);
  };

  const exportCSV = () => {
    const rows = [["RSOI No", "Date", "Train No", "Car No", "Vendor", "Description", "Status", "Next Due"]];
    for (const r of filtered) rows.push([r.id, r.date, r.trainNo, r.carNo, r.vendor, r.description, r.status, r.nextDue]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `RSOI_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-primary" /> Rolling Stock Overhaul Inspection (RSOI)
          </h1>
          <p className="text-muted-foreground mt-1">Track major overhaul inspections and scheduling for RS-3R rolling stock.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> New RSOI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total",       value: records.length,                                 color: "text-foreground" },
          { label: "Completed",   value: records.filter(r => r.status === "Completed").length,   color: "text-green-400" },
          { label: "In Progress", value: records.filter(r => r.status === "In Progress").length, color: "text-blue-400" },
          { label: "Scheduled",   value: records.filter(r => r.status === "Scheduled").length,   color: "text-yellow-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search RSOI No. or Description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filterTrain || "__all__"} onValueChange={v => setFilterTrain(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-36 bg-card border-border"><SelectValue placeholder="All Trains" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Trains</SelectItem>
            {TRAIN_NUMBERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterTrain || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterTrain(""); setSearch(""); }}>Clear</Button>}
      </div>

      <Card className="bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">RSOI No.</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Train No.</th>
                <th className="px-4 py-3 text-left">Car No.</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Next Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">No RSOI records found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{r.id}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{r.date}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{r.trainNo}</td>
                  <td className="px-4 py-3">{r.carNo}</td>
                  <td className="px-4 py-3">{r.vendor}</td>
                  <td className="px-4 py-3 text-xs max-w-52 truncate">{r.description}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-xs">{r.nextDue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New RSOI Record</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>✕</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Date</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Train No. *</label>
                <Select value={form.trainNo} onValueChange={v => setForm(f => ({ ...f, trainNo: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TRAIN_NUMBERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Car No.</label>
                <Select value={form.carNo} onValueChange={v => setForm(f => ({ ...f, carNo: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{CAR_NUMBERS.map(c => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Vendor</label>
                <Select value={form.vendor} onValueChange={v => setForm(f => ({ ...f, vendor: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{["BEML","OEM","Third Party"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Scheduled","In Progress","Completed","Failed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Next Due Date</label>
                <Input type="date" value={form.nextDue} onChange={e => setForm(f => ({ ...f, nextDue: e.target.value }))} className="bg-background border-border" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Description *</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-background border border-border rounded-md p-2 text-sm resize-none" placeholder="Inspection details..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>Save RSOI</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
