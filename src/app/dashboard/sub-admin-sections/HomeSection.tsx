import React from "react";
import { 
  ClipboardList, 
  Cpu, 
  AlertTriangle, 
  ArrowRight, 
  ChevronRight, 
  User, 
  Clock, 
  Sparkles, 
  Activity,
  Inbox,
  CheckCircle2
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  onlineNodes: number;
  totalNodes: number;
  unresolvedComplaints: number;
  complianceIndex: number;
}

interface Complaint {
  id: string;
  summary: string;
  urgency: string;
  category: string;
  status: string;
  barangay?: string;
  createdAt?: string | Date;
}

interface HomeSectionProps {
  stats: DashboardStats;
  assignedComplaints: Complaint[];
  setActiveTab: (tab: any) => void;
  email?: string | null;
}

export default function HomeSection({
  stats,
  assignedComplaints,
  setActiveTab,
  email,
}: HomeSectionProps) {
  return (
    <div className="space-y-8 animate-fade-in pb-8 font-sans">
      
      {/* Immersive Water-Themed Hero Banner */}
      <div className="relative rounded-[24px] p-6 md:p-8 text-white overflow-hidden shadow-md min-h-[220px] flex flex-col justify-center border border-slate-100/10 dark:border-slate-800/40">
        
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none z-0"
          style={{ backgroundImage: "url('/headerpic.png')", backgroundPosition: "center 25%" }}
        />

        {/* Dark Blue Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2E7A]/95 via-[#0B2E7A]/90 to-[#0B2E7A]/80 dark:from-[#001e66]/95 dark:via-[#001e66]/90 dark:to-[#001e66]/80 z-10 pointer-events-none" />
        
        {/* Wave Background SVG Overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none z-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 Q25,30 50,40 T100,40 L100,100 L0,100 Z" fill="rgba(255,255,255,0.08)"></path>
            <path d="M0,50 Q30,60 60,50 T100,50 L100,100 L0,100 Z" fill="rgba(255,255,255,0.04)"></path>
          </svg>
        </div>

        <div className="relative z-20 space-y-4 max-w-xl text-left">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 shadow-inner">
            <Sparkles className="w-3 h-3 text-[#00aeef]" />
            Sub-Admin Operations Command
          </span>
          <div>
            <h2 className="text-2xl md:text-3.5xl font-black tracking-tight drop-shadow-sm text-white">
              Hello, Sub-Admin Officer!
            </h2>
            <p className="text-[11px] text-blue-150 font-bold tracking-wide mt-2 opacity-90 leading-relaxed">
              Operations portal for area incident dispatch
            </p>
          </div>
          <div className="flex pt-1">
            <span className="inline-flex items-center gap-2 bg-[#189BFF]/25 border border-white/20 text-emerald-300 text-[10px] font-black tracking-wider px-3.5 py-1.5 rounded-full shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
              MUNICIPAL WATER SUPPLY IS NORMAL
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards (3 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Assigned Incidents Stat */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-150/40 hover:scale-[1.01] relative overflow-hidden group">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">My Assigned Complaints</span>
              <h3 className="text-3xl font-black text-[#0B2E7A] dark:text-slate-150 tracking-tight mt-1">
                {assignedComplaints.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 flex items-center justify-center border border-blue-100/40 dark:border-blue-900/40 shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm text-blue-600 dark:text-blue-400">
              <ClipboardList className="w-5 h-5 shrink-0" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-450 font-bold mt-4 relative z-10 text-left">Incidents assigned to you</p>
        </div>
 
        {/* Active IoT Sensors Stat */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-amber-150/40 hover:scale-[1.01] relative overflow-hidden group">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block">Active IoT Sensors</span>
              <h3 className="text-3xl font-black text-[#0B2E7A] dark:text-slate-150 tracking-tight mt-1">
                {stats.onlineNodes} <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">/ {stats.totalNodes}</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 flex items-center justify-center border border-amber-100/40 dark:border-amber-900/40 shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm text-amber-600 dark:text-amber-400">
              <Cpu className="w-5 h-5 shrink-0" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-450 font-bold mt-4 relative z-10 text-left">Online telemetry nodes in network</p>
        </div>
 
        {/* Pending Classifications Stat */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-150/40 hover:scale-[1.01] relative overflow-hidden group">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest block">Pending Classifications</span>
              <h3 className="text-3xl font-black text-[#0B2E7A] dark:text-slate-150 tracking-tight mt-1">
                {stats.unresolvedComplaints}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-100/40 dark:border-emerald-900/40 shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm text-emerald-600 dark:text-emerald-450">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-450 font-bold mt-4 relative z-10 text-left">Active tickets awaiting evaluation</p>
        </div>
 
      </div>
 
      {/* Priority Assigned Incidents Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between min-h-[380px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h3 className="text-xs font-black text-[#0B2E7A] dark:text-slate-200 tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-3 bg-[#189BFF] rounded-full inline-block" />
              Priority Assigned Incidents
            </h3>
            <button 
              onClick={() => setActiveTab("complaints")}
              className="text-[10px] font-black text-[#189BFF] hover:text-[#0B2E7A] dark:hover:text-white transition-colors uppercase tracking-wider font-sans flex items-center gap-1 group cursor-pointer"
            >
              View All 
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
 
          {/* List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-left">
            {assignedComplaints.slice(0, 4).map((ticket) => {
              const isPending = ticket.status === "PENDING";
              const isEvaluating = ticket.status === "EVALUATING";
              const isDispatched = ticket.status === "DISPATCHED" || ticket.status === "ONGOING";
              return (
                <div 
                  key={ticket.id} 
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-950/30 px-2 rounded-xl transition-colors group cursor-pointer" 
                  onClick={() => setActiveTab("complaints")}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50 dark:border-blue-900/40 text-[#189BFF] dark:text-blue-400">
                      <ClipboardList className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-black text-[#0B2E7A] dark:text-slate-200 truncate group-hover:text-[#189BFF] transition-colors">
                        {ticket.summary}
                      </p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">
                        Urgency: <span className="text-rose-600 dark:text-rose-400 uppercase font-black">{ticket.urgency}</span> • Category: {ticket.category?.replace(/_/g, " ") || "UNCLASSIFIED"}
                      </p>
                    </div>
                  </div>
 
                  <div className="flex items-center space-x-3 shrink-0 ml-4">
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${
                        isPending 
                          ? "bg-amber-50 text-amber-700 border-amber-250/70 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40" 
                          : isEvaluating 
                          ? "bg-blue-50 text-blue-700 border-blue-250/70 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40" 
                          : isDispatched 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-250/70 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-250/70 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40"
                      }`}>
                        {ticket.status}
                      </span>
                      {ticket.createdAt && (
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono font-bold mt-1">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-350 dark:text-slate-650 group-hover:text-[#189BFF] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
 
            {assignedComplaints.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50/80 dark:bg-emerald-950/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40 shadow-sm text-emerald-600 dark:text-emerald-450">
                  <CheckCircle2 className="w-5 h-5 shrink-0 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#0B2E7A] dark:text-slate-300">No Assigned Tickets</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">You have no priority incidents currently assigned.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setActiveTab("complaints")}
          className="w-full bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-slate-900 text-[#0B2E7A] dark:text-[#189BFF] hover:text-[#189BFF] font-black text-xs py-3.5 rounded-xl uppercase tracking-wider border border-slate-100 dark:border-slate-805 transition-colors mt-6 text-center cursor-pointer active:scale-[0.99]"
        >
          Go to Incidents List
        </button>
      </div>

    </div>
  );
}
