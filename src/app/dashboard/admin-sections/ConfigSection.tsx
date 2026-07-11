import React from "react";

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
  handleTriggerSimulation,
}: ConfigSectionProps) {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-lg font-black text-[#001e66] tracking-tight">System Configuration &amp; Telemetry Simulator</h2>
        <p className="text-xs text-slate-500 font-medium">Control global variables, AI strictness levels, and trigger telemetry flows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Configuration Toggles */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Global System Variables
          </h3>

          {/* AI Triage Strictness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-[#001e66]">
              <span>AI Triage Strictness Confidence</span>
              <span>{aiTriageStrictness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={aiTriageStrictness}
              onChange={(e) => setAiTriageStrictness(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#001e66]"
            />
            <p className="text-[10px] text-slate-400">Controls confidence score cutoff for autonomous ticket assignment.</p>
          </div>

          {/* Cache TTL */}
          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase">Upstash Hot Cache TTL (seconds)</label>
            <input
              type="number"
              value={hotCacheTTL}
              onChange={(e) => setHotCacheTTL(parseInt(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 text-[#001e66] font-bold text-xs py-2 px-3 rounded-lg focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 font-bold font-bold font-bold">Length of time sensor bursts reside in Upstash Redis cache.</p>
          </div>

          {/* Email Notifications toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-[#001e66]">Email Alert Notifications</span>
              <p className="text-[9px] text-slate-400">Dispatches details via Resend API to engineers.</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
              className={`w-12 h-6 rounded-full p-1 transition-all ${
                emailAlertsEnabled ? "bg-[#001e66]" : "bg-slate-300"
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transition-all ${
                emailAlertsEnabled ? "translate-x-6" : "translate-x-0"
              }`} />
            </button>
          </div>
        </div>

        {/* Telemetry Simulator Form */}
        <form onSubmit={handleTriggerSimulation} className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Mock Telemetry Stream simulation
          </h3>

          {/* Node Selector */}
          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase">Target Telemetry Node</label>
            <select
              value={selectedSimNodeId}
              onChange={(e) => setSelectedSimNodeId(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-[#00aeef] text-[#001e66] font-bold text-xs py-2 px-3 rounded-lg focus:outline-none"
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
            <label className="text-xxs font-bold text-slate-500 uppercase">Presets</label>
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
                  className={`py-2 rounded-lg text-[10px] font-black border transition-all ${
                    simPreset === preset.key
                      ? "bg-[#00aeef]/10 border-[#00aeef] text-[#00aeef]"
                      : "bg-white border-slate-200 text-[#001e66]"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Inputs Grid */}
          <div className="grid grid-cols-4 gap-3 bg-white border border-slate-100 rounded-xl p-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">pH</label>
              <input
                type="number"
                step="0.1"
                value={simValues.ph}
                onChange={(e) => setSimValues({ ...simValues, ph: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 text-[#001e66] font-bold text-xs py-1.5 px-2 rounded focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">NTU</label>
              <input
                type="number"
                step="0.1"
                value={simValues.turbidity}
                onChange={(e) => setSimValues({ ...simValues, turbidity: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 text-[#001e66] font-bold text-xs py-1.5 px-2 rounded focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">TDS</label>
              <input
                type="number"
                value={simValues.tds}
                onChange={(e) => setSimValues({ ...simValues, tds: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 text-[#001e66] font-bold text-xs py-1.5 px-2 rounded focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">PSI</label>
              <input
                type="number"
                step="0.1"
                value={simValues.pressure}
                onChange={(e) => setSimValues({ ...simValues, pressure: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 text-[#001e66] font-bold text-xs py-1.5 px-2 rounded focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold py-3.5 rounded-xl transition-all shadow-sm text-xs uppercase tracking-wider"
          >
            Ingest Packet Data
          </button>
        </form>
      </div>
    </div>
  );
}
