# Docker Compose File Management Strategy

## Overview

This document explains how docker-compose files are managed across environments.

---

## File Structure

```
SSO-Auth-Microservice/
├── docker-compose.prod.yml     # Production configuration (source of truth)
├── docker-compose.dev.yml      # Development configuration
└── monitoring/
    ├── prometheus.yml          # Production Prometheus config
    └── prometheus-dev.yml      # Development Prometheus config
```

**On EC2:**
```
~/sso-auth-microservice/
├── docker-compose.yml          # Active config (copied from .prod.yml by CI/CD)
└── docker-compose.prod.yml     # Source from git
```

---

## Flow Diagrams

### Production Deployment Flow

```
Local Changes
    ↓
Edit docker-compose.prod.yml
    ↓
git commit && git push
    ↓
GitHub Actions CI/CD
    ↓
SSH to EC2
    ↓
git pull origin main
    ↓
cp docker-compose.prod.yml → docker-compose.yml
    ↓
docker compose --env-file .env.production up -d
```

### Development Flow

```
Local Development
    ↓
Use docker-compose.dev.yml directly
    ↓
docker compose -f docker-compose.dev.yml --env-file .env.local up -d
    ↓
No EC2 involved (local MongoDB + Redis)
```

---

## Key Principles

### ✅ DO:
1. **Edit locally:** Always modify `docker-compose.prod.yml` on your local machine
2. **Commit to git:** Push changes to main branch
3. **Let CI/CD deploy:** Pipeline handles copying to EC2
4. **Single source of truth:** `docker-compose.prod.yml` in git is the authoritative version

### ❌ DON'T:
1. **Never manually edit** `docker-compose.yml` on EC2
2. **Never create files** directly on EC2 (except secrets like .env)
3. **Never use `latest` tag** in production (CI/CD uses commit SHA)
4. **Never skip git** - all changes must go through version control

---

## Environment-Specific Differences

| Feature | Production (.prod.yml) | Development (.dev.yml) |
|---------|----------------------|----------------------|
| **Image Source** | Docker Hub (pre-built) | Local build |
| **MongoDB** | Atlas (remote) | Local container |
| **Redis** | redis:alpine (minimal) | redis-stack (with GUI) |
| **Env File** | .env.production | .env.local |
| **Resource Limits** | Strict (t2.micro) | Generous (local) |
| **Prometheus Retention** | 15 days | 7 days |
| **Restart Policy** | unless-stopped | unless-stopped |

---

## CI/CD Integration

### Deployment Step (production-cicd.yaml)

```yaml
- name: Deploy to EC2
  script: |
    cd ~/sso-auth-microservice
    
    # Sync latest code (includes docker-compose changes)
    git pull origin main
    
    # Copy production config to active config
    cp docker-compose.prod.yml docker-compose.yml
    
    # Deploy with specific image tag
    docker pull anish04kmr/sso-auth-microservice:$IMAGE_TAG
    docker tag anish04kmr/sso-auth-microservice:$IMAGE_TAG anish04kmr/sso-auth-microservice:latest
    docker compose --env-file .env.production up -d
```

**Why this works:**
- ✅ Git is single source of truth
- ✅ Manual EC2 changes don't persist (overwritten by git)
- ✅ Rollback is simple (`git revert` + redeploy)
- ✅ Audit trail (all changes in git history)

---

## Common Scenarios

### Scenario 1: Add New Service (e.g., Prometheus)

**Steps:**
1. Edit `docker-compose.prod.yml` locally
2. Add service configuration
3. Create config files (e.g., `monitoring/prometheus.yml`)
4. Commit: `git add . && git commit -m "feat: Add Prometheus"`
5. Push: `git push origin main`
6. CI/CD automatically deploys

### Scenario 2: Change Resource Limits

**Steps:**
1. Edit `docker-compose.prod.yml` locally
2. Update `deploy.resources` section
3. Commit and push
4. CI/CD redeploys with new limits

### Scenario 3: Emergency Fix on EC2

**If you MUST edit directly on EC2:**
1. Make the fix
2. Test it works
3. **IMMEDIATELY** update `docker-compose.prod.yml` locally with same change
4. Commit and push
5. Next deployment will preserve your fix

**Better approach:** Edit locally, test with dev compose, then deploy.

---

## Development Setup (First Time)

### Prerequisites
- Docker Desktop installed
- `.env.local` file created (copy from `.env.example`)
- JWT keys in `config/keys/` (same as production)

### Start Development Environment

```powershell
# Navigate to project
cd D:\2024\SSO-Auth-Microservice

# Start all services (MongoDB, Redis, App, Prometheus)
docker compose -f docker-compose.dev.yml --env-file .env.local up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f app

# Access services
# App: http://localhost:3000
# Prometheus: http://localhost:9090
# RedisInsight: http://localhost:8001
# MongoDB: mongodb://localhost:27017
```

### Stop Development Environment

```powershell
docker compose -f docker-compose.dev.yml down

# Remove volumes (fresh start)
docker compose -f docker-compose.dev.yml down -v
```

---

## Monitoring Files

### Production (monitoring/prometheus.yml)
- Scrapes app at `app:3000/api/v1/metrics`
- 15-day retention
- Labels: `environment=production`

### Development (monitoring/prometheus-dev.yml)
- Same scraping config
- 7-day retention
- Labels: `environment=development`

**Why separate files?**
- Different retention periods (save disk space in dev)
- Different labeling (identify data source)
- Independent tuning

---

## Troubleshooting

### Issue: "Changes not appearing on EC2"

**Cause:** Forgot to push to git, or CI/CD didn't run

**Fix:**
```bash
# On local
git push origin main

# Wait for GitHub Actions to complete
# Check: https://github.com/<your-repo>/actions
```

### Issue: "docker-compose.yml on EC2 differs from .prod.yml"

**Cause:** Manual edits on EC2

**Fix:**
```bash
# On EC2
cd ~/sso-auth-microservice
git pull origin main
cp docker-compose.prod.yml docker-compose.yml
docker compose --env-file .env.production up -d
```

### Issue: "Prometheus not starting"

**Cause:** `monitoring/prometheus.yml` missing on EC2

**Fix:**
```bash
# On local
git add monitoring/
git commit -m "Add Prometheus config"
git push origin main

# CI/CD will deploy it automatically
```

---

## Summary

- 📝 **Edit:** `docker-compose.prod.yml` locally
- 💾 **Commit:** Push to git (main branch)
- 🚀 **Deploy:** CI/CD copies to EC2 as `docker-compose.yml`
- ✅ **Result:** Single source of truth in version control

**Never edit docker-compose.yml directly on EC2!**
