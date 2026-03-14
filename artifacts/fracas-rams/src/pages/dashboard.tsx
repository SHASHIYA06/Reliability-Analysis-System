import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Wrench,
  FileText,
  Train,
  Gauge,
  BarChart3,
} from "lucide-react";
import { useGetSummaryReport } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { format } from "date-fns";

const PIE_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#6366f1", "#f59e0b",
  "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16",
];

const MDBF_TARGET = 30000;
const MTTR_TARGET = 240;
const AVAIL_TARGET = 0.95;

function MetricCard({ title, value, unit, target, targetLabel, icon: Icon, trending, color, sub }: any) {
  const meetsTarget = target != null ? (unit === "%" || unit === "km" ? Number(value) >= target : Number(value) <= target) : null;
  return (
    <Card className="bg-card border-border/50 shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-lg ${color || "bg-primary/10"}`}>
            <Icon className={`w-5 h-5 ${color ? "text-white" : "text-primary"}`} />
          </div>
          {meetsTarget !== null && (
            <Badge variant={meetsTarget ? "outline" : "destructive"} className="text-[10px]">
              {meetsTarget ? "✓ On Target" : "✗ Below Target"}
            </Badge>
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-foreground">
            {typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
            <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
          </p>
          {target != null && (
            <p className="text-[10px] text-muted-foreground">
              Target: {unit === "%" ? (target * 100).toFixed(0) : target.toLocaleString()} {unit === "%" ? "%" : unit}
              {targetLabel ? ` (${targetLabel})` : ""}
            </p>
          )}
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetSummaryReport();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card rounded-xl border border-border"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-card rounded-xl border border-border"></div>
          <div className="h-80 bg-card rounded-xl border border-border"></div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertTriangle className="w-12 h-12 mb-4 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load dashboard data</h2>
        <p className="text-sm">The API server may not be responding.</p>
      </div>
    );
  }

  const s = summary as any;

  const avail = typeof s.availability === "number" ? s.availability : 0.999;
  const mdbf = typeof s.mdbf === "number" ? s.mdbf : 0;
  const mttr = typeof s.mttr === "number" ? s.mttr : 0;
  const totalKm = typeof s.totalFleetDistance === "number" ? s.totalFleetDistance : 0;

  const trend = (s.monthlyTrend || []).map((d: any) => ({
    period: d.period?.substring(0, 7) || d.period || "",
    failures: Number(d.failures || 0),
    serviceFailures: Number(d.serviceFailures || 0),
  }));

  const systemData = (s.failuresBySystem || []).slice(0, 10).map((d: any) => ({
    name: (d.systemName || "Unknown").split(" ").slice(0, 3).join(" "),
    count: Number(d.count || 0),
  }));

  const trainData = (s.failuresByTrainSet || []).map((d: any) => ({
    name: d.trainSet || "Other",
    count: Number(d.count || 0),
  }));

  const recentFailures = s.recentFailures || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">FRACAS & RAMS Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          BEML · KMRC RS-3R Rolling Stock · {s.totalTrains || 14} Train Sets · {(s.totalFailures || 0).toLocaleString()} Job Cards · {totalKm > 0 ? `${(totalKm / 1000).toFixed(0)}K km fleet` : ""}
        </p>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Job Cards"
          value={s.totalFailures || 0}
          unit=""
          icon={FileText}
          color="bg-primary/10"
          sub={`${s.openJobCards || 0} open · ${s.serviceFailures || 0} service failures`}
        />
        <MetricCard
          title="MDBF"
          value={mdbf > 0 ? Math.round(mdbf) : "—"}
          unit="km"
          target={MDBF_TARGET}
          icon={Train}
          color="bg-blue-500/10"
          sub={totalKm > 0 ? `Fleet: ${(totalKm/1000).toFixed(0)}K km` : "No KM data"}
        />
        <MetricCard
          title="MTTR"
          value={mttr > 0 ? Math.round(mttr) : "—"}
          unit="min"
          target={MTTR_TARGET}
          targetLabel="max"
          icon={Clock}
          color="bg-amber-500/10"
          sub={mttr > 0 ? `${(mttr/60).toFixed(1)} hrs avg` : "Insufficient data"}
        />
        <MetricCard
          title="Availability"
          value={avail > 0 ? (avail * 100).toFixed(2) : "—"}
          unit="%"
          target={AVAIL_TARGET * 100}
          icon={Activity}
          color="bg-green-500/10"
          sub={`Target: ${(AVAIL_TARGET * 100).toFixed(0)}%`}
        />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Relevant Failures"
          value={s.relevantFailures || 0}
          unit=""
          icon={AlertTriangle}
          color="bg-orange-500/10"
          sub={`${s.serviceFailures || 0} service · ${s.nonRelevantFailures || 0} non-relevant`}
        />
        <MetricCard
          title="Pattern Failures"
          value={s.patternFailureCount || 0}
          unit=""
          icon={Gauge}
          color="bg-red-500/10"
          sub="Parts with 3+ recurrences"
        />
        <MetricCard
          title="Open Cards"
          value={s.openJobCards || 0}
          unit=""
          icon={Wrench}
          color="bg-purple-500/10"
          sub="Pending closure"
        />
        <MetricCard
          title="Active Train Sets"
          value={s.totalTrains || 14}
          unit=""
          icon={BarChart3}
          color="bg-cyan-500/10"
          sub="TS01–TS14 (MR601–MR614)"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Failure Trend */}
        <Card className="bg-card border-border/50 shadow-md">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Monthly Failure Trend</CardTitle>
            <CardDescription className="text-xs">Job cards reported by month</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {trend.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No trend data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v?.substring(5) || v} />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Line type="monotone" dataKey="failures" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="All Failures" />
                  <Line type="monotone" dataKey="serviceFailures" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Service Failures" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Failures by System */}
        <Card className="bg-card border-border/50 shadow-md">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Failures by System</CardTitle>
            <CardDescription className="text-xs">Top 10 systems by job card count</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {systemData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={systemData} margin={{ top: 5, right: 16, left: 0, bottom: 40 }} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-35} textAnchor="end" interval={0} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" name="Job Cards" radius={[3, 3, 0, 0]}>
                    {systemData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Failures by Train Set */}
        <Card className="bg-card border-border/50 shadow-md">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Failures by Train Set</CardTitle>
            <CardDescription className="text-xs">TS01–TS14 job card distribution</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {trainData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trainData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" name="Job Cards" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Job Cards */}
        <Card className="bg-card border-border/50 shadow-md">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Recent Job Cards</CardTitle>
            <CardDescription className="text-xs">Latest 5 failure reports</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {recentFailures.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No recent failures</div>
            ) : recentFailures.map((f: any) => {
              let dateStr = f.failureDate;
              try { dateStr = format(new Date(f.failureDate + "T00:00:00"), "dd/MM/yyyy"); } catch {}
              return (
                <div key={f.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className={`w-1.5 h-full min-h-[36px] rounded-full shrink-0 ${f.failureClass === "service-failure" ? "bg-destructive" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-mono font-bold text-primary truncate">{f.fracasNumber || f.jobCardNumber}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{dateStr}</span>
                    </div>
                    <p className="text-xs text-foreground truncate">{f.failureDescription || "No description"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{f.trainSet || f.trainNumber || "—"}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{f.systemName || f.systemCode || "—"}</span>
                      {f.repairDurationMinutes && <span className="text-[10px] text-muted-foreground">· {f.repairDurationMinutes}min</span>}
                    </div>
                  </div>
                  <Badge variant={f.status === "open" ? "destructive" : f.status === "in-progress" ? "secondary" : "outline"} className="text-[9px] uppercase shrink-0">
                    {f.status}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* RAMS Compliance Summary */}
      <Card className="bg-card border-border/50 shadow-md">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold">RAMS Compliance Summary</CardTitle>
          <CardDescription className="text-xs">RS-3R Rolling Stock · KMRC Project contractual targets</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                metric: "MDBF (Mean Distance Between Failures)",
                value: mdbf > 0 ? `${Math.round(mdbf).toLocaleString()} km` : "Insufficient KM data",
                target: `${MDBF_TARGET.toLocaleString()} km`,
                meets: mdbf === 0 ? null : mdbf >= MDBF_TARGET,
                note: "Based on service failures + delays",
              },
              {
                metric: "MTTR (Mean Time To Repair)",
                value: mttr > 0 ? `${Math.round(mttr)} min (${(mttr/60).toFixed(1)} hr)` : "Insufficient data",
                target: `≤ ${MTTR_TARGET} min (4 hr)`,
                meets: mttr === 0 ? null : mttr <= MTTR_TARGET,
                note: "Average repair duration from job cards",
              },
              {
                metric: "Availability",
                value: avail > 0 ? `${(avail * 100).toFixed(3)}%` : "—",
                target: `≥ ${(AVAIL_TARGET * 100).toFixed(0)}%`,
                meets: avail === 0 ? null : avail >= AVAIL_TARGET,
                note: "18 hrs/day × 365 days schedule",
              },
            ].map(({ metric, value, target, meets, note }) => (
              <div key={metric} className={`p-4 rounded-xl border ${meets === null ? "border-border bg-muted/20" : meets ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {meets === null ? <Activity className="w-4 h-4 text-muted-foreground" /> :
                    meets ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                    <AlertTriangle className="w-4 h-4 text-destructive" />}
                  <span className={`text-xs font-bold ${meets === null ? "text-muted-foreground" : meets ? "text-green-500" : "text-destructive"}`}>
                    {meets === null ? "Calculating..." : meets ? "Meets Target" : "Below Target"}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-foreground mb-1">{metric}</p>
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Target: {target}</p>
                <p className="text-[10px] text-muted-foreground italic">{note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
