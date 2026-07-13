"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
}

export default function MapPreviewModal({ isOpen, onClose, complaint }: MapPreviewModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!isOpen || !complaint || !mapContainerRef.current) return;

    // Wait slightly for modal animation to complete so container size is correct
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [complaint.longitude, complaint.latitude],
        zoom: 16,
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
            "fill-opacity": 0.1,
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
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, complaint]);

  if (!isOpen || !complaint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
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
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-black text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Map Area */}
        <div className="relative w-full h-80 bg-slate-950 border-b border-slate-100 dark:border-slate-800/80">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        </div>

        {/* Details Footer */}
        <div className="p-5 space-y-3 bg-slate-50/55 dark:bg-slate-900/50">
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
              <span className="font-bold text-slate-700 dark:text-slate-200 uppercase">
                {complaint.category || "Unclassified"}
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
          
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-end">
            <button
              onClick={onClose}
              className="bg-[#001e66] hover:bg-[#00aeef] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
