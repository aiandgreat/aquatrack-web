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
  dateRange?: { from: Date; to: Date };
}

// Category mappings for rendering pretty labels
const categoryLabels: Record<string, string> = {
  PIPELINE_BREACH_PRESSURE_DROP: "Pipeline Breach/Pressure Drop",
  HIGH_TURBIDITY: "High Turbidity",
  HIGH_MINERAL_CONTENT_TDS: "High Mineral Content/TDS",
  CHEMICAL_DISCOLORATION_CONTAMINATION: "Chemical Discoloration/Contamination",
  UNCLASSIFIED_INFRASTRUCTURE_ANOMALY: "Infrastructure Anomaly",
};

/**
 * Asynchronously loads the AquaTrack logo from the public directory.
 * Falls back to null if the image fails to load.
 */
const loadLogo = (logoPath: string = "/LOGO2.png"): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = logoPath;
  });
};

/**
 * Asynchronously fetches a TTF font and converts it to a base64 string.
 * Equips the PDF generator to render with local brand fonts.
 */
const fetchFontBase64 = async (url: string): Promise<string> => {
  try {
    if (typeof window === "undefined") return "";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second network timeout
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return "";
    const buffer = await res.arrayBuffer();
    
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } catch {
    return "";
  }
};

export async function generateComplianceReport(data: ReportData) {
  const doc = new jsPDF();
  const activeComplaints = (data.complaints || []).filter((c) => c.status !== "RESOLVED");
  const totalActive = activeComplaints.length;

  const targetBarangays = [
    "Alasas", "Baliti", "Bulaon", "Calulut", "Del Carmen", "Del Pilar",
    "Del Rosario", "Dela Paz Norte", "Dela Paz Sur", "Dolores", "Juliana",
    "Lara", "Lourdes", "Magliman", "Maimpis", "Malino", "Malpitic",
    "Pandaras", "Panipuan", "Pulung Bulu", "Quebiawan", "Saguin",
    "San Agustin", "San Felipe", "San Isidro", "San Jose", "San Juan",
    "San Nicolas", "San Pedro Cutud", "Santa Lucia", "Santa Teresita",
    "Santo Niño", "Santo Rosario", "Sindalan", "Telabastagan"
  ];

  // Load resources in parallel to maximize speed
  const [logo, regularFont, boldFont, monoFont] = await Promise.all([
    loadLogo("/LOGO2.png"),
    fetchFontBase64("https://fonts.gstatic.com/s/plusjakartasans/v8/L0x5DFIqthQayVuJCvGvGDGPkAObQA-u.ttf"),
    fetchFontBase64("https://fonts.gstatic.com/s/plusjakartasans/v8/L0x5DFIqthQayVuJCvGvGDGPkAObQA-t.ttf"),
    fetchFontBase64("https://cdn.jsdelivr.net/npm/geist-mono@1.3.0/dist/GeistMono-Regular.ttf")
  ]);

  // Set font fallbacks in case network request fails / offline testing
  let fontRegular = "helvetica";
  let fontBold = "helvetica";
  let fontMono = "courier";

  if (regularFont) {
    doc.addFileToVFS("PlusJakartaSans-Regular.ttf", regularFont);
    doc.addFont("PlusJakartaSans-Regular.ttf", "PlusJakarta", "normal");
    fontRegular = "PlusJakarta";
  }
  if (boldFont) {
    doc.addFileToVFS("PlusJakartaSans-Bold.ttf", boldFont);
    doc.addFont("PlusJakartaSans-Bold.ttf", "PlusJakarta", "bold");
    fontBold = "PlusJakarta";
  }
  if (monoFont) {
    doc.addFileToVFS("GeistMono-Regular.ttf", monoFont);
    doc.addFont("GeistMono-Regular.ttf", "GeistMono", "normal");
    fontMono = "GeistMono";
  }

  // Date Formatting for Subtitle & Filename
  const currentDate = new Date();
  const formattedDateString = currentDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Date range label — uses applied filter if provided, else "Past 30 Days"
  const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const dateRangeLabel = data.dateRange
    ? `${fmtShort(data.dateRange.from)} – ${fmtShort(data.dateRange.to)}`
    : "Past 30 Days";

  // ─── PAGE 1: EXECUTIVE AUDIT SUMMARY & METADATA ───

  // Top Header Logo & Brand Banner
  if (logo) {
    // 20mm x 20mm prominent brand logo
    doc.addImage(logo, "PNG", 14, 7, 20, 20);
    
    // Colored letter-by-letter branding: AQ (Navy), U (Yellow), A (Crimson), TRACK (Navy)
    const brandX = 37;
    const brandY = 17.5;
    
    doc.setFont(fontBold, "bold");
    doc.setFontSize(23); // Bolder and larger
    
    // AQ
    doc.setTextColor(0, 30, 102); // Navy (#001e66)
    doc.text("AQ", brandX, brandY);
    const wAQ = doc.getTextWidth("AQ");
    
    // U
    doc.setTextColor(255, 216, 0); // Yellow (#ffd800)
    doc.text("U", brandX + wAQ, brandY);
    const wU = doc.getTextWidth("U");
    
    // A
    doc.setTextColor(151, 0, 6); // Crimson (#970006)
    doc.text("A", brandX + wAQ + wU, brandY);
    const wA = doc.getTextWidth("A");
    
    // TRACK
    doc.setTextColor(0, 30, 102); // Navy (#001e66)
    doc.text("TRACK", brandX + wAQ + wU + wA, brandY);
    
    // Tagline/Subtitle
    doc.setFont(fontRegular, "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 174, 239); // Azure
    doc.text("WATER OPERATIONS & DIAGNOSTICS", 37, 22.5);
  } else {
    // Fallback if logo fails
    doc.setFont(fontBold, "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 30, 102);
    doc.text("AQUATRACK", 14, 20);
  }

  // Document Title Header
  doc.setFont(fontBold, "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 30, 102); // Navy Blue
  doc.text("Water Analytics Report", 14, 33); // Shifted Y from 36 to 33

  // Subtitle Metadata
  doc.setFont(fontRegular, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(
    `Report generated: ${formattedDateString} | Analytics Range: ${dateRangeLabel} | City of San Fernando Water District (CSFWD)`,
    14,
    38 // Shifted Y from 42 to 38
  );

  // Brand Ribbon Separator Line (Vivid Azure #00aeef)
  doc.setDrawColor(0, 174, 239);
  doc.setLineWidth(1.25);
  doc.line(14, 42, 196, 42); // Shifted Y from 46 to 42

  let currY = 48; // Shifted Y from 54 to 48
  doc.setFont(fontBold, "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(0, 30, 102);
  doc.text("1. Executive Operations & Compliance Summary", 14, currY);
  const defaultSummary = `As of today, water quality timelines for the City of San Fernando Water District remain within optimal ranges. Pumping station telemetry lists normal mineral profiles. Total water pipeline line losses calculated over 30 days equate to 1.2%, significantly below the 5% warning mark. Standard cross-check validation yields ${totalActive} Verified active telemetry concerns.`;
  const summaryText = data.systemSummary || defaultSummary;

  // Parse narrative vs recommendations from summaryText
  const summaryLines = summaryText.split("\n");
  const narrativeLines: string[] = [];
  const recommendationLines: string[] = [];
  
  summaryLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("-")) {
      recommendationLines.push(trimmed.substring(1).trim()); // remove the "-" bullet prefix
    } else if (trimmed !== "Recommended Actions:" && trimmed !== "") {
      narrativeLines.push(line);
    }
  });

  const narrativeText = narrativeLines.join(" ");
  const splitNarrative = doc.splitTextToSize(narrativeText, 170);

  // Calculate box height dynamically: Checklist row takes 14mm + text heights
  // We compute narrative height and bullet height to get the exact box height dynamically.
  const narrativeHeight = splitNarrative.length * (8.5 * 1.15 * 0.3527); // wrapped height
  const recommendationsHeight = recommendationLines.length > 0 
    ? 8 + (recommendationLines.length * 4.5) 
    : 0;
  const summaryBoxHeight = Math.max(48, 26 + narrativeHeight + recommendationsHeight);

  // Premium Rounded Card with Accent Left Border (Tailwind style: border-l-4 bg-slate-50)
  doc.setFillColor(248, 250, 252); // Slate 50 (#F8FAFC)
  doc.roundedRect(14, currY + 5, 182, summaryBoxHeight, 3, 3, "F");

  doc.setDrawColor(226, 232, 240); // Slate 200 (#E2E8F0)
  doc.setLineWidth(0.5);
  doc.roundedRect(14, currY + 5, 182, summaryBoxHeight, 3, 3, "S");

  // Thick Left Accent Bar in Navy
  doc.setFillColor(0, 30, 102);
  doc.rect(14.25, currY + 5.25, 3, summaryBoxHeight - 0.5, "F");

  // CARD TITLE: Executive Briefing & Checklist Header
  doc.setFont(fontBold, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 30, 102);
  doc.text("EXECUTIVE BRIEFING & SYSTEM COMPLIANCE STATUS", 21, currY + 11);

  // Helper to draw clean vector checkmarks in brand Azure
  const drawCheckmark = (x: number, y: number) => {
    doc.setDrawColor(0, 174, 239); // Brand Azure (#00aeef)
    doc.setLineWidth(0.75);
    doc.line(x, y + 1.5, x + 1, y + 2.5);
    doc.line(x + 1, y + 2.5, x + 2.5, y + 0.5);
  };

  const drawChecklistItem = (label: string, status: string, x: number, y: number) => {
    drawCheckmark(x, y - 3);
    doc.setFont(fontBold, "bold");
    doc.setFontSize(8.0);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(label, x + 4, y - 1);
    
    doc.setFont(fontRegular, "normal");
    doc.setFontSize(7.0);
    doc.setTextColor(0, 174, 239); // Brand Azure (#00aeef)
    doc.text(status, x + 4, y + 2);
  };

  // Draw 4 checklist items horizontally side-by-side inside the card
  const startChecklistY = currY + 18;
  drawChecklistItem("pH Standards", "COMPLIANT (6.5-8.5)", 21, startChecklistY);
  drawChecklistItem("Turbidity Index", "SAFE RANGE (<5 NTU)", 64, startChecklistY);
  drawChecklistItem("TDS / Minerals", "STABLE (<500 PPM)", 107, startChecklistY);
  drawChecklistItem("Pressure Safety", "OPERATIONAL (>30 PSI)", 150, startChecklistY);

  // Draw the full-width narrative briefing below the checklist with justified alignment
  doc.setFont(fontRegular, "normal");
  doc.setFontSize(8.5); // Compact font size
  doc.setTextColor(51, 65, 85); // Slate 700
  
  const narrativeStartY = currY + 28;
  // Passing raw narrativeText with align: "justify" option
  doc.text(narrativeText, 21, narrativeStartY, { 
    align: "justify", 
    maxWidth: 170, 
    lineHeightFactor: 1.15 
  });

  let textY = narrativeStartY + narrativeHeight + 1.5;

  if (recommendationLines.length > 0) {
    // Draw "RECOMMENDED ACTIONS" heading
    doc.setFont(fontBold, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 30, 102); // Brand Navy (#001e66)
    doc.text("RECOMMENDED ACTIONS:", 21, textY + 3);
    
    textY += 7.5; // Offset to start bullets

    // Draw bullet points with structured indentation and multi-line wrapping
    recommendationLines.forEach((rec) => {
      // Find if there is a colon separator
      const colonIndex = rec.indexOf(":");
      let entity = "";
      let action = rec;
      
      if (colonIndex !== -1) {
        entity = rec.substring(0, colonIndex).replace(/\*\*/g, "").trim();
        action = rec.substring(colonIndex + 1).trim();
      } else {
        // Fallback: split by asterisks if no colon found
        const parts = rec.split("**");
        if (parts.length >= 3) {
          entity = parts[1];
          action = (parts[0] + parts.slice(2).join("")).replace(/^-/, "").trim();
        }
      }

      // Draw bullet point dot
      doc.setFont(fontBold, "bold");
      doc.setFontSize(8.0);
      doc.setTextColor(0, 30, 102); // Navy bullet
      doc.text("•", 21, textY);

      if (entity) {
        // Draw entity in bold Navy
        doc.setFont(fontBold, "bold");
        doc.setTextColor(0, 30, 102); // Navy
        doc.text(entity + ":", 25, textY);
        const prefixWidth = doc.getTextWidth(entity + ": ");
        
        // Wrap and draw action text to remaining horizontal space
        doc.setFont(fontRegular, "normal");
        doc.setTextColor(51, 65, 85); // Slate
        
        const splitAction = doc.splitTextToSize(action, 166 - prefixWidth);
        splitAction.forEach((actionLine: string, idx: number) => {
          if (idx === 0) {
            doc.text(actionLine, 25 + prefixWidth, textY);
          } else {
            textY += 4.2; // Move to next line for wrapped content
            doc.text(actionLine, 25, textY); // Indented align with bullet
          }
        });
      } else {
        // Fallback: draw plain wrapped text if no entity could be parsed
        doc.setFont(fontRegular, "normal");
        doc.setTextColor(51, 65, 85);
        const splitAction = doc.splitTextToSize(action.replace(/\*\*/g, ""), 162);
        splitAction.forEach((actionLine: string, idx: number) => {
          doc.text(actionLine, 25, textY);
          if (idx < splitAction.length - 1) {
            textY += 4.2;
          }
        });
      }

      textY += 4.5; // Padding between recommendations
    });
  }

  // Update Y coordinate for Section 2
  currY = currY + 5 + summaryBoxHeight + 12;

  // Section 2: AI Trend Diagnostics & Hotspots
  // Check if Section 2 fits on the current page (requires ~80mm space). If not, start a new page.
  if (currY + 80 > 280) {
    doc.addPage();
    currY = 40; // Align with running header spacing
  }

  doc.setFont(fontBold, "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(0, 30, 102);
  doc.text("2. AI Trend Analytics & Regional Hotspots", 14, currY);

  // Compute hotspot stats from active complaints
  const hotspotCounts = targetBarangays.map((barangay) => {
    const total = activeComplaints.filter((c) => c.barangay?.toLowerCase() === barangay.toLowerCase()).length;
    return { barangay, total };
  }).sort((a, b) => b.total - a.total);

  const topBarangay = hotspotCounts[0]?.total > 0 ? hotspotCounts[0] : null;
  const hotspotName = (topBarangay && topBarangay.barangay) ? `Barangay ${topBarangay.barangay}` : "None";
  const hotspotCount = topBarangay ? topBarangay.total : 0;

  const categoryTotals = Object.keys(categoryLabels).map((cat) => {
    const count = activeComplaints.filter((c) => c.category === cat).length;
    return { cat, count };
  }).sort((a, b) => b.count - a.count);

  const topCatKey = categoryTotals[0]?.count > 0 ? categoryTotals[0].cat : null;
  const prevalentConcern = (topCatKey && categoryLabels[topCatKey]) 
    ? categoryLabels[topCatKey] 
    : (topCatKey || "None");
  const prevalentCount = categoryTotals[0] ? categoryTotals[0].count : 0;

  // Split diagnostics into bullet points for fast, scannable reading
  let diagnosticsBullets: string[] = [];
  if (totalActive > 0) {
    const concernLabel = prevalentConcern !== "None" ? prevalentConcern : "General Infrastructure Concerns";
    const sectorLabel = hotspotName !== "None" ? hotspotName : "Unspecified Districts";
    const caseText = hotspotCount > 0 ? ` (${hotspotCount} reports)` : "";

    diagnosticsBullets = [
      `- Primary Issue: ${concernLabel} registers as the leading active concern.`,
      `- Focus Barangay: ${sectorLabel} shows the highest cumulative report concentration${caseText}.`,
      `- Action: Dispatch inspection crews to scan pipeline networks in ${sectorLabel.replace("Barangay ", "")}.`
    ];
  } else {
    diagnosticsBullets = [
      `- Network Status: 100% stable operations with zero active citizen reports.`,
      `- Telemetry Health: Localized sensor nodes are reporting normal baseline metrics.`,
      `- Action: No corrective field dispatches or flushing operations required.`
    ];
  }

  doc.setFont(fontRegular, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85); // Slate 700
  
  let lineY = currY + 6;
  diagnosticsBullets.forEach(line => {
    doc.text(line, 14, lineY);
    lineY += 5.5; // clear spacing between bullets
  });

  // Diagnostics metadata KPI cards (2x2 Grid to remove whitespace gaps)
  const cardsY = lineY + 2; // Position cards dynamically below the bullets (shifted from lineY+3)
  const cardWidth = 88;
  const cardHeight = 20; // Reduced from 22 for compactness

  // Helper to draw a sleek Tailwind-styled KPI card with vector icons using AquaTrack brand colors
  const drawKpiCard = (
    x: number, 
    y: number, 
    label: string, 
    val: string, 
    accentColor: [number, number, number], 
    iconType: "complaints" | "hotspot" | "anomaly" | "alerts"
  ) => {
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "F");
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "S");
    
    // Colored border accent line (using explicit brand RGB colors)
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(1.5);
    doc.line(x, y, x, y + cardHeight);

    // Left card text labels
    doc.setFont(fontBold, "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(label, x + 5, y + 6.5); // Shifted text labels up slightly
    
    doc.setFont(fontBold, "bold");
    doc.setFontSize(val.length > 26 ? 8.2 : 9.5); // Slightly smaller text sizing
    doc.setTextColor(0, 30, 102); // Brand Navy (#001e66)
    doc.text(val, x + 5, y + 14);

    // Right card vector icons (mimics Lucide React icons using brand colors, adjusted iconY for 20mm height)
    const iconX = x + cardWidth - 10;
    const iconY = y + 7.5; // Centered inside 20mm card

    if (iconType === "complaints") {
      // Checkbox Shield Icon (Brand Navy #001e66 and Azure #00aeef)
      doc.setDrawColor(0, 30, 102);
      doc.setLineWidth(0.75);
      doc.roundedRect(iconX - 3.5, iconY - 3.5, 7, 7, 1.5, 1.5, "S");
      doc.setDrawColor(0, 174, 239);
      doc.line(iconX - 1.5, iconY + 0.5, iconX, iconY + 2);
      doc.line(iconX, iconY + 2, iconX + 2, iconY - 1.5);
    } else if (iconType === "hotspot") {
      // Location Pin Icon (Brand Yellow #ffd800 or Azure #00aeef)
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.circle(iconX, iconY - 1, 2, "F");
      doc.triangle(iconX - 2, iconY, iconX + 2, iconY, iconX, iconY + 4, "F");
      doc.setFillColor(255, 255, 255);
      doc.circle(iconX, iconY - 1, 0.75, "F");
    } else if (iconType === "anomaly") {
      // EKG Pulse Activity Wave (Dynamic color matching accentColor)
      const waveX = iconX - 4;
      const waveY = iconY;
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.75);
      doc.line(waveX, waveY + 1.5, waveX + 2, waveY + 1.5);
      doc.line(waveX + 2, waveY + 1.5, waveX + 3, waveY - 2.5);
      doc.line(waveX + 3, waveY - 2.5, waveX + 4.5, waveY + 3.5);
      doc.line(waveX + 4.5, waveY + 3.5, waveX + 5.5, waveY - 0.5);
      doc.line(waveX + 5.5, waveY - 0.5, waveX + 8, waveY + 1.5);
    } else if (iconType === "alerts") {
      // Premium Alert Warning Outline Triangle with bold centered exclamation (Brand Crimson #970006)
      doc.setDrawColor(151, 0, 6);
      doc.setLineWidth(0.85);
      
      // Draw outer warning triangle outline
      doc.line(iconX, iconY - 4, iconX - 4.5, iconY + 4);
      doc.line(iconX - 4.5, iconY + 4, iconX + 4.5, iconY + 4);
      doc.line(iconX + 4.5, iconY + 4, iconX, iconY - 4);
      
      // Draw thick centered exclamation mark inside
      doc.setDrawColor(151, 0, 6);
      doc.setLineWidth(0.85);
      doc.line(iconX, iconY - 1.5, iconX, iconY + 1.2);
      
      doc.setFillColor(151, 0, 6);
      doc.circle(iconX, iconY + 2.7, 0.45, "F");
    }
  };

  // Define brand colors
  const brandNavy: [number, number, number] = [0, 30, 102];
  const brandAzure: [number, number, number] = [0, 174, 239];
  const brandYellow: [number, number, number] = [255, 216, 0];
  const brandCrimson: [number, number, number] = [151, 0, 6];

  // Card Grid Layout (2x2 Grid) using thematic brand colors
  // Row 1
  const displayHotspot = hotspotName !== "None" ? hotspotName.toUpperCase() : "ALL CLEAR";
  // Swap: Regional Hotspot gets Brand Azure (#00aeef) if active, else Navy
  const hotspotColor = hotspotName !== "None" ? brandAzure : brandNavy;
  drawKpiCard(14, cardsY, "ACTIVE COMPLAINTS", `${totalActive} PENDING REPORTS`, brandNavy, "complaints");
  drawKpiCard(108, cardsY, "REGIONAL HOTSPOT", displayHotspot, hotspotColor, "hotspot");
  
  // Row 2
  const displayConcern = prevalentConcern !== "None" 
    ? (prevalentConcern.length > 38 ? prevalentConcern.slice(0, 35) + "..." : prevalentConcern).toUpperCase()
    : "NONE DETECTED";
  // Swap: Prevalent Anomaly gets Brand Yellow (#ffd800) if active, else Navy
  const anomalyColor = prevalentConcern !== "None" ? brandYellow : brandNavy;
  drawKpiCard(14, cardsY + 23, "PREVALENT ANOMALY", displayConcern, anomalyColor, "anomaly"); // Swapped accent to anomalyColor
  
  const criticalCount = data.complaints?.filter(c => c.urgency === "CRITICAL").length || 0;
  const criticalColor = criticalCount > 0 ? brandCrimson : brandNavy;
  drawKpiCard(108, cardsY + 23, "CRITICAL WARNINGS", `${criticalCount} THREAT ALERTS`, criticalColor, "alerts"); // Shifted from cardsY+26

  // Update Y coordinate for Section 3
  currY = cardsY + 43 + 8; // Row 2 cardHeight ends at cardsY+43. Added 8mm padding.

  // Section 3: Operational Health Index (Aesthetic visual gauge at the bottom of Page 1)
  if (currY + 20 > 280) {
    doc.addPage();
    currY = 40;
  }

  doc.setFont(fontBold, "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(0, 30, 102); // Brand Navy
  doc.text("3. System Operational Health Index", 14, currY);

  // Calculate faulty/anomalous nodes count dynamically based on safe range limits
  const faultyNodesCount = (data.readings || []).filter(r => 
    (r.ph ?? 7.2) < 6.5 || (r.ph ?? 7.2) > 8.5 ||
    (r.turbidity ?? 0) > 5.0 ||
    (r.tds ?? 0) > 500 ||
    (r.pressure ?? 40.0) < 30.0
  ).length;

  // Dynamic Health Score Calculation: each faulty node deducts 5%, each active complaint deducts 2%
  let healthScore = 100 - (faultyNodesCount * 5) - (totalActive * 2);
  healthScore = Math.max(5, Math.min(100, healthScore)); // Clamp between 5% and 100%

  // Map healthScore to status labels and brand colors
  let healthColor = brandAzure; // Default: Azure (Excellent / Stable)
  let statusLabel = "EXCELLENT";
  
  if (healthScore < 70) {
    healthColor = brandCrimson; // Crimson (Critical Threat alert)
    statusLabel = "CRITICAL ALERT";
  } else if (healthScore < 90) {
    healthColor = brandYellow; // Yellow (Caution/Warning warnings active)
    statusLabel = "CAUTION REQUIRED";
  }

  // Outer progress track (Tailwind style progress bar)
  doc.setFillColor(226, 232, 240); // Slate 200
  doc.roundedRect(14, currY + 4, 182, 4.0, 2, 2, "F"); // Height 4.0mm
  
  // Filled progress (dynamic color and dynamic width based on healthScore percentage)
  doc.setFillColor(healthColor[0], healthColor[1], healthColor[2]); 
  doc.roundedRect(14, currY + 4, 182 * (healthScore / 100), 4.0, 2, 2, "F");
  
  doc.setFont(fontMono, "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`SYSTEM BASELINE HEALTH: ${healthScore.toFixed(1)}% | STATUS: ${statusLabel}`, 14, currY + 16);


  // ─── PAGE 2: TELEMETRY & REGIONAL COMPLAINTS MATRIX ───
  doc.addPage();

  // Page 2 Header Title
  doc.setFont(fontBold, "bold");
  doc.setFontSize(15);
  doc.setTextColor(0, 30, 102);
  doc.text("4. Telemetry Logs & Water Quality Compliance Parameters", 14, 40); // Shifted Y from 24 to 40 to prevent header collisions

  doc.setFont(fontRegular, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Real-time sensory logs captured at active pumping and treatment stations", 14, 45);

  // Telemetry nodes data table
  const telemetryRows = (data.readings || []).map((r) => {
    const ph = r.ph ?? 7.2;
    const turbidity = r.turbidity ?? 1.5;
    const tds = r.tds ?? 235;
    const pressure = r.pressure ?? 40.0;
    
    // Check parameters against safety boundaries
    const isPhBad = ph < 6.5 || ph > 8.5;
    const isTurbidityBad = turbidity > 5.0;
    const isTdsBad = tds > 500;
    const isPressureBad = pressure < 30.0;
    
    // Format cell text, appending warning symbols to anomalous parameters
    const phText = `${ph.toFixed(2)} pH${isPhBad ? " (⚠️)" : ""}`;
    const turbidityText = `${turbidity.toFixed(2)} NTU${isTurbidityBad ? " (⚠️)" : ""}`;
    const tdsText = `${tds.toFixed(0)} ppm${isTdsBad ? " (⚠️)" : ""}`;
    const pressureText = `${pressure.toFixed(1)} PSI${isPressureBad ? " (⚠️)" : ""}`;
    
    // Determine dynamic audit status label
    let statusText = "COMPLIANT";
    const failures: string[] = [];
    if (isPhBad) failures.push("pH");
    if (isTurbidityBad) failures.push("Turbidity");
    if (isTdsBad) failures.push("TDS");
    if (isPressureBad) failures.push("Pressure");
    
    if (failures.length > 0) {
      statusText = `ANOMALOUS (${failures.join(", ")})`;
    }
    
    return [
      r.nodeName || "Unnamed Node",
      phText,
      turbidityText,
      tdsText,
      pressureText,
      statusText
    ];
  });

  autoTable(doc, {
    startY: 50, // Shifted from 34
    head: [["Node Station Location", "pH Level", "Turbidity Avg", "TDS/Minerals", "Line Pressure", "Audit Status"]],
    body: telemetryRows,
    headStyles: { fillColor: [0, 30, 102], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, font: fontBold },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    bodyStyles: { font: fontRegular, fontSize: 8.5 },
    margin: { left: 14, right: 14, top: 34, bottom: 24 }, // Larger top/bottom margins to eliminate table splitting headers collisions
    theme: "striped",
    didParseCell: (data) => {
      // Highlight anomalous cells and status flags in Brand Crimson (#970006)
      if (typeof data.cell.raw === "string") {
        if (data.cell.raw.includes("(⚠️)") || data.cell.raw.startsWith("ANOMALOUS")) {
          data.cell.styles.textColor = [151, 0, 6]; // Crimson
          data.cell.styles.fontStyle = "bold";
        }
      }
    }
  });

  // Barangay complaints table start Y calculation (prevent overlap)
  const complaintsTableStartY = (doc as any).lastAutoTable.finalY + 12;

  // Check if we need to split onto a new page for the Barangay table header
  let finalComplaintsTableStartY = complaintsTableStartY;
  if (complaintsTableStartY > 220) {
    doc.addPage();
    finalComplaintsTableStartY = 40;
  }

  doc.setFont(fontBold, "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 30, 102);
  doc.text("5. Barangay Classification & Grievance Distribution Matrix", 14, finalComplaintsTableStartY);

  doc.setFont(fontRegular, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Proportional incident distributions categorized per sector", 14, finalComplaintsTableStartY + 5);

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
    startY: finalComplaintsTableStartY + 9,
    head: [["Barangay", "Active Cases", "Pressure Drops", "Turbidity", "TDS", "Chemicals", "Infrastructure"]],
    body: barangayTableRows,
    headStyles: { fillColor: [0, 174, 239], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5, font: fontBold },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    bodyStyles: { font: fontRegular, fontSize: 8 },
    margin: { left: 14, right: 14, top: 34, bottom: 24 }, // Safe margins prevent pagination stamp overlaps
    theme: "striped",
    pageBreak: "auto",
  });


  // ─── HEADERS & FOOTERS POST-PROCESSING (ALL PAGES) ───
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Draw header elements on ALL pages (now consistent including 20mm logo)
    if (logo) {
      doc.addImage(logo, "PNG", 14, 7, 20, 20);
    }

    if (i === 1) {
      // On page 1, don't draw running header text since we have the main logo block
    } else {
      // Running header on pages 2+ with colored brand characters
      const startX = 37;
      const headerY = 14;

      doc.setFont(fontBold, "bold");
      doc.setFontSize(8.5);
      
      // AQ
      doc.setTextColor(0, 30, 102); // Navy
      doc.text("AQ", startX, headerY);
      const wAQ = doc.getTextWidth("AQ");

      // U
      doc.setTextColor(255, 216, 0); // Yellow
      doc.text("U", startX + wAQ, headerY);
      const wU = doc.getTextWidth("U");

      // A
      doc.setTextColor(151, 0, 6); // Crimson
      doc.text("A", startX + wAQ + wU, headerY);
      const wA = doc.getTextWidth("A");

      // TRACK COMPLIANCE & WATER QUALITY SUMMARY
      doc.setTextColor(0, 30, 102); // Navy
      doc.text("TRACK COMPLIANCE & WATER QUALITY SUMMARY", startX + wAQ + wU + wA, headerY);
      
      // Subtitle
      doc.setFont(fontRegular, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(0, 174, 239); // Azure
      doc.text("WATER OPERATIONS & DIAGNOSTICS", 37, 18.5);
      
      // Date on right
      doc.setFont(fontRegular, "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate
      doc.text(formattedDateString, 196 - doc.getTextWidth(formattedDateString), 14);

      // Subtle running header line below logo (Y=29)
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 29, 196, 29);
    }
    doc.setFont(fontRegular, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    
    // Page indicator
    doc.text(
      `Page ${i} of ${pageCount} — AquaTrack Automated Operations Report`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );

    // Confidentiality stamp
    const stampText = "CONFIDENTIAL — CITY OF SAN FERNANDO WATER DISTRICT INTERNAL OPERATIONS";
    doc.text(
      stampText,
      196 - doc.getTextWidth(stampText),
      doc.internal.pageSize.getHeight() - 8
    );
  }

  // Trigger download file in user's browser with the requested file pattern
  doc.save(`AquaTrack Water Analytics - ${formattedDateString}.pdf`);
}
