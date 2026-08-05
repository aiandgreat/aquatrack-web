import React, { useState } from "react";
import { 
  MapPin, 
  Search, 
  Cpu, 
  Sliders, 
  Droplet, 
  Waves, 
  Activity, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  AlertOctagon,
  Wrench,
  WifiOff,
  ChevronDown
} from "lucide-react";

interface TelemetryNode {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  status: string;
  reading?: {
    ph: number;
    turbidity: number;
    tds: number;
    pressure: number;
    timestamp: string;
  } | null;
}

interface TelemetrySectionProps {
  nodes: TelemetryNode[];
  nodeSearchQuery: string;
  setNodeSearchQuery: (q: string) => void;
  updatingNodeId: string | null;
  handleUpdateNodeStatus: (id: string, status: string) => void;
  previewNode?: TelemetryNode | null;
  setPreviewNode?: (node: TelemetryNode | null) => void;
}

export default function TelemetrySection({
  nodes,
  nodeSearchQuery,
  setNodeSearchQuery,
  updatingNodeId,
  handleUpdateNodeStatus,
  previewNode = null,
  setPreviewNode = () => {},
}: TelemetrySectionProps) {
  const [activeDropdownNodeId, setActiveDropdownNodeId] = useState<string | null>(null);

  const getBarangay = (nodeName: string) => {
    const nameLower = nodeName.toLowerCase();
    if (nameLower.includes("dolores")) return "Brgy. Dolores";
    if (nameLower.includes("pilar")) return "Brgy. Del Pilar";
    if (nameLower.includes("calulut")) return "Brgy. Calulut";
    if (nameLower.includes("sindalan")) return "Brgy. Sindalan";
    if (nameLower.includes("agustin")) return "Brgy. San Agustin";
    return "San Fernando District";
  };

  const getUniqueNodeId = (id: string) => {
    return `AQ-NODE-${id.slice(-8).toUpperCase()}`;
  };

  const filteredNodes = nodes.filter((n) => {
    const uniqueId = getUniqueNodeId(n.id);
    const query = nodeSearchQuery.toLowerCase();
    return (
      n.name.toLowerCase().includes(query) ||
      uniqueId.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in">
      {/* Title Header with Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-[#001e66] tracking-tight">Municipal Telemetry Nodes</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Monitor real-time sensor streams and override system operational states</p>
        </div>
        <div className="w-full md:w-72 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by node name or ID…"
            value={nodeSearchQuery}
            onChange={(e) => setNodeSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-bold text-[#001e66] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] focus:bg-white shadow-sm transition-all duration-200"
          />
        </div>
      </div>

      {/* Node Cards List */}
      <div className="space-y-5">
        {filteredNodes.map((n) => {
          const isPump = n.type === "PUMP_STATION" || n.name.toLowerCase().includes("station") || n.name.toLowerCase().includes("reservoir");
          const formattedType = isPump ? "Pumping Station" : "Pipeline Node";

          // Status colors and labels
          const statusTheme = n.status === "ONLINE"
            ? { 
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />, 
                text: "text-emerald-700", 
                bg: "bg-emerald-50", 
                border: "border-emerald-200", 
                focus: "focus:ring-emerald-400" 
              }
            : n.status === "MAINTENANCE"
            ? { 
                icon: <Wrench className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />, 
                text: "text-amber-700", 
                bg: "bg-amber-50", 
                border: "border-amber-200", 
                focus: "focus:ring-amber-400" 
              }
            : { 
                icon: <WifiOff className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />, 
                text: "text-rose-700", 
                bg: "bg-rose-50", 
                border: "border-rose-200", 
                focus: "focus:ring-rose-400" 
              };

          return (
            <div 
              key={n.id} 
              className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md hover:border-slate-200/80 transition-all duration-300 flex flex-col gap-4 text-left group"
            >
              {/* Header details */}
              <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    {statusTheme.icon}
                    <h4 className="font-extrabold text-[#001e66] text-sm tracking-tight">
                      {n.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px] font-bold">
                    <span className="font-mono text-slate-455 select-all tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      {getUniqueNodeId(n.id)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] uppercase tracking-wider ${
                      isPump
                        ? "bg-sky-50 text-sky-700 border-sky-150"
                        : "bg-indigo-50 text-indigo-700 border-indigo-150"
                    }`}>
                      {isPump ? <Cpu className="w-2.5 h-2.5 shrink-0" /> : <Sliders className="w-2.5 h-2.5 shrink-0" />}
                      {formattedType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
                  {/* Map Pin Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewNode(n)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 text-slate-600 hover:text-sky-600 transition-all font-bold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <MapPin className="w-3.5 h-3.5 text-sky-500 transition-transform shrink-0" />
                    <span>{getBarangay(n.name)}</span>
                  </button>

                  {/* Manual Status Override Selector */}
                  <div className="flex items-center gap-2 relative">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                    <button
                      type="button"
                      onClick={() => setActiveDropdownNodeId(activeDropdownNodeId === n.id ? null : n.id)}
                      disabled={updatingNodeId === n.id}
                      className={`flex items-center gap-1.5 font-extrabold text-[9px] uppercase tracking-widest py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border} focus:outline-none shadow-sm hover:shadow-md`}
                    >
                      {n.status === "ONLINE" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {n.status === "MAINTENANCE" && <Wrench className="w-3 h-3 text-amber-500" />}
                      {n.status === "OFFLINE" && <WifiOff className="w-3 h-3 text-rose-500" />}
                      <span>{n.status}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400 ml-1 transition-transform group-hover:translate-y-0.5" />
                    </button>
                    
                    {activeDropdownNodeId === n.id && (
                      <>
                        {/* Clear fullscreen layer to capture clicks outside */}
                        <div 
                          className="fixed inset-0 z-[60]" 
                          onClick={() => setActiveDropdownNodeId(null)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-[70] animate-fade-in text-[10px] font-black text-slate-600 uppercase tracking-wider">
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateNodeStatus(n.id, "ONLINE");
                              setActiveDropdownNodeId(null);
                            }}
                            className="flex items-center w-full px-3.5 py-2 hover:bg-slate-50 transition-all text-left border-none focus:outline-none cursor-pointer text-emerald-600 hover:text-emerald-700 font-bold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2 shrink-0 text-emerald-500" />
                            <span>ONLINE</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateNodeStatus(n.id, "OFFLINE");
                              setActiveDropdownNodeId(null);
                            }}
                            className="flex items-center w-full px-3.5 py-2 hover:bg-slate-50 transition-all text-left border-none focus:outline-none cursor-pointer text-rose-600 hover:text-rose-700 font-bold"
                          >
                            <WifiOff className="w-3.5 h-3.5 mr-2 shrink-0 text-rose-500" />
                            <span>OFFLINE</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateNodeStatus(n.id, "MAINTENANCE");
                              setActiveDropdownNodeId(null);
                            }}
                            className="flex items-center w-full px-3.5 py-2 hover:bg-slate-50 transition-all text-left border-none focus:outline-none cursor-pointer text-amber-600 hover:text-amber-700 font-bold"
                          >
                            <Wrench className="w-3.5 h-3.5 mr-2 shrink-0 text-amber-500" />
                            <span>MAINTENANCE</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              {n.reading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  {/* pH LEVEL */}
                  {(() => {
                    const isAnomaly = n.reading.ph < 6.5 || n.reading.ph > 8.5;
                    return (
                      <div className={`p-4 rounded-xl border transition-all duration-300 ${
                        isAnomaly 
                          ? "bg-rose-50/30 border-rose-200/60 shadow-rose-50/10" 
                          : "bg-slate-50/50 border-slate-100 shadow-inner"
                      }`}>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>pH LEVEL</span>
                          <Droplet className={`w-4 h-4 ${isAnomaly ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <span className="text-lg font-black font-mono text-[#001e66]">{n.reading.ph.toFixed(2)}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isAnomaly ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {isAnomaly ? "ANOMALY" : "NORMAL"}
                          </span>
                        </div>
                        {/* Micro Progress Bar */}
                        <div className="mt-3 h-1 w-full bg-slate-200/60 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isAnomaly ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (n.reading.ph / 14) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* TURBIDITY */}
                  {(() => {
                    const isAnomaly = n.reading.turbidity > 5.0;
                    return (
                      <div className={`p-4 rounded-xl border transition-all duration-300 ${
                        isAnomaly 
                          ? "bg-amber-50/40 border-amber-200/60 shadow-amber-50/10" 
                          : "bg-slate-50/50 border-slate-100 shadow-inner"
                      }`}>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>TURBIDITY (NTU)</span>
                          <Waves className={`w-4 h-4 ${isAnomaly ? "text-amber-500 animate-pulse" : "text-slate-400"}`} />
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <span className="text-lg font-black font-mono text-[#001e66]">{n.reading.turbidity.toFixed(1)} <span className="text-[10px] font-normal">NTU</span></span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isAnomaly ? "bg-amber-100 text-amber-700 animate-pulse" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {isAnomaly ? "HIGH" : "NORMAL"}
                          </span>
                        </div>
                        {/* Micro Progress Bar */}
                        <div className="mt-3 h-1 w-full bg-slate-200/60 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isAnomaly ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (n.reading.turbidity / 10) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* TDS */}
                  {(() => {
                    const isAnomaly = n.reading.tds > 500;
                    return (
                      <div className={`p-4 rounded-xl border transition-all duration-300 ${
                        isAnomaly 
                          ? "bg-amber-50/40 border-amber-200/60 shadow-amber-50/10" 
                          : "bg-slate-50/50 border-slate-100 shadow-inner"
                      }`}>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>TDS (MINERALS)</span>
                          <Activity className={`w-4 h-4 ${isAnomaly ? "text-amber-500 animate-pulse" : "text-slate-400"}`} />
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <span className="text-lg font-black font-mono text-[#001e66]">{n.reading.tds.toFixed(0)} <span className="text-[10px] font-normal">ppm</span></span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isAnomaly ? "bg-amber-100 text-amber-700 animate-pulse" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {isAnomaly ? "HIGH" : "NORMAL"}
                          </span>
                        </div>
                        {/* Micro Progress Bar */}
                        <div className="mt-3 h-1 w-full bg-slate-200/60 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isAnomaly ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (n.reading.tds / 1000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* PRESSURE */}
                  {(() => {
                    const isAnomaly = n.reading.pressure < 30;
                    return (
                      <div className={`p-4 rounded-xl border transition-all duration-300 ${
                        isAnomaly 
                          ? "bg-rose-50/30 border-rose-200/60 shadow-rose-50/10" 
                          : "bg-slate-50/50 border-slate-100 shadow-inner"
                      }`}>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>PRESSURE (PSI)</span>
                          <Gauge className={`w-4 h-4 ${isAnomaly ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <span className="text-lg font-black font-mono text-[#001e66]">{n.reading.pressure.toFixed(1)} <span className="text-[10px] font-normal">psi</span></span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isAnomaly ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {isAnomaly ? "LOW" : "NORMAL"}
                          </span>
                        </div>
                        {/* Micro Progress Bar */}
                        <div className="mt-3 h-1 w-full bg-slate-200/60 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isAnomaly ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (n.reading.pressure / 100) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xxs font-semibold text-slate-400 italic w-fit">
                  <AlertOctagon className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                  <span>No active telemetry logs stream connected for this node</span>
                </div>
              )}
            </div>
          );
        })}

        {filteredNodes.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 bg-white/40 shadow-inner flex flex-col items-center justify-center space-y-2">
            <AlertOctagon className="w-8 h-8 text-slate-300 animate-bounce" />
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">No telemetry nodes found</p>
            <p className="text-[10px] text-slate-400 font-medium">Try updating your search query or check connection configurations.</p>
          </div>
        )}
      </div>

      {/* (Modal rendering lifted to root in DashboardAdmin to ensure absolute background blur over nav bar) */}
    </div>
  );
}
