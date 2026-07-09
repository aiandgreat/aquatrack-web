import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-50">
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-4">
        <h1 className="text-xl font-bold tracking-tight text-cyan-400">AquaTrack Console</h1>
        <nav className="mt-8 space-y-2">
          <a href="/dashboard" className="block rounded px-3 py-2 bg-slate-800 text-sm font-medium">Dashboard</a>
          <a href="/admin" className="block rounded px-3 py-2 hover:bg-slate-800 text-sm font-medium text-slate-400">Settings</a>
        </nav>
      </aside>
      <main className="flex-1 relative flex">{children}</main>
    </div>
  );
}
