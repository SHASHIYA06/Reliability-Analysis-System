import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Settings2, 
  Target, 
  TrendingDown, 
  TrendingUp,
  Wrench
} from "lucide-react";
import { useGetSummaryReport } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { format } from "date-fns";

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetSummaryReport();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card rounded-xl border border-border"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-card rounded-xl border border-border"></div>
          <div className="h-96 bg-card rounded-xl border border-border"></div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <AlertTriangle className="w-12 h-12 mb-4 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load dashboard data</h2>
        <p>The backend API might not be responding.</p>
      </div>
    );
  }

  const mdbfCompliance = summary.mdbf >= summary.mdbfTarget;
  const mttrCompliance = summary.mttr <= summary.mttrTarget;
  const availCompliance = summary.availability >= summary.availabilityTarget;

  // Mock trend data for charts since summary report doesn't contain time-series in the given schema
  const mockTrendData = [
    { month: 'Jan', mdbf: 28000, target: 30000 },
    { month: 'Feb', mdbf: 29500, target: 30000 },
    { month: 'Mar', mdbf: 31200, target: 30000 },
    { month: 'Apr', mdbf: 30500, target: 30000 },
    { month: 'May', mdbf: 29800, target: 30000 },
    { month: 'Jun', mdbf: 32100, target: 30000 },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Fleet Operations</h1>
        <p className="text-muted-foreground mt-1">Real-time overview of fleet reliability and maintenance performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-card/40 backdrop-blur border-border/50 shadow-lg shadow-black/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MDBF (Service Failures)</CardTitle>
            <Activity className={mdbfCompliance ? "text-success w-4 h-4" : "text-destructive w-4 h-4"} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground flex items-baseline gap-2">
              {summary.mdbf.toLocaleString()} <span className="text-sm text-muted-foreground font-sans font-normal">km</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" /> {summary.mdbfTarget.toLocaleString()} km
              </span>
              {mdbfCompliance ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 ml-auto">On Target</Badge>
              ) : (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 ml-auto">Below Target</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-border/50 shadow-lg shadow-black/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MTTR (Mean Time to Repair)</CardTitle>
            <Clock className={mttrCompliance ? "text-success w-4 h-4" : "text-destructive w-4 h-4"} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground flex items-baseline gap-2">
              {summary.mttr.toFixed(1)} <span className="text-sm text-muted-foreground font-sans font-normal">mins</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" /> {summary.mttrTarget} mins
              </span>
              {mttrCompliance ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 ml-auto">On Target</Badge>
              ) : (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 ml-auto">Above Target</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-border/50 shadow-lg shadow-black/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fleet Availability</CardTitle>
            <CheckCircle2 className={availCompliance ? "text-success w-4 h-4" : "text-destructive w-4 h-4"} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground flex items-baseline gap-2">
              {summary.availability.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" /> {summary.availabilityTarget}%
              </span>
              {availCompliance ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 ml-auto">On Target</Badge>
              ) : (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 ml-auto">Below Target</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-border/50 shadow-lg shadow-black/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Issues</CardTitle>
            <Wrench className="text-secondary w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground flex items-baseline gap-2">
              {summary.openJobCards}
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                Open Job Cards
              </span>
              {summary.patternFailureCount > 0 && (
                <span className="text-destructive flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3" /> {summary.patternFailureCount} Patterns
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>MDBF Trend (6 Months)</CardTitle>
            <CardDescription>Monthly Mean Distance Between Failures vs Target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target (30k)" />
                  <Line type="monotone" dataKey="mdbf" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--background))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} name="Actual MDBF" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Failures by System</CardTitle>
            <CardDescription>Distribution of relevant failures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {summary.failuresBySystem.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.failuresBySystem}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="systemName"
                      stroke="none"
                    >
                      {summary.failuresBySystem.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center">
                  <Settings2 className="w-12 h-12 mb-2 opacity-20" />
                  <p>No failure data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Failures Table */}
      <Card className="bg-card border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Job Cards</CardTitle>
          <CardDescription>Latest reported issues across the fleet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Job Card #</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Train</th>
                  <th className="px-4 py-3 font-medium">System</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentFailures.map((failure) => (
                  <tr key={failure.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-primary">{failure.jobCardNumber}</td>
                    <td className="px-4 py-3">{format(new Date(failure.failureDate), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 font-mono">{failure.trainNumber}</td>
                    <td className="px-4 py-3">
                      <div className="truncate max-w-[200px]">{failure.systemName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={failure.status === 'open' ? 'destructive' : failure.status === 'in-progress' ? 'secondary' : 'outline'} className="uppercase text-[10px]">
                        {failure.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        failure.failureClass === 'service-failure' ? 'bg-destructive/20 text-destructive' : 
                        failure.failureClass === 'relevant' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {failure.failureClass.replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {summary.recentFailures.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No recent job cards found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
