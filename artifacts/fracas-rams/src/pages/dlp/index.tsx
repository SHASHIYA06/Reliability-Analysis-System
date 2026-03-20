import { useState, useEffect, useRef, useCallback } from "react";

import { API_BASE as BASE } from "@/lib/api-base";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  ShieldAlert, Plus, Search, Download, Bell, BellOff, AlertTriangle,
  Upload, Edit2, Trash2, MoreVertical, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TRAIN_NUMBERS, SYSTEM_TAXONOMY } from "@/lib/taxonomy";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DLP_END_DATE = "2026-12-31";
const SYSTEMS = SYSTEM_TAXONOMY.map(s => s.name);

type DLPItem = {
  id: string; itemDescription: string; partNumber: string; system: string; subsystem: string;
  trainNo: string; qty: number; dlpExpiry: string; vendor: string; status: string; ncrCount: number; replacementDue: string;
};

const INITIAL_DLP: DLPItem[] = [
  { id: "DLP-001", itemDescription: "Door Drive Unit (Passenger Door)", partNumber: "DDU-4200", system: "Door System", subsystem: "Saloon Door", trainNo: "MR601", qty: 12, dlpExpiry: "2026-06-30", vendor: "Faiveley", status: "Active", ncrCount: 2, replacementDue: "2026-03-01" },
  { id: "DLP-002", itemDescription: "Auxiliary Converter Unit", partNumber: "APS-8001", system: "Auxiliary Electric", subsystem: "Auxiliary Converter (APS)", trainNo: "ALL", qty: 34, dlpExpiry: "2026-12-31", vendor: "SMA", status: "Active", ncrCount: 0, replacementDue: "" },
  { id: "DLP-003", itemDescription: "TCMS Central Unit", partNumber: "TCMS-C10", system: "TIMS", subsystem: "Control Unit", trainNo: "ALL", qty: 17, dlpExpiry: "2027-03-31", vendor: "Mitsubishi", status: "Active", ncrCount: 1, replacementDue: "" },
  { id: "DLP-004", itemDescription: "Third Rail Shoe Collector", partNumber: "SHOE-001", system: "Traction System", subsystem: "Collector Shoes", trainNo: "MR606", qty: 24, dlpExpiry: "2025-12-31", vendor: "Schunk", status: "Expiring", ncrCount: 3, replacementDue: "2025-11-01" },
  { id: "DLP-005", itemDescription: "Air Spring (Secondary Suspension)", partNumber: "ASP-2104", system: "Bogie & Suspension", subsystem: "Secondary Suspension", trainNo: "ALL", qty: 68, dlpExpiry: "2026-09-30", vendor: "Knorr", status: "Active", ncrCount: 0, replacementDue: "" },
  { id: "DLP-006", itemDescription: "VVVF Traction Inverter", partNumber: "INV-5030", system: "Traction System", subsystem: "Traction Inverter", trainNo: "MR603", qty: 6, dlpExpiry: "2026-03-31", vendor: "Hitachi", status: "Active", ncrCount: 1, replacementDue: "" },
  { id: "DLP-007", itemDescription: "HVAC Compressor Unit", partNumber: "HVAC-C01", system: "Air Conditioning", subsystem: "Compressor Unit", trainNo: "ALL", qty: 14, dlpExpiry: "2026-06-30", vendor: "Faiveley", status: "Active", ncrCount: 0, replacementDue: "" },
  { id: "DLP-008", itemDescription: "Brake Actuator Assembly", partNumber: "BRK-A001", system: "Brake System", subsystem: "Disc Brake Caliper", trainNo: "ALL", qty: 84, dlpExpiry: "2026-12-31", vendor: "Knorr", status: "Active", ncrCount: 0, replacementDue: "" },
  { id: "DLP-009", itemDescription: "Emergency Brake Relay", partNumber: "EBR-001", system: "Brake System", subsystem: "Emergency Brake", trainNo: "ALL", qty: 28, dlpExpiry: "2025-09-30", vendor: "Knorr", status: "Expiring", ncrCount: 2, replacementDue: "2025-08-01" },
  { id: "DLP-010", itemDescription: "Pantograph Assembly", partNumber: "PAN-001", system: "Pantograph", subsystem: "Pantograph Head", trainNo: "ALL", qty: 14, dlpExpiry: "2027-06-30", vendor: "Wabtec", status: "Active", ncrCount: 0, replacementDue: "" },
  { id: "DLP-011", itemDescription: "Master Controller Handle", partNumber: "MCH-001", system: "Cab Equipment", subsystem: "Master Controller", trainNo: "ALL", qty: 28, dlpExpiry: "2026-06-30", vendor: "BEML", status: "Active", ncrCount: 1, replacementDue: "" },
  { id: "DLP-012", itemDescription: "Traction Battery Pack", partNumber: "BAT-T001", system: "Auxiliary Electric", subsystem: "Battery System", trainNo: "ALL", qty: 14, dlpExpiry: "2026-09-30", vendor: "Exide", status: "Active", ncrCount: 0, replacementDue: "" },
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
  expired: "bg-red-600/20 text-red-400 border-red-600/40",
  critical: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  ok: "bg-green-500/10 text-green-400 border-green-500/30",
};

const ALARM_LABELS: Record<string, string> = {
  expired: "EXPIRED", critical: "CRITICAL", warning: "WARNING", ok: "OK",
};

const BLANK_FORM = { itemDescription: "", partNumber: "", system: "", subsystem: "", trainNo: "ALL", qty: "", dlpExpiry: "", vendor: "", replacementDue: "" };

export default function DLPPage() {
  const { toast } = useToast();
  const importRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [filterAlarm, setFilterAlarm] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [items, setItems] = useState<DLPItem[]>([]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/dlp`);
      if (res.ok) setItems(await res.json());
    } catch { }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [form, setForm] = useState<typeof BLANK_FORM>({ ...BLANK_FORM });
  const [activeTab, setActiveTab] = useState<"list" | "bySystem" | "byVendor">("list");

  const vendors = [...new Set(items.map(i => i.vendor))].sort();

  const criticalItems = items.filter(i => {
    const alarm = getAlarmLevel(getDaysLeft(i.dlpExpiry), i.ncrCount);
    return alarm === "critical" || alarm === "expired" || alarm === "warning";
  });

  useEffect(() => {
    if (alarmEnabled) {
      const hasExpired = items.some(i => getDaysLeft(i.dlpExpiry) < 0);
      if (hasExpired) {
        toast({ title: "DLP ALARM: Expired Items", description: `${items.filter(i => getDaysLeft(i.dlpExpiry) < 0).length} DLP item(s) have expired. Immediate action required!`, variant: "destructive" });
      }
    }
  }, []);

  const filtered = items.filter(i => {
    const level = getAlarmLevel(getDaysLeft(i.dlpExpiry), i.ncrCount);
    if (filterAlarm && level !== filterAlarm) return false;
    if (filterVendor && i.vendor !== filterVendor) return false;
    if (filterSystem && i.system !== filterSystem) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.itemDescription.toLowerCase().includes(q) && !i.partNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openAdd = () => { setEditId(null); setForm({ ...BLANK_FORM }); setShowForm(true); };
  const openEdit = (item: DLPItem) => {
    setEditId(item.id);
    setForm({ itemDescription: item.itemDescription, partNumber: item.partNumber, system: item.system, subsystem: item.subsystem, trainNo: item.trainNo, qty: String(item.qty), dlpExpiry: item.dlpExpiry, vendor: item.vendor, replacementDue: item.replacementDue });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.itemDescription || !form.partNumber) {
      toast({ title: "Required Fields Missing", description: "Please fill Description and Part Number.", variant: "destructive" }); return;
    }
    if (editId) {
      await fetch(`${BASE}/api/dlp/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, qty: Number(form.qty) || 0 }) });
      toast({ title: "DLP Item Updated", description: `${editId} updated successfully.` });
    } else {
      const n = `DLP-${String(items.length + 1).padStart(3, "0")}`;
      await fetch(`${BASE}/api/dlp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n, ...form, qty: Number(form.qty) || 0, ncrCount: 0, status: "Active" }) });
      toast({ title: "DLP Item Added", description: `${n} added to DLP register.` });
    }
    setShowForm(false);
    fetchItems();
  };

  const handleDelete = async (item: DLPItem) => {
    await fetch(`${BASE}/api/dlp/${item.id}`, { method: "DELETE" });
    toast({ title: "DLP Item Removed", description: `${item.id} removed from register.` });
    fetchItems();
  };

  const exportCSV = () => {
    const rows = [["DLP ID", "Description", "Part No", "System", "Subsystem", "Train", "Qty", "DLP Expiry", "Vendor", "NCR Count", "Status"]];
    for (const i of filtered) rows.push([i.id, i.itemDescription, i.partNumber, i.system, i.subsystem, i.trainNo, String(i.qty), i.dlpExpiry, i.vendor, String(i.ncrCount), i.status]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `DLP_Items_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const content = ev.target?.result as string;
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return;

        const parseRow = (text: string) => {
          const result = []; let cur = ""; let inQuotes = false;
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === "," && !inQuotes) { result.push(cur.trim()); cur = ""; }
            else cur += char;
          }
          result.push(cur.trim()); return result;
        };

        const hRaw = parseRow(lines[0]);
        const header = hRaw.map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ""));
        const records: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = parseRow(lines[i]);
          if (cols.length < 2) continue;
          const row: Record<string, string> = {};
          header.forEach((h, idx) => { row[h] = cols[idx] || ""; });

          const find = (aliases: string[]) => {
            for (const a of aliases) {
              const norm = a.toLowerCase().replace(/[\s_-]/g, "");
              if (row[norm]) return row[norm];
            }
            return "";
          };

          const pNo = find(["part_number", "partNumber", "Part No", "Part Number", "Material Number", "PartNo"]);
          const desc = find(["item_description", "itemDescription", "Description", "Item Description", "Item Name", "Material Description"]);

          if (!desc && !pNo) continue;

          records.push({
            id: find(["id", "DLP ID", "DLP No", "SL No", "Serial No"]),
            itemDescription: desc || pNo,
            partNumber: pNo,
            system: find(["system", "System", "Asset Type", "Main System"]),
            subsystem: find(["subsystem", "Subsystem", "Sub-System", "Sub System"]),
            trainNo: find(["train_no", "trainNo", "Train", "Train No", "Vehicle No"]) || "ALL",
            qty: Number((find(["qty", "Qty", "Quantity", "Count", "Total"]) || "0").replace(/[^\d]/g, "")),
            dlpExpiry: find(["dlp_expiry", "dlpExpiry", "DLP Expiry", "Expiry Date", "Warranty End", "DLP Period"]),
            vendor: find(["vendor", "Vendor", "Supplier", "OEM", "Manufacturer"]),
            ncrCount: Number((find(["ncr_count", "ncrCount", "NCR Count", "Fault Count", "NCRs"]) || "0").replace(/[^\d]/g, "")),
            status: find(["status", "Status", "Condition", "State"]) || "Active",
            replacementDue: find(["replacement_due", "replacementDue", "Replacement Due", "Next Service", "Due Date"]),
          });
        }

        const res = await fetch(`${BASE}/api/dlp/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records })
        });

        if (res.ok) {
          const result = await res.json();
          toast({ title: "Import Successful", description: `Imported ${result.imported} DLP items.` });
          fetchItems();
        } else {
          const err = await res.json();
          toast({ title: "Import Failed", description: err.error || "Unknown error", variant: "destructive" });
        }
      } catch (err: any) {
        toast({ title: "Import Error", description: "Could not parse CSV file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const bySystem = Object.entries(
    items.reduce((acc: Record<string, DLPItem[]>, i) => {
      const key = i.system || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(i);
      return acc;
    }, {})
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const byVendor = Object.entries(
    items.reduce((acc: Record<string, DLPItem[]>, i) => {
      if (!acc[i.vendor]) acc[i.vendor] = [];
      acc[i.vendor].push(i);
      return acc;
    }, {})
  ).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-5">
      <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-white/5 group">
            <ShieldAlert className="w-8 h-8 text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)] group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
              DLP Items Register
            </h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${alarmEnabled ? "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-muted"}`} />
              Defect Liability Period tracking & Vendor NCR monitoring
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Button variant={alarmEnabled ? "default" : "outline"} size="sm" onClick={() => setAlarmEnabled(a => !a)} className={alarmEnabled ? "bg-rose-600 hover:bg-rose-500 text-white border-none shadow-lg shadow-rose-600/20" : "bg-card border-border font-semibold text-rose-400"}>
            {alarmEnabled ? <Bell className="w-4 h-4 mr-2 animate-ring" /> : <BellOff className="w-4 h-4 mr-2" />}
            Alarms {alarmEnabled ? "ON" : "OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} className="bg-card hover:bg-muted font-semibold border-border">
            <Upload className="w-4 h-4 mr-2 text-rose-400" /> Import CSV
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold shadow-lg" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Add DLP Item
          </Button>
        </div>
      </div>

      {criticalItems.length > 0 && alarmEnabled && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-400 text-sm">DLP Alarm Active: {criticalItems.length} item(s) need attention</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {items.filter(i => getDaysLeft(i.dlpExpiry) < 0).length > 0 && <span className="text-red-400 font-medium">EXPIRED: {items.filter(i => getDaysLeft(i.dlpExpiry) < 0).length} item(s). </span>}
              Items with DLP expiry within 90 days or ≥3 NCR count require immediate vendor action.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total DLP Items", value: items.length, color: "text-foreground" },
          { label: "Critical/Expired", value: items.filter(i => ["critical", "expired"].includes(getAlarmLevel(getDaysLeft(i.dlpExpiry), i.ncrCount))).length, color: "text-red-400" },
          { label: "Warning", value: items.filter(i => getAlarmLevel(getDaysLeft(i.dlpExpiry), i.ncrCount) === "warning").length, color: "text-yellow-400" },
          { label: "Total NCRs", value: items.reduce((s, i) => s + i.ncrCount, 0), color: "text-orange-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border/50">
            <CardContent className="p-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">DLP Period Overview — KMRC RS-3R Project</span>
            <span className="text-xs text-muted-foreground">End: <span className="font-bold text-foreground">{DLP_END_DATE}</span> · <span className={getDaysLeft(DLP_END_DATE) < 180 ? "text-yellow-400 font-bold" : "text-green-400 font-bold"}>{getDaysLeft(DLP_END_DATE)} days left</span></span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, ((365 - getDaysLeft(DLP_END_DATE)) / 365) * 100))}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["list", "bySystem", "byVendor"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab === "list" ? "All Items" : tab === "bySystem" ? "By System" : "By Vendor"}
          </button>
        ))}
      </div>

      {activeTab === "list" && (
        <>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search description or part number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border text-sm" />
            </div>
            <Select value={filterAlarm || "__all__"} onValueChange={v => setFilterAlarm(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-36 bg-card border-border text-sm"><SelectValue placeholder="All Alarms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Levels</SelectItem>
                {["expired", "critical", "warning", "ok"].map(l => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterVendor || "__all__"} onValueChange={v => setFilterVendor(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-36 bg-card border-border text-sm"><SelectValue placeholder="All Vendors" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Vendors</SelectItem>
                {vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSystem || "__all__"} onValueChange={v => setFilterSystem(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-44 bg-card border-border text-sm"><SelectValue placeholder="All Systems" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Systems</SelectItem>
                {SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {(filterAlarm || filterVendor || filterSystem || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterAlarm(""); setFilterVendor(""); setFilterSystem(""); setSearch(""); }}>Clear</Button>}
            <span className="text-xs text-muted-foreground self-center">{filtered.length} of {items.length}</span>
          </div>

          <Card className="bg-card border-border/50 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left">DLP ID</th>
                    <th className="px-4 py-3 text-left">Item Description</th>
                    <th className="px-4 py-3 text-left">Part No.</th>
                    <th className="px-4 py-3 text-left">System</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">DLP Expiry</th>
                    <th className="px-4 py-3 text-center">Days Left</th>
                    <th className="px-4 py-3 text-center">NCRs</th>
                    <th className="px-4 py-3 text-left">Alarm</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={11} className="px-6 py-8 text-center text-muted-foreground">No DLP items found.</td></tr>
                  ) : filtered.map(i => {
                    const daysLeft = getDaysLeft(i.dlpExpiry);
                    const alarm = getAlarmLevel(daysLeft, i.ncrCount);
                    return (
                      <tr key={i.id} className={`border-b border-border/40 hover:bg-muted/30 ${alarm === "critical" || alarm === "expired" ? "bg-red-500/5" : alarm === "warning" ? "bg-yellow-500/5" : ""}`}>
                        <td className="px-4 py-2.5 font-mono text-xs text-primary">{i.id}</td>
                        <td className="px-4 py-2.5 text-sm font-medium max-w-44 truncate" title={i.itemDescription}>{i.itemDescription}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{i.partNumber}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-28 truncate">{i.system}</td>
                        <td className="px-4 py-2.5 text-center">{i.qty}</td>
                        <td className="px-4 py-2.5 text-xs">{i.vendor}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">{i.dlpExpiry}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-xs">
                          <span className={daysLeft < 0 ? "text-red-400" : daysLeft <= 90 ? "text-orange-400" : daysLeft <= 180 ? "text-yellow-400" : "text-green-400"}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d OD` : `${daysLeft}d`}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {i.ncrCount > 0 ? <span className="text-orange-400 font-bold">{i.ncrCount}</span> : <span className="text-muted-foreground">0</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={`text-[9px] ${ALARM_COLORS[alarm]}`}>{ALARM_LABELS[alarm]}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openEdit(i)}>
                                <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(i)}>
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "bySystem" && (
        <div className="space-y-3">
          {bySystem.map(([sys, sysItems]) => {
            const critical = sysItems.filter(i => ["critical", "expired"].includes(getAlarmLevel(getDaysLeft(i.dlpExpiry), i.ncrCount))).length;
            return (
              <Card key={sys} className="bg-card border-border/50">
                <CardHeader className="pb-2 pt-3 px-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{sys || "Other"}</CardTitle>
                    <div className="flex items-center gap-2">
                      {critical > 0 && <Badge variant="destructive" className="text-[9px]">{critical} Critical</Badge>}
                      <Badge variant="outline" className="text-[9px]">{sysItems.length} items</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-3">
                  <div className="space-y-1.5">
                    {sysItems.map(i => {
                      const daysLeft = getDaysLeft(i.dlpExpiry);
                      const alarm = getAlarmLevel(daysLeft, i.ncrCount);
                      return (
                        <div key={i.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${alarm === "critical" || alarm === "expired" ? "border-red-500/30 bg-red-500/5" : alarm === "warning" ? "border-yellow-500/30 bg-yellow-500/5" : "border-border/40"}`}>
                          <div>
                            <span className="text-xs font-medium">{i.itemDescription}</span>
                            <span className="text-[10px] text-muted-foreground ml-2 font-mono">{i.partNumber}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">{i.vendor}</span>
                            <span className={daysLeft < 0 ? "text-red-400 font-mono" : daysLeft <= 180 ? "text-yellow-400 font-mono" : "text-muted-foreground font-mono"}>{daysLeft}d</span>
                            <Badge variant="outline" className={`text-[9px] ${ALARM_COLORS[alarm]}`}>{ALARM_LABELS[alarm]}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "byVendor" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {byVendor.map(([vendor, vendItems]) => {
            const critical = vendItems.filter(i => ["critical", "expired"].includes(getAlarmLevel(getDaysLeft(i.dlpExpiry), i.ncrCount))).length;
            const totalNcr = vendItems.reduce((s, i) => s + i.ncrCount, 0);
            return (
              <Card key={vendor} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm">{vendor}</p>
                      <p className="text-xs text-muted-foreground">{vendItems.length} DLP items · {totalNcr} total NCRs</p>
                    </div>
                    {critical > 0 && <Badge variant="destructive" className="text-[9px]">{critical} Critical</Badge>}
                  </div>
                  <div className="space-y-1">
                    {vendItems.map(i => {
                      const alarm = getAlarmLevel(getDaysLeft(i.dlpExpiry), i.ncrCount);
                      return (
                        <div key={i.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                          <span className="truncate max-w-[180px]" title={i.itemDescription}>{i.itemDescription}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground">{i.dlpExpiry}</span>
                            <Badge variant="outline" className={`text-[9px] ${ALARM_COLORS[alarm]}`}>{ALARM_LABELS[alarm]}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editId ? "Edit DLP Item" : "Add DLP Item"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>✕</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Item Description *</label>
                <Input value={form.itemDescription} onChange={e => setForm(f => ({ ...f, itemDescription: e.target.value }))} placeholder="e.g. Door Drive Unit" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Part Number *</label>
                <Input value={form.partNumber} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Vendor</label>
                <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">System</label>
                <Select value={form.system} onValueChange={v => setForm(f => ({ ...f, system: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select system" /></SelectTrigger>
                  <SelectContent>{SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Sub-System</label>
                <Input value={form.subsystem} onChange={e => setForm(f => ({ ...f, subsystem: e.target.value }))} className="bg-background border-border" />
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
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">DLP Expiry Date</label>
                <Input type="date" value={form.dlpExpiry} onChange={e => setForm(f => ({ ...f, dlpExpiry: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Replacement Due Date</label>
                <Input type="date" value={form.replacementDue} onChange={e => setForm(f => ({ ...f, replacementDue: e.target.value }))} className="bg-background border-border" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>{editId ? "Update DLP Item" : "Add DLP Item"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
