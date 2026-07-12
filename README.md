# AquaTrack Web Platform

A production-ready municipal water district command center for real-time IoT telemetry monitoring, AI-powered citizen complaint triage, and field crew dispatch.

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router) using React Server Components (RSC) for pre-rendering administrative dashboards.
- **Styling & UI**: Tailwind CSS + shadcn/ui custom styling utilities.
- **Data Visualization**: Tremor + Recharts for displaying historical and live telemetry metrics.
- **Geospatial Rendering**: Mapbox GL JS for client-side rendering of coordinate arrays, pipeline network layers, and active 500m PostGIS scan rings.
- **Reporting Utility**: jsPDF + jsPDF-AutoTable for compiling and generating client-side downloadable water quality compliance documentation.
- **Testing**: Vitest (33 tests, 11 suites).

### Backend & Core Services
- **Application Server**: Next.js 16 (Server Environment) hosting secure API Routes, Server Actions, and Auth routes.
- **In-Memory Cache & Rate Limiter**: Redis (via Upstash) to enforce endpoint protection and cache rapid IoT sensor bursts.
- **Database Mapping & ORM**: Prisma ORM utilizing the `@prisma/adapter-pg` driver adapter.
- **Serverless Microservices**: Supabase Edge Functions (Deno/TypeScript runtime) executing database triggers and third-party communications.
- **Authentication**: Supabase Auth (GoTrue API) for secure user registrations, logins (including Facebook OAuth), and session management.
- **Object Storage**: Supabase Storage Buckets for structured hosting of citizen-submitted leak and damage photos.

### Database Layer
- **Core Engine**: Supabase PostgreSQL (Cloud-managed relational database).
- **Spatial Extension**: PostGIS for native handling of geometry data types, boundary indexing, and coordinate proximity analytics.
- **Connection Pooler**: PgBouncer configured on port 6543 to preserve thread capacity.
- **Real-time Streaming**: Supabase Realtime (WebSockets) for pushing live system updates (new complaints and status changes) to the dashboard interface without page refreshes.

### AI & Communications
- **AI Integration Core**: Google Gemini API integrated via the Vercel AI SDK using Structured JSON Schema mode for multi-lingual complaint triaging.
- **Transactional Email Layer**: Resend API + React Email for immediate structural breakdown routing and engineer dispatches.

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repo-url>
cd aquatrack-web
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

> **Note:** `--legacy-peer-deps` is required because `@tremor/react` declares a peer dependency on React 18 while this project runs React 19. The flag bypasses the strict peer resolution check — Tremor works correctly at runtime despite the version mismatch.

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the following:

```env
# Supabase (PostgreSQL + Edge Functions + Auth)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Supabase Auth (public — safe to expose in browser)
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://[instance].upstash.io"
UPSTASH_REDIS_REST_TOKEN="AX..."

# Google Gemini AI
GEMINI_API_KEY="AIza..."

# Vercel AI SDK (optional; falls back to GEMINI_API_KEY if omitted)
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."

# Resend Email
RESEND_API_KEY="re_..."

# Mapbox (public — safe to expose)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."
```

### 4. Database Setup

> Enable the PostGIS extension first: Supabase Dashboard → Database → Extensions → **postgis**

```bash
npx prisma generate
npx prisma migrate deploy
```

Then open the **Supabase SQL Editor** and run `supabase/find_nearby_anomalies.sql` to register the PostGIS RPC function used by the AI triage engine.

### 5. Deploy Edge Functions

```bash
supabase login
supabase link --project-ref [your-project-ref]
supabase functions deploy telemetry-ingest
supabase functions deploy triage-complaint
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set UPSTASH_REDIS_REST_URL=https://...
supabase secrets set UPSTASH_REDIS_REST_TOKEN=AX...
```

### 6. Run the local environment

You can run and operate the entire platform locally using the following steps:

#### Start the Next.js Dev Server
```bash
npm run dev
```
By default, the server runs on **http://localhost:3000** (or **http://localhost:3001** if port 3000 is occupied).

#### View and Edit Database Records
Launch Prisma Studio to inspect, add, or edit telemetry readings, complaints, and user accounts:
```bash
npx prisma studio
```
Visit the database explorer at **http://localhost:5555**.

#### Seeding & Simulating Mock IoT Telemetry
To populate your map and telemetry charts with real-time streaming data:
1. Log into the platform (or visit the `/admin` page directly).
2. Use the **Simulate Node Telemetry Ingestion** controls to generate mock IoT payload streams.
3. Verify that the sparkline charts on the `/dashboard` update instantly with newly ingested parameters.

### Web App Routing

| Route | Description |
|-------|-------------|
| `/` | Public homepage — tagline, metrics, offices map, advisories |
| `/login` | Staff login — Supabase Auth email/password sign-in |
| `/register` | Account registration — Supabase Auth sign-up with email confirmation |
| `/dashboard` | Command Center — map, telemetry sparklines, alert sidebar |
| `/crew` | Field Crew Mobile Portal — active work orders + status transitions |
| `/admin` | Admin Panel — threshold configuration & simulation controls |

### Backend API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/complaints` | Ingests a new citizen complaint. Resolves location using Nominatim/PostGIS and triggers an asynchronous AI triage webhook. |
| `POST` | `/api/triage` | Direct synchronous endpoint to classify text category and urgency via Google Gemini & Vercel AI SDK. |
| `POST` | `/api/locate-barangay` | Reverse-geocodes coordinate pairs to a normalized San Fernando barangay (using OSM Nominatim with PostGIS fallback). |
| `GET`, `POST`, `DELETE` | `/api/advisories` | Manages community alerts and bulletins (fetch all, create new, delete by ID). |
| `POST` | `/api/auth/profile` | Resolves a user's role and details for a given Supabase Auth ID. |
| `POST` | `/api/auth/register` | Syncs a newly signed-up Supabase Auth user to the database's `User` model. |
| `GET`, `PUT` | `/api/admin/complaints` | Administrative route to list all complaints or modify status and engineer dispatches. |
| `GET` | `/api/admin/heatmap` | Aggregates and counts complaints grouped by barangay for mapping. |
| `GET`, `PUT` | `/api/admin/nodes` | Fetches all telemetry nodes or toggles sensor statuses (`ONLINE`, `OFFLINE`, `MAINTENANCE`). |
| `GET` | `/api/admin/stats` | Fetches operational metrics (total users, active nodes, unresolved complaints). |
| `GET`, `PUT` | `/api/admin/users` | Lists all users or updates role profiles, phone, and service account numbers. |


## Authentication

AquaTrack uses **Supabase Auth** for staff identity management.

### How it works

1. **Sign Up** (`/register`): Staff submit name, email, and password. Supabase sends a confirmation email. The `full_name` is stored in `auth.users.raw_user_meta_data`.
2. **Email Confirmation**: The user clicks the link in the Supabase-sent email, which activates their account.
3. **DB Sync (automatic)**: A PostgreSQL trigger (`on_auth_user_created`) fires on every new `auth.users` insert and creates a corresponding row in `public."User"` with `role = CONSUMER_RESIDENT`. The `User.id` is the Supabase Auth UUID, permanently linking the auth identity to the app record.
4. **Sign In** (`/login`): Staff authenticate with email and password via `signInWithPassword`. On success they are redirected to `/dashboard`.
5. **Session**: Supabase manages the session via a secure cookie. The browser Supabase client (`src/lib/supabase.ts`) uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Supabase Auth Configuration

In your Supabase project dashboard:
- **Authentication → Settings** → Set **Site URL** to your deployed app URL (e.g. `https://aquatrack.vercel.app`)
- **Authentication → Settings** → Add `http://localhost:3000` under **Redirect URLs** for local development
- **Authentication → Email Templates** → Customize the confirmation email with CSFWD branding (optional)

### Installing the Auth → Database Sync Trigger

After running `prisma migrate deploy`, open the **Supabase SQL Editor** and run:

```
supabase/sync_auth_users.sql
```

This installs the `on_auth_user_created` trigger. After that, every new account registered through `/register` will automatically appear as a row in `public."User"` with:

| Field | Value |
|-------|-------|
| `id` | Supabase Auth UUID |
| `name` | `full_name` from sign-up form (falls back to email prefix) |
| `email` | Account email |
| `role` | `CONSUMER_RESIDENT` (default; admin can promote later) |
| `phone` | `null` (can be set later via admin panel) |
| `serviceAccountNo` | `null` (assigned by CSFWD admin) |

## Useful Operations

### Run Tests
```bash
npm test                                          # Full suite (33 tests)
npx vitest run tests/ai-triage.test.ts            # AI triage unit tests
npx vitest run tests/complaints-api.test.ts       # Complaint route tests
npx vitest run tests/proximity-sorting.test.ts    # Haversine distance tests
npx vitest                                        # Watch mode
```

### Inspect the Database
```bash
npx prisma studio
```

### Submit a Test Complaint (PowerShell)
```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/complaints" `
  -ContentType "application/json" `
  -Body '{"rawText":"Mababa ang presyon ng tubig dito","latitude":14.5995,"longitude":120.9842}'
```

### Production Build
```bash
npm run build
npm start
```

## Optimizations
- **PostGIS Spatial Indexing**: GiST indexes on `TelemetryNode.geom` and `Complaint.geom` columns ensure sub-millisecond 500m buffer queries even at scale.
- **Upstash Hot Cache**: Latest sensor readings per node are cached in Redis to avoid repeated Postgres reads on every telemetry dashboard poll.
- **Async Triage Trigger**: The `/api/complaints` route returns a `202 Accepted` immediately and fires the `triage-complaint` Edge Function asynchronously — citizens never wait on Gemini API latency.
- **Legacy Peer Deps**: `@tremor/react` pins to React 18 peer deps; installed with `--legacy-peer-deps` since the project runs React 19.
- **Dialect Translation**: Gemini is prompted to translate Tagalog, Taglish, and Kapampangan before classification to ensure consistent enum mapping regardless of input language.

## Recent Platform Upgrades (July 2026)

- **Operational News & Events Broadcasting**: Expanded the community broadcasting subsystem to support publishing `NEWS` (green theme) and `EVENT` (purple theme) notices. These are dynamically linked to automatically populate the "Latest District News" and "Upcoming District Events" columns on the administrator homepage dashboard.
- **Precision Geolocation Fallback**: Upgraded the client portal's geolocator to utilize a multi-tier fallback pipeline. If a high-accuracy GPS query fails or times out, the client automatically retries using low-accuracy Wi-Fi/IP triangulation.
- **Barangay Sorting & Filtering**: Added dynamic Barangay filters and alphabetical (A-Z/Z-A) and urgency sorting to the administrative complaints database, complete with location pill badges for each ticket row.
- **Interactive Map Popups & HUD Overlay**: Configured a `🗺️ View Map` action button on the complaints logs to switch tabs and fly coordinates. Complaints pins are equipped with Mapbox Popups and detailed HUD overlay cards listing resident names, water service account numbers, barangay, and problem descriptions.
- **Fluid & Scrollable Viewports**: Removed rigid viewport height locks (`h-screen overflow-hidden`) from all dashboards (admin, sub-admin, and client portals), replacing them with responsive grids and layouts that support natural document scrolling.
- **Dynamic Heatmaps & Pulse Overlays**: Integrated a native Mapbox GL Heatmap density layer with category-colored pulsing indicators matching issue classifications.
- **Gemini Barangay Summarizer**: Leveraged `gemini-3.5-flash` to write automated two-sentence threat assessments and operational safety status cards for municipal sectors, backed by a robust statistics-based local fallback.
- **Anti-Flicker Marker Physics**: Wrapped Mapbox pins in stationary transparent hitboxes (`w-9 h-9`) to resolve boundary scaling glitches and hover flickering during map zooming/panning.
- **Supabase Real-Time Broadcasts**: Connected Web socket subscription listeners across the Admin, Sub-Admin, and Resident client portals to push database modifications instantly.
- **Unified Font Stack**: Loaded Plus Jakarta Sans (for body text and titles) and Geist Mono (for IDs, emails, timestamps, and coordinates) into Tailwind CSS v4 `@theme` layouts.
- **Split-Column Incident Reporting Grid**: Redesigned the client portal's "File a Complaint" workflow into a side-by-side layout, grouping text inputs, file attachments, and active Gemini AI diagnostic cards on the left, while placing Nominatim address queries, Mapbox coordinates canvas, and PostGIS verification on the right.
- **Resident Portal Dashboard Home**: Introduced a central Home hub inside the consumer portal featuring custom greeting hero cards, active ticket metrics, municipal status checks, and quick shortcuts.
- **Dynamic System Warning Alarms**: Tied broadcasted warnings directly into the administrator dashboard's notifications feed. Warning notices now dynamically increment the Alerts header count, populate the header notification drawer cards, and append directly to the Home screen's "Critical System Alerts" feed.
- **Premium Minimalist Style (Text-Only UI)**: Discarded non-logo SVG path icons and decorative emojis across the Client, Admin, and Sub-Admin portals. Converted header controls (Alerts, Help, Mode toggles, and Logout) and sidebar navigation loops into minimalist text-only buttons.
- **Class-Based Global Dark Mode**: Configured class-based dark mode toggling across all three dashboard portals, supported by global stylesheet selectors and local storage persistence.
