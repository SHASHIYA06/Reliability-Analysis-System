import { useGetMDBFReport, useGetMTTRReport, useGetAvailabilityReport, useGetMDBCFReport, useGetPatternFailures } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Reports() {
  const { data: mdbf } = useGetMDBFReport();
  const { data: mttr } = useGetMTTRReport();
  const { data: avail } = useGetAvailabilityReport();
  const { data: mdbcf } = useGetMDBCFReport();
  const { data: patterns } = useGetPatternFailures({ windowMonths: 18 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">RAMS Reports</h1>
          <p className="text-muted-foreground mt-1">Detailed Reliability, Availability, Maintainability, and Safety analytics.</p>
        </div>
        <Button variant="outline" className="border-border">
          <Download className="w-4 h-4 mr-2" /> Export PDF Report
        </Button>
      </div>

      <Tabs defaultValue="mdbf" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50 border border-border rounded-xl">
          <TabsTrigger value="mdbf" className="py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary">MDBF</TabsTrigger>
          <TabsTrigger value="mdbcf" className="py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary">MDBCF</TabsTrigger>
          <TabsTrigger value="mttr" className="py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary">MTTR</TabsTrigger>
          <TabsTrigger value="availability" className="py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary">Availability</TabsTrigger>
          <TabsTrigger value="patterns" className="py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-destructive">Pattern Failures</TabsTrigger>
        </TabsList>

        <TabsContent value="mdbf" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {mdbf && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-border shadow-lg">
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Calculated MDBF</div>
                    <div className="text-4xl font-bold font-mono mt-2 text-primary">{mdbf.mdbf.toLocaleString()} <span className="text-lg text-muted-foreground font-sans font-normal">km</span></div>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-sm text-muted-foreground">Target: {mdbf.target.toLocaleString()} km</span>
                      {mdbf.compliance ? <Badge className="bg-success/20 text-success hover:bg-success/30">Compliant</Badge> : <Badge variant="destructive">Non-Compliant</Badge>}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-lg">
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Total Fleet Distance</div>
                    <div className="text-3xl font-bold font-mono mt-2">{mdbf.totalFleetDistance.toLocaleString()} <span className="text-lg text-muted-foreground font-sans font-normal">km</span></div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-lg">
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Service Failures</div>
                    <div className="text-3xl font-bold font-mono mt-2 text-destructive">{mdbf.totalServiceFailures}</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>MDBF by Train</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                        <tr>
                          <th className="px-4 py-3">Train Number</th>
                          <th className="px-4 py-3 text-right">Distance (km)</th>
                          <th className="px-4 py-3 text-right">Service Failures</th>
                          <th className="px-4 py-3 text-right">Calculated MDBF (km)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mdbf.byTrain.map((t) => (
                          <tr key={t.trainNumber} className="border-b border-border/50">
                            <td className="px-4 py-3 font-mono text-secondary">{t.trainNumber}</td>
                            <td className="px-4 py-3 text-right font-mono">{t.distance.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono">{t.serviceFailures}</td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${t.mdbf < mdbf.target ? 'text-destructive' : 'text-success'}`}>
                              {t.mdbf.toLocaleString()}
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

        <TabsContent value="mttr" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {mttr && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card border-border shadow-lg">
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">Overall MTTR</div>
                    <div className="text-4xl font-bold font-mono mt-2 text-secondary">{mttr.overallMTTR.toFixed(1)} <span className="text-lg text-muted-foreground font-sans font-normal">mins</span></div>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-sm text-muted-foreground">Target: {mttr.target} mins</span>
                      {mttr.compliance ? <Badge className="bg-success/20 text-success">Compliant</Badge> : <Badge variant="destructive">Non-Compliant</Badge>}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="py-4"><CardTitle className="text-base">Repair Distribution</CardTitle></CardHeader>
                  <CardContent className="h-[120px] pb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mttr.distribution} margin={{top:0,right:0,left:-20,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: 'hsl(var(--muted)/0.5)'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}/>
                        <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>MTTR by System</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                        <tr>
                          <th className="px-4 py-3">System</th>
                          <th className="px-4 py-3 text-right">Total Repairs</th>
                          <th className="px-4 py-3 text-right">Total Time (mins)</th>
                          <th className="px-4 py-3 text-right">Calculated MTTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mttr.bySystem.map((s) => (
                          <tr key={s.systemCode} className="border-b border-border/50">
                            <td className="px-4 py-3 font-medium">{s.systemCode} - {s.systemName}</td>
                            <td className="px-4 py-3 text-right font-mono">{s.totalRepairs}</td>
                            <td className="px-4 py-3 text-right font-mono">{s.totalRepairTime}</td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${s.mttr > mttr.target ? 'text-destructive' : 'text-success'}`}>
                              {s.mttr.toFixed(1)}
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

        {/* Similar tabs for Availability and MDBCF could be fleshed out, simplifying for layout space */}
        <TabsContent value="availability" className="mt-6"><p className="text-muted-foreground p-8 text-center">Availability report view...</p></TabsContent>
        <TabsContent value="mdbcf" className="mt-6"><p className="text-muted-foreground p-8 text-center">MDBCF component level report view...</p></TabsContent>

        <TabsContent value="patterns" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {patterns && (
            <Card className="bg-card border-border shadow-lg border-t-destructive/50 border-t-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" /> Active Pattern Failures
                  </CardTitle>
                  <CardDescription>Parts exceeding normal failure rates in the last {patterns.windowMonths} months</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {patterns.patterns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-success">
                    <CheckCircle2 className="w-12 h-12 mb-4" />
                    <h3 className="text-lg font-medium">No Pattern Failures Detected</h3>
                    <p className="text-muted-foreground">Fleet reliability is nominal.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                        <tr>
                          <th className="px-4 py-3">Part Number</th>
                          <th className="px-4 py-3">System</th>
                          <th className="px-4 py-3 text-center">Occurrences</th>
                          <th className="px-4 py-3 text-center">% Affected</th>
                          <th className="px-4 py-3 text-center">Dates</th>
                          <th className="px-4 py-3">Pattern Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patterns.patterns.map((p) => (
                          <tr key={p.partNumber} className="border-b border-border/50 bg-destructive/5 hover:bg-destructive/10">
                            <td className="px-4 py-3 font-mono font-bold text-destructive">
                              {p.partNumber}
                              <div className="text-xs font-sans font-normal text-muted-foreground">{p.partDescription}</div>
                            </td>
                            <td className="px-4 py-3 text-xs">{p.systemName}</td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-destructive text-lg">{p.occurrences}</td>
                            <td className="px-4 py-3 text-center font-mono">{p.percentageAffected.toFixed(1)}%</td>
                            <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                              {p.firstOccurrence && format(new Date(p.firstOccurrence), 'MMM yy')} - {p.lastOccurrence && format(new Date(p.lastOccurrence), 'MMM yy')}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="destructive" className="uppercase text-[10px]">{p.patternType}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
