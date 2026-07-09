"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
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

      {/* Main register card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Success state */}
          {success ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 px-8 py-12 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-black text-[#001e66]">Registration Submitted!</h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  A confirmation email has been sent to <span className="font-bold text-[#001e66]">{email}</span>. Please verify your email address to activate your AquaTrack account.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold py-3 px-8 rounded-xl text-sm uppercase tracking-wider transition-all duration-200"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden">

              {/* Card Header */}
              <div className="bg-gradient-to-br from-[#001e66] to-[#00aeef] px-8 py-8 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight">Create Account</h1>
                    <p className="text-white/70 text-xs font-medium">City of San Fernando Water District</p>
                  </div>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Register to access the AquaTrack platform. Your account will be reviewed by the CSFWD administrator.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="px-8 py-8 space-y-5">

                {/* Error alert */}
                {error && (
                  <div className="flex items-start space-x-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="register-fullname" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#001e66] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="register-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#001e66] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="register-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#001e66] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label htmlFor="register-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Confirm Password
                  </label>
                  <input
                    id="register-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#001e66] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                  />
                </div>

                {/* Submit */}
                <button
                  id="register-submit"
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
                      <span>Creating Account…</span>
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>

                {/* Login link */}
                <p className="text-center text-sm text-slate-500 pt-2">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#00aeef] font-bold hover:underline">
                    Sign in here
                  </Link>
                </p>

              </form>
            </div>
          )}

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
