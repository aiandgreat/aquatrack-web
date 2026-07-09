# AquaTrack Web Platform

> **Municipal Water District Command Center** — Real-time IoT telemetry monitoring, AI-powered complaint triage, and field crew dispatch for water infrastructure management.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 16.x (canary) | React framework with App Router, SSR, API Routes |
| [React](https://react.dev/) | 19.x | UI component library |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Static typing across the codebase |
| [Tremor](https://www.tremor.so/) | 3.x | Data visualization — AreaChart sparklines for telemetry metrics |
| [Recharts](https://recharts.org/) | 3.x | Charting engine underpinning Tremor |
| [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) | — | Interactive map backdrop with 500m PostGIS overlay rings |
| Vanilla CSS / Tailwind | — | Utility-first styling (dark slate theme) |

### Backend & Database
| Technology | Version | Purpose |
|------------|---------|---------|
| [Supabase](https://supabase.com/) | — | PostgreSQL host + Edge Function runtime + Auth |
| [PostgreSQL + PostGIS](https://postgis.net/) | SRID 4326 | Spatial database — `ST_DWithin` 500m buffer queries |
| [Prisma ORM](https://www.prisma.io/) | 5.x | Schema management, migrations, type-safe client |
| [Supabase Edge Functions](https://supabase.com/docs/guides/functions) | Deno | Serverless workers: `telemetry-ingest`, `triage-complaint` |
| [Upstash Redis](https://upstash.com/) | — | Hot cache for latest sensor readings + sliding-window rate limiting |

### AI & Integrations
| Technology | Purpose |
|------------|---------|
| [Google Gemini API](https://ai.google.dev/) | AI triage — translate dialects (Tagalog/Taglish/Kapampangan), classify complaint category, suggest root causes |
| [Resend API](https://resend.com/) | Transactional email alerts to field crew and operators |

### Testing & Tooling
| Technology | Purpose |
|------------|---------|
| [Vitest](https://vitest.dev/) | Unit test runner (31 tests across 11 suites) |
| [Git](https://git-scm.com/) | Version control |

---

## Project Structure

```
aquatrack-web/
├── src/
│   ├── app/
│   │   ├── api/complaints/     # POST /api/complaints — citizen complaint ingestion
│   │   ├── dashboard/          # Command center UI (map + alert sidebar)
│   │   ├── crew/               # Mobile field crew portal
│   │   └── admin/              # Admin thresholds & simulation panel
│   ├── components/
│   │   ├── MapboxMap.tsx        # Interactive map with node pins & 500m overlays
│   │   ├── TelemetryAnalytics.tsx # Tremor sparkline charts (pressure, pH, turbidity, TDS)
│   │   └── DiagnosticAlertDrawer.tsx # AI root-cause display + crew proximity dispatcher
│   └── lib/
│       ├── redis.ts             # Upstash Redis client
│       ├── ratelimit.ts         # Sliding-window rate limiter (5 req/hr per citizen)
│       ├── resend.ts            # Resend email notification utility
│       └── spatial-sorting.ts  # Haversine distance calculator for crew proximity
├── supabase/
│   ├── functions/
│   │   ├── telemetry-ingest/   # Edge Function — IoT sensor ingestion & anomaly detection
│   │   └── triage-complaint/   # Edge Function — PostGIS scan + Gemini AI triage
│   └── find_nearby_anomalies.sql # PostgreSQL RPC function for 500m spatial buffer scan
├── prisma/
│   ├── schema.prisma            # Full database schema with PostGIS geometry columns
│   └── migrations/init/         # Initial DDL with GiST spatial indexes
├── tests/                       # Vitest test suites (one per feature)
└── .env.example                 # Environment variable template
```

---

## Prerequisites

- **Node.js** 20+ and **npm** 10+
- **Supabase** project with PostGIS extension enabled
- **Upstash Redis** database
- **Google AI Studio** API key (Gemini)
- **Resend** account and API key
- **Mapbox** account and public token

---

## 1. Environment Setup

Copy the example environment file and fill in your credentials:

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and set the following:

```env
# Supabase (PostgreSQL + Edge Functions)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://[instance].upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# Google Gemini AI
GEMINI_API_KEY=AIza...

# Resend Email
RESEND_API_KEY=re_...

# Mapbox (public — safe to expose)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

---

## 2. Install Dependencies

```powershell
npm install
```

---

## 3. Database Setup

> **Prerequisite:** Enable PostGIS in your Supabase project first:
> Supabase Dashboard → Database → Extensions → enable **postgis**

### A. Generate the Prisma Client

Generates the type-safe Prisma client from `prisma/schema.prisma`:

```powershell
npx prisma generate
```

### B. Run Migrations (Development)

Applies the initial DDL migration in `prisma/migrations/init/` to your database, including spatial indexes:

```powershell
npx prisma migrate dev
```

> Use `prisma migrate dev` during active development — it creates new migration files as you modify the schema.

### C. Run Migrations (Production / Supabase)

In a production or CI environment, apply existing migrations without prompting:

```powershell
npx prisma migrate deploy
```

> ⚠️ **Do not use `prisma db push` in production** — it bypasses the migration history and can cause schema drift.

### D. Inspect the Database (Optional)

Open Prisma Studio to browse your tables visually:

```powershell
npx prisma studio
```

### E. Deploy the PostGIS RPC Function

Open the **Supabase SQL Editor** and run the contents of:

```
supabase/find_nearby_anomalies.sql
```

This registers the `find_nearby_anomalies(report_lat, report_lng, max_distance_meters)` PostgreSQL RPC function used by the AI triage edge function to scan for active sensor anomalies within a 500m buffer.

---

## 4. Deploy Supabase Edge Functions

Install the [Supabase CLI](https://supabase.com/docs/guides/cli) then:

```powershell
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref [your-project-ref]

# Deploy both edge functions
supabase functions deploy telemetry-ingest
supabase functions deploy triage-complaint
```

Set secrets for the edge functions:

```powershell
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set UPSTASH_REDIS_REST_URL=https://...
supabase secrets set UPSTASH_REDIS_REST_TOKEN=AX...
```

---

## 5. Run the Frontend (Development)

```powershell
npm run dev
```

Open your browser at **http://localhost:3000**

| Route | Description |
|-------|-------------|
| `/dashboard` | Command Center — Mapbox map, operational alert sidebar, telemetry sparklines |
| `/crew` | Field Crew Mobile Portal — active work order + status transitions |
| `/admin` | Admin Panel — threshold configuration & telemetry simulation |
| `/api/complaints` | REST endpoint — POST citizen complaints (JSON) |

---

## 6. Run Tests

```powershell
# Run full test suite (31 tests)
npm test

# Run a specific test file
npx vitest run tests/ai-triage.test.ts
npx vitest run tests/complaints-api.test.ts
npx vitest run tests/proximity-sorting.test.ts

# Watch mode (re-runs on file changes)
npx vitest
```

---

## 7. Production Build

```powershell
# Build for production
npm run build

# Run production server locally
npm start
```

---

## 8. Test the API Manually

Submit a citizen complaint (PowerShell):

```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/complaints" `
  -ContentType "application/json" `
  -Body '{"rawText":"Mababa ang presyon ng tubig dito sa amin","latitude":14.5995,"longitude":120.9842}'
```

---

## Key Business Rules

- **Rate Limiting:** Citizens are throttled to **5 complaint submissions per hour** per IP via Upstash Redis sliding-window algorithm
- **Spatial Buffer:** AI triage scans for active sensor anomalies within **500 meters** of a complaint using PostGIS `ST_DWithin`
- **AI Translation:** Gemini automatically translates **Tagalog, Taglish, and Kapampangan** reports to English before classification
- **Alert Categories:** `PIPELINE_BREACH_PRESSURE_DROP`, `HIGH_TURBIDITY`, `HIGH_MINERAL_CONTENT_TDS`, `CHEMICAL_DISCOLORATION_CONTAMINATION`, `UNCLASSIFIED_INFRASTRUCTURE_ANOMALY`
- **Urgency Levels:** `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`

---

## License

Private — Municipal Water District Internal System
