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
import MapPreviewModal from "../../components/MapPreviewModal";

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
  const [previewComplaint, setPreviewComplaint] = useState<any | null>(null);

  // Operation Loading States
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingNodeId, setUpdatingNodeId] = useState<string | null>(null);
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);

  // Modals & Menu Popovers
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
    const comp = complaints.find((c) => c.id === complaintId);
    if (comp) {
      setPreviewComplaint(comp);
    }
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

  // ── Loading Screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#00aeef] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#001e66] tracking-wide">
              Loading Executive Command Center
            </p>
            <p className="text-xs text-slate-400 mt-1">Authenticating administrative privileges...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Access Denied Screen ───────────────────────────────────────────────────
  if (currentUserRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-2xl p-8 text-center shadow-md relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#970006]" />
          <div className="w-16 h-16 bg-[#970006]/5 border border-[#970006]/10 text-[#970006] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#001e66] tracking-tight">Access Denied</h1>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            Your account role (<span className="text-[#970006] font-semibold">{currentUserRole}</span>) does not have permission to view this command center.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="bg-[#001e66] hover:bg-[#00aeef] text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm text-sm"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold uppercase tracking-wider mt-2 transition-colors focus:outline-none"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active breadcrumb label
  const tabLabels: Record<string, string> = {
    home: "Overview Dashboard",
    map: "Geospatial Monitoring Map",
    reports: "Complaints & Reports Triage",
    heatmaps: "Spatial Incident Heatmaps",
    telemetry: "IoT Node Telemetry",
    analytics: "Operations & Compliance Analytics",
    users: "User Access Directory",
    announcements: "Community Bulletins & Broadcasts",
    config: "System Configuration & Simulator",
  };

  const activeBreadcrumb = tabLabels[activeTab] || "Command Console";

  // Navigation Items
  const navItems = [
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
    }
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans w-full overflow-x-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
        {/* Left: Logo + Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-[#001e66] hover:bg-slate-50 rounded-xl transition-all focus:outline-none cursor-pointer"
            aria-label="Open navigation sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src="/LOGO2.png" alt="AquaTrack Logo" className="h-8 w-auto object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-black tracking-tight text-[#001e66]">
              AQUA<span className="text-[#00aeef]">TRACK</span>
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
              Executive Command Center
            </span>
          </div>
        </div>

        {/* Middle: Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>Console</span>
          <span className="text-slate-300">/</span>
          <span className="text-[#001e66] font-semibold">{activeBreadcrumb}</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          
          {/* Alerts Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowHelpModal(false);
                setShowProfileMenu(false);
              }}
              className="w-9 h-9 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-[#970006] transition-all focus:outline-none relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {warningAdvisories.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#970006] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {warningAdvisories.length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 z-50 text-xs">
                <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-[#001e66]">Active System Alarms</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {warningAdvisories.length} Alerts
                  </span>
                </div>
                {warningAdvisories.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 italic">
                    No active system alarms.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {warningAdvisories.map((ad) => (
                      <div key={ad.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-[#970006]">{ad.title}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{ad.date}</span>
                        </div>
                        <p className="text-slate-500 mt-1 text-[11px] leading-tight">
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
          <button
            onClick={() => {
              setShowHelpModal(true);
              setShowNotificationMenu(false);
              setShowProfileMenu(false);
            }}
            className="w-9 h-9 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-[#001e66] transition-all focus:outline-none"
            title="Help Center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-[#001e66] transition-all focus:outline-none"
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M6.34 17.66l-.71.71m12.73 0-.71-.71M6.34 6.34l-.71-.71M12 5a7 7 0 100 14A7 7 0 0012 5z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {/* Admin Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotificationMenu(false);
              }}
              className="h-9 px-3 rounded-xl border border-slate-100 bg-white flex items-center gap-2 select-none hover:bg-slate-50 transition-all focus:outline-none"
            >
              <div className="w-6 h-6 rounded-lg bg-[#001e66] text-white text-[10px] font-bold flex items-center justify-center">
                AD
              </div>
              <div className="hidden sm:flex flex-col leading-none text-left">
                <span className="text-xs font-semibold text-[#001e66]">Administrator</span>
                <span className="text-[8px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">Super Admin</span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-3.5 px-4 z-50 text-xs">
                <p className="font-semibold text-[#001e66] truncate">{session?.user?.email || "admin@csfwd.gov.ph"}</p>
                <p className="text-[9px] text-[#00aeef] font-medium mt-0.5">Control Division Account</p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="h-9 px-4 bg-[#001e66] text-white rounded-xl text-xs font-semibold hover:bg-[#00aeef] transition-all focus:outline-none"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex w-56 shrink-0 bg-white border-r border-slate-100 flex flex-col sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex-1 py-3 px-3">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-2 mt-2">
              Control Console
            </p>
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                      isActive
                        ? "bg-[#001e66]/5 text-[#001e66] font-semibold"
                        : "text-slate-500 hover:text-[#001e66] hover:bg-slate-50"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#00aeef] rounded-full" />
                    )}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 shrink-0 ${isActive ? "text-[#001e66]" : "text-slate-400"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={isActive ? 2 : 1.75}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom: Role chip + user info */}
          <div className="px-4 py-4 border-t border-slate-100 flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[#001e66]/5 text-[#001e66] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#001e66]/10 w-full justify-center">
              Super Admin Mode
            </span>
            <span className="text-[10px] text-slate-400 font-mono text-center truncate w-full" title={session?.user?.email}>
              {session?.user?.email || "admin@csfwd.gov.ph"}
            </span>
          </div>
        </aside>

        {/* ── Mobile Sidebar Drawer ── */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 bg-slate-950 z-50 lg:hidden"
              />
              {/* Drawer Content */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-50 flex flex-col lg:hidden h-full overflow-y-auto"
              >
                {/* Drawer Header */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
                  <div className="flex items-center gap-3">
                    <img src="/LOGO2.png" alt="AquaTrack Logo" className="h-8 w-auto object-contain" />
                    <span className="text-base font-black tracking-tight text-[#001e66]">
                      AQUA<span className="text-[#00aeef]">TRACK</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Drawer Nav Items */}
                <div className="flex-1 py-3 px-3">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-2 mt-2">
                    Control Console
                  </p>
                  <nav className="flex flex-col gap-0.5">
                    {navItems.map((item) => {
                      const isActive = activeTab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            setActiveTab(item.key as any);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                            isActive
                              ? "bg-[#001e66]/5 text-[#001e66] font-semibold"
                              : "text-slate-500 hover:text-[#001e66] hover:bg-slate-50"
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#00aeef] rounded-full" />
                          )}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-4 h-4 shrink-0 ${isActive ? "text-[#001e66]" : "text-slate-400"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={isActive ? 2 : 1.75}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                          </svg>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Drawer Bottom */}
                <div className="px-4 py-4 border-t border-slate-100 flex flex-col gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 bg-[#001e66]/5 text-[#001e66] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#001e66]/10 w-full justify-center">
                    Super Admin Mode
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono text-center truncate w-full" title={session?.user?.email}>
                    {session?.user?.email || "admin@csfwd.gov.ph"}
                  </span>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content Area ──────────────────────────────────────────────── */}
        <main className="flex-1 bg-[#F8FAFC] overflow-y-auto p-6 flex flex-col">
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

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full flex flex-col flex-1"
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
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <h3 className="text-lg font-bold text-[#001e66] tracking-tight">Help Center &amp; Guidelines</h3>
            <div className="mt-4 text-xs text-slate-500 space-y-3 leading-relaxed font-semibold">
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
                className="bg-[#001e66] hover:bg-[#00aeef] text-white font-semibold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
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
          <div className="bg-white border border-slate-100 rounded-2xl max-w-sm w-full p-6 shadow-xl relative text-center">
            <div className="w-12 h-12 bg-red-50 text-[#970006] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#001e66] tracking-tight">Confirm Sign Out</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
              Are you sure you want to end your executive session and log out of the command center?
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-[#970006] hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
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
          <div className="bg-white border border-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
            <span className="text-[10px] font-bold text-slate-400">{activeDetailNews.date}</span>
            <span className="float-right bg-[#00aeef]/10 text-[#00aeef] text-[9px] font-bold uppercase px-2 py-0.5 rounded">
              {activeDetailNews.tag}
            </span>
            <h3 className="text-lg font-bold text-[#001e66] tracking-tight mt-2">{activeDetailNews.title}</h3>
            <p className="mt-4 text-xs text-slate-500 leading-relaxed font-semibold">
              {activeDetailNews.description}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveDetailNews(null)}
                className="bg-[#001e66] hover:bg-[#00aeef] text-white font-semibold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
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
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-[#00aeef]/10 text-[#00aeef] px-3 py-1.5 rounded-xl font-bold text-xs">
                {activeDetailEvent.month} {activeDetailEvent.day}
              </div>
              <h3 className="text-base font-bold text-[#001e66] tracking-tight">{activeDetailEvent.title}</h3>
            </div>
            <p className="mt-4 text-xs text-slate-500 leading-relaxed font-semibold">
              {activeDetailEvent.description}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveDetailEvent(null)}
                className="bg-[#001e66] hover:bg-[#00aeef] text-white font-semibold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Preview Modal */}
      <MapPreviewModal
        isOpen={previewComplaint !== null}
        onClose={() => setPreviewComplaint(null)}
        complaint={previewComplaint}
      />
    </div>
  );
}
