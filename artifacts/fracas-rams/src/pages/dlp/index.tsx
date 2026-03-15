import { useState, useEffect } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ShieldAlert, Plus, Search, Download, Bell, BellOff, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TRAIN_NUMBERS, SYSTEM_TAXONOMY } from "@/lib/taxonomy";

const DLP_END_DATE = "2026-12-31";

const MOCK_DLP = [
  { id: "DLP-001", itemDescription: "Door Drive Unit (Passenger Door)",     partNumber: "DDU-4200",  subsystem: "Saloon Door",     trainNo: "MR601", qty: 12, dlpExpiry: "2026-06-30", vendor: "Faiveley",   status: "Active",   ncrCount: 2, replacementDue: "2026-03-01" },
  { id: "DLP-002", itemDescription: "Auxiliary Converter Unit",              partNumber: "APS-8001",  subsystem: "Auxiliary Converter (APS)", trainNo: "ALL", qty: 34, dlpExpiry: "2026-12-31", vendor: "SMA",       status: "Active",   ncrCount: 0, replacementDue: "" },
  { id: "DLP-003", itemDescription: "TCMS Central Unit",                     partNumber: "TCMS-C10",  subsystem: "Control Unit",    trainNo: "ALL", qty: 17, dlpExpiry: "2027-03-31", vendor: "Mitsubishi", status: "Active",   ncrCount: 1, replacementDue: "" },
  { id: "DLP-004", itemDescription: "Third Rail Shoe Collector",             partNumber: "SHOE-001",  subsystem: "Collector Shoes", trainNo: "MR606", qty: 24, dlpExpiry: "2025-12-31", vendor: "Schunk",     status: "Expiring", ncrCount: 3, replacementDue: "2025-11-01" },
  { id: "DLP-005", itemDescription: "Air Spring (Secondary Suspension)",     partNumber: "ASP-2104",  subsystem: "Secondary Suspension", trainNo: "ALL", qty: 68, dlpExpiry: "2026-09-30", vendor: "Knorr",     status: "Active",   ncrCount: 0, replacementDue: "" },
  { id: "DLP-006", itemDescription: "VVVF Traction Inverter",                partNumber: "INV-5030",  subsystem: "Traction Inverter", trainNo: "MR603", qty: 6, dlpExpiry: "2026-03-31", vendor: "Hitachi",   status: "Active",   ncrCount: 1, replacementDue: "" },
];

function getDaysLeft(expiry: string) {
  try { return differenceInDays(parseISO(expiry), new Date()); }
  catch { return 999; }
}

function getAlarmLevel(daysLeft: number, ncrCount: number) {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 90 || ncrCount >= 3) return "critical";
  if (daysLeft <= 180 || ncrCount >= 2) return "warning";
  return "ok";
}

const ALARM_COLORS: Record<string, string> = {
  expired:  "bg-red-600/20 text-red-400 border-red-600/40",
  critical: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  warning:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  ok:       "bg-green-500/10 text-green-400 border-green-500/30",
};

const ALARM_LABELS: Record<string, string> = {
  expired: "EXPIRED", critical: "CRITICAL", warning: "WARNING", ok: "OK",
};

export default function DLPPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterAlarm, setFilterAlarm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState(MOCK_DLP);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [form, setForm] = useState({ itemDescription: "", partNumber: "", subsystem: "", trainNo: "ALL", qty: "", dlpExpiry: "", vendor: "", replacementDue: "" });

  const criticalItems = items.filter(i => {
    const days = getDaysLeft(i.dlpExpiry);
    const alarm = getAlarmLevel(days, i.ncrCount);
    return alarm === "critical" || alarm === "expired" || alarm === "warning";
  });

  useEffect(() => {
    if (alarmEnabled && criticalItems.length > 0) {
      const hasExpired = items.some(i => getDaysLeft(i.dlpExpiry) < 0);
      if (hasExpired) {
        toast({ title: "⚠ DLP ALARM: Expired Items", description: `${items.filter(i => getDaysLeft(i.dlpExpiry) < 0).length} DLP item(s) have expired. Immediate action required!`, variant: "destructive" });
      }
    }
  }, []);

  const filtered = items.filter(i => {
    const level = getAlarmLevel(getDaysLeft(i.dlpExpiry), i.ncrCount);
    if (filterAlarm && level !== filterAlarm) return false;
    if (search && !i.itemDescription.toLowerCase().includes(search.toLowerCase()) && !i.partNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = () => {
    if (!form.itemDescription || !form.partNumber) {
      toast({ title: "Required Fields Missing", description: "Please fill Description and Part Number.", variant: "destructive" }); return;
    }
    const n = `DLP-${String(items.length + 1).padStart(3, "0")}`;
    setItems(prev => [...prev, { id: n, ...form, qty: Number(form.qty) || 0, ncrCount: 0, status: "Active" } as any]);
    toast({ title: "DLP Item Added", description: `${n} added to DLP register.` });
    setShowForm(false);
    setForm({ itemDescription: "", partNumber: "", subsystem: "", trainNo: "ALL", qty: "", dlpExpiry: "", vendor: "", replacementDue: "" });
  };

  const exportCSV = () => {
    const rows = [["DLP ID", "Description", "Part No", "Subsystem", "Train", "Qty", "DLP Expiry", "Vendor", "NCR Count", "Status"]];
    for (const i of filtered) rows.push([i.id, i.itemDescription, i.partNumber, i.subsystem, i.trainNo, String(i.qty), i.dlpExpiry, i.vendor, String(i.ncrCount), i.status]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `DLP_Items_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-primary" /> DLP Items Register
          </h1>
          <p className="text-muted-foreground mt-1">Defect Liability Period tracking with automatic alarm for expiring/expired items and high NCR count.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={alarmEnabled ? "default" : "outline"} size="sm" onClick={() => setAlarmEnabled(a => !a)}>
            {alarmEnabled ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
            Alarms {alarmEnabled ? "ON" : "OFF"}
          </Button>
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add DLP Item
          </Button>
        </div>
      </div>

      {/* Alarm Summary */}
      {criticalItems.length > 0 && alarmEnabled && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-400">DLP Alarm Active: {criticalItems.length} item(s) need attention</div>
            <div className="text-sm text-muted-foreground mt-1">
              {items.filter(i => getDaysLeft(i.dlpExpiry) < 0).length > 0 && <span className="text-red-400 font-medium">EXPIRED: {items.filter(i => getDaysLeft(i.dlpExpiry) < 0).length} item(s). </span>}
              Items with DLP expiry within 90 days or ≥3 NCR count require immediate vendor action.
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Items",  value: items.length,                                       color: "text-foreground" },
          { label: "Critical/Expired", value: items.filter(i => ["critical","expired"].includes(getAlarmLevel(getDaysLeft(i.dlpExpiry), i.ncrCount))).length, color: "text-red-400" },
          { label: "Warning",      value: items.filter(i => getAlarmLevel(getDaysLeft(i.dlpExpiry), i.ncrCount) === "warning").length, color: "text-yellow-400" },
          { label: "Total NCRs",   value: items.reduce((s, i) => s + i.ncrCount, 0),           color: "text-orange-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DLP Expiry Timeline */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-base">DLP Period Overview — KMRC RS-3R Project</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-3">
            Overall DLP End Date: <span className="text-foreground font-semibold">{DLP_END_DATE}</span> &nbsp;·&nbsp;
            Days remaining: <span className={getDaysLeft(DLP_END_DATE) < 180 ? "text-yellow-400 font-bold" : "text-green-400 font-bold"}>{getDaysLeft(DLP_END_DATE)} days</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, ((365 - getDaysLeft(DLP_END_DATE)) / 365) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>DLP Start</span><span>DLP End: {DLP_END_DATE}</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search item description or part number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filterAlarm || "__all__"} onValueChange={v => setFilterAlarm(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-40 bg-card border-border"><SelectValue placeholder="All Alarm Levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Levels</SelectItem>
            {["expired", "critical", "warning", "ok"].map(l => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterAlarm || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterAlarm(""); setSearch(""); }}>Clear</Button>}
      </div>

      {/* Table */}
      <Card className="bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">DLP ID</th>
                <th className="px-4 py-3 text-left">Item Description</th>
                <th className="px-4 py-3 text-left">Part No.</th>
                <th className="px-4 py-3 text-left">Sub-System</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">DLP Expiry</th>
                <th className="px-4 py-3 text-center">Days Left</th>
                <th className="px-4 py-3 text-center">NCRs</th>
                <th className="px-4 py-3 text-left">Alarm</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const daysLeft = getDaysLeft(i.dlpExpiry);
                const alarm = getAlarmLevel(daysLeft, i.ncrCount);
                return (
                  <tr key={i.id} className={`border-b border-border/40 hover:bg-muted/30 ${alarm === "critical" || alarm === "expired" ? "bg-red-500/5" : alarm === "warning" ? "bg-yellow-500/5" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{i.id}</td>
                    <td className="px-4 py-3 text-sm font-medium max-w-48">{i.itemDescription}</td>
                    <td className="px-4 py-3 font-mono text-xs">{i.partNumber}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{i.subsystem}</td>
                    <td className="px-4 py-3 text-center">{i.qty}</td>
                    <td className="px-4 py-3 text-xs">{i.vendor}</td>
                    <td className="px-4 py-3 text-xs font-mono">{i.dlpExpiry}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      <span className={daysLeft < 0 ? "text-red-400" : daysLeft <= 90 ? "text-orange-400" : daysLeft <= 180 ? "text-yellow-400" : "text-green-400"}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {i.ncrCount > 0 ? <span className="text-orange-400 font-bold">{i.ncrCount}</span> : <span className="text-muted-foreground">0</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={ALARM_COLORS[alarm]}>{ALARM_LABELS[alarm]}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add DLP Item Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add DLP Item</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>✕</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Item Description *</label>
                <Input value={form.itemDescription} onChange={e => setForm(f => ({ ...f, itemDescription: e.target.value }))} placeholder="e.g. Door Drive Unit" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Part Number *</label>
                <Input value={form.partNumber} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} placeholder="Part number" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Sub-System</label>
                <Input value={form.subsystem} onChange={e => setForm(f => ({ ...f, subsystem: e.target.value }))} placeholder="Sub-system" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Train No.</label>
                <Select value={form.trainNo} onValueChange={v => setForm(f => ({ ...f, trainNo: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Trains</SelectItem>
                    {TRAIN_NUMBERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Qty</label>
                <Input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Vendor</label>
                <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Vendor name" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">DLP Expiry Date</label>
                <Input type="date" value={form.dlpExpiry} onChange={e => setForm(f => ({ ...f, dlpExpiry: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Replacement Due Date</label>
                <Input type="date" value={form.replacementDue} onChange={e => setForm(f => ({ ...f, replacementDue: e.target.value }))} className="bg-background border-border" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>Add DLP Item</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
