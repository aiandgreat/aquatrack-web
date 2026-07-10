import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Apply typing for jsPDF-autotable extensions
interface UserOptions {
  startY?: number;
  head?: any[][];
  body?: any[][];
  headStyles?: any;
  alternateRowStyles?: any;
  margin?: { left?: number; right?: number };
}

type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: UserOptions) => void;
};

interface ReportData {
  readings: Array<{
    nodeName: string;
    ph: number;
    turbidity: number;
    tds: number;
    pressure: number;
    timestamp: string;
  }>;
}

/**
 * Compiles and exports a professional water quality compliance audit
 * report to a PDF document, matching national standards.
 */
export function generateComplianceReport(data: ReportData) {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // Document title header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 30, 102); // Navy Blue (#001e66)
  doc.text("AquaTrack Compliance Audit", 14, 24);

  // Subtitle metadata
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

  // Section 1: Context details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 30, 102);
  doc.text("1. Operational Standards Compliance Summary", 14, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85); // Slate 700
  doc.text(
    "This document compiles real-time IoT sensor telemetry parameters gathered at pumping stations and residential edge nodes across the district network. Checked limits match WHO and Philippine National Standards for Drinking Water (PNSDW): Turbidity < 5.0 NTU, pH 6.5–8.5, TDS < 500 ppm, and baseline hydrostatic line pressure > 20 PSI.",
    14,
    52,
    { maxWidth: 180 }
  );

  // Section 2: Readings logs table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 30, 102);
  doc.text("2. Telemetry Logs Table", 14, 74);

  const tableRows = data.readings.map((r) => [
    r.nodeName,
    `${r.ph.toFixed(2)} pH`,
    `${r.turbidity.toFixed(2)} NTU`,
    `${r.tds.toFixed(0)} ppm`,
    `${r.pressure.toFixed(1)} PSI`,
    new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  ]);

  doc.autoTable({
    startY: 80,
    head: [["Node Name", "pH Level", "Turbidity", "TDS/Minerals", "Line Pressure", "Time"]],
    body: tableRows,
    headStyles: { fillColor: [0, 30, 102], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // Footer stamp
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `Page ${i} of ${pageCount} — AquaTrack Automated Diagnostics Platform`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Save trigger
  doc.save(`aquatrack-compliance-report-${Date.now()}.pdf`);
}
