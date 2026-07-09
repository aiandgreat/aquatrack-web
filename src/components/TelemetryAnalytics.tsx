"use client";

import React from "react";
import { AreaChart, Title, Card } from "@tremor/react";

interface Reading {
  timestamp: string;
  pressure: number;
  ph: number;
  turbidity: number;
  tds: number;
}

interface TelemetryAnalyticsProps {
  nodeName: string;
  readings: Reading[];
  onClose?: () => void;
}

export default function TelemetryAnalytics({ nodeName, readings, onClose }: TelemetryAnalyticsProps) {
  // Format timestamps for display on the x-axis
  const formattedReadings = readings.map((r) => ({
    ...r,
    formattedTime: new Date(r.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <Card className="bg-slate-900/95 border-slate-800 p-5 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col h-full max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">Node Telemetry</span>
          <Title className="text-slate-200 text-lg font-bold mt-0.5">{nodeName}</Title>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close analytics"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-6 flex-1">
        {/* Hydrostatic Pressure Tracker */}
        <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hydrostatic Pressure (PSI)</h3>
            <span className="text-xs font-medium text-cyan-400 font-mono">0 - 60 PSI Range</span>
          </div>
          <div className="h-32 mt-3">
            <AreaChart
              className="h-full"
              data={formattedReadings}
              index="formattedTime"
              categories={["pressure"]}
              colors={["cyan"]}
              showLegend={false}
              showYAxis={true}
              yAxisWidth={30}
              showGridLines={true}
              startEndOnly={false}
            />
          </div>
        </div>

        {/* Chemical Profile Analytics */}
        <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chemical Profile (pH & NTU)</h3>
            <span className="text-xs font-medium text-amber-500 font-mono">Correlated curves</span>
          </div>
          <div className="h-32 mt-3">
            <AreaChart
              className="h-full"
              data={formattedReadings}
              index="formattedTime"
              categories={["ph", "turbidity"]}
              colors={["amber", "emerald"]}
              showLegend={true}
              showYAxis={true}
              yAxisWidth={30}
              showGridLines={true}
            />
          </div>
        </div>

        {/* Total Dissolved Solids */}
        <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Dissolved Solids (TDS ppm)</h3>
            <span className="text-xs font-medium text-violet-400 font-mono">Mineral Content</span>
          </div>
          <div className="h-32 mt-3">
            <AreaChart
              className="h-full"
              data={formattedReadings}
              index="formattedTime"
              categories={["tds"]}
              colors={["violet"]}
              showLegend={false}
              showYAxis={true}
              yAxisWidth={40}
              showGridLines={true}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
