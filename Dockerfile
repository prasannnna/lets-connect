# Build & Run Dockerfile for Google Cloud Run
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json bun.lock* ./

# Install dependencies
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build Vite frontend and bundled Node server
RUN npm run build

# Production image
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package json for metadata
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev || npm install --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
