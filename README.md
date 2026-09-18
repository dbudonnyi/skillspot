# SkillSpot 🏅

**SkillSpot** — маркетплейс детских и взрослых секций, спортивных клубов и репетиторов (MVP для Варшавы). Родители ищут школы по категориям, возрасту, рейтингу и расстоянию («Near me»), смотрят профили с фото, отзывами и контактами, добавляют в избранное и отправляют заявки на запись. Провайдеры регистрируют школу, ведут профиль, услуги и цены, получают заявки и уведомления (in-app + email).

**Стек:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui (Base UI) · Prisma + PostgreSQL · JWT-auth (httpOnly cookie, bcrypt) · React-Leaflet (OpenStreetMap, без API-ключей) · framer-motion · Playwright (e2e).

**Фишки:**
- 🌍 Три языка UI: **українська / Polski / English**. Контент (описания, отзывы) добавляется на любом языке — включается машинный перевод на язык интерфейса (детект языка, чанкинг, fallback нескольких провайдеров, кэш в таблице `Translation`).
- 📍 Геолокация: «Near me» запрашивает доступ к локации, рисует круг радиуса на карте, показывает бейджи расстояний и сортирует «nearest first».
- ✨ Apple-style дизайн: spring-анимации, плавные переходы, glass-эффекты.
- 🔔 Уведомления провайдеру: in-app «колокольчик» + автоматическое письмо (SMTP либо ethereal/console fallback).
- 🗺 60+ реальных профилей Варшавы в демоданных (Overpass API + курируемый датасет), включая «Варшав Шахтар Pro School» и «Crocodile».

---

## 🐳 Быстрый старт через Docker (рекомендуется)

Нужен только Docker с compose — PostgreSQL, миграции и демо-данные поднимутся сами.

```bash
git clone https://github.com/dbudonnyi/skillspot.git
cd skillspot
docker compose up -d --build
```

Готово: **http://localhost:8080**

- `db` — PostgreSQL 16 (данные в volume `pgdata`).
- `app` — Next.js (standalone-сборка). При первом старте сам применяет схему (`prisma db push`) и, если `SEED=1` (по умолчанию), загружает демо-датасет: 60+ профилей, услуги, ~790 отзывов, избранное, демо-заявки.

### Демо-аккаунты

| Роль | Email | Пароль |
|---|---|---|
| Родитель | `parent@demo.pl` | `demo1234` |
| Провайдер (Шахтар) | `demo@szachtar.pl` | `demo1234` |

### Полезные команды

```bash
docker compose logs -f app     # логи (сюда же попадают "отправленные" email без SMTP)
docker compose down            # остановить
docker compose down -v         # остановить и стереть данные БД
docker compose restart app     # перезапустить приложение
```

Переменные окружения — в `docker-compose.yml`: `DATABASE_URL`, `SEED`, `NEXT_PUBLIC_APP_URL`, `JWT_SECRET`, опционально `SMTP_*`/`EMAIL_FROM`. Порт наружу — строка `"8080:3000"` там же.

---

## 🛠 Запуск с нуля без Docker

Требования: **Node.js ≥ 20**, **PostgreSQL** (локально или контейнером):

```bash
docker run -d --name pg -e POSTGRES_USER=skillspot -e POSTGRES_PASSWORD=*** \
  -e POSTGRES_DB=skillspot -p 5432:5432 postgres:16-alpine
```

```bash
git clone https://github.com/dbudonnyi/skillspot.git
cd skillspot
npm install
cp .env.example .env           # проверьте DATABASE_URL
npx prisma db push             # схема БД + генерация клиента
npm run seed                   # демо-данные (60+ профилей, отзывы, аккаунты)
npm run dev                    # dev  → http://localhost:3000
# production:
npm run build && npx next start -H 0.0.0.0 -p 8080
```

---

## 🧪 Проверки

```bash
npx tsc --noEmit               # типы
npm run lint                   # ESLint
npm run e2e                    # Playwright smoke (нужен запущенный сервер на :8080)
```

`e2e/smoke.mjs` (38+ шагов): home, поиск/фильтры/сортировки, карта + геолокация «near me», переключение uk/pl/en, машинный перевод описаний и отзывов, профиль, контакты за кнопкой, регистрация/логин обеих ролей, избранное, отзыв, заявка → уведомление провайдеру → accept, дашборд, 404, ноль console/hydration-ошибок. Перед прогоном сделайте ре-сид (тесты мутируют данные).

---

## 📁 Структура

```
src/
  app/            # App Router: страницы + /api routes
  actions/        # server actions (auth, bookings, reviews, favorites…)
  components/     # UI: shadcn/ui + карта, i18n-свитчер, анимации
  i18n/           # словарь uk/pl/en + серверная локализация
  lib/            # prisma, geo (haversine), search, translate (MT+кэш), auth, mail
prisma/
  schema.prisma   # User, ProviderProfile, Service, Review, Favorite,
                  # BookingRequest, Notification, Translation
  seed.ts         # детерминированный сид
  seed-data/      # мастер-датасет профилей (Overpass + curated)
docker/entrypoint.sh   # wait-for-db → db push → seed → node server.js
e2e/smoke.mjs          # Playwright smoke-сьюта
```

---

## 🔐 Примечания для прода

- Смените `JWT_SECRET` и пароль Postgres; удалите демо-аккаунты.
- Машинный перевод — публичные API (lingva.ml, MyMemory) с кэшем и graceful fallback на оригинал; для продакшена — платный ключ (Google/DeepL).
- HTTPS: браузеры дают геолокацию только на `https://` или `localhost`.
- Geo-поиск: bbox-префильтр + haversine — достаточно для одного города; при росте — PostGIS.

## 📄 License

MIT
