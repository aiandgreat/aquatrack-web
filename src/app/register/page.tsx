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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Sync theme preference and check active session on component mount
  useEffect(() => {
    const root = window.document.documentElement;
    const initialDark = root.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    setIsDark(initialDark);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">

        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#00aeef] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#001e66] dark:text-slate-200 font-black text-sm tracking-wider uppercase">
              Checking session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Ensure all fields are filled
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

    // Password strength requirements (uppercase, lowercase, number, asterisk)
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
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    // Check if the user already exists in Supabase (prevented enumeration returns success with empty identities)
    if (authData?.user && (!authData.user.identities || authData.user.identities.length === 0)) {
      setLoading(false);
      setError("This email address is already registered. Please sign in or use a different email.");
      return;
    }

    // Sync the new user profile into the app database immediately.
    if (authData.user?.id) {
      try {
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: authData.user.id,
            email: authData.user.email,
            fullName,
            phone,
          }),
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
        <div className="w-full md:w-[40%] bg-gradient-to-br from-[#001e66] via-[#052e85] to-[#00aeef] text-white flex flex-col justify-between p-10 md:p-14 relative overflow-hidden">
          {/* Background Decorative Rings */}
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-800/10 rounded-full blur-2xl pointer-events-none" />

          {/* Group Header and Details together to control spacing */}
          <div className="relative z-10 flex flex-col space-y-5 pt-12 md:pt-20">
            {/* District Header & Logo */}
            <div className="flex items-center space-x-5">
              <Link href="/">
                <img 
                  src="/LOGO2.png" 
                  alt="AquaTrack Logo" 
                  className="h-22 w-auto object-contain" 
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </Link>
              <div className="flex flex-col justify-center">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">
                  AQUA<span className="text-[#ffd800]">TRACK</span>
                </h1>
                <p className="text-xs lg:text-sm font-black uppercase tracking-wider text-[#ffd800] mt-1.5 leading-snug">
                  City of San Fernando Water District
                </p>
              </div>
            </div>

            {/* Info Details */}
            <div className="space-y-6 pt-2">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Executive Operations Control Center
              </h2>
              <p className="text-base lg:text-lg text-slate-100 leading-relaxed max-w-md font-medium">
                The AquaTrack command system centralizes smart municipal water supply monitoring. 
                Staff can configure IoT telemetry nodes, coordinate field maintenance schedules, 
                and review AI-triaged resident reports inside a unified global administration interface.
              </p>

              {/* Fast Stats Highlight Grid */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/15 max-w-sm">
                <div>
                  <p className="text-xs lg:text-sm font-bold text-slate-200 uppercase tracking-wider">Active Coverage</p>
                  <p className="text-2xl lg:text-3xl font-extrabold text-[#ffd800] mt-1">35+ Barangays</p>
                </div>
                <div>
                  <p className="text-xs lg:text-sm font-bold text-slate-200 uppercase tracking-wider">System Health</p>
                  <p className="text-2xl lg:text-3xl font-extrabold text-[#ffd800] mt-1">24/7 Monitoring</p>
                </div>
                <div>
                  <p className="text-xs lg:text-sm font-bold text-slate-200 uppercase tracking-wider">Triage Pipeline</p>
                  <p className="text-2xl lg:text-3xl font-extrabold text-[#ffd800] mt-1">AI Classified</p>
                </div>
                <div>
                  <p className="text-xs lg:text-sm font-bold text-slate-200 uppercase tracking-wider">IoT Hardware</p>
                  <p className="text-2xl lg:text-3xl font-extrabold text-[#ffd800] mt-1">Live Telemetry</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Coordinates & Hotline Metadata */}
          <div className="relative z-10 pt-4 border-t border-white/15 text-xs font-semibold text-slate-200 flex justify-between items-center gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-100 font-bold">CSFWD HEADQUARTERS</p>
              <p className="text-sm text-slate-200 font-bold mt-0.5">City of San Fernando, Pampanga</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-slate-100">LAT: 15.0286 | LNG: 120.6942</p>
              <p className="text-sm text-slate-200 font-bold mt-0.5">Operations Hotline: (045) 961-3546</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md space-y-5"
          >
            
            {/* Form Title */}
            <div>
              <h2 className="text-2xl font-black text-[#001e66] dark:text-slate-100 tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
                Register to gain entry access to the dashboard
              </p>
            </div>

            {/* Success view or Form card */}
            {success ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-blue-100 dark:shadow-none text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#001e66] dark:text-slate-200">Registration Submitted!</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-bold">
                    A verification email has been sent to <span className="font-black text-[#001e66] dark:text-[#00aeef]">{email}</span>. Please verify your address to activate your account.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-block bg-[#0B2E7A] hover:bg-[#08225c] text-white font-extrabold py-3 px-8 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-blue-100 dark:shadow-none space-y-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  
                  {/* Error Alert */}
                  {error && (
                    <div className="flex items-start space-x-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-bold">{error}</span>
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="register-fullname" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Full Name
                    </label>
                    <input
                      id="register-fullname"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Juan dela Cruz"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-[#001e66] dark:text-slate-100 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="register-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Email Address
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@csfwd.gov.ph"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-[#001e66] dark:text-slate-100 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="register-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Phone Number
                    </label>
                    <input
                      id="register-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09XX-XXX-XXXX"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-[#001e66] dark:text-slate-100 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                    />
                  </div>

                  {/* Password Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="register-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Password
                      </label>
                      <input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 chars"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-[#001e66] dark:text-slate-100 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                      />
                      <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">
                        Must contain uppercase, lowercase, number, and *
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="register-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Confirm
                      </label>
                      <input
                        id="register-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-[#001e66] dark:text-slate-100 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="register-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0B2E7A] hover:bg-[#08225c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-xs uppercase tracking-wider mt-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Creating Account…</span>
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </button>

                  {/* OAuth Divider */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider">or sign up with</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>

                  {/* OAuth */}
                  <button
                    id="register-facebook"
                    type="button"
                    onClick={handleFacebookLogin}
                    className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-extrabold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                    </svg>
                    Continue with Facebook
                  </button>

                  {/* Redirect */}
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 font-bold">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#00aeef] hover:underline font-extrabold">
                      Sign in here
                    </Link>
                  </p>

                </form>
              </div>
            )}

            {/* Note */}
            <p className="text-center text-xxs text-slate-400 dark:text-slate-500">
              For technical access issues, please contact CSFWD IT Division at{" "}
              <span className="text-slate-500 dark:text-slate-350 font-bold">(045) 961-3546</span>
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
