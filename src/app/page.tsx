"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

function AnimatedCounter({ value, duration = 2000, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Decelerating progress curve (ease-out quad)
      const easeProgress = progress * (2 - progress);
      const currentValue = Math.floor(easeProgress * value);
      
      setCount(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

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

  // City of San Fernando Water District (CSFWD) Offices data
  const districtOffices = [
    {
      name: "CSFWD Main Office (Sto. Rosario)",
      address: "B. Mendoza St., Sto. Rosario, City of San Fernando, Pampanga 2000",
      phone: "(045) 961-3546",
      hours: "8:00 AM - 5:00 PM (Mon-Fri)",
      query: "City of San Fernando Water District B. Mendoza St Pampanga"
    },
    {
      name: "Saguin Sub-Office",
      address: "Fortune Square Bldg. (in front of Coke), Saguin, City of San Fernando, Pampanga",
      phone: "(045) 961-5804",
      hours: "8:00 AM - 5:00 PM (Mon-Fri)",
      query: "Fortune Square Bldg Saguin City of San Fernando Pampanga"
    },
    {
      name: "Sindalan Sub-Office",
      address: "Sindalan Payment Center, Brgy. Sindalan, City of San Fernando, Pampanga",
      phone: "0968-854-1343",
      hours: "8:00 AM - 3:00 PM (Mon-Fri)",
      query: "Sindalan City of San Fernando Pampanga"
    },
    {
      name: "Bulaon Sub-Office",
      address: "Bulaon Payment Center, Brgy. Bulaon, City of San Fernando, Pampanga",
      phone: "0933-814-6585",
      hours: "8:00 AM - 3:00 PM (Mon-Fri)",
      query: "Bulaon City of San Fernando Pampanga"
    },
    {
      name: "Teopaco Sub-Office",
      address: "P. Gomez St., Teopaco, City of San Fernando, Pampanga",
      phone: "(045) 961-3546",
      hours: "8:00 AM - 4:00 PM (Mon-Fri)",
      query: "P. Gomez St City of San Fernando Pampanga"
    }
  ];

  const [activeOffice, setActiveOffice] = useState(districtOffices[0]);

  return (
    <div className="min-h-screen bg-white text-[#001e66] font-sans flex flex-col">
      {/* 1. Header/Navbar Section */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              {/* Logo of AquaTrack */}
              <div className="flex items-center cursor-pointer">
                <img src="/LOGO2.png" alt="AquaTrack Logo" className="h-25 w-auto translate-y-1" />
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
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 mix-blend-multiply pointer-events-none"
          style={{ backgroundImage: "url('https://greenempowerment.org/wp-content/uploads/2020/09/kids-water.jpg')" }}
        ></div>

        {/* 1. Horizontal Linear Gradient Overlay (Fades left-to-right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent pointer-events-none"></div>

        {/* 2. Subtle Dotted Water Grid Wave Overlay */}
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#00aeef_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none"></div>

        {/* 3. Bottom Fade-to-White Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/60 to-transparent pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto w-full z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Tagline, Description, Action Buttons */}
          <div className="flex flex-col space-y-6">
            {/* Tagline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-[#001e66]">
              Clean Water, One <span className="bg-[#ffd800] px-2 py-0.5 rounded text-[#001e66]">Smart</span> <span className="text-[#970006]">Drop</span> at a Time.
            </h1>
            
            {/* Description */}
            <p className="text-base md:text-lg leading-relaxed text-[#001e66] font-medium">
              Monitor water quality in real time, report issues instantly, and stay informed about your community's water conditions — all in one intelligent platform built for the City of San Fernando, Pampanga.
            </p>

            {/* Portal Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/dashboard"
                className="flex-1 bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold text-center py-3.5 px-6 rounded-xl transition-all duration-200 shadow-md hover:scale-105"
              >
                Sign In to Portal
              </Link>
              <Link
                href="/crew"
                className="flex-1 bg-white hover:bg-slate-50 text-[#00aeef] border-2 border-[#00aeef] font-extrabold text-center py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
              >
                Register Account
              </Link>
            </div>
          </div>

          {/* Right Column: Main Features of AquaTrack (Contained in equal-sized white cards) */}
          <div className="flex flex-col space-y-4 lg:pl-8">
            
            <div className="space-y-4 flex flex-col">
              
              {/* Feature 1 */}
              <div className="w-full bg-white/90 border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center space-x-6 min-h-[120px] transition-all hover:border-[#00aeef] hover:shadow-md">
                <div className="w-14 h-14 bg-[#00aeef]/10 rounded-xl flex items-center justify-center text-[#00aeef] flex-shrink-0 shadow-sm border border-[#00aeef]/20">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#001e66] tracking-tight">Real-Time Complaint Tracking</h3>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">Submit and track water-related concerns anytime.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="w-full bg-white/90 border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center space-x-6 min-h-[120px] transition-all hover:border-[#00aeef] hover:shadow-md">
                <div className="w-14 h-14 bg-[#ffd800]/15 rounded-xl flex items-center justify-center text-[#001e66] flex-shrink-0 shadow-sm border border-[#ffd800]/30">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#001e66] tracking-tight">AI-Assisted Classification</h3>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">Supports native Tagalog or Kapampangan report descriptions and automated report classification.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="w-full bg-white/90 border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center space-x-6 min-h-[120px] transition-all hover:border-[#00aeef] hover:shadow-md">
                <div className="w-14 h-14 bg-[#970006]/10 rounded-xl flex items-center justify-center text-[#970006] flex-shrink-0 shadow-sm border border-[#970006]/20">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#001e66] tracking-tight">Geospatial Mapping &amp; Pinning</h3>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">Precise and automated GPS pinning of exact locations of water service-related complaints.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2.5. Operational Impact Metrics Box */}
      <div className="relative max-w-5xl mx-auto px-4 z-20 -mt-16">
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-slate-100">
          
          {/* Metric 1 */}
          <div className="flex items-center space-x-5 md:px-4 group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-[#00aeef]/10 flex items-center justify-center text-[#00aeef] transition-colors group-hover:bg-[#00aeef]/20">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-black text-[#001e66] tracking-tight">
                <AnimatedCounter value={52} suffix=" Years" />
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">Years of Service</p>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="flex items-center space-x-5 md:pl-8 md:pr-4 group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-[#ffd800]/15 flex items-center justify-center text-[#001e66] transition-colors group-hover:bg-[#ffd800]/35">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-black text-[#001e66] tracking-tight">
                <AnimatedCounter value={250000} suffix="+" />
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">Consumers Subscribed</p>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="flex items-center space-x-5 md:pl-8 group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-[#970006]/10 flex items-center justify-center text-[#970006] transition-colors group-hover:bg-[#970006]/20">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-black text-[#001e66] tracking-tight">
                <AnimatedCounter value={35} />
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">Barangays Served</p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Mission & Vision Section */}
      <section id="about" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00aeef]">Strategic Compass</span>
            <h2 className="text-3xl font-extrabold mt-2 text-[#001e66]">Our Mission and Vision</h2>
            <p className="mt-4 text-slate-600 leading-relaxed text-sm">
              AquaTrack bridges the gap between resident observers and water system operators in Pampanga. By correlating real-time sensor node alerts with geolocated citizen feedback, we maintain optimal pressure systems and pure water delivery across San Fernando.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Mission Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md hover:border-[#00aeef] transition-all duration-300">
              <div className="w-12 h-12 bg-[#00aeef]/10 rounded-xl flex items-center justify-center text-[#00aeef] mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 1118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-[#001e66]">Our Mission</h3>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                To deliver uninterrupted, clean, and safe water services to the residents of San Fernando by integrating cutting-edge IoT telemetry and automated AI triage classification, making public complaints actionable in real time.
              </p>
            </div>

            {/* Vision Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md hover:border-[#00aeef] transition-all duration-300">
              <div className="w-12 h-12 bg-[#ffd800]/10 rounded-xl flex items-center justify-center text-[#ffd800] mb-6 border border-[#ffd800]/20">
                <svg className="w-6 h-6 text-[#001e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-[#001e66]">Our Vision</h3>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                To establish the City of San Fernando as a leading smart water municipality in the Philippines, leveraging spatial analytics and digital pipelines to achieve zero water wastage and instant responsive sanitation.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. District Offices Section */}
      <section id="offices" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00aeef]">Customer Care</span>
            <h2 className="text-3xl font-black mt-2 text-[#001e66]">Local District Offices</h2>
            <p className="mt-4 text-slate-600 leading-relaxed text-sm">
              Find and locate the main office of the City of San Fernando Water District (CSFWD) and our satellite payment branches. Select any office to update the interactive map.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Office Selector List (lg:col-span-5) */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              {districtOffices.map((office, idx) => {
                const isActive = activeOffice.name === office.name;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveOffice(office)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex flex-col space-y-2 ${
                      isActive 
                        ? "bg-[#001e66] border-[#001e66] text-white shadow-lg scale-[1.02]" 
                        : "bg-slate-50 border-slate-200/80 text-[#001e66] hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-sm md:text-base leading-snug">{office.name}</span>
                      {isActive && (
                        <span className="bg-[#00aeef] text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                          Active Map
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isActive ? "text-slate-200" : "text-slate-600"} leading-relaxed`}>
                      {office.address}
                    </p>
                    <div className="flex items-center space-x-4 pt-1 text-[11px] font-semibold">
                      <span className="flex items-center space-x-1">
                        <span>📞</span>
                        <span className={isActive ? "text-slate-300" : "text-slate-500"}>{office.phone}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>🕒</span>
                        <span className={isActive ? "text-slate-300" : "text-slate-500"}>{office.hours}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Google Maps API Integration Map View (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-inner min-h-[380px] lg:min-h-full flex flex-col">
              <div className="bg-[#001e66]/5 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#001e66]">
                <span className="flex items-center space-x-2">
                  <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-[#00aeef]"></span>
                  <span>Google Maps Live API View</span>
                </span>
                <span className="text-[#00aeef]">{activeOffice.name}</span>
              </div>
              <div className="flex-1 relative">
                <iframe
                  title="CSFWD Office Google Map Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "420px" }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(activeOffice.query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
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
