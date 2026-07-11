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
      <div className="min-h-screen bg-[#EEF4FA] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#00aeef] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#001e66] font-black text-sm tracking-wider uppercase">
            Loading Operations Command...
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
