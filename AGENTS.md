# AGENTS.md

AquaTrack Web — municipal water district command center. Next.js 16 (App Router, canary) + React 19 + Tailwind v4 + Prisma 7 + Supabase (Postgres/PostGIS, Auth, Edge Functions) + Upstash Redis.

## Commands

- Install: `npm install --legacy-peer-deps` (required; `@tremor/react` pins React 18 while the app runs React 19).
- Dev: `npm run dev` — port 3000, or 3001 if occupied.
- Test: `npm test` (= `vitest run`; no vitest config, node env, 33 tests / 11 suites). Focused: `npx vitest run tests/ai-triage.test.ts`. One test is intentionally skipped (rate-limit 429) — do not "fix" it.
- Typecheck: `npx tsc --noEmit` (verified passing).
- `npm run lint` is BROKEN: `next lint` was removed in Next.js 16 and there is no ESLint config. Don't use it; use tsc.
- Build: `npm run build`. Verify with typecheck + tests before building.

## Database (Prisma + PostGIS)

- `prisma/schema.prisma` requires the `postgis` extension (`extensions = [postgis]`, `previewFeatures = ["postgresqlExtensions"]`). Enable PostGIS in Supabase before migrating or `prisma db push` fails.
- `geom` columns are `Unsupported("geometry(Point, 4326)")` — Prisma cannot read/write them normally. Complaint/node inserts and spatial queries use raw SQL (`prisma.$queryRaw`, `pool.query`) with `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`. See `src/app/api/complaints/route.ts`.
- Prisma client uses `@prisma/adapter-pg` with a manual `pg.Pool` (`max: 4`) in `src/lib/prisma.ts`; `prisma.config.ts` points migrations at `DIRECT_URL`.

## Supabase (manual, not covered by Prisma)

- Everything in `supabase/` is applied manually — Prisma migrations do NOT cover it.
- SQL scripts: run `supabase/sync_auth_users.sql` and `supabase/find_nearby_anomalies.sql` in the Supabase SQL Editor (idempotent, re-run safe).
- Edge Functions (`supabase/functions/telemetry-ingest/`, `supabase/functions/triage-complaint/`) run on Deno, NOT Node — no node_modules/TS config applies inside them. After editing, redeploy manually: `npx supabase functions deploy telemetry-ingest --project-ref <ref>`. Behavior differences between local and deployed versions have caused real bugs.
- Node status rules: `ONLINE` is auto-restored by `telemetry-ingest` on ANY reading (normal or anomalous); `MAINTENANCE` is manual-only and never overridden by telemetry (`.neq("status", "MAINTENANCE")`); `OFFLINE` is auto-set by the `check_node_liveness` database function after 15 minutes without telemetry and auto-cleared by the next reading.

## Env

- Copy `.env.example` → `.env` (gitignored; README's `.env.local` wording is stale). Both `DATABASE_URL` and `DIRECT_URL` are used.
- `.env.example` lists `RESEND_API_KEY` but code reads `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` (see `src/lib/resend.ts` — RESEND_API_KEY is only a fallback).
- Tests mock Redis, Prisma, and fetch — they need no real env vars.

## Architecture

- `src/app/` — routes: `/`, `/login`, `/register`, `/dashboard`, `/crew`, `/admin`, plus `api/*` route handlers. App Router + RSC; Mapbox/Recharts components are client-only.
- `src/components/` — dashboards (`DashboardClient.tsx`, admin/sub-admin sections), map components.
- `src/lib/` — shared services: `prisma.ts`, `redis.ts`, `ratelimit.ts`, `supabase.ts`, `geo-utils.ts`, `spatial-sorting.ts`, `pdf-generator.ts`, `fcm-sender.ts`, `resend.ts`, `triage-schema.ts`, `san-fernando-boundary.ts`.
- `supabase/` is excluded from tsconfig; `scratch/` and `docs/` are gitignored scratch space — don't put real code there.
- Path alias `@/*` → `src/*`. tsconfig has `strict: false`.

## Conventions / gotchas

- Geo domain is San Fernando, Pampanga (barangay list, 788-vertex geofence boundary, UTC+8). Server-side date queries apply Philippines time offsets and close ranges at `23:59:59.999` so the final day isn't dropped.
- Mapbox instances: use callback refs and `mapStyleRef`/`useCallback` patterns, never `setTimeout` for mount/ready handling — the project has fixed multiple flicker/crash bugs caused by that.
- Triage/classification strings are standardized: downstream = `Intermediary Pipeline Breach (...)`, upstream pump = `Systemic Source Anomaly (...)`; TDS is strictly separate from pH/discoloration. Keep new prompts aligned with these rules.
- Diagnosis thresholds: pressure < 30 PSI, ph < 6.5 or > 8.5, turbidity > 5 NTU, tds > 500 PPM.
- The Zod triage schema (`complaintTriageSchema` in `src/lib/triage-schema.ts`) is **duplicated/inlined** inside `supabase/functions/triage-complaint/index.ts` (`triageResultSchema`) because Deno can't import from `src/lib`. Keep both copies in sync — both files carry mirror comments pointing at each other.
- The entire Gemini AI pipeline (the Next.js `/api/triage` route, the Deno `triage-complaint` Edge Function, `/api/admin/system-summary`, and `/api/admin/barangay-summary`) natively supports Vertex AI calling (via Base64-encoded Service Account JSON in `GOOGLE_VERTEX_CREDENTIALS` using the `global` location to draw from the $300 GCP credit) with an automatic fail-safe fallback to Google AI Studio if credentials are not configured. Triage uses `gemini-3.7-flash` (with `gemini-3.5-flash-lite` fallback) while dashboard and barangay summaries use `gemini-3.5-flash-lite`. Enums are normalized and validated with Zod in the request loop so schema failures are caught gracefully.
- The `pg.Pool` connection pool in `src/lib/prisma.ts` uses `connectionTimeoutMillis: 15000` (15 seconds) to prevent cold-start connection timeouts when connecting to the remote database from a local development environment.
- README.md is authoritative for the domain/AI/SQL details but its changelog is historical — verify current behavior in code.

## Realtime Architecture

- **Admin Dashboard** (`DashboardAdmin.tsx`): Three Supabase Realtime channels — `admin-complaints-realtime` (all `Complaint` events → calls `fetchComplaints()` + `fetchStats()` + `fetchDiagnosticAlerts()`), `admin-readings-realtime` (`TelemetryReading` INSERTs → optimistic node state patch + `fetchStats()`), `admin-users-realtime` (`User` UPDATEs → `fetchUsers()`). All set up in a single `useEffect([currentUserRole])`.
- **Sub-Admin Dashboard** (`DashboardSubAdmin.tsx`): One channel — `subadmin-complaints-realtime` (all `Complaint` events → `fetchComplaints()` + `fetchStats()`). UPDATE events additionally check if `payload.new.assignedToId` matches the logged-in user's ID (tracked via `userProfileIdRef`) to trigger assignment notifications.
- **Cache-busting**: All `fetch()` calls in both Admin and Sub-Admin dashboards use `?t=${Date.now()}` query parameters and `{ cache: "no-store" }` to prevent Next.js from serving stale cached responses when realtime events trigger re-fetches.
- **Raw payload limitation**: Supabase Realtime CDC payloads for the `Complaint` table do NOT include PostGIS-computed coordinates (`latitude`/`longitude`) or SQL JOIN fields (user names, technician names). Never patch state directly from `payload.new` for complaints — always call `fetchComplaints()` to get the fully-resolved API response.
- **REPLICA IDENTITY**: `payload.old` is only populated for UPDATE events when `ALTER TABLE "Complaint" REPLICA IDENTITY FULL` has been run. The code defensively uses `payload.old?.assignedToId ?? null` so assignment detection works regardless.

## Notification System (Sub-Admin)

- `assignmentNotifications` state: an in-memory array of `{ id, text, timestamp, read }` objects. Populated when a realtime UPDATE fires with `assignedToId === userProfileIdRef.current`. Persists for the session lifetime only — clears on page reload.
- `readAdvisoryIds` state: a `Set<string>` tracking which advisory IDs have been clicked/viewed in the bell dropdown. Used to compute the unread badge count independently from `assignmentNotifications`.
- Badge count = `unread assignmentNotifications` + `unread advisories` (those not in `readAdvisoryIds`).
- Clicking a **Task Assignment** notification → marks it read + navigates to `complaints` tab + closes dropdown.
- Clicking an **Advisory** notification → adds its ID to `readAdvisoryIds` + navigates to `advisories` tab + closes dropdown.
- `playNotificationSound()`: a module-level helper using the Web Audio API (`AudioContext`) to synthesize a soft two-tone chime (D5 + A5) without any static audio file dependency.
- `userProfileIdRef`: a `useRef` kept in sync with `userProfile?.id` via a `useEffect([userProfile])`. Used inside realtime callbacks to safely access the current user's ID without stale closure issues.

## Logout Loading Screen

- `LogoutConfirmModal` (`src/components/LogoutConfirmModal.tsx`) accepts an optional `isLoading?: boolean` prop. When `true`, it renders a full-screen branded loader (matching the dashboard loader: AquaTrack logo at 120px, `#00aeef` spinning ring, "Signing Out…" label) instead of the confirm/cancel modal. z-index is `z-[200]` — above all other overlays.
- Each dashboard (`DashboardAdmin`, `DashboardSubAdmin`, `DashboardClient`) declares a `signingOut` state, sets it to `true` at the start of `handleLogout`, and passes it as `isLoading={signingOut}` to the modal.

## Dynamic Maps & Dynamic Zoom Stacking

- In `MapboxMap.tsx`, individual complaint markers are dynamically hidden when the map zoom is $\le 14$ to prevent markers from stacking and occluding WebGL-rendered cluster circles. When the map is zoomed out, the active selection marker remains visible, and clicking a cluster zooms the map in.

## Live GPS Directions & Routing (Sub-Admin)

- In the sub-admin's `MapPreviewModal.tsx`, a **"Track Route"** engine is implemented using:
  - **Browser Geolocation API**: Initiated by `navigator.geolocation.watchPosition` to trace technician coordinate changes. Renders a pulsing blue GPS indicator.
  - **Mapbox Directions API**: Requests route lines (`LineString`) dynamically. Highlights navigation paths with a custom cyan (`#00aeef`) SVG layer.
  - **Auto Bounds Zoom**: Maps automatically reposition to frame both the sub-admin and the complaint.
  - **Lifecycle Cleanup**: Teardown checks are in place to clear watches and markers on modal close or unmount to save battery life.

## Dynamic Compliance Index & Live Charts

- **Dynamic Statistics Backend**: Calculated inside `/api/admin/dashboard` and `/api/admin/stats` by counting total sensor readings in the past 24 hours vs stable readings satisfying PNSDW thresholds (pH $6.5\text{--}8.5$, Turbidity $\le 5\text{ NTU}$, TDS $\le 500\text{ ppm}$).
- **Dark Mode Aware Recharts**:
  - Implements a theme-aware state `isDark` driven by a `MutationObserver` watching `document.documentElement` class shifts.
  - Dynamically updates radial donut (PieChart) backgrounds (`#1e293b` vs `#e2e8f0`), grouped column grids (`#1e293b` vs `#e2e8f0`), chart text/axes labels, and tooltip wrappers to match the theme.
  - Configures hover state translucent overlays (cursors) to look high-contrast and soft in both themes.

