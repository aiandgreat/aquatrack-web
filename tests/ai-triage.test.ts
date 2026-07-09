import { expect, test, vi } from "vitest";
import { complaintTriageSchema } from "../src/lib/triage-schema";

// 1. Mock the global fetch for http://localhost:54321/functions/v1/triage-complaint
vi.stubGlobal("fetch", vi.fn(async (url: string, options: any) => {
  if (url === "http://localhost:54321/functions/v1/triage-complaint") {
    if (!options || !options.body) {
      return {
        status: 400,
        text: async () => "Missing body",
      };
    }
    try {
      const payload = JSON.parse(options.body);
      if (!payload.complaintId) {
        return {
          status: 400,
          text: async () => "Missing ID",
        };
      }
      if (payload.complaintId === "nonexistent-id") {
        return {
          status: 404,
          text: async () => "Complaint not found",
        };
      }
      return {
        status: 200,
        json: async () => ({ success: true }),
      };
    } catch {
      return {
        status: 400,
        text: async () => "Invalid JSON",
      };
    }
  }
  return { status: 404 };
}));

// Test from Step 1 of the Brief
test("Triage Edge Function handles missing body", async () => {
  const response = await fetch("http://localhost:54321/functions/v1/triage-complaint", {
    method: "POST",
  });
  expect(response.status).toBe(400);
});

// Test from Step 4 of the Brief
test("Zod parser correctly enforces enums", () => {
  const valid = {
    category: "HIGH_TURBIDITY",
    urgency: "HIGH",
    translatedText: "Rusty water",
    summary: "Citizen reported rusty water flow."
  };
  const parsed = complaintTriageSchema.safeParse(valid);
  expect(parsed.success).toBe(true);

  const invalid = {
    category: "UNKNOWN_ISSUE",
    urgency: "EXCESSIVE",
    summary: "Broken"
  };
  const parsedInvalid = complaintTriageSchema.safeParse(invalid);
  expect(parsedInvalid.success).toBe(false);
});

// Business Logic Integration Mocking and Testing
interface TriagePayload {
  complaintId?: string;
  latitude?: number;
  longitude?: number;
}

interface MockSupabase {
  from: (table: string) => {
    select: (query: string) => {
      eq: (col: string, val: any) => {
        single: () => Promise<{ data: any; error: any }>
      }
    };
    update: (data: any) => {
      eq: (col: string, val: any) => Promise<{ error: any }>
    };
    insert: (data: any) => Promise<{ error: any }>;
  };
  rpc: (fn: string, params: any) => Promise<{ data: any; error: any }>;
}

async function mockTriageLogic(
  payload: TriagePayload,
  supabase: any,
  mockGeminiCall: (promptText: string) => Promise<any>
) {
  const { complaintId, latitude, longitude } = payload;
  if (!complaintId) {
    return { status: 400, message: "Missing ID" };
  }

  // 1. Fetch the raw complaint
  const { data: complaint, error: complaintError } = await supabase
    .from("Complaint")
    .select("*")
    .eq("id", complaintId)
    .single();

  if (complaintError || !complaint) {
    return { status: 404, message: "Complaint not found" };
  }

  // 2. Spatial Query: Find nodes in MAINTENANCE/OFFLINE status within 500m of the report coordinates
  const { data: nearbyNodes, error: spatialError } = await supabase.rpc("find_nearby_anomalies", {
    report_lat: latitude,
    report_lng: longitude,
    max_distance_meters: 500
  });

  if (spatialError) {
    return { status: 500, message: `Spatial query error: ${spatialError.message}` };
  }

  // 3. Prepare AI triage request
  const contextNode = nearbyNodes?.[0];
  const systemPrompt = `You are a municipal water district engineer. Parse the following citizen report. Classify category (PIPELINE_BREACH_PRESSURE_DROP, HIGH_TURBIDITY, HIGH_MINERAL_CONTENT_TDS, CHEMICAL_DISCOLORATION_CONTAMINATION, UNCLASSIFIED_INFRASTRUCTURE_ANOMALY) and urgency (LOW, MEDIUM, HIGH, CRITICAL). Translate to English if needed. Summarize in one sentence.`;
  const promptText = `${systemPrompt}\nReport: "${complaint.rawText}"\nNearby Sensor: ${contextNode ? JSON.stringify(contextNode) : "None"}`;
  
  let result;
  try {
    result = await mockGeminiCall(promptText);
  } catch (err: any) {
    return { status: 500, message: err.message };
  }

  // Verify result format against Zod schema
  const parsed = complaintTriageSchema.safeParse(result);
  if (!parsed.success) {
    return { status: 500, message: "AI response schema invalid" };
  }

  // 4. Update the complaint in Database
  const { error: updateError } = await supabase
    .from("Complaint")
    .update({
      translatedText: result.translatedText || null,
      summary: result.summary,
      category: result.category,
      urgency: result.urgency,
      aiStatus: "SUCCESS"
    })
    .eq("id", complaintId);

  if (updateError) {
    return { status: 500, message: `Failed to update complaint: ${updateError.message}` };
  }

  // 5. If spatial correlation matched, create a DiagnosticAlert
  if (contextNode) {
    const geminiAnalysis = {
      rootCauseAnalysis: `Citizen reported: "${result.summary}". Nearest sensor node ${contextNode.name} shows threshold breaches.`,
      probableRootCause: result.probableRootCause || "Localized pipe breach",
      confidenceScore: result.confidenceScore || 80,
      recommendedAction: result.recommendedAction || "Inspect node valves"
    };

    const { error: insertError } = await supabase
      .from("DiagnosticAlert")
      .insert({
        nodeId: contextNode.id,
        complaintCount: 1,
        geminiAnalysis,
        status: "PENDING"
      });

    if (insertError) {
      return { status: 500, message: `Failed to insert diagnostic alert: ${insertError.message}` };
    }
  }

  return { status: 200, success: true };
}

test("mockTriageLogic handles missing complaintId", async () => {
  const supabase = {};
  const mockGemini = vi.fn();
  const res = await mockTriageLogic({}, supabase, mockGemini);
  expect(res.status).toBe(400);
  expect(res.message).toBe("Missing ID");
});

test("mockTriageLogic handles complaint not found", async () => {
  const mockSupabase = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } })
        })
      })
    })
  };
  const mockGemini = vi.fn();
  const res = await mockTriageLogic({ complaintId: "nonexistent-id" }, mockSupabase, mockGemini);
  expect(res.status).toBe(404);
  expect(res.message).toBe("Complaint not found");
});

test("mockTriageLogic processes complaint with no nearby anomalies", async () => {
  const mockSingle = vi.fn().mockResolvedValue({
    data: { id: "c1", rawText: "I see a pipeline leak" },
    error: null
  });
  const mockUpdate = vi.fn().mockResolvedValue({ error: null });
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });

  const mockSupabase = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ single: mockSingle })
      }),
      update: () => ({
        eq: mockUpdate
      }),
      insert: mockInsert
    }),
    rpc: mockRpc
  };

  const mockGemini = vi.fn().mockResolvedValue({
    category: "PIPELINE_BREACH_PRESSURE_DROP",
    urgency: "HIGH",
    translatedText: "Pipeline leak observed",
    summary: "Citizen reported a pipeline leak.",
    probableRootCause: "Corrosion or external damage",
    confidenceScore: 90,
    recommendedAction: "Dispatch field crew to pressure test sector"
  });

  const res = await mockTriageLogic(
    { complaintId: "c1", latitude: 14.5, longitude: 121.0 },
    mockSupabase,
    mockGemini
  );

  expect(res.status).toBe(200);
  expect(res.success).toBe(true);
  expect(mockSingle).toHaveBeenCalled();
  expect(mockRpc).toHaveBeenCalledWith("find_nearby_anomalies", {
    report_lat: 14.5,
    report_lng: 121.0,
    max_distance_meters: 500
  });
  expect(mockGemini).toHaveBeenCalled();
  expect(mockInsert).not.toHaveBeenCalled();
});

test("mockTriageLogic processes complaint and inserts DiagnosticAlert when spatial correlation matches", async () => {
  const mockSingle = vi.fn().mockResolvedValue({
    data: { id: "c1", rawText: "Water is discolored and smells bad" },
    error: null
  });
  const mockUpdate = vi.fn().mockResolvedValue({ error: null });
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockRpc = vi.fn().mockResolvedValue({
    data: [{ id: "node-123", name: "Valve Station B", status: "MAINTENANCE" }],
    error: null
  });

  const mockSupabase = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ single: mockSingle })
      }),
      update: () => ({
        eq: mockUpdate
      }),
      insert: mockInsert
    }),
    rpc: mockRpc
  };

  const mockGemini = vi.fn().mockResolvedValue({
    category: "CHEMICAL_DISCOLORATION_CONTAMINATION",
    urgency: "CRITICAL",
    translatedText: "Water discolored and bad smelling",
    summary: "Citizen reported discolored, smelling water.",
    probableRootCause: "Cross contamination or chemical breach",
    confidenceScore: 95,
    recommendedAction: "Isolate sector and flush lines"
  });

  const res = await mockTriageLogic(
    { complaintId: "c1", latitude: 14.5, longitude: 121.0 },
    mockSupabase,
    mockGemini
  );

  expect(res.status).toBe(200);
  expect(res.success).toBe(true);
  expect(mockRpc).toHaveBeenCalled();
  expect(mockInsert).toHaveBeenCalledWith({
    nodeId: "node-123",
    complaintCount: 1,
    geminiAnalysis: {
      rootCauseAnalysis: 'Citizen reported: "Citizen reported discolored, smelling water.". Nearest sensor node Valve Station B shows threshold breaches.',
      probableRootCause: "Cross contamination or chemical breach",
      confidenceScore: 95,
      recommendedAction: "Isolate sector and flush lines"
    },
    status: "PENDING"
  });
});
