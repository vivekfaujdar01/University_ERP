# Production Dockerfile — multi-stage: build Vite, serve with Nginx
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Build for production (uses VITE_ env vars at build time)
ARG VITE_API_URL
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_APP_NAME=University\ ERP

RUN npm run build

# ─── Production Nginx Image ────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config for client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
