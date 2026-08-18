"use client";

import React, { useState, useEffect } from "react";
import { getSupabaseClient } from "../../lib/supabase";
import { 
  Sun, 
  Moon, 
  FileText, 
  MapPin, 
  Lightbulb, 
  CheckCircle2, 
  Megaphone,
  LogOut
} from "lucide-react";

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
    bg: "bg-amber-50 dark:bg-amber-950/15",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-900/30",
    dot: "bg-amber-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50 dark:bg-sky-950/15",
    text: "text-[#00aeef] dark:text-sky-400",
    border: "border-blue-200 dark:border-sky-900/30",
    dot: "bg-[#00aeef]",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-50 dark:bg-emerald-950/15",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-900/30",
    dot: "bg-emerald-500",
  },
};

export default function FieldCrewPortal() {
  const [isDark, setIsDark] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
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
    setThemeLoaded(true);
  }, []);

  useEffect(() => {
    if (!themeLoaded) return;
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark, themeLoaded]);

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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070b15] text-[#001e66] dark:text-[#F8FAFC] font-sans flex flex-col transition-colors duration-300">

      {/* Header */}
      <header className="bg-white dark:bg-[#07142F] border-b border-slate-100 dark:border-white/10 sticky top-0 z-50 h-16 flex items-center justify-between px-6 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <img src={isDark ? "/LOGO3.png" : "/LOGO2.png"} alt="AquaTrack Logo" className="h-10 w-auto object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold text-[#001e66] dark:text-white tracking-tight">
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
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all cursor-pointer focus:outline-none"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#00aeef]" />
            ) : (
              <Moon className="w-4 h-4 text-[#001e66]" />
            )}
          </button>

          {/* Staff info */}
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 bg-[#00aeef] text-white text-[10px] font-bold rounded-lg flex items-center justify-center">
              FT
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold text-[#001e66] dark:text-slate-200">Field Technician</span>
              <span className="text-[9px] text-slate-400 mt-0.5 font-mono">{sessionEmail || "tech@csfwd.gov.ph"}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="h-9 px-4 rounded-xl border border-red-200 dark:border-red-950/40 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-[#970006] dark:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer focus:outline-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-5">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-[#001e66] dark:text-white">My Work Order</h1>
          <p className="text-sm text-slate-500 mt-0.5">Active field assignment for today</p>
        </div>

        {/* Work Order Card */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">

          {/* Card Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#001e66]/5 dark:bg-[#00aeef]/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#001e66] dark:text-[#00aeef]" />
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
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Location</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00aeef] flex-shrink-0" />
              <span className="text-sm font-semibold text-[#001e66] dark:text-slate-200">{currentJob.location}</span>
            </div>
          </div>

          {/* Incident Photo */}
          {currentJob.imageUrl && (
            <div className="px-6 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Incident Photo</p>
              <a href={currentJob.imageUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-slate-100 dark:border-white/5 hover:opacity-90 transition-opacity">
                <img src={currentJob.imageUrl} alt="Incident" className="w-full h-44 object-cover" />
              </a>
            </div>
          )}

          {/* Diagnostic Details */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Diagnostic Details</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{currentJob.diagnosticDetails}</p>
          </div>

          {/* Recommended Instructions */}
          <div className="mx-6 mb-4 bg-[#001e66]/3 dark:bg-white/5 border border-[#001e66]/10 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#00aeef]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#001e66] dark:text-slate-300">Recommended Instructions</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">"{currentJob.actionPrompt}"</p>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-5 flex gap-3">
            {currentJob.status === "ASSIGNED" && (
              confirming === "start" ? (
                <div className="flex-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3 text-center space-y-2">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-450">Confirm starting this job?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleUpdateStatus("IN_PROGRESS")}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 focus:outline-none"
                    >
                      Yes, Start
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer focus:outline-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming("start")}
                  className="flex-1 bg-[#001e66] hover:bg-[#00aeef] text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer focus:outline-none"
                >
                  Start Job
                </button>
              )
            )}
            {currentJob.status === "IN_PROGRESS" && (
              confirming === "resolve" ? (
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-3 text-center space-y-2">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-450">Mark this job as resolved?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleUpdateStatus("RESOLVED")}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 focus:outline-none"
                    >
                      Yes, Resolve
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer focus:outline-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming("resolve")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer focus:outline-none"
                >
                  Mark as Resolved
                </button>
              )
            )}
            {currentJob.status === "RESOLVED" && (
              <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/30 rounded-xl py-3 shadow-inner">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-455" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Job Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Staff & Broadcast Bulletins Card */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-white/5 pb-3 flex items-center space-x-2">
            <Megaphone className="w-4 h-4 text-[#00aeef] shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Staff &amp; Broadcast Bulletins
            </h3>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
            {advisories
              .filter(ad => !ad.targetRole || ad.targetRole === "broadcast" || ad.targetRole === "technicians")
              .map((ad) => (
                <div key={ad.id} className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 font-bold">{ad.date}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                      ad.type === "warning"
                        ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30"
                        : "bg-blue-50 dark:bg-sky-950/20 text-blue-600 dark:text-[#00aeef] border-blue-200 dark:border-sky-900/30"
                    }`}>
                      {ad.type}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-xs mt-1">{ad.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{ad.text}</p>
                </div>
              ))}
            {advisories.filter(ad => !ad.targetRole || ad.targetRole === "broadcast" || ad.targetRole === "technicians").length === 0 && (
              <p className="text-slate-400 italic text-xs text-center py-2">No bulletins broadcasted.</p>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-slate-400 font-medium pb-4">
          For emergencies contact CSFWD Operations: <span className="font-semibold text-slate-500 dark:text-slate-350">(045) 961-3546</span>
        </p>
      </main>
    </div>
  );
}
