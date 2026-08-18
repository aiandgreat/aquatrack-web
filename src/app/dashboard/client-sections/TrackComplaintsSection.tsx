import React from "react";

interface Complaint {
  id: string;
  rawText: string;
  summary: string;
  latitude: number;
  longitude: number;
  urgency: string;
  category: string;
  status?: string;
  createdAt?: string;
  assignedToName?: string;
}

interface TrackComplaintsSectionProps {
  myComplaints: Complaint[];
}

export default function TrackComplaintsSection({ myComplaints }: TrackComplaintsSectionProps) {
  const formatCategory = (cat: string) => {
    if (!cat) return "Unclassified";
    if (cat === "HIGH_MINERAL_CONTENT_TDS") return "High Mineral Content/TDS";
    return cat
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const activeComplaints = myComplaints.filter((c) => c.status !== "RESOLVED");
  const resolvedComplaints = myComplaints.filter((c) => c.status === "RESOLVED");

  return (
    <div className="space-y-8">
      {/* Section 1: Active Complaints */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-[#001e66] tracking-tight">Active Ticket Status Tracker</h2>
          <p className="text-xs text-slate-500 font-bold">Monitor your active tickets and dispatch assignments</p>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-xs table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-[14%]">ID</th>
                <th className="py-3 px-4 w-[32%]">Summary</th>
                <th className="py-3 px-4 w-[12%]">Urgency</th>
                <th className="py-3 px-4 w-[18%]">Category</th>
                <th className="py-3 px-4 w-[12%]">Status</th>
                <th className="py-3 px-4 w-[12%]">Dispatch Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-mono text-[10px] font-bold text-slate-400 align-top">
                    AQ-{c.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="py-4 px-4 font-bold text-[#001e66] pr-2 align-top">
                    <div className="font-bold text-[#001e66]">{c.summary || "Resident reported issue"}</div>
                    <div className="text-slate-500 font-medium italic mt-0.5 leading-relaxed line-clamp-2">
                      "{c.rawText.length > 75 ? c.rawText.slice(0, 75) + "...." : c.rawText}"
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase border ${
                      c.urgency === "CRITICAL" || c.urgency === "HIGH" || c.urgency === "URGENT"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : c.urgency === "MEDIUM"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}>
                      {c.urgency || "LOW"}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-600 align-top break-words">
                    {formatCategory(c.category)}
                  </td>
                  <td className="py-4 px-4 align-top">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                      c.status === "PENDING"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : c.status === "EVALUATING"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : c.status === "DISPATCHED"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : c.status === "ONGOING"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : c.status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {c.status || "PENDING"}
                    </span>
                  </td>
                  <td className="py-4 px-4 align-top">
                    {c.assignedToName ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50/70 border border-blue-150 text-blue-700 font-bold text-[9px] uppercase tracking-wide">
                        🔧 {c.assignedToName}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic font-medium">Awaiting Dispatch</span>
                    )}
                  </td>
                </tr>
              ))}
              {activeComplaints.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    No active tickets recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Complaint History */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-[#001e66] tracking-tight">My Complaint History (Audit Trail)</h2>
          <p className="text-xs text-slate-500 font-bold">Resolved incident logs and completed audit trails</p>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-xs table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-[14%]">ID</th>
                <th className="py-3 px-4 w-[32%]">Summary</th>
                <th className="py-3 px-4 w-[12%]">Urgency</th>
                <th className="py-3 px-4 w-[18%]">Category</th>
                <th className="py-3 px-4 w-[12%]">Status</th>
                <th className="py-3 px-4 w-[12%]">Dispatch Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resolvedComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-mono text-[10px] font-bold text-slate-400 align-top">
                    AQ-{c.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="py-4 px-4 font-bold text-[#001e66] pr-2 align-top">
                    <div className="font-bold text-[#001e66]">{c.summary || "Resident reported issue"}</div>
                    <div className="text-slate-500 font-medium italic mt-0.5 leading-relaxed line-clamp-2">
                      "{c.rawText.length > 75 ? c.rawText.slice(0, 75) + "...." : c.rawText}"
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase border ${
                      c.urgency === "CRITICAL" || c.urgency === "HIGH" || c.urgency === "URGENT"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : c.urgency === "MEDIUM"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}>
                      {c.urgency || "LOW"}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-600 align-top break-words">
                    {formatCategory(c.category)}
                  </td>
                  <td className="py-4 px-4 align-top">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      RESOLVED
                    </span>
                  </td>
                  <td className="py-4 px-4 align-top">
                    {c.assignedToName ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50/70 border border-blue-150 text-blue-700 font-bold text-[9px] uppercase tracking-wide">
                        🔧 {c.assignedToName}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic font-medium">No assigned technician recorded</span>
                    )}
                  </td>
                </tr>
              ))}
              {resolvedComplaints.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    No resolved complaints recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

