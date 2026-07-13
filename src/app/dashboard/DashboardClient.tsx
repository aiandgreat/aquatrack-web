"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getSupabaseClient, uploadComplaintPhoto } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Complaint {
  id: string;
  rawText: string;
  summary: string;
  latitude: number;
  longitude: number;
  urgency: string;
  category: string;
  status?: string;
  createdAt?: string;
  barangay?: string;
}

interface Advisory {
  id: string;
  date: string;
  title: string;
  text: string;
  type: "warning" | "info" | "news" | "event";
  targetRole?: "broadcast" | "consumers" | "technicians";
}

interface DashboardClientProps {
  initialNodes: any[];
  initialComplaints: Complaint[];
  initialReadings: any;
}

export default function DashboardClient({
  initialNodes,
  initialComplaints,
  initialReadings,
}: DashboardClientProps) {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Active View Tab: (Strictly matching user requests)
  const [activeTab, setActiveTab] = useState<
    "home" | "file-complaint" | "track-complaint" | "view-announcements" | "contact-us"
  >("home");

  // Local state
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const initialDark = document.documentElement.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    setIsDark(initialDark);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const [myComplaints, setMyComplaints] = useState<Complaint[]>(initialComplaints);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);

  // Form Submission State
  const [complaintText, setComplaintText] = useState("");
  const [detectedBarangay, setDetectedBarangay] = useState<string | null>(null);
  const [detectedDistanceM, setDetectedDistanceM] = useState<number | null>(null);
  const [barangayLoading, setBarangayLoading] = useState(false);
  const [customLat, setCustomLat] = useState("15.0285");
  const [customLng, setCustomLng] = useState("120.6942");
  const [complaintImageUrl, setComplaintImageUrl] = useState("");
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [mapError, setMapError] = useState(false);
  const [lastSubmittedComplaint, setLastSubmittedComplaint] = useState<any | null>(null);

  const clientMapContainerRef = useRef<HTMLDivElement>(null);
  const clientMapRef = useRef<mapboxgl.Map | null>(null);
  const clientMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userHasManuallyPinnedRef = useRef(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gpsPinpointActive, setGpsPinpointActive] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setSubmitError(null);
    try {
      const publicUrl = await uploadComplaintPhoto(file);
      setComplaintImageUrl(publicUrl);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Request user's exact geolocation GPS coordinates on mount and watch for improvements
  useEffect(() => {
    let watchId: number | null = null;

    if (typeof window !== "undefined" && navigator.geolocation) {
      // Immediate quick positioning
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setCustomLat(lat);
          setCustomLng(lng);
          setGpsAccuracy(position.coords.accuracy);
          setGpsPinpointActive(true);
        },
        (error) => {
          console.warn("Initial GPS lookup failed, seeking watch updates:", error);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );

      // Continuous tracking to refine accuracy
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (userHasManuallyPinnedRef.current) return;
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setCustomLat(lat);
          setCustomLng(lng);
          setGpsAccuracy(position.coords.accuracy);
          setGpsPinpointActive(true);
        },
        (error) => {
          console.warn("GPS tracking refinement failed:", error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId !== null && typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Initialize and clean up Mapbox map for client report pinning
  useEffect(() => {
    if (activeTab !== "file-complaint") return;

    let mapLoadTimeout: NodeJS.Timeout | null = null;

    const timer = setTimeout(() => {
      if (!clientMapContainerRef.current) return;

      const lat = parseFloat(customLat) || 15.0285;
      const lng = parseFloat(customLng) || 120.6942;
      setMapError(false);

      const map = new mapboxgl.Map({
        container: clientMapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: gpsPinpointActive ? 17 : 15.5,
      });

      let loaded = false;
      map.on("load", () => {
        loaded = true;
        setMapError(false);
      });
      map.on("style.load", () => {
        loaded = true;
        setMapError(false);
      });

      map.on("error", (e) => {
        console.warn("Mapbox non-fatal warning:", e.error?.message || "Unknown error");
      });

      // 10-second timeout allows slow hotspot connections to load but catches true firewall blocks
      mapLoadTimeout = setTimeout(() => {
        if (!loaded) {
          console.warn("Mapbox load timed out (firewall block suspected)");
          setMapError(true);
        }
      }, 10000);

      clientMapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      const marker = new mapboxgl.Marker({ draggable: true, color: "#e11d48" })
        .setLngLat([lng, lat])
        .addTo(map);

      clientMarkerRef.current = marker;

      // Center camera immediately if GPS coordinates have been fetched
      if (gpsPinpointActive) {
        map.easeTo({ center: [lng, lat], zoom: 17 });
      }

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        userHasManuallyPinnedRef.current = true;
        setCustomLat(lngLat.lat.toFixed(6));
        setCustomLng(lngLat.lng.toFixed(6));
        setGpsPinpointActive(true);
      });

      map.on("click", (e) => {
        marker.setLngLat(e.lngLat);
        userHasManuallyPinnedRef.current = true;
        setCustomLat(e.lngLat.lat.toFixed(6));
        setCustomLng(e.lngLat.lng.toFixed(6));
        setGpsPinpointActive(true);
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      if (mapLoadTimeout) clearTimeout(mapLoadTimeout);
      if (clientMapRef.current) {
        clientMapRef.current.remove();
        clientMapRef.current = null;
        clientMarkerRef.current = null;
      }
    };
  }, [activeTab, loading]);

  // Sync GPS changes to map marker
  useEffect(() => {
    const map = clientMapRef.current;
    const marker = clientMarkerRef.current;
    if (map && marker) {
      const lat = parseFloat(customLat);
      const lng = parseFloat(customLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        const currentLngLat = marker.getLngLat();
        const diffLat = Math.abs(currentLngLat.lat - lat);
        const diffLng = Math.abs(currentLngLat.lng - lng);
        if (diffLat > 0.0001 || diffLng > 0.0001) {
          marker.setLngLat([lng, lat]);
          map.easeTo({ center: [lng, lat], zoom: 17 });
        }
      }
    }
  }, [customLat, customLng]);

  // Auto-detect barangay from GPS coordinates via PostGIS nearest-neighbor API
  useEffect(() => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) return;

    setBarangayLoading(true);
    fetch("/api/locate-barangay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.barangay) {
          setDetectedBarangay(data.barangay);
          setDetectedDistanceM(data.distanceMeters);
        } else {
          setDetectedBarangay(null);
          setDetectedDistanceM(null);
        }
      })
      .catch((err) => console.error("Barangay detect failed:", err))
      .finally(() => setBarangayLoading(false));
  }, [customLat, customLng]);

  // Gemini AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<{
    urgency: string;
    category: string;
    translatedText: string;
    summary: string;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Verification & Auth Setup
  useEffect(() => {
    const checkRole = async () => {
      try {
        const client = getSupabaseClient();
        const { data: { session: currentSession } } = await client.auth.getSession();

        if (!currentSession) {
          window.location.href = "/login";
          return;
        }

        setSession(currentSession);

        // Fetch profile
        const res = await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentSession.user.id }),
        });
        const profile = await res.json();

        if (profile?.role === "ADMIN") {
          window.location.href = "/admin";
          return;
        } else if (profile?.role === "FIELD_ENGINEER_TECHNICIAN") {
          window.location.href = "/crew";
          return;
        }

        setUserProfile({
          id: currentSession.user.id,
          name: profile?.name || "Resident",
          email: currentSession.user.email || "",
          role: profile?.role || "CONSUMER_RESIDENT",
        });

        // Load complaints and advisories databases
        await Promise.all([fetchUserComplaints(currentSession.user.id), fetchAdvisories()]);
      } catch (err) {
        console.error("Auth routing failure", err);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, []);

  // Enable Supabase Realtime subscriptions for complaint changes
  useEffect(() => {
    if (!userProfile) return;

    try {
      const client = getSupabaseClient();
      const channel = client
        .channel("client-complaints-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Complaint" },
          (payload) => {
            console.log("Realtime complaint update received for resident:", payload);
            fetchUserComplaints(); // Refresh the list dynamically!
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (err) {
      console.error("Failed to setup realtime complaints subscription:", err);
    }
  }, [userProfile]);

  const fetchUserComplaints = async (uid?: string) => {
    try {
      const targetUid = uid || userProfile?.id;
      const url = "/api/admin/complaints" + (targetUid ? `?userId=${targetUid}` : "");
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMyComplaints(data.complaints);
      }
    } catch (err) {
      console.error("Failed to fetch complaints list", err);
    }
  };

  const fetchAdvisories = async () => {
    try {
      const res = await fetch("/api/advisories");
      const data = await res.json();
      if (data.success) {
        setAdvisories(data.advisories);
      }
    } catch (err) {
      console.error("Failed to fetch advisories list", err);
    }
  };

  const runLocalTriageFallback = (text: string) => {
    const lower = text.toLowerCase();
    let urgency = "MEDIUM";
    let category = "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY";
    let summary = "Resident reported water quality concern.";

    if (lower.includes("pressure") || lower.includes("mahina") || lower.includes("tulo") || lower.includes("drop") || lower.includes("leak") || lower.includes("breach") || lower.includes("bawas")) {
      urgency = "URGENT";
      category = "PIPELINE_BREACH_PRESSURE_DROP";
      summary = "Low water flow and pressure anomalies detected in local supply lines.";
    } else if (lower.includes("dirty") || lower.includes("dumi") || lower.includes("dilaw") || lower.includes("turbid") || lower.includes("sediment")) {
      urgency = "URGENT";
      category = "HIGH_TURBIDITY";
      summary = "High turbidity and suspended sediment in resident supply line.";
    } else if (lower.includes("acid") || lower.includes("amoy") || lower.includes("poison") || lower.includes("lason") || lower.includes("contaminat")) {
      urgency = "URGENT";
      category = "CHEMICAL_DISCOLORATION_CONTAMINATION";
      summary = "Suspected chemical contamination or biological containment breach.";
    }

    return {
      urgency,
      category,
      translatedText: text,
      summary
    };
  };

  const handleRequestLocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      const consent = window.confirm(
        "AquaTrack Privacy Policy:\n\n" +
        "AquaTrack uses your location only to identify where the reported water issue occurred. " +
        "Your location will be attached to this complaint and shared only with authorized personnel.\n\n" +
        "Do you want to proceed and allow location access?"
      );
      if (!consent) return;

      userHasManuallyPinnedRef.current = false;
      setBarangayLoading(true);

      const getLowAccuracyPosition = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            setCustomLat(lat);
            setCustomLng(lng);
            setGpsAccuracy(position.coords.accuracy);
            setGpsPinpointActive(true);
            setBarangayLoading(false);
          },
          (lowError) => {
            console.error("Low-accuracy GPS fallback also failed:", lowError);
            alert("Could not access device location. Please ensure location services are enabled and permissions are granted in your browser.");
            setGpsPinpointActive(false);
            setBarangayLoading(false);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setCustomLat(lat);
          setCustomLng(lng);
          setGpsAccuracy(position.coords.accuracy);
          setGpsPinpointActive(true);
          setBarangayLoading(false);
        },
        (error) => {
          console.warn("High-accuracy GPS request failed, retrying with low-accuracy fallback:", error);
          if (error.code === error.PERMISSION_DENIED) {
            alert("Location access was denied. Please allow location permissions in your browser settings to pinpoint your complaint.");
            setGpsPinpointActive(false);
            setBarangayLoading(false);
          } else {
            getLowAccuracyPosition();
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleAddressSearch = async () => {
    if (!addressSearchQuery.trim()) return;
    userHasManuallyPinnedRef.current = true;
    setBarangayLoading(true);
    try {
      const fullQuery = `${addressSearchQuery}, Pampanga, Philippines`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&limit=1`,
        {
          headers: { "User-Agent": "AquaTrack-CSFWD/1.0 (aquatrack@csfwd.gov.ph)" },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const matched = data[0];
          const lat = parseFloat(matched.lat).toFixed(6);
          const lng = parseFloat(matched.lon).toFixed(6);
          setCustomLat(lat);
          setCustomLng(lng);
          setGpsPinpointActive(true);
          
          const map = clientMapRef.current;
          const marker = clientMarkerRef.current;
          if (map && marker) {
            marker.setLngLat([parseFloat(lng), parseFloat(lat)]);
            map.easeTo({ center: [parseFloat(lng), parseFloat(lat)], zoom: 17 });
          }
        } else {
          alert("No matching locations found in Pampanga.");
        }
      }
    } catch (err) {
      console.error("Address search failed:", err);
      alert("Error searching for location.");
    } finally {
      setBarangayLoading(false);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText) {
      setSubmitError("Please write a description of the issue.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setAiAnalysis(null);

    try {
      // Automatically analyze the report via Gemini AI
      let dbUrgency = "MEDIUM";
      let dbCategory = "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY";
      let dbSummary = "Resident reported water quality concern.";
      let dbTranslatedText = complaintText;

      try {
        const triageRes = await fetch("/api/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: complaintText }),
        });
        if (triageRes.ok) {
          const triageData = await triageRes.json();
          if (triageData.success && triageData.result) {
            dbUrgency = triageData.result.urgency || "MEDIUM";
            dbCategory = triageData.result.category || "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY";
            dbSummary = triageData.result.summary || "Resident reported water quality concern.";
            dbTranslatedText = triageData.result.translatedText || complaintText;
          }
        }
      } catch (err) {
        const fallbackResult = runLocalTriageFallback(complaintText);
        dbUrgency = fallbackResult.urgency;
        dbCategory = fallbackResult.category;
        dbSummary = fallbackResult.summary;
      }

      let lat = parseFloat(customLat);
      let lng = parseFloat(customLng);

      if (!gpsPinpointActive && typeof window !== "undefined" && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (geoError) {
          console.warn("Fallback geolocation lookup timed out:", geoError);
        }
      }

      const payload = {
        rawText: complaintText,
        latitude: lat,
        longitude: lng,
        imageUrl: complaintImageUrl || null,
        urgency: dbUrgency,
        category: dbCategory,
        summary: dbSummary,
        translatedText: dbTranslatedText,
        userId: userProfile?.id || null,
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json();
        setLastSubmittedComplaint({
          rawText: complaintText,
          imageUrl: complaintImageUrl || null,
          barangay: resData.barangay || detectedBarangay,
          latitude: lat,
          longitude: lng,
        });
        setSubmitSuccess(true);
        setDetectedBarangay(resData.barangay || detectedBarangay);
        setDetectedDistanceM(resData.distanceMeters ?? detectedDistanceM);
        setAiAnalysis({
          urgency: (dbUrgency === "HIGH" || dbUrgency === "CRITICAL") ? "URGENT" : "MEDIUM",
          category: dbCategory,
          translatedText: dbTranslatedText,
          summary: dbSummary,
        });
        setComplaintText("");
        setComplaintImageUrl("");
        fetchUserComplaints();
      } else {
        const errData = await res.json();
        setSubmitError(errData.error || "Failed to submit report.");
      }
    } catch (err) {
      setSubmitError("Failed to connect to the submission api endpoint.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const client = getSupabaseClient();
    await client.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF4FA] text-[#001e66] flex flex-col items-center justify-center">
        {/* Top color ribbon */}
        <div className="absolute inset-x-0 top-0 flex h-1 bg-[#001e66] z-50" aria-hidden="true"></div>
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-[#00aeef]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#00aeef] animate-spin"></div>
          </div>
          <p className="text-slate-500 text-xs font-black tracking-wider uppercase animate-pulse">
            Loading Resident Portal…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF4FA] text-[#001e66] flex flex-col font-sans relative">
      {/* 3-way Top Color Ribbon */}
      <div className="absolute inset-x-0 top-0 flex h-1.5 z-50" aria-hidden="true">
        <span className="flex-1 bg-[#001e66]" />
        <span className="flex-1 bg-[#00aeef]" />
        <span className="flex-1 bg-[#970006]" />
      </div>

      {/* Header Container */}
      <header className="m-[18px] mb-0 h-[86px] shrink-0 bg-white border border-slate-200 rounded-[16px] shadow-sm shadow-blue-100 flex items-center justify-between px-6 z-40 relative">
        <div className="flex items-center space-x-4">
          <img src="/LOGO2.png" alt="AquaTrack Logo" className="h-14 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-[#001e66] leading-none">
              AQUA<span className="text-[#00aeef]">TRACK</span>
            </span>
            <span className="text-[10px] font-black text-[#001e66] tracking-wider uppercase mt-1">
              CITY OF SAN FERNANDO • RESIDENT CONSUMER PORTAL
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="h-10 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-[#001e66] dark:text-slate-200 border border-slate-200 dark:border-slate-750 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider transition-all"
          >
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
          <div className="text-right hidden sm:flex flex-col">
            <span className="text-xs font-black text-[#001e66] leading-none">{userProfile?.name}</span>
            <span className="text-[9px] text-[#00aeef] font-mono font-bold mt-1 uppercase tracking-wider">
              {userProfile?.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="h-10 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-[#970006] rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid containing left ASIDE and right MAIN panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-[18px] gap-[18px] z-30">
        
        {/* Left Navigation Sidebar (Aside section) */}
        <aside className="w-full lg:w-[350px] shrink-0 bg-white border border-slate-200 rounded-[18px] shadow-sm shadow-blue-100 p-6 flex flex-col justify-between lg:overflow-y-auto space-y-6 lg:space-y-0">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                MY SERVICES
              </span>
            </div>

            <nav className="space-y-1.5">
              {[
                { key: "home", label: "Dashboard Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                { key: "file-complaint", label: "File a Complaint", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
                { key: "track-complaint", label: "Track Complaints", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
                { key: "view-announcements", label: "Community Advisories", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
                { key: "contact-us", label: "Contact Water District", icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
              ].map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as any)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-xs font-black transition-all focus:outline-none relative overflow-hidden group hover:scale-[1.01] ${
                      isActive
                        ? "bg-[#063A8C] text-white shadow-md shadow-blue-950/20"
                        : "text-slate-655 hover:bg-slate-50 hover:text-[#00aeef]"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffd800]" />
                    )}
                    <div className="flex items-center space-x-3">
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-100 my-4" />
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-black tracking-widest text-[#001e66] uppercase">
              PAMPANGA DISTRICT HUB
            </span>
            <div className="space-y-2.5 text-xs text-slate-500 font-bold">
              <div className="flex items-center space-x-2">
                <span>RA 10173 Secure (Data Privacy)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>PNSDW Standards Validated</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Panel Content */}
        <main className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] shadow-sm shadow-blue-100 dark:shadow-none p-8 lg:overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full flex flex-col flex-1"
            >
              {/* Tab 0: Dashboard Home */}
              {activeTab === "home" && (
                <div className="space-y-6">
                  {/* Welcome Hero Banner */}
                  <div className="bg-gradient-to-br from-[#001e66] via-[#052e85] to-[#00aeef] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
                    {/* Background patterns */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#970006]/10 rounded-full blur-xl pointer-events-none" />

                    <div className="relative z-10 space-y-4">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-3.5 py-1 rounded-full border border-white/10">
                        Consumer Resident Command Center
                      </span>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                          Welcome Back, {userProfile?.name || "Valued Consumer"}!
                        </h2>
                        <p className="text-xs text-slate-200 font-bold mt-1">
                          Account Hub: Del Pilar District • Executive Portal
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 pt-2 text-xxs font-black uppercase tracking-widest text-[#ffd800]">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        <span>Municipal Water Supply is NORMAL</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Active Tickets */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xxs font-black text-slate-400 uppercase tracking-widest">Active Tickets</span>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-[#001e66] dark:text-slate-100">
                          {myComplaints.filter(c => c.status !== "RESOLVED").length}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
                          In triage or dispatch
                        </p>
                      </div>
                    </div>

                    {/* Latest Bulletins */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xxs font-black text-slate-400 uppercase tracking-widest">Latest Bulletin</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#001e66] dark:text-slate-100 line-clamp-1">
                          {advisories[0]?.title || "No active notices"}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
                          {advisories[0]?.date || "Up to date"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Shortcuts */}
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                        Quick Actions
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <button
                        onClick={() => setActiveTab("file-complaint")}
                        className="text-left bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-850 px-4 py-3.5 rounded-xl flex items-center justify-between text-xs font-black text-[#001e66] dark:text-slate-200 shadow-sm transition-all cursor-pointer group"
                      >
                        <span>File Incident Report</span>
                        <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("track-complaint")}
                        className="w-full text-left bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-850 px-4 py-3.5 rounded-xl flex items-center justify-between text-xs font-black text-[#001e66] dark:text-slate-200 shadow-sm transition-all cursor-pointer group"
                      >
                        <span>Track Active Tickets</span>
                        <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("view-announcements")}
                        className="w-full text-left bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-850 px-4 py-3.5 rounded-xl flex items-center justify-between text-xs font-black text-[#001e66] dark:text-slate-200 shadow-sm transition-all cursor-pointer group"
                      >
                        <span>View Public Bulletins</span>
                        <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("contact-us")}
                        className="w-full text-left bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-850 px-4 py-3.5 rounded-xl flex items-center justify-between text-xs font-black text-[#001e66] dark:text-slate-200 shadow-sm transition-all cursor-pointer group"
                      >
                        <span>Hotline Support Desk</span>
                        <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 1: File a Complaint */}
              {activeTab === "file-complaint" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#001e66] tracking-tight">File an Incident Report</h2>
                <p className="text-xs text-slate-500 font-medium">Describe water flow pressure drops or quality deviations</p>
              </div>
                        {submitSuccess ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm animate-fade-in max-w-2xl">
                  <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-450">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 leading-none">
                        Report Logged Successfully
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-1.5">
                        Your water issue ticket has been registered and is active in the dispatch queue.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-b border-slate-100 dark:border-slate-800/80 py-4 space-y-4 text-xs">
                    <div>
                      <strong className="text-slate-450 uppercase tracking-widest text-[9px] block mb-1">
                        Report Summary (AI Diagnostics)
                      </strong>
                      <p className="text-[#001e66] dark:text-slate-150 font-extrabold text-sm italic leading-relaxed">
                        "{aiAnalysis?.summary || "Resident reported water quality concern."}"
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-450 uppercase tracking-widest text-[9px] block mb-1">
                        Your Detailed Description
                      </strong>
                      <p className="text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-955 p-3.5 rounded-xl border border-slate-200 dark:border-slate-900 font-semibold leading-relaxed whitespace-pre-wrap">
                        {lastSubmittedComplaint?.rawText}
                      </p>
                    </div>

                    {lastSubmittedComplaint?.imageUrl && (
                      <div>
                        <strong className="text-slate-450 uppercase tracking-widest text-[9px] block mb-1.5">
                          Attached Photo
                        </strong>
                        <div className="w-40 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                          <img src={lastSubmittedComplaint.imageUrl} alt="Submitted incident photo" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 font-mono text-xxs border-t border-slate-100 dark:border-slate-800/50 pt-4">
                      <div>
                        <strong className="text-slate-400 uppercase tracking-widest block mb-0.5 text-[8px]">Barangay</strong>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {lastSubmittedComplaint?.barangay || "San Fernando"}
                        </span>
                      </div>
                      <div>
                        <strong className="text-slate-400 uppercase tracking-widest block mb-0.5 text-[8px]">Coordinates</strong>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {lastSubmittedComplaint?.latitude.toFixed(6)}, {lastSubmittedComplaint?.longitude.toFixed(6)}
                        </span>
                      </div>
                      <div>
                        <strong className="text-slate-400 uppercase tracking-widest block mb-0.5 text-[8px]">Urgency</strong>
                        <span className="font-black text-rose-600 dark:text-rose-450 uppercase">
                          {aiAnalysis?.urgency || "MEDIUM"}
                        </span>
                      </div>
                      <div>
                        <strong className="text-slate-400 uppercase tracking-widest block mb-0.5 text-[8px]">Category</strong>
                        <span className="font-bold text-slate-700 dark:text-slate-200 uppercase">
                          {aiAnalysis?.category?.replace(/_/g, " ") || "UNCLASSIFIED"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSubmitSuccess(false);
                        setAiAnalysis(null);
                        setLastSubmittedComplaint(null);
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#001e66] dark:text-slate-200 font-black text-xs py-3 px-6 rounded-xl uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      File Another Report
                    </button>
                    <button
                      onClick={() => {
                        setSubmitSuccess(false);
                        setAiAnalysis(null);
                        setLastSubmittedComplaint(null);
                        setActiveTab("track-complaint");
                      }}
                      className="flex-1 bg-gradient-to-r from-[#001e66] to-[#00aeef] hover:from-[#00aeef] hover:to-[#001e66] text-white font-black text-xs py-3 px-6 rounded-xl uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Track Active Tickets
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold mb-4">
                      ⚠ {submitError}
                    </div>
                  )}

                  <form onSubmit={handleCreateComplaint} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      
                      {/* Left Column: Complaint Details */}
                      <div className="space-y-5">
                        {/* Description Textarea */}
                        <div className="space-y-1.5">
                          <label className="text-xxs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Describe water issue</label>
                          <textarea
                            rows={5}
                            value={complaintText}
                            onChange={(e) => setComplaintText(e.target.value)}
                            placeholder="e.g. Mahina ang tubig dito sa amin sa Del Pilar, halos walang tumutulo..."
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#001e66] dark:text-slate-100 font-bold text-xs py-3 px-4 rounded-xl focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20 transition-all"
                          />
                          <p className="text-[10px] text-slate-400">Reports can be entered in Tagalog, Taglish, or English.</p>
                        </div>

                        {/* Complaint Photo Upload */}
                        <div className="space-y-1.5">
                          <label className="text-xxs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attach Photo (Optional)</label>
                          <input
                            key="complaint-file-upload-input"
                            id="complaint-file-upload-input"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto || submitting}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#00aeef]/10 file:text-[#00aeef] hover:file:bg-[#00aeef]/20 cursor-pointer"
                          />
                          {uploadingPhoto && (
                            <p className="text-[10px] text-[#00aeef] animate-pulse mt-1">Uploading photo to Supabase Storage...</p>
                          )}
                          {complaintImageUrl && (
                            <div className="mt-2.5 relative w-32 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                              <img src={complaintImageUrl} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setComplaintImageUrl("")}
                                className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow transition-colors cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>

                        {/* AI Triage Analysis Card */}
                        {aiAnalysis && (
                          <div className="bg-[#00aeef]/5 border border-[#00aeef]/20 rounded-2xl p-5 space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-black text-[#001e66] dark:text-slate-200">Gemini AI Diagnostics</span>
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
                            <div className="text-xs text-slate-650 dark:text-slate-350 space-y-2 leading-relaxed font-semibold">
                              <div>
                                <span className="text-xxs font-bold text-slate-400 uppercase block">Category Classification</span>
                                <span className="font-mono text-[#001e66] dark:text-slate-200 text-[10px]">{aiAnalysis.category}</span>
                              </div>
                              <div>
                                <span className="text-xxs font-bold text-slate-400 uppercase block">Analysis Summary</span>
                                <p className="text-slate-700 dark:text-slate-300 italic mt-0.5">"{aiAnalysis.summary}"</p>
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
                            className="bg-gradient-to-r from-[#001e66] to-[#00aeef] hover:from-[#00aeef] hover:to-[#001e66] text-white font-black text-xs px-6 py-3.5 rounded-xl uppercase tracking-wider shadow-md shadow-blue-900/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
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
                      </div>

                      {/* Right Column: Location & Mapping Details */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                        <div>
                          <h3 className="text-xs font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                            Geographic Dispatch Details
                          </h3>
                        </div>

                        {/* GPS pinpoint stats */}
                        <div className="flex items-start space-x-2">
                          <div className="flex-1">
                            <span className="font-extrabold text-[#001e66] dark:text-slate-200 block text-xs">Automated GPS Location Pinpoint</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {gpsPinpointActive
                                ? `High-precision GPS captured · ${customLat}, ${customLng}${
                                    gpsAccuracy ? ` · Accuracy: ${gpsAccuracy.toFixed(1)}m` : ""
                                  }`
                                : "Requesting device GPS coordinates…"}
                            </span>
                          </div>
                        </div>

                        {/* Address Search Bar */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Search Address, Street, or Landmark</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. Del Pilar Street, Sto. Rosario..."
                              value={addressSearchQuery}
                              onChange={(e) => setAddressSearchQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddressSearch();
                                }
                              }}
                              className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#001e66] dark:text-slate-100 font-bold text-xs py-2 px-3 rounded-lg focus:outline-none focus:border-[#00aeef]"
                            />
                            <button
                              type="button"
                              onClick={handleAddressSearch}
                              className="bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold text-xs px-5 py-2 rounded-lg uppercase tracking-wider active:scale-95 transition-all shadow-sm cursor-pointer"
                            >
                              Search
                            </button>
                          </div>
                        </div>

                        {/* Interactive Map Pinning Container */}
                        <div className="w-full h-52 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-inner">
                          <div ref={clientMapContainerRef} className="absolute inset-0 w-full h-full" />
                          {mapError ? (
                            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center z-10">
                              <span className="text-xl">🗺️</span>
                              <span className="text-xs font-bold text-slate-200 mt-2">Map Connection Unreachable</span>
                              <span className="text-[10px] text-slate-400 mt-1 max-w-[240px]">
                                If you are using a restricted network (e.g., school or public Wi-Fi), map services may be blocked. You can still type your address manually below!
                              </span>
                            </div>
                          ) : (
                            <div className="absolute bottom-2 left-2 z-10 bg-slate-900/90 text-white text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700/60 backdrop-blur-sm">
                              Drag marker or click map to pin exact location
                            </div>
                          )}
                        </div>

                        {/* Locate Me button */}
                        <button
                          type="button"
                          onClick={handleRequestLocation}
                          className="w-full bg-gradient-to-r from-[#00aeef] to-[#08266D] hover:from-[#08266D] hover:to-[#00aeef] text-white font-black text-[10px] py-2.5 px-3 rounded-lg uppercase tracking-wider shadow-sm hover:shadow-blue-500/10 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Pin My Current Device Location
                        </button>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase">Latitude</label>
                            <input
                              type="text"
                              value={customLat}
                              onChange={(e) => {
                                userHasManuallyPinnedRef.current = true;
                                setCustomLat(e.target.value);
                                setGpsPinpointActive(true);
                              }}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#001e66] dark:text-slate-100 font-mono text-[10px] py-1.5 px-3 rounded-lg focus:outline-none focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]/30"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase">Longitude</label>
                            <input
                              type="text"
                              value={customLng}
                              onChange={(e) => {
                                userHasManuallyPinnedRef.current = true;
                                setCustomLng(e.target.value);
                                setGpsPinpointActive(true);
                              }}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#001e66] dark:text-slate-100 font-mono text-[10px] py-1.5 px-3 rounded-lg focus:outline-none focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]/30"
                            />
                          </div>
                        </div>

                        {/* PostGIS Barangay Detection Result */}
                        <div className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                          barangayLoading
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40"
                            : detectedBarangay
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40"
                            : gpsPinpointActive && !barangayLoading
                            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40"
                            : "bg-slate-100 border-slate-200 dark:bg-slate-850 dark:border-slate-800"
                        }`}>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                PostGIS · Nominatim Barangay Detection
                              </div>
                              <div className={`text-xs font-black ${
                                gpsPinpointActive && !detectedBarangay && !barangayLoading
                                  ? "text-amber-700 dark:text-amber-400"
                                  : "text-[#001e66] dark:text-slate-200"
                              }`}>
                                {barangayLoading
                                  ? "Identifying barangay via Nominatim + PostGIS…"
                                  : detectedBarangay
                                  ? `Brgy. ${detectedBarangay}`
                                  : gpsPinpointActive
                                  ? "Outside City of San Fernando service area"
                                  : "Awaiting GPS fix…"}
                              </div>
                              {gpsPinpointActive && !detectedBarangay && !barangayLoading && (
                                <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                  Your location does not match any of the 35 San Fernando barangays.
                                </div>
                              )}
                            </div>
                          </div>
                          {detectedBarangay && detectedDistanceM !== null && detectedDistanceM > 0 && !barangayLoading && (
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950 px-2 py-0.5 rounded-full shrink-0">
                              ~{detectedDistanceM}m · PostGIS
                            </span>
                          )}
                          {detectedBarangay && (detectedDistanceM === 0 || detectedDistanceM === null) && !barangayLoading && (
                            <span className="text-[9px] font-black text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-950 px-2 py-0.5 rounded-full shrink-0">
                              Nominatim verified
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Track Complaints */}
          {activeTab === "track-complaint" && (
            <div className="space-y-8">
              {/* Section 1: Active Complaints */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-[#001e66] tracking-tight">Active Ticket Status Tracker</h2>
                  <p className="text-xs text-slate-500 font-bold">Monitor your active tickets and dispatch assignments</p>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Summary</th>
                        <th className="py-3 px-4">Urgency</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Coordinates</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myComplaints
                        .filter((c) => c.status !== "RESOLVED")
                        .map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-bold text-[#001e66]">
                              <div>{c.summary}</div>
                              <div className="text-slate-500 font-medium italic mt-0.5">"{c.rawText}"</div>
                            </td>
                            <td className="py-4 px-4 font-black">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase border ${
                                c.urgency === "CRITICAL" || c.urgency === "HIGH" || c.urgency === "URGENT"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : c.urgency === "MEDIUM"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}>
                                {c.urgency}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-[10px] text-slate-500">{c.category}</td>
                            <td className="py-4 px-4 font-mono text-slate-500 font-bold">
                              {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                                c.status === "PENDING"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : c.status === "EVALUATING"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : c.status === "DISPATCHED"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : c.status === "ONGOING"
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : c.status === "RESOLVED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}>
                                {c.status || "PENDING"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      {myComplaints.filter((c) => c.status !== "RESOLVED").length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                            No active tickets recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Complaint History */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-[#001e66] tracking-tight">My Complaint History (Audit Trail)</h2>
                  <p className="text-xs text-slate-500 font-bold">Resolved incident logs and completed audit trails</p>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Resolved Ticket</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Address</th>
                        <th className="py-3 px-4">Coordinates</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myComplaints
                        .filter((c) => c.status === "RESOLVED")
                        .map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-bold text-slate-500">
                              <div>{c.summary}</div>
                              <div className="text-slate-400 font-medium italic mt-0.5">"{c.rawText}"</div>
                            </td>
                            <td className="py-4 px-4 font-mono text-[10px] text-slate-400">{c.category}</td>
                            <td className="py-4 px-4 font-medium text-slate-500">{c.barangay || "San Fernando"}</td>
                            <td className="py-4 px-4 font-mono text-slate-400">
                              {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                RESOLVED
                              </span>
                            </td>
                          </tr>
                        ))}
                      {myComplaints.filter((c) => c.status === "RESOLVED").length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                            No resolved complaints recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: View Announcements */}
          {activeTab === "view-announcements" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#001e66] tracking-tight">Community Broadcast Notices</h2>
                <p className="text-xs text-slate-500 font-medium font-bold font-bold font-bold font-bold">Read recent municipal service updates and maintenance warnings</p>
              </div>

              <div className="space-y-4">
                {advisories
                  .filter((ad) => !ad.targetRole || ad.targetRole === "broadcast" || ad.targetRole === "consumers")
                  .map((ad) => (
                    <div key={ad.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm relative">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-slate-400">{ad.date}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                          ad.type === "warning"
                            ? "bg-red-50 text-red-600 border-red-200"
                            : ad.type === "info"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : ad.type === "news"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-purple-50 text-purple-600 border-purple-200"
                        }`}>
                          {ad.type}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-[#001e66] text-sm mt-2">{ad.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ad.text}</p>
                    </div>
                  ))}
                {advisories.filter((ad) => !ad.targetRole || ad.targetRole === "broadcast" || ad.targetRole === "consumers").length === 0 && (
                  <p className="text-slate-500 italic text-xs">No active notices broadcasted.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Contact Water District */}
          {activeTab === "contact-us" && (
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
          )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
