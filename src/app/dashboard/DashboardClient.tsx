"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Footer from "../../components/Footer";
import { getSupabaseClient, uploadComplaintPhoto } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Megaphone, 
  AlertTriangle, 
  MapPinOff, 
  Menu, 
  Bell, 
  Moon, 
  Sun, 
  ChevronDown, 
  User, 
  LogOut, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Loader2, 
  MapPin, 
  Phone, 
  PhoneCall,
  Map,
  Mail, 
  Plus, 
  Eye, 
  ListTodo, 
  Clock, 
  Compass, 
  UserCog,
  Droplet,
  Camera,
  Send
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { isOutsideSanFernando } from "../../lib/geo-utils";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  address?: string | null;
  serviceAccountNo?: string | null;
}

interface Complaint {
  id: string;
  rawText: string;
  translatedText?: string;
  summary: string;
  latitude: number;
  longitude: number;
  urgency: string;
  category: string;
  status?: string;
  createdAt?: string;
  barangay?: string;
  assignedToName?: string | null;
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewedAdvisoryIds, setViewedAdvisoryIds] = useState<string[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("viewed-advisories");
      if (stored) {
        setViewedAdvisoryIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load viewed advisories", e);
    }
  }, []);

  const markAdvisoryAsRead = (id: string) => {
    setViewedAdvisoryIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem("viewed-advisories", JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAdvisoriesAsRead = () => {
    const activeConsumerAdvisories = advisories.filter(
      (ad) => !ad.targetRole || ad.targetRole === "broadcast" || ad.targetRole === "consumers"
    );
    const allIds = activeConsumerAdvisories.map((ad) => ad.id);
    setViewedAdvisoryIds((prev) => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      localStorage.setItem("viewed-advisories", JSON.stringify(updated));
      return updated;
    });
  };

  // Profile Dropdown and Account Details Modal States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<"profile" | "security">("profile");

  // Profile Editable states
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || "");
      setProfileEmail(userProfile.email || "");
      setProfilePhone(userProfile.phone || "");
      setProfileAddress(userProfile.address || "");
      if (userProfile.address) {
        setAddressSearchQuery((current) => current || userProfile.address);
      }
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);
    try {
      const client = getSupabaseClient();
      
      // 1. Update Supabase Auth user details
      const { error: authError } = await client.auth.updateUser({
        email: profileEmail,
        data: { full_name: profileName, phone: profilePhone, address: profileAddress }
      });

      if (authError) {
        setProfileError(authError.message);
        setProfileSaving(false);
        return;
      }

      // 2. Sync to PostgreSQL User database table
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userProfile?.id,
          email: profileEmail,
          fullName: profileName,
          phone: profilePhone,
          address: profileAddress
        }),
      });

      // Update the local state Profile so the header updates instantly
      setUserProfile((prev) => 
        prev ? { ...prev, name: profileName, email: profileEmail, phone: profilePhone, address: profileAddress } : null
      );
      setProfileSuccess("Profile details updated successfully!");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile details.");
    } finally {
      setProfileSaving(false);
    }
  };

  const formatCategory = (cat: string) => {
    if (!cat) return "Unclassified";
    return cat
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Security Update states
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (newPassword !== confirmNewPassword) {
      setSecurityError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setSecurityError("Password must be at least 8 characters.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        setSecurityError(error.message);
      } else {
        setSecuritySuccess("Password updated successfully!");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err: any) {
      setSecurityError(err.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Simulate profile deletion / disable profile and sign out
      const client = getSupabaseClient();
      await client.auth.signOut();
      localStorage.clear();
      window.location.href = "/register?deleted=true";
    } catch (err) {
      console.error(err);
    }
  };

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
  const [nodes, setNodes] = useState<any[]>(initialNodes || []);
  const [advisoryPage, setAdvisoryPage] = useState(1);
  const [advisoryFilter, setAdvisoryFilter] = useState<"all" | "warning" | "info">("all");
  const [selectedAdvisory, setSelectedAdvisory] = useState<Advisory | null>(null);
  const [loadMiniMap, setLoadMiniMap] = useState(false);

  // Form Submission State
  const [complaintText, setComplaintText] = useState("");
  const [detectedBarangay, setDetectedBarangay] = useState<string | null>(null);
  const [detectedDistanceM, setDetectedDistanceM] = useState<number | null>(null);
  const [barangayLoading, setBarangayLoading] = useState(false);
  const [customLat, setCustomLat] = useState("15.0278");
  const [customLng, setCustomLng] = useState("120.6936");
  const [complaintImageUrl, setComplaintImageUrl] = useState("");
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [mapError, setMapError] = useState(false);
  const [lastSubmittedComplaint, setLastSubmittedComplaint] = useState<any | null>(null);
  const [searchErrorModalOpen, setSearchErrorModalOpen] = useState(false);


  const clientMapRef = useRef<mapboxgl.Map | null>(null);
  const clientMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userHasManuallyPinnedRef = useRef(false);
  const isInitialMapCenterRef = useRef(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gpsPinpointActive, setGpsPinpointActive] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isOutOfScope, setIsOutOfScope] = useState(false);
  const [clientMap3D, setClientMap3D] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const reverseGeocodeGPSAddress = async (latVal: number, lngVal: number, force = false) => {
    // Avoid re-fetching if profile address is already populated (unless forced by manual click)
    if (!force && userProfile?.address?.trim()) return;

    try {
      console.log("Reverse-geocoding GPS coordinates:", latVal, lngVal, "force:", force);
      const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngVal},${latVal}.json?access_token=${mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}&limit=1`;
      const res = await fetch(reverseGeocodeUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const detectedAddr = data.features[0].place_name;
          console.log("Auto-detected address from GPS:", detectedAddr);

          // 1. Set the Address Search input field
          setAddressSearchQuery(detectedAddr);

          // 2. Save it to Postgres (only if we're auto-detecting a new profile address on mount)
          if (!userProfile?.address?.trim()) {
            await fetch("/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: userProfile?.id,
                email: userProfile?.email || "",
                fullName: userProfile?.name || "",
                phone: userProfile?.phone || "",
                address: detectedAddr
              }),
            });

            // 3. Update the local state so it appears under Welcome Back instantly
            setUserProfile((prev) =>
              prev ? { ...prev, address: detectedAddr } : null
            );
            setProfileAddress(detectedAddr);
          }
        }
      }
    } catch (err) {
      console.error("Auto reverse-geocoding failed:", err);
    }
  };

  // Request user's exact geolocation GPS coordinates on mount and watch for improvements
  useEffect(() => {
    if (loading) return; // Wait until auth/profile load completes to prevent race conditions

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

          reverseGeocodeGPSAddress(position.coords.latitude, position.coords.longitude);
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

          reverseGeocodeGPSAddress(position.coords.latitude, position.coords.longitude);
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
  }, [loading]);

  const mapLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const handleMapRef = React.useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      if (mapLoadTimeoutRef.current) {
        clearTimeout(mapLoadTimeoutRef.current);
        mapLoadTimeoutRef.current = null;
      }
      if (clientMapRef.current) {
        clientMapRef.current.remove();
        clientMapRef.current = null;
        clientMarkerRef.current = null;
      }
      return;
    }

    if (clientMapRef.current) return;

    // Utilize refs or current component state values for map instantiation bounds
    const lat = parseFloat(customLat) || 15.0278;
    const lng = parseFloat(customLng) || 120.6936;
    setMapError(false);

    const map = new mapboxgl.Map({
      container: el,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: gpsPinpointActive ? 17 : 15.5,
      pitch: 50,
      bearing: -15,
      antialias: true,
    });

    let loaded = false;

    // Draw the official City of San Fernando boundary — 3D wall + neon glow outline
    const addCityBoundaryLayer = () => {
      import("../../lib/san-fernando-boundary").then(({ SAN_FERNANDO_POLYGON }) => {
        if (!clientMapRef.current || clientMapRef.current !== map) return;
        if (map.getSource("sf-boundary")) return;

        map.addSource("sf-boundary", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: { height: 40, base: 0 },
            geometry: {
              type: "Polygon",
              coordinates: [SAN_FERNANDO_POLYGON],
            },
          },
        });

        // --- Layer 1: Subtle floor tint inside the city ---
        map.addLayer({
          id: "sf-boundary-floor",
          type: "fill",
          source: "sf-boundary",
          paint: {
            "fill-color": "#00aeef",
            "fill-opacity": 0.06,
          },
        });

        // --- Layer 2: 3D extruded wall along the boundary at 40m height ---
        map.addLayer({
          id: "sf-boundary-wall",
          type: "fill-extrusion",
          source: "sf-boundary",
          paint: {
            "fill-extrusion-color": "#00aeef",
            "fill-extrusion-height": 40,
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.25,
          },
        });

        // --- Layer 3: Outer soft glow (widest, most transparent) ---
        map.addLayer({
          id: "sf-boundary-glow-outer",
          type: "line",
          source: "sf-boundary",
          paint: {
            "line-color": "#00aeef",
            "line-width": 14,
            "line-opacity": 0.08,
            "line-blur": 6,
          },
        });

        // --- Layer 4: Mid halo ---
        map.addLayer({
          id: "sf-boundary-glow-mid",
          type: "line",
          source: "sf-boundary",
          paint: {
            "line-color": "#00aeef",
            "line-width": 6,
            "line-opacity": 0.25,
            "line-blur": 2,
          },
        });

        // --- Layer 5: Bright solid core line ---
        map.addLayer({
          id: "sf-boundary-core",
          type: "line",
          source: "sf-boundary",
          paint: {
            "line-color": "#00aeef",
            "line-width": 2.5,
            "line-opacity": 1,
          },
        });
      });
    };


    // Add 3D terrain + building extrusions once the style is ready
    const add3DLayers = () => {
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 });

      if (!map.getLayer("client-3d-buildings")) {
        map.addLayer({
          id: "client-3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 14,
          paint: {
            "fill-extrusion-color": "#cbd5e1",
            "fill-extrusion-height": [
              "interpolate", ["linear"], ["zoom"],
              14, 0, 14.5, ["get", "height"]
            ],
            "fill-extrusion-base": [
              "interpolate", ["linear"], ["zoom"],
              14, 0, 14.5, ["get", "min_height"]
            ],
            "fill-extrusion-opacity": 0.6,
          },
        });
      }
    };

    map.on("load", () => {
      loaded = true;
      setMapError(false);
      map.resize();
      add3DLayers();
      addCityBoundaryLayer();
      setTimeout(() => {
        if (clientMapRef.current === map) {
          map.resize();
        }
      }, 300);
    });
    map.on("style.load", () => {
      loaded = true;
      setMapError(false);
      map.resize();
      add3DLayers();
      addCityBoundaryLayer();
    });

    map.on("error", (e) => {
      console.warn("Mapbox non-fatal warning:", e.error?.message || "Unknown error");
    });

    mapLoadTimeoutRef.current = setTimeout(() => {
      if (!loaded) {
        console.warn("Mapbox load timed out (firewall block suspected)");
        setMapError(true);
      }
    }, 10000);

    clientMapRef.current = map;

    // Create a custom DOM element for the red location pin marker with a soft, semi-transparent red pulse ring
    const markerEl = document.createElement("div");
    markerEl.className = "custom-mapbox-pin";
    markerEl.innerHTML = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
        <div style="position: absolute; width: 32px; height: 32px; background-color: rgba(239, 68, 68, 0.25); border: 1.5px solid rgba(239, 68, 68, 0.35); border-radius: 9999px; animation: pulse 2s infinite ease-out;"></div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" style="width: 28px; height: 28px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.15)); z-index: 10;">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `;

    const marker = new mapboxgl.Marker({ element: markerEl, draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);

    clientMarkerRef.current = marker;

    if (gpsPinpointActive) {
      if (isInitialMapCenterRef.current) {
        map.jumpTo({ center: [lng, lat], zoom: 17 });
        isInitialMapCenterRef.current = false;
      } else {
        map.easeTo({ center: [lng, lat], zoom: 17 });
      }
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
  }, []);

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
          if (isInitialMapCenterRef.current) {
            map.jumpTo({ center: [lng, lat], zoom: 17 });
            isInitialMapCenterRef.current = false;
          } else {
            map.easeTo({ center: [lng, lat], zoom: 17 });
          }
        }
      }
    }
  }, [customLat, customLng]);

  // Accurate point-in-polygon check against the 788-vertex OSM boundary of
  // the City of San Fernando, Pampanga (imported from @/lib/geo-utils)

  // Watch pin coordinates and flag out-of-scope locations
  useEffect(() => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) return;
    setIsOutOfScope(isOutsideSanFernando(lat, lng));
  }, [customLat, customLng]);

  // Reactively toggle 3D terrain & buildings on the client complaint map
  useEffect(() => {
    const map = clientMapRef.current;
    if (!map) return;
    const apply = () => {
      if (clientMap3D) {
        if (map.getSource("mapbox-dem")) {
          map.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 });
        }
        if (map.getLayer("client-3d-buildings")) {
          map.setLayoutProperty("client-3d-buildings", "visibility", "visible");
        }
      } else {
        map.setTerrain(null);
        if (map.getLayer("client-3d-buildings")) {
          map.setLayoutProperty("client-3d-buildings", "visibility", "none");
        }
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("style.load", apply);
  }, [clientMap3D]);

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
          cache: "no-store",
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
          email: currentSession.user.email || profile?.email || currentSession.user.email || "",
          role: profile?.role || "CONSUMER_RESIDENT",
          phone: profile?.phone || currentSession.user.user_metadata?.phone || "",
          address: profile?.address || currentSession.user.user_metadata?.address || "",
          serviceAccountNo: profile?.serviceAccountNo || "",
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

  // Enable Supabase Realtime subscriptions for complaint and telemetry changes
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

      const readingsChannel = client
        .channel("client-readings-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "TelemetryReading" },
          (payload) => {
            console.log("Realtime telemetry reading received:", payload);
            fetchNodes(); // Re-fetch nodes to update live readings immediately!
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
        client.removeChannel(readingsChannel);
      };
    } catch (err) {
      console.error("Failed to setup realtime subscriptions:", err);
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

  const fetchNodes = async () => {
    try {
      const res = await fetch("/api/admin/nodes");
      const data = await res.json();
      if (data.success) {
        setNodes(data.nodes);
      }
    } catch (err) {
      console.error("Failed to fetch nodes", err);
    }
  };

  // Geocode profile address on mount to resolve to initial GPS coordinates
  useEffect(() => {
    if (userProfile?.address) {
      const geocodeAddr = async () => {
        try {
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(userProfile.address)}.json?access_token=${mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}&limit=1`;
          const res = await fetch(geocodeUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.features && data.features.length > 0) {
              const [lng, lat] = data.features[0].center;
              setCustomLat(lat.toFixed(6));
              setCustomLng(lng.toFixed(6));
              setGpsPinpointActive(true);
              console.log("Geocoded profile address to:", lat, lng);
            }
          }
        } catch (err) {
          console.error("Geocoding profile address on mount failed", err);
        }
      };
      geocodeAddr();
    }
  }, [userProfile?.address]);





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
            reverseGeocodeGPSAddress(position.coords.latitude, position.coords.longitude, true);
          },
          (lowError) => {
            console.error("Low-accuracy GPS fallback also failed:", lowError);
            alert("Could not access device location. Please ensure location services are enabled and permissions are granted in your browser.");
            setGpsPinpointActive(false);
            setBarangayLoading(false);
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
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
          reverseGeocodeGPSAddress(position.coords.latitude, position.coords.longitude, true);
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
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
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
      let query = addressSearchQuery.trim();
      // Safely strip duplicate suffixes if already present in the user query
      const suffixes = ["Philippines", "Pampanga"];
      for (const suffix of suffixes) {
        if (query.toLowerCase().endsWith(suffix.toLowerCase())) {
          query = query.slice(0, -suffix.length).trim().replace(/,$/, "").trim();
        }
        if (query.toLowerCase().endsWith(suffix.toLowerCase())) {
          query = query.slice(0, -suffix.length).trim().replace(/,$/, "").trim();
        }
      }
      const fullQuery = `${query}, Pampanga, Philippines`;
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullQuery)}.json?access_token=${mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}&limit=1`;
      
      const res = await fetch(geocodeUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const matched = data.features[0];
          
          // Mapbox fallback protection: if match relevance is too low, treat as location not found
          if (matched.relevance !== undefined && matched.relevance < 0.8) {
            setSearchErrorModalOpen(true);
            return;
          }

          const lng = matched.center[0];
          const lat = matched.center[1];
          const latStr = lat.toFixed(6);
          const lngStr = lng.toFixed(6);
          
          setCustomLat(latStr);
          setCustomLng(lngStr);
          setGpsPinpointActive(true);
          
          const map = clientMapRef.current;
          const marker = clientMarkerRef.current;
          if (map && marker) {
            marker.setLngLat([lng, lat]);
            map.easeTo({ center: [lng, lat], zoom: 17 });
          }
        } else {
          setSearchErrorModalOpen(true);
        }
      } else {
        setSearchErrorModalOpen(true);
      }
    } catch (err) {
      console.error("Address search failed:", err);
      setSearchErrorModalOpen(true);
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

    // Block submission if pin is outside City of San Fernando, Pampanga
    const pinLat = parseFloat(customLat);
    const pinLng = parseFloat(customLng);
    if (isOutsideSanFernando(pinLat, pinLng)) {
      setSubmitError(
        "📍 Out of scope: Your pinned location is outside the City of San Fernando, Pampanga. Please move the map pin to a location within the city service area before filing a complaint."
      );
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
      let geoSuccess = gpsPinpointActive;

      if (!geoSuccess && typeof window !== "undefined" && navigator.geolocation) {
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
          geoSuccess = true;
        } catch (geoError) {
          console.warn("Fallback geolocation lookup timed out:", geoError);
        }
      }

      // Failover to user's registered address coordinates if pinning/GPS failed:
      if (!geoSuccess && userProfile?.address?.trim()) {
        try {
          console.log("Filing complaint location pinning failed. Using address failover:", userProfile.address);
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(userProfile.address)}.json?access_token=${mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}&limit=1`;
          const geoRes = await fetch(geocodeUrl);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.features && geoData.features.length > 0) {
              const [failoverLng, failoverLat] = geoData.features[0].center;
              lat = failoverLat;
              lng = failoverLng;
              geoSuccess = true;
              console.log("Geocoded failover address successfully:", lat, lng);
              // Pin it automatically on the map:
              setCustomLat(lat.toFixed(6));
              setCustomLng(lng.toFixed(6));
              setGpsPinpointActive(true);
            }
          }
        } catch (geocodeErr) {
          console.error("Geocoding failover address failed:", geocodeErr);
        }
      }

      // Reverse geocode GPS coordinates if user has no address:
      let finalUserAddress = userProfile?.address || "";
      if (!finalUserAddress.trim() && lat && lng && !isNaN(lat) && !isNaN(lng)) {
        try {
          console.log("User address is empty. Reverse geocoding GPS coordinates:", lat, lng);
          const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}&limit=1`;
          const revRes = await fetch(reverseGeocodeUrl);
          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData.features && revData.features.length > 0) {
              const detectedAddr = revData.features[0].place_name;
              console.log("Reverse geocoded GPS address successfully:", detectedAddr);
              
              // Save to Postgres
              await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: userProfile?.id,
                  email: userProfile?.email || "",
                  fullName: userProfile?.name || "",
                  phone: userProfile?.phone || "",
                  address: detectedAddr
                }),
              });
              
              // Update local state profile so the UI instantly updates too
              setUserProfile((prev) =>
                prev ? { ...prev, address: detectedAddr } : null
              );
              setProfileAddress(detectedAddr);
            }
          }
        } catch (revErr) {
          console.error("Reverse geocoding GPS failed:", revErr);
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-[#001e66] z-50" aria-hidden="true" />
        <div className="text-center space-y-5">
          {/* Logo lockup */}
          <div className="flex items-center justify-center space-x-3 mb-2">
            <img src="/LOGO2.png" alt="AquaTrack" className="h-10 w-auto object-contain" />
            <span className="text-xl font-black tracking-tight text-[#001e66]">
              AQUA<span className="text-[#00aeef]">TRACK</span>
            </span>
          </div>
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200" />
            <div className="absolute inset-0 rounded-full border-[3px] border-t-[#00aeef] animate-spin" />
          </div>
          <p className="text-slate-400 text-[11px] font-semibold tracking-widest uppercase animate-pulse">
            Loading Resident Portal…
          </p>
        </div>
      </div>
    );
  }

  // Find the nearest node to the current geocoded address coordinates
  const getNearestNode = () => {
    if (!nodes || nodes.length === 0) return null;
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) return null;

    let nearest: any = null;
    let minDistance = Infinity;

    for (const node of nodes) {
      if (!node.latitude || !node.longitude) continue;
      // Haversine formula
      const R = 6371000; // meters
      const dLat = ((node.latitude - lat) * Math.PI) / 180;
      const dLng = ((node.longitude - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((node.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...node, distanceMeters: distance };
      }
    }
    return nearest;
  };

  const calculateWaterHealthIndex = (reading: any) => {
    if (!reading) return 100;
    const { ph = 7.2, turbidity = 0.8, tds = 150, pressure = 42 } = reading;

    // pH Score (6.5 to 8.5 acceptable, 7.0 to 7.8 optimal)
    let phScore = 100;
    if (ph < 6.5) phScore = Math.max(10, 100 - (6.5 - ph) * 40);
    else if (ph > 8.5) phScore = Math.max(10, 100 - (ph - 8.5) * 40);
    else phScore = 100 - Math.abs(ph - 7.2) * 15;

    // Turbidity Score (<= 5 NTU acceptable, <= 1 NTU optimal)
    let turbScore = 100;
    if (turbidity > 5.0) turbScore = Math.max(10, 40 - (turbidity - 5.0) * 15);
    else if (turbidity > 1.0) turbScore = 100 - (turbidity - 1.0) * 15;

    // TDS Score (<= 600 ppm acceptable, <= 300 ppm optimal)
    let tdsScore = 100;
    if (tds > 600) tdsScore = Math.max(10, 50 - (tds - 600) * 0.1);
    else if (tds > 300) tdsScore = 100 - (tds - 300) * 0.16;

    // Pressure Score (15 to 60 PSI acceptable, 30 to 50 PSI optimal)
    let pressScore = 100;
    if (pressure < 15) pressScore = Math.max(10, 50 - (15 - pressure) * 3);
    else if (pressure > 60) pressScore = Math.max(10, 50 - (pressure - 60) * 3);
    else if (pressure < 30) pressScore = 100 - (30 - pressure) * 2;
    else if (pressure > 50) pressScore = 100 - (pressure - 50) * 3;

    const average = (phScore + turbScore + tdsScore + pressScore) / 4;
    return Math.round(average * 10) / 10;
  };

  const nearestNodeRaw = getNearestNode();
  const isOutOfCoverage = isOutOfScope || !nearestNodeRaw || nearestNodeRaw.distanceMeters > 2000;
  const nearestNode = isOutOfCoverage ? null : nearestNodeRaw;
  const healthIndex = nearestNode?.reading ? calculateWaterHealthIndex(nearestNode.reading) : null;

  let statusText = "No Data";
  let statusColorClass = "text-slate-500 bg-slate-50 border-slate-200/50";
  if (healthIndex !== null) {
    if (healthIndex < 65) {
      statusText = "Low Quality";
      statusColorClass = "text-rose-600 bg-rose-50 border-rose-100/50";
    } else if (healthIndex < 80) {
      statusText = "Acceptable";
      statusColorClass = "text-amber-600 bg-amber-50 border-amber-100/50";
    } else if (healthIndex < 90) {
      statusText = "Safe";
      statusColorClass = "text-blue-600 bg-blue-50 border-blue-100/50";
    } else {
      statusText = "Optimal";
      statusColorClass = "text-emerald-600 bg-emerald-50 border-emerald-100/50";
    }
  }

  // Dynamic Municipal Water Supply Status check
  const hasActiveWarning = advisories.some(ad => ad.type === "warning");
  const hasLowPressure = nodes.some(node => node.reading && (node.reading.pressure < 20));
  
  let supplyStatusText = "MUNICIPAL WATER SUPPLY IS NORMAL";
  let supplyStatusColor = "text-emerald-300 bg-[#189BFF]/25 border-white/20";
  let supplyStatusPing = "bg-emerald-400";
  
  if (hasActiveWarning) {
    supplyStatusText = "⚠️ DISTRICT WATER ADVISORY ACTIVE";
    supplyStatusColor = "text-amber-300 bg-amber-500/20 border-amber-300/30";
    supplyStatusPing = "bg-amber-400";
  } else if (hasLowPressure) {
    supplyStatusText = "⚠️ LOW PRESSURE DETECTED IN GRID";
    supplyStatusColor = "text-amber-300 bg-amber-500/20 border-amber-300/30";
    supplyStatusPing = "bg-amber-400";
  }

  const filteredAdvisories = advisories.filter(
    (ad) => !ad.targetRole || ad.targetRole === "broadcast" || ad.targetRole === "consumers"
  );
  const unreadCount = filteredAdvisories.filter((ad) => !viewedAdvisoryIds.includes(ad.id)).length;
  
  const displayedAdvisories = filteredAdvisories.filter((ad) => {
    if (advisoryFilter === "warning") return ad.type === "warning";
    if (advisoryFilter === "info") return ad.type !== "warning";
    return true;
  });

  const ADVISORIES_PER_PAGE = 5;
  const totalAdvisoryPages = Math.ceil(displayedAdvisories.length / ADVISORIES_PER_PAGE);
  const currentPage = Math.min(advisoryPage, Math.max(totalAdvisoryPages, 1));
  const paginatedAdvisories = displayedAdvisories.slice(
    (currentPage - 1) * ADVISORIES_PER_PAGE,
    currentPage * ADVISORIES_PER_PAGE
  );

  return (
    <div className="min-h-screen text-[#001e66] flex flex-col font-sans relative bg-[#E2EAF4]">
      {/* Background Image Layer with custom opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/BG.jpg')", opacity: 0.5 }}
      />


      {/* ── Header ── */}
      <header className="bg-[#eef4fa] dark:bg-[#07142F] border-b border-slate-300/80 dark:border-white/10 sticky top-0 z-50 shadow-md relative transition-colors duration-300 shrink-0">
        <div className="w-full pl-6 pr-4">
          <div className="flex justify-between h-24 pt-1.5 items-center">
            {/* Left Section (Logo + Nav tabs side-by-side) */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-1.5 text-slate-500 hover:text-[#001e66] hover:bg-slate-50 rounded-xl transition-all focus:outline-none cursor-pointer"
                  aria-label="Open sidebar navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <img
                  src={isDark ? "/LOGO3.png" : "/LOGO2.png"}
                  alt="AquaTrack Logo"
                  className="h-25 w-auto translate-y-1 hover:opacity-90 transition-opacity shrink-0"
                />
              </div>

              {/* Navigation Tabs Navbar (Desktop Only) next to Logo */}
              <nav className="hidden lg:flex items-center space-x-1 rounded-full border border-slate-200/80 bg-slate-50/80 dark:bg-slate-800/40 p-1 shadow-inner">
                {[
                  { key: "home",               label: "Dashboard" },
                  { key: "file-complaint",     label: "File a Complaint" },
                  { key: "track-complaint",    label: "Track Complaints" },
                  { key: "view-announcements", label: "Advisories" },
                ].map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key as any)}
                      className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer select-none ${
                        isActive
                          ? "bg-blue-600 text-white shadow-[0_3px_10px_rgba(37,99,235,0.25)] scale-[1.02]"
                          : "text-slate-600 hover:text-blue-600 hover:bg-slate-100/60"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Notification dropdown wrapper */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative w-9 h-9 rounded-full border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#001e66] transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white font-black text-[8px] items-center justify-center border-2 border-white shadow-sm">
                        {unreadCount}
                      </span>
                    </span>
                  )}
                </button>

                {/* Notification Popover Dropdown */}
                <AnimatePresence>
                  {isNotificationOpen && (
                    <>
                      {/* Invisible Backdrop to close */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                      
                      {/* Dropdown Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,30,102,0.12)] z-50 overflow-hidden text-left"
                      >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                          <span className="text-xs font-black text-[#001e66] dark:text-slate-200 uppercase tracking-wider">Advisories & Alerts</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAdvisoriesAsRead}
                              className="text-[10px] font-black text-[#00aeef] hover:text-[#0090c8] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                               <div className="max-h-72 overflow-y-auto p-2 space-y-1.5 bg-slate-50/30 dark:bg-slate-950/20 text-left">
                          {filteredAdvisories.map((ad) => {
                            const isUnread = !viewedAdvisoryIds.includes(ad.id);
                            let headerColor = "text-[#001e66] dark:text-blue-300";
                            let iconBg = "bg-blue-500/10";
                            let iconColor = "text-blue-500";
                            let IconComponent = Megaphone;
                            
                            if (ad.type === "warning") {
                              headerColor = "text-red-650 dark:text-red-400";
                              iconBg = "bg-red-500/10";
                              iconColor = "text-red-500";
                              IconComponent = AlertTriangle;
                            }

                            return (
                              <div
                                key={ad.id}
                                onClick={() => {
                                  markAdvisoryAsRead(ad.id);
                                  setActiveTab("view-announcements");
                                  setIsNotificationOpen(false);
                                }}
                                className={`p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-pointer relative text-left ${
                                  isUnread ? "ring-1 ring-blue-500/15 bg-blue-50/10 dark:bg-blue-950/5" : ""
                                }`}
                              >
                                {/* Icon Box */}
                                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                                  <IconComponent className={`w-4 h-4 ${iconColor}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className={`font-bold text-[11px] ${headerColor} truncate`}>
                                      {ad.title}
                                    </span>
                                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono shrink-0 mt-0.5">
                                      {ad.date}
                                    </span>
                                  </div>
                                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[9.5px] leading-relaxed line-clamp-2">
                                    {ad.text}
                                  </p>
                                </div>
                                
                                {/* Blue unread dot in top-right */}
                                {isUnread && (
                                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                )}
                              </div>
                            );
                          })}
                          {filteredAdvisories.length === 0 && (
                            <div className="p-6 text-center text-slate-400 dark:text-slate-500 italic text-[11px]">
                              No active system alarms or advisories.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Optional theme toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                aria-label="Toggle dark mode"
                className="w-9 h-9 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#001e66] transition-all"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Profile Selector & Dropdown */}
              <div className="relative">
                <div 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-all select-none"
                >
                  <div className="w-7 h-7 rounded-full bg-[#00aeef] text-white flex items-center justify-center text-xs font-black uppercase shadow-sm">
                    {userProfile?.name?.slice(0, 1).toLowerCase() || "c"}
                  </div>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-[11px] font-bold text-[#001e66] dark:text-slate-200">
                      {userProfile?.name || "consumer"}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                      {userProfile?.email || "consumer@gmail.com"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </div>

                {/* Profile Dropdown Popover */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,30,102,0.12)] z-50 overflow-hidden text-left py-1"
                      >
                        <button
                          onClick={() => {
                            setIsAccountDetailsOpen(true);
                            setIsProfileOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#001e66] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          Manage Account
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-650 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50 dark:border-slate-800/50"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1 p-4 gap-4 bg-transparent relative z-10">



        {/* ── Mobile Sidebar Drawer ── */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 bg-slate-950 z-50 lg:hidden"
              />
              {/* Drawer Content */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-50 flex flex-col lg:hidden h-full overflow-y-auto"
              >
                {/* Drawer Header */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
                  <div className="flex items-center gap-3">
                    <img src="/LOGO2.png" alt="AquaTrack Logo" className="h-8 w-auto object-contain" />
                    <span className="text-base font-black tracking-tight text-[#001e66]">
                      AQUA<span className="text-[#00aeef]">TRACK</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Drawer Nav Items */}
                <div className="flex-1 py-3 px-3">
                  {/* Resident Menu Header */}
                  <div className="px-3 mb-5 mt-2 flex items-center justify-start gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    {/* Activity icon on the left */}
                    <div className="p-1.5 rounded-lg bg-[#00aeef]/10 dark:bg-[#00aeef]/20 shrink-0">
                      <Activity className="w-5 h-5 text-[#00aeef] animate-pulse" />
                    </div>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[12px] md:text-[14px] font-black text-[#001e66] dark:text-white uppercase tracking-wider">
                        Resident Menu
                      </span>
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-[#00aeef] mt-1 block">
                        AquaTrack
                      </span>
                    </div>
                  </div>
                  <nav className="flex flex-col gap-1">
                    {[
                      { key: "home",               label: "Dashboard",             icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                      { key: "file-complaint",     label: "File a Complaint",      icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
                      { key: "track-complaint",    label: "Track Complaints",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
                      { key: "view-announcements", label: "Community Advisories",  icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
                    ].map((item) => {
                      const isActive = activeTab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            setActiveTab(item.key as any);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none relative group duration-200 ${
                            isActive
                              ? "bg-blue-600 dark:bg-blue-600/90 text-white font-bold shadow-[0_4px_12px_rgba(37,99,235,0.25)] scale-[1.02]"
                              : "text-slate-500 hover:text-blue-600 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 bg-white rounded-r-md animate-pulse" />
                          )}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-4.5 h-4.5 shrink-0 transition-all duration-300 ${
                              isActive ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]" : "text-slate-400 group-hover:text-blue-600"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={isActive ? 2.25 : 1.75}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                          </svg>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Sidebar bottom: compliance badges widget */}
                <div className="px-3 py-3 border-t border-slate-100 space-y-2.5 mt-auto">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Compliance</p>
                    
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/60">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>RA 10173 Compliant</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-100/60">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>PNSDW Validated</span>
                    </div>
                  </div>
                  
                  <p className="text-[9px] text-slate-400 font-semibold text-center mt-1">
                    © 2026 AQUATRACK
                  </p>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content Area ── */}
        <main className="flex-1 rounded-2xl shadow-sm flex flex-col bg-white border border-slate-100/80 p-8">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulse {
              0% { transform: scale(0.95); opacity: 0.8; }
              50% { transform: scale(1.4); opacity: 0.3; }
              100% { transform: scale(1.85); opacity: 0; }
            }
          `}} />
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
                <div className="space-y-8 animate-fade-in pb-8">
                  
                  {/* Immersive Water-Themed Hero Banner */}
                  <div 
                    className="bg-[#0B2E7A] rounded-[24px] py-5 px-6 md:py-6 md:px-8 text-white relative overflow-hidden shadow-md h-[220px] flex flex-col justify-center bg-cover bg-center"
                    style={{ backgroundImage: "url('/headerpic.png')" }}
                  >
                    {/* Blue Tint Overlay */}
                    <div className="absolute inset-0 bg-[#0B2E7A]/85 z-0 pointer-events-none" />

                    {/* Animated Wave Background SVG Overlay */}
                    <div className="absolute inset-0 opacity-15 pointer-events-none z-0">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,40 Q25,30 50,40 T100,40 L100,100 L0,100 Z" fill="rgba(255,255,255,0.08)"></path>
                        <path d="M0,50 Q30,60 60,50 T100,50 L100,100 L0,100 Z" fill="rgba(255,255,255,0.04)"></path>
                        {/* Little bubbles */}
                        <circle cx="15" cy="30" r="1" fill="#fff" opacity="0.3" />
                        <circle cx="20" cy="20" r="1.5" fill="#fff" opacity="0.4" />
                        <circle cx="35" cy="45" r="0.8" fill="#fff" opacity="0.2" />
                        <circle cx="65" cy="25" r="2" fill="#fff" opacity="0.3" />
                        <circle cx="80" cy="35" r="1.2" fill="#fff" opacity="0.5" />
                      </svg>
                    </div>

                    {/* Municipal Water Tower Illustration */}
                    <svg className="absolute right-6 bottom-0 h-48 w-auto opacity-80 md:opacity-90 drop-shadow-[0_8px_24px_rgba(24,155,255,0.45)] select-none pointer-events-none z-0" viewBox="0 0 100 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <ellipse cx="50" cy="40" rx="28" ry="18" fill="url(#heroTankGrad)" stroke="#ffffff" strokeWidth="1.5" />
                      <rect x="22" y="40" width="56" height="15" fill="url(#heroTankGrad)" stroke="#ffffff" strokeWidth="1.5" />
                      <ellipse cx="50" cy="54" rx="28" ry="10" fill="#55C5FF" opacity="0.8" />
                      <ellipse cx="50" cy="30" rx="28" ry="10" fill="#ffffff" opacity="0.3" />
                      <path d="M22 35 H78 M22 45 H78" stroke="#ffffff" strokeWidth="0.75" opacity="0.4" />
                      <text x="50" y="49" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">AQUATRACK</text>
                      <line x1="30" y1="52" x2="20" y2="150" stroke="#ffffff" strokeWidth="2.5" />
                      <line x1="70" y1="52" x2="80" y2="150" stroke="#ffffff" strokeWidth="2.5" />
                      <line x1="50" y1="54" x2="50" y2="150" stroke="#ffffff" strokeWidth="1.5" />
                      <line x1="30" y1="78" x2="70" y2="78" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
                      <line x1="26" y1="110" x2="74" y2="110" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
                      <line x1="30" y1="52" x2="70" y2="110" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
                      <line x1="70" y1="52" x2="30" y2="110" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
                      <rect x="15" y="148" width="9" height="6" rx="0.5" fill="#e2e8f0" opacity="0.9" />
                      <rect x="76" y="148" width="9" height="6" rx="0.5" fill="#e2e8f0" opacity="0.9" />
                      <rect x="46" y="148" width="8" height="6" rx="0.5" fill="#e2e8f0" opacity="0.9" />
                      <defs>
                        <linearGradient id="heroTankGrad" x1="50" y1="20" x2="50" y2="54" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="100%" stopColor="#189BFF" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="relative z-10 space-y-4 max-w-xl text-left">
                      <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 shadow-inner">
                        Consumer Resident Portal
                      </span>
                      <div>
                        <h2 className="text-2xl sm:text-3.5xl md:text-4xl font-black tracking-tight drop-shadow-sm leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                          Welcome Back, {userProfile?.name || "Valued Consumer"}!
                        </h2>
                        <p className="text-[11px] text-blue-100 font-bold tracking-wide mt-1.5 opacity-90">
                          {userProfile?.address || "No address registered yet"}
                        </p>
                      </div>
                      <div className="flex pt-1">
                        <span className={`inline-flex items-center gap-2 border text-[10px] font-black tracking-wider px-3.5 py-1.5 rounded-full shadow-inner transition-all ${supplyStatusColor}`}>
                          <span className={`w-2 h-2 rounded-full inline-block animate-ping ${supplyStatusPing}`} />
                          {supplyStatusText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Cards (3 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    
                    {/* Active Tickets Stat */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(24,155,255,0.04)] hover:border-blue-100/50 hover:scale-[1.01] relative overflow-hidden group">
                      <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Active Tickets</span>
                          <h3 className="text-3xl font-black text-[#0B2E7A] tracking-tight">
                            {myComplaints.filter(c => c.status !== "RESOLVED").length}
                          </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50/80 flex items-center justify-center border border-blue-100 shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <div className="w-5 h-6 rounded border-2 border-blue-500 bg-blue-50/80 flex flex-col justify-between p-1 shrink-0">
                            <div className="w-full h-0.5 bg-blue-500 rounded" />
                            <div className="w-full h-0.5 bg-blue-500 rounded" />
                            <div className="w-2/3 h-0.5 bg-blue-500 rounded" />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mt-4 relative z-10">Tickets in triage or active dispatch</p>
                      
                      {/* Wave Line decorative */}
                      <svg className="absolute bottom-0 left-0 w-full h-8 text-blue-500/5 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
                        <path d="M0,160L48,149.3C96,139,192,117,288,128C384,139,480,181,576,181.3C672,181,768,139,864,117.3C960,96,1056,96,1152,117.3C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                      </svg>
                    </div>

                    {/* In Progress Stat */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(24,155,255,0.04)] hover:border-blue-100/50 hover:scale-[1.01] relative overflow-hidden group">
                      <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">In Progress</span>
                          <h3 className="text-3xl font-black text-[#0B2E7A] tracking-tight">
                            {myComplaints.filter(c => c.status === "ASSIGNED" || c.status === "INVESTIGATING").length}
                          </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-50/80 flex items-center justify-center border border-amber-100 shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <div className="w-6 h-2 bg-slate-100 rounded-full overflow-hidden border border-amber-300/80 flex shrink-0 p-0">
                            <div className="w-1/2 h-full bg-amber-500 rounded-full" />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mt-4 relative z-10">Crew currently dispatched to site</p>
                      
                      <svg className="absolute bottom-0 left-0 w-full h-8 text-amber-500/5 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
                        <path d="M0,224L48,208C96,192,192,160,288,144C384,128,480,128,576,144C672,160,768,192,864,208C960,224,1056,224,1152,197.3C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                      </svg>
                    </div>

                    {/* Resolved Stat */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(24,155,255,0.04)] hover:border-blue-100/50 hover:scale-[1.01] relative overflow-hidden group">
                      <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Resolved</span>
                          <h3 className="text-3xl font-black text-[#0B2E7A] tracking-tight">
                            {myComplaints.filter(c => c.status === "RESOLVED").length}
                          </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50/80 flex items-center justify-center border border-emerald-100 shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <div className="w-2 h-3.5 border-r-[2.5px] border-b-[2.5px] border-emerald-600 transform rotate-45 -translate-y-0.5 shrink-0" />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mt-4 relative z-10">Incidents fully resolved & closed</p>
                      
                      <svg className="absolute bottom-0 left-0 w-full h-8 text-emerald-500/5 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
                        <path d="M0,96L48,128C96,160,192,224,288,240C384,256,480,224,576,181.3C672,139,768,85,864,90.7C960,96,1056,160,1152,192C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                      </svg>
                    </div>

                  </div>

                  {/* Middle Column Grid (Left 60% / Right 40%) */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                    
                    {/* Left 60%: Active Tickets List */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] lg:col-span-3 flex flex-col justify-between min-h-[380px]">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="text-xs font-black text-[#0B2E7A] tracking-wider uppercase flex items-center gap-2">
                            <span className="w-1.5 h-3 bg-[#189BFF] rounded-full inline-block" />
                            Active Tickets
                          </h3>
                          <button 
                            onClick={() => setActiveTab("track-complaint")}
                            className="text-[10px] font-black text-[#189BFF] hover:text-[#0B2E7A] transition-colors uppercase tracking-wider font-sans"
                          >
                            View All &rarr;
                          </button>
                        </div>

                        {/* List */}
                        <div className="divide-y divide-slate-50 text-left">
                          {myComplaints.filter(c => c.status !== "RESOLVED").slice(0, 4).map((ticket) => {
                            const isPending = ticket.status === "PENDING";
                            const isAssigned = ticket.status === "ASSIGNED" || ticket.status === "INVESTIGATING";
                            return (
                              <div key={ticket.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-colors group cursor-pointer" onClick={() => setActiveTab("track-complaint")}>
                                <div className="flex items-center space-x-3.5 min-w-0">
                                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[#189BFF] shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                                      <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
                                    </svg>
                                  </div>
                                  <div className="text-left min-w-0">
                                    <p className="text-xs font-black text-[#0B2E7A] truncate group-hover:text-[#189BFF] transition-colors">
                                      {ticket.summary}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                      Brgy. {ticket.barangay || "Del Pilar"} • Ticket #{ticket.id.slice(0, 6).toUpperCase()}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3 shrink-0 ml-4">
                                  <div className="flex flex-col items-end">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                                      isPending 
                                        ? "bg-amber-50 text-amber-700 border-amber-200/50" 
                                        : isAssigned 
                                        ? "bg-blue-50 text-blue-700 border-blue-200/50" 
                                        : "bg-slate-50 text-slate-700 border-slate-200/50"
                                    }`}>
                                      {ticket.status}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold mt-1">
                                      {new Date(ticket.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#189BFF] group-hover:translate-x-0.5 transition-all">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                  </svg>
                                </div>
                              </div>
                            );
                          })}

                          {myComplaints.filter(c => c.status !== "RESOLVED").length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xs font-black text-[#0B2E7A]">All Clear!</p>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">You have no active reported incident tickets.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab("track-complaint")}
                        className="w-full bg-slate-50 hover:bg-blue-50 text-[#0B2E7A] hover:text-[#189BFF] font-black text-xs py-3 rounded-xl uppercase tracking-wider border border-slate-100 transition-colors mt-6 text-center cursor-pointer"
                      >
                        Go to Track Complaints
                      </button>
                    </div>

                    {/* Right 40%: Latest Bulletin */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] lg:col-span-2 flex flex-col justify-between min-h-[380px]">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="text-xs font-black text-[#0B2E7A] tracking-wider uppercase flex items-center gap-2">
                            <span className="w-1.5 h-3 bg-[#189BFF] rounded-full inline-block" />
                            Latest Bulletin
                          </h3>
                          <button 
                            onClick={() => setActiveTab("view-announcements")}
                            className="text-[10px] font-black text-[#189BFF] hover:text-[#0B2E7A] transition-colors uppercase tracking-wider font-sans"
                          >
                            View All &rarr;
                          </button>
                        </div>

                        {filteredAdvisories.length > 0 ? (
                          <div className="space-y-4 text-left">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/40 shrink-0">
                                <Megaphone className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-[#0B2E7A] line-clamp-1 leading-snug">
                                  {filteredAdvisories[0].title}
                                </h4>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                  {filteredAdvisories[0].date} • Broadcast Notice
                                </p>
                              </div>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed font-semibold bg-slate-50 p-4 rounded-2xl border border-slate-100/60 line-clamp-4">
                              {filteredAdvisories[0].text}
                            </p>
                          </div>
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                              <Megaphone className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#0B2E7A]">No Bulletins</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">No announcements have been broadcasted yet.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pagination Dots Indicator */}
                      <div className="flex items-center justify-center gap-1.5 pt-4 mt-auto">
                        <span className="w-2.5 h-1.5 rounded-full bg-[#189BFF]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      </div>
                    </div>

                  </div>

                  {/* Water Supply Overview Card (Glass-inspired) */}
                  <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm relative overflow-hidden text-left">
                    {/* Background Wave Graphic */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none select-none z-0">
                      <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,160 Q360,260 720,160 T1440,160 L1440,320 L0,320 Z" fill="#189BFF"></path>
                      </svg>
                    </div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      
                      {/* Left: Health Index Overview */}
                      <div className="lg:col-span-5 flex items-start space-x-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#189BFF] border border-blue-100/40 shrink-0 shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6.5 h-6.5">
                            <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
                          </svg>
                        </div>
                        <div className="space-y-1 text-left">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumer Water Health Index</p>
                          <div className="flex items-center gap-2">
                            <h4 className="text-2xl font-black text-[#0B2E7A] tracking-tight">
                              {healthIndex !== null ? `${healthIndex}%` : "No Data"}
                            </h4>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-wider ${statusColorClass}`}>
                              {statusText}
                            </span>
                            {healthIndex !== null && (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                            {nearestNode ? `Calculated from nearest node: ${nearestNode.name}` : "PNSDW standard compliance level verified"}
                          </p>
                          {nearestNode && (
                            <p className="text-[9px] text-slate-400 font-bold">
                              Distance: {nearestNode.distanceMeters ? `${Math.round(nearestNode.distanceMeters)}m` : "Nearby"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Live Parameter Cards or Out of Range Warning */}
                      <div className="lg:col-span-7">
                        {nearestNode ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                📡 Live Local Telemetry
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {/* pH Card */}
                              <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-2xl text-left space-y-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">pH Level</span>
                                <p className="text-base font-black text-[#0B2E7A]">
                                  {nearestNode.reading?.ph ? nearestNode.reading.ph.toFixed(1) : "7.2"}
                                </p>
                                <p className="text-[8px] text-emerald-600 font-bold bg-emerald-50/50 px-1 py-0.5 rounded border border-emerald-100/40 inline-block">6.5 - 8.5 Safe</p>
                              </div>

                              {/* Turbidity Card */}
                              <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-2xl text-left space-y-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Turbidity</span>
                                <p className="text-base font-black text-[#0B2E7A]">
                                  {nearestNode.reading?.turbidity ? `${nearestNode.reading.turbidity.toFixed(2)} NTU` : "0.80 NTU"}
                                </p>
                                <p className="text-[8px] text-emerald-600 font-bold bg-emerald-50/50 px-1 py-0.5 rounded border border-emerald-100/40 inline-block">&lt; 5 NTU Safe</p>
                              </div>

                              {/* TDS Card */}
                              <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-2xl text-left space-y-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">TDS Index</span>
                                <p className="text-base font-black text-[#0B2E7A]">
                                  {nearestNode.reading?.tds ? `${Math.round(nearestNode.reading.tds)} ppm` : "150 ppm"}
                                </p>
                                <p className="text-[8px] text-emerald-600 font-bold bg-emerald-50/50 px-1 py-0.5 rounded border border-emerald-100/40 inline-block">&lt; 600 Safe</p>
                              </div>

                              {/* Pressure Card */}
                              <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-2xl text-left space-y-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pressure</span>
                                <p className="text-base font-black text-[#0B2E7A]">
                                  {nearestNode.reading?.pressure ? `${Math.round(nearestNode.reading.pressure)} PSI` : "42 PSI"}
                                </p>
                                <p className="text-[8px] text-emerald-600 font-bold bg-emerald-50/50 px-1 py-0.5 rounded border border-emerald-100/40 inline-block">15 - 60 Safe</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200/60 p-5 rounded-[20px] text-left shadow-[inset_0_2px_4px_rgba(245,158,11,0.01)]">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200/40 shrink-0">
                              <MapPinOff className="w-5.5 h-5.5 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                No Nearest IoT Node in Range
                              </h5>
                              <p className="text-[10px] text-amber-800/90 font-semibold leading-relaxed">
                                Live local telemetry sensors are currently unavailable for this area. Municipal baseline index indicates safe water supply across all parameters.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>



                  {/* Contact Water District Section */}
                  <div className="space-y-4 text-left pt-2">
                    <h3 className="text-xs font-black text-[#0B2E7A] dark:text-[#93c5fd] tracking-wider uppercase flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-[#189BFF] rounded-full inline-block" />
                      Contact Water District Support
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Customer Hotline Card */}
                      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md text-left flex flex-col justify-between min-h-[220px]">
                        <h4 className="text-xs font-black text-[#0B2E7A] dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#00aeef] shrink-0" />
                          Customer Hotline Desk
                        </h4>
                        
                        <div className="flex-grow flex flex-col justify-center space-y-4 py-1">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-850 flex items-center justify-center text-blue-500 shrink-0 border border-blue-100/30 shadow-xs">
                              <PhoneCall className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Helpline</p>
                              <p className="text-base font-black text-[#0B2E7A] dark:text-slate-200 mt-0.5 leading-snug">(045) 961-3546</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-850 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100/30 shadow-xs">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Support</p>
                              <a href="mailto:support@csfwd.gov.ph" className="text-base font-black text-[#00aeef] hover:underline mt-0.5 block leading-snug">support@csfwd.gov.ph</a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Main Office Address Card */}
                      <div 
                        onMouseEnter={() => setLoadMiniMap(true)}
                        className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:shadow-md text-left flex flex-col justify-between relative overflow-hidden group min-h-[220px]"
                      >
                        {/* Background Image Container */}
                        <div 
                          className="absolute inset-0 bg-cover bg-no-repeat z-0 transition-transform duration-500 group-hover:scale-105"
                          style={{ backgroundImage: "url('/headerpic.png')", backgroundPosition: "center 20%" }}
                        />
                        {/* White/Dark Overlay: background opacity is lessened on hover to overlay the map cleanly */}
                        <div className="absolute inset-0 bg-white/90 dark:bg-slate-950/85 z-25 transition-all duration-300 group-hover:bg-white/40 group-hover:dark:bg-slate-950/45 pointer-events-none" />

                        {/* Content Overlay - absolute inset-0 with h-full and justify-end forces the text items to sit at the bottom */}
                        <div className="absolute inset-0 p-6 z-30 flex flex-col justify-end h-full pointer-events-none">
                          <div className="flex items-end justify-between w-full pointer-events-auto transition-all duration-300">
                            <div className="flex items-start gap-3.5 transform group-hover:translate-x-1">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-850 flex items-center justify-center text-[#00aeef] shrink-0 border border-blue-100/30 shadow-xs">
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Main Office Address</p>
                                <p className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-200 mt-0.5 leading-snug">
                                  2MMQ+68, San Fernando, Pampanga
                                </p>
                              </div>
                            </div>

                            {/* Open in Maps Button */}
                            <a 
                              href="https://www.google.com/maps/search/?api=1&query=2MMQ%2B68,%20San%20Fernando,%20Pampanga" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00aeef] hover:bg-[#009ed9] text-white text-[10px] font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-200 shrink-0 select-none cursor-pointer"
                            >
                              <span>Open in Maps</span>
                              <Compass className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Hover Google Maps Iframe Container */}
                        {loadMiniMap && (
                          <div className="absolute inset-0 w-full h-full z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[24px] overflow-hidden">
                            <iframe 
                              src="https://maps.google.com/maps?q=2MMQ%2B68,%20San%20Fernando,%20Pampanga&z=17&output=embed"
                              className="w-full h-full border-0 pointer-events-auto"
                              loading="lazy"
                              title="CSFWD Headquarters Location"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 1: File a Complaint */}
              {activeTab === "file-complaint" && (
                <div className="flex flex-col h-full gap-5">
                  {/* Page Header */}
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm shrink-0">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-[#00aeef] border border-blue-100 shadow-sm shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-[1.75rem] font-black text-[#001e66] leading-tight">File an Incident Report</h1>
                      <p className="text-[0.9rem] text-slate-500 font-bold">Help us keep our water clean and our community safe.</p>
                    </div>
                  </div>

                  {/* 2-Column Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch flex-1 min-h-0">
                    
                    {/* Left Card: Form Inputs / Success State */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col justify-between h-full gap-5 overflow-y-auto">
                      {submitSuccess ? (
                        <div className="space-y-5 my-auto animate-fade-in">
                          <div className="flex items-center space-x-3 text-emerald-600">
                            <span className="text-3xl">🎉</span>
                            <div>
                              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-800 leading-none">
                                Report Logged Successfully
                              </h3>
                              <p className="text-[10px] text-slate-500 font-bold mt-1.5">
                                Your water issue ticket has been registered and is active in the dispatch queue.
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-b border-slate-100 py-4 space-y-4 text-xs">
                            <div>
                              <strong className="text-slate-450 uppercase tracking-widest text-[9px] block mb-1">
                                Report Summary (AI Diagnostics)
                              </strong>
                              <p className="text-[#001e66] font-extrabold text-sm italic leading-relaxed">
                                "{aiAnalysis?.summary || "Resident reported water quality concern."}"
                              </p>
                            </div>

                            <div>
                              <strong className="text-slate-450 uppercase tracking-widest text-[9px] block mb-1">
                                Your Detailed Description
                              </strong>
                              <p className="text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-semibold leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {lastSubmittedComplaint?.rawText}
                              </p>
                            </div>

                            {lastSubmittedComplaint?.imageUrl && (
                              <div>
                                <strong className="text-slate-450 uppercase tracking-widest text-[9px] block mb-1.5">
                                  Attached Photo
                                </strong>
                                <div className="w-40 h-28 rounded-xl overflow-hidden border border-slate-200">
                                  <img src={lastSubmittedComplaint.imageUrl} alt="Submitted incident" className="w-full h-full object-cover" />
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 font-mono text-xxs border-t border-slate-100 pt-4">
                              <div>
                                <strong className="text-slate-400 uppercase tracking-widest block mb-0.5 text-[8px]">Barangay</strong>
                                <span className="font-bold text-slate-700">
                                  {lastSubmittedComplaint?.barangay || "San Fernando"}
                                </span>
                              </div>
                              <div>
                                <strong className="text-slate-400 uppercase tracking-widest block mb-0.5 text-[8px]">Coordinates</strong>
                                <span className="font-bold text-slate-700">
                                  {lastSubmittedComplaint?.latitude.toFixed(6)}, {lastSubmittedComplaint?.longitude.toFixed(6)}
                                </span>
                              </div>
                              <div>
                                <strong className="text-slate-400 uppercase tracking-widest block mb-0.5 text-[8px]">Urgency</strong>
                                <span className="font-black text-rose-600 uppercase">
                                  {aiAnalysis?.urgency || "MEDIUM"}
                                </span>
                              </div>
                              <div>
                                <strong className="text-slate-400 uppercase tracking-widest block mb-0.5 text-[8px]">Category</strong>
                                <span className="font-bold text-slate-700 uppercase">
                                  {aiAnalysis?.category?.replace(/_/g, " ") || "UNCLASSIFIED"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => {
                                setSubmitSuccess(false);
                                setAiAnalysis(null);
                                setLastSubmittedComplaint(null);
                              }}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#001e66] font-black text-xs py-3 px-6 rounded-xl uppercase tracking-wider transition-all cursor-pointer text-center border border-slate-200/50"
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
                              className="flex-1 bg-[#001e66] hover:bg-[#00aeef] text-white font-black text-xs py-3 px-6 rounded-xl uppercase tracking-wider transition-all cursor-pointer text-center shadow"
                            >
                              Track Active Tickets
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleCreateComplaint} className="flex flex-col h-full justify-between gap-5">
                          {submitError && (
                            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold shrink-0">
                              ⚠ {submitError}
                            </div>
                          )}

                          {/* Step 1: Describe Water Issue */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shadow-sm">1</span>
                              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Describe Water Issue</h3>
                            </div>
                            <div className="relative">
                              <textarea
                                rows={5}
                                value={complaintText}
                                onChange={(e) => setComplaintText(e.target.value.slice(0, 1000))}
                                placeholder="e.g. Mahina ang tubig dito sa amin sa Del Pilar, halos walang tumutulo..."
                                className="w-full bg-white border border-slate-200 text-[#001e66] font-semibold text-xs py-3 px-4 rounded-xl focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20 transition-all resize-none pb-8 shadow-inner"
                              />
                              <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-bold font-mono">
                                {complaintText.length}/1000
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold">
                              Reports can be entered in Tagalog, Taglish, or English.
                            </p>
                          </div>

                          {/* Step 2: Attach Photo (Optional) */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shadow-sm">2</span>
                              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Attach Photo (Optional)</h3>
                            </div>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />

                            {!complaintImageUrl ? (
                              <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setIsDragging(false);
                                  const file = e.dataTransfer.files?.[0];
                                  if (file) uploadFile(file);
                                }}
                                className={`relative w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-5 transition-all ${
                                  isDragging
                                    ? "border-[#00aeef] bg-sky-50/60"
                                    : "border-slate-200 bg-sky-50/20 hover:border-slate-300"
                                }`}
                              >
                                <Upload className="w-8 h-8 text-[#00aeef] mb-1.5" />
                                
                                <p className="text-xs text-slate-500 font-bold text-center mb-2">
                                  Drag and drop an image here or
                                </p>
                                
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00aeef] hover:bg-[#001e66] text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer shadow-sm"
                                >
                                  <Plus className="w-3 h-3" />
                                  Choose File
                                </button>
                                
                                <p className="text-[9px] text-slate-400 font-bold mt-2.5">
                                  JPG, PNG up to 10MB
                                </p>
                              </div>
                            ) : (
                              <div className="relative w-full max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group bg-slate-50 dark:bg-slate-900 p-2 text-center">
                                <img src={complaintImageUrl} alt="Preview" className="w-full max-h-80 object-contain rounded-lg mx-auto" />
                                <button
                                  type="button"
                                  onClick={() => setComplaintImageUrl("")}
                                  className="absolute top-4 right-4 bg-red-600 hover:bg-red-750 text-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-black shadow-lg transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Submit Button */}
                          <div className="pt-2 shrink-0">
                            <button
                              type="submit"
                              disabled={submitting || uploadingPhoto}
                              className="w-full bg-[#00aeef] hover:bg-[#001e66] text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-md hover:shadow-blue-500/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {submitting ? (
                                <>
                                  <Loader2 className="animate-spin w-4 h-4 text-white" />
                                  <span>Filing &amp; Analyzing with AI…</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>File Complaint</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Right Card: Geographic Dispatch Details */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col justify-between h-full gap-4">
                      
                      {/* Header Section */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="#001e66" className="w-4 h-4 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                          </svg>
                          <h3 className="font-extrabold text-[#001e66] text-xs uppercase tracking-wider">Geographic Dispatch Details</h3>
                        </div>
                        
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-left">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                          <div className="flex flex-col leading-none max-w-[140px]">
                            <span className="text-[9px] font-black text-[#001e66] uppercase">Automated GPS Location Pinpoint</span>
                            <span className="text-[7px] text-slate-500 font-bold mt-0.5 truncate block" title={addressSearchQuery || "Awaiting GPS pinpoint..."}>
                              {addressSearchQuery || "Awaiting GPS pinpoint..."}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Address Search */}
                      <div className="space-y-1.5 shrink-0">
                        <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Search Address, Street, or Landmark</label>
                        <div className="flex shadow-sm rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#00aeef] focus-within:ring-2 focus-within:ring-[#00aeef]/10 transition-all bg-white">
                          <div className="flex items-center pl-3 pr-2 text-slate-400 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                            </svg>
                          </div>
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
                            className="flex-1 text-slate-800 font-semibold text-xs py-2 focus:outline-none placeholder-slate-450"
                          />
                          <button
                            type="button"
                            onClick={handleAddressSearch}
                            className="bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold text-xs px-5 py-2 uppercase tracking-wider active:scale-95 transition-all cursor-pointer shrink-0"
                          >
                            Search
                          </button>
                        </div>
                      </div>

                      {/* Map Container */}
                      <div className="w-full flex-1 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner min-h-[220px]">
                        {mapError ? (
                          <div className="absolute inset-0 bg-[#F1F3F5] overflow-hidden flex flex-col items-center justify-center relative select-none">
                            {/* Street Grid SVG Background */}
                            <svg className="absolute inset-0 w-full h-full text-slate-200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                              <defs>
                                <pattern id="street-grid" width="120" height="120" patternUnits="userSpaceOnUse">
                                  <path d="M 0 10 L 120 10 M 10 0 L 10 120 M 0 60 L 120 60 M 60 0 L 60 120" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                  <path d="M 0 110 L 120 110 M 110 0 L 110 120" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3,3" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#street-grid)" />
                              
                              {/* City blocks & Features */}
                              <rect x="20" y="20" width="30" height="30" rx="4" fill="#e2e8f0" />
                              <rect x="70" y="20" width="40" height="30" rx="4" fill="#e2e8f0" />
                              <rect x="20" y="70" width="30" height="40" rx="4" fill="#e2e8f0" />
                              
                              {/* Rivers/water pipe lines mock */}
                              <path d="M -10 100 Q 80 80 130 110 T 260 90 T 400 115" fill="none" stroke="#bae6fd" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                              
                              {/* Street labels */}
                              <text x="18" y="15" fill="#94a3b8" fontSize="8" fontWeight="bold">Del Pilar St.</text>
                              <text x="115" y="55" fill="#94a3b8" fontSize="8" fontWeight="bold" transform="rotate(90, 115, 55)">Sto. Rosario St.</text>
                              <text x="65" y="75" fill="#94a3b8" fontSize="8" fontWeight="bold">Abad Santos Ave.</text>
                            </svg>
                            
                            {/* Blue location pin centered with pulse ring */}
                            <div className="absolute pointer-events-none flex items-center justify-center" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                              <div className="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping border border-blue-500/30"></div>
                              <div className="absolute w-6 h-6 bg-blue-500/10 rounded-full border border-blue-500/40"></div>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00aeef" className="w-8 h-8 filter drop-shadow z-10 animate-bounce">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                            </div>
                            
                            {/* Map connection status banner overlay */}
                            <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700/60 backdrop-blur-sm z-10 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00aeef]" />
                              Custom GIS Mock Engine (Offline Mode)
                            </div>
                            
                            {/* Interactivity: clicking on mock map changes coords slightly */}
                            <div
                              className="absolute inset-0 w-full h-full cursor-crosshair"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const clickY = e.clientY - rect.top;
                                const centerX = rect.width / 2;
                                const centerY = rect.height / 2;
                                
                                // Calculate offset delta
                                const deltaLng = (clickX - centerX) * 0.00001;
                                const deltaLat = (centerY - clickY) * 0.00001;
                                
                                const nextLat = (parseFloat(customLat) + deltaLat).toFixed(6);
                                const nextLng = (parseFloat(customLng) + deltaLng).toFixed(6);
                                
                                userHasManuallyPinnedRef.current = true;
                                setCustomLat(nextLat);
                                setCustomLng(nextLng);
                                setGpsPinpointActive(true);
                              }}
                            />
                          </div>
                        ) : (
                          <div ref={handleMapRef} className="absolute inset-0 w-full h-full" />
                        )}
                        
                        {/* Custom floating map controls on the right (stacked vertically) */}
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                          {/* Zoom In */}
                          <button
                            type="button"
                            onClick={() => clientMapRef.current?.zoomIn()}
                            className="w-8 h-8 rounded-lg bg-white shadow-md hover:bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-600 transition-colors cursor-pointer text-sm"
                            title="Zoom In"
                          >
                            +
                          </button>
                          {/* Zoom Out */}
                          <button
                            type="button"
                            onClick={() => clientMapRef.current?.zoomOut()}
                            className="w-8 h-8 rounded-lg bg-white shadow-md hover:bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-600 transition-colors cursor-pointer text-sm"
                            title="Zoom Out"
                          >
                            −
                          </button>
                          {/* My Location */}
                          <button
                            type="button"
                            onClick={handleRequestLocation}
                            className="w-8 h-8 rounded-lg bg-white shadow-md hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-500 transition-colors cursor-pointer"
                            title="Target Current Location"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m-.386-6.364l1.591 1.591M12 18.75a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z" />
                            </svg>
                          </button>
                          {/* 3D Toggle */}
                          <button
                            type="button"
                            onClick={() => setClientMap3D((v) => !v)}
                            title={clientMap3D ? "Disable 3D View" : "Enable 3D View"}
                            className={`w-8 h-8 rounded-lg shadow-md border flex items-center justify-center text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              clientMap3D
                                ? "bg-[#00aeef] border-[#00aeef] text-white shadow-[#00aeef]/30"
                                : "bg-white border-slate-200 text-slate-500 hover:text-[#00aeef]"
                            }`}
                          >
                            3D
                          </button>
                          {/* Compass / Reset North */}
                          <button
                            type="button"
                            onClick={() => clientMapRef.current?.resetNorth({ duration: 600 })}
                            title="Reset North"
                            className="w-8 h-8 rounded-lg bg-white shadow-md hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#00aeef] transition-colors cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path d="M12 2l2.5 7h-5L12 2zm0 20l-2.5-7h5L12 22zM2 12l7-2.5v5L2 12zm20 0l-7 2.5v-5L22 12z"/>
                            </svg>
                          </button>
                        </div>
                        
                        {/* Out-of-scope overlay banner */}
                        {isOutOfScope && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                            {/* Semi-transparent red tint overlay */}
                            <div className="absolute inset-0 bg-red-900/20 backdrop-blur-[1px]" />
                            <div className="relative flex flex-col items-center gap-2 bg-red-600/95 text-white px-5 py-3.5 rounded-2xl border-2 border-red-400/60 shadow-2xl shadow-red-900/40 max-w-[85%] text-center">
                              <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5 shrink-0 text-red-200">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                <span className="font-black text-[11px] uppercase tracking-widest text-red-100">📍 Out of Service Area</span>
                              </div>
                              <p className="text-[10px] font-bold text-red-100 leading-snug">
                                Pinned location is <span className="text-white font-black">outside the City of San Fernando, Pampanga</span>. Move the pin within the city to file a complaint.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Floating Banner Overlay at bottom */}
                        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1.5 rounded-lg border backdrop-blur-sm shadow z-10 flex items-center gap-1.5 pointer-events-none shrink-0 transition-all ${
                          isOutOfScope
                            ? "bg-red-600/90 text-white border-red-400/50"
                            : "bg-slate-900/90 text-white border-slate-700/60"
                        }`}>
                          {isOutOfScope ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 shrink-0 text-red-200">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                              </svg>
                              <span>Out of scope — move pin inside San Fernando, Pampanga</span>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="#00aeef" className="w-3.5 h-3.5 shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                              </svg>
                              <span>Drag marker or click map to pin exact location</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Location Actions & Fields */}
                      <div className="space-y-3.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleRequestLocation}
                          className="w-full border border-[#00aeef] hover:bg-sky-50/40 text-[#00aeef] font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m-.386-6.364l1.591 1.591M12 18.75a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z" />
                          </svg>
                          <span>Pin My Current Device Location</span>
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latitude</label>
                            <input
                              type="text"
                              readOnly
                              value={customLat}
                              className="w-full bg-slate-50 border border-slate-200 text-[#001e66] font-mono text-xs py-2 px-3 rounded-lg focus:outline-none cursor-not-allowed select-all font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Longitude</label>
                            <input
                              type="text"
                              readOnly
                              value={customLng}
                              className="w-full bg-slate-50 border border-slate-200 text-[#001e66] font-mono text-xs py-2 px-3 rounded-lg focus:outline-none cursor-not-allowed select-all font-semibold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Verification Footer */}
                      <div className={`border rounded-xl p-3.5 flex items-center justify-between mt-auto shrink-0 transition-all ${
                        isOutOfScope
                          ? "bg-red-50/80 border-red-200"
                          : "bg-emerald-50/70 border-emerald-100"
                      }`}>
                        <div className="flex flex-col leading-none">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">POSTGIS - NOMINATIM BARANGAY DETECTION</span>
                          {isOutOfScope ? (
                            <span className="text-xs font-black text-red-700 mt-1">⚠ Outside San Fernando, Pampanga</span>
                          ) : (
                            <span className="text-xs font-black text-emerald-800 mt-1">
                              Brgy. {detectedBarangay || "Santo Rosario"}
                            </span>
                          )}
                        </div>
                        {isOutOfScope ? (
                          <div className="flex items-center gap-1 bg-red-100/60 text-red-700 text-[10px] font-black px-2.5 py-1.5 rounded-full border border-red-200/50 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 shrink-0 text-red-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Out of scope</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-emerald-100/60 text-emerald-700 text-[10px] font-black px-2.5 py-1.5 rounded-full border border-emerald-200/50 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 shrink-0 text-emerald-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            <span>Nominatim verified</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
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

                <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse text-xs table-fixed min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 w-[14%]">ID</th>
                        <th className="py-3 px-4 w-[32%]">Summary</th>
                        <th className="py-3 px-4 w-[12%]">Urgency</th>
                        <th className="py-3 px-4 w-[18%]">Category</th>
                        <th className="py-3 px-4 w-[12%]">Status</th>
                        <th className="py-3 px-4 w-[12%]">Dispatch Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myComplaints
                        .filter((c) => c.status !== "RESOLVED")
                        .map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-mono text-[10px] font-bold text-slate-400 align-top">
                              AQ-{c.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="py-4 px-4 font-bold text-[#001e66] pr-2 align-top">
                              <div className="font-bold text-[#001e66]">{c.summary || "Resident reported issue"}</div>
                              <div className="text-slate-500 font-medium italic mt-0.5 leading-relaxed line-clamp-2">
                                "{c.rawText.length > 75 ? c.rawText.slice(0, 75) + "...." : c.rawText}"
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase border ${
                                c.urgency === "CRITICAL" || c.urgency === "HIGH" || c.urgency === "URGENT"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : c.urgency === "MEDIUM"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}>
                                {c.urgency || "LOW"}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-600 align-top break-words">
                              {formatCategory(c.category)}
                            </td>
                            <td className="py-4 px-4 align-top">
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
                            <td className="py-4 px-4 align-top">
                              {c.assignedToName ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50/70 border border-blue-150 text-blue-700 font-bold text-[9px] uppercase tracking-wide">
                                  🔧 {c.assignedToName}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic font-medium">Awaiting Dispatch</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {myComplaints.filter((c) => c.status !== "RESOLVED").length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 italic">
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

                <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse text-xs table-fixed min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 w-[14%]">ID</th>
                        <th className="py-3 px-4 w-[32%]">Summary</th>
                        <th className="py-3 px-4 w-[12%]">Urgency</th>
                        <th className="py-3 px-4 w-[18%]">Category</th>
                        <th className="py-3 px-4 w-[12%]">Status</th>
                        <th className="py-3 px-4 w-[12%]">Dispatch Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myComplaints
                        .filter((c) => c.status === "RESOLVED")
                        .map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-mono text-[10px] font-bold text-slate-400 align-top">
                              AQ-{c.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="py-4 px-4 font-bold text-[#001e66] pr-2 align-top">
                              <div className="font-bold text-[#001e66]">{c.summary || "Resident reported issue"}</div>
                              <div className="text-slate-500 font-medium italic mt-0.5 leading-relaxed line-clamp-2">
                                "{c.rawText.length > 75 ? c.rawText.slice(0, 75) + "...." : c.rawText}"
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase border ${
                                c.urgency === "CRITICAL" || c.urgency === "HIGH" || c.urgency === "URGENT"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : c.urgency === "MEDIUM"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}>
                                {c.urgency || "LOW"}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-600 align-top break-words">
                              {formatCategory(c.category)}
                            </td>
                            <td className="py-4 px-4 align-top">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                RESOLVED
                              </span>
                            </td>
                            <td className="py-4 px-4 align-top">
                              {c.assignedToName ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50/70 border border-blue-150 text-blue-700 font-bold text-[9px] uppercase tracking-wide">
                                  🔧 {c.assignedToName}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic font-medium">No assigned technician recorded</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {myComplaints.filter((c) => c.status === "RESOLVED").length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 italic">
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
            <div className="space-y-8">
              {/* Advisories Header */}
              <div>
                <h2 className="text-xl font-black text-[#001e66] dark:text-slate-200 tracking-tight">Community Broadcast Notices</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Read recent municipal service updates and maintenance warnings</p>
              </div>

              {/* Quick Advisory Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Broadcasts</p>
                    <p className="text-xl font-black text-[#0B2E7A] mt-1">{filteredAdvisories.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50/80 flex items-center justify-center border border-blue-100 shrink-0 shadow-sm">
                    <Megaphone className="w-5 h-5 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Service Warnings</p>
                    <p className="text-xl font-black text-red-650 mt-1">
                      {filteredAdvisories.filter((ad) => ad.type === "warning").length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-50/80 flex items-center justify-center border border-red-100 shrink-0 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Info Updates</p>
                    <p className="text-xl font-black text-emerald-650 mt-1">
                      {filteredAdvisories.filter((ad) => ad.type !== "warning").length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50/80 flex items-center justify-center border border-emerald-100 shrink-0 shadow-sm">
                    <Activity className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Full Width Feed Container */}
              <div className="w-full space-y-6">
                
                {/* Filter Tabs (segment control) */}
                <div className="flex gap-2 p-1 bg-slate-100/80 dark:bg-slate-800/40 rounded-xl max-w-xs md:max-w-sm border border-slate-200/40">
                  {[
                    { key: "all", label: "All", count: filteredAdvisories.length },
                    { key: "warning", label: "Warnings", count: filteredAdvisories.filter(ad => ad.type === "warning").length },
                    { key: "info", label: "Updates", count: filteredAdvisories.filter(ad => ad.type !== "warning").length }
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => {
                        setAdvisoryFilter(btn.key as any);
                        setAdvisoryPage(1);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer select-none ${
                        advisoryFilter === btn.key
                          ? "bg-white dark:bg-slate-900 text-[#001e66] dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800/85"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {btn.label}
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        {btn.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Cards List Feed */}
                <div className="space-y-4">
                  {paginatedAdvisories.map((ad) => {
                    const isWarning = ad.type === "warning";
                    return (
                      <div 
                        key={ad.id}
                        onClick={() => {
                          setSelectedAdvisory(ad);
                          markAdvisoryAsRead(ad.id);
                        }}
                        className={`p-5 rounded-[20px] bg-white border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden flex gap-4 text-left cursor-pointer select-none ${
                          isWarning 
                            ? "border-red-100 hover:border-red-200/60 shadow-[0_4px_20px_rgba(239,68,68,0.01)]" 
                            : "border-slate-100 hover:border-blue-100/60 shadow-[0_4px_20px_rgba(24,155,255,0.01)]"
                        }`}
                      >
                        {/* Alert Left Indicator Bar */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isWarning ? "bg-red-500" : "bg-[#00aeef]"}`} />

                        {/* Icon Container */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                          isWarning ? "bg-red-50 text-red-650" : "bg-blue-50 text-blue-600"
                        }`}>
                          {isWarning ? <AlertTriangle className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                        </div>

                        {/* Text Body */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-extrabold text-[#001e66] tracking-tight leading-snug">
                              {ad.title}
                            </h3>
                            <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                              {ad.date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            {ad.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {paginatedAdvisories.length === 0 && (
                    <div className="p-12 text-center border border-dashed border-slate-200 bg-white rounded-2xl">
                      <Megaphone className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                      <p className="text-xs font-black text-[#0B2E7A]">No Notices Found</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">No bulletins fit the selected filter category.</p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalAdvisoryPages > 1 && (
                  <div className="flex items-center justify-between px-2 pt-2">
                    <button
                      onClick={() => setAdvisoryPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#001e66] bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                    >
                      &larr; Prev
                    </button>
                    <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">
                      Page {currentPage} / {totalAdvisoryPages}
                    </span>
                    <button
                      onClick={() => setAdvisoryPage((prev) => Math.min(prev + 1, totalAdvisoryPages))}
                      disabled={currentPage === totalAdvisoryPages}
                      className="inline-flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#001e66] bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}


            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Reusable Footer */}
      <Footer />

      {/* Account Details Modal */}
      <AnimatePresence>
        {isAccountDetailsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountDetailsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_25px_60px_rgba(0,30,102,0.18)] overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row h-[550px] z-10"
            >
              {/* Left sidebar inside modal */}
              <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/40 p-6 border-r border-slate-100 dark:border-slate-850 flex flex-col justify-between shrink-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-black text-[#001e66] dark:text-slate-200 tracking-tight">Account Details</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Manage portal settings</p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setAccountModalTab("profile")}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        accountModalTab === "profile"
                          ? "bg-[#001e66] text-white shadow-sm"
                          : "text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800/40 dark:text-slate-400"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Information
                    </button>
                    <button
                      onClick={() => setAccountModalTab("security")}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        accountModalTab === "security"
                          ? "bg-[#001e66] text-white shadow-sm"
                          : "text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800/40 dark:text-slate-400"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Security Settings
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsAccountDetailsOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/30 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Close Settings
                </button>
              </div>

              {/* Right content box inside modal */}
              <div className="flex-1 p-8 overflow-y-auto">
                {accountModalTab === "profile" ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <h4 className="text-sm font-black text-[#001e66] dark:text-slate-200 uppercase tracking-wider">Profile Info</h4>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Your basic service account records.</p>
                    </div>

                    {profileError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold text-left">
                        {profileError}
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold text-left">
                        {profileSuccess}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name</label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email Address</label>
                        <input
                          type="email"
                          required
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone Number</label>
                        <input
                          type="text"
                          required
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                        />
                      </div>

                      {/* Service Account Number */}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Service Account Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={`CSFWD-${userProfile?.id?.slice(0, 8).toUpperCase() || "CSF-2026"}`}
                            className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-150 bg-slate-50 dark:bg-slate-900/60 dark:border-slate-850 text-slate-500 dark:text-slate-400 text-xs font-bold outline-none cursor-not-allowed select-none"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700">
                            Readonly
                          </span>
                        </div>
                      </div>

                      {/* Complete Address */}
                      <div className="sm:col-span-2 space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Complete Address</label>
                        <input
                          type="text"
                          required
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          placeholder="House No., Street, Barangay, City"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                        />
                      </div>
                    </div>

                    <div className="text-left pt-2">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-5 py-2.5 bg-[#001e66] hover:bg-[#00aeef] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {profileSaving ? "Saving changes..." : "Save Profile Details"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-8">
                    {/* Password Update */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-black text-[#001e66] dark:text-slate-200 uppercase tracking-wider">Change Password</h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">Update your portal security key.</p>
                      </div>

                      <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                        {securityError && (
                          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                            {securityError}
                          </div>
                        )}
                        {securitySuccess && (
                          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold">
                            {securitySuccess}
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">New Password</label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Confirm New Password</label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••••••"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-[#00aeef]/20 focus:border-[#00aeef] transition-all"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={updatingPassword}
                          className="px-5 py-2.5 bg-[#001e66] hover:bg-[#00aeef] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {updatingPassword ? "Updating Key..." : "Change Password"}
                        </button>
                      </form>
                    </div>

                    {/* Account Deletion */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                      <div>
                        <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider">Danger Zone</h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">Actions here are permanent and cannot be undone.</p>
                      </div>

                      <div className="bg-red-50/50 dark:bg-red-950/5 rounded-2xl border border-red-100/50 dark:border-red-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="text-left">
                          <p className="text-xs font-black text-red-750 dark:text-red-450 uppercase tracking-wide">Delete Account</p>
                          <p className="text-[11px] text-slate-500 font-bold mt-1 max-w-md">
                            Deleting your account will remove your access to the AquaTrack portal and cancel all active ticket feeds.
                          </p>
                        </div>
                        {isDeleteConfirmOpen ? (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={handleDeleteAccount}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setIsDeleteConfirmOpen(false)}
                              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-150 text-[#001e66] dark:text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsDeleteConfirmOpen(true)}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Delete Account
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom Location Search Error Modal */}
        {searchErrorModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchErrorModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-2xl relative w-full max-w-sm overflow-hidden z-10"
            >
              {/* Decorative Warning Glow Pattern */}
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col items-center text-center space-y-4">
                {/* Warning Icon Badge */}
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-500 shadow-sm">
                  <MapPinOff className="w-6 h-6 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-black text-[#0B2E7A] dark:text-[#93c5fd] uppercase tracking-wider">
                    Location Not Found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed px-2">
                    No matching location could be resolved in Pampanga. Please verify the address or manually drag the pin on the map.
                  </p>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => setSearchErrorModalOpen(false)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advisory Detail Modal */}
      <AnimatePresence>
        {selectedAdvisory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAdvisory(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[28px] shadow-[0_25px_60px_rgba(0,30,102,0.15)] overflow-hidden border border-slate-100 dark:border-slate-800 z-10 p-6 md:p-8 text-left space-y-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedAdvisory(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-850 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon & Title Row */}
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                  selectedAdvisory.type === "warning" ? "bg-red-50 text-red-650" : "bg-blue-50 text-blue-600"
                }`}>
                  {selectedAdvisory.type === "warning" ? <AlertTriangle className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[8px] font-black uppercase border ${
                    selectedAdvisory.type === "warning"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {selectedAdvisory.type}
                  </span>
                  <h3 className="text-lg font-black text-[#001e66] dark:text-slate-200 tracking-tight leading-snug pr-6">
                    {selectedAdvisory.title}
                  </h3>
                </div>
              </div>

              {/* Meta information */}
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-y border-slate-100 dark:border-slate-800 py-3">
                <span>Issued: {selectedAdvisory.date}</span>
                <span className="text-slate-200 dark:text-slate-800">•</span>
                <span>Target: Broadcast Announcement</span>
              </div>

              {/* Description body */}
              <div className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold max-h-60 overflow-y-auto pr-1">
                {selectedAdvisory.text}
              </div>

              {/* Footer action button */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedAdvisory(null)}
                  className="w-full bg-[#00aeef] hover:bg-[#001e66] text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                >
                  Close Notice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
