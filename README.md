# AquaTrack Web Platform

A production-ready municipal water district command center for real-time IoT telemetry monitoring, AI-powered citizen complaint triage, and field crew dispatch.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + PostGIS SRID 4326) + Prisma ORM
- **Spatial Queries**: PostGIS `ST_DWithin` 500m buffer scans via custom RPC function
- **Caching & Rate Limiting**: Upstash Redis (sliding-window, 5 req/hr per citizen)
- **Serverless Workers**: Supabase Edge Functions (Deno runtime) — `telemetry-ingest`, `triage-complaint`
- **AI Integration**: Google Gemini API — dialect translation (Tagalog/Taglish/Kapampangan), complaint classification & root-cause analysis
- **Email Alerts**: Resend API — transactional notifications to field crew and operators
- **Data Visualization**: Tremor + Recharts — AreaChart sparklines for pressure, pH, turbidity, TDS
- **Map**: Mapbox GL JS — interactive node pins and 500m radius overlays
- **Styling**: Tailwind CSS
- **Testing**: Vitest (31 tests, 11 suites)

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
# Supabase (PostgreSQL + Edge Functions)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://[instance].upstash.io"
UPSTASH_REDIS_REST_TOKEN="AX..."

# Google Gemini AI
GEMINI_API_KEY="AIza..."

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

### 6. Run the development server
```bash
npm run dev
```

| Route | Description |
|-------|-------------|
| `/dashboard` | Command Center — map, telemetry sparklines, alert sidebar |
| `/crew` | Field Crew Mobile Portal — active work orders + status transitions |
| `/admin` | Admin Panel — threshold configuration & simulation controls |
| `/api/complaints` | POST endpoint — citizen complaint ingestion |

## Useful Operations

### Run Tests
```bash
npm test                                          # Full suite (31 tests)
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
