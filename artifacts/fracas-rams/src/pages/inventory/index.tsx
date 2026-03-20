import React, { useState, useRef, useEffect, useCallback } from "react";

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
  qty: number; reservedQty: number; minQty: number; recommendedQty: number;
  unit: string; location: string; vendor: string; unitCost: number;
  isCritical: number; expiryDate: string | null; condition: string;
  lastReceived: string;
};

type InvTxn = {
  id: string; itemId: string; partNo: string; type: string; qty: number;
  qtyBefore: number; qtyAfter: number; fromLocation: string; toLocation: string;
  referenceId: string; referenceType: string; initiatedBy: string;
  remarks: string; timestamp: string;
};

const CATEGORIES = ["LRU", "Consumable", "Spare Part", "Tool", "Other"];
const SYSTEMS = SYSTEM_TAXONOMY.map(s => s.name);

const STATUS_COLORS: Record<string, string> = {
  OK: "bg-green-500/10 text-green-400 border-green-500/30",
  Low: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Critical: "bg-red-500/10 text-red-400 border-red-500/30",
  Reserved: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

const BLANK_FORM = {
  partNo: "", description: "", system: "", category: "LRU", qty: "",
  minQty: "", recommendedQty: "5", unit: "Nos", location: "Central Store",
  vendor: "", unitCost: "", isCritical: "0", expiryDate: "", condition: "New"
};

function getStatus(i: InvItem): string {
  if (i.qty === 0) return "Critical";
  if (i.qty < i.minQty) return "Low";
  if (i.reservedQty > 0) return "Reserved";
  return "OK";
}

export default function InventoryPage() {
  const { toast } = useToast();
  const importRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"items" | "transactions">("items");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [items, setItems] = useState<InvItem[]>([]);
  const [transactions, setTransactions] = useState<InvTxn[]>([]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/inventory`);
      if (res.ok) setItems(await res.json());
    } catch { }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/inventory/transactions`);
      if (res.ok) setTransactions(await res.json());
    } catch { }
  }, []);

  useEffect(() => {
    fetchItems();
    if (activeTab === "transactions") fetchTransactions();
  }, [fetchItems, fetchTransactions, activeTab]);

  const [form, setForm] = useState<typeof BLANK_FORM>({ ...BLANK_FORM });
  const [showAdjust, setShowAdjust] = useState<InvItem | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<string>("Issue");
  const [refId, setRefId] = useState("");
  const [refType, setRefType] = useState("NCR");
  const [remarks, setRemarks] = useState("");

  const filtered = items.filter(i => {
    if (filterCat && i.category !== filterCat) return false;
    if (filterSystem && i.system !== filterSystem) return false;
    if (filterStatus && getStatus(i) !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.partNo.toLowerCase().includes(q) && !i.description.toLowerCase().includes(q) && !i.vendor.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const lowStockItems = items.filter(i => i.qty <= i.minQty);
  const totalValue = items.reduce((sum: number, item: InvItem) => sum + item.qty * item.unitCost, 0);
  const shortages = items.filter((i: InvItem) => i.qty < i.minQty).length;
  const criticals = items.filter((i: InvItem) => i.qty === 0 && i.isCritical === 1).length;

  const last7DaysIssuance = transactions
    .filter((t: InvTxn) => {
      const d = new Date(t.timestamp);
      const now = new Date();
      return t.type === "Issue" && (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    })
    .reduce((sum: number, t: InvTxn) => sum + Math.abs(t.qty), 0);
  const forecasted30DayNeed = Math.round((last7DaysIssuance / 7) * 30);

  const stats = [
    { label: "Total Asset Value", value: `₹${(totalValue / 100000).toFixed(2)}L`, color: "text-foreground", trend: "Current Book Value" },
    { label: "Shortage Items", value: shortages, color: shortages > 0 ? "text-red-400" : "text-emerald-400", trend: "Requires Re-order" },
    { label: "Critical Lows", value: criticals, color: criticals > 0 ? "text-orange-400" : "text-emerald-400", trend: "0 Stock Items" },
    { label: "30D Forecast", value: forecasted30DayNeed, color: "text-blue-400", trend: "Based on 7-day usage" },
  ];

  const openAdd = () => { setEditId(null); setForm({ ...BLANK_FORM }); setShowForm(true); };
  const openEdit = (item: InvItem) => {
    setEditId(item.id);
    setForm({
      partNo: item.partNo, description: item.description, system: item.system || "",
      category: item.category || "LRU", qty: String(item.qty), minQty: String(item.minQty),
      recommendedQty: String(item.recommendedQty || 5), unit: item.unit || "Nos",
      location: item.location || "Central Store", vendor: item.vendor || "",
      unitCost: String(item.unitCost), isCritical: String(item.isCritical || 0),
      expiryDate: item.expiryDate || "", condition: item.condition || "New"
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.partNo || !form.description) {
      toast({ title: "Required Fields Missing", description: "Part No. and Description are required.", variant: "destructive" }); return;
    }
    const payload = {
      ...form,
      qty: Number(form.qty) || 0,
      minQty: Number(form.minQty) || 0,
      recommendedQty: Number(form.recommendedQty) || 0,
      unitCost: Number(form.unitCost) || 0,
      isCritical: Number(form.isCritical) || 0
    };
    if (editId) {
      await fetch(`${BASE}/api/inventory/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast({ title: "Item Updated", description: `${editId} updated successfully.` });
    } else {
      const n = `INV-${Date.now()}`;
      await fetch(`${BASE}/api/inventory`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n, ...payload, lastReceived: format(new Date(), "yyyy-MM-dd") }) });
      toast({ title: "Item Added to Store", description: `${n} — ${form.description} added.` });
    }
    setShowForm(false);
    fetchItems();
  };

  const handleDelete = async (item: InvItem) => {
    if (!confirm(`Are you sure you want to remove ${item.partNo} from inventory?`)) return;
    await fetch(`${BASE}/api/inventory/${item.id}`, { method: "DELETE" });
    toast({ title: "Item Removed", description: `${item.partNo} removed from inventory.` });
    fetchItems();
  };

  const confirmAdjust = async () => {
    if (!showAdjust || !adjustQty) { toast({ title: "Enter quantity", variant: "destructive" }); return; }
    const delta = Number(adjustQty);
    if (isNaN(delta) || delta <= 0) { toast({ title: "Invalid quantity", variant: "destructive" }); return; }

    const res = await fetch(`${BASE}/api/inventory/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: showAdjust.id,
        type: adjustType,
        qty: delta,
        referenceId: refId,
        referenceType: refType,
        remarks: remarks
      })
    });

    if (res.ok) {
      toast({ title: "Transaction Completed", description: `Processed ${adjustType} for ${showAdjust.partNo}.` });
      setShowAdjust(null);
      setAdjustQty(""); setRefId(""); setRemarks("");
      fetchItems();
      fetchTransactions();
    } else {
      toast({ title: "Transaction Failed", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const rows = [["ID", "Part No", "Description", "System", "Category", "Qty", "Reserved", "Min Qty", "Unit", "Location", "Vendor", "Unit Cost", "Critical", "Status"]];
    for (const i of filtered) rows.push([i.id, i.partNo, i.description, i.system, i.category, String(i.qty), String(i.reservedQty), String(i.minQty), i.unit, i.location, i.vendor, String(i.unitCost), i.isCritical ? "Y" : "N", getStatus(i)]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Store_Inventory_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
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

          const pNo = find(["part_no", "partNo", "Part No", "Part Number", "Item Code", "Material Code", "PartNo"]);
          const desc = find(["description", "item_description", "Item Description", "Description", "Material Description", "Item Name", "Material Name"]);
          if (!pNo && !desc) continue;

          records.push({
            id: find(["id", "SL No", "SLNo", "Serial No", "Record ID"]),
            partNo: pNo || desc,
            description: desc || pNo,
            system: find(["system", "System", "Asset", "Main System", "System Name"]),
            category: find(["category", "Category", "Type", "Component Type"]) || "Spare Part",
            qty: Number((find(["qty", "Qty", "Quantity", "Stock", "Current Stock", "Balance"]) || "0").replace(/[^\d]/g, "")),
            minQty: Number((find(["min_qty", "minQty", "Min Qty", "Buffer", "Safety Stock"]) || "1").replace(/[^\d]/g, "")),
            unit: find(["unit", "Unit", "UOM", "Measure"]) || "Nos",
            location: find(["location", "Location", "Bin", "Shelf", "Rack"]),
            vendor: find(["vendor", "Vendor", "Supplier", "OEM", "Source"]),
            unitCost: Number((find(["unit_cost", "unitCost", "Unit Cost", "Price", "Rate"]) || "0").replace(/[^\d.]/g, "")),
            lastReceived: find(["last_received", "lastReceived", "Date", "Last Date", "Received Date"]),
            condition: find(["condition", "Condition", "Status", "State"]) || "New",
          });
        }

        const res = await fetch(`${BASE}/api/inventory/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records })
        });

        if (res.ok) {
          const result = await res.json();
          toast({ title: "Import Successful", description: `Imported ${result.imported} items to store.` });
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

  const printShortageReport = () => {
    const shortItems = items.filter(i => i.qty < i.minQty);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
<title>Shortage & Procurement Report</title>
<style>
  @page { size: A4; margin: 12mm; }
  body { font-family: sans-serif; font-size: 8.5pt; }
  .h { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f1f1f1; text-align: left; padding: 6px; border: 1px solid #ccc; font-weight: 900; }
  td { padding: 6px; border: 1px solid #ccc; }
  .urg { color: #d00; font-weight: bold; }
</style></head><body>
<div class="h">
  <div style="font-size:14pt;font-weight:900">SHORTAGE & RE-ORDER REPORT</div>
  <div style="font-size:9pt;color:#666">Generating automated procurement requirements based on re-order levels.</div>
  <div style="margin-top:5px">Date: ${format(new Date(), "PPpp")}</div>
</div>
<table>
  <thead><tr><th>Part No</th><th>Description</th><th>Avail</th><th>Min</th><th>Req. Qty</th><th>OEM/Vendor</th><th>Priority</th></tr></thead>
  <tbody>
    ${shortItems.map(i => `
      <tr>
        <td><b>${i.partNo}</b></td><td>${i.description}</td>
        <td>${i.qty}</td><td>${i.minQty}</td>
        <td><b>${i.minQty * 2 - i.qty}</b></td><td>${i.vendor || "-"}</td>
        <td class="${i.qty === 0 ? "urg" : ""}">${i.qty === 0 ? "CRITICAL" : "STANDARD"}</td>
      </tr>`).join("")}
  </tbody>
</table>
</body></html>`);
    win.document.close();
    win.print();
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
    ${items.map((i: InvItem, idx: number) => {
      const st = getStatus(i);
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-white/5 group">
            <Package className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] group-hover:bounce transition-all duration-300" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
              Inventory Systems
            </h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${lowStockItems.length > 0 ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"}`} />
              DLP Store & Asset Spares Management
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} className="bg-card hover:bg-muted font-semibold border-border">
            <Upload className="w-4 h-4 mr-2 text-emerald-400" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={printShortageReport} className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold border-orange-500/30">
            <TrendingDown className="w-4 h-4 mr-2" /> Shortages Report
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Master Item
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border/50 pb-px">
        <button onClick={() => setActiveTab("items")} className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${activeTab === "items" ? "border-emerald-500 text-emerald-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Item Master</button>
        <button onClick={() => setActiveTab("transactions")} className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${activeTab === "transactions" ? "border-emerald-500 text-emerald-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Inventory Transactions</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="bg-card border-border/50">
            <CardContent className="p-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-tight font-black opacity-70">{s.label}</div>
              {s.trend && <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">{s.trend}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {activeTab === "items" ? (
        <>
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
                <SelectItem value="Low">Low Stock</SelectItem>
                <SelectItem value="Critical">Critical (Zero)</SelectItem>
                <SelectItem value="Reserved">With Reservations</SelectItem>
              </SelectContent>
            </Select>
            {(filterCat || filterSystem || filterStatus || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterCat(""); setFilterSystem(""); setFilterStatus(""); setSearch(""); }}>Clear</Button>}
          </div>

          <Card className="bg-card border-border/50 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b border-border font-black tracking-widest">
                  <tr>
                    <th className="px-4 py-3 text-left">Part No.</th>
                    <th className="px-4 py-3 text-left">Item Description</th>
                    <th className="px-4 py-3 text-left">System</th>
                    <th className="px-4 py-3 text-center">Available</th>
                    <th className="px-4 py-3 text-center">Reserved</th>
                    <th className="px-4 py-3 text-center">Min/Rec</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} className="px-6 py-12 text-center text-muted-foreground font-medium italic">No items matching criteria.</td></tr>
                  ) : filtered.map((i: InvItem) => {
                    const status = getStatus(i);
                    return (
                      <tr key={i.id} className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${status === "Critical" ? "bg-red-500/5" : status === "Low" ? "bg-yellow-500/5" : ""}`}>
                        <td className="px-4 py-2.5 font-mono text-xs text-primary font-bold group-hover:text-primary/80">{i.partNo}</td>
                        <td className="px-4 py-2.5">
                          <div className="text-sm font-semibold text-foreground leading-tight">{i.description}</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">{i.category}</div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[120px] truncate">{i.system}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-black text-sm">
                          <span className={status === "Critical" ? "text-red-400" : status === "Low" ? "text-yellow-400" : "text-emerald-400"}>{i.qty}</span>
                          <span className="text-[10px] text-muted-foreground ml-1 opacity-60 font-normal">{i.unit}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-xs text-blue-400/80">
                          {i.reservedQty > 0 ? `${i.reservedQty} ${i.unit}` : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-center text-[10px] space-y-0.5">
                          <div className="text-muted-foreground">Min: <span className="text-foreground/80 font-bold">{i.minQty}</span></div>
                          <div className="text-muted-foreground">Rec: <span className="text-foreground/80 font-bold">{i.recommendedQty}</span></div>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground">{i.location}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[120px]" title={i.vendor}>{i.vendor}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={`text-[10px] uppercase tracking-tighter px-1.5 py-0 rounded-md ring-1 ring-inset ${STATUS_COLORS[status]}`}>{status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted border-none">
                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
                              <DropdownMenuItem onClick={() => openEdit(i)} className="gap-2 py-2.5 cursor-pointer">
                                <Edit2 className="w-4 h-4 text-primary" />
                                <div className="flex flex-col"><span className="text-sm font-bold">Edit Master Detail</span><span className="text-[10px] text-muted-foreground">Update specs and reorder levels</span></div>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setShowAdjust(i); setAdjustType("Issue"); setAdjustQty(""); setRefType("NCR"); }} className="gap-2 py-2.5 cursor-pointer">
                                <ArrowUpDown className="w-4 h-4 text-emerald-400" />
                                <div className="flex flex-col"><span className="text-sm font-bold">Inbound / Outbound</span><span className="text-[10px] text-muted-foreground">Log receipts or maintenance issues</span></div>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border/50" />
                              <DropdownMenuItem className="text-destructive gap-2 py-2.5 cursor-pointer hover:bg-destructive/10" onClick={() => handleDelete(i)}>
                                <Trash2 className="w-4 h-4" />
                                <div className="flex flex-col"><span className="text-sm font-bold uppercase">Decommission</span><span className="text-[10px] opacity-70">Remove from master inventory</span></div>
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
      ) : (
        <Card className="bg-card border-border/50 shadow-lg overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b border-border font-black tracking-widest">
                <tr>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">Item Code</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-center">Prev/Post</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Remarks</th>
                  <th className="px-4 py-3 text-left">In-Charge</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic">No transactions recorded yet.</td></tr>
                ) : transactions.map((t: InvTxn) => (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{format(new Date(t.timestamp), "dd/MM/yy HH:mm")}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{t.partNo}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] font-black uppercase ${t.type === "Receive" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                        t.type === "Issue" ? "bg-orange-500/10 text-orange-400 border-orange-500/30" :
                          t.type === "Reserve" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                            "bg-muted text-muted-foreground"
                        }`}>{t.type}</Badge>
                    </td>
                    <td className={`px-4 py-3 text-center font-black ${t.type === "Receive" || t.type === "Return" ? "text-emerald-400" : "text-orange-400"}`}>{t.type === "Issue" || t.type === "Reserve" ? "-" : "+"}{t.qty}</td>
                    <td className="px-4 py-3 text-center text-[10px] text-muted-foreground font-mono">{t.qtyBefore} → {t.qtyAfter}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-foreground leading-tight">{t.referenceId || "Direct Entry"}</div>
                      <div className="text-[10px] text-muted-foreground opacity-70 uppercase font-black">{t.referenceType || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground italic truncate max-w-[150px]" title={t.remarks}>{t.remarks || "-"}</td>
                    <td className="px-4 py-3 text-[10px] font-medium text-foreground uppercase tracking-tight">{t.initiatedBy || "System Admin"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit Inventory Modal */}
      {
        showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-2xl p-0 overflow-hidden ring-1 ring-white/5">
              <div className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 px-6 py-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/50"><Plus className="w-5 h-5 text-emerald-400" /></div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase">{editId ? "Update Master Asset" : "Register New Asset"}</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Depot Level Parts Inventory System</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={() => setShowForm(false)}>✕</Button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Part Number *</label>
                    <Input value={form.partNo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, partNo: e.target.value }))} placeholder="e.g. KMR-001" className="bg-background border-border" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Description *</label>
                    <Input value={form.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="Item description" className="bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">System</label>
                    <Select value={form.system} onValueChange={(v: string) => setForm((f: any) => ({ ...f, system: v }))}>
                      <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SYSTEMS.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Category</label>
                    <Select value={form.category} onValueChange={(v: string) => setForm((f: any) => ({ ...f, category: v }))}>
                      <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Current Qty</label>
                    <Input type="number" value={form.qty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, qty: e.target.value }))} className="bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Min Qty (Re-order)</label>
                    <Input type="number" value={form.minQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, minQty: e.target.value }))} className="bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Recommended Qty</label>
                    <Input type="number" value={form.recommendedQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, recommendedQty: e.target.value }))} className="bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Unit</label>
                    <Select value={form.unit} onValueChange={(v: string) => setForm((f: any) => ({ ...f, unit: v }))}>
                      <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Nos", "Sets", "Mtrs", "Kgs", "Ltrs"].map(u => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Location</label>
                    <Input value={form.location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="Bin location" className="bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Unit Cost (₹)</label>
                    <Input type="number" value={form.unitCost} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, unitCost: e.target.value }))} className="bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Condition</label>
                    <Select value={form.condition} onValueChange={(v: string) => setForm((f: any) => ({ ...f, condition: v }))}>
                      <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["New", "Serviceable", "Repairable", "Scrap"].map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Reference/OEM</label>
                    <Input value={form.vendor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, vendor: e.target.value }))} placeholder="Manufacturer" className="bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Expiry Date</label>
                    <Input type="date" value={form.expiryDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, expiryDate: e.target.value }))} className="bg-background border-border" />
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 px-6 py-4 flex gap-3 justify-end border-t border-white/5">
                <Button variant="ghost" onClick={() => setShowForm(false)} className="font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-900/20 ring-1 ring-white/10" onClick={handleSave}>
                  {editId ? "Update Ledger" : "Commit to Store"}
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Advanced Stock Transaction Modal */}
      {
        showAdjust && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in duration-200">
            <div className="bg-card border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md p-0 overflow-hidden ring-1 ring-white/5">
              <div className={`px-6 py-4 flex items-center justify-between border-b border-white/5 ${adjustType === "Receive" ? "bg-emerald-600/20" : "bg-orange-600/20"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ring-1 ${adjustType === "Receive" ? "bg-emerald-500/20 ring-emerald-500/50 text-emerald-400" : "bg-orange-500/20 ring-orange-500/50 text-orange-400"}`}>
                    <ArrowUpDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase">Stock {adjustType}</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold">{showAdjust.partNo} · {showAdjust.qty} {showAdjust.unit} Available</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowAdjust(null)}>✕</Button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid gap-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Movement Type</label>
                  <Select value={adjustType} onValueChange={v => setAdjustType(v)}>
                    <SelectTrigger className="bg-muted/30 border-white/5 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Receive">Stock Receipt (Vendor / Transfer)</SelectItem>
                      <SelectItem value="Issue">Maintenance Issue (NCR / Job Card)</SelectItem>
                      <SelectItem value="Return">Scrap / Component Return</SelectItem>
                      <SelectItem value="Reserve" disabled={showAdjust.qty === 0}>Block / Reservation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Quantity ({showAdjust.unit})</label>
                    <Input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} min="1" className="bg-muted/30 border-white/5 h-11 text-center font-black text-lg" />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Reference ID</label>
                    <Input value={refId} onChange={e => setRefId(e.target.value.toUpperCase())} placeholder={adjustType === "Issue" ? "NCR-2025-..." : "Invoice / DO"} className="bg-muted/30 border-white/5 h-11 font-mono text-sm" />
                  </div>
                </div>

                {adjustType === "Issue" && (
                  <div className="grid gap-1.5 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Maintenance Linkage</label>
                    <Select value={refType} onValueChange={setRefType}>
                      <SelectTrigger className="bg-transparent border-none p-0 h-6 text-xs shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NCR">Non-Conformance Report (NCR)</SelectItem>
                        <SelectItem value="Job Card">Corrective Job Card</SelectItem>
                        <SelectItem value="PM">Scheduled Preventive Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Transaction Remarks</label>
                  <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Personnel name, damage details, etc." className="bg-muted/30 border-white/5 h-10 text-xs" />
                </div>
              </div>

              <div className="bg-muted/30 px-6 py-4 flex gap-3">
                <Button variant="outline" onClick={() => setShowAdjust(null)} className="flex-1 font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                <Button className={`flex-1 font-black uppercase tracking-widest text-[10px] shadow-lg ${adjustType === "Issue" ? "bg-orange-600 hover:bg-orange-500 shadow-orange-900/20" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"}`} onClick={confirmAdjust}>
                  Process Movement
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
