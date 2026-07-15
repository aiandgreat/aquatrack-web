"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch("/api/auth/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user?.id }),
          });
          const profile = await res.json();
          if (profile?.role === "ADMIN") {
            router.replace("/admin");
          } else {
            router.replace("/dashboard");
          }
        } else {
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error("Failed to check active session role:", err);
        setCheckingAuth(false);
      }
    };
    checkActiveSession();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="text-2xl font-black tracking-tight text-[#001e66]">
            AQUA<span className="text-[#ffd800]">TRACK</span>
          </span>
          <div className="relative w-10 h-10 mx-auto">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200" />
            <div className="absolute inset-0 rounded-full border-[3px] border-t-[#00aeef] animate-spin" />
          </div>
          <p className="text-slate-400 text-[11px] font-semibold tracking-widest uppercase animate-pulse">
            Checking session…
          </p>
        </div>
      </div>
    );
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError("All fields are mandatory. Please fill in all details.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasAsterisk = password.includes("*");
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasAsterisk) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, one number, and an asterisk (*).");
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }
    if (authData?.user && (!authData.user.identities || authData.user.identities.length === 0)) {
      setLoading(false);
      setError("This email address is already registered. Please sign in or use a different email.");
      return;
    }
    if (authData.user?.id) {
      try {
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: authData.user.id, email: authData.user.email, fullName, phone }),
        });
      } catch {
        console.warn("DB profile sync failed; auth account still created.");
      }
    }

    setLoading(false);
    setSuccess(true);
  };

  const handleFacebookLogin = async () => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (authError) setError(authError.message);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">

      {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
      <div className="relative w-full md:w-[42%] flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(160deg, #001e66 0%, #001e66 60%, #002580 100%)" }}>

        {/* SVG Tech Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="ln-glow-r">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="node-glow-r">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g filter="url(#ln-glow-r)" stroke="#00aeef" strokeWidth="0.8" fill="none" opacity="0.35">
            <line x1="0" y1="15%" x2="35%" y2="8%" />
            <line x1="35%" y1="8%" x2="70%" y2="20%" />
            <line x1="70%" y1="20%" x2="100%" y2="5%" />
            <line x1="20%" y1="38%" x2="55%" y2="30%" />
            <line x1="55%" y1="30%" x2="85%" y2="45%" />
            <line x1="0%" y1="55%" x2="40%" y2="50%" />
            <line x1="40%" y1="50%" x2="65%" y2="65%" />
            <line x1="65%" y1="65%" x2="100%" y2="58%" />
            <line x1="10%" y1="78%" x2="45%" y2="72%" />
            <line x1="45%" y1="72%" x2="80%" y2="85%" />
            <line x1="0%" y1="92%" x2="30%" y2="88%" />
            <line x1="35%" y1="8%" x2="20%" y2="38%" />
            <line x1="55%" y1="30%" x2="40%" y2="50%" />
            <line x1="65%" y1="65%" x2="45%" y2="72%" />
          </g>
          <g filter="url(#node-glow-r)" fill="#00aeef" opacity="0.6">
            <circle cx="35%" cy="8%" r="3" />
            <circle cx="70%" cy="20%" r="2.5" />
            <circle cx="20%" cy="38%" r="4" />
            <circle cx="55%" cy="30%" r="3" />
            <circle cx="85%" cy="45%" r="2.5" />
            <circle cx="40%" cy="50%" r="3.5" />
            <circle cx="65%" cy="65%" r="3" />
            <circle cx="45%" cy="72%" r="2.5" />
            <circle cx="80%" cy="85%" r="3" />
          </g>
          <g stroke="#00aeef" strokeWidth="0.6" fill="none" opacity="0.18">
            <polygon points="60,120 88,105 116,120 116,150 88,165 60,150" />
            <polygon points="280,480 308,465 336,480 336,510 308,525 280,510" />
            <polygon points="150,720 178,705 206,720 206,750 178,765 150,750" />
          </g>
        </svg>

        {/* Radial ambient glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,174,239,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(232,69,60,0.08) 0%, transparent 70%)" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 md:p-12 min-h-[600px] md:min-h-screen">

          <Link href="/"
            className="self-start flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors mb-10">
            ← Back to Home
          </Link>

          {/* Logo lockup */}
          <div className="flex items-center gap-4 mb-8">
            <img src="/LOGO2.png" alt="AquaTrack" className="h-14 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }} />
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-white leading-none">
                AQUA<span className="text-[#ffd800]">TRACK</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#00aeef] mt-1.5">
                City of San Fernando Water District
              </p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-white leading-snug tracking-tight">
              Executive Operations<br />Control Center
            </h2>
            <p className="text-sm text-white/45 mt-3 leading-relaxed max-w-sm font-medium">
              Join the AquaTrack platform to file water service concerns, track complaint status, and receive real-time advisories from your water district.
            </p>
          </div>

          {/* Glassmorphic stat badges */}
          <div className="grid grid-cols-2 gap-3 mb-auto">
            {[
              { icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                ), label: "35+ Areas", sub: "Barangay Coverage" },
              { icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ), label: "24/7 Active", sub: "Live Monitoring" },
              { icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ), label: "AI Triage", sub: "Smart Classification" },
              { icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                ), label: "Live Data", sub: "IoT Telemetry" },
            ].map((badge) => (
              <div key={badge.label}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                }}>
                <div className="text-[#00aeef] flex-shrink-0">{badge.icon}</div>
                <div>
                  <p className="text-white font-black text-sm leading-none">{badge.label}</p>
                  <p className="text-white/35 text-[10px] font-semibold mt-0.5">{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer metadata */}
          <div className="mt-10 pt-5 border-t border-white/[0.08] flex justify-between items-end">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/25 font-bold">CSFWD Headquarters</p>
              <p className="text-xs text-white/40 font-semibold mt-0.5">City of San Fernando, Pampanga</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] text-white/25">LAT 15.0286 · LNG 120.6942</p>
              <p className="text-[10px] text-white/35 font-bold mt-0.5">(045) 961-3546</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
      <div className="relative w-full md:w-[58%] flex items-center justify-center p-8 md:p-12 overflow-hidden bg-white">

        {/* Water droplet watermark */}
        <svg
          className="absolute bottom-0 right-0 pointer-events-none select-none"
          style={{ width: 480, height: 480, opacity: 0.045, transform: "translate(20%, 20%)" }}
          viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 10 C100 10 20 95 20 140 C20 182 56 210 100 210 C144 210 180 182 180 140 C180 95 100 10 100 10Z"
            fill="#001e66" />
          <ellipse cx="78" cy="110" rx="12" ry="22" fill="white" opacity="0.15" transform="rotate(-30 78 110)" />
        </svg>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md">

          {/* Header */}
          <div className="mb-7">
            <h2 className="text-3xl font-black text-[#001e66] tracking-tight">Create Account</h2>
            <p className="text-sm text-slate-400 font-medium mt-1.5">
              Register to access the AquaTrack resident portal
            </p>
          </div>

          {/* Success State */}
          {success ? (
            <div className="bg-white rounded-3xl p-8 md:p-10 text-center space-y-5"
              style={{ boxShadow: "0 2px 4px rgba(0,30,102,0.04), 0 12px 40px rgba(0,30,102,0.10)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(16,185,129,0.1)" }}>
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-[#001e66]">Registration Submitted!</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  A verification email has been sent to{" "}
                  <span className="font-black text-[#001e66]">{email}</span>.{" "}
                  Please verify your address to activate your account.
                </p>
              </div>
              <Link href="/login"
                className="inline-block text-white font-black py-3 px-8 rounded-xl text-[11px] uppercase tracking-widest transition-all cursor-pointer"
                style={{ background: "linear-gradient(135deg, #001e66 0%, #002a8a 100%)", boxShadow: "0 4px 20px rgba(0,30,102,0.25)" }}>
                Back to Login
              </Link>
            </div>
          ) : (

            /* Registration Card */
            <div className="bg-white rounded-3xl p-8 md:p-10"
              style={{ boxShadow: "0 2px 4px rgba(0,30,102,0.04), 0 12px 40px rgba(0,30,102,0.10), 0 40px 80px rgba(0,30,102,0.06)" }}>
              <form onSubmit={handleRegister} className="space-y-4">

                {/* Error banner */}
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="register-fullname" className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Full Name
                  </label>
                  <input
                    id="register-fullname" type="text" autoComplete="name" required
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan dela Cruz"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-[#001e66] font-semibold text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/25 focus:border-[#00aeef] transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="register-email" className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Email Address
                  </label>
                  <input
                    id="register-email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@csfwd.gov.ph"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-[#001e66] font-semibold text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/25 focus:border-[#00aeef] transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label htmlFor="register-phone" className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Phone Number
                  </label>
                  <input
                    id="register-phone" type="tel" autoComplete="tel" required
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="09XX-XXX-XXXX"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-[#001e66] font-semibold text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/25 focus:border-[#00aeef] transition-all"
                  />
                </div>

                {/* Password row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="register-password" className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="register-password" type={showPassword ? "text" : "password"}
                        autoComplete="new-password" required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 chars"
                        className="w-full px-4 py-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-[#001e66] font-semibold text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/25 focus:border-[#00aeef] transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          {showPassword
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                          }
                        </svg>
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-300 font-semibold leading-tight">
                      Uppercase, lowercase, number & *
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="register-confirm-password" className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Confirm
                    </label>
                    <div className="relative">
                      <input
                        id="register-confirm-password" type={showConfirm ? "text" : "password"}
                        autoComplete="new-password" required
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter"
                        className="w-full px-4 py-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-[#001e66] font-semibold text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/25 focus:border-[#00aeef] transition-all"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          {showConfirm
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                          }
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  id="register-submit" type="submit" disabled={loading}
                  className="w-full text-white font-black py-4 rounded-xl transition-all duration-200 text-[11px] uppercase tracking-[0.15em] mt-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #001e66 0%, #002a8a 100%)",
                    boxShadow: "0 4px 20px rgba(0,30,102,0.30), 0 1px 3px rgba(0,30,102,0.15)",
                  }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating Account…
                    </span>
                  ) : "Create Account"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-0.5">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest whitespace-nowrap">
                    Or sign up with
                  </span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Social login row */}
                <div className="flex gap-3">
                  <button id="register-facebook" type="button" onClick={handleFacebookLogin}
                    className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold py-3 rounded-xl transition-all text-xs cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                    </svg>
                    Continue with Facebook
                  </button>
                </div>

                {/* Sign in link */}
                <p className="text-center text-xs text-slate-400 pt-0.5">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#00aeef] hover:text-[#0090c8] font-black transition-colors">
                    Sign in here
                  </Link>
                </p>
              </form>
            </div>
          )}

          {/* Support footer */}
          <p className="text-center text-[11px] text-slate-300 mt-5">
            Technical access issues? Contact CSFWD IT Division at{" "}
            <span className="text-slate-400 font-semibold">(045) 961-3546</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
