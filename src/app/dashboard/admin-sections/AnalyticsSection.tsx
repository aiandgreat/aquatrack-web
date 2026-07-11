import React from "react";

interface AnalyticsSectionProps {
  handleDownloadReport: () => void;
}

export default function AnalyticsSection({
  handleDownloadReport,
}: AnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">PNSDW Compliance Audit Panel</h2>
          <p className="text-xs text-slate-500 font-medium">Verify overall district water telemetry limits</p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition-all"
        >
          Download Audit PDF
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "pH Level Avg", value: "7.2 pH", status: "COMPLIANT", target: "6.5 - 8.5" },
          { label: "Turbidity Avg", value: "1.8 NTU", status: "COMPLIANT", target: "< 5.0 NTU" },
          { label: "TDS / Minerals Avg", value: "240 ppm", status: "COMPLIANT", target: "< 500 ppm" },
          { label: "Line Pressure Avg", value: "44.0 PSI", status: "COMPLIANT", target: "30 - 60 PSI" },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {item.label}
              </span>
              <p className="text-xl font-black text-[#001e66] mt-1">{item.value}</p>
            </div>
            <div className="pt-3 border-t border-slate-200/60 mt-3 flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span className="text-emerald-600 font-black">{item.status}</span>
              <span>Target: {item.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
