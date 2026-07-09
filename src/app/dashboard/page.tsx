"use client";

import React, { useState } from "react";
import MapboxMap from "../../components/MapboxMap";
import TelemetryAnalytics from "../../components/TelemetryAnalytics";

export default function DashboardPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Read initial seed metrics (Mocked data structures matching Prisma schema properties)
  const mockNodes = [
    { id: "1", name: "Pump Station A", latitude: 14.5995, longitude: 120.9842, status: "ONLINE" },
    { id: "2", name: "Household Node B", latitude: 14.6010, longitude: 120.9850, status: "MAINTENANCE" }
  ];

  const mockComplaints = [
    { id: "101", rawText: "Low pressure issues", latitude: 14.6002, longitude: 120.9848, urgency: "HIGH" }
  ];

  // Mock historical readings for selected nodes (pressure: 0-60, ph: 0-14, turbidity: NTU, tds: ppm)
  const mockReadings: Record<string, Array<{ timestamp: string; pressure: number; ph: number; turbidity: number; tds: number }>> = {
    "1": [
      { timestamp: "2026-07-09T10:00:00Z", pressure: 45.2, ph: 7.2, turbidity: 1.2, tds: 150 },
      { timestamp: "2026-07-09T11:00:00Z", pressure: 46.1, ph: 7.3, turbidity: 1.1, tds: 152 },
      { timestamp: "2026-07-09T12:00:00Z", pressure: 44.8, ph: 7.1, turbidity: 1.3, tds: 149 },
      { timestamp: "2026-07-09T13:00:00Z", pressure: 45.5, ph: 7.2, turbidity: 1.2, tds: 151 },
      { timestamp: "2026-07-09T14:00:00Z", pressure: 47.0, ph: 7.4, turbidity: 1.4, tds: 155 },
    ],
    "2": [
      { timestamp: "2026-07-09T10:00:00Z", pressure: 28.5, ph: 6.8, turbidity: 3.5, tds: 280 },
      { timestamp: "2026-07-09T11:00:00Z", pressure: 27.2, ph: 6.7, turbidity: 3.8, tds: 295 },
      { timestamp: "2026-07-09T12:00:00Z", pressure: 25.1, ph: 6.5, turbidity: 4.2, tds: 310 },
      { timestamp: "2026-07-09T13:00:00Z", pressure: 22.4, ph: 6.3, turbidity: 4.8, tds: 325 },
      { timestamp: "2026-07-09T14:00:00Z", pressure: 18.9, ph: 6.1, turbidity: 5.5, tds: 340 },
    ],
  };

  const selectedNode = mockNodes.find((node) => node.id === selectedNodeId);

  return (
    <div className="flex-1 flex h-full relative bg-slate-950 text-slate-50">
      {/* Map Backdrop */}
      <div className="flex-1 h-full relative">
        <MapboxMap
          nodes={mockNodes}
          complaints={mockComplaints}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      </div>

      {/* Telemetry Analytics Drawer */}
      {selectedNode && (
        <div className="w-96 border-l border-slate-800 bg-slate-900/95 overflow-hidden z-30 transition-all duration-300">
          <TelemetryAnalytics
            nodeName={selectedNode.name}
            readings={mockReadings[selectedNode.id] || []}
            onClose={() => setSelectedNodeId(null)}
          />
        </div>
      )}

      {/* Operational Alerts Sidebar */}
      <div className="w-80 border-l border-slate-800 bg-slate-900/90 p-4 overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h2 className="text-base font-semibold">Operational Alerts</h2>
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer focus:outline-none"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-4 space-y-3 flex-1">
          <div
            onClick={() => setSelectedNodeId("2")}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              selectedNodeId === "2"
                ? "bg-red-950/60 border-red-500"
                : "bg-red-950/40 border-red-900 hover:bg-red-950/60"
            }`}
          >
            <p className="text-xs font-bold text-red-400">PIPELINE PRESSURE DROP</p>
            <p className="text-sm mt-1 text-slate-300">Turbidity and pressure warnings logged near Node B.</p>
          </div>
          <div
            onClick={() => setSelectedNodeId("1")}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              selectedNodeId === "1"
                ? "bg-cyan-950/60 border-cyan-500"
                : "bg-slate-900 border-slate-800 hover:bg-slate-800/60"
            }`}
          >
            <p className="text-xs font-bold text-cyan-400">PUMP STATION A</p>
            <p className="text-sm mt-1 text-slate-300">All systems green. Click to view metrics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
