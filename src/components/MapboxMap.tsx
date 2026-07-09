"use client";

import React, { useState } from "react";

interface MapboxMapProps {
  nodes: Array<{ id: string; name: string; latitude: number; longitude: number; status: string; type: string }>;
  complaints: Array<{ id: string; rawText: string; latitude: number; longitude: number; urgency: string; summary: string }>;
  selectedNodeId: string | null;
  selectedComplaintId: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectComplaint: (id: string | null) => void;
}

export default function MapboxMap({
  nodes,
  complaints,
  selectedNodeId,
  selectedComplaintId,
  onSelectNode,
  onSelectComplaint,
}: MapboxMapProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  // Map coordinates (lat/lng) to SVG viewbox (800x600)
  // Latitude range: 14.5970 to 14.6030 -> Y: 550 to 50
  // Longitude range: 120.9820 to 120.9870 -> X: 50 to 750
  const mapCoords = (lat: number, lng: number) => {
    const minLat = 14.5970;
    const maxLat = 14.6030;
    const minLng = 120.9820;
    const maxLng = 120.9870;

    const x = 50 + ((lng - minLng) / (maxLng - minLng)) * 700;
    const y = 550 - ((lat - minLat) / (maxLat - minLat)) * 500;
    return { x, y };
  };

  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="relative w-full h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      
      {/* Scan Lines Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] animate-[scan_8s_linear_infinite] pointer-events-none" />

      {/* SVG Canvas Map */}
      <svg className="w-full h-full min-h-[500px]" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="radar-sweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Radar Sweep Effect */}
        <circle cx="400" cy="300" r="280" fill="url(#radar-sweep)" className="animate-[pulse_4s_infinite]" />
        <circle cx="400" cy="300" r="280" stroke="#1e293b" strokeWidth="1" strokeDasharray="5,5" />
        <circle cx="400" cy="300" r="180" stroke="#1e293b" strokeWidth="1" strokeDasharray="5,5" />
        <circle cx="400" cy="300" r="80" stroke="#1e293b" strokeWidth="1" strokeDasharray="5,5" />

        {/* Simulated Pipeline Grid Network */}
        <g stroke="#1e293b" strokeWidth="3" opacity="0.8">
          <line x1="100" y1="150" x2="450" y2="150" />
          <line x1="450" y1="150" x2="450" y2="400" />
          <line x1="450" y1="400" x2="700" y2="400" />
          <line x1="250" y1="150" x2="250" y2="500" />
          <line x1="250" y1="500" x2="600" y2="500" />
        </g>

        {/* Animated Water Flow Indicators */}
        <g stroke="#06b6d4" strokeWidth="3" opacity="0.6" strokeDasharray="15, 30" className="animate-[dash_10s_linear_infinite]">
          <line x1="100" y1="150" x2="450" y2="150" />
          <line x1="450" y1="150" x2="450" y2="400" />
          <line x1="250" y1="150" x2="250" y2="500" />
          <line x1="250" y1="500" x2="600" y2="500" />
        </g>

        {/* 500m PostGIS Active Scan Ring for Selected Complaint */}
        {selectedComplaint && (() => {
          const { x, y } = mapCoords(selectedComplaint.latitude, selectedComplaint.longitude);
          return (
            <g>
              <circle
                cx={x}
                cy={y}
                r="110"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4,6"
                className="animate-[spin_20s_linear_infinite]"
              />
              <circle
                cx={x}
                cy={y}
                r="110"
                fill="#f43f5e"
                fillOpacity="0.05"
                className="animate-[ping_3s_ease-out_infinite]"
              />
              <line x1={x} y1={y - 120} x2={x} y2={y + 120} stroke="#f43f5e" strokeWidth="0.5" opacity="0.3" strokeDasharray="2,2" />
              <line x1={x - 120} y1={y} x2={x + 120} y2={y} stroke="#f43f5e" strokeWidth="0.5" opacity="0.3" strokeDasharray="2,2" />
            </g>
          );
        })()}

        {/* Interactive Sensor Nodes */}
        {nodes.map((node) => {
          const { x, y } = mapCoords(node.latitude, node.longitude);
          const isSelected = node.id === selectedNodeId;
          const isMaintenance = node.status === "MAINTENANCE";
          const isOffline = node.status === "OFFLINE";
          
          let color = "#22c55e"; // ONLINE
          let pulseClass = "animate-[pulse_2s_infinite]";
          if (isMaintenance) {
            color = "#eab308";
            pulseClass = "animate-[ping_2s_ease-in-out_infinite]";
          } else if (isOffline) {
            color = "#ef4444";
            pulseClass = "animate-[ping_1.5s_ease-in-out_infinite]";
          }

          return (
            <g
              key={node.id}
              className="cursor-pointer"
              onClick={() => onSelectNode(isSelected ? null : node.id)}
              onMouseEnter={() => setHoveredPoint(node.id)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Outer pulsing ring for status warning */}
              {(isMaintenance || isOffline || isSelected) && (
                <circle cx={x} cy={y} r={isSelected ? "18" : "14"} fill="none" stroke={color} strokeWidth="1.5" className={pulseClass} opacity="0.6" />
              )}
              {/* Node selection highlight */}
              {isSelected && (
                <circle cx={x} cy={y} r="22" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3,3" className="animate-[spin_8s_linear_infinite]" />
              )}
              {/* Core Node Marker */}
              <circle cx={x} cy={y} r={isSelected ? "9" : "7"} fill={color} filter="url(#glow)" />
              <circle cx={x} cy={y} r="3" fill="#ffffff" />
            </g>
          );
        })}

        {/* Interactive Complaint Nodes */}
        {complaints.map((comp) => {
          const { x, y } = mapCoords(comp.latitude, comp.longitude);
          const isSelected = comp.id === selectedComplaintId;
          
          return (
            <g
              key={comp.id}
              className="cursor-pointer"
              onClick={() => onSelectComplaint(isSelected ? null : comp.id)}
              onMouseEnter={() => setHoveredPoint(comp.id)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Outer pulsing indicator */}
              <circle cx={x} cy={y} r="16" fill="none" stroke="#f43f5e" strokeWidth="1.5" className="animate-[pulse_1.5s_infinite]" opacity="0.4" />
              {isSelected && (
                <polygon points={`${x},${y-15} ${x-13},${y+7} ${x+13},${y+7}`} fill="none" stroke="#f43f5e" strokeWidth="2" />
              )}
              {/* Complaint marker (Warning triangle) */}
              <polygon
                points={`${x},${y-10} ${x-9},${y+5} ${x+9},${y+5}`}
                fill="#f43f5e"
                stroke="#fff"
                strokeWidth="1"
                filter="url(#glow)"
              />
              <circle cx={x} cy={y+2} r="1" fill="#fff" />
              <line x1={x} y1={y-4} x2={x} y2={y} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          );
        })}
      </svg>

      {/* Dynamic Hover/Click Information Overlay inside Map */}
      <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-800 p-4 rounded-lg backdrop-blur-md flex justify-between items-center text-xs shadow-xl">
        {selectedComplaint ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Selected Citizen Complaint</p>
            <p className="font-bold text-slate-100 text-sm mt-0.5">{selectedComplaint.summary}</p>
            <p className="text-slate-400 mt-1 truncate max-w-[400px]">"{selectedComplaint.rawText}"</p>
          </div>
        ) : selectedNode ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Selected Telemetry Node</p>
            <p className="font-bold text-slate-100 text-sm mt-0.5">{selectedNode.name}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`h-2 w-2 rounded-full ${selectedNode.status === "ONLINE" ? "bg-green-500" : selectedNode.status === "MAINTENANCE" ? "bg-yellow-500" : "bg-red-500"}`} />
              <span className="text-slate-300 font-mono uppercase">{selectedNode.status}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Lat: {selectedNode.latitude}, Lng: {selectedNode.longitude}</span>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-bold text-slate-300">Municipal Command Center Map</p>
            <p className="text-slate-500 mt-0.5">Click a sensor (green/yellow/red) or a complaint (red triangle) to investigate metrics and dispatch crews.</p>
          </div>
        )}

        <div className="text-right hidden sm:block font-mono text-slate-500">
          <p>ZOOM: 100%</p>
          <p className="text-[9px] mt-0.5">POSTGIS: ACTIVE SCAN</p>
        </div>
      </div>

      {/* Styled animation keyframes */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(50%); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -1000; }
        }
      `}</style>
    </div>
  );
}
