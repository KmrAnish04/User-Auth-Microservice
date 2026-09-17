# Simplified CI/CD Deployment Flow

## Overview

This document explains the simplified, production-ready CI/CD flow where EC2 only has deployment configs, not source code.

---

## EC2 Directory Structure

```
~/sso-auth-microservice/
├── docker-compose.prod.yml    ← Synced via CI/CD (curl)
├── monitoring/
│   └── prometheus.yml         ← Synced via CI/CD (curl)
├── config/keys/
│   ├── jwtPrivate.key         ← Manual setup (NOT synced)
│   └── jwtPublic.key          ← Manual setup (NOT synced)
└── .env.production            ← Manual setup (NOT synced)
```

**Total: ~6 files. No git repo, no source code!**

---

## What CI/CD Does (Simple)

### On every push to main:

1. **Download latest configs** (via curl from GitHub raw URLs)
   - `docker-compose.prod.yml`
   - `monitoring/prometheus.yml`

2. **Pull new Docker image** 
   - Image contains all application code
   - Tagged with commit SHA

3. **Stop old containers**
   - Graceful shutdown

4. **Start new containers**
   - Using `-f docker-compose.prod.yml` flag
   - Using `--env-file .env.production` for secrets

5. **Health check**
   - Wait up to 5 minutes for `/api/v1/health`
   - If fails: stop containers and exit

---

## What CI/CD Does NOT Do

❌ Git clone  
❌ Git pull  
❌ Copy source code  
❌ Touch `.env.production`  
❌ Touch JWT keys  
❌ npm install  
❌ Build application (already built in Docker image)

---

## Why This Approach?

### ✅ Advantages:

1. **Minimal footprint** - Only 6 files on EC2
2. **Clear separation** - Code in Docker image, configs on server
3. **Secure** - Secrets never leave EC2, never in git
4. **Fast** - No git operations, just download 2 small files
5. **Scalable** - Easy to add to ASG user data script

### ✅ Compared to git pull approach:

| Aspect | Git Pull | Curl Download |
|--------|----------|---------------|
| Files on EC2 | Entire repo (~100+ files) | 6 files |
| Disk usage | ~50MB | ~5KB configs |
| Sync speed | 5-10s | <1s |
| Source code on server | Yes (unused) | No |
| .git directory | Yes (unused) | No |

---

## One-Time EC2 Setup

When provisioning a new EC2 instance:

```bash
# 1. Create directory structure
mkdir -p ~/sso-auth-microservice/monitoring/config/keys

# 2. Create .env.production
nano ~/sso-auth-microservice/.env.production
# (Add all production environment variables)

# 3. Generate or copy JWT keys
cd ~/sso-auth-microservice/config/keys
openssl genrsa -out jwtPrivate.key 2048
openssl rsa -in jwtPrivate.key -pubout -out jwtPublic.key
chmod 644 *.key

# 4. Download initial configs
cd ~/sso-auth-microservice
curl -fsSL -o docker-compose.prod.yml https://raw.githubusercontent.com/KmrAnish04/SSO-Auth-Microservice/main/docker-compose.prod.yml
curl -fsSL -o monitoring/prometheus.yml https://raw.githubusercontent.com/KmrAnish04/SSO-Auth-Microservice/main/monitoring/prometheus.yml

# 5. Start containers
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

**This is done once per EC2 instance.**

---

## Auto Scaling Group Setup (Future)

For ASG, the one-time setup becomes User Data:

```bash
#!/bin/bash
# User Data script for ASG instances

# Install Docker
apt-get update
apt-get install -y docker.io docker-compose-plugin

# Create directory
mkdir -p ~/sso-auth-microservice/monitoring/config/keys
cd ~/sso-auth-microservice

# Fetch secrets from AWS Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id sso-auth/production \
  --query SecretString --output text > .env.production

# Fetch JWT keys from S3
aws s3 cp s3://sso-auth-secrets/jwtPrivate.key config/keys/jwtPrivate.key
aws s3 cp s3://sso-auth-secrets/jwtPublic.key config/keys/jwtPublic.key

# Download configs
curl -fsSL -o docker-compose.prod.yml https://raw.githubusercontent.com/.../docker-compose.prod.yml
curl -fsSL -o monitoring/prometheus.yml https://raw.githubusercontent.com/.../monitoring/prometheus.yml

# Start containers
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

**Every new EC2 in ASG runs this automatically - no manual setup needed!**

---

## CI/CD Pipeline Details

### Deployment Step (production-cicd.yaml)

```yaml
- name: Deploy to EC2 via SSH
  script: |
    cd ~/sso-auth-microservice
    
    # Download latest configs
    curl -fsSL -o docker-compose.prod.yml https://raw.githubusercontent.com/.../docker-compose.prod.yml
    curl -fsSL -o monitoring/prometheus.yml https://raw.githubusercontent.com/.../monitoring/prometheus.yml
    
    # Pull and deploy
    docker pull anish04kmr/sso-auth-microservice:$IMAGE_TAG
    docker tag anish04kmr/sso-auth-microservice:$IMAGE_TAG anish04kmr/sso-auth-microservice:latest
    docker compose -f docker-compose.prod.yml --env-file .env.production down
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d
    
    # Health check
    # (wait up to 5 minutes for /api/v1/health)
```

---

## Making Changes

### To add a new service (e.g., Grafana):

1. **Edit locally:** `docker-compose.prod.yml`
2. **Commit and push:** `git push origin main`
3. **CI/CD automatically:**
   - Downloads new `docker-compose.prod.yml`
   - Restarts containers with Grafana included

### To change Prometheus config:

1. **Edit locally:** `monitoring/prometheus.yml`
2. **Commit and push:** `git push origin main`
3. **CI/CD automatically:**
   - Downloads new `prometheus.yml`
   - Restarts Prometheus container

### To change environment variables:

1. **SSH to EC2** (manual - secrets shouldn't be in git)
2. **Edit:** `nano .env.production`
3. **Restart:** `docker compose -f docker-compose.prod.yml --env-file .env.production up -d`

---

## Troubleshooting

### Issue: "Deployment directory not found"

**Cause:** EC2 doesn't have `~/sso-auth-microservice` directory

**Fix:**
```bash
mkdir -p ~/sso-auth-microservice/monitoring/config/keys
# Then run one-time setup steps
```

### Issue: "curl: command not found"

**Cause:** curl not installed on EC2

**Fix:**
```bash
sudo apt-get update && sudo apt-get install -y curl
```

### Issue: "Permission denied" for JWT keys

**Cause:** Wrong file permissions

**Fix:**
```bash
chmod 644 ~/sso-auth-microservice/config/keys/*.key
```

---

## Summary

**Key principle:** 
- **Code lives in Docker image** (built by CI/CD, pushed to Docker Hub)
- **Configs live on EC2** (synced via curl)
- **Secrets live on EC2** (manual setup, never synced)

**No git needed on EC2!** 🎉
