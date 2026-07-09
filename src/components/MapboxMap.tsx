"use client";

import React, { useEffect, useRef, useState } from "react";

interface MapboxMapProps {
  nodes: Array<{ id: string; name: string; latitude: number; longitude: number; status: string }>;
  complaints: Array<{ id: string; rawText: string; latitude: number; longitude: number; urgency: string }>;
}

export default function MapboxMap({ nodes, complaints }: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <div className="relative w-full h-full bg-slate-900">
      <div ref={mapContainerRef} className="absolute inset-0 flex items-center justify-center text-slate-500">
        Mapbox GL JS Canvas Backdrop (Interactive coordinates and layers)
      </div>
      {/* 500m Radius SVG Overlay Visualizer Mock */}
      {selectedPoint && (
        <div className="absolute top-4 left-4 bg-slate-950/80 p-3 border border-slate-800 rounded shadow text-xs">
          <p className="font-semibold">Selected Geolocation</p>
          <p>Lat: {selectedPoint.lat}, Lng: {selectedPoint.lng}</p>
          <button onClick={() => setSelectedPoint(null)} className="mt-2 text-red-400 hover:underline">Clear Radius</button>
        </div>
      )}
    </div>
  );
}
