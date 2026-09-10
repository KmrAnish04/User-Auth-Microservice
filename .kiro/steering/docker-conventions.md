---
inclusion: fileMatch
fileMatchPattern: '*Dockerfile*|*docker-compose*|*.dockerignore'
---

# Docker Conventions for SSO Auth Microservice

This file provides Docker best practices automatically loaded when working with Docker files.

---

## Dockerfile Best Practices

### 1. Base Image Selection
✅ **DO:**
```dockerfile
FROM node:20-alpine AS builder
# Use specific version + Alpine for smaller size
```

❌ **DON'T:**
```dockerfile
FROM node:latest
# Avoid 'latest' tag - not reproducible
```

**Rules:**
- Use **official images** from Docker Hub
- Use **Alpine variants** when possible (smaller: ~50MB vs 300MB+)
- Use **specific version tags** (node:20-alpine, not node:latest)
- Pin to major.minor version for stability (node:20-alpine, not node:20.5.1-alpine)

---

### 2. Multi-Stage Builds (REQUIRED)

Multi-stage builds separate build dependencies from runtime, reducing image size significantly.

**Template for Node.js:**
```dockerfile
# Stage 1: Builder - Install ALL dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
# Add build steps here if needed (e.g., npm run build)

# Stage 2: Production - Only production dependencies
FROM node:20-alpine AS production
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
```

**Benefits:**
- Builder stage: ~400MB (includes dev dependencies)
- Production stage: ~100MB (only runtime needed)
- More secure (no build tools in production)

---

### 3. Layer Caching Optimization

Docker caches layers - order matters for build speed!

✅ **DO (Optimal Order):**
```dockerfile
# 1. Copy package files first (changes rarely)
COPY package*.json ./

# 2. Install dependencies (cached if package.json unchanged)
RUN npm ci

# 3. Copy source code (changes frequently)
COPY . .
```

❌ **DON'T (Breaks cache):**
```dockerfile
# Bad: Copies everything first, cache invalidated on ANY file change
COPY . .
RUN npm ci
```

**Rule:** Copy files that change **least frequently** first.

---

### 4. Use npm ci Instead of npm install

✅ **DO:**
```dockerfile
RUN npm ci --omit=dev
```

❌ **DON'T:**
```dockerfile
RUN npm install --production
```

**Why npm ci?**
- Faster (10-50% faster)
- More reliable (uses package-lock.json exactly)
- Cleaner (removes node_modules before install)
- Better for CI/CD (reproducible builds)

---

### 5. Security: Non-Root User (REQUIRED)

**Never run containers as root!**

✅ **DO:**
```dockerfile
# Create user and group
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change file ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Now all commands run as 'nodejs' user
CMD ["node", "server.js"]
```

❌ **DON'T:**
```dockerfile
# Running as root (default) - security risk
CMD ["node", "server.js"]
```

**Why?**
- If attacker compromises container, they get root access
- Non-root user limits damage

---

### 6. Health Checks (REQUIRED)

Add HEALTHCHECK to allow Docker to monitor container health.

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

**Options:**
- `--interval=30s` - Check every 30 seconds
- `--timeout=5s` - Fail if check takes >5s
- `--start-period=30s` - Grace period for app startup
- `--retries=3` - Mark unhealthy after 3 failed checks

**Alternative (using curl - requires curl in image):**
```dockerfile
RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1
```

---

### 7. Environment Variables

✅ **DO:**
```dockerfile
ENV NODE_ENV=production
ENV PORT=3000
```

❌ **DON'T (Never hardcode secrets):**
```dockerfile
ENV DATABASE_PASSWORD=secret123  # Never do this!
```

**Rules:**
- Set non-sensitive defaults in Dockerfile
- Pass sensitive values at runtime via:
  - `docker run -e DATABASE_PASSWORD=...`
  - Docker Compose environment section
  - Docker secrets (Swarm mode)

---

### 8. Minimize Image Size

**Techniques:**
- Use Alpine base image (saves ~250MB)
- Multi-stage builds (saves build tools)
- Clean cache: `npm cache clean --force`
- Remove unnecessary files in .dockerignore
- Combine RUN commands to reduce layers

```dockerfile
# Good: Single layer, cleaned up
RUN apk add --no-cache python3 make g++ && \
    npm ci --omit=dev && \
    npm cache clean --force && \
    apk del python3 make g++

# Bad: Multiple layers, cache not cleaned
RUN apk add python3 make g++
RUN npm ci --omit=dev
RUN npm cache clean --force
```

---

### 9. .dockerignore (REQUIRED)

Create `.dockerignore` to exclude files from Docker context.

```dockerignore
# Dependencies
node_modules
npm-debug.log
yarn-error.log
.pnpm-debug.log

# Environment files (NEVER include in image)
.env
.env.*
!.env.example

# Git
.git
.gitignore
.gitattributes

# IDE
.vscode
.idea
*.swp
*.swo

# Testing
coverage
.nyc_output
test
tests
*.test.js
*.spec.js

# Documentation
README.md
docs
*.md
!package.md

# Docker files (don't copy into image)
Dockerfile*
docker-compose*.yml
.dockerignore

# Logs
logs
*.log
log.txt

# OS files
.DS_Store
Thumbs.db

# Credentials (CRITICAL)
*.key
*.pem
*.p12
*.pfx
local.dev.credentials.txt
```

**Why?**
- Faster builds (smaller context)
- Smaller images
- **Security:** Prevents accidental secret inclusion

---

### 10. Labels for Metadata

Add labels for better image management:

```dockerfile
LABEL maintainer="your-email@example.com"
LABEL version="1.0.0"
LABEL description="SSO Authentication Microservice"
LABEL org.opencontainers.image.source="https://github.com/KmrAnish04/Authentication-Authorization-Microservice"
```

---

## docker-compose.yml Best Practices

### 1. Version Pinning (REQUIRED)

✅ **DO:**
```yaml
services:
  mongodb:
    image: mongo:7.0-alpine  # Specific version
```

❌ **DON'T:**
```yaml
services:
  mongodb:
    image: mongo:latest  # Unpredictable
```

---

### 2. Health Checks

```yaml
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
```

---

### 3. Resource Limits (Production)

```yaml
services:
  app:
    image: anish123/sso-auth-microservice:v1.0.0
    deploy:
      resources:
        limits:
          cpus: '0.5'      # 50% of CPU
          memory: 512M     # Max 512MB RAM
        reservations:
          cpus: '0.25'     # Reserved 25% CPU
          memory: 256M     # Reserved 256MB RAM
```

---

### 4. Restart Policies

```yaml
services:
  app:
    restart: unless-stopped  # Restart unless manually stopped
```

**Options:**
- `no` - Never restart (development)
- `always` - Always restart (can cause issues)
- `on-failure` - Only restart on error
- `unless-stopped` - Restart unless manually stopped (recommended)

---

### 5. Named Volumes (REQUIRED for data persistence)

✅ **DO:**
```yaml
services:
  mongodb:
    volumes:
      - mongo-data:/data/db  # Named volume

volumes:
  mongo-data:  # Declare at bottom
```

❌ **DON'T:**
```yaml
services:
  mongodb:
    volumes:
      - ./data:/data/db  # Bind mount - data lost if directory deleted
```

---

### 6. Networks for Isolation

```yaml
services:
  app:
    networks:
      - frontend
      - backend
  
  mongodb:
    networks:
      - backend  # Only accessible by backend services

networks:
  frontend:
  backend:
```

---

### 7. Environment Variables from File

✅ **DO:**
```yaml
services:
  app:
    env_file:
      - .env.production  # Load from file
```

❌ **DON'T (Hardcode secrets):**
```yaml
services:
  app:
    environment:
      DB_PASSWORD: secret123  # Never do this!
```

---

### 8. Depends On with Conditions

```yaml
services:
  app:
    depends_on:
      mongodb:
        condition: service_healthy  # Wait for health check
      redis:
        condition: service_healthy
```

---

### 9. Production vs Development Compose Files

**Base:** `docker-compose.yml`
```yaml
services:
  app:
    image: anish123/sso-auth-microservice:${TAG:-latest}
    env_file: .env.${ENV:-production}
```

**Override for Dev:** `docker-compose.override.yml`
```yaml
services:
  app:
    build: .  # Build locally in dev
    volumes:
      - ./src:/app/src  # Mount source for hot reload
```

**Use:**
```bash
# Development (uses both files)
docker-compose up

# Production (only base file)
docker-compose -f docker-compose.yml up
```

---

## Security Checklist for Docker

Before deploying, verify:

- [ ] No secrets in Dockerfile or docker-compose.yml
- [ ] Using non-root user in container
- [ ] Using Alpine or minimal base images
- [ ] .dockerignore excludes sensitive files
- [ ] Health checks defined
- [ ] Image tagged with specific version (not latest)
- [ ] Resource limits set (prevents resource exhaustion)
- [ ] Volumes for data persistence
- [ ] Scanned image with Trivy (no HIGH/CRITICAL vulnerabilities)

---

## Common Docker Commands

```bash
# Build with tag
docker build -t anish123/sso-auth-microservice:v1.0.0 .

# Build with multiple tags
docker build -t anish123/sso-auth-microservice:v1.0.0 \
             -t anish123/sso-auth-microservice:latest .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_URL=$DB_URL \
  anish123/sso-auth-microservice:v1.0.0

# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# View logs
docker logs -f container_name

# Execute command in container
docker exec -it container_name sh

# Prune unused resources
docker system prune -a --volumes
```

---

## Production Deployment Checklist

Before deploying to production:

1. [ ] Build with multi-stage Dockerfile
2. [ ] Tag with git SHA and version number
3. [ ] Scan image with Trivy (no HIGH/CRITICAL vulns)
4. [ ] Test image locally with production docker-compose
5. [ ] Verify health check works
6. [ ] Verify non-root user (check with: `docker exec container_name whoami`)
7. [ ] Push to registry with proper tags
8. [ ] Update docker-compose on server with specific tag (not latest)
9. [ ] Deploy with `docker-compose up -d`
10. [ ] Verify health check passes after deployment
11. [ ] Check logs for errors
12. [ ] Test application endpoints

---

**Note to AI Agents:**  
This file is automatically loaded when working with Docker files. Follow these conventions strictly.
If user requests something that violates these practices, warn them and explain why.
