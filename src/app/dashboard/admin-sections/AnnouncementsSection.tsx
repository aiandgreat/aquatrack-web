import React from "react";

interface Advisory {
  id: string;
  date: string;
  title: string;
  text: string;
  type: "warning" | "info";
  targetRole?: "broadcast" | "consumers" | "technicians";
}

interface AnnouncementsSectionProps {
  advisories: Advisory[];
  newAdvisoryTitle: string;
  setNewAdvisoryTitle: (v: string) => void;
  newAdvisoryText: string;
  setNewAdvisoryText: (v: string) => void;
  newAdvisoryType: "warning" | "info";
  setNewAdvisoryType: (v: "warning" | "info") => void;
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
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-lg font-black text-[#001e66] tracking-tight">Community Announcements &amp; Advisories</h2>
        <p className="text-xs text-slate-500 font-medium font-bold">Broadcast operational warnings or system updates to citizen portals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Announcement Creation Form */}
        <form onSubmit={handleCreateAdvisory} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Create Community Broadcast
          </h3>

          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase">Advisory Title</label>
            <input
              type="text"
              placeholder="e.g. Pipeline Maintenance Brgy. Del Pilar"
              value={newAdvisoryTitle}
              onChange={(e) => setNewAdvisoryTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 text-[#001e66] font-bold text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#00aeef]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase">Alert Severity Level</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewAdvisoryType("warning")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  newAdvisoryType === "warning"
                    ? "bg-[#970006]/10 border-[#970006] text-[#970006]"
                    : "bg-white border-slate-200 hover:border-[#970006] text-[#001e66]"
                }`}
              >
                WARNING
              </button>
              <button
                type="button"
                onClick={() => setNewAdvisoryType("info")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  newAdvisoryType === "info"
                    ? "bg-[#00aeef]/10 border-[#00aeef] text-[#00aeef]"
                    : "bg-white border-slate-200 hover:border-[#00aeef] text-[#001e66]"
                }`}
              >
                INFO
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase">Target Audience Role</label>
            <select
              value={newAdvisoryTargetRole}
              onChange={(e) => setNewAdvisoryTargetRole(e.target.value as any)}
              className="w-full bg-white border border-slate-200 text-[#001e66] font-bold text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#00aeef]"
            >
              <option value="broadcast">Broadcast (All)</option>
              <option value="consumers">Consumers (Residents)</option>
              <option value="technicians">Technicians (Field Engineers)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase">Notice Content Description</label>
            <textarea
              rows={4}
              placeholder="Please details parameters, times, and expected duration of maintenance..."
              value={newAdvisoryText}
              onChange={(e) => setNewAdvisoryText(e.target.value)}
              className="w-full bg-white border border-slate-200 text-[#001e66] font-bold text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#00aeef]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold py-3 rounded-xl transition-all shadow-sm text-xs uppercase tracking-wider"
          >
            Publish Broadcast Notice
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Published Broadcast Logs
          </h3>
          <div className="space-y-3">
            {advisories.map((ad) => (
              <div key={ad.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative pr-20">
                <div className="flex items-center space-x-2 gap-2">
                  <span className="text-[10px] font-bold text-slate-400">{ad.date}</span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                    ad.type === "warning" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {ad.type}
                  </span>
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Target: {ad.targetRole || "broadcast"}
                  </span>
                </div>
                <h4 className="font-extrabold text-[#001e66] text-xs mt-1.5">{ad.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ad.text}</p>

                <button
                  onClick={() => handleDeleteAdvisory(ad.id)}
                  className="absolute right-4 top-4 text-[#970006] hover:underline font-bold text-[10px] uppercase tracking-wider"
                >
                  Delete
                </button>
              </div>
            ))}
            {advisories.length === 0 && (
              <p className="text-xs text-slate-400 italic">No community advisories active.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
