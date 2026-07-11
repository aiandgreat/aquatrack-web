import React from "react";

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
  type: "warning" | "info";
  targetRole?: "broadcast" | "consumers" | "technicians";
}

interface HomeSectionProps {
  stats: DashboardStats;
  advisories: Advisory[];
  setActiveDetailNews: (news: any) => void;
  setActiveDetailEvent: (event: any) => void;
}

export default function HomeSection({
  stats,
  advisories,
  setActiveDetailNews,
  setActiveDetailEvent,
}: HomeSectionProps) {
  const newsList = []; // Empty per user request
  const eventsList = []; // Empty per user request

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
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
          <div className="bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center">
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              COMPLIANCE INDEX
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              {stats.complianceIndex}% PNSDW
            </span>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center">
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              ACTIVE IOT SENSORS
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              0 Online
            </span>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center">
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              UNRESOLVED REPORTS
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              0 Pending
            </span>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-[13px] h-[52px] px-3 flex flex-col justify-center">
            <span className="text-[8px] font-mono tracking-wider text-cyan-200 uppercase leading-none">
              ADVISORIES LOGGED
            </span>
            <span className="text-sm font-black mt-1 text-white leading-none">
              {advisories.length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Lower Content Grid */}
      <div className="grid grid-cols-12 gap-[18px]">
        {/* Left Column: Latest District News */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
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
                  className="bg-white border border-slate-200 rounded-[13px] p-4 hover:border-[#00aeef] transition-all cursor-pointer shadow-sm relative pr-28"
                >
                  <span className="text-[10px] font-bold text-slate-400">{news.date}</span>
                  <h4 className="font-black text-[#001e66] text-sm mt-1">{news.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1.5 line-clamp-2">
                    {news.description}
                  </p>
                  <span className={`absolute top-4 right-4 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                    news.tag === "CORE UPGRADE" ? "bg-blue-50 text-blue-600" :
                    news.tag === "COMPLIANCE" ? "bg-emerald-50 text-emerald-600" :
                    "bg-amber-50 text-amber-600"
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

        {/* Right Column: Events & Advisories */}
        <div className="col-span-12 lg:col-span-5 space-y-[18px]">
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
            <div className="bg-[#EEF4FC] border border-blue-100 rounded-[13px] p-4 space-y-3 shadow-sm">
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
