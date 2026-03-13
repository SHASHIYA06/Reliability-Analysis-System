import { useState } from "react";
import { format } from "date-fns";
import { Train, Plus, Gauge } from "lucide-react";
import { useListTrains, useListFleetDistances } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Fleet() {
  const { data: trains = [], isLoading } = useListTrains();
  const { data: distances = [] } = useListFleetDistances();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Train className="w-8 h-8 text-primary" /> Fleet Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage rolling stock inventory and cumulative running distances.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border">
            <Gauge className="w-4 h-4 mr-2" /> Log Daily Distance
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Add Train Set
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border/50 shadow-lg shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Train Number</th>
                <th className="px-6 py-4 font-medium">Formation / Cars</th>
                <th className="px-6 py-4 font-medium">In Service Since</th>
                <th className="px-6 py-4 font-medium text-right">Cumulative Distance</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">Loading fleet...</td></tr>
              ) : trains.map((t) => {
                // Find latest distance record for this train
                const trainDistances = distances.filter(d => d.trainId === t.id).sort((a,b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
                const latestDist = trainDistances[0]?.cumulativeDistanceKm || 0;

                return (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono font-bold text-lg text-primary">{t.trainNumber}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{t.formation}</td>
                    <td className="px-6 py-4">{format(new Date(t.inServiceDate), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium">{latestDist.toLocaleString()} km</td>
                    <td className="px-6 py-4">
                      <Badge variant={t.status === 'active' ? 'outline' : 'destructive'} className={t.status === 'active' ? 'bg-success/10 text-success border-success/30' : ''}>
                        {t.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
