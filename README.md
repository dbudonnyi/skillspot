# SkillSpot 🏅

**SkillSpot** is a marketplace for kids' & adults' extracurricular activities, sports clubs and tutors (MVP scope: Warsaw). Parents search schools by category, age group, rating and distance ("Near me"), browse profiles with photos, reviews and contacts, save favorites and send booking requests. Providers register their school, manage their profile, services and pricing, and receive requests with notifications (in-app + email).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui (Base UI) · Prisma + PostgreSQL · JWT auth (httpOnly cookie, bcrypt) · React-Leaflet (OpenStreetMap, no API keys) · framer-motion · Playwright (e2e).

**Highlights:**
- 🌍 Three UI languages: **українська / Polski / English**. Content (descriptions, reviews) can be written in any language — machine translation into the active UI language on demand (language detection, chunking, multi-provider fallback, cache in the `Translation` table).
- 📍 Geolocation: "Near me" asks for location permission, draws a radius circle on the map, shows distance badges and sorts "nearest first".
- ✨ Apple-style design: spring animations, smooth transitions, glass effects.
- 🔔 Provider notifications: in-app bell + automatic email (SMTP, or ethereal/console fallback).
- 🗺 60+ real Warsaw profiles in the demo dataset (Overpass API + curated data), including "Варшав Шахтар Pro School" and "Crocodile".

---

## 🐳 Quick start with Docker (recommended)

All you need is Docker with compose — PostgreSQL, migrations and demo data are brought up automatically.

```bash
git clone https://github.com/dbudonnyi/skillspot.git
cd skillspot
docker compose up -d --build
```

Done: **http://localhost:8080**

- `db` — PostgreSQL 16 (data persisted in the `pgdata` volume).
- `app` — Next.js (standalone build). On first start it applies the schema (`prisma db push`) and, if `SEED=1` (the default), loads the demo dataset: 60+ profiles, services, ~790 reviews, favorites and demo booking requests.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Parent | `parent@demo.pl` | `demo1234` |
| Provider (Shakhtar owner) | `demo@szachtar.pl` | `demo1234` |

### Useful commands

```bash
docker compose logs -f app     # app logs (outgoing emails are printed here without SMTP)
docker compose down            # stop
docker compose down -v         # stop and wipe database data
docker compose restart app     # restart the app
```

Environment variables live in `docker-compose.yml`: `DATABASE_URL`, `SEED`, `NEXT_PUBLIC_APP_URL`, `JWT_SECRET`, optionally `SMTP_*`/`EMAIL_FROM`. The published port is the `"8080:3000"` line in the same file.

---

## 🛠 Running from scratch without Docker

Requirements: **Node.js ≥ 20**, **PostgreSQL** (local, or in a container):

```bash
docker run -d --name pg -e POSTGRES_USER=skillspot -e POSTGRES_PASSWORD=*** \
  -e POSTGRES_DB=skillspot -p 5432:5432 postgres:16-alpine
```

```bash
git clone https://github.com/dbudonnyi/skillspot.git
cd skillspot
npm install
cp .env.example .env           # adjust DATABASE_URL if needed
npx prisma db push             # create schema + generate the client
npm run seed                   # demo data (60+ profiles, reviews, accounts)
npm run dev                    # dev  → http://localhost:3000
# production:
npm run build && npx next start -H 0.0.0.0 -p 8080
```

---

## 🧪 Checks

```bash
npx tsc --noEmit               # typecheck
npm run lint                   # ESLint
npm run e2e                    # Playwright smoke suite (needs a server on :8080)
```

`e2e/smoke.mjs` (38+ steps): home, search/filters/sorts, map + "near me" geolocation, uk/pl/en switching, machine translation of descriptions and reviews, provider profile, contact gating behind a button, register/login for both roles, favorites, review publishing, booking request → provider notification → accept, dashboard, 404, zero console/hydration errors. Re-seed before a run (the tests mutate data).

---

## 📁 Structure

```
src/
  app/            # App Router: pages + /api routes
  actions/        # server actions (auth, bookings, reviews, favorites…)
  components/     # UI: shadcn/ui + map, i18n switcher, animations
  i18n/           # uk/pl/en dictionary + server-side localization
  lib/            # prisma, geo (haversine), search, translate (MT + cache), auth, mail
prisma/
  schema.prisma   # User, ProviderProfile, Service, Review, Favorite,
                  # BookingRequest, Notification, Translation
  seed.ts         # deterministic seed
  seed-data/      # master profile dataset (Overpass + curated)
docker/entrypoint.sh   # wait-for-db → db push → seed → node server.js
e2e/smoke.mjs          # Playwright smoke suite
```

---

## 🔐 Production notes

- Change `JWT_SECRET` and the Postgres password; remove the demo accounts.
- Machine translation uses public APIs (lingva.ml, MyMemory) with caching and graceful fallback to the original text; for production, plug in a paid key (Google/DeepL).
- HTTPS: browsers only expose geolocation on `https://` or `localhost`.
- Geo search: bounding-box prefilter + haversine — fine for a single city; move to PostGIS when you scale.

## 📄 License

MIT
