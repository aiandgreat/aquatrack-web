"use client";

import React, { useState, useMemo } from "react";
import { sortCrewsByProximity } from "../lib/spatial-sorting";
import { 
  AlertTriangle, 
  Activity, 
  MapPin, 
  ClipboardList, 
  Compass
} from "lucide-react";

interface Alert {
  id: string;
  node: { name: string; latitude: number; longitude: number };
  // Supports both nested geminiAnalysis and top-level fallbacks
  probableRootCause?: string;
  recommendedAction?: string;
  geminiAnalysis?: {
    rootCauseAnalysis?: string;
    probableRootCause?: string;
    confidenceScore?: number;
    recommendedAction?: string;
  } | string;
}

interface Crew {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface DiagnosticAlertDrawerProps {
  alert: Alert;
  crews: Crew[];
  onDispatch: (crewId: string) => void;
}

export default function DiagnosticAlertDrawer({ alert, crews, onDispatch }: DiagnosticAlertDrawerProps) {
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  // 1. Safely parse geminiAnalysis regardless of whether Supabase returns a JSON Object or String
  const analysis = useMemo(() => {
    if (!alert.geminiAnalysis) {
      return {
        probableRootCause: alert.probableRootCause || "Unknown Anomaly Detected",
        confidenceScore: 85,
        recommendedAction: alert.recommendedAction || "Inspect node for localized pipeline issues.",
        rootCauseAnalysis: null,
      };
    }

    if (typeof alert.geminiAnalysis === "string") {
      try {
        return JSON.parse(alert.geminiAnalysis);
      } catch (err) {
        console.error("Failed to parse geminiAnalysis JSON string:", err);
        return {
          probableRootCause: alert.probableRootCause || "Diagnostic Parsing Error",
          confidenceScore: 80,
          recommendedAction: alert.recommendedAction || "Inspect node valves and line integrity.",
          rootCauseAnalysis: null,
        };
      }
    }

    return alert.geminiAnalysis;
  }, [alert]);

  // Extract variables with full fallbacks
  const probableRootCause = analysis.probableRootCause || alert.probableRootCause || "Localized Pipeline Anomaly";
  const confidenceScore = analysis.confidenceScore ?? 85;
  const recommendedAction = analysis.recommendedAction || alert.recommendedAction || "Inspect node valves and water lines.";
  const rootCauseAnalysis = analysis.rootCauseAnalysis;

  const alertLocation = { lat: alert.node.latitude, lng: alert.node.longitude };
  const sortedCrews = sortCrewsByProximity(alertLocation, crews);

  const handleDispatch = (crewId: string) => {
    setDispatchingId(crewId);
    onDispatch(crewId);
    setTimeout(() => {
      setDispatchingId(null);
    }, 1500);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 p-5 text-slate-800 dark:text-slate-100 shadow-md backdrop-blur-md">
      {/* Decorative top pulse brand accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0B2E7A] via-[#00aeef] to-emerald-500" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Diagnostic Analysis
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-black tracking-tight text-[#001e66] dark:text-slate-100">
            Root-Cause Diagnostic Report
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sensor Node: <span className="font-bold text-[#00aeef]">{alert.node.name}</span>
          </p>
        </div>
      </div>

      {/* Probable Cause Card */}
      <div className="mt-5 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/30 dark:bg-rose-950/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-rose-600" />
            Probable Root Cause
          </span>
          <span className="inline-flex items-center rounded-lg bg-white dark:bg-slate-900 px-2.5 py-1 text-[10px] font-black text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 shadow-sm">
            Confidence: {confidenceScore}%
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-bold">
          {probableRootCause}
        </p>
        
        {/* Visual score slider track */}
        <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-[#00aeef] transition-all duration-700"
            style={{ width: `${confidenceScore}%` }}
          />
        </div>
      </div>

      {/* Recommended Action Card */}
      <div className="mt-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-4">
        <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-[#001e66] dark:text-[#00aeef]">
          <ClipboardList className="w-4 h-4 text-[#00aeef]" />
          <span>Recommended Action</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-650 dark:text-slate-300 italic font-medium pl-2.5 border-l-2 border-slate-300 dark:border-slate-700">
          "{recommendedAction}"
        </p>
      </div>

      {/* Crew Proximity Dispatcher */}
      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1.5">
            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Technician Proximity Dispatcher
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sorted by distance</span>
        </div>

        {sortedCrews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 py-8 text-center text-xs text-slate-450 dark:text-slate-550 italic">
            No active technicians found nearby.
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {sortedCrews.map((crew) => {
              const distanceKm = crew.distance / 1000;
              const isDispatching = dispatchingId === crew.id;

              return (
                <div
                  key={crew.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/20 p-3 transition-all duration-200 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 shadow-sm"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="truncate text-xs font-black text-slate-750 dark:text-slate-200">
                      {crew.name}
                    </p>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                        {distanceKm < 1 
                          ? `${crew.distance.toFixed(0)} meters` 
                          : `${distanceKm.toFixed(2)} km`} away
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDispatch(crew.id)}
                    disabled={isDispatching}
                    className={`ml-3 inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:ring-offset-2 active:scale-95 cursor-pointer shadow-sm ${
                      isDispatching
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                        : "bg-[#0B2E7A] hover:bg-[#00aeef] text-white active:bg-[#0B2E7A]"
                    }`}
                  >
                    {isDispatching ? (
                      <span className="flex items-center space-x-1.5">
                        <svg className="animate-spin h-3.5 w-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Dispatching...</span>
                      </span>
                    ) : (
                      "Dispatch"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}