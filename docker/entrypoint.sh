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

# Generated Prisma client is baked into the image; prisma/tsx CLIs are warmed
# in the image npm cache (~/.npm), so this works offline in practice.
export npm_config_update_notifier=false

echo "[skillspot] applying schema (prisma db push --skip-generate)"
npx --yes --prefer-offline prisma@6 db push --skip-generate --schema=prisma/schema.prisma

if [ "$SEED" = "1" ]; then
  EMPTY=$(node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
p.providerProfile.count().then(c=>{console.log(c);return p.\$disconnect()}).catch(()=>console.log('err'));
" 2>/dev/null || echo err)
  if [ "$EMPTY" = "0" ] || [ "$EMPTY" = "err" ]; then
    echo "[skillspot] seeding demo data..."
    npx --yes --prefer-offline tsx@4 prisma/seed.ts
  else
    echo "[skillspot] database already has data, skipping seed"
  fi
fi

echo "[skillspot] starting Next.js server on ${HOSTNAME}:${PORT}"
exec node server.js
