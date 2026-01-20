# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.21.1
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

ENV NODE_ENV=production


# ---------- Build stage ----------
FROM base AS build

# Native deps for node-gyp (only in build stage)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      node-gyp \
      pkg-config \
      python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package.json package-lock.json ./

# ❗ FIX: use npm install instead of npm ci
RUN npm install

# Copy source
COPY . .

# Build (React / Vite / etc.)
RUN npm run build

# Remove dev deps after build
RUN npm prune --omit=dev


# ---------- Runtime stage ----------
FROM base

WORKDIR /app

COPY --from=build /app /app

EXPOSE 8080

CMD ["npm", "run", "start"]
