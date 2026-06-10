# ─── Dockerfile - XTrendAI Pro ───────────────────────────
# Build stage : compile l'app React
# Runtime stage : serve avec nginx

# ─── Build Stage ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source
COPY . .

# Build the app
RUN npm run build

# ─── Runtime Stage ───────────────────────────────────────
FROM nginx:alpine AS runtime

# Install security updates
RUN apk add --no-cache ca-certificates && \
    rm -rf /var/cache/apk/*

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy PWA assets
COPY --from=builder /app/public/manifest.json /usr/share/nginx/html/manifest.json
COPY --from=builder /app/public/sw.js /usr/share/nginx/html/sw.js

# Create fallback for SPA routing
RUN cp /usr/share/nginx/html/index.html /usr/share/nginx/html/404.html

# Security headers
RUN echo 'server_tokens off;' >> /etc/nginx/conf.d/security.conf

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
