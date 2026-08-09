"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabase";
import { generateComplianceReport } from "../../lib/pdf-generator";
import { calculateDistance } from "../../lib/spatial-sorting";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../../components/Footer";
import { 
  Home, Map, AlertTriangle, Flame, Cpu, BarChart3, Users, 
  Megaphone, Settings, Bell, HelpCircle, Sun, Moon, ChevronDown, 
  Menu, X, User, LogOut, CheckCircle2, Wrench, WifiOff, ClipboardList, Activity,
  Shield, PanelLeftClose, PanelLeftOpen, Sparkles
} from "lucide-react";

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
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
  
  // State for dismissed notifications and badge indicator
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [hasOpenedNotifications, setHasOpenedNotifications] = useState(false);

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
  const [activeDetailNews, setActiveDetailNews] = useState<any | null>(null);
  const [activeDetailEvent, setActiveDetailEvent] = useState<any | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Announcement Form State
  const [newAdvisoryTitle, setNewAdvisoryTitle] = useState("");
  const [newAdvisoryText, setNewAdvisoryText] = useState("");
  const [newAdvisoryType, setNewAdvisoryType] = useState<"warning" | "info" | "news" | "event">("warning");
  const [newAdvisoryTargetRole, setNewAdvisoryTargetRole] = useState<"broadcast" | "consumers" | "technicians">("broadcast");
  const [newAdvisoryEventDate, setNewAdvisoryEventDate] = useState("");

  // System Configuration Form State
  const [selectedSimNodeId, setSelectedSimNodeId] = useState("");
  const [simPreset, setSimPreset] = useState<"normal" | "pressure_drop" | "turbidity" | "contamination">("normal");
  const [simValues, setSimValues] = useState({
    ph: 7.2,
    turbidity: 1.2,
    tds: 220,
    pressure: 45.0,
  });

  const [aiTriageStrictness, setAiTriageStrictness] = useState(75);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [hotCacheTTL, setHotCacheTTL] = useState(60);
  const [isDark, setIsDark] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Diagnostic Alerts
  const [diagnosticAlerts, setDiagnosticAlerts] = useState<any[]>([]);

  // Account settings states
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
  const [previewNode, setPreviewNode] = useState<TelemetryNode | null>(null);
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

  // Load from localStorage on client-side mount
  useEffect(() => {
    const stored = localStorage.getItem("dismissed_notifications");
    if (stored) {
      try {
        setDismissedNotificationIds(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse dismissed notifications", e);
      }
    }
    setMaintenanceMode(localStorage.getItem("maintenance_mode") === "true");
  }, []);

  const handleToggleMaintenanceMode = (enabled: boolean) => {
    setMaintenanceMode(enabled);
    localStorage.setItem("maintenance_mode", enabled ? "true" : "false");
    window.dispatchEvent(new Event("maintenance-mode-change"));
  };

  // Sync to localStorage
  const dismissNotification = (id: string) => {
    const updated = [...dismissedNotificationIds, id];
    setDismissedNotificationIds(updated);
    localStorage.setItem("dismissed_notifications", JSON.stringify(updated));
  };

  const clearAllNotifications = (idsToDismiss: string[]) => {
    const updated = Array.from(new Set([...dismissedNotificationIds, ...idsToDismiss]));
    setDismissedNotificationIds(updated);
    localStorage.setItem("dismissed_notifications", JSON.stringify(updated));
  };

  const getDynamicNotifications = () => {
    const list: any[] = [];

    // 1. System Advisories (warnings)
    advisories
      .filter((ad) => ad.type === "warning")
      .forEach((ad) => {
        list.push({
          id: `advisory-${ad.id}`,
          type: "advisory",
          title: ad.title,
          text: ad.text,
          date: ad.date,
          original: ad,
        });
      });

    // 2. Newly Submitted Complaints or Complaints with Suggested Action (status !== RESOLVED)
    complaints
      .filter((c) => c.status !== "RESOLVED")
      .forEach((c) => {
        const formattedDate = new Date(c.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        // Check if flagged with suggested action (within 500m of an active diagnostic alert node)
        let isSuggested = false;
        let matchedAlertNodeName = "";
        
        if (diagnosticAlerts.length > 0) {
          const matchedAlert = diagnosticAlerts.find((alert) => {
            const dist = calculateDistance(
              { latitude: c.latitude, longitude: c.longitude },
              { latitude: alert.node.latitude, longitude: alert.node.longitude }
            );
            if (dist > 500) return false;

            // Enforce AI Triage strictness threshold check
            const confidence = alert.geminiAnalysis?.confidenceScore || 0;
            if (confidence < aiTriageStrictness) return false;

            const nodeObj = nodes.find((n) => n.id === alert.nodeId);
            if (!nodeObj || !nodeObj.reading) return false;

            const { ph, turbidity, tds, pressure } = nodeObj.reading;
            if (c.category === "PIPELINE_BREACH_PRESSURE_DROP" && pressure < 30) return true;
            if (c.category === "HIGH_TURBIDITY" && turbidity > 5) return true;
            if (c.category === "HIGH_MINERAL_CONTENT_TDS" && tds > 500) return true;
            if (c.category === "CHEMICAL_DISCOLORATION_CONTAMINATION" && (ph < 6.5 || ph > 8.5)) return true;

            return false;
          });
          if (matchedAlert) {
            isSuggested = true;
            matchedAlertNodeName = matchedAlert.node.name;
          }
        }

        if (isSuggested) {
          list.push({
            id: `complaint-suggested-${c.id}`,
            type: "suggested_action",
            title: "Suggested AI Action Alert",
            text: `Anomaly detected near node ${matchedAlertNodeName}: ${c.summary || c.rawText}`,
            date: formattedDate,
            original: c,
          });
        } else if (c.status === "PENDING") {
          list.push({
            id: `complaint-new-${c.id}`,
            type: "new_complaint",
            title: "New Complaint Submitted",
            text: `[${c.barangay || "Unknown Barangay"}] ${c.summary || c.rawText}`,
            date: formattedDate,
            original: c,
          });
        }
      });

    // 3. Offline/Maintenance Nodes
    nodes
      .filter((n) => n.status === "OFFLINE" || n.status === "MAINTENANCE")
      .forEach((n) => {
        const statusLabel = n.status === "OFFLINE" ? "OFFLINE" : "MAINTENANCE";
        list.push({
          id: `node-${n.id}-${n.status}`,
          type: "node_status",
          title: `Node ${statusLabel}`,
          text: `Node ${n.name} status is now ${statusLabel}`,
          date: "Now",
          original: n,
        });
      });

    return list.filter((item) => !dismissedNotificationIds.includes(item.id));
  };

  const activeNotifications = getDynamicNotifications();

  const handleNotificationClick = (item: any) => {
    dismissNotification(item.id);
    
    if (item.type === "advisory") {
      setActiveTab("announcements");
    } else if (item.type === "new_complaint") {
      setActiveTab("reports");
      setComplaintSearchQuery(item.original.id);
    } else if (item.type === "node_status") {
      setActiveTab("telemetry");
      setNodeSearchQuery(item.original.name);
    } else if (item.type === "suggested_action") {
      setPreviewComplaint(item.original);
    }
    
    setShowNotificationMenu(false);
  };

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
          cache: "no-store",
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
          setUserProfile({
            id: currentSession.user.id,
            name: profile.name || "Admin",
            email: profile.email || currentSession.user.email || "",
            role: "ADMIN",
            phone: profile.phone || "",
            address: profile.address || "",
            serviceAccountNo: profile.serviceAccountNo || null
          });
          setProfileName(profile.name || "Admin");
          setProfileEmail(profile.email || currentSession.user.email || "");
          setProfilePhone(profile.phone || "");
          setProfileAddress(profile.address || "");
          // Re-fetch current database values
          await Promise.all([fetchUsers(), fetchNodes(), fetchComplaints(), fetchStats(), fetchAdvisories(), fetchDiagnosticAlerts()]);
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

  // Enable Supabase Realtime subscriptions for complaint and telemetry changes
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
            fetchDiagnosticAlerts(); // Refresh diagnostic alerts
          }
        )
        .subscribe();

      const readingsChannel = client
        .channel("admin-readings-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "TelemetryReading" },
          (payload) => {
            console.log("Realtime telemetry reading received:", payload);
            fetchNodes(); // Re-fetch nodes to update live readings immediately!
            fetchStats(); // Update dashboard metric averages!
            fetchDiagnosticAlerts(); // Re-fetch diagnostic alerts to update Suggested Actions immediately!
          }
        )
        .subscribe();

      const usersChannel = client
        .channel("admin-users-realtime")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "User" },
          (payload) => {
            console.log("Realtime user profile update received:", payload);
            fetchUsers(); // Re-fetch users to update live locations!
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
        client.removeChannel(readingsChannel);
        client.removeChannel(usersChannel);
      };
    } catch (err) {
      console.error("Failed to setup realtime subscriptions:", err);
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

  const fetchDiagnosticAlerts = async () => {
    try {
      const res = await fetch("/api/admin/diagnostic-alerts");
      const data = await res.json();
      if (data.success) {
        setDiagnosticAlerts(data.alerts);
      }
    } catch (err) {
      console.error("Failed to fetch diagnostic alerts", err);
    }
  };

  const handleDispatchAlert = async (alertId: string, crewId: string) => {
    try {
      const res = await fetch("/api/admin/diagnostic-alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId, status: "RESOLVED" }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", "Technician dispatched to sensor node!");
        fetchDiagnosticAlerts();
      } else {
        showFeedback("error", data.error || "Failed to dispatch technician");
      }
    } catch (err) {
      showFeedback("error", "Network error dispatching technician");
    }
  };

  const handleLogout = async () => {
    const client = getSupabaseClient();
    await client.auth.signOut();
    window.location.href = "/login";
  };

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

  const handleUpdateUserProfile = async (
    userId: string,
    updates: { role?: string; serviceAccountNo?: string; phone?: string; address?: string }
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
        body: JSON.stringify({ id: complaintId, status: newStatus, emailAlertsEnabled }),
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
        body: JSON.stringify({ id: complaintId, assignedToId: assignedToId || null, emailAlertsEnabled }),
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
      const res = await fetch("/api/admin/telemetry-ingest", {
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
        fetchComplaints();
        fetchDiagnosticAlerts();
      } else {
        const errorText = await res.text();
        showFeedback("error", `Ingest function error: ${errorText}`);
      }
    } catch (err) {
      showFeedback("error", "Failed to connect to simulation endpoint");
    }
  };

  const handleDownloadReport = async () => {
    showFeedback("success", "Generating water analytics audit report...");
    
    let summaryText = "";
    try {
      const res = await fetch("/api/admin/system-summary");
      const json = await res.json();
      if (json.success) {
        summaryText = json.summary;
      }
    } catch (e) {
      console.warn("Failed fetching summary for compliance report:", e);
    }

    const readings = nodes.map((n, i) => {
      // Apply realistic simulated offsets per node based on current simulator values
      const phOffset = parseFloat(((i % 2 === 0 ? 0.15 : -0.1) * (i % 3 === 0 ? 1 : 0.6)).toFixed(2));
      const turbidityOffset = parseFloat(((i % 2 === 0 ? 0.3 : -0.2) * (i % 3 === 0 ? 1.2 : 0.5)).toFixed(2));
      const tdsOffset = i % 2 === 0 ? 12 : -15;
      const pressureOffset = parseFloat(((i % 2 === 0 ? 2.1 : -1.6) * (i % 3 === 0 ? 1.4 : 0.8)).toFixed(1));

      return {
        nodeName: n.name,
        ph: Math.max(0, Math.min(14, simValues.ph + phOffset)),
        turbidity: Math.max(0, simValues.turbidity + turbidityOffset),
        tds: Math.max(0, simValues.tds + tdsOffset),
        pressure: Math.max(0, simValues.pressure + pressureOffset),
        timestamp: new Date().toISOString(),
      };
    });

    generateComplianceReport({
      readings,
      complaints,
      systemSummary: summaryText,
    });
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
          eventDate: newAdvisoryType === "event" ? newAdvisoryEventDate : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdvisories([data.advisory, ...advisories]);
        setNewAdvisoryTitle("");
        setNewAdvisoryText("");
        setNewAdvisoryTargetRole("broadcast");
        setNewAdvisoryEventDate("");
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
    { key: "home", label: "Home", icon: Home },
    { key: "map", label: "Live Monitoring Map", icon: Map },
    { key: "reports", label: "Complaints & Reports", icon: AlertTriangle },
    { key: "heatmaps", label: "Spatial Heatmaps", icon: Flame },
    { key: "telemetry", label: "IoT Telemetry", icon: Cpu },
    { key: "analytics", label: "Water Analytics", icon: BarChart3 },
    { key: "users", label: "User Profiles", icon: Users },
    { key: "announcements", label: "Community Broadcasts", icon: Megaphone },
    { key: "config", label: "System Configuration", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-sans w-full relative bg-[#E2EAF4]">
      {/* Background Image Layer with custom opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/BG.jpg')", opacity: 0.08 }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 transition-colors">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-[#001e66] dark:hover:text-[#00aeef] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all focus:outline-none cursor-pointer"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5 transition-transform hover:scale-110 duration-200" />
          </button>
          <img 
            src="/LOGO2.png" 
            alt="AquaTrack Logo" 
            className="h-25 w-auto translate-y-1 hover:opacity-90 transition-opacity shrink-0 dark:brightness-110" 
          />
        </div>

        {/* Middle: Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400 font-medium">
          <span>Console</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-[#001e66] dark:text-[#00aeef] font-semibold">{activeBreadcrumb}</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          
          {/* Alerts Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setHasOpenedNotifications(true);
                setShowHelpModal(false);
                setShowProfileMenu(false);
              }}
              className="w-9 h-9 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-center text-slate-500 hover:text-[#970006] dark:hover:text-red-400 transition-all focus:outline-none relative cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5 transition-all duration-300 hover:scale-110 hover:rotate-6 hover:text-[#970006] dark:hover:text-red-400" />
              {activeNotifications.length > 0 && !hasOpenedNotifications && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white font-black text-[8px] items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                    {activeNotifications.length}
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
                      <span className="font-black text-[#001e66] dark:text-slate-200 uppercase tracking-wider text-[10px]">Active Notifications</span>
                      {activeNotifications.length > 0 && (
                        <button
                          onClick={() => clearAllNotifications(activeNotifications.map((n) => n.id))}
                          className="text-[9px] text-[#970006] hover:text-red-750 dark:text-red-400 dark:hover:text-red-300 font-black uppercase tracking-wider cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/85 max-h-[340px] overflow-y-auto p-2 space-y-1.5 bg-slate-50/30 dark:bg-slate-950/20">
                      {activeNotifications.map((item) => {
                        let headerColor = "text-[#970006] dark:text-red-400";
                        let iconBg = "bg-red-500/10";
                        let iconColor = "text-red-500";
                        let IconComponent = AlertTriangle;
                        
                        if (item.type === "new_complaint") {
                          headerColor = "text-[#00aeef] dark:text-[#00aeef]";
                          iconBg = "bg-[#00aeef]/10";
                          iconColor = "text-[#00aeef]";
                          IconComponent = AlertTriangle;
                        } else if (item.type === "node_status") {
                          const isOffline = item.title.includes("OFFLINE");
                          headerColor = isOffline ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400";
                          iconBg = isOffline ? "bg-red-500/10" : "bg-amber-500/10";
                          iconColor = isOffline ? "text-red-500" : "text-amber-500";
                          IconComponent = Cpu;
                        } else if (item.type === "suggested_action") {
                          headerColor = "text-purple-650 dark:text-purple-400";
                          iconBg = "bg-purple-500/10";
                          iconColor = "text-purple-500";
                          IconComponent = Sparkles;
                        }

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className="group p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-pointer relative text-left"
                          >
                            {/* Icon Box */}
                            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                              <IconComponent className={`w-4 h-4 ${iconColor}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <span className={`font-bold text-[11px] ${headerColor} truncate`}>
                                  {item.title}
                                </span>
                                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono shrink-0 mt-0.5">
                                  {item.date}
                                </span>
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[9.5px] leading-relaxed line-clamp-2">
                                {item.text}
                              </p>
                            </div>

                            {/* Dismiss button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(item.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-opacity p-1 ml-1 rounded hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer flex items-center justify-center shrink-0"
                              title="Dismiss Alert"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                      {activeNotifications.length === 0 && (
                        <div className="p-6 text-center text-slate-400 dark:text-slate-500 italic text-[11px]">
                          No active system alarms or notifications.
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Help Button */}
          <button
            onClick={() => {
              setShowHelpModal(true);
              setShowNotificationMenu(false);
              setShowProfileMenu(false);
            }}
            className="w-9 h-9 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-center text-slate-500 hover:text-[#001e66] dark:hover:text-[#00aeef] transition-all focus:outline-none cursor-pointer"
            title="Help Center"
          >
            <HelpCircle className="w-4.5 h-4.5 transition-all duration-300 hover:scale-110 hover:rotate-[6deg]" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-center text-slate-500 hover:text-[#001e66] dark:hover:text-[#00aeef] transition-all focus:outline-none cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 transition-all duration-300 hover:scale-110 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 transition-all duration-300 hover:scale-110 hover:-rotate-12" />
            )}
          </button>

          {/* Admin Profile Dropdown */}
          <div className="relative">
            <div
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotificationMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-all select-none"
            >
              <div className="w-7 h-7 rounded-lg bg-[#001e66] dark:bg-[#00aeef] text-white flex items-center justify-center text-xs font-black uppercase shadow-sm">
                {userProfile?.name?.slice(0, 1).toLowerCase() || "a"}
              </div>
              <div className="hidden sm:flex flex-col leading-none text-left">
                <span className="text-[11px] font-bold text-[#001e66] dark:text-slate-200">
                  {userProfile?.name || "Administrator"}
                </span>
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-450 mt-0.5 tracking-wider uppercase">
                  Super Admin
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
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account ID</p>
                      <p className="text-[9px] font-mono text-[#001e66] dark:text-slate-200 mt-0.5 truncate">{userProfile?.id || "AQ-SUPERADMIN"}</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsAccountDetailsOpen(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#001e66] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center gap-2 cursor-pointer group"
                    >
                      <User className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                      Manage Account
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50 dark:border-slate-800/50 group"
                    >
                      <LogOut className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:scale-110 group-hover:translate-x-0.5 transition-transform" />
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
            <Menu className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180 scale-90 text-[#00aeef]" : "rotate-0"}`} />
          </button>

          <div className="flex-1 py-3 px-3 overflow-visible">
            {/* Admin Menu Header */}
            <div className={`mb-5 mt-2 flex items-center gap-3 pb-3.5 border-b border-slate-100 dark:border-white/5 transition-all ${
              isSidebarCollapsed ? "justify-center px-0" : "justify-start px-3"
            }`}>
              {/* Admin Shield Icon */}
              <div className="p-1.5 rounded-lg bg-[#00aeef]/10 dark:bg-[#00aeef]/20 border border-[#00aeef]/15 shrink-0 shadow-xs">
                <Shield className="w-5 h-5 text-[#00aeef]" />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col text-left leading-none transition-opacity duration-300">
                  <span className="text-[12px] md:text-[14px] font-black text-[#001e66] dark:text-white uppercase tracking-wider">
                    Admin Menu
                  </span>
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-[#00aeef] mt-1 block">
                    AquaTrack
                  </span>
                </div>
              )}
            </div>
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as any)}
                    className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                      isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3.5 py-2.5 hover:translate-x-1"
                    } ${
                      isActive
                        ? "bg-blue-600 dark:bg-blue-600/90 text-white font-bold shadow-[0_4px_12px_rgba(37,99,235,0.25)] scale-[1.02]"
                        : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    {isActive && !isSidebarCollapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-full animate-pulse" />
                    )}
                    {isActive && isSidebarCollapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full animate-pulse" />
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
            isSidebarCollapsed ? "p-2 flex flex-col items-center gap-2" : "p-3.5 space-y-3"
          }`}>
            {/* Super Admin Status Badge */}
            {!isSidebarCollapsed ? (
              <div className="inline-flex items-center gap-1.5 bg-[#001e66]/5 dark:bg-[#00aeef]/10 text-[#001e66] dark:text-[#00aeef] text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl border border-[#001e66]/10 dark:border-[#00aeef]/20 w-full justify-center shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Super Admin Mode
              </div>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse my-1.5" title="Super Admin Mode Active" />
            )}

            {/* Profile Block */}
            <div className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl shadow-sm ${
              isSidebarCollapsed ? "p-1.5" : "p-2.5 flex items-center gap-2.5"
            }`}>
              <div 
                className="w-7 h-7 rounded-lg bg-[#00aeef] text-white flex items-center justify-center text-[11px] font-black shrink-0 uppercase select-none shadow-sm cursor-pointer"
                title={isSidebarCollapsed ? (userProfile?.name || "Administrator") : undefined}
              >
                A
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col leading-none text-left min-w-0 flex-1">
                  <span className="text-[10px] font-black text-[#001e66] dark:text-white truncate">
                    {userProfile?.name || session?.user?.email?.split("@")[0] || "Administrator"}
                  </span>
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 block">
                    System Executive
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
                    <img src="/LOGO2.png" alt="AquaTrack Logo" className="h-8 w-auto object-contain" />
                    <span className="text-base font-black tracking-tight text-[#001e66]">
                      AQUA<span className="text-[#00aeef]">TRACK</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    <X className="w-5 h-5 hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>

                {/* Drawer Nav Items */}
                <div className="flex-1 py-3 px-3">
                  {/* Admin Menu Header */}
                  <div className="px-3 mb-5 mt-2 flex items-center justify-start gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    {/* Admin Shield Icon */}
                    <div className="p-1.5 rounded-lg bg-[#00aeef]/10 dark:bg-[#00aeef]/20 border border-[#00aeef]/15 shrink-0">
                      <Shield className="w-5 h-5 text-[#00aeef]" />
                    </div>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[12px] md:text-[14px] font-black text-[#001e66] dark:text-white uppercase tracking-wider">
                        Admin Menu
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
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-1 relative ${
                            isActive
                              ? "bg-blue-600 dark:bg-blue-600/90 text-white font-bold shadow-[0_4px_12px_rgba(37,99,235,0.25)] scale-[1.02]"
                              : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-full animate-pulse" />
                          )}
                          <item.icon
                            strokeWidth={isActive ? 2.5 : 1.8}
                            className={`w-4.5 h-4.5 shrink-0 transition-all duration-300 ${
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
                <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                  {/* Super Admin Status Badge */}
                  <div className="inline-flex items-center gap-1.5 bg-[#001e66]/5 dark:bg-[#00aeef]/10 text-[#001e66] dark:text-[#00aeef] text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl border border-[#001e66]/10 dark:border-[#00aeef]/20 w-full justify-center shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Super Admin Mode
                  </div>

                  {/* Profile Block */}
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-3 shadow-sm">
                    <div className="w-9 h-9 rounded-xl bg-[#00aeef] text-white flex items-center justify-center text-xs font-black shrink-0 uppercase select-none shadow-sm">
                      A
                    </div>
                    <div className="flex flex-col leading-none text-left min-w-0 flex-1">
                      <span className="text-xs font-black text-[#001e66] dark:text-white truncate">
                        {userProfile?.name || session?.user?.email?.split("@")[0] || "Administrator"}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 block">
                        System Executive
                      </span>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content Area ──────────────────────────────────────────────── */}
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
                  advisories={advisories}
                  setActiveDetailNews={setActiveDetailNews}
                  setActiveDetailEvent={setActiveDetailEvent}
                  complaints={complaints}
                  nodes={nodes}
                  diagnosticAlerts={diagnosticAlerts}
                  crews={users.filter(u => u.role === "FIELD_ENGINEER_TECHNICIAN" && u.latitude !== null && u.longitude !== null)}
                  handleDispatchAlert={handleDispatchAlert}
                  setActiveTab={(tab) => setActiveTab(tab as any)}
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
                  previewNode={previewNode}
                  setPreviewNode={setPreviewNode}
                />
              )}

              {activeTab === "analytics" && (
                <AnalyticsSection
                  handleDownloadReport={handleDownloadReport}
                  complaints={complaints}
                />
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
                  newAdvisoryEventDate={newAdvisoryEventDate}
                  setNewAdvisoryEventDate={setNewAdvisoryEventDate}
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
                  maintenanceMode={maintenanceMode}
                  setMaintenanceMode={handleToggleMaintenanceMode}
                  handleTriggerSimulation={handleTriggerSimulation}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Reusable Footer */}
      <Footer />

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
        diagnosticAlerts={diagnosticAlerts}
        nodes={nodes}
        aiTriageStrictness={aiTriageStrictness}
        crews={users.filter(u => u.role === "FIELD_ENGINEER_TECHNICIAN" && u.latitude !== null && u.longitude !== null)}
        onDispatch={handleDispatchAlert}
      />

      {/* Telemetry Node Satellite Preview Modal */}
      {previewNode && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative text-left flex flex-col md:flex-row min-h-[420px]">
            
            {/* Close Button (Absolute overlay on the entire modal) */}
            <button
              type="button"
              onClick={() => setPreviewNode(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/95 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer border border-slate-200 focus:outline-none shadow-md z-20"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Left Pane: Map Preview Image */}
            <div className="w-full md:w-5/12 bg-slate-100 relative min-h-[220px] md:min-h-full">
              {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-s+970006(${previewNode.longitude},${previewNode.latitude})/${previewNode.longitude},${previewNode.latitude},16.5,0/450x450?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                  alt="Satellite Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xxs font-bold uppercase tracking-wider space-y-1">
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
                      ? "bg-sky-50 text-sky-700 border-sky-150"
                      : "bg-indigo-50 text-indigo-700 border-indigo-150"
                  }`}>
                    {previewNode.type === "PUMP_STATION" || previewNode.name.toLowerCase().includes("station") || previewNode.name.toLowerCase().includes("reservoir")
                      ? "Pumping Station"
                      : "Household Pipeline"}
                  </span>
                  <h3 className="text-[#001e66] text-base font-black mt-2 leading-tight pr-6">
                    {previewNode.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-1 select-all tracking-wider">
                    NODE ID: {`AQ-NODE-${previewNode.id.slice(-8).toUpperCase()}`}
                  </p>
                </div>

                {/* Location Details Grid */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-xs font-semibold">
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Barangay Area</span>
                    <span className="text-[#001e66] font-black text-sm block mt-0.5">
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
                    <span className="text-slate-400 text-[9px] uppercase tracking-wider block">GPS Coordinates</span>
                    <span className="text-[#001e66] font-mono font-bold block mt-0.5">
                      {previewNode.latitude.toFixed(5)}, {previewNode.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>

                {/* Detailed Live Readings Table */}
                <div className="border-t border-slate-100 pt-3 space-y-2.5">
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Live Diagnostic Readings</span>
                  {previewNode.reading ? (
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      {/* pH */}
                      {(() => {
                        const isAnomaly = previewNode.reading.ph < 6.5 || previewNode.reading.ph > 8.5;
                        return (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">pH level</span>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-xs font-black text-[#001e66] font-mono">{previewNode.reading.ph.toFixed(2)}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide ${
                                isAnomaly ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-emerald-50 text-emerald-600"
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
                        const isAnomaly = previewNode.reading.turbidity > 5.0;
                        return (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Turbidity</span>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-xs font-black text-[#001e66] font-mono">{previewNode.reading.turbidity.toFixed(1)} <span className="text-[8px] font-normal">NTU</span></span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide ${
                                isAnomaly ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-emerald-50 text-emerald-600"
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
                        const isAnomaly = previewNode.reading.tds > 500;
                        return (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">TDS (Minerals)</span>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-xs font-black text-[#001e66] font-mono">{previewNode.reading.tds.toFixed(0)} <span className="text-[8px] font-normal">ppm</span></span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide ${
                                isAnomaly ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-emerald-50 text-emerald-600"
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
                        const isAnomaly = previewNode.reading.pressure < 30;
                        return (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Pressure</span>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-xs font-black text-[#001e66] font-mono">{previewNode.reading.pressure.toFixed(1)} <span className="text-[8px] font-normal">PSI</span></span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide ${
                                isAnomaly ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-emerald-50 text-emerald-600"
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
                    <div className="p-3 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">No telemetry logs found for this node.</div>
                  )}
                </div>

                {/* Status footer */}
                <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Operational Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    previewNode.status === "ONLINE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    previewNode.status === "MAINTENANCE" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-rose-50 text-rose-700 border-rose-200"
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
                        className="px-5 py-2.5 bg-[#001e66] hover:bg-[#00aeef] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 animate-pulse-subtle"
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
