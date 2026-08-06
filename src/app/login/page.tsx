"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  LogIn, 
  Loader2,
  AlertTriangle 
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch("/api/auth/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      try {
        const res = await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ userId: authData.user?.id }),
        });
        const profile = await res.json();
        if (profile?.role === "ADMIN") {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("Failed to check user role:", err);
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFacebookLogin = async () => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (authError) setError(authError.message);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="text-2xl font-black tracking-tight text-[#001e66] font-sans">
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans relative">

      {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
      <div className="relative w-full md:w-[42%] flex flex-col overflow-hidden bg-slate-950">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/csfwdplace.jpg')" }}
        />
        {/* Dark Blue Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(160deg, rgba(0, 30, 102, 0.90) 0%, rgba(0, 30, 102, 0.85) 60%, rgba(0, 37, 128, 0.90) 100%)" }}
        />

        {/* SVG Tech Overlay — water network lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="ln-glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="node-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Network lines */}
          <g filter="url(#ln-glow)" stroke="#00aeef" strokeWidth="0.8" fill="none" opacity="0.35">
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
            {/* Cross connectors */}
            <line x1="35%" y1="8%" x2="20%" y2="38%" />
            <line x1="55%" y1="30%" x2="40%" y2="50%" />
            <line x1="65%" y1="65%" x2="45%" y2="72%" />
          </g>
          {/* Network nodes */}
          <g filter="url(#node-glow)" fill="#00aeef" opacity="0.6">
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
          {/* Molecular hexagons */}
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

        {/* Content - Cleaned of info texts and badges, keeping improved back button */}
        <div className="relative z-10 flex flex-col h-full p-10 md:p-12 min-h-[140px] md:min-h-screen">
          {/* Improved Back Button */}
          <Link href="/" className="self-start flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-wider text-white hover:bg-white/15 hover:border-white/20 transition-all shadow-sm active:scale-95 group">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* ── MASSIVE BRAND TEXT DIVISION ─────────────────────────────── */}
      <div className="absolute top-1/2 left-[42%] -translate-y-1/2 z-20 pointer-events-none hidden md:flex select-none leading-none items-center font-sans font-black text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] xl:text-[8rem] uppercase tracking-[0.02em] opacity-95">
        {/* AQUA (Aligned to the left of the seam) */}
        <div className="absolute right-0 pr-1.5 text-right whitespace-nowrap">
          <span className="text-white">AQ</span>
          <span className="text-[#ffd800]">U</span>
          <span className="text-[#970006]">A</span>
        </div>
        {/* TRACK (Aligned to the right of the seam) */}
        <div className="absolute left-0 pl-1.5 text-left whitespace-nowrap">
          <span 
            className="text-transparent"
            style={{
              backgroundImage: isDark 
                ? "linear-gradient(160deg, #ffffff 0%, #f1f5f9 100%)"
                : "linear-gradient(160deg, #001e66 0%, #002a8a 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            TRACK
          </span>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
      <div className="relative w-full md:w-[58%] flex items-center justify-center p-8 md:p-16 overflow-hidden bg-white dark:bg-[#090d16] transition-colors">

        {/* Water droplet watermark */}
        <svg
          className="opacity-20 dark:opacity-30 absolute bottom-0 right-0 pointer-events-none select-none"
          style={{ width: 480, height: 480, transform: "translate(20%, 20%)" }}
          viewBox="0 0 200 220" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="droplet-shape">
              <path d="M100 10 C100 10 20 95 20 140 C20 182 56 210 100 210 C144 210 180 182 180 140 C180 95 100 10 100 10Z" />
            </clipPath>
            <linearGradient id="light-overlay" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#001e66" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#002a8a" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="dark-overlay" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#020617" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#001e66" stopOpacity="0.65" />
            </linearGradient>
          </defs>
          <g clipPath="url(#droplet-shape)">
            <image 
              href="/csfwdplace.jpg" 
              x="0" 
              y="0" 
              width="200" 
              height="220" 
              preserveAspectRatio="xMidYMid slice" 
            />
            <rect 
              width="200" 
              height="220" 
              fill={isDark ? "url(#dark-overlay)" : "url(#light-overlay)"} 
            />
          </g>
          <ellipse 
            cx="78" 
            cy="110" 
            rx="12" 
            ry="22" 
            fill="white" 
            opacity={isDark ? "0.06" : "0.15"} 
            transform="rotate(-30 78 110)" 
          />
        </svg>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative z-30">

          {/* Header */}
          <div className="mb-8 text-left">
            <h2 className="text-3xl font-black text-[#001e66] dark:text-white tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-1.5">
              Sign in to access the operations command center
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl p-8 md:p-10 border border-slate-100 dark:border-slate-800/80"
            style={{ boxShadow: "0 2px 4px rgba(0,30,102,0.02), 0 12px 40px rgba(0,30,102,0.06), 0 40px 80px rgba(0,30,102,0.04)" }}>
            <form onSubmit={handleLogin} className="space-y-5">

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-650 rounded-xl px-4 py-3 text-sm text-left">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-500" />
                  <span className="font-bold text-red-700 dark:text-red-400">{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="login-email" className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@csfwd.gov.ph"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-[#001e66] dark:text-white font-semibold text-sm placeholder:text-slate-350 dark:placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/25 focus:border-[#00aeef] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="login-password" className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-[#001e66] dark:text-white font-semibold text-sm placeholder:text-slate-350 dark:placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/25 focus:border-[#00aeef] transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* CTA */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full text-white font-black py-4 rounded-xl transition-all duration-205 text-[11px] uppercase tracking-[0.15em] mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: loading ? "#001e66" : "linear-gradient(135deg, #001e66 0%, #002a8a 100%)",
                  boxShadow: "0 4px 20px rgba(0,30,102,0.30), 0 1px 3px rgba(0,30,102,0.15)",
                }}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Signing In…
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In to AquaTrack
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <span className="text-[10px] text-slate-300 dark:text-slate-500 font-black uppercase tracking-widest whitespace-nowrap">
                  Or continue with
                </span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>

              {/* Social login row */}
              <div className="flex gap-3">
                <button id="login-facebook" type="button" onClick={handleFacebookLogin}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer active:scale-[0.99] group">
                  <svg className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                  </svg>
                  Continue with Facebook
                </button>
              </div>

              {/* Register link */}
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-1">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-[#00aeef] hover:text-[#0090c8] font-black transition-colors">
                  Register here
                </Link>
              </p>
            </form>
          </div>

          {/* Support footer */}
          <p className="text-center text-[11px] text-slate-350 dark:text-slate-500 mt-6">
            Technical access issues? Contact CSFWD IT Division at{" "}
            <span className="text-slate-450 dark:text-slate-400 font-semibold">(045) 961-3546</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
