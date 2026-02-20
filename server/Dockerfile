# VeloSight Backend - Production Dockerfile
# Build context should be the repository root (to include shared/)

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./
COPY server/package.json ./server/

# Install all dependencies (including dev for build)
RUN npm ci

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY package.json package-lock.json ./
COPY server/ ./server/
COPY shared/ ./shared/
COPY tsconfig.json ./

# Build TypeScript (optional - tsx runs TS directly, but pre-compile for faster startup)
# RUN npm run build:server

# =============================================================================
# Stage 3: Production Runtime
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 velosight

# Copy only production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/tsconfig.json ./

# Set ownership
RUN chown -R velosight:nodejs /app

USER velosight

# Expose backend port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Environment variables (defaults, override at runtime)
ENV NODE_ENV=production
ENV BACKEND_PORT=3001

# Start the server using tsx (TypeScript execution)
CMD ["npx", "tsx", "server/src/index.ts"]
