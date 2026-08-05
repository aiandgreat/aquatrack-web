import React from "react";
import { 
  AlertTriangle, 
  Info, 
  Newspaper, 
  Calendar, 
  Megaphone, 
  Send, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Users, 
  Globe, 
  BellRing,
  PenTool
} from "lucide-react";

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
  newAdvisoryEventDate?: string;
  setNewAdvisoryEventDate?: (v: string) => void;
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
  newAdvisoryEventDate = "",
  setNewAdvisoryEventDate,
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
        return <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
      case "info":
        return <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      case "news":
        return <Newspaper className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case "event":
        return <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
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

  const getTargetIcon = (target?: string) => {
    switch (target) {
      case "consumers":
        return <Users className="w-3 h-3 text-slate-500 shrink-0" />;
      case "technicians":
        return <Users className="w-3 h-3 text-purple-500 shrink-0" />;
      default:
        return <Globe className="w-3 h-3 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
        <div className="p-2 bg-blue-50 text-[#001e66] rounded-xl shadow-inner">
          <BellRing className="w-5 h-5 text-[#00aeef] animate-swing" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">Community Announcements &amp; Advisories</h2>
          <p className="text-xs text-slate-500 font-bold">Broadcast operational warnings, news updates, or upcoming district events to citizen portals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Announcement Creation Form */}
        <form onSubmit={handleCreateAdvisory} className="lg:col-span-5 bg-white border border-slate-200/85 rounded-3xl p-5 space-y-4.5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PenTool className="w-4 h-4 text-[#00aeef]" />
            <h3 className="text-xs font-black text-[#001e66] uppercase tracking-wider">
              Create Community Broadcast
            </h3>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">Advisory Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Pipeline Maintenance Brgy. Del Pilar"
              value={newAdvisoryTitle}
              onChange={(e) => setNewAdvisoryTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[#001e66] font-bold text-xs py-2.5 px-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
            />
          </div>

          {/* Broadcast Type selector (Icon buttons) */}
          <div className="space-y-1.5">
            <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">Broadcast Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewAdvisoryType("warning")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                  newAdvisoryType === "warning"
                    ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-red-400 text-slate-600"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>WARNING</span>
              </button>
              <button
                type="button"
                onClick={() => setNewAdvisoryType("info")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                  newAdvisoryType === "info"
                    ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-600"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>INFO</span>
              </button>
              <button
                type="button"
                onClick={() => setNewAdvisoryType("news")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                  newAdvisoryType === "news"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-emerald-400 text-slate-600"
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>NEWS</span>
              </button>
              <button
                type="button"
                onClick={() => setNewAdvisoryType("event")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                  newAdvisoryType === "event"
                    ? "bg-purple-50 border-purple-500 text-purple-700 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-purple-400 text-slate-600"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>EVENT</span>
              </button>
            </div>
          </div>

          {/* Target Audience role selector */}
          <div className="space-y-1.5">
            <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">Target Audience Role</label>
            <div className="relative">
              <select
                value={newAdvisoryTargetRole}
                onChange={(e) => setNewAdvisoryTargetRole(e.target.value as any)}
                className="appearance-none w-full bg-slate-50 border border-slate-200 text-[#001e66] font-bold text-xs py-2.5 pl-8 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all cursor-pointer"
              >
                <option value="broadcast">Broadcast (All)</option>
                <option value="consumers">Consumers (Residents)</option>
                <option value="technicians">Technicians (Field Engineers)</option>
              </select>
              <Users className="absolute left-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Event scheduled date input if category is event */}
          {newAdvisoryType === "event" && setNewAdvisoryEventDate && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">Event Scheduled Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={newAdvisoryEventDate}
                  onChange={(e) => setNewAdvisoryEventDate(e.target.value)}
                  className="appearance-none w-full bg-slate-50 border border-slate-200 text-[#001e66] font-bold text-xs py-2.5 pl-8 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all cursor-pointer"
                />
                <Calendar className="absolute left-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Notice content description */}
          <div className="space-y-1.5">
            <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">Notice Content Description</label>
            <textarea
              required
              rows={4}
              placeholder="Please details parameters, times, and expected duration of maintenance..."
              value={newAdvisoryText}
              onChange={(e) => setNewAdvisoryText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[#001e66] font-bold text-xs py-2.5 px-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
            />
          </div>

          {/* Publish action button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold py-3 rounded-xl transition-all shadow-md hover:scale-[1.01] active:scale-99 border-none focus:outline-none text-xs uppercase tracking-wider cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Publish Broadcast Notice</span>
          </button>
        </form>

        {/* Broadcast Logs with Pagination */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#00aeef]" />
              <h3 className="text-xs font-black text-[#001e66] uppercase tracking-wider">
                Published Broadcast Logs ({advisories.length})
              </h3>
            </div>
            {advisories.length > 0 && (
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, advisories.length)} of {advisories.length}
              </span>
            )}
          </div>

          {/* Paginated Advisories Card list */}
          <div className="space-y-4">
            {paginatedAdvisories.map((ad) => (
              <div
                key={ad.id}
                className={`bg-white border border-slate-200 border-l-4 ${getBorderColor(ad.type)} rounded-2xl p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] relative pr-20 hover:shadow-md transition-all group`}
              >
                <div className="flex items-center space-x-2 gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{ad.date}</span>
                  </div>
                  
                  {/* Category Pill */}
                  <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    ad.type === "warning"
                      ? "bg-red-50 text-red-600 border-red-200"
                      : ad.type === "info"
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : ad.type === "news"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-purple-50 text-purple-600 border-purple-200"
                  }`}>
                    {getTypeIcon(ad.type)}
                    <span>{ad.type}</span>
                  </span>

                  {/* Target Pill */}
                  <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                    {getTargetIcon(ad.targetRole)}
                    <span>Target: {ad.targetRole || "broadcast"}</span>
                  </span>
                </div>

                <h4 className="font-black text-[#001e66] text-xs mt-2.5">{ad.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ad.text}</p>

                {/* Delete button on card */}
                <button
                  onClick={() => handleDeleteAdvisory(ad.id)}
                  className="absolute right-4.5 top-4.5 flex items-center gap-1 text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-lg transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            ))}

            {/* Empty advisory fallbacks */}
            {advisories.length === 0 && (
              <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                <div className="w-12 h-12 rounded-full bg-blue-50/50 flex items-center justify-center mx-auto mb-3">
                  <Megaphone className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400 italic font-semibold">No active community advisories.</p>
                <p className="text-[10px] text-slate-400 mt-1">Broadcast warnings or water alerts using the creation form.</p>
              </div>
            )}

            {/* Pagination Controls */}
            {maxPage > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 text-[#001e66] bg-white hover:bg-slate-50 disabled:opacity-40 text-xxs font-black tracking-wider uppercase transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed focus:outline-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="text-xxs font-black text-slate-500 uppercase tracking-widest">
                  Page {currentPage} of {maxPage}
                </span>
                <button
                  type="button"
                  disabled={currentPage === maxPage}
                  onClick={() => setCurrentPage((p) => Math.min(maxPage, p + 1))}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 text-[#001e66] bg-white hover:bg-slate-50 disabled:opacity-40 text-xxs font-black tracking-wider uppercase transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed focus:outline-none"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
