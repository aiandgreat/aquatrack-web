import React from "react";
import MapboxMap from "../../../components/MapboxMap";

interface TelemetryNode {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  status: string;
}

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
  barangay?: string;
  userName?: string;
  userEmail?: string;
  serviceAccountNo?: string;
}

interface MapSectionProps {
  nodes: TelemetryNode[];
  complaints: Complaint[];
  selectedNodeId: string | null;
  selectedComplaintId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedComplaintId: (id: string | null) => void;
}

export default function MapSection({
  nodes,
  complaints,
  selectedNodeId,
  selectedComplaintId,
  setSelectedNodeId,
  setSelectedComplaintId,
}: MapSectionProps) {
  return (
    <div className="space-y-6 flex flex-col flex-1 min-h-[550px]">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-lg font-black text-[#001e66] tracking-tight">Geospatial Telemetry Control</h2>
        <p className="text-xs text-slate-500 font-medium">Click any incident pin to focus or load PostGIS coordinate buffers</p>
      </div>

      <div className="flex-1 flex gap-6 h-[460px]">
        {/* Left Navigation Console */}
        <div className="w-80 shrink-0 bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-y-auto space-y-4 flex flex-col">
          {/* Complaints Area */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Citizen Complaints
            </h3>
            <div className="space-y-2">
              {complaints.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => setSelectedComplaintId(comp.id === selectedComplaintId ? null : comp.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedComplaintId === comp.id
                      ? "bg-rose-50 border-rose-400 text-rose-800"
                      : "bg-white border-slate-200 hover:border-rose-400"
                  }`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className="truncate">{comp.summary}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                      {comp.urgency}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1 line-clamp-1">{comp.rawText}</p>
                </div>
              ))}
              {complaints.length === 0 && (
                <p className="text-xs text-slate-400 italic">No active reports pin on map.</p>
              )}
            </div>
          </div>

          {/* Nodes Area */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Telemetry Nodes
            </h3>
            <div className="space-y-2">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedNodeId === node.id
                      ? "bg-cyan-50 border-cyan-400 text-cyan-800"
                      : "bg-white border-slate-200 hover:border-cyan-400"
                  }`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <span>{node.name}</span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                      node.status === "ONLINE" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {node.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-1 select-all">{node.id}</p>
                </div>
              ))}
              {nodes.length === 0 && (
                <p className="text-xs text-slate-400 italic">No node records in the database.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Map view */}
        <div className="flex-1 relative">
          <MapboxMap
            nodes={nodes}
            complaints={complaints}
            selectedNodeId={selectedNodeId}
            selectedComplaintId={selectedComplaintId}
            onSelectNode={setSelectedNodeId}
            onSelectComplaint={setSelectedComplaintId}
          />
        </div>
      </div>
    </div>
  );
}
