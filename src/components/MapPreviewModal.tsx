"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Navigation, Clock, MapPin } from "lucide-react";
import { calculateDistance } from "../lib/spatial-sorting";
import DiagnosticAlertDrawer from "./DiagnosticAlertDrawer";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MapPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: {
    id: string;
    summary: string;
    rawText: string;
    latitude: number;
    longitude: number;
    barangay: string | null;
    category: string | null;
    urgency: string | null;
  } | null;
  diagnosticAlerts?: any[];
  nodes?: any[];
  crews?: any[];
  aiTriageStrictness?: number;
  onDispatch?: (alertId: string, crewId: string, complaintId: string) => void;
}

const getCategoryLabel = (category: string | null) => {
  if (!category) return "UNCLASSIFIED";
  const upper = category.toUpperCase();
  const map: Record<string, string> = {
    PIPELINE_BREACH_PRESSURE_DROP: "PIPELINE BREACH/PRESSURE DROP",
    HIGH_TURBIDITY: "HIGH TURBIDITY/CLOUDINESS",
    HIGH_MINERAL_CONTENT_TDS: "HIGH TDS/MINERAL CONTENT",
    CHEMICAL_DISCOLORATION_CONTAMINATION: "CHEMICAL DISCOLORATION/CONTAMINATION",
    UNCLASSIFIED_INFRASTRUCTURE_ANOMALY: "UNCLASSIFIED INFRASTRUCTURE ANOMALY",
  };
  return map[upper] || category.replace(/_/g, " ").toUpperCase();
};

export default function MapPreviewModal({ 
  isOpen, 
  onClose, 
  complaint,
  diagnosticAlerts = [],
  nodes = [],
  crews = [],
  aiTriageStrictness = 75,
  onDispatch
}: MapPreviewModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  // Tracking & Routing States
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [routeStats, setRouteStats] = useState<{ distance: string; duration: string } | null>(null);

  // Tracking Refs
  const watchIdRef = useRef<number | null>(null);
  const techMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const complaintRef = useRef(complaint);

  useEffect(() => {
    complaintRef.current = complaint;
  }, [complaint]);

  const fetchRoute = async (map: mapboxgl.Map, start: [number, number], end: [number, number]) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return;

      const route = data.routes[0];
      const coords = route.geometry.coordinates;
      const distanceKm = (route.distance / 1000).toFixed(1);
      const durationMin = Math.round(route.duration / 60);

      setRouteStats({
        distance: `${distanceKm} km`,
        duration: `${durationMin} mins`
      });

      // Draw or update route source/layer on map
      if (!map.getSource("route-source")) {
        map.addSource("route-source", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coords
            }
          }
        });
        map.addLayer({
          id: "route-layer",
          type: "line",
          source: "route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#00aeef",
            "line-width": 4,
            "line-opacity": 0.85
          }
        });
      } else {
        const source = map.getSource("route-source") as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coords
            }
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch route directions:", err);
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    setRouteStats(null);
    setTrackingError(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (techMarkerRef.current) {
      techMarkerRef.current.remove();
      techMarkerRef.current = null;
    }

    const map = mapRef.current;
    if (map) {
      try {
        if (map.getLayer("route-layer")) map.removeLayer("route-layer");
        if (map.getSource("route-source")) map.removeSource("route-source");
      } catch (e) {
        console.warn("Failed to remove route layers:", e);
      }
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setTrackingError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    setTrackingError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const map = mapRef.current;
        const comp = complaintRef.current;
        if (!map || !comp) return;

        // Plot or update technician marker (glowing blue GPS indicator)
        if (!techMarkerRef.current) {
          const el = document.createElement("div");
          el.innerHTML = `
            <div class="relative w-5 h-5 flex items-center justify-center">
              <div class="absolute w-5 h-5 rounded-full bg-blue-500/30 animate-ping"></div>
              <div class="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-lg"></div>
            </div>
          `;
          techMarkerRef.current = new mapboxgl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(map);
        } else {
          techMarkerRef.current.setLngLat([lng, lat]);
        }

        // Fetch directions and update map
        await fetchRoute(map, [lng, lat], [comp.longitude, comp.latitude]);

        // Fit map bounds to show both user and complaint
        const bounds = new mapboxgl.LngLatBounds()
          .extend([lng, lat])
          .extend([comp.longitude, comp.latitude]);

        map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
      },
      (error) => {
        console.error("GPS tracking error:", error);
        setTrackingError(error.message || "Failed to retrieve your GPS location");
        stopTracking();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // Compute if there is an active PostGIS diagnostic alert matching this complaint's location buffer
  console.log("[MapPreviewModal] Opening for complaint:", complaint?.id, "at", complaint?.latitude, complaint?.longitude);
  console.log("[MapPreviewModal] Total active diagnostic alerts fetched:", diagnosticAlerts.length);

  const matchedAlert = complaint && diagnosticAlerts.length > 0
    ? diagnosticAlerts.find(alert => {
        const dist = calculateDistance(
          { latitude: complaint.latitude, longitude: complaint.longitude },
          { latitude: alert.node.latitude, longitude: alert.node.longitude }
        );
        if (dist > 500) return false;

        // Check strictness threshold
        const confidence = alert.geminiAnalysis?.confidenceScore || 0;
        if (confidence < aiTriageStrictness) return false;

        // Check if the complaint's classification matches the node's anomaly telemetry parameters
        const nodeObj = nodes.find(n => n.id === alert.nodeId);
        if (!nodeObj || !nodeObj.reading) return false;

        const { category } = complaint;
        const { ph, turbidity, tds, pressure } = nodeObj.reading;

        if (category === "PIPELINE_BREACH_PRESSURE_DROP" && pressure < 30) return true;
        if (category === "HIGH_TURBIDITY" && turbidity > 5) return true;
        if (category === "HIGH_MINERAL_CONTENT_TDS" && tds > 500) return true;
        if (category === "CHEMICAL_DISCOLORATION_CONTAMINATION" && (ph < 6.5 || ph > 8.5)) return true;

        return false;
      })
    : null;

  console.log("[MapPreviewModal] Matched Alert Result:", matchedAlert ? "FOUND" : "NOT FOUND");

  useEffect(() => {
    if (!isOpen || !complaint || !mapContainerRef.current) return;

    // Wait slightly for modal animation to complete so container size is correct
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [complaint.longitude, complaint.latitude],
        zoom: 15,
      });

      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Draw 500m scan buffer ring around the pin
      map.on("load", () => {
        const points = 64;
        const radiusInKm = 0.5; // 500 meters
        const coords = [];
        const distanceX = radiusInKm / (111.32 * Math.cos((complaint.latitude * Math.PI) / 180));
        const distanceY = radiusInKm / 110.574;

        for (let i = 0; i < points; i++) {
          const theta = (i / points) * (2 * Math.PI);
          const x = distanceX * Math.cos(theta);
          const y = distanceY * Math.sin(theta);
          coords.push([complaint.longitude + x, complaint.latitude + y]);
        }
        coords.push(coords[0]); // close the polygon

        map.addSource("preview-ring", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [coords],
                },
                properties: {},
              },
            ],
          },
        });

        map.addLayer({
          id: "preview-ring-polygon",
          type: "fill",
          source: "preview-ring",
          paint: {
            "fill-color": "#f43f5e",
            "fill-opacity": 0.08,
          },
        });

        map.addLayer({
          id: "preview-ring-outline",
          type: "line",
          source: "preview-ring",
          paint: {
            "line-color": "#f43f5e",
            "line-width": 1.5,
            "line-dasharray": [3, 3],
          },
        });
      });

      // Add marker
      new mapboxgl.Marker({ color: "#e11d48" })
        .setLngLat([complaint.longitude, complaint.latitude])
        .addTo(map);
    }, 200);

    return () => {
      clearTimeout(timer);
      
      // Clear geolocation tracking and marker on teardown
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (techMarkerRef.current) {
        techMarkerRef.current.remove();
        techMarkerRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, complaint]);

  if (!isOpen || !complaint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full ${
        matchedAlert ? "max-w-4xl" : "max-w-lg"
      } overflow-hidden shadow-2xl flex flex-col transition-all duration-300`}>
        
        <div className={matchedAlert ? "grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800/80" : ""}>
          
          {/* Left panel: Map + Details */}
          <div className="flex flex-col min-w-0">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none">
                  Location Preview
                </h3>
                <h2 className="text-sm font-black text-[#001e66] dark:text-slate-200 mt-1.5 line-clamp-1">
                  {complaint.summary || complaint.rawText}
                </h2>
              </div>
              {!matchedAlert && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-black text-sm cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Map Area */}
            <div className="relative w-full h-80 bg-slate-950 border-b border-slate-100 dark:border-slate-800/80">
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
            </div>

            {/* Details Footer */}
            <div className="p-5 bg-slate-50/55 dark:bg-slate-900/50 flex flex-col justify-between flex-1 gap-4">
              <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <div>
                  <strong className="text-slate-400 uppercase tracking-wider block mb-0.5 text-[8px]">Coordinates</strong>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                  </span>
                </div>
                <div>
                  <strong className="text-slate-400 uppercase tracking-wider block mb-0.5 text-[8px]">Barangay</strong>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {complaint.barangay || "Outside Service Area"}
                  </span>
                </div>
                <div>
                  <strong className="text-slate-400 uppercase tracking-wider block mb-0.5 text-[8px]">Category</strong>
                  <span className="font-bold text-slate-700 dark:text-slate-200 uppercase break-words leading-tight block">
                    {getCategoryLabel(complaint.category)}
                  </span>
                </div>
                <div>
                  <strong className="text-slate-400 uppercase tracking-wider block mb-0.5 text-[8px]">Urgency</strong>
                  <span className={`font-black uppercase ${
                    complaint.urgency === "CRITICAL" ? "text-red-600 dark:text-red-400" :
                    complaint.urgency === "HIGH" ? "text-amber-600 dark:text-amber-400" :
                    "text-slate-600 dark:text-slate-400"
                  }`}>
                    {complaint.urgency || "MEDIUM"}
                  </span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-3">
                {/* Dynamic Route Stats Overlay */}
                {isTracking && routeStats && (
                  <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 rounded-xl p-2.5 text-xs text-[#001e66] dark:text-blue-300">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-3.5 h-3.5 text-[#00aeef]" />
                      <span>ETA: {routeStats.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Dist: {routeStats.distance}</span>
                    </div>
                  </div>
                )}

                {trackingError && (
                  <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40">
                    ⚠️ {trackingError}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={toggleTracking}
                    className={`flex items-center gap-2 font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95 ${
                      isTracking
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/10"
                        : "bg-[#00aeef] hover:bg-[#00aeef]/90 text-white shadow-md shadow-[#00aeef]/10"
                    }`}
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isTracking ? "animate-spin" : ""}`} />
                    <span>{isTracking ? "Stop Tracking" : "Track Route"}</span>
                  </button>
                  
                  {!matchedAlert && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95 border border-slate-250/20"
                    >
                      Close Preview
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: AI Spatial Diagnostics (Only rendered if PostGIS correlated alert exists) */}
          {matchedAlert && (
            <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative min-w-0">
              {/* Close Button overlay in upper right for split-screen */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-150 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-850 transition-all font-black text-sm cursor-pointer border border-slate-200 dark:border-slate-800 active:scale-95"
              >
                ✕
              </button>
              
              <div className="p-5 flex-1 overflow-y-auto max-h-[580px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <DiagnosticAlertDrawer
                  alert={matchedAlert}
                  crews={crews}
                  onDispatch={(crewId) => onDispatch && complaint && onDispatch(matchedAlert.id, crewId, complaint.id)}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
