import React from "react";
import MapboxMap from "../../components/MapboxMap";

export default async function DashboardPage() {
  // Read initial seed metrics (Mocked data structures matching Prisma schema properties)
  const mockNodes = [
    { id: "1", name: "Pump Station A", latitude: 14.5995, longitude: 120.9842, status: "ONLINE" },
    { id: "2", name: "Household Node B", latitude: 14.6010, longitude: 120.9850, status: "MAINTENANCE" }
  ];

  const mockComplaints = [
    { id: "101", rawText: "Low pressure issues", latitude: 14.6002, longitude: 120.9848, urgency: "HIGH" }
  ];

  return (
    <div className="flex-1 flex h-full relative">
      <div className="flex-1 h-full relative">
        <MapboxMap nodes={mockNodes} complaints={mockComplaints} />
      </div>
      <div className="w-80 border-l border-slate-800 bg-slate-900/90 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold border-b border-slate-800 pb-2">Operational Alerts</h2>
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-red-950/40 border border-red-900 rounded">
            <p className="text-xs font-bold text-red-400">PIPELINE PRESSURE DROP</p>
            <p className="text-sm mt-1 text-slate-300">Turbidity and flow warnings logged near Node B.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
