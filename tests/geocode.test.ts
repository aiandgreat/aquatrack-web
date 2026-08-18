import { expect, test, vi, beforeEach } from "vitest";
import { GET } from "../src/app/api/geocode/route";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubEnv("GOOGLE_MAPS_API_KEY", "mock-google-key");
  vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "mock-mapbox-token");
});

test("returns Google Geocoding coordinate as primary when it succeeds", async () => {
  // Mock global fetch to return Google success
  const mockFetch = vi.fn().mockImplementation(async (url: string) => {
    if (url.includes("maps.googleapis.com")) {
      return {
        ok: true,
        json: async () => ({
          status: "OK",
          results: [
            {
              geometry: {
                location: { lat: 15.03, lng: 120.69 }
              },
              formatted_address: "SM City Pampanga"
            }
          ]
        })
      };
    }
    return { ok: false };
  });
  
  vi.stubGlobal("fetch", mockFetch);

  const request = new Request("http://localhost/api/geocode?q=SM%20Pampanga");
  const response = await GET(request);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(data.latitude).toBe(15.03);
  expect(data.longitude).toBe(120.69);
  expect(data.source).toBe("google");
  expect(data.formattedAddress).toBe("SM City Pampanga");
});

test("falls back to Mapbox when Google fails", async () => {
  const mockFetch = vi.fn().mockImplementation(async (url: string) => {
    if (url.includes("maps.googleapis.com")) {
      // Simulate Google API failure or denied key
      return {
        ok: true,
        json: async () => ({ status: "REQUEST_DENIED" })
      };
    }
    if (url.includes("api.mapbox.com")) {
      return {
        ok: true,
        json: async () => ({
          features: [
            {
              center: [120.68, 15.04],
              place_name: "Mapbox Dolores",
              place_type: ["poi"],
              relevance: 0.9
            }
          ]
        })
      };
    }
    return { ok: false };
  });
  
  vi.stubGlobal("fetch", mockFetch);

  const request = new Request("http://localhost/api/geocode?q=Dolores");
  const response = await GET(request);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(data.latitude).toBe(15.04);
  expect(data.longitude).toBe(120.68);
  expect(data.source).toBe("mapbox");
  expect(data.formattedAddress).toBe("Mapbox Dolores");
});

test("falls back to Nominatim when Google and Mapbox both fail", async () => {
  const mockFetch = vi.fn().mockImplementation(async (url: string) => {
    if (url.includes("maps.googleapis.com")) {
      return { ok: false };
    }
    if (url.includes("api.mapbox.com")) {
      // Simulate broad region match from Mapbox (should be skipped)
      return {
        ok: true,
        json: async () => ({
          features: [
            {
              center: [120.5, 15.1],
              place_name: "Pampanga",
              place_type: ["region"],
              relevance: 1.0
            }
          ]
        })
      };
    }
    if (url.includes("nominatim.openstreetmap.org")) {
      return {
        ok: true,
        json: async () => [
          {
            lat: "15.0368",
            lon: "120.6972",
            display_name: "OSM Del Pilar"
          }
        ]
      };
    }
    return { ok: false };
  });
  
  vi.stubGlobal("fetch", mockFetch);

  const request = new Request("http://localhost/api/geocode?q=Del%20Pilar");
  const response = await GET(request);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(data.latitude).toBe(15.0368);
  expect(data.longitude).toBe(120.6972);
  expect(data.source).toBe("nominatim");
  expect(data.formattedAddress).toBe("OSM Del Pilar");
});

test("returns 404 when all geocoding services fail to match", async () => {
  const mockFetch = vi.fn().mockImplementation(async () => {
    return {
      ok: true,
      json: async () => ({ features: [], results: [] })
    };
  });
  
  vi.stubGlobal("fetch", mockFetch);

  const request = new Request("http://localhost/api/geocode?q=UnknownAddress");
  const response = await GET(request);
  const data = await response.json();

  expect(response.status).toBe(404);
  expect(data.error).toBeDefined();
});
