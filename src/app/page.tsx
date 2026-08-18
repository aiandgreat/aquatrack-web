"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Clock, 
  Users, 
  MapPin, 
  Compass, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  ShieldCheck,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Mail,
  Globe,
  FileText
} from "lucide-react";

function AnimatedCounter({ value, duration = 2000, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
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
      className="relative flex items-center space-x-2 cursor-help py-1 font-sans"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="hover:text-[#00aeef] dark:text-slate-350 dark:hover:text-[#00aeef] transition-colors font-semibold">{label}</span>

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
  const [splashStep, setSplashStep] = useState(hasPlayedSplash ? 2 : 0);

  useEffect(() => {
    if (hasPlayedSplash) return;

    const impactTimer = setTimeout(() => {
      setSplashStep(1);
    }, 500);

    const hideTimer = setTimeout(() => {
      setSplashStep(2);
      hasPlayedSplash = true;
    }, 1300);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setScrolled(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [advisories, setAdvisories] = useState<any[]>([]);
  const [advisoryIndex, setAdvisoryIndex] = useState(0);

  useEffect(() => {
    fetch("/api/advisories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const publicAdvisories = data.advisories.filter(
            (ad: any) => ad.targetRole === "broadcast" || !ad.targetRole
          );
          setAdvisories(publicAdvisories);
        }
      })
      .catch((err) => console.error("Failed to load public advisories:", err));
  }, []);

  useEffect(() => {
    if (advisories.length <= 1) return;
    const timer = setInterval(() => {
      setAdvisoryIndex((prev) => (prev + 1) % advisories.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [advisories.length]);

  const districtOffices = [
    {
      name: "CSFWD Main Office (Sto. Rosario)",
      address: "Consunji St, Santo Rosario, City of San Fernando, Pampanga, Philippines",
      phone: "(045) 961-3546",
      hours: "8:00 AM - 5:00 PM (Mon-Fri)",
      query: "City of San Fernando Water District, Consunji St, San Fernando, Pampanga, Philippines"
    },
    {
      name: "Saguin Sub-Office",
      address: "Fortune Square Bldg. (in front of Coke), Saguin, City of San Fernando, Pampanga",
      phone: "(045) 961-5804",
      hours: "8:00 AM - 5:00 PM (Mon-Fri)",
      query: "Fortune Square, Saguin, City of San Fernando, Pampanga, Philippines"
    },
    {
      name: "Sindalan Sub-Office",
      address: "Sindalan Payment Center, Brgy. Sindalan, City of San Fernando, Pampanga",
      phone: "0968-854-1343",
      hours: "8:00 AM - 3:00 PM (Mon-Fri)",
      query: "Sindalan Payment Center, Sindalan, City of San Fernando, Pampanga, Philippines"
    },
    {
      name: "Bulaon Sub-Office",
      address: "Bulaon Payment Center, Brgy. Bulaon, City of San Fernando, Pampanga",
      phone: "0933-814-6585",
      hours: "8:00 AM - 3:00 PM (Mon-Fri)",
      query: "Bulaon Payment Center, Bulaon, City of San Fernando, Pampanga, Philippines"
    },
    {
      name: "Teopaco Sub-Office",
      address: "P. Gomez St., Teopaco, City of San Fernando, Pampanga",
      phone: "(045) 961-3546",
      hours: "8:00 AM - 4:00 PM (Mon-Fri)",
      query: "Teopaco Sub-Office, P. Gomez St, City of San Fernando, Pampanga, Philippines"
    }
  ];

  const [activeOffice, setActiveOffice] = useState(districtOffices[0]);

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

  return (
    <div className="min-h-screen bg-white dark:bg-[#090d16] text-[#001e66] dark:text-slate-100 font-sans flex flex-col transition-colors duration-300">
      
      {/* Cinematic 3D Water Drop Splash Screen */}
      {splashStep < 2 && (
        <motion.div 
          initial={{ opacity: 1 }}
          animate={splashStep === 1 ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
          className="fixed inset-0 z-[9999] bg-[#001e66] flex items-center justify-center overflow-hidden"
          style={{ pointerEvents: splashStep === 1 ? "none" : "auto", willChange: "opacity", perspective: "1200px" }}
        >
          <div className="relative flex items-center justify-center w-full h-full" style={{ transformStyle: "preserve-3d" }}>
            
            <motion.img 
              initial={{ scale: 1.1, translateZ: "-150px", rotate: 0 }}
              animate={
                splashStep === 1 
                  ? { scale: 1.25, translateZ: "-100px", opacity: 0.08 } 
                  : { scale: 1.1, translateZ: "-150px", rotate: 360 }
              }
              transition={
                splashStep === 1
                  ? { duration: 1.2, ease: "easeOut" }
                  : { rotate: { repeat: Infinity, duration: 140, ease: "linear" }, default: { duration: 0.5 } }
              }
              src="/san_fernando_map.jpg" 
              alt="San Fernando Map Background" 
              className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none mix-blend-overlay"
            />

            <motion.div 
              className="absolute inset-0 pointer-events-none opacity-30" 
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: [0, 360], rotateX: [15, -15, 15] }}
              transition={{ 
                rotateY: { repeat: Infinity, duration: 30, ease: "linear" },
                rotateX: { repeat: Infinity, duration: 15, ease: "easeInOut" }
              }}
            >
              <div className="absolute top-[20%] left-[30%] w-2.5 h-2.5 bg-[#00aeef] rounded-full blur-xs animate-pulse" style={{ transform: "translateZ(-80px)" }} />
              <div className="absolute top-[60%] left-[70%] w-1.5 h-1.5 bg-[#00aeef] rounded-full blur-xxs" style={{ transform: "translateZ(-40px)" }} />
              <div className="absolute top-[40%] left-[80%] w-2 h-2 bg-[#00aeef] rounded-full blur-xs animate-ping" style={{ transform: "translateZ(-110px)" }} />
              <div className="absolute top-[75%] left-[20%] w-2 h-2 bg-[#00aeef]/60 rounded-full blur-xxs" style={{ transform: "translateZ(-60px)" }} />
              <div className="absolute top-[15%] left-[65%] w-1.5 h-1.5 bg-[#00aeef]/80 rounded-full blur-xs" style={{ transform: "translateZ(-100px)" }} />
            </motion.div>

            {splashStep === 0 && (
              <motion.div
                initial={{ scale: 2, opacity: 0.1 }}
                animate={{ scale: 0.5, opacity: 0.6 }}
                transition={{ duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute w-12 h-6 bg-black/40 rounded-full blur-md pointer-events-none"
                style={{ 
                  transform: "rotateX(75deg) translateY(120px) translateZ(-50px)",
                  willChange: "transform, opacity" 
                }}
              />
            )}

            {splashStep === 0 && (
              <motion.div
                initial={{ y: -450, scale: 0.6, opacity: 0, rotateX: -20 }}
                animate={{ y: 0, scale: 1, opacity: 1, rotateX: 0 }}
                transition={{ duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-[#00aeef] z-20"
                style={{ 
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                  transform: "translateZ(50px)"
                }}
              >
                <svg className="w-14 h-14 fill-current drop-shadow-[0_15px_20px_rgba(0,174,239,0.5)]" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="drop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="30%" stopColor="#00aeef" />
                      <stop offset="100%" stopColor="#005b8c" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="url(#drop-grad)" />
                </svg>
              </motion.div>
            )}

            {splashStep === 1 && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 14, opacity: 0 }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-[#00aeef] to-[#005b8c]/50 z-20 pointer-events-none"
                style={{ 
                  transform: "rotateX(75deg) translateZ(-40px)",
                  willChange: "transform, opacity" 
                }}
              />
            )}

            {splashStep === 1 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transformStyle: "preserve-3d" }}>
                <motion.div
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 5.5, opacity: 0 }}
                  transition={{ duration: 0.75, ease: "easeOut" }}
                  className="absolute w-24 h-24 rounded-full border-[3px] border-[#00aeef] shadow-[0_0_15px_rgba(0,174,239,0.3)] z-10"
                  style={{ 
                    transform: "rotateX(75deg) translateZ(-40px)",
                    willChange: "transform, opacity" 
                  }}
                />
                <motion.div
                  initial={{ scale: 0, opacity: 0.6 }}
                  animate={{ scale: 8.5, opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.08 }}
                  className="absolute w-24 h-24 rounded-full border-2 border-[#00aeef]/60 shadow-[0_0_25px_rgba(0,174,239,0.2)] z-10"
                  style={{ 
                    transform: "rotateX(75deg) translateZ(-40px)",
                    willChange: "transform, opacity" 
                  }}
                />
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.9, translateZ: "100px", rotateX: 15, rotateY: 0 }}
              animate={
                splashStep === 0 
                  ? { 
                      opacity: 1, 
                      scale: 1, 
                      rotateX: [0, 6, 0, -6, 0],
                      rotateY: [0, -10, 0, 10, 0],
                      y: [0, -5, 0, 5, 0],
                      x: [0, 5, 0, -5, 0],
                      translateZ: "100px"
                    } 
                  : { 
                      opacity: 0, 
                      scale: 1.05, 
                      translateZ: "180px", 
                      rotateX: -5,
                      rotateY: 0,
                      y: 0,
                      x: 0
                    }
              }
              transition={
                splashStep === 0
                  ? {
                      opacity: { duration: 0.5, ease: "easeOut" },
                      scale: { duration: 0.5, ease: "easeOut" },
                      rotateX: { repeat: Infinity, duration: 8, ease: "easeInOut" },
                      rotateY: { repeat: Infinity, duration: 10, ease: "easeInOut" },
                      y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
                      x: { repeat: Infinity, duration: 7, ease: "easeInOut" }
                    }
                  : { duration: 0.5, ease: "easeOut" }
              }
              className="absolute flex flex-col items-center pointer-events-none text-center z-10"
              style={{ 
                willChange: "transform, opacity",
                transformStyle: "preserve-3d"
              }}
            >
              <img 
                src="/LOGO3.png" 
                alt="AquaTrack Logo" 
                className="h-64 md:h-80 w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,174,239,0.35)]"
                style={{ transform: "translateZ(30px)" }}
              />
              <p 
                className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#00aeef] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] -mt-3 md:-mt-4 font-sans"
                style={{ transform: "translateZ(10px)" }}
              >
                City of San Fernando Water District
              </p>
            </motion.div>

          </div>
        </motion.div>
      )}
      
      <Navbar />

      {/* Hero Header Section */}
      <section
        id="home"
        className="relative py-24 md:py-36 px-4 flex items-center min-h-[550px] bg-slate-50 dark:bg-[#090d16] overflow-hidden transition-colors duration-300"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 mix-blend-multiply dark:mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "url('https://greenempowerment.org/wp-content/uploads/2020/09/kids-water.jpg')" }}
        ></div>

        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/35 to-white/0 dark:from-[#090d16] dark:via-[#090d16]/30 dark:to-[#090d16]/0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50/60 to-transparent dark:from-[#090d16] dark:to-transparent pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto w-full z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none pb-2 select-none bg-gradient-to-r from-[#001e66] via-[#00aeef] to-[#001e66] dark:from-white dark:via-[#00aeef] dark:to-white bg-[length:200%_auto] animate-[waterflow_4s_linear_infinite] bg-clip-text text-transparent">
              Clean Water, One Smart{" "}
              <span className="relative inline-block px-2.5 py-0.5">
                Drop
                <motion.span 
                  className="absolute inset-x-[3px] inset-y-[4px] pointer-events-none z-10 flex items-center justify-center origin-bottom"
                  initial={{ y: -160, scaleY: 2.5, scaleX: 0.3, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    scaleY: [2.5, 0.4, 1.25, 0.9, 1], 
                    scaleX: [0.3, 1.6, 0.8, 1.15, 1], 
                    opacity: 1 
                  }}
                  transition={{ 
                    duration: 1.1, 
                    ease: [0.25, 1, 0.5, 1], 
                    delay: 0.8 
                  }}
                >
                  <motion.span
                    className="absolute inset-0 border border-[#00aeef]/40 dark:border-[#00aeef]/50"
                    style={{
                      borderRadius: "35% 65% 65% 35% / 40% 40% 60% 60%",
                      background: "radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.45) 0%, rgba(0, 174, 239, 0.12) 55%, rgba(0, 30, 102, 0.18) 100%)",
                      boxShadow: "inset -3px -3px 6px rgba(255, 255, 255, 0.95), inset 2px 2px 5px rgba(0, 30, 102, 0.25), 0 4px 12px rgba(0, 174, 239, 0.35), 0 1px 3px rgba(0, 0, 0, 0.15)",
                    }}
                    animate={{
                      borderRadius: [
                        "35% 65% 65% 35% / 40% 40% 60% 60%",
                        "42% 58% 55% 45% / 45% 38% 62% 55%",
                        "35% 65% 65% 35% / 40% 40% 60% 60%"
                      ]
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <span className="absolute w-1.5 h-1.5 rounded-full bg-[#ffffff] opacity-95" style={{ top: "12%", left: "15%" }} />
                    <span className="absolute w-1 h-1 rounded-full bg-[#ffffff] opacity-50" style={{ bottom: "16%", right: "20%" }} />
                  </motion.span>
                </motion.span>
              </span>{" "}
              at a{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ffd800] via-[#ef4444] to-[#ef4444] via-[40%] inline-block align-baseline font-black">
                Time.
              </span>
            </h1>
            
            <p className="text-base md:text-lg leading-relaxed text-[#001e66] dark:text-slate-350 font-medium max-w-2xl">
              Monitor water quality in real time, report issues instantly, and stay informed about your community's water conditions — all in one intelligent platform built for the City of San Fernando, Pampanga.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto justify-center">
              <Link
                href="/login"
                className="bg-[#001e66] dark:bg-[#00aeef] hover:bg-[#00aeef] dark:hover:bg-[#00aeef]/90 text-white dark:text-[#001e66] font-extrabold text-center py-3.5 px-8 rounded-xl transition-all duration-200 shadow-md dark:shadow-[0_4px_12px_rgba(0,174,239,0.15)] dark:hover:shadow-[0_4px_20px_rgba(0,174,239,0.25)] hover:scale-105 min-w-[200px]"
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

            {/* Core Features Cards */}
            <div className="mt-8 px-6 py-4 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md dark:backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm dark:shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-full max-w-2xl">
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

      {/* About Section */}
      <section id="about" className="py-24 bg-[#f1f5f9] dark:bg-[#07142F] relative transition-colors duration-300">
        
        {/* Realistic CSS Water Droplets */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          <div className="absolute realistic-droplet" style={{ width: "48px", height: "48px", top: "15%", left: "8%", borderRadius: "45% 55% 50% 50% / 45% 45% 55% 55%" }}>
            <div className="absolute rounded-full bg-[#ffffff] opacity-90" style={{ width: "9px", height: "9px", top: "18%", left: "18%" }} />
            <div className="absolute rounded-full bg-[#ffffff] opacity-40" style={{ width: "4px", height: "4px", bottom: "18%", right: "22%" }} />
          </div>
          <div className="absolute realistic-droplet" style={{ width: "36px", height: "36px", top: "22%", right: "12%", borderRadius: "50% 50% 45% 55% / 55% 45% 55% 45%" }}>
            <div className="absolute rounded-full bg-[#ffffff] opacity-90" style={{ width: "7px", height: "7px", top: "18%", left: "18%" }} />
            <div className="absolute rounded-full bg-[#ffffff] opacity-40" style={{ width: "3px", height: "3px", bottom: "18%", right: "22%" }} />
          </div>
          <div className="absolute realistic-droplet" style={{ width: "56px", height: "56px", top: "55%", right: "6%", borderRadius: "42% 58% 54% 46% / 48% 42% 58% 52%" }}>
            <div className="absolute rounded-full bg-[#ffffff] opacity-90" style={{ width: "11px", height: "11px", top: "18%", left: "18%" }} />
            <div className="absolute rounded-full bg-[#ffffff] opacity-40" style={{ width: "5px", height: "5px", bottom: "18%", right: "22%" }} />
          </div>
          <div className="absolute realistic-droplet" style={{ width: "28px", height: "28px", bottom: "20%", left: "14%", borderRadius: "48% 52% 52% 48% / 46% 47% 53% 54%" }}>
            <div className="absolute rounded-full bg-[#ffffff] opacity-90" style={{ width: "5px", height: "5px", top: "18%", left: "18%" }} />
          </div>
        </div>

        {/* Floating Metrics Box */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 w-full max-w-5xl px-4 z-20">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md dark:backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-[0_15px_35px_rgba(0,0,0,0.4)] p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-slate-200/40 dark:divide-white/10">
            
            {/* Metric 1 */}
            <div className="flex items-center space-x-5 md:px-4 group cursor-pointer transition-transform duration-300 hover:-translate-y-1 text-left">
              <div className="w-14 h-14 rounded-2xl bg-[#00aeef]/10 flex items-center justify-center text-[#00aeef] transition-colors group-hover:bg-[#00aeef]/20 shrink-0">
                <Clock className="w-6.5 h-6.5 shrink-0" />
              </div>
              <div>
                <p className="text-3xl font-black text-[#001e66] dark:text-slate-100 tracking-tight">
                  <AnimatedCounter value={5} suffix=" Years" />
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Years of Service</p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="flex items-center space-x-5 md:pl-8 md:pr-4 group cursor-pointer transition-transform duration-300 hover:-translate-y-1 text-left">
              <div className="w-14 h-14 rounded-2xl bg-[#ffd800]/15 flex items-center justify-center text-[#ffd800] dark:text-amber-450 transition-colors group-hover:bg-[#ffd800]/30 shrink-0">
                <Users className="w-6.5 h-6.5 shrink-0" />
              </div>
              <div>
                <p className="text-3xl font-black text-[#001e66] dark:text-slate-100 tracking-tight">
                  <AnimatedCounter value={250000} suffix="+" />
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Consumers Subscribed</p>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="flex items-center space-x-5 md:pl-8 group cursor-pointer transition-transform duration-300 hover:-translate-y-1 text-left">
              <div className="w-14 h-14 rounded-2xl bg-[#970006]/10 flex items-center justify-center text-[#970006] dark:text-red-400 transition-colors group-hover:bg-[#970006]/20 shrink-0">
                <MapPin className="w-6.5 h-6.5 shrink-0" />
              </div>
              <div>
                <p className="text-3xl font-black text-[#001e66] dark:text-slate-100 tracking-tight">
                  <AnimatedCounter value={35} />
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Barangays Served</p>
              </div>
            </div>

          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00aeef]">Strategic Compass</span>
            <h2 className="text-3xl font-extrabold mt-2 text-[#001e66] dark:text-slate-105">Our Mission and Vision</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              AquaTrack bridges the gap between resident observers and water system operators in Pampanga. By correlating real-time sensor node alerts with geolocated citizen feedback, we maintain optimal pressure systems and pure water delivery across San Fernando.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Mission Card */}
            <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md dark:backdrop-blur-xl p-8 rounded-3xl border border-white/40 dark:border-white/10 shadow-sm dark:shadow-md hover:border-[#00aeef]/60 dark:hover:border-[#00aeef]/40 hover:bg-white/70 dark:hover:bg-slate-900/70 transition-all duration-300 text-left">
              <div className="w-12 h-12 bg-[#00aeef]/10 rounded-xl flex items-center justify-center text-[#00aeef] mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#001e66] dark:text-slate-100">Our Mission</h3>
              <p className="text-sm text-slate-650 dark:text-slate-400 mt-3 leading-relaxed">
                To deliver uninterrupted, clean, and safe water services to the residents of San Fernando by integrating cutting-edge IoT telemetry and automated AI triage classification, making public complaints actionable in real time.
              </p>
            </div>

            {/* Vision Card */}
            <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md dark:backdrop-blur-xl p-8 rounded-3xl border border-white/40 dark:border-white/10 shadow-sm dark:shadow-md hover:border-[#00aeef]/60 dark:hover:border-[#00aeef]/40 hover:bg-white/70 dark:hover:bg-slate-900/70 transition-all duration-300 text-left">
              <div className="w-12 h-12 bg-[#ffd800]/10 rounded-xl flex items-center justify-center text-[#ffd800] mb-6 border border-[#ffd800]/20">
                <Eye className="w-6 h-6 text-[#ffd800] dark:text-[#ffd800]" />
              </div>
              <h3 className="text-xl font-extrabold text-[#001e66] dark:text-slate-100">Our Vision</h3>
              <p className="text-sm text-slate-650 dark:text-slate-400 mt-3 leading-relaxed">
                To establish the City of San Fernando as a leading smart water municipality in the Philippines, leveraging spatial analytics and digital pipelines to achieve zero water wastage and instant responsive sanitation.
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-[#07142F] to-[#f1f5f9]/0 dark:to-[#07142F]/0 pointer-events-none z-10" />
      </section>

      {/* Offices Section */}
      <div className="relative overflow-hidden bg-white dark:bg-[#07142F] transition-colors duration-300">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 dark:opacity-10 pointer-events-none"
          style={{ backgroundImage: "url('/BG.jpg')" }}
        />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white dark:from-[#07142F] to-transparent pointer-events-none z-10" />

        <section id="offices" className="py-24 relative z-10 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-[#00aeef]">Customer Care</span>
              <h2 className="text-3xl font-black mt-2 text-[#001e66] dark:text-white">Local District Offices</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Find and locate the main office of the City of San Fernando Water District (CSFWD) and our satellite payment branches. Select any office to update the interactive map.
              </p>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-[32px] p-6 md:p-8 shadow-xl max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Left Column: Office Selector List */}
                <div className="lg:col-span-5 flex flex-col space-y-4">
                  {districtOffices.map((office, idx) => {
                    const isActive = activeOffice.name === office.name;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveOffice(office)}
                        className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex flex-col space-y-2 cursor-pointer group ${
                          isActive 
                            ? "bg-[#001e66] dark:bg-[#00aeef] border-[#001e66] dark:border-[#00aeef] text-white dark:text-[#001e66] shadow-lg dark:shadow-[0_4px_12px_rgba(0,174,239,0.1)] scale-[1.02]" 
                            : "bg-white/40 dark:bg-white/5 backdrop-blur-sm dark:backdrop-blur-md border border-white/50 dark:border-white/10 text-[#001e66] dark:text-slate-350 hover:bg-white/70 dark:hover:bg-white/10 hover:border-slate-200 dark:hover:border-[#00aeef]/40"
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="font-extrabold text-sm md:text-base leading-snug flex items-center">
                            <MapPin className={`w-5 h-5 mr-2 shrink-0 ${isActive ? "text-white dark:text-[#001e66]" : "text-[#00aeef]"}`} />
                            {office.name}
                          </span>
                          {isActive && (
                            <span className="bg-[#00aeef] text-white dark:text-[#001e66] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 border border-[#00aeef]/30">
                              Active Map
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isActive ? "text-slate-200 dark:text-[#001e66]/90" : "text-slate-600 dark:text-slate-400"} leading-relaxed`}>
                          {office.address}
                        </p>
                        <div className="flex items-center space-x-4 pt-1 text-[11px] font-bold">
                          <span className="flex items-center space-x-1">
                            <span>📞</span>
                            <span className={isActive ? "text-slate-300 dark:text-[#001e66]/80" : "text-slate-500 dark:text-slate-400"}>{office.phone}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>🕒</span>
                            <span className={isActive ? "text-slate-300 dark:text-[#001e66]/80" : "text-slate-500 dark:text-slate-400"}>{office.hours}</span>
                          </span>
                        </div>

                        {/* Expandable Satellite Preview Image Drawer on Hover */}
                        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                          <div className="w-full overflow-hidden transition-all duration-500 ease-out max-h-0 group-hover:max-h-[140px] rounded-xl border border-white/20 dark:border-white/10 shadow-inner relative mt-0 group-hover:mt-3">
                            <div className="absolute inset-0 bg-[#001e66]/10 dark:bg-[#00aeef]/10 animate-pulse pointer-events-none" />
                            <img
                              src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(office.query)}&zoom=18&size=450x160&maptype=hybrid&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                              alt={`${office.name} Satellite View`}
                              className="w-full h-[140px] object-cover relative z-10 transition-transform duration-700 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute bottom-2 right-2 z-20 bg-black/60 text-[9px] text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
                              🛰️ Satellite Preview
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: Google Maps API Integration Map View */}
                <div className="lg:col-span-7 bg-white/50 dark:bg-white/5 backdrop-blur-md dark:backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm min-h-[380px] lg:min-h-full flex flex-col">
                  <div className="bg-white/30 dark:bg-white/5 px-5 py-3.5 border-b border-white/30 dark:border-white/10 flex items-center justify-between text-xs font-bold text-[#001e66] dark:text-slate-350">
                    <span className="flex items-center space-x-2">
                      <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-[#00aeef]"></span>
                      <span>Google Maps Live API View</span>
                    </span>
                    <span className="text-[#00aeef]">{activeOffice.name}</span>
                  </div>
                  <div className="flex-1 relative dark:invert-[90%] dark:hue-rotate-[180deg] dark:brightness-[90%] dark:contrast-[110%]">
                    <iframe
                      title="CSFWD Office Google Map Location"
                      width="100%"
                      height="100%"
                      style={{ border: 0, minHeight: "420px" }}
                      loading="lazy"
                      allowFullScreen
                      src={
                        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                          ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(activeOffice.query)}`
                          : `https://maps.google.com/maps?q=${encodeURIComponent(activeOffice.query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
                      }
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[#f8fafc]/60 to-[#f8fafc] dark:via-[#07142F]/60 dark:to-[#07142F] pointer-events-none z-20" />
        </section>

        {/* Advisories Section */}
        <section
          id="announcements"
          className="pt-20 pb-8 relative z-10 overflow-hidden"
          style={{ backgroundImage: "url('/community.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] via-white/85 to-white/95 dark:from-[#07142F] dark:via-[#010f2e]/85 dark:to-[#010f2e]/95 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-[#970006] dark:text-red-400">Stay Safe &amp; Alert</span>
              <h2 className="text-3xl font-extrabold mt-2 text-[#001e66] dark:text-white">Community Advisories</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm font-medium">Active notifications dispatched from our operational console</p>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-[32px] p-6 md:p-8 shadow-xl max-w-6xl mx-auto">
              {advisories.length > 0 ? (
                <div className="relative w-full px-1 md:px-6 flex flex-col items-center">
                  
                  {/* Carousel Controls */}
                  <div className="w-full flex items-center justify-between gap-4">
                    {advisories.length > 1 && (
                      <button 
                        onClick={() => setAdvisoryIndex((prev) => (prev - 1 + advisories.length) % advisories.length)}
                        className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-450 dark:text-slate-400 hover:text-[#001e66] dark:hover:text-slate-100 hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200 shrink-0 cursor-pointer shadow-sm active:scale-95 select-none"
                        title="Previous Advisory"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}

                    {/* Center Card */}
                    <div className="flex-1 min-h-[320px] flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={advisoryIndex}
                          initial={{ opacity: 0, scale: 0.98, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98, y: -4 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md rounded-2xl p-8 md:p-10 relative overflow-hidden w-full text-left h-[320px] flex flex-col justify-between"
                        >
                          <div className={`absolute top-0 left-0 right-0 h-[4px] ${
                            advisories[advisoryIndex].type === "warning"
                              ? "bg-red-500"
                              : "bg-[#00aeef]"
                          }`} />

                          <div className="flex items-center justify-between gap-4 shrink-0">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              advisories[advisoryIndex].type === "warning"
                                ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30"
                                : "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                advisories[advisoryIndex].type === "warning" ? "bg-red-500 animate-pulse" : "bg-sky-500"
                              }`} />
                              {advisories[advisoryIndex].type}
                            </span>

                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{advisories[advisoryIndex].date}</span>
                            </span>
                          </div>

                          <div className="flex-1 overflow-y-auto mt-5 pr-1 text-left scrollbar-thin">
                            <h4 className="font-extrabold text-lg md:text-xl text-[#001e66] dark:text-slate-100 tracking-tight leading-snug">
                              {advisories[advisoryIndex].title}
                            </h4>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
                              {advisories[advisoryIndex].text}
                            </p>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {advisories.length > 1 && (
                      <button 
                        onClick={() => setAdvisoryIndex((prev) => (prev + 1) % advisories.length)}
                        className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-450 dark:text-slate-400 hover:text-[#001e66] dark:hover:text-slate-100 hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200 shrink-0 cursor-pointer shadow-sm active:scale-95 select-none"
                        title="Next Advisory"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {advisories.length > 1 && (
                    <div className="flex justify-center space-x-2 mt-6">
                      {advisories.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setAdvisoryIndex(idx)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            idx === advisoryIndex ? "w-6 bg-[#001e66] dark:bg-[#00aeef]" : "w-2 bg-slate-300 dark:bg-slate-800 hover:bg-slate-400"
                          }`}
                          title={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-white/40 dark:bg-slate-950/20 backdrop-blur-md p-6 rounded-xl border border-white/30 dark:border-slate-850 shadow-sm text-center max-w-xl mx-auto">
                  <p className="text-slate-500 dark:text-slate-400 italic text-xs font-semibold">No active notices broadcasted.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
