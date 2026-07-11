"use client";

import React, { useState, useEffect } from "react";

interface BarangayData {
  name: string;
  count: number;
}

function getHeatColor(count: number, max: number): string {
  if (max === 0 || count === 0) return "bg-slate-100 border-slate-200 text-slate-400";
  const ratio = count / max;
  if (ratio >= 0.75) return "bg-red-500 border-red-600 text-white";
  if (ratio >= 0.5)  return "bg-amber-400 border-amber-500 text-white";
  if (ratio >= 0.25) return "bg-yellow-300 border-yellow-400 text-yellow-900";
  return "bg-blue-100 border-blue-300 text-blue-800";
}

function getHeatLabel(count: number, max: number): string {
  if (max === 0 || count === 0) return "NONE";
  const ratio = count / max;
  if (ratio >= 0.75) return "CRITICAL";
  if (ratio >= 0.5)  return "HIGH";
  if (ratio >= 0.25) return "MODERATE";
  return "LOW";
}

export default function HeatmapsSection() {
  const [barangays, setBarangays] = useState<BarangayData[]>([]);
  const [maxCount, setMaxCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayData | null>(null);

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

  const sorted = [...barangays].sort((a, b) => b.count - a.count);
  const topBarangays = sorted.filter((b) => b.count > 0).slice(0, 10);
  const totalComplaints = barangays.reduce((s, b) => s + b.count, 0);
  const hotspotCount = barangays.filter((b) => b.count / maxCount >= 0.75).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">Spatial Incident Heatmap</h2>
          <p className="text-xs text-slate-500 font-bold">
            Live complaint density across all 35 barangays of City of San Fernando, Pampanga
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> CRITICAL
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> HIGH
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-yellow-300 inline-block" /> MODERATE
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300 inline-block" /> LOW
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200 inline-block" /> NONE
          </div>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Complaints", value: totalComplaints, color: "text-[#001e66]" },
          { label: "Hotspot Barangays", value: hotspotCount, color: "text-red-600" },
          { label: "Barangays Monitored", value: 35, color: "text-emerald-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Barangay Grid Heatmap */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#00aeef] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
            Barangay Grid — Click a cell to inspect
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
            {barangays.map((brgy) => {
              const colorClass = getHeatColor(brgy.count, maxCount);
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

      {/* Selected barangay detail card */}
      {selectedBarangay && (
        <div className="bg-[#001e66] text-white rounded-2xl p-5 flex items-center justify-between animate-fade-in">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-blue-300 mb-1">
              Barangay Detail
            </div>
            <div className="text-xl font-black">{selectedBarangay.name}</div>
            <div className="text-xs font-bold text-blue-200 mt-1">
              {selectedBarangay.count} total complaint{selectedBarangay.count !== 1 ? "s" : ""} logged
            </div>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${
              getHeatLabel(selectedBarangay.count, maxCount) === "CRITICAL" ? "bg-red-500" :
              getHeatLabel(selectedBarangay.count, maxCount) === "HIGH" ? "bg-amber-400 text-amber-900" :
              getHeatLabel(selectedBarangay.count, maxCount) === "MODERATE" ? "bg-yellow-300 text-yellow-900" :
              getHeatLabel(selectedBarangay.count, maxCount) === "LOW" ? "bg-blue-300 text-blue-900" :
              "bg-slate-200 text-slate-700"
            }`}>
              {getHeatLabel(selectedBarangay.count, maxCount)}
            </span>
            <div className="text-xs font-bold text-blue-300 mt-2">
              {maxCount > 0 ? ((selectedBarangay.count / maxCount) * 100).toFixed(1) : "0.0"}% of peak
            </div>
          </div>
        </div>
      )}

      {/* Top Barangay Leaderboard */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
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
                    {brgy.count} report{brgy.count !== 1 ? "s" : ""} · {getHeatLabel(brgy.count, maxCount)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      getHeatLabel(brgy.count, maxCount) === "CRITICAL" ? "bg-red-500" :
                      getHeatLabel(brgy.count, maxCount) === "HIGH" ? "bg-amber-400" :
                      getHeatLabel(brgy.count, maxCount) === "MODERATE" ? "bg-yellow-300" :
                      "bg-blue-300"
                    }`}
                    style={{ width: `${maxCount > 0 ? (brgy.count / maxCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PostGIS Buffer Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[#001e66] uppercase tracking-wider mb-1">
            Differential Buffer Check
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-md">
            PostGIS automatically correlates citizen complaints within a 500m radius of active telemetry anomalies to trigger automatic dispatch work orders.
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-2xl font-black text-[#001e66]">500m</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            PostGIS Scan Radius
          </p>
        </div>
      </div>
    </div>
  );
}
