# SSO Auth Microservice - Complete Deployment Plan

## Document Purpose
This is the master document tracking our complete CI/CD deployment setup journey.
All AI agents should reference this for context on current progress and next steps.

**Last Updated:** 2026-09-10  
**Updated By:** Kiro AI Agent

---

## Project Goals
1. Learn production-ready CI/CD deployment process
2. Deploy SSO Auth Microservice on AWS EC2 (free tier only)
3. Understand Docker, GitHub Actions, and AWS services
4. Implement monitoring with CloudWatch and Prometheus/Grafana
5. Follow industry-standard best practices
6. **Critical:** Stay within AWS free tier ($0 monthly cost)

---

## Phase Status Overview

| Phase | Status | Progress | Est. Time | Actual Time |
|-------|--------|----------|-----------|-------------|
| Phase 0 | ✅ In Progress | 80% | 1 hour | - |
| Phase 1 | ⏳ Not Started | 0% | 3-4 hours | - |
| Phase 2 | ⏳ Not Started | 0% | 2 hours | - |
| Phase 3 | ⏳ Not Started | 0% | 3 hours | - |
| Phase 4 | ⏳ Not Started | 0% | 2-3 hours | - |
| Phase 5 | ⏳ Not Started | 0% | 2-3 hours | - |
| Phase 6 | ⏳ Not Started | 0% | 2 hours | - |

**Total Estimated Time:** 15-18 hours (spread over 1-2 weeks)

---

## Phase 0: Setup & Planning ✅

**Status:** Complete - Awaiting User Confirmation  
**Objective:** Setup project documentation and Kiro AI context for maximum efficiency

### Tasks

- [x] Analyze current codebase and identify issues
- [x] Create deployment architecture plan
- [x] Document AWS free tier constraints
- [x] Create Kiro steering files
  - [x] `.kiro/steering/deployment-context.md`
  - [x] `.kiro/steering/docker-conventions.md`
  - [x] `.kiro/steering/cicd-conventions.md`
- [x] Create documentation structure (`docs/deployment/`)
- [x] Create master deployment plan (this file)
- [x] Create AWS cost monitoring guide
- [ ] User review and confirmation

### Deliverables
- ✅ `.kiro/steering/` - AI context files (3 files created)
- ✅ `docs/deployment/deployment-plan.md` - This master plan
- ✅ `docs/deployment/aws-cost-monitoring.md` - Cost tracking guide

### Completion Summary
**Created 5 files:**
1. `.kiro/steering/deployment-context.md` - Master context for AI agents
2. `.kiro/steering/docker-conventions.md` - Docker best practices
3. `.kiro/steering/cicd-conventions.md` - GitHub Actions standards
4. `docs/deployment/deployment-plan.md` - Complete deployment roadmap
5. `docs/deployment/aws-cost-monitoring.md` - AWS cost safety guide

### Next Action
**Awaiting user review and confirmation to proceed to Phase 1**

---

## Phase 1: Project Cleanup & Production Hardening ⏳

**Status:** Not Started  
**Objective:** Fix security issues and prepare application for production deployment

### Critical Security Issues to Fix

#### 1. Remove Sensitive Files from Git
**Files to remove:**
- [ ] `config/keys/jwtPrivate.key` - Private RSA key (HIGH RISK)
- [ ] `config/keys/jwtPublic.key` - Public key (can be regenerated)
- [ ] `local.dev.credentials.txt` - Contains credentials

**Actions:**
```bash
# Remove from git history (use git filter-repo or BFG)
git rm --cached config/keys/jwtPrivate.key
git rm --cached config/keys/jwtPublic.key
git rm --cached local.dev.credentials.txt

# Update .gitignore
echo "config/keys/*.key" >> .gitignore
echo "local.dev.credentials.txt" >> .gitignore
echo "*.pem" >> .gitignore

# Commit changes
git commit -m "security: Remove sensitive files from git"
```

**Documentation needed:**
- [ ] Document RSA key generation steps for deployment
- [ ] Add to deployment guide: Generate keys on EC2 during setup

#### 2. Update Node.js Version
**Current:** v16.14 (EOL - End of Life)  
**Target:** v20.x LTS (supported until April 2026)

**Files to update:**
- [ ] `Dockerfile` - Change base image to `node:20-alpine`
- [ ] `package.json` - Add engines field: `"node": ">=20.0.0"`
- [ ] `.github/workflows/*.yaml` - Update node-version to 20

**Testing required:**
- [ ] Verify app starts with Node 20
- [ ] Test all API endpoints
- [ ] Check for deprecated package warnings

#### 3. Add Health Check Endpoint
**Required:** `GET /api/v1/health`

**Implementation steps:**
- [ ] Create `routes/health.route.js`
- [ ] Add controller `controllers/health.controller.js`
- [ ] Check MongoDB connection status
- [ ] Check Redis connection status
- [ ] Return proper status codes (200 = healthy, 503 = unhealthy)

**Response format:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-10T20:30:00Z",
  "uptime": 3600,
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  },
  "version": "1.0.0"
}
```

#### 4. Add Basic Test Suite
**Framework:** Jest (Node.js standard)

**Tasks:**
- [ ] Install Jest: `npm install --save-dev jest supertest`
- [ ] Create `tests/` directory
- [ ] Add test for health check endpoint
- [ ] Add test for auth routes (basic smoke tests)
- [ ] Update `package.json` test script
- [ ] Configure Jest in `jest.config.js`
- [ ] Add test coverage threshold (>50%)

**Minimum tests required:**
```javascript
// tests/health.test.js - Health check endpoint
// tests/auth.test.js - Basic auth flow
// tests/user.test.js - User routes (protected)
```

#### 5. Improve Logging
**Current:** Using `console.log` (not production-ready)  
**Target:** Structured JSON logging with Winston or Pino

**Tasks:**
- [ ] Install Winston: `npm install winston`
- [ ] Create `src/utils/logger.js`
- [ ] Configure log levels by environment
- [ ] Add request ID tracking
- [ ] Replace all console.log with logger
- [ ] Add log rotation for file logs

**Log format:**
```json
{
  "timestamp": "2026-09-10T20:30:00Z",
  "level": "info",
  "message": "User login successful",
  "userId": "123",
  "requestId": "req-abc-123",
  "ip": "192.168.1.1"
}
```

#### 6. Add Environment Validation
**Library:** joi or zod

**Tasks:**
- [ ] Install joi: `npm install joi`
- [ ] Create `src/utils/validateEnv.js`
- [ ] Define required environment variables schema
- [ ] Validate on app startup (before server starts)
- [ ] Fail fast with clear error message if validation fails

**Required variables to validate:**
```javascript
// NODE_ENV, PORT, MONGO_DB_URL, REDIS_DB_URL,
// Google_Client_ID, Google_Client_Secret, REFRESH_TOKEN_SECRET
```

#### 7. Add Graceful Shutdown
**Tasks:**
- [ ] Listen for SIGTERM and SIGINT signals
- [ ] Close MongoDB connection gracefully
- [ ] Close Redis connection gracefully
- [ ] Drain active HTTP requests (max 30s timeout)
- [ ] Exit with code 0 on clean shutdown

**Implementation in `server.js`:**
```javascript
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### Additional Improvements

#### 8. Add Production Dependencies
- [ ] Install helmet: `npm install helmet` (security headers)
- [ ] Install cors: Already installed, verify configuration
- [ ] Install compression: `npm install compression` (gzip responses)
- [ ] Install express-rate-limit: `npm install express-rate-limit`

#### 9. Update package.json Scripts
- [ ] Add `start` script: `node server.js` (for production)
- [ ] Update test script to work with Jest
- [ ] Add `lint` script (install ESLint if needed)
- [ ] Add `format` script (Prettier optional)

### Phase 1 Success Criteria
- [ ] All security issues fixed
- [ ] Node.js updated to v20
- [ ] Health check endpoint working
- [ ] Tests passing (npm test exits 0)
- [ ] Structured logging implemented
- [ ] Environment validation working
- [ ] Graceful shutdown implemented
- [ ] App runs successfully with all changes

**Estimated Time:** 3-4 hours  
**Blocker:** None

---

## Phase 2: Docker Optimization ⏳

**Status:** Not Started  
**Objective:** Create production-ready Docker setup with security and optimization

### Tasks

#### 1. Create Multi-Stage Dockerfile
- [ ] Stage 1: Builder (with dev dependencies)
- [ ] Stage 2: Production (only runtime dependencies)
- [ ] Use `node:20-alpine` base image
- [ ] Copy only necessary files to final stage

#### 2. Add Non-Root User
- [ ] Create `nodejs` user and group
- [ ] Change ownership of `/app` directory
- [ ] Switch to non-root user before CMD
- [ ] Test that app still works

#### 3. Add Docker Health Check
- [ ] Add HEALTHCHECK instruction
- [ ] Point to `/api/v1/health` endpoint
- [ ] Configure intervals and retries
- [ ] Test health check works

#### 4. Optimize .dockerignore
- [ ] Exclude all `.env` files (keep .env.example)
- [ ] Exclude `node_modules`
- [ ] Exclude git, tests, docs
- [ ] Exclude credential files
- [ ] Verify image size reduction

#### 5. Create Production docker-compose.yml
- [ ] Remove exposed ports for MongoDB and Redis (internal only)
- [ ] Add resource limits (CPU, memory)
- [ ] Add restart policies (`unless-stopped`)
- [ ] Use named volumes for persistence
- [ ] Add health checks for all services
- [ ] Use environment variable file reference

#### 6. Test Docker Build
- [ ] Build image: `docker build -t sso-auth:test .`
- [ ] Check image size (target: <150MB)
- [ ] Run container locally
- [ ] Test health check: `docker ps` (should show "healthy")
- [ ] Verify app works (hit endpoints)
- [ ] Check running as non-root: `docker exec <container> whoami`

### Phase 2 Success Criteria
- [ ] Multi-stage Dockerfile complete
- [ ] Image size optimized (<150MB)
- [ ] Running as non-root user
- [ ] Health checks working
- [ ] Production docker-compose ready
- [ ] Tested locally and working

**Estimated Time:** 2 hours  
**Blocker:** Phase 1 must be complete

---

## Phase 3: GitHub Actions CI/CD Pipeline ⏳

**Status:** Not Started  
**Objective:** Create automated CI/CD pipeline with GitHub Actions

### Tasks

#### 1. Create Production Workflow File
- [ ] Create `.github/workflows/production-deploy.yml`
- [ ] Define workflow name and triggers
- [ ] Setup environment variables

#### 2. Stage 1: Validate Job
- [ ] Checkout code
- [ ] Setup Node.js 20 with caching
- [ ] Install dependencies (npm ci)
- [ ] Run linting (if available)
- [ ] Run security audit (npm audit)

#### 3. Stage 2: Test Job
- [ ] Depends on validate job
- [ ] Install dependencies
- [ ] Run tests (npm test)
- [ ] Upload test coverage (optional)

#### 4. Stage 3: Build Job
- [ ] Depends on test job
- [ ] Setup Docker Buildx
- [ ] Generate image tags (SHA, version)
- [ ] Build Docker image
- [ ] Tag with multiple versions
- [ ] Use GitHub Actions cache

#### 5. Stage 4: Security Scan Job
- [ ] Depends on build job
- [ ] Run Trivy vulnerability scanner
- [ ] Scan for HIGH/CRITICAL vulnerabilities
- [ ] Fail pipeline if vulnerabilities found
- [ ] Upload SARIF report to GitHub

#### 6. Stage 5: Push to Registry Job
- [ ] Depends on build and scan jobs
- [ ] Login to Docker Hub
- [ ] Push all image tags
- [ ] Verify push successful

#### 7. Stage 6: Deploy to EC2 Job
- [ ] Depends on push job
- [ ] SSH to EC2 instance
- [ ] Pull new image version
- [ ] Update docker-compose.yml
- [ ] Deploy with docker-compose up -d
- [ ] Wait for health check (up to 5 min)
- [ ] Rollback automatically on failure

#### 8. Configure GitHub Secrets
- [ ] DOCKER_USERNAME
- [ ] DOCKER_PASSWORD (Docker Hub access token)
- [ ] EC2_HOST (will be set in Phase 4)
- [ ] EC2_USERNAME (will be set in Phase 4)
- [ ] EC2_SSH_KEY (will be set in Phase 4)

#### 9. Create Rollback Workflow (Optional)
- [ ] Create `.github/workflows/rollback.yml`
- [ ] Manual trigger with image tag input
- [ ] Deploy specified version to EC2

#### 10. Test Pipeline
- [ ] Create test branch
- [ ] Make small change (update README)
- [ ] Push and watch workflow run
- [ ] Verify all stages pass (except deploy - no EC2 yet)

### Phase 3 Success Criteria
- [ ] Complete workflow file created
- [ ] All stages defined (validate, test, build, scan, push, deploy)
- [ ] GitHub secrets configured
- [ ] Pipeline runs successfully (up to push stage)
- [ ] Docker image pushed to Docker Hub
- [ ] Ready for EC2 deployment

**Estimated Time:** 3 hours  
**Blocker:** Phase 2 must be complete

---

## Phase 4: AWS Infrastructure Setup ⏳

**Status:** Not Started  
**Objective:** Provision AWS resources within free tier

### Prerequisites
- [ ] AWS account created
- [ ] Billing alerts configured
- [ ] Credit card added (required, but won't be charged)

### Tasks

#### 1. Setup Billing Alerts (CRITICAL)
- [ ] Enable billing alerts in AWS Console
- [ ] Create CloudWatch billing alarm ($1 threshold)
- [ ] Create AWS Budget ($1 monthly limit)
- [ ] Configure email notifications
- [ ] Verify alert email received

#### 2. Launch EC2 Instance
- [ ] Choose region (us-east-1 recommended)
- [ ] Select AMI: Ubuntu 22.04 LTS or Amazon Linux 2023
- [ ] Instance type: **t2.micro** (only free tier option)
- [ ] Create new key pair (download .pem file - save securely!)
- [ ] Configure instance details (default VPC okay)
- [ ] Storage: 20 GB GP2 (within 30GB free tier)
- [ ] Add tags: Name=SSO-Auth-Server

#### 3. Configure Security Group
Create rules:
- [ ] SSH (22) - Source: My IP only (security)
- [ ] Custom TCP (3000) - Source: 0.0.0.0/0 (app access)
- [ ] Optional: HTTP (80) - Source: 0.0.0.0/0 (future)
- [ ] Optional: HTTPS (443) - Source: 0.0.0.0/0 (future)

**Important:** MongoDB (27017) and Redis (6379) should NOT be exposed - they run in Docker internal network only.

#### 4. Allocate Elastic IP
- [ ] Allocate Elastic IP
- [ ] Associate with EC2 instance
- [ ] **Critical:** Always keep associated or release it (charges $0.005/hr if detached)
- [ ] Note down the IP address (needed for GitHub Secrets)

#### 5. Connect to EC2
```bash
# Change key permissions (if on Windows, skip this)
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@<ELASTIC_IP>
# OR for Amazon Linux:
ssh -i your-key.pem ec2-user@<ELASTIC_IP>
```

#### 6. Install Docker on EC2
```bash
# Update system
sudo apt update && sudo apt upgrade -y  # Ubuntu
# OR
sudo yum update -y  # Amazon Linux

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again for group to take effect
exit
# SSH back in

# Verify Docker works
docker --version
docker ps
```

#### 7. Install Docker Compose
```bash
# Install Docker Compose v2
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

#### 8. Setup Application Directory
```bash
# Create app directory
mkdir -p ~/sso-auth-microservice
cd ~/sso-auth-microservice

# Create .env.production file (we'll populate it later)
touch .env.production

# Generate RSA keys for JWT
mkdir -p config/keys
cd config/keys

# Generate private key
openssl genrsa -out jwtPrivate.key 2048

# Generate public key
openssl rsa -in jwtPrivate.key -pubout -out jwtPublic.key

# Secure permissions
chmod 600 jwtPrivate.key
chmod 644 jwtPublic.key

cd ~/sso-auth-microservice
```

#### 9. Setup MongoDB
**Option A: MongoDB Atlas (Recommended)**
- [ ] Go to https://www.mongodb.com/cloud/atlas/register
- [ ] Create free M0 cluster (512MB, free forever)
- [ ] Whitelist IP: 0.0.0.0/0 (allow from anywhere)
- [ ] Create database user
- [ ] Get connection string
- [ ] Add to .env.production

**Option B: Self-hosted on EC2 (Alternative)**
- [ ] MongoDB will run in Docker via docker-compose
- [ ] Uses local storage (within 30GB limit)
- [ ] Less reliable (single point of failure)

#### 10. Setup Redis
- [ ] Redis runs in Docker via docker-compose
- [ ] Configured in docker-compose.yml
- [ ] Data persists in Docker volume

#### 11. Configure Environment Variables
Edit `~/sso-auth-microservice/.env.production`:
```bash
NODE_ENV=production
PORT=3000
MONGO_DB_URL=<MongoDB Atlas connection string or mongodb://mongodb:27017/sso-auth>
REDIS_DB_URL=redis://redis-stack:6379
# ... (copy all required vars from .env.example)
```

#### 12. Create docker-compose.yml on EC2
- [ ] Copy production docker-compose.yml to EC2
- [ ] Update image tag (will be updated by CI/CD)
- [ ] Verify all services defined

#### 13. Update GitHub Secrets
Add to GitHub:
- [ ] EC2_HOST = `<Your Elastic IP>`
- [ ] EC2_USERNAME = `ubuntu` or `ec2-user`
- [ ] EC2_SSH_KEY = `<Content of your .pem file>`

#### 14. Optional: Install CloudWatch Agent
- [ ] Download CloudWatch agent
- [ ] Configure basic metrics
- [ ] Start agent
- [ ] Verify metrics in CloudWatch console

### Phase 4 Success Criteria
- [ ] EC2 instance running
- [ ] Security group configured properly
- [ ] Elastic IP allocated and associated
- [ ] Docker and Docker Compose installed
- [ ] RSA keys generated on server
- [ ] MongoDB setup (Atlas or self-hosted)
- [ ] .env.production configured
- [ ] GitHub Secrets updated
- [ ] Billing alerts working
- [ ] Can SSH to instance successfully

**Estimated Time:** 2-3 hours  
**Blocker:** Phase 3 must be complete  
**⚠️ Cost Risk:** Ensure only t2.micro used, Elastic IP always attached

---

## Phase 5: Monitoring Setup ⏳

**Status:** Not Started  
**Objective:** Setup monitoring with CloudWatch and learn Prometheus/Grafana

### CloudWatch Basic Monitoring

#### 1. Configure CloudWatch Alarms
- [ ] CPU Utilization > 80% for 5 minutes
- [ ] Memory Utilization > 80% (requires CloudWatch agent)
- [ ] Disk Utilization > 80%
- [ ] Status Check Failed

#### 2. Setup CloudWatch Logs
- [ ] Install CloudWatch agent (if not done in Phase 4)
- [ ] Configure log groups
- [ ] Stream application logs
- [ ] Set log retention to 7 days (free tier)

#### 3. Create CloudWatch Dashboard
- [ ] EC2 metrics (CPU, Network, Disk)
- [ ] Application health check status
- [ ] Request count (custom metric)

### Prometheus & Grafana (Learning)

#### 4. Install Prometheus
- [ ] Add Prometheus to docker-compose.yml
- [ ] Configure prometheus.yml
- [ ] Scrape targets: Node Exporter, Application

#### 5. Add Application Metrics
- [ ] Install prom-client in Node.js app
- [ ] Expose /metrics endpoint
- [ ] Add custom metrics (requests, latency, errors)

#### 6. Install Grafana
- [ ] Add Grafana to docker-compose.yml
- [ ] Configure Prometheus as data source
- [ ] Create dashboards

#### 7. Setup Alerts (Prometheus)
- [ ] Alert on high error rate
- [ ] Alert on service down
- [ ] Alert on high response time

### Phase 5 Success Criteria
- [ ] CloudWatch alarms configured
- [ ] CloudWatch logs streaming
- [ ] Basic dashboard created
- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards created
- [ ] Alerts working

**Estimated Time:** 2-3 hours  
**Blocker:** Phase 4 must be complete  
**⚠️ Cost Risk:** CloudWatch logs >5GB/month costs money

---

## Phase 6: Testing & Validation ⏳

**Status:** Not Started  
**Objective:** End-to-end testing and documentation

### Tasks

#### 1. End-to-End Deployment Test
- [ ] Make code change in dev branch
- [ ] Push to GitHub
- [ ] Watch CI/CD pipeline run
- [ ] Verify image built and pushed
- [ ] Verify deployment to EC2
- [ ] Verify health check passes
- [ ] Test application endpoints

#### 2. Manual Testing
- [ ] Test user registration
- [ ] Test user login
- [ ] Test SSO flow
- [ ] Test Google OAuth
- [ ] Test session management
- [ ] Test logout
- [ ] Test protected routes

#### 3. Rollback Testing
- [ ] Deploy working version
- [ ] Deploy intentionally broken version
- [ ] Verify automatic rollback
- [ ] Test manual rollback workflow

#### 4. Load Testing (Optional)
- [ ] Install Apache Bench or k6
- [ ] Run load test (100 concurrent users)
- [ ] Monitor metrics during load
- [ ] Check for memory leaks
- [ ] Verify no crashes

#### 5. Security Testing
- [ ] Run npm audit (should be 0 HIGH/CRITICAL)
- [ ] Trivy scan (should pass)
- [ ] Check no secrets in logs
- [ ] Verify HTTPS headers (if using Helmet)
- [ ] Test rate limiting (if implemented)

#### 6. Documentation
- [ ] Complete `docs/deployment/aws-setup-guide.md`
- [ ] Complete `docs/deployment/troubleshooting.md`
- [ ] Create `docs/deployment/architecture.md`
- [ ] Update main README.md with deployment info
- [ ] Document all GitHub Secrets needed
- [ ] Document EC2 setup steps

#### 7. Cost Verification
- [ ] Check AWS Billing Dashboard (should be $0.00)
- [ ] Verify only 1 t2.micro running
- [ ] Verify Elastic IP is attached
- [ ] Verify no other resources created
- [ ] Document any charges found

### Phase 6 Success Criteria
- [ ] Complete end-to-end test successful
- [ ] All manual tests passing
- [ ] Rollback tested and working
- [ ] No security vulnerabilities
- [ ] Complete documentation
- [ ] AWS cost is $0.00
- [ ] Application production-ready

**Estimated Time:** 2 hours  
**Blocker:** Phase 5 must be complete

---

## Known Issues & Fixes Tracking

### High Priority (Security) 🔴

| Issue | Status | Priority | Fix Date |
|-------|--------|----------|----------|
| Private keys in git | ❌ Not Fixed | HIGH | - |
| Credentials file committed | ❌ Not Fixed | HIGH | - |
| Secrets in docker-compose | ❌ Not Fixed | HIGH | - |
| Old Node.js v16 (EOL) | ❌ Not Fixed | HIGH | - |

### Medium Priority (Production Readiness) 🟡

| Issue | Status | Priority | Fix Date |
|-------|--------|----------|----------|
| No test suite | ❌ Not Fixed | MEDIUM | - |
| No health check endpoint | ❌ Not Fixed | MEDIUM | - |
| No graceful shutdown | ❌ Not Fixed | MEDIUM | - |
| console.log for logging | ❌ Not Fixed | MEDIUM | - |
| No env validation | ❌ Not Fixed | MEDIUM | - |

### Low Priority (Optimization) 🟢

| Issue | Status | Priority | Fix Date |
|-------|--------|----------|----------|
| Large Docker image | ❌ Not Fixed | LOW | - |
| No structured logging | ❌ Not Fixed | LOW | - |
| Single-stage Dockerfile | ❌ Not Fixed | LOW | - |

---

## AWS Cost Tracking

### Current Month

| Date | Service | Cost | Running Total | Notes |
|------|---------|------|---------------|-------|
| - | - | $0.00 | $0.00 | Not deployed yet |

**Target:** $0.00 monthly cost (stay in free tier)

### Resource Usage

| Resource | Free Tier Limit | Current Usage | Status |
|----------|----------------|---------------|--------|
| EC2 t2.micro | 750 hrs/month | 0 hrs | ✅ Not started |
| EBS Storage | 30 GB | 0 GB | ✅ Not started |
| Data Transfer Out | 15 GB/month | 0 GB | ✅ Not started |
| CloudWatch Metrics | 10 custom | 0 | ✅ Not started |
| CloudWatch Alarms | 10 alarms | 0 | ✅ Not started |

---

## Troubleshooting Log

### Issues Encountered
*This section will be updated as we encounter and solve issues*

**Example format:**
```
Date: 2026-09-10
Issue: Docker build fails with "npm ERR! code EACCES"
Solution: Changed to non-root user, fixed permissions
Reference: Link to documentation or Stack Overflow
```

---

## Learning Notes

### Key Learnings
*Track important learnings throughout the deployment process*

- **Docker Multi-Stage Builds:** Reduced image from 400MB to 100MB
- **GitHub Actions Caching:** Saved 2 minutes per pipeline run
- *More will be added as we progress...*

---

## Success Criteria Summary

### Must Have ✅
- [ ] All security issues fixed
- [ ] Automated CI/CD pipeline working
- [ ] Application deployed and accessible on EC2
- [ ] Health checks passing
- [ ] Basic monitoring setup
- [ ] Zero AWS charges (free tier only)
- [ ] Complete documentation

### Nice to Have ⭐
- [ ] Prometheus & Grafana dashboards
- [ ] Automated rollback working
- [ ] Load testing completed
- [ ] Complete troubleshooting guide

---

## Timeline

- **Start Date:** 2026-09-10
- **Target Completion:** 2026-09-24 (2 weeks, working part-time)
- **Current Phase:** Phase 0 - Setup & Planning (80% complete)
- **Next Milestone:** Complete Phase 0 by 2026-09-10
- **Next User Action:** Review and confirm plan

---

## Quick Reference

### Important Links
- **GitHub Repo:** https://github.com/KmrAnish04/Authentication-Authorization-Microservice
- **Docker Hub:** https://hub.docker.com/r/anish123/ (to be created)
- **AWS Console:** https://console.aws.amazon.com
- **MongoDB Atlas:** https://cloud.mongodb.com (if using)

### Key Commands
```bash
# Local development
npm run start:local

# Docker build
docker build -t sso-auth:latest .

# Docker compose up
docker-compose up -d

# Deploy (will be automated)
git push origin main
```

### GitHub Secrets Needed
- DOCKER_USERNAME
- DOCKER_PASSWORD
- EC2_HOST
- EC2_USERNAME
- EC2_SSH_KEY

---

## AI Agent Instructions

**For AI Agents working on this project:**

1. **Always check this file first** to understand current phase and progress
2. **Update checkboxes** as tasks are completed (use [x] for done)
3. **Update status** when phase changes (⏳ → ✅ → ✨)
4. **Add troubleshooting entries** when issues are encountered and solved
5. **Update cost tracking** if any AWS charges occur
6. **Add learning notes** for important discoveries
7. **Keep timeline updated** with actual completion dates

**Status Emoji Guide:**
- ⏳ Not Started
- ✅ In Progress
- ✨ Completed
- 🔴 Blocked
- ⚠️ Warning/Issue

---

**END OF DEPLOYMENT PLAN**

*This is a living document. Update it as the project progresses.*
