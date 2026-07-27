# Production Dockerfile — multi-stage: build TypeScript, then run compiled JS
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Set platform for EC2 (linux/amd64) compatibility
ARG TARGETPLATFORM=linux/amd64

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 5000

USER node

CMD ["node", "dist/app.js"]
