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
  barangay: string;
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
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">Citizen Complaints Coordinator</h2>
          <p className="text-xs text-slate-500 font-bold">Track and update ticket resolution workflows</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Filter Toggle */}
          <button
            onClick={() => setFilterAssignedOnly(!filterAssignedOnly)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filterAssignedOnly
                ? "bg-[#00aeef] border-[#00aeef] text-white"
                : "bg-white border-slate-200 text-[#001e66] hover:bg-slate-50"
            }`}
          >
            {filterAssignedOnly ? "Show Assigned Only" : "Show All Complaints"}
          </button>

          <input
            type="text"
            placeholder="Search text..."
            value={complaintSearchQuery}
            onChange={(e) => setComplaintSearchQuery(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#001e66] focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40"
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
                      🇬🇧 Translation: "{c.translatedText}"
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
                  <div>Lat: {c.latitude.toFixed(5)}</div>
                  <div>Lng: {c.longitude.toFixed(5)}</div>
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
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </td>
              </tr>
            ))}
            {filteredComplaints.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                  No complaints found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
