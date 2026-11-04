# ---- Build stage ----
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ---- Run stage ----
FROM node:22-bookworm-slim

WORKDIR /app

# Dates written to Oracle DATE columns must be Pacific
ENV TZ=America/Vancouver
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

RUN npm ci --omit=dev

CMD ["node", "dist/index.js"]