import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { X, Save, AlertCircle, Wrench, CheckCircle2, User, FileText, Settings2, MapPin, Sparkles, Loader2 } from "lucide-react";
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
  ORDER_TYPES, SERVICE_DISTINCTIONS, DELAY_DURATIONS, SERVICE_CHECKS,
  REPORTING_LOCATIONS, FAILURE_LOCATIONS, FAILURE_CATEGORIES,
  JOB_OPERATING_CONDITIONS, BEML_USERS, TRAIN_NUMBER_TO_SET,
} from "@/lib/taxonomy";
import { useAuth } from "@/contexts/auth-context";

const BASE_API = import.meta.env.BASE_URL.replace(/\/$/, "");

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no",  label: "No" },
];

const USER_OPTIONS = BEML_USERS.filter(u => u.role !== "admin").map(u => ({ value: u.name, label: `${u.name} (${u.id})` }));
const ALL_USER_OPTIONS = BEML_USERS.map(u => ({ value: u.name, label: `${u.name} (${u.id})` }));

const formSchema = z.object({
  depot:                    z.string().optional(),
  orderType:                z.string().optional(),
  trainId:                  z.string().min(1, "Train is required"),
  trainSet:                 z.string().optional(),
  carNumber:                z.string().optional(),
  jobCardIssuedTo:          z.string().optional(),
  organization:             z.string().optional(),
  issuedDate:               z.string().optional(),
  issuedTime:               z.string().optional(),
  failureDate:              z.string().min(1, "Failure date is required"),
  failureTime:              z.string().optional(),
  depotArrivalDate:         z.string().optional(),
  depotArrivalTime:         z.string().optional(),
  expectedCompleteDate:     z.string().optional(),
  expectedCompleteTime:     z.string().optional(),
  jobCardCloseDate:         z.string().optional(),
  jobCardCloseTime:         z.string().optional(),
  reportingLocation:        z.string().optional(),
  trainDistanceAtFailure:   z.coerce.number().optional(),
  systemCode:               z.string().min(1, "System is required"),
  subsystemCode:            z.string().optional(),
  equipment:                z.string().optional(),
  component:                z.string().optional(),
  parts:                    z.string().optional(),
  equipmentPartNumber:      z.string().optional(),
  ncrNumber:                z.string().optional(),
  serialNumber:             z.string().optional(),
  failureName:              z.string().optional(),
  failureDescription:       z.string().min(3, "Description must be at least 3 characters"),
  failureLocation:          z.string().optional(),
  failureCategory:          z.string().optional(),
  failureClass:             z.enum(["relevant", "non-relevant", "service-failure"]),
  reportedBy:               z.string().optional(),
  inspector:                z.string().optional(),
  jobOperatingConditions:   z.string().optional(),
  effectsOnService:         z.string().optional(),
  workPending:              z.string().optional(),
  canBeEnergized:           z.string().optional(),
  canBeMoved:               z.string().optional(),
  withdrawalRequired:       z.string().optional(),
  withdrawalReason:         z.string().optional(),
  scenarioCode:             z.string().optional(),
  delay:                    z.string().optional(),
  delayTime:                z.string().optional(),
  serviceDistinction:       z.string().optional(),
  delayDuration:            z.string().optional(),
  serviceChecks:            z.string().optional(),
  mainLineAction:           z.string().optional(),
  inspectionInCharge:       z.string().optional(),
  sicRequired:              z.string().optional(),
  sicVerifier:              z.string().optional(),
  powerBlockRequired:       z.string().optional(),
  partReplaced:             z.string().optional(),
  partNumber:               z.string().optional(),
  partInSerialNumber:       z.string().optional(),
  partOutSerialNumber:      z.string().optional(),
  componentsTakenOutDate:   z.string().optional(),
  componentsTakenOutSrNo:   z.string().optional(),
  componentsTakenInDate:    z.string().optional(),
  componentsTakenInSrNo:    z.string().optional(),
  carLiftingRequired:       z.string().optional(),
  noOfMen:                  z.coerce.number().optional(),
  repairDurationMinutes:    z.coerce.number().optional(),
  rootCause:                z.string().optional(),
  actionTaken:              z.string().optional(),
  correctiveAction:         z.string().optional(),
  actionEndorsementName:    z.string().optional(),
  actionEndorsementDate:    z.string().optional(),
  notes:                    z.string().optional(),
  status:                   z.enum(["open", "in-progress", "closed"]),
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
function FieldRow3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>;
}

export function JobCardForm({ isOpen, onClose, initialData, onSuccess }: JobCardFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createMutation = useCreateFailure();
  const updateMutation = useUpdateFailure();
  const { data: trains = [] } = useListTrains();

  const [selectedSystem, setSelectedSystem] = useState(initialData?.systemCode || "");
  const [selectedSubsystem, setSelectedSubsystem] = useState((initialData as any)?.subsystemCode || "");

  const boolToStr = (v: boolean | null | undefined | string) => {
    if (v === true || v === "yes") return "yes";
    if (v === false || v === "no") return "no";
    return "no";
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      depot:                  (initialData as any)?.depot || "",
      orderType:              (initialData as any)?.orderType || "",
      trainId:                initialData?.trainId || "",
      trainSet:               (initialData as any)?.trainSet || "",
      carNumber:              (initialData as any)?.carNumber || "",
      jobCardIssuedTo:        (initialData as any)?.jobCardIssuedTo || user?.name || "",
      organization:           (initialData as any)?.organization || "BEML",
      issuedDate:             (initialData as any)?.issuedDate || format(new Date(), "yyyy-MM-dd"),
      issuedTime:             (initialData as any)?.issuedTime || format(new Date(), "HH:mm"),
      failureDate:            initialData?.failureDate ? format(new Date(initialData.failureDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      failureTime:            initialData?.failureTime || "",
      depotArrivalDate:       (initialData as any)?.depotArrivalDate || "",
      depotArrivalTime:       (initialData as any)?.depotArrivalTime || "",
      expectedCompleteDate:   (initialData as any)?.expectedCompleteDate || "",
      expectedCompleteTime:   (initialData as any)?.expectedCompleteTime || "",
      jobCardCloseDate:       (initialData as any)?.jobCardCloseDate || "",
      jobCardCloseTime:       (initialData as any)?.jobCardCloseTime || "",
      reportingLocation:      (initialData as any)?.reportingLocation || "",
      trainDistanceAtFailure: initialData?.trainDistanceAtFailure || undefined,
      systemCode:             initialData?.systemCode || "",
      subsystemCode:          initialData?.subsystemCode || "",
      equipment:              (initialData as any)?.equipment || "",
      component:              (initialData as any)?.component || "",
      parts:                  (initialData as any)?.parts || "",
      equipmentPartNumber:    (initialData as any)?.equipmentPartNumber || "",
      ncrNumber:              (initialData as any)?.ncrNumber || "",
      serialNumber:           (initialData as any)?.serialNumber || "",
      failureName:            (initialData as any)?.failureName || "",
      failureDescription:     initialData?.failureDescription || "",
      failureLocation:        (initialData as any)?.failureLocation || "",
      failureCategory:        (initialData as any)?.failureCategory || "",
      failureClass:           initialData?.failureClass || "relevant",
      reportedBy:             (initialData as any)?.reportedBy || user?.name || "",
      inspector:              (initialData as any)?.inspector || "",
      jobOperatingConditions: (initialData as any)?.jobOperatingConditions || "",
      effectsOnService:       (initialData as any)?.effectsOnService || "",
      workPending:            boolToStr((initialData as any)?.workPending),
      canBeEnergized:         boolToStr((initialData as any)?.canBeEnergized),
      canBeMoved:             boolToStr((initialData as any)?.canBeMoved),
      withdrawalRequired:     boolToStr(initialData?.withdrawalRequired),
      withdrawalReason:       initialData?.withdrawalReason || "",
      scenarioCode:           initialData?.scenarioCode || "",
      delay:                  boolToStr((initialData as any)?.delay),
      delayTime:              (initialData as any)?.delayTime || "",
      serviceDistinction:     (initialData as any)?.serviceDistinction || "",
      delayDuration:          (initialData as any)?.delayDuration || "",
      serviceChecks:          (initialData as any)?.serviceChecks || "",
      mainLineAction:         (initialData as any)?.mainLineAction || "",
      inspectionInCharge:     (initialData as any)?.inspectionInCharge || "",
      sicRequired:            boolToStr((initialData as any)?.sicRequired),
      sicVerifier:            (initialData as any)?.sicVerifier || "",
      powerBlockRequired:     boolToStr((initialData as any)?.powerBlockRequired),
      partReplaced:           initialData?.partReplaced || "",
      partNumber:             initialData?.partNumber || "",
      partInSerialNumber:     (initialData as any)?.partInSerialNumber || "",
      partOutSerialNumber:    (initialData as any)?.partOutSerialNumber || "",
      componentsTakenOutDate: (initialData as any)?.componentsTakenOutDate || "",
      componentsTakenOutSrNo: (initialData as any)?.componentsTakenOutSrNo || "",
      componentsTakenInDate:  (initialData as any)?.componentsTakenInDate || "",
      componentsTakenInSrNo:  (initialData as any)?.componentsTakenInSrNo || "",
      carLiftingRequired:     boolToStr((initialData as any)?.carLiftingRequired),
      noOfMen:                (initialData as any)?.noOfMen || undefined,
      repairDurationMinutes:  initialData?.repairDurationMinutes || undefined,
      rootCause:              initialData?.rootCause || "",
      actionTaken:            initialData?.actionTaken || "",
      correctiveAction:       (initialData as any)?.correctiveAction || "",
      actionEndorsementName:  (initialData as any)?.actionEndorsementName || "",
      actionEndorsementDate:  (initialData as any)?.actionEndorsementDate || "",
      notes:                  initialData?.notes || "",
      status:                 initialData?.status || "open",
    },
  });

  const watchWorkPending      = form.watch("workPending");
  const watchWithdrawal       = form.watch("withdrawalRequired");
  const watchDelay            = form.watch("delay");
  const watchOrderType        = form.watch("orderType");
  const watchSicRequired      = form.watch("sicRequired");
  const watchEffectsOnService = form.watch("effectsOnService");
  const watchPartReplaced     = form.watch("partReplaced");

  const [aiLoading, setAiLoading] = useState(false);

  const suggestRootCause = async () => {
    const vals = form.getValues();
    const systemCode = vals.systemCode;
    const sysObj = SYSTEM_TAXONOMY.find(s => s.code === systemCode);
    const systemName = sysObj?.name || systemCode || "Unknown";
    const description = vals.failureDescription || "";
    if (!description.trim()) {
      toast({ title: "Add Failure Description first", description: "Enter the failure description before requesting AI analysis.", variant: "destructive" }); return;
    }
    setAiLoading(true);
    try {
      const res = await fetch(`${BASE_API}/api/ai/root-cause`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemName, description, failureCategory: vals.failureCategory, durationHours: vals.repairDurationMinutes ? vals.repairDurationMinutes / 60 : undefined }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const { answer } = await res.json();
      form.setValue("rootCause", answer, { shouldDirty: true });
      toast({ title: "AI Root Cause Generated", description: "Review and edit the AI suggestion as needed." });
    } catch {
      toast({ title: "AI Analysis Failed", description: "Could not reach the AI service. Please try again.", variant: "destructive" });
    } finally { setAiLoading(false); }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const train = trains.find(t => t.id === data.trainId);
      const system = SYSTEM_TAXONOMY.find(s => s.code === data.systemCode);
      const subsystem = system?.subsystems.find(sub => sub.code === data.subsystemCode);

      const payload = {
        ...data,
        trainNumber: train?.trainNumber || "Unknown",
        trainSet: TRAIN_NUMBER_TO_SET[train?.trainNumber || ""] || data.trainSet || "",
        systemName: system?.name || "Unknown",
        subsystemName: subsystem?.name,
        workPending:          data.workPending === "yes",
        canBeEnergized:       data.canBeEnergized === "yes",
        canBeMoved:           data.canBeMoved === "yes",
        withdrawalRequired:   data.withdrawalRequired === "yes",
        delay:                data.delay === "yes",
        sicRequired:          data.sicRequired === "yes",
        powerBlockRequired:   data.powerBlockRequired === "yes",
        carLiftingRequired:   data.carLiftingRequired === "yes",
        reportDate: new Date().toISOString(),
        technicianId: user?.id,
      };

      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload as any });
        toast({ title: "Job Card Updated", description: `${initialData.jobCardNumber} updated successfully.` });
      } else {
        await createMutation.mutateAsync({ data: payload as any });
        toast({ title: "Job Card Created", description: "New FRACAS job card created successfully." });
      }
      onSuccess();
      onClose();
    } catch {
      toast({ title: "Save Failed", description: "Failed to save job card. Please check all required fields.", variant: "destructive" });
    }
  };

  if (!isOpen) return null;

  const currentSystemObj   = SYSTEM_TAXONOMY.find(s => s.code === selectedSystem);
  const currentSubsysObj   = currentSystemObj?.subsystems.find(s => s.code === selectedSubsystem);
  const isPending          = createMutation.isPending || updateMutation.isPending;

  const SF = ({ name, label, options, placeholder = "Select...", disabled = false }: {
    name: any; label: string; options: { value: string; label: string }[]; placeholder?: string; disabled?: boolean;
  }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select
          onValueChange={v => field.onChange(v === "__none__" ? "" : v)}
          value={field.value || "__none__"}
          disabled={disabled}
        >
          <FormControl>
            <SelectTrigger className="bg-background"><SelectValue placeholder={placeholder} /></SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="__none__"><em className="text-muted-foreground">— None —</em></SelectItem>
            {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )} />
  );

  const TF = ({ name, label, type = "text", mono = false, placeholder = "" }: {
    name: any; label: string; type?: string; mono?: boolean; placeholder?: string;
  }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            type={type}
            {...field}
            value={field.value ?? ""}
            className={`bg-background ${mono ? "font-mono" : ""}`}
            placeholder={placeholder}
            onChange={e => field.onChange(type === "number" ? e.target.valueAsNumber || undefined : e.target.value)}
          />
        </FormControl>
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
            <form id="job-card-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* ── SECTION 1: Issuance ── */}
              <div className="space-y-4">
                <SectionHeader icon={FileText} title="Part A — Job Card Issuance" />
                <FieldRow>
                  <SF name="depot" label="Depot / Project" options={DEPOTS} placeholder="Select depot" />
                  <SF name="orderType" label="CM / PM / OPM *" options={ORDER_TYPES} placeholder="Select type" />
                </FieldRow>
                <FieldRow>
                  <SF name="jobCardIssuedTo" label="Job Card Issued To" options={USER_OPTIONS} placeholder="Select user" />
                  <TF name="organization" label="Organisation" placeholder="e.g. BEML, OEM" />
                </FieldRow>
                <FieldRow>
                  <TF name="issuedDate" label="Job Card Issued Date" type="date" />
                  <TF name="issuedTime" label="Job Card Issued Time" type="time" />
                </FieldRow>
              </div>

              {/* ── SECTION 2: Train & Event ── */}
              <div className="space-y-4">
                <SectionHeader icon={AlertCircle} title="Part B — Train & Failure Event Details" color="text-orange-400" />
                <FieldRow>
                  {/* Train Number */}
                  <FormField control={form.control} name="trainId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Train No. *</FormLabel>
                      <Select
                        onValueChange={v => {
                          field.onChange(v === "__none__" ? "" : v);
                          const t = trains.find(tr => tr.id === (v === "__none__" ? "" : v));
                          if (t) form.setValue("trainSet", TRAIN_NUMBER_TO_SET[t.trainNumber] || "");
                        }}
                        value={field.value || "__none__"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select train" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__"><em className="text-muted-foreground">— Select —</em></SelectItem>
                          {trains.sort((a,b)=>a.trainNumber.localeCompare(b.trainNumber)).map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {TRAIN_NUMBER_TO_SET[t.trainNumber]} — {t.trainNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <SF name="carNumber" label="Car No." options={CAR_NUMBERS} placeholder="Select car" />
                </FieldRow>
                <FieldRow>
                  <TF name="trainDistanceAtFailure" label="Train Odometer Reading (km)" type="number" mono placeholder="Odometer reading at failure" />
                  <SF name="reportingLocation" label="Reporting Location" options={REPORTING_LOCATIONS} placeholder="Select location" />
                </FieldRow>
                <FieldRow>
                  <TF name="failureDate" label="Failure Occurred Date *" type="date" />
                  <TF name="failureTime" label="Failure Occurred Time" type="time" />
                </FieldRow>
                <FieldRow>
                  <TF name="depotArrivalDate" label="Depot Arriving Date" type="date" />
                  <TF name="depotArrivalTime" label="Depot Arriving Time" type="time" />
                </FieldRow>
                <FieldRow>
                  <TF name="issuedDate" label="Job Card Issued Date" type="date" />
                  <TF name="issuedTime" label="Job Card Issued Time" type="time" />
                </FieldRow>
                <FieldRow>
                  <TF name="expectedCompleteDate" label="Expected Complete Date" type="date" />
                  <TF name="expectedCompleteTime" label="Expected Complete Time" type="time" />
                </FieldRow>
                <FieldRow>
                  <SF name="reportedBy" label="Reported By" options={USER_OPTIONS} placeholder="Select user" />
                  <SF name="inspector" label="Inspector / PPIO" options={USER_OPTIONS} placeholder="Select inspector" />
                </FieldRow>
              </div>

              {/* ── SECTION 3: System & Failure ── */}
              <div className="space-y-4">
                <SectionHeader icon={Wrench} title="Part C — System & Failure Classification" color="text-blue-400" />
                <FieldRow>
                  <FormField control={form.control} name="systemCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>System *</FormLabel>
                      <Select
                        onValueChange={v => {
                          const val = v === "__none__" ? "" : v;
                          field.onChange(val);
                          setSelectedSystem(val);
                          setSelectedSubsystem("");
                          form.setValue("subsystemCode", "");
                          form.setValue("equipment", "");
                          form.setValue("component", "");
                        }}
                        value={field.value || "__none__"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select system" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__"><em className="text-muted-foreground">— Select System —</em></SelectItem>
                          {SYSTEM_TAXONOMY.map(s => (
                            <SelectItem key={s.code} value={s.code}>{s.code} – {s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="subsystemCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-System</FormLabel>
                      <Select
                        onValueChange={v => {
                          const val = v === "__none__" ? "" : v;
                          field.onChange(val);
                          setSelectedSubsystem(val);
                          form.setValue("equipment", "");
                          form.setValue("component", "");
                        }}
                        value={field.value || "__none__"}
                        disabled={!selectedSystem}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select sub-system" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__"><em className="text-muted-foreground">— None —</em></SelectItem>
                          {currentSystemObj?.subsystems.map(s => (
                            <SelectItem key={s.code} value={s.code}>{s.code} – {s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </FieldRow>
                <FieldRow>
                  <FormField control={form.control} name="equipment" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment</FormLabel>
                      <Select
                        onValueChange={v => { field.onChange(v === "__none__" ? "" : v); form.setValue("component", ""); }}
                        value={field.value || "__none__"}
                        disabled={!selectedSubsystem}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__"><em className="text-muted-foreground">— None —</em></SelectItem>
                          {(currentSubsysObj?.equipments || []).map((e: any) => (
                            <SelectItem key={e.code} value={e.name}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="component" render={({ field }) => {
                    const watchEquip = form.watch("equipment");
                    const equip = currentSubsysObj?.equipments?.find((e: any) => e.name === watchEquip);
                    return (
                      <FormItem>
                        <FormLabel>Component</FormLabel>
                        <Select
                          onValueChange={v => field.onChange(v === "__none__" ? "" : v)}
                          value={field.value || "__none__"}
                          disabled={!watchEquip || !equip}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background"><SelectValue placeholder="Select component" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__"><em className="text-muted-foreground">— None —</em></SelectItem>
                            {(equip?.components || []).map((c: string) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    );
                  }} />
                </FieldRow>
                <FieldRow>
                  <TF name="parts" label="Part(s)" placeholder="Part name/description" />
                  <TF name="equipmentPartNumber" label="Part Number" mono placeholder="Part/LRU number" />
                </FieldRow>
                <FieldRow>
                  <TF name="ncrNumber" label="NCR No." mono placeholder="NCR number if applicable" />
                  <TF name="serialNumber" label="Serial No." mono placeholder="Equipment serial number" />
                </FieldRow>
                <FieldRow>
                  <SF name="failureLocation" label="Failure Location" options={FAILURE_LOCATIONS} placeholder="Select location" />
                  <TF name="failureName" label="Failure Name" placeholder="Short failure name/code" />
                </FieldRow>
                <TA name="failureDescription" label="Failure Description *" rows={3} placeholder="Detailed description of failure, symptoms, location..." />
                <FieldRow>
                  <SF name="failureCategory" label="Failure Category" options={FAILURE_CATEGORIES} placeholder="Select category" />
                  <SF name="failureClass" label="Failure Classification *" options={[
                    { value: "relevant",       label: "Relevant Failure" },
                    { value: "non-relevant",   label: "Non-Relevant Failure" },
                    { value: "service-failure",label: "Service Failure" },
                  ]} />
                </FieldRow>
              </div>

              {/* ── SECTION 4: Operational Impact ── */}
              <div className="space-y-4 bg-amber-500/5 rounded-xl border border-amber-500/20 p-4">
                <SectionHeader icon={AlertCircle} title="Part D — Operational Impact" color="text-amber-400" />

                {/* CM-specific */}
                {watchOrderType === "CM" && (
                  <div className="space-y-3 pb-2 border-b border-amber-500/20">
                    <p className="text-xs font-medium text-amber-400 uppercase tracking-wide">Corrective Maintenance Fields</p>
                    <FieldRow>
                      <SF name="jobOperatingConditions" label="Job Operating Conditions" options={JOB_OPERATING_CONDITIONS} />
                      <SF name="effectsOnService" label="Effects on Train Service" options={YES_NO} />
                    </FieldRow>
                    {watchEffectsOnService === "yes" && (
                      <FieldRow>
                        <SF name="serviceDistinction" label="Service Distinction" options={SERVICE_DISTINCTIONS} />
                        <SF name="delayDuration" label="Delay Duration" options={DELAY_DURATIONS} />
                      </FieldRow>
                    )}
                  </div>
                )}

                {/* PM-specific */}
                {watchOrderType === "PM" && (
                  <div className="pb-2 border-b border-amber-500/20">
                    <p className="text-xs font-medium text-amber-400 uppercase tracking-wide mb-2">Preventive Maintenance Fields</p>
                    <SF name="serviceChecks" label="Service Check Type" options={SERVICE_CHECKS} />
                  </div>
                )}

                <FieldRow>
                  <SF name="workPending" label="Work Pending?" options={YES_NO} />
                  <SF name="withdrawalRequired" label="Withdraw?" options={YES_NO} />
                </FieldRow>
                {watchWorkPending === "yes" && (
                  <FieldRow>
                    <SF name="canBeEnergized" label="Can be Energized? (if Work Pending)" options={YES_NO} />
                    <SF name="canBeMoved" label="Can be Moved? (if Work Pending)" options={YES_NO} />
                  </FieldRow>
                )}
                {watchWithdrawal === "yes" && (
                  <FieldRow>
                    <FormField control={form.control} name="scenarioCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Withdrawal Scenario</FormLabel>
                        <Select
                          onValueChange={v => field.onChange(v === "__none__" ? "" : v)}
                          value={field.value || "__none__"}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background border-amber-500/30"><SelectValue placeholder="Select scenario" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__"><em className="text-muted-foreground">— None —</em></SelectItem>
                            {WITHDRAWAL_SCENARIOS.map(s => (
                              <SelectItem key={s.code} value={s.code}>{s.code} – {s.description.substring(0, 50)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <TF name="withdrawalReason" label="Withdrawal Reason / Details" />
                  </FieldRow>
                )}
                <FieldRow>
                  <SF name="delay" label="Delay?" options={YES_NO} />
                  <TF name="delayTime" label="Delay Time (DD/HH/MM)" placeholder="e.g. 00/00/15" />
                </FieldRow>
              </div>

              {/* ── SECTION 5: PPIO / Permissions ── */}
              <div className="space-y-4">
                <SectionHeader icon={Settings2} title="Part E — PPIO Safety & Permissions" color="text-purple-400" />
                <TF name="mainLineAction" label="Main Line Action (if applicable)" placeholder="Describe any main line action" />
                <FieldRow>
                  <SF name="sicRequired" label="SIC Required?" options={YES_NO} />
                  <SF name="powerBlockRequired" label="Power Block Required?" options={YES_NO} />
                </FieldRow>
                {watchSicRequired === "yes" && (
                  <FieldRow>
                    <TF name="sicVerifier" label="SIC Verifier Name" placeholder="Name of SIC verifier" />
                    <TF name="inspectionInCharge" label="Inspection In Charge" placeholder="Inspection in charge name" />
                  </FieldRow>
                )}
              </div>

              {/* ── SECTION 6: Work Done & Parts ── */}
              <div className="space-y-4">
                <SectionHeader icon={CheckCircle2} title="Part F — Work Done & Component Replacement" color="text-green-400" />
                <FieldRow>
                  <SF name="carLiftingRequired" label="Car Lifting Required?" options={YES_NO} />
                  <TF name="noOfMen" label="No. of Men" type="number" placeholder="Number of technicians" />
                </FieldRow>
                <FieldRow>
                  <TF name="repairDurationMinutes" label="Duration of Repair (Minutes)" type="number" mono />
                  <SF name="status" label="Job Card Status *" options={[
                    { value: "open",        label: "Open" },
                    { value: "in-progress", label: "In Progress" },
                    { value: "closed",      label: "Closed" },
                  ]} />
                </FieldRow>
                <TA name="actionTaken" label="Description of Actions Taken" rows={3} placeholder="All actions performed to resolve the failure..." />
                <FormField control={form.control} name="rootCause" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1">
                      <FormLabel>Root Cause</FormLabel>
                      <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] gap-1 border-primary/40 text-primary hover:bg-primary/10" onClick={suggestRootCause} disabled={aiLoading}>
                        {aiLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</> : <><Sparkles className="w-3 h-3" /> AI Suggest</>}
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} className="bg-background resize-none" rows={4} placeholder="Root cause investigation / analysis... (or click AI Suggest to auto-generate)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <TA name="correctiveAction" label="Corrective Action / Follow-up" rows={2} placeholder="Long-term corrective action..." />

                {/* Replace/Change Info */}
                <div className="border border-border/50 rounded-lg p-4 space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Replace / Change Information</div>
                  <SF name="partReplaced" label="Replace / Change Info" options={YES_NO} />
                  {watchPartReplaced === "yes" && (
                    <>
                      <FieldRow>
                        <TF name="partNumber" label="Part Number (LRU)" mono placeholder="Part number" />
                        <TF name="parts" label="Part(s) Name" placeholder="Component/part name" />
                      </FieldRow>
                      <FieldRow>
                        <TF name="componentsTakenOutDate" label="Components Taken Out Date" type="date" />
                        <TF name="componentsTakenOutSrNo" label="Sr. No. of Component Taken Out (Faulty)" mono placeholder="Faulty serial number" />
                      </FieldRow>
                      <FieldRow>
                        <TF name="componentsTakenInDate" label="Components Taken In Date" type="date" />
                        <TF name="componentsTakenInSrNo" label="Sr. No. of Component Taken In (Healthy)" mono placeholder="Healthy serial number" />
                      </FieldRow>
                    </>
                  )}
                </div>

                <FieldRow>
                  <TF name="jobCardCloseDate" label="Job Card Close Date" type="date" />
                  <TF name="jobCardCloseTime" label="Job Card Close Time" type="time" />
                </FieldRow>
                <FieldRow>
                  <SF name="actionEndorsementName" label="Name of Action Endorsement" options={ALL_USER_OPTIONS} placeholder="Select endorser" />
                  <TF name="actionEndorsementDate" label="Date of Action Endorsement" type="date" />
                </FieldRow>
                <TA name="notes" label="Additional Notes / Remarks" rows={2} placeholder="Any other relevant information..." />
              </div>

              <div className="h-16" />
            </form>
          </Form>
        </div>

        {/* Footer */}
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
