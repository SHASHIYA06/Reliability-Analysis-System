import { useState, useRef } from "react";
import { format } from "date-fns";
import Papa from "papaparse";
import { Plus, Search, Filter, Download, Upload, Trash2, Edit, X, ChevronDown } from "lucide-react";
import { 
  useListFailures, 
  useDeleteFailure, 
  useImportFailures,
  type FailureReport 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { JobCardForm } from "./job-card-form";
import { DEPOTS, SYSTEM_TAXONOMY, TRAIN_SETS, CAR_NUMBERS, ORDER_TYPES } from "@/lib/taxonomy";

const FRACAS_CSV_COLUMNS = [
  "jobCardNumber","fracasNumber","depot","orderType","trainNumber","trainSet","carNumber",
  "jobCardIssuedTo","organization","issuedDate","issuedTime",
  "failureDate","failureTime","depotArrivalDate","depotArrivalTime",
  "expectedCompleteDate","expectedCompleteTime","reportingLocation",
  "trainDistanceAtFailure","systemCode","systemName","subsystemCode","subsystemName",
  "equipment","equipmentPartNumber","failureDescription","failureClass",
  "workPending","canBeEnergized","canBeMoved","withdrawalRequired","withdrawalReason","scenarioCode",
  "delay","serviceDistinction","delayDuration","serviceChecks",
  "mainLineAction","inspectionInCharge","sicRequired","sicVerifier","powerBlockRequired",
  "partReplaced","partNumber","partInSerialNumber","partOutSerialNumber","repairDurationMinutes",
  "rootCause","actionTaken","correctiveAction","notes","status",
];

function normalizeBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["yes", "true", "1", "y"].includes(v.toLowerCase().trim());
  return false;
}

function normalizeClass(v: string): string {
  if (!v) return "relevant";
  const lv = v.toLowerCase().replace(/[-_ ]/g, "");
  if (lv.includes("service")) return "service-failure";
  if (lv.includes("nonrelevant") || lv.includes("notrelevant") || lv.includes("norelevant")) return "non-relevant";
  return "relevant";
}

function normalizeStatus(v: string): string {
  if (!v) return "open";
  const lv = v.toLowerCase();
  if (lv.includes("progress") || lv.includes("wip")) return "in-progress";
  if (lv.includes("clos") || lv.includes("done") || lv.includes("complete")) return "closed";
  return "open";
}

export default function JobCards() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FailureReport | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDepot, setFilterDepot] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterTrainSet, setFilterTrainSet] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: failures = [], isLoading, refetch } = useListFailures();
  const deleteMutation = useDeleteFailure();
  const importMutation = useImportFailures();
  const { toast } = useToast();

  const filteredFailures = failures.filter(f => {
    const fa = f as any;
    const matchSearch = !searchTerm ||
      f.jobCardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.trainNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.systemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.failureDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fa.fracasNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fa.jobCardIssuedTo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDepot = !filterDepot || fa.depot === filterDepot;
    const matchSystem = !filterSystem || f.systemCode === filterSystem;
    const matchStatus = !filterStatus || f.status === filterStatus;
    const matchClass = !filterClass || f.failureClass === filterClass;
    const matchTrainSet = !filterTrainSet || fa.trainSet === filterTrainSet;
    return matchSearch && matchDepot && matchSystem && matchStatus && matchClass && matchTrainSet;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job card permanently?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Deleted", description: "Job card deleted." });
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const handleExport = () => {
    const rows = failures.map(f => {
      const fa = f as any;
      return FRACAS_CSV_COLUMNS.reduce((acc: any, col) => {
        acc[col] = fa[col] ?? "";
        return acc;
      }, {});
    });
    const csv = Papa.unparse(rows, { columns: FRACAS_CSV_COLUMNS });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BEML_FRACAS_Export_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: async (results) => {
        if (!results.data || results.data.length === 0) {
          toast({ title: "Import Failed", description: "The file is empty or has no valid rows.", variant: "destructive" });
          return;
        }
        try {
          const records = (results.data as any[]).map((row) => {
            const trainNumber = row["Train No."] || row["trainNumber"] || row["Train Number"] || row["TRAIN NO"] || "";
            const trainId = trainNumber || "unknown";
            return {
              jobCardNumber: row["JC No"] || row["jobCardNumber"] || row["Job Card No"] || undefined,
              fracasNumber: row["SN"] || row["fracasNumber"] || undefined,
              depot: row["depot"] || row["Depot"] || undefined,
              orderType: row["CM/PM/OPM"] || row["orderType"] || row["Order Type"] || undefined,
              trainId: trainId,
              trainNumber: trainNumber,
              trainSet: row["Train No."] || row["trainSet"] || row["Train Set"] || undefined,
              carNumber: row["Car No"] || row["carNumber"] || row["Car No."] || undefined,
              jobCardIssuedTo: row["Job Card Issued to"] || row["jobCardIssuedTo"] || undefined,
              organization: row["organization"] || row["Organisation"] || undefined,
              issuedDate: row["Job card issued  Date"] || row["Job card issued Date"] || row["issuedDate"] || undefined,
              issuedTime: row["Job Card Issued Time"] || row["issuedTime"] || undefined,
              failureDate: row["Failure Occurred Date"] || row["failureDate"] || row["Date"] || new Date().toISOString().split("T")[0],
              failureTime: row["Failure Occurred Time"] || row["failureTime"] || undefined,
              depotArrivalDate: row["Depot Arriving Date"] || row["depotArrivalDate"] || undefined,
              depotArrivalTime: row["Depot Arriving Time"] || row["depotArrivalTime"] || undefined,
              expectedCompleteDate: row["Expected Complete Date"] || row["expectedCompleteDate"] || undefined,
              expectedCompleteTime: row["Expected Complete Time"] || row["expectedCompleteTime"] || undefined,
              reportingLocation: row["Reporting Location"] || row["reportingLocation"] || undefined,
              trainDistanceAtFailure: row["TRAIN ODOMETRE READING DATA (in kms)"] || row["trainDistanceAtFailure"] ? parseFloat(row["TRAIN ODOMETRE READING DATA (in kms)"] || row["trainDistanceAtFailure"]) : undefined,
              systemCode: row["System"] || row["systemCode"] || "GEN",
              systemName: row["System"] || row["systemName"] || "General",
              subsystemCode: row["Sub-System"] || row["subsystemCode"] || undefined,
              subsystemName: row["Sub-System"] || row["subsystemName"] || undefined,
              equipment: row["Equipment"] || row["equipment"] || undefined,
              equipmentPartNumber: row["equipmentPartNumber"] || undefined,
              failureDescription: row["Failure Descriptions"] || row["failureDescription"] || row["Description"] || "Imported failure",
              failureClass: normalizeClass(row["failureClass"] || row["Failure Class"] || row["Classification"] || "relevant"),
              workPending: normalizeBool(row["Work Pending? (Yes or No)"] || row["workPending"]),
              canBeEnergized: normalizeBool(row["Can be energized ?"] || row["canBeEnergized"]),
              canBeMoved: normalizeBool(row["Can be moved ?"] || row["canBeMoved"]),
              withdrawalRequired: normalizeBool(row["Withdraw ? (Yes or No)"] || row["withdrawalRequired"] || row["Withdrawal"]),
              withdrawalReason: row["withdrawalReason"] || undefined,
              delay: normalizeBool(row["Delay ? (Yes or No)"] || row["delay"]),
              serviceDistinction: row["Service Distiction (Case CM)"] || row["serviceDistinction"] || undefined,
              delayDuration: row["Delay Duration"] || row["delayDuration"] || undefined,
              serviceChecks: row["Service Checks (Case PM)"] || row["serviceChecks"] || undefined,
              partReplaced: row["partReplaced"] || row["Part Replaced"] || undefined,
              partNumber: row["partNumber"] || row["Part Number"] || undefined,
              partInSerialNumber: row["partInSerialNumber"] || row["In Sr No"] || undefined,
              partOutSerialNumber: row["partOutSerialNumber"] || row["Out Sr No"] || undefined,
              repairDurationMinutes: row["repairDurationMinutes"] ? parseInt(row["repairDurationMinutes"]) : undefined,
              rootCause: row["rootCause"] || row["Root Cause"] || undefined,
              actionTaken: row["actionTaken"] || row["Action Taken"] || undefined,
              correctiveAction: row["correctiveAction"] || row["Corrective Action"] || undefined,
              notes: row["notes"] || row["Notes"] || undefined,
              status: normalizeStatus(row["status"] || row["Status"] || "open"),
              reportDate: new Date().toISOString().split("T")[0],
            };
          });

          const result = await importMutation.mutateAsync({ data: { records } });
          toast({ 
            title: "Import Successful", 
            description: `Imported ${(result as any)?.imported || records.length} records.` 
          });
          refetch();
        } catch (err: any) {
          toast({ 
            title: "Import Failed", 
            description: err?.message || "Check file format and try again.", 
            variant: "destructive" 
          });
        }
      },
      error: (err: any) => {
        toast({ title: "Parse Error", description: err.message || "Could not parse the file.", variant: "destructive" });
      }
    });
  };

  const handleDownloadTemplate = () => {
    const templateRows = [{
      "JC No": "JC-202601-0001",
      "SN": "1",
      "Job Card Issued to": "AKHILESH KUMAR YADAV",
      "Failure Occurred Date": "2026-01-15",
      "Failure Occurred Time": "10:30",
      "Depot Arriving Date": "2026-01-15",
      "Depot Arriving Time": "11:00",
      "Job Card Issued Time": "11:30",
      "Job card issued  Date": "2026-01-15",
      "Expected Complete Date": "2026-01-16",
      "Expected Complete Time": "18:00",
      "Reporting Location": "CPD",
      "CM/PM/OPM": "CM",
      "TRAIN ODOMETRE READING DATA (in kms)": "45000",
      "Train No.": "RS-3R-01",
      "Car No": "DMC1",
      "Failure Descriptions": "Door failed to close on Car DMC1",
      "Work Pending? (Yes or No)": "No",
      "Can be energized ?": "Yes",
      "Can be moved ?": "Yes",
      "Withdraw ? (Yes or No)": "No",
      "Delay ? (Yes or No)": "Yes",
      "Service Distiction (Case CM)": "6",
      "Delay Duration": "2-min",
      "Service Checks (Case PM)": "",
      "System": "DOR",
      "Sub-System": "DOR-01",
      "Equipment": "Door Panel",
      "failureClass": "relevant",
      "status": "closed",
    }];
    const csv = Papa.unparse(templateRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "BEML_FRACAS_Import_Template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const classColor: Record<string, string> = {
    "service-failure": "bg-destructive/20 text-destructive border-destructive/30",
    "relevant": "bg-primary/20 text-primary border-primary/30",
    "non-relevant": "bg-muted text-muted-foreground border-border",
  };

  const clearFilters = () => {
    setFilterDepot(""); setFilterSystem(""); setFilterStatus(""); 
    setFilterClass(""); setFilterTrainSet("");
  };
  const hasFilters = filterDepot || filterSystem || filterStatus || filterClass || filterTrainSet;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Job Cards</h1>
          <p className="text-muted-foreground mt-1">BEML FRACAS — Failure Reporting & Corrective Action System · RS-3R</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="border-border hover:bg-accent" onClick={handleDownloadTemplate}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Template
          </Button>
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleImport}
            />
            <Button variant="outline" size="sm" className="border-border hover:bg-accent" asChild>
              <label htmlFor="csv-upload-main" className="cursor-pointer">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Import CSV
              </label>
            </Button>
            <input type="file" id="csv-upload-main" className="hidden" accept=".csv" onChange={handleImport} />
          </div>
          <Button variant="outline" size="sm" className="border-border hover:bg-accent" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            onClick={() => { setEditingCard(null); setIsFormOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Job Card
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border/50 shadow-lg shadow-black/20">
        <div className="p-4 border-b border-border/50 flex flex-col gap-4 bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by JC#, FRACAS#, Train, System, Technician..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background border-border/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`border-border ${showFilters ? "bg-primary/10 text-primary border-primary/30" : ""}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1.5" />
                Filters
                {hasFilters && <span className="ml-1.5 w-2 h-2 rounded-full bg-primary" />}
              </Button>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <Select value={filterDepot} onValueChange={setFilterDepot}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Depots" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Depots</SelectItem>
                  {DEPOTS.map(d => <SelectItem key={d.value} value={d.value}>{d.value}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterTrainSet} onValueChange={setFilterTrainSet}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All TrainSets" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All TrainSets</SelectItem>
                  {["TS01","TS02","TS03","TS04","TS05","TS06","TS07","TS08","TS09","TS10","TS11","TS12","TS13","TS14","TS15","TS16","TS17"].map(ts => <SelectItem key={ts} value={ts}>{ts}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSystem} onValueChange={setFilterSystem}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Systems" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Systems</SelectItem>
                  {SYSTEM_TAXONOMY.map(s => <SelectItem key={s.code} value={s.code}>{s.code}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  <SelectItem value="relevant">Relevant</SelectItem>
                  <SelectItem value="non-relevant">Non-Relevant</SelectItem>
                  <SelectItem value="service-failure">Service Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">JC # / FRACAS #</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Train / Car</th>
                <th className="px-4 py-3 font-medium">System / Description</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Loading records...</td></tr>
              ) : filteredFailures.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                  {searchTerm || hasFilters ? "No records match your filters." : "No job cards yet. Create one or import a CSV file."}
                </td></tr>
              ) : (
                filteredFailures.map((failure) => {
                  const fa = failure as any;
                  return (
                    <tr key={failure.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-mono font-medium text-primary text-xs">{failure.jobCardNumber}</div>
                        {fa.fracasNumber && <div className="text-[10px] text-muted-foreground font-mono">#{fa.fracasNumber}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">{format(new Date(failure.failureDate), "dd MMM yyyy")}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-medium">{failure.trainNumber}</div>
                        {fa.carNumber && <div className="text-[10px] text-muted-foreground">{fa.carNumber}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-xs">{failure.systemName}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[220px] mt-0.5">{failure.failureDescription}</div>
                      </td>
                      <td className="px-4 py-3">
                        {fa.orderType && (
                          <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">{fa.orderType}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${classColor[failure.failureClass] || classColor["relevant"]}`}>
                          {failure.failureClass.replace(/-/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={failure.status === "open" ? "destructive" : failure.status === "in-progress" ? "secondary" : "outline"} className="uppercase text-[10px] tracking-wider">
                          {failure.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => { setEditingCard(failure); setIsFormOpen(true); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(failure.id)}>
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

        <div className="px-4 py-3 border-t border-border/50 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing <span className="font-medium text-foreground">{filteredFailures.length}</span> of <span className="font-medium text-foreground">{failures.length}</span> records</span>
          {hasFilters && <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive" onClick={clearFilters}><X className="w-3 h-3 mr-1" />Clear filters</Button>}
        </div>
      </Card>

      {isFormOpen && (
        <JobCardForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editingCard}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
