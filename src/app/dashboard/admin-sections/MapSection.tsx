import React, { useState } from "react";
import MapboxMap from "../../../components/MapboxMap";
import { 
  Megaphone, 
  Cpu, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  AlertTriangle 
} from "lucide-react";

interface TelemetryNode {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface Complaint {
  id: string;
  rawText: string;
  translatedText: string;
  summary: string;
  latitude: number;
  longitude: number;
  urgency: string;
  category: string;
  status: string;
  aiStatus: string;
  imageUrl: string;
  createdAt: string;
  barangay?: string;
  userName?: string;
  userEmail?: string;
  serviceAccountNo?: string;
}

interface MapSectionProps {
  nodes: TelemetryNode[];
  complaints: Complaint[];
  selectedNodeId: string | null;
  selectedComplaintId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedComplaintId: (id: string | null) => void;
}

const ITEMS_PER_PAGE = 3;

const getUrgencyBadgeClass = (urgency: string) => {
  const u = urgency.toUpperCase();
  if (u === "CRITICAL") return "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60";
  if (u === "HIGH" || u === "URGENT") return "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60";
  if (u === "MEDIUM") return "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900/60";
  return "bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
};

export default function MapSection({
  nodes,
  complaints,
  selectedNodeId,
  selectedComplaintId,
  setSelectedNodeId,
  setSelectedComplaintId,
}: MapSectionProps) {
  // Pagination States
  const [complaintPage, setComplaintPage] = useState(1);
  const [nodePage, setNodePage] = useState(1);

  // Helper to format node IDs
  const getUniqueNodeId = (id: string) => {
    return `AQ-NODE-${id.slice(-8).toUpperCase()}`;
  };

  // Math for Pagination
  const totalComplaintPages = Math.ceil(complaints.length / ITEMS_PER_PAGE) || 1;
  const totalNodePages = Math.ceil(nodes.length / ITEMS_PER_PAGE) || 1;

  // Clamp current page selections within bounds if the lists shrink dynamically
  const activeComplaintPage = Math.min(complaintPage, totalComplaintPages);
  const activeNodePage = Math.min(nodePage, totalNodePages);

  const displayedComplaints = complaints.slice(
    (activeComplaintPage - 1) * ITEMS_PER_PAGE,
    activeComplaintPage * ITEMS_PER_PAGE
  );

  const displayedNodes = nodes.slice(
    (activeNodePage - 1) * ITEMS_PER_PAGE,
    activeNodePage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 flex flex-col flex-1 min-h-[550px] text-left">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-black text-[#001e66] tracking-tight">Geospatial Telemetry Control</h2>
        <p className="text-xs text-slate-500 font-medium">Click any incident pin to focus or load PostGIS coordinate buffers</p>
      </div>

      {/* Main Grid Row: Explicitly bounded to h-[620px] and items-stretch to align sidebar and map perfectly */}
      <div className="flex-grow flex flex-col md:flex-row gap-6 h-[620px] items-stretch">
        
        {/* Left Navigation Console */}
        <div className="w-full md:w-80 shrink-0 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col h-full justify-between gap-4 shadow-sm">
          
          {/* Section 1: Complaints */}
          <div className="flex-1 flex flex-col justify-between min-h-0">
            <div className="space-y-2">
              <h3 className="text-xxs font-black uppercase tracking-widest text-black dark:text-white flex items-center gap-1.5 mb-3">
                <Megaphone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Citizen Complaints</span>
              </h3>
              
              <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                {displayedComplaints.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedComplaintId(comp.id === selectedComplaintId ? null : comp.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedComplaintId === comp.id
                        ? "bg-rose-50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-500 text-[#001e66] dark:text-slate-100 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-500 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <Megaphone className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      selectedComplaintId === comp.id ? "text-rose-600 animate-bounce" : "text-rose-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center font-bold gap-2">
                        <span className="truncate">{comp.summary || "Complaint Report"}</span>
                        <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded ${getUrgencyBadgeClass(comp.urgency)} shrink-0`}>
                          {comp.urgency}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 text-[10px]">{comp.rawText}</p>
                    </div>
                  </div>
                ))}
                
                {complaints.length === 0 && (
                  <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs italic bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                    No active reports pin on map.
                  </div>
                )}
              </div>
            </div>

            {/* Complaints Pagination */}
            {totalComplaintPages > 1 && (
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <button
                  type="button"
                  disabled={activeComplaintPage === 1}
                  onClick={() => setComplaintPage(prev => Math.max(prev - 1, 1))}
                  className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-all cursor-pointer focus:outline-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span>Page {activeComplaintPage} of {totalComplaintPages}</span>
                <button
                  type="button"
                  disabled={activeComplaintPage === totalComplaintPages}
                  onClick={() => setComplaintPage(prev => Math.min(prev + 1, totalComplaintPages))}
                  className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-all cursor-pointer focus:outline-none"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-800" />

          {/* Section 2: Telemetry Nodes */}
          <div className="flex-1 flex flex-col justify-between min-h-0">
            <div className="space-y-2">
              <h3 className="text-xxs font-black uppercase tracking-widest text-black dark:text-white flex items-center gap-1.5 mb-3">
                <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Telemetry Nodes</span>
              </h3>
              
              <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                {displayedNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  
                  // Dynamically resolve theme colors based on node status
                  let themeClass = {
                    card: isSelected
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500 text-[#001e66] dark:text-slate-100 shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200",
                    icon: isSelected ? "text-emerald-600 animate-pulse" : "text-emerald-400",
                    badge: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60"
                  };
                  
                  if (node.status === "MAINTENANCE") {
                    themeClass = {
                      card: isSelected
                        ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500 text-[#001e66] dark:text-slate-100 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500 text-slate-700 dark:text-slate-200",
                      icon: isSelected ? "text-amber-600 animate-pulse" : "text-amber-400",
                      badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60"
                    };
                  } else if (node.status === "OFFLINE") {
                    themeClass = {
                      card: isSelected
                        ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-400 dark:border-rose-500 text-[#001e66] dark:text-slate-100 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-500 text-slate-700 dark:text-slate-200",
                      icon: isSelected ? "text-rose-600 animate-pulse" : "text-rose-400",
                      badge: "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                    };
                  }

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${themeClass.card}`}
                    >
                      <Cpu className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${themeClass.icon}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center font-bold gap-2">
                          <span className="truncate">{node.name}</span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${themeClass.badge}`}>
                            {node.status}
                          </span>
                        </div>
                        <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-1 select-all truncate">{getUniqueNodeId(node.id)}</p>
                      </div>
                    </div>
                  );
                })}
                
                {nodes.length === 0 && (
                  <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs italic bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                    No node records in database.
                  </div>
                )}
              </div>
            </div>

            {/* Nodes Pagination */}
            {totalNodePages > 1 && (
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <button
                  type="button"
                  disabled={activeNodePage === 1}
                  onClick={() => setNodePage(prev => Math.max(prev - 1, 1))}
                  className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-all cursor-pointer focus:outline-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span>Page {activeNodePage} of {totalNodePages}</span>
                <button
                  type="button"
                  disabled={activeNodePage === totalNodePages}
                  onClick={() => setNodePage(prev => Math.min(prev + 1, totalNodePages))}
                  className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-all cursor-pointer focus:outline-none"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Map view: explicitly h-full with relative position */}
        <div className="flex-1 relative h-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <MapboxMap
            nodes={nodes}
            complaints={complaints}
            selectedNodeId={selectedNodeId}
            selectedComplaintId={selectedComplaintId}
            onSelectNode={setSelectedNodeId}
            onSelectComplaint={setSelectedComplaintId}
          />
        </div>
      </div>
    </div>
  );
}
