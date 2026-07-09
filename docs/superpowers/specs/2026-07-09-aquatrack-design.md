# AquaTrack Web Platform - Comprehensive Architecture Spec

**Date:** 2026-07-09  
**Status:** Approved  
**Topic:** Municipal Water District Operational Command Center

---

## 1. Technical Stack Overview

* **Frontend:** Next.js 16 (App Router), Tailwind CSS, shadcn/ui, Tremor + Recharts, Mapbox GL JS.
* **Backend:** Next.js Server Side Environment (API Routes & Server Actions), Prisma ORM, Supabase Edge Functions.
* **Database:** Supabase PostgreSQL + PostGIS, PgBouncer.
* **Others:** Upstash Redis (Caching & Rate Limiter), Google Gemini API (via Vercel AI SDK with Structured JSON output), Resend API.

---

## 2. Database Schema (Prisma & PostGIS)

Our database infrastructure uses a centralized Supabase PostgreSQL instance with the native PostGIS spatial framework enabled, managed through Prisma ORM.

### 2.1 Prisma Schema Definition

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [postgis]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

// --------------------------------------------------------
// ENUMS
// --------------------------------------------------------

enum IssueCategory {
  PIPELINE_BREACH_PRESSURE_DROP
  HIGH_TURBIDITY
  HIGH_MINERAL_CONTENT_TDS
  UNCLASSIFIED_INFRASTRUCTURE_ANOMALY
  CHEMICAL_DISCOLORATION_CONTAMINATION
}

enum UrgencyLevel {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum TicketStatus {
  PENDING
  INVESTIGATING
  DISPATCHED
  RESOLVED
}

enum NodeType {
  PUMP_STATION
  HOUSEHOLD_EDGE
}

enum NodeStatus {
  ONLINE
  OFFLINE
  MAINTENANCE
}

enum WorkOrderStatus {
  ASSIGNED
  IN_PROGRESS
  RESOLVED
}

enum UserRole {
  ADMIN
  FIELD_ENGINEER_TECHNICIAN
  CONSUMER_RESIDENT
}

enum AiStatus {
  SUCCESS
  FAILED
}

// --------------------------------------------------------
// INFRASTRUCTURE & MONITORING MODELS
// --------------------------------------------------------

model TelemetryNode {
  id        String             @id @default(uuid())
  name      String
  type      NodeType
  latitude  Float
  longitude Float
  geom      Unsupported("geometry(Point, 4326)")
  status    NodeStatus         @default(ONLINE)
  readings  TelemetryReading[]
  alerts    DiagnosticAlert[]
}

model TelemetryReading {
  id        String        @id @default(uuid())
  nodeId    String
  node      TelemetryNode @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  ph        Float
  turbidity Float
  tds       Float
  pressure  Float
  timestamp DateTime      @default(now())

  @@index([nodeId, timestamp(sort: Desc)])
}

// --------------------------------------------------------
// DISPATCH & CRM MODELS
// --------------------------------------------------------

model Complaint {
  id             String         @id @default(uuid())
  rawText        String
  translatedText String?
  summary        String?
  category       IssueCategory?
  urgency        UrgencyLevel?
  status         TicketStatus   @default(PENDING)
  aiStatus       AiStatus       @default(SUCCESS)
  imageUrl       String?
  latitude       Float
  longitude      Float
  geom           Unsupported("geometry(Point, 4326)")
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  userId         String?
  user           User?          @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([status])
}

model DiagnosticAlert {
  id             String        @id @default(uuid())
  nodeId         String
  node           TelemetryNode @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  complaintCount Int           @default(1)
  geminiAnalysis Json
  status         TicketStatus  @default(PENDING)
  createdAt      DateTime      @default(now())
  workOrders     WorkOrder[]
}

model WorkOrder {
  id          String          @id @default(uuid())
  alertId     String
  alert       DiagnosticAlert @relation(fields: [alertId], references: [id], onDelete: Cascade)
  engineerId  String?
  engineer    User?           @relation(fields: [engineerId], references: [id], onDelete: SetNull)
  status      WorkOrderStatus @default(ASSIGNED)
  notes       String?
  createdAt   DateTime        @default(now())
  resolvedAt  DateTime?
}

model User {
  id               String      @id @default(uuid())
  name             String
  email            String      @unique
  role             UserRole
  phone            String
  serviceAccountNo String?
  complaints       Complaint[]
  workOrders       WorkOrder[]
}
```

### 2.2 Spatial Query Flow (PostGIS Implementation)

When an incoming public incident ticket updates inside the system, the Edge layer hooks call the internal PostGIS engine using Prisma's `$queryRaw` utility block:

```typescript
// Location parameters extracted cleanly from client submission payloads
const report_lng = payload.longitude;
const report_lat = payload.latitude;

// Locates telemetry nodes within a 500-meter threshold showing alert markers
const nearbyAnomalies = await prisma.$queryRaw`
  SELECT 
    t.id, 
    t.name,
    ST_Distance(
      t.geom, 
      ST_SetSRID(ST_MakePoint(${report_lng}, ${report_lat}), 4326)::geography
    ) as distance_meters
  FROM "TelemetryNode" t
  WHERE t.status = 'MAINTENANCE'
    AND ST_DWithin(
      t.geom, 
      ST_SetSRID(ST_MakePoint(${report_lng}, ${report_lat}), 4326), 
      500
    );
`;
```

### 2.3 Upstash Redis Caching Topology

* **Sliding-Window Ingress Control:** Requests map to `ratelimit:<ip_address>:<endpoint_route>` tracking clusters. Ingestion controllers query this ledger instantly to evaluate current transaction velocities, dropping requests exceeding 5 transactions per hour before they spin database threads.
* **Hot Parameter State Store:** Live IoT packets stream updates straight to `node:latest:<node_id>` JSON strings inside Redis with an intentional TTL expiration window. The primary Mapbox administrative client center references these keys instantly upon paint loops, preventing active browser screen views from executing repetitive queries against the primary `TelemetryReading` logs.

---

## 3. API Architecture & Ingestion Flow

We decouple our API layer into two execution points:
1. **Supabase Edge Functions** for isolated, sub-second IoT telemetry processing.
2. **Next.js Server Actions / Route Handlers** for rapid user mutations, mobile ingress, and data presentation.

### 3.1 IoT Telemetry Ingestion Flow (Edge Function: `telemetry-ingest`)

```
[IoT Hardware Sensor Node] 
       │ (HTTP POST with Security HMAC Signature)
       ▼
 1. Verify Node ID / Upstash Redis Rate Limiter (`ratelimit:node_id`)
       │
       ▼
 2. Write Parameter Payload to Hot Cache (`node:latest:<node_id>`)
       │
       ▼
 3. Evaluate Thresholds (Pressure, pH, Turbidity, TDS)
       │
       ├──► Within Normal Limits ──► Terminate Stream with 200 OK
       │
       └──► Threshold Deviation Detected
                 │
                 ▼
           4. Instantly flip Node status to 'MAINTENANCE' or 'OFFLINE'
           5. Commit current reading directly to PostgreSQL `TelemetryReading`
           6. Fire Real-time Dashboard Update via Supabase WebSockets
```

### 3.2 Citizen Complaint Ingestion Flow (Next.js Route: `/api/complaints`)

```
[Verified Resident Mobile Client]
       │ (Submit Text + Coordinates + Image Asset)
       ▼
 1. Check Upstash Redis Rate Limiter (`ratelimit:complaint:<ip_address>`)
       │
       ▼
 2. Commit `Complaint` to Postgres with `TicketStatus.PENDING` and `AiStatus.SUCCESS`
       │
       ├──► Natively generates PostGIS geometry object from Float coordinates
       │
       ▼
 3. Return Immediate `202 Accepted` Payload back to Mobile Application
       │
  [ASYNC DATABASE HANDOFF VIA SUPABASE WEBHOOK]
       │
       ▼
 4. Trigger fires Async HTTP POST ──► Supabase Edge Function (`triage-complaint`)
                                           │
                                           ├─► PostGIS Scan (`ST_DWithin` 500m for active anomalies)
                                           ├─► Call Gemini (Translates & matches IssueCategory)
                                           ├─► Commit triage parameters to original Postgres row
                                           └─► Trigger Resend Dispatch Engine (if CRITICAL / HIGH)
```

---

## 4. AI & Diagnostic Engine

Our AI analysis engine relies on the Google Gemini API orchestrated asynchronously via the Vercel AI SDK's strict structured output layer (`generateObject`). It translates incoming municipal dialects (Tagalog, Taglish, Kapampangan), maps complaints against concurrent physical telemetry events, and creates contextual engineering logs.

### 4.1 Schemas

#### Citizen Report Triage Schema
```typescript
import { z } from "zod";

export const complaintTriageSchema = z.object({
  category: z.enum([
    "PIPELINE_BREACH_PRESSURE_DROP",
    "HIGH_TURBIDITY",
    "HIGH_MINERAL_CONTENT_TDS",
    "CHEMICAL_DISCOLORATION_CONTAMINATION",
    "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY"
  ]),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  translatedText: z.string().nullable().describe("Clean English translation of rawText, or null if input text is English prose."),
  summary: z.string().describe("A single, descriptive sentence highlighting the primary physical water issue.")
});
```

#### Diagnostic Analysis Schema
```typescript
export const diagnosticAnalysisSchema = z.object({
  rootCauseAnalysis: z.string().describe("Technical correlation connecting the text report directly to sensor anomalies."),
  probableRootCause: z.string().describe("Estimated physical structural failure (e.g., Pipe fracture upstream of Node 456)."),
  confidenceScore: z.number().min(0).max(100).describe("Integer value between 0 and 100 assessing the failure match probability."),
  recommendedAction: z.string().describe("Direct instructions for the field technician (e.g., Check gate valve B-12 context).")
});
```

### 4.2 Engine Pipeline

```
[Gemini API Operational Output]
                      │
                      ▼
 1. Commit structured variables to targeted `Complaint` tracking cells
                      │
 2. Check for Proximity Telemetry Node Anomalies
                      │
                      ├──► Telemetry Correlation Matched
                      │         │
                      │         ▼
                      │   3. Create or append active `DiagnosticAlert` row
                      │   4. Inject JSON schema object into `geminiAnalysis` column
                      │   5. Set Diagnostic status = TicketStatus.PENDING
                      │
                      └──► Independent Incident Only (No Telemetry Anomaly)
                                │
                                ▼
                          Bypass Alert Creation
                      │
                      ▼
 6. Evaluate Urgency Level Matrix Output
                      │
                      ├──► Urgency is HIGH or CRITICAL ──► Dispatch Resend HTML Template
                      │                                    (Fires on-duty technician alerts)
                      │
                      └──► Urgency is MEDIUM or LOW ─────► Log silently to Command View
```

---

## 5. Frontend Architecture & Real-Time Console

The frontend is built with Next.js 16 (App Router), Tailwind CSS, and shadcn/ui. 

### 5.1 Route Hierarchy

```
aquatrack-web/
├── src/
    └── app/
        ├── page.tsx                 # Administrative Entry Portal & IAM Gate
        ├── admin/
        │   └── page.tsx             # Threshold Configuration & Simulation Toggles
        ├── crew/
        │   └── page.tsx             # Mobile-Responsive Field Engineering Views
        └── dashboard/
            ├── page.tsx             # Command Center Backdrop Shell
            └── layout.tsx           # Global Sidebar Shell Integration
```

* **`/` (Landing & Access Control):** Secure administrative login node using JWT role permissions. Includes sub-route context for rendering testing components in a sandbox.
* **`/dashboard` (Operator Command Console):** Full-bleed, un-scrollable desktop console. The map dominates the layout, and real-time task sidebars snap to the right edge.
* **`/crew` (Field Engineering Responsive Grid):** Mobile/touch-targeted responsive viewport. It reads user geolocation arrays, displays active `WorkOrder` descriptions, and provides forms to resolve tasks.
* **`/admin` (Infrastructure & Threshold Configuration):** Panel to manage `TelemetryNode` topology, tune alert boundaries, and trigger simulations.

### 5.2 Key Component Interfaces

* **`MapboxMap`**: Renders custom vector coordinate layers.
  * *Radius Bounding:* Clicking an active node/ticket draws a precise 500m radius SVG circle directly around coordinates.
  * *Dynamic Layer Modifiers:* Repaints marker and path state in real time via Supabase subscription bindings.
* **`TelemetryAnalytics`**: Uses Tremor charts to show selected node curves:
  * *Hydrostatic Pressure Tracker:* Plots pressure ($0 - 60\text{ PSI}$) to reveal fracture anomalies.
  * *Chemical Profile Analytics:* Correlates pH ($0 - 14$), Turbidity ($\text{NTU}$), and Total Dissolved Solids ($\text{ppm}$).
* **`DiagnosticAlertDrawer`**: Renders Gemini's diagnosis results and implements a proximity sorting algorithm against active `User` locations (`FIELD_ENGINEER_TECHNICIAN`) to suggest nearest crews.

### 5.3 Real-Time Sync Subscriptions

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const operationsChannel = supabase
  .channel("realtime-operational-feed")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "Complaint" }, (payload) => {
    // 1. Plot a new geocoded symbol layer point on the active Mapbox instance instantly
    // 2. Fire an audible high-priority diagnostic sound alert inside the control room
    appendLiveComplaintToMapCanvas(payload.new);
  })
  .on("postgres_changes", { event: "UPDATE", schema: "public", table: "TelemetryNode" }, (payload) => {
    // Intercept hardware status adjustments to flash warning indicator frames
    if (payload.new.status === "MAINTENANCE" || payload.new.status === "OFFLINE") {
      triggerMapMarkerPulseAnimation(payload.new.id, payload.new.status);
    }
  })
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "DiagnosticAlert" }, (payload) => {
    // Render an interactive floating toast notice linking operators to the alert detail view
    surfaceGlobalDiagnosticNotificationToast(payload.new);
  })
  .subscribe();
```
