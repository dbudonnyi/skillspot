# syntax=docker/dockerfile:1

# ---------- deps ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# install deps AND warm the npm cache with the prisma/tsx CLIs that the
# runtime entrypoint needs (so containers can migrate/seed without network)
RUN npm ci --no-audit --no-fund \
 && npm cache add prisma@6 --no-audit --no-fund \
 && npm cache add tsx@4 --no-audit --no-fund

# ---------- build ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---------- runner ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# standalone server + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# prisma schema + seed + generated client (needed by entrypoint at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# seed.ts runtime deps missing from the standalone trace
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=deps --chown=nextjs:nodejs /root/.npm /home/nextjs/.npm
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
