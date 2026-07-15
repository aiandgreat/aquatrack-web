"use client";

import React, { useState, useEffect } from "react";
import { getSupabaseClient } from "../../lib/supabase";
import DashboardClient from "./DashboardClient";
import DashboardSubAdmin from "./DashboardSubAdmin";

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

interface DashboardWrapperProps {
  initialUsers: User[];
  initialNodes: TelemetryNode[];
  initialComplaints: Complaint[];
  initialReadings: Record<string, any[]>;
  initialStats: DashboardStats;
}

export default function DashboardWrapper({
  initialUsers,
  initialNodes,
  initialComplaints,
  initialReadings,
  initialStats,
}: DashboardWrapperProps) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineRole = async () => {
      try {
        const client = getSupabaseClient();
        const { data: { session } } = await client.auth.getSession();
        if (!session) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const profile = await res.json();
        setRole(profile?.role || "CONSUMER_RESIDENT");
      } catch (err) {
        console.error("Failed to determine user role:", err);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };
    determineRole();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-[#001e66] z-50" aria-hidden="true" />
        <div className="text-center space-y-5">
          {/* Logo lockup */}
          <div className="flex items-center justify-center space-x-3 mb-2">
            <img src="/LOGO2.png" alt="AquaTrack" className="h-10 w-auto object-contain" />
            <span className="text-xl font-black tracking-tight text-[#001e66]">
              AQUA<span className="text-[#00aeef]">TRACK</span>
            </span>
          </div>
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200" />
            <div className="absolute inset-0 rounded-full border-[3px] border-t-[#00aeef] animate-spin" />
          </div>
          <p className="text-slate-400 text-[11px] font-semibold tracking-widest uppercase animate-pulse">
            Loading Operations Command…
          </p>
        </div>
      </div>
    );
  }

  if (role === "FIELD_ENGINEER_TECHNICIAN") {
    return (
      <DashboardSubAdmin
        initialUsers={initialUsers}
        initialNodes={initialNodes}
        initialComplaints={initialComplaints}
        initialReadings={initialReadings}
        initialStats={initialStats}
      />
    );
  }

  return (
    <DashboardClient
      initialNodes={initialNodes}
      initialComplaints={initialComplaints}
      initialReadings={initialReadings}
    />
  );
}
