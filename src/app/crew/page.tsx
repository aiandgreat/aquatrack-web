"use client";

import React, { useState } from "react";

export default function FieldCrewPortal() {
  const [currentJob, setCurrentJob] = useState({
    id: "job-101",
    status: "ASSIGNED",
    location: "Main Street Valve #45",
    diagnosticDetails: "Pressure drop reported nearby. Suspected line breach.",
    actionPrompt: "Verify pressure gauges, replace faulty gaskets on section B-12.",
    imageUrl: "https://images.unsplash.com/photo-1584267385494-9fdf97b090f5?auto=format&fit=crop&w=600&q=80"
  });

  const handleUpdateStatus = (newStatus: string) => {
    setCurrentJob((prev) => ({ ...prev, status: newStatus }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 max-w-md mx-auto">
      <header className="border-b border-slate-800 pb-3 mb-4">
        <h1 className="text-lg font-bold text-cyan-400">Field Engineering Portal</h1>
        <p className="text-xs text-slate-500">Crew ID: tech-772</p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded p-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">ASSIGNED JOB</span>
          <span className="bg-amber-950 text-amber-400 font-bold px-2 py-0.5 rounded text-xxs">
            {currentJob.status}
          </span>
        </div>
        <h2 className="text-md font-bold mt-2">{currentJob.location}</h2>
        <p className="text-xs text-slate-400 mt-1">{currentJob.diagnosticDetails}</p>

        {currentJob.imageUrl && (
          <div className="mt-3">
            <span className="text-xxs font-bold text-slate-500 uppercase block mb-1">Attached Incident Photo</span>
            <a href={currentJob.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative rounded border border-slate-800 overflow-hidden hover:opacity-90 transition-opacity">
              <img src={currentJob.imageUrl} alt="Attached Incident" className="w-full h-36 object-cover" />
            </a>
          </div>
        )}

        <div className="mt-4 bg-slate-950 p-3 rounded border border-slate-800">
          <p className="text-xs text-slate-500 font-bold">RECOMMENDED INSTRUCTIONS</p>
          <p className="text-sm mt-1 italic text-slate-300">"{currentJob.actionPrompt}"</p>
        </div>

        <div className="mt-6 flex space-x-2">
          {currentJob.status === "ASSIGNED" && (
            <button
              onClick={() => handleUpdateStatus("IN_PROGRESS")}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded text-sm"
            >
              Start Job
            </button>
          )}
          {currentJob.status === "IN_PROGRESS" && (
            <button
              onClick={() => handleUpdateStatus("RESOLVED")}
              className="flex-1 bg-green-500 hover:bg-green-600 text-slate-950 font-bold py-2 rounded text-sm"
            >
              Mark Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
