"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom Colors Mapping:
  // Dark Blue: #001e66
  // Vivid Azure: #00aeef
  // White: #ffffff
  // Yellow: #ffd800
  // Vivid Red: #970006

  const advisories = [
    {
      date: "July 9, 2026",
      title: "Scheduled Pipeline Maintenance - Barangay Del Pilar",
      text: "Normal water pressure may fluctuate between 8:00 AM and 5:00 PM due to active sensor node calibrations.",
      type: "warning"
    },
    {
      date: "July 8, 2026",
      title: "Water Quality Standard Update",
      text: "All primary pump stations in San Fernando continue to exceed WHO standards for safe drinking water, averaging 1.2 NTU turbidity.",
      type: "info"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#001e66] font-sans flex flex-col">
      {/* 1. Header/Navbar Section */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              {/* Logo of AquaTrack */}
              <div className="flex items-center cursor-pointer">
                <img src="/LOGO1.png" alt="AquaTrack Logo" className="h-10 w-auto" />
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8 text-sm font-bold">
              <a href="#home" className="text-[#00aeef] transition-colors">Home</a>
              <a href="#about" className="hover:text-[#00aeef] transition-colors">About Us</a>
              <a href="#offices" className="hover:text-[#00aeef] transition-colors">District Offices</a>
              <a href="#announcements" className="hover:text-[#00aeef] transition-colors">Advisories &amp; Announcements</a>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#001e66] hover:text-[#00aeef] p-2 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Links */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 px-4 pt-2 pb-4 space-y-2 bg-white font-bold text-sm">
            <a href="#home" className="block py-2 text-[#00aeef]" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href="#about" className="block py-2 hover:text-[#00aeef]" onClick={() => setMobileMenuOpen(false)}>About Us</a>
            <a href="#offices" className="block py-2 hover:text-[#00aeef]" onClick={() => setMobileMenuOpen(false)}>District Offices</a>
            <a href="#announcements" className="block py-2 hover:text-[#00aeef]" onClick={() => setMobileMenuOpen(false)}>Advisories &amp; Announcements</a>
          </div>
        )}
      </nav>

      {/* 2. Hero Header Section with Premium Multi-Layer Overlay */}
      <section
        id="home"
        className="relative py-24 md:py-36 px-4 flex items-center min-h-[550px] bg-slate-50 overflow-hidden"
      >
        {/* 4. Underlying Blended Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 mix-blend-multiply pointer-events-none"
          style={{ backgroundImage: "url('https://greenempowerment.org/wp-content/uploads/2020/09/kids-water.jpg')" }}
        ></div>

        {/* 1. Light Linear Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/35 to-white/45 pointer-events-none"></div>

        {/* 2. Subtle Dotted Water Grid Wave Overlay */}
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#00aeef_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none"></div>

        {/* 3. Bottom Fade-to-White Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/60 to-transparent pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto w-full z-10">
          <div className="max-w-2xl bg-white/80 p-8 md:p-12 rounded-2xl shadow-xl backdrop-blur-md border border-white/50">
            {/* Tagline */}
            <h1 className="text-4xl md:text-5xl font-black leading-tight text-[#001e66]">
              Clean Water, One <span className="bg-[#ffd800] px-2 py-0.5 rounded text-[#001e66]">Smart</span> <span className="text-[#970006]">Drop</span> at a Time.
            </h1>
            
            {/* Description */}
            <p className="mt-6 text-base md:text-lg leading-relaxed text-[#001e66] font-medium">
              Monitor water quality in real time, report issues instantly, and stay informed about your community's water conditions — all in one intelligent platform built for the City of San Fernando, Pampanga.
            </p>

            {/* Portal Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="flex-1 bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold text-center py-3.5 px-6 rounded-xl transition-all duration-200 shadow-md hover:scale-105"
              >
                Sign In to Portal
              </Link>
              <Link
                href="/crew"
                className="flex-1 bg-transparent hover:bg-slate-50 text-[#00aeef] border-2 border-[#00aeef] font-extrabold text-center py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
              >
                Register Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. About Us Section */}
      <section id="about" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00aeef]">Innovative Sanitation</span>
            <h2 className="text-3xl font-extrabold mt-2 text-[#001e66]">Our Mission &amp; Infrastructure</h2>
            <p className="mt-4 text-slate-600 leading-relaxed text-sm">
              AquaTrack bridges the gap between resident observers and water system operators in Pampanga. By correlating real-time sensor node alerts with geolocated citizen feedback, we maintain optimal pressure systems and pure water delivery across San Fernando.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm hover:border-[#00aeef] transition-all">
              <div className="w-12 h-12 bg-[#00aeef]/10 rounded-lg flex items-center justify-center text-[#00aeef] mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg">Real-Time Ingestion</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                IoT telemetry streams pH, pressure, and turbidity limits directly to our analytics system for instant warning dispatching.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm hover:border-[#00aeef] transition-all">
              <div className="w-12 h-12 bg-[#970006]/10 rounded-lg flex items-center justify-center text-[#970006] mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg">Gemini Triage</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Native translations from Tagalog and Kapampangan to English allow our diagnostic engine to categorize issues in milliseconds.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm hover:border-[#00aeef] transition-all">
              <div className="w-12 h-12 bg-[#ffd800]/10 rounded-lg flex items-center justify-center text-[#001e66] mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg">PostGIS Matching</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Automated 500-meter proximity calculations pair citizen reports with adjacent offline nodes to output direct recommended actions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. District Offices Section */}
      <section id="offices" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00aeef]">Customer Care</span>
            <h2 className="text-3xl font-extrabold mt-2 text-[#001e66]">Local District Offices</h2>
            <p className="mt-2 text-slate-500 text-sm">Find your nearest service terminal in San Fernando</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-lg text-[#001e66]">San Fernando City Hall Annex</h3>
              <p className="text-xs text-slate-500 mt-2">Capitol Boulevard, Brgy. San Juan, City of San Fernando, Pampanga</p>
              <div className="mt-4 flex items-center space-x-2 text-xs font-bold text-[#00aeef]">
                <span>Contact: (045) 961-8821</span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-lg text-[#001e66]">Sindalan Operations Depot</h3>
              <p className="text-xs text-slate-500 mt-2">MacArthur Highway, Brgy. Sindalan, City of San Fernando, Pampanga</p>
              <div className="mt-4 flex items-center space-x-2 text-xs font-bold text-[#00aeef]">
                <span>Contact: (045) 961-8825</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Advisories and Announcements Section */}
      <section id="announcements" className="py-20 bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#970006]">Stay Safe &amp; Alert</span>
            <h2 className="text-3xl font-extrabold mt-2 text-[#001e66]">Community Advisories</h2>
            <p className="mt-2 text-slate-500 text-sm">Active notifications dispatched from our operational console</p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {advisories.map((ad, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{ad.date}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                      ad.type === "warning" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {ad.type.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#001e66] mt-1.5">{ad.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ad.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#001e66] text-white py-12 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">Aqua<span className="text-[#00aeef]">Track</span></span>
            <span className="text-[10px] text-slate-400 font-mono">v1.2.0</span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            &copy; 2026 Municipal Water District of the City of San Fernando, Pampanga. All rights reserved.
          </p>
          <div className="flex space-x-6 text-xs text-slate-400 font-bold">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
