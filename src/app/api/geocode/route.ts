import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Missing search query parameter 'q'" }, { status: 400 });
    }

    const cleanQuery = query.trim();

    // 1. Try Google Geocoding API (Primary)
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey && googleApiKey.trim() !== "") {
      try {
        const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&key=${googleApiKey}`;
        const response = await fetch(googleUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "OK" && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return NextResponse.json({
              success: true,
              latitude: location.lat,
              longitude: location.lng,
              source: "google",
              formattedAddress: data.results[0].formatted_address
            });
          } else {
            console.warn(`Google Geocoding status was not OK: ${data.status}`);
          }
        }
      } catch (googleErr: any) {
        console.error("Google Geocoding API call failed:", googleErr.message || googleErr);
      }
    }

    // 2. Try Mapbox Geocoding API (Secondary Fallback)
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (mapboxToken && mapboxToken.trim() !== "") {
      try {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanQuery)}.json?access_token=${mapboxToken}&limit=1`;
        const response = await fetch(mapboxUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const placeTypes = feature.place_type || [];
            const isBroad = placeTypes.includes("region") || placeTypes.includes("country") || placeTypes.includes("district");
            const relevance = feature.relevance ?? 1.0;

            if (relevance >= 0.4 && !isBroad) {
              const center = feature.center; // [longitude, latitude]
              return NextResponse.json({
                success: true,
                latitude: center[1],
                longitude: center[0],
                source: "mapbox",
                formattedAddress: feature.place_name
              });
            } else {
              console.warn("Skipping Mapbox result due to low relevance or broad region match:", feature.place_name);
            }
          }
        }
      } catch (mapboxErr: any) {
        console.error("Mapbox Geocoding API call failed:", mapboxErr.message || mapboxErr);
      }
    }

    // 3. Try Nominatim OpenStreetMap API (Tertiary Fallback)
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=1`;
      const response = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "AquaTrack-Client-Portal"
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const match = data[0];
          return NextResponse.json({
            success: true,
            latitude: parseFloat(match.lat),
            longitude: parseFloat(match.lon),
            source: "nominatim",
            formattedAddress: match.display_name
          });
        }
      }
    } catch (nominatimErr: any) {
      console.error("Nominatim Geocoding API call failed:", nominatimErr.message || nominatimErr);
    }

    return NextResponse.json(
      { error: "Address lookup failed across Google, Mapbox, and OpenStreetMap engines." },
      { status: 404 }
    );
  } catch (err: any) {
    console.error("Geocoding proxy endpoint error:", err);
    return NextResponse.json({ error: err.message || "Failed to process geocoding request" }, { status: 500 });
  }
}
