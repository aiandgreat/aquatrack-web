import React from "react";

interface TelemetryNode {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  status: string;
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
  const filteredNodes = nodes.filter((n) =>
    n.name.toLowerCase().includes(nodeSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">Municipal Telemetry Nodes</h2>
          <p className="text-xs text-slate-500 font-medium">View GPS Coordinates and override operational states</p>
        </div>
        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            placeholder="Search by node name…"
            value={nodeSearchQuery}
            onChange={(e) => setNodeSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#001e66] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Node Details</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Coordinates</th>
              <th className="py-3 px-4">Node status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredNodes.map((n) => (
              <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-extrabold text-[#001e66] text-sm">{n.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 select-all">{n.id}</div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                    n.type === "PUMP_STATION" ? "bg-[#00aeef]/10 text-[#00aeef]" : "bg-purple-500/10 text-purple-600"
                  }`}>
                    {n.type}
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-slate-600 font-bold">
                  Lat: {n.latitude.toFixed(5)} <br /> Lng: {n.longitude.toFixed(5)}
                </td>
                <td className="py-4 px-4">
                  <select
                    value={n.status}
                    disabled={updatingNodeId === n.id}
                    onChange={(e) => handleUpdateNodeStatus(n.id, e.target.value)}
                    className="bg-white border border-slate-200 hover:border-[#00aeef] disabled:opacity-50 text-[#001e66] font-bold text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all"
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </td>
              </tr>
            ))}
            {filteredNodes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                  No nodes matched search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
