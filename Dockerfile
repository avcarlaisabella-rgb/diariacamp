# DiáriaCamp — imagem de produção (Next.js + Prisma/PostgreSQL)
# Pensada para deploy via Coolify (ou qualquer host que rode um Dockerfile) na VPS Hostinger.
#
# No start do container, roda "prisma migrate deploy" (aplica migrations pendentes
# de forma segura, sem perguntas interativas) e então inicia o Next.js.

FROM node:20-alpine AS base

# ---- Dependências ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Runtime ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
