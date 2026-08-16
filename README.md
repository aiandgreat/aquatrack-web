# AquaTrack Web Platform

A production-ready municipal water district command center for real-time IoT telemetry monitoring, AI-powered citizen complaint triage, and field crew dispatch.

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router) using React Server Components (RSC) for pre-rendering administrative dashboards.
- **Styling & UI**: Tailwind CSS + shadcn/ui custom styling utilities + Lucide React
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
- **Transactional Email Layer**: Brevo (Sendinblue) API + React Email for immediate structural breakdown routing and engineer dispatches.

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

# Brevo (Sendinblue) Email Service
BREVO_API_KEY="xkeysib-..."
BREVO_SENDER_EMAIL="your_registered_sender_email@gmail.com"

# Mapbox (public — safe to expose)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."

# Firebase Cloud Messaging Credentials
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email@project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg..."
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
| `POST` | `/api/auth/push-token` | Registers or updates a user's Firebase Cloud Messaging (FCM) push token, purging their Redis profile cache. |
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
| `pushToken` | `null` (registered on mobile login) |

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

## Recent Platform Upgrades (August 2026)

- **Mapbox Standard 3D Layer Safety & Stale Closure Fix**: Resolved a critical console crash (`layers.3d-buildings: source "composite" not found`) when toggling standard map styles by introducing `mapStyleRef` references to track map styles outside stale event listener closures.
- **Dynamic Time-of-Day Map Lighting Presets**: Integrated real-time local hour detection into the Mapbox Standard style configuration, dynamically setting light presets (`day`, `dusk`, `dawn`, `night`) to match real-world lighting cycles.
- **Native Mapbox Standard 3D Config Toggle**: Configured standard style properties (`show3dObjects` and `showTerrain`) to natively toggle 3D assets and topographic elevation based on UI controls.
- **Tailwind Config & Webpack Build Stability**: Restored Tailwind CSS `@config` directive routing inside Webpack and Turbopack compiler environments by anchoring target styles to `src/app/tailwind.config.ts`.
- **Barangay Pin Hover & Anti-Flicker Fixes**: Stabilized hover state transformations by shifting coordinate markers into transparent outer bounds (`w-9 h-9`) and spacing tooltips.
- **Firebase Cloud Messaging (FCM) Integration**: Added a `pushToken` string column to the `User` database model, introduced a Next.js `/api/auth/push-token` token registration route, and created an FCM notification trigger pipeline in the `/api/advisories` creation handler via `fcm-sender.ts`, allowing targeted push broadcasts to Residents or Field Technicians.
- **Searchable, Sortable, and Filterable Spatial Heatmaps**: Refactored the Barangay Grid incident heatmap in the Admin Portal's command center (`HeatmapsSection.tsx`) to support instant search by name, multi-tier severity filters (All, Critical, Moderate, Low Risk, Clean), and incident count/alphabetical sorting. Added real-time metadata counts and filter-clear buttons to provide a highly manageable incident-density dashboard.
- **Race-Condition-Free Mapbox Mounting**: Resolved map loading bugs within the client's "File a Complaint" tab (`DashboardClient.tsx`) by replacing fragile `setTimeout` hooks with React callback refs (`handleMapRef`). This guarantees that the Mapbox GL map instance initializes only after the DOM element is fully mounted following exit animations, and forces layout recalculations to fit transition states cleanly.
- **Operational News & Events Broadcasting**: Expanded the community broadcasting subsystem to support publishing `NEWS` (green theme) and `EVENT` (purple theme) notices. These are dynamically linked to automatically populate the "Latest District News" and "Upcoming District Events" columns on the administrator homepage dashboard.
- **Precision Geolocation Fallback**: Upgraded the client portal's geolocator to utilize a multi-tier fallback pipeline. If a high-accuracy GPS query fails or times out, the client automatically retries using low-accuracy Wi-Fi/IP triangulation.
- **Barangay Sorting & Filtering**: Added dynamic Barangay filters and alphabetical (A-Z/Z-A) and urgency sorting to the administrative complaints database, complete with location pill badges for each ticket row.
- **Interactive Map Popups & HUD Overlay**: Configured a `🗺️ View Map` action button on the complaints logs to switch tabs and fly coordinates. Complaints pins are equipped with Mapbox Popups and detailed HUD overlay cards listing resident names, water service account numbers, barangay, and problem descriptions.
- **Fluid & Scrollable Viewports**: Removed rigid viewport height locks (`h-screen overflow-hidden`) from all dashboards (admin, sub-admin, and client portals), replacing them with responsive grids and layouts that support natural document scrolling.
- **Dynamic Heatmaps & Pulse Overlays**: Integrated a native Mapbox GL Heatmap density layer with category-colored pulsing indicators matching issue classifications.
- **Gemini Barangay Summarizer & AI Triage**: Leveraged `gemini-3.5-flash-lite` for both high-speed threat assessments and automated report classification, optimized with regional dialect instructions (Tagalog, Taglish, Kapampangan) for high translation accuracy, backed by Upstash Redis caching.
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
- **Gemini AI System Summary Engine**: Integrated an automated system narrative generator at the bottom of the analytics dashboard, powered by the `gemini-3.5-flash-lite` model, and cached in Upstash Redis to generate human-readable operations briefings.
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
- **Automated Push Notifications**: Implemented automated Firebase Cloud Messaging (FCM) push notifications. The backend now instantly notifies the resident consumer when an admin/technician updates their ticket status, and notifies field technicians immediately when they are assigned a new work order.

---

## 🔔 Push Notification Triggers (Firebase Cloud Messaging)

The platform automatically sends push notifications to the mobile client in three scenarios:

1.  **Community Advisories**: Triggered when an admin creates a system-wide advisory bulletin (e.g., water quality alerts, planned maintenance schedules) via the Web Dashboard.
2.  **Ticket Status Updates**: Automatically dispatched to the resident consumer when an admin or technician changes their complaint status (e.g., `PENDING` → `RESOLVED`) in the Web Console.
3.  **Work Order Assignment**: Sent immediately to a field technician when an admin assigns them to investigate or repair a reported leak/anomaly.

---

## Session Changelog (July 25, 2026)

### IoT Telemetry Node Dashboard (`TelemetrySection.tsx`)

- **Card-Based Node Layout**: Replaced the flat HTML table layout for IoT nodes with a premium card-based list. Each node lives in its own bordered, hoverable card (`rounded-2xl`, `shadow-sm`, `hover:shadow-md`) with distinct sections for node identity and live sensor metrics.
- **Node Type Labels**: Mapped raw database enums to user-facing labels — `PUMP_STATION` renders as **Pumping Station** (sky badge) and `HOUSEHOLD_EDGE` renders as **Household Pipeline** (indigo badge).
- **Barangay Location**: Replaced raw GPS coordinates with a parsed Barangay name. Clicking the location opens a Mapbox satellite preview modal. Removed the `Location` suffix and dashed underline from the label.
- **Glowing Status Dot**: Each node card header shows a color-coded pulsing dot — emerald for `ONLINE`, amber for `MAINTENANCE`, rose for `OFFLINE`.
- **Status Dropdown Label**: Renamed the status selector label from `Override:` to `Status:`.
- **Node ID Hidden**: Removed raw database UUID display from node cards and the satellite preview modal.
- **AQ-NODE- Unique Identifier**: Introduced a formatted unique code (`AQ-NODE-XXXXXX`) derived from the last 8 characters of each node's UUID to guarantee uniqueness. Displayed in the card header and the map preview modal. The search bar matches against both node name and `AQ-NODE-` code.
- **Water Quality Parameter Cards**: Integrated real-time `pH Level`, `Turbidity (NTU)`, `TDS (PPM)`, and `Pressure (PSI)` cards into each node card using a responsive `grid grid-cols-1 md:grid-cols-4` layout with `shadow-inner` metric slots. Status labels (`NORMAL`, `ANOMALY`, `HIGH`, `LOW`) animate with `animate-pulse` on threshold breaches.
- **Font Consistency**: Applied `font-sans` (Plus Jakarta Sans) to the `TelemetrySection` root wrapper to align typography with the rest of AquaTrack.

### IoT Node Registration Guide

Documented the two-phase process for adding physical IoT hardware nodes in the future:
1. **Phase A** — Register the node in the database via Prisma Studio to generate a UUID, then note the `AQ-NODE-` code from the dashboard.
2. **Phase B** — Configure the microcontroller (ESP32 / Arduino / Raspberry Pi) to `POST` JSON payloads (`nodeId`, `ph`, `turbidity`, `tds`, `pressure`) to `/api/admin/telemetry-ingest`.

### Sub-Admin / Technician Complaints Section (`sub-admin-sections/ComplaintsSection.tsx`)
- **Aligned with Admin Layout**: Rewrote the technician complaints table to match the admin's `ReportsSection` design — 5-column grid (`ID`, `Location`, `Description`, `Category & Urgency`, `Ticket Status`) inside a `rounded-[20px]` card wrapper with `bg-[#EEF4FA]/40` header row.
- **Ticket ID Format**: Complaint rows display formatted `AQ-XXXXXXXX` IDs in monospaced bold text, consistent with the admin panel.
- **Clickable Location Badges**: Barangay pills styled with blue background and map pin SVG that fly the map preview on click.
- **Urgency Badges**: Color-coded urgency pills (`CRITICAL` red, `HIGH/URGENT` orange, `MEDIUM` yellow, `LOW` slate) via a shared `getUrgencyBadgeClass` helper.
- **Description Truncation**: Raw complaint text is capped at 80 characters.
- **Resolved Complaints History Section**: Added a second table below active complaints — **Resolved Complaints History**. Resolved rows render with muted text and strikethrough styling, a green `✓ Resolved` badge, and a reopen dropdown letting technicians push tickets back to `IN_PROGRESS`.
- **Active / Resolved Split**: Complaints are split into `activeComplaints` and `resolvedComplaints` arrays, each with their own page state counters.

### Sub-Admin Homepage (`sub-admin-sections/HomeSection.tsx`)

- **Renamed Stat Card**: Changed stat card label from `My Assigned Incidents` to `My Assigned Complaints`.

### Sub-Admin Navigation (`DashboardSubAdmin.tsx`)

- **Renamed Nav Tab**: Updated the sidebar navigation label from `Complaints Triage` to `Complaints and Reports`.

---

## 🗄️ Supabase SQL & Edge Function Reference

All SQL scripts and Edge Functions in the `supabase/` directory must be applied manually to the Supabase project. They are **not** handled by Prisma migrations.

### SQL Scripts (`supabase/*.sql`)

#### `supabase/sync_auth_users.sql`

**Purpose**: Installs a PostgreSQL trigger that automatically syncs every new Supabase Auth sign-up into the `public."User"` table.

**What it does**:
1. Makes the `User.phone` column nullable (self-registered accounts have no phone at sign-up).
2. Creates (or replaces) the function `public.handle_new_auth_user()` — a `SECURITY DEFINER` plpgsql function that `INSERT ... ON CONFLICT DO NOTHING` into `public."User"` using the new auth user's UUID, display name, email, and a default role of `CONSUMER_RESIDENT`.
3. Attaches the function as an `AFTER INSERT` trigger named `on_auth_user_created` on `auth.users`.

**When to run**: Once, in the Supabase SQL Editor, immediately after running `npx prisma migrate deploy`.

**Re-run safe**: Yes — `CREATE OR REPLACE FUNCTION` and `DROP TRIGGER IF EXISTS` make it idempotent.

---

#### `supabase/find_nearby_anomalies.sql`

**Purpose**: Registers a PostGIS RPC function `find_nearby_anomalies(report_lat, report_lng, max_distance_meters)` used by the AI triage engine to spatially correlate incoming citizen complaints with the nearest sensor nodes showing evidence of a water quality issue.

**What it returns** (one row per matched node):

| Column | Type | Description |
|---|---|---|
| `id` | TEXT | TelemetryNode UUID |
| `name` | TEXT | Node display name |
| `status` | TEXT | Node's current status |
| `latitude` | DOUBLE PRECISION | Node latitude |
| `longitude` | DOUBLE PRECISION | Node longitude |
| `distance_meters` | DOUBLE PRECISION | Distance from complaint coordinates |
| `signal` | TEXT | Evidence type — see branches below |

**Evidence branches (UNION query)**:

| Branch | `signal` value | Description |
|---|---|---|
| Branch 1 | `ANOMALOUS_READING` | Nodes that are `ONLINE` and have at least one anomalous `TelemetryReading` within the last hour (`pressure < 30`, `ph < 6.5/> 8.5`, `turbidity > 5`, `tds > 500`) within `max_distance_meters`. Healthy sensors actively detecting a water quality problem. |
| Branch 2 | `NODE_OFFLINE` | Nodes currently `OFFLINE` with **no readings** in the last hour within `max_distance_meters`. Their silence near a reported complaint may indicate the same infrastructure failure the citizen is reporting. |

Results are ordered by `distance_meters ASC`.

**Design note — v2**: The previous version queried `status IN ('MAINTENANCE', 'OFFLINE')`, incorrectly conflating water quality anomalies with device connectivity failures. The new design separates these concerns: Branch 1 detects *bad water*, Branch 2 detects *dead hardware*.

**When to run**: In the Supabase SQL Editor. The `DROP FUNCTION IF EXISTS` guard at the top makes it safe to re-apply whenever thresholds are adjusted.

> **⚠️ Important**: This function only **queries** node status — it never updates it. There is currently **no automated cron job** that sets nodes to `OFFLINE` based on inactivity. `OFFLINE` and `MAINTENANCE` are manual-only states set through the admin dashboard. `ONLINE` is restored automatically by the `telemetry-ingest` Edge Function when a normal reading arrives.

---

### Edge Functions (`supabase/functions/`)

#### `supabase/functions/telemetry-ingest/index.ts`

**Deployed as**: `telemetry-ingest`
**Runtime**: Deno (Supabase Edge Functions)
**Trigger**: Called by `POST /api/admin/telemetry-ingest` (Next.js server-side proxy). 

1. **Redis hot-cache write** — Stores the latest reading in Upstash Redis at key `node:latest:{nodeId}`.
2. **Anomaly threshold check**:
   - `pressure < 30 PSI` → anomaly
   - `ph < 6.5` or `ph > 8.5` → anomaly
   - `turbidity > 5 NTU` → anomaly
   - `tds > 500 PPM` → anomaly
3. **If anomalous**: Inserts a `TelemetryReading` row and runs the **cross-differential diagnostics engine** (`runCorrelationForNode` + `findNearestPump`), matching all unresolved complaints within 500m using an inline Haversine function.
   - **Three-way source status correlation**: If the node is a `HOUSEHOLD_EDGE`, it queries the nearest `PUMP_STATION`'s latest telemetry from the past 1 hour (`PUMP_READING_WINDOW_MS`) and classifies the source as `NORMAL` (isolated downstream fault), `FAILING` (systemic cascading source failure), or `UNCLEAR` (no recent pump telemetry). A `PUMP_STATION` anomaly is always treated as the source itself failing.
   - **Parameter-specific root causes**: Every matching complaint category is scored independently with its own source-aware anomaly prefix — `Intermediary Pipeline Breach` / `Systemic Source Pressure Drop` (pressure < 30 PSI), `Localized Pipeline Sedimentation / Infiltration` / `Systemic Source Sedimentation Failure` (turbidity > 5 NTU), `Localized Pipe Contamination` / `Systemic Chemical Contamination` (pH < 6.5 or > 8.5), and `Localized Pipe Mineral Leaching` / `Systemic Source Mineral Intrusion` (TDS > 500 PPM), plus `Source Status Unclear` when pump telemetry is missing.
   - **Priority-weighted matching**: All matches are ranked by parameter-specific `priorityWeight` and Haversine distance; the top match becomes the primary root cause and any remaining concurrent anomalies are appended to `rootCauseAnalysis` as secondary-anomaly notes.
   - **Dynamic Confidence Score**: Computed from the source-status base (98 isolated / 90 systemic), Haversine distance penalty, temporal decay, and a multi-complaint corroboration bonus. Clamped between a safe **80% minimum floor** and a **99% maximum ceiling**.
   - Creates or updates a `DiagnosticAlert` with a `geminiAnalysis` JSON object containing these metrics. **Node `status` is NOT changed.**
4. **If normal**: Sets node `status → ONLINE`. Inserts a `TelemetryReading` row.

**Node status behavior**:

| Event | Status Effect |
|---|---|
| Normal reading received | → **`ONLINE`** (automatic) |
| Anomalous reading received | **No change** |
| Admin sets status manually | → `ONLINE` / `OFFLINE` / `MAINTENANCE` |

> **⚠️ Redeploy required after local edits**: `npx supabase functions deploy telemetry-ingest --project-ref <ref>`

---

#### `supabase/functions/triage-complaint/index.ts`

**Deployed as**: `triage-complaint`
**Runtime**: Deno (Supabase Edge Functions)
**Trigger**: Called asynchronously from `/api/complaints` after `202 Accepted` is returned to the citizen.

**Payload**: `{ complaintId, rawText, latitude, longitude }`

**Processing flow**:

1. **Parallel fetch**: Simultaneously fetches the complaint from `Complaint` and calls `find_nearby_anomalies()` RPC to get the closest sensor evidence node.
2. **Gemini AI triage** (`gemini-3.5-flash-lite` with context caching, structured JSON schema):
   - Translates the report from English / Tagalog / Taglish / **Kapampangan** to English
   - Classifies `category` (5 `IssueCategory` enums) and `urgency` (LOW / MEDIUM / HIGH / CRITICAL)
   - Generates a one-sentence `summary`, `probableRootCause`, `confidenceScore`, and `recommendedAction`

   Kapampangan translation guide embedded in system prompt:

   | Kapampangan | Meaning | Likely Category |
   |---|---|---|
   | `matuling` / `kule matuling` | Black / dark water | `CHEMICAL_DISCOLORATION_CONTAMINATION` |
   | `dilo` / `kule dilo` / `kulasisi` | Yellow water | `HIGH_MINERAL_CONTENT_TDS` |
   | `malutu` | Red / rusty water | — |
   | `taya` / `kule taya` | Brown / muddy water | `HIGH_TURBIDITY` |
   | `malino` | Clear water | — |
   | `danum` | Water | — |
   | `kayna` / `mayna` / `kumayna` | Weak water flow / low pressure | `PIPELINE_BREACH_PRESSURE_DROP` |
   | `ala danum` / `alang danum` | No water / dry faucet | `PIPELINE_BREACH_PRESSURE_DROP` |
   | `malati agus` / `mababa agus` | Low pressure / weak flow | `PIPELINE_BREACH_PRESSURE_DROP` |
   | `mabau` | Smelly / bad odor | — |
   | `keni` / `keti` | Here | — |
   | `agus` | Flow / stream | — |
   | `gripo` | Faucet / tap | — |

3. **DB update** — Writes `translatedText`, `summary`, `category`, `urgency`, `aiStatus = "SUCCESS"` back to the `Complaint` row.
4. **DiagnosticAlert creation** — If a nearby anomalous node was found, inserts a `DiagnosticAlert` linking the node to the complaint with the Gemini analysis.

**Returns**: `{ success: true }` or HTTP 500.

> **⚠️ Redeploy required after local edits**: `npx supabase functions deploy triage-complaint --project-ref <ref>`

---

### Node Status Rules Summary

| Status | How it gets set | How it gets cleared |
|---|---|---|
| `ONLINE` | `telemetry-ingest` on normal reading | Admin sets OFFLINE or MAINTENANCE |
| `OFFLINE` | Admin via dashboard status dropdown | Admin sets ONLINE, or new normal reading arrives |
| `MAINTENANCE` | Admin via dashboard status dropdown **only** | Admin sets ONLINE or OFFLINE |

> **No cron job currently exists** to automatically set nodes to `OFFLINE` after inactivity. This can be added in the future via a Supabase `pg_cron` scheduled job or a scheduled Edge Function. The `find_nearby_anomalies.sql` Branch 2 is already designed to consume `OFFLINE` nodes when they exist — it just doesn't create them automatically.


### Supabase — Telemetry Pipeline

#### `find_nearby_anomalies.sql` (v2)

- Rewrote the function from a simple `status IN ('MAINTENANCE', 'OFFLINE')` filter to a two-branch `UNION` query:
  - **Branch 1 (`ANOMALOUS_READING`)**: Queries `ONLINE` nodes with recent out-of-threshold readings.
  - **Branch 2 (`NODE_OFFLINE`)**: Queries `OFFLINE` nodes with no recent readings (silent/dead hardware).
- Added a `signal TEXT` column to the return type to identify which evidence branch matched.
- The function **never writes to any table** — read-only.

#### Telemetry Ingest Behavior Confirmed

- Confirmed that `telemetry-ingest` does **not** set nodes to `MAINTENANCE` on anomalous readings. Node status is only updated to `ONLINE` on normal readings.
- Unexpected `MAINTENANCE` state on IoT nodes after a leak preset ingest was traced to an **older deployed version** of the edge function. Fix: redeploy with `npx supabase functions deploy telemetry-ingest`.

---

## 🗃️ Database Schema (Prisma Models)

The full schema is defined in [`prisma/schema.prisma`](./prisma/schema.prisma). Below is a high-level summary of each model:

| Model | Description |
|---|---|
| `User` | Platform accounts. Roles: `ADMIN`, `FIELD_TECHNICIAN`, `CONSUMER_RESIDENT`. Linked 1:1 with Supabase Auth via UUID. |
| `TelemetryNode` | Physical IoT sensor nodes. Stores GPS coordinates as PostGIS `geom` point, `nodeType` (`PUMP_STATION` / `HOUSEHOLD_EDGE`), and current `status`. |
| `TelemetryReading` | Time-series sensor snapshots (`ph`, `turbidity`, `tds`, `pressure`) produced by each node. |
| `Complaint` | Citizen-submitted issue reports. Stores `rawText`, AI-translated `translatedText`, resolved `barangay`, PostGIS `geom`, `category`, `urgency`, `status`, and assigned `engineerId`. |
| `DiagnosticAlert` | AI-generated cross-reference linking a `Complaint` to a nearby anomalous `TelemetryNode`, with a `geminiAnalysis` JSON payload. |
| `Advisory` | Community bulletins published by admins. Types: `ADVISORY`, `WARNING`, `NEWS`, `EVENT`. Pushed to FCM on creation. |

---

## 🚀 Recent Platform Updates (August 8, 2026)

### Administrative Dashboard & Collapsible Sidebar
- **Collapsible Sidebar Layout:** Implemented collapsible sidebars in both Admin and Sub-Admin portals with transitions, caching choice in `localStorage`.
- **Hover Page-Name Tooltips:** Integrated pure CSS absolute-positioned tooltip indicators showing page labels on hover in both expanded and collapsed states, with `overflow-visible` to prevent clipping.
- **Improved Collapse Icons:** Swapped static indicators for rotatable `Menu` hamburger icons from Lucide React.
- **Greeting Banner Enhancements:** Applied the water-themed `/headerpic.png` background graphic to the greeting banners, increased sizing of title text, and streamlined descriptive subtexts.
- **High-Fidelity Live Activity Feed:** Redesigned the Admin homepage timeline into dynamic grid cards with hover translation animations, clocks, and Lucide React indicator icons.

### Notification System Redesign & Branding Accents
- **Styled HTML Email Template:** Redesigned the Resend crew dispatch email template (`CrewNotificationEmail.tsx`) to use the official dark AquaTrack logo (`LOGO3.png`) hosted on Supabase storage CDN, brand-specific styling colors, dynamic colored badges for urgency, and call-to-action console link buttons.
- **Push Notification Copy Refinement:** Improved backend dispatches to use structured titles and emojis (`RESOLVED ✅`, `IN PROGRESS 🛠️`, `UNDER REVIEW 📋`) for consumer updates, and `"🚨 CSFWD Operation Dispatch"` for crew dispatches.
- **In-App Notification Dropdowns:** Redesigned the Admin, Sub-Admin, and Client portals' notification popover lists using custom border cards, Lucide React icons, read status indicators, and hover transition scales.

### Recent Platform Updates (August 11, 2026)

### Interactive Drag-to-Select Calendar & Filter Modal
- **Unified Range Selection:** Replaced the old two-step indicator process with a simplified single RangeCalendar modal, supporting drag-to-select ranges, visual cap-rounded selections, and single-day filtering.
- **React Portal Mounting:** Rendered all filter and completion modals via React Portal directly in the document body. This solves deep layout stacking context z-index issues and applies backdrop blurs cleanly over the sidebar and navbar.

### Precision Timezone Calibration
- **GMT+8 Local Time Alignment:** Adjusted server-side queries to apply custom Philippine Time (UTC+8) offsets before normalizing to midnight, correcting rolling chart dates and resolving date-skipping bugs.
- **Full-Day Telemetry Querying:** Configured endDate queries to close at `23:59:59.999 UTC` rather than `00:00:00.000 UTC` to include all records logged throughout the final day.

### Synchronized Compliance Reporting Engine
- **Filtered PDF Datasets:** Refactored the PDF compliance compiler to dynamically filter citizen complaints per barangay, identify regional hotspots, and map node averages strictly within the active date range.
- **Dynamic AI Operational Summaries:** Updated the system-summary API endpoint to support date queries, prompting Google Gemini to dynamically compile custom summaries and recommended action items matching the filtered timeframe.

### High-Concurrency Speed Optimizations & Search Enhancements
- **Raised Pool Limits:** Upgraded connection limits from `1` to `4` in `prisma.ts`, eliminating timeout crashes caused by query starvation in concurrent `Promise.all` queries.
- **Abort Controllers & Cache Headers:** Integrated React `useRef` AbortControllers to cancel obsolete requests during rapid calendar changes, and attached short-lived Cache-Control headers on telemetry data endpoints for instant dashboard tab switching.
- **Hybrid Geocoding Pipeline:** Implemented an OSM Nominatim geocoding fallback for Mapbox searches in `DashboardClient.tsx`, successfully resolving local provincial landmarks (like "University of the Assumption") while filtering out invalid garbage searches.
- **Systemic Root Cause Classification:** Configured the telemetry ingestion routes to prepend `"Systemic Source Anomaly"` to the probable root cause of pumping station failures, aligning with the `"Intermediary Pipeline Breach"` prefix used for local pipeline breaches.

### Production Build & Triage Enhancements
- **Verified Production Build:** Successfully compiled and validated the entire application using Next.js 16 (Turbopack) and React 19. All 25 system routes (static landing screens, dynamic administrative dashboards, and microservice APIs) resolved correctly without TypeScript or dependency warnings.
- **Refined Kapampangan Dialect AI Triage:** Expanded the dialect translation mapping in the `triage-complaint` Edge Function prompt (`danum`, `kayna`, `ala danum`, `keni`, `karin`, `agus`, `gripo`, `mabau`) and added targeted test strings (e.g. *"Sobrang kayna ing danum keni"*) to resolve minor triage inaccuracy edge cases.
- **Improved Spatial Diagnostics:** Fine-tuned the telemetry-ingest differential diagnostic output to format systemic pump failures clearly under `"Systemic Source Anomaly"` classifications.

### Recent Platform Updates (August 12, 2026)

### Cross-Differential Diagnostics Engine (telemetry-ingest)
- **Multi-Parameter Correlation Rewrite:** Rewrote the diagnostic correlation engine in `supabase/functions/telemetry-ingest/index.ts` from a single-match loop into a full cross-differential engine (`runCorrelationForNode` + `findNearestPump`). All four water quality parameters (pressure, turbidity, pH, TDS) now generate independent root-cause candidates against all unresolved complaints within the 500m geofence, scored and sorted by parameter-specific priority weights.
- **Three-Way Source Status Classification:** The nearest `PUMP_STATION` correlate (queried via `findNearestPump` against the last 1 hour of telemetry) is now classified as `NORMAL` (downstream fault isolated), `FAILING` (systemic cascading source failure), or `UNCLEAR` (no recent pump telemetry) — replacing the previous binary local/systemic decision.
- **Source-Aware Diagnostic Prefixes:** Each parameter resolves to a distinct classification string — `Intermediary Pipeline Breach` vs `Systemic Source Pressure Drop` (pressure), `Localized Pipeline Sedimentation / Infiltration` vs `Systemic Source Sedimentation Failure` (turbidity), `Localized Pipe Contamination` vs `Systemic Chemical Contamination` (pH), and `Localized Pipe Mineral Leaching` vs `Systemic Source Mineral Intrusion` (TDS) — with fallback `Source Status Unclear` prefixes when pump telemetry is absent.
- **Secondary Anomaly Detection & Multi-Complaint Confidence Bonus:** Concurrent anomalies on the same node are appended to `rootCauseAnalysis` as secondary-anomaly notes, and the dynamic confidence score rewards corroborating nearby complaints with a multi-complaint bonus before clamping to the 80–99% range.
- **Server-Side Correlation Removed:** Deleted the redundant correlation block from `src/app/api/admin/telemetry-ingest/route.ts` — the Next.js route is now a thin proxy to the Edge Function, which owns all complaint/node correlation.

### Hardened AI Triage Enum Normalization
- **Valid Enum Enforcement:** Both the Next.js `/api/triage` route and the `triage-complaint` Edge Function now constrain Gemini output to the 5 canonical `IssueCategory` enums and 4 urgency levels. Both paths apply fuzzy `normalizeCategory` / `normalizeUrgency` fallbacks that map near-miss strings (e.g. `EMERGENCY` → `CRITICAL`, `MUDDY` → `HIGH_TURBIDITY`) and then validate the normalized result with the shared Zod schema (`complaintTriageSchema` in `src/lib/triage-schema.ts`; inlined as `triageResultSchema` in the Deno edge function). Validation runs inside the model loop, so a schema failure falls back to the next model instead of returning a malformed classification or a 500.

### Extended Dark Mode Styling
- **Dashboard-Wide Dark Coverage:** Refactored the Admin, Sub-Admin, and Consumer dashboards with comprehensive `dark:` variants — near-black `#090d16` page backgrounds, dark card/border palettes, tinted status badge surfaces, and dynamic logo swapping (`LOGO3.png` dark / `LOGO2.png` light).
- **Dark-Theme CSS Overrides:** Expanded `globals.css` with opacity-suffixed surface overrides (`bg-slate-50/x`, `bg-sky-50/x`, `bg-emerald-50/x`, etc.), tinted badge text colors, dark border variants, and CSS-variable-driven chart tooltips that adapt to dark mode.
- **Dark-Theme Mapbox Sync:** The File a Complaint map now switches to `mapbox://styles/mapbox/dark-v11` when dark mode is active, and complaint pin pulse cores are pinned to white for visibility.
- **Logout Confirmation Modal:** Introduced a shared framer-motion `LogoutConfirmModal` (confirm/cancel sign-out) integrated across all dashboard portals.

### AI Diagnostic Disambiguation & Classification Rules
- **Strict TDS vs. pH Category Disambiguation:** Updated prompt rules across both the Next.js `/api/triage` route and the Supabase `triage-complaint` Deno Edge Function to explicitly separate `HIGH_MINERAL_CONTENT_TDS` from `CHEMICAL_DISCOLORATION_CONTAMINATION`. High TDS readings ($>500\text{ ppm}$) and mineralized/yellowish water are now strictly classified as `"Localized Pipe Mineral Leaching (High Mineral Content (TDS Exceeded))"` and will no longer default to pH level deviations.
- **Unified Diagnostic Naming Standards:** Aligned root cause classification strings across the entire platform:
  - **Localized Downstream Faults:** `"Intermediary Pipeline Breach (<Parameter Classification>)"`
  - **Upstream Pump Station Faults:** `"Systemic Source Anomaly (<Parameter Classification>)"`
- **Cleaned Diagnostic Analysis Text:** Updated the `geminiAnalysis` object construction in the `triage-complaint` Edge Function to output clean, concise `rootCauseAnalysis` strings without redundant `"Citizen reported:"` summary prefixes.

### Feature 7 Differential Diagnostics Verification
- **Full Parameter Suite Testing:** Verified end-to-end differential diagnostic classification across all four core water quality parameters:
  - **Low Pressure:** `pressure < 30 PSI`
  - **Elevated Turbidity:** `turbidity > 5.0 NTU`
  - **High Mineral / TDS:** `tds > 500 ppm`
  - **Chemical / pH Anomaly:** `ph < 6.5` or `ph > 8.5`
- **Dynamic Spatial & Temporal Confidence Calibration:** Verified that confidence scores ($80\%\text{--}97\%$) adjust dynamically based on Haversine geofence distance ($\le 500\text{m}$) and telemetry freshness ($\le 15\text{-min}$ lookback), while priority levels (`HIGH` vs. `MEDIUM`) independently evaluate citizen report urgency keywords.

### Interactive Drag-to-Select Calendar & Filter Modal
- **Unified Range Selection:** Replaced the old two-step indicator process with a simplified single `RangeCalendar` modal, supporting drag-to-select ranges, visual cap-rounded selections, and single-day filtering.
- **React Portal Mounting:** Rendered all filter and completion modals via React Portal directly in the document body. This solves deep layout stacking context z-index issues and applies backdrop blurs cleanly over the sidebar and navbar.

### Precision Timezone Calibration
- **GMT+8 Local Time Alignment:** Adjusted server-side queries to apply custom Philippine Time (UTC+8) offsets before normalizing to midnight, correcting rolling chart dates and resolving date-skipping bugs.
- **Full-Day Telemetry Querying:** Configured `endDate` queries to close at `23:59:59.999 UTC` rather than `00:00:00.000 UTC` to include all records logged throughout the final day.

### Synchronized Compliance Reporting Engine
- **Filtered PDF Datasets:** Refactored the PDF compliance compiler to dynamically filter citizen complaints per barangay, identify regional hotspots, and map node averages strictly within the active date range.
- **Dynamic AI Operational Summaries:** Updated the system-summary API endpoint to support date queries, prompting Google Gemini to dynamically compile custom summaries and recommended action items matching the filtered timeframe.

### High-Concurrency Speed Optimizations & Search Enhancements
- **Raised Pool Limits:** Upgraded connection limits from `1` to `4` in `prisma.ts`, eliminating timeout crashes caused by query starvation in concurrent `Promise.all` queries.
- **Abort Controllers & Cache Headers:** Integrated React `useRef` AbortControllers to cancel obsolete requests during rapid calendar changes, and attached short-lived Cache-Control headers on telemetry data endpoints for instant dashboard tab switching.
- **Hybrid Geocoding Pipeline:** Implemented an OSM Nominatim geocoding fallback for Mapbox searches in `DashboardClient.tsx`, successfully resolving local provincial landmarks (like "University of the Assumption") while filtering out invalid garbage searches.

### Production Build & Triage Enhancements
- **Verified Production Build:** Successfully compiled and validated the entire application using Next.js 16 (Turbopack) and React 19. All 25 system routes resolved correctly without TypeScript or dependency warnings.
- **Refined Kapampangan Dialect AI Triage:** Expanded the dialect translation mapping in the `triage-complaint` Edge Function prompt (`danum`, `kayna`, `ala danum`, `keni`, `karin`, `agus`, `gripo`, `mabau`, `dilo`, `taya`) to ensure accurate translation of regional dialect complaints.

### Recent Platform Updates (August 16, 2026)

### AI Triage Performance & Latency Tuning
- **Primary Classification Model**: Settled on `gemini-3.5-flash-lite` for the entire triage pipeline (both Next.js `/api/triage` route and Deno `triage-complaint` Edge Function) for its superior speed, high free-tier rate limits, and accurate dialect classification. Summary generation also remains on `gemini-3.5-flash-lite`.
- **System Instruction & Context Caching**: Relocated the large prompt instructions (translation guides, rules, and few-shot JSON examples) to the `system` parameter in Next.js and the `systemInstruction` body parameter in the Deno fetch payloads. This allows Gemini to leverage context caching, greatly reducing request processing times.
- **Fail-Fast Request Timeout**: Bounded all triage API calls by a strict **6-second timeout** via `AbortController` to prevent requests from hanging, ensuring responsiveness during API network spikes.
- **Normalize + Zod Validation Pipeline (both paths)**: Gemini output is JSON-parsed, run through fuzzy enum normalizers (`normalizeCategory` / `normalizeUrgency`), then validated against `complaintTriageSchema` (`src/lib/triage-schema.ts`) / `triageResultSchema` (inlined in the Edge Function). Validation failures are caught safely without 500 errors.
- **Prisma Connection Resilience**: Increased `connectionTimeoutMillis` in `src/lib/prisma.ts` from 5 seconds to **15 seconds** to prevent cold database connection pool timeouts on local-to-remote environments.
- **Verified**: All 33 Vitest tests passing, TypeScript compiles cleanly (`tsc --noEmit`), and production build succeeded.

---

## 📁 Related Repositories

| Repository | Description |
|---|---|
| [`aquatrack-web`](https://github.com/aiandgreat/aquatrack-web) | This repository — Next.js web platform (Admin + Resident portals). |
| [`aquatrack-mob`](https://github.com/AaronPublic/aquatrack-mob) | React Native / Expo mobile app — Field Technician sub-admin portal. |

taskkill /F /IM node.exe