import React, { useState, useEffect } from "react";
import { MapPin, Camera } from "lucide-react";

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
  if (u === "CRITICAL") return "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60";
  if (u === "HIGH" || u === "URGENT") return "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60";
  if (u === "MEDIUM") return "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900/60";
  return "bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
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
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[#001e66] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-[#001e66] dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
            />
          </div>
        </div>
      </div>

      {/* === Active Complaints Table === */}
      <div className="space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-[#001e66] uppercase tracking-wider">Active Complaints</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Current pending and in-progress tickets assigned to you</p>
        </div>

        <div className="overflow-hidden bg-white/40 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-[20px] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-[#EEF4FA]/40 dark:bg-slate-900 text-[#001e66]/80 dark:text-slate-300 font-black uppercase tracking-wider">
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5">Description</th>
                  <th className="py-3.5 px-5">Category &amp; Urgency</th>
                  <th className="py-3.5 px-5 text-center">Ticket Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70 dark:divide-slate-800/80 bg-white/20 dark:bg-slate-950/40">
                {paginatedActive.map((c) => (
                  <tr key={c.id} className="hover:bg-white/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* 1. ID */}
                    <td className="py-4.5 px-5 font-mono font-extrabold text-[#001e66] dark:text-slate-200 select-all">
                      AQ-{c.id.slice(0, 8).toUpperCase()}
                    </td>

                    {/* 2. Location */}
                    <td className="py-4.5 px-5">
                      <span
                        onClick={() => handleViewLocation(c.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[#001e66] dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 hover:border-blue-200 dark:hover:border-blue-700 uppercase tracking-wide cursor-pointer transition-colors shadow-sm active:scale-95"
                        title="Click to view on map"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#00aeef] dark:text-[#00aeef] shrink-0" />
                        <span>{c.barangay || "Outside Service Area"}</span>
                      </span>
                    </td>

                    {/* 3. Description */}
                    <td className="py-4.5 px-5 max-w-xs">
                      <div className="font-extrabold text-[#001e66] dark:text-slate-100 text-sm leading-snug">{c.summary}</div>
                      <div className="text-slate-700 dark:text-slate-400 font-medium italic mt-1 leading-relaxed">
                        "{c.rawText.length > 80 ? c.rawText.slice(0, 80) + "..." : c.rawText}"
                      </div>
                      {c.imageUrl && (
                        <div className="mt-2">
                          <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00aeef] hover:underline">
                            <Camera className="w-3 h-3 shrink-0" /> View Photo
                          </a>
                        </div>
                      )}
                    </td>

                    {/* 4. Category & Urgency */}
                    <td className="py-4.5 px-5 font-bold text-[#001e66] dark:text-slate-200 space-y-1">
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
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#00aeef] disabled:opacity-50 text-[#001e66] dark:text-slate-200 font-bold text-xs py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all cursor-pointer shadow-sm w-[160px] text-center"
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
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
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
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-transparent px-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Showing {activeStart + 1} to {Math.min(activeStart + 5, activeComplaints.length)} of {activeComplaints.length} active cases
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setActivePage(currentActivePage - 1)} disabled={currentActivePage === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#001e66] dark:text-slate-200 hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] dark:disabled:hover:text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed select-none">Previous</button>
              <span className="text-xs font-bold text-[#001e66] dark:text-slate-200">Page {currentActivePage} of {activeTotalPages}</span>
              <button onClick={() => setActivePage(currentActivePage + 1)} disabled={currentActivePage === activeTotalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#001e66] dark:text-slate-200 hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] dark:disabled:hover:text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed select-none">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* === Resolved Complaints History === */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-[#001e66] uppercase tracking-wider">Resolved Complaints History</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Resolved cases archived for compliance and historical tracking</p>
        </div>

        <div className="overflow-hidden bg-white/40 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-[20px] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Location</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">Category &amp; Urgency</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70 dark:divide-slate-800/80 bg-slate-50/10 dark:bg-slate-950/40">
                {paginatedResolved.map((c) => (
                  <tr key={c.id} className="hover:bg-white/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* 1. ID */}
                    <td className="py-4.5 px-5 font-mono text-slate-450 dark:text-slate-500 font-semibold select-all">
                      AQ-{c.id.slice(0, 8).toUpperCase()}
                    </td>

                    {/* 2. Location */}
                    <td className="py-4.5 px-5">
                      <span
                        onClick={() => handleViewLocation(c.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wide cursor-pointer transition-colors shadow-sm active:scale-95"
                        title="Click to view on map"
                      >
                        <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>{c.barangay || "Outside Service Area"}</span>
                      </span>
                    </td>

                    {/* 3. Description (muted + strikethrough) */}
                    <td className="py-4.5 px-5 max-w-xs">
                      <div className="text-slate-400 dark:text-slate-500 font-medium italic leading-relaxed line-through">
                        "{c.rawText.length > 80 ? c.rawText.slice(0, 80) + "..." : c.rawText}"
                      </div>
                      {c.imageUrl && (
                        <div className="mt-1.5">
                          <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:underline">
                            <Camera className="w-3 h-3 shrink-0" /> View Photo
                          </a>
                        </div>
                      )}
                    </td>

                    {/* 4. Category & Urgency */}
                    <td className="py-4.5 px-5 text-slate-400 dark:text-slate-500 font-bold space-y-1">
                      <span className="capitalize block">{c.category.replace(/_/g, " ").toLowerCase()}</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getUrgencyBadgeClass(c.urgency)}`}>
                        {c.urgency}
                      </span>
                    </td>

                    {/* 5. Complaint Status */}
                    <td className="py-4.5 px-5 text-center">
                      <div className="flex flex-col gap-1.5 items-center">
                        <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center shadow-sm">
                          ✓ Resolved
                        </span>
                        <select
                          value={c.status}
                          disabled={updatingComplaintId === c.id}
                          onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#00aeef] disabled:opacity-50 text-slate-500 dark:text-slate-400 font-bold text-[10px] py-1.5 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00aeef]/40 transition-all cursor-pointer w-[160px] text-center"
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
                    <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
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
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-transparent px-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Showing {resolvedStart + 1} to {Math.min(resolvedStart + 5, resolvedComplaints.length)} of {resolvedComplaints.length} resolved cases
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setResolvedPage(currentResolvedPage - 1)} disabled={currentResolvedPage === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#001e66] dark:text-slate-200 hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] dark:disabled:hover:text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed select-none">Previous</button>
              <span className="text-xs font-bold text-[#001e66] dark:text-slate-200">Page {currentResolvedPage} of {resolvedTotalPages}</span>
              <button onClick={() => setResolvedPage(currentResolvedPage + 1)} disabled={currentResolvedPage === resolvedTotalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#001e66] dark:text-slate-200 hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] dark:disabled:hover:text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed select-none">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
