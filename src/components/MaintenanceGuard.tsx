"use client";

import React, { useState, useEffect } from "react";
import { Wrench, ShieldAlert, RefreshCw } from "lucide-react";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isAdminPath, setIsAdminPath] = useState(false);

  useEffect(() => {
    // Check if the current route is a dashboard or admin route
    const checkPathAndMode = () => {
      const pathname = window.location.pathname;
      // Exempt all admin-accessible routes:
      // /dashboard - admin command center
      // /login     - needed for admin to authenticate
      // /admin     - admin-only area
      // /crew      - field crew portal
      // /api       - internal API routes
      const ADMIN_PATHS = ["/dashboard", "/login", "/admin", "/crew", "/api"];
      const isExempt = ADMIN_PATHS.some((p) => pathname.startsWith(p));
      setIsAdminPath(isExempt);
      
      const isEnabled = localStorage.getItem("maintenance_mode") === "true";
      setMaintenanceMode(isEnabled);
    };

    checkPathAndMode();

    // Listen to custom local storage changes
    window.addEventListener("maintenance-mode-change", checkPathAndMode);
    
    // Periodically poll local storage in case it was changed in another tab
    const interval = setInterval(checkPathAndMode, 1500);

    return () => {
      window.removeEventListener("maintenance-mode-change", checkPathAndMode);
      clearInterval(interval);
    };
  }, []);

  // Intercept if maintenance mode is ON and path is NOT dashboard or API
  if (maintenanceMode && !isAdminPath) {
    return (
      <div className="min-h-screen bg-[#001e66] text-white flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden font-sans">
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#00aeef_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none"></div>

        {/* Circular Ambient Glows */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#00aeef]/10 blur-[120px] -top-20 -left-20 pointer-events-none animate-pulse"></div>
        <div className="absolute w-[450px] h-[450px] rounded-full bg-blue-900/20 blur-[130px] -bottom-20 -right-20 pointer-events-none animate-pulse"></div>

        <div className="max-w-md w-full space-y-8 z-10 relative">
          
          {/* Logo & Icon Group */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#00aeef]/20 blur-md scale-125 animate-ping"></div>
              <div className="relative w-20 h-20 rounded-3xl bg-[#00aeef]/10 border border-[#00aeef]/30 flex items-center justify-center shadow-lg">
                <Wrench className="w-10 h-10 text-[#00aeef] animate-bounce" />
              </div>
            </div>
            
            {/* Branding */}
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight flex items-center justify-center gap-1.5">
                <span className="text-[#00aeef]">Aqua</span>Track
              </h1>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                District Operations Hub
              </div>
            </div>
          </div>

          {/* Maintenance Message */}
          <div className="bg-[#00123e] border border-blue-950 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-2 border-b border-blue-900/40 pb-3">
              <ShieldAlert className="w-4.5 h-4.5 text-amber-400 shrink-0" />
              <h2 className="text-sm font-extrabold text-blue-100 uppercase tracking-wider">
                System Under Maintenance
              </h2>
            </div>
            
            <p className="text-xs text-blue-200/90 leading-relaxed font-medium">
              AquaTrack is currently performing scheduled system updates and diagnostics. The resident service portal and public reporting tools are temporarily offline to ensure database integrity.
            </p>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-950/60 border border-blue-900/30 text-[10px] font-mono text-blue-300">
              <RefreshCw className="w-3.5 h-3.5 text-[#00aeef] animate-spin" />
              <span>Restoring all services as soon as possible.</span>
            </div>
          </div>

          {/* Bottom Branding Footer */}
          <div className="text-[9px] font-mono text-slate-400">
            &copy; {new Date().getFullYear()} City of San Fernando Water District. All rights reserved.
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
