"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Home, Map, Wrench, Cpu, Megaphone, Activity, PanelLeftClose, PanelLeftOpen, Menu, AlertTriangle, Bell, Sun, Moon, ChevronDown, User, LogOut, X, CheckCircle2, WifiOff, Info, Newspaper, CalendarDays } from "lucide-react";
import Footer from "../../components/Footer";
import LogoutConfirmModal from "../../components/LogoutConfirmModal";
import MapSection from "./admin-sections/MapSection";
import TelemetrySection from "./admin-sections/TelemetrySection";
import HomeSection from "./sub-admin-sections/HomeSection";
import ComplaintsSection from "./sub-admin-sections/ComplaintsSection";
import MapPreviewModal from "../../components/MapPreviewModal";

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Note 1: High crisp tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.1, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);

    // Note 2: Slightly delayed harmony
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.5);
    }, 80);
  } catch (e) {
    console.error("Audio notification failed:", e);
  }
};

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
  reading?: {
    ph: number;
    turbidity: number;
    tds: number;
    pressure: number;
    timestamp: string;
  } | null;
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

  // Assignment notifications for the bell dropdown
  const [assignmentNotifications, setAssignmentNotifications] = useState<{
    id: string;
    text: string;
    timestamp: Date;
    read: boolean;
  }[]>([]);

  // Track which advisory IDs have been viewed via the bell dropdown
  const [readAdvisoryIds, setReadAdvisoryIds] = useState<Set<string>>(new Set());

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
  const [previewNode, setPreviewNode] = useState<TelemetryNode | null>(null);
  const [previewComplaint, setPreviewComplaint] = useState<any | null>(null);
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);
  const [updatingNodeId, setUpdatingNodeId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterAssignedOnly, setFilterAssignedOnly] = useState(true);
  const [advisoriesPage, setAdvisoriesPage] = useState(1);
  const [isDark, setIsDark] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("sidebar_collapsed");
    if (cached === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem("sidebar_collapsed", nextState ? "true" : "false");
  };

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
  const userProfileIdRef = useRef<string | null>(null);
  useEffect(() => {
    userProfileIdRef.current = userProfile?.id || null;
  }, [userProfile]);
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
    setThemeLoaded(true);
  }, []);

  useEffect(() => {
    if (!themeLoaded) return;
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark, themeLoaded]);

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
            fetchComplaints(); // Refresh the list dynamically!
            fetchStats(); // Update dashboard metric counters!

            if (payload.eventType === "UPDATE") {
              const newAssignedId = payload.new?.assignedToId;
              // payload.old is only populated when REPLICA IDENTITY FULL is set on the table.
              // Fall back to checking only payload.new when old is unavailable.
              const oldAssignedId = payload.old?.assignedToId ?? null;
              const myId = userProfileIdRef.current;

              // Fire only when newly assigned to this user (not already assigned)
              const isNewlyAssigned = myId && newAssignedId === myId && oldAssignedId !== myId;

              if (isNewlyAssigned) {
                const complaintId = payload.new.id as string;
                const shortId = `AQ-COMP-${complaintId.slice(0, 8).toUpperCase()}`;

                // Guard against duplicate notifications for the same complaint
                setAssignmentNotifications((prev) => {
                  if (prev.some((n) => n.id === complaintId)) return prev;
                  // Play gentle chime sound
                  playNotificationSound();
                  return [
                    {
                      id: complaintId,
                      text: `You were assigned to complaint ${shortId}`,
                      timestamp: new Date(),
                      read: false,
                    },
                    ...prev,
                  ];
                });

                // Set alert message banner
                setAlertMessage({
                  type: "success",
                  text: `New Task Assignment: You have been assigned to a new complaint ticket! (ID: ${shortId})`
                });
                // Auto-clear notification banner after 12 seconds
                setTimeout(() => setAlertMessage(null), 12000);
              }
            }
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
      const res = await fetch(`/api/advisories?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setAdvisories(data.advisories);
    } catch (err) {
      console.error("Failed to fetch advisories", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchNodes = async () => {
    try {
      const res = await fetch(`/api/admin/nodes?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setNodes(data.nodes);
    } catch (err) {
      console.error("Failed to fetch nodes", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`/api/admin/complaints?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setComplaints(data.complaints);
    } catch (err) {
      console.error("Failed to fetch complaints", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/admin/stats?t=${Date.now()}`, { cache: "no-store" });
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

  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090d16] flex flex-col items-center justify-center">
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-[#001e66] dark:bg-[#00aeef] z-50" aria-hidden="true" />
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center mb-1">
            <img src="/LOGO2.png" alt="AquaTrack" className="h-[120px] w-auto object-contain dark:hidden" />
            <img src="/LOGO3.png" alt="AquaTrack" className="h-[120px] w-auto object-contain hidden dark:block" />
          </div>
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-[3px] border-t-[#00aeef] animate-spin" />
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold tracking-widest uppercase animate-pulse">
            Loading Field Technician Portal…
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Verifying session and syncing data...</p>
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
    { key: "home", label: "Home", icon: Home },
    { key: "map", label: "Live Monitoring Map", icon: Map },
    { key: "complaints", label: "Complaints and Reports", icon: Wrench },
    { key: "telemetry", label: "IoT Telemetry Panel", icon: Cpu },
    { key: "advisories", label: "Advisories & Events", icon: Megaphone },
  ] as const;

  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-sans w-full relative bg-[#E2EAF4]">
      {/* Background Image Layer with custom opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/BG.jpg')", opacity: 0.08 }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-[#eef4fa] dark:bg-[#07142F] border-b border-slate-300/80 dark:border-white/10 sticky top-0 z-50 h-20 shadow-md relative transition-colors duration-300 flex items-center justify-between px-6 shrink-0">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-1.5 text-slate-500 dark:text-slate-300 hover:text-[#001e66] dark:hover:text-[#00aeef] hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-all focus:outline-none cursor-pointer"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src={isDark ? "/LOGO3.png" : "/LOGO2.png"}
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
              className="w-9 h-9 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#970006] dark:hover:text-red-400 transition-all focus:outline-none relative cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5" />
              {(() => {
                const unreadAssignments = assignmentNotifications.filter(n => !n.read).length;
                const unreadAdvisories = advisories.filter(ad =>
                  ad.type === "warning" &&
                  (ad.targetRole === "broadcast" || ad.targetRole === "technicians") &&
                  !readAdvisoryIds.has(ad.id)
                ).length;
                const total = unreadAssignments + unreadAdvisories;
                return total > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white font-black text-[8px] items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                      {total}
                    </span>
                  </span>
                ) : null;
              })()}
            </button>

            {/* Notifications Dropdown */}
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
                      <span className="font-black text-[#001e66] dark:text-slate-200 uppercase tracking-wider text-[10px]">Notifications</span>
                      <span className="text-[9px] text-[#00aeef] font-black uppercase tracking-wider">
                        {advisories.filter(ad => ad.type === "warning" && (ad.targetRole === "broadcast" || ad.targetRole === "technicians")).length + assignmentNotifications.length} Total
                      </span>
                    </div>

                    <div className="divide-y divide-slate-55 dark:divide-slate-800/80 max-h-80 overflow-y-auto p-2 space-y-1.5 bg-slate-50/30 dark:bg-slate-950/20">

                      {/* Assignment Notifications */}
                      {assignmentNotifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => {
                            // Mark this notification as read
                            setAssignmentNotifications((prev) =>
                              prev.map((n) => n.id === notif.id ? { ...n, read: true } : n)
                            );
                            // Navigate to complaints tab
                            setActiveTab("complaints");
                            setShowNotificationMenu(false);
                          }}
                          className={`w-full p-2.5 border rounded-xl flex gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs text-left cursor-pointer ${
                            notif.read
                              ? "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/40 opacity-60"
                              : "bg-white dark:bg-slate-900 border-[#00aeef]/20 dark:border-[#00aeef]/10 hover:bg-blue-50/50 dark:hover:bg-[#00aeef]/5"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#00aeef]/10 flex items-center justify-center shrink-0 relative">
                            <ClipboardList className="w-4 h-4 text-[#00aeef]" />
                            {!notif.read && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00aeef]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-[#001e66] dark:text-[#00aeef] text-[11px]">Task Assignment</span>
                              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono shrink-0 mt-0.5">
                                {notif.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[9.5px] leading-relaxed text-left">
                              {notif.text}
                            </p>
                          </div>
                        </button>
                      ))}

                      {/* System Alarm Advisories */}
                      {advisories
                        .filter(ad => ad.type === "warning" && (ad.targetRole === "broadcast" || ad.targetRole === "technicians"))
                        .map((ad) => {
                          const isRead = readAdvisoryIds.has(ad.id);
                          return (
                            <button
                              key={ad.id}
                              onClick={() => {
                                // Mark advisory as read
                                setReadAdvisoryIds((prev) => new Set([...prev, ad.id]));
                                // Navigate to advisories tab
                                setActiveTab("advisories");
                                setShowNotificationMenu(false);
                              }}
                              className={`w-full p-2.5 border rounded-xl flex gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs text-left cursor-pointer ${
                                isRead
                                  ? "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/40 opacity-60"
                                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 relative">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                {!isRead && (
                                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="font-bold text-red-650 dark:text-red-400 text-[11px] truncate">{ad.title}</span>
                                  <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono shrink-0 mt-0.5">{ad.date}</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[9.5px] leading-relaxed line-clamp-2 text-left">
                                  {ad.text}
                                </p>
                              </div>
                            </button>
                          );
                        })}

                      {advisories.filter(ad => ad.type === "warning" && (ad.targetRole === "broadcast" || ad.targetRole === "technicians")).length === 0 && assignmentNotifications.length === 0 && (
                        <div className="p-6 text-center text-slate-400 dark:text-slate-500 italic text-[11px]">
                          No notifications.
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
            className="w-9 h-9 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-[#00aeef] hover:text-[#001e66] dark:hover:text-[#00aeef] transition-all focus:outline-none cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Staff Profile Dropdown */}
          <div className="relative">
            <div
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotificationMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-all select-none"
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
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-300 ${showProfileMenu ? "rotate-180" : ""}`} />
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
                      <User className="w-4 h-4 text-slate-400" />
                      Manage Account
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50 dark:border-slate-800/50"
                    >
                      <LogOut className="w-4 h-4" />
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
      <div className="flex flex-col lg:flex-row flex-1 p-4 gap-4 bg-transparent relative z-10">

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside className={`hidden lg:flex shrink-0 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 flex flex-col h-[calc(100vh-120px)] lg:sticky lg:top-24 rounded-2xl overflow-visible shadow-sm transition-all duration-300 ease-in-out relative z-[60] ${
          isSidebarCollapsed ? "w-16" : "w-56"
        }`}>
          {/* Collapse Toggle Button for Desktop */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute top-6 -right-3.5 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer z-45 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180 scale-90 text-amber-500" : "rotate-0"}`} />
          </button>

          <div className="flex-1 py-3 px-3 overflow-visible">
            {/* Technician Menu Header */}
            <div className={`mb-5 mt-2 flex items-center gap-3 pb-3.5 border-b border-slate-100 dark:border-white/5 transition-all ${
              isSidebarCollapsed ? "justify-center px-0" : "justify-start px-3"
            }`}>
              {/* Technician Wrench Icon */}
              <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/15 shrink-0 shadow-xs">
                <Wrench className="w-5 h-5 text-amber-500" />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col text-left leading-none transition-opacity duration-300">
                  <span className="text-[12px] md:text-[14px] font-black text-[#001e66] dark:text-white uppercase tracking-wider">
                    Technician Menu
                  </span>
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-[#00aeef] mt-1 block">
                    AquaTrack
                  </span>
                </div>
              )}
            </div>

            {/* Nav Items */}
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as any)}
                    className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                      isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3.5 py-2.5"
                    } ${
                      isActive
                        ? "bg-blue-600 dark:bg-blue-600/90 text-white font-bold shadow-[0_4px_12px_rgba(37,99,235,0.25)] scale-[1.02]"
                        : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    {/* Active left indicator bar */}
                    {isActive && !isSidebarCollapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-full animate-pulse" />
                    )}
                    {isActive && isSidebarCollapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white rounded-full animate-pulse" />
                    )}
                    <item.icon
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={`w-4.5 h-4.5 shrink-0 transition-all duration-300 ${
                        isActive
                          ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
                          : "text-slate-400 dark:text-slate-500 group-hover:scale-110 group-hover:rotate-[2deg] group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      }`}
                    />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    <div className="absolute left-full ml-3.5 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-[10.5px] font-black uppercase tracking-wider rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150 whitespace-nowrap shadow-md z-50 border border-slate-700/25">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Premium Profile Card at bottom */}
          <div className={`mt-auto border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/30 transition-all ${
            isSidebarCollapsed ? "p-2 flex flex-col items-center gap-2" : "p-3.5 space-y-3.5"
          }`}>
            {/* Assigned Status Row */}
            {!isSidebarCollapsed ? (
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <ClipboardList className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Assigned
                </span>
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  assignedComplaints.length > 0
                    ? "bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border-red-100 dark:border-red-900/30 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-850 text-slate-550 dark:text-slate-400 border-slate-200/50 dark:border-slate-800"
                }`}>
                  {assignedComplaints.length} Job{assignedComplaints.length !== 1 ? "s" : ""}
                </span>
              </div>
            ) : (
              <div 
                className={`w-2.5 h-2.5 rounded-full ${assignedComplaints.length > 0 ? "bg-red-500 animate-pulse" : "bg-slate-450 dark:bg-slate-600"}`} 
                title={`Assigned Incidents: ${assignedComplaints.length}`}
              />
            )}

            {/* Profile Block */}
            <div className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl shadow-sm ${
              isSidebarCollapsed ? "p-1.5" : "p-2.5 flex items-center gap-2.5"
            }`}>
              <div 
                className="w-7 h-7 rounded-lg bg-[#00aeef] text-white flex items-center justify-center text-[11px] font-black shrink-0 uppercase select-none shadow-sm cursor-pointer"
                title={isSidebarCollapsed ? (userProfile?.name || staffId) : undefined}
              >
                {initials}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col leading-none text-left min-w-0 flex-1">
                  <span className="text-[10px] font-black text-[#001e66] dark:text-white truncate">
                    {userProfile?.name || staffId}
                  </span>
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 block">
                    {currentUserRole === "ADMIN" ? "Admin Staff" : "Technician"}
                  </span>
                </div>
              )}
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
                    <img src={isDark ? "/LOGO3.png" : "/LOGO2.png"} alt="AquaTrack Logo" className="h-8 w-auto object-contain" />
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
                  {/* Technician Menu Header */}
                  <div className="px-3 mb-5 mt-2 flex items-center justify-start gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    {/* Technician Wrench Icon */}
                    <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/15 shrink-0">
                      <Wrench className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[12px] md:text-[14px] font-black text-[#001e66] dark:text-white uppercase tracking-wider">
                        Technician Menu
                      </span>
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-[#00aeef] mt-1 block">
                        AquaTrack
                      </span>
                    </div>
                  </div>
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
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                            isActive
                              ? "bg-blue-600 dark:bg-blue-600/90 text-white font-bold shadow-[0_4px_12px_rgba(37,99,235,0.25)] scale-[1.02]"
                              : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-full" />
                          )}
                          <item.icon
                            strokeWidth={isActive ? 2.5 : 1.8}
                            className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                              isActive
                                ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
                                : "text-slate-400 dark:text-slate-500 group-hover:scale-110 group-hover:rotate-[2deg] group-hover:text-blue-600 dark:group-hover:text-blue-400"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Drawer Bottom */}
                <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                  {/* Assigned Status Row */}
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-450 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                      <ClipboardList className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Assigned
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                      assignedComplaints.length > 0
                        ? "bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border-red-100 dark:border-red-900/30 animate-pulse"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 border-slate-200/50 dark:border-slate-700/60"
                    }`}>
                      {assignedComplaints.length} Job{assignedComplaints.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Profile Block */}
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-3 shadow-sm">
                    <div className="w-9 h-9 rounded-xl bg-[#00aeef] text-white flex items-center justify-center text-xs font-black shrink-0 uppercase select-none shadow-sm">
                      {initials}
                    </div>
                    <div className="flex flex-col leading-none text-left min-w-0 flex-1">
                      <span className="text-xs font-black text-[#001e66] dark:text-white truncate">
                        {userProfile?.name || staffId}
                      </span>
                      <span className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-1 block">
                        {currentUserRole === "ADMIN" ? "Admin Staff" : "Technician"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <main className="flex-1 bg-white dark:bg-slate-900/50 border border-slate-100/80 dark:border-white/5 p-6 flex flex-col rounded-2xl shadow-sm">
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
                  previewNode={previewNode}
                  setPreviewNode={setPreviewNode}
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
                      return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
                    case "info":
                      return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
                    case "news":
                      return <Newspaper className="w-4 h-4 text-emerald-500 shrink-0" />;
                    case "event":
                      return <CalendarDays className="w-4 h-4 text-purple-500 shrink-0" />;
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
                    <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                      <h2 className="text-lg font-semibold text-[#001e66] tracking-tight">Advisories &amp; Events</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Service bulletins and operational notices from the district admin</p>
                    </div>

                    <div className="space-y-4">
                      {paginatedAdvisories.map((ad) => (
                        <div
                          key={ad.id}
                          className={`bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 border-l-4 ${getBorderColor(ad.type)} rounded-2xl p-5 space-y-2.5 shadow-sm hover:shadow-md transition-all`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500">
                              {getTypeIcon(ad.type)}
                              <span className="text-[10px] font-bold">{ad.date}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              ad.type === "warning"
                                ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border-red-200 dark:border-red-900/60"
                                : ad.type === "info"
                                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-900/60"
                                : ad.type === "news"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                                : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-900/60"
                            }`}>
                              {ad.type}
                            </span>
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60">
                              {ad.targetRole === "technicians" ? "Technicians" : "All Staff"}
                            </span>
                          </div>
                          <h3 className="font-semibold text-[#001e66] dark:text-slate-100 text-sm">{ad.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{ad.text}</p>
                        </div>
                      ))}

                      {filteredAdvisories.length === 0 && (
                        <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                          <div className="mb-3 flex justify-center">
                            <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          </div>
                          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No advisories posted yet.</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Check back for operational bulletins from the admin.</p>
                        </div>
                      )}

                      {/* Pagination Controls */}
                      {maxPage > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                          <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setAdvisoriesPage((p) => Math.max(1, p - 1))}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-[#001e66] dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Page {currentPage} of {maxPage}
                          </span>
                          <button
                            type="button"
                            disabled={currentPage === maxPage}
                            onClick={() => setAdvisoriesPage((p) => Math.min(maxPage, p + 1))}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-[#001e66] dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
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

      {/* Reusable Footer */}
      <Footer />

      {/* Map Preview Modal */}
      <MapPreviewModal
        isOpen={previewComplaint !== null}
        onClose={() => setPreviewComplaint(null)}
        complaint={previewComplaint}
      />

      {/* Telemetry Node Satellite Preview Modal */}
      {previewNode && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative text-left flex flex-col md:flex-row min-h-[420px]">
            
            {/* Close Button (Absolute overlay on the entire modal) */}
            <button
              type="button"
              onClick={() => setPreviewNode(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/95 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer border border-slate-200 dark:border-slate-700 focus:outline-none shadow-md z-20"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Left Pane: Map Preview Image */}
            <div className="w-full md:w-5/12 bg-slate-100 dark:bg-slate-800 relative min-h-[220px] md:min-h-full">
              {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-s+970006(${previewNode.longitude},${previewNode.latitude})/${previewNode.longitude},${previewNode.latitude},16.5,0/450x450?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                  alt="Satellite Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xxs font-bold uppercase tracking-wider space-y-1">
                  <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />
                  <span>No Mapbox Token Configured</span>
                </div>
              )}
            </div>

            {/* Right Pane: Content Details */}
            <div className="w-full md:w-7/12 p-6 flex flex-col justify-between space-y-5 relative">
              <div className="space-y-4">
                <div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${
                    previewNode.type === "PUMP_STATION" || previewNode.name.toLowerCase().includes("station") || previewNode.name.toLowerCase().includes("reservoir")
                      ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-150 dark:border-sky-800/70"
                      : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-150 dark:border-indigo-800/70"
                  }`}>
                    {previewNode.type === "PUMP_STATION" || previewNode.name.toLowerCase().includes("station") || previewNode.name.toLowerCase().includes("reservoir")
                      ? "Pumping Station"
                      : "Household Pipeline"}
                  </span>
                  <h3 className="text-[#001e66] dark:text-slate-100 text-base font-black mt-2 leading-tight pr-6">
                    {previewNode.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 select-all tracking-wider">
                    NODE ID: {`AQ-NODE-${previewNode.id.slice(-8).toUpperCase()}`}
                  </p>
                </div>

                {/* Location Details Grid */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs font-semibold">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase tracking-wider block">Barangay Area</span>
                    <span className="text-[#001e66] dark:text-slate-100 font-black text-sm block mt-0.5">
                      {(() => {
                        const nameLower = previewNode.name.toLowerCase();
                        if (nameLower.includes("dolores")) return "Brgy. Dolores";
                        if (nameLower.includes("pilar")) return "Brgy. Del Pilar";
                        if (nameLower.includes("calulut")) return "Brgy. Calulut";
                        if (nameLower.includes("sindalan")) return "Brgy. Sindalan";
                        if (nameLower.includes("agustin")) return "Brgy. San Agustin";
                        return "San Fernando District";
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase tracking-wider block">GPS Coordinates</span>
                    <span className="text-[#001e66] dark:text-slate-100 font-mono font-bold block mt-0.5">
                      {previewNode.latitude.toFixed(5)}, {previewNode.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>

                {/* Detailed Live Readings Table */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2.5">
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-[9px] uppercase tracking-wider block">Live Diagnostic Readings</span>
                  {previewNode.reading ? (
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      {/* pH */}
                      {(() => {
                        const isAnomaly = previewNode.reading!.ph < 6.5 || previewNode.reading!.ph > 8.5;
                        return (
                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 block uppercase">pH level</span>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-xs font-black text-[#001e66] dark:text-slate-100 font-mono">{previewNode.reading!.ph.toFixed(2)}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide ${
                                isAnomaly ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 animate-pulse" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300"
                              }`}>
                                {isAnomaly ? <AlertTriangle className="w-2 h-2 shrink-0" /> : <CheckCircle2 className="w-2 h-2 shrink-0" />}
                                {isAnomaly ? "WARN" : "OK"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                      {/* Turbidity */}
                      {(() => {
                        const isAnomaly = previewNode.reading!.turbidity > 5.0;
                        return (
                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Turbidity</span>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-xs font-black text-[#001e66] dark:text-slate-100 font-mono">{previewNode.reading!.turbidity.toFixed(1)} <span className="text-[8px] font-normal">NTU</span></span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide ${
                                isAnomaly ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 animate-pulse" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300"
                              }`}>
                                {isAnomaly ? <AlertTriangle className="w-2 h-2 shrink-0" /> : <CheckCircle2 className="w-2 h-2 shrink-0" />}
                                {isAnomaly ? "WARN" : "OK"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                      {/* TDS */}
                      {(() => {
                        const isAnomaly = previewNode.reading!.tds > 500;
                        return (
                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 block uppercase">TDS (Minerals)</span>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-xs font-black text-[#001e66] dark:text-slate-100 font-mono">{previewNode.reading!.tds.toFixed(0)} <span className="text-[8px] font-normal">ppm</span></span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide ${
                                isAnomaly ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 animate-pulse" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300"
                              }`}>
                                {isAnomaly ? <AlertTriangle className="w-2 h-2 shrink-0" /> : <CheckCircle2 className="w-2 h-2 shrink-0" />}
                                {isAnomaly ? "WARN" : "OK"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                      {/* Pressure */}
                      {(() => {
                        const isAnomaly = previewNode.reading!.pressure < 30;
                        return (
                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Pressure</span>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-xs font-black text-[#001e66] dark:text-slate-100 font-mono">{previewNode.reading!.pressure.toFixed(1)} <span className="text-[8px] font-normal">PSI</span></span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide ${
                                isAnomaly ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 animate-pulse" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300"
                              }`}>
                                {isAnomaly ? <AlertTriangle className="w-2 h-2 shrink-0" /> : <CheckCircle2 className="w-2 h-2 shrink-0" />}
                                {isAnomaly ? "WARN" : "OK"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-slate-400 dark:text-slate-500 text-xs italic bg-slate-50 dark:bg-slate-800/60 rounded-xl">No telemetry logs found for this node.</div>
                  )}
                </div>

                {/* Status footer */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 flex items-center justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-[9px] uppercase tracking-wider">Operational Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    previewNode.status === "ONLINE" ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
                    previewNode.status === "MAINTENANCE" ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                    "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                  }`}>
                    {previewNode.status === "ONLINE" && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                    {previewNode.status === "MAINTENANCE" && <Wrench className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />}
                    {previewNode.status === "OFFLINE" && <WifiOff className="w-3 h-3 text-rose-500 animate-pulse shrink-0" />}
                    {previewNode.status}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewNode(null)}
                className="w-full bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md text-xxs uppercase tracking-widest cursor-pointer border-none focus:outline-none"
              >
                Close Map Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoading={signingOut}
        message="Are you sure you want to end your executive session and log out of the command center?"
      />

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
