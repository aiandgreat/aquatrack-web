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
  assignedToId?: string | null;
  barangay: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface ReportsSectionProps {
  complaints: Complaint[];
  complaintSearchQuery: string;
  setComplaintSearchQuery: (q: string) => void;
  updatingComplaintId: string | null;
  handleUpdateComplaintStatus: (id: string, status: string) => void;
  users: User[];
  handleUpdateComplaintAssignment: (id: string, assignedToId: string) => void;
  handleViewLocation: (id: string) => void;
}

export default function ReportsSection({
  complaints,
  complaintSearchQuery,
  setComplaintSearchQuery,
  updatingComplaintId,
  handleUpdateComplaintStatus,
  users,
  handleUpdateComplaintAssignment,
  handleViewLocation,
}: ReportsSectionProps) {
  const [sortBy, setSortBy] = useState<"date" | "barangay-asc" | "barangay-desc" | "urgency">("date");
  const [filterBarangay, setFilterBarangay] = useState<string>("all");
  const [activePage, setActivePage] = useState(1);
  const [resolvedPage, setResolvedPage] = useState(1);

  // Reset pagination to page 1 whenever filters or search query changes
  useEffect(() => {
    setActivePage(1);
    setResolvedPage(1);
  }, [complaintSearchQuery, sortBy, filterBarangay]);

  // Separate resolved (history) from active complaints
  const activeComplaints = complaints.filter((c) => c.status !== "RESOLVED");
  const resolvedComplaints = complaints.filter((c) => c.status === "RESOLVED");

  // Extract unique list of barangays present in the complaints
  const uniqueBarangays = Array.from(
    new Set(complaints.map((c) => c.barangay).filter(Boolean))
  ).sort();

  const applyFiltersAndSort = (list: Complaint[]) => {
    let result = [...list];

    // Search filter
    if (complaintSearchQuery.trim()) {
      const q = complaintSearchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.rawText.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          (c.barangay && c.barangay.toLowerCase().includes(q))
      );
    }

    // Barangay filter
    if (filterBarangay !== "all") {
      result = result.filter((c) => c.barangay === filterBarangay);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "barangay-asc") {
        return (a.barangay || "").localeCompare(b.barangay || "");
      }
      if (sortBy === "barangay-desc") {
        return (b.barangay || "").localeCompare(a.barangay || "");
      }
      if (sortBy === "urgency") {
        const priority: Record<string, number> = { CRITICAL: 4, HIGH: 3, URGENT: 3, MEDIUM: 2, LOW: 1 };
        const aVal = priority[a.urgency] || 0;
        const bVal = priority[b.urgency] || 0;
        return bVal - aVal;
      }
      // default: newest date first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  };

  const filteredActive = applyFiltersAndSort(activeComplaints);
  const filteredResolved = applyFiltersAndSort(resolvedComplaints);

  const activeTotalPages = Math.ceil(filteredActive.length / 5) || 1;
  const resolvedTotalPages = Math.ceil(filteredResolved.length / 5) || 1;

  const currentActivePage = Math.max(1, Math.min(activePage, activeTotalPages));
  const currentResolvedPage = Math.max(1, Math.min(resolvedPage, resolvedTotalPages));

  const activeStart = (currentActivePage - 1) * 5;
  const paginatedActive = filteredActive.slice(activeStart, activeStart + 5);

  const resolvedStart = (currentResolvedPage - 1) * 5;
  const paginatedResolved = filteredResolved.slice(resolvedStart, resolvedStart + 5);

  return (
    <div className="space-y-8">
      {/* Header and Search / Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">Citizen Complaints Database</h2>
          <p className="text-xs text-slate-500 font-bold">Verify AI translation classification and dispatch field operations</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* Barangay Filter */}
          <select
            value={filterBarangay}
            onChange={(e) => setFilterBarangay(e.target.value)}
            className="bg-white border border-slate-200 text-[#001e66] font-bold text-xs py-2 px-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/30 transition-all"
          >
            <option value="all">📍 All Barangays</option>
            {uniqueBarangays.map((b) => (
              <option key={b} value={b}>📍 {b}</option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 text-[#001e66] font-bold text-xs py-2 px-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/30 transition-all"
          >
            <option value="date">Sort: Newest First</option>
            <option value="barangay-asc">Sort: Barangay (A-Z)</option>
            <option value="barangay-desc">Sort: Barangay (Z-A)</option>
            <option value="urgency">Sort: Urgency (Highest)</option>
          </select>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by text or location…"
              value={complaintSearchQuery}
              onChange={(e) => setComplaintSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#001e66] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
            />
          </div>
        </div>
      </div>

      {/* 1. Active Complaints Table */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-black text-[#001e66] uppercase tracking-wider">Active Complaints</h3>
          <p className="text-xs text-slate-400">Current active dispatches and pending incidents undergoing evaluation</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Citizen Report</th>
                <th className="py-3 px-4">AI Class &amp; Urgency</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Ticket Status</th>
                <th className="py-3 px-4">Assign Field Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedActive.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 space-y-1.5">
                    <div className="font-extrabold text-[#001e66] text-sm">{c.summary}</div>
                    <div className="text-slate-600 font-medium italic">"{c.rawText}"</div>
                    {c.translatedText && (
                      <div className="text-xxs text-[#00aeef] font-semibold mt-1">
                        🇺🇸 Translation: "{c.translatedText}"
                      </div>
                    )}
                    {c.imageUrl && (
                      <div className="mt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Attached Photo</span>
                        <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block relative rounded-lg border border-slate-200 overflow-hidden group">
                          <img src={c.imageUrl} alt="Complaint Media" className="w-24 h-16 object-cover group-hover:opacity-80 transition-opacity" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[8px] font-black text-white uppercase tracking-wider">🔎 Open</span>
                          </div>
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                        📍 {c.barangay || "Outside Service Area"}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 select-all mt-1">{c.id}</div>
                  </td>
                  <td className="py-4 px-4 space-y-1">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                        c.urgency === "CRITICAL" ? "bg-red-100 text-red-800" :
                        c.urgency === "HIGH" ? "bg-amber-100 text-amber-800" :
                        "bg-slate-100 text-slate-800"
                      }`}>
                        {c.urgency}
                      </span>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        {c.category}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-600 font-bold space-y-1.5">
                    <button
                      onClick={() => handleViewLocation(c.id)}
                      className="flex items-center gap-1 bg-[#EEF4FA] hover:bg-[#00aeef] text-[#001e66] hover:text-white font-black text-[9px] py-1.5 px-3 rounded-lg border border-slate-200 hover:border-[#00aeef] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      🗺️ View Map
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={c.status}
                      disabled={updatingComplaintId === c.id}
                      onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value)}
                      className="bg-white border border-slate-200 hover:border-[#00aeef] disabled:opacity-50 text-[#001e66] font-bold text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="EVALUATING">EVALUATING</option>
                      <option value="DISPATCHED">DISPATCHED</option>
                      <option value="ONGOING">ONGOING</option>
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={c.assignedToId || ""}
                      disabled={updatingComplaintId === c.id}
                      onChange={(e) => handleUpdateComplaintAssignment(c.id, e.target.value)}
                      className="bg-white border border-slate-200 hover:border-[#00aeef] disabled:opacity-50 text-[#001e66] font-bold text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all"
                    >
                      <option value="">Unassigned</option>
                      {users
                        .filter((u) => u.role === "FIELD_ENGINEER_TECHNICIAN")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filteredActive.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    No active citizen complaints match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {activeTotalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 bg-white px-2">
            <span className="text-xs font-bold text-slate-500">
              Showing {activeStart + 1} to {Math.min(activeStart + 5, filteredActive.length)} of {filteredActive.length} active cases
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePage(currentActivePage - 1)}
                disabled={currentActivePage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#001e66] hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] transition-all cursor-pointer disabled:cursor-not-allowed select-none"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-[#001e66]">
                Page {currentActivePage} of {activeTotalPages}
              </span>
              <button
                onClick={() => setActivePage(currentActivePage + 1)}
                disabled={currentActivePage === activeTotalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#001e66] hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] transition-all cursor-pointer disabled:cursor-not-allowed select-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Complaint History (Audit Trail) */}
      <div className="pt-6 border-t border-slate-200 space-y-4">
        <div>
          <h3 className="text-sm font-black text-[#001e66] uppercase tracking-wider">Complaint History (Audit Trail)</h3>
          <p className="text-xs text-slate-400">Resolved cases archived for compliance audits and historical performance tracking</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Resolved Incident</th>
                <th className="py-3 px-4">AI Class &amp; Urgency</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-slate-50/30">
              {paginatedResolved.map((c) => {
                const assignedUser = users.find((u) => u.id === c.assignedToId);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 space-y-1.5">
                      <div className="font-extrabold text-slate-500 text-sm line-through">{c.summary}</div>
                      <div className="text-slate-500 font-medium italic">"{c.rawText}"</div>
                      {c.translatedText && (
                        <div className="text-xxs text-slate-400 font-semibold mt-1">
                          🇺🇸 Translation: "{c.translatedText}"
                        </div>
                      )}
                      {c.imageUrl && (
                        <div className="mt-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Attached Photo</span>
                          <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block relative rounded-lg border border-slate-200 overflow-hidden group">
                            <img src={c.imageUrl} alt="Complaint Media" className="w-24 h-16 object-cover group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[8px] font-black text-white uppercase tracking-wider">🔎 Open</span>
                            </div>
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-400 border border-slate-200 uppercase tracking-wide">
                          📍 {c.barangay || "Outside Service Area"}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 select-all mt-1">{c.id}</div>
                    </td>
                    <td className="py-4 px-4 space-y-1">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-400">
                          {c.urgency}
                        </span>
                      </div>
                      <div className="pt-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          {c.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500 font-bold space-y-1.5">
                      <button
                        onClick={() => handleViewLocation(c.id)}
                        className="flex items-center gap-1 bg-[#EEF4FA] hover:bg-[#00aeef] text-[#001e66] hover:text-white font-black text-[9px] py-1.5 px-3 rounded-lg border border-slate-200 hover:border-[#00aeef] uppercase tracking-wider transition-all cursor-pointer"
                      >
                        🗺️ View Map
                      </button>
                    </td>
                    <td className="py-4 px-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center">
                          ✓ Resolved
                        </span>
                        <select
                          value={c.status}
                          disabled={updatingComplaintId === c.id}
                          onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value)}
                          className="bg-white border border-slate-200 hover:border-[#00aeef] disabled:opacity-50 text-slate-500 font-bold text-[10px] py-1 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00aeef]/40 transition-all"
                        >
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="PENDING">Reopen: PENDING</option>
                          <option value="EVALUATING">Reopen: EVALUATING</option>
                          <option value="DISPATCHED">Reopen: DISPATCHED</option>
                          <option value="ONGOING">Reopen: ONGOING</option>
                        </select>
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        Resolved by: <span className="font-bold text-[#001e66]">{assignedUser ? assignedUser.name : "Unassigned"}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        Logged: {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredResolved.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                    No resolved complaints in history match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {resolvedTotalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 bg-white px-2">
            <span className="text-xs font-bold text-slate-500">
              Showing {resolvedStart + 1} to {Math.min(resolvedStart + 5, filteredResolved.length)} of {filteredResolved.length} resolved cases
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setResolvedPage(currentResolvedPage - 1)}
                disabled={currentResolvedPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#001e66] hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] transition-all cursor-pointer disabled:cursor-not-allowed select-none"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-[#001e66]">
                Page {currentResolvedPage} of {resolvedTotalPages}
              </span>
              <button
                onClick={() => setResolvedPage(currentResolvedPage + 1)}
                disabled={currentResolvedPage === resolvedTotalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#001e66] hover:bg-[#00aeef] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#001e66] transition-all cursor-pointer disabled:cursor-not-allowed select-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
