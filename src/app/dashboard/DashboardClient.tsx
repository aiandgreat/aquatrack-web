"use client";

import React, { useState, useEffect } from "react";
import MapboxMap from "../../components/MapboxMap";
import TelemetryAnalytics from "../../components/TelemetryAnalytics";
import DiagnosticAlertDrawer from "../../components/DiagnosticAlertDrawer";
import { generateComplianceReport } from "../../lib/pdf-generator";
import { getSupabaseClient } from "../../lib/supabase";

interface TelemetryReading {
  timestamp: string;
  pressure: number;
  ph: number;
  turbidity: number;
  tds: number;
}

interface TelemetryNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  type: string;
}

interface Complaint {
  id: string;
  rawText: string;
  summary: string;
  latitude: number;
  longitude: number;
  urgency: string;
  category: string;
  status?: string;
}

interface DashboardClientProps {
  initialNodes: TelemetryNode[];
  initialComplaints: Complaint[];
  initialReadings: Record<string, TelemetryReading[]>;
}

const defaultComplaints = [
  {
    id: "complaint-101",
    rawText: "Mababa ang presyon ng tubig dito sa Sector 3, halos walang lumalabas.",
    summary: "Severe pressure drop reported at Sector 3",
    latitude: 14.6002,
    longitude: 120.9848,
    urgency: "HIGH",
    category: "PIPELINE_BREACH_PRESSURE_DROP",
    status: "PENDING"
  },
  {
    id: "complaint-102",
    rawText: "Dilaw at may mga latak na buhangin ang lumalabas sa gripo namin.",
    summary: "Yellow sedimentation in resident supply lines",
    latitude: 14.6012,
    longitude: 120.9852,
    urgency: "CRITICAL",
    category: "HIGH_TURBIDITY",
    status: "PENDING"
  }
];

export default function DashboardClient({
  initialNodes,
  initialComplaints,
  initialReadings,
}: DashboardClientProps) {
  // Configurable state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [dispatchedCrews, setDispatchedCrews] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"alerts" | "crews">("alerts");

  // Local state for complaints to handle real-time appends/updates
  const [complaintsList, setComplaintsList] = useState<Complaint[]>(() => 
    initialComplaints.length > 0 ? initialComplaints : [...defaultComplaints]
  );

  // Supabase Realtime WebSocket subscription for postgres changes
  useEffect(() => {
    try {
      const client = getSupabaseClient();
      const channel = client
        .channel("complaints-realtime-sync")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "Complaint" },
          (payload) => {
            const inserted = payload.new as any;
            const formatted: Complaint = {
              id: inserted.id,
              rawText: inserted.rawText,
              summary: inserted.summary || "New resident report",
              latitude: inserted.latitude,
              longitude: inserted.longitude,
              urgency: inserted.urgency || "MEDIUM",
              category: inserted.category || "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
              status: inserted.status,
            };
            // Prepend new complaint instantly
            setComplaintsList((prev) => [formatted, ...prev]);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "Complaint" },
          (payload) => {
            const updated = payload.new as any;
            setComplaintsList((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, status: updated.status } : c))
            );
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (err) {
      console.warn("Supabase Realtime subscription skipped (missing env keys for local tests)", err);
    }
  }, []);

  const handleDownloadReport = () => {
    const flatReadings: any[] = [];
    nodes.forEach((n) => {
      const nodeReadings = readings[n.id] || [];
      nodeReadings.forEach((r) => {
        flatReadings.push({
          nodeName: n.name,
          ph: r.ph,
          turbidity: r.turbidity,
          tds: r.tds,
          pressure: r.pressure,
          timestamp: r.timestamp,
        });
      });
    });

    const readingsList = flatReadings.length > 0 ? flatReadings : [
      { nodeName: "Main Pump Station A", ph: 7.2, turbidity: 1.2, tds: 220, pressure: 45.2, timestamp: new Date().toISOString() },
      { nodeName: "Household Edge B", ph: 6.5, turbidity: 4.8, tds: 380, pressure: 35.1, timestamp: new Date().toISOString() },
    ];

    generateComplianceReport({ readings: readingsList });
  };

  // Fallbacks to mock database values if tables are empty
  const nodes = initialNodes.length > 0 ? initialNodes : [
    { id: "node-1", name: "Main Pump Station A", latitude: 14.5995, longitude: 120.9842, status: "ONLINE", type: "PUMP_STATION" },
    { id: "node-2", name: "Household Edge B", latitude: 14.6010, longitude: 120.9850, status: "MAINTENANCE", type: "HOUSEHOLD_EDGE" },
    { id: "node-3", name: "Junction Valve C", latitude: 14.5980, longitude: 120.9830, status: "OFFLINE", type: "HOUSEHOLD_EDGE" },
    { id: "node-4", name: "Reservoir Feed D", latitude: 14.6025, longitude: 120.9860, status: "ONLINE", type: "PUMP_STATION" },
  ];

  const readings = Object.keys(initialReadings).length > 0 ? initialReadings : {
    "node-1": [
      { timestamp: "2026-07-09T08:00:00Z", pressure: 45.2, ph: 7.2, turbidity: 1.2, tds: 220 },
      { timestamp: "2026-07-09T09:00:00Z", pressure: 44.8, ph: 7.3, turbidity: 1.1, tds: 225 },
      { timestamp: "2026-07-09T10:00:00Z", pressure: 45.5, ph: 7.2, turbidity: 1.3, tds: 218 },
      { timestamp: "2026-07-09T11:00:00Z", pressure: 44.9, ph: 7.2, turbidity: 1.2, tds: 222 },
      { timestamp: "2026-07-09T12:00:00Z", pressure: 45.1, ph: 7.3, turbidity: 1.1, tds: 220 },
    ],
    "node-2": [
      { timestamp: "2026-07-09T08:00:00Z", pressure: 38.2, ph: 6.8, turbidity: 4.8, tds: 380 },
      { timestamp: "2026-07-09T09:00:00Z", pressure: 35.1, ph: 6.5, turbidity: 5.5, tds: 410 },
      { timestamp: "2026-07-09T10:00:00Z", pressure: 28.3, ph: 6.2, turbidity: 6.9, tds: 480 },
      { timestamp: "2026-07-09T11:00:00Z", pressure: 18.0, ph: 5.9, turbidity: 8.2, tds: 530 },
      { timestamp: "2026-07-09T12:00:00Z", pressure: 14.5, ph: 5.8, turbidity: 9.1, tds: 550 },
    ],
    "node-3": [
      { timestamp: "2026-07-09T08:00:00Z", pressure: 42.1, ph: 7.1, turbidity: 1.5, tds: 260 },
      { timestamp: "2026-07-09T09:00:00Z", pressure: 38.5, ph: 7.0, turbidity: 1.8, tds: 270 },
      { timestamp: "2026-07-09T10:00:00Z", pressure: 22.0, ph: 6.8, turbidity: 2.5, tds: 290 },
      { timestamp: "2026-07-09T11:00:00Z", pressure: 0.0, ph: 6.5, turbidity: 3.1, tds: 300 },
      { timestamp: "2026-07-09T12:00:00Z", pressure: 0.0, ph: 6.4, turbidity: 3.2, tds: 310 },
    ],
    "node-4": [
      { timestamp: "2026-07-09T08:00:00Z", pressure: 50.1, ph: 7.4, turbidity: 0.8, tds: 180 },
      { timestamp: "2026-07-09T09:00:00Z", pressure: 49.9, ph: 7.4, turbidity: 0.9, tds: 185 },
      { timestamp: "2026-07-09T10:00:00Z", pressure: 50.3, ph: 7.5, turbidity: 0.8, tds: 178 },
      { timestamp: "2026-07-09T11:00:00Z", pressure: 50.0, ph: 7.4, turbidity: 0.7, tds: 182 },
      { timestamp: "2026-07-09T12:00:00Z", pressure: 50.2, ph: 7.4, turbidity: 0.8, tds: 180 },
    ]
  };

  // Mock Diagnostic Alerts mapped from Gemini AI engine
  const mockAlerts = {
    "complaint-101": {
      id: "alert-501",
      node: { name: "Household Edge B", latitude: 14.6010, longitude: 120.9850 },
      geminiAnalysis: {
        probableRootCause: "Pressure readings at Node B dropped below 15 PSI, matching resident reports of low pressure within a 500m radius. Suspected valve blockage or pipeline structural fracture.",
        confidenceScore: 88,
        recommendedAction: "Inspect pipeline bypass valve B-12 and perform manual pressure check on connection line 4."
      }
    },
    "complaint-102": {
      id: "alert-502",
      node: { name: "Household Edge B", latitude: 14.6010, longitude: 120.9850 },
      geminiAnalysis: {
        probableRootCause: "Maintenance event recorded on Node B has caused turbid backflow into resident loops. Sediment filters have breached maximum NTU thresholds.",
        confidenceScore: 92,
        recommendedAction: "Flush main line Sector 4, replace active sediment filters on main distributor manifold."
      }
    }
  };

  // Mock Field Crews with geographical positions
  const mockCrews = [
    { id: "crew-1", name: "Engr. Santos (Mobile 1)", latitude: 14.6000, longitude: 120.9835 },
    { id: "crew-2", name: "Technician Reyes (Mobile 2)", latitude: 14.6020, longitude: 120.9855 },
    { id: "crew-3", name: "Repair Team Lopez (Mobile 3)", latitude: 14.5975, longitude: 120.9840 }
  ];

  // Click handlers
  const handleSelectNode = (id: string | null) => {
    setSelectedNodeId(id);
    setSelectedComplaintId(null); // Clear complaint selection
  };

  const handleSelectComplaint = (id: string | null) => {
    setSelectedComplaintId(id);
    setSelectedNodeId(null); // Clear node selection
  };

  const handleDispatchCrew = (crewId: string) => {
    setDispatchedCrews((prev) => [...prev, crewId]);
  };

  const selectedAlert = selectedComplaintId ? mockAlerts[selectedComplaintId as keyof typeof mockAlerts] : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Top HUD Stats Panel */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </div>
          <div>
            <h2 className="text-md font-bold tracking-wider text-slate-100">OPERATIONS CONTROL</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{complaintsList.length} active infrastructure alerts</p>
          </div>
        </div>

        {/* Global Key KPI Tickers */}
        <div className="flex space-x-8 text-xs font-mono">
          <div className="hidden sm:block">
            <span className="text-slate-500">SYS_HEALTH:</span>{" "}
            <span className="text-emerald-400 font-bold">94.8%</span>
          </div>
          <div className="hidden md:block">
            <span className="text-slate-500">AVG_PRESSURE:</span>{" "}
            <span className="text-cyan-400 font-bold">39.4 PSI</span>
          </div>
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-slate-500">ACTIVE_NODES:</span>{" "}
              <span className="text-slate-200">{nodes.filter(n => n.status === "ONLINE").length}/{nodes.length} ONLINE</span>
            </div>
            <button
              onClick={handleDownloadReport}
              className="bg-[#00aeef] hover:bg-[#00aeef]/80 text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PDF Report
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel Content Split */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar: Info Panel & Telemetry Analytics */}
        <div className={`w-96 border-r border-slate-800 bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto flex flex-col transition-all duration-300 ${selectedNodeId ? 'w-[420px]' : 'w-80'}`}>
          {selectedNodeId ? (
            <div className="flex-1">
              <TelemetryAnalytics
                nodeName={nodes.find((n) => n.id === selectedNodeId)?.name || "Sensor Node"}
                readings={readings[selectedNodeId] || []}
                onClose={() => setSelectedNodeId(null)}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pressure Node Inventory</h3>
                <div className="space-y-2">
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => handleSelectNode(node.id)}
                      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                        node.status === "ONLINE"
                          ? "bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700"
                          : node.status === "MAINTENANCE"
                          ? "bg-amber-950/20 border-amber-900/40 hover:border-amber-700"
                          : "bg-red-950/20 border-red-900/40 hover:border-red-700"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-200">{node.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                          node.status === "ONLINE" ? "bg-emerald-900/60 text-emerald-400" : node.status === "MAINTENANCE" ? "bg-amber-900/60 text-amber-400" : "bg-red-900/60 text-red-400"
                        }`}>
                          {node.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">{node.type} | Lat: {node.latitude}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Feed */}
              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Real-time Stream</h3>
                <div className="space-y-2 text-[11px] font-mono text-slate-400">
                  <div className="p-2 bg-slate-900/50 rounded border border-slate-800/60">
                    <span className="text-cyan-400">[16:54]</span> Ingested reading at Node-1. System operating normally.
                  </div>
                  <div className="p-2 bg-slate-900/50 rounded border border-slate-800/60">
                    <span className="text-amber-400">[16:48]</span> Alert triggered: Node-2 turbidity (8.2 NTU) exceeds limit.
                  </div>
                  <div className="p-2 bg-slate-900/50 rounded border border-slate-800/60">
                    <span className="text-rose-400">[16:32]</span> Complaint resolved. WorkOrder #101 dispatch complete.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center: Vector Radar Grid Map */}
        <div className="flex-1 p-4 bg-slate-950 flex flex-col relative h-full">
          <MapboxMap
            nodes={nodes}
            complaints={complaintsList}
            selectedNodeId={selectedNodeId}
            selectedComplaintId={selectedComplaintId}
            onSelectNode={handleSelectNode}
            onSelectComplaint={handleSelectComplaint}
          />
        </div>

        {/* Right Sidebar: Active Triage Warnings & Proximity dispatch */}
        <div className="w-96 border-l border-slate-800 bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto flex flex-col space-y-4">
          
          {/* Tabs for Alerts vs Crews */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                activeTab === "alerts" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400"
              }`}
            >
              AI Triage Reports
            </button>
            <button
              onClick={() => setActiveTab("crews")}
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                activeTab === "crews" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400"
              }`}
            >
              Technicians
            </button>
          </div>

          {activeTab === "alerts" ? (
            <div className="space-y-4 flex-1">
              {selectedAlert ? (
                <DiagnosticAlertDrawer
                  alert={selectedAlert}
                  crews={mockCrews.filter((c) => !dispatchedCrews.includes(c.id))}
                  onDispatch={handleDispatchCrew}
                />
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 italic">Select an active resident complaint warning on the map to review the AI diagnostics reports.</p>
                  
                  {complaintsList.map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => handleSelectComplaint(comp.id)}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-rose-400 font-mono">{comp.urgency} URGENCY</span>
                        <span className="text-[9px] text-slate-500">ID: {comp.id}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 mt-1">{comp.summary}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">"{comp.rawText}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Mobile Field Crews</h3>
              {mockCrews.map((crew) => {
                const isDispatched = dispatchedCrews.includes(crew.id);
                return (
                  <div key={crew.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{crew.name}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">Lat: {crew.latitude} | Lng: {crew.longitude}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      isDispatched ? "bg-amber-950 text-amber-400 border border-amber-900" : "bg-emerald-950 text-emerald-400 border border-emerald-900"
                    }`}>
                      {isDispatched ? "DISPATCHED" : "AVAILABLE"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
