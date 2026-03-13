import { useState } from "react";
import { format } from "date-fns";
import Papa from "papaparse";
import { Plus, Search, Filter, Download, Upload, Trash2, Edit } from "lucide-react";
import { 
  useListFailures, 
  useDeleteFailure, 
  useImportFailures,
  type FailureReport 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { JobCardForm } from "./job-card-form";

export default function JobCards() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FailureReport | null>(null);
  
  const { data: failures = [], isLoading, refetch } = useListFailures();
  const deleteMutation = useDeleteFailure();
  const importMutation = useImportFailures();
  const { toast } = useToast();

  const filteredFailures = failures.filter(f => 
    f.jobCardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.trainNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.failureDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this job card?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast({ title: "Deleted", description: "Job card deleted successfully." });
        refetch();
      } catch (e) {
        toast({ title: "Error", description: "Failed to delete job card.", variant: "destructive" });
      }
    }
  };

  const handleExport = () => {
    const csv = Papa.unparse(failures);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `fracas_export_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Simplified import mapping - in a real app, strict validation needed here
          const records = results.data.map((row: any) => ({
            ...row,
            withdrawalRequired: row.withdrawalRequired === 'true' || row.withdrawalRequired === 'Yes',
            repairDurationMinutes: row.repairDurationMinutes ? parseInt(row.repairDurationMinutes) : undefined,
            trainDistanceAtFailure: row.trainDistanceAtFailure ? parseInt(row.trainDistanceAtFailure) : undefined,
          }));
          
          await importMutation.mutateAsync({ data: { records } });
          toast({ title: "Import Successful", description: `Imported ${records.length} records.` });
          refetch();
        } catch (err) {
          toast({ title: "Import Failed", description: "Invalid CSV format or API error.", variant: "destructive" });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Job Cards</h1>
          <p className="text-muted-foreground mt-1">Manage Failure Reporting and Corrective Action records.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <input 
              type="file" 
              id="csv-upload" 
              className="hidden" 
              accept=".csv"
              onChange={handleImport}
            />
            <Button variant="outline" className="border-border hover:bg-accent" asChild>
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </label>
            </Button>
          </div>
          <Button variant="outline" className="border-border hover:bg-accent" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            onClick={() => { setEditingCard(null); setIsFormOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Job Card
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border/50 shadow-lg shadow-black/20">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by Job #, Train, System..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-border/50"
            />
          </div>
          <Button variant="ghost" className="text-muted-foreground w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Job Card #</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Train</th>
                <th className="px-6 py-4 font-medium">System / Description</th>
                <th className="px-6 py-4 font-medium">Class</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center">Loading records...</td></tr>
              ) : filteredFailures.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No job cards found. Create one or adjust your search.</td></tr>
              ) : (
                filteredFailures.map((failure) => (
                  <tr key={failure.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-primary">{failure.jobCardNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{format(new Date(failure.failureDate), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 font-mono">{failure.trainNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{failure.systemName}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[300px] mt-1">{failure.failureDescription}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        failure.failureClass === 'service-failure' ? 'bg-destructive/20 text-destructive border border-destructive/30' : 
                        failure.failureClass === 'relevant' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {failure.failureClass.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={failure.status === 'open' ? 'destructive' : failure.status === 'in-progress' ? 'secondary' : 'outline'} className="uppercase text-[10px] tracking-wider">
                        {failure.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditingCard(failure); setIsFormOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(failure.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
