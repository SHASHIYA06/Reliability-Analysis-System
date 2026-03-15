import { useRef } from "react";
import { ArrowLeft, Printer } from "lucide-react";
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
    win.document.write(`<!DOCTYPE html><html><head>
<title>Job Card — ${jc.jobCardNumber || jc.fracasNumber || ""}</title>
<style>
  @page { size: A4 portrait; margin: 12mm 14mm 12mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; width: 100%; }
  .page { width: 100%; }
  .hdr { border-bottom: 2.5px solid #000; padding-bottom: 6px; margin-bottom: 6px; }
  .hdr-row { display: flex; align-items: center; justify-content: space-between; }
  .logo-block { display: flex; align-items: center; gap: 8px; }
  .logo-sq { width: 42px; height: 42px; background: #E31E24; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 22pt; }
  .logo-text { }
  .logo-text .beml { font-weight: 900; font-size: 16pt; color: #E31E24; letter-spacing: 2px; }
  .logo-text .sub  { font-size: 7pt; color: #555; }
  .title-center { flex: 1; text-align: center; }
  .title-center .jc-title { font-size: 17pt; font-weight: 900; letter-spacing: 3px; }
  .title-center .jc-sub   { font-size: 7.5pt; color: #444; margin-top: 1px; }
  .doc-ref { text-align: right; font-size: 7.5pt; font-family: monospace; line-height: 1.5; }
  .meta-row { display: flex; gap: 10px; margin-top: 5px; font-size: 8.5pt; flex-wrap: wrap; }
  .meta-row > div { display: flex; gap: 4px; }
  .fracas-no { background: #E31E24; color: #fff; padding: 1px 7px; font-weight: bold; font-size: 8.5pt; border-radius: 3px; margin-left: 4px; }
  .part { border: 1px solid #000; margin-bottom: 5px; page-break-inside: avoid; }
  .part-hdr { background: #ddd; font-weight: bold; padding: 2.5px 6px; border-bottom: 1px solid #000; font-size: 8.5pt; }
  .part-body { padding: 5px 7px; }
  .fr { display: flex; gap: 10px; margin-bottom: 3px; font-size: 8.5pt; flex-wrap: wrap; }
  .fr > div { display: flex; gap: 3px; align-items: baseline; }
  .fr label { font-weight: bold; white-space: nowrap; }
  .fr span  { border-bottom: 1px solid #777; min-width: 80px; min-height: 12px; }
  .box { border: 1px solid #aaa; min-height: 32px; padding: 3px 4px; margin-top: 2px; font-size: 8.5pt; white-space: pre-wrap; word-break: break-word; }
  .chk-row { display: flex; gap: 14px; margin-bottom: 3px; font-size: 8.5pt; align-items: center; flex-wrap: wrap; }
  .chk-item { display: flex; gap: 3px; align-items: center; }
  .chk-box { width: 11px; height: 11px; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 7pt; flex-shrink: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th, td { border: 1px solid #000; padding: 3px 5px; }
  th { background: #eee; font-weight: bold; text-align: center; }
  .sig-row { display: flex; justify-content: space-between; margin-top: 7px; }
  .sig-field { flex: 1; text-align: center; margin: 0 5px; padding-top: 2px; border-top: 1px solid #000; font-size: 7.5pt; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
<div class="page">${content}</div>
</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  };

  const f  = (v: any) => v != null && v !== "" ? String(v) : "—";
  const d  = (v: any) => {
    if (!v) return "—";
    try { return new Date(v + (String(v).length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" }); }
    catch { return v; }
  };
  const yn = (v: any) => v === true || v === "yes" ? "YES" : v === false || v === "no" ? "NO" : f(v);
  const chk = (checked: boolean, label: string) => (
    `<span class="chk-item"><span class="chk-box">${checked ? "✓" : ""}</span>${label}</span>`
  );

  return (
    <div className="fixed inset-0 z-50 bg-background/98 overflow-auto">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-6 py-3 bg-card border-b border-border shadow-md">
        <Button size="sm" variant="outline" onClick={onClose} className="border-border font-medium">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>
        <div className="flex-1">
          <span className="font-bold text-foreground">{jc.jobCardNumber || "No JC#"}</span>
          <span className="text-muted-foreground text-sm ml-3">FRACAS# {jc.fracasNumber} · {jc.trainNumber} · {jc.carNumber}</span>
        </div>
        <Button size="sm" onClick={handlePrint} className="bg-primary hover:bg-primary/90">
          <Printer className="w-4 h-4 mr-1.5" /> Print / Save PDF (A4)
        </Button>
      </div>

      {/* Preview area — mirrors A4 */}
      <div className="py-8 px-4 flex justify-center bg-muted/20 min-h-full">
        <div
          ref={printRef}
          className="bg-white text-black shadow-2xl"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "12mm 14mm",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "9pt",
            boxSizing: "border-box",
          }}
        >

          {/* ─── HEADER ─── */}
          <div className="hdr" style={{ borderBottom: "2.5px solid #000", paddingBottom: "6px", marginBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

              {/* BEML Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "42px", height: "42px", background: "#E31E24", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: "22pt" }}>B</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: "16pt", color: "#E31E24", letterSpacing: "2px" }}>BEML</div>
                  <div style={{ fontSize: "7pt", color: "#555" }}>BHARAT EARTH MOVERS LTD.</div>
                  <div style={{ fontSize: "6.5pt", color: "#777" }}>Rolling Stock Division</div>
                </div>
              </div>

              {/* Title */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontWeight: 900, fontSize: "17pt", letterSpacing: "3px" }}>JOB CARD</div>
                <div style={{ fontSize: "7.5pt", color: "#444" }}>KMRCL RS-3R Rolling Stock · Corrective / Preventive Maintenance</div>
                <div style={{ fontSize: "7pt", color: "#555" }}>Document Ref: FM/RS/PPIO/01/01</div>
              </div>

              {/* Doc Ref */}
              <div style={{ textAlign: "right", fontSize: "7.5pt", fontFamily: "monospace", lineHeight: 1.6 }}>
                <div><strong>FM/RS/PPIO/01/01</strong></div>
                <div>Issue/Rev: 01/00</div>
                <div>Date: 20/03/2014</div>
              </div>
            </div>

            {/* Meta strip */}
            <div style={{ display: "flex", gap: "12px", marginTop: "5px", fontSize: "8.5pt", flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <strong>FRACAS No:</strong>
                <span style={{ background: "#E31E24", color: "#fff", padding: "1px 7px", fontWeight: "bold", borderRadius: "3px", marginLeft: "4px" }}>{f(jc.fracasNumber)}</span>
              </div>
              <div><strong>JC No:</strong> {f(jc.jobCardNumber)}</div>
              <div><strong>Order Type:</strong> {f(jc.orderType)}</div>
              <div><strong>Issued Date:</strong> {d(jc.issuedDate)}</div>
              <div><strong>Time:</strong> {f(jc.issuedTime)}</div>
              <div style={{ marginLeft: "auto" }}><strong>Status:</strong> {f(jc.status?.toUpperCase())}</div>
            </div>
          </div>

          {/* ─── PART A: Job Card Issued To ─── */}
          <div className="part" style={{ border: "1px solid #000", marginBottom: "5px" }}>
            <div className="part-hdr" style={{ background: "#ddd", fontWeight: "bold", padding: "2.5px 6px", borderBottom: "1px solid #000", fontSize: "8.5pt" }}>PART A — Job Card Issued To</div>
            <div style={{ padding: "5px 7px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px", fontSize: "8.5pt" }}>
                <div><strong>Issued To:</strong> {f(jc.jobCardIssuedTo)}</div>
                <div><strong>Inspector / PPIO:</strong> {f(jc.inspector)}</div>
                <div><strong>Reported By:</strong> {f(jc.reportedBy)}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px", fontSize: "8.5pt" }}>
                <div><strong>Train No.:</strong> <span style={{ fontWeight: "bold", color: "#E31E24" }}>{f(jc.trainNumber)}</span></div>
                <div><strong>Car No.:</strong> {f(jc.carNumber)}</div>
                <div><strong>Depot:</strong> {f(jc.depot)}</div>
                <div><strong>Reporting Location:</strong> {f(jc.reportingLocation)}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px", fontSize: "8.5pt" }}>
                <div><strong>Failure Occurred:</strong> {d(jc.failureDate)} {f(jc.failureTime)}</div>
                <div><strong>Depot Arriving:</strong> {d(jc.depotArrivalDate)} {f(jc.depotArrivalTime)}</div>
                <div><strong>Expected Complete:</strong> {d(jc.expectedCompleteDate)} {f(jc.expectedCompleteTime)}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px", fontSize: "8.5pt" }}>
                <div><strong>Odometer Reading (km):</strong> {jc.trainDistanceAtFailure != null ? Number(jc.trainDistanceAtFailure).toLocaleString() : "—"}</div>
                <div><strong>NCR No.:</strong> {f(jc.ncrNumber)}</div>
                <div><strong>Serial No.:</strong> {f(jc.serialNumber)}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px", fontSize: "8.5pt", flexWrap: "wrap" }}>
                <div><strong>Reliability Issues:</strong></div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {[
                    { label: "De-boarding",   val: false },
                    { label: "Withdrawal",    val: jc.withdrawalRequired },
                    { label: "Trip Cancelled",val: false },
                    { label: "Trips Delayed", val: jc.delay },
                    { label: "Not Applicable",val: !jc.withdrawalRequired && !jc.delay },
                  ].map(item => (
                    <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "8.5pt" }}>
                      <span style={{ width: "11px", height: "11px", border: "1px solid #000", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "7pt" }}>
                        {item.val ? "✓" : ""}
                      </span>
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── PART B: System / Failure Details ─── */}
          <div style={{ border: "1px solid #000", marginBottom: "5px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "2.5px 6px", borderBottom: "1px solid #000", fontSize: "8.5pt" }}>PART B — System & Failure Details</div>
            <div style={{ padding: "5px 7px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px", fontSize: "8.5pt", flexWrap: "wrap" }}>
                <div><strong>System:</strong> {f(jc.systemName || jc.systemCode)}</div>
                <div><strong>Sub-System:</strong> {f(jc.subsystemName || jc.subsystemCode)}</div>
                <div><strong>Equipment:</strong> {f(jc.equipment)}</div>
                <div><strong>Component:</strong> {f(jc.component)}</div>
                <div><strong>Part(s):</strong> {f(jc.parts || jc.equipmentPartNumber)}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px", fontSize: "8.5pt" }}>
                <div><strong>Failure Name:</strong> {f(jc.failureName)}</div>
                <div><strong>Failure Location:</strong> {f(jc.failureLocation)}</div>
                <div><strong>Failure Category:</strong> {f(jc.failureCategory)}</div>
              </div>
              <div style={{ marginBottom: "3px", fontSize: "8.5pt" }}>
                <strong>Failure Description:</strong>
                <div style={{ border: "1px solid #aaa", minHeight: "30px", padding: "3px 4px", marginTop: "2px", whiteSpace: "pre-wrap" }}>{f(jc.failureDescription)}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px", fontSize: "8.5pt", flexWrap: "wrap" }}>
                <div><strong>CM/PM/OPM:</strong> {f(jc.orderType)}</div>
                {jc.orderType === "CM" && <div><strong>Operating Conditions:</strong> {f(jc.jobOperatingConditions)}</div>}
                {jc.orderType === "CM" && <div><strong>Effects on Service:</strong> {yn(jc.effectsOnService)}</div>}
                {jc.orderType === "CM" && <div><strong>Service Distinction:</strong> {f(jc.serviceDistinction)}</div>}
                {jc.orderType === "PM" && <div><strong>Service Check:</strong> {f(jc.serviceChecks)}</div>}
              </div>
              {jc.delay && <div style={{ fontSize: "8.5pt", marginBottom: "3px" }}><strong>Delay Duration:</strong> {f(jc.delayDuration)} &nbsp; <strong>Delay Time (DD/HH/MM):</strong> {f(jc.delayTime)}</div>}
            </div>
          </div>

          {/* ─── PART C: Work Status ─── */}
          <div style={{ border: "1px solid #000", marginBottom: "5px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "2.5px 6px", borderBottom: "1px solid #000", fontSize: "8.5pt" }}>PART C — Work & Status Details</div>
            <div style={{ padding: "5px 7px" }}>
              <div style={{ display: "flex", gap: "16px", marginBottom: "3px", fontSize: "8.5pt", flexWrap: "wrap" }}>
                <div><strong>Work Pending:</strong> {yn(jc.workPending)}</div>
                {jc.workPending && <>
                  <div><strong>Can be Energized:</strong> {yn(jc.canBeEnergized)}</div>
                  <div><strong>Can be Moved:</strong> {yn(jc.canBeMoved)}</div>
                </>}
                <div><strong>Withdraw:</strong> {yn(jc.withdrawalRequired)}</div>
                <div><strong>Delay:</strong> {yn(jc.delay)}</div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "3px", fontSize: "8.5pt" }}>
                <div><strong>Car Lifting Required:</strong> {yn(jc.carLiftingRequired)}</div>
                <div><strong>No. of Men:</strong> {f(jc.noOfMen)}</div>
                <div><strong>Repair Duration:</strong> {jc.repairDurationMinutes ? jc.repairDurationMinutes + " min" : jc.repairDurationHours ? jc.repairDurationHours + " hr" : "—"}</div>
              </div>
            </div>
          </div>

          {/* ─── PART D: Actions & Root Cause ─── */}
          <div style={{ border: "1px solid #000", marginBottom: "5px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "2.5px 6px", borderBottom: "1px solid #000", fontSize: "8.5pt" }}>PART D — Description of Actions Taken &amp; Root Cause</div>
            <div style={{ padding: "5px 7px" }}>
              <div style={{ marginBottom: "3px", fontSize: "8.5pt" }}>
                <strong>Description of Actions Taken:</strong>
                <div style={{ border: "1px solid #aaa", minHeight: "36px", padding: "3px 4px", marginTop: "2px", whiteSpace: "pre-wrap" }}>{f(jc.actionTaken)}</div>
              </div>
              <div style={{ marginBottom: "3px", fontSize: "8.5pt" }}>
                <strong>Root Cause:</strong>
                <div style={{ border: "1px solid #aaa", minHeight: "24px", padding: "3px 4px", marginTop: "2px" }}>{f(jc.rootCause)}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px", fontSize: "8.5pt" }}>
                <div><strong>Job Card Close Date:</strong> {d(jc.closeDate || jc.jobCardCloseDate)}</div>
                <div><strong>Close Time:</strong> {f(jc.closeTime || jc.jobCardCloseTime)}</div>
              </div>
            </div>
          </div>

          {/* ─── PART E: Component Replacement ─── */}
          <div style={{ border: "1px solid #000", marginBottom: "5px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "2.5px 6px", borderBottom: "1px solid #000", fontSize: "8.5pt" }}>PART E — Details of Equipment / Component Replaced</div>
            <div style={{ padding: "4px 5px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Replace/Change?</th>
                    <th>Item / Component</th>
                    <th>Part No.</th>
                    <th>Comp. Out Date</th>
                    <th>Sr. No. (Faulty/Out)</th>
                    <th>Comp. In Date</th>
                    <th>Sr. No. (Healthy/In)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: "center" }}>{yn(jc.partReplaced)}</td>
                    <td>{f(jc.component || jc.equipment)}</td>
                    <td>{f(jc.partNumber)}</td>
                    <td>{d(jc.componentsTakenOutDate || jc.partOutDate)}</td>
                    <td>{f(jc.componentsTakenOutSrNo || jc.partOutSerialNumber)}</td>
                    <td>{d(jc.componentsTakenInDate || jc.partInDate)}</td>
                    <td>{f(jc.componentsTakenInSrNo || jc.partInSerialNumber)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── PART F: Permission / SIC ─── */}
          <div style={{ border: "1px solid #000", marginBottom: "5px" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "2.5px 6px", borderBottom: "1px solid #000", fontSize: "8.5pt" }}>PART F — Permission to Access / SIC Check (PPIO)</div>
            <div style={{ padding: "5px 7px", fontSize: "8.5pt" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px" }}>
                <div><strong>Main Line Action:</strong> {f(jc.mainLineAction)}</div>
                <div><strong>Depot Arrival:</strong> {d(jc.depotArrivalDate)} {f(jc.depotArrivalTime)}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px" }}>
                <div><strong>Inspection In Charge:</strong> {f(jc.inspectionInCharge)}</div>
                <div><strong>SIC Required:</strong> {yn(jc.sicRequired)}</div>
                {jc.sicRequired && <div><strong>SIC Verifier:</strong> {f(jc.sicVerifier)}</div>}
                <div><strong>Power Block Required:</strong> {yn(jc.powerBlockRequired)}</div>
              </div>
              <p style={{ marginBottom: "4px" }}>I hereby declare that SIC has been performed on the concerned equipment and all persons have been withdrawn.</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <div>Name: ___________________________</div>
                <div>Signature: ______________________</div>
                <div>Date: ____________</div>
                <div>Time: ____________</div>
              </div>
            </div>
          </div>

          {/* ─── PART G: Endorsement ─── */}
          <div style={{ border: "1px solid #000" }}>
            <div style={{ background: "#ddd", fontWeight: "bold", padding: "2.5px 6px", borderBottom: "1px solid #000", fontSize: "8.5pt" }}>PART G — Acknowledgment of Work Completion (PPIO / Depot Incharge)</div>
            <div style={{ padding: "5px 7px", fontSize: "8.5pt" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "4px", alignItems: "center" }}>
                <strong>Job Card Status:</strong>
                <span>☐ Completed &nbsp; ☐ Pending &nbsp; ☐ Under Monitoring</span>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "3px" }}>
                <div><strong>Action Endorsed By:</strong> {f(jc.actionEndorsementName)}</div>
                <div><strong>Date:</strong> {d(jc.actionEndorsementDate)}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <div>PPIO Shift Engineer: ________________</div>
                <div>Signature: __________________</div>
                <div>Date: ____________</div>
                <div>Time: ____________</div>
              </div>
              <div style={{ marginTop: "7px", textAlign: "center", fontSize: "7.5pt", color: "#666", borderTop: "1px solid #ccc", paddingTop: "4px" }}>
                BEML Rolling Stock Division · KMRCL RS-3R Project · {f(jc.fracasNumber)} · FM/RS/PPIO/01/01
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
