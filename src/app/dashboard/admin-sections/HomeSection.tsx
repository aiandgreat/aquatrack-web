import React, { useState } from "react";

interface DashboardStats {
  totalUsers: number;
  onlineNodes: number;
  totalNodes: number;
  unresolvedComplaints: number;
  complianceIndex: number;
}

interface Advisory {
  id: string;
  date: string;
  title: string;
  text: string;
  type: "warning" | "info" | "news" | "event";
  targetRole?: "broadcast" | "consumers" | "technicians";
}

interface Complaint {
  id: string;
  rawText: string;
  translatedText?: string;
  summary?: string;
  urgency: string;
  category: string;
  status: string;
  createdAt: string;
  barangay: string;
}

interface TelemetryNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface HomeSectionProps {
  stats: DashboardStats;
  advisories: Advisory[];
  setActiveDetailNews: (news: any) => void;
  setActiveDetailEvent: (event: any) => void;
  complaints?: Complaint[];
  nodes?: TelemetryNode[];
}

export default function HomeSection({
  stats,
  advisories,
  setActiveDetailNews,
  setActiveDetailEvent,
  complaints = [],
  nodes = [],
}: HomeSectionProps) {
  const [expandedCard, setExpandedCard] = useState<"compliance" | "sensors" | "reports" | "advisories" | null>(null);

  const parseEventDate = (dateStr: string) => {
    try {
      const clean = dateStr.replace(",", "");
      const parts = clean.split(" ");
      if (parts.length >= 2) {
        const monthAbbr = parts[0].substring(0, 3).toUpperCase();
        const day = parts[1];
        return { month: monthAbbr, day };
      }
    } catch (e) {
      // Fallback parsing failed
    }
    return { month: "EVT", day: "•" };
  };

  const newsList = advisories
    .filter((ad) => ad.type === "news")
    .map((ad) => ({
      id: ad.id,
      date: ad.date,
      title: ad.title,
      description: ad.text,
      tag: ad.targetRole === "consumers" ? "CONSUMERS" : ad.targetRole === "technicians" ? "STAFF" : "PUBLIC",
    }));

  const eventsList = advisories
    .filter((ad) => ad.type === "event")
    .map((ad, idx) => {
      const { month, day } = parseEventDate(ad.date);
      const color = [
        "bg-purple-100 text-purple-700",
        "bg-indigo-100 text-indigo-700",
        "bg-blue-100 text-blue-700",
        "bg-pink-100 text-pink-700",
      ][idx % 4];
      return {
        id: ad.id,
        month,
        day,
        title: ad.title,
        description: ad.text,
        color,
      };
    });

  // Calculate offline nodes, critical urgency complaints, and warning advisories
  const offlineNodes = nodes.filter((n) => n.status === "OFFLINE");
  const criticalComplaints = complaints.filter(
    (c) => c.status !== "RESOLVED" && c.urgency === "CRITICAL"
  );
  const warningAdvisories = advisories.filter((ad) => ad.type === "warning");
  const hasAlerts = offlineNodes.length > 0 || criticalComplaints.length > 0 || warningAdvisories.length > 0;

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner with Clickable Summary Cards */}
      <div className="bg-gradient-to-r from-[#063A8C] via-[#076DB2] to-[#08AEEA] rounded-[17px] min-h-[220px] p-6 text-white flex flex-col justify-between shadow-md shadow-blue-950/20 relative overflow-hidden">
        <div className="space-y-2 z-10 relative">
          <div className="border border-cyan-300 text-cyan-200 text-[9px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full w-fit uppercase bg-white/5">
            EXECUTIVE OPERATIONS COMMAND
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-3">
            Hello, Admin Officer!
          </h2>
          <p className="text-xs text-white/95 leading-relaxed max-w-[650px]">
            Executive management portal designed for supervising municipal water distribution networks, coordinating technical personnel, posting advisories, adjusting global AI triage strictness, and ensuring district-wide compliance with PNSDW standards.
          </p>
        </div>

        {/* Statistics Row */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/10 z-10 relative">
          <div
            onClick={() => setExpandedCard(expandedCard === "compliance" ? null : "compliance")}
            className={`bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center cursor-pointer hover:bg-white/20 select-none transition-all ${
              expandedCard === "compliance" ? "ring-2 ring-cyan-300 bg-white/20" : ""
            }`}
          >
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              COMPLIANCE INDEX
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              {stats.complianceIndex}% PNSDW
            </span>
          </div>

          <div
            onClick={() => setExpandedCard(expandedCard === "sensors" ? null : "sensors")}
            className={`bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center cursor-pointer hover:bg-white/20 select-none transition-all ${
              expandedCard === "sensors" ? "ring-2 ring-cyan-300 bg-white/20" : ""
            }`}
          >
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              ACTIVE IOT SENSORS
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              {stats.onlineNodes} / {stats.totalNodes} Online
            </span>
          </div>

          <div
            onClick={() => setExpandedCard(expandedCard === "reports" ? null : "reports")}
            className={`bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center cursor-pointer hover:bg-white/20 select-none transition-all ${
              expandedCard === "reports" ? "ring-2 ring-cyan-300 bg-white/20" : ""
            }`}
          >
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              UNRESOLVED REPORTS
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              {stats.unresolvedComplaints} Pending
            </span>
          </div>

          <div
            onClick={() => setExpandedCard(expandedCard === "advisories" ? null : "advisories")}
            className={`bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center cursor-pointer hover:bg-white/20 select-none transition-all ${
              expandedCard === "advisories" ? "ring-2 ring-cyan-300 bg-white/20" : ""
            }`}
          >
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              ADVISORIES LOGGED
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              {advisories.length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Summary Card Expansion Drawer */}
      {expandedCard && (
        <div className="bg-[#f8fafc] border border-slate-200 rounded-[17px] p-5 shadow-inner transition-all duration-300 relative">
          <button
            onClick={() => setExpandedCard(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-extrabold text-sm select-none"
          >
            ✕
          </button>

          {expandedCard === "compliance" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#001e66] uppercase tracking-wider">Compliance Index Diagnostics</h4>
              <p className="text-xs text-slate-500 font-medium">Target metrics specified by the Philippine National Standards for Drinking Water (PNSDW):</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Avg pH</span>
                  <div className="text-sm font-black text-[#001e66] mt-0.5">7.2 pH</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                  <span className="text-[8px] text-slate-400 block mt-1 font-bold">Target: 6.5 - 8.5</span>
                </div>
                <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Avg Turbidity</span>
                  <div className="text-sm font-black text-[#001e66] mt-0.5">1.8 NTU</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "36%" }}></div>
                  </div>
                  <span className="text-[8px] text-slate-400 block mt-1 font-bold">Target: &lt; 5.0 NTU</span>
                </div>
                <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Avg TDS</span>
                  <div className="text-sm font-black text-[#001e66] mt-0.5">240 ppm</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "48%" }}></div>
                  </div>
                  <span className="text-[8px] text-slate-400 block mt-1 font-bold">Target: &lt; 500 ppm</span>
                </div>
                <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Avg Pressure</span>
                  <div className="text-sm font-black text-[#001e66] mt-0.5">44.0 PSI</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "80%" }}></div>
                  </div>
                  <span className="text-[8px] text-slate-400 block mt-1 font-bold">Target: 30 - 60 PSI</span>
                </div>
              </div>
            </div>
          )}

          {expandedCard === "sensors" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#001e66] uppercase tracking-wider">IoT Sensor Stations Status</h4>
              <p className="text-xs text-slate-500 font-medium">Live operational status across all district nodes:</p>
              <div className="max-h-48 overflow-y-auto pt-1 space-y-2">
                {nodes && nodes.length > 0 ? (
                  nodes.map((n) => (
                    <div key={n.id} className="flex items-center justify-between bg-white border border-slate-150 rounded-xl p-2.5 text-xs shadow-sm">
                      <div className="font-extrabold text-[#001e66]">{n.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">Lat: {n.latitude.toFixed(4)}, Lng: {n.longitude.toFixed(4)}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          n.status === "ONLINE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          n.status === "MAINTENANCE" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {n.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No nodes registered in the system.</p>
                )}
              </div>
            </div>
          )}

          {expandedCard === "reports" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#001e66] uppercase tracking-wider">Pending Citizen Complaints</h4>
              <p className="text-xs text-slate-500 font-medium">Unresolved complaints waiting for assignment or triage confirmation:</p>
              <div className="max-h-48 overflow-y-auto pt-1 space-y-2">
                {complaints && complaints.filter(c => c.status !== "RESOLVED").length > 0 ? (
                  complaints.filter(c => c.status !== "RESOLVED").slice(0, 5).map((c) => (
                    <div key={c.id} className="bg-white border border-slate-150 rounded-xl p-3 text-xs space-y-1 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[#001e66]">{c.summary || "Complaint Report"}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          c.urgency === "CRITICAL" ? "bg-red-100 text-red-800" :
                          c.urgency === "HIGH" ? "bg-amber-100 text-amber-800" :
                          "bg-slate-100 text-slate-800"
                        }`}>
                          {c.urgency}
                        </span>
                      </div>
                      <p className="text-slate-500 italic text-[11px] truncate">"{c.rawText}"</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold pt-1">
                        <span>📍 {c.barangay || "San Fernando"}</span>
                        <span>Logged: {new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No unresolved complaints in active queue.</p>
                )}
              </div>
            </div>
          )}

          {expandedCard === "advisories" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#001e66] uppercase tracking-wider">Logged Advisories & Bulletins</h4>
              <p className="text-xs text-slate-500 font-medium">Active broadcasts currently displayed to staff and residents:</p>
              <div className="max-h-48 overflow-y-auto pt-1 space-y-2">
                {advisories && advisories.length > 0 ? (
                  advisories.map((ad) => (
                    <div key={ad.id} className="bg-white border border-slate-150 rounded-xl p-3 text-xs space-y-1 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[#001e66]">{ad.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          ad.type === "warning" ? "bg-red-50 text-red-600" :
                          ad.type === "event" ? "bg-purple-50 text-purple-600" :
                          ad.type === "news" ? "bg-emerald-50 text-emerald-600" :
                          "bg-blue-50 text-blue-600"
                        }`}>
                          {ad.type}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] line-clamp-1">{ad.text}</p>
                      <div className="text-[10px] text-slate-400 font-bold">
                        Published: {ad.date} • Target: {ad.targetRole || "broadcast"}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No advisories posted.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Critical Network Alerts */}
      <div className={`rounded-[17px] p-4 flex items-start gap-3 border shadow-sm ${
        hasAlerts
          ? "bg-[#970006]/5 border-[#970006]/15 animate-pulse"
          : "bg-emerald-500/5 border-emerald-500/10"
      }`}>
        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
          hasAlerts
            ? "bg-[#970006] text-white"
            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
        }`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            {hasAlerts ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            )}
          </svg>
        </div>
        <div className="space-y-1 flex-1">
          <h4 className={`text-xs font-black uppercase tracking-wider ${
            hasAlerts ? "text-[#970006]" : "text-emerald-700"
          }`}>
            {hasAlerts ? "Critical System Alerts" : "System Status: Nominal"}
          </h4>
          {hasAlerts ? (
            <ul className="text-xs text-slate-600 font-bold space-y-1.5 list-disc pl-4">
              {offlineNodes.map((node) => (
                <li key={node.id}>
                  Telemetry Station <span className="text-[#970006] font-black">"{node.name}"</span> is currently <span className="uppercase text-red-600 font-black">Offline</span>. Immediate diagnostics required.
                </li>
              ))}
              {criticalComplaints.map((comp) => (
                <li key={comp.id}>
                  Critical incident in <span className="text-[#970006] font-black">Brgy. {comp.barangay}</span>: "{comp.summary || comp.rawText}"
                </li>
              ))}
              {warningAdvisories.map((ad) => (
                <li key={ad.id}>
                  Broadcast Warning: <span className="text-[#970006] font-black">"{ad.title}"</span> is currently live. Residents have been notified.
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 font-medium">
              All municipal water nodes are online and reporting within normal telemetry limits. No pending critical reports or live warnings.
            </p>
          )}
        </div>
      </div>

      {/* Lower Content Grid */}
      <div className="grid grid-cols-12 gap-[18px]">
        {/* Left Column: Quick Analytics & District News */}
        <div className="col-span-12 lg:col-span-7 space-y-[18px]">
          {/* Quick Analytics Grid */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <svg className="w-5 h-5 text-[#001e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <h3 className="text-sm font-black uppercase text-[#001e66] tracking-wider">
                Quick District Analytics
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-[13px] p-4 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">System Avg pH</span>
                  <div className="text-lg font-black text-[#001e66] mt-1">7.2 pH</div>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 mt-1.5 inline-block">✓ STABLE</span>
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shrink-0">
                  <span className="text-xs font-black">7.2</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-[13px] p-4 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Avg Turbidity</span>
                  <div className="text-lg font-black text-[#001e66] mt-1">1.8 NTU</div>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 mt-1.5 inline-block">✓ OPTIMAL</span>
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-sky-50 text-sky-600 rounded-full border border-sky-100 shrink-0">
                  <span className="text-xs font-black">1.8</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-[13px] p-4 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Line Pressure</span>
                  <div className="text-lg font-black text-[#001e66] mt-1">44.0 PSI</div>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 mt-1.5 inline-block">✓ NOMINAL</span>
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full border border-blue-100 shrink-0">
                  <span className="text-xs font-black">44</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-[13px] p-4 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TDS / Minerals</span>
                  <div className="text-lg font-black text-[#001e66] mt-1">240 ppm</div>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 mt-1.5 inline-block">✓ SECURE</span>
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-purple-50 text-purple-600 rounded-full border border-purple-100 shrink-0">
                  <span className="text-xs font-black">240</span>
                </div>
              </div>
            </div>
          </div>

          {/* Latest News */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <svg className="w-5 h-5 text-[#001e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4h-2m2 0a2 2 0 00-2-2m2 2v5a2 2 0 01-2 2h-2" />
              </svg>
              <h3 className="text-sm font-black uppercase text-[#001e66] tracking-wider">
                Latest District News
              </h3>
            </div>

            <div className="space-y-3">
              {newsList.length > 0 ? (
                newsList.map((news: any) => (
                  <div
                    key={news.id}
                    onClick={() => setActiveDetailNews(news)}
                    className="bg-white border border-slate-200 rounded-[13px] p-4 hover:border-[#00aeef] transition-all cursor-pointer shadow-sm relative pr-28 text-left"
                  >
                    <span className="text-[10px] font-bold text-slate-400">{news.date}</span>
                    <h4 className="font-black text-[#001e66] text-sm mt-1">{news.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1.5 line-clamp-2">
                      {news.description}
                    </p>
                    <span className={`absolute top-4 right-4 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                      news.tag === "CORE UPGRADE" ? "bg-blue-50 text-blue-600" :
                      news.tag === "COMPLIANCE" ? "bg-emerald-50 text-emerald-600" :
                      "bg-slate-55 text-[#001e66]"
                    }`}>
                      {news.tag}
                    </span>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-slate-200 rounded-[13px] p-8 text-center text-slate-400 bg-slate-50/50">
                  <p className="text-xs font-bold uppercase tracking-wider">No News Broadcasts Posted</p>
                  <p className="text-[11px] text-slate-500 mt-1">Operational announcements will appear here once published.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Activity Feed & Events & Advisories */}
        <div className="col-span-12 lg:col-span-5 space-y-[18px]">
          {/* Live Activity Feed */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <svg className="w-5 h-5 text-[#001e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-black uppercase text-[#001e66] tracking-wider">
                Live Activity Feed
              </h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-[17px] p-4 shadow-sm space-y-4 max-h-[295px] overflow-y-auto">
              {complaints && complaints.slice(0, 3).map((comp, idx) => (
                <div key={`dynamic-feed-${comp.id}`} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00aeef] ring-4 ring-[#00aeef]/20 shrink-0"></div>
                    <div className="w-[1.5px] bg-slate-200 flex-1 my-1"></div>
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {new Date(comp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-slate-600 font-bold leading-normal">
                      [AI Triage] Citizen report in <span className="text-[#001e66]">Brgy. {comp.barangay || "San Fernando"}</span> classified as <span className="text-[#00aeef] font-black">{comp.urgency}</span>.
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0"></div>
                  <div className="w-[1.5px] bg-slate-200 flex-1 my-1"></div>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] text-slate-400 font-mono block">Just Now</span>
                  <p className="text-slate-600 font-bold leading-normal">
                    [Telemetry] Ingest stream active for <span className="text-[#001e66]">East Reservoir Station</span>: normal pressures reported.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20 shrink-0"></div>
                  <div className="w-[1.5px] bg-slate-200 flex-1 my-1"></div>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] text-slate-400 font-mono block">35m ago</span>
                  <p className="text-slate-600 font-bold leading-normal">
                    [Field Crew] Technical evaluation dispatched for reported water leakage.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-500/20 shrink-0"></div>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] text-slate-400 font-mono block">2h ago</span>
                  <p className="text-slate-600 font-bold leading-normal">
                    [System] Global AI strictness coefficient updated.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Events */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <svg className="w-5 h-5 text-[#001e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-sm font-black uppercase text-[#001e66] tracking-wider">
                Upcoming District Events
              </h3>
            </div>

            <div className="space-y-3.5">
              {eventsList.length > 0 ? (
                eventsList.map((evt: any) => (
                  <div
                    key={evt.id}
                    onClick={() => setActiveDetailEvent(evt)}
                    className="flex items-start space-x-4 cursor-pointer hover:opacity-85 transition-opacity"
                  >
                    <div className={`w-11 h-11 shrink-0 rounded-xl flex flex-col items-center justify-center font-black ${evt.color}`}>
                      <span className="text-[9px] uppercase tracking-wider">{evt.month}</span>
                      <span className="text-sm -mt-0.5">{evt.day}</span>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h4 className="font-extrabold text-[#001e66] text-xs truncate">{evt.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{evt.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 bg-slate-50/50">
                  <p className="text-xs font-bold uppercase tracking-wider">No Scheduled Events</p>
                  <p className="text-[11px] text-slate-500 mt-1">Calendar assemblies and sensor demos will list here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Advisories Panel Notice */}
          {advisories.length > 0 ? (
            <div className="bg-[#EEF4FC] border border-blue-100 rounded-[13px] p-4 space-y-3 shadow-sm text-left">
              <div className="flex items-center space-x-2 text-[#001e66]">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <span className="text-[9px] font-black uppercase tracking-wider">
                  ACTIVE STAFF ADVISORY ({advisories.length})
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-black text-[#001e66]">
                  {advisories[0].title}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {advisories[0].text}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#EEF4FC]/50 border border-slate-200 border-dashed rounded-[13px] p-4 text-center text-slate-400">
              <p className="text-xs font-bold uppercase tracking-wider">No Active Staff Advisories</p>
              <p className="text-[11px] text-slate-500 mt-1">Global maintenance broadcasts will list here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
