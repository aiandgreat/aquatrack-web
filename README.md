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

- **Searchable, Sortable, and Filterable Spatial Heatmaps**: Refactored the Barangay Grid incident heatmap in the Admin Portal's command center (`HeatmapsSection.tsx`) to support instant search by name, multi-tier severity filters (All, Critical, Moderate, Low Risk, Clean), and incident count/alphabetical sorting. Added real-time metadata counts and filter-clear buttons to provide a highly manageable incident-density dashboard.
- **Race-Condition-Free Mapbox Mounting**: Resolved map loading bugs within the client's "File a Complaint" tab (`DashboardClient.tsx`) by replacing fragile `setTimeout` hooks with React callback refs (`handleMapRef`). This guarantees that the Mapbox GL map instance initializes only after the DOM element is fully mounted following exit animations, and forces layout recalculations to fit transition states cleanly.
- **Operational News & Events Broadcasting**: Expanded the community broadcasting subsystem to support publishing `NEWS` (green theme) and `EVENT` (purple theme) notices. These are dynamically linked to automatically populate the "Latest District News" and "Upcoming District Events" columns on the administrator homepage dashboard.
- **Precision Geolocation Fallback**: Upgraded the client portal's geolocator to utilize a multi-tier fallback pipeline. If a high-accuracy GPS query fails or times out, the client automatically retries using low-accuracy Wi-Fi/IP triangulation.
- **Barangay Sorting & Filtering**: Added dynamic Barangay filters and alphabetical (A-Z/Z-A) and urgency sorting to the administrative complaints database, complete with location pill badges for each ticket row.
- **Interactive Map Popups & HUD Overlay**: Configured a `🗺️ View Map` action button on the complaints logs to switch tabs and fly coordinates. Complaints pins are equipped with Mapbox Popups and detailed HUD overlay cards listing resident names, water service account numbers, barangay, and problem descriptions.
- **Fluid & Scrollable Viewports**: Removed rigid viewport height locks (`h-screen overflow-hidden`) from all dashboards (admin, sub-admin, and client portals), replacing them with responsive grids and layouts that support natural document scrolling.
- **Dynamic Heatmaps & Pulse Overlays**: Integrated a native Mapbox GL Heatmap density layer with category-colored pulsing indicators matching issue classifications.
- **Gemini Barangay Summarizer & AI Triage**: Leveraged `gemini-3.1-flash-lite` for both high-speed threat assessments and automated report classification, optimized with regional dialect instructions (Tagalog, Taglish, Kapampangan) for high translation accuracy, backed by Upstash Redis caching.
- **Anti-Flicker Marker Physics**: Wrapped Mapbox pins in stationary transparent hitboxes (`w-9 h-9`) to resolve boundary scaling glitches and hover flickering during map zooming/panning.
- **Supabase Real-Time Broadcasts**: Connected Web socket subscription listeners across the Admin, Sub-Admin, and Resident client portals to push database modifications instantly.
- **Unified Font Stack**: Loaded Plus Jakarta Sans (for body text and titles) and Geist Mono (for IDs, emails, timestamps, and coordinates) into Tailwind CSS v4 `@theme` layouts.
- **Split-Column Incident Reporting Grid**: Redesigned the client portal's "File a Complaint" workflow into a side-by-side layout, grouping text inputs, file attachments, and active Gemini AI diagnostic cards on the left, while placing Nominatim address queries, Mapbox coordinates canvas, and PostGIS verification on the right.
- **Resident Portal Dashboard Home**: Introduced a central Home hub inside the consumer portal featuring custom greeting hero cards, active ticket metrics, municipal status checks, and quick shortcuts.
- **Dynamic System Warning Alarms**: Tied broadcasted warnings directly into the administrator dashboard's notifications feed. Warning notices now dynamically increment the Alerts header count, populate the header notification drawer cards, and append directly to the Home screen's "Critical System Alerts" feed.
- **Premium Minimalist Style (Text-Only UI)**: Discarded non-logo SVG path icons and decorative emojis across the Client, Admin, and Sub-Admin portals. Converted header controls (Alerts, Help, Mode toggles, and Logout) and sidebar navigation loops into minimalist text-only buttons.
- **Class-Based Global Dark Mode**: Configured class-based dark mode toggling across all three dashboard portals, supported by global stylesheet selectors and local storage persistence.
- **Cinematic Curtain-Split Splash Screen**: Added a light-themed curtain-split splash animation to the root landing page (`/`). Features a 20% opacity map of San Fernando blending with a `bg-slate-50` background, a centered colored logo, and branded blue/azure typography, which splits vertically down the middle to reveal the home content.
- **Premium Glassmorphism & High-Fidelity UI Elements**: Applied a unified glassmorphic theme system across all administrative and consumer components (`bg-white/40 border border-slate-200/80 backdrop-blur-md shadow-sm`). Inputs, drop-downs, and location badges feature custom-focused glow borders and transition animations.
- **Water Analytics Recharts & SVG Overhaul**: Built a dual-axis Recharts timeline graph (pH/Turbidity on left axis, TDS on right axis) to prevent scaling flattening, alongside stacked barangay classifications, a scrollable barangay status feed ledger, and a mathematically calculated custom SVG Donut chart with spring-physics hover displacement.
- **Gemini AI System Summary Engine**: Integrated an automated system narrative generator at the bottom of the analytics dashboard, powered by the `gemini-3.1-flash-lite` model, and cached in Upstash Redis to generate human-readable operations briefings.
- **Multipage Compliance PDF Compiler**: Overhauled the downloadable compliance documentation (`pdf-generator.ts`) to mirror the new Analytics dashboard. Incorporates the executive AI summary cards, hotspot stats, and node logs populated with realistic parameter variations.
- **Database Connection Singleton Pattern**: Resolved `Connection terminated unexpectedly` errors by establishing a thread-safe global connection cache (`prisma.ts`) in the application utilities. Caps connection limits and idle timeouts per pool.
- **Auth Session & Role Caching**: Reduced checking-session loading states and login redirect delays by caching user profiles in Upstash Redis (2-hour TTL), reducing auth routing latency to `<10ms`.
- **Mapbox Anti-Flicker Callback Stabilization**: Bound Mapbox canvas DOM mounts to a stable `React.useCallback` hook with an empty dependency array. This prevents Mapbox instances from destroying and rebuilding when the user types in textareas, ending visual flickering.
- **Login & Register Proportion & UI Refactoring**: Re-proportioned the split aside column layout on `/login` and `/register` to a 40% left aside branding panel and 60% right form panel. Modernized the logo to sit next to the upscaled text, styled the logo white on the aside cards, removed container shapes, and adjusted vertical alignment and spacing.
- **Form Card and Controls Compression**: Condensed the right-side registration form container size to `max-w-md` with `p-6` padding, smaller inputs (`px-4 py-3`), and tighter item spacing for a cleaner, unified profile view.
- **Auth Session & History Redirection Loop Fixes**: Implemented client-side mount checks on `/`, `/login`, and `/register` to redirect logged-in users to `/dashboard` or `/admin`, and replaced `router.push` with `router.replace` upon successful login, preventing back-button redirection loops.
- **Strict Registration Field & Supabase Validation**: Added strict validation checking on account sign-up. Form fields are programmatically enforced as mandatory, and passwords must contain uppercase, lowercase, numbers, and an asterisk (`*`). Handled Supabase Auth errors and added checks for duplicate emails by validating empty `identities` arrays.
- **Branding Stripe Removal**: Cleaned up the absolute-positioned colored branding ribbon stripes from all main layout headers, landing pages, and consoles.
- **Community Advisories Card Refinement**: Redesigned the landing page community advisories carousel cards into a uniform, fixed size (`h-[320px] md:h-[350px]`) to prevent layout shifts. Replaced the large SVG icons and blocky headers with a premium top gradient border, monospaced date badge, and a pulsing status indicator dot.
- **Complaints Image Preview Overhaul**: Updated the citizen complaint photo upload section to render the uploaded photo in full aspect ratio (uncropped, `max-h-80`) inside a centered container (`mx-auto`), replacing the drag-and-drop dropzone completely once uploaded, and removing the progress text indicator.
- **Red Coordinates Pin Marker**: Customized the Mapbox draggable device coordinates marker on the complaint map to render in red (fill and pulse ring) for higher visibility.
- **Upscaled Heatmap & Mount Resize**: Increased the live spatial heatmap height to a spacious `h-[580px]`, and added deferred Mapbox resize hooks (`450ms` delay) to prevent container clipping during tab entry animations.
- **Clickable Location Map Preview**: Removed redundant "View Map" buttons and columns across the Admin and Sub-Admin complaints listings. Location badges (`📍 Barangay Name`) were converted into clickable controls that fly the map preview.
- **Auth Transition Page Animations & Title Simplify**: Added horizontal slide-in page load transitions (`x: -40` to `x: 0`) to both the Login and Register portals. Simplified the login page headings to "Login" and "Enter your credentials to log in", and muted the button hover states to a matching deep navy blue (`bg-[#0B2E7A] hover:bg-[#08225c]`).
- **Consumer Dashboard Sidebar Removal**: Replaced the vertical left sidebar in the resident client dashboard (`DashboardClient.tsx`) with a clean, horizontal segmented navbar embedded in the center of the top header. The vertical menu is now reserved purely for mobile viewports via the sidebar drawer, freeing up horizontal space on desktop screens.
- **Consumer Home Dashboard Contact Integration**: Shifted the Contact Water District customer hotline, email addresses, office location coordinates, and command center metadata cards directly into the bottom of the main Home dashboard page. Removed the redundant separate "Contact Water District" navigation tab and adjusted the quick action cards into a balanced 3-column layout.
- **File a Complaint Container Styling Overhaul**: Removed the glassmorphic background layer (`bg-[#E2EAF4]/45 backdrop-blur-md border border-slate-300/40`) from the consumer portal main dashboard workspace when the "File a Complaint" tab is active. Replaced it with the unified solid white panel styles (`bg-white border border-slate-100/80 p-8`) to maintain consistent styling across all dashboard tabs.
- **Gradient Color Reduction**: Lessened the usage of color gradients across all pages, replacing them with solid, clean, professional SaaS color palettes. Updated the Login/Register aside panels (to solid `#001e66` navy), the client and sub-admin home welcome banners (to solid `#0B2E7A` navy), the admin welcome banner (to solid `#063A8C`), the landing page hero heading (to solid `#00aeef` brand blue), and replaced card gradients with solid slate/white borders.
- **Softer Grayish Background Theme**: Replaced high-contrast pure white (`#ffffff`) page and card backgrounds in light mode with a soft, premium grayish color palette. Configured global light-mode theme overrides in `globals.css` mapping the screen background to a cool Slate-100 (`#f1f5f9`) and mapping white cards (`bg-white`) to a soft, eye-friendly grayish off-white Slate-50 (`#f8fafc`). Adjusted sub-panels (`bg-slate-50`) to Slate-100 (`#f1f5f9`) and borders to Slate-200 (`#e2e8f0`) to preserve dimensional depth and contrast.
- **Precise Geofenced City Boundary Verification**: Implemented an accurate, 788-vertex coordinate boundary geofence for the City of San Fernando, Pampanga, using official OpenStreetMap relation data (Centroid checks, O(n) ray-casting point-in-polygon logic, and bounding-box fast-rejection pre-checks). This restricts complaint submissions to the valid service area.
- **Out-of-Scope Visual Map Overlays**: Configured real-time coordinate validation overlays on the resident complaint filing map. Pins dragged outside the geofenced city boundary trigger a semi-transparent red map overlay, a centered service area warning banner, and disable form submissions with a detailed helper error.
- **3D Neon Boundary Walls**: Upgraded the geofence visual boundaries across all map views (Client "File a Complaint", Admin "Geospatial Telemetry Control", and Admin "Spatial Heatmap") to render as a 3D translucent neon cyan wall (40m height fill-extrusion) paired with a triple-layer glowing outline for maximum visibility.
- **Barangay Coordinate Normalization**: Relocated the centroids of all 35 mock barangays inside the administrative database to coordinates 100% verified to be within the San Fernando bounding polygon, avoiding boundary false-outliers.
- **Always-on Map Complaint Pins**: Adjusted marker visibility rules to render individual complaint pin points at all zoom levels, ensuring immediate visibility even when zoomed out to the entire city view.
- **Dispatched Status Safety Guard**: Added database and API-level constraints that prevent changing a complaint status to `DISPATCHED` (both via admin/sub-admin select interfaces and direct HTTP PUT requests) unless the ticket has a field technician assigned. Option tags are dynamically disabled on the client side with helpful assignment instructions.

