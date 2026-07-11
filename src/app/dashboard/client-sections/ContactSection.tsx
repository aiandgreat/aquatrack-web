import React from "react";

export default function ContactSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-[#001e66] tracking-tight">Contact Water District</h2>
        <p className="text-xs text-slate-500 font-medium font-bold">Reach out to our customer service desk directly</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Contact Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
            Customer Hotline
          </h3>
          <div className="space-y-3.5 text-xs">
            <div>
              <p className="font-bold text-slate-400">SUPPORT HELPLINE</p>
              <p className="text-lg font-black text-[#001e66] mt-0.5">(045) 961-3546</p>
            </div>
            <div>
              <p className="font-bold text-slate-400">EMAIL ENQUIRIES</p>
              <p className="font-black text-[#00aeef] mt-0.5">support@csfwd.gov.ph</p>
            </div>
            <div>
              <p className="font-bold text-slate-400">MAIN OFFICE ADDRESS</p>
              <p className="font-bold text-slate-600 mt-0.5">City of San Fernando, Pampanga</p>
            </div>
          </div>
        </div>

        {/* Office Info card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
              Office Coordinates
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-2">
              Our engineering command center coordinates dispatches from pumping stations across Pampanga.
            </p>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[#001e66]">CSFWD District Main</p>
              <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Lat: 15.0286 | Lng: 120.6942
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
