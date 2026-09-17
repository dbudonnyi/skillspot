# SkillSpot — kids' & adults' activities marketplace (Warsaw MVP)

Find and compare sports clubs, schools, tutors and hobby classes near you in
Warsaw: map + list search, real-time distance, reviews with photos, favorites,
booking requests with in-app notifications and automated emails, provider
dashboard.

## Stack

- **Next.js 16 (App Router) + TypeScript + React 19** — Server Components + Server Actions (route handlers only for `/api/*`)
- **Tailwind CSS 4 + shadcn/ui (Base UI)**
- **PostgreSQL 17 + Prisma 6**
- **React-Leaflet + OpenStreetMap** — no API keys
- **JWT (httpOnly cookie) + bcryptjs** auth, roles `USER` / `PROVIDER`
- **nodemailer** — SMTP via env, otherwise Ethereal test account + console log
- **zod** — all server-side validation

## Run

```bash
# 1. Postgres
service postgresql start

# 2. Install, migrate, seed (creds in .env)
npm install
npx prisma migrate deploy
npm run seed          # tsx prisma/seed.ts — 62 profiles, 790 reviews, demo accounts

# 3. Build & start (production, 0.0.0.0:8080)
npm run build
npx next start -H 0.0.0.0 -p 8080
```

Demo accounts: parent `parent@demo.pl / demo1234`, provider (Шахтар owner)
`demo@szachtar.pl / demo1234`.

## Testing

```bash
npx tsc --noEmit                 # typecheck
npx eslint src e2e prisma        # lint
node e2e/smoke.mjs               # 38-step Playwright e2e against http://127.0.0.1:8080
```

`e2e/smoke.mjs` covers: home, search filters/sorts, Leaflet map + tiles, both
flagship profiles, contact gating, register/login both roles, favorites,
review publish, booking request → provider bell notification → accept →
parent sees ACCEPTED, dashboard profile edit + service CRUD, self-review
blocked, 404, zero console/hydration errors.

Re-seed before an e2e run (the review/favorite tests mutate state).

## Data

- `prisma/seed-data/profiles.json` — master dataset:
  - **Варшав Шахтар Pro School** (football, PL/UA bilingual, full data)
  - **Crocodile** (swimming school, Booksy + contacts)
  - 30 real Warsaw POIs enriched from the **Overpass API** (`leisure=sports_centre`,
    `amenity=music_school`, swimming facilities, sports halls — real names,
    coordinates, websites/phones where OSM has them)
  - 30 handcrafted realistic profiles covering every category & district
- Photos: 297 generated branded placeholders (`public/img`); reviews carry
  realistic PL/UA names. Regeneration pipeline: `/root/skillspot-scripts/`
  (`fetch_overpass.py` → `build_dataset.py` → `gen_photos.py`).

## Architecture notes

- Geo search: bounding-box SQL pre-filter + exact haversine cut
  (`src/lib/search.ts`) — right-sized for a single-city dataset; PostGIS is
  the next step at metro scale.
- Ratings denormalized (`ratingAvg`/`ratingCount`), recomputed on write.
- Photo uploads arrive as data-URLs; server validates mime + size (5 MB),
  stores under `public/uploads`; one review per user per profile enforced by
  a unique index.
- Emails never crash the request flow (try/catch + console fallback).
