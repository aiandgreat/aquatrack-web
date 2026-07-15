"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import MapSection from "./admin-sections/MapSection";
import TelemetrySection from "./admin-sections/TelemetrySection";
import HomeSection from "./sub-admin-sections/HomeSection";
import ComplaintsSection from "./sub-admin-sections/ComplaintsSection";
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
  const [previewComplaint, setPreviewComplaint] = useState<any | null>(null);
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);
  const [updatingNodeId, setUpdatingNodeId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterAssignedOnly, setFilterAssignedOnly] = useState(true);
  const [advisoriesPage, setAdvisoriesPage] = useState(1);
  const [isDark, setIsDark] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Account details states
  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    address: string | null;
    serviceAccountNo: string | null;
  } | null>(null);
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<"profile" | "security">("profile");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Dropdown states
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
          setUserProfile({
            id: currentSession.user.id,
            name: profile.name || "Technician",
            email: profile.email || currentSession.user.email || "",
            role: profile.role || "FIELD_ENGINEER_TECHNICIAN",
            phone: profile.phone || "",
            address: profile.address || "",
            serviceAccountNo: profile.serviceAccountNo || null
          });
          setProfileName(profile.name || "Technician");
          setProfileEmail(profile.email || currentSession.user.email || "");
          setProfilePhone(profile.phone || "");
          setProfileAddress(profile.address || "");
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);
    try {
      const client = getSupabaseClient();
      const { error: authError } = await client.auth.updateUser({
        email: profileEmail,
        data: { full_name: profileName, phone: profilePhone, address: profileAddress }
      });

      if (authError) {
        setProfileError(authError.message);
        setProfileSaving(false);
        return;
      }

      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userProfile?.id,
          email: profileEmail,
          fullName: profileName,
          phone: profilePhone,
          address: profileAddress
        }),
      });

      setUserProfile((prev) => 
        prev ? { ...prev, name: profileName, email: profileEmail, phone: profilePhone, address: profileAddress } : null
      );
      setProfileSuccess("Profile details updated successfully!");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile details.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (newPassword !== confirmNewPassword) {
      setSecurityError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setSecurityError("Password must be at least 8 characters.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        setSecurityError(error.message);
      } else {
        setSecuritySuccess("Password updated successfully!");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err: any) {
      setSecurityError(err.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const client = getSupabaseClient();
      await client.auth.signOut();
      localStorage.clear();
      window.location.href = "/register?deleted=true";
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleLogout = async () => {
    const client = getSupabaseClient();
    await client.auth.signOut();
    window.location.href = "/login";
  };

  const showFeedback = (type: "success" | "error", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 5000);
  };

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
              Loading Field Technician Portal
            </p>
            <p className="text-xs text-slate-400 mt-1">Verifying session and syncing data...</p>
          </div>
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

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    const priority: Record<string, number> = { PENDING: 4, EVALUATING: 3, DISPATCHED: 2, ONGOING: 1, RESOLVED: 0 };
    const aVal = priority[a.status] || 0;
    const bVal = priority[b.status] || 0;
    if (aVal !== bVal) return bVal - aVal;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Derive initials from email for profile chip
  const userEmail = session?.user?.email ?? "";
  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "FT";

  // Staff ID: first segment of email before @
  const staffId = userEmail ? userEmail.split("@")[0] : "unknown";

  // Nav items definition
  const navItems = [
    {
      key: "home",
      label: "Dashboard Home",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      key: "map",
      label: "Live Monitoring Map",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      key: "complaints",
      label: "Complaints Triage",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      key: "telemetry",
      label: "IoT Telemetry Panel",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
    {
      key: "advisories",
      label: "Advisories & Events",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
  ] as const;

  return (
    <div className="h-screen text-slate-800 flex flex-col font-sans w-full overflow-hidden relative bg-[#E2EAF4]">
      {/* Background Image Layer with custom opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/BG.jpg')", opacity: 0.08 }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
        {/* Left: Logo */}
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
          <img
            src="/LOGO2.png"
            alt="AquaTrack Logo"
            className="h-25 w-auto translate-y-1 hover:opacity-90 transition-opacity shrink-0"
          />
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Alerts Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowProfileMenu(false);
              }}
              className="w-9 h-9 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-center text-slate-500 hover:text-[#970006] dark:hover:text-red-400 transition-all focus:outline-none relative cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {advisories.filter(ad => ad.type === "warning" && (ad.targetRole === "broadcast" || ad.targetRole === "technicians")).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white font-black text-[8px] items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                    {advisories.filter(ad => ad.type === "warning" && (ad.targetRole === "broadcast" || ad.targetRole === "technicians")).length}
                  </span>
                </span>
              )}
            </button>

            {/* Alerts Dropdown */}
            <AnimatePresence>
              {showNotificationMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotificationMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,30,102,0.12)] z-50 overflow-hidden text-left"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                      <span className="font-black text-[#001e66] dark:text-slate-200 uppercase tracking-wider text-[10px]">Active System Alarms</span>
                      <span className="text-[9px] text-[#00aeef] font-black uppercase tracking-wider">
                        {advisories.filter(ad => ad.type === "warning" && (ad.targetRole === "broadcast" || ad.targetRole === "technicians")).length} Alerts
                      </span>
                    </div>
                    
                    <div className="divide-y divide-slate-50 dark:divide-slate-800/40 max-h-60 overflow-y-auto">
                      {advisories
                        .filter(ad => ad.type === "warning" && (ad.targetRole === "broadcast" || ad.targetRole === "technicians"))
                        .map((ad) => (
                          <div key={ad.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-[#970006] dark:text-red-400 text-xs">{ad.title}</span>
                              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono shrink-0 mt-0.5">{ad.date}</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 text-[10px] leading-relaxed">
                              {ad.text}
                            </p>
                          </div>
                        ))}
                      {advisories.filter(ad => ad.type === "warning" && (ad.targetRole === "broadcast" || ad.targetRole === "technicians")).length === 0 && (
                        <div className="p-6 text-center text-slate-450 dark:text-slate-500 italic text-[11px]">
                          No active system alarms.
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-center text-slate-500 hover:text-[#001e66] dark:hover:text-[#00aeef] transition-all focus:outline-none cursor-pointer"
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

          {/* Staff Profile Dropdown */}
          <div className="relative">
            <div
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotificationMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-all select-none"
            >
              <div className="w-7 h-7 rounded-lg bg-[#001e66] dark:bg-[#00aeef] text-white flex items-center justify-center text-xs font-black uppercase shadow-sm">
                {userProfile?.name?.slice(0, 1).toLowerCase() || initials.slice(0, 1).toLowerCase()}
              </div>
              <div className="hidden sm:flex flex-col leading-none text-left">
                <span className="text-[11px] font-bold text-[#001e66] dark:text-slate-200 truncate max-w-[120px]">
                  {userProfile?.name || userEmail.split("@")[0]}
                </span>
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-450 mt-0.5 tracking-wider uppercase">
                  {currentUserRole === "ADMIN" ? "Administrator" : "Field Technician"}
                </span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 ml-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-155 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,30,102,0.12)] z-50 overflow-hidden text-left py-1"
                  >
                    <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-800/50">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Staff ID</p>
                      <p className="text-[9px] font-mono text-[#001e66] dark:text-slate-200 mt-0.5 truncate">{userProfile?.id || staffId}</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsAccountDetailsOpen(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#001e66] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Manage Account
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50 dark:border-slate-800/50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4 bg-transparent relative z-10">

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex w-56 shrink-0 bg-white border border-slate-100 flex flex-col h-full rounded-2xl overflow-hidden shadow-sm">
          <div className="flex-1 py-3 px-3">
            {/* Section label */}
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-2 mt-2">
              Staff Console
            </p>

            {/* Nav Items */}
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
                    {/* Active left indicator bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#00aeef] rounded-full" />
                    )}
                    <span className={isActive ? "text-[#001e66]" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom — Assigned count badge + Staff ID */}
          <div className="px-4 py-4 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Assigned</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                assignedComplaints.length > 0
                  ? "bg-[#970006]/10 text-[#970006]"
                  : "bg-slate-100 text-slate-500"
              }`}>
                {assignedComplaints.length} complaint{assignedComplaints.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#001e66] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="flex flex-col leading-none min-w-0">
                <span className="text-[10px] font-semibold text-[#001e66] truncate">{staffId}</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Staff ID</span>
              </div>
            </div>
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
                    Staff Console
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
                          <span className={isActive ? "text-[#001e66]" : "text-slate-400"}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Drawer Bottom */}
                <div className="px-4 py-4 border-t border-slate-100 flex flex-col gap-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Assigned</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      assignedComplaints.length > 0
                        ? "bg-[#970006]/10 text-[#970006]"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {assignedComplaints.length} complaint{assignedComplaints.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#001e66] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="flex flex-col leading-none min-w-0">
                      <span className="text-[10px] font-semibold text-[#001e66] truncate">{staffId}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">Staff ID</span>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <main className="flex-1 bg-white border border-slate-100/80 overflow-y-auto p-6 flex flex-col rounded-2xl shadow-sm">
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
                  filteredComplaints={sortedComplaints}
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

              {activeTab === "advisories" && (() => {
                const filteredAdvisories = advisories.filter(
                  (ad) => ad.targetRole === "broadcast" || ad.targetRole === "technicians"
                );
                const itemsPerPage = 5;
                const maxPage = Math.max(1, Math.ceil(filteredAdvisories.length / itemsPerPage));
                const currentPage = Math.min(advisoriesPage, maxPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedAdvisories = filteredAdvisories.slice(startIndex, startIndex + itemsPerPage);

                const getTypeIcon = (type: string) => {
                  switch (type) {
                    case "warning":
                      return (
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      );
                    case "info":
                      return (
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      );
                    case "news":
                      return (
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      );
                    case "event":
                      return (
                        <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                        </svg>
                      );
                    default:
                      return null;
                  }
                };

                const getBorderColor = (type: string) => {
                  switch (type) {
                    case "warning": return "border-l-red-500";
                    case "info": return "border-l-blue-500";
                    case "news": return "border-l-emerald-500";
                    case "event": return "border-l-purple-500";
                    default: return "border-l-slate-400";
                  }
                };

                return (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="pb-4 border-b border-slate-200">
                      <h2 className="text-lg font-semibold text-[#001e66] tracking-tight">Advisories &amp; Events</h2>
                      <p className="text-xs text-slate-500 font-bold">Service bulletins and operational notices from the district admin</p>
                    </div>

                    <div className="space-y-4">
                      {paginatedAdvisories.map((ad) => (
                        <div
                          key={ad.id}
                          className={`bg-white border border-slate-100 border-l-4 ${getBorderColor(ad.type)} rounded-2xl p-5 space-y-2.5 shadow-sm hover:shadow-md transition-all`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center space-x-1 text-slate-400">
                              {getTypeIcon(ad.type)}
                              <span className="text-[10px] font-bold">{ad.date}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              ad.type === "warning"
                                ? "bg-red-50 text-red-600 border-red-200"
                                : ad.type === "info"
                                ? "bg-blue-50 text-blue-600 border-blue-200"
                                : ad.type === "news"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-purple-50 text-purple-600 border-purple-200"
                            }`}>
                              {ad.type}
                            </span>
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                              {ad.targetRole === "technicians" ? "Technicians" : "All Staff"}
                            </span>
                          </div>
                          <h3 className="font-semibold text-[#001e66] text-sm">{ad.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{ad.text}</p>
                        </div>
                      ))}

                      {filteredAdvisories.length === 0 && (
                        <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                          <div className="text-4xl mb-3">📋</div>
                          <p className="text-sm font-semibold text-slate-400">No advisories posted yet.</p>
                          <p className="text-xs text-slate-400 mt-1">Check back for operational bulletins from the admin.</p>
                        </div>
                      )}

                      {/* Pagination Controls */}
                      {maxPage > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                          <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setAdvisoriesPage((p) => Math.max(1, p - 1))}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-100 text-[#001e66] bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-xs font-medium text-slate-500">
                            Page {currentPage} of {maxPage}
                          </span>
                          <button
                            type="button"
                            disabled={currentPage === maxPage}
                            onClick={() => setAdvisoriesPage((p) => Math.min(maxPage, p + 1))}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-100 text-[#001e66] bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Map Preview Modal */}
      <MapPreviewModal
        isOpen={previewComplaint !== null}
        onClose={() => setPreviewComplaint(null)}
        complaint={previewComplaint}
      />

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

      {/* Account Details Modal */}
      <AnimatePresence>
        {isAccountDetailsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountDetailsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_25px_60px_rgba(0,30,102,0.18)] overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row h-[550px] z-10"
            >
              {/* Left sidebar inside modal */}
              <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/40 p-6 border-r border-slate-100 dark:border-slate-850 flex flex-col justify-between shrink-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-black text-[#001e66] dark:text-slate-200 tracking-tight">Account Details</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Manage portal settings</p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setAccountModalTab("profile")}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        accountModalTab === "profile"
                          ? "bg-[#001e66] text-white shadow-sm"
                          : "text-slate-655 hover:bg-slate-105 dark:hover:bg-slate-800/40 dark:text-slate-400"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Information
                    </button>
                    <button
                      onClick={() => setAccountModalTab("security")}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        accountModalTab === "security"
                          ? "bg-[#001e66] text-white shadow-sm"
                          : "text-slate-655 hover:bg-slate-105 dark:hover:bg-slate-800/40 dark:text-slate-400"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Security Settings
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsAccountDetailsOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/30 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Close Settings
                </button>
              </div>

              {/* Right content box inside modal */}
              <div className="flex-1 p-8 overflow-y-auto font-sans">
                {accountModalTab === "profile" ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <h4 className="text-sm font-black text-[#001e66] dark:text-slate-200 uppercase tracking-wider">Profile Info</h4>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Your basic service account records.</p>
                    </div>

                    {profileError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold text-left">
                        {profileError}
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold text-left">
                        {profileSuccess}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name</label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email Address</label>
                        <input
                          type="email"
                          required
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone Number</label>
                        <input
                          type="text"
                          required
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                        />
                      </div>

                      {/* Service Account Number */}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Service Account Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={`CSFWD-${userProfile?.id?.slice(0, 8).toUpperCase() || "CSF-2026"}`}
                            className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-150 bg-slate-50 dark:bg-slate-900/60 dark:border-slate-850 text-slate-500 dark:text-slate-400 text-xs font-bold outline-none cursor-not-allowed select-none"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700">
                            Readonly
                          </span>
                        </div>
                      </div>

                      {/* Complete Address */}
                      <div className="sm:col-span-2 space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Complete Address</label>
                        <input
                          type="text"
                          required
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          placeholder="House No., Street, Barangay, City"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                        />
                      </div>
                    </div>

                    <div className="text-left pt-2">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-5 py-2.5 bg-[#001e66] hover:bg-[#00aeef] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {profileSaving ? "Saving changes..." : "Save Profile Details"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-8 text-left">
                    {/* Password Update */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-black text-[#001e66] dark:text-slate-200 uppercase tracking-wider">Change Password</h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">Update your portal security key.</p>
                      </div>

                      <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                        {securityError && (
                          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                            {securityError}
                          </div>
                        )}
                        {securitySuccess && (
                          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold">
                            {securitySuccess}
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">New Password</label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Confirm New Password</label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••••••"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={updatingPassword}
                          className="px-5 py-2.5 bg-[#001e66] hover:bg-[#00aeef] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {updatingPassword ? "Updating Key..." : "Change Password"}
                        </button>
                      </form>
                    </div>

                    {/* Account Deletion */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                      <div>
                        <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider">Danger Zone</h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">Actions here are permanent and cannot be undone.</p>
                      </div>

                      <div className="bg-red-50/50 dark:bg-red-950/5 rounded-2xl border border-red-100/50 dark:border-red-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-black text-red-750 dark:text-red-450 uppercase tracking-wide">Delete Account</p>
                          <p className="text-[11px] text-slate-500 font-bold mt-1 max-w-md">
                            Deleting your account will remove your access to the AquaTrack portal and cancel all active ticket feeds.
                          </p>
                        </div>
                        {isDeleteConfirmOpen ? (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={handleDeleteAccount}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setIsDeleteConfirmOpen(false)}
                              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-150 text-[#001e66] dark:text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsDeleteConfirmOpen(true)}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Delete Account
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
