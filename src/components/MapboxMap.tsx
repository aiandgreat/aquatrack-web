"use client";

import React, { useEffect, useRef, useState } from "react";

interface MapboxMapProps {
  nodes: Array<{ id: string; name: string; latitude: number; longitude: number; status: string }>;
  complaints: Array<{ id: string; rawText: string; latitude: number; longitude: number; urgency: string }>;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
}

export default function MapboxMap({ nodes, complaints, selectedNodeId, onSelectNode }: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);

  // Sync selectedPoint when selectedNodeId changes
  useEffect(() => {
    if (selectedNodeId) {
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (node) {
        setSelectedPoint({ lat: node.latitude, lng: node.longitude });
      }
    } else {
      setSelectedPoint(null);
    }
  }, [selectedNodeId, nodes]);

  const handleNodeClick = (node: typeof nodes[0]) => {
    if (onSelectNode) {
      onSelectNode(node.id);
    } else {
      setSelectedPoint({ lat: node.latitude, lng: node.longitude });
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col justify-between">
      {/* Grid line grid map background for high-tech dashboard look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70" />

      {/* Map labels and coordinates */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-lg shadow-lg text-xs space-y-1">
          <p className="font-semibold text-cyan-400">Interactive Map Console</p>
          <p className="text-slate-400 font-mono text-[10px]">Center: 14.6002° N, 120.9846° E</p>
          <p className="text-slate-400 font-mono text-[10px]">Boundaries: Active Vector Overlay</p>
        </div>

        {selectedPoint && (
          <div className="bg-slate-900/95 backdrop-blur border border-slate-800 p-3 rounded-lg shadow-lg text-xs">
            <p className="font-semibold text-emerald-400">500m Safety Bounding</p>
            <p className="font-mono mt-1 text-[10px] text-slate-300">Lat: {selectedPoint.lat.toFixed(4)}, Lng: {selectedPoint.lng.toFixed(4)}</p>
            <button
              onClick={() => {
                setSelectedPoint(null);
                if (onSelectNode) onSelectNode(null);
              }}
              className="mt-2 text-red-400 hover:text-red-300 hover:underline cursor-pointer font-medium"
            >
              Clear Bounding
            </button>
          </div>
        )}
      </div>

      {/* Nodes and markers container */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute text-[10px] text-slate-700 tracking-widest uppercase pointer-events-none select-none">
          Mapbox Canvas Backdrop
        </div>

        {/* 500m Radius SVG Overlay Visualizer Mock */}
        {selectedPoint && (
          <div className="absolute w-[300px] h-[300px] pointer-events-none transition-all duration-300 ease-in-out">
            <svg className="w-full h-full animate-[pulse_3s_infinite]" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="rgba(6, 182, 212, 0.05)" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="2" fill="#06b6d4" />
            </svg>
          </div>
        )}

        {/* Node Interactive Markers */}
        <div className="absolute inset-0">
          {nodes.map((node) => {
            // Simple mapping of coordinates to relative screen percentage
            // Lat is roughly 14.5995 to 14.6010 -> Map to 30% to 70%
            // Lng is roughly 120.9842 to 120.9850 -> Map to 30% to 70%
            const latMin = 14.5990;
            const latMax = 14.6015;
            const lngMin = 120.9835;
            const lngMax = 120.9855;

            const top = 100 - ((node.latitude - latMin) / (latMax - latMin)) * 100;
            const left = ((node.longitude - lngMin) / (lngMax - lngMin)) * 100;

            const isSelected = selectedNodeId === node.id;

            return (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node)}
                style={{ top: `${top}%`, left: `${left}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-all duration-200 z-20 focus:outline-none"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                  isSelected ? "bg-cyan-500 scale-125 ring-4 ring-cyan-950" : "bg-slate-800 hover:bg-slate-700 hover:scale-110"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${
                    isSelected ? "text-slate-950" : node.status === "ONLINE" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.155-1.071C15.18 19.894 17 17.5 17 14.25a5.25 5.25 0 10-10.5 0c0 3.25 1.82 5.644 3.484 7.03.328.272.716.634 1.156 1.071zm4.71-8.101a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className={`mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shadow border transition-colors ${
                  isSelected 
                    ? "bg-cyan-500 text-slate-950 border-cyan-400" 
                    : "bg-slate-900/90 text-slate-300 border-slate-800 group-hover:text-white"
                }`}>
                  {node.name}
                </div>
              </button>
            );
          })}

          {/* Render Complaints on the Map */}
          {complaints.map((complaint) => {
            const latMin = 14.5990;
            const latMax = 14.6015;
            const lngMin = 120.9835;
            const lngMax = 120.9855;

            const top = 100 - ((complaint.latitude - latMin) / (latMax - latMin)) * 100;
            const left = ((complaint.longitude - lngMin) / (lngMax - lngMin)) * 100;

            return (
              <div
                key={complaint.id}
                style={{ top: `${top}%`, left: `${left}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group pointer-events-none z-10"
              >
                <div className="w-5 h-5 rounded-full bg-red-950/90 border border-red-500 flex items-center justify-center animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
                <div className="mt-1 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-900 text-[8px] text-red-300 font-medium whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
                  Alert: {complaint.urgency}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
