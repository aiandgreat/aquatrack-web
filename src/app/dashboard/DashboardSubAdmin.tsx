"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabase";
import MapSection from "./admin-sections/MapSection";
import TelemetrySection from "./admin-sections/TelemetrySection";
import HomeSection from "./sub-admin-sections/HomeSection";
import ComplaintsSection from "./sub-admin-sections/ComplaintsSection";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  serviceAccountNo: string | null;
}

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
  assignedToId?: string | null;
  barangay: string;
  userName?: string;
  userEmail?: string;
  serviceAccountNo?: string;
}

interface DashboardStats {
  totalUsers: number;
  onlineNodes: number;
  totalNodes: number;
  unresolvedComplaints: number;
  complianceIndex: number;
}

interface DashboardSubAdminProps {
  initialUsers: User[];
  initialNodes: TelemetryNode[];
  initialComplaints: Complaint[];
  initialReadings: Record<string, any[]>;
  initialStats: DashboardStats;
}

export default function DashboardSubAdmin({
  initialUsers,
  initialNodes,
  initialComplaints,
  initialReadings,
  initialStats,
}: DashboardSubAdminProps) {
  const [session, setSession] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation
  const [activeTab, setActiveTab] = useState<"home" | "map" | "complaints" | "telemetry" | "advisories">("home");

  // Advisories state
  const [advisories, setAdvisories] = useState<{
    id: string;
    date: string;
    title: string;
    text: string;
    type: string;
    targetRole: string;
  }[]>([]);

  // Data State
  const [nodes, setNodes] = useState<TelemetryNode[]>(initialNodes);
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [users, setUsers] = useState<User[]>(initialUsers);

  // UI state
  const [complaintSearchQuery, setComplaintSearchQuery] = useState("");
  const [nodeSearchQuery, setNodeSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);
  const [updatingNodeId, setUpdatingNodeId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterAssignedOnly, setFilterAssignedOnly] = useState(true);

  // Auth and Role check
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const client = getSupabaseClient();
        const { data: { session: currentSession } } = await client.auth.getSession();

        if (!currentSession) {
          window.location.href = "/login";
          return;
        }

        setSession(currentSession);

        const res = await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentSession.user.id }),
        });
        const profile = await res.json();

        if (profile?.role !== "ADMIN" && profile?.role !== "FIELD_ENGINEER_TECHNICIAN") {
          window.location.href = "/dashboard";
        } else {
          setCurrentUserRole(profile?.role);
          await Promise.all([fetchNodes(), fetchComplaints(), fetchStats(), fetchUsers(), fetchAdvisories()]);
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  // Enable Supabase Realtime subscriptions for complaint changes
  useEffect(() => {
    if (!currentUserRole) return;

    try {
      const client = getSupabaseClient();
      const channel = client
        .channel("subadmin-complaints-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Complaint" },
          (payload) => {
            console.log("Realtime complaint update received:", payload);
            fetchComplaints(); // Refresh the list dynamically!
            fetchStats(); // Update dashboard metric counters!
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (err) {
      console.error("Failed to setup realtime complaints subscription:", err);
    }
  }, [currentUserRole]);

  const fetchAdvisories = async () => {
    try {
      const res = await fetch("/api/advisories");
      const data = await res.json();
      if (data.success) setAdvisories(data.advisories);
    } catch (err) {
      console.error("Failed to fetch advisories", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchNodes = async () => {
    try {
      const res = await fetch("/api/admin/nodes");
      const data = await res.json();
      if (data.success) setNodes(data.nodes);
    } catch (err) {
      console.error("Failed to fetch nodes", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch("/api/admin/complaints");
      const data = await res.json();
      if (data.success) setComplaints(data.complaints);
    } catch (err) {
      console.error("Failed to fetch complaints", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats({
          ...data.stats,
          complianceIndex: 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId: string, newStatus: string) => {
    setUpdatingComplaintId(complaintId);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: complaintId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", `Ticket status updated to ${newStatus}`);
        fetchComplaints();
        fetchStats();
      } else {
        showFeedback("error", data.error || "Failed to update ticket status");
      }
    } catch (err) {
      showFeedback("error", "Network error updating ticket status");
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  const handleViewLocation = (complaintId: string) => {
    setSelectedComplaintId(complaintId);
    setSelectedNodeId(null);
    setActiveTab("map");
  };

  const handleUpdateNodeStatus = async (nodeId: string, newStatus: string) => {
    setUpdatingNodeId(nodeId);
    try {
      const res = await fetch("/api/admin/nodes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nodeId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", "Node status updated successfully");
        fetchNodes();
        fetchStats();
      } else {
        showFeedback("error", data.error || "Failed to update node status");
      }
    } catch (err) {
      showFeedback("error", "Network error updating node status");
    } finally {
      setUpdatingNodeId(null);
    }
  };

  const handleLogout = async () => {
    const client = getSupabaseClient();
    await client.auth.signOut();
    window.location.href = "/login";
  };

  const showFeedback = (type: "success" | "error", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF4FA] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#00aeef] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#001e66] font-black text-sm tracking-wider uppercase">
            Loading Sub-Admin Command Center...
          </p>
        </div>
      </div>
    );
  }

  // Filter complaints assigned to this sub-admin
  const userId = session?.user?.id;
  const assignedComplaints = complaints.filter((c) => c.assignedToId === userId);
  const displayedComplaints = filterAssignedOnly ? assignedComplaints : complaints;

  const filteredComplaints = displayedComplaints.filter(
    (c) =>
      c.rawText.toLowerCase().includes(complaintSearchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(complaintSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#EEF4FA] text-[#001e66] flex flex-col font-sans relative w-full h-full overflow-x-hidden">
      {/* 3-way Top Color Ribbon */}
      <div className="absolute inset-x-0 top-0 flex h-1.5 z-50" aria-hidden="true">
        <span className="flex-1 bg-[#001e66]" />
        <span className="flex-1 bg-[#00aeef]" />
        <span className="flex-1 bg-[#970006]" />
      </div>

      {/* Top Header Card */}
      <header className="m-[18px] mb-0 h-[86px] shrink-0 bg-white border border-slate-200 rounded-[16px] shadow-sm shadow-blue-100 flex items-center justify-between px-6 z-40 relative">
        <div className="flex items-center space-x-4">
          <img src="/LOGO2.png" alt="AquaTrack Logo" className="h-14 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-[#001e66] leading-none">
              AQUA<span className="text-[#00aeef]">TRACK</span>
            </span>
            <span className="text-[10px] font-black text-[#001e66] tracking-wider uppercase mt-1">
              CITY OF SAN FERNANDO • SUB-ADMIN MONITORING CENTER
            </span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">
              Assigned Operations & Incident Coordination
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 relative">
          <div className="h-10 bg-white border border-slate-200 rounded-xl flex items-center pl-3 pr-4 space-x-3 shadow-sm select-none">
            <div className="w-6 h-6 bg-[#00aeef] text-white font-black text-xs rounded-lg flex items-center justify-center">
              SA
            </div>
            <div className="text-left hidden sm:flex flex-col">
              <span className="text-xs font-mono font-black text-[#001e66] leading-none">{session?.user?.email}</span>
              <span className="text-[8px] font-black uppercase text-[#00aeef] mt-1 tracking-wider leading-none">
                {currentUserRole}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => handleLogout()}
            className="w-10 h-10 bg-red-50 hover:bg-red-100 border border-red-200 text-[#970006] rounded-xl flex items-center justify-center shadow-sm transition-all focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Viewport Grid */}
      <div className="flex-1 flex flex-col lg:flex-row p-[18px] gap-[18px] z-30">
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-[18px] p-5 shadow-sm shadow-blue-100 flex flex-col gap-1 z-20 h-fit lg:sticky lg:top-[18px]">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 pb-2 px-3">
            STAFF CONSOLE
          </div>
          {[
            { 
              key: "home", 
              label: "Dashboard Home", 
              icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            },
            { 
              key: "map", 
              label: "Live Monitoring Map", 
              icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
            },
            { 
              key: "complaints", 
              label: "Assigned Complaints", 
              icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            },
            { 
              key: "telemetry", 
              label: "IoT Telemetry Metrics", 
              icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" 
            },
            { 
              key: "advisories", 
              label: "Advisories & Events", 
              icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" 
            },
          ].map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 hover:scale-[1.01] ${
                  isActive
                    ? "bg-[#08266D] text-white shadow-md shadow-blue-900/10"
                    : "text-[#001e66] hover:bg-slate-50 hover:text-[#00aeef]"
                }`}
              >
                <svg className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#00aeef]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <main className="flex-1 bg-white border border-slate-200 rounded-[18px] shadow-sm shadow-blue-100 p-6 flex flex-col">
          {alertMessage && (
            <div
              className={`p-4 rounded-xl border mb-6 flex items-start space-x-3 text-sm animate-fade-in ${
                alertMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <span className="font-bold">{alertMessage.type === "success" ? "✓" : "⚠"}</span>
              <span className="font-bold">{alertMessage.text}</span>
            </div>
          )}

          {activeTab === "home" && (
            <HomeSection
              stats={stats}
              assignedComplaints={assignedComplaints}
              setActiveTab={setActiveTab}
              email={session?.user?.email}
            />
          )}

          {activeTab === "map" && (
            <MapSection
              nodes={nodes}
              complaints={complaints}
              selectedNodeId={selectedNodeId}
              selectedComplaintId={selectedComplaintId}
              setSelectedNodeId={setSelectedNodeId}
              setSelectedComplaintId={setSelectedComplaintId}
            />
          )}

          {activeTab === "complaints" && (
            <ComplaintsSection
              filteredComplaints={filteredComplaints}
              complaintSearchQuery={complaintSearchQuery}
              setComplaintSearchQuery={setComplaintSearchQuery}
              filterAssignedOnly={filterAssignedOnly}
              setFilterAssignedOnly={setFilterAssignedOnly}
              updatingComplaintId={updatingComplaintId}
              handleUpdateComplaintStatus={handleUpdateComplaintStatus}
              handleViewLocation={handleViewLocation}
            />
          )}

          {activeTab === "telemetry" && (
            <TelemetrySection
              nodes={nodes}
              nodeSearchQuery={nodeSearchQuery}
              setNodeSearchQuery={setNodeSearchQuery}
              updatingNodeId={updatingNodeId}
              handleUpdateNodeStatus={handleUpdateNodeStatus}
            />
          )}
          {activeTab === "advisories" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-lg font-black text-[#001e66] tracking-tight">Advisories &amp; Events</h2>
                <p className="text-xs text-slate-500 font-bold">Service bulletins and operational notices from the district admin</p>
              </div>

              <div className="space-y-4">
                {advisories
                  .filter((ad) =>
                    ad.targetRole === "broadcast" ||
                    ad.targetRole === "technicians"
                  )
                  .map((ad) => (
                    <div key={ad.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">{ad.date}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          ad.type === "warning"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-blue-50 text-blue-600 border border-blue-200"
                        }`}>
                          {ad.type}
                        </span>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                          {ad.targetRole === "technicians" ? "Technicians" : "All Staff"}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-[#001e66] text-sm">{ad.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{ad.text}</p>
                    </div>
                  ))}

                {advisories.filter((ad) =>
                  ad.targetRole === "broadcast" || ad.targetRole === "technicians"
                ).length === 0 && (
                  <div className="py-12 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-sm font-black text-slate-400">No advisories posted yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Check back for operational bulletins from the admin.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
