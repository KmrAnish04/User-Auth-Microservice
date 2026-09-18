# Load Testing Quick Start

## 🚀 Quick Commands

### Using k6 (Recommended)

```bash
# Install k6
choco install k6  # Windows
brew install k6   # Mac

# Run tests
k6 run load_test.js                          # Smoke test (1 min)
k6 run --env TEST=load load_test.js          # Load test (16 min)
k6 run --env TEST=stress load_test.js        # Stress test (30 min)
k6 run --env TEST=spike load_test.js         # Spike test (8 min)
k6 run --env TEST=soak load_test.js          # Soak test (30 min)
```

### Using PowerShell (No installation)

```powershell
# Run tests
.\load_test.ps1                                           # Smoke test
.\load_test.ps1 -TestType load -Concurrency 20           # Load test
.\load_test.ps1 -TestType stress                         # Stress test
.\load_test.ps1 -TestType spike                          # Spike test
```

---

## 📊 Watch Results in Real-Time

**Open Grafana:** http://52.4.118.129:3001
- Username: `admin`
- Password: `sso@123`

**Watch these metrics:**
- Request Rate (increasing during test)
- Response Time P95 (should stay < 2s)
- HTTP Status Codes (mostly 200s)
- Memory Usage (stable)

---

## ✅ Test Decision Tree

```
Just deployed? → Smoke Test (1 min)
    ↓
Planning release? → Load Test (16 min)
    ↓
Need capacity planning? → Stress Test (30 min)
    ↓
Marketing campaign soon? → Spike Test (8 min)
    ↓
Checking for leaks? → Soak Test (30 min)
```

---

## 🎯 Success Criteria

| Metric | Target | Current (t2.micro) |
|--------|--------|-------------------|
| **Request Rate** | > 10 req/s | ~20 req/s |
| **P95 Response** | < 2000ms | ~800ms |
| **Error Rate** | < 1% | 0% |
| **Success Rate** | > 99% | 100% |

---

## 📚 Full Documentation

See: `docs/testing/LOAD_TESTING_GUIDE.md`
