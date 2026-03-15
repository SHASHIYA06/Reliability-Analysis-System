import { useState, useRef } from "react";
import {
  useGetMDBFReport, useGetMTTRReport,
  useGetAvailabilityReport, useGetMDBCFReport, useGetPatternFailures,
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Legend,
} from "recharts";
import {
  CheckCircle2, AlertTriangle, Download, TrendingUp, Activity,
  Clock, Gauge, Shield, ChevronRight, ChevronDown, BrainCircuit, Send, Sparkles, Loader2,
} from "lucide-react";
import { format } from "date-fns";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const fmt = (n: number) => n.toLocaleString("en-IN");
const ComplianceBadge = ({ ok }: { ok: boolean }) =>
  ok
    ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Compliant</Badge>
    : <Badge variant="destructive">Non-Compliant</Badge>;

const StatCard = ({
  label, value, unit, sub, compliance,
}: { label: string; value: string; unit?: string; sub?: string; compliance?: boolean }) => (
  <Card className="bg-card border-border shadow-lg">
    <CardContent className="pt-5 pb-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold font-mono mt-1 text-foreground">
        {value}
        {unit && <span className="text-base font-sans font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
      {(sub || compliance !== undefined) && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          {compliance !== undefined && <ComplianceBadge ok={compliance} />}
        </div>
      )}
    </CardContent>
  </Card>
);

const InfoBlock = ({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) => (
  <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border/40">
    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
    <p className={`font-semibold text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
  </div>
);

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Activity className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm">Loading {label}…</p>
    </div>
  );
}

/* ─── Pattern row with expand ───────────────────────────────────────────────── */
function PatternRow({ p }: { p: any }) {
  const [open, setOpen] = useState(false);
  const isHigh = p.percentageAffected >= 20;

  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-destructive/5 cursor-pointer transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <div>
              <p className="font-semibold text-sm text-destructive">{p.itemName}</p>
              <p className="text-xs text-muted-foreground">{p.systemName}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-center font-mono font-bold text-destructive text-lg">{p.occurrences}</td>
        <td className="px-4 py-3 text-center font-mono text-sm">{p.serviceFailures}</td>
        <td className="px-4 py-3 text-center font-mono">
          <span className={isHigh ? "text-destructive font-bold" : ""}>{p.trainsAffected}/{p.totalTrains}</span>
          <span className="text-xs text-muted-foreground ml-1">({p.percentageAffected.toFixed(0)}%)</span>
        </td>
        <td className="px-4 py-3 text-center text-xs text-muted-foreground">
          {p.firstOccurrence && format(new Date(p.firstOccurrence), "MMM yy")} –{" "}
          {p.lastOccurrence && format(new Date(p.lastOccurrence), "MMM yy")}
        </td>
        <td className="px-4 py-3">
          <Badge variant="destructive" className="text-[10px] uppercase">{p.patternType}</Badge>
        </td>
      </tr>
      {open && (
        <tr className="bg-destructive/5">
          <td colSpan={6} className="px-6 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Related Job Cards</p>
            <div className="flex flex-wrap gap-1.5">
              {(p.jobCardIds || []).slice(0, 20).map((jc: string) => (
                <a
                  key={jc}
                  href={`/job-cards?q=${encodeURIComponent(jc)}`}
                  className="inline-block font-mono text-xs px-2 py-0.5 rounded bg-card border border-border hover:border-primary transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  {jc}
                </a>
              ))}
              {p.occurrences > 20 && (
                <span className="text-xs text-muted-foreground">+{p.occurrences - 20} more</span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── AI Insights Panel ─────────────────────────────────────────────────────── */
type Message = { role: "user" | "ai"; text: string };

const QUICK_QUESTIONS = [
  "What are the top 3 failure patterns in the fleet?",
  "Which systems have the most service failures?",
  "How is our MDBF trending vs. the 60,000 km target?",
  "Which components need priority corrective action?",
  "Summarize MTTR performance and highlight non-compliant systems.",
];

function AIInsightsTab() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! I'm your RAMS AI Analyst powered by Gemini. I can analyze your job card data and provide insights on failure patterns, MDBF trends, MTTR performance, and RAMS compliance. Ask me anything about your fleet." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const ask = async (q: string) => {
    if (!q.trim() || loading) return;
    const question = q.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/analyze-failures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json() as { answer?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "AI failed");
      setMessages(m => [...m, { role: "ai", text: data.answer || "No response." }]);
    } catch (err: any) {
      setMessages(m => [...m, { role: "ai", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl px-5 py-3 flex items-center gap-3">
        <BrainCircuit className="w-5 h-5 text-primary shrink-0" />
        <span className="text-xs text-muted-foreground">
          <strong className="text-foreground">Gemini AI RAMS Analyst</strong> — Analyzes your real job card database and provides insights based on EN 50126:1999 RAMS standards.
          Powered by Replit AI Integrations (no API key required).
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map(q => (
          <button key={q} onClick={() => ask(q)}
            className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/40 transition-colors text-muted-foreground hover:text-foreground">
            {q}
          </button>
        ))}
      </div>

      <Card className="bg-card border-border shadow-lg">
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted/50 border border-border/50 rounded-bl-none"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              </div>
              <div className="bg-muted/50 border border-border/50 rounded-xl rounded-bl-none px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-xs text-muted-foreground ml-1">Analyzing your FRACAS data…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
            placeholder="Ask about failure patterns, MDBF, MTTR, availability compliance…"
            className="bg-background border-border"
            disabled={loading}
          />
          <Button onClick={() => ask(input)} disabled={loading || !input.trim()} className="bg-primary hover:bg-primary/90 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function Reports() {
  const { data: mdbf } = useGetMDBFReport() as { data: any };
  const { data: mttr } = useGetMTTRReport() as { data: any };
  const { data: avail } = useGetAvailabilityReport() as { data: any };
  const { data: mdbcf } = useGetMDBCFReport() as { data: any };
  const { data: patterns } = useGetPatternFailures({ windowMonths: 18 }) as { data: any };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RAMS Reports</h1>
          <p className="text-muted-foreground mt-1">
            Reliability, Availability, Maintainability & Safety · EN 50126:1999 / KMRC RS(3R)
          </p>
        </div>
        <Button variant="outline" className="border-border shrink-0">
          <Download className="w-4 h-4 mr-2" /> Export PDF Report
        </Button>
      </div>

      <Tabs defaultValue="mdbf" className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-muted/50 border border-border rounded-xl">
          {[
            { value: "mdbf", label: "MDBF" },
            { value: "mdbcf", label: "MDBCF" },
            { value: "mttr", label: "MTTR" },
            { value: "availability", label: "Availability" },
            { value: "patterns", label: "Pattern Failures" },
            { value: "ai", label: "🤖 AI Insights" },
          ].map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary text-xs md:text-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── MDBF ─────────────────────────────────────────────────────────── */}
        <TabsContent value="mdbf" className="mt-6 space-y-6">
          {!mdbf ? <EmptyTab label="MDBF" /> : (
            <>
              <div className="bg-muted/30 border border-border/50 rounded-xl px-5 py-3 text-xs text-muted-foreground">
                <strong>Formula:</strong> MDBF = Total Fleet Distance ÷ Total Service Failures &nbsp;|&nbsp;
                <strong>Service Failure:</strong> Withdrawal = Yes OR Delay ≥ 3 min (RAMS Plan §7.3) &nbsp;|&nbsp;
                <strong>Target:</strong> ≥60,000 km (6 mo) · ≥100,000 km (12 mo)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Calculated MDBF"
                  value={fmt(mdbf.mdbf)}
                  unit="km"
                  sub={`Target (6 mo): ${fmt(mdbf.target6mo || 60000)} km`}
                  compliance={mdbf.compliance}
                />
                <StatCard label="Total Fleet Distance" value={fmt(mdbf.totalFleetDistance)} unit="km" />
                <StatCard label="Service Failures" value={String(mdbf.totalServiceFailures)}
                  sub={`Withdrawal: ${mdbf.withdrawalCount} · Delay: ${mdbf.delayCount}`} />
              </div>

              {/* Monthly trend */}
              {mdbf.trend?.length > 0 && (
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Service Failures — Monthly Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mdbf.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 12 }} />
                        <Bar dataKey="failures" name="Service Failures" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* By train */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader><CardTitle>MDBF by TrainSet</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                        <tr>
                          <th className="px-4 py-3">TrainSet</th>
                          <th className="px-4 py-3 text-right">Odometer (km)</th>
                          <th className="px-4 py-3 text-right">Service Failures</th>
                          <th className="px-4 py-3 text-right">MDBF (km)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(mdbf.byTrain || []).map((t: any) => (
                          <tr key={t.trainNumber} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="px-4 py-2 font-mono text-secondary font-semibold">{t.trainNumber}</td>
                            <td className="px-4 py-2 text-right font-mono">{fmt(t.distance)}</td>
                            <td className="px-4 py-2 text-right font-mono">{t.serviceFailures}</td>
                            <td className={`px-4 py-2 text-right font-mono font-bold ${t.mdbf < (mdbf.target || 60000) ? "text-destructive" : "text-green-400"}`}>
                              {t.serviceFailures === 0 ? "—" : fmt(t.mdbf)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── MDBCF ────────────────────────────────────────────────────────── */}
        <TabsContent value="mdbcf" className="mt-6 space-y-6">
          {!mdbcf ? <EmptyTab label="MDBCF" /> : (
            <>
              <div className="bg-muted/30 border border-border/50 rounded-xl px-5 py-3 text-xs text-muted-foreground">
                <strong>Formula:</strong> MDBCF = Total Fleet Distance ÷ Service Failures of Identical Items &nbsp;|&nbsp;
                <strong>Level:</strong> Component / Sub-System level (EN 50126:1999) &nbsp;|&nbsp;
                <strong>Targets:</strong> Per RAMS Plan Table 2 (3-car train-km)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Fleet Distance"
                  value={fmt(mdbcf.totalFleetDistance)}
                  unit="km"
                />
                <StatCard label="Total Service Failures" value={String(mdbcf.totalServiceFailures)} />
                <StatCard label="Overall MDBCF" value={fmt(mdbcf.mdbcf)} unit="km" />
              </div>

              {/* System-level table */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>MDBCF by System</CardTitle>
                  <CardDescription>Service failures per system vs. RAMS Plan Table 2 targets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                        <tr>
                          <th className="px-4 py-3">System</th>
                          <th className="px-4 py-3 text-right">Total Failures</th>
                          <th className="px-4 py-3 text-right">Service Failures</th>
                          <th className="px-4 py-3 text-right">MDBCF (km)</th>
                          <th className="px-4 py-3 text-right">Target (km)</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(mdbcf.bySystem || []).map((s: any) => (
                          <tr key={s.systemCode} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="px-4 py-2 font-medium">{s.systemName}</td>
                            <td className="px-4 py-2 text-right font-mono">{s.totalFailures}</td>
                            <td className="px-4 py-2 text-right font-mono">{s.serviceFailures}</td>
                            <td className="px-4 py-2 text-right font-mono font-bold">
                              {s.mdbcf != null ? fmt(s.mdbcf) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-muted-foreground">{fmt(s.target)}</td>
                            <td className="px-4 py-2 text-center">
                              {s.mdbcf != null
                                ? <ComplianceBadge ok={s.compliance} />
                                : <Badge variant="outline" className="text-[10px]">No SF</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Component/subsystem-level table */}
              {(mdbcf.bySubsystem || []).length > 0 && (
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader>
                    <CardTitle>Top Failing Components (Sub-System Level)</CardTitle>
                    <CardDescription>Items with ≥3 total failures in the assessment period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                          <tr>
                            <th className="px-4 py-3">Component / Sub-System</th>
                            <th className="px-4 py-3">System</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-right">Service Failures</th>
                            <th className="px-4 py-3 text-right">MDBCF (km)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(mdbcf.bySubsystem || []).slice(0, 30).map((s: any) => (
                            <tr key={s.key} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="px-4 py-2 font-semibold text-sm">{s.subsystemName}</td>
                              <td className="px-4 py-2 text-xs text-muted-foreground">{s.systemName}</td>
                              <td className="px-4 py-2 text-right font-mono">{s.totalFailures}</td>
                              <td className="px-4 py-2 text-right font-mono">
                                <span className={s.serviceFailures > 0 ? "text-destructive font-bold" : "text-muted-foreground"}>
                                  {s.serviceFailures}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {s.mdbcf != null ? fmt(s.mdbcf) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── MTTR ─────────────────────────────────────────────────────────── */}
        <TabsContent value="mttr" className="mt-6 space-y-6">
          {!mttr ? <EmptyTab label="MTTR" /> : (
            <>
              <div className="bg-muted/30 border border-border/50 rounded-xl px-5 py-3 text-xs text-muted-foreground">
                <strong>Formula:</strong> MTTR = Cumulative Repair Time (incl. access) ÷ Relevant Failures &nbsp;|&nbsp;
                <strong>LRU Target:</strong> &lt;30 min &nbsp;|&nbsp;
                <strong>Overall Target:</strong> ≤240 min (4 hrs) · System-specific targets per RAMS Plan Table 3
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Overall MTTR"
                  value={String(mttr.overallMTTR)}
                  unit="min"
                  sub={`Target: ≤${mttr.target} min`}
                  compliance={mttr.compliance}
                />
                <StatCard label="Total Repairs Recorded" value={String(mttr.totalRepairs || 0)} />
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Repair Duration Distribution</CardTitle></CardHeader>
                  <CardContent className="h-28 pb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mttr.distribution} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 11 }} />
                        <Bar dataKey="count" name="Repairs" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border shadow-lg">
                <CardHeader><CardTitle>MTTR by System</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                        <tr>
                          <th className="px-4 py-3">System</th>
                          <th className="px-4 py-3 text-right">Repairs</th>
                          <th className="px-4 py-3 text-right">Total Time (min)</th>
                          <th className="px-4 py-3 text-right">MTTR (min)</th>
                          <th className="px-4 py-3 text-right">Target (min)</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(mttr.bySystem || []).map((s: any) => (
                          <tr key={s.systemCode} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="px-4 py-2 font-medium">{s.systemName}</td>
                            <td className="px-4 py-2 text-right font-mono">{s.totalRepairs}</td>
                            <td className="px-4 py-2 text-right font-mono">{fmt(s.totalRepairTime)}</td>
                            <td className={`px-4 py-2 text-right font-mono font-bold ${!s.compliance ? "text-destructive" : "text-green-400"}`}>
                              {s.mttr}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-muted-foreground">{s.target}</td>
                            <td className="px-4 py-2 text-center"><ComplianceBadge ok={s.compliance} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── AVAILABILITY ──────────────────────────────────────────────────── */}
        <TabsContent value="availability" className="mt-6 space-y-6">
          {!avail ? <EmptyTab label="Availability" /> : (
            <>
              <div className="bg-muted/30 border border-border/50 rounded-xl px-5 py-3 text-xs text-muted-foreground">
                <strong>Formula:</strong> Availability = [1 − (DT(OPM) + DT(CM)) ÷ Total Time] × 100 &nbsp;|&nbsp;
                <strong>Total Time</strong> = Assessment Days × Active Trains × {avail.numTrains && "20"} hrs/day &nbsp;|&nbsp;
                <strong>Target:</strong> ≥95% (RAMS Plan §19.4.1)
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Availability"
                  value={pct(avail.overallAvailability)}
                  sub="Target: ≥95.00%"
                  compliance={avail.compliance}
                />
                <StatCard
                  label="Assessment Period"
                  value={String(avail.assessmentDays)}
                  unit="days"
                  sub={`${avail.numTrains} active trains`}
                />
                <StatCard
                  label="DT(CM)"
                  value={(avail.dtCmHours || 0).toFixed(1)}
                  unit="hrs"
                  sub="Corrective maintenance"
                />
                <StatCard
                  label="DT(OPM)"
                  value={(avail.dtOpmHours || 0).toFixed(1)}
                  unit="hrs"
                  sub="PM / OPM"
                />
              </div>

              {/* Availability formula breakdown */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-primary" /> Availability Calculation Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <InfoBlock label="Scheduled Hours" value={`${fmt(Math.round(avail.totalScheduledHours))} hrs`} mono />
                    <InfoBlock label="DT(CM) Hours" value={`${(avail.dtCmHours || 0).toFixed(2)} hrs`} mono />
                    <InfoBlock label="DT(OPM) Hours" value={`${(avail.dtOpmHours || 0).toFixed(2)} hrs`} mono />
                    <InfoBlock label="Total Downtime" value={`${(avail.totalDowntimeHours || 0).toFixed(2)} hrs`} mono />
                  </div>
                  <div className="mt-4 p-4 bg-muted/40 rounded-xl border border-border/50 font-mono text-sm text-center">
                    A = [1 − ({(avail.totalDowntimeHours || 0).toFixed(1)} ÷ {fmt(Math.round(avail.totalScheduledHours))}) ] × 100 ={" "}
                    <span className={`font-bold text-lg ${avail.compliance ? "text-green-400" : "text-destructive"}`}>
                      {pct(avail.overallAvailability)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly trend */}
              {(avail.trend || []).length > 0 && (
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Monthly Availability Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(avail.trend || []).map((t: any) => ({
                        ...t,
                        availPct: parseFloat((t.availability * 100).toFixed(2)),
                        target: 95,
                      }))} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis domain={[50, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 12 }}
                          formatter={(v: any) => [`${v}%`]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceLine y={95} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Target 95%", fill: "hsl(var(--destructive))", fontSize: 10, position: "insideTopLeft" }} />
                        <Line type="monotone" dataKey="availPct" name="Availability %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* By train */}
              {(avail.byTrain || []).length > 0 && (
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader><CardTitle>Availability by TrainSet</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                          <tr>
                            <th className="px-4 py-3">TrainSet</th>
                            <th className="px-4 py-3 text-right">DT(CM) hrs</th>
                            <th className="px-4 py-3 text-right">DT(OPM) hrs</th>
                            <th className="px-4 py-3 text-right">Total DT hrs</th>
                            <th className="px-4 py-3 text-right">Availability</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(avail.byTrain || []).map((t: any) => (
                            <tr key={t.trainNumber} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="px-4 py-2 font-mono font-semibold text-secondary">{t.trainNumber}</td>
                              <td className="px-4 py-2 text-right font-mono">{t.dtCmHours}</td>
                              <td className="px-4 py-2 text-right font-mono">{t.dtOpmHours}</td>
                              <td className="px-4 py-2 text-right font-mono">{t.downtimeHours}</td>
                              <td className={`px-4 py-2 text-right font-mono font-bold ${t.availability < 0.95 ? "text-destructive" : "text-green-400"}`}>
                                {pct(t.availability)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── AI INSIGHTS ──────────────────────────────────────────────────── */}
        <TabsContent value="ai" className="mt-6">
          <AIInsightsTab />
        </TabsContent>

        {/* ── PATTERN FAILURES ──────────────────────────────────────────────── */}
        <TabsContent value="patterns" className="mt-6 space-y-6">
          {!patterns ? <EmptyTab label="Pattern Failures" /> : (
            <>
              <div className="bg-muted/30 border border-border/50 rounded-xl px-5 py-3 text-xs text-muted-foreground">
                <strong>Criterion (RAMS Plan §19.2.6(iv)):</strong>{" "}
                ≥3 relevant service failures of same part/item in same manner, OR ≥20% of fleet affected during 18-month window &nbsp;|&nbsp;
                <strong>Level:</strong> Component / Sub-System (not system level) &nbsp;|&nbsp;
                <strong>Click a row</strong> to view related job cards
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Active Pattern Failures" value={String(patterns.totalPatterns || patterns.patterns?.length || 0)} />
                <StatCard label="Analysis Window" value={String(patterns.windowMonths)} unit="months" />
                <StatCard label="Analysis Date" value={patterns.analysisDate || "—"} />
              </div>

              <Card className={`bg-card border-border shadow-lg border-t-4 ${(patterns.patterns?.length || 0) > 0 ? "border-t-destructive" : "border-t-green-500"}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className={`flex items-center gap-2 ${(patterns.patterns?.length || 0) > 0 ? "text-destructive" : "text-green-400"}`}>
                      {(patterns.patterns?.length || 0) > 0
                        ? <><AlertTriangle className="w-5 h-5" /> {patterns.patterns.length} Pattern Failure{patterns.patterns.length !== 1 ? "s" : ""} Detected</>
                        : <><CheckCircle2 className="w-5 h-5" /> No Pattern Failures</>}
                    </CardTitle>
                    <CardDescription>
                      Components with ≥3 failures in the last {patterns.windowMonths} months · Click row to expand
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {(patterns.patterns?.length || 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-green-400">
                      <CheckCircle2 className="w-12 h-12 mb-4" />
                      <h3 className="text-lg font-medium">Fleet reliability is nominal.</h3>
                      <p className="text-muted-foreground text-sm">No pattern failures meet the threshold criteria.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                          <tr>
                            <th className="px-4 py-3">Component / Item</th>
                            <th className="px-4 py-3 text-center">Total Failures</th>
                            <th className="px-4 py-3 text-center">Service Failures</th>
                            <th className="px-4 py-3 text-center">Trains Affected</th>
                            <th className="px-4 py-3 text-center">Period</th>
                            <th className="px-4 py-3">Pattern Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(patterns.patterns || []).map((p: any) => (
                            <PatternRow key={p.key || p.itemName} p={p} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
