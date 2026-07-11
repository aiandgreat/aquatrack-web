"use client";

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Complaint {
  id: string;
  rawText: string;
  summary: string;
  latitude: number;
  longitude: number;
  urgency: string;
  category: string;
  status: string;
}

interface BarangayData {
  name: string;
  count: number;
}

interface HeatmapsSectionProps {
  complaints?: Complaint[];
}

const BARANGAY_COORDS: Record<string, [number, number]> = {
  Alasas: [120.6780, 15.0120],
  Baliti: [120.7020, 15.0560],
  Bulaon: [120.6750, 15.0740],
  Calulut: [120.7100, 15.0600],
  "Del Carmen": [120.7010, 15.0320],
  "Del Pilar": [120.6936, 15.0240],
  "Del Rosario": [120.7180, 15.0080],
  "Dela Paz Norte": [120.6860, 15.0450],
  "Dela Paz Sur": [120.7080, 15.0180],
  Dolores: [120.6900, 15.0330],
  Juliana: [120.6910, 15.0220],
  Lara: [120.6710, 15.0440],
  Lourdes: [120.6880, 15.0250],
  Magliman: [120.6650, 15.0180],
  Maimpis: [120.6900, 15.0520],
  Malino: [120.7250, 15.0480],
  Malpitic: [120.7050, 15.0480],
  Pandaras: [120.6950, 15.0150],
  Panipuan: [120.7380, 15.0620],
  "Pulung Bulu": [120.7120, 15.0250],
  Quebiawan: [120.6950, 15.0420],
  Saguin: [120.6900, 15.0620],
  "San Agustin": [120.6850, 15.0290],
  "San Felipe": [120.6800, 15.0350],
  "San Isidro": [120.7080, 15.0010],
  "San Jose": [120.6936, 15.0310],
  "San Juan": [120.6810, 15.0190],
  "San Nicolas": [120.6936, 15.0278],
  "San Pedro Cutud": [120.7050, 15.0110],
  "Santa Lucia": [120.6950, 15.0210],
  "Santa Teresita": [120.6920, 15.0180],
  "Santo Niño": [120.6720, 15.0250],
  "Santo Rosario": [120.6936, 15.0278],
  Sindalan: [120.6900, 15.0680],
  Telabastagan: [120.6850, 15.0800],
};

function getHeatColor(count: number): string {
  if (count === 0) return "bg-slate-100 border-slate-200 text-slate-400";
  if (count >= 16) return "bg-red-500 border-red-600 text-white";
  if (count >= 10) return "bg-orange-500 border-orange-600 text-white";
  return "bg-yellow-300 border-yellow-400 text-yellow-900";
}

function getHeatLabel(count: number): string {
  if (count === 0) return "NONE";
  if (count >= 16) return "CRITICAL";
  if (count >= 10) return "MODERATE";
  return "LOW";
}

export default function HeatmapsSection({ complaints = [] }: HeatmapsSectionProps) {
  const [barangays, setBarangays] = useState<BarangayData[]>([]);
  const [maxCount, setMaxCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayData | null>(null);

  // Gemini AI summary states
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // Mapbox refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Fetch count aggregations from local api
  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await fetch("/api/admin/heatmap");
        const data = await res.json();
        if (data.success) {
          setBarangays(data.barangays);
          setMaxCount(data.maxCount || 1);
        }
      } catch (err) {
        console.error("Failed to fetch heatmap data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  // Initialize Mapbox map with a heatmap source & layer configuration
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map around Sto. Rosario, San Fernando
    const sfCenter: [number, number] = [120.6936, 15.0278];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: sfCenter,
      zoom: 12.2,
      pitch: 0,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("style.load", () => {
      // Add empty source initially
      map.addSource("complaints-heatmap-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });

      // Add native Mapbox heatmap layer
      map.addLayer({
        id: "complaints-heatmap-layer",
        type: "heatmap",
        source: "complaints-heatmap-source",
        maxzoom: 17,
        paint: {
          // Weight points by urgency rating
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            1, 0.6,
            3, 2.5
          ],
          // Multiplier over zoom level
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 1,
            17, 3
          ],
          // Dense cloud color transitions
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0,0,255,0)",
            0.15, "rgba(0,174,239,0.25)",
            0.35, "rgba(6,182,212,0.5)",
            0.6, "rgba(250,204,21,0.75)",
            0.8, "rgba(249,115,22,0.9)",
            1, "rgba(239,68,68,0.95)"
          ],
          // Radius of density influence (pixels)
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 18,
            17, 40
          ],
          // Transparency overlay
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 0.85,
            17, 0.35
          ]
        }
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Plot pulsing complaints and barangays coordinates on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Construct GeoJSON FeatureCollection from current complaints
    const geojsonData = {
      type: "FeatureCollection",
      features: complaints.map((c) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [c.longitude, c.latitude]
        },
        properties: {
          id: c.id,
          category: c.category,
          urgency: c.urgency,
          weight: c.urgency === "CRITICAL" ? 3 : c.urgency === "HIGH" ? 2 : 1
        }
      }))
    };

    const updateSource = () => {
      const source = map.getSource("complaints-heatmap-source") as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(geojsonData as any);
      }
    };

    // Feed source data
    if (map.isStyleLoaded()) {
      updateSource();
    } else {
      map.once("style.load", updateSource);
    }

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Plot Barangay coordinate nodes (soft white rings)
    Object.entries(BARANGAY_COORDS).forEach(([name, coords]) => {
      const matchData = barangays.find((b) => b.name === name);
      const count = matchData ? matchData.count : 0;

      const el = document.createElement("div");
      el.className = "flex flex-col items-center justify-center cursor-pointer group";
      el.innerHTML = `
        <div class="w-6 h-6 rounded-full border border-slate-600 bg-slate-900/90 text-[8px] font-black text-slate-300 flex items-center justify-center shadow-lg group-hover:border-cyan-400 group-hover:scale-110 transition-all ${
          count >= 16 ? "border-red-500 text-red-400 bg-red-950/40" :
          count >= 10 ? "border-orange-500 text-orange-400 bg-orange-950/40" :
          count > 0 ? "border-yellow-500 text-yellow-400 bg-yellow-950/40" : ""
        }">
          ${count}
        </div>
        <div class="absolute -bottom-5 bg-slate-950/90 border border-slate-800 text-[8px] font-bold text-slate-300 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
          Brgy. ${name} (${count} complaints)
        </div>
      `;

      el.addEventListener("click", () => {
        setSelectedBarangay({ name, count });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // 2. Plot individual complaints with pulsing classification colors
    complaints.forEach((comp) => {
      const el = document.createElement("div");
      el.className = "w-5 h-5 rounded-full flex items-center justify-center relative";

      // Class-specific color mappings
      let colorName = "blue";
      let hexColor = "#3b82f6";
      switch (comp.category) {
        case "PIPELINE_BREACH_PRESSURE_DROP":
          colorName = "red";
          hexColor = "#ef4444";
          break;
        case "HIGH_TURBIDITY":
          colorName = "yellow";
          hexColor = "#facc15";
          break;
        case "HIGH_MINERAL_CONTENT_TDS":
          colorName = "orange";
          hexColor = "#f97316";
          break;
        case "CHEMICAL_DISCOLORATION_CONTAMINATION":
          colorName = "purple";
          hexColor = "#a855f7";
          break;
        case "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY":
          colorName = "blue";
          hexColor = "#3b82f6";
          break;
      }

      el.innerHTML = `
        <span class="absolute w-2 h-2 rounded-full z-10" style="background-color: ${hexColor}"></span>
        <span class="absolute inset-0 rounded-full marker-pulse-${colorName}"></span>
      `;

      // Set Popup for details
      const popup = new mapboxgl.Popup({ offset: 12, closeButton: false })
        .setHTML(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 2px; color: #001e66;">
            <strong>Category:</strong> ${comp.category.replace(/_/g, " ")}<br/>
            <strong>Summary:</strong> "${comp.summary}"
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([comp.longitude, comp.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [barangays, complaints]);

  // Sync zoom transitions when a Barangay is selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBarangay) return;

    const coords = BARANGAY_COORDS[selectedBarangay.name];
    if (coords) {
      map.flyTo({
        center: coords,
        zoom: 15.2,
        essential: true,
        pitch: 30,
      });
    }
  }, [selectedBarangay]);

  // Fetch Gemini AI summaries for the selected Barangay
  useEffect(() => {
    if (!selectedBarangay) {
      setAiSummary(null);
      setAiStatus(null);
      return;
    }

    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const res = await fetch(`/api/admin/barangay-summary?barangay=${encodeURIComponent(selectedBarangay.name)}`);
        const data = await res.json();
        if (data.success) {
          setAiSummary(data.summary);
          setAiStatus(data.status);
        } else {
          setAiSummary("Failed to fetch reports analysis for this sector.");
          setAiStatus("UNKNOWN");
        }
      } catch (err) {
        console.error("AI Summary lookup failed:", err);
        setAiSummary("Network error analyzing reports database.");
        setAiStatus("UNKNOWN");
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [selectedBarangay]);

  const sorted = [...barangays].sort((a, b) => b.count - a.count);
  const topBarangays = sorted.filter((b) => b.count > 0).slice(0, 10);
  const totalComplaints = barangays.reduce((s, b) => s + b.count, 0);
  const hotspotCount = barangays.filter((b) => b.count >= 16).length;

  // Custom styles for pulsing halos on complaint markers
  const pulseStyle = `
    @keyframes map-pulse-red {
      0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1.2); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    @keyframes map-pulse-yellow {
      0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
      70% { transform: scale(1.2); box-shadow: 0 0 0 8px rgba(250, 204, 21, 0); }
      100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
    }
    @keyframes map-pulse-orange {
      0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
      70% { transform: scale(1.2); box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
      100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
    }
    @keyframes map-pulse-purple {
      0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7); }
      70% { transform: scale(1.2); box-shadow: 0 0 0 8px rgba(168, 85, 247, 0); }
      100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
    }
    @keyframes map-pulse-blue {
      0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      70% { transform: scale(1.2); box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
      100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
    .marker-pulse-red { animation: map-pulse-red 2s infinite; }
    .marker-pulse-yellow { animation: map-pulse-yellow 2s infinite; }
    .marker-pulse-orange { animation: map-pulse-orange 2s infinite; }
    .marker-pulse-purple { animation: map-pulse-purple 2s infinite; }
    .marker-pulse-blue { animation: map-pulse-blue 2s infinite; }
  `;

  return (
    <div className="space-y-6">
      <style>{pulseStyle}</style>

      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">Spatial Incident Heatmap</h2>
          <p className="text-xs text-slate-500 font-bold">
            Live complaint density across all 35 barangays of City of San Fernando, Pampanga
          </p>
        </div>
        
        {/* Pulsing Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-black text-[#001e66]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50" /> Pipeline Breach
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block shadow-sm shadow-yellow-500/50" /> Turbidity
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shadow-sm shadow-orange-500/50" /> TDS / Mineral
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block shadow-sm shadow-purple-500/50" /> Chemical
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50" /> Unclassified
          </div>
        </div>
      </div>

      {/* Mapbox Live Heatmap Display */}
      <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute bottom-3 right-3 z-10 bg-slate-950/90 text-[9px] font-bold text-slate-400 px-2 py-1 rounded border border-slate-800 shadow-md">
          San Fernando Heatmap Map · GPU Density Clouds
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Complaints", value: totalComplaints, color: "text-[#001e66]" },
          { label: "Hotspot Barangays", value: hotspotCount, color: "text-red-600" },
          { label: "Barangays Monitored", value: 35, color: "text-emerald-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Selected barangay detail card with Gemini AI Analysis */}
      {selectedBarangay && (
        <div className="bg-[#001e66] text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-md">
          <div className="space-y-2 flex-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-blue-300">
              📍 Selected Sector Analysis
            </div>
            <div className="text-xl font-black flex items-center gap-2">
              Brgy. {selectedBarangay.name}
              <span className="text-xs font-bold text-blue-200 bg-blue-900/60 px-2.5 py-0.5 rounded-full">
                {selectedBarangay.count} Complaint{selectedBarangay.count !== 1 ? "s" : ""}
              </span>
            </div>

            {/* AI Generated content */}
            <div className="pt-2 border-t border-blue-900/60 min-h-[50px]">
              <div className="text-[9px] font-black text-blue-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                🤖 Gemini AI Barangay Summary
              </div>
              {summaryLoading ? (
                <p className="text-xs text-blue-200 animate-pulse italic">Generative intelligence analyzing logs and compiling incident report...</p>
              ) : (
                <p className="text-xs text-slate-100 font-semibold leading-relaxed">
                  {aiSummary}
                </p>
              )}
            </div>
          </div>

          <div className="text-right shrink-0 md:pl-4 flex flex-col items-end justify-center">
            <div className="text-[9px] font-black uppercase tracking-widest text-blue-300 mb-1.5">
              Operational Status
            </div>
            {summaryLoading ? (
              <span className="w-20 h-5 bg-blue-900/40 rounded animate-pulse inline-block" />
            ) : (
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                aiStatus === "CRITICAL" ? "bg-red-500 text-white shadow-sm shadow-red-500/20" :
                aiStatus === "MODERATE" ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" :
                aiStatus === "LOW_RISK" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" :
                "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
              }`}>
                {aiStatus === "LOW_RISK" ? "LOW RISK" : aiStatus || "NORMAL"}
              </span>
            )}
            <div className="text-[9px] font-black text-blue-300 mt-2.5">
              {maxCount > 0 ? ((selectedBarangay.count / maxCount) * 100).toFixed(0) : "0"}% of city peak load
            </div>
          </div>
        </div>
      )}

      {/* Barangay Grid Heatmap */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#00aeef] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
            City Barangay Grid — Click cell to zoom map
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
            {barangays.map((brgy) => {
              const colorClass = getHeatColor(brgy.count);
              const isSelected = selectedBarangay?.name === brgy.name;
              return (
                <button
                  key={brgy.name}
                  onClick={() => setSelectedBarangay(isSelected ? null : brgy)}
                  title={`${brgy.name}: ${brgy.count} complaint${brgy.count !== 1 ? "s" : ""}`}
                  className={`relative border-2 rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:scale-105 hover:shadow-md ${colorClass} ${
                    isSelected ? "ring-2 ring-offset-1 ring-[#001e66] scale-105 shadow-md" : ""
                  }`}
                  style={{ minHeight: "72px" }}
                >
                  <span className="text-[9px] font-black leading-tight text-center break-words hyphens-auto">
                    {brgy.name}
                  </span>
                  <span className="text-base font-black leading-none">{brgy.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Barangay Leaderboard */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-black text-[#001e66] uppercase tracking-wider">
          Top Incident Hotspots
        </h3>
        {topBarangays.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No complaints recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {topBarangays.map((brgy, idx) => (
              <div key={brgy.name} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#001e66]">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#001e66] text-white rounded-md flex items-center justify-center text-[9px] font-black">
                      {idx + 1}
                    </span>
                    Brgy. {brgy.name}
                  </span>
                  <span className="text-slate-500">
                    {brgy.count} report{brgy.count !== 1 ? "s" : ""} · {getHeatLabel(brgy.count)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      getHeatLabel(brgy.count) === "CRITICAL" ? "bg-red-500" :
                      getHeatLabel(brgy.count) === "MODERATE" ? "bg-orange-500" :
                      "bg-yellow-300"
                    }`}
                    style={{ width: `${maxCount > 0 ? (brgy.count / maxCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
