---
inclusion: auto
name: Deployment Context
description: AWS deployment strategy, free tier constraints, and CI/CD approach for SSO Auth Microservice
---

# SSO Auth Microservice - Deployment Context

## Project Overview
This is a centralized SSO Authentication Microservice built with Node.js, Express, MongoDB, and Redis.
We are setting up production-ready CI/CD pipeline for AWS deployment as a learning exercise.

**Repository:** https://github.com/KmrAnish04/Authentication-Authorization-Microservice

## Deployment Decisions

### Infrastructure Choices
- **Cloud Provider:** AWS (Free Tier Only - NO CHARGES ALLOWED)
- **Compute:** EC2 t2.micro (Free tier - 750 hours/month, 1 instance max)
- **Database:** 
  - MongoDB: Self-hosted on EC2 OR MongoDB Atlas Free Tier (M0 - 512MB)
  - Redis: Self-hosted on EC2 in Docker (AWS ElastiCache NOT in free tier)
- **Container Registry:** Docker Hub (public free tier)
- **CI/CD:** GitHub Actions (2000 minutes/month free)
- **Domain:** None initially - using EC2 public IP address
- **Monitoring:** CloudWatch (basic free tier) + learning Prometheus/Grafana
- **SSL/HTTPS:** Not in Phase 1 (using HTTP on port 3000)

### AWS Free Tier Limits & Warnings
⚠️ **CRITICAL: Always monitor usage to avoid charges**

**Free Services We're Using:**
- ✅ EC2: t2.micro instance (750 hrs/month, 1 instance only)
- ✅ EBS: 30GB General Purpose SSD storage
- ✅ Data Transfer: 15GB outbound/month (inbound free)
- ✅ CloudWatch: 10 custom metrics, 10 alarms, 5GB log ingestion
- ✅ Elastic IP: FREE if attached to running instance
- ✅ AWS Systems Manager Parameter Store: First 10,000 parameters free

**Services That Cost Money (AVOID THESE):**
- ❌ Application Load Balancer (~$16/month minimum) - Use Nginx if needed
- ❌ NAT Gateway (~$32/month minimum) - Not needed for our setup
- ❌ ElastiCache (~$13/month minimum) - Use Docker Redis instead
- ❌ RDS (~$15/month minimum) - Use MongoDB Atlas M0 or Docker
- ❌ Additional EC2 instances (only 1 t2.micro is free)
- ❌ EBS Snapshots beyond 1GB/month (~$0.05/GB/month)
- ❌ Data transfer > 15GB/month (~$0.09/GB)
- ❌ Elastic IP when detached from instance ($0.005/hour = ~$3.60/month)

**Cost Monitoring Setup Required:**
- AWS Budget alert at $1.00 threshold
- CloudWatch billing alarm at $0.50
- Daily check of AWS Billing Dashboard
- See: `docs/deployment/aws-cost-monitoring.md`

### Architecture Pattern
```
GitHub Repository
      ↓
GitHub Actions CI/CD
  ├─ Lint & Test
  ├─ Build Docker Image
  ├─ Security Scan (Trivy)
  └─ Push to Docker Hub
      ↓
Docker Hub Registry
  (versioned images)
      ↓
AWS EC2 t2.micro Instance
  ├─ Docker Engine
  └─ Docker Compose
      ├─ SSO Auth App (Node.js)
      ├─ MongoDB (containerized)
      └─ Redis (containerized)
```

### Deployment Strategy
- **Type:** Rolling deployment with health checks
- **Approach:** Docker Compose on single EC2 instance
- **Rollback:** Automated on health check failure
- **Versioning:** Git SHA (short) + semantic version tags
- **Security:** 
  - No secrets in git (use .env files)
  - GitHub Secrets for CI/CD credentials
  - AWS Systems Manager Parameter Store for runtime secrets (free tier)
  - Generate RSA keys on server (never commit private keys)

### Container Strategy
- **Registry:** Docker Hub (username: anish123 based on current config)
- **Image Naming:** `anish123/sso-auth-microservice:tag`
- **Tags:**
  - `latest` - Current main branch (dangerous, avoid in prod)
  - `v1.0.0` - Semantic version (recommended)
  - `sha-abc1234` - Git commit SHA short hash (most reliable)
  - `staging` - Staging branch
- **Never use:** `latest` tag in production - always pin to specific version

## Project Structure Conventions

### Environment Variables
- **NEVER commit secrets to git**
- Use `.env.example` as template (already exists)
- Store secrets in:
  - **Development:** Local `.env.local` file (gitignored)
  - **CI/CD:** GitHub Repository Secrets
  - **Production:** AWS Systems Manager Parameter Store OR `.env.production` on EC2
- Required variables: See `.env.example`

### Docker Strategy
- **Multi-stage builds** for smaller images (~100MB vs 300MB+)
- **Health checks** in Dockerfile (HEALTHCHECK instruction)
- **Non-root user** for security (run as `node` user, not `root`)
- **Versioned image tags** (never rely on `latest`)
- **Alpine base image** (node:20-alpine) - smaller and more secure
- **Layer caching optimization** (COPY package*.json first)

### Application Requirements

#### Health Check Endpoint
Must create: `GET /api/v1/health`

Response format:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

#### Graceful Shutdown
- Listen for SIGTERM and SIGINT signals
- Close MongoDB connection gracefully
- Close Redis connection gracefully
- Drain active HTTP requests (max 30s timeout)
- Exit with code 0 on clean shutdown

#### Logging
- Structured JSON logs in production
- Use Winston or Pino (not console.log)
- Log levels: error, warn, info, debug
- Include: timestamp, request ID, user ID (if available), trace data

#### Testing
- Minimum: Health check tests
- Recommended: Auth flow tests, session management tests
- Run with: `npm test`
- Coverage: Aim for >60% (not blocking initially)

## Security Checklist

### Already Fixed Issues
- None yet (this is Phase 0)

### Issues to Fix (Phase 1)
- [ ] Remove `config/keys/jwtPrivate.key` from git history
- [ ] Remove `local.dev.credentials.txt` from git history
- [ ] Add private key generation to deployment docs
- [ ] Remove secrets from docker-compose.yml
- [ ] Add environment variable validation on app startup
- [ ] Use non-root user in Docker container
- [ ] Scan Docker images for vulnerabilities with Trivy
- [ ] Update Node.js from v16 to v20 (v16 reached EOL)

### Production Security Requirements
- [ ] All secrets in AWS Parameter Store or environment variables
- [ ] RSA keys generated on server (not committed)
- [ ] No exposed credentials in logs or error messages
- [ ] HTTPS enabled (after getting domain - Phase 2+)
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all endpoints
- [ ] Helmet.js for security headers
- [ ] CORS properly configured

## Documentation Files
All deployment documentation is stored in `/docs/deployment/`:
- `deployment-plan.md` - Master plan with all phases and task checklist (AI updates this)
- `aws-cost-monitoring.md` - How to avoid AWS charges and setup billing alerts
- `aws-setup-guide.md` - Step-by-step AWS infrastructure setup (created during Phase 4)
- `cicd-pipeline.md` - GitHub Actions configuration details (created during Phase 3)
- `troubleshooting.md` - Common issues and solutions (updated as we encounter problems)
- `architecture.md` - Final architecture diagrams and decisions (created at end)

**AI Agent Instructions:**
- Always check `deployment-plan.md` for current phase and progress
- Update task checkboxes in `deployment-plan.md` as work is completed
- Add new learnings to `troubleshooting.md`
- Reference these docs when user asks "where are we?" or "what's next?"

## Current Phase & Status
**Phase:** Phase 0 - Setup & Planning  
**Status:** Creating Kiro context files and documentation structure  
**Next:** Phase 1 - Project Cleanup & Production Hardening  
**Blocker:** None  
**Last Updated:** 2026-09-10

## Tech Stack Details

### Application
- **Runtime:** Node.js v20.x LTS (upgrade from current v16)
- **Framework:** Express.js v4.19.2
- **Template Engine:** EJS
- **Session:** express-session with connect-redis
- **Authentication:** Passport.js (Local + JWT + Google OAuth2)

### Databases
- **MongoDB:** v8.3.1 (Mongoose ODM)
- **Redis:** v4.7.0 (redis-stack for development, standard redis for production)

### DevOps Tools
- **Containerization:** Docker v24+ with Docker Compose v2+
- **CI/CD:** GitHub Actions
- **Registry:** Docker Hub
- **Infrastructure:** AWS EC2 (t2.micro)
- **Monitoring:** CloudWatch + Prometheus + Grafana (learning)
- **Security Scanning:** Trivy (for container images)
- **Testing:** Jest or Mocha (to be added)

## Learning Goals
1. Understand complete CI/CD pipeline from code to production
2. Learn Docker best practices (multi-stage builds, security, optimization)
3. Learn GitHub Actions workflow configuration
4. Learn AWS services within free tier constraints
5. Learn production monitoring with CloudWatch and Prometheus/Grafana
6. Understand deployment strategies (rolling, blue-green)
7. Learn how to handle secrets management securely
8. Practice troubleshooting production issues

## Success Criteria
- [ ] Application deployed and accessible via EC2 public IP
- [ ] Automated CI/CD pipeline working end-to-end
- [ ] Zero security vulnerabilities in production
- [ ] Health checks passing
- [ ] Monitoring and alerting setup
- [ ] Complete documentation of entire process
- [ ] **Most Important:** Zero AWS charges (stay in free tier)

---

**Note to AI Agents:**  
This is the master context file. Always reference this when working on deployment tasks.
All decisions and constraints are documented here. If unclear, ask the user before proceeding.
