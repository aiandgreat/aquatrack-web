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
    <div className="flex items-center space-x-1 rounded-full border border-slate-200/80 bg-slate-50/80 p-1 shadow-inner">
      {items.map((item) => {
        const isActive = activeHash === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
              isActive
                ? "bg-[#001e66] text-white shadow-sm"
                : "text-slate-600 hover:text-[#001e66] hover:bg-slate-100/60"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
