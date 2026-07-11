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
}

interface TrackComplaintsSectionProps {
  myComplaints: Complaint[];
}

export default function TrackComplaintsSection({ myComplaints }: TrackComplaintsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-[#001e66] tracking-tight">Logged Incident Reports</h2>
        <p className="text-xs text-slate-500 font-medium font-bold">Monitor active ticket statuses and diagnostic actions</p>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Summary</th>
              <th className="py-3 px-4">Urgency</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Coordinates</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {myComplaints.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 font-bold text-[#001e66]">
                  <div>{c.summary}</div>
                  <div className="text-slate-500 font-medium italic mt-0.5">"{c.rawText}"</div>
                </td>
                <td className="py-4 px-4 font-black">
                  <span className={`px-2 py-0.5 rounded text-[9px] ${
                    c.urgency === "CRITICAL" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
                  }`}>
                    {c.urgency}
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-[10px] text-slate-500">{c.category}</td>
                <td className="py-4 px-4 font-mono text-slate-500 font-bold">
                  {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                    c.status === "RESOLVED"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-amber-50 text-amber-600 border border-amber-200"
                  }`}>
                    {c.status || "PENDING"}
                  </span>
                </td>
              </tr>
            ))}
            {myComplaints.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                  No logged complaints recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
