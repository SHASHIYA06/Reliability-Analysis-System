import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { X, Save, AlertCircle, Wrench, CheckCircle2, User, FileText, Settings2 } from "lucide-react";
import { 
  useCreateFailure, 
  useUpdateFailure, 
  useListTrains,
  type FailureReport 
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  SYSTEM_TAXONOMY, WITHDRAWAL_SCENARIOS, DEPOTS, TRAIN_SETS, CAR_NUMBERS,
  ORDER_TYPES, SERVICE_DISTINCTIONS, DELAY_DURATIONS, SERVICE_CHECKS, REPORTING_LOCATIONS
} from "@/lib/taxonomy";
import { useAuth } from "@/contexts/auth-context";

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const formSchema = z.object({
  depot: z.string().optional(),
  orderType: z.string().optional(),
  trainId: z.string().min(1, "Train is required"),
  trainSet: z.string().optional(),
  carNumber: z.string().optional(),
  jobCardIssuedTo: z.string().optional(),
  organization: z.string().optional(),
  issuedDate: z.string().optional(),
  issuedTime: z.string().optional(),
  failureDate: z.string().min(1, "Failure date is required"),
  failureTime: z.string().optional(),
  depotArrivalDate: z.string().optional(),
  depotArrivalTime: z.string().optional(),
  expectedCompleteDate: z.string().optional(),
  expectedCompleteTime: z.string().optional(),
  reportingLocation: z.string().optional(),
  trainDistanceAtFailure: z.coerce.number().optional(),
  systemCode: z.string().min(1, "System is required"),
  subsystemCode: z.string().optional(),
  equipment: z.string().optional(),
  equipmentPartNumber: z.string().optional(),
  failureDescription: z.string().min(5, "Description must be at least 5 characters"),
  failureClass: z.enum(["relevant", "non-relevant", "service-failure"]),
  workPending: z.string().optional(),
  canBeEnergized: z.string().optional(),
  canBeMoved: z.string().optional(),
  withdrawalRequired: z.string().optional(),
  withdrawalReason: z.string().optional(),
  scenarioCode: z.string().optional(),
  delay: z.string().optional(),
  serviceDistinction: z.string().optional(),
  delayDuration: z.string().optional(),
  serviceChecks: z.string().optional(),
  mainLineAction: z.string().optional(),
  inspectionInCharge: z.string().optional(),
  sicRequired: z.string().optional(),
  sicVerifier: z.string().optional(),
  powerBlockRequired: z.string().optional(),
  partReplaced: z.string().optional(),
  partNumber: z.string().optional(),
  partInSerialNumber: z.string().optional(),
  partOutSerialNumber: z.string().optional(),
  repairDurationMinutes: z.coerce.number().optional(),
  rootCause: z.string().optional(),
  actionTaken: z.string().optional(),
  correctiveAction: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["open", "in-progress", "closed"]),
});

type FormValues = z.infer<typeof formSchema>;

interface JobCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: FailureReport | null;
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

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

export function JobCardForm({ isOpen, onClose, initialData, onSuccess }: JobCardFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createMutation = useCreateFailure();
  const updateMutation = useUpdateFailure();
  const { data: trains = [] } = useListTrains();

  const [selectedSystem, setSelectedSystem] = useState(initialData?.systemCode || "");

  const boolToStr = (v: boolean | null | undefined) => v ? "yes" : "no";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      depot: (initialData as any)?.depot || "",
      orderType: (initialData as any)?.orderType || "",
      trainId: initialData?.trainId || "",
      trainSet: (initialData as any)?.trainSet || "",
      carNumber: (initialData as any)?.carNumber || "",
      jobCardIssuedTo: (initialData as any)?.jobCardIssuedTo || user?.name || "",
      organization: (initialData as any)?.organization || "BEML",
      issuedDate: (initialData as any)?.issuedDate || format(new Date(), "yyyy-MM-dd"),
      issuedTime: (initialData as any)?.issuedTime || format(new Date(), "HH:mm"),
      failureDate: initialData?.failureDate ? format(new Date(initialData.failureDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      failureTime: initialData?.failureTime || "",
      depotArrivalDate: (initialData as any)?.depotArrivalDate || "",
      depotArrivalTime: (initialData as any)?.depotArrivalTime || "",
      expectedCompleteDate: (initialData as any)?.expectedCompleteDate || "",
      expectedCompleteTime: (initialData as any)?.expectedCompleteTime || "",
      reportingLocation: (initialData as any)?.reportingLocation || "",
      trainDistanceAtFailure: initialData?.trainDistanceAtFailure || undefined,
      systemCode: initialData?.systemCode || "",
      subsystemCode: initialData?.subsystemCode || "",
      equipment: (initialData as any)?.equipment || "",
      equipmentPartNumber: (initialData as any)?.equipmentPartNumber || "",
      failureDescription: initialData?.failureDescription || "",
      failureClass: initialData?.failureClass || "relevant",
      workPending: boolToStr((initialData as any)?.workPending),
      canBeEnergized: boolToStr((initialData as any)?.canBeEnergized),
      canBeMoved: boolToStr((initialData as any)?.canBeMoved),
      withdrawalRequired: boolToStr(initialData?.withdrawalRequired),
      withdrawalReason: initialData?.withdrawalReason || "",
      scenarioCode: initialData?.scenarioCode || "",
      delay: boolToStr((initialData as any)?.delay),
      serviceDistinction: (initialData as any)?.serviceDistinction || "",
      delayDuration: (initialData as any)?.delayDuration || "",
      serviceChecks: (initialData as any)?.serviceChecks || "",
      mainLineAction: (initialData as any)?.mainLineAction || "",
      inspectionInCharge: (initialData as any)?.inspectionInCharge || "",
      sicRequired: boolToStr((initialData as any)?.sicRequired),
      sicVerifier: (initialData as any)?.sicVerifier || "",
      powerBlockRequired: boolToStr((initialData as any)?.powerBlockRequired),
      partReplaced: initialData?.partReplaced || "",
      partNumber: initialData?.partNumber || "",
      partInSerialNumber: (initialData as any)?.partInSerialNumber || "",
      partOutSerialNumber: (initialData as any)?.partOutSerialNumber || "",
      repairDurationMinutes: initialData?.repairDurationMinutes || undefined,
      rootCause: initialData?.rootCause || "",
      actionTaken: initialData?.actionTaken || "",
      correctiveAction: (initialData as any)?.correctiveAction || "",
      notes: initialData?.notes || "",
      status: initialData?.status || "open",
    },
  });

  const watchWorkPending = form.watch("workPending");
  const watchWithdrawal = form.watch("withdrawalRequired");
  const watchDelay = form.watch("delay");
  const watchOrderType = form.watch("orderType");
  const watchSicRequired = form.watch("sicRequired");

  const onSubmit = async (data: FormValues) => {
    try {
      const train = trains.find(t => t.id === data.trainId);
      const system = SYSTEM_TAXONOMY.find(s => s.code === data.systemCode);
      const subsystem = system?.subsystems.find(sub => sub.code === data.subsystemCode);

      const payload = {
        ...data,
        trainNumber: train?.trainNumber || "Unknown",
        systemName: system?.name || "Unknown",
        subsystemName: subsystem?.name,
        workPending: data.workPending === "yes",
        canBeEnergized: data.canBeEnergized === "yes",
        canBeMoved: data.canBeMoved === "yes",
        withdrawalRequired: data.withdrawalRequired === "yes",
        delay: data.delay === "yes",
        sicRequired: data.sicRequired === "yes",
        powerBlockRequired: data.powerBlockRequired === "yes",
        reportDate: new Date().toISOString(),
        technicianId: user?.id,
      };

      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload as any });
        toast({ title: "Updated", description: "Job card updated successfully." });
      } else {
        await createMutation.mutateAsync({ data: payload as any });
        toast({ title: "Created", description: "Job card created successfully." });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save job card.", variant: "destructive" });
    }
  };

  if (!isOpen) return null;

  const currentSystemObj = SYSTEM_TAXONOMY.find(s => s.code === selectedSystem);
  const isPending = createMutation.isPending || updateMutation.isPending;

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

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl h-full bg-card border-l border-border/50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-muted/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {initialData ? `Edit: ${initialData.jobCardNumber}` : "New BEML Job Card"}
              </h2>
              <p className="text-xs text-muted-foreground">FM/RS/PPIO/01/01 · FRACAS Record</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/20 hover:text-destructive">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form id="job-card-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">

              {/* PART A: Job Card Issuance */}
              <div className="space-y-4">
                <SectionHeader icon={FileText} title="Part A — Job Card Issuance" />
                <FieldRow>
                  <SelectField name="depot" label="Depot / Project" options={DEPOTS} placeholder="Select depot" />
                  <SelectField name="orderType" label="Order Type (CM/PM/OPM)" options={ORDER_TYPES} placeholder="Select order type" />
                </FieldRow>
                <FieldRow>
                  <TextField name="jobCardIssuedTo" label="Job Card Issued To" placeholder="Technician / Engineer name" />
                  <TextField name="organization" label="Organisation" placeholder="e.g. BEML, OEM" />
                </FieldRow>
                <FieldRow>
                  <TextField name="issuedDate" label="Job Card Issued Date" type="date" />
                  <TextField name="issuedTime" label="Job Card Issued Time" type="time" />
                </FieldRow>
              </div>

              {/* PART B: Train & Event Details */}
              <div className="space-y-4">
                <SectionHeader icon={AlertCircle} title="Part B — Train & Event Details" color="text-orange-400" />
                <FieldRow>
                  <FormField control={form.control} name="trainId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Train No.</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select train" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {trains.map(t => <SelectItem key={t.id} value={t.id}>{t.trainNumber}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="trainSet" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Train Set</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select train set" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TRAIN_SETS.map(ts => <SelectItem key={ts} value={ts}>{ts}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </FieldRow>
                <FieldRow>
                  <SelectField name="carNumber" label="Car No." options={CAR_NUMBERS} placeholder="Select car" />
                  <TextField name="trainDistanceAtFailure" label="Train Odometer Reading (km)" type="number" mono placeholder="km reading" />
                </FieldRow>
                <FieldRow>
                  <TextField name="failureDate" label="Failure Occurred Date" type="date" />
                  <TextField name="failureTime" label="Failure Occurred Time" type="time" />
                </FieldRow>
                <FieldRow>
                  <TextField name="depotArrivalDate" label="Depot Arriving Date" type="date" />
                  <TextField name="depotArrivalTime" label="Depot Arriving Time" type="time" />
                </FieldRow>
                <FieldRow>
                  <TextField name="expectedCompleteDate" label="Expected Complete Date" type="date" />
                  <TextField name="expectedCompleteTime" label="Expected Complete Time" type="time" />
                </FieldRow>
                <SelectField name="reportingLocation" label="Reporting Location" options={REPORTING_LOCATIONS} placeholder="Select location" />
              </div>

              {/* PART C: System Classification */}
              <div className="space-y-4">
                <SectionHeader icon={Wrench} title="Part C — System & Classification" color="text-blue-400" />
                <FieldRow>
                  <FormField control={form.control} name="systemCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>System *</FormLabel>
                      <Select
                        onValueChange={(val) => { field.onChange(val); setSelectedSystem(val); form.setValue("subsystemCode", ""); }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select system" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SYSTEM_TAXONOMY.map(s => <SelectItem key={s.code} value={s.code}>{s.code} – {s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="subsystemCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-System</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedSystem}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select sub-system" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currentSystemObj?.subsystems.map(s => <SelectItem key={s.code} value={s.code}>{s.code} – {s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </FieldRow>
                <FieldRow>
                  <TextField name="equipment" label="Equipment / Component" placeholder="e.g. TFT Display, Door Panel" />
                  <TextField name="equipmentPartNumber" label="Equipment Part Number" mono />
                </FieldRow>
                <FieldRow>
                  <SelectField name="failureClass" label="Failure Classification *" options={[
                    { value: "relevant", label: "Relevant Failure" },
                    { value: "non-relevant", label: "Non-Relevant Failure" },
                    { value: "service-failure", label: "Service Failure" },
                  ]} />
                  <SelectField name="status" label="Job Card Status *" options={[
                    { value: "open", label: "Open" },
                    { value: "in-progress", label: "In Progress" },
                    { value: "closed", label: "Closed" },
                  ]} />
                </FieldRow>
                <FormField control={form.control} name="failureDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature / Description of Failure *</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="bg-background min-h-[90px] resize-none" placeholder="Full details of failure, location, and observed symptoms..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* PART D: Operational Impact */}
              <div className="space-y-4 bg-amber-500/5 rounded-xl border border-amber-500/20 p-4">
                <SectionHeader icon={AlertCircle} title="Part D — Operational Impact" color="text-amber-400" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SelectField name="workPending" label="Work Pending?" options={YES_NO} />
                  <SelectField name="withdrawalRequired" label="Withdrawal?" options={YES_NO} />
                  <SelectField name="delay" label="Delay?" options={YES_NO} />
                  <SelectField name="canBeEnergized" label="Can Be Energised?" options={YES_NO} />
                </div>
                <SelectField name="canBeMoved" label="Can Be Moved?" options={YES_NO} />

                {watchWithdrawal === "yes" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 animate-in fade-in duration-200">
                    <FormField control={form.control} name="scenarioCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Withdrawal Scenario</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-amber-500/30"><SelectValue placeholder="Select scenario" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WITHDRAWAL_SCENARIOS.map(s => <SelectItem key={s.code} value={s.code}>{s.code} – {s.description.substring(0, 45)}...</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <TextField name="withdrawalReason" label="Withdrawal Reason / Details" />
                  </div>
                )}

                {watchDelay === "yes" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 animate-in fade-in duration-200">
                    <SelectField name="serviceDistinction" label="Service Distinction (CM)" options={SERVICE_DISTINCTIONS} />
                    <SelectField name="delayDuration" label="Delay Duration" options={DELAY_DURATIONS} />
                  </div>
                )}

                {watchOrderType === "PM" && (
                  <div className="pt-1 animate-in fade-in duration-200">
                    <SelectField name="serviceChecks" label="Service Checks (PM)" options={SERVICE_CHECKS} />
                  </div>
                )}
              </div>

              {/* PART E: PPIO / Safety Checks */}
              <div className="space-y-4">
                <SectionHeader icon={Settings2} title="Part E — PPIO Safety & Permissions" color="text-purple-400" />
                <TextField name="mainLineAction" label="Main Line Action (if applicable)" placeholder="Describe any main line action required" />
                <FieldRow>
                  <SelectField name="sicRequired" label="SIC Required?" options={YES_NO} />
                  <SelectField name="powerBlockRequired" label="Power Block Required?" options={YES_NO} />
                </FieldRow>
                {watchSicRequired === "yes" && (
                  <FieldRow>
                    <TextField name="sicVerifier" label="SIC Verifier Name" placeholder="Name of SIC verifier" />
                    <TextField name="inspectionInCharge" label="Inspection In Charge" placeholder="Inspection in charge name" />
                  </FieldRow>
                )}
              </div>

              {/* PART F: Parts & Resolution */}
              <div className="space-y-4">
                <SectionHeader icon={CheckCircle2} title="Part F — Parts Replaced & Resolution" color="text-green-400" />
                <FieldRow>
                  <TextField name="partReplaced" label="Part Replaced / Defective Item" placeholder="Describe replaced component" />
                  <TextField name="partNumber" label="Part Number (LRU)" mono placeholder="Part/LRU number" />
                </FieldRow>
                <FieldRow>
                  <TextField name="partInSerialNumber" label="In Serial No." mono placeholder="Incoming part serial number" />
                  <TextField name="partOutSerialNumber" label="Out Serial No." mono placeholder="Outgoing (faulty) part serial number" />
                </FieldRow>
                <TextField name="repairDurationMinutes" label="Repair Duration (Minutes)" type="number" mono />
                <FormField control={form.control} name="rootCause" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Root Cause Analysis</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} className="bg-background resize-none min-h-[80px]" placeholder="Root cause investigation details..." />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="actionTaken" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Taken</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} className="bg-background resize-none min-h-[80px]" placeholder="Describe all actions performed..." />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="correctiveAction" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corrective Action / Follow-up</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} className="bg-background resize-none min-h-[60px]" placeholder="Long-term corrective action and follow-up items..." />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} className="bg-background resize-none min-h-[60px]" placeholder="Any other relevant details..." />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="h-16" />
            </form>
          </Form>
        </div>

        <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur flex items-center justify-between gap-3 sticky bottom-0 z-10 flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            {user && <span>Filed by: <span className="font-medium text-foreground">{user.name}</span> · {format(new Date(), "dd MMM yyyy HH:mm")}</span>}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button
              type="submit"
              form="job-card-form"
              disabled={isPending}
              className="bg-primary text-primary-foreground font-semibold min-w-[130px]"
            >
              {isPending ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Job Card</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
