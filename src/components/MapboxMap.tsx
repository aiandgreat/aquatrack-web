"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SAN_FERNANDO_POLYGON } from "../lib/san-fernando-boundary";
import { 
  Megaphone, 
  Cpu, 
  User, 
  FileText, 
  MapPin, 
  AlertTriangle, 
  Globe,
  Settings,
  Activity
} from "lucide-react";

// Set token safely from environment variables
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MapboxMapProps {
  nodes: Array<{ id: string; name: string; latitude: number; longitude: number; status: string; type: string }>;
  complaints: Array<{
    id: string;
    rawText: string;
    latitude: number;
    longitude: number;
    urgency: string;
    summary: string;
    barangay?: string;
    userName?: string;
    userEmail?: string;
    serviceAccountNo?: string;
    imageUrl?: string;
  }>;
  selectedNodeId: string | null;
  selectedComplaintId: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectComplaint: (id: string | null) => void;
}

const getLightPresetForTime = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 17) return "day";      // 6 AM - 4:59 PM
  if (hour >= 17 && hour < 19) return "dusk";    // 5 PM - 6:59 PM
  if (hour >= 19 || hour < 5) return "night";    // 7 PM - 4:59 AM
  return "dawn";                                 // 5 AM - 5:59 AM
};

export default function MapboxMap({
  nodes,
  complaints,
  selectedNodeId,
  selectedComplaintId,
  onSelectNode,
  onSelectComplaint,
}: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite" | "dark" | "standard">("streets");
  const [show3D, setShow3D] = useState(true);
  const [hoveredComplaintId, setHoveredComplaintId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const isFirstStyleRender = useRef(true);
  const isMapMovingRef = useRef(false);

  const nodesRef = useRef(nodes);
  const complaintsRef = useRef(complaints);
  const mapStyleRef = useRef(mapStyle);
  const selectedComplaintIdRef = useRef(selectedComplaintId);
  const syncMarkerVisibilityRef = useRef<() => void>(() => {});

  useEffect(() => {
    selectedComplaintIdRef.current = selectedComplaintId;
    syncMarkerVisibilityRef.current();
  }, [selectedComplaintId]);

  useEffect(() => {
    nodesRef.current = nodes;
    complaintsRef.current = complaints;
    mapStyleRef.current = mapStyle;
  }, [nodes, complaints, mapStyle]);

  const getValidComplaints = (list: typeof complaints) => {
    return list.filter(c => 
      c && 
      typeof c.latitude === "number" && 
      typeof c.longitude === "number" && 
      !isNaN(c.latitude) && 
      !isNaN(c.longitude) &&
      c.latitude !== 0 &&
      c.longitude !== 0
    );
  };

  const getValidNodes = (list: typeof nodes) => {
    return list.filter(n => 
      n && 
      typeof n.latitude === "number" && 
      typeof n.longitude === "number" && 
      !isNaN(n.latitude) && 
      !isNaN(n.longitude) &&
      n.latitude !== 0 &&
      n.longitude !== 0
    );
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map around Sto. Rosario, San Fernando, Pampanga coordinates
    const sanFernandoCenter: [number, number] = [120.6936, 15.0278];

    // Initialize Mapbox Map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: sanFernandoCenter,
      zoom: 15,
      pitch: 45, // 3D angle view
    });

    mapRef.current = map;

    // Disable hover focus changes during active zoom and pan camera transitions
    map.on("movestart", () => {
      isMapMovingRef.current = true;
      setHoveredComplaintId(null);
      setHoveredNodeId(null);
    });

    map.on("moveend", () => {
      isMapMovingRef.current = false;
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Re-add layers when style loads/changes
    map.on("style.load", () => {
      // If it's Mapbox Standard style, handle 3D objects and terrain natively via config properties
      if (mapStyleRef.current === "standard") {
        try {
          map.setConfigProperty("basemap", "show3dObjects", show3D);
          map.setConfigProperty("basemap", "showTerrain", show3D);
          map.setConfigProperty("basemap", "lightPreset", getLightPresetForTime());
        } catch (e) {
          console.warn("Failed to set Mapbox Standard config properties:", e);
        }
      } else {
        // --- 1. 3D Terrain & Elevation ---
        if (!map.getSource("mapbox-dem")) {
          map.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          });
          if (show3D) {
            map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });
          }
        }

        // --- 2. 3D Building Extrusions ---
        if (map.getSource("composite") && !map.getLayer("3d-buildings")) {
          map.addLayer({
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            layout: {
              "visibility": show3D ? "visible" : "none"
            },
            paint: {
              "fill-extrusion-color": mapStyleRef.current === "dark" ? "#1e293b" : "#cbd5e1",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"]
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"]
              ],
              "fill-extrusion-opacity": 0.55
            }
          });
        }
      }

      // --- 3. Complaints Cluster Layers ---
      if (!map.getSource("complaints-source")) {
        const validComplaints = getValidComplaints(complaintsRef.current);
        map.addSource("complaints-source", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: validComplaints.map((c) => ({
              type: "Feature",
              properties: { id: c.id, urgency: c.urgency, summary: c.summary },
              geometry: { type: "Point", coordinates: [c.longitude, c.latitude] },
            })),
          },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 45,
        });

        // Cluster circles
        map.addLayer({
          id: "complaints-clusters",
          type: "circle",
          source: "complaints-source",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#f43f5e", // Light rose for < 5 complaints
              5,
              "#e11d48", // Rose for 5-15 complaints
              15,
              "#be123c", // Deep red for 15+ complaints
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              5,
              24,
              15,
              30,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.85,
          },
        });

        // Cluster counts
        map.addLayer({
          id: "complaints-cluster-count",
          type: "symbol",
          source: "complaints-source",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 11,
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        // Expand cluster on click
        map.on("click", "complaints-clusters", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["complaints-clusters"],
          });
          const clusterId = features[0].properties?.cluster_id;
          const source = map.getSource("complaints-source") as mapboxgl.GeoJSONSource;
          if (source && clusterId) {
            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              const coordinates = (features[0].geometry as any).coordinates;
              map.easeTo({
                center: coordinates,
                zoom: zoom || 15,
              });
            });
          }
        });

        map.on("mouseenter", "complaints-clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "complaints-clusters", () => {
          map.getCanvas().style.cursor = "";
        });
      }

      // --- 4. Water main pipelines ---
      if (!map.getSource("pipelines")) {
        map.addSource("pipelines", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { "type": "primary", "name": "MacArthur Highway Main Feed" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6936, 15.0350],
                    [120.6936, 15.0310],
                    [120.6936, 15.0278],
                    [120.6936, 15.0240],
                    [120.6936, 15.0200]
                  ],
                },
              },
              {
                type: "Feature",
                properties: { "type": "primary", "name": "Jose Abad Santos Arterial" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6820, 15.0278],
                    [120.6900, 15.0278],
                    [120.6936, 15.0278],
                    [120.7000, 15.0278],
                    [120.7080, 15.0278]
                  ],
                },
              },
              {
                type: "Feature",
                properties: { "type": "secondary", "name": "Del Pilar Distribution Line" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6936, 15.0240],
                    [120.6980, 15.0240],
                    [120.6980, 15.0278],
                    [120.7020, 15.0278]
                  ],
                },
              },
              {
                type: "Feature",
                properties: { "type": "secondary", "name": "Consunji St Distribution Line" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6936, 15.0310],
                    [120.6900, 15.0310],
                    [120.6900, 15.0278]
                  ],
                },
              },
              {
                type: "Feature",
                properties: { "type": "secondary", "name": "Lourdes Branch Line" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6936, 15.0278],
                    [120.6880, 15.0250],
                    [120.6850, 15.0220]
                  ],
                },
              },
              {
                type: "Feature",
                properties: { "type": "secondary", "name": "San Jose Distribution" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [120.6936, 15.0330],
                    [120.6990, 15.0330],
                    [120.6990, 15.0290]
                  ],
                },
              }
            ],
          },
        });

        // 1. Pipeline Outer Glow / Casing Layer
        map.addLayer({
          id: "pipelines-glow",
          type: "line",
          source: "pipelines",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": [
              "match",
              ["get", "type"],
              "primary", "#00aeef",
              "secondary", "#06b6d4",
              "#06b6d4"
            ],
            "line-width": [
              "match",
              ["get", "type"],
              "primary", 9,
              "secondary", 6,
              6
            ],
            "line-opacity": 0.25,
          },
        });

        // 2. Pipeline Core Layer
        map.addLayer({
          id: "pipelines-line",
          type: "line",
          source: "pipelines",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": [
              "match",
              ["get", "type"],
              "primary", "#00aeef",
              "secondary", "#06b6d4",
              "#06b6d4"
            ],
            "line-width": [
              "match",
              ["get", "type"],
              "primary", 4.5,
              "secondary", 2.5,
              2.5
            ],
            "line-opacity": 0.8,
          },
        });
      }

      // --- 5. Scan proximity ring ---
      if (!map.getSource("scan-ring")) {
        map.addSource("scan-ring", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.addLayer({
          id: "scan-ring-polygon",
          type: "fill",
          source: "scan-ring",
          paint: {
            "fill-color": "#f43f5e",
            "fill-opacity": 0.15,
          },
        });

        map.addLayer({
          id: "scan-ring-outline",
          type: "line",
          source: "scan-ring",
          paint: {
            "line-color": "#f43f5e",
            "line-width": 1.5,
            "line-dasharray": [3, 3],
          },
        });
      }

      // --- 6. City of San Fernando, Pampanga — 3D boundary wall + neon glow ---
      if (!map.getSource("sf-boundary")) {
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

        // Subtle cyan floor tint inside the city
        map.addLayer({
          id: "sf-boundary-floor",
          type: "fill",
          source: "sf-boundary",
          paint: {
            "fill-color": "#00aeef",
            "fill-opacity": 0.06,
          },
        });

        // 3D wall extruded 40 m along the boundary edge
        map.addLayer({
          id: "sf-boundary-wall",
          type: "fill-extrusion",
          source: "sf-boundary",
          paint: {
            "fill-extrusion-color": "#00aeef",
            "fill-extrusion-height": 40,
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.22,
          },
        });

        // Outer soft glow halo
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

        // Mid glow ring
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

        // Bright solid core line
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
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Mapbox style dynamically when selected
  useEffect(() => {
    if (isFirstStyleRender.current) {
      isFirstStyleRender.current = false;
      return;
    }
    const map = mapRef.current;
    if (map) {
      if (mapStyle === "streets") map.setStyle("mapbox://styles/mapbox/streets-v12");
      else if (mapStyle === "satellite") map.setStyle("mapbox://styles/mapbox/satellite-streets-v12");
      else if (mapStyle === "standard") map.setStyle("mapbox://styles/mapbox/standard");
      else map.setStyle("mapbox://styles/mapbox/dark-v11");
    }
  }, [mapStyle]);

  // Toggle 3D Terrain and Building Extrusions dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update3DState = () => {
      if (mapStyleRef.current === "standard") {
        try {
          map.setConfigProperty("basemap", "show3dObjects", show3D);
          map.setConfigProperty("basemap", "showTerrain", show3D);
          map.setConfigProperty("basemap", "lightPreset", getLightPresetForTime());
        } catch (e) {
          console.warn("Failed to set Mapbox Standard config properties:", e);
        }
      } else {
        // 1. Terrain Mesh
        if (map.getSource("mapbox-dem")) {
          if (show3D) {
            map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });
          } else {
            map.setTerrain(null);
          }
        }

        // 2. Building Extrusions Layer
        if (map.getLayer("3d-buildings")) {
          map.setLayoutProperty("3d-buildings", "visibility", show3D ? "visible" : "none");
        }
      }
    };

    if (map.isStyleLoaded()) {
      update3DState();
    } else {
      map.once("style.load", update3DState);
    }
  }, [show3D]);

  // Update Markers when nodes/complaints list changes or style loads
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const validComplaints = getValidComplaints(complaints);
    const validNodes = getValidNodes(nodes);

    // 1. Update complaints GeoJSON source data for clusters
    const source = map.getSource("complaints-source") as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: validComplaints.map((c) => ({
          type: "Feature",
          properties: { id: c.id, urgency: c.urgency, summary: c.summary },
          geometry: { type: "Point", coordinates: [c.longitude, c.latitude] },
        })),
      });
    }

    // 2. Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // 3. Helper to generate GeoJSON circle for 500m scan buffer
    const updateScanRing = (lng: number, lat: number) => {
      const ringSource = map.getSource("scan-ring") as mapboxgl.GeoJSONSource;
      if (!ringSource) return;

      const points = 64;
      const radiusInKm = 0.5; // 500 meters
      const coords = [];
      const distanceX = radiusInKm / (111.32 * Math.cos((lat * Math.PI) / 180));
      const distanceY = radiusInKm / 110.57;

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        coords.push([lng + x, lat + y]);
      }
      coords.push(coords[0]); // Close polygon

      ringSource.setData({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
        properties: {},
      });
    };

    // 4. Plot Telemetry Nodes
    validNodes.forEach((node) => {
      // Outer stable hitbox wrapper (prevents boundary shifts/glitching during hover/scale events)
      const el = document.createElement("div");
      el.className = "w-9 h-9 flex items-center justify-center cursor-pointer bg-transparent relative";

      // Inner visible dot
      el.innerHTML = `
        <div class="node-dot w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg transition-all duration-200 ${
          node.status === "ONLINE"
            ? "bg-emerald-500 shadow-emerald-500/50"
            : node.status === "MAINTENANCE"
            ? "bg-amber-500 shadow-amber-500/50"
            : "bg-rose-500 shadow-rose-500/50"
        }">
          <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectNode(node.id);
      });

      el.addEventListener("mouseenter", () => {
        if (isMapMovingRef.current) return;
        setHoveredNodeId(node.id);
      });

      el.addEventListener("mouseleave", () => {
        setHoveredNodeId(null);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([node.longitude, node.latitude])
        .addTo(map);

      markersRef.current[`node-${node.id}`] = marker;
    });

    // 5. Plot Citizen Complaints
    validComplaints.forEach((comp) => {
      // Outer stable hitbox wrapper (prevents boundary shifts/glitching during hover/scale events)
      const el = document.createElement("div");
      el.className = "w-9 h-9 flex items-center justify-center cursor-pointer bg-transparent relative";

      // Inner visible dot
      el.innerHTML = `
        <div class="marker-dot w-5 h-5 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center shadow-lg transition-all duration-200">
          <span class="w-2.5 h-2.5 rounded-full marker-pulse animate-pulse"></span>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectComplaint(comp.id);
        updateScanRing(comp.longitude, comp.latitude);
      });

      el.addEventListener("mouseenter", () => {
        if (isMapMovingRef.current) return;
        setHoveredComplaintId(comp.id);
        updateScanRing(comp.longitude, comp.latitude);
      });

      el.addEventListener("mouseleave", () => {
        setHoveredComplaintId(null);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([comp.longitude, comp.latitude])
        .addTo(map);

      markersRef.current[`comp-${comp.id}`] = marker;
    });

    // 6. Dynamic zoom visibility sync for individual markers vs clusters
    const syncMarkerVisibility = () => {
      const zoom = map.getZoom();
      // Hide pins when zoomed out to <= 14 (where clustering starts)
      const showPins = zoom > 14;

      validComplaints.forEach((comp) => {
        const marker = markersRef.current[`comp-${comp.id}`];
        if (marker) {
          const el = marker.getElement();
          const isSelected = comp.id === selectedComplaintIdRef.current;
          el.style.display = (showPins || isSelected) ? "flex" : "none";
        }
      });
    };
    syncMarkerVisibilityRef.current = syncMarkerVisibility;

    map.on("zoom", syncMarkerVisibility);
    // Execute immediately to sync initial load zoom levels
    syncMarkerVisibility();

    return () => {
      map.off("zoom", syncMarkerVisibility);
    };
  }, [nodes, complaints, mapStyle]);

  // Dynamic selection and hover visual styling updates (prevents map marker teardown/flickering)
  useEffect(() => {
    complaints.forEach((comp) => {
      const marker = markersRef.current[`comp-${comp.id}`];
      if (!marker) return;
      const el = marker.getElement();
      const dot = el.querySelector(".marker-dot");
      if (!dot) return;

      const isSelected = comp.id === selectedComplaintId;
      const isHovered = comp.id === hoveredComplaintId;

      if (isSelected) {
        dot.classList.add("scale-125", "ring-4", "ring-rose-500/50");
        dot.classList.remove("scale-110", "ring-2", "ring-rose-400/40");
      } else if (isHovered) {
        dot.classList.add("scale-110", "ring-2", "ring-rose-400/40");
        dot.classList.remove("scale-125", "ring-4", "ring-rose-500/50");
      } else {
        dot.classList.remove("scale-125", "scale-110", "ring-4", "ring-2", "ring-rose-500/50", "ring-rose-400/40");
      }
    });
  }, [selectedComplaintId, hoveredComplaintId, complaints]);

  // Dynamic node selection and hover visual styling
  useEffect(() => {
    nodes.forEach((node) => {
      const marker = markersRef.current[`node-${node.id}`];
      if (!marker) return;
      const el = marker.getElement();
      const dot = el.querySelector(".node-dot");
      if (!dot) return;

      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;

      if (isSelected) {
        dot.classList.add("scale-125", "ring-4", "ring-cyan-500/50");
        dot.classList.remove("scale-110", "ring-2", "ring-cyan-400/40");
      } else if (isHovered) {
        dot.classList.add("scale-110", "ring-2", "ring-cyan-400/40");
        dot.classList.remove("scale-125", "ring-4", "ring-cyan-500/50");
      } else {
        dot.classList.remove("scale-125", "scale-110", "ring-4", "ring-2", "ring-cyan-500/50", "ring-cyan-400/40");
      }
    });
  }, [selectedNodeId, hoveredNodeId, nodes]);

  const lastSelectedNodeId = useRef<string | null>(null);
  const lastSelectedComplaintId = useRef<string | null>(null);

  // Proximity Focus & Camera flying
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedComplaintId && selectedComplaintId !== lastSelectedComplaintId.current) {
      lastSelectedComplaintId.current = selectedComplaintId;
      const comp = complaints.find((c) => c.id === selectedComplaintId);
      if (comp) {
        map.flyTo({
          center: [comp.longitude, comp.latitude],
          zoom: 16,
          essential: true,
        });
      }
    } else if (selectedNodeId && selectedNodeId !== lastSelectedNodeId.current) {
      lastSelectedNodeId.current = selectedNodeId;
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (node) {
        map.flyTo({
          center: [node.longitude, node.latitude],
          zoom: 16.5,
          essential: true,
        });
      }
    }

    if (!selectedComplaintId) lastSelectedComplaintId.current = null;
    if (!selectedNodeId) lastSelectedNodeId.current = null;
  }, [selectedComplaintId, selectedNodeId, nodes, complaints]);

  return (
    <div className="relative w-full h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Container for Mapbox GL JS */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Floating Style & 3D Switcher */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-1.5 flex gap-1 shadow-lg backdrop-blur-md">
          {(["streets", "satellite", "dark", "standard"] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setMapStyle(style)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                mapStyle === style
                  ? "bg-[#00aeef] text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShow3D(!show3D)}
          className={`bg-slate-900/90 border border-slate-700/60 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all shadow-lg backdrop-blur-md ${
            show3D
              ? "text-[#00aeef]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          3D: {show3D ? "ON" : "OFF"}
        </button>
      </div>

      {/* HUD Layer Grid (top transparent layer) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1.5px,transparent_1.5px),linear-gradient(to_bottom,#1e293b_1.5px,transparent_1.5px)] bg-[size:5rem_5rem] opacity-5 pointer-events-none" />
      {/* Selected Indicator HUD overlay (Hover for Complaints and Nodes) */}
      {(hoveredComplaintId || hoveredNodeId) && (
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 text-xs font-sans text-slate-700 dark:text-slate-200 max-w-xs sm:max-w-sm shadow-xl backdrop-blur-md z-20 transition-all duration-300">
          {hoveredComplaintId ? (() => {
            const comp = complaints.find((c) => c.id === hoveredComplaintId);
            if (!comp) return null;
            const mapboxToken = mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
            const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${comp.longitude},${comp.latitude},16.5,0/280x120?access_token=${mapboxToken}`;
            return (
              <div className="space-y-2">
                <div className="text-rose-600 dark:text-rose-450 font-black text-[9px] tracking-widest uppercase flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 shrink-0" />
                  CITIZEN INCIDENT FOCUS
                </div>
                <div className="text-[#001e66] dark:text-slate-100 font-black text-sm tracking-tight leading-snug">{comp.summary}</div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-2.5 pt-2.5 space-y-2 text-slate-500 dark:text-slate-400 text-xxs font-semibold leading-normal">
                  <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="font-bold text-slate-700 dark:text-slate-200">{comp.userName || "Anonymous Resident"}</span></div>
                  <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>Acct No: <span className="font-bold text-slate-700 dark:text-slate-200">{comp.serviceAccountNo || "N/A"}</span></span></div>
                  <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>Barangay: <span className="font-bold text-slate-700 dark:text-slate-200">{comp.barangay || "San Fernando"}</span></span></div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="font-mono font-bold text-slate-600 dark:text-slate-350">{comp.latitude.toFixed(5)}, {comp.longitude.toFixed(5)}</span></div>
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-650 dark:text-slate-350 italic font-medium leading-relaxed max-h-24 overflow-y-auto shadow-inner">
                    "{comp.rawText}"
                  </div>
                  <div className="mt-3">
                    <span className="text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider block mb-1.5">📍 Location Satellite Preview</span>
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850 shadow-sm">
                      <img src={staticMapUrl} alt="Location Satellite Preview" className="w-full h-[120px] object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (() => {
            const activeNodeId = hoveredNodeId;
            const node = nodes.find((n) => n.id === activeNodeId);
            if (!node) return null;
            const mapboxToken = mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
            const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${node.longitude},${node.latitude},16.5,0/280x120?access_token=${mapboxToken}`;
            const barangay = node.name.split(" ")[0] || "San Fernando";
            return (
              <div className="space-y-2">
                <div className="text-[#00aeef] font-black text-[9px] tracking-widest uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 shrink-0" />
                  TELEMETRY NODE FOCUS
                </div>
                <div className="text-[#001e66] dark:text-slate-100 font-black text-sm tracking-tight leading-snug">{node.name}</div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-2.5 pt-2.5 space-y-2 text-slate-500 dark:text-slate-400 text-xxs font-semibold leading-normal">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Status:</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                      node.status === "ONLINE" ? "bg-emerald-50 text-emerald-800 border-emerald-250/70" :
                      node.status === "MAINTENANCE" ? "bg-amber-50 text-amber-800 border-amber-250/70" :
                      "bg-rose-50 text-rose-800 border-rose-250/70"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        node.status === "ONLINE" ? "bg-emerald-500 animate-pulse" :
                        node.status === "MAINTENANCE" ? "bg-amber-500 animate-pulse" :
                        "bg-rose-500 animate-pulse"
                      }`} />
                      {node.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2"><Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>Type: <span className="font-bold text-slate-700 dark:text-slate-200">{node.type.replace(/_/g, " ")}</span></span></div>
                  <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>Barangay: <span className="font-bold text-slate-700 dark:text-slate-200">{barangay}</span></span></div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="font-mono font-bold text-slate-600 dark:text-slate-350">{node.latitude.toFixed(5)}, {node.longitude.toFixed(5)}</span></div>
                  
                  <div className="mt-3">
                    <span className="text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider block mb-1.5">📍 Location Satellite Preview</span>
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850 shadow-sm">
                      <img src={staticMapUrl} alt="Location Satellite Preview" className="w-full h-[120px] object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
