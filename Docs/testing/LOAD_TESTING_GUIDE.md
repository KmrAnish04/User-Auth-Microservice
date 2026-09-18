# Load Testing Guide

## Overview

This guide explains how to perform comprehensive load testing on the SSO Auth Microservice to ensure it can handle production traffic.

---

## Test Types Explained

### 1. **Smoke Test** 🔍
**Purpose:** Verify system works under minimal load

**Scenario:**
- 1 virtual user
- 1 minute duration
- Verify all endpoints respond correctly

**When to run:** After every deployment

**Command:**
```bash
k6 run load_test.js
# OR
pwsh load_test.ps1 -TestType smoke
```

**Expected Results:**
- ✅ 0% error rate
- ✅ All endpoints return expected status codes
- ✅ Response time < 500ms

---

### 2. **Load Test** 📊
**Purpose:** Test system under expected production load

**Scenario:**
- Ramp up from 0 to 20 users over 2 minutes
- Maintain 20 users for 5 minutes
- Ramp down to 0 over 2 minutes

**When to run:** Before major releases

**Command:**
```bash
k6 run --env TEST=load load_test.js
# OR
pwsh load_test.ps1 -TestType load -Concurrency 20 -DurationSeconds 300
```

**Expected Results:**
- ✅ < 1% error rate
- ✅ P95 response time < 2 seconds
- ✅ Stable memory usage
- ✅ No memory leaks

---

### 3. **Stress Test** 💪
**Purpose:** Find the breaking point of the system

**Scenario:**
- Gradually increase load beyond normal capacity
- 20 → 50 → 100 virtual users
- Monitor when system starts degrading

**When to run:** Quarterly or before scaling decisions

**Command:**
```bash
k6 run --env TEST=stress load_test.js
# OR
pwsh load_test.ps1 -TestType stress
```

**What to watch:**
- CPU usage approaching 100%
- Response times increasing exponentially
- Error rate > 5%
- Memory consumption

**Expected Results:**
- ✅ System remains stable until 50+ users
- ✅ Graceful degradation (slow responses, not crashes)
- ⚠️ Identify bottlenecks (CPU, memory, database)

---

### 4. **Spike Test** ⚡
**Purpose:** Test system's ability to handle sudden traffic surges

**Scenario:**
- Normal load: 5 users
- Sudden spike: 100 users for 1 minute
- Back to normal: 5 users

**When to run:** Before marketing campaigns or launches

**Command:**
```bash
k6 run --env TEST=spike load_test.js
# OR
pwsh load_test.ps1 -TestType spike
```

**Expected Results:**
- ✅ System survives the spike
- ✅ Auto-scaling triggers (if configured)
- ✅ Recovers quickly after spike ends
- ⚠️ Some requests may timeout during spike (acceptable)

---

### 5. **Soak Test** 🌊
**Purpose:** Detect memory leaks and stability issues over time

**Scenario:**
- 20 users for 30 minutes (or longer)
- Constant moderate load

**When to run:** Before major releases

**Command:**
```bash
k6 run --env TEST=soak load_test.js
# (PowerShell version not recommended for long duration)
```

**What to watch:**
- Memory usage increasing over time (memory leak)
- Response times degrading over time
- Error rate increasing gradually

**Expected Results:**
- ✅ Stable memory usage (flat line)
- ✅ Consistent response times
- ✅ No degradation over time

---

### 6. **Breakpoint Test** 🔨
**Purpose:** Find exact limit where system breaks

**Scenario:**
- Gradually increase request rate
- 10 → 50 → 100 → 200 → 400 → 800 req/s
- Stop when error rate > 10%

**When to run:** Capacity planning

**Command:**
```bash
k6 run --env TEST=breakpoint load_test.js
```

**Expected Results:**
- ✅ Document exact breaking point
- ✅ Plan capacity based on findings
- Example: "System handles 300 req/s before degrading"

---

## Installation

### Option 1: k6 (Recommended)

**Windows:**
```powershell
# Using Chocolatey
choco install k6

# Or winget
winget install k6
```

**Mac:**
```bash
brew install k6
```

**Linux:**
```bash
sudo snap install k6
```

### Option 2: PowerShell (No installation needed)

Already included in `load_test.ps1`

---

## Running Tests

### k6 Tests

**Basic:**
```bash
k6 run load_test.js
```

**Specific test type:**
```bash
k6 run --env TEST=load load_test.js
k6 run --env TEST=stress load_test.js
k6 run --env TEST=spike load_test.js
```

**Custom URL:**
```bash
k6 run --env BASE_URL=http://localhost:3000 load_test.js
```

**Save results:**
```bash
k6 run --out json=results.json load_test.js
```

### PowerShell Tests

**Smoke test:**
```powershell
.\load_test.ps1
```

**Load test:**
```powershell
.\load_test.ps1 -TestType load -Concurrency 20 -DurationSeconds 300
```

**Stress test:**
```powershell
.\load_test.ps1 -TestType stress
```

**Custom URL:**
```powershell
.\load_test.ps1 -BaseUrl "http://localhost:3000" -TestType load
```

---

## Interpreting Results

### Key Metrics

**1. Request Rate (req/s)**
- Measures throughput
- Higher is better
- **Target:** > 100 req/s for t2.micro

**2. Response Time**
- P50: Median (50% of requests)
- P95: 95th percentile (95% of requests)
- P99: 99th percentile (slowest 1%)

**Targets:**
- P50 < 500ms ✅
- P95 < 2000ms ✅
- P99 < 5000ms ✅

**3. Error Rate**
- HTTP errors / Total requests
- **Target:** < 1% ✅

**4. Success Rate**
- Successful requests / Total requests
- **Target:** > 99% ✅

---

## Monitoring During Tests

### 1. Watch Grafana Dashboard

**Open:** http://52.4.118.129:3001

**Watch these panels:**
- Request Rate (should increase during test)
- Response times (P95 should stay low)
- Status codes (mostly 200s)
- Memory usage (should be stable)
- Active connections (should match test VUs)

### 2. Watch Docker Stats

```bash
# SSH to EC2
docker stats sso-auth-app

# Watch:
# - CPU % (should stay < 90%)
# - Memory usage (should be stable)
# - Network I/O (should increase)
```

### 3. Watch CloudWatch

**Go to:** AWS Console → CloudWatch → Dashboards

**Watch:**
- EC2 CPU utilization
- Network in/out
- Status checks

---

## Performance Baselines (t2.micro)

Based on testing, here are expected results:

| Metric | Smoke | Load | Stress | Spike |
|--------|-------|------|--------|-------|
| **Users** | 1 | 20 | 50-100 | 5→100→5 |
| **Request Rate** | 1 req/s | 10-20 req/s | 50+ req/s | 100+ req/s |
| **P95 Response** | <500ms | <1000ms | <3000ms | <5000ms |
| **Error Rate** | 0% | <1% | <5% | <10% |
| **CPU Usage** | 5% | 30-40% | 70-90% | 100% |
| **Memory** | 200MB | 250MB | 300MB | 350MB |

---

## Troubleshooting

### High Error Rate (> 5%)

**Possible causes:**
1. **Database connection pool exhausted**
   - Check MongoDB Atlas connections
   - Increase connection pool size

2. **Redis overloaded**
   - Check Redis memory usage
   - Increase Redis resources

3. **CPU throttling**
   - EC2 t2.micro CPU credits exhausted
   - Upgrade to t3.micro (unlimited credits)

4. **Network bottleneck**
   - Check security group rules
   - Check EC2 network limits

### Slow Response Times (P95 > 5s)

**Possible causes:**
1. **Slow database queries**
   - Add indexes to MongoDB
   - Check slow query logs

2. **Blocking I/O**
   - Check for synchronous operations
   - Use async/await properly

3. **Memory pressure**
   - Garbage collection taking too long
   - Increase heap size or EC2 memory

### Memory Leaks (Increasing over time)

**Detect:**
```bash
# Run soak test and watch memory
docker stats sso-auth-app
```

**If memory keeps increasing:**
1. Check for unclosed connections
2. Check for event listener leaks
3. Review session management
4. Use Node.js profiler

---

## Best Practices

### 1. Test in Stages

Don't jump straight to stress testing:
```
Smoke → Load → Stress → Spike → Soak → Breakpoint
```

### 2. Test After Changes

Run smoke test after:
- Code changes
- Config changes
- Infrastructure changes

### 3. Baseline Before Optimization

Always establish baseline before making performance improvements.

### 4. Monitor During Tests

Watch Grafana + CloudWatch during tests to correlate load with metrics.

### 5. Document Results

Keep a log of test results:
```
Date: 2026-09-17
Test: Load Test
Duration: 10 minutes
Users: 20
Result: ✅ Pass
P95: 890ms
Error Rate: 0.2%
Notes: After adding Prometheus metrics
```

### 6. Test Realistic Scenarios

Include:
- Login flows
- Token refresh
- Failed authentication
- Concurrent sessions

---

## Advanced: Testing with Real User Flows

Extend `load_test.js` to test authentication:

```javascript
export default function () {
  // 1. Register user
  const registerRes = http.post(`${BASE_URL}/api/v1/auth/register`, {
    email: `user${__VU}@test.com`,
    password: 'Test123!',
  });

  // 2. Login
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, {
    email: `user${__VU}@test.com`,
    password: 'Test123!',
  });

  const token = JSON.parse(loginRes.body).token;

  // 3. Access protected endpoint
  const headers = { Authorization: `Bearer ${token}` };
  http.get(`${BASE_URL}/api/v1/user/profile`, { headers });

  sleep(1);
}
```

---

## CI/CD Integration

### Add to GitHub Actions

```yaml
# .github/workflows/load-test.yaml
name: Load Test

on:
  workflow_dispatch:  # Manual trigger
  schedule:
    - cron: '0 2 * * 0'  # Weekly at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install k6
        run: |
          sudo snap install k6
      
      - name: Run smoke test
        run: |
          k6 run --env BASE_URL=${{ secrets.EC2_URL }} load_test.js
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: summary.json
```

---

## Summary

**For regular testing:**
1. **After deployment:** Smoke test (1 min)
2. **Before release:** Load test (10 min)
3. **Monthly:** Stress test (20 min)
4. **Before campaigns:** Spike test (5 min)

**Expected t2.micro capacity:**
- Normal load: 20 concurrent users
- Peak load: 50 concurrent users
- Breakpoint: 100 concurrent users

**When to scale up:**
- Error rate > 1% at normal load
- P95 response time > 2s
- CPU usage consistently > 80%
