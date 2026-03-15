import { useState, useRef, useEffect, useCallback } from "react";

import { API_BASE as BASE } from "@/lib/api-base";
import { format } from "date-fns";
import {
  Package, Plus, Search, Download, AlertCircle, TrendingDown, Upload,
  Edit2, Trash2, ArrowUpDown, MoreVertical, Printer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SYSTEM_TAXONOMY } from "@/lib/taxonomy";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type InvItem = {
  id: string; partNo: string; description: string; system: string; category: string;
  qty: number; minQty: number; unit: string; location: string; vendor: string;
  unitCost: number; lastReceived: string; condition: string;
};

const INITIAL_INV: InvItem[] = [
  { id: "INV-001", partNo: "DDU-4200",  description: "Door Drive Unit",           system: "Door System",        category: "LRU",        qty: 8,   minQty: 4,  unit: "Nos",  location: "Store-A/Rack-1",  vendor: "Faiveley",   unitCost: 85000,   lastReceived: "2025-01-15", condition: "New" },
  { id: "INV-002", partNo: "APS-8001",  description: "Auxiliary Converter Unit",  system: "Auxiliary Electric", category: "LRU",        qty: 3,   minQty: 2,  unit: "Nos",  location: "Store-A/Rack-2",  vendor: "SMA",        unitCost: 320000,  lastReceived: "2024-11-10", condition: "New" },
  { id: "INV-003", partNo: "SHOE-001",  description: "Current Collector Shoe",    system: "Traction System",    category: "Consumable", qty: 48,  minQty: 24, unit: "Nos",  location: "Store-B/Bin-5",   vendor: "Schunk",     unitCost: 12000,   lastReceived: "2025-02-20", condition: "New" },
  { id: "INV-004", partNo: "HVAC-F001", description: "HVAC Filter Element",       system: "Air Conditioning",   category: "Consumable", qty: 24,  minQty: 20, unit: "Nos",  location: "Store-B/Bin-3",   vendor: "Faiveley",   unitCost: 2500,    lastReceived: "2025-03-01", condition: "New" },
  { id: "INV-005", partNo: "ASP-2104",  description: "Air Spring Assembly",       system: "Bogie & Suspension", category: "LRU",        qty: 6,   minQty: 4,  unit: "Sets", location: "Store-C/Rack-1",  vendor: "Knorr",      unitCost: 45000,   lastReceived: "2024-12-15", condition: "New" },
  { id: "INV-006", partNo: "TCMS-C10", description: "TCMS Central Unit",          system: "TIMS",               category: "LRU",        qty: 2,   minQty: 1,  unit: "Nos",  location: "Electronics Lab", vendor: "Mitsubishi", unitCost: 450000,  lastReceived: "2024-10-01", condition: "New" },
  { id: "INV-007", partNo: "BRK-PAD",  description: "Brake Pad Set",              system: "Brake System",       category: "Consumable", qty: 120, minQty: 60, unit: "Sets", location: "Store-B/Bin-7",   vendor: "Knorr",      unitCost: 8500,    lastReceived: "2025-03-10", condition: "New" },
  { id: "INV-008", partNo: "MCB-63A",  description: "MCB 63A (Protection)",       system: "Auxiliary Electric", category: "Consumable", qty: 15,  minQty: 10, unit: "Nos",  location: "Store-A/Bin-2",   vendor: "ABB",        unitCost: 1800,    lastReceived: "2025-01-20", condition: "New" },
  { id: "INV-009", partNo: "INV-5030", description: "VVVF Traction Inverter",     system: "Traction System",    category: "LRU",        qty: 1,   minQty: 1,  unit: "Nos",  location: "Store-C/Rack-3",  vendor: "Hitachi",    unitCost: 1250000, lastReceived: "2024-09-01", condition: "Repaired" },
  { id: "INV-010", partNo: "SEAL-DOR", description: "Door Rubber Seal (per m)",   system: "Door System",        category: "Consumable", qty: 200, minQty: 100,unit: "Mtr",  location: "Store-B/Bin-9",   vendor: "Faiveley",   unitCost: 450,     lastReceived: "2025-02-10", condition: "New" },
  { id: "INV-011", partNo: "COMP-001", description: "Air Compressor Unit",         system: "Pneumatic System",   category: "LRU",        qty: 2,   minQty: 1,  unit: "Nos",  location: "Store-C/Rack-2",  vendor: "Knorr",      unitCost: 185000,  lastReceived: "2025-01-05", condition: "New" },
  { id: "INV-012", partNo: "LUBR-001", description: "Wheel Flange Lubricant",      system: "Wheel & Axle",       category: "Consumable", qty: 50,  minQty: 30, unit: "Ltr",  location: "Store-B/Bin-1",   vendor: "Shell",      unitCost: 1200,    lastReceived: "2025-02-28", condition: "New" },
  { id: "INV-013", partNo: "BTRY-001", description: "Battery Pack (110V)",         system: "Auxiliary Electric", category: "LRU",        qty: 4,   minQty: 2,  unit: "Nos",  location: "Store-A/Rack-3",  vendor: "Exide",      unitCost: 62000,   lastReceived: "2024-11-20", condition: "New" },
  { id: "INV-014", partNo: "HORN-001", description: "Air Horn Assembly",            system: "Pneumatic System",   category: "Spare Part", qty: 6,   minQty: 3,  unit: "Nos",  location: "Store-A/Bin-4",   vendor: "Knorr",      unitCost: 8500,    lastReceived: "2025-01-10", condition: "New" },
  { id: "INV-015", partNo: "PCBA-TCU", description: "Traction Control PCB",        system: "Traction System",    category: "LRU",        qty: 2,   minQty: 1,  unit: "Nos",  location: "Electronics Lab", vendor: "Hitachi",    unitCost: 380000,  lastReceived: "2024-08-15", condition: "New" },
];

const CATEGORIES = ["LRU", "Consumable", "Spare Part", "Tool", "Other"];
const SYSTEMS = SYSTEM_TAXONOMY.map(s => s.name);

const STATUS_COLORS: Record<string, string> = {
  OK:       "bg-green-500/10 text-green-400 border-green-500/30",
  Low:      "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Critical: "bg-red-500/10 text-red-400 border-red-500/30",
};

const BLANK_FORM = { partNo: "", description: "", system: "", category: "LRU", qty: "", minQty: "", unit: "Nos", location: "", vendor: "", unitCost: "", condition: "New" };

function getStatus(qty: number, minQty: number) {
  if (qty === 0) return "Critical";
  if (qty < minQty) return "Low";
  return "OK";
}

export default function InventoryPage() {
  const { toast } = useToast();
  const importRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [items, setItems] = useState<InvItem[]>([]);

  const fetchItems = useCallback(async () => {
    try { const res = await fetch(`${BASE}/api/inventory`); if (res.ok) setItems(await res.json()); } catch {}
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);
  const [form, setForm] = useState<typeof BLANK_FORM>({ ...BLANK_FORM });
  const [showAdjust, setShowAdjust] = useState<InvItem | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"issue" | "receive">("receive");

  const filtered = items.filter(i => {
    if (filterCat && i.category !== filterCat) return false;
    if (filterSystem && i.system !== filterSystem) return false;
    if (filterStatus && getStatus(i.qty, i.minQty) !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.partNo.toLowerCase().includes(q) && !i.description.toLowerCase().includes(q) && !i.vendor.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const lowStockItems = items.filter(i => i.qty < i.minQty);
  const totalValue = items.reduce((s, i) => s + i.qty * i.unitCost, 0);

  const openAdd = () => { setEditId(null); setForm({ ...BLANK_FORM }); setShowForm(true); };
  const openEdit = (item: InvItem) => {
    setEditId(item.id);
    setForm({ partNo: item.partNo, description: item.description, system: item.system, category: item.category, qty: String(item.qty), minQty: String(item.minQty), unit: item.unit, location: item.location, vendor: item.vendor, unitCost: String(item.unitCost), condition: item.condition });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.partNo || !form.description) {
      toast({ title: "Required Fields Missing", description: "Part No. and Description are required.", variant: "destructive" }); return;
    }
    const payload = { ...form, qty: Number(form.qty) || 0, minQty: Number(form.minQty) || 0, unitCost: Number(form.unitCost) || 0 };
    if (editId) {
      await fetch(`${BASE}/api/inventory/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast({ title: "Item Updated", description: `${editId} updated successfully.` });
    } else {
      const n = `INV-${String(items.length + 1).padStart(3, "0")}`;
      await fetch(`${BASE}/api/inventory`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n, ...payload, lastReceived: format(new Date(), "yyyy-MM-dd") }) });
      toast({ title: "Item Added to Store", description: `${n} — ${form.description} added.` });
    }
    setShowForm(false);
    fetchItems();
  };

  const handleDelete = async (item: InvItem) => {
    await fetch(`${BASE}/api/inventory/${item.id}`, { method: "DELETE" });
    toast({ title: "Item Removed", description: `${item.partNo} removed from inventory.` });
    fetchItems();
  };

  const confirmAdjust = async () => {
    if (!showAdjust || !adjustQty) { toast({ title: "Enter quantity", variant: "destructive" }); return; }
    const delta = Number(adjustQty);
    if (isNaN(delta) || delta <= 0) { toast({ title: "Invalid quantity", variant: "destructive" }); return; }
    const item = showAdjust;
    const newQty = adjustType === "receive" ? item.qty + delta : Math.max(0, item.qty - delta);
    const newLastReceived = adjustType === "receive" ? format(new Date(), "yyyy-MM-dd") : item.lastReceived;
    await fetch(`${BASE}/api/inventory/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qty: newQty, lastReceived: newLastReceived }) });
    toast({ title: `Stock ${adjustType === "receive" ? "Received" : "Issued"}`, description: `${delta} ${item.unit} ${adjustType === "receive" ? "added to" : "removed from"} ${item.partNo}.` });
    setShowAdjust(null);
    fetchItems();
  };

  const exportCSV = () => {
    const rows = [["ID", "Part No", "Description", "System", "Category", "Qty", "Min Qty", "Unit", "Location", "Vendor", "Unit Cost", "Total Value", "Status"]];
    for (const i of filtered) rows.push([i.id, i.partNo, i.description, i.system, i.category, String(i.qty), String(i.minQty), i.unit, i.location, i.vendor, String(i.unitCost), String(i.qty * i.unitCost), getStatus(i.qty, i.minQty)]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Store_Inventory_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const lines = (ev.target?.result as string).split("\n").filter(Boolean);
        const header = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
        let added = 0;
        const newItems: InvItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.replace(/"/g, "").trim());
          const row: Record<string, string> = {};
          header.forEach((h, idx) => { row[h] = cols[idx] || ""; });
          if (!row["Part No"] && !row["partNo"]) continue;
          const id = `INV-${String(items.length + newItems.length + 1).padStart(3, "0")}`;
          newItems.push({
            id, partNo: row["Part No"] || row["partNo"] || "",
            description: row["Description"] || row["description"] || "",
            system: row["System"] || row["system"] || "",
            category: row["Category"] || row["category"] || "Spare Part",
            qty: Number(row["Qty"] || row["qty"] || 0),
            minQty: Number(row["Min Qty"] || row["minQty"] || 0),
            unit: row["Unit"] || row["unit"] || "Nos",
            location: row["Location"] || row["location"] || "",
            vendor: row["Vendor"] || row["vendor"] || "",
            unitCost: Number(row["Unit Cost"] || row["unitCost"] || 0),
            lastReceived: format(new Date(), "yyyy-MM-dd"),
            condition: row["Condition"] || row["condition"] || "New",
          });
          added++;
        }
        setItems(prev => [...prev, ...newItems]);
        toast({ title: `Imported ${added} items`, description: "Items added to inventory from CSV." });
      } catch {
        toast({ title: "Import Error", description: "Could not parse CSV file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const printStoreReport = () => {
    const lowItems = items.filter(i => i.qty < i.minQty);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
<title>Store Inventory Report</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 8pt; color: #000; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; pb-4; margin-bottom: 8px; }
  .logo { font-weight: 900; font-size: 16pt; color: #E31E24; }
  .title { font-size: 11pt; font-weight: bold; text-align: center; flex: 1; }
  .sub { font-size: 7pt; text-align: center; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #1a1a2e; color: #fff; padding: 4px 6px; font-size: 7pt; text-align: left; }
  td { padding: 3px 6px; border-bottom: 1px solid #ddd; font-size: 7.5pt; }
  tr:nth-child(even) { background: #f8f8f8; }
  .low { background: #fff3cd !important; }
  .critical { background: #f8d7da !important; }
  .footer { margin-top: 12px; display: flex; justify-content: space-between; }
  .sign { flex: 1; text-align: center; border-top: 1px solid #000; margin: 0 10px; padding-top: 3px; font-size: 7pt; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="header">
  <div class="logo">BEML</div>
  <div style="flex:1;text-align:center">
    <div class="title">STORE INVENTORY REPORT</div>
    <div class="sub">KMRC RS-3R Rolling Stock · CPD Depot MNSD · Date: ${format(new Date(), "dd/MM/yyyy")}</div>
  </div>
  <div style="font-size:7pt;text-align:right">Total Items: ${items.length}<br/>Total Value: ₹${(totalValue / 100000).toFixed(1)}L<br/>Low Stock: ${lowStockItems.length}</div>
</div>
<table>
  <thead><tr><th>#</th><th>Part No</th><th>Description</th><th>System</th><th>Qty</th><th>Min</th><th>Unit</th><th>Location</th><th>Vendor</th><th>Unit Cost (₹)</th><th>Status</th></tr></thead>
  <tbody>
    ${items.map((i, idx) => {
      const st = getStatus(i.qty, i.minQty);
      return `<tr class="${st === "Critical" ? "critical" : st === "Low" ? "low" : ""}">
        <td>${idx + 1}</td><td><b>${i.partNo}</b></td><td>${i.description}</td><td>${i.system}</td>
        <td><b>${i.qty}</b></td><td>${i.minQty}</td><td>${i.unit}</td><td>${i.location}</td><td>${i.vendor}</td>
        <td style="text-align:right">${i.unitCost.toLocaleString("en-IN")}</td><td>${st}</td></tr>`;
    }).join("")}
  </tbody>
</table>
<div class="footer">
  <div class="sign">Store Keeper<br/>(Name &amp; Sign)</div>
  <div class="sign">Depot Manager<br/>(Name &amp; Sign)</div>
  <div class="sign">BEML RSE<br/>(Name &amp; Sign)</div>
</div>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-5">
      <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Store Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage spare parts, LRUs, and consumables for RS-3R rolling stock maintenance.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1.5" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={printStoreReport}>
            <Printer className="w-4 h-4 mr-1.5" /> Print Report
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Item
          </Button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-start gap-3">
          <TrendingDown className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-yellow-400 text-sm">{lowStockItems.length} item(s) below minimum stock level — please initiate procurement.</div>
            <div className="text-xs text-muted-foreground">{lowStockItems.map(i => `${i.partNo} (${i.qty}/${i.minQty} ${i.unit})`).join(" · ")}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Items",     value: items.length,                         color: "text-foreground" },
          { label: "Low Stock",       value: lowStockItems.length,                  color: lowStockItems.length > 0 ? "text-yellow-400" : "text-green-400" },
          { label: "Zero Stock",      value: items.filter(i => i.qty === 0).length, color: items.filter(i => i.qty === 0).length > 0 ? "text-red-400" : "text-green-400" },
          { label: "Inventory Value", value: `₹${(totalValue / 100000).toFixed(1)}L`, color: "text-primary" },
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
          <Input placeholder="Search part number, description or vendor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border text-sm" />
        </div>
        <Select value={filterCat || "__all__"} onValueChange={v => setFilterCat(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-36 bg-card border-border text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSystem || "__all__"} onValueChange={v => setFilterSystem(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-44 bg-card border-border text-sm"><SelectValue placeholder="All Systems" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Systems</SelectItem>
            {SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus || "__all__"} onValueChange={v => setFilterStatus(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-32 bg-card border-border text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            <SelectItem value="OK">OK</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        {(filterCat || filterSystem || filterStatus || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterCat(""); setFilterSystem(""); setFilterStatus(""); setSearch(""); }}>Clear</Button>}
        <span className="text-xs text-muted-foreground self-center">{filtered.length} of {items.length}</span>
      </div>

      <Card className="bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">Part No.</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">System</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-center">Min</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-right">Unit Cost (₹)</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="px-6 py-8 text-center text-muted-foreground">No inventory items found.</td></tr>
              ) : filtered.map(i => {
                const status = getStatus(i.qty, i.minQty);
                return (
                  <tr key={i.id} className={`border-b border-border/40 hover:bg-muted/30 ${status === "Critical" ? "bg-red-500/5" : status === "Low" ? "bg-yellow-500/5" : ""}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-primary font-bold">{i.partNo}</td>
                    <td className="px-4 py-2.5 text-sm font-medium max-w-40 truncate" title={i.description}>{i.description}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-28 truncate">{i.system}</td>
                    <td className="px-4 py-2.5 text-xs">{i.category}</td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold">
                      <span className={status === "Critical" ? "text-red-400" : status === "Low" ? "text-yellow-400" : "text-foreground"}>{i.qty}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground text-xs">{i.minQty}</td>
                    <td className="px-4 py-2.5 text-xs">{i.unit}</td>
                    <td className="px-4 py-2.5 text-xs">{i.location}</td>
                    <td className="px-4 py-2.5 text-xs">{i.vendor}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{i.unitCost.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[status]}`}>{status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openEdit(i)}>
                            <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setShowAdjust(i); setAdjustType("receive"); setAdjustQty(""); }}>
                            <ArrowUpDown className="w-3.5 h-3.5 mr-2" /> Adjust Stock
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

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editId ? "Edit Inventory Item" : "Add Inventory Item"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>✕</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Part No. *</label>
                <Input value={form.partNo} onChange={e => setForm(f => ({ ...f, partNo: e.target.value }))} placeholder="e.g. DDU-4201" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Category</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Description *</label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Item description" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">System</label>
                <Select value={form.system} onValueChange={v => setForm(f => ({ ...f, system: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select system" /></SelectTrigger>
                  <SelectContent>{SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Vendor</label>
                <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Vendor name" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Quantity</label>
                <Input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Min Qty (Reorder Level)</label>
                <Input type="number" value={form.minQty} onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Unit</label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Nos", "Sets", "Mtr", "Kg", "Ltr", "Box"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Unit Cost (₹)</label>
                <Input type="number" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Location</label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Store location" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Condition</label>
                <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{["New", "Good", "Repaired", "Defective"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>{editId ? "Update Item" : "Add to Inventory"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Adjust Stock</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAdjust(null)}>✕</Button>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
              <p className="font-mono text-xs text-primary">{showAdjust.partNo}</p>
              <p className="font-semibold text-sm">{showAdjust.description}</p>
              <p className="text-xs text-muted-foreground">Current Stock: <span className="font-bold text-foreground">{showAdjust.qty} {showAdjust.unit}</span></p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Transaction Type</label>
              <Select value={adjustType} onValueChange={v => setAdjustType(v as "issue" | "receive")}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receive">Receive (Add to Stock)</SelectItem>
                  <SelectItem value="issue">Issue (Remove from Stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Quantity ({showAdjust.unit})</label>
              <Input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} min="1" placeholder="Enter quantity" className="bg-background border-border" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={confirmAdjust}>Confirm</Button>
              <Button variant="outline" onClick={() => setShowAdjust(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
