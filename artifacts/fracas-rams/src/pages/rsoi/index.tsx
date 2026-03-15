import { useState, useEffect, useCallback } from "react";

import { API_BASE as BASE } from "@/lib/api-base";

function dbToRsoi(r: any): RsoiRecord {
  return { ...r, jobCards: r.jobCardsJson ? (() => { try { return JSON.parse(r.jobCardsJson); } catch { return []; } })() : [] };
}
import { format } from "date-fns";
import { FileCheck, Plus, Search, Download, Eye, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TRAIN_NUMBERS, CAR_NUMBERS, SYSTEMS, SUBSYSTEMS } from "@/lib/taxonomy";

const DEPOT = "MNSD";

const STATUS_COLORS: Record<string, string> = {
  OPEN:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  CLOSE:  "bg-green-500/10 text-green-400 border-green-500/30",
  "IN PROGRESS": "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

type RsoiRecord = {
  id: string;
  rsoiNumber: string;
  failureDetectedJobCard: string;
  depot: string;
  status: string;
  startDatetime: string;
  pdc: string;
  completedDatetime: string;
  investigationReportReceived: boolean;
  investigationReportReceivedDate: string;
  actionToBeTaken: string;
  oAndMSent: boolean;
  oAndMSentDate: string;
  typeOfRsoi: string;
  refRs3Fmi: string;
  refRs3HecpSecp: string;
  remarksByDmrcJmrc: string;
  system: string;
  subSystem: string;
  equipment: string;
  component: string;
  part: string;
  comments: string;
  jobCards: { jobCard: string; workType: string; trainSet: string; status: string; completionDate: string }[];
};

const MOCK: RsoiRecord[] = [
  {
    id: "1", rsoiNumber: "2", failureDetectedJobCard: "", depot: "MNSD", status: "CLOSE",
    startDatetime: "", pdc: "", completedDatetime: "", investigationReportReceived: false,
    investigationReportReceivedDate: "2014-08-14", actionToBeTaken: "Flashing of door lamp indication during closing/opening (as per ERTS 12.6.4(iv)).",
    oAndMSent: false, oAndMSentDate: "", typeOfRsoi: "ELEC", refRs3Fmi: "",
    refRs3HecpSecp: "", remarksByDmrcJmrc: "",
    system: "", subSystem: "", equipment: "", component: "", part: "",
    comments: "Latest software version E405790C01 is same as like RS3 latest software E405405 A07\nRef KBI letter : RS/DMRC/DOORSWI/01 dt 14.08.2014",
    jobCards: [],
  },
];

const blank = (): Omit<RsoiRecord, "id"> => ({
  rsoiNumber: "", failureDetectedJobCard: "", depot: DEPOT, status: "OPEN",
  startDatetime: "", pdc: "", completedDatetime: "",
  investigationReportReceived: false, investigationReportReceivedDate: "",
  actionToBeTaken: "", oAndMSent: false, oAndMSentDate: "",
  typeOfRsoi: "ELEC", refRs3Fmi: "", refRs3HecpSecp: "", remarksByDmrcJmrc: "",
  system: "", subSystem: "", equipment: "", component: "", part: "", comments: "",
  jobCards: [],
});

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
      <span className="text-xs font-bold text-primary uppercase tracking-wider">{title}</span>
    </div>
  );
}

function ViewModal({ record, onClose }: { record: RsoiRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden">
        <div className="bg-muted/50 border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Rolling Stock Open Issues (RSOI)</h2>
            <p className="text-xs text-muted-foreground">RSOI No: {record.rsoiNumber} · Depot: {record.depot} · Status: {record.status}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="p-6 space-y-5 text-sm max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-4 gap-4 bg-muted/20 rounded-lg p-4">
            <div><span className="text-muted-foreground text-xs">RSOI Number</span><p className="font-mono font-bold text-primary">{record.rsoiNumber}</p></div>
            <div><span className="text-muted-foreground text-xs">Failure Detected Job Card</span><p className="font-mono">{record.failureDetectedJobCard || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Depot</span><p className="font-semibold">{record.depot}</p></div>
            <div><span className="text-muted-foreground text-xs">Status</span><Badge variant="outline" className={STATUS_COLORS[record.status] || ""}>{record.status}</Badge></div>
          </div>

          <SectionHeader title="Comment Details" />
          <div className="grid grid-cols-3 gap-3">
            <div><span className="text-muted-foreground text-xs">Start Date and Time</span><p>{record.startDatetime || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Investigation Report Received</span>
              <p className="flex items-center gap-2 mt-1"><input type="checkbox" checked={record.investigationReportReceived} readOnly /> {record.investigationReportReceived ? "Yes" : "No"}</p>
            </div>
            <div><span className="text-muted-foreground text-xs">Investigation Report Received Date</span><p>{record.investigationReportReceivedDate || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">PDC</span><p>{record.pdc || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">O&M Sent</span>
              <p className="flex items-center gap-2 mt-1"><input type="checkbox" checked={record.oAndMSent} readOnly /> {record.oAndMSent ? "Yes" : "No"}</p>
            </div>
            <div><span className="text-muted-foreground text-xs">O&M Sent Date</span><p>{record.oAndMSentDate || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Completed Date and Time</span><p>{record.completedDatetime || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Type of RSOI</span><p className="font-semibold">{record.typeOfRsoi}</p></div>
            <div><span className="text-muted-foreground text-xs">Ref. RS3 FMI</span><p>{record.refRs3Fmi || "—"}</p></div>
            <div className="col-span-3"><span className="text-muted-foreground text-xs">Ref. RS3 HECP/SECP</span><p>{record.refRs3HecpSecp || "—"}</p></div>
          </div>
          <div><span className="text-muted-foreground text-xs">Action To Be Taken</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm whitespace-pre-wrap">{record.actionToBeTaken || "—"}</p></div>
          <div><span className="text-muted-foreground text-xs">Remarks/Comments by DMRC/JMRC</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm">{record.remarksByDmrcJmrc || "—"}</p></div>
          <div><span className="text-muted-foreground text-xs">Comments</span><p className="mt-1 p-3 bg-muted/20 rounded text-sm whitespace-pre-wrap">{record.comments || "—"}</p></div>

          <SectionHeader title="System Hierarchy" />
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[["System", record.system], ["Component", record.component], ["Sub System", record.subSystem], ["Part", record.part], ["Equipment", record.equipment]].map(([l, v]) => (
              <div key={l}><span className="text-muted-foreground">{l}: </span><span className="font-semibold">{v || "—"}</span></div>
            ))}
          </div>

          <SectionHeader title="Cyclic Check Related Job Cards" />
          {record.jobCards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No rows to display.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-y border-border">
                <tr>
                  {["Job Card", "Work Type", "Train Set", "Status", "Completion Date"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.jobCards.map((jc, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-primary">{jc.jobCard}</td>
                    <td className="px-3 py-2">{jc.workType}</td>
                    <td className="px-3 py-2 font-mono">{jc.trainSet}</td>
                    <td className="px-3 py-2">{jc.status}</td>
                    <td className="px-3 py-2">{jc.completionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function RsoiForm({ onSave, onClose, count }: { onSave: (r: RsoiRecord) => void; onClose: () => void; count: number }) {
  const [form, setForm] = useState<Omit<RsoiRecord, "id">>(blank());
  const [newJc, setNewJc] = useState({ jobCard: "", workType: "", trainSet: "", status: "OPEN", completionDate: "" });
  const { toast } = useToast();
  const sf = (k: keyof typeof form) => (v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.rsoiNumber) {
      toast({ title: "Required fields missing", description: "RSOI Number is required.", variant: "destructive" }); return;
    }
    onSave({ ...form, id: String(Date.now()) });
    toast({ title: "RSOI Saved", description: `RSOI No. ${form.rsoiNumber} created.` });
    onClose();
  };

  const addJc = () => {
    if (!newJc.jobCard) return;
    setForm(f => ({ ...f, jobCards: [...f.jobCards, { ...newJc }] }));
    setNewJc({ jobCard: "", workType: "", trainSet: "", status: "OPEN", completionDate: "" });
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
          <h2 className="text-lg font-bold">New Rolling Stock Open Issue (RSOI)</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-4 gap-3">
            <div><Label text="RSOI Number" req /><Input value={form.rsoiNumber} onChange={e => sf("rsoiNumber")(e.target.value)} placeholder={String(count + 1)} className="bg-background border-border" /></div>
            <div><Label text="Failure Detected Job Card" /><Input value={form.failureDetectedJobCard} onChange={e => sf("failureDetectedJobCard")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Depot" /><Input value={form.depot} readOnly className="bg-muted/30 border-border" /></div>
            <div>
              <Label text="Status" />
              <Select value={form.status} onValueChange={v => sf("status")(v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{["OPEN", "IN PROGRESS", "CLOSE"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <SectionHeader title="Comment Details" />
          <div className="grid grid-cols-3 gap-3">
            <div><Label text="Start Date and Time" /><Input type="datetime-local" value={form.startDatetime} onChange={e => sf("startDatetime")(e.target.value)} className="bg-background border-border" /></div>
            <div className="flex items-end gap-2 pb-0.5">
              <label className="flex items-center gap-2 text-sm cursor-pointer mt-5">
                <input type="checkbox" checked={form.investigationReportReceived}
                  onChange={e => sf("investigationReportReceived")(e.target.checked)} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Investigation Report Received</span>
              </label>
            </div>
            <div><Label text="Investigation Report Received Date" /><Input type="date" value={form.investigationReportReceivedDate} onChange={e => sf("investigationReportReceivedDate")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="PDC" /><Input type="date" value={form.pdc} onChange={e => sf("pdc")(e.target.value)} className="bg-background border-border" /></div>
            <div className="flex items-end gap-2 pb-0.5">
              <label className="flex items-center gap-2 text-sm cursor-pointer mt-5">
                <input type="checkbox" checked={form.oAndMSent} onChange={e => sf("oAndMSent")(e.target.checked)} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">O&M Sent</span>
              </label>
            </div>
            <div><Label text="O&M Sent Date" /><Input type="date" value={form.oAndMSentDate} onChange={e => sf("oAndMSentDate")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Completed Date and Time" /><Input type="datetime-local" value={form.completedDatetime} onChange={e => sf("completedDatetime")(e.target.value)} className="bg-background border-border" /></div>
            <div>
              <Label text="Type of RSOI" />
              <Select value={form.typeOfRsoi} onValueChange={v => sf("typeOfRsoi")(v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{["ELEC", "MECH", "S&T", "OPM", "OTHER"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label text="Ref. RS3 FMI" /><Input value={form.refRs3Fmi} onChange={e => sf("refRs3Fmi")(e.target.value)} className="bg-background border-border" /></div>
          </div>
          <div><Label text="Ref. RS3 HECP/SECP" /><Input value={form.refRs3HecpSecp} onChange={e => sf("refRs3HecpSecp")(e.target.value)} className="bg-background border-border" /></div>
          <div><Label text="Action To Be Taken" /><TA k="actionToBeTaken" rows={4} /></div>
          <div><Label text="Remarks/Comments by DMRC/JMRC" /><TA k="remarksByDmrcJmrc" rows={3} /></div>
          <div><Label text="Comments" /><TA k="comments" rows={3} /></div>

          <SectionHeader title="System Hierarchy" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label text="System" />
              <Select value={form.system} onValueChange={v => sf("system")(v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label text="Sub System" />
              <Select value={form.subSystem} onValueChange={v => sf("subSystem")(v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(SUBSYSTEMS[form.system] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label text="Equipment" /><Input value={form.equipment} onChange={e => sf("equipment")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Component" /><Input value={form.component} onChange={e => sf("component")(e.target.value)} className="bg-background border-border" /></div>
            <div><Label text="Part" /><Input value={form.part} onChange={e => sf("part")(e.target.value)} className="bg-background border-border" /></div>
          </div>

          <SectionHeader title="Cyclic Check Related Job Cards" />
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {["Job Card", "Work Type", "Train Set", "Status", "Completion Date", ""].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.jobCards.map((jc, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono">{jc.jobCard}</td>
                    <td className="px-3 py-2">{jc.workType}</td>
                    <td className="px-3 py-2 font-mono">{jc.trainSet}</td>
                    <td className="px-3 py-2">{jc.status}</td>
                    <td className="px-3 py-2">{jc.completionDate}</td>
                    <td className="px-3 py-2">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setForm(f => ({ ...f, jobCards: f.jobCards.filter((_, j) => j !== i) }))}>
                        <X className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {form.jobCards.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-3 text-center text-muted-foreground">No rows to display.</td></tr>
                )}
              </tbody>
            </table>
            <div className="p-3 border-t border-border bg-muted/20">
              <div className="grid grid-cols-6 gap-2">
                <Input placeholder="Job Card" value={newJc.jobCard} onChange={e => setNewJc(n => ({ ...n, jobCard: e.target.value }))} className="bg-background border-border text-xs h-7" />
                <Input placeholder="Work Type" value={newJc.workType} onChange={e => setNewJc(n => ({ ...n, workType: e.target.value }))} className="bg-background border-border text-xs h-7" />
                <Select value={newJc.trainSet} onValueChange={v => setNewJc(n => ({ ...n, trainSet: v }))}>
                  <SelectTrigger className="bg-background border-border h-7 text-xs"><SelectValue placeholder="Train Set" /></SelectTrigger>
                  <SelectContent>{TRAIN_NUMBERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Status" value={newJc.status} onChange={e => setNewJc(n => ({ ...n, status: e.target.value }))} className="bg-background border-border text-xs h-7" />
                <Input type="date" value={newJc.completionDate} onChange={e => setNewJc(n => ({ ...n, completionDate: e.target.value }))} className="bg-background border-border text-xs h-7" />
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addJc}>+ New Row</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSave}>Save RSOI</Button>
        </div>
      </div>
    </div>
  );
}

export default function RSOIPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [viewRecord, setViewRecord] = useState<RsoiRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [records, setRecords] = useState<RsoiRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/rsoi`);
      if (res.ok) { const data = await res.json(); setRecords(data.map(dbToRsoi)); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = records.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (search && !r.rsoiNumber.includes(search) && !r.actionToBeTaken.toLowerCase().includes(search.toLowerCase()) && !r.failureDetectedJobCard.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportCSV = () => {
    const rows = [["RSOI No", "Failure Detected JC", "Depot", "Status", "Type", "Start Date", "Completed Date", "Action To Be Taken"]];
    for (const r of filtered) rows.push([r.rsoiNumber, r.failureDetectedJobCard, r.depot, r.status, r.typeOfRsoi, r.startDatetime, r.completedDatetime, r.actionToBeTaken]);
    const csv = rows.map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `RSOI_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-primary" /> Rolling Stock Open Issues (RSOI)
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage open issues for RS-3R rolling stock · Depot: {DEPOT}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> New RSOI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",      value: records.length, color: "text-foreground" },
          { label: "Open",       value: records.filter(r => r.status === "OPEN" || r.status === "IN PROGRESS").length, color: "text-yellow-400" },
          { label: "Closed",     value: records.filter(r => r.status === "CLOSE").length, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search RSOI No, Job Card, Action..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={filterStatus || "__all__"} onValueChange={v => setFilterStatus(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-36 bg-card border-border"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            {["OPEN", "IN PROGRESS", "CLOSE"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterStatus || search) && <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(""); setSearch(""); }}>Clear</Button>}
      </div>

      <div className="bg-card border border-border/50 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">RSOI No.</th>
              <th className="px-4 py-3 text-left">Failure Detected JC</th>
              <th className="px-4 py-3 text-left">Depot</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">System</th>
              <th className="px-4 py-3 text-left">Action To Be Taken</th>
              <th className="px-4 py-3 text-left">Investigation Rcvd</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">No RSOI records found.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-bold text-primary">{r.rsoiNumber}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.failureDetectedJobCard || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.depot}</td>
                <td className="px-4 py-3"><Badge variant="outline" className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge></td>
                <td className="px-4 py-3 font-semibold text-xs">{r.typeOfRsoi}</td>
                <td className="px-4 py-3 text-xs">{r.system || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate">{r.actionToBeTaken || "—"}</td>
                <td className="px-4 py-3 text-center">
                  {r.investigationReportReceived
                    ? <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">Yes · {r.investigationReportReceivedDate}</Badge>
                    : <span className="text-xs text-muted-foreground">No</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <Button size="sm" variant="ghost" onClick={() => setViewRecord(r)}><Eye className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <RsoiForm count={records.length} onSave={r => {
        const { jobCards, ...rest } = r;
        const body = { ...rest, id: `RSOI-${Date.now()}`, jobCardsJson: JSON.stringify(jobCards) };
        fetch(`${BASE}/api/rsoi`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          .then(() => fetchRecords()).catch(console.error);
      }} onClose={() => setShowForm(false)} />}
      {viewRecord && <ViewModal record={viewRecord} onClose={() => setViewRecord(null)} />}
    </div>
  );
}
