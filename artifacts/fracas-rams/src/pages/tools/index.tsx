import { useState } from "react";
import { format } from "date-fns";
import { Wrench, Plus, Search, Download, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BEML_USERS } from "@/lib/taxonomy";

const MOCK_TOOLS = [
  { id: "TOOL-001", name: "Digital Torque Wrench",      toolNo: "TW-001", category: "Mechanical",    location: "Tool Room A", condition: "Good",      calibrationDue: "2025-06-30", assignedTo: "", qty: 2, remarks: "" },
  { id: "TOOL-002", name: "Multimeter (Fluke 87V)",     toolNo: "MM-001", category: "Electrical",    location: "Tool Room A", condition: "Good",      calibrationDue: "2025-09-30", assignedTo: "AKHILESH KUMAR YADAV", qty: 1, remarks: "Issued to technician" },
  { id: "TOOL-003", name: "Hydraulic Jack (10T)",        toolNo: "HJ-001", category: "Mechanical",    location: "Bogie Bay",   condition: "Good",      calibrationDue: "",           assignedTo: "", qty: 2, remarks: "" },
  { id: "TOOL-004", name: "Oscilloscope (Tektronix)",   toolNo: "OS-001", category: "Electrical",    location: "Electronics Lab", condition: "Good",  calibrationDue: "2025-12-31", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-005", name: "Megger (Insulation Tester)", toolNo: "MG-001", category: "Electrical",    location: "Tool Room B", condition: "Fair",      calibrationDue: "2025-03-31", assignedTo: "", qty: 1, remarks: "Calibration overdue" },
  { id: "TOOL-006", name: "Bogie Lifting Equipment",    toolNo: "BL-001", category: "Heavy",         location: "Workshop",    condition: "Good",      calibrationDue: "2026-01-31", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-007", name: "Door Force Gauge",            toolNo: "DG-001", category: "Measurement",  location: "Tool Room A", condition: "Good",      calibrationDue: "2025-07-31", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-008", name: "Air Pressure Test Kit",       toolNo: "PT-001", category: "Pneumatic",    location: "Tool Room A", condition: "Good",      calibrationDue: "2025-08-31", assignedTo: "", qty: 2, remarks: "" },
  { id: "TOOL-009", name: "Wheel Profile Gauge",         toolNo: "WP-001", category: "Measurement",  location: "Workshop",    condition: "Good",      calibrationDue: "2026-03-31", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-010", name: "Clamp Meter (Fluke 376)",    toolNo: "CM-001", category: "Electrical",    location: "Tool Room A", condition: "Good",      calibrationDue: "2025-10-31", assignedTo: "", qty: 3, remarks: "" },
];

const CATEGORIES = ["Mechanical", "Electrical", "Heavy", "Measurement", "Pneumatic", "Other"];

const CONDITION_COLORS: Record<string, string> = {
  Good:    "bg-green-500/10 text-green-400 border-green-500/30",
  Fair:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Poor:    "bg-red-500/10 text-red-400 border-red-500/30",
  Defective: "bg-red-600/20 text-red-500 border-red-600/40",
};

function getDaysLeft(date: string) {
  if (!date) return 999;
  try { return Math.round((new Date(date).getTime() - Date.now()) / 86400000); }
  catch { return 999; }
}

export default function ToolsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [tools, setTools] = useState(MOCK_TOOLS);
  const [form, setForm] = useState({ name: "", toolNo: "", category: "Mechanical", location: "", condition: "Good", calibrationDue: "", qty: "1", remarks: "" });

  const filtered = tools.filter(t => {
    if (filterCat && t.category !== filterCat) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.toolNo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const overdue = tools.filter(t => t.calibrationDue && getDaysLeft(t.calibrationDue) < 0).length;
  const dueSoon = tools.filter(t => t.calibrationDue && getDaysLeft(t.calibrationDue) >= 0 && getDaysLeft(t.calibrationDue) <= 30).length;

  const handleSave = () => {
    if (!form.name || !form.toolNo) {
      toast({ title: "Required Fields Missing", description: "Tool Name and Tool No. are required.", variant: "destructive" }); return;
    }
    const n = `TOOL-${String(tools.length + 1).padStart(3, "0")}`;
    setTools(prev => [...prev, { id: n, ...form, qty: Number(form.qty) || 1, assignedTo: "" }]);
    toast({ title: "Tool Added", description: `${n} — ${form.name} added to register.` });
    setShowForm(false);
    setForm({ name: "", toolNo: "", category: "Mechanical", location: "", condition: "Good", calibrationDue: "", qty: "1", remarks: "" });
  };

  const exportCSV = () => {
    const rows = [["ID", "Name", "Tool No", "Category", "Location", "Condition", "Calibration Due", "Qty", "Assigned To", "Remarks"]];
    for (const t of filtered) rows.push([t.id, t.name, t.toolNo, t.category, t.location, t.condition, t.calibrationDue, String(t.qty), t.assignedTo, t.remarks]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Tools_Register_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Wrench className="w-8 h-8 text-primary" /> Tools Management
          </h1>
          <p className="text-muted-foreground mt-1">Track maintenance tools, calibration schedules, and tool issue register.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Tool
          </Button>
        </div>
      </div>

      {(overdue > 0 || dueSoon > 0) && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            {overdue > 0 && <div className="font-semibold text-orange-400">{overdue} tool(s) have overdue calibration — immediate action required.</div>}
            {dueSoon > 0 && <div className="text-sm text-muted-foreground">{dueSoon} tool(s) have calibration due within 30 days.</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tools",        value: tools.length,                       color: "text-foreground" },
          { label: "Categories",         value: CATEGORIES.length,                  color: "text-primary" },
          { label: "Calibration Overdue",value: overdue,                            color: overdue > 0 ? "text-red-400" : "text-green-400" },
          { label: "Due Within 30 Days", value: dueSoon,                            color: dueSoon > 0 ? "text-yellow-400" : "text-green-400" },
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
          <Input placeholder="Search tool name or number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filterCat || "__all__"} onValueChange={v => setFilterCat(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-44 bg-card border-border"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterCat || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterCat(""); setSearch(""); }}>Clear</Button>}
      </div>

      <Card className="bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">Tool ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Tool No.</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Condition</th>
                <th className="px-4 py-3 text-left">Calibration Due</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const daysLeft = getDaysLeft(t.calibrationDue);
                return (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{t.id}</td>
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.toolNo}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.category}</td>
                    <td className="px-4 py-3 text-center">{t.qty}</td>
                    <td className="px-4 py-3 text-xs">{t.location}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={CONDITION_COLORS[t.condition] || ""}>{t.condition}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {t.calibrationDue ? (
                        <span className={daysLeft < 0 ? "text-red-400 font-bold" : daysLeft <= 30 ? "text-yellow-400" : "text-muted-foreground"}>
                          {t.calibrationDue} {daysLeft < 0 ? `(${Math.abs(daysLeft)}d overdue)` : daysLeft <= 30 ? `(${daysLeft}d)` : ""}
                        </span>
                      ) : <span className="text-muted-foreground">N/A</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">{t.assignedTo || <span className="text-muted-foreground">Available</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Tool to Register</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>✕</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Tool Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Digital Torque Wrench" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Tool No. *</label>
                <Input value={form.toolNo} onChange={e => setForm(f => ({ ...f, toolNo: e.target.value }))} placeholder="e.g. TW-002" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Category</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Location</label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Tool Room A / Workshop" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Condition</label>
                <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Good","Fair","Poor","Defective"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Calibration Due Date</label>
                <Input type="date" value={form.calibrationDue} onChange={e => setForm(f => ({ ...f, calibrationDue: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Quantity</label>
                <Input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} className="bg-background border-border" min="1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Remarks</label>
                <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional remarks" className="bg-background border-border" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>Add Tool</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
