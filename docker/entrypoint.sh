#!/bin/sh
set -e

echo "[skillspot] waiting for database..."
n=0
until node -e "
const net=require('net');
const u=new URL(process.env.DATABASE_URL);
const s=net.connect(Number(u.port||5432),u.hostname);
s.on('connect',()=>{s.end();process.exit(0)});
s.on('error',()=>process.exit(1));
" 2>/dev/null; do
  n=$((n+1))
  if [ "$n" -gt 90 ]; then echo "[skillspot] database not reachable, aborting"; exit 1; fi
  sleep 1
done

# The generated Prisma client is baked into the image; the prisma/tsx CLIs are
# pre-warmed in the local npm cache (/tmp/npm-cache), so these work offline.
export npm_config_cache=/tmp/npm-cache
export npm_config_update_notifier=false

if [ ! -f .schema-applied ]; then
  echo "[skillspot] applying schema (prisma db push --skip-generate)"
  npx --yes --prefer-offline prisma@6 db push --skip-generate --schema=prisma/schema.prisma
  touch .schema-applied || true
fi

if [ "$SEED" = "1" ] && [ ! -f .seeded ]; then
  echo "[skillspot] seeding demo data..."
  npx --yes --prefer-offline tsx@4 prisma/seed.ts
  touch .seeded || true
fi

echo "[skillspot] starting Next.js server on ${HOSTNAME}:${PORT}"
exec node server.js
