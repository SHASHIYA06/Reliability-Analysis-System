import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { X, Save, AlertCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { SYSTEM_TAXONOMY, WITHDRAWAL_SCENARIOS } from "@/lib/taxonomy";

const formSchema = z.object({
  trainId: z.string().min(1, "Train is required"),
  failureDate: z.string().min(1, "Date is required"),
  failureTime: z.string().optional(),
  systemCode: z.string().min(1, "System is required"),
  subsystemCode: z.string().optional(),
  failureDescription: z.string().min(5, "Description must be at least 5 characters"),
  failureClass: z.enum(["relevant", "non-relevant", "service-failure"]),
  withdrawalRequired: z.boolean(),
  scenarioCode: z.string().optional(),
  withdrawalReason: z.string().optional(),
  repairDurationMinutes: z.coerce.number().optional(),
  trainDistanceAtFailure: z.coerce.number().optional(),
  partReplaced: z.string().optional(),
  partNumber: z.string().optional(),
  status: z.enum(["open", "in-progress", "closed"]),
  actionTaken: z.string().optional(),
  rootCause: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface JobCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: FailureReport | null;
  onSuccess: () => void;
}

export function JobCardForm({ isOpen, onClose, initialData, onSuccess }: JobCardFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateFailure();
  const updateMutation = useUpdateFailure();
  const { data: trains = [] } = useListTrains();

  const [selectedSystem, setSelectedSystem] = useState(initialData?.systemCode || "");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trainId: initialData?.trainId || "",
      failureDate: initialData?.failureDate ? format(new Date(initialData.failureDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      failureTime: initialData?.failureTime || "",
      systemCode: initialData?.systemCode || "",
      subsystemCode: initialData?.subsystemCode || "",
      failureDescription: initialData?.failureDescription || "",
      failureClass: initialData?.failureClass || "relevant",
      withdrawalRequired: initialData?.withdrawalRequired || false,
      scenarioCode: initialData?.scenarioCode || "",
      withdrawalReason: initialData?.withdrawalReason || "",
      repairDurationMinutes: initialData?.repairDurationMinutes || undefined,
      trainDistanceAtFailure: initialData?.trainDistanceAtFailure || undefined,
      partReplaced: initialData?.partReplaced || "",
      partNumber: initialData?.partNumber || "",
      status: initialData?.status || "open",
      actionTaken: initialData?.actionTaken || "",
      rootCause: initialData?.rootCause || "",
    },
  });

  const watchWithdrawal = form.watch("withdrawalRequired");
  
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
        reportDate: new Date().toISOString(),
      };

      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload as any });
        toast({ title: "Success", description: "Job card updated." });
      } else {
        await createMutation.mutateAsync({ data: payload as any });
        toast({ title: "Success", description: "Job card created." });
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

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-3xl h-full bg-card border-l border-border/50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-muted/20">
          <h2 className="text-xl font-bold tracking-tight">
            {initialData ? `Edit Job Card ${initialData.jobCardNumber}` : "New Job Card"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/20 hover:text-destructive">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form id="job-card-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Section 1: Event Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Event Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="trainId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Train</FormLabel>
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
                  <FormField control={form.control} name="trainDistanceAtFailure" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance at Failure (km)</FormLabel>
                      <FormControl><Input type="number" {...field} className="bg-background font-mono" /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="failureDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl><Input type="date" {...field} className="bg-background" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="failureTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl><Input type="time" {...field} className="bg-background" /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Section 2: Classification */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <Wrench className="w-4 h-4 text-secondary" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary">Classification & System</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="systemCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>System</FormLabel>
                      <Select 
                        onValueChange={(val) => { field.onChange(val); setSelectedSystem(val); form.setValue("subsystemCode", ""); }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select system" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SYSTEM_TAXONOMY.map(s => <SelectItem key={s.code} value={s.code}>{s.code} - {s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="subsystemCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subsystem</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedSystem}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select subsystem" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currentSystemObj?.subsystems.map(s => <SelectItem key={s.code} value={s.code}>{s.code} - {s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="failureClass" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Failure Classification</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select classification" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="relevant">Relevant Failure</SelectItem>
                          <SelectItem value="non-relevant">Non-Relevant Failure</SelectItem>
                          <SelectItem value="service-failure">Service Failure</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select status" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="failureDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description of Failure</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="bg-background min-h-[100px] resize-none" placeholder="Detailed description of what occurred..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Section 3: Withdrawal & Actions */}
              <div className="space-y-4 bg-muted/10 p-4 rounded-xl border border-border/50">
                <FormField control={form.control} name="withdrawalRequired" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-destructive font-medium cursor-pointer">Train Withdrawn from Service</FormLabel>
                    </div>
                  </FormItem>
                )} />

                {watchWithdrawal && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in zoom-in duration-200">
                    <FormField control={form.control} name="scenarioCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Withdrawal Scenario</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-destructive/50"><SelectValue placeholder="Select scenario" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WITHDRAWAL_SCENARIOS.map(s => <SelectItem key={s.code} value={s.code}>{s.code} - {s.description.substring(0,40)}...</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="withdrawalReason" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Reason</FormLabel>
                        <FormControl><Input {...field} className="bg-background border-destructive/50" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                )}
              </div>

              {/* Section 4: Resolution */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2 mt-4">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-success">Resolution & Parts</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="partReplaced" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Replaced / Defective Component</FormLabel>
                      <FormControl><Input {...field} className="bg-background" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="partNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Number (LRU)</FormLabel>
                      <FormControl><Input {...field} className="bg-background font-mono uppercase" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="repairDurationMinutes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repair Duration (Minutes)</FormLabel>
                      <FormControl><Input type="number" {...field} className="bg-background font-mono" /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="rootCause" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Root Cause Analysis</FormLabel>
                    <FormControl><Textarea {...field} className="bg-background resize-none" /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="actionTaken" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corrective Action Taken</FormLabel>
                    <FormControl><Textarea {...field} className="bg-background resize-none" /></FormControl>
                  </FormItem>
                )} />
              </div>
              
              {/* spacer for sticky footer */}
              <div className="h-16"></div>
            </form>
          </Form>
        </div>

        <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur flex justify-end gap-3 sticky bottom-0 z-10">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button 
            type="submit" 
            form="job-card-form" 
            disabled={isPending}
            className="bg-primary text-primary-foreground font-semibold min-w-[120px]"
          >
            {isPending ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Record</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
