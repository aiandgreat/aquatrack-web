"use client";

import React from "react";

export interface NavItem {
  label: string;
  href: string;
}

interface NavItemsProps {
  items: NavItem[];
  activeHash: string;
  onItemClick?: () => void;
}

export default function NavItems({ items, activeHash, onItemClick }: NavItemsProps) {
  return (
    <div className="flex items-center space-x-1 rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/60 p-2 shadow-inner">
      {items.map((item) => {
        const isActive = activeHash === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center justify-center rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              isActive
                ? "bg-[#001e66] dark:bg-[#00aeef] text-white dark:text-[#001e66] shadow-sm dark:shadow-[0_0_12px_rgba(0,174,239,0.35)]"
                : "text-slate-600 dark:text-slate-300 hover:text-[#001e66] dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/10"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
