"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

interface FeatureItemProps {
  label: string;
  color: string;
  description: string;
}

function FeatureItem({ label, color, description }: FeatureItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative flex items-center space-x-2 cursor-help py-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="hover:text-[#00aeef] transition-colors">{label}</span>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[10px] leading-normal font-medium shadow-lg border border-slate-800 z-50 text-center normal-case tracking-normal"
          >
            {description}
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

let hasPlayedSplash = false;

export default function Homepage() {
  const router = useRouter();
  
  // Water Drop Splash States
  const [splashStep, setSplashStep] = useState(hasPlayedSplash ? 2 : 0); // 0: falling, 1: impact/expanding, 2: hidden

  useEffect(() => {
    if (hasPlayedSplash) return;

    // 1. Falling droplet hits center after 800ms
    const impactTimer = setTimeout(() => {
      setSplashStep(1);
    }, 800);

    // 2. Hide splash screen after expansion finishes (1700ms total)
    const hideTimer = setTimeout(() => {
      setSplashStep(2);
      hasPlayedSplash = true;
    }, 1700);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Custom Colors Mapping:
  // Dark Blue: #001e66
  // Vivid Azure: #00aeef
  // White: #ffffff
  // Yellow: #ffd800
  // Vivid Red: #970006

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch("/api/auth/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user?.id }),
          });
          const profile = await res.json();
          if (profile?.role === "ADMIN") {
            router.replace("/admin");
          } else {
            router.replace("/dashboard");
          }
        }
      } catch (err) {
        console.error("Session check redirect error:", err);
      }
    };
    checkSessionAndRedirect();
  }, [router]);

  const advisories: any[] = [];

  // City of San Fernando Water District (CSFWD) Offices data
  const districtOffices = [
    {
      name: "CSFWD Main Office (Sto. Rosario)",
      address: "2MMQ+68 San Fernando, Pampanga, Philippines",
      phone: "(045) 961-3546",
      hours: "8:00 AM - 5:00 PM (Mon-Fri)",
      query: "2MMQ+68 San Fernando, Pampanga, Philippines"
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
      {/* Cinematic Water Drop Splash Screen */}
      {splashStep < 2 && (
        <motion.div 
          initial={{ opacity: 1 }}
          animate={splashStep === 1 ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.75, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-[#001e66] flex items-center justify-center overflow-hidden"
          style={{ pointerEvents: splashStep === 1 ? "none" : "auto" }}
        >
          {/* Droplet & Brand Container */}
          <div className="relative flex items-center justify-center w-full h-full">
            
            {/* Background Map blend detail (subtle opacity) */}
            <img 
              src="/san_fernando_map.jpg" 
              alt="San Fernando Map Background" 
              className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none mix-blend-overlay"
            />

            {/* Falling Droplet (SVG) */}
            {splashStep === 0 && (
              <motion.div
                initial={{ y: -300, scale: 0.8, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.55, ease: "easeIn" }}
                className="text-[#00aeef] z-20"
              >
                <svg className="w-12 h-12 fill-current drop-shadow-[0_0_15px_rgba(0,174,239,0.4)]" viewBox="0 0 24 24">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </motion.div>
            )}

            {/* Expanding Fluid Wave (CSS Circle for hardware-accelerated composition) */}
            {splashStep === 1 && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 50, opacity: 0 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="absolute w-16 h-16 rounded-full bg-[#00aeef] z-20 pointer-events-none"
              />
            )}

            {/* Concentric Ripples on Impact */}
            {splashStep === 1 && (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0.6 }}
                  animate={{ scale: 6, opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="absolute w-16 h-16 rounded-full border-2 border-[#00aeef] z-10 pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 0, opacity: 0.4 }}
                  animate={{ scale: 9, opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.08 }}
                  className="absolute w-16 h-16 rounded-full border border-[#00aeef]/60 z-10 pointer-events-none"
                />
              </>
            )}

            {/* Elegant Minimal Logo Text */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={splashStep === 0 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="absolute flex flex-col items-center space-y-3 pointer-events-none text-center z-10"
            >
              <h1 className="text-4xl md:text-5xl font-black tracking-[0.2em] text-white leading-none pl-[0.2em]">
                AQUA<span className="text-[#00aeef]">TRACK</span>
              </h1>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#00aeef]/80">
                City of San Fernando Water District
              </p>
              {/* Thin branding line */}
              <div className="flex h-0.5 w-20 justify-center space-x-1 pt-1" aria-hidden="true">
                <span className="w-1/3 bg-[#001e66] rounded-full" />
                <span className="w-1/3 bg-[#00aeef] rounded-full" />
                <span className="w-1/3 bg-[#970006] rounded-full" />
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}

      <Navbar />

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

        {/* 3. Bottom Fade-to-Slate Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50/60 to-transparent pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto w-full z-10">
          
          {/* Centered Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto"
          >
            {/* Tagline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-[#001e66]">
              Clean Water, One <span className="bg-[#ffd800] px-2 py-0.5 rounded text-[#001e66]">Smart</span> <span className="text-[#970006]">Drop</span> at a Time.
            </h1>
            
            {/* Description */}
            <p className="text-base md:text-lg leading-relaxed text-[#001e66] font-medium max-w-2xl">
              Monitor water quality in real time, report issues instantly, and stay informed about your community's water conditions — all in one intelligent platform built for the City of San Fernando, Pampanga.
            </p>

            {/* Portal Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto justify-center">
              <Link
                href="/login"
                className="bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold text-center py-3.5 px-8 rounded-xl transition-all duration-200 shadow-md hover:scale-105 min-w-[200px]"
              >
                Sign In to Portal
              </Link>
              <Link
                href="/register"
                className="bg-white hover:bg-slate-50 text-[#00aeef] border-2 border-[#00aeef] font-extrabold text-center py-3 px-8 rounded-xl transition-all duration-200 hover:scale-105 min-w-[200px]"
              >
                Register Account
              </Link>
            </div>

            {/* Minimized Core Features Glass Card */}
            <div className="mt-8 px-6 py-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-full max-w-2xl">
              <FeatureItem 
                label="Real-Time Tracking" 
                color="bg-[#00aeef]" 
                description="Continuous pH, turbidity, TDS, and water pressure monitoring." 
              />
              <FeatureItem 
                label="AI Classification" 
                color="bg-[#ffd800]" 
                description="Translates & categorizes Tagalog or Kapampangan reports." 
              />
              <FeatureItem 
                label="Geospatial Pinning" 
                color="bg-[#970006]" 
                description="Reverse geocoding & closest-crew PostGIS dispatching." 
              />
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. Mission & Vision Section */}
      <section id="about" className="py-24 bg-slate-50 relative">
        {/* Floating Metrics Box (Seamlessly Overlapping Home and About Us) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 w-full max-w-5xl px-4 z-20">
          <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl shadow-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-slate-200/40">
            
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00aeef]">Strategic Compass</span>
            <h2 className="text-3xl font-extrabold mt-2 text-[#001e66]">Our Mission and Vision</h2>
            <p className="mt-4 text-slate-600 leading-relaxed text-sm">
              AquaTrack bridges the gap between resident observers and water system operators in Pampanga. By correlating real-time sensor node alerts with geolocated citizen feedback, we maintain optimal pressure systems and pure water delivery across San Fernando.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Mission Card */}
            <div className="bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-white/40 shadow-sm hover:border-[#00aeef]/60 hover:bg-white/70 transition-all duration-300">
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
            <div className="bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-white/40 shadow-sm hover:border-[#00aeef]/60 hover:bg-white/70 transition-all duration-300">
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
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex flex-col space-y-2 cursor-pointer ${
                      isActive 
                        ? "bg-[#001e66] border-[#001e66] text-white shadow-lg scale-[1.02]" 
                        : "bg-white/40 backdrop-blur-sm border border-white/50 text-[#001e66] hover:bg-white/70 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-extrabold text-sm md:text-base leading-snug flex items-center">
                        <svg className="w-5 h-5 text-[#00aeef] mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {office.name}
                      </span>
                      {isActive && (
                        <span className="bg-[#00aeef] text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
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
            <div className="lg:col-span-7 bg-white/50 backdrop-blur-md border border-white/50 rounded-3xl overflow-hidden shadow-sm min-h-[380px] lg:min-h-full flex flex-col">
              <div className="bg-white/30 px-5 py-3.5 border-b border-white/30 flex items-center justify-between text-xs font-bold text-[#001e66]">
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
              <div key={idx} className="bg-white/50 backdrop-blur-md p-5 rounded-xl border border-white/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            {advisories.length === 0 && (
              <div className="bg-white/40 backdrop-blur-md p-6 rounded-xl border border-white/30 shadow-sm text-center">
                <p className="text-slate-500 italic text-xs font-semibold">No active notices broadcasted.</p>
              </div>
            )}
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
