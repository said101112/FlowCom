# syntax=docker/dockerfile:1

# ---------- Étape 1 : build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Étape 2 : runtime (image finale) ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Sert le bundle statique + le serveur SSR.
COPY --from=build /app/dist/flowcom ./dist/flowcom
COPY --from=build /app/package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN npm ci --omit=dev \
  && npm cache clean --force \
  && chmod +x ./docker-entrypoint.sh \
  && chown -R node:node /app

USER node

ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
