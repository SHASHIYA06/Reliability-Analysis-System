import { useState } from "react";
import { format } from "date-fns";
import { ClipboardCheck, Plus, Search, Download, Eye, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TRAIN_NUMBERS, CAR_NUMBERS, BEML_USERS, SYSTEMS, SUBSYSTEMS, EQUIPMENTS, COMPONENTS } from "@/lib/taxonomy";

const DEPOT = "MNSD";
const STATUS_COLORS: Record<string, string> = {
  OPEN:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  CLOSED: "bg-green-500/10 text-green-400 border-green-500/30",
  "IN PROGRESS": "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

type EirRecord = {
  id: string;
  eirNumber: string;
  applicableTo: string;
  depot: string;
  status: string;
  issueRevisionNo: string;
  trainSet: string;
  otherTrains: string;
  car: string;
  otherCars: string;
  carEquipment: string;
  closingJobCard: string;
  jobCardClosingDate: string;
  eventTime: string;
  temperature: string;
  location: string;
  incidentDate: string;
  incidentDetails: string;
  reportedDate: string;
  actionAtDepot: string;
  actionAtMainLine: string;
  furtherAction: string;
  distribution: Record<string, boolean>;
  system: string;
  subSystem: string;
  equipment: string;
  component: string;
  part: string;
  others: string;
  repercussion: string;
  history: string;
  investigationCause: string;
  concern: string;
  conclusion: string;
};

const EMPTY_DIST = { DO: false, "ED/RS/JMRC": false, GMRS: false, "ED/RS/DMRC": false, "Depot Incharge RS": false, "Technical Cell": false, BEML: false, "EIR File": false };

const MOCK: EirRecord[] = [
  {
    id: "1", eirNumber: "001", applicableTo: "RS8", depot: "MNSD", status: "OPEN", issueRevisionNo: "0",
    trainSet: "TS104", otherTrains: "All Trains", car: "DMC1", otherCars: "",
    carEquipment: "Sunblind Assembly", closingJobCard: "", jobCardClosingDate: "", eventTime: "11:00:00",
    temperature: "", location: "DEPOT", incidentDate: "2015-06-15",
    incidentDetails: "Sunblind screen is not functioning well in all RSS cars.", reportedDate: "2015-06-17",
    actionAtDepot: "It has been observed in many service checks & during daily check that sunblind screen assembly is not functioning well. Sun blind was stuck in mid of look out glass due to locking arrangement & improper alignment",
    actionAtMainLine: "", furtherAction: "Suitable & Proper Modification or replacement of sunblind screen assembly need to be done by BEML for proper function (Open & Close) so that it will not stuck in between and proper operation can be done.",
    distribution: { DO: true, "ED/RS/JMRC": true, GMRS: true, "ED/RS/DMRC": false, "Depot Incharge RS": true, "Technical Cell": true, BEML: true, "EIR File": true },
    system: "General", subSystem: "Cab Facilities", equipment: "Accessories", component: "Sun-Blind", part: "", others: "abcd",
    repercussion: "", history: "", investigationCause: "Sunblind screen is not functioning well in all RSS cars. Whenever it is closed it stuck in between it cannot be closed completely.",
    concern: "1. It is requested to BEML to rectify the Sunblind stuck problem on urgent basis.\n2. It is requested to BEML, plan a fleet check & suggest a permanent solution.",
    conclusion: "",
  },
];

const blank = (): Omit<EirRecord, "id"> => ({
  eirNumber: "", applicableTo: "RS3R", depot: DEPOT, status: "OPEN", issueRevisionNo: "0",
  trainSet: "", otherTrains: "", car: "", otherCars: "", carEquipment: "", closingJobCard: "",
  jobCardClosingDate: "", eventTime: "", temperature: "", location: "DEPOT",
  incidentDate: format(new Date(), "yyyy-MM-dd"), incidentDetails: "", reportedDate: format(new Date(), "yyyy-MM-dd"),
  actionAtDepot: "", actionAtMainLine: "", furtherAction: "",
  distribution: { ...EMPTY_DIST },
  system: "", subSystem: "", equipment: "", component: "", part: "", others: "",
  repercussion: "", history: "", investigationCause: "", concern: "", conclusion: "",
});

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
      <span className="text-xs font-bold text-primary uppercase tracking-wider">{title}</span>
    </div>
  );
}

function ViewModal({ record, onClose }: { record: EirRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl my-4 p-0 overflow-hidden">
        <div className="bg-muted/50 border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Engineering Incident Report (EIR)</h2>
            <p className="text-xs text-muted-foreground">EIR No: {record.eirNumber} · Depot: {record.depot} · Status: {record.status}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          <div className="grid grid-cols-3 gap-4 bg-muted/20 rounded-lg p-4">
            <div><span className="text-muted-foreground text-xs">EIR Number</span><p className="font-mono font-bold text-primary">{record.eirNumber}</p></div>
            <div><span className="text-muted-foreground text-xs">Applicable To</span><p className="font-semibold">{record.applicableTo}</p></div>
            <div><span className="text-muted-foreground text-xs">Issue/Revision No.</span><p className="font-mono">{record.issueRevisionNo}</p></div>
            <div><span className="text-muted-foreground text-xs">Depot</span><p className="font-semibold">{record.depot}</p></div>
            <div><span className="text-muted-foreground text-xs">Status</span><Badge variant="outline" className={STATUS_COLORS[record.status] || ""}>{record.status}</Badge></div>
          </div>

          <SectionHeader title="Equipment and Incident Details" />
          <div className="grid grid-cols-3 gap-3">
            <div><span className="text-muted-foreground text-xs">Train Set</span><p className="font-mono font-semibold">{record.trainSet}</p></div>
            <div><span className="text-muted-foreground text-xs">Other Trains</span><p>{record.otherTrains}</p></div>
            <div><span className="text-muted-foreground text-xs">Closing Job Card</span><p className="font-mono">{record.closingJobCard || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Car</span><p>{record.car}</p></div>
            <div><span className="text-muted-foreground text-xs">Other Cars</span><p>{record.otherCars || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Job Card Closing Date</span><p>{record.jobCardClosingDate || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Car Equipment</span><p>{record.carEquipment}</p></div>
            <div><span className="text-muted-foreground text-xs">Event Time</span><p className="font-mono">{record.eventTime}</p></div>
            <div><span className="text-muted-foreground text-xs">Temperature (°C)</span><p>{record.temperature || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Reported Date</span><p>{record.reportedDate}</p></div>
            <div><span className="text-muted-foreground text-xs">Incident Date</span><p className="font-semibold">{record.incidentDate}</p></div>
            <div><span className="text-muted-foreground text-xs">Location</span><p>{record.location}</p></div>
          </div>
          <div><span className="text-muted-foreground text-xs">Incident Details</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm">{record.incidentDetails}</p></div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <SectionHeader title="Actions" />
              <div className="space-y-3">
                <div><span className="text-muted-foreground text-xs">Action taken in Depot</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm whitespace-pre-wrap">{record.actionAtDepot}</p></div>
                <div><span className="text-muted-foreground text-xs">Action Taken at Main Line</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm">{record.actionAtMainLine || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Further Action</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm whitespace-pre-wrap">{record.furtherAction}</p></div>
              </div>
            </div>
            <div>
              <SectionHeader title="Distribution" />
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(record.distribution).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={val} readOnly className="rounded" />
                    <span className={val ? "font-semibold text-primary" : "text-muted-foreground"}>{key}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <SectionHeader title="System Hierarchy" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[["System", record.system], ["Component", record.component], ["Sub System", record.subSystem], ["Part", record.part], ["Equipment", record.equipment], ["Others", record.others]].map(([l, v]) => (
                    <div key={l}><span className="text-muted-foreground">{l}: </span><span className="font-semibold">{v || "—"}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <SectionHeader title="Other Details" />
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-muted-foreground text-xs">Repercussion</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm">{record.repercussion || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">History</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm">{record.history || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Investigation Cause</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm whitespace-pre-wrap">{record.investigationCause}</p></div>
            <div><span className="text-muted-foreground text-xs">Concern</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm whitespace-pre-wrap">{record.concern}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground text-xs">Conclusion</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm">{record.conclusion || "—"}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EirForm({ onSave, onClose, count }: { onSave: (r: EirRecord) => void; onClose: () => void; count: number }) {
  const [form, setForm] = useState<Omit<EirRecord, "id">>(blank());
  const { toast } = useToast();
  const sf = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const trainSets = Array.from({ length: 17 }, (_, i) => `TS${String(i + 1).padStart(2, "0")}`);

  const handleSave = () => {
    if (!form.eirNumber || !form.trainSet) {
      toast({ title: "Required fields missing", description: "EIR Number and Train Set are required.", variant: "destructive" }); return;
    }
    onSave({ ...form, id: String(Date.now()) });
    toast({ title: "EIR Saved", description: `EIR No. ${form.eirNumber} created successfully.` });
    onClose();
  };

  const Label = ({ text, req }: { text: string; req?: boolean }) => (
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
      {text}{req && <span className="text-destructive ml-1">*</span>}
    </label>
  );
  const TA = ({ k, rows = 3 }: { k: keyof typeof form; rows?: number }) => (
    <textarea rows={rows} value={String(form[k])} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
      className="w-full bg-background border border-border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden">
        <div className="bg-muted/50 border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">New Engineering Incident Report (EIR)</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-4 gap-3">
            <div><Label text="EIR Number" req /><Input value={form.eirNumber} onChange={e => sf("eirNumber")(e.target.value)} placeholder={String(count + 1).padStart(3, "0")} className="bg-background border-border" /></div>
            <div><Label text="Applicable To" /><Input value={form.applicableTo} onChange={e => sf("applicableTo")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Depot" /><Input value={form.depot} readOnly className="bg-muted/30 border-border" /></div>
            <div>
              <Label text="Status" />
              <Select value={form.status} onValueChange={sf("status")}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{["OPEN", "IN PROGRESS", "CLOSED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <SectionHeader title="Equipment and Incident Details" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label text="Train Set" req />
              <Select value={form.trainSet} onValueChange={sf("trainSet")}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{trainSets.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label text="Other Trains" /><Input value={form.otherTrains} onChange={e => sf("otherTrains")(e.target.value)} placeholder="e.g. All Trains" className="bg-background border-border" /></div>
            <div><Label text="Closing Job Card" /><Input value={form.closingJobCard} onChange={e => sf("closingJobCard")(e.target.value)} className="bg-background border-border" /></div>
            <div>
              <Label text="Car" />
              <Select value={form.car} onValueChange={sf("car")}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CAR_NUMBERS.map(c => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label text="Other Cars" /><Input value={form.otherCars} onChange={e => sf("otherCars")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Job Card Closing Date" /><Input type="date" value={form.jobCardClosingDate} onChange={e => sf("jobCardClosingDate")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Car Equipment" /><Input value={form.carEquipment} onChange={e => sf("carEquipment")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Event Time" /><Input type="time" value={form.eventTime} onChange={e => sf("eventTime")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Temperature (°C)" /><Input value={form.temperature} onChange={e => sf("temperature")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Reported Date" /><Input type="date" value={form.reportedDate} onChange={e => sf("reportedDate")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Incident Date" req /><Input type="date" value={form.incidentDate} onChange={e => sf("incidentDate")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Location" /><Input value={form.location} onChange={e => sf("location")(e.target.value)} placeholder="DEPOT / MAINLINE" className="bg-background border-border" /></div>
          </div>
          <div><Label text="Incident Details" /><TA k="incidentDetails" rows={3} /></div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <SectionHeader title="Actions" />
              <div className="space-y-3">
                <div><Label text="Action taken in Depot" /><TA k="actionAtDepot" rows={4} /></div>
                <div><Label text="Action Taken at Main Line" /><TA k="actionAtMainLine" rows={3} /></div>
                <div><Label text="Further Action" /><TA k="furtherAction" rows={3} /></div>
              </div>
            </div>
            <div>
              <SectionHeader title="Distribution" />
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.keys(form.distribution).map(key => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={(form.distribution as Record<string, boolean>)[key]}
                      onChange={e => setForm(f => ({ ...f, distribution: { ...f.distribution, [key]: e.target.checked } }))} />
                    <span>{key}</span>
                  </label>
                ))}
              </div>
              <SectionHeader title="System Hierarchy" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label text="System" />
                  <Select value={form.system} onValueChange={sf("system")}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label text="Component" /><Input value={form.component} onChange={e => sf("component")(e.target.value)} className="bg-background border-border" /></div>
                <div>
                  <Label text="Sub System" />
                  <Select value={form.subSystem} onValueChange={sf("subSystem")}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{(SUBSYSTEMS[form.system] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label text="Part" /><Input value={form.part} onChange={e => sf("part")(e.target.value)} className="bg-background border-border" /></div>
                <div><Label text="Equipment" /><Input value={form.equipment} onChange={e => sf("equipment")(e.target.value)} className="bg-background border-border" /></div>
                <div><Label text="Others" /><Input value={form.others} onChange={e => sf("others")(e.target.value)} className="bg-background border-border" /></div>
              </div>
            </div>
          </div>

          <SectionHeader title="Other Details" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label text="Repercussion" /><TA k="repercussion" rows={3} /></div>
            <div><Label text="History" /><TA k="history" rows={3} /></div>
            <div><Label text="Investigation Cause" /><TA k="investigationCause" rows={4} /></div>
            <div><Label text="Concern" /><TA k="concern" rows={4} /></div>
            <div className="col-span-2"><Label text="Conclusion" /><TA k="conclusion" rows={3} /></div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSave}>Save EIR</Button>
        </div>
      </div>
    </div>
  );
}

export default function EIRPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewRecord, setViewRecord] = useState<EirRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterTrain, setFilterTrain] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [records, setRecords] = useState<EirRecord[]>(MOCK);

  const filtered = records.filter(r => {
    if (filterTrain && r.trainSet !== filterTrain) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (search && !r.eirNumber.includes(search) && !r.incidentDetails.toLowerCase().includes(search.toLowerCase()) && !r.carEquipment.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportCSV = () => {
    const rows = [["EIR No", "Applicable To", "Depot", "Status", "Train Set", "Car", "Incident Date", "Location", "Incident Details"]];
    for (const r of filtered) rows.push([r.eirNumber, r.applicableTo, r.depot, r.status, r.trainSet, r.car, r.incidentDate, r.location, r.incidentDetails]);
    const csv = rows.map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `EIR_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  const trainSets = Array.from({ length: 17 }, (_, i) => `TS${String(i + 1).padStart(2, "0")}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary" /> Engineering Incident Report (EIR)
          </h1>
          <p className="text-muted-foreground mt-1">Record and track engineering incidents for RS-3R rolling stock · Depot: {DEPOT}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> New EIR
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total EIRs",  value: records.length, color: "text-foreground" },
          { label: "Open",        value: records.filter(r => r.status === "OPEN").length, color: "text-yellow-400" },
          { label: "Closed",      value: records.filter(r => r.status === "CLOSED").length, color: "text-green-400" },
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
          <Input placeholder="Search EIR No, Equipment, Incident..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filterTrain || "__all__"} onValueChange={v => setFilterTrain(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-36 bg-card border-border"><SelectValue placeholder="All Train Sets" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Train Sets</SelectItem>
            {trainSets.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus || "__all__"} onValueChange={v => setFilterStatus(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-36 bg-card border-border"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            {["OPEN", "IN PROGRESS", "CLOSED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterTrain || filterStatus || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterTrain(""); setFilterStatus(""); setSearch(""); }}>Clear</Button>
        )}
      </div>

      <Card className="bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">EIR No.</th>
                <th className="px-4 py-3 text-left">Applicable To</th>
                <th className="px-4 py-3 text-left">Depot</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Train Set</th>
                <th className="px-4 py-3 text-left">Car</th>
                <th className="px-4 py-3 text-left">Equipment</th>
                <th className="px-4 py-3 text-left">Incident Date</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Incident Details</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-6 py-8 text-center text-muted-foreground">No EIR records found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{r.eirNumber}</td>
                  <td className="px-4 py-3">{r.applicableTo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.depot}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge></td>
                  <td className="px-4 py-3 font-mono font-semibold">{r.trainSet}</td>
                  <td className="px-4 py-3">{r.car}</td>
                  <td className="px-4 py-3 text-xs">{r.carEquipment}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{r.incidentDate}</td>
                  <td className="px-4 py-3 text-xs">{r.location}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate">{r.incidentDetails}</td>
                  <td className="px-4 py-3 text-center">
                    <Button size="sm" variant="ghost" onClick={() => setViewRecord(r)}><Eye className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && <EirForm count={records.length} onSave={r => setRecords(prev => [r, ...prev])} onClose={() => setShowForm(false)} />}
      {viewRecord && <ViewModal record={viewRecord} onClose={() => setViewRecord(null)} />}
    </div>
  );
}
