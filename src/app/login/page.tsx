"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Sync theme preference on component mount
  useEffect(() => {
    const root = window.document.documentElement;
    const initialDark = root.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    setIsDark(initialDark);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      try {
        const res = await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authData.user?.id }),
        });
        const profile = await res.json();

        if (profile?.role === "ADMIN") {
          router.push("/admin");
        } else if (profile?.role === "FIELD_ENGINEER_TECHNICIAN") {
          router.push("/dashboard");
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to check user role:", err);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFacebookLogin = async () => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (authError) {
      setError(authError.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      {/* Top Brand Ribbon */}
      <div className="flex h-1.5 shrink-0" aria-hidden="true">
        <span className="flex-1 bg-[#001e66]" />
        <span className="flex-1 bg-[#00aeef]" />
        <span className="flex-1 bg-[#970006]" />
      </div>

      {/* Floating Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
      >
        BACK TO HOME
      </Link>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Side: Water District Basic Info Card */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-[#001e66] via-[#052e85] to-[#00aeef] text-white flex flex-col justify-between p-8 md:p-16 relative overflow-hidden">
          {/* Background Decorative Rings */}
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-800/10 rounded-full blur-2xl pointer-events-none" />

          {/* District Header & Logo */}
          <div className="relative z-10 space-y-4">
            <Link href="/" className="inline-block">
              <img 
                src="/LOGO2.png" 
                alt="AquaTrack Logo" 
                className="h-16 w-auto object-contain bg-white/10 p-2.5 rounded-2xl shadow-sm backdrop-blur-md" 
              />
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                AQUA<span className="text-[#ffd800]">TRACK</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#ffd800] mt-0.5">
                City of San Fernando Water District
              </p>
            </div>
          </div>

          {/* Info Details */}
          <div className="relative z-10 my-10 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase bg-white/10 px-3 py-1 rounded-full tracking-wider border border-white/10">
                Administrative Command Portal
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white pt-2">
                Executive Operations Control Center
              </h2>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed max-w-md font-medium">
              The AquaTrack command system centralizes smart municipal water supply monitoring. 
              Staff can configure IoT telemetry nodes, coordinate field maintenance schedules, 
              and review AI-triaged resident reports inside a unified global administration interface.
            </p>

            {/* Fast Stats Highlight Grid */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/15 max-w-sm">
              <div>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Active Coverage</p>
                <p className="text-xl font-black text-[#ffd800]">35+ Barangays</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">System Health</p>
                <p className="text-xl font-black text-[#ffd800]">24/7 Monitoring</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Triage Pipeline</p>
                <p className="text-xl font-black text-[#ffd800]">AI Classified</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">IoT Hardware</p>
                <p className="text-xl font-black text-[#ffd800]">Live Telemetry</p>
              </div>
            </div>
          </div>

          {/* Bottom Coordinates & Hotline Metadata */}
          <div className="relative z-10 pt-4 border-t border-white/15 text-[10px] font-bold text-slate-300 flex justify-between items-center gap-4 flex-wrap">
            <div>
              <p className="uppercase tracking-wide text-slate-200">CSFWD HEADQUARTERS</p>
              <p className="text-xs text-slate-400 font-medium font-bold mt-0.5">City of San Fernando, Pampanga</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-slate-200">LAT: 15.0286 | LNG: 120.6942</p>
              <p className="text-xs text-slate-400 font-medium font-bold mt-0.5">Operations Hotline: (045) 961-3546</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <div className="w-full max-w-md space-y-6">
            
            {/* Form Title */}
            <div>
              <h2 className="text-2xl font-black text-[#001e66] dark:text-slate-100 tracking-tight">
                Staff Authentication
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
                Enter your administrative credentials to log in
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm shadow-blue-100 dark:shadow-none space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Error Banner */}
                {error && (
                  <div className="flex items-start space-x-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-bold">{error}</span>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@csfwd.gov.ph"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-[#001e66] dark:text-slate-100 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-[#001e66] dark:text-slate-100 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                  />
                </div>

                {/* Submit Button */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#001e66] hover:bg-[#00aeef] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-xs uppercase tracking-wider mt-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Signing In…</span>
                    </span>
                  ) : (
                    "Sign In to AquaTrack"
                  )}
                </button>

                {/* OAuth Divider */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider">or continue with</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                {/* OAuth Login */}
                <button
                  id="login-facebook"
                  type="button"
                  onClick={handleFacebookLogin}
                  className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-extrabold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-xs uppercase tracking-wider cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                  </svg>
                  Continue with Facebook
                </button>

                {/* Redirect Link */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 font-bold">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-[#00aeef] hover:underline font-extrabold">
                    Register here
                  </Link>
                </p>

              </form>
            </div>

            {/* Note */}
            <p className="text-center text-xxs text-slate-400 dark:text-slate-500">
              For technical access issues, please contact CSFWD IT Division at{" "}
              <span className="text-slate-500 dark:text-slate-350 font-bold">(045) 961-3546</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
