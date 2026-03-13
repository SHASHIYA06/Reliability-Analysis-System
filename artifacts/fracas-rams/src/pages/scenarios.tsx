import { BookOpen, AlertTriangle } from "lucide-react";
import { WITHDRAWAL_SCENARIOS } from "@/lib/taxonomy";
import { Card, CardContent } from "@/components/ui/card";

export default function Scenarios() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-secondary" /> KMRC Withdrawal Scenarios
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Reference list of mandatory fleet withdrawal conditions as specified in KMRC Rolling Stock RAMS manual. 
          If any of these conditions occur during passenger service, the train must be immediately withdrawn to depot 
          and recorded as a Relevant Service Failure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WITHDRAWAL_SCENARIOS.map((s) => (
          <Card key={s.code} className="bg-card border-border/50 hover:border-destructive/30 transition-colors group">
            <CardContent className="p-4 flex gap-4 items-start">
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center font-mono font-bold text-muted-foreground group-hover:bg-destructive/10 group-hover:text-destructive transition-colors">
                  {s.code}
                </div>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium leading-tight text-foreground">{s.description}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3 h-3 text-destructive/70" /> Mandates immediate withdrawal
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
