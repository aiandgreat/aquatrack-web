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

const getUrgencyBadgeClass = (urgency: string) => {
  const u = urgency.toUpperCase();
  if (u === "CRITICAL") {
    return "bg-red-100 text-red-800 border border-red-200";
  }
  if (u === "HIGH" || u === "URGENT") {
    return "bg-orange-100 text-orange-800 border border-orange-200";
  }
  if (u === "MEDIUM") {
    return "bg-yellow-100 text-yellow-900 border border-yellow-200";
  }
  if (u === "LOW") {
    return "bg-slate-100 text-slate-650 border border-slate-200";
  }
  return "bg-slate-100 text-slate-650 border border-slate-200";
};

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
  const [sortBy, setSortBy] = useState<"date" | "barangay-asc" | "barangay-desc" | "urgency" | "status">("status");
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
      const q = complaintSearchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const uniqueId = `aq-${c.id.slice(0, 8)}`.toLowerCase();
        return (
          c.rawText.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          (c.barangay && c.barangay.toLowerCase().includes(q)) ||
          uniqueId.includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      });
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
      if (sortBy === "status") {
        const priority: Record<string, number> = { PENDING: 4, EVALUATING: 3, DISPATCHED: 2, ONGOING: 1, RESOLVED: 0 };
        const aVal = priority[a.status] || 0;
        const bVal = priority[b.status] || 0;
        if (aVal !== bVal) {
          return bVal - aVal;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  const totalCount = complaints.length;
  const awaitingDispatchCount = complaints.filter((c) => !c.assignedToId && c.status !== "RESOLVED").length;
  const inProgressCount = complaints.filter((c) => ["EVALUATING", "DISPATCHED", "ONGOING"].includes(c.status)).length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;

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
            <option value="all">All Barangays</option>
            {uniqueBarangays.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 text-[#001e66] font-bold text-xs py-2 px-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/30 transition-all"
          >
            <option value="status">Sort: Ticket Status</option>
            <option value="date">Sort: Newest First</option>
            <option value="barangay-asc">Sort: Barangay (A-Z)</option>
            <option value="barangay-desc">Sort: Barangay (Z-A)</option>
            <option value="urgency">Sort: Urgency (Highest)</option>
          </select>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by id or location"
              value={complaintSearchQuery}
              onChange={(e) => setComplaintSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#001e66] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Analytics Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#00aeef]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Complaints</span>
            <h4 className="text-2xl font-black text-[#001e66] mt-0.5">{totalCount}</h4>
          </div>
        </div>

        {/* Awaiting Dispatch */}
        <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#ffd800]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Awaiting Dispatch</span>
            <h4 className="text-2xl font-black text-[#001e66] mt-0.5">{awaitingDispatchCount}</h4>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#00aeef]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">In Progress</span>
            <h4 className="text-2xl font-black text-[#001e66] mt-0.5">{inProgressCount}</h4>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#970006]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Resolved</span>
            <h4 className="text-2xl font-black text-[#001e66] mt-0.5">{resolvedCount}</h4>
          </div>
        </div>
      </div>

      {/* 1. Active Complaints Table */}
      <div className="space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-[#001e66] uppercase tracking-wider">Active Complaints</h3>
          <p className="text-xs text-slate-400 font-medium">Current active dispatches and pending incidents undergoing evaluation</p>
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
                  <th className="py-3.5 px-5">Complaint Status</th>
                  <th className="py-3.5 px-5">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70">
                {paginatedActive.map((c) => (
                  <tr key={c.id} className="hover:bg-white/60 transition-colors">
                    {/* 1. ID (Unique id referencing database id starting with AQ) */}
                    <td className="py-4.5 px-5 font-mono font-extrabold text-[#001e66] select-all">
                      AQ-{c.id.slice(0, 8).toUpperCase()}
                    </td>

                    {/* 2. Location (Barangay with View Map action button) */}
                    <td className="py-4.5 px-5">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#001e66] border border-blue-100 uppercase tracking-wide">
                          <svg className="w-3 h-3 text-[#00aeef] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span>{c.barangay || "Outside Service Area"}</span>
                        </span>
                        <button
                          onClick={() => handleViewLocation(c.id)}
                          className="flex items-center gap-1.5 bg-[#EEF4FA] hover:bg-[#00aeef] text-[#001e66] hover:text-white font-black text-[9px] py-1.5 px-2.5 rounded-xl border border-slate-200 hover:border-[#00aeef] uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 mt-1"
                        >
                          <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75L3 9v11.25l6-2.25m0-11.25l6 2.25m-6-2.25v11.25m6-9l6-2.25v11.25l-6 2.25m0-11.25v11.25" />
                          </svg>
                          <span>View Map</span>
                        </button>
                      </div>
                    </td>

                    {/* 3. Description (Raw text of the complaint, truncated if long) */}
                    <td className="py-4.5 px-5 max-w-xs">
                      <div className="text-slate-700 font-medium italic leading-relaxed" title={c.rawText}>
                        "{c.rawText.length > 80 ? c.rawText.slice(0, 80) + "..." : c.rawText}"
                      </div>
                      {c.imageUrl && (
                        <div className="mt-1.5">
                          <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00aeef] hover:underline">
                            📸 View Photo
                          </a>
                        </div>
                      )}
                    </td>

                    {/* 4. Category & Urgency (Formatted as Pipeline Breach/Pressured Drop style) */}
                    <td className="py-4.5 px-5 font-bold text-[#001e66] space-y-1">
                      <span className="capitalize block">{c.category.replace(/_/g, " ").toLowerCase()}</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getUrgencyBadgeClass(c.urgency)}`}>
                        {c.urgency}
                      </span>
                    </td>

                    {/* 5. Complaint Status (Dropdown select) */}
                    <td className="py-4.5 px-5">
                      <select
                        value={c.status}
                        disabled={updatingComplaintId === c.id}
                        onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value)}
                        className="bg-white border border-slate-200 hover:border-[#00aeef] disabled:opacity-50 text-[#001e66] font-bold text-xs py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all cursor-pointer shadow-sm"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="EVALUATING">EVALUATING</option>
                        <option value="DISPATCHED">DISPATCHED</option>
                        <option value="ONGOING">ONGOING</option>
                      </select>
                    </td>

                    {/* 6. Dispatch Action (Technician Assignment Dropdown) */}
                    <td className="py-4.5 px-5">
                      <select
                        value={c.assignedToId || ""}
                        disabled={updatingComplaintId === c.id}
                        onChange={(e) => handleUpdateComplaintAssignment(c.id, e.target.value)}
                        className="bg-white border border-slate-200 hover:border-[#00aeef] disabled:opacity-50 text-[#001e66] font-bold text-xs py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all cursor-pointer shadow-sm"
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
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                      No active citizen complaints match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

        <div className="overflow-hidden bg-white/40 border border-slate-200/80 rounded-[20px] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/40 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Location</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">Category &amp; Urgency</th>
                  <th className="py-3 px-5">Complaint Status</th>
                  <th className="py-3 px-5">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70 bg-slate-50/10">
                {paginatedResolved.map((c) => {
                  const assignedUser = users.find((u) => u.id === c.assignedToId);
                  return (
                    <tr key={c.id} className="hover:bg-white/60 transition-colors">
                      {/* 1. ID (starts with AQ) */}
                      <td className="py-4.5 px-5 font-mono text-slate-450 font-semibold select-all">
                        AQ-{c.id.slice(0, 8).toUpperCase()}
                      </td>

                      {/* 2. Location */}
                      <td className="py-4.5 px-5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-455 border border-slate-200 uppercase tracking-wide">
                            <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span>{c.barangay || "Outside Service Area"}</span>
                          </span>
                          <button
                            onClick={() => handleViewLocation(c.id)}
                            className="flex items-center gap-1.5 bg-[#EEF4FA] hover:bg-[#00aeef] text-[#001e66] hover:text-white font-black text-[9px] py-1.5 px-2.5 rounded-xl border border-slate-200 hover:border-[#00aeef] uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 mt-1"
                          >
                            <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75L3 9v11.25l6-2.25m0-11.25l6 2.25m-6-2.25v11.25m6-9l6-2.25v11.25l-6 2.25m0-11.25v11.25" />
                            </svg>
                            <span>View Map</span>
                          </button>
                        </div>
                      </td>

                      {/* 3. Description */}
                      <td className="py-4.5 px-5 max-w-xs">
                        <div className="text-slate-400 font-medium italic leading-relaxed line-through" title={c.rawText}>
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
                      <td className="py-4.5 px-5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center shadow-sm">
                            ✓ Resolved
                          </span>
                          <select
                            value={c.status}
                            disabled={updatingComplaintId === c.id}
                            onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value)}
                            className="bg-white border border-slate-200 hover:border-[#00aeef] disabled:opacity-50 text-slate-500 font-bold text-[10px] py-1.5 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00aeef]/40 transition-all cursor-pointer"
                          >
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="PENDING">Reopen: PENDING</option>
                            <option value="EVALUATING">Reopen: EVALUATING</option>
                            <option value="DISPATCHED">Reopen: DISPATCHED</option>
                            <option value="ONGOING">Reopen: ONGOING</option>
                          </select>
                        </div>
                      </td>

                      {/* 6. Dispatch Action */}
                      <td className="py-4.5 px-5 font-mono text-slate-500">
                        <div className="text-[10px] font-bold">
                          Assigned to: <span className="text-slate-600 font-extrabold">{assignedUser ? assignedUser.name : "Unassigned"}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-1">
                          Logged: {new Date(c.createdAt).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredResolved.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No resolved complaints in history match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
