"use client";

import React, { useState } from "react";
import { sortCrewsByProximity } from "../lib/spatial-sorting";

interface Alert {
  id: string;
  node: { name: string; latitude: number; longitude: number };
  geminiAnalysis: {
    probableRootCause: string;
    confidenceScore: number;
    recommendedAction: string;
  };
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

  const alertLocation = { lat: alert.node.latitude, lng: alert.node.longitude };
  const sortedCrews = sortCrewsByProximity(alertLocation, crews);

  const handleDispatch = (crewId: string) => {
    setDispatchingId(crewId);
    onDispatch(crewId);
    // Reset state after a brief mock delay if needed, or let parent component handle state changes
    setTimeout(() => {
      setDispatchingId(null);
    }, 1500);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/95 p-5 text-slate-100 shadow-2xl backdrop-blur-md">
      {/* Decorative top pulse light bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-cyan-500" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              AI Diagnostic Analysis
            </span>
          </div>
          <h3 className="mt-1 text-lg font-extrabold tracking-tight text-white">
            Root-Cause Report
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Node: <span className="font-semibold text-slate-200">{alert.node.name}</span>
          </p>
        </div>
      </div>

      {/* Probable Cause Card */}
      <div className="mt-4 rounded-lg border border-red-950 bg-red-950/20 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-red-300">Probable Root Cause</span>
          <span className="inline-flex items-center rounded-md bg-red-950/80 px-2 py-0.5 text-xs font-bold text-red-400 border border-red-900/50">
            Confidence: {alert.geminiAnalysis.confidenceScore}%
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          {alert.geminiAnalysis.probableRootCause}
        </p>
        {/* Simple visual score bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-500"
            style={{ width: `${alert.geminiAnalysis.confidenceScore}%` }}
          />
        </div>
      </div>

      {/* Recommended Action Card */}
      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-3.5">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>Recommended AI Action</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-300 italic">
          "{alert.geminiAnalysis.recommendedAction}"
        </p>
      </div>

      {/* Crew Proximity Dispatcher */}
      <div className="mt-5 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1.5">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Technician Proximity Dispatcher
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Sorted by distance</span>
        </div>

        {sortedCrews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/20 py-6 text-center text-xs text-slate-500">
            No active technicians found nearby.
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {sortedCrews.map((crew) => {
              const distanceKm = crew.distance / 1000;
              const isDispatching = dispatchingId === crew.id;

              return (
                <div
                  key={crew.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/60"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="truncate text-xs font-bold text-slate-200">
                      {crew.name}
                    </p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-mono text-slate-400">
                        {distanceKm < 1 
                          ? `${crew.distance.toFixed(0)} m` 
                          : `${distanceKm.toFixed(2)} km`} away
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDispatch(crew.id)}
                    disabled={isDispatching}
                    className={`ml-2 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-extrabold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer ${
                      isDispatching
                        ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                        : "bg-cyan-500 hover:bg-cyan-400 hover:scale-105 active:scale-95 text-slate-950"
                    }`}
                  >
                    {isDispatching ? (
                      <span className="flex items-center space-x-1">
                        <svg className="animate-spin h-3 w-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
