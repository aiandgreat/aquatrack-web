import React from "react";

interface Advisory {
  id: string;
  date: string;
  title: string;
  text: string;
  type: "warning" | "info" | "news" | "event";
  targetRole?: "broadcast" | "consumers" | "technicians";
}

interface AnnouncementsSectionProps {
  advisories: Advisory[];
  newAdvisoryTitle: string;
  setNewAdvisoryTitle: (v: string) => void;
  newAdvisoryText: string;
  setNewAdvisoryText: (v: string) => void;
  newAdvisoryType: "warning" | "info" | "news" | "event";
  setNewAdvisoryType: (v: "warning" | "info" | "news" | "event") => void;
  newAdvisoryTargetRole: "broadcast" | "consumers" | "technicians";
  setNewAdvisoryTargetRole: (v: "broadcast" | "consumers" | "technicians") => void;
  handleCreateAdvisory: (e: React.FormEvent) => void;
  handleDeleteAdvisory: (id: string) => void;
}

export default function AnnouncementsSection({
  advisories,
  newAdvisoryTitle,
  setNewAdvisoryTitle,
  newAdvisoryText,
  setNewAdvisoryText,
  newAdvisoryType,
  setNewAdvisoryType,
  newAdvisoryTargetRole,
  setNewAdvisoryTargetRole,
  handleCreateAdvisory,
  handleDeleteAdvisory,
}: AnnouncementsSectionProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  const maxPage = Math.max(1, Math.ceil(advisories.length / itemsPerPage));

  React.useEffect(() => {
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [advisories.length, maxPage, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdvisories = advisories.slice(startIndex, startIndex + itemsPerPage);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "info":
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "news":
        return (
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case "event":
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "warning": return "border-l-red-500";
      case "info": return "border-l-blue-500";
      case "news": return "border-l-emerald-500";
      case "event": return "border-l-purple-500";
      default: return "border-l-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-lg font-black text-[#001e66] tracking-tight">Community Announcements &amp; Advisories</h2>
        <p className="text-xs text-slate-500 font-bold">Broadcast operational warnings, news updates, or upcoming district events to citizen portals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Announcement Creation Form */}
        <form onSubmit={handleCreateAdvisory} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
            Create Community Broadcast
          </h3>

          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Advisory Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Pipeline Maintenance Brgy. Del Pilar"
              value={newAdvisoryTitle}
              onChange={(e) => setNewAdvisoryTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 text-[#001e66] font-bold text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Broadcast Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewAdvisoryType("warning")}
                className={`py-2 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                  newAdvisoryType === "warning"
                    ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                    : "bg-white border-slate-200 hover:border-red-500 text-[#001e66]"
                }`}
              >
                WARNING
              </button>
              <button
                type="button"
                onClick={() => setNewAdvisoryType("info")}
                className={`py-2 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                  newAdvisoryType === "info"
                    ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                    : "bg-white border-slate-200 hover:border-blue-500 text-[#001e66]"
                }`}
              >
                INFO
              </button>
              <button
                type="button"
                onClick={() => setNewAdvisoryType("news")}
                className={`py-2 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                  newAdvisoryType === "news"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                    : "bg-white border-slate-200 hover:border-emerald-500 text-[#001e66]"
                }`}
              >
                NEWS
              </button>
              <button
                type="button"
                onClick={() => setNewAdvisoryType("event")}
                className={`py-2 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                  newAdvisoryType === "event"
                    ? "bg-purple-50 border-purple-500 text-purple-700 shadow-sm"
                    : "bg-white border-slate-200 hover:border-purple-500 text-[#001e66]"
                }`}
              >
                EVENT
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Target Audience Role</label>
            <select
              value={newAdvisoryTargetRole}
              onChange={(e) => setNewAdvisoryTargetRole(e.target.value as any)}
              className="w-full bg-white border border-slate-200 text-[#001e66] font-bold text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all cursor-pointer"
            >
              <option value="broadcast">Broadcast (All)</option>
              <option value="consumers">Consumers (Residents)</option>
              <option value="technicians">Technicians (Field Engineers)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Notice Content Description</label>
            <textarea
              required
              rows={4}
              placeholder="Please details parameters, times, and expected duration of maintenance..."
              value={newAdvisoryText}
              onChange={(e) => setNewAdvisoryText(e.target.value)}
              className="w-full bg-white border border-slate-200 text-[#001e66] font-bold text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold py-3 rounded-xl transition-all shadow-sm text-xs uppercase tracking-wider cursor-pointer"
          >
            Publish Broadcast Notice
          </button>
        </form>

        {/* Broadcast Logs with Pagination */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-xs font-black text-slate-405 uppercase tracking-wider">
              Published Broadcast Logs ({advisories.length})
            </h3>
            {advisories.length > 0 && (
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, advisories.length)} of {advisories.length}
              </span>
            )}
          </div>

          <div className="space-y-3.5">
            {paginatedAdvisories.map((ad) => (
              <div
                key={ad.id}
                className={`bg-white border border-slate-200 border-l-4 ${getBorderColor(ad.type)} rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative pr-20 hover:shadow-md hover:border-slate-350 transition-all group`}
              >
                <div className="flex items-center space-x-2 gap-2 flex-wrap">
                  <div className="flex items-center space-x-1 text-slate-400">
                    {getTypeIcon(ad.type)}
                    <span className="text-[10px] font-bold">{ad.date}</span>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                    ad.type === "warning"
                      ? "bg-red-50 text-red-600 border-red-200"
                      : ad.type === "info"
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : ad.type === "news"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-purple-50 text-purple-600 border-purple-200"
                  }`}>
                    {ad.type}
                  </span>
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Target: {ad.targetRole || "broadcast"}
                  </span>
                </div>
                <h4 className="font-extrabold text-[#001e66] text-xs mt-2.5">{ad.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ad.text}</p>

                <button
                  onClick={() => handleDeleteAdvisory(ad.id)}
                  className="absolute right-4 top-4 text-red-500 hover:text-red-700 opacity-60 group-hover:opacity-100 transition-all font-bold text-[9px] uppercase tracking-wider cursor-pointer border border-transparent hover:border-red-200 hover:bg-red-50/50 px-2 py-1 rounded-lg"
                >
                  Delete
                </button>
              </div>
            ))}

            {advisories.length === 0 && (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <div className="text-3xl mb-2 text-slate-350">📢</div>
                <p className="text-xs text-slate-400 italic">No community advisories active.</p>
                <p className="text-[10px] text-slate-400 mt-1">Broadcast warnings or events using the panel on the left.</p>
              </div>
            )}

            {/* Pagination Controls */}
            {maxPage > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-[#001e66] bg-white hover:bg-slate-50 disabled:opacity-40 text-xxs font-black tracking-wider uppercase transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-xxs font-black text-slate-500 uppercase tracking-widest">
                  Page {currentPage} of {maxPage}
                </span>
                <button
                  type="button"
                  disabled={currentPage === maxPage}
                  onClick={() => setCurrentPage((p) => Math.min(maxPage, p + 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-[#001e66] bg-white hover:bg-slate-50 disabled:opacity-40 text-xxs font-black tracking-wider uppercase transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
