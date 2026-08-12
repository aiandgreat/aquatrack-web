"use client";

import React from "react";
import { LogOut, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogoutConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function LogoutConfirmModal({
  open,
  onCancel,
  onConfirm,
  title = "Confirm Sign Out",
  message = "Are you sure you want to end your session and log out?",
}: LogoutConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl text-center z-10"
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              aria-label="Close sign out confirmation"
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 bg-red-50 dark:bg-red-950/40 text-[#970006] dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/50 shadow-sm">
              <LogOut className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-[#001e66] dark:text-slate-100 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-semibold">
              {message}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={onCancel}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="bg-[#970006] hover:bg-red-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer border-none focus:outline-none"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
