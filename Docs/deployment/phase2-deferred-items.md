# Phase 2 - Deferred Items & Future Improvements

**Created:** 2026-09-12  
**Source:** Friend's Docker Compose review feedback

This document tracks improvements identified during Phase 2 that should be addressed in future phases.

---

## 🟡 **DO LATER - Phase 3/4 (Important)**

### 1. Better Health Check Endpoints

**Current State:**
- Single `/api/v1/health` endpoint
- Returns basic status only
- Docker uses this for healthcheck

**Improvement Needed:**
```
/api/v1/liveness   → Is process alive?
/api/v1/readiness  → Can serve requests? (check MongoDB/Redis)
```

**Benefits:**
- Kubernetes/orchestration compatibility
- Better failure detection
- Separate process vs dependency health

**Implementation:**
```javascript
// routes/health.route.js

// Liveness: Just check if process is running
router.get('/liveness', (req, res) => {
    res.status(200).json({ status: 'alive' });
});

// Readiness: Check dependencies
router.get('/readiness', async (req, res) => {
    try {
        // Check MongoDB
        await mongoose.connection.db.admin().ping();
        
        // Check Redis
        await redisClient.ping();
        
        res.status(200).json({ 
            status: 'ready',
            mongodb: 'connected',
            redis: 'connected'
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'not ready',
            error: error.message 
        });
    }
});
```

**Update Dockerfile:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/readiness', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1
```

**Phase:** Phase 3 or 4  
**Priority:** Medium  
**Time:** 30 minutes

---

### 2. Verify Resource Limits Work on EC2

**Current State:**
- Resource limits defined in docker-compose.prod.yml
- Not verified if they're actually enforced

**Verification Needed:**
```bash
# After deploying to EC2
docker inspect sso-auth-app | grep -A 20 "HostConfig"

# Check actual limits
docker stats sso-auth-app

# Test under load
ab -n 1000 -c 50 http://localhost:3000/api/v1/health
```

**Expected:**
- Container should NOT exceed memory limit
- Container should NOT exceed CPU limit
- If exceeded, container should be killed/restarted

**Phase:** Phase 4 (AWS Deployment)  
**Priority:** Medium  
**Time:** 15 minutes

---

### 3. Winston Logs to Stdout (Not Files)

**Current State:**
- Winston logs to both console AND files
- Files: `logs/error.log`, `logs/combined.log`

**Why This Matters in Containers:**
```
Container logs should go to stdout
      ↓
Docker captures stdout
      ↓
docker logs / CloudWatch / Loki
      ↓
Centralized logging
```

**Problem with File Logs:**
```
Winston → /app/logs/app.log
      ↓
Inside container filesystem
      ↓
Container deleted → logs gone
      ↓
Must mount volumes for logs (bad practice)
```

**Improvement:**
```javascript
// src/utils/logger.js

// Production: ONLY stdout (JSON)
if (process.env.NODE_ENV === 'production') {
    transports.push(
        new winston.transports.Console({
            format: logFormat, // JSON format
        })
    );
} else {
    // Development: Console + Files
    transports.push(
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    );
}
```

**Verification:**
```bash
# Logs should appear in docker logs
docker logs sso-auth-app

# Should see JSON structured logs
docker logs sso-auth-app 2>&1 | jq .
```

**Phase:** Phase 3  
**Priority:** Medium  
**Time:** 15 minutes

---

## 🟢 **FUTURE / POST-LEARNING (Advanced)**

### 4. MongoDB Backup Strategy

**Current State:**
- MongoDB data persists in Docker volume
- NO backups configured
- Volume loss = data loss

**Reality Check:**
```
Docker volume ≠ backup
      ↓
EC2 disk failure
      ↓
mongo-data volume gone
      ↓
💀 Database permanently lost
```

**Proper Backup Strategy:**

**Option A: MongoDB Atlas (Recommended)**
- Automated backups included
- Point-in-time recovery
- Geographic redundancy
- Free tier: M0 (512MB)

**Option B: Self-Managed Backups**
```bash
# Cron job on EC2
0 2 * * * docker exec sso-mongodb mongodump --out /backup --gzip

# Upload to S3
aws s3 sync /backup s3://my-mongo-backups/$(date +%Y%m%d)/

# Retention policy
# Keep: Daily for 7 days, Weekly for 4 weeks, Monthly for 12 months
```

**Restore Testing:**
```bash
# Must practice restoring!
docker exec -i sso-mongodb mongorestore --gzip --archive < backup.gz
```

**Phase:** Phase 5 (Post-deployment)  
**Priority:** HIGH for real production  
**Time:** 2-3 hours for complete setup

---

### 5. Redis Persistence Decision

**Current State:**
- Redis has persistent volume: `redis-data:/data`

**Question: Does your app NEED Redis persistence?**

**If Redis stores:**
- ✅ **Sessions** → Need persistence (users stay logged in)
- ✅ **Rate limit counters** → Need persistence (prevent reset)
- ❌ **Cache only** → Don't need persistence (can rebuild)
- ❌ **Temporary data** → Don't need persistence

**Your App (from code review):**
```javascript
// express-session with Redis store
// SSO tokens
// User sessions
```

**Verdict:** ✅ **Need persistence** for session management

**Keep current configuration:**
```yaml
redis:
  volumes:
    - redis-data:/data
```

**But consider:**
- Redis RDB snapshots (for backups)
- AOF persistence (more durable)

**Configuration:**
```bash
# In docker-compose.prod.yml
redis:
  command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
```

**Phase:** Phase 4  
**Priority:** Low (current setup is acceptable)  
**Time:** 30 minutes

---

### 6. Move MongoDB to MongoDB Atlas

**Current State:**
- MongoDB running in Docker container on EC2

**Why Atlas is Better for Production:**
```
Self-Managed MongoDB          MongoDB Atlas
        ↓                           ↓
Manual backups              Auto backups
Single server               Replication
Manual scaling              Auto scaling
Manual upgrades             Auto upgrades
Manual monitoring           Built-in monitoring
Manual security             Security by default
Your responsibility         Managed by MongoDB
```

**Cost:**
- M0 (Free): 512MB storage, shared CPU
- M2 ($9/month): 2GB, dedicated
- M10 ($57/month): 10GB, production-grade

**Migration Plan:**
1. Create Atlas account
2. Create M0 free cluster
3. Update connection string in `.env.production`
4. Migrate data: `mongodump` → `mongorestore`
5. Remove MongoDB from docker-compose.yml

**Phase:** Post-learning (optional)  
**Priority:** Recommended for real production  
**Time:** 1 hour

---

### 7. Move Redis to AWS ElastiCache

**Current State:**
- Redis running in Docker container on EC2

**Why ElastiCache is Better:**
```
Self-Managed Redis          ElastiCache
        ↓                       ↓
Manual failover            Auto failover
Single node                Multi-AZ replication
Manual backups             Auto backups
Manual patching            Auto patching
```

**Cost:**
- ❌ **NOT in free tier**
- cache.t3.micro: ~$12/month minimum
- cache.t4g.micro: ~$10/month minimum

**Verdict for Learning:**
- ✅ Keep self-hosted for now (free)
- 🟢 Migrate to ElastiCache later (real production)

**Phase:** Post-learning  
**Priority:** Nice-to-have  
**Time:** 1 hour

---

### 8. Centralized Logging (CloudWatch)

**Current State:**
- Logs in containers: `docker logs`
- Lost when container removed
- No aggregation across services

**Proper Logging Architecture:**
```
App Container (stdout)
       ↓
Docker Log Driver
       ↓
CloudWatch Logs
       ↓
CloudWatch Insights / Grafana
       ↓
Alerts / Dashboards
```

**Implementation:**

**Option A: Docker awslogs driver**
```yaml
# docker-compose.prod.yml
app:
  logging:
    driver: awslogs
    options:
      awslogs-region: us-east-1
      awslogs-group: /ecs/sso-auth
      awslogs-stream: app
```

**Option B: CloudWatch Agent**
```bash
# Install on EC2
wget https://s3.amazonaws.com/amazoncloudwatch-agent/...
sudo ./install.sh

# Configure
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s -c file:/opt/aws/cloudwatch-config.json
```

**Cost:**
- Free tier: 5GB ingestion/month
- After: $0.50/GB

**Phase:** Phase 5  
**Priority:** Medium  
**Time:** 2 hours

---

### 9. Metrics & Monitoring (Prometheus + Grafana)

**Current State:**
- No application metrics
- No visualization

**Proper Monitoring Stack:**
```
Node.js App (prom-client)
       ↓
/metrics endpoint
       ↓
Prometheus (scraper)
       ↓
Grafana (visualization)
       ↓
Dashboards + Alerts
```

**Metrics to Track:**
- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Active connections
- MongoDB query time
- Redis hit rate
- Memory usage
- CPU usage

**Implementation:**
```javascript
// Install
npm install prom-client

// src/utils/metrics.js
const client = require('prom-client');

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status']
});

// Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestDuration.observe({
            method: req.method,
            route: req.route?.path || req.path,
            status: res.statusCode
        }, duration);
    });
    next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
});
```

**Phase:** Phase 5  
**Priority:** Medium  
**Time:** 3-4 hours

---

### 10. Read-Only Filesystem

**Current State:**
- Container has full write access

**Security Improvement:**
```yaml
app:
  read_only: true
  tmpfs:
    - /tmp
```

**Why?**
- Prevents malicious code from writing to filesystem
- Reduces attack surface
- Industry security best practice

**Challenge:**
- Must identify all write locations
- Must use tmpfs for temporary writes
- Winston file logs won't work (another reason for stdout)

**Phase:** Advanced security hardening  
**Priority:** Low (significant effort)  
**Time:** 2-3 hours

---

## 📋 **CHECKLIST FOR FUTURE PHASES**

### Phase 3 (CI/CD)
- [ ] Winston stdout logs (verify/fix)
- [ ] Better healthcheck endpoints (liveness/readiness)

### Phase 4 (AWS Deployment)
- [ ] Verify resource limits on EC2
- [ ] Test Redis persistence behavior
- [ ] Test graceful shutdown in production

### Phase 5 (Monitoring)
- [ ] MongoDB backup strategy
- [ ] CloudWatch logging integration
- [ ] Basic metrics (optional)

### Phase 6 (Testing)
- [ ] Verify all deferred items
- [ ] Document final architecture

### Post-Learning (Optional)
- [ ] Migrate to MongoDB Atlas
- [ ] Consider ElastiCache (if budget allows)
- [ ] Advanced monitoring (Prometheus/Grafana)
- [ ] Read-only filesystem security
- [ ] Advanced observability (tracing)

---

## 🎯 **PRIORITY SUMMARY**

**Must Do Eventually:**
- 🔴 MongoDB backups (Phase 5)
- 🔴 CloudWatch logs (Phase 5)

**Should Do:**
- 🟡 Better healthchecks (Phase 3)
- 🟡 Verify resource limits (Phase 4)
- 🟡 Winston stdout only (Phase 3)

**Nice to Have:**
- 🟢 MongoDB Atlas migration (Post-learning)
- 🟢 Prometheus metrics (Phase 5)
- 🟢 ElastiCache (Post-learning)

**Advanced/Future:**
- ⚪ Read-only filesystem
- ⚪ Advanced tracing
- ⚪ Multi-region deployment

---

**Last Updated:** 2026-09-12  
**Will Review:** After each phase completion
