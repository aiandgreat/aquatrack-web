"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Globe, ShieldCheck } from "lucide-react";

export default function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
      <footer className="bg-[#eef4fa] dark:bg-[#07142F] border-t border-slate-300/80 dark:border-white/10 text-slate-700 dark:text-slate-300 pt-10 pb-16 mt-auto transition-colors duration-300 relative overflow-hidden">
        {/* Subtle background glow element */}
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-[#00aeef]/5 dark:bg-[#00aeef]/2 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 relative z-10">
          
          {/* About / Branding column */}
          <div className="md:col-span-4 flex flex-col text-left space-y-2">
            <div className="flex flex-row items-start gap-4">
              <div className="flex items-start">
                {/* Responsive logos for light/dark mode */}
                <img src="/LOGO2.png" alt="AquaTrack Logo" className="h-[80px] w-auto block dark:hidden object-contain" />
                <img src="/LOGO3.png" alt="AquaTrack Logo" className="h-[80px] w-auto hidden dark:block object-contain" />
              </div>
              <div className="flex items-start">
                <img src="/csfwd.png" alt="CSFWD Logo" className="h-[80px] w-auto object-contain" />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              AQUATRACK - Providing real-time telemetry, automated triage, and crew dispatching for the City of San Fernando, Pampanga.
            </p>
          </div>

          {/* Quick Links column */}
          <div className="md:col-span-3 flex flex-col space-y-4 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Quick Links
            </h4>
            <ul className="flex flex-col space-y-2.5 text-xs font-bold">
              <li>
                <Link href="/#home" className="text-slate-500 dark:text-slate-400 hover:text-[#00aeef] dark:hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#00aeef] transition-colors" />
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-slate-500 dark:text-slate-400 hover:text-[#00aeef] dark:hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#00aeef] transition-colors" />
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#offices" className="text-slate-500 dark:text-slate-400 hover:text-[#00aeef] dark:hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#00aeef] transition-colors" />
                  District Offices
                </Link>
              </li>
              <li>
                <Link href="/#announcements" className="text-slate-500 dark:text-slate-400 hover:text-[#00aeef] dark:hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#00aeef] transition-colors" />
                  Announcements
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect column */}
          <div className="md:col-span-3 flex flex-col space-y-4 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Connect
            </h4>
            <ul className="flex flex-col space-y-3 text-xs font-bold">
              <li>
                <a href="mailto:info@csfwd.gov.ph" className="text-slate-500 dark:text-slate-400 hover:text-[#00aeef] dark:hover:text-white transition-colors flex items-center gap-2.5 group">
                  <Mail className="w-4 h-4 text-slate-400 group-hover:text-[#00aeef] transition-colors shrink-0" />
                  <span>info@csfwd.gov.ph</span>
                </a>
              </li>
              <li>
                <a href="https://facebook.com/csfwaterdistrict" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-[#00aeef] dark:hover:text-white transition-colors flex items-center gap-2.5 group">
                  <Globe className="w-4 h-4 text-slate-400 group-hover:text-[#00aeef] transition-colors shrink-0" />
                  <span className="truncate">facebook.com/csfwaterdistrict</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Credits column */}
          <div className="md:col-span-2 flex flex-col items-start md:items-end space-y-3.5 text-left md:text-right">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Developed By
            </h4>
            <div className="h-14 flex items-center justify-start md:justify-end">
              <img src="/GALARA-LIGHT.png" alt="GALARA Logo" className="h-14 w-auto block dark:hidden object-contain" />
              <img src="/GALARA-DARK.png" alt="GALARA Logo" className="h-14 w-auto hidden dark:block object-contain" />
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-tight">
              GARCIA · LAXAMANA · GUEVARRA
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-2 text-[10px] tracking-wider text-slate-400 dark:text-slate-500 font-bold uppercase relative z-10 text-center">
          <span>&copy; 2026 CSFWD. All Rights Reserved for AquaTrack.</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-800 font-normal select-none">•</span>
          <button
            onClick={() => setPrivacyOpen(true)}
            className="hover:text-[#00aeef] dark:hover:text-white transition-colors cursor-pointer focus:outline-none"
          >
            Privacy Policy
          </button>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {privacyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPrivacyOpen(false)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-0 m-auto max-w-lg h-fit max-h-[85vh] bg-[#f8fafc] dark:bg-[#07142F] border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl p-6 md:p-8 flex flex-col z-[101] overflow-hidden text-left"
            >
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
                <ShieldCheck className="w-6.5 h-6.5 text-[#00aeef]" />
                <h3 className="font-extrabold text-xl text-[#001e66] dark:text-white tracking-tight">
                  Data Privacy Policy
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto my-5 space-y-4 pr-1 text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed font-semibold scrollbar-thin">
                <p>
                  Municipal Water District of the City of San Fernando (CSFWD) is committed to protecting your personal information in compliance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the Philippines.
                </p>
                
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">1. Information We Collect</h4>
                  <p>When you report disruptions, leaks, or water quality issues, we collect your name, contact details (email/phone), and geolocation coordinates to locate the incident.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">2. Purpose of Processing</h4>
                  <p>Your coordinates and complaint info are analyzed using our PostGIS dispatch database to route service requests to the nearest CSFWD engineering crew.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">3. Data Protection Measures</h4>
                  <p>All personal details are encrypted and securely stored. Only authorized CSFWD administrative staff and dispatchers have access to the dashboard.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">4. Your Rights</h4>
                  <p>You have the right to request access, correction, or permanent deletion of your submitted logs and credentials from the system database by emailing us.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/10 flex-shrink-0">
                <button
                  onClick={() => setPrivacyOpen(false)}
                  className="bg-[#001e66] dark:bg-[#00aeef] hover:bg-[#00aeef] dark:hover:bg-[#00aeef]/90 text-white dark:text-[#001e66] px-6 py-2.5 rounded-full font-black uppercase tracking-wider text-[10px] hover:scale-105 transition-all cursor-pointer shadow-sm focus:outline-none"
                >
                  Accept &amp; Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
