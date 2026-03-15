import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, ClipboardList, AlertCircle, CheckCircle2, Wrench } from "lucide-react";
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

const TRAIN_SETS = ["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17"];
const CAR_OPTIONS = ["DM-1","T-1","M-1","M-2","T-2","DM-2","All coaches"];
const SUB_SYSTEMS = [
  "Propulsion","Brake","Door","PAPIS","Communication","TCMS","VCC","Bogie","Coupler",
  "Battery","Pantograph","HVAC","Fire","Lighting","Auxiliary","Gangway","Traction","Signalling",
  "Interior","TRCC","VAC","CCTV",
];

const formSchema = z.object({
  ncrNumber: z.string().optional(),
  sl: z.string().optional(),
  dateOfNcr: z.string().optional(),
  dateOfDetection: z.string().optional(),
  itemDescription: z.string().optional(),
  ncrDescription: z.string().min(5, "Description must be at least 5 characters"),
  partNumber: z.string().optional(),
  modifiedOrUnmodifiedFmi: z.string().optional(),
  failureAfterFmi: z.string().optional(),
  faultySlNo: z.string().optional(),
  healthySlNo: z.string().optional(),
  issuedBy: z.string().optional(),
  qty: z.string().optional(),
  subSystem: z.string().optional(),
  trainNo: z.string().optional(),
  car: z.string().optional(),
  responsibility: z.string().optional(),
  status: z.string(),
  itemRepairedRecouped: z.string().optional(),
  itemReplaced: z.string().optional(),
  dateOfRepairedReplaced: z.string().optional(),
  source: z.string().optional(),
  investigationReportDate: z.string().optional(),
  ncrClosedByDoc: z.string().optional(),
  gatePassNo: z.string().optional(),
  remarks: z.string().optional(),
  irPrinted: z.string().optional(),
  severity: z.string().optional(),
  reviewedApprovedBy: z.string().optional(),
  causeOfNonConformity: z.string().optional(),
  correctionAction: z.string().optional(),
  healthySlNoIn: z.string().optional(),
  faultySlNoOut: z.string().optional(),
  decision: z.string().optional(),
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
      sl: initialData?.sl || "",
      dateOfNcr: initialData?.dateOfNcr || format(new Date(), "yyyy-MM-dd"),
      dateOfDetection: initialData?.dateOfDetection || format(new Date(), "yyyy-MM-dd"),
      itemDescription: initialData?.itemDescription || "",
      ncrDescription: initialData?.ncrDescription || "",
      partNumber: initialData?.partNumber || "",
      modifiedOrUnmodifiedFmi: initialData?.modifiedOrUnmodifiedFmi || "",
      failureAfterFmi: initialData?.failureAfterFmi || "",
      faultySlNo: initialData?.faultySlNo || "",
      healthySlNo: initialData?.healthySlNo || "",
      issuedBy: initialData?.issuedBy || user?.name || "",
      qty: initialData?.qty || "1",
      subSystem: initialData?.subSystem || "",
      trainNo: initialData?.trainNo || "",
      car: initialData?.car || "",
      responsibility: initialData?.responsibility || "",
      status: initialData?.status || "OPEN",
      itemRepairedRecouped: initialData?.itemRepairedRecouped || "",
      itemReplaced: initialData?.itemReplaced || "",
      dateOfRepairedReplaced: initialData?.dateOfRepairedReplaced || "",
      source: initialData?.source || "",
      investigationReportDate: initialData?.investigationReportDate || "",
      ncrClosedByDoc: initialData?.ncrClosedByDoc || "",
      gatePassNo: initialData?.gatePassNo || "",
      remarks: initialData?.remarks || "",
      irPrinted: initialData?.irPrinted || "",
      severity: initialData?.severity || "Minor",
      reviewedApprovedBy: initialData?.reviewedApprovedBy || "Shashi Shekhar Mishra",
      causeOfNonConformity: initialData?.causeOfNonConformity || "",
      correctionAction: initialData?.correctionAction || "",
      healthySlNoIn: initialData?.healthySlNoIn || initialData?.healthySlNo || "",
      faultySlNoOut: initialData?.faultySlNoOut || initialData?.faultySlNo || "",
      decision: initialData?.decision || "",
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
        body: JSON.stringify({
          ...data,
          vehicleNo: data.trainNo ? `TS#${String(data.trainNo).padStart(2,"0")} ${data.car || ""}`.trim() : null,
          descriptionOfNonConformity: data.ncrDescription,
        }),
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

  const TF = ({ name, label, type = "text", mono = false, placeholder = "" }: { name: any; label: string; type?: string; mono?: boolean; placeholder?: string }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input type={type} {...field} value={field.value ?? ""} className={`bg-background h-9 ${mono ? "font-mono text-xs" : ""}`} placeholder={placeholder} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  const SF = ({ name, label, options, placeholder = "Select..." }: { name: any; label: string; options: { value: string; label: string }[]; placeholder?: string }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select
          onValueChange={v => field.onChange(v === "__none__" ? "" : v)}
          value={field.value ? field.value : "__none__"}>
          <FormControl>
            <SelectTrigger className="bg-background h-9"><SelectValue placeholder={placeholder} /></SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map(o => {
              const itemVal = o.value === "" ? "__none__" : o.value;
              return <SelectItem key={itemVal} value={itemVal}>{o.label}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )} />
  );

  const TA = ({ name, label, rows = 3, placeholder = "" }: { name: any; label: string; rows?: number; placeholder?: string }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Textarea {...field} value={field.value ?? ""} className="bg-background resize-none" rows={rows} placeholder={placeholder} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl h-full bg-card border-l border-border/50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
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

              {/* Section 1: NCR Identification (matches master list columns) */}
              <div className="space-y-4">
                <SectionHeader icon={ClipboardList} title="NCR Identification" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TF name="ncrNumber" label="NCR Report No. (auto if empty)" mono placeholder="NCR-BEML RS3R-T&C-CPD-870" />
                  <TF name="sl" label="SL." placeholder="870" />
                  <SF name="status" label="Status *" options={[
                    { value: "OPEN", label: "OPEN" },
                    { value: "CLOSED", label: "CLOSED" },
                    { value: "CANCELED", label: "CANCELED" },
                  ]} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TF name="dateOfNcr" label="Date of NCR" type="date" />
                  <TF name="dateOfDetection" label="Date of Detection" type="date" />
                </div>
                <TF name="itemDescription" label="Item Description" placeholder="e.g. TFT Display, DCU Unit, Brake Pad..." />
                <TA name="ncrDescription" label="NCR Description *" rows={4}
                  placeholder="Describe the non-conformity in detail — observations, conditions, and history..." />
              </div>

              {/* Section 2: Vehicle & Component */}
              <div className="space-y-4">
                <SectionHeader icon={AlertCircle} title="Vehicle & Component Details" color="text-amber-400" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SF name="trainNo" label="Train No. (TS#)" options={[
                    { value: "", label: "— Select —" },
                    ...TRAIN_SETS.map(t => ({ value: t, label: `TS#${t}` }))
                  ]} />
                  <SF name="car" label="Car" options={[
                    { value: "", label: "— Select —" },
                    ...CAR_OPTIONS.map(c => ({ value: c, label: c }))
                  ]} />
                  <SF name="subSystem" label="Sub-System" options={[
                    { value: "", label: "— Select —" },
                    ...SUB_SYSTEMS.map(s => ({ value: s, label: s }))
                  ]} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TF name="partNumber" label="Part Number" mono placeholder="e.g. 3ED01922R20" />
                  <TF name="qty" label="Qty." placeholder="1" />
                  <SF name="severity" label="Severity" options={[
                    { value: "Major", label: "Major" },
                    { value: "Minor", label: "Minor" },
                  ]} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TF name="faultySlNo" label="Faulty Sl. No. (Out)" mono placeholder="Faulty unit serial" />
                  <TF name="healthySlNo" label="Healthy Sl. No. (In)" mono placeholder="Replacement unit serial" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TF name="modifiedOrUnmodifiedFmi" label="Modified/Unmodified FMI" placeholder="Modified / Unmodified" />
                  <TF name="failureAfterFmi" label="Failure After FMI?" placeholder="Yes / No / N/A" />
                </div>
              </div>

              {/* Section 3: Responsibility */}
              <div className="space-y-4">
                <SectionHeader icon={Wrench} title="Responsibility & Issuance" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TF name="responsibility" label="Responsibility (Vendor/BEML)" placeholder="e.g. M/s Televic, M/s KBI, BEML Factory" />
                  <TF name="issuedBy" label="Issued By" placeholder="Engineer name" />
                </div>
                <TF name="reviewedApprovedBy" label="Reviewed & Approved By" placeholder="Shashi Shekhar Mishra" />
              </div>

              {/* Section 4: Repair / Replacement */}
              <div className="space-y-4">
                <SectionHeader icon={CheckCircle2} title="Repair & Replacement" color="text-green-400" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TF name="itemRepairedRecouped" label="Item Repaired / Recouped" placeholder="e.g. REPLACED" />
                  <TF name="itemReplaced" label="Item Replaced (If Any)" placeholder="e.g. DCU Unit" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TF name="dateOfRepairedReplaced" label="Date of Repair/Replace" type="date" />
                  <TF name="source" label="Source" placeholder="e.g. REPLACEMENT BY VENDOR" />
                  <TF name="investigationReportDate" label="Investigation Report Date" type="date" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TF name="healthySlNoIn" label="In (Healthy) Sl. No." mono />
                  <TF name="faultySlNoOut" label="Out (Faulty) Sl. No." mono />
                </div>
              </div>

              {/* Section 5: Cause & Corrective Action */}
              <div className="space-y-4">
                <SectionHeader icon={AlertCircle} title="Cause & Corrective Action" color="text-destructive" />
                <TA name="causeOfNonConformity" label="Cause of Non-Conformity" rows={3}
                  placeholder="Root cause of the non-conformity..." />
                <TA name="correctionAction" label="Correction / Corrective Action" rows={3}
                  placeholder="Corrective actions taken, observations, follow-up items..." />
              </div>

              {/* Section 6: Closure */}
              <div className="space-y-4">
                <SectionHeader icon={CheckCircle2} title="Closure & Decision" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SF name="decision" label="Decision" options={[
                    { value: "", label: "— Select —" },
                    { value: "Claim", label: "Claim" },
                    { value: "Holding", label: "Holding" },
                    { value: "Use as is", label: "Use As Is" },
                    { value: "Rework", label: "Rework" },
                    { value: "Waiver", label: "Waiver" },
                    { value: "Scrap", label: "Scrap" },
                    { value: "Repair", label: "Repair" },
                  ]} />
                  <TF name="ncrClosedByDoc" label="NCR Closed By Doc." mono />
                  <TF name="gatePassNo" label="Gate Pass S/No." mono />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TF name="irPrinted" label="IR Printed" placeholder="Yes / No / N/A" />
                  <TF name="linkedJobCardNumber" label="Linked Job Card Number" mono placeholder="e.g. JC-05-03-26" />
                </div>
                <TA name="remarks" label="Remarks" rows={2} placeholder="Additional remarks..." />
              </div>

              <div className="h-16" />
            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur flex items-center justify-between gap-3 sticky bottom-0 z-10 flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            {user && <span>Filed by: <span className="font-medium text-foreground">{user.name}</span></span>}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button>
            <Button type="submit" form="ncr-form" disabled={saveMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold min-w-[130px]">
              {saveMutation.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save NCR</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
