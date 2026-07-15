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
    <div className="space-y-8 animate-fade-in pb-8">
      
      {/* Immersive Water-Themed Hero Banner */}
      <div className="bg-gradient-to-br from-[#0B2E7A] via-[#05256e] to-[#189BFF] rounded-[24px] p-6 md:p-8 text-white relative overflow-hidden shadow-md min-h-[220px] flex flex-col justify-center">
        {/* Animated Wave Background SVG Overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 Q25,30 50,40 T100,40 L100,100 L0,100 Z" fill="rgba(255,255,255,0.08)"></path>
            <path d="M0,50 Q30,60 60,50 T100,50 L100,100 L0,100 Z" fill="rgba(255,255,255,0.04)"></path>
            {/* Little bubbles */}
            <circle cx="15" cy="30" r="1" fill="#fff" opacity="0.3" />
            <circle cx="20" cy="20" r="1.5" fill="#fff" opacity="0.4" />
            <circle cx="35" cy="45" r="0.8" fill="#fff" opacity="0.2" />
            <circle cx="65" cy="25" r="2" fill="#fff" opacity="0.3" />
            <circle cx="80" cy="35" r="1.2" fill="#fff" opacity="0.5" />
          </svg>
        </div>

        {/* Municipal Water Tower Illustration */}
        <svg className="absolute right-6 bottom-0 h-48 w-auto opacity-25 md:opacity-35 select-none pointer-events-none z-0" viewBox="0 0 100 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="40" rx="28" ry="18" fill="url(#heroTankGrad)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="22" y="40" width="56" height="15" fill="url(#heroTankGrad)" stroke="#ffffff" strokeWidth="1.5" />
          <ellipse cx="50" cy="54" rx="28" ry="10" fill="#55C5FF" opacity="0.8" />
          <ellipse cx="50" cy="30" rx="28" ry="10" fill="#ffffff" opacity="0.3" />
          <path d="M22 35 H78 M22 45 H78" stroke="#ffffff" strokeWidth="0.75" opacity="0.4" />
          <text x="50" y="49" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">AQUATRACK</text>
          <line x1="30" y1="52" x2="20" y2="150" stroke="#ffffff" strokeWidth="2.5" />
          <line x1="70" y1="52" x2="80" y2="150" stroke="#ffffff" strokeWidth="2.5" />
          <line x1="50" y1="54" x2="50" y2="150" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="30" y1="78" x2="70" y2="78" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
          <line x1="26" y1="110" x2="74" y2="110" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
          <line x1="30" y1="52" x2="70" y2="110" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
          <line x1="70" y1="52" x2="30" y2="110" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
          <rect x="15" y="148" width="9" height="6" rx="0.5" fill="#e2e8f0" opacity="0.9" />
          <rect x="76" y="148" width="9" height="6" rx="0.5" fill="#e2e8f0" opacity="0.9" />
          <rect x="46" y="148" width="8" height="6" rx="0.5" fill="#e2e8f0" opacity="0.9" />
          <defs>
            <linearGradient id="heroTankGrad" x1="50" y1="20" x2="50" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#189BFF" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative z-10 space-y-4 max-w-xl text-left">
          <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 shadow-inner">
            Sub-Admin Operations Command
          </span>
          <div>
            <h2 className="text-2xl md:text-3.5xl font-black tracking-tight drop-shadow-sm">
              Hello, Sub-Admin Officer!
            </h2>
            <p className="text-[11px] text-blue-100 font-bold tracking-wide mt-1.5 opacity-90">
              Operations portal for area incident dispatch • Account: {email || "operations@aquatrack.gov.ph"}
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
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(24,155,255,0.04)] hover:border-blue-100/50 hover:scale-[1.01] relative overflow-hidden group">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">My Assigned Incidents</span>
              <h3 className="text-3xl font-black text-[#0B2E7A] tracking-tight">
                {assignedComplaints.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50/80 flex items-center justify-center text-[#189BFF] border border-blue-100/40 shrink-0 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-4 relative z-10 text-left">Incidents assigned to you</p>
          
          <svg className="absolute bottom-0 left-0 w-full h-8 text-blue-500/5 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,160L48,149.3C96,139,192,117,288,128C384,139,480,181,576,181.3C672,181,768,139,864,117.3C960,96,1056,96,1152,117.3C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        {/* Active IoT Sensors Stat */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(24,155,255,0.04)] hover:border-blue-100/50 hover:scale-[1.01] relative overflow-hidden group">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Active IoT Sensors</span>
              <h3 className="text-3xl font-black text-[#0B2E7A] tracking-tight">
                {stats.onlineNodes} <span className="text-xs text-slate-400 font-bold">/ {stats.totalNodes}</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50/80 flex items-center justify-center text-amber-600 border border-amber-100/40 shrink-0 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.952 11.952 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-4 relative z-10 text-left">Online telemetry nodes in network</p>
          
          <svg className="absolute bottom-0 left-0 w-full h-8 text-amber-500/5 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,224L48,208C96,192,192,160,288,144C384,128,480,128,576,144C672,160,768,192,864,208C960,224,1056,224,1152,197.3C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        {/* Pending Classifications Stat */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(24,155,255,0.04)] hover:border-blue-100/50 hover:scale-[1.01] relative overflow-hidden group">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pending Classifications</span>
              <h3 className="text-3xl font-black text-[#0B2E7A] tracking-tight">
                {stats.unresolvedComplaints}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50/80 flex items-center justify-center text-emerald-600 border border-emerald-100/40 shrink-0 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-4 relative z-10 text-left">Active tickets awaiting evaluation</p>
          
          <svg className="absolute bottom-0 left-0 w-full h-8 text-emerald-500/5 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,96L48,128C96,160,192,224,288,240C384,256,480,224,576,181.3C672,139,768,85,864,90.7C960,96,1056,160,1152,192C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

      </div>

      {/* Priority Assigned Incidents Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between min-h-[380px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-[#0B2E7A] tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-3 bg-[#189BFF] rounded-full inline-block" />
              Priority Assigned Incidents
            </h3>
            <button 
              onClick={() => setActiveTab("complaints")}
              className="text-[10px] font-black text-[#189BFF] hover:text-[#0B2E7A] transition-colors uppercase tracking-wider font-sans"
            >
              View All &rarr;
            </button>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-50 text-left">
            {assignedComplaints.slice(0, 4).map((ticket) => {
              const isPending = ticket.status === "PENDING";
              const isEvaluating = ticket.status === "EVALUATING";
              const isDispatched = ticket.status === "DISPATCHED" || ticket.status === "ONGOING";
              return (
                <div key={ticket.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-colors group cursor-pointer" onClick={() => setActiveTab("complaints")}>
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[#189BFF] shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                        <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
                      </svg>
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-black text-[#0B2E7A] truncate group-hover:text-[#189BFF] transition-colors">
                        {ticket.summary}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        Urgency: <span className="text-rose-600 uppercase font-black">{ticket.urgency}</span> • Category: {ticket.category?.replace(/_/g, " ") || "UNCLASSIFIED"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 ml-4">
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                        isPending 
                          ? "bg-amber-50 text-amber-700 border-amber-200/50" 
                          : isEvaluating 
                          ? "bg-blue-50 text-blue-700 border-blue-200/50" 
                          : isDispatched 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200/50" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                      }`}>
                        {ticket.status}
                      </span>
                      {ticket.createdAt && (
                        <span className="text-[8px] text-slate-400 font-bold mt-1">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#189BFF] group-hover:translate-x-0.5 transition-all">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              );
            })}

            {assignedComplaints.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-black text-[#0B2E7A]">No Assigned Tickets</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">You have no priority incidents currently assigned.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setActiveTab("complaints")}
          className="w-full bg-slate-50 hover:bg-blue-50 text-[#0B2E7A] hover:text-[#189BFF] font-black text-xs py-3 rounded-xl uppercase tracking-wider border border-slate-100 transition-colors mt-6 text-center cursor-pointer"
        >
          Go to Incidents List
        </button>
      </div>

    </div>
  );
}
