import React, { useState } from "react";
import DiagnosticAlertDrawer from "../../../components/DiagnosticAlertDrawer";
import { 
  BarChart3, 
  Newspaper, 
  Megaphone, 
  Zap, 
  Calendar,
  Activity,
  Cpu,
  User,
  FileText,
  Globe,
  MapPin,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Inbox,
  Brain,
  Database,
  Clock
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  onlineNodes: number;
  totalNodes: number;
  unresolvedComplaints: number;
  complianceIndex: number;
  avgPh?: number;
  avgTurbidity?: number;
  avgTds?: number;
  avgPressure?: number;
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
  diagnosticAlerts?: any[];
  crews?: any[];
  handleDispatchAlert?: (alertId: string, crewId: string, complaintId: string) => void;
  setActiveTab?: (tab: string) => void;
}

export default function HomeSection({
  stats,
  advisories,
  setActiveDetailNews,
  setActiveDetailEvent,
  complaints = [],
  nodes = [],
  diagnosticAlerts = [],
  crews = [],
  handleDispatchAlert = (_alertId: string, _crewId: string, _complaintId: string) => {},
  setActiveTab,
}: HomeSectionProps) {
  const [expandedCard, setExpandedCard] = useState<"compliance" | "sensors" | "reports" | "advisories" | null>(null);
  const [calDate, setCalDate] = useState(new Date(2026, 6, 25)); // Set baseline to July 2026

  const handlePrevMonth = () => {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));
  };

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
      // Fallback
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
    }))
    .slice(0, 2);

  const eventsList = advisories
    .filter((ad) => ad.type === "event")
    .map((ad, idx) => {
      const { month, day } = parseEventDate(ad.date);
      const color = [
        "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40",
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40",
        "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40",
        "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200 dark:border-pink-900/40",
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

  const offlineNodes = nodes.filter((n) => n.status === "OFFLINE");
  const criticalComplaints = complaints.filter(
    (c) => c.status !== "RESOLVED" && c.urgency === "CRITICAL"
  );
  const warningAdvisories = advisories.filter((ad) => ad.type === "warning");

  return (
    <div className="space-y-6 font-sans">
      {/* Executive Welcome Banner with Clickable Summary Cards */}
      <div className="rounded-[24px] min-h-[220px] p-6 text-white flex flex-col justify-between shadow-md relative overflow-hidden transition-all duration-300 border border-slate-100/10 dark:border-slate-800/40">
        
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none z-0"
          style={{ backgroundImage: "url('/headerpic.png')", backgroundPosition: "center 25%" }}
        />

        {/* Dark Blue Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2E7A]/95 via-[#0B2E7A]/90 to-[#0B2E7A]/80 dark:from-[#001e66]/95 dark:via-[#001e66]/90 dark:to-[#001e66]/80 z-10 pointer-events-none" />

        {/* Decorative Wave Design */}
        <div className="absolute inset-0 opacity-15 pointer-events-none z-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,45 Q25,35 50,45 T100,45 L100,100 L0,100 Z" fill="rgba(255,255,255,0.08)"></path>
          </svg>
        </div>

        <div className="space-y-2 z-20 relative text-left">
          <div className="border border-cyan-300/40 text-cyan-200 text-[9px] font-mono font-bold tracking-wider px-3 py-1 rounded-full w-fit uppercase bg-white/5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#00aeef]" />
            Executive Operations Command
          </div>
          <h2 className="text-3xl md:text-3.5xl font-black tracking-tight drop-shadow-sm text-white mt-3.5 animate-fade-in">
            Hello, Admin Officer!
          </h2>
          <p className="text-xs text-blue-100/90 font-bold tracking-wide mt-2 opacity-95 leading-relaxed">
            Executive control panel for municipal water networks, field operations, and real-time telemetry analytics.
          </p>
        </div>

        {/* Statistics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/10 z-20 relative">
          <div
            onClick={() => setExpandedCard(expandedCard === "compliance" ? null : "compliance")}
            className={`bg-white/10 border border-white/15 rounded-xl h-[58px] px-3.5 flex flex-col justify-center cursor-pointer hover:bg-white/20 select-none transition-all ${
              expandedCard === "compliance" ? "ring-2 ring-cyan-300 bg-white/20" : ""
            }`}
          >
            <span className="text-[8px] font-mono font-bold tracking-wider text-cyan-200 uppercase leading-none">
              COMPLIANCE INDEX
            </span>
            <span className="text-sm font-black mt-1.5 text-white leading-none">
              {stats.complianceIndex}% PNSDW
            </span>
          </div>

          <div
            onClick={() => setExpandedCard(expandedCard === "sensors" ? null : "sensors")}
            className={`bg-white/10 border border-white/15 rounded-xl h-[58px] px-3.5 flex flex-col justify-center cursor-pointer hover:bg-white/20 select-none transition-all ${
              expandedCard === "sensors" ? "ring-2 ring-cyan-300 bg-white/20" : ""
            }`}
          >
            <span className="text-[8px] font-mono font-bold tracking-wider text-cyan-200 uppercase leading-none">
              ACTIVE IOT SENSORS
            </span>
            <span className="text-sm font-black mt-1.5 text-white leading-none">
              {stats.onlineNodes} / {stats.totalNodes} Online
            </span>
          </div>

          <div
            onClick={() => setExpandedCard(expandedCard === "reports" ? null : "reports")}
            className={`bg-white/10 border border-white/15 rounded-xl h-[58px] px-3.5 flex flex-col justify-center cursor-pointer hover:bg-white/20 select-none transition-all ${
              expandedCard === "reports" ? "ring-2 ring-cyan-300 bg-white/20" : ""
            }`}
          >
            <span className="text-[8px] font-mono font-bold tracking-wider text-cyan-200 uppercase leading-none">
              UNRESOLVED REPORTS
            </span>
            <span className="text-sm font-black mt-1.5 text-white leading-none">
              {stats.unresolvedComplaints} Pending
            </span>
          </div>

          <div
            onClick={() => setExpandedCard(expandedCard === "advisories" ? null : "advisories")}
            className={`bg-white/10 border border-white/15 rounded-xl h-[58px] px-3.5 flex flex-col justify-center cursor-pointer hover:bg-white/20 select-none transition-all ${
              expandedCard === "advisories" ? "ring-2 ring-cyan-300 bg-white/20" : ""
            }`}
          >
            <span className="text-[8px] font-mono font-bold tracking-wider text-cyan-200 uppercase leading-none">
              ADVISORIES LOGGED
            </span>
            <span className="text-sm font-black mt-1.5 text-white leading-none">
              {advisories.length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Summary Card Expansion Drawer */}
      {expandedCard && (
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-[20px] p-5 shadow-inner transition-all duration-300 relative">
          <button
            onClick={() => setExpandedCard(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 font-extrabold text-sm select-none"
          >
            ✕
          </button>

          {expandedCard === "compliance" && (
            <div className="space-y-3 text-left">
              <h4 className="text-xs font-black text-[#001e66] dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#00aeef]" />
                Compliance Index Diagnostics
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target metrics specified by the Philippine National Standards for Drinking Water (PNSDW):</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-3 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg pH</span>
                  <div className="text-sm font-black text-[#001e66] dark:text-slate-200 mt-0.5">7.2 pH</div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 block mt-1 font-bold">Target: 6.5 - 8.5</span>
                </div>
                <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-3 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Turbidity</span>
                  <div className="text-sm font-black text-[#001e66] dark:text-slate-200 mt-0.5">1.8 NTU</div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "36%" }}></div>
                  </div>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 block mt-1 font-bold">Target: &lt; 5.0 NTU</span>
                </div>
                <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-3 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg TDS</span>
                  <div className="text-sm font-black text-[#001e66] dark:text-slate-200 mt-0.5">240 ppm</div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "48%" }}></div>
                  </div>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 block mt-1 font-bold">Target: &lt; 500 ppm</span>
                </div>
                <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-3 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Pressure</span>
                  <div className="text-sm font-black text-[#001e66] dark:text-slate-200 mt-0.5">44.0 PSI</div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "80%" }}></div>
                  </div>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 block mt-1 font-bold">Target: 30 - 60 PSI</span>
                </div>
              </div>
            </div>
          )}

          {expandedCard === "sensors" && (
            <div className="space-y-3 text-left">
              <h4 className="text-xs font-black text-[#001e66] dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#00aeef]" />
                IoT Sensor Stations Status
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Live operational status across all district nodes:</p>
              <div className="max-h-48 overflow-y-auto pt-1 space-y-2 pr-1">
                {nodes && nodes.length > 0 ? (
                  nodes.map((n) => (
                    <div key={n.id} className="flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-2.5 text-xs shadow-sm">
                      <div className="font-extrabold text-[#001e66] dark:text-slate-200">{n.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono font-bold">Lat: {n.latitude.toFixed(4)}, Lng: {n.longitude.toFixed(4)}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          n.status === "ONLINE" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40" :
                          n.status === "MAINTENANCE" ? "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40" :
                          "bg-red-50 text-red-700 border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/40"
                        }`}>
                          {n.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No nodes registered in the system.</p>
                )}
              </div>
            </div>
          )}

          {expandedCard === "reports" && (
            <div className="space-y-3 text-left">
              <h4 className="text-xs font-black text-[#001e66] dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-rose-500" />
                Pending Citizen Complaints
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unresolved complaints waiting for assignment or triage confirmation:</p>
              <div className="max-h-48 overflow-y-auto pt-1 space-y-2 pr-1">
                {complaints && complaints.filter(c => c.status !== "RESOLVED").length > 0 ? (
                  complaints.filter(c => c.status !== "RESOLVED").slice(0, 5).map((c) => (
                    <div key={c.id} className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-3 text-xs space-y-1.5 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[#001e66] dark:text-slate-200">{c.summary || "Complaint Report"}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          c.urgency === "CRITICAL" ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400" :
                          c.urgency === "HIGH" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" :
                          "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {c.urgency}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 italic text-[10px] truncate">"{c.rawText}"</p>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-bold pt-1">
                        <span>📍 {c.barangay || "San Fernando"}</span>
                        <span>Logged: {new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No unresolved complaints in active queue.</p>
                )}
              </div>
            </div>
          )}

          {expandedCard === "advisories" && (
            <div className="space-y-3 text-left">
              <h4 className="text-xs font-black text-[#001e66] dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Newspaper className="w-4 h-4 text-[#00aeef]" />
                Logged Advisories & Bulletins
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active broadcasts currently displayed to staff and residents:</p>
              <div className="max-h-48 overflow-y-auto pt-1 space-y-2 pr-1">
                {advisories && advisories.length > 0 ? (
                  advisories.map((ad) => (
                    <div key={ad.id} className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-3 text-xs space-y-1 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[#001e66] dark:text-slate-200">{ad.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          ad.type === "warning" ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400" :
                          ad.type === "event" ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400" :
                          ad.type === "news" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" :
                          "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                        }`}>
                          {ad.type}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1">{ad.text}</p>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                        Published: {ad.date} • Target: {ad.targetRole || "broadcast"}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No advisories posted.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Activity Feed Compiler */}
      {(() => {
        const getDynamicActivities = () => {
          const activities: Array<{
            id: string;
            timestamp: Date;
            tag: string;
            tagColor: string;
            badgeBg: string;
            icon: React.ComponentType<any>;
            iconColor: string;
            iconBg: string;
            text: string;
          }> = [];

          complaints.forEach((comp) => {
            activities.push({
              id: `complaint-${comp.id}`,
              timestamp: new Date(comp.createdAt),
              tag: "AI Triage",
              tagColor: "text-rose-600 dark:text-rose-400",
              badgeBg: "bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40",
              icon: Brain,
              iconColor: "text-rose-500",
              iconBg: "bg-rose-500/10",
              text: `Citizen in Brgy. ${comp.barangay || "San Fernando"} reported: "${comp.summary || comp.rawText}" (${comp.urgency})`
            });
          });

          nodes.filter(n => n.status !== "ONLINE").forEach((node) => {
            activities.push({
              id: `node-${node.id}`,
              timestamp: new Date(Date.now() - 1000 * 60 * 2),
              tag: "Sensor Alert",
              tagColor: "text-amber-650 dark:text-amber-400",
              badgeBg: "bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40",
              icon: Activity,
              iconColor: "text-amber-500",
              iconBg: "bg-amber-500/10",
              text: `Sensor node "${node.name}" status changed to ${node.status} due to threshold breach.`
            });
          });

          if (activities.length === 0) {
            activities.push({
              id: "sys-ok-1",
              timestamp: new Date(Date.now() - 1000 * 60 * 15),
              tag: "Telemetry Stream",
              tagColor: "text-emerald-600 dark:text-emerald-450",
              badgeBg: "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40",
              icon: Database,
              iconColor: "text-emerald-500",
              iconBg: "bg-emerald-500/10",
              text: "Global water telemetry stream is active. All pump sensors reporting normal pressures."
            });
            activities.push({
              id: "sys-ok-2",
              timestamp: new Date(Date.now() - 1000 * 60 * 120),
              tag: "AI Coeff Update",
              tagColor: "text-purple-650 dark:text-purple-400",
              badgeBg: "bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40",
              icon: Sparkles,
              iconColor: "text-purple-500",
              iconBg: "bg-purple-500/10",
              text: "System-wide automated diagnostic sensitivity updated: standard filtering verified."
            });
          }

          activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          return activities.slice(0, 5);
        };

        const dynamicActivities = getDynamicActivities();
        const phVal = stats.avgPh ?? 7.2;
        const turbVal = stats.avgTurbidity ?? 1.8;
        const pressVal = stats.avgPressure ?? 44.0;
        const tdsVal = stats.avgTds ?? 240;

        return (
          <div className="grid grid-cols-12 gap-[18px]">
            {/* Left Column: Quick Analytics & District News */}
            <div className="col-span-12 lg:col-span-8 space-y-[18px]">
              
              {/* Quick Analytics Grid */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-[#001e66]/5 dark:bg-[#00aeef]/10 flex items-center justify-center text-[#001e66] dark:text-[#00aeef] shrink-0">
                    <BarChart3 className="w-4.5 h-4.5 transition-all duration-300 hover:scale-115" />
                  </div>
                  <h3 className="text-sm font-black uppercase text-[#001e66] dark:text-slate-200 tracking-wider">
                    Quick District Analytics
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* pH Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="text-left">
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">System Avg pH</span>
                      <div className="text-lg font-black text-[#001e66] dark:text-slate-200 mt-1">{phVal.toFixed(1)} pH</div>
                      {phVal < 6.5 || phVal > 8.5 ? (
                        <span className="text-[9px] text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/40 mt-1.5 inline-block">⚠️ ANOMALOUS</span>
                      ) : (
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-250/50 dark:border-emerald-900/40 mt-1.5 inline-block">✓ STABLE</span>
                      )}
                    </div>
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full border shrink-0 font-mono font-black text-xs ${
                      phVal < 6.5 || phVal > 8.5 ? "bg-rose-55 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40" : "bg-emerald-55 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/40"
                    }`}>
                      <span>{phVal.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Turbidity Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="text-left">
                      <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider block">Avg Turbidity</span>
                      <div className="text-lg font-black text-[#001e66] dark:text-slate-200 mt-1">{turbVal.toFixed(1)} NTU</div>
                      {turbVal > 5.0 ? (
                        <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40 mt-1.5 inline-block">⚠️ ELEVATED</span>
                      ) : (
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-250/50 dark:border-emerald-900/40 mt-1.5 inline-block">✓ OPTIMAL</span>
                      )}
                    </div>
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full border shrink-0 font-mono font-black text-xs ${
                      turbVal > 5.0 ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40" : "bg-[#eff6ff] dark:bg-blue-950/20 text-[#00aeef] dark:text-blue-300 border-blue-100 dark:border-blue-900/40"
                    }`}>
                      <span>{turbVal.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Pressure Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="text-left">
                      <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider block">Line Pressure</span>
                      <div className="text-lg font-black text-[#001e66] dark:text-slate-200 mt-1">{pressVal.toFixed(1)} PSI</div>
                      {pressVal <= 5.0 ? (
                        <span className="text-[9px] text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/40 mt-1.5 inline-block">❌ OFFLINE</span>
                      ) : pressVal < 30.0 ? (
                        <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40 mt-1.5 inline-block">⚠️ LOW PRESSURE</span>
                      ) : (
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-250/50 dark:border-emerald-900/40 mt-1.5 inline-block">✓ NOMINAL</span>
                      )}
                    </div>
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full border shrink-0 font-mono font-black text-xs ${
                      pressVal <= 5.0 ? "bg-rose-55 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40" :
                      pressVal < 30.0 ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40" :
                      "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-900/40"
                    }`}>
                      <span>{Math.round(pressVal)}</span>
                    </div>
                  </div>

                  {/* TDS Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="text-left">
                      <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider block">TDS / Minerals</span>
                      <div className="text-lg font-black text-[#001e66] dark:text-slate-200 mt-1">{tdsVal} ppm</div>
                      {tdsVal > 500 ? (
                        <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40 mt-1.5 inline-block">⚠️ HIGH MINERAL</span>
                      ) : (
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-250/50 dark:border-emerald-900/40 mt-1.5 inline-block">✓ SECURE</span>
                      )}
                    </div>
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full border shrink-0 font-mono font-black text-xs ${
                      tdsVal > 500 ? "bg-amber-55 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40" : "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-300 border-purple-100 dark:border-purple-900/40"
                    }`}>
                      <span>{tdsVal}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest News */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-[#001e66]/5 dark:bg-[#00aeef]/10 flex items-center justify-center text-[#001e66] dark:text-[#00aeef] shrink-0">
                    <Newspaper className="w-4.5 h-4.5 transition-all duration-300 hover:scale-115" />
                  </div>
                  <h3 className="text-sm font-black uppercase text-[#001e66] dark:text-slate-200 tracking-wider">
                    Latest District News
                  </h3>
                </div>

                <div className="space-y-3">
                  {newsList.length > 0 ? (
                    <div className="relative pb-6">
                      <div
                        className="space-y-3 pb-6"
                        style={{
                          maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
                          WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
                        }}
                      >
                        {newsList.map((news: any) => (
                          <div
                            key={news.id}
                            onClick={() => setActiveDetailNews(news)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 hover:border-[#00aeef] dark:hover:border-[#00aeef] transition-all cursor-pointer shadow-sm relative pr-28 text-left"
                          >
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">{news.date}</span>
                            <h4 className="font-black text-[#001e66] dark:text-slate-200 text-sm mt-1">{news.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5 line-clamp-2">
                              {news.description}
                            </p>
                            <span className={`absolute top-4 right-4 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                              news.tag === "CORE UPGRADE" ? "bg-blue-50 text-blue-600 border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40" :
                              news.tag === "COMPLIANCE" ? "bg-emerald-50 text-emerald-700 border-emerald-250/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40" :
                              "bg-slate-50 text-[#001e66] border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60"
                            }`}>
                              {news.tag}
                            </span>
                          </div>
                        ))}
                      </div>

                      {setActiveTab && (
                        <div className="absolute bottom-0 right-0 left-0 flex justify-center z-20">
                          <button
                            type="button"
                            onClick={() => setActiveTab("announcements")}
                            className="text-[10px] font-black text-[#00aeef] hover:text-[#001e66] dark:hover:text-white transition-all flex items-center gap-1 group cursor-pointer bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md active:scale-95"
                          >
                            See More Bulletins
                            <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-[13px] p-8 text-center text-slate-400 dark:text-slate-500 bg-slate-50/55 dark:bg-slate-950/20">
                      <p className="text-xs font-bold uppercase tracking-wider">No News Broadcasts Posted</p>
                      <p className="text-[11px] text-slate-500 mt-1">Operational announcements will appear here once published.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Advisories Panel Notice */}
              {(() => {
                const staffAdvisories = advisories
                  .filter(ad => ad.type === "warning" || ad.type === "info")
                  .slice(0, 2);

                return staffAdvisories.length > 0 ? (
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center space-x-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-[#001e66]/5 dark:bg-[#00aeef]/10 flex items-center justify-center text-[#001e66] dark:text-[#00aeef] shrink-0">
                        <Megaphone className="w-4 h-4 transition-all duration-300 hover:scale-115" />
                      </div>
                      <span className="text-[10px] font-black text-[#001e66] dark:text-[#00aeef] uppercase tracking-wider">
                        Active Staff Advisories ({staffAdvisories.length})
                      </span>
                    </div>

                    <div className="relative pb-6">
                      <div
                        className="space-y-2 pb-6"
                        style={{
                          maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
                          WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
                        }}
                      >
                        {staffAdvisories.map((ad) => (
                          <div
                            key={ad.id}
                            className={`border-l-[4px] rounded-r-2xl rounded-l-md p-3.5 shadow-sm text-left ${
                              ad.type === "warning"
                                ? "bg-red-50/60 dark:bg-red-950/10 border border-red-200 dark:border-red-900 border-l-red-500"
                                : "bg-blue-50/60 dark:bg-slate-900/40 border border-blue-200 dark:border-slate-800 border-l-blue-500"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                                ad.type === "warning" ? "bg-red-100 text-red-700 border-red-200/50 dark:bg-red-950 dark:text-red-400" : "bg-blue-100 text-blue-700 border-blue-200/50 dark:bg-blue-950 dark:text-blue-300"
                              }`}>
                                {ad.type.toUpperCase()}
                              </span>
                              <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">{ad.date}</span>
                            </div>
                            <h4 className={`text-xs font-black mt-2 leading-tight ${
                              ad.type === "warning" ? "text-red-950 dark:text-red-300" : "text-[#001e66] dark:text-blue-300"
                            }`}>
                              {ad.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-3">
                              {ad.text}
                            </p>
                          </div>
                        ))}
                      </div>

                      {setActiveTab && (
                        <div className="absolute bottom-0 right-0 left-0 flex justify-center z-20">
                          <button
                            type="button"
                            onClick={() => setActiveTab("announcements")}
                            className="text-[10px] font-black text-[#00aeef] hover:text-[#001e66] dark:hover:text-white transition-all flex items-center gap-1 group cursor-pointer bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md active:scale-95"
                          >
                            See More Advisories
                            <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#EEF4FC]/50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl p-4 text-center text-slate-400 dark:text-slate-500 mt-2">
                    <p className="text-xs font-bold uppercase tracking-wider">No Active Staff Advisories</p>
                    <p className="text-[11px] text-slate-500 mt-1">Global maintenance broadcasts will list here.</p>
                  </div>
                );
              })()}
            </div>

            {/* Right Column: Live Activity Feed & Events */}
            <div className="col-span-12 lg:col-span-4 space-y-[18px]">
              
              {/* Live Activity Feed */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-[#001e66]/5 dark:bg-[#00aeef]/10 flex items-center justify-center text-[#001e66] dark:text-[#00aeef] shrink-0">
                    <Zap className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-black uppercase text-[#001e66] dark:text-slate-200 tracking-wider">
                    Live Activity Feed
                  </h3>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {dynamicActivities.map((act) => {
                    const IconComponent = act.icon;
                    return (
                      <div 
                        key={act.id} 
                        className="group p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-xl flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all duration-200 hover:translate-x-0.5 hover:shadow-xs text-xs"
                      >
                        {/* Leading Icon Box */}
                        <div className={`w-8 h-8 rounded-lg ${act.iconBg} flex items-center justify-center shrink-0`}>
                          <IconComponent className={`w-4 h-4 ${act.iconColor} ${act.tag === "Sensor Alert" ? "animate-pulse" : ""}`} />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            {/* Category Pill Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${act.tagColor} ${act.badgeBg}`}>
                              {act.tag}
                            </span>
                            {/* Timestamp */}
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 font-semibold">
                              <Clock className="w-2.5 h-2.5" />
                              {act.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Message Content */}
                          <p className="text-slate-600 dark:text-slate-350 font-semibold leading-relaxed" title={act.text}>
                            {act.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Events */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-[#001e66]/5 dark:bg-[#00aeef]/10 flex items-center justify-center text-[#001e66] dark:text-[#00aeef] shrink-0">
                    <Calendar className="w-4.5 h-4.5 transition-all duration-300 hover:scale-115" />
                  </div>
                  <h3 className="text-sm font-black uppercase text-[#001e66] dark:text-slate-200 tracking-wider">
                    Upcoming District Events
                  </h3>
                </div>

                <div className="space-y-3.5">
                  {/* Visual Monthly Calendar Widget */}
                  {(() => {
                    const year = calDate.getFullYear();
                    const month = calDate.getMonth();
                    const monthName = calDate.toLocaleString("en-US", { month: "long" });

                    const firstDayIndex = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();

                    const daysArray: Array<number | null> = [];
                    for (let i = 0; i < firstDayIndex; i++) {
                      daysArray.push(null);
                    }
                    for (let i = 1; i <= daysInMonth; i++) {
                      daysArray.push(i);
                    }

                    const curMonthAbbr = calDate.toLocaleString("en-US", { month: "short" }).toUpperCase();

                    return (
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                        {/* Calendar Header with navigation buttons */}
                        <div className="flex justify-between items-center px-1">
                          <span className="text-xs font-black text-[#001e66] dark:text-slate-300 uppercase tracking-wider">{monthName} {year}</span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={handlePrevMonth}
                              className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center text-[10px] cursor-pointer shadow-sm active:scale-90 select-none font-bold"
                            >
                              ◀
                            </button>
                            <button
                              type="button"
                              onClick={handleNextMonth}
                              className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center text-[10px] cursor-pointer shadow-sm active:scale-90 select-none font-bold"
                            >
                              ▶
                            </button>
                          </div>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-2 text-center font-bold">
                          {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                            <span key={idx} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{d}</span>
                          ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2 text-center font-semibold">
                          {daysArray.map((dayNum, idx) => {
                            if (dayNum === null) {
                              return <div key={`empty-${idx}`} className="w-8 h-8" />;
                            }

                            const event = eventsList.find(e => Number(e.day) === dayNum && e.month.toUpperCase().startsWith(curMonthAbbr.substring(0, 3)));
                            const isToday = dayNum === 25 && month === 6 && year === 2026;

                            if (event) {
                              return (
                                <button
                                  key={`day-evt-${dayNum}`}
                                  type="button"
                                  onClick={() => setActiveDetailEvent(event)}
                                  title={event.title}
                                  className="w-8 h-8 text-[11px] font-black rounded-full flex items-center justify-center bg-[#00aeef] text-white ring-4 ring-[#00aeef]/20 shadow-md cursor-pointer mx-auto transition-transform hover:scale-110 active:scale-90"
                                >
                                  {dayNum}
                                </button>
                              );
                            }

                            return (
                              <div
                                key={`day-${dayNum}`}
                                className={`w-8 h-8 text-[11px] font-bold rounded-full flex items-center justify-center mx-auto transition-all ${
                                  isToday
                                    ? "border-2 border-[#001e66] dark:border-[#00aeef] text-[#001e66] dark:text-[#00aeef]"
                                    : "text-slate-550 dark:text-slate-450 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                                }`}
                              >
                                {dayNum}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* List Feed of Upcoming Events */}
                  <div className="space-y-2.5 pt-2">
                    {eventsList.length > 0 ? (
                      eventsList.map((evt: any) => (
                        <div
                          key={evt.id}
                          onClick={() => setActiveDetailEvent(evt)}
                          className="flex items-start space-x-3.5 cursor-pointer hover:opacity-85 transition-opacity"
                        >
                          <div className={`w-10 h-10 shrink-0 rounded-xl flex flex-col items-center justify-center font-black ${evt.color} shadow-sm`}>
                            <span className="text-[8px] uppercase tracking-wider">{evt.month}</span>
                            <span className="text-xs -mt-0.5">{evt.day}</span>
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <h4 className="font-extrabold text-[#001e66] dark:text-slate-200 text-xs truncate leading-tight">{evt.title}</h4>
                            <p className="text-[11px] text-slate-550 dark:text-slate-450 mt-0.5 line-clamp-1 leading-normal">{evt.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="border border-dashed border-slate-200 dark:border-slate-850 rounded-xl p-4 text-center text-slate-450 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30">
                        <p className="text-xs font-bold uppercase tracking-wider">No Scheduled Events</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
