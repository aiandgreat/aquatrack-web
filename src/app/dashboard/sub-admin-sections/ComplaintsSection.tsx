import React, { useState, useEffect } from "react";

interface Complaint {
  id: string;
  rawText: string;
  translatedText: string;
  summary: string;
  latitude: number;
  longitude: number;
  urgency: string;
  category: string;
  status: string;
  aiStatus: string;
  imageUrl: string;
  createdAt: string;
  barangay: string;
  assignedToId?: string | null;
}

interface ComplaintsSectionProps {
  filteredComplaints: Complaint[];
  complaintSearchQuery: string;
  setComplaintSearchQuery: (q: string) => void;
  filterAssignedOnly: boolean;
  setFilterAssignedOnly: (val: boolean) => void;
  updatingComplaintId: string | null;
  handleUpdateComplaintStatus: (id: string, status: string) => void;
  handleViewLocation: (id: string) => void;
}

const getUrgencyBadgeClass = (urgency: string) => {
  const u = urgency.toUpperCase();
  if (u === "CRITICAL") return "bg-red-100 text-red-800 border border-red-200";
  if (u === "HIGH" || u === "URGENT") return "bg-orange-100 text-orange-800 border border-orange-200";
  if (u === "MEDIUM") return "bg-yellow-100 text-yellow-900 border border-yellow-200";
  return "bg-slate-100 text-slate-650 border border-slate-200";
};

export default function ComplaintsSection({
  filteredComplaints,
  complaintSearchQuery,
  setComplaintSearchQuery,
  filterAssignedOnly,
  setFilterAssignedOnly,
  updatingComplaintId,
  handleUpdateComplaintStatus,
  handleViewLocation,
}: ComplaintsSectionProps) {
  const [activePage, setActivePage] = useState(1);
  const [resolvedPage, setResolvedPage] = useState(1);

  useEffect(() => {
    setActivePage(1);
    setResolvedPage(1);
  }, [complaintSearchQuery, filterAssignedOnly]);

  // Split into active and resolved
  const activeComplaints = filteredComplaints.filter((c) => c.status !== "RESOLVED");
  const resolvedComplaints = filteredComplaints.filter((c) => c.status === "RESOLVED");

  const activeTotalPages = Math.ceil(activeComplaints.length / 5) || 1;
  const resolvedTotalPages = Math.ceil(resolvedComplaints.length / 5) || 1;

  const currentActivePage = Math.max(1, Math.min(activePage, activeTotalPages));
  const currentResolvedPage = Math.max(1, Math.min(resolvedPage, resolvedTotalPages));

  const activeStart = (currentActivePage - 1) * 5;
  const resolvedStart = (currentResolvedPage - 1) * 5;

  const paginatedActive = activeComplaints.slice(activeStart, activeStart + 5);
  const paginatedResolved = resolvedComplaints.slice(resolvedStart, resolvedStart + 5);

  return (
    <div className="space-y-8 font-sans">
      {/* Header and Search / Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">Citizen Complaints Coordinator</h2>
          <p className="text-xs text-slate-500 font-bold">Track and update ticket resolution workflows</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* Filter Toggle */}
          <button
            onClick={() => setFilterAssignedOnly(!filterAssignedOnly)}
            className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm ${
              filterAssignedOnly
                ? "bg-[#00aeef] border-[#00aeef] text-white"
                : "bg-white border-slate-200 text-[#001e66] hover:bg-slate-50"
            }`}
          >
            {filterAssignedOnly ? "Show Assigned Only" : "Show All Complaints"}
          </button>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search text or location..."
              value={complaintSearchQuery}
              onChange={(e) => setComplaintSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#001e66] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
            />
          </div>
        </div>
      </div>

      {/* === Active Complaints Table === */}
      <div className="space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-[#001e66] uppercase tracking-wider">Active Complaints</h3>
          <p className="text-xs text-slate-400 font-medium">Current pending and in-progress tickets assigned to you</p>
        </div>

        <div className="overflow-hidden bg-white/40 border border-slate-200/80 rounded-[20px] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-[#EEF4FA]/40 text-[#001e66]/80 font-black uppercase tracking-wider">
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5">Description</th>
                  <th className="py-3.5 px-5">Category &amp; Urgency</th>
                  <th className="py-3.5 px-5 text-center">Ticket Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70 bg-white/20">
                {paginatedActive.map((c) => (
                  <tr key={c.id} className="hover:bg-white/60 transition-colors">
                    {/* 1. ID */}
                    <td className="py-4.5 px-5 font-mono font-extrabold text-[#001e66] select-all">
                      AQ-{c.id.slice(0, 8).toUpperCase()}
                    </td>

                    {/* 2. Location */}
                    <td className="py-4.5 px-5">
                      <span
                        onClick={() => handleViewLocation(c.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 hover:bg-blue-100 text-[#001e66] border border-blue-100 hover:border-blue-200 uppercase tracking-wide cursor-pointer transition-colors shadow-sm active:scale-95"
                        title="Click to view on map"
                      >
                        <svg className="w-3.5 h-3.5 text-[#00aeef] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span>{c.barangay || "Outside Service Area"}</span>
                      </span>
                    </td>

                    {/* 3. Description */}
                    <td className="py-4.5 px-5 max-w-xs">
                      <div className="font-extrabold text-[#001e66] text-sm leading-snug">{c.summary}</div>
                      <div className="text-slate-700 font-medium italic mt-1 leading-relaxed">
                        "{c.rawText.length > 80 ? c.rawText.slice(0, 80) + "..." : c.rawText}"
                      </div>
                      {c.imageUrl && (
                        <div className="mt-2">
                          <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00aeef] hover:underline">
                            📸 View Photo
                          </a>
                        </div>
                      )}
                    </td>

                    {/* 4. Category & Urgency */}
                    <td className="py-4.5 px-5 font-bold text-[#001e66] space-y-1">
                      <span className="capitalize block">{c.category.replace(/_/g, " ").toLowerCase()}</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getUrgencyBadgeClass(c.urgency)}`}>
                        {c.urgency}
                      </span>
                    </td>

                    {/* 5. Ticket Status */}
                    <td className="py-4.5 px-5 text-center">
                      <select
                        value={c.status}
                        disabled={updatingComplaintId === c.id}
                        onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value)}
                        className="bg-white border border-slate-200 hover:border-[#00aeef] disabled:opacity-50 text-[#001e66] font-bold text-xs py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all cursor-pointer shadow-sm w-[160px] text-center"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="EVALUATING">EVALUATING</option>
                        <option value="DISPATCHED" disabled={!c.assignedToId}>
                          DISPATCHED {!c.assignedToId ? "(Requires Assignment)" : ""}
                        </option>
                        <option value="ONGOING">ONGOING</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {activeComplaints.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                      No active complaints match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Pagination */}
        {activeTotalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 bg-white px-2">
            <span className="text-xs font-bold text-slate-500">
              Showing {activeStart + 1} to {Math.min(activeStart + 5, activeComplaints.length)} of {activeComplaints.length} active cases
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setActivePage(currentActivePage - 1)} disabled={currentActivePage === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#001e66] hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] transition-all cursor-pointer disabled:cursor-not-allowed select-none">Previous</button>
              <span className="text-xs font-bold text-[#001e66]">Page {currentActivePage} of {activeTotalPages}</span>
              <button onClick={() => setActivePage(currentActivePage + 1)} disabled={currentActivePage === activeTotalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#001e66] hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] transition-all cursor-pointer disabled:cursor-not-allowed select-none">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* === Resolved Complaints History === */}
      <div className="pt-6 border-t border-slate-200 space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-[#001e66] uppercase tracking-wider">Resolved Complaints History</h3>
          <p className="text-xs text-slate-400 font-medium">Resolved cases archived for compliance and historical tracking</p>
        </div>

        <div className="overflow-hidden bg-white/40 border border-slate-200/80 rounded-[20px] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/40 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Location</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">Category &amp; Urgency</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70 bg-slate-50/10">
                {paginatedResolved.map((c) => (
                  <tr key={c.id} className="hover:bg-white/60 transition-colors">
                    {/* 1. ID */}
                    <td className="py-4.5 px-5 font-mono text-slate-450 font-semibold select-all">
                      AQ-{c.id.slice(0, 8).toUpperCase()}
                    </td>

                    {/* 2. Location */}
                    <td className="py-4.5 px-5">
                      <span
                        onClick={() => handleViewLocation(c.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 uppercase tracking-wide cursor-pointer transition-colors shadow-sm active:scale-95"
                        title="Click to view on map"
                      >
                        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span>{c.barangay || "Outside Service Area"}</span>
                      </span>
                    </td>

                    {/* 3. Description (muted + strikethrough) */}
                    <td className="py-4.5 px-5 max-w-xs">
                      <div className="text-slate-400 font-medium italic leading-relaxed line-through">
                        "{c.rawText.length > 80 ? c.rawText.slice(0, 80) + "..." : c.rawText}"
                      </div>
                      {c.imageUrl && (
                        <div className="mt-1.5">
                          <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:underline">
                            📸 View Photo
                          </a>
                        </div>
                      )}
                    </td>

                    {/* 4. Category & Urgency */}
                    <td className="py-4.5 px-5 text-slate-400 font-bold space-y-1">
                      <span className="capitalize block">{c.category.replace(/_/g, " ").toLowerCase()}</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getUrgencyBadgeClass(c.urgency)}`}>
                        {c.urgency}
                      </span>
                    </td>

                    {/* 5. Complaint Status */}
                    <td className="py-4.5 px-5 text-center">
                      <div className="flex flex-col gap-1.5 items-center">
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center shadow-sm">
                          ✓ Resolved
                        </span>
                        <select
                          value={c.status}
                          disabled={updatingComplaintId === c.id}
                          onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value)}
                          className="bg-white border border-slate-200 hover:border-[#00aeef] disabled:opacity-50 text-slate-500 font-bold text-[10px] py-1.5 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00aeef]/40 transition-all cursor-pointer w-[160px] text-center"
                        >
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="PENDING">Reopen: PENDING</option>
                          <option value="EVALUATING">Reopen: EVALUATING</option>
                          <option value="DISPATCHED" disabled={!c.assignedToId}>
                            Reopen: DISPATCHED {!c.assignedToId ? "(Requires Assignment)" : ""}
                          </option>
                          <option value="ONGOING">Reopen: ONGOING</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {resolvedComplaints.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No resolved complaints in history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resolved Pagination */}
        {resolvedTotalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 bg-white px-2">
            <span className="text-xs font-bold text-slate-500">
              Showing {resolvedStart + 1} to {Math.min(resolvedStart + 5, resolvedComplaints.length)} of {resolvedComplaints.length} resolved cases
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setResolvedPage(currentResolvedPage - 1)} disabled={currentResolvedPage === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#001e66] hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] transition-all cursor-pointer disabled:cursor-not-allowed select-none">Previous</button>
              <span className="text-xs font-bold text-[#001e66]">Page {currentResolvedPage} of {resolvedTotalPages}</span>
              <button onClick={() => setResolvedPage(currentResolvedPage + 1)} disabled={currentResolvedPage === resolvedTotalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#001e66] hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] transition-all cursor-pointer disabled:cursor-not-allowed select-none">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
