import React, { useState } from "react";

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
}

export default function TelemetrySection({
  nodes,
  nodeSearchQuery,
  setNodeSearchQuery,
  updatingNodeId,
  handleUpdateNodeStatus,
}: TelemetrySectionProps) {
  const [previewNode, setPreviewNode] = useState<TelemetryNode | null>(null);

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
    <div className="space-y-6 text-left font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-250/60">
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">Municipal Telemetry Nodes</h2>
          <p className="text-xs text-slate-500 font-medium">Verify sensor operations and override system states</p>
        </div>
        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            placeholder="Search by node name…"
            value={nodeSearchQuery}
            onChange={(e) => setNodeSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-xs font-bold text-[#001e66] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] focus:bg-white shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Node Cards List Wrapper */}
      <div className="space-y-4">
        {filteredNodes.map((n) => {
          const isPump = n.type === "PUMP_STATION" || n.name.toLowerCase().includes("station") || n.name.toLowerCase().includes("reservoir");
          const formattedType = isPump ? "Pumping Station" : "Household Pipeline";

          // Determine dot color representing current status
          const dotColor = n.status === "ONLINE"
            ? "bg-emerald-500"
            : n.status === "MAINTENANCE"
            ? "bg-amber-500"
            : "bg-rose-500";

          return (
            <div key={n.id} className="border border-slate-100 rounded-2xl p-5 hover:bg-slate-50/30 hover:border-slate-200/80 hover:shadow-md transition-all bg-white shadow-sm flex flex-col gap-4 text-left">
              {/* Header Details: Status dot, Name, Node ID, Barangay tag, and Status override */}
              <div className="flex justify-between items-start mb-1 flex-wrap gap-4 border-b border-slate-100 pb-3.5">
                <div>
                  <h4 className="font-black text-[#001e66] dark:text-slate-100 text-sm flex items-center gap-1.5">
                    {/* Glowing status dot */}
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColor} shadow-sm animate-pulse`}></span>
                    {n.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold text-slate-400 select-all">
                      {getUniqueNodeId(n.id)}
                    </span>
                    <span className="text-slate-300 select-none">•</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                      isPump
                        ? "bg-sky-50 text-sky-700 border-sky-150"
                        : "bg-indigo-50 text-indigo-700 border-indigo-150"
                    }`}>
                      {formattedType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
                  {/* Clickable Location Tag */}
                  <button
                    type="button"
                    onClick={() => setPreviewNode(n)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-150 text-blue-600 hover:text-blue-800 transition-all font-bold text-xs cursor-pointer group focus:outline-none"
                  >
                    <svg className="w-3.5 h-3.5 text-blue-500 group-hover:scale-115 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hover:underline">{getBarangay(n.name)}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">Status:</span>
                    <select
                      value={n.status}
                      disabled={updatingNodeId === n.id}
                      onChange={(e) => handleUpdateNodeStatus(n.id, e.target.value)}
                      className={`font-black text-[10px] uppercase tracking-wider py-1.5 px-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all cursor-pointer ${
                        n.status === "ONLINE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400"
                          : n.status === "MAINTENANCE"
                          ? "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400"
                          : "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-400"
                      }`}
                    >
                      <option value="ONLINE">🟢 ONLINE</option>
                      <option value="OFFLINE">🔴 OFFLINE</option>
                      <option value="MAINTENANCE">🟡 MAINTENANCE</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Metric Grid: 4 parallel telemetry tracks (pH, Turbidity, TDS, Pressure) */}
              {n.reading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {/* Metric Card 1: pH Level */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner text-left">
                    <span className="text-[9px] font-bold text-slate-500 block">pH LEVEL</span>
                    <div className="flex justify-between text-xs font-mono font-bold text-[#001e66] dark:text-blue-300">
                      <span>{n.reading.ph.toFixed(2)}</span>
                      <span className={n.reading.ph < 6.8 || n.reading.ph > 8.2 ? "text-rose-500 animate-pulse font-black" : "text-emerald-500"}>
                        {n.reading.ph < 6.8 || n.reading.ph > 8.2 ? "ANOMALY" : "NORMAL"}
                      </span>
                    </div>
                  </div>

                  {/* Metric Card 2: Turbidity (NTU) */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner text-left">
                    <span className="text-[9px] font-bold text-slate-500 block">TURBIDITY (NTU)</span>
                    <div className="flex justify-between text-xs font-mono font-bold text-[#001e66] dark:text-blue-300">
                      <span>{n.reading.turbidity.toFixed(1)} NTU</span>
                      <span className={n.reading.turbidity > 3.0 ? "text-rose-500 animate-pulse font-black" : "text-emerald-500"}>
                        {n.reading.turbidity > 3.0 ? "HIGH" : "NORMAL"}
                      </span>
                    </div>
                  </div>

                  {/* Metric Card 3: TDS (PPM) */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner text-left">
                    <span className="text-[9px] font-bold text-slate-500 block">TDS (PPM)</span>
                    <div className="flex justify-between text-xs font-mono font-bold text-[#001e66] dark:text-blue-300">
                      <span>{n.reading.tds.toFixed(0)} ppm</span>
                      <span className={n.reading.tds > 400 ? "text-rose-500 animate-pulse font-black" : "text-emerald-500"}>
                        {n.reading.tds > 400 ? "HIGH" : "NORMAL"}
                      </span>
                    </div>
                  </div>

                  {/* Metric Card 4: Pressure (PSI) with dynamic warning animation */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner text-left">
                    <span className="text-[9px] font-bold text-slate-500 block">PRESSURE (PSI)</span>
                    <div className="flex justify-between text-xs font-mono font-bold text-[#001e66] dark:text-blue-300">
                      <span>{n.reading.pressure.toFixed(1)} psi</span>
                      <span className={n.reading.pressure < 20 ? "text-rose-500 animate-pulse font-black" : "text-emerald-500"}>
                        {n.reading.pressure < 20 ? "LOW" : "NORMAL"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-205/30 text-[10px] font-bold text-slate-400 italic w-fit text-left">
                  ⚠️ No active telemetry logs stream connected for this node
                </div>
              )}
            </div>
          );
        })}

        {filteredNodes.length === 0 && (
          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 bg-white/40 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider">No telemetry nodes found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try updating your node search parameters.</p>
          </div>
        )}
      </div>

      {/* Interactive Location Satellite Preview Modal */}
      {previewNode && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto pt-28">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative text-left">
            
            {/* Satellite Map Preview Image */}
            <div className="relative h-56 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-s+970006(${previewNode.longitude},${previewNode.latitude})/${previewNode.longitude},${previewNode.latitude},16.5,0/400x224?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                  alt="Satellite Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">No Mapbox Token Configured</div>
              )}
              {/* Close Button overlay */}
              <button
                type="button"
                onClick={() => setPreviewNode(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-950/40 hover:bg-slate-950/60 text-white flex items-center justify-center text-xs cursor-pointer transition-all border-none focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4">
              <div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider border ${
                  previewNode.type === "PUMP_STATION" || previewNode.name.toLowerCase().includes("station") || previewNode.name.toLowerCase().includes("reservoir")
                    ? "bg-sky-50 text-sky-700 border-sky-150"
                    : "bg-indigo-50 text-indigo-700 border-indigo-150"
                }`}>
                  {previewNode.type === "PUMP_STATION" || previewNode.name.toLowerCase().includes("station") || previewNode.name.toLowerCase().includes("reservoir")
                    ? "Pumping Station"
                    : "Household Pipeline"}
                </span>
                <h3 className="text-[#001e66] dark:text-slate-200 text-lg font-black mt-2 leading-snug">
                  {previewNode.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-1 select-all">
                  Node Code: {getUniqueNodeId(previewNode.id)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Barangay Location</span>
                  <span className="text-[#001e66] dark:text-slate-200 font-black text-sm">{getBarangay(previewNode.name)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Coordinates</span>
                  <span className="text-[#001e66] dark:text-slate-200 font-mono font-bold block mt-0.5">
                    {previewNode.latitude.toFixed(5)}, {previewNode.longitude.toFixed(5)}
                  </span>
                </div>
              </div>

              {/* Live Diagnostic Readings Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Live Diagnostic Readings</span>
                {previewNode.reading ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">pH Level</span>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-sm font-black text-[#001e66] dark:text-slate-200">{previewNode.reading.ph.toFixed(2)}</span>
                        <span className={`text-[8px] font-extrabold px-1 rounded ${
                          previewNode.reading.ph < 6.5 || previewNode.reading.ph > 8.5 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {previewNode.reading.ph < 6.5 || previewNode.reading.ph > 8.5 ? "WARN" : "OK"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Turbidity</span>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-sm font-black text-[#001e66] dark:text-slate-200">{previewNode.reading.turbidity.toFixed(1)} <span className="text-[9px] font-normal">NTU</span></span>
                        <span className={`text-[8px] font-extrabold px-1 rounded ${
                          previewNode.reading.turbidity > 5.0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {previewNode.reading.turbidity > 5.0 ? "WARN" : "OK"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">TDS (Minerals)</span>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-sm font-black text-[#001e66] dark:text-slate-200">{previewNode.reading.tds.toFixed(0)} <span className="text-[9px] font-normal">ppm</span></span>
                        <span className={`text-[8px] font-extrabold px-1 rounded ${
                          previewNode.reading.tds > 500 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {previewNode.reading.tds > 500 ? "WARN" : "OK"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Pressure</span>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-sm font-black text-[#001e66] dark:text-slate-200">{previewNode.reading.pressure.toFixed(1)} <span className="text-[9px] font-normal">PSI</span></span>
                        <span className={`text-[8px] font-extrabold px-1 rounded ${
                          previewNode.reading.pressure < 25 || previewNode.reading.pressure > 75 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {previewNode.reading.pressure < 25 || previewNode.reading.pressure > 75 ? "WARN" : "OK"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-900 rounded-xl">No telemetry logs found for this node.</div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Operational Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  previewNode.status === "ONLINE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  previewNode.status === "MAINTENANCE" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    previewNode.status === "ONLINE" ? "bg-emerald-500" :
                    previewNode.status === "MAINTENANCE" ? "bg-amber-500" :
                    "bg-rose-500"
                  }`} />
                  {previewNode.status}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPreviewNode(null)}
                className="w-full bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold py-2.5 rounded-xl transition-all shadow-sm text-xxs uppercase tracking-widest mt-2 cursor-pointer border-none focus:outline-none"
              >
                Close Map Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
