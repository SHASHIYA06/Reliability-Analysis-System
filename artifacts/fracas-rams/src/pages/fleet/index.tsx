import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Train, Plus, Gauge, Calendar, TrendingUp, Download, Search, ArrowUpDown } from "lucide-react";
import { useListTrains, useListFleetDistances, useCreateFleetDistance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

const TS_LABEL: Record<string, string> = {
  MR601:"TS01", MR602:"TS02", MR603:"TS03", MR604:"TS04", MR605:"TS05",
  MR606:"TS06", MR607:"TS07", MR608:"TS08", MR609:"TS09", MR610:"TS10",
  MR611:"TS11", MR612:"TS12", MR613:"TS13", MR614:"TS14", MR615:"TS15",
  MR616:"TS16", MR617:"TS17",
};

export default function Fleet() {
  const { data: trains = [], isLoading, refetch } = useListTrains();
  const { data: distances = [], refetch: refetchDist } = useListFleetDistances();
  const createDist = useCreateFleetDistance();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [showDialog, setShowDialog] = useState(false);
  const [selectedTrainId, setSelectedTrainId] = useState("");
  const [dailyKm, setDailyKm] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [recordDate, setRecordDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [remarks, setRemarks] = useState("");
  const [filterTs, setFilterTs] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [viewMode, setViewMode] = useState<"fleet" | "history">("fleet");

  const selectedTrain = trains.find(t => t.id === selectedTrainId);

  const distByTrain = useMemo(() => {
    const map: Record<string, typeof distances> = {};
    for (const d of distances) {
      if (!map[d.trainId]) map[d.trainId] = [];
      map[d.trainId].push(d);
    }
    return map;
  }, [distances]);

  const latestDist = (trainId: string) => {
    const arr = (distByTrain[trainId] || []).sort(
      (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
    );
    return arr[0];
  };

  const totalFleetKm = useMemo(() => {
    return trains.reduce((sum, t) => {
      const d = latestDist(t.id);
      return sum + (d?.cumulativeDistanceKm || 0);
    }, 0);
  }, [trains, distByTrain]);

  const activeTrains = trains.filter(t => t.status === "active").length;

  const filteredTrains = useMemo(() => {
    return trains.filter(t => {
      if (filterTs && TS_LABEL[t.trainNumber] !== filterTs) return false;
      return true;
    });
  }, [trains, filterTs]);

  const filteredHistory = useMemo(() => {
    return distances.filter(d => {
      const train = trains.find(t => t.id === d.trainId);
      if (!train) return false;
      if (filterTs && TS_LABEL[train.trainNumber] !== filterTs) return false;
      if (searchDate && !d.recordDate.startsWith(searchDate)) return false;
      return true;
    }).sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  }, [distances, filterTs, searchDate, trains]);

  const handleSubmit = async () => {
    if (!selectedTrainId || !dailyKm || !recordDate) {
      toast({ title: "Required Fields Missing", description: "Select train, enter daily KM and date.", variant: "destructive" });
      return;
    }
    const train = trains.find(t => t.id === selectedTrainId);
    if (!train) return;
    const prev = latestDist(selectedTrainId);
    const prevCum = prev?.cumulativeDistanceKm || 0;
    const daily = parseFloat(dailyKm);
    const cumulative = odometerReading ? parseFloat(odometerReading) : prevCum + daily;
    try {
      await createDist.mutateAsync({
        trainId: selectedTrainId,
        trainNumber: train.trainNumber,
        recordDate,
        cumulativeDistanceKm: cumulative,
        dailyDistanceKm: daily,
        notes: remarks || null,
      });
      toast({ title: "Daily KM Recorded", description: `${train.trainNumber}: ${daily.toLocaleString()} km on ${recordDate}` });
      setShowDialog(false);
      setDailyKm(""); setOdometerReading(""); setRemarks("");
      refetchDist();
    } catch {
      toast({ title: "Save Failed", description: "Could not save KM entry.", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const rows = [["Train No", "Train Set", "Date", "Daily KM", "Cumulative KM", "Remarks"]];
    for (const d of filteredHistory) {
      const train = trains.find(t => t.id === d.trainId);
      rows.push([
        train?.trainNumber || "",
        TS_LABEL[train?.trainNumber || ""] || "",
        d.recordDate,
        (d.dailyDistanceKm || 0).toString(),
        (d.cumulativeDistanceKm || 0).toString(),
        d.notes || "",
      ]);
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `fleet-km-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Train className="w-8 h-8 text-primary" /> Fleet Management
          </h1>
          <p className="text-muted-foreground mt-1">MR601–MR617 (TS01–TS17) rolling stock • KMRC RS-3R Project</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCSV} className="border-border">
            <Download className="w-4 h-4 mr-2" /> Export KM Data
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowDialog(true)}>
            <Gauge className="w-4 h-4 mr-2" /> Log Daily KM
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Trainsets", value: trains.length.toString(), sub: "TS01–TS17", icon: Train },
          { label: "Active Trains", value: activeTrains.toString(), sub: `${trains.length - activeTrains} maintenance`, icon: TrendingUp },
          { label: "Fleet Distance", value: `${(totalFleetKm / 1000).toFixed(0)}k km`, sub: "Cumulative total", icon: Gauge },
          { label: "KM Entries", value: distances.length.toString(), sub: "Total records", icon: Calendar },
        ].map(c => (
          <Card key={c.label} className="bg-card border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{c.value}</div>
                <div className="text-xs font-medium text-foreground">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("fleet")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "fleet" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            Fleet Overview
          </button>
          <button
            onClick={() => setViewMode("history")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "history" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            KM History
          </button>
        </div>
        <Select value={filterTs} onValueChange={setFilterTs}>
          <SelectTrigger className="w-36 bg-card border-border">
            <SelectValue placeholder="All TrainSets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All TrainSets</SelectItem>
            {Array.from({length:17},(_,i)=>`TS${String(i+1).padStart(2,"0")}`).map(ts=>(
              <SelectItem key={ts} value={ts}>{ts}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {viewMode === "history" && (
          <Input
            type="month"
            value={searchDate}
            onChange={e => setSearchDate(e.target.value)}
            className="w-44 bg-card border-border"
            placeholder="Filter by month"
          />
        )}
        {(filterTs || searchDate) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterTs(""); setSearchDate(""); }}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Fleet Overview Table */}
      {viewMode === "fleet" && (
        <Card className="bg-card border-border/50 shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Train Set</th>
                  <th className="px-4 py-3 font-medium">Train No.</th>
                  <th className="px-4 py-3 font-medium">Formation</th>
                  <th className="px-4 py-3 font-medium">In Service Since</th>
                  <th className="px-4 py-3 font-medium text-right">Last Date</th>
                  <th className="px-4 py-3 font-medium text-right">Daily KM</th>
                  <th className="px-4 py-3 font-medium text-right">Cumulative KM</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">Loading fleet data...</td></tr>
                ) : filteredTrains.map((t) => {
                  const ld = latestDist(t.id);
                  const ts = TS_LABEL[t.trainNumber] || "—";
                  return (
                    <tr key={t.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{ts}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{t.trainNumber}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{t.formation}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.inServiceDate ? format(new Date(t.inServiceDate + "T00:00:00"), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                        {ld?.recordDate || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {ld?.dailyDistanceKm != null ? `${Number(ld.dailyDistanceKm).toLocaleString()} km` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {ld?.cumulativeDistanceKm != null ? `${Number(ld.cumulativeDistanceKm).toLocaleString()} km` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={t.status === "active" ? "outline" : "destructive"}
                          className={t.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/30" : ""}>
                          {t.status?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => { setSelectedTrainId(t.id); setShowDialog(true); }}>
                          <Gauge className="w-3 h-3 mr-1" /> Log KM
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* KM History Table */}
      {viewMode === "history" && (
        <Card className="bg-card border-border/50 shadow-lg shadow-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily KM Entry History ({filteredHistory.length} records)</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Train Set</th>
                  <th className="px-4 py-3 font-medium">Train No.</th>
                  <th className="px-4 py-3 font-medium text-right">Daily KM</th>
                  <th className="px-4 py-3 font-medium text-right">Cumulative KM</th>
                  <th className="px-4 py-3 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No KM records found. Click "Log Daily KM" to add entries.</td></tr>
                ) : filteredHistory.map(d => {
                  const train = trains.find(t => t.id === d.trainId);
                  return (
                    <tr key={d.id} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs">{d.recordDate}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-primary">{TS_LABEL[train?.trainNumber || ""] || "—"}</td>
                      <td className="px-4 py-2.5 font-mono">{train?.trainNumber || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{Number(d.dailyDistanceKm || 0).toLocaleString()} km</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">{Number(d.cumulativeDistanceKm || 0).toLocaleString()} km</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{d.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Daily KM Entry Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" /> Log Daily KM Reading
              </h2>
              <Button variant="ghost" size="icon" onClick={() => { setShowDialog(false); setSelectedTrainId(""); }}>
                ✕
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Train Set / Train No *</label>
                <Select value={selectedTrainId} onValueChange={v => setSelectedTrainId(v === "__none__" ? "" : v)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select Train Set" />
                  </SelectTrigger>
                  <SelectContent>
                    {trains.sort((a,b) => a.trainNumber.localeCompare(b.trainNumber)).map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {TS_LABEL[t.trainNumber]} — {t.trainNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTrain && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last cumulative: {(latestDist(selectedTrainId)?.cumulativeDistanceKm || 0).toLocaleString()} km
                    on {latestDist(selectedTrainId)?.recordDate || "—"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Date of Reading *</label>
                <Input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} className="bg-background border-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Daily KM *</label>
                  <Input
                    type="number" min="0" step="0.1"
                    value={dailyKm} onChange={e => setDailyKm(e.target.value)}
                    placeholder="e.g. 245.5"
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Odometer (km)</label>
                  <Input
                    type="number" min="0" step="0.1"
                    value={odometerReading} onChange={e => setOdometerReading(e.target.value)}
                    placeholder="Optional"
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">If Odometer is entered, it is used as the cumulative KM; otherwise Daily KM is added to the previous cumulative value.</p>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Remarks</label>
                <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional remarks" className="bg-background border-border" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
                disabled={createDist.isPending}
              >
                {createDist.isPending ? "Saving..." : "Save KM Entry"}
              </Button>
              <Button variant="outline" onClick={() => { setShowDialog(false); setSelectedTrainId(""); }} className="border-border">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
