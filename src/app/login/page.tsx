"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Brand Ribbon */}
      <div className="flex h-1.5" aria-hidden="true">
        <span className="flex-1 bg-[#001e66]" />
        <span className="flex-1 bg-[#00aeef]" />
        <span className="flex-1 bg-[#970006]" />
      </div>

      {/* Logo Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm px-6 py-4">
        <Link href="/" className="flex items-center w-fit">
          <img src="/LOGO1.png" alt="AquaTrack Logo" className="h-12 w-auto" />
        </Link>
      </div>

      {/* Main login card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden">

            {/* Card Header */}
            <div className="bg-gradient-to-br from-[#001e66] to-[#00aeef] px-8 py-8 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight">Staff Login</h1>
                  <p className="text-white/70 text-xs font-medium">City of San Fernando Water District</p>
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Sign in with your CSFWD staff credentials to access the AquaTrack command center.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="px-8 py-8 space-y-5">

              {/* Error alert */}
              {error && (
                <div className="flex items-start space-x-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#001e66] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#001e66] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                />
              </div>

              {/* Submit button */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-[#001e66] hover:bg-[#00aeef] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-sm uppercase tracking-wider mt-2"
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

              {/* Divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">or continue with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Facebook OAuth Button */}
              <button
                id="login-facebook"
                type="button"
                onClick={handleFacebookLogin}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-extrabold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                {/* Facebook F icon */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
                Continue with Facebook
              </button>

              {/* Register link */}
              <p className="text-center text-sm text-slate-500 pt-2">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-[#00aeef] font-bold hover:underline">
                  Register here
                </Link>
              </p>

            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-400 mt-6">
            For account access issues, contact CSFWD IT Support at{" "}
            <span className="text-slate-500 font-medium">(045) 961-3546</span>
          </p>
        </div>
      </div>
    </div>
  );
}
