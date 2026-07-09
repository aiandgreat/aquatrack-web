"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavbarActions() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Prevent layout shift during SSR hydration
    return (
      <div className="flex items-center space-x-3 opacity-0">
        <div className="w-24 h-9 bg-slate-100 rounded-full" />
        <div className="w-24 h-9 bg-slate-100 rounded-full" />
      </div>
    );
  }

  const isDashboard = pathname === "/dashboard";
  const isCrew = pathname === "/crew";

  return (
    <div className="flex items-center space-x-3">
      <Link
        href="/dashboard"
        className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-200 border ${
          isDashboard
            ? "bg-[#001e66] border-[#001e66] text-white shadow-sm"
            : "bg-white border-slate-200 text-[#001e66] hover:bg-slate-50 hover:border-slate-300 shadow-sm"
        }`}
      >
        Portal Login
      </Link>
      <Link
        href="/crew"
        className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-200 border ${
          isCrew
            ? "bg-[#00aeef] border-[#00aeef] text-white shadow-sm"
            : "bg-white border-slate-200 text-[#00aeef] hover:bg-slate-50 hover:border-slate-300 shadow-sm"
        }`}
      >
        Crew Access
      </Link>
    </div>
  );
}
