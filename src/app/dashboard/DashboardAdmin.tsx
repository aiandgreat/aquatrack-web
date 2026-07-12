"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabase";
import { generateComplianceReport } from "../../lib/pdf-generator";
import { motion, AnimatePresence } from "framer-motion";

// Import Modular Sections
import HomeSection from "./admin-sections/HomeSection";
import MapSection from "./admin-sections/MapSection";
import ReportsSection from "./admin-sections/ReportsSection";
import HeatmapsSection from "./admin-sections/HeatmapsSection";
import TelemetrySection from "./admin-sections/TelemetrySection";
import AnalyticsSection from "./admin-sections/AnalyticsSection";
import UsersSection from "./admin-sections/UsersSection";
import AnnouncementsSection from "./admin-sections/AnnouncementsSection";
import ConfigSection from "./admin-sections/ConfigSection";

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

interface Advisory {
  id: string;
  date: string;
  title: string;
  text: string;
  type: "warning" | "info" | "news" | "event";
  targetRole?: "broadcast" | "consumers" | "technicians";
}

interface DashboardAdminProps {
  initialUsers: User[];
  initialNodes: TelemetryNode[];
  initialComplaints: Complaint[];
  initialStats: DashboardStats;
}

export default function DashboardAdmin({
  initialUsers,
  initialNodes,
  initialComplaints,
  initialStats,
}: DashboardAdminProps) {
  const [session, setSession] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    | "home"
    | "map"
    | "reports"
    | "heatmaps"
    | "telemetry"
    | "analytics"
    | "users"
    | "announcements"
    | "config"
  >("home");

  // Data State
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [nodes, setNodes] = useState<TelemetryNode[]>(initialNodes);
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  
  const [stats, setStats] = useState<DashboardStats>({
    ...initialStats,
    complianceIndex: 0,
  });

  // Filtering, Searching, Selections
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [nodeSearchQuery, setNodeSearchQuery] = useState("");
  const [complaintSearchQuery, setComplaintSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Operation Loading States
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingNodeId, setUpdatingNodeId] = useState<string | null>(null);
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);

  // Modals & Menu Popovers
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeDetailNews, setActiveDetailNews] = useState<any | null>(null);
  const [activeDetailEvent, setActiveDetailEvent] = useState<any | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Announcement Form State
  const [newAdvisoryTitle, setNewAdvisoryTitle] = useState("");
  const [newAdvisoryText, setNewAdvisoryText] = useState("");
  const [newAdvisoryType, setNewAdvisoryType] = useState<"warning" | "info" | "news" | "event">("warning");
  const [newAdvisoryTargetRole, setNewAdvisoryTargetRole] = useState<"broadcast" | "consumers" | "technicians">("broadcast");

  // System Configuration Form State
  const [selectedSimNodeId, setSelectedSimNodeId] = useState("");
  const [simPreset, setSimPreset] = useState<"normal" | "pressure_drop" | "turbidity" | "contamination">("normal");
  const [simValues, setSimValues] = useState({
    ph: 7.2,
    turbidity: 1.2,
    tds: 220,
    pressure: 45.0,
  });

  // AI & Server Configuration Overrides
  const [aiTriageStrictness, setAiTriageStrictness] = useState(75);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [hotCacheTTL, setHotCacheTTL] = useState(60);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const initialDark = root.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    setIsDark(initialDark);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Preset config handler
  useEffect(() => {
    switch (simPreset) {
      case "normal":
        setSimValues({ ph: 7.2, turbidity: 1.2, tds: 220, pressure: 45.0 });
        break;
      case "pressure_drop":
        setSimValues({ ph: 7.0, turbidity: 1.5, tds: 230, pressure: 8.0 });
        break;
      case "turbidity":
        setSimValues({ ph: 7.4, turbidity: 8.5, tds: 280, pressure: 42.0 });
        break;
      case "contamination":
        setSimValues({ ph: 5.1, turbidity: 9.8, tds: 680, pressure: 38.0 });
        break;
    }
  }, [simPreset]);

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

        // Fetch profile role via api
        const res = await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentSession.user.id }),
        });
        const profile = await res.json();

        if (profile?.role !== "ADMIN") {
          setCurrentUserRole(profile?.role || "CONSUMER_RESIDENT");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 3000);
        } else {
          setCurrentUserRole("ADMIN");
          // Re-fetch current database values
          await Promise.all([fetchUsers(), fetchNodes(), fetchComplaints(), fetchStats(), fetchAdvisories()]);
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
    if (currentUserRole !== "ADMIN") return;

    try {
      const client = getSupabaseClient();
      const channel = client
        .channel("admin-complaints-realtime")
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
      if (data.success) {
        setNodes(data.nodes);
        if (data.nodes.length > 0 && !selectedSimNodeId) {
          setSelectedSimNodeId(data.nodes[0].id);
        }
      }
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
          complianceIndex: 0, // Keep at 0 per User request
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchAdvisories = async () => {
    try {
      const res = await fetch("/api/advisories");
      const data = await res.json();
      if (data.success) {
        setAdvisories(data.advisories);
      }
    } catch (err) {
      console.error("Failed to fetch advisories", err);
    }
  };

  const handleUpdateUserProfile = async (
    userId: string,
    updates: { role?: string; serviceAccountNo?: string; phone?: string }
  ) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", "User profile updated successfully");
        fetchUsers();
      } else {
        showFeedback("error", data.error || "Failed to update profile");
      }
    } catch (err) {
      showFeedback("error", "Network error updating user profile");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this user profile? This action is permanent.")) return;
    setUpdatingUserId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", "User deleted successfully");
        fetchUsers();
      } else {
        showFeedback("error", data.error || "Failed to delete user");
      }
    } catch (err) {
      showFeedback("error", "Network error deleting user");
    } finally {
      setUpdatingUserId(null);
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

  const handleUpdateComplaintAssignment = async (complaintId: string, assignedToId: string) => {
    setUpdatingComplaintId(complaintId);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: complaintId, assignedToId: assignedToId || null }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", "Complaint assigned successfully");
        fetchComplaints();
      } else {
        showFeedback("error", data.error || "Failed to assign complaint");
      }
    } catch (err) {
      showFeedback("error", "Network error assigning complaint");
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  // Removed individual handleUpdateServiceAccount in favor of unified handleUpdateUserProfile

  const handleTriggerSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSimNodeId) {
      showFeedback("error", "Please select a node to simulate telemetry");
      return;
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/telemetry-ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: selectedSimNodeId,
          ...simValues,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.anomaly) {
          showFeedback("success", "Telemetry ingested successfully! Anomaly detected - Alert triggered.");
        } else {
          showFeedback("success", "Telemetry ingested successfully! Readings within thresholds.");
        }
        fetchNodes();
        fetchStats();
      } else {
        const errorText = await res.text();
        showFeedback("error", `Ingest function error: ${errorText}`);
      }
    } catch (err) {
      showFeedback("error", "Failed to connect to simulation endpoint");
    }
  };

  const handleDownloadReport = () => {
    const dummyReadings = [
      { nodeName: "East Reservoir Pump Station", ph: 7.2, turbidity: 1.2, tds: 220, pressure: 45.2, timestamp: new Date().toISOString() },
      { nodeName: "North Main Junction Hub", ph: 6.8, turbidity: 4.8, tds: 380, pressure: 35.1, timestamp: new Date().toISOString() },
      { nodeName: "Household Edge B", ph: 5.8, turbidity: 8.5, tds: 530, pressure: 14.5, timestamp: new Date().toISOString() },
    ];
    generateComplianceReport({ readings: dummyReadings });
    showFeedback("success", "Water analytics report downloaded successfully.");
  };

  const handleCreateAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvisoryTitle || !newAdvisoryText) {
      showFeedback("error", "Please fill in all advisory fields.");
      return;
    }

    try {
      const res = await fetch("/api/advisories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAdvisoryTitle,
          text: newAdvisoryText,
          type: newAdvisoryType,
          targetRole: newAdvisoryTargetRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdvisories([data.advisory, ...advisories]);
        setNewAdvisoryTitle("");
        setNewAdvisoryText("");
        setNewAdvisoryTargetRole("broadcast");
        showFeedback("success", "Community advisory published successfully!");
      } else {
        showFeedback("error", data.error || "Failed to publish advisory.");
      }
    } catch (err) {
      showFeedback("error", "Network error publishing advisory.");
    }
  };

  const handleDeleteAdvisory = async (id: string) => {
    try {
      const res = await fetch(`/api/advisories?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAdvisories(advisories.filter(ad => ad.id !== id));
        showFeedback("success", "Advisory deleted successfully.");
      } else {
        showFeedback("error", data.error || "Failed to delete advisory.");
      }
    } catch (err) {
      showFeedback("error", "Network error deleting advisory.");
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

  const warningAdvisories = advisories.filter((ad) => ad.type === "warning");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF4FA] text-[#001e66] flex flex-col items-center justify-center">
        {/* Top color ribbon */}
        <div className="absolute inset-x-0 top-0 flex h-1 bg-[#001e66] z-50" aria-hidden="true"></div>
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-[#00aeef]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#00aeef] animate-spin"></div>
          </div>
          <p className="text-slate-500 text-xs font-black tracking-wider uppercase animate-pulse">
            Verifying Admin Authorization…
          </p>
        </div>
      </div>
    );
  }

  if (currentUserRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#EEF4FA] text-[#001e66] flex items-center justify-center p-4">
        {/* Top color ribbon */}
        <div className="absolute inset-x-0 top-0 flex h-1 bg-[#001e66] z-50" aria-hidden="true"></div>
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#970006] to-[#ffd800]"></div>
          <div className="w-16 h-16 bg-[#970006]/10 border border-[#970006]/20 text-[#970006] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#001e66] tracking-tight">Access Denied</h1>
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
            Your account role (<span className="text-[#970006] font-extrabold">{currentUserRole}</span>) does not have permission to view this command center.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold py-3 px-6 rounded-xl transition-all shadow-sm"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-700 text-xs font-bold uppercase tracking-wider mt-2 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF4FA] dark:bg-slate-950 text-[#001e66] dark:text-slate-100 flex flex-col font-sans relative w-full h-full overflow-x-hidden transition-colors duration-200">
      {/* 3-way Top Color Ribbon */}
      <div className="absolute inset-x-0 top-0 flex h-1.5 z-50" aria-hidden="true">
        <span className="flex-1 bg-[#001e66]" />
        <span className="flex-1 bg-[#00aeef]" />
        <span className="flex-1 bg-[#970006]" />
      </div>

      {/* Top Header Card */}
      <header className="m-[18px] mb-0 h-[86px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[16px] shadow-sm shadow-blue-100 dark:shadow-none flex items-center justify-between px-6 z-40 relative">
        <div className="flex items-center space-x-4">
          <img src="/LOGO2.png" alt="AquaTrack Logo" className="h-14 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-[#001e66] dark:text-slate-100 leading-none">
              AQUA<span className="text-[#00aeef]">TRACK</span>
            </span>
            <span className="text-[10px] font-black text-[#001e66] dark:text-slate-200 tracking-wider uppercase mt-1">
              CITY OF SAN FERNANDO • EXECUTIVE GLOBAL COMMAND CENTER
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
              Administrative & System Control Division
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 relative">
          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowHelpModal(false);
                setShowProfileMenu(false);
              }}
              className="px-3.5 h-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center relative shadow-sm transition-all focus:outline-none text-xs font-black text-[#001e66] dark:text-slate-300"
            >
              <span>Alerts</span>
              <span className="ml-1.5 bg-[#970006] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
                {warningAdvisories.length}
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-3 z-50 text-xs text-slate-700 dark:text-slate-300">
                <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-extrabold text-[#001e66] dark:text-slate-100">Active System Alarms</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {warningAdvisories.length} Alerts
                  </span>
                </div>
                {warningAdvisories.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 dark:text-slate-500 italic">
                    No active system alarms.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                    {warningAdvisories.map((ad) => (
                      <div key={ad.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-red-650 dark:text-red-400">{ad.title}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500">{ad.date}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-[11px] leading-tight">
                          {ad.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Help Button */}
          <div>
            <button
              onClick={() => {
                setShowHelpModal(true);
                setShowNotificationMenu(false);
                setShowProfileMenu(false);
              }}
              className="px-3.5 h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shadow-sm transition-all focus:outline-none text-xs font-black text-[#001e66]"
            >
              <span>Help</span>
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <div>
            <button
              onClick={() => setIsDark(!isDark)}
              className="px-3.5 h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shadow-sm transition-all focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-xs font-black text-[#001e66] dark:text-slate-200"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>
          </div>

          {/* Admin Profile Card */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotificationMenu(false);
              }}
              className="h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center pl-3 pr-4 space-x-3 shadow-sm transition-all focus:outline-none"
            >
              <div className="w-6 h-6 bg-[#001e66] text-white font-black text-xs rounded-lg flex items-center justify-center">
                A
              </div>
              <div className="text-left hidden sm:flex flex-col">
                <span className="text-xs font-black text-[#001e66] leading-none">Administrator</span>
                <span className="text-[8px] font-black uppercase text-slate-400 mt-1 tracking-wider leading-none">
                  SUPER-ADMIN
                </span>
              </div>
            </button>

            {/* Profile Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-mono font-extrabold text-[#001e66]">{session?.user?.email || "admin@csfwd.gov.ph"}</p>
                  <p className="text-[9px] text-[#00aeef] font-bold mt-0.5">Control Division Account</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("users");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 font-bold transition-all"
                >
                  Manage User Database
                </button>
                <button
                  onClick={() => {
                    setActiveTab("config");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 font-bold transition-all"
                >
                  System Configuration
                </button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="h-10 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-[#970006] rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider shadow-sm transition-all focus:outline-none"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid Viewport (Now with left aside sidebar console layout) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-[18px] gap-[18px] z-30">
        <aside className="w-full lg:w-64 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 shadow-sm shadow-blue-100 dark:shadow-none flex flex-col gap-1.5 lg:overflow-y-auto">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2 px-3">
            CONTROL CONSOLE
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
              key: "reports", 
              label: "Complaints & Reports", 
              icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            },
            { 
              key: "heatmaps", 
              label: "Spatial Heatmaps", 
              icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" 
            },
            { 
              key: "telemetry", 
              label: "IoT Telemetry", 
              icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" 
            },
            { 
              key: "analytics", 
              label: "Water Analytics", 
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            },
            { 
              key: "users", 
              label: "User Profiles", 
              icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
            },
            { 
              key: "announcements", 
              label: "Community Broadcasts", 
              icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" 
            },
            { 
              key: "config", 
              label: "Simulator & Settings", 
              icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
            },
          ].map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all duration-200 relative overflow-hidden group hover:scale-[1.01] ${
                  isActive
                    ? "bg-[#063A8C] text-white shadow-md shadow-blue-950/20"
                    : "text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#00aeef]"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffd800]" />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <main className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] shadow-sm shadow-blue-100 dark:shadow-none p-6 flex flex-col lg:overflow-y-auto">
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

          {/* Render Modular Sections */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full"
            >
              {activeTab === "home" && (
                <HomeSection
                  stats={stats}
                  advisories={advisories}
                  setActiveDetailNews={setActiveDetailNews}
                  setActiveDetailEvent={setActiveDetailEvent}
                  complaints={complaints}
                  nodes={nodes}
                />
              )}

              {activeTab === "map" && (
                <MapSection
                  nodes={nodes}
                  complaints={complaints.filter(c => c.status !== "RESOLVED")}
                  selectedNodeId={selectedNodeId}
                  selectedComplaintId={selectedComplaintId}
                  setSelectedNodeId={setSelectedNodeId}
                  setSelectedComplaintId={setSelectedComplaintId}
                />
              )}

              {activeTab === "reports" && (
                <ReportsSection
                  complaints={complaints}
                  complaintSearchQuery={complaintSearchQuery}
                  setComplaintSearchQuery={setComplaintSearchQuery}
                  updatingComplaintId={updatingComplaintId}
                  handleUpdateComplaintStatus={handleUpdateComplaintStatus}
                  users={users}
                  handleUpdateComplaintAssignment={handleUpdateComplaintAssignment}
                  handleViewLocation={handleViewLocation}
                />
              )}

              {activeTab === "heatmaps" && <HeatmapsSection complaints={complaints} />}

              {activeTab === "telemetry" && (
                <TelemetrySection
                  nodes={nodes}
                  nodeSearchQuery={nodeSearchQuery}
                  setNodeSearchQuery={setNodeSearchQuery}
                  updatingNodeId={updatingNodeId}
                  handleUpdateNodeStatus={handleUpdateNodeStatus}
                />
              )}

              {activeTab === "analytics" && (
                <AnalyticsSection handleDownloadReport={handleDownloadReport} />
              )}

              {activeTab === "users" && (
                <UsersSection
                  users={users}
                  sessionUserId={session?.user?.id || ""}
                  userSearchQuery={userSearchQuery}
                  setUserSearchQuery={setUserSearchQuery}
                  updatingUserId={updatingUserId}
                  handleUpdateUserProfile={handleUpdateUserProfile}
                  handleDeleteUser={handleDeleteUser}
                />
              )}

              {activeTab === "announcements" && (
                <AnnouncementsSection
                  advisories={advisories}
                  newAdvisoryTitle={newAdvisoryTitle}
                  setNewAdvisoryTitle={setNewAdvisoryTitle}
                  newAdvisoryText={newAdvisoryText}
                  setNewAdvisoryText={setNewAdvisoryText}
                  newAdvisoryType={newAdvisoryType}
                  setNewAdvisoryType={setNewAdvisoryType}
                  newAdvisoryTargetRole={newAdvisoryTargetRole}
                  setNewAdvisoryTargetRole={setNewAdvisoryTargetRole}
                  handleCreateAdvisory={handleCreateAdvisory}
                  handleDeleteAdvisory={handleDeleteAdvisory}
                />
              )}

              {activeTab === "config" && (
                <ConfigSection
                  nodes={nodes}
                  selectedSimNodeId={selectedSimNodeId}
                  setSelectedSimNodeId={setSelectedSimNodeId}
                  simPreset={simPreset}
                  setSimPreset={setSimPreset}
                  simValues={simValues}
                  setSimValues={setSimValues}
                  aiTriageStrictness={aiTriageStrictness}
                  setAiTriageStrictness={setAiTriageStrictness}
                  emailAlertsEnabled={emailAlertsEnabled}
                  setEmailAlertsEnabled={setEmailAlertsEnabled}
                  hotCacheTTL={hotCacheTTL}
                  setHotCacheTTL={setHotCacheTTL}
                  handleTriggerSimulation={handleTriggerSimulation}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[18px] max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-[#001e66] tracking-tight">Help Center & Guidelines</h3>
            <div className="mt-4 text-xs text-slate-600 space-y-3 leading-relaxed font-semibold">
              <p>
                <strong>User Management</strong>: Review resident registrations, assign service account numbers, and designate staff to technician roles.
              </p>
              <p>
                <strong>Telemetry Simulation</strong>: Dispatch raw IoT telemetry variables (pH, pressure, turbidity, TDS) to check differential routing alarms and automated system notifications.
              </p>
              <p>
                <strong>System Standards</strong>: Compliance indexes represent overall compliance percentage with the Philippine National Standards for Drinking Water (PNSDW).
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[18px] max-w-sm w-full p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-red-50 text-[#970006] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-[#001e66] tracking-tight">Confirm Sign Out</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
              Are you sure you want to end your executive session and log out of the command center?
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-[#970006] hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* News Details Modal */}
      {activeDetailNews && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[18px] max-w-lg w-full p-6 shadow-2xl relative">
            <span className="text-[10px] font-bold text-slate-400">{activeDetailNews.date}</span>
            <span className="float-right bg-[#00aeef]/10 text-[#00aeef] text-[9px] font-black uppercase px-2 py-0.5 rounded">
              {activeDetailNews.tag}
            </span>
            <h3 className="text-lg font-black text-[#001e66] tracking-tight mt-2">{activeDetailNews.title}</h3>
            <p className="mt-4 text-xs text-slate-600 leading-relaxed font-semibold">
              {activeDetailNews.description}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveDetailNews(null)}
                className="bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {activeDetailEvent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[18px] max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-[#00aeef]/10 text-[#00aeef] px-3 py-1.5 rounded-xl font-black text-xs">
                {activeDetailEvent.month} {activeDetailEvent.day}
              </div>
              <h3 className="text-base font-black text-[#001e66] tracking-tight">{activeDetailEvent.title}</h3>
            </div>
            <p className="mt-4 text-xs text-slate-600 leading-relaxed font-semibold">
              {activeDetailEvent.description}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveDetailEvent(null)}
                className="bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
