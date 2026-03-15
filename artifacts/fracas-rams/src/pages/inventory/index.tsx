import { useState } from "react";
import { format } from "date-fns";
import { Package, Plus, Search, Download, AlertCircle, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SYSTEM_TAXONOMY } from "@/lib/taxonomy";

const MOCK_INV = [
  { id: "INV-001", partNo: "DDU-4200",  description: "Door Drive Unit",           system: "Door System",       category: "LRU",     qty: 8,  minQty: 4, unit: "Nos", location: "Store-A/Rack-1", vendor: "Faiveley", unitCost: 85000,  lastReceived: "2025-01-15", condition: "New" },
  { id: "INV-002", partNo: "APS-8001",  description: "Auxiliary Converter Unit",  system: "Auxiliary Electric",category: "LRU",     qty: 3,  minQty: 2, unit: "Nos", location: "Store-A/Rack-2", vendor: "SMA",      unitCost: 320000, lastReceived: "2024-11-10", condition: "New" },
  { id: "INV-003", partNo: "SHOE-001",  description: "Current Collector Shoe",    system: "Traction System",   category: "Consumable", qty: 48, minQty: 24, unit: "Nos", location: "Store-B/Bin-5", vendor: "Schunk",   unitCost: 12000,  lastReceived: "2025-02-20", condition: "New" },
  { id: "INV-004", partNo: "HVAC-F001", description: "HVAC Filter Element",       system: "Air Conditioning",  category: "Consumable", qty: 24, minQty: 20, unit: "Nos", location: "Store-B/Bin-3", vendor: "Faiveley", unitCost: 2500,   lastReceived: "2025-03-01", condition: "New" },
  { id: "INV-005", partNo: "ASP-2104",  description: "Air Spring Assembly",       system: "Bogie & Suspension",category: "LRU",     qty: 6,  minQty: 4, unit: "Sets",location: "Store-C/Rack-1", vendor: "Knorr",    unitCost: 45000,  lastReceived: "2024-12-15", condition: "New" },
  { id: "INV-006", partNo: "TCMS-C10", description: "TCMS Central Unit",          system: "TIMS",              category: "LRU",     qty: 2,  minQty: 1, unit: "Nos", location: "Electronics Lab", vendor: "Mitsubishi",unitCost: 450000, lastReceived: "2024-10-01", condition: "New" },
  { id: "INV-007", partNo: "BRK-PAD",  description: "Brake Pad Set",              system: "Brake System",      category: "Consumable", qty: 120, minQty: 60, unit: "Sets",location: "Store-B/Bin-7", vendor: "Knorr",    unitCost: 8500,   lastReceived: "2025-03-10", condition: "New" },
  { id: "INV-008", partNo: "MCB-63A",  description: "MCB 63A (Protection)",       system: "Auxiliary Electric",category: "Consumable", qty: 15, minQty: 10, unit: "Nos", location: "Store-A/Bin-2", vendor: "ABB",      unitCost: 1800,   lastReceived: "2025-01-20", condition: "New" },
  { id: "INV-009", partNo: "INV-5030", description: "VVVF Traction Inverter",     system: "Traction System",   category: "LRU",     qty: 1,  minQty: 1, unit: "Nos", location: "Store-C/Rack-3", vendor: "Hitachi",  unitCost: 1250000,lastReceived: "2024-09-01", condition: "Repaired" },
  { id: "INV-010", partNo: "SEAL-DOR", description: "Door Rubber Seal (per m)",   system: "Door System",       category: "Consumable", qty: 200, minQty: 100, unit: "Mtr", location: "Store-B/Bin-9", vendor: "Faiveley", unitCost: 450,    lastReceived: "2025-02-10", condition: "New" },
];

const CATEGORIES = ["LRU", "Consumable", "Spare Part", "Tool", "Other"];
const SYSTEMS = SYSTEM_TAXONOMY.map(s => s.name);

const STATUS_COLORS: Record<string, string> = {
  OK:       "bg-green-500/10 text-green-400 border-green-500/30",
  Low:      "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Critical: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function InventoryPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState(MOCK_INV);
  const [form, setForm] = useState({ partNo: "", description: "", system: "", category: "LRU", qty: "", minQty: "", unit: "Nos", location: "", vendor: "", unitCost: "", condition: "New" });

  const getStatus = (qty: number, minQty: number) => {
    if (qty === 0) return "Critical";
    if (qty < minQty) return "Low";
    return "OK";
  };

  const filtered = items.filter(i => {
    if (filterCat && i.category !== filterCat) return false;
    if (filterSystem && i.system !== filterSystem) return false;
    if (search && !i.partNo.toLowerCase().includes(search.toLowerCase()) && !i.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lowStockItems = items.filter(i => i.qty < i.minQty);
  const totalValue = items.reduce((s, i) => s + i.qty * i.unitCost, 0);

  const handleSave = () => {
    if (!form.partNo || !form.description) {
      toast({ title: "Required Fields Missing", description: "Part No. and Description are required.", variant: "destructive" }); return;
    }
    const n = `INV-${String(items.length + 1).padStart(3, "0")}`;
    setItems(prev => [...prev, { id: n, ...form, qty: Number(form.qty) || 0, minQty: Number(form.minQty) || 0, unitCost: Number(form.unitCost) || 0, lastReceived: format(new Date(), "yyyy-MM-dd") }]);
    toast({ title: "Item Added to Store", description: `${n} — ${form.description} added.` });
    setShowForm(false);
    setForm({ partNo: "", description: "", system: "", category: "LRU", qty: "", minQty: "", unit: "Nos", location: "", vendor: "", unitCost: "", condition: "New" });
  };

  const exportCSV = () => {
    const rows = [["ID", "Part No", "Description", "System", "Category", "Qty", "Min Qty", "Unit", "Location", "Vendor", "Unit Cost", "Total Value", "Status"]];
    for (const i of filtered) rows.push([i.id, i.partNo, i.description, i.system, i.category, String(i.qty), String(i.minQty), i.unit, i.location, i.vendor, String(i.unitCost), String(i.qty * i.unitCost), getStatus(i.qty, i.minQty)]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Store_Inventory_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" /> Store Inventory
          </h1>
          <p className="text-muted-foreground mt-1">Manage spare parts, LRUs, and consumables inventory for RS-3R rolling stock maintenance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <TrendingDown className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-yellow-400">{lowStockItems.length} item(s) below minimum stock level</div>
            <div className="text-sm text-muted-foreground">
              {lowStockItems.map(i => i.partNo).join(", ")} — Please initiate procurement.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Items",     value: items.length,                                    color: "text-foreground" },
          { label: "Low Stock",       value: lowStockItems.length,                             color: lowStockItems.length > 0 ? "text-yellow-400" : "text-green-400" },
          { label: "Zero Stock",      value: items.filter(i => i.qty === 0).length,            color: "text-red-400" },
          { label: "Inventory Value", value: `₹${(totalValue/100000).toFixed(1)}L`,            color: "text-primary" },
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
          <Input placeholder="Search part number or description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filterCat || "__all__"} onValueChange={v => setFilterCat(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-40 bg-card border-border"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSystem || "__all__"} onValueChange={v => setFilterSystem(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-48 bg-card border-border"><SelectValue placeholder="All Systems" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Systems</SelectItem>
            {SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterCat || filterSystem || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterCat(""); setFilterSystem(""); setSearch(""); }}>Clear</Button>}
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
                <th className="px-4 py-3 text-center">Min Qty</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-right">Unit Cost (₹)</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const status = getStatus(i.qty, i.minQty);
                return (
                  <tr key={i.id} className={`border-b border-border/40 hover:bg-muted/30 ${status === "Critical" ? "bg-red-500/5" : status === "Low" ? "bg-yellow-500/5" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{i.partNo}</td>
                    <td className="px-4 py-3 text-sm font-medium max-w-40 truncate">{i.description}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{i.system}</td>
                    <td className="px-4 py-3 text-xs">{i.category}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      <span className={status === "Critical" ? "text-red-400" : status === "Low" ? "text-yellow-400" : "text-foreground"}>{i.qty}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{i.minQty}</td>
                    <td className="px-4 py-3 text-xs">{i.unit}</td>
                    <td className="px-4 py-3 text-xs">{i.location}</td>
                    <td className="px-4 py-3 text-xs">{i.vendor}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{i.unitCost.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={STATUS_COLORS[status]}>{status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Inventory Item</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>✕</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Part No. *</label>
                <Input value={form.partNo} onChange={e => setForm(f => ({ ...f, partNo: e.target.value }))} placeholder="e.g. DDU-4201" className="bg-background border-border" />
              </div>
              <div className="col-span-1">
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
                  <SelectContent>{["Nos","Sets","Mtr","Kg","Ltr","Box"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
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
                  <SelectContent>{["New","Good","Repaired","Defective"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSave}>Add to Inventory</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
