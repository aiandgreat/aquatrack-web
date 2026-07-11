import React from "react";

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
}

export default function ReportsSection({
  complaints,
  complaintSearchQuery,
  setComplaintSearchQuery,
  updatingComplaintId,
  handleUpdateComplaintStatus,
  users,
  handleUpdateComplaintAssignment,
}: ReportsSectionProps) {
  const filteredComplaints = complaints.filter(
    (c) =>
      c.rawText.toLowerCase().includes(complaintSearchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(complaintSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">Citizen Complaints Database</h2>
          <p className="text-xs text-slate-500 font-medium font-bold">Verify AI translation enums and dispatch dispatches</p>
        </div>
        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            placeholder="Search complaints text…"
            value={complaintSearchQuery}
            onChange={(e) => setComplaintSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#001e66] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Citizen Report</th>
              <th className="py-3 px-4">AI Class &amp; Urgency</th>
              <th className="py-3 px-4">Coordinates</th>
              <th className="py-3 px-4">Ticket Status</th>
              <th className="py-3 px-4">Assign Field Technician</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredComplaints.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 space-y-1">
                  <div className="font-extrabold text-[#001e66] text-sm">{c.summary}</div>
                  <div className="text-slate-600 font-medium italic">"{c.rawText}"</div>
                  {c.translatedText && (
                    <div className="text-xxs text-[#00aeef] font-semibold mt-1">
                      🇺🇸 Translation: "{c.translatedText}"
                    </div>
                  )}
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
                <td className="py-4 px-4 font-mono text-slate-600 font-bold">
                  Lat: {c.latitude.toFixed(5)} <br /> Lng: {c.longitude.toFixed(5)}
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
            {filteredComplaints.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                  No citizen complaints recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
