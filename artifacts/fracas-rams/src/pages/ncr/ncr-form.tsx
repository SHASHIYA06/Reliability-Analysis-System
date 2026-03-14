import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth-context";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const formSchema = z.object({
  ncrNumber: z.string().optional(),
  projectName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  productName: z.string().optional(),
  assemblyDrawingNumber: z.string().optional(),
  quantity: z.string().optional(),
  supplier: z.string().optional(),
  detectionDate: z.string().optional(),
  place: z.string().optional(),
  storedAt: z.string().optional(),
  severity: z.string().optional(),
  responsibleParty: z.string().optional(),
  materialStatus: z.string().optional(),
  partNumber: z.string().optional(),
  partSerialNumber: z.string().optional(),
  assemblySerialNumber: z.string().optional(),
  blNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  distributionTo: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  issuedBy: z.string().optional(),
  issuedByTeam: z.string().optional(),
  reviewedApprovedBy: z.string().optional(),
  issueDate: z.string().optional(),
  causeOfNonConformity: z.string().optional(),
  correctionAction: z.string().optional(),
  correctionActionDate: z.string().optional(),
  correctionActionBy: z.string().optional(),
  correctionReviewedBy: z.string().optional(),
  decision: z.string().optional(),
  repairProcedureRequired: z.string().optional(),
  status: z.string(),
  linkedJobCardNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NcrFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any | null;
  onSuccess: () => void;
}

function SectionHeader({ icon: Icon, title, color = "text-primary" }: { icon: any; title: string; color?: string }) {
  return (
    <div className={`flex items-center gap-2 border-b border-border/50 pb-2 mt-2 ${color}`}>
      <Icon className="w-4 h-4" />
      <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
    </div>
  );
}

export function NcrForm({ isOpen, onClose, initialData, onSuccess }: NcrFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ncrNumber: initialData?.ncrNumber || "",
      projectName: initialData?.projectName || "KMRCL RS-3R",
      vehicleNumber: initialData?.vehicleNumber || "",
      productName: initialData?.productName || "",
      assemblyDrawingNumber: initialData?.assemblyDrawingNumber || "",
      quantity: initialData?.quantity || "",
      supplier: initialData?.supplier || "",
      detectionDate: initialData?.detectionDate || format(new Date(), "yyyy-MM-dd"),
      place: initialData?.place || "CPD Depot",
      storedAt: initialData?.storedAt || "CPD Depot",
      severity: initialData?.severity || "",
      responsibleParty: initialData?.responsibleParty || "",
      materialStatus: initialData?.materialStatus || "",
      partNumber: initialData?.partNumber || "",
      partSerialNumber: initialData?.partSerialNumber || "",
      assemblySerialNumber: initialData?.assemblySerialNumber || "",
      blNumber: initialData?.blNumber || "",
      invoiceNumber: initialData?.invoiceNumber || "",
      distributionTo: initialData?.distributionTo || "OEM / SBU-S&M / R&D / PM / Purchase / Quality",
      description: initialData?.description || "",
      issuedBy: initialData?.issuedBy || user?.name || "",
      issuedByTeam: initialData?.issuedByTeam || "BEML (S&M)",
      reviewedApprovedBy: initialData?.reviewedApprovedBy || "Shashi Shekhar Mishra",
      issueDate: initialData?.issueDate || format(new Date(), "yyyy-MM-dd"),
      causeOfNonConformity: initialData?.causeOfNonConformity || "",
      correctionAction: initialData?.correctionAction || "",
      correctionActionDate: initialData?.correctionActionDate || "",
      correctionActionBy: initialData?.correctionActionBy || "",
      correctionReviewedBy: initialData?.correctionReviewedBy || "",
      decision: initialData?.decision || "",
      repairProcedureRequired: initialData?.repairProcedureRequired || "no",
      status: initialData?.status || "open",
      linkedJobCardNumber: initialData?.linkedJobCardNumber || "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const url = initialData ? `${BASE}/api/ncr/${initialData.id}` : `${BASE}/api/ncr`;
      const method = initialData ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save NCR");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: initialData ? "NCR Updated" : "NCR Created", description: "NCR saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["ncr"] });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: "Error", description: "Failed to save NCR.", variant: "destructive" }),
  });

  if (!isOpen) return null;

  const TextField = ({ name, label, type = "text", mono = false, placeholder = "" }: { name: any; label: string; type?: string; mono?: boolean; placeholder?: string }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input type={type} {...field} value={field.value ?? ""} className={`bg-background ${mono ? "font-mono" : ""}`} placeholder={placeholder} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  const SelectField = ({ name, label, options, placeholder = "Select..." }: { name: any; label: string; options: { value: string; label: string }[]; placeholder?: string }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="bg-background"><SelectValue placeholder={placeholder} /></SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl h-full bg-card border-l border-border/50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-muted/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{initialData ? `Edit: ${initialData.ncrNumber}` : "New Non-Conformity Report"}</h2>
              <p className="text-xs text-muted-foreground">NCR Format · BEML RS-3R · KMRCL Project</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/20 hover:text-destructive">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form id="ncr-form" onSubmit={form.handleSubmit(d => saveMutation.mutate(d))} className="space-y-7">

              {/* Header Info */}
              <div className="space-y-4">
                <SectionHeader icon={ClipboardList} title="NCR Header Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField name="ncrNumber" label="NCR Number (auto-generated if empty)" mono placeholder="e.g. NCR-BEML-RS3R-202601-001" />
                  <TextField name="projectName" label="Project" placeholder="KMRCL RS-3R" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField name="vehicleNumber" label="Vehicle No." placeholder="e.g. TS#16 DMC1 R2" />
                  <TextField name="productName" label="Product" placeholder="e.g. TFT Display" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField name="quantity" label="Quantity" placeholder="e.g. 01 no." />
                  <TextField name="assemblyDrawingNumber" label="Assembly Drawing No." mono />
                  <TextField name="partNumber" label="Part No." mono />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField name="partSerialNumber" label="Part Serial No." mono />
                  <TextField name="assemblySerialNumber" label="Assembly Serial No." mono />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField name="blNumber" label="B/L No." mono />
                  <TextField name="invoiceNumber" label="Invoice No." mono />
                </div>
                <TextField name="distributionTo" label="Distribution To" placeholder="OEM / SBU-S&M / R&D / PM / Purchase / Quality" />
              </div>

              {/* Detection & Supplier */}
              <div className="space-y-4">
                <SectionHeader icon={AlertCircle} title="Detection & Supplier" color="text-amber-400" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField name="supplier" label="Supplier / OEM" placeholder="e.g. M/s Televic" />
                  <TextField name="responsibleParty" label="Responsible Party" placeholder="e.g. M/s Televic" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField name="detectionDate" label="Detection Date" type="date" />
                  <TextField name="place" label="Place of Detection" placeholder="e.g. CPD Depot" />
                  <TextField name="storedAt" label="Stored At" placeholder="e.g. CPD Depot" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField name="severity" label="Severity" options={[
                    { value: "major", label: "Major" },
                    { value: "minor", label: "Minor" },
                  ]} />
                  <SelectField name="materialStatus" label="Material Status" options={[
                    { value: "before-installation", label: "Before Installation" },
                    { value: "installed", label: "Installed" },
                    { value: "disassembled", label: "Disassembled" },
                    { value: "before-receiving", label: "Before Receiving" },
                  ]} />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <SectionHeader icon={AlertCircle} title="Description of Non-Conformity *" color="text-destructive" />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description *</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="bg-background min-h-[120px] resize-none" placeholder="Describe the non-conformity in detail — observations, conditions, impact, and any related history..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <TextField name="linkedJobCardNumber" label="Linked Job Card Number (if applicable)" mono placeholder="e.g. JC-202601-4125" />
              </div>

              {/* Issuance */}
              <div className="space-y-4">
                <SectionHeader icon={ClipboardList} title="Issuance Details" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField name="issueDate" label="Issue Date" type="date" />
                  <TextField name="issuedBy" label="Issued By" placeholder="Name of issuing engineer" />
                  <TextField name="issuedByTeam" label="Team" placeholder="e.g. BEML (S&M)" />
                </div>
                <TextField name="reviewedApprovedBy" label="Reviewed & Approved By" placeholder="Name of approving authority" />
              </div>

              {/* Cause & Correction */}
              <div className="space-y-4">
                <SectionHeader icon={CheckCircle2} title="Cause & Corrective Action" color="text-green-400" />
                <FormField control={form.control} name="causeOfNonConformity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cause of Non-Conformity</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} className="bg-background resize-none min-h-[90px]" placeholder="Root cause investigation result..." />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="correctionAction" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correction / Corrective Action</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} className="bg-background resize-none min-h-[90px]" placeholder="Describe correction actions taken, part serial numbers IN/OUT, follow-up items..." />
                    </FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField name="correctionActionDate" label="Action Date" type="date" />
                  <TextField name="correctionActionBy" label="Action By" />
                </div>
                <TextField name="correctionReviewedBy" label="Action Reviewed By" />
              </div>

              {/* Decision */}
              <div className="space-y-4">
                <SectionHeader icon={CheckCircle2} title="Decision & Closure" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField name="decision" label="Decision" options={[
                    { value: "claim", label: "Claim" },
                    { value: "holding", label: "Holding" },
                    { value: "use-as-is", label: "Use As Is" },
                    { value: "rework", label: "Rework" },
                    { value: "waiver", label: "Waiver" },
                    { value: "scrap", label: "Scrap" },
                    { value: "repair", label: "Repair" },
                  ]} />
                  <SelectField name="repairProcedureRequired" label="Repair Procedure Required?" options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]} />
                </div>
                <SelectField name="status" label="NCR Status *" options={[
                  { value: "open", label: "Open" },
                  { value: "under-investigation", label: "Under Investigation" },
                  { value: "corrective-action", label: "Corrective Action In Progress" },
                  { value: "closed", label: "Closed" },
                  { value: "rejected", label: "Rejected" },
                ]} />
              </div>

              <div className="h-16" />
            </form>
          </Form>
        </div>

        <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur flex items-center justify-between gap-3 sticky bottom-0 z-10 flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            {user && <span>Filed by: <span className="font-medium text-foreground">{user.name}</span></span>}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button>
            <Button type="submit" form="ncr-form" disabled={saveMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold min-w-[130px]">
              {saveMutation.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save NCR</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
