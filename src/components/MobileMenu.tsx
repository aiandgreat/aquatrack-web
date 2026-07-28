"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavItem } from "./NavItems";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  activeHash: string;
  dark: boolean;
  mounted: boolean;
}

export default function MobileMenu({ isOpen, onClose, items, activeHash, dark, mounted }: MobileMenuProps) {
  // Disable window scrolling while the mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — bg-background/80 backdrop-blur-md (RAITE style) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-white/80 dark:bg-[#07142F]/80 backdrop-blur-md"
          />

          {/* Slide-In Drawer from right (RAITE style) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-white dark:bg-[#07142F] shadow-2xl flex flex-col border-l border-slate-100 dark:border-white/10"
          >

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center">
                <img 
                  src={mounted && dark ? "/LOGO3.png" : "/LOGO1.png"} 
                  alt="AquaTrack Logo" 
                  className="h-10 w-auto translate-y-0.5" 
                />
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-[#001e66] dark:text-white transition-colors focus:outline-none"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav Links — MENU section */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Menu</p>
              <div className="flex flex-col space-y-2">
                {items.map((item) => {
                  const isActive = activeHash === item.href;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`px-4 py-3 rounded-2xl border font-bold text-sm uppercase tracking-wider transition-all ${
                        isActive
                          ? "bg-[#001e66] dark:bg-[#00aeef] border-[#001e66] dark:border-[#00aeef] text-white dark:text-[#001e66] shadow-md dark:shadow-[0_0_12px_rgba(0,174,239,0.35)]"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#001e66] dark:hover:text-white"
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Footer Branding (RAITE style) */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00aeef]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.09 3.36L16.5 6l-2.73 2.64.82 3.36L12 10.5l-3.59 1.5.82-3.36L6.5 6l3.41.36L12 3z" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                AquaTrack · City of San Fernando
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
