import React from "react";

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
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-[#063A8C] via-[#076DB2] to-[#08AEEA] rounded-[17px] min-h-[220px] p-6 text-white flex flex-col justify-between shadow-md shadow-blue-950/20 relative overflow-hidden">
        <div className="space-y-2 z-10 relative">
          <div className="border border-cyan-300 text-cyan-200 text-[9px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full w-fit uppercase bg-white/5">
            SUB-ADMIN OPERATIONS COMMAND
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-3">
            Hello, Sub-Admin Officer!
          </h2>
          <p className="text-xs text-white/95 leading-relaxed max-w-[650px]">
            Incident coordination and monitoring portal designed for managing assigned complaints, tracking telemetry indicators in your designated areas, and working closely with administrators to maintain water quality standards.
          </p>
        </div>

        {/* Statistics Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10 z-10 relative">
          <div className="bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center">
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              MY ASSIGNED INCIDENTS
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              {assignedComplaints.length} Tickets
            </span>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center">
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              ACTIVE IOT SENSORS
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              {stats.onlineNodes} / {stats.totalNodes} Online
            </span>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center">
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              TOTAL PENDING CLASSIFICATIONS
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              {stats.unresolvedComplaints} Active
            </span>
          </div>
        </div>
      </div>

      {/* Quick Assigned List */}
      <div className="bg-slate-50 border border-slate-200 rounded-[18px] p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Priority Assigned Incidents
          </h3>
          <button
            onClick={() => setActiveTab("complaints")}
            className="text-xs font-black text-[#00aeef] hover:underline"
          >
            View All &rarr;
          </button>
        </div>

        <div className="divide-y divide-slate-200">
          {assignedComplaints.slice(0, 5).map((c) => (
            <div key={c.id} className="py-3 flex justify-between items-center">
              <div>
                <div className="font-extrabold text-sm text-[#001e66]">{c.summary}</div>
                <div className="text-xxs font-bold text-slate-400 mt-0.5">
                  Urgency: <span className="text-rose-600">{c.urgency}</span> • Category: {c.category}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xxs font-black ${
                c.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                c.status === "EVALUATING" ? "bg-blue-100 text-blue-700" :
                c.status === "DISPATCHED" ? "bg-indigo-100 text-indigo-700" :
                "bg-emerald-100 text-emerald-700"
              }`}>
                {c.status}
              </span>
            </div>
          ))}
          {assignedComplaints.length === 0 && (
            <p className="text-slate-500 italic text-xs py-4 text-center">No complaints currently assigned to you.</p>
          )}
        </div>
      </div>
    </div>
  );
}
