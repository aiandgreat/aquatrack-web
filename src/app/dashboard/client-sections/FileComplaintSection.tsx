import React from "react";

interface FileComplaintSectionProps {
  complaintText: string;
  setComplaintText: (t: string) => void;
  complaintImageUrl: string;
  setComplaintImageUrl: (u: string) => void;
  customLat: string;
  customLng: string;
  gpsPinpointActive: boolean;
  gpsAccuracy: number | null;
  submitting: boolean;
  submitSuccess: boolean;
  submitError: string | null;
  aiAnalysis: {
    urgency: string;
    category: string;
    translatedText: string;
    summary: string;
  } | null;
  handleCreateComplaint: (e: React.FormEvent) => void;
}

export default function FileComplaintSection({
  complaintText,
  setComplaintText,
  complaintImageUrl,
  setComplaintImageUrl,
  customLat,
  customLng,
  gpsPinpointActive,
  gpsAccuracy,
  submitting,
  submitSuccess,
  submitError,
  aiAnalysis,
  handleCreateComplaint,
}: FileComplaintSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-[#001e66] tracking-tight">File an Incident Report</h2>
        <p className="text-xs text-slate-500 font-medium">Describe water flow pressure drops or quality deviations</p>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
          ✓ Your complaint was logged successfully! The AI triage assistant is routing your ticket to field crews.
        </div>
      )}

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold">
          ⚠ {submitError}
        </div>
      )}

      <form onSubmit={handleCreateComplaint} className="space-y-5">
        {/* Description Textarea */}
        <div className="space-y-1.5">
          <label className="text-xxs font-bold text-slate-500 uppercase">Describe water issue</label>
          <textarea
            rows={5}
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="e.g. Mahina ang tubig dito sa amin sa Del Pilar, halos walang tumutulo..."
            className="w-full bg-slate-50 border border-slate-200 text-[#001e66] font-bold text-xs py-3 px-4 rounded-xl focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20 transition-all"
          />
          <p className="text-[10px] text-slate-400">Reports can be entered in Tagalog, Taglish, or English.</p>
        </div>

        {/* Automated Location Pinpoint Active badge info card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center space-x-3 text-xs">
          <span className="text-base">📍</span>
          <div>
            <span className="font-extrabold text-[#001e66] block">Automated Location Pinpoint Active</span>
            <span className="text-[10px] text-slate-500 font-medium font-bold">
              {gpsPinpointActive
                ? `Exact high-precision coordinates captured (${customLat}, ${customLng} • Accuracy: ${gpsAccuracy ? `${gpsAccuracy.toFixed(1)}m` : "Verified"})`
                : "Device high-accuracy GPS coordinates will be captured and sent upon filing."}
            </span>
          </div>
        </div>

        {/* Complaint Image URL */}
        <div className="space-y-1.5">
          <label className="text-xxs font-bold text-slate-500 uppercase">Complaint Photo URL (Optional)</label>
          <input
            type="text"
            value={complaintImageUrl}
            onChange={(e) => setComplaintImageUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="w-full bg-slate-50 border border-slate-200 text-[#001e66] font-bold text-xs py-3 px-4 rounded-xl focus:outline-none focus:border-[#00aeef]"
          />
        </div>

        {/* AI Triage Analysis Card */}
        {aiAnalysis && (
          <div className="bg-[#00aeef]/5 border border-[#00aeef]/20 rounded-2xl p-5 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-[#001e66]">✨ Gemini AI Diagnostics</span>
                <span className="bg-[#00aeef]/10 text-[#00aeef] text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Active Triage
                </span>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                aiAnalysis.urgency === "URGENT" ? "bg-red-50 text-red-600 border border-red-200" : "bg-amber-50 text-amber-600 border border-amber-200"
              }`}>
                {aiAnalysis.urgency} Urgency
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed font-semibold">
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase block">Category Classification</span>
                <span className="font-mono text-[#001e66] text-[10px]">{aiAnalysis.category}</span>
              </div>
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase block">Analysis Summary</span>
                <p className="text-slate-700 italic mt-0.5">"{aiAnalysis.summary}"</p>
              </div>
              {aiAnalysis.translatedText && aiAnalysis.translatedText !== complaintText && (
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase block">English Translation</span>
                  <p className="text-slate-500 mt-0.5">{aiAnalysis.translatedText}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission Button Row */}
        <div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold text-xs px-6 py-3.5 rounded-xl uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Filing &amp; Analyzing with AI…</span>
              </>
            ) : (
              "File Complaint"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
