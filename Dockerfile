# ================================
# Stage 1: Builder
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./ 

# Install ALL dependencies (including dev dependencies for potential build steps)
RUN npm ci

# Copy application source
COPY . .

# If you had a build step (like TypeScript compilation), it would go here
# RUN npm run build



# ================================
# Stage 2: Production
# ================================
FROM node:20-alpine AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies (no devDependencies)
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy application from builder stage
COPY --from=builder /app .

# Create non-root user and group
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start application
CMD ["node", "server.js"]
