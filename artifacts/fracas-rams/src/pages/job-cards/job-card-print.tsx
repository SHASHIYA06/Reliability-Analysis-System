import { useRef } from "react";
import { X, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobCardPrintProps {
  data: any;
  onClose: () => void;
}

export function JobCardPrint({ data: jc, onClose }: JobCardPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>Job Card - ${jc.jobCardNumber || ""}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; background: #fff; }
        .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 10mm 12mm; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
        .header .logo-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .header .logo { width: 80px; height: 40px; object-fit: contain; }
        .header .doc-ref { font-size: 8pt; text-align: right; }
        .header h2 { font-size: 16pt; font-weight: bold; letter-spacing: 2px; flex: 1; text-align: center; }
        .header .issue { font-size: 8pt; color: #333; }
        .meta-row { display: flex; gap: 12px; margin-bottom: 4px; font-size: 9pt; }
        .meta-row span { display: inline-flex; gap: 4px; }
        .meta-row strong { min-width: 90px; }
        .part { border: 1px solid #000; margin-bottom: 6px; }
        .part-header { background: #ddd; font-weight: bold; font-size: 9pt; padding: 3px 6px; border-bottom: 1px solid #000; }
        .part-body { padding: 5px 8px; }
        .field-row { display: flex; gap: 8px; margin-bottom: 4px; font-size: 9pt; flex-wrap: wrap; }
        .field { display: flex; gap: 4px; align-items: flex-start; min-width: 200px; flex: 1; }
        .field label { font-weight: bold; white-space: nowrap; min-width: 130px; }
        .field span { border-bottom: 1px solid #555; flex: 1; min-height: 14px; word-break: break-word; }
        .check-row { display: flex; gap: 16px; margin-bottom: 4px; font-size: 9pt; align-items: center; }
        .check { display: flex; gap: 4px; align-items: center; }
        .chk { width: 12px; height: 12px; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 8pt; }
        .desc-box { border: 1px solid #555; min-height: 40px; padding: 3px; font-size: 9pt; word-break: break-word; white-space: pre-wrap; }
        .sign-row { display: flex; justify-content: space-between; margin-top: 6px; font-size: 9pt; }
        .sign-field { flex: 1; text-align: center; border-top: 1px solid #000; padding-top: 2px; margin: 0 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        th, td { border: 1px solid #000; padding: 3px 5px; }
        th { background: #eee; font-weight: bold; text-align: left; }
        .page-break { page-break-after: always; }
        .fracas-badge { float: right; background: #000; color: #fff; padding: 2px 8px; font-size: 8pt; font-weight: bold; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { padding: 8mm; }
        }
      </style></head><body>
      <div class="page">${content}</div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  const chk = (val: boolean | undefined | null, label: string) => (
    <span className="check" style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
      <span className="chk">{val ? "✓" : ""}</span>
      <span>{label}</span>
    </span>
  );

  const f = (val: any) => val ? String(val) : "—";
  const d = (val: any) => {
    if (!val) return "—";
    try { return new Date(val + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }); }
    catch { return val; }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-card border-b border-border shadow-md">
        <div>
          <h2 className="font-bold text-foreground">Job Card — {jc.jobCardNumber || "No JC#"}</h2>
          <p className="text-xs text-muted-foreground">FRACAS# {jc.fracasNumber} · {jc.trainSet || jc.trainNumber} · {jc.carNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handlePrint} className="bg-primary hover:bg-primary/90">
            <Printer className="w-4 h-4 mr-1.5" /> Print / Save PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-1.5" /> Close
          </Button>
        </div>
      </div>

      {/* Print Content */}
      <div className="p-6 max-w-4xl mx-auto">
        <div ref={printRef} className="bg-white text-black p-8 shadow-xl rounded" style={{ fontFamily: "Arial, sans-serif", fontSize: "10pt" }}>

          {/* Header */}
          <div style={{ borderBottom: "2px solid #000", paddingBottom: "8px", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {/* BEML Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "44px", height: "44px", background: "#E31E24", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "20pt", fontFamily: "Arial" }}>B</div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "14pt", color: "#E31E24" }}>BEML</div>
                  <div style={{ fontSize: "7pt", color: "#333" }}>BHARAT EARTH MOVERS LTD.</div>
                </div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "16pt", letterSpacing: "3px" }}>JOB CARD</div>
                <div style={{ fontSize: "8pt" }}>KMRCL RS-3R Rolling Stock · Corrective/Preventive Maintenance</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "8pt", fontFamily: "monospace" }}>
                <div><strong>FM/RS/PPIO/01/01</strong></div>
                <div>Issue/Rev: 01/00</div>
                <div>Date: 20/03/2014</div>
              </div>
            </div>

            {/* Meta row */}
            <div style={{ display: "flex", gap: "16px", marginTop: "6px", fontSize: "9pt" }}>
              <div><strong>FRACAS No:</strong> <span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#E31E24" }}>{jc.fracasNumber || "—"}</span></div>
              <div><strong>JC Serial No:</strong> {jc.jobCardNumber || "—"}</div>
              <div><strong>Date:</strong> {d(jc.issuedDate || jc.failureDate)}</div>
              <div><strong>Time:</strong> {f(jc.issuedTime)}</div>
              <div><strong>Order Type:</strong> {f(jc.orderType)}</div>
            </div>
          </div>

          {/* Part A */}
          <div style={{ border: "1px solid #000", marginBottom: "6px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "3px 6px", borderBottom: "1px solid #000", fontSize: "9pt" }}>Part A: Job Card Issued To</div>
            <div style={{ padding: "6px 8px" }}>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px", fontSize: "9pt" }}>
                <div style={{ flex: 1 }}><strong>Issued To:</strong> {f(jc.jobCardIssuedTo)}</div>
                <div style={{ flex: 1 }}><strong>Organization:</strong> {f(jc.organization)}</div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px", fontSize: "9pt" }}>
                <div><strong>Train Set:</strong> {f(jc.trainSet)} &nbsp;&nbsp;<strong>Car No:</strong> {f(jc.carNumber)} &nbsp;&nbsp;<strong>Train No:</strong> {f(jc.trainNumber)}</div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px", fontSize: "9pt" }}>
                <div><strong>Depot:</strong> {f(jc.depot)}</div>
                <div><strong>Odometer (km):</strong> {jc.trainDistanceAtFailure != null ? Number(jc.trainDistanceAtFailure).toLocaleString() : "—"}</div>
                <div><strong>Location:</strong> {f(jc.reportingLocation)}</div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px", fontSize: "9pt" }}>
                <div>
                  <strong>Reliability Issues: &nbsp;</strong>
                  <span style={{ marginRight: "8px" }}>☐ De-boarding</span>
                  <span style={{ marginRight: "8px" }}>☐ Withdrawal</span>
                  <span style={{ marginRight: "8px" }}>☐ Trip Cancelled</span>
                  <span style={{ marginRight: "8px" }}>☐ Trips Delayed</span>
                  <span>☐ Not Applicable</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px", fontSize: "9pt" }}>
                <div><strong>Event Date:</strong> {d(jc.failureDate)}</div>
                <div><strong>Time:</strong> {f(jc.failureTime)}</div>
              </div>
              <div style={{ fontSize: "9pt", marginBottom: "4px" }}>
                <strong>Nature of Work / Failure Description:</strong>
                <div style={{ border: "1px solid #aaa", minHeight: "36px", padding: "3px", marginTop: "2px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{f(jc.failureDescription)}</div>
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "9pt" }}>
                <div><strong>System:</strong> {f(jc.systemName)}</div>
                <div><strong>Sub-System:</strong> {f(jc.subsystemName || jc.subsystemCode)}</div>
                <div><strong>Equipment:</strong> {f(jc.equipment)}</div>
                <div><strong>Component:</strong> {f(jc.component)}</div>
              </div>
            </div>
          </div>

          {/* Part B */}
          <div style={{ border: "1px solid #000", marginBottom: "6px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "3px 6px", borderBottom: "1px solid #000", fontSize: "9pt" }}>Part B: Permission to Access — Completed by PPIO</div>
            <div style={{ padding: "6px 8px", fontSize: "9pt" }}>
              <div style={{ marginBottom: "4px" }}><strong>Main Line Action (if applicable):</strong> {f(jc.mainLineAction)}</div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                <div><strong>Depot Arrival Date:</strong> {d(jc.depotArrivalDate)}</div>
                <div><strong>Time:</strong> {f(jc.depotArrivalTime)}</div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                <div><strong>Inspection In Charge Informed:</strong> {jc.inspectionInCharge ? "Yes — " + jc.inspectionInCharge : "No"}</div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                <div><strong>SIC Required:</strong> {jc.sicRequired ? "Yes" : "No"}</div>
                {jc.sicRequired && <div><strong>SIC Verifier:</strong> {f(jc.sicVerifier)}</div>}
              </div>
              <div><strong>Power Block Required:</strong> {jc.powerBlockRequired ? "Yes" : "No"}</div>
            </div>
          </div>

          {/* Part C */}
          <div style={{ border: "1px solid #000", marginBottom: "6px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "3px 6px", borderBottom: "1px solid #000", fontSize: "9pt" }}>Part C: Allotment of Work</div>
            <div style={{ padding: "6px 8px", fontSize: "9pt" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#eee" }}>
                  <th style={{ border: "1px solid #000", padding: "2px 4px" }}>Name</th>
                  <th style={{ border: "1px solid #000", padding: "2px 4px" }}>Work</th>
                  <th style={{ border: "1px solid #000", padding: "2px 4px" }}>Signature</th>
                </tr></thead>
                <tbody><tr>
                  <td style={{ border: "1px solid #000", padding: "6px 4px" }}>{f(jc.jobCardIssuedTo)}</td>
                  <td style={{ border: "1px solid #000", padding: "6px 4px" }}>{f(jc.systemName)} — {f(jc.subsystemName || jc.subsystemCode)}</td>
                  <td style={{ border: "1px solid #000", padding: "6px 4px" }}> </td>
                </tr></tbody>
              </table>
            </div>
          </div>

          {/* Part D */}
          <div style={{ border: "1px solid #000", marginBottom: "6px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "3px 6px", borderBottom: "1px solid #000", fontSize: "9pt" }}>Part D: Completion of Work</div>
            <div style={{ padding: "6px 8px", fontSize: "9pt" }}>
              <div style={{ marginBottom: "4px" }}>
                <strong>Description of Actions Taken:</strong>
                <div style={{ border: "1px solid #aaa", minHeight: "40px", padding: "3px", marginTop: "2px", whiteSpace: "pre-wrap" }}>{f(jc.actionTaken)}</div>
              </div>
              <div style={{ marginBottom: "4px" }}>
                <strong>Root Cause:</strong>
                <div style={{ border: "1px solid #aaa", minHeight: "24px", padding: "3px", marginTop: "2px" }}>{f(jc.rootCause)}</div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                <div><strong>Work Pending?</strong> {jc.workPending ? "Yes" : "No"}</div>
                {jc.workPending && <>
                  <div><strong>Can Energize:</strong> {jc.canBeEnergized ? "Yes" : "No"}</div>
                  <div><strong>Can Move:</strong> {jc.canBeMoved ? "Yes" : "No"}</div>
                </>}
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                <div><strong>Delay:</strong> {jc.delay ? "Yes" : "No"}</div>
                {jc.delay && <>
                  <div><strong>Service Distinction:</strong> {f(jc.serviceDistinction)}</div>
                  <div><strong>Delay Duration:</strong> {f(jc.delayDuration)}</div>
                </>}
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                <div><strong>Repair Duration:</strong> {jc.repairDurationMinutes ? jc.repairDurationMinutes + " min" : jc.repairDurationHours ? jc.repairDurationHours + " hr" : "—"}</div>
                <div><strong>No. of Men:</strong> {f(jc.noOfMen)}</div>
                <div><strong>Car Lifting:</strong> {jc.carLiftingRequired ? "Yes" : "No"}</div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                <div><strong>Expected Complete:</strong> {d(jc.expectedCompleteDate)}</div>
                <div><strong>Time:</strong> {f(jc.expectedCompleteTime)}</div>
                <div><strong>Closed:</strong> {d(jc.closeDate)}</div>
                <div><strong>Time:</strong> {f(jc.closeTime)}</div>
              </div>
            </div>
          </div>

          {/* Part E */}
          <div style={{ border: "1px solid #000", marginBottom: "6px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "3px 6px", borderBottom: "1px solid #000", fontSize: "9pt" }}>Part E: Details of Equipment Replaced</div>
            <div style={{ padding: "4px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
                <thead><tr style={{ background: "#eee" }}>
                  <th style={{ border: "1px solid #000", padding: "2px 4px" }}>Item / Component</th>
                  <th style={{ border: "1px solid #000", padding: "2px 4px" }}>Part No.</th>
                  <th style={{ border: "1px solid #000", padding: "2px 4px" }}>In Sr. No. (Healthy)</th>
                  <th style={{ border: "1px solid #000", padding: "2px 4px" }}>In Date</th>
                  <th style={{ border: "1px solid #000", padding: "2px 4px" }}>Out Sr. No. (Faulty)</th>
                  <th style={{ border: "1px solid #000", padding: "2px 4px" }}>Out Date</th>
                </tr></thead>
                <tbody><tr>
                  <td style={{ border: "1px solid #000", padding: "5px 4px" }}>{f(jc.equipment || jc.component)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px" }}>{f(jc.partNumber)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px" }}>{f(jc.partInSerialNumber)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px" }}>{d(jc.partInDate)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px" }}>{f(jc.partOutSerialNumber)}</td>
                  <td style={{ border: "1px solid #000", padding: "5px 4px" }}>{d(jc.partOutDate)}</td>
                </tr></tbody>
              </table>
              {jc.ncrNumber && (
                <div style={{ marginTop: "4px", fontSize: "9pt" }}><strong>Linked NCR No:</strong> {jc.ncrNumber}</div>
              )}
            </div>
          </div>

          {/* Part F */}
          <div style={{ border: "1px solid #000", marginBottom: "6px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "3px 6px", borderBottom: "1px solid #000", fontSize: "9pt" }}>Part F: SIC Check — Completed by SIC Verifier</div>
            <div style={{ padding: "6px 8px", fontSize: "9pt" }}>
              <p>I hereby declare that SIC has been performed on concerned equipment.</p>
              <div style={{ marginTop: "4px" }}><strong>Follow Up Details:</strong>
                <div style={{ border: "1px solid #aaa", minHeight: "24px", padding: "3px", marginTop: "2px" }}>{f(jc.correctiveAction)}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <div>Name: ___________________________</div>
                <div>Signature: _______________________</div>
                <div>Date: ____________</div>
                <div>Time: ____________</div>
              </div>
            </div>
          </div>

          {/* Part H — Acknowledgment */}
          <div style={{ border: "1px solid #000" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "3px 6px", borderBottom: "1px solid #000", fontSize: "9pt" }}>Part H: Acknowledgment of Work Completion — PPIO</div>
            <div style={{ padding: "6px 8px", fontSize: "9pt" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                <div><strong>Job Card Status:</strong></div>
                <div>☐ Completed &nbsp; ☐ Pending &nbsp; ☐ Under Monitoring</div>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <div><strong>Action Endorsed By:</strong> {f(jc.actionEndorsementName)}</div>
                <div><strong>Date:</strong> {d(jc.actionEndorsementDate)}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <div>PPIO Shift Engineer: _________________</div>
                <div>Signature: __________________</div>
                <div>Date: ____________</div>
                <div>Time: ____________</div>
              </div>
              <div style={{ marginTop: "6px", fontSize: "8pt", textAlign: "center", color: "#555" }}>
                BEML Rolling Stock Division — RS-3R · KMRC Project · {jc.fracasNumber}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
