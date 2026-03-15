import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  FileText,
  Train,
  Gauge,
  BarChart3,
  ShieldAlert,
  ClipboardList,
  Package,
  ArrowRightLeft,
  ClipboardCheck,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useGetSummaryReport } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie, Legend,
} from "recharts";
import { format } from "date-fns";
import { Link } from "wouter";
import { API_BASE as BASE } from "@/lib/api-base";

const CHART_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#6366f1", "#f59e0b",
  "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16",
];

const MDBF_6MO = 60000;
const MDBF_12MO = 100000;
const MTTR_TARGET = 240;
const AVAIL_TARGET = 0.95;

function KpiCard({ title, value, unit, target, targetLabel, icon: Icon, iconBg, iconColor, sub, trend, link }: any) {
  const meetsTarget = target != null
    ? (unit === "%" || unit === "km" ? Number(value) >= target : Number(value) <= target)
    : null;
  return (
    <Card className="bg-card border-border/50 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${iconBg || "bg-primary/10"}`}>
            <Icon className={`w-4 h-4 ${iconColor || "text-primary"}`} />
          </div>
          {meetsTarget !== null && (
            <Badge variant={meetsTarget ? "outline" : "destructive"} className="text-[9px]">
              {meetsTarget ? "✓ On Target" : "✗ Below Target"}
            </Badge>
          )}
          {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-green-400" />}
          {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
        </div>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1">{title}</p>
        <p className="text-2xl font-bold text-foreground leading-tight">
          {typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
          {unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
        </p>
        {target != null && (
          <p className="text-[9px] text-muted-foreground mt-0.5">
            Target: {unit === "%" ? (target * 100 < 10 ? (target * 100).toFixed(0) : target) : target.toLocaleString()} {unit}
            {targetLabel ? ` (${targetLabel})` : ""}
          </p>
        )}
        {sub && <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>}
        {link && (
          <Link href={link}>
            <span className="text-[9px] text-primary hover:underline cursor-pointer flex items-center gap-0.5 mt-1">
              View all <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionBtn({ icon: Icon, label, href, color }: any) {
  return (
    <Link href={href}>
      <button className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:border-primary/40 bg-card hover:bg-primary/5 transition-all group min-w-[80px]`}>
        <div className={`p-2 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground whitespace-nowrap">{label}</span>
      </button>
    </Link>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetSummaryReport();
  const [kpi, setKpi] = useState({ dlpCritical: 1, openNCR: 4, openEIR: 3, openRSOI: 2, pendingGP: 2, lowStock: 1 });

  useEffect(() => {
    async function fetchKpis() {
      try {
        const [dlpRes, eirRes, rsoiRes, gpRes, invRes, ncrRes] = await Promise.allSettled([
          fetch(`${BASE}/api/dlp/stats/counts`).then(r => r.json()),
          fetch(`${BASE}/api/eir/stats/counts`).then(r => r.json()),
          fetch(`${BASE}/api/rsoi/stats/counts`).then(r => r.json()),
          fetch(`${BASE}/api/gate-pass/stats/counts`).then(r => r.json()),
          fetch(`${BASE}/api/inventory/stats/low-stock`).then(r => r.json()),
          fetch(`${BASE}/api/ncr`).then(r => r.json()),
        ]);
        setKpi({
          dlpCritical: dlpRes.status === "fulfilled" ? ((dlpRes.value.expired ?? 0) + (dlpRes.value.critical ?? 0)) : 1,
          openEIR: eirRes.status === "fulfilled" ? (eirRes.value.open ?? 3) : 3,
          openRSOI: rsoiRes.status === "fulfilled" ? (rsoiRes.value.open ?? 2) : 2,
          pendingGP: gpRes.status === "fulfilled" ? (gpRes.value.open ?? 2) : 2,
          lowStock: invRes.status === "fulfilled" ? (invRes.value.lowStock ?? 1) : 1,
          openNCR: ncrRes.status === "fulfilled" ? (ncrRes.value as any[]).filter((r: any) => r.status !== "CLOSED").length : 4,
        });
      } catch {}
    }
    fetchKpis();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-card rounded-xl border border-border" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-card rounded-xl border border-border" />
          <div className="h-72 bg-card rounded-xl border border-border" />
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
  const avail = typeof s.availability === "number" ? s.availability : 0;
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

  const recentFailures = (s.recentFailures || []).slice(0, 5);

  const mdbfMeets6 = mdbf > 0 && mdbf >= MDBF_6MO;
  const mdbfMeets12 = mdbf > 0 && mdbf >= MDBF_12MO;

  const { dlpCritical, openNCR, openEIR, openRSOI, pendingGP, lowStock } = kpi;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FRACAS &amp; RAMS Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            BEML · KMRC RS-3R Rolling Stock · {s.totalTrains || 14} Train Sets (MR601–MR614) · {(s.totalFailures || 0).toLocaleString()} Job Cards
            {totalKm > 0 && ` · ${(totalKm / 1000).toFixed(0)}K km fleet`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          Live · {format(new Date(), "dd MMM yyyy HH:mm")}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</p>
          <div className="flex gap-3 flex-wrap">
            <QuickActionBtn icon={Wrench}        label="New Job Card"  href="/job-cards"  color="bg-primary" />
            <QuickActionBtn icon={ClipboardList} label="New NCR"       href="/ncr"        color="bg-orange-500" />
            <QuickActionBtn icon={ClipboardCheck}label="New EIR"       href="/eir"        color="bg-blue-600" />
            <QuickActionBtn icon={FileCheck}     label="New RSOI"      href="/rsoi"       color="bg-purple-600" />
            <QuickActionBtn icon={ArrowRightLeft}label="Gate Pass"     href="/gate-pass"  color="bg-teal-600" />
            <QuickActionBtn icon={Package}       label="Store"         href="/inventory"  color="bg-cyan-600" />
            <QuickActionBtn icon={ShieldAlert}   label="DLP Items"     href="/dlp"        color="bg-red-600" />
            <QuickActionBtn icon={BarChart3}     label="RAMS Report"   href="/reports"    color="bg-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* RAMS KPIs — Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          title="Total Job Cards"
          value={s.totalFailures || 0}
          icon={FileText}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          sub={`${s.openJobCards || 0} open · ${s.serviceFailures || 0} service failures`}
          link="/job-cards"
        />
        <KpiCard
          title="MDBF (6-mo)"
          value={mdbf > 0 ? Math.round(mdbf) : "—"}
          unit="km"
          target={MDBF_6MO}
          icon={Train}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
          sub={totalKm > 0 ? `Fleet: ${(totalKm / 1000).toFixed(0)}K km` : "No KM data"}
        />
        <KpiCard
          title="MTTR"
          value={mttr > 0 ? Math.round(mttr) : "—"}
          unit="min"
          target={MTTR_TARGET}
          targetLabel="max"
          icon={Clock}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
          sub={mttr > 0 ? `${(mttr / 60).toFixed(1)} hrs avg` : "Insufficient data"}
        />
        <KpiCard
          title="Availability"
          value={avail > 0 ? (avail * 100).toFixed(2) : "—"}
          unit="%"
          target={AVAIL_TARGET * 100}
          icon={Activity}
          iconBg="bg-green-500/10"
          iconColor="text-green-400"
          sub="Target: ≥ 95%"
        />
      </div>

      {/* Module Status — Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Open NCRs"
          value={openNCR}
          icon={ClipboardList}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-400"
          sub="Non-conformance reports"
          link="/ncr"
        />
        <KpiCard
          title="Open EIRs"
          value={openEIR}
          icon={ClipboardCheck}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
          sub="Incident reports"
          link="/eir"
        />
        <KpiCard
          title="Open RSOIs"
          value={openRSOI}
          icon={FileCheck}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-400"
          sub="Open issues"
          link="/rsoi"
        />
        <KpiCard
          title="DLP Critical"
          value={dlpCritical}
          icon={ShieldAlert}
          iconBg="bg-red-500/10"
          iconColor="text-red-400"
          sub="Expiring / high NCR"
          link="/dlp"
        />
        <KpiCard
          title="Gate Passes Open"
          value={pendingGP}
          icon={ArrowRightLeft}
          iconBg="bg-teal-500/10"
          iconColor="text-teal-400"
          sub="Items out for repair"
          link="/gate-pass"
        />
        <KpiCard
          title="Low Stock Items"
          value={lowStock}
          icon={Package}
          iconBg="bg-cyan-500/10"
          iconColor="text-cyan-400"
          sub="Below reorder level"
          link="/inventory"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50 shadow-md">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Monthly Failure Trend</CardTitle>
            <CardDescription className="text-xs">All failures vs. service failures by month</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {trend.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No trend data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={trend} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradAll" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSvc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v?.substring(5) || v} />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Area type="monotone" dataKey="failures" stroke="hsl(var(--primary))" fill="url(#gradAll)" strokeWidth={2} name="All Failures" />
                  <Area type="monotone" dataKey="serviceFailures" stroke="hsl(var(--destructive))" fill="url(#gradSvc)" strokeWidth={2} name="Service Failures" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-md">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Failures by System</CardTitle>
            <CardDescription className="text-xs">Top 10 systems by job card count</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {systemData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No system data</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={systemData} margin={{ top: 5, right: 16, left: 0, bottom: 44 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-35} textAnchor="end" interval={0} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" name="Job Cards" radius={[4, 4, 0, 0]}>
                    {systemData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50 shadow-md">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Failures by Train Set</CardTitle>
            <CardDescription className="text-xs">TS01–TS14 job card distribution</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {trainData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No train data</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={trainData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" name="Job Cards" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

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
              try { dateStr = format(new Date(f.failureDate + "T00:00:00"), "dd/MM/yy"); } catch {}
              return (
                <div key={f.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className={`w-1.5 min-h-[36px] rounded-full shrink-0 ${f.failureClass === "service-failure" ? "bg-destructive" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-mono font-bold text-primary truncate">{f.fracasNumber || f.jobCardNumber}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{dateStr}</span>
                    </div>
                    <p className="text-xs text-foreground truncate">{f.failureDescription || "No description"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{f.trainSet || f.trainNumber || "—"}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-28">{f.systemName || f.systemCode || "—"}</span>
                    </div>
                  </div>
                  <Badge variant={f.status === "open" ? "destructive" : f.status === "in-progress" ? "secondary" : "outline"} className="text-[9px] uppercase shrink-0">
                    {f.status}
                  </Badge>
                </div>
              );
            })}
            <Link href="/job-cards">
              <Button variant="ghost" size="sm" className="w-full mt-1 text-xs text-muted-foreground hover:text-foreground">
                View all job cards <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* RAMS Compliance Summary */}
      <Card className="bg-card border-border/50 shadow-md">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">RAMS Compliance Summary</CardTitle>
              <CardDescription className="text-xs">RS-3R Rolling Stock · KMRC Project contractual targets per GR/TD/3457</CardDescription>
            </div>
            <Link href="/reports">
              <Button variant="outline" size="sm" className="text-xs h-7">
                Full Report <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                metric: "MDBF — Mean Distance Between Failures",
                value: mdbf > 0 ? `${Math.round(mdbf).toLocaleString()} km` : "Insufficient KM data",
                target6: `≥ ${MDBF_6MO.toLocaleString()} km (6-mo)`,
                target12: `≥ ${MDBF_12MO.toLocaleString()} km (12-mo)`,
                meets: mdbf === 0 ? null : mdbfMeets12 ? true : mdbfMeets6 ? "partial" : false,
                note: "Based on relevant service failures",
                progress: mdbf > 0 ? Math.min(100, (mdbf / MDBF_12MO) * 100) : 0,
              },
              {
                metric: "MTTR — Mean Time To Repair",
                value: mttr > 0 ? `${Math.round(mttr)} min (${(mttr / 60).toFixed(1)} hr)` : "Insufficient data",
                target6: `≤ ${MTTR_TARGET} min (4 hr)`,
                target12: "Contractual max",
                meets: mttr === 0 ? null : mttr <= MTTR_TARGET,
                note: "Average repair duration from job cards",
                progress: mttr > 0 ? Math.min(100, (MTTR_TARGET / mttr) * 100) : 0,
              },
              {
                metric: "Availability",
                value: avail > 0 ? `${(avail * 100).toFixed(3)}%` : "Insufficient data",
                target6: `≥ ${(AVAIL_TARGET * 100).toFixed(0)}%`,
                target12: "18 hrs/day × 365 schedule",
                meets: avail === 0 ? null : avail >= AVAIL_TARGET,
                note: "Based on MDBF and MTTR calculations",
                progress: avail > 0 ? Math.min(100, (avail / AVAIL_TARGET) * 100) : 0,
              },
            ].map(({ metric, value, target6, target12, meets, note, progress }) => (
              <div key={metric} className={`p-4 rounded-xl border ${
                meets === null ? "border-border bg-muted/20"
                : meets === true ? "border-green-500/30 bg-green-500/5"
                : meets === "partial" ? "border-yellow-500/30 bg-yellow-500/5"
                : "border-destructive/30 bg-destructive/5"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {meets === null ? <Gauge className="w-4 h-4 text-muted-foreground" />
                    : meets === true ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : meets === "partial" ? <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    : <AlertTriangle className="w-4 h-4 text-destructive" />}
                  <span className={`text-xs font-bold ${
                    meets === null ? "text-muted-foreground"
                    : meets === true ? "text-green-500"
                    : meets === "partial" ? "text-yellow-500"
                    : "text-destructive"
                  }`}>
                    {meets === null ? "Calculating..." : meets === true ? "Meets Target" : meets === "partial" ? "Partial (6-mo)" : "Below Target"}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-foreground mb-1">{metric}</p>
                <p className="text-lg font-bold text-foreground mb-2">{value}</p>
                {progress > 0 && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${meets === true ? "bg-green-500" : meets === "partial" ? "bg-yellow-500" : "bg-destructive"}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                )}
                <p className="text-[9px] text-muted-foreground">{target6}</p>
                <p className="text-[9px] text-muted-foreground">{target12}</p>
                <p className="text-[9px] text-muted-foreground italic mt-1">{note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Pattern Failures + Fleet Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50 shadow-md">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> FRACAS Summary
            </CardTitle>
            <CardDescription className="text-xs">Failure classification breakdown</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-3">
              {[
                { label: "Service Failures", value: s.serviceFailures || 0, color: "bg-destructive", max: s.totalFailures || 1 },
                { label: "Relevant Failures", value: s.relevantFailures || 0, color: "bg-orange-500", max: s.totalFailures || 1 },
                { label: "Non-Relevant", value: s.nonRelevantFailures || 0, color: "bg-blue-500", max: s.totalFailures || 1 },
                { label: "Pattern Failures (≥3)", value: s.patternFailureCount || 0, color: "bg-purple-500", max: s.totalFailures || 1 },
                { label: "Open Cards", value: s.openJobCards || 0, color: "bg-yellow-500", max: s.totalFailures || 1 },
              ].map(({ label, value, color, max }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-bold text-foreground">{value}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-md">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Train className="w-4 h-4 text-primary" /> Fleet Status
            </CardTitle>
            <CardDescription className="text-xs">RS-3R · 14 Train Sets · 3-car composition</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 14 }, (_, i) => {
                const tsNum = String(i + 1).padStart(2, "0");
                const trainCode = `MR6${String(i + 1).padStart(2, "0")}`;
                const trainEntry = trainData.find((t: any) => t.name === trainCode || t.name === `TS${tsNum}`);
                const count = trainEntry?.count || 0;
                const severity = count === 0 ? "ok" : count <= 2 ? "low" : count <= 5 ? "med" : "high";
                return (
                  <div key={i} className={`p-1.5 rounded-lg border text-center cursor-default ${
                    severity === "ok" ? "bg-green-500/10 border-green-500/30"
                    : severity === "low" ? "bg-blue-500/10 border-blue-500/30"
                    : severity === "med" ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-red-500/10 border-red-500/30"
                  }`} title={`${trainCode}: ${count} job cards`}>
                    <div className={`text-[9px] font-bold ${
                      severity === "ok" ? "text-green-400"
                      : severity === "low" ? "text-blue-400"
                      : severity === "med" ? "text-yellow-400"
                      : "text-red-400"
                    }`}>TS{tsNum}</div>
                    <div className="text-[8px] text-muted-foreground">{count}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[9px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/50 inline-block" />0 JC</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/50 inline-block" />1-2 JC</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500/50 inline-block" />3-5 JC</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/50 inline-block" />&gt;5 JC</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
