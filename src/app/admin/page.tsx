"use client";

import React, { useState } from "react";

export default function AdminSettings() {
  const [nodes, setNodes] = useState([
    { id: "node-101", name: "East Reservoir Pump", pressure: 42 },
    { id: "node-102", name: "North Main Junction", pressure: 45 }
  ]);

  const triggerMockAnomaly = async (nodeId: string) => {
    // Send simulated anomaly telemetry to localhost endpoint
    const mockTelemetry = {
      nodeId,
      ph: 5.5, // Anomaly (Normal is 6.5-8.5)
      turbidity: 8.2, // Anomaly (Normal is < 5)
      tds: 650, // Anomaly (Normal is < 500)
      pressure: 12.0 // Anomaly (Normal is 30-60)
    };
    alert(`Mock Anomaly Telemetry Dispatched for Node: ${nodeId}`);
  };

  return (
    <div className="flex-1 bg-slate-950 p-6 text-slate-200">
      <header className="border-b border-slate-800 pb-3 mb-6">
        <h1 className="text-xl font-bold text-cyan-400">Settings &amp; Simulation Panel</h1>
        <p className="text-sm text-slate-500">Inject telemetry packets to evaluate alarm state routines</p>
      </header>

      <div className="max-w-xl space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <h2 className="text-md font-bold mb-3">Simulation Telemetry Nodes</h2>
          <div className="space-y-3">
            {nodes.map((node) => (
              <div key={node.id} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded">
                <div>
                  <p className="font-semibold text-sm">{node.name}</p>
                  <p className="text-xs text-slate-500">ID: {node.id} | Current Pressure: {node.pressure} PSI</p>
                </div>
                <button
                  onClick={() => triggerMockAnomaly(node.id)}
                  className="bg-red-600 hover:bg-red-700 text-slate-50 font-bold px-3 py-1.5 rounded text-xs"
                >
                  Simulate Anomaly
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
