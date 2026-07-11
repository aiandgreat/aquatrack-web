"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set token safely from environment variables
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MapboxMapProps {
  nodes: Array<{ id: string; name: string; latitude: number; longitude: number; status: string; type: string }>;
  complaints: Array<{
    id: string;
    rawText: string;
    latitude: number;
    longitude: number;
    urgency: string;
    summary: string;
    barangay?: string;
    userName?: string;
    userEmail?: string;
    serviceAccountNo?: string;
    imageUrl?: string;
  }>;
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite" | "dark">("streets");
  const [hoveredComplaintId, setHoveredComplaintId] = useState<string | null>(null);
  const isFirstStyleRender = useRef(true);
  const isMapMovingRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map around Sto. Rosario, San Fernando, Pampanga coordinates
    const sanFernandoCenter: [number, number] = [120.6936, 15.0278];

    // Initialize Mapbox Map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: sanFernandoCenter,
      zoom: 15,
      pitch: 45, // 3D angle view
    });

    mapRef.current = map;

    // Disable hover focus changes during active zoom and pan camera transitions
    map.on("movestart", () => {
      isMapMovingRef.current = true;
      setHoveredComplaintId(null);
    });

    map.on("moveend", () => {
      isMapMovingRef.current = false;
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Re-add layers when style loads/changes
    map.on("style.load", () => {
      if (!map.getSource("pipelines")) {
        map.addSource("pipelines", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { "type": "primary", "name": "MacArthur Highway Main Feed" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6936, 15.0350],
                    [120.6936, 15.0310],
                    [120.6936, 15.0278],
                    [120.6936, 15.0240],
                    [120.6936, 15.0200]
                  ],
                },
              },
              {
                type: "Feature",
                properties: { "type": "primary", "name": "Jose Abad Santos Arterial" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6820, 15.0278],
                    [120.6900, 15.0278],
                    [120.6936, 15.0278],
                    [120.7000, 15.0278],
                    [120.7080, 15.0278]
                  ],
                },
              },
              {
                type: "Feature",
                properties: { "type": "secondary", "name": "Del Pilar Distribution Line" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6936, 15.0240],
                    [120.6980, 15.0240],
                    [120.6980, 15.0278],
                    [120.7020, 15.0278]
                  ],
                },
              },
              {
                type: "Feature",
                properties: { "type": "secondary", "name": "Consunji St Distribution Line" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6936, 15.0310],
                    [120.6900, 15.0310],
                    [120.6900, 15.0278]
                  ],
                },
              },
              {
                type: "Feature",
                properties: { "type": "secondary", "name": "Lourdes Branch Line" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6936, 15.0278],
                    [120.6880, 15.0250],
                    [120.6850, 15.0220]
                  ],
                },
              },
              {
                type: "Feature",
                properties: { "type": "secondary", "name": "San Jose Distribution" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6936, 15.0330],
                    [120.6990, 15.0330],
                    [120.6990, 15.0290]
                  ],
                },
              }
            ],
          },
        });

        // 1. Pipeline Outer Glow / Casing Layer
        map.addLayer({
          id: "pipelines-glow",
          type: "line",
          source: "pipelines",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": [
              "match",
              ["get", "type"],
              "primary", "#00aeef",
              "secondary", "#06b6d4",
              "#06b6d4"
            ],
            "line-width": [
              "match",
              ["get", "type"],
              "primary", 9,
              "secondary", 6,
              6
            ],
            "line-opacity": 0.25,
          },
        });

        // 2. Pipeline Core Layer
        map.addLayer({
          id: "pipelines-line",
          type: "line",
          source: "pipelines",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": [
              "match",
              ["get", "type"],
              "primary", "#00aeef",
              "secondary", "#06b6d4",
              "#06b6d4"
            ],
            "line-width": [
              "match",
              ["get", "type"],
              "primary", 4.5,
              "secondary", 2.5,
              2.5
            ],
            "line-opacity": 0.8,
          },
        });
      }

      if (!map.getSource("scan-ring")) {
        map.addSource("scan-ring", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.addLayer({
          id: "scan-ring-polygon",
          type: "fill",
          source: "scan-ring",
          paint: {
            "fill-color": "#f43f5e",
            "fill-opacity": 0.15,
          },
        });

        map.addLayer({
          id: "scan-ring-outline",
          type: "line",
          source: "scan-ring",
          paint: {
            "line-color": "#f43f5e",
            "line-width": 1.5,
            "line-dasharray": [3, 3],
          },
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Mapbox style dynamically when selected
  useEffect(() => {
    if (isFirstStyleRender.current) {
      isFirstStyleRender.current = false;
      return;
    }
    const map = mapRef.current;
    if (map) {
      if (mapStyle === "streets") map.setStyle("mapbox://styles/mapbox/streets-v12");
      else if (mapStyle === "satellite") map.setStyle("mapbox://styles/mapbox/satellite-streets-v12");
      else map.setStyle("mapbox://styles/mapbox/dark-v11");
    }
  }, [mapStyle]);

  // Update Markers when nodes/complaints list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Helper to generate GeoJSON circle for 500m scan buffer
    const updateScanRing = (lng: number, lat: number) => {
      const source = map.getSource("scan-ring") as mapboxgl.GeoJSONSource;
      if (!source) return;

      const points = 64;
      const radiusInKm = 0.5; // 500 meters
      const coords = [];
      const distanceX = radiusInKm / (111.32 * Math.cos((lat * Math.PI) / 180));
      const distanceY = radiusInKm / 110.57;

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        coords.push([lng + x, lat + y]);
      }
      coords.push(coords[0]); // Close polygon

      source.setData({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
        properties: {},
      });
    };

    // Plot Telemetry Nodes
    nodes.forEach((node) => {
      const el = document.createElement("div");
      el.className = `w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 cursor-pointer shadow-lg transition-transform hover:scale-125 ${
        node.status === "ONLINE"
          ? "bg-emerald-500 shadow-emerald-500/50"
          : node.status === "MAINTENANCE"
          ? "bg-amber-500 shadow-amber-500/50"
          : "bg-rose-500 shadow-rose-500/50"
      }`;

      // Custom node inside marker icon
      el.innerHTML = `
        <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectNode(node.id);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([node.longitude, node.latitude])
        .addTo(map);

      markersRef.current[`node-${node.id}`] = marker;
    });

    // Plot Citizen Complaints
    complaints.forEach((comp) => {
      // Outer stable hitbox wrapper (prevents boundary shifts/glitching during hover/scale events)
      const el = document.createElement("div");
      el.className = "w-9 h-9 flex items-center justify-center cursor-pointer bg-transparent relative";

      // Inner visible dot
      el.innerHTML = `
        <div class="marker-dot w-5 h-5 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center shadow-lg transition-all duration-200">
          <span class="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectComplaint(comp.id);
        updateScanRing(comp.longitude, comp.latitude);
      });

      el.addEventListener("mouseenter", () => {
        if (isMapMovingRef.current) return;
        setHoveredComplaintId(comp.id);
        updateScanRing(comp.longitude, comp.latitude);
      });

      el.addEventListener("mouseleave", () => {
        setHoveredComplaintId(null);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([comp.longitude, comp.latitude])
        .addTo(map);

      markersRef.current[`comp-${comp.id}`] = marker;
    });
  }, [nodes, complaints]);

  // Dynamic selection and hover visual styling updates (prevents map marker teardown/flickering)
  useEffect(() => {
    complaints.forEach((comp) => {
      const marker = markersRef.current[`comp-${comp.id}`];
      if (!marker) return;
      const el = marker.getElement();
      const dot = el.querySelector(".marker-dot");
      if (!dot) return;

      const isSelected = comp.id === selectedComplaintId;
      const isHovered = comp.id === hoveredComplaintId;

      if (isSelected) {
        dot.classList.add("scale-125", "ring-4", "ring-rose-500/50");
        dot.classList.remove("scale-110", "ring-2", "ring-rose-400/40");
      } else if (isHovered) {
        dot.classList.add("scale-110", "ring-2", "ring-rose-400/40");
        dot.classList.remove("scale-125", "ring-4", "ring-rose-500/50");
      } else {
        dot.classList.remove("scale-125", "scale-110", "ring-4", "ring-2", "ring-rose-500/50", "ring-rose-400/40");
      }
    });
  }, [selectedComplaintId, hoveredComplaintId, complaints]);

  // Proximity Focus & Camera flying
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedComplaintId) {
      const comp = complaints.find((c) => c.id === selectedComplaintId);
      if (comp) {
        map.flyTo({
          center: [comp.longitude, comp.latitude],
          zoom: 16,
          essential: true,
        });
      }
    } else if (selectedNodeId) {
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (node) {
        map.flyTo({
          center: [node.longitude, node.latitude],
          zoom: 16.5,
          essential: true,
        });
      }
    }
  }, [selectedComplaintId, selectedNodeId]);

  return (
    <div className="relative w-full h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Container for Mapbox GL JS */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Floating Style Switcher */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 border border-slate-700/60 rounded-xl p-1.5 flex gap-1 shadow-lg backdrop-blur-md">
        {(["streets", "satellite", "dark"] as const).map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => setMapStyle(style)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              mapStyle === style
                ? "bg-[#00aeef] text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {style}
          </button>
        ))}
      </div>

      {/* HUD Layer Grid (top transparent layer) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1.5px,transparent_1.5px),linear-gradient(to_bottom,#1e293b_1.5px,transparent_1.5px)] bg-[size:5rem_5rem] opacity-5 pointer-events-none" />

      {/* Selected Indicator HUD overlay (Hover for Complaints, Select for Nodes) */}
      {(selectedNodeId || hoveredComplaintId) && (
        <div className="absolute bottom-4 left-4 z-10 bg-slate-950/95 border border-slate-800 rounded-xl p-4 text-xs font-mono backdrop-blur-md text-slate-200 max-w-xs sm:max-w-sm shadow-2xl z-20">
          {hoveredComplaintId ? (() => {
            const comp = complaints.find((c) => c.id === hoveredComplaintId);
            if (!comp) return null;
            const mapboxToken = mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
            const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${comp.longitude},${comp.latitude},16.5,0/280x120?access_token=${mapboxToken}`;
            return (
              <div className="space-y-2">
                <div className="text-rose-500 font-black text-[9px] tracking-widest uppercase">⚠️ CITIZEN INCIDENT FOCUS</div>
                <div className="text-white font-black text-xs leading-tight">{comp.summary}</div>
                <div className="border-t border-slate-800 my-2 pt-2 space-y-1.5 text-slate-400 text-xxs leading-normal">
                  <div><strong className="text-slate-300">Name:</strong> {comp.userName || "Anonymous Resident"}</div>
                  <div><strong className="text-slate-300">Acct No:</strong> {comp.serviceAccountNo || "N/A - Non Consumer"}</div>
                  <div><strong className="text-slate-300">Barangay:</strong> {comp.barangay || "San Fernando"}</div>
                  <div><strong className="text-slate-300">Location:</strong> {comp.latitude.toFixed(5)}, {comp.longitude.toFixed(5)}</div>
                  <div className="mt-2 p-2 bg-slate-900/80 rounded border border-slate-800 text-slate-300 italic font-medium leading-relaxed max-h-24 overflow-y-auto">
                    "{comp.rawText}"
                  </div>
                  <div className="mt-2.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">📍 Location Satellite Preview</span>
                    <div className="rounded-lg overflow-hidden border border-slate-800 shadow-md">
                      <img src={staticMapUrl} alt="Location Satellite Preview" className="w-full h-[120px] object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (() => {
            const node = nodes.find((n) => n.id === selectedNodeId);
            if (!node) return null;
            return (
              <div className="space-y-1.5">
                <div className="text-cyan-400 font-black text-[9px] tracking-widest uppercase">📡 TELEMETRY NODE FOCUS</div>
                <div className="text-white font-black text-xs">{node.name}</div>
                <div className="text-slate-400 text-xxs font-bold">
                  Status: <span className={node.status === "ONLINE" ? "text-emerald-400" : "text-rose-400"}>{node.status}</span>
                </div>
                <div className="text-slate-500 text-[10px] pt-1">ID: {node.id}</div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
