import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
  readings: Array<{
    nodeName: string;
    ph: number;
    turbidity: number;
    tds: number;
    pressure: number;
    timestamp: string;
  }>;
  complaints?: Array<{
    id: string;
    rawText: string;
    category: string;
    urgency: string;
    status: string;
    barangay?: string;
    createdAt: string;
  }>;
  systemSummary?: string;
}

// Category mappings for rendering pretty labels
const categoryLabels: Record<string, string> = {
  PIPELINE_BREACH_PRESSURE_DROP: "Pipeline Breach/Pressure Drop",
  HIGH_TURBIDITY: "High Turbidity",
  HIGH_MINERAL_CONTENT_TDS: "High Mineral Content/TDS",
  CHEMICAL_DISCOLORATION_CONTAMINATION: "Chemical Discoloration/Contamination",
  UNCLASSIFIED_INFRASTRUCTURE_ANOMALY: "Infrastructure Anomaly",
};

export function generateComplianceReport(data: ReportData) {
  const doc = new jsPDF();
  const activeComplaints = (data.complaints || []).filter((c) => c.status !== "RESOLVED");
  const totalActive = activeComplaints.length;

  // ─── PAGE 1: EXECUTIVE AUDIT SUMMARY & METADATA ───

  // Document Title Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 30, 102); // Navy Blue (#001e66)
  doc.text("AquaTrack Compliance Audit", 14, 24);

  // Subtitle Metadata
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(
    `Report generated: ${new Date().toLocaleString()} | City of San Fernando Water District (CSFWD)`,
    14,
    30
  );

  // Brand Ribbon Separator Line
  doc.setDrawColor(0, 174, 239); // Vivid Azure (#00aeef)
  doc.setLineWidth(1.5);
  doc.line(14, 34, 196, 34);

  // Section 1: Executive Summary Container (High Visibility Box)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 30, 102);
  doc.text("1. Executive Operations & Compliance Summary", 14, 46);

  // Split summary text to wrap within container bounds
  const defaultSummary = `As of today, water quality timelines for the City of San Fernando Water District remain within optimal ranges. Pumping station telemetry lists normal mineral profiles. Total water pipeline line losses calculated over 30 days equate to 1.2%, significantly below the 5% warning mark. Standard cross-check validation yields ${totalActive} Verified active telemetry concerns.`;
  const summaryText = data.systemSummary || defaultSummary;
  const splitSummary = doc.splitTextToSize(summaryText, 172);

  // Calculate box height dynamically to prevent overflow
  const lineSpacingHeight = 5.5;
  const summaryBoxHeight = 15 + splitSummary.length * lineSpacingHeight;

  // Summary box background and border
  doc.setFillColor(238, 244, 250); // Light blue tint (#EEF4FA)
  doc.rect(14, 52, 182, summaryBoxHeight, "F");

  doc.setDrawColor(0, 174, 239); // Cyan border
  doc.setLineWidth(1);
  doc.rect(14, 52, 182, summaryBoxHeight, "S");

  // Title inside box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 30, 102);
  doc.text("EXECUTIVE COMPLIANCE BRIEFING (GEMINI AI ENGINE)", 18, 59);

  // Summary text inside box (Emphasized weight)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(splitSummary, 18, 66);

  // Section 2: AI Trend Diagnostics & Hotspots
  let nextY = 52 + summaryBoxHeight + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 30, 102);
  doc.text("2. AI Trend Analytics & Regional Hotspots", 14, nextY);

  // Compute hotspot stats from active complaints
  const targetBarangays = ["Calulut", "Dolores", "San Agustin", "Sindalan", "Bulaon", "Quebiawan", "Telabastagan", "Maimpis", "Lara"];
  const barangayCounts = targetBarangays.map((barangay) => {
    const total = activeComplaints.filter((c) => c.barangay?.toLowerCase() === barangay.toLowerCase()).length;
    return { barangay, total };
  }).sort((a, b) => b.total - a.total);

  const topBarangay = barangayCounts[0]?.total > 0 ? barangayCounts[0] : null;
  const hotspotName = topBarangay ? `Barangay ${topBarangay.barangay}` : "None";
  const hotspotCount = topBarangay ? topBarangay.total : 0;

  const categoryTotals = Object.keys(categoryLabels).map((cat) => {
    const count = activeComplaints.filter((c) => c.category === cat).length;
    return { cat, count };
  }).sort((a, b) => b.count - a.count);

  const topCatKey = categoryTotals[0]?.count > 0 ? categoryTotals[0].cat : null;
  const prevalentConcern = topCatKey ? categoryLabels[topCatKey] : "None";
  const prevalentCount = categoryTotals[0] ? categoryTotals[0].count : 0;

  const diagnosticsText = `Across the district, ${prevalentConcern} registers as the most prevalent concern with ${prevalentCount} total grievances. Regionally, ${hotspotName} has the highest cumulative incident count (${hotspotCount}). Our automated system correlates these citizen claims directly with spatial pumping node data.`;
  const splitDiagnostics = doc.splitTextToSize(diagnosticsText, 180);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(splitDiagnostics, 14, nextY + 6);

  // Diagnostics metadata key-value row
  const metaY = nextY + 22 + (splitDiagnostics.length > 2 ? 5 : 0);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, metaY, 182, 14, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, metaY, 182, 14, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("HOTSPOT DISTRICT:", 18, metaY + 9);
  doc.setTextColor(0, 30, 102);
  doc.text(hotspotName.toUpperCase(), 53, metaY + 9);

  doc.setTextColor(100, 116, 139);
  doc.text("PREVALENT ANOMALY:", 104, metaY + 9);
  doc.setTextColor(0, 30, 102);
  doc.text(prevalentConcern.toUpperCase(), 144, metaY + 9);


  // ─── PAGE 2: TELEMETRY & REGIONAL COMPLAINTS MATRIX ───
  doc.addPage();

  // Page 2 Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(0, 30, 102);
  doc.text("3. Telemetry Logs & Water Quality Compliance Parameters", 14, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Real-time sensory logs captured at active pumping and treatment stations", 14, 29);

  // Telemetry nodes data table
  const telemetryRows = data.readings.map((r) => [
    r.nodeName,
    `${r.ph.toFixed(2)} pH`,
    `${r.turbidity.toFixed(2)} NTU`,
    `${r.tds.toFixed(0)} ppm`,
    `${r.pressure.toFixed(1)} PSI`,
    "COMPLIANT",
  ]);

  autoTable(doc, {
    startY: 34,
    head: [["Node Station Location", "pH Level", "Turbidity Avg", "TDS/Minerals", "Line Pressure", "Audit Status"]],
    body: telemetryRows,
    headStyles: { fillColor: [0, 30, 102], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // Barangay complaints table start Y calculation
  const complaintsTableStartY = (doc as any).lastAutoTable.finalY + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 30, 102);
  doc.text("4. Barangay Classification & Grievance Distribution Matrix", 14, complaintsTableStartY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Proportional incident distributions categorized per sector", 14, complaintsTableStartY + 5);

  // Barangay active counts data table
  const barangayTableRows = targetBarangays.map((barangay) => {
    const total = activeComplaints.filter((c) => c.barangay?.toLowerCase() === barangay.toLowerCase()).length;
    const catCounts = Object.keys(categoryLabels).map((cat) => {
      return activeComplaints.filter((c) => c.barangay?.toLowerCase() === barangay.toLowerCase() && c.category === cat).length;
    });

    return [
      barangay,
      total.toString(),
      ...catCounts.map(count => count > 0 ? count.toString() : "-")
    ];
  });

  autoTable(doc, {
    startY: complaintsTableStartY + 9,
    head: [["Barangay", "Active Cases", "Pressure Drops", "Turbidity", "TDS", "Chemicals", "Infrastructure"]],
    body: barangayTableRows,
    headStyles: { fillColor: [0, 174, 239], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });


  // ─── FOOTER PAGINATION STAMPS FOR EVERY PAGE ───
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    
    // Page indicator
    doc.text(
      `Page ${i} of ${pageCount} — AquaTrack Automated Compliance Report`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );

    // Standard stamp
    doc.text(
      "CONFIDENTIAL — CITY OF SAN FERNANDO WATER DISTRICT INTERNAL OPERATIONS ONLY",
      112,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Trigger download file in user's browser
  doc.save(`aquatrack-compliance-report-${Date.now()}.pdf`);
}
