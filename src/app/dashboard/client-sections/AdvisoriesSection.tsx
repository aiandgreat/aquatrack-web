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

      <div className="space-y-4">
        {advisories.map((ad) => (
          <div key={ad.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm relative">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400">{ad.date}</span>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                ad.type === "warning" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
              }`}>
                {ad.type}
              </span>
            </div>
            <h3 className="font-extrabold text-[#001e66] text-sm mt-2">{ad.title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ad.text}</p>
          </div>
        ))}
        {advisories.length === 0 && (
          <p className="text-slate-500 italic text-xs">No active notices broadcasted.</p>
        )}
      </div>
    </div>
  );
}
