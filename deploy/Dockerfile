# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS build

RUN apt-get update && apt-get install -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server.js db.js ai.js smartCommitment.js ./
COPY shared ./shared

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "server.js"]
