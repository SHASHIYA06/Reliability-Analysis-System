import { useState } from "react";
import { format } from "date-fns";
import { Plus, Search, Edit, Trash2, ClipboardList, Download, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NcrForm } from "./ncr-form";
import Papa from "papaparse";

type Ncr = {
  id: string; ncrNumber: string; projectName?: string; vehicleNumber?: string;
  productName?: string; supplier?: string; detectionDate?: string; place?: string;
  severity?: string; responsibleParty?: string; description: string;
  issuedBy?: string; issueDate?: string; status: string; decision?: string;
  linkedJobCardNumber?: string;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchNcr(): Promise<Ncr[]> {
  const res = await fetch(`${BASE}/api/ncr`);
  if (!res.ok) throw new Error("Failed to fetch NCR");
  return res.json();
}

async function deleteNcr(id: string) {
  const res = await fetch(`${BASE}/api/ncr/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete NCR");
}

const statusBadge: Record<string, { variant: any; label: string }> = {
  "open": { variant: "destructive", label: "Open" },
  "under-investigation": { variant: "secondary", label: "Under Investigation" },
  "corrective-action": { variant: "secondary", label: "Corrective Action" },
  "closed": { variant: "outline", label: "Closed" },
  "rejected": { variant: "outline", label: "Rejected" },
};

export default function NCR() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ncr | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: ncrs = [], isLoading } = useQuery({ queryKey: ["ncr"], queryFn: fetchNcr });

  const deleteMutation = useMutation({
    mutationFn: deleteNcr,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ncr"] });
      toast({ title: "Deleted", description: "NCR deleted successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete NCR.", variant: "destructive" }),
  });

  const filtered = ncrs.filter(n => {
    const m = !search || n.ncrNumber.toLowerCase().includes(search.toLowerCase()) ||
      n.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase()) ||
      n.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      n.linkedJobCardNumber?.toLowerCase().includes(search.toLowerCase());
    const ms = !filterStatus || n.status === filterStatus;
    const mv = !filterSeverity || n.severity === filterSeverity;
    return m && ms && mv;
  });

  const handleExport = () => {
    const csv = Papa.unparse(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BEML_NCR_Export_${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const hasFilters = filterStatus || filterSeverity;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">NCR Management</h1>
          <p className="text-muted-foreground mt-1">Non-Conformity Reports · BEML RS-3R · KMRC Project</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            onClick={() => { setEditing(null); setIsFormOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New NCR
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total NCRs", value: ncrs.length, color: "text-foreground" },
          { label: "Open", value: ncrs.filter(n => n.status === "open").length, color: "text-destructive" },
          { label: "Under Investigation", value: ncrs.filter(n => n.status === "under-investigation").length, color: "text-amber-400" },
          { label: "Closed", value: ncrs.filter(n => n.status === "closed").length, color: "text-green-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card/40 border-border/50 p-4">
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border/50 shadow-lg shadow-black/20">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by NCR#, Vehicle, Supplier, JC#..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-background border-border/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className={showFilters ? "bg-primary/10 text-primary border-primary/30" : ""}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filters
              {hasFilters && <span className="ml-1.5 w-2 h-2 rounded-full bg-primary" />}
            </Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-200">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under-investigation">Under Investigation</SelectItem>
                  <SelectItem value="corrective-action">Corrective Action</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severity</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-9" onClick={() => { setFilterStatus(""); setFilterSeverity(""); }}>
                  <X className="w-4 h-4 mr-1" />Clear
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">NCR Number</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Vehicle / Product</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Linked JC</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">Loading NCR records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  {search || hasFilters ? "No NCRs match your filters." : "No NCR records yet. Create one using the button above."}
                </td></tr>
              ) : (
                filtered.map(ncr => {
                  const sb = statusBadge[ncr.status] || { variant: "outline", label: ncr.status };
                  return (
                    <tr key={ncr.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{ncr.ncrNumber}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {ncr.detectionDate ? format(new Date(ncr.detectionDate), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium">{ncr.vehicleNumber || "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{ncr.productName || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{ncr.supplier || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs truncate max-w-[200px]">{ncr.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        {ncr.severity && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                            ncr.severity === "major" ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }`}>
                            {ncr.severity.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{ncr.linkedJobCardNumber || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={sb.variant} className="text-[10px] uppercase tracking-wider">{sb.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary" onClick={() => { setEditing(ncr); setIsFormOpen(true); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => { if (confirm("Delete this NCR?")) deleteMutation.mutate(ncr.id); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border/50 bg-muted/10 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of <span className="font-medium text-foreground">{ncrs.length}</span> NCR records
        </div>
      </Card>

      {isFormOpen && (
        <NcrForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editing as any}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["ncr"] })}
        />
      )}
    </div>
  );
}
