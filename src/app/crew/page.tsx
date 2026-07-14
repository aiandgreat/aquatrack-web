"use client";

import React, { useState, useEffect } from "react";
import { getSupabaseClient } from "../../lib/supabase";

interface WorkOrder {
  id: string;
  status: "ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
  location: string;
  diagnosticDetails: string;
  actionPrompt: string;
  imageUrl?: string;
}

const statusConfig = {
  ASSIGNED: {
    label: "Assigned",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-[#00aeef]",
    border: "border-blue-200",
    dot: "bg-[#00aeef]",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export default function FieldCrewPortal() {
  const [isDark, setIsDark] = useState(false);
  const [currentJob, setCurrentJob] = useState<WorkOrder>({
    id: "job-101",
    status: "ASSIGNED",
    location: "Main Street Valve #45",
    diagnosticDetails:
      "Pressure drop reported nearby. Suspected line breach at section B-12. Multiple consumer complaints received in surrounding barangay.",
    actionPrompt:
      "Verify pressure gauges, inspect gaskets on section B-12, document all findings with photos before proceeding with repairs.",
    imageUrl:
      "https://images.unsplash.com/photo-1584267385494-9fdf97b090f5?auto=format&fit=crop&w=600&q=80",
  });
  const [confirming, setConfirming] = useState<"start" | "resolve" | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [advisories, setAdvisories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/advisories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAdvisories(data.advisories);
        }
      })
      .catch((err) => console.error("Failed to load crew advisories:", err));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const initialDark =
      root.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    setIsDark(initialDark);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const getSession = async () => {
      const client = getSupabaseClient();
      const {
        data: { session },
      } = await client.auth.getSession();
      setSessionEmail(session?.user?.email || null);
    };
    getSession();
  }, []);

  const handleUpdateStatus = (newStatus: "IN_PROGRESS" | "RESOLVED") => {
    setCurrentJob((prev) => ({ ...prev, status: newStatus }));
    setConfirming(null);
  };

  const handleLogout = async () => {
    const client = getSupabaseClient();
    await client.auth.signOut();
    window.location.href = "/login";
  };

  const statusCfg = statusConfig[currentJob.status];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#001e66] font-sans flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src="/LOGO2.png" alt="AquaTrack Logo" className="h-10 w-auto object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold text-[#001e66] tracking-tight">
              Aqua<span className="text-[#00aeef]">Track</span>
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
              Field Crew Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Staff info */}
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 bg-[#00aeef] text-white text-[10px] font-bold rounded-lg flex items-center justify-center">
              FT
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold text-[#001e66]">Field Technician</span>
              <span className="text-[9px] text-slate-400 mt-0.5 font-mono">{sessionEmail || "tech@csfwd.gov.ph"}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="h-9 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-[#970006] text-xs font-semibold transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-5">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-[#001e66]">My Work Order</h1>
          <p className="text-sm text-slate-500 mt-0.5">Active field assignment for today</p>
        </div>

        {/* Work Order Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Card Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#001e66]/5 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#001e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Work Order</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{currentJob.id}</p>
              </div>
            </div>
            {/* Status Chip */}
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${currentJob.status === "IN_PROGRESS" ? "animate-pulse" : ""}`} />
              {statusCfg.label}
            </span>
          </div>

          {/* Location */}
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Location</p>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00aeef] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-semibold text-[#001e66]">{currentJob.location}</span>
            </div>
          </div>

          {/* Incident Photo */}
          {currentJob.imageUrl && (
            <div className="px-6 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Incident Photo</p>
              <a href={currentJob.imageUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-slate-100 hover:opacity-90 transition-opacity">
                <img src={currentJob.imageUrl} alt="Incident" className="w-full h-44 object-cover" />
              </a>
            </div>
          )}

          {/* Diagnostic Details */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Diagnostic Details</p>
            <p className="text-sm text-slate-600 leading-relaxed">{currentJob.diagnosticDetails}</p>
          </div>

          {/* Recommended Instructions */}
          <div className="mx-6 mb-4 bg-[#001e66]/3 border border-[#001e66]/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-[#00aeef]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#001e66]">Recommended Instructions</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">"{currentJob.actionPrompt}"</p>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-5 flex gap-3">
            {currentJob.status === "ASSIGNED" && (
              confirming === "start" ? (
                <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-2">
                  <p className="text-xs font-semibold text-amber-700">Confirm starting this job?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleUpdateStatus("IN_PROGRESS")}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      Yes, Start
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-all hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming("start")}
                  className="flex-1 bg-[#001e66] hover:bg-[#00aeef] text-white font-semibold py-3 rounded-xl text-sm transition-all"
                >
                  Start Job
                </button>
              )
            )}
            {currentJob.status === "IN_PROGRESS" && (
              confirming === "resolve" ? (
                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-2">
                  <p className="text-xs font-semibold text-emerald-700">Mark this job as resolved?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleUpdateStatus("RESOLVED")}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      Yes, Resolve
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-all hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming("resolve")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm transition-all"
                >
                  Mark as Resolved
                </button>
              )
            )}
            {currentJob.status === "RESOLVED" && (
              <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl py-3">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-emerald-700">Job Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Staff & Broadcast Bulletins Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
            <svg className="w-4 h-4 text-[#00aeef] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Staff &amp; Broadcast Bulletins
            </h3>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {advisories
              .filter(ad => !ad.targetRole || ad.targetRole === "broadcast" || ad.targetRole === "technicians")
              .map((ad) => (
                <div key={ad.id} className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-400 font-bold">{ad.date}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                      ad.type === "warning"
                        ? "bg-red-50 text-red-600 border-red-200"
                        : "bg-blue-50 text-blue-600 border-blue-200"
                    }`}>
                      {ad.type}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-xs mt-1">{ad.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{ad.text}</p>
                </div>
              ))}
            {advisories.filter(ad => !ad.targetRole || ad.targetRole === "broadcast" || ad.targetRole === "technicians").length === 0 && (
              <p className="text-slate-400 italic text-xs text-center py-2">No bulletins broadcasted.</p>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-slate-400 font-medium pb-4">
          For emergencies contact CSFWD Operations: <span className="font-semibold text-slate-500">(045) 961-3546</span>
        </p>
      </main>
    </div>
  );
}
