import React from "react";
import { 
  Mail, 
  Wrench, 
  ShieldAlert, 
  Sliders, 
  Database, 
  Cpu, 
  Play
} from "lucide-react";

interface TelemetryNode {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface ConfigSectionProps {
  nodes: TelemetryNode[];
  selectedSimNodeId: string;
  setSelectedSimNodeId: (id: string) => void;
  simPreset: "normal" | "pressure_drop" | "turbidity" | "contamination";
  setSimPreset: (preset: "normal" | "pressure_drop" | "turbidity" | "contamination") => void;
  simValues: {
    ph: number;
    turbidity: number;
    tds: number;
    pressure: number;
  };
  setSimValues: (v: any) => void;
  aiTriageStrictness: number;
  setAiTriageStrictness: (val: number) => void;
  emailAlertsEnabled: boolean;
  setEmailAlertsEnabled: (val: boolean) => void;
  hotCacheTTL: number;
  setHotCacheTTL: (val: number) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: (enabled: boolean) => void;
  handleTriggerSimulation: (e: React.FormEvent) => void;
}

export default function ConfigSection({
  nodes,
  selectedSimNodeId,
  setSelectedSimNodeId,
  simPreset,
  setSimPreset,
  simValues,
  setSimValues,
  aiTriageStrictness,
  setAiTriageStrictness,
  emailAlertsEnabled,
  setEmailAlertsEnabled,
  hotCacheTTL,
  setHotCacheTTL,
  maintenanceMode,
  setMaintenanceMode,
  handleTriggerSimulation,
}: ConfigSectionProps) {
  return (
    <div className="space-y-6 text-left">
      {/* Section Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-black text-[#001e66] dark:text-slate-100 tracking-tight">System Configuration &amp; Telemetry Simulator</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Control global variables, AI strictness levels, and trigger telemetry flows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Global System Configuration */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/40 border border-slate-200/85 dark:border-slate-800/85 rounded-3xl p-5 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-[#00aeef]" />
            <h3 className="text-xs font-black text-[#001e66] dark:text-slate-100 uppercase tracking-wider">
              Global System Variables
            </h3>
          </div>

          {/* 1. AI Triage Strictness */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#001e66] dark:text-slate-100">
              <span>AI Alert Filtering (Sensitivity)</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full font-mono">
                {aiTriageStrictness <= 60 ? "Low" : aiTriageStrictness >= 85 ? "High" : "Medium"} ({aiTriageStrictness}%)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={aiTriageStrictness}
              onChange={(e) => setAiTriageStrictness(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#001e66] dark:accent-[#00aeef]"
            />
            <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider">
              <span>Show All Alerts</span>
              <span>Only Confirmed Alerts</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium leading-relaxed">
              Controls how strict the AI is. Higher sensitivity filters out speculative correlations, ensuring dispatchers only focus on verified leaks and blockages.
            </p>
          </div>

          {/* 2. Cache TTL */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Upstash Hot Cache TTL (seconds)</span>
            </label>
            <input
              type="number"
              value={hotCacheTTL}
              onChange={(e) => setHotCacheTTL(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#001e66] dark:text-slate-100 font-bold text-xs py-2 px-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium leading-relaxed">Length of time sensor bursts reside in Upstash Redis cache.</p>
          </div>

          {/* 3. Email Notifications using Brevo API */}
          <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#001e66] dark:text-slate-100 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#00aeef] shrink-0" />
                  <span>Email Alert Notifications (Brevo)</span>
                </span>
                <p className="text-[9px] text-slate-400 dark:text-slate-400">Dispatches details via Brevo API to technicians.</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-all border-none cursor-pointer focus:outline-none ${
                  emailAlertsEnabled ? "bg-[#00aeef]" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div className={`bg-white dark:bg-slate-300 w-4 h-4 rounded-full shadow transition-all ${
                  emailAlertsEnabled ? "translate-x-6" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>

          {/* 4. Maintenance Mode — Always-visible bold panel */}
          <div className={`rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
            maintenanceMode
              ? "border-amber-400 shadow-lg shadow-amber-200/40 dark:shadow-amber-950/40"
              : "border-[#001e66]/30 dark:border-[#00aeef]/30 shadow-md"
          }`}>
            {/* Header band — always dark and strong */}
            <div className={`px-4 py-3 flex items-center justify-between transition-all duration-500 ${
              maintenanceMode
                ? "bg-amber-500"
                : "bg-[#001e66] dark:bg-[#00aeef]"
            }`}>
              <div className="flex items-center gap-2">
                <Wrench className={`w-4 h-4 shrink-0 text-white dark:text-[#001e66] ${maintenanceMode ? "animate-spin" : ""}`} style={{ animationDuration: "6s" }} />
                <span className="text-xs font-black text-white dark:text-[#001e66] uppercase tracking-wider">
                  {maintenanceMode ? "⚠ Maintenance Mode ACTIVE" : "Maintenance Mode Override"}
                </span>
              </div>
              {/* Large prominent toggle */}
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/40 ${
                  maintenanceMode
                    ? "border-amber-300 bg-white/20"
                    : "border-white/30 bg-white/20"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md ring-0 transition-all duration-300 ${
                    maintenanceMode
                      ? "translate-x-7 bg-amber-200"
                      : "translate-x-0 bg-white dark:bg-slate-900"
                  }`}
                />
              </button>
            </div>

            {/* Body */}
            <div className={`px-4 py-3.5 space-y-3 transition-all duration-500 ${
              maintenanceMode ? "bg-amber-50 dark:bg-amber-950/30" : "bg-[#001e66]/5 dark:bg-slate-900/60"
            }`}>
              <p className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                Blocks public-facing portals and shows a styled maintenance notice to residents. Admin, login, and crew routes remain fully accessible.
              </p>

              {/* Live status pill */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                maintenanceMode
                  ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
              }`}>
                <span className={`w-2 h-2 rounded-full ${maintenanceMode ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
                {maintenanceMode ? "Maintenance Active — Public Portals Offline" : "Online — All Services Operational"}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Telemetry Simulator Form */}
        <form onSubmit={handleTriggerSimulation} className="lg:col-span-7 bg-white dark:bg-slate-900/40 border border-slate-200/85 dark:border-slate-800/85 rounded-3xl p-5 space-y-4.5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-[#00aeef]" />
            <h3 className="text-xs font-black text-[#001e66] dark:text-slate-100 uppercase tracking-wider">
              Mock Telemetry Stream Simulation
            </h3>
          </div>

          {/* Node Selector */}
          <div className="space-y-1.5">
            <label className="text-xxs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Target Telemetry Node</label>
            <select
              value={selectedSimNodeId}
              onChange={(e) => setSelectedSimNodeId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#00aeef] text-[#001e66] dark:text-slate-100 font-bold text-xs py-2.5 px-3.5 rounded-xl focus:outline-none transition-all cursor-pointer"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} (ID: {n.id.substring(0, 8)}…)
                </option>
              ))}
            </select>
          </div>

          {/* Presets */}
          <div className="space-y-1.5">
            <label className="text-xxs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Presets</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "normal", label: "Normal" },
                { key: "pressure_drop", label: "Leak" },
                { key: "turbidity", label: "Dirt" },
                { key: "contamination", label: "Acid" },
              ].map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setSimPreset(preset.key as any)}
                  className={`py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                    simPreset === preset.key
                      ? "bg-[#00aeef]/10 dark:bg-[#00aeef]/20 border-[#00aeef] text-[#00aeef] dark:text-sky-300"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#00aeef]/60 dark:hover:border-[#00aeef]/60 text-[#001e66] dark:text-slate-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Inputs Grid */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase">pH</label>
              <input
                type="number"
                step="0.1"
                value={simValues.ph}
                onChange={(e) => setSimValues({ ...simValues, ph: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#001e66] dark:text-slate-100 font-bold text-xs py-1.5 px-2 rounded-lg focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase">NTU</label>
              <input
                type="number"
                step="0.1"
                value={simValues.turbidity}
                onChange={(e) => setSimValues({ ...simValues, turbidity: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#001e66] dark:text-slate-100 font-bold text-xs py-1.5 px-2 rounded-lg focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase">TDS</label>
              <input
                type="number"
                value={simValues.tds}
                onChange={(e) => setSimValues({ ...simValues, tds: parseInt(e.target.value) || 0 })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#001e66] dark:text-slate-100 font-bold text-xs py-1.5 px-2 rounded-lg focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase">PSI</label>
              <input
                type="number"
                step="0.1"
                value={simValues.pressure}
                onChange={(e) => setSimValues({ ...simValues, pressure: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#001e66] dark:text-slate-100 font-bold text-xs py-1.5 px-2 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 bg-[#001e66] dark:bg-[#00aeef] hover:bg-[#00aeef] dark:hover:bg-[#00aeef]/90 text-white dark:text-[#001e66] font-extrabold py-3.5 rounded-xl transition-all shadow-md hover:scale-[1.01] active:scale-99 border-none focus:outline-none text-xs uppercase tracking-wider cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Ingest Packet Data</span>
          </button>
        </form>

      </div>
    </div>
  );
}
