import { useState, useRef, useEffect, useCallback } from "react";

import { API_BASE as BASE } from "@/lib/api-base";

function dbToTool(r: any): Tool {
  return {
    id: r.id,
    name: r.toolName || "",
    toolNo: r.toolNumber || r.toolId || "",
    itemCode: r.itemCode || "",
    inventoryId: r.inventoryId || "",
    category: r.category || "",
    location: r.location || "",
    condition: r.condition || "Good",
    calibrationDue: r.calibrationDue || "",
    assignedTo: r.issuedTo || "",
    qty: r.qty || 1,
    remarks: r.remarks || "",
    consumable: !!r.consumable,
    referenceSpec: r.referenceSpec || "",
    supplier: r.supplier || "",
    manufacturer: r.manufacturer || "",
    modelNumber: r.modelNumber || "",
    serialNumber: r.serialNumber || "",
    lastUpdated: r.lastUpdated || ""
  };
}

function toolToDb(t: Tool): any {
  return {
    id: t.id,
    toolId: t.toolNo,
    toolName: t.name,
    toolNumber: t.toolNo,
    itemCode: t.itemCode,
    inventoryId: t.inventoryId,
    category: t.category,
    location: t.location,
    condition: t.condition,
    calibrationDue: t.calibrationDue,
    issuedTo: t.assignedTo,
    qty: t.qty,
    remarks: t.remarks,
    consumable: t.consumable,
    referenceSpec: t.referenceSpec,
    supplier: t.supplier,
    manufacturer: t.manufacturer,
    modelNumber: t.modelNumber,
    serialNumber: t.serialNumber,
    lastUpdated: t.lastUpdated
  };
}
import { format } from "date-fns";
import { Wrench, Plus, Search, Download, AlertCircle, Upload, Edit2, Trash2, ArrowRightLeft, MoreVertical, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BEML_USERS } from "@/lib/taxonomy";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tool = {
  id: string;
  name: string;
  toolNo: string;
  itemCode?: string;
  inventoryId?: string;
  category: string;
  location: string;
  condition: string;
  calibrationDue: string;
  assignedTo: string;
  qty: number;
  remarks: string;
  consumable?: boolean;
  referenceSpec?: string;
  supplier?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  lastUpdated?: string;
};

const INITIAL_TOOLS: Tool[] = [
  { id: "TOOL-001", name: "Digital Torque Wrench", toolNo: "TW-001", category: "Mechanical", location: "Tool Room A", condition: "Good", calibrationDue: "2025-06-30", assignedTo: "", qty: 2, remarks: "" },
  { id: "TOOL-002", name: "Multimeter (Fluke 87V)", toolNo: "MM-001", category: "Electrical", location: "Tool Room A", condition: "Good", calibrationDue: "2025-09-30", assignedTo: "AKHILESH KUMAR YADAV", qty: 1, remarks: "Issued to technician" },
  { id: "TOOL-003", name: "Hydraulic Jack (10T)", toolNo: "HJ-001", category: "Mechanical", location: "Bogie Bay", condition: "Good", calibrationDue: "", assignedTo: "", qty: 2, remarks: "" },
  { id: "TOOL-004", name: "Oscilloscope (Tektronix)", toolNo: "OS-001", category: "Electrical", location: "Electronics Lab", condition: "Good", calibrationDue: "2025-12-31", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-005", name: "Megger (Insulation Tester)", toolNo: "MG-001", category: "Electrical", location: "Tool Room B", condition: "Fair", calibrationDue: "2025-03-31", assignedTo: "", qty: 1, remarks: "Calibration overdue" },
  { id: "TOOL-006", name: "Bogie Lifting Equipment", toolNo: "BL-001", category: "Heavy", location: "Workshop", condition: "Good", calibrationDue: "2026-01-31", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-007", name: "Door Force Gauge", toolNo: "DG-001", category: "Measurement", location: "Tool Room A", condition: "Good", calibrationDue: "2025-07-31", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-008", name: "Air Pressure Test Kit", toolNo: "PT-001", category: "Pneumatic", location: "Tool Room A", condition: "Good", calibrationDue: "2025-08-31", assignedTo: "", qty: 2, remarks: "" },
  { id: "TOOL-009", name: "Wheel Profile Gauge", toolNo: "WP-001", category: "Measurement", location: "Workshop", condition: "Good", calibrationDue: "2026-03-31", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-010", name: "Clamp Meter (Fluke 376)", toolNo: "CM-001", category: "Electrical", location: "Tool Room A", condition: "Good", calibrationDue: "2025-10-31", assignedTo: "", qty: 3, remarks: "" },
  { id: "TOOL-011", name: "Pantograph Height Gauge", toolNo: "PH-001", category: "Measurement", location: "Workshop", condition: "Good", calibrationDue: "2026-06-30", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-012", name: "IR Temperature Gun", toolNo: "IT-001", category: "Electrical", location: "Tool Room A", condition: "Good", calibrationDue: "2025-11-30", assignedTo: "", qty: 2, remarks: "" },
  { id: "TOOL-013", name: "Vibration Analyzer", toolNo: "VA-001", category: "Measurement", location: "Electronics Lab", condition: "Good", calibrationDue: "2026-02-28", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-014", name: "Portable Welding Set", toolNo: "WS-001", category: "Heavy", location: "Workshop", condition: "Fair", calibrationDue: "", assignedTo: "", qty: 1, remarks: "Arc welder" },
  { id: "TOOL-015", name: "Locking Plier Set", toolNo: "LP-001", category: "Mechanical", location: "Tool Room A", condition: "Good", calibrationDue: "", assignedTo: "", qty: 3, remarks: "" },
  { id: "TOOL-016", name: "Spirit Level (600mm)", toolNo: "SL-001", category: "Measurement", location: "Tool Room B", condition: "Good", calibrationDue: "2025-12-31", assignedTo: "", qty: 2, remarks: "" },
  { id: "TOOL-017", name: "Cable Stripper/Crimper Set", toolNo: "CS-001", category: "Electrical", location: "Tool Room B", condition: "Good", calibrationDue: "", assignedTo: "", qty: 2, remarks: "" },
  { id: "TOOL-018", name: "Hydraulic Torque Multiplier", toolNo: "HT-001", category: "Mechanical", location: "Bogie Bay", condition: "Good", calibrationDue: "2026-04-30", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-019", name: "AC/DC Power Analyser", toolNo: "PA-001", category: "Electrical", location: "Electronics Lab", condition: "Good", calibrationDue: "2025-09-30", assignedTo: "", qty: 1, remarks: "" },
  { id: "TOOL-020", name: "Brush Cutter (for track)", toolNo: "BC-001", category: "Mechanical", location: "Workshop", condition: "Fair", calibrationDue: "", assignedTo: "", qty: 1, remarks: "Track maintenance use" },
];

const CATEGORIES = ["Electrical", "Mechanical", "Measurement", "Communication", "Safety", "Diagnostic", "Inspection", "Consumable", "Precision", "Other"];

const CONDITION_COLORS: Record<string, string> = {
  "Good": "bg-green-500/10 text-green-400 border-green-500/30",
  "Damaged": "bg-orange-500/10 text-orange-400 border-orange-500/30",
  "Faulty": "bg-red-500/10 text-red-500 border-red-500/30",
  "Requires Attention": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  "Fair": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  "Poor": "bg-red-500/10 text-red-400 border-red-500/30"
};

function getDaysLeft(date: string) {
  if (!date) return 999;
  try { return Math.round((new Date(date).getTime() - Date.now()) / 86400000); }
  catch { return 999; }
}

const BLANK_FORM = { name: "", toolNo: "", category: "Mechanical", location: "", condition: "Good", calibrationDue: "", qty: "1", remarks: "" };

export default function ToolsPage() {
  const { toast } = useToast();
  const importRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterCond, setFilterCond] = useState("");
  const [filterConsumable, setFilterConsumable] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);

  const fetchTools = useCallback(async () => {
    try { const res = await fetch(`${BASE}/api/tools`); if (res.ok) { const data = await res.json(); setTools(data.map(dbToTool)); } } catch { }
  }, []);
  useEffect(() => { fetchTools(); }, [fetchTools]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof BLANK_FORM>({ ...BLANK_FORM });
  const [showIssue, setShowIssue] = useState<Tool | null>(null);
  const [issueUser, setIssueUser] = useState("");

  const filtered = tools.filter(t => {
    if (filterCat && t.category !== filterCat) return false;
    if (filterCond && t.condition !== filterCond) return false;
    if (filterConsumable === "Yes" && !t.consumable) return false;
    if (filterConsumable === "No" && t.consumable) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.toolNo.toLowerCase().includes(q) && !t.location.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const overdue = tools.filter(t => t.calibrationDue && getDaysLeft(t.calibrationDue) < 0).length;
  const dueSoon = tools.filter(t => t.calibrationDue && getDaysLeft(t.calibrationDue) >= 0 && getDaysLeft(t.calibrationDue) <= 30).length;
  const issued = tools.filter(t => t.assignedTo).length;
  const consumablesCount = tools.filter(t => t.consumable).length;
  const consumablesQty = tools.filter(t => t.consumable).reduce((sum, t) => sum + (t.qty || 0), 0);

  const openAdd = () => { setEditId(null); setForm({ ...BLANK_FORM }); setShowForm(true); };
  const openEdit = (t: Tool) => {
    setEditId(t.id);
    setForm({ name: t.name, toolNo: t.toolNo, category: t.category, location: t.location, condition: t.condition, calibrationDue: t.calibrationDue, qty: String(t.qty), remarks: t.remarks, consumable: t.consumable });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.toolNo) {
      toast({ title: "Required Fields Missing", description: "Tool Name and Tool No. are required.", variant: "destructive" }); return;
    }
    const payload = toolToDb({ id: editId || "", ...form, qty: Number(form.qty) || 1, assignedTo: "" });
    if (editId) {
      await fetch(`${BASE}/api/tools/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast({ title: "Tool Updated", description: `${editId} updated successfully.` });
    } else {
      const n = `TOOL-${String(tools.length + 1).padStart(3, "0")}`;
      await fetch(`${BASE}/api/tools`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: n }) });
      toast({ title: "Tool Added", description: `${n} — ${form.name} added to register.` });
    }
    setShowForm(false);
    fetchTools();
  };

  const handleDelete = async (t: Tool) => {
    await fetch(`${BASE}/api/tools/${t.id}`, { method: "DELETE" });
    toast({ title: "Tool Removed", description: `${t.id} removed from register.` });
    fetchTools();
  };

  const handleIssueReturn = async (t: Tool) => {
    if (t.assignedTo) {
      await fetch(`${BASE}/api/tools/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toolToDb({ ...t, assignedTo: "", remarks: t.remarks + " [Returned]" })) });
      toast({ title: "Tool Returned", description: `${t.name} returned to tool store.` });
      fetchTools();
    } else {
      setShowIssue(t);
      setIssueUser("");
    }
  };

  const confirmIssue = async () => {
    if (!showIssue || !issueUser) { toast({ title: "Select User", variant: "destructive" }); return; }
    await fetch(`${BASE}/api/tools/${showIssue.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toolToDb({ ...showIssue, assignedTo: issueUser })) });
    toast({ title: "Tool Issued", description: `${showIssue.name} issued to ${issueUser}.` });
    setShowIssue(null);
    fetchTools();
  };

  const exportCSV = () => {
    const rows = [["ID", "Name", "Tool No", "Category", "Location", "Condition", "Calibration Due", "Qty", "Assigned To", "Consumable", "Remarks"]];
    for (const t of filtered) rows.push([t.id, t.name, t.toolNo, t.category, t.location, t.condition, t.calibrationDue, String(t.qty), t.assignedTo, t.consumable ? "Yes" : "No", t.remarks]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Tools_Register_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const content = ev.target?.result as string;
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return;

        // Helper for robust CSV row parsing (handles quotes and commas)
        const parseRow = (text: string) => {
          const result = [];
          let cur = "";
          let inQuotes = false;
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === "," && !inQuotes) {
              result.push(cur.trim());
              cur = "";
            } else cur += char;
          }
          result.push(cur.trim());
          return result;
        };

        const hRaw = parseRow(lines[0]);
        // Normalize headers for easier matching (lowercase, no spaces/underscores)
        const header = hRaw.map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ""));
        const records: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = parseRow(lines[i]);
          if (cols.length < 2) continue;
          const row: Record<string, string> = {};
          header.forEach((h, idx) => { row[h] = cols[idx] || ""; });

          // Helper for finding value with multiple header aliases (normalized)
          const find = (aliases: string[]) => {
            for (const a of aliases) {
              const norm = a.toLowerCase().replace(/[\s_-]/g, "");
              if (row[norm]) return row[norm];
            }
            return "";
          };

          const name = find(["tool_name", "toolName", "Tool/Item Name", "Name", "Tool Name", "tool_description", "Description", "Item Name", "Material Description", "Material Name"]);
          const toolNo = find(["tool_number", "toolNumber", "Item Code", "Tool No.", "Part No", "Part Number", "ItemCode", "Material Code"]);
          const toolId = find(["tool_id", "toolId", "Inventory ID", "InventoryId", "Tool ID", "ToolID", "SL No", "Serial Number", "S.No", "S/No"]);
          if (!name && !toolNo) continue;

          const qtyText = find(["qty", "Quantity", "Qty", "Count", "Stock", "Current Stock"]) || "1";
          const qty = parseInt(qtyText.replace(/[^\d]/g, ""), 10);
          const rawCons = find(["consumable", "Consumable", "Is Consumable", "Spare", "Discardable"]);
          const isCons = String(rawCons).toLowerCase() === "yes" || String(rawCons).toLowerCase() === "true" || rawCons === "1" || String(rawCons).toLowerCase() === "no"; // if "no", it's false, handled by string checks later

          records.push({
            // Omit 'id' to allow toolId-based UPSERT and prevent brittle sequential collisions
            toolId: toolId || toolNo || `T-${Date.now()}-${i}`,
            toolName: name || toolNo,
            itemCode: toolNo,
            inventoryId: toolId,
            category: find(["category", "Category", "System", "Main System", "Group"]) || "Other",
            location: find(["location", "Location", "Place", "Store", "Lab", "Tool Room"]) || "",
            condition: find(["condition", "Condition", "Status", "Health", "State"]) || "Good",
            qty: isNaN(qty) ? 1 : qty,
            consumable: String(rawCons).toLowerCase() === "yes" || String(rawCons).toLowerCase() === "true",
            calibrationDue: find(["calibration_due", "Calibration Due", "Expiry Date", "Next Calibration", "Due Date"]),
            remarks: find(["remarks", "Remarks", "Remark", "Notes", "Comment"]),
            issuedTo: find(["issued_to", "Assigned To", "Issued To", "Name of Personnel", "User", "Issuer"]),
            referenceSpec: find(["reference_spec", "Reference Spec", "Spec", "Standard", "Specification"]),
            supplier: find(["supplier", "Supplier", "Vendor", "OEM", "Source"]),
            manufacturer: find(["manufacturer", "Manufacturer", "Make", "Brand"]),
            modelNumber: find(["model_number", "Model Number", "Model", "Model No"]),
            serialNumber: find(["serial_number", "Serial Number", "S/No", "S.No", "Machine No"]),
            lastUpdated: find(["last_updated", "Last Updated", "Date Updated", "Update Date", "Entry Date"]),
          });
        }

        const res = await fetch(`${BASE}/api/tools/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records })
        });

        if (res.ok) {
          const result = await res.json();
          toast({ title: "Import Successful", description: `Imported ${result.imported} tools.` });
          fetchTools();
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

  return (
    <div className="space-y-6">
      <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-white/5 group">
            <Wrench className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
              Master Tool List
            </h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              Comprehensive asset tracking & maintenance dashboard
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} className="bg-card hover:bg-muted font-semibold border-border">
            <Upload className="w-4 h-4 mr-2 text-indigo-400" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="bg-card hover:bg-muted font-semibold border-border">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Tool
          </Button>
        </div>
      </div>

      {(overdue > 0 || dueSoon > 0) && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            {overdue > 0 && <div className="font-semibold text-orange-400 text-sm">{overdue} tool(s) have overdue calibration — immediate action required.</div>}
            {dueSoon > 0 && <div className="text-xs text-muted-foreground">{dueSoon} tool(s) have calibration due within 30 days.</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Total Asset Tools", value: tools.filter(t => !t.consumable).length, color: "text-foreground" },
          { label: "Total Consumables", value: consumablesQty, color: "text-blue-400" },
          { label: "Currently Issued", value: issued, color: issued > 0 ? "text-yellow-400" : "text-green-400" },
          { label: "Available", value: (tools.filter(t => !t.consumable).length) - issued, color: "text-green-400" },
          { label: "Calibration Overdue", value: overdue, color: overdue > 0 ? "text-red-400" : "text-green-400" },
          { label: "Due Within 30 Days", value: dueSoon, color: dueSoon > 0 ? "text-yellow-400" : "text-green-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border/50">
            <CardContent className="p-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tool name, number or location..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border text-sm" />
        </div>
        <Select value={filterCat || "__all__"} onValueChange={v => setFilterCat(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-40 bg-card border-border text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterConsumable || "__all__"} onValueChange={v => setFilterConsumable(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-36 bg-card border-border text-sm"><SelectValue placeholder="All Tracking" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Tracking</SelectItem>
            <SelectItem value="Yes">Consumables Only</SelectItem>
            <SelectItem value="No">Non-Consumables Only</SelectItem>
          </SelectContent>
        </Select>
        {(filterCat || filterCond || filterConsumable || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterCat(""); setFilterCond(""); setFilterConsumable(""); setSearch(""); }}>Clear</Button>}
        <span className="text-xs text-muted-foreground self-center">{filtered.length} of {tools.length}</span>
      </div>

      <Card className="bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border font-bold">
              <tr>
                <th className="px-4 py-3 text-left">S/No (Tool ID)</th>
                <th className="px-4 py-3 text-left">Tools Name</th>
                <th className="px-4 py-3 text-left">Asset Type</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-left">Place</th>
                <th className="px-4 py-3 text-left">Condition</th>
                <th className="px-4 py-3 text-left">Make / Reference</th>
                <th className="px-4 py-3 text-left">Calibration Due</th>
                <th className="px-4 py-3 text-left">Remarks</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-8 text-center text-muted-foreground">No tools found.</td></tr>
              ) : filtered.map(t => {
                const daysLeft = getDaysLeft(t.calibrationDue);
                return (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-primary">{t.toolId || t.id}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-sm">{t.toolName || t.name}</div>
                      {t.itemCode && <div className="text-[10px] text-muted-foreground font-mono">{t.itemCode}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.category}</td>
                    <td className="px-4 py-2.5 text-center font-bold">{t.qty}</td>
                    <td className="px-4 py-2.5 text-xs">{t.location}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={`text-[10px] ${CONDITION_COLORS[t.condition] || ""}`}>{t.condition}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs italic text-muted-foreground">
                      {t.referenceSpec || t.modelNumber || t.manufacturer || "---"}
                    </td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                      {t.calibrationDue ? (
                        <div className="flex flex-col">
                          <span className={daysLeft < 0 ? "text-red-400 font-bold" : daysLeft <= 30 ? "text-yellow-400 font-medium" : "text-muted-foreground"}>
                            {t.calibrationDue}
                          </span>
                          {daysLeft < 0 && <span className="text-[9px] text-red-500 font-bold uppercase tracking-tighter">{Math.abs(daysLeft)}d Overdue</span>}
                          {daysLeft >= 0 && daysLeft <= 30 && <span className="text-[9px] text-yellow-500 font-medium tracking-tighter">Due in {daysLeft}d</span>}
                        </div>
                      ) : <span className="text-muted-foreground">---</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground line-clamp-1 max-w-[150px]">
                      {t.remarks || "---"}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Tool
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleIssueReturn(t)}>
                            <ArrowRightLeft className="w-3.5 h-3.5 mr-2" />
                            {t.assignedTo ? "Return Tool" : "Issue Tool"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t)}>
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

      {/* Add / Edit Tool Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editId ? "Edit Tool" : "Add Tool to Register"}</h2>
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
                  <SelectContent>{["Good", "Fair", "Poor", "Defective"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="isConsumable" checked={!!form.consumable} onChange={e => setForm(f => ({ ...f, consumable: e.target.checked }))} className="w-4 h-4 rounded border-border" />
                <label htmlFor="isConsumable" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Mark as Consumable Item</label>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Remarks</label>
                <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional remarks" className="bg-background border-border" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>{editId ? "Update Tool" : "Add Tool"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Tool Modal */}
      {showIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Issue Tool</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowIssue(null)}>✕</Button>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground">Tool</p>
              <p className="font-semibold">{showIssue.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{showIssue.id} · {showIssue.toolNo}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Issue To *</label>
              <Select value={issueUser} onValueChange={setIssueUser}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select technician" /></SelectTrigger>
                <SelectContent>{BEML_USERS.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-1">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={confirmIssue}>Issue Tool</Button>
              <Button variant="outline" onClick={() => setShowIssue(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
