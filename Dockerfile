# ---- Frontend build ----
FROM node:22-alpine AS web-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- BFF build ----
FROM node:22-alpine AS bff-build
WORKDIR /app/bff
COPY bff/package*.json ./
RUN npm ci
COPY shared /app/shared
COPY bff/tsconfig.json ./
COPY bff/src ./src
RUN npx tsc && npm prune --omit=dev

# ---- Runtime: ein Container, Fastify serviert SPA + /api + /ws ----
FROM node:22-alpine
WORKDIR /app/bff
ENV NODE_ENV=production \
    PUBLIC_DIR=/app/public

COPY --from=bff-build /app/bff/node_modules ./node_modules
COPY --from=bff-build /app/bff/dist ./dist
COPY --from=web-build /app/dist /app/public

EXPOSE 8080

# Explizit IPv4: BusyBox-wget bevorzugt sonst ::1
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1

CMD ["node", "dist/bff/src/index.js"]
