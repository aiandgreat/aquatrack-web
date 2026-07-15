import React from "react";

interface Advisory {
  id: string;
  date: string;
  title: string;
  text: string;
  type: "warning" | "info";
  targetRole?: "broadcast" | "consumers" | "technicians";
}

interface AdvisoriesSectionProps {
  advisories: Advisory[];
}

export default function AdvisoriesSection({ advisories }: AdvisoriesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-[#001e66] tracking-tight">Community Broadcast Notices</h2>
        <p className="text-xs text-slate-500 font-medium font-bold">Read recent municipal service updates and maintenance warnings</p>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Notice Title & Details</th>
              <th className="py-3 px-4">Alert Type</th>
              <th className="py-3 px-4">Target Audience</th>
              <th className="py-3 px-4">Date Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {advisories.map((ad) => (
              <tr key={ad.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 font-bold text-[#001e66] max-w-md">
                  <div className="text-sm font-extrabold">{ad.title}</div>
                  <div className="text-slate-500 font-medium mt-1 leading-relaxed">{ad.text}</div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                    ad.type === "warning"
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-blue-50 text-blue-600 border-blue-200"
                  }`}>
                    {ad.type}
                  </span>
                </td>
                <td className="py-4 px-4 font-black">
                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 uppercase">
                    {ad.targetRole === "broadcast" || !ad.targetRole ? "Broadcast" : ad.targetRole}
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-slate-500 font-bold">
                  {ad.date}
                </td>
              </tr>
            ))}
            {advisories.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                  No active notices broadcasted.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
