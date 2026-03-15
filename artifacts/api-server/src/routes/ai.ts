import { Router, type IRouter } from "express";
import { db, failuresTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

function getAiClient() {
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("Gemini env vars not configured. Run setupReplitAIIntegrations.");
  return new GoogleGenAI({
    apiKey,
    httpOptions: { apiVersion: "", baseUrl },
  });
}

async function geminiGenerate(prompt: string): Promise<string> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192, temperature: 0.3 },
  });
  return response.text ?? "No response generated.";
}

router.post("/ai/analyze-failures", async (req, res) => {
  try {
    const { question } = req.body as { question?: string };
    if (!question?.trim()) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    const recentFailures = await db.select({
      jcNo: failuresTable.jobCardNumber,
      failureDate: failuresTable.failureDate,
      trainNumber: failuresTable.trainNumber,
      carNumber: failuresTable.carNumber,
      system: failuresTable.systemName,
      subSystem: failuresTable.subsystemName,
      failureDescription: failuresTable.failureDescription,
      rootCause: failuresTable.rootCause,
      failureCategory: failuresTable.failureCategory,
      durationHours: failuresTable.repairDurationHours,
      withdrawalRequired: failuresTable.withdrawalRequired,
      delay: failuresTable.delay,
    })
      .from(failuresTable)
      .orderBy(desc(failuresTable.failureDate))
      .limit(50);

    const totalResult = await db.execute(sql`SELECT COUNT(*)::int as cnt FROM failures`);
    const total = (totalResult.rows[0] as any)?.cnt ?? 0;

    const systemFreq: Record<string, number> = {};
    for (const f of recentFailures) {
      const sys = f.system || "Unknown";
      systemFreq[sys] = (systemFreq[sys] ?? 0) + 1;
    }
    const topSystems = Object.entries(systemFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s, c]) => `${s}: ${c}`)
      .join(", ");

    const prompt = `You are a RAMS (Reliability, Availability, Maintainability & Safety) expert for BEML KMRC RS-3R metro rolling stock.

FRACAS Database Context:
- Total job cards in database: ${total}
- Showing last ${recentFailures.length} job cards for analysis
- Top systems by failure count: ${topSystems || "N/A"}
- RAMS Targets: MDBF ≥60,000km (6mo) / ≥100,000km (12mo), MTTR ≤240min overall, Availability ≥95%
- Fleet: 17 trainsets (TS01–TS17), 6 cars each (DMC1, MC1, TC1, TC2, MC2, DMC2)
- Service failure = Withdrawal = YES OR Delay ≥3 min

Sample recent failure records:
${recentFailures.slice(0, 15).map(f =>
  `JC: ${f.jcNo || "N/A"} | ${f.failureDate || "N/A"} | Train: ${f.trainNumber || "N/A"} | System: ${f.system || "N/A"} | Cat: ${f.failureCategory || "N/A"} | ${(f.failureDescription || "").substring(0, 80)}`
).join("\n")}

User Question: ${question}

Provide a concise, technical analysis based on EN 50126:1999 RAMS standards and KMRC RS(3R) project requirements. Format with bullet points. Keep response under 400 words.`;

    const answer = await geminiGenerate(prompt);
    res.json({ answer, dataPoints: recentFailures.length, totalJobCards: total });
  } catch (err: any) {
    console.error("AI analyze-failures error:", err);
    res.status(500).json({ error: err.message || "AI analysis failed" });
  }
});

router.post("/ai/root-cause", async (req, res) => {
  try {
    const { system, description, failureCategory, durationHours } = req.body as {
      system?: string; description?: string; failureCategory?: string; durationHours?: number;
    };
    if (!description) { res.status(400).json({ error: "description required" }); return; }

    const prompt = `You are a RAMS expert for BEML metro rolling stock (KMRC RS-3R project, EN 50126:1999).

Failure to analyze:
- System: ${system || "Unknown"}
- Failure Category: ${failureCategory || "Unknown"}
- Duration of Repair: ${durationHours ? `${durationHours} hours` : "Unknown"}
- Description: ${description}

Please provide:
1. **Root Cause Analysis**: Most likely root causes (max 3 bullet points)
2. **Corrective Action**: Recommended immediate actions
3. **Preventive Measures**: Long-term recommendations
4. **RAMS Impact**: Service failure criteria assessment (Withdrawal/Delay ≥3 min)
5. **Failure Category Check**: Verify or suggest correct category

Keep concise, under 300 words total.`;

    const answer = await geminiGenerate(prompt);
    res.json({ answer });
  } catch (err: any) {
    console.error("AI root-cause error:", err);
    res.status(500).json({ error: err.message || "AI analysis failed" });
  }
});

export { router as aiRouter };
