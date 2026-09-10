# AWS Cost Monitoring - Stay in Free Tier

**Objective:** Maintain $0.00 monthly AWS cost by staying within free tier limits

**Last Updated:** 2026-09-10

---

## ⚠️ CRITICAL: How to Avoid AWS Charges

### Golden Rules

1. **ONLY use t2.micro instances** (t2.small costs ~$17/month)
2. **ONLY run 1 EC2 instance** (750 hours = 1 instance for full month)
3. **Keep Elastic IP attached** to running instance (detached = charges)
4. **Never create Load Balancer** (~$16/month minimum)
5. **Never create NAT Gateway** (~$32/month minimum)
6. **Monitor daily** - Check billing dashboard every day first week

---

## Daily Monitoring Checklist

### First Week (Critical)
- [ ] **Day 1:** Check billing dashboard after EC2 launch
- [ ] **Day 2:** Verify only expected resources exist
- [ ] **Day 3:** Check data transfer usage
- [ ] **Day 4:** Verify Elastic IP is attached
- [ ] **Day 5:** Review CloudWatch usage
- [ ] **Day 6:** Check for any unexpected services
- [ ] **Day 7:** Review week 1 total (should be $0.00)

### Ongoing (Weekly)
- [ ] Every Monday: Check AWS Billing Dashboard
- [ ] Every Monday: Review resource usage
- [ ] Every Monday: Verify no new services created

---

## Setup Billing Alerts (DO THIS FIRST!)

### Step 1: Enable Billing Alerts

1. Sign in to AWS Console
2. Click your name → **Account**
3. Scroll to **Billing preferences**
4. ✅ Enable: **Receive Billing Alerts**
5. ✅ Enable: **Receive Free Tier Usage Alerts**
6. Enter your email address
7. Click **Save preferences**

### Step 2: Create CloudWatch Billing Alarm

1. Go to **CloudWatch** service
2. Click **Alarms** → **Create alarm**
3. Click **Select metric**
4. Choose **Billing** → **Total Estimated Charge**
5. Select **USD** currency
6. Click **Select metric**
7. Set conditions:
   - **Threshold type:** Static
   - **Whenever EstimatedCharges is:** Greater than
   - **than:** `1` (USD)
8. Click **Next**
9. Create new SNS topic:
   - **Topic name:** `billing-alerts`
   - **Email:** Your email address
10. Click **Create topic**
11. **Important:** Check your email and **confirm subscription**
12. Click **Next**
13. Alarm name: `billing-alert-1-dollar`
14. Click **Next** → **Create alarm**

**Result:** You'll get email if charges exceed $1.00

### Step 3: Create AWS Budget

1. Go to **AWS Budgets** service
2. Click **Create budget**
3. Choose **Cost budget**
4. Budget setup:
   - **Name:** `free-tier-monthly-budget`
   - **Period:** Monthly
   - **Budget effective dates:** Recurring
   - **Start month:** Current month
   - **Budgeted amount:** `$1.00`
5. Click **Next**
6. Add alert:
   - **Threshold:** 80% of budgeted amount ($0.80)
   - **Email recipients:** Your email
7. Add another alert:
   - **Threshold:** 100% of budgeted amount ($1.00)
   - **Email recipients:** Your email
8. Click **Next** → **Create budget**

**Result:** You'll get emails at $0.80 and $1.00

---

## Free Tier Resources We're Using

### What's Free (and limits)

| Service | Free Tier Limit | Duration | Notes |
|---------|----------------|----------|-------|
| **EC2 t2.micro** | 750 hours/month | 12 months | Only 1 instance |
| **EBS Storage** | 30 GB (General Purpose SSD) | 12 months | Attached to EC2 |
| **Data Transfer** | 15 GB out/month | 12 months | In is always free |
| **Elastic IP** | 1 IP | Always free | If attached to running instance |
| **CloudWatch** | 10 custom metrics | Always free | After 12 months |
| **CloudWatch Logs** | 5 GB ingestion | Always free | After 12 months |
| **CloudWatch Alarms** | 10 alarms | Always free | After 12 months |

### Our Expected Usage

| Resource | Limit | Our Usage | Status |
|----------|-------|-----------|--------|
| EC2 t2.micro | 750 hrs | ~720 hrs (1 instance, 24/7) | ✅ Within limit |
| EBS Storage | 30 GB | 20 GB | ✅ Within limit |
| Data Transfer | 15 GB out | ~2-5 GB (low traffic) | ✅ Within limit |
| CloudWatch Metrics | 10 custom | ~3-5 metrics | ✅ Within limit |
| CloudWatch Alarms | 10 | ~3 alarms | ✅ Within limit |

---

## Services That WILL Cost Money (AVOID!)

### ❌ Never Create These

| Service | Minimum Cost/Month | Why to Avoid |
|---------|-------------------|--------------|
| **Application Load Balancer** | ~$16 | NOT in free tier |
| **Network Load Balancer** | ~$16 | NOT in free tier |
| **NAT Gateway** | ~$32 | NOT in free tier |
| **RDS (any size)** | ~$15 | NOT in free tier (use MongoDB Atlas M0) |
| **ElastiCache** | ~$13 | NOT in free tier (use Docker Redis) |
| **Lambda (>1M requests)** | Variable | Free tier: 1M requests/month |

### ⚠️ Watch Out For These

| Item | Cost | How to Avoid |
|------|------|--------------|
| **Elastic IP (detached)** | $0.005/hour (~$3.60/month) | Always keep attached OR release it |
| **EBS Snapshots** | $0.05/GB/month | Delete old snapshots regularly |
| **Data Transfer >15GB** | $0.09/GB | Monitor usage, optimize responses |
| **Additional EC2 instances** | ~$8.50+/month | Run only 1 t2.micro |
| **Larger instance type** | ~$17+/month | ONLY use t2.micro |
| **Stopped instance with EBS** | $0.10/GB/month | Only 30GB free, we're using 20GB |

---

## How to Check Your Bill

### AWS Billing Dashboard

1. Sign in to AWS Console
2. Click your name → **Billing and Cost Management**
3. Check **Month-to-Date Spend** (should say $0.00)
4. Click **Bills** in left sidebar
5. Review current month charges by service
6. Expand each service to see detailed charges

### What $0.00 Looks Like

```
Current Month (September 2026)
Month-to-Date Spend: $0.00

Services:
├─ Amazon EC2: $0.00 (free tier)
├─ Amazon Elastic Compute Cloud: $0.00 (free tier)
└─ Amazon CloudWatch: $0.00 (free tier)

Total: $0.00
```

### What a Problem Looks Like

```
Current Month (September 2026)
Month-to-Date Spend: $16.43

Services:
├─ Amazon EC2: $0.00 (free tier)
├─ Elastic Load Balancing: $16.43 ⚠️ PROBLEM!
└─ Amazon CloudWatch: $0.00 (free tier)

Total: $16.43
```

**Action:** Delete the Load Balancer immediately!

---

## Cost Explorer (Detailed Analysis)

### Enable Cost Explorer

1. Go to **Billing** → **Cost Explorer**
2. Click **Enable Cost Explorer**
3. Wait 24 hours for data to populate

### How to Use

1. Go to **Cost Explorer** → **Launch Cost Explorer**
2. Choose time range (e.g., Last 7 days)
3. Group by: **Service**
4. See visualization of costs per service
5. Identify any unexpected charges

---

## Free Tier Usage Tracking

### View Free Tier Usage

1. Go to **Billing** → **Free Tier**
2. See usage of all free tier services
3. Check usage percentage

**Example:**
```
Amazon EC2
• 750 hours per month of Linux t2.micro
  Usage: 168 hours / 750 hours (22%)
  ✅ Within free tier

Amazon S3
• 5 GB of standard storage
  Usage: 0 GB / 5 GB (0%)
  ✅ Within free tier
```

### Set Up Usage Alerts

Already done if you enabled "Receive Free Tier Usage Alerts" in Step 1.

---

## Monthly Cleanup Checklist

### Things to Check Monthly

- [ ] **Unused Elastic IPs:** Release any detached IPs
  - Go to EC2 → Elastic IPs
  - Release any not associated with instance

- [ ] **Old EBS Snapshots:** Delete snapshots you don't need
  - Go to EC2 → Snapshots
  - Delete old snapshots (beyond 1GB free)

- [ ] **CloudWatch Log Retention:** Keep at 7 days
  - Go to CloudWatch → Log groups
  - Set retention to 7 days (not "Never expire")

- [ ] **Stopped EC2 Instances:** Terminate or start them
  - Go to EC2 → Instances
  - Stopped instances still charge for EBS storage

- [ ] **Unused Security Groups:** Clean up unused ones
  - Go to EC2 → Security Groups
  - Delete unused groups (won't save money, but good practice)

---

## Emergency: What to Do If You Get Charged

### Immediate Actions

1. **Stop the Bleeding:**
   ```
   Priority 1: Stop all EC2 instances
   Priority 2: Delete NAT Gateways (if any)
   Priority 3: Delete Load Balancers (if any)
   Priority 4: Release detached Elastic IPs
   Priority 5: Delete RDS/ElastiCache (if any)
   ```

2. **Identify the Source:**
   - Go to **Billing** → **Bills**
   - Expand each service to see charges
   - Note the exact service and resource ID

3. **Terminate the Resource:**
   - Go to that service in AWS Console
   - Find the resource by ID
   - Terminate/Delete it

### Contact AWS Support

1. Go to **Support** → **Support Center**
2. Click **Create case**
3. Choose **Account and billing support**
4. Explain:
   - This is your first time using AWS
   - You thought you were in free tier
   - You'd like a billing adjustment

**Note:** AWS often provides one-time credits for first-time users who accidentally create paid resources.

### Typical Response Time
- Billing issues: 12-24 hours response

---

## Common Costly Mistakes & How to Avoid

### Mistake 1: Creating a Load Balancer

**Cost:** ~$16/month minimum

**How it happens:**
- Following a tutorial that uses Load Balancer
- Enabling "Auto Scaling" (creates Load Balancer)

**How to avoid:**
- Don't create Application Load Balancer
- Don't enable Auto Scaling
- Use Nginx on EC2 if you need a reverse proxy

### Mistake 2: Leaving Elastic IP Detached

**Cost:** $0.005/hour = ~$3.60/month

**How it happens:**
- Stopping EC2 instance without releasing Elastic IP
- Forgetting about allocated IPs

**How to avoid:**
- Always keep Elastic IP attached to running instance
- If stopping instance for >1 hour, release the IP

**Check:** EC2 → Elastic IPs → Look for "Not associated"

### Mistake 3: Running Multiple Instances

**Cost:** ~$8.50+/month per additional t2.micro

**How it happens:**
- Testing different configurations
- Forgetting to terminate old instances

**How to avoid:**
- Only run 1 t2.micro at a time
- Terminate test instances immediately

**Check:** EC2 → Instances → Count running instances (should be 1)

### Mistake 4: Using Wrong Instance Type

**Cost:** t2.small = ~$17/month, t2.medium = ~$34/month

**How it happens:**
- Selecting wrong instance type during launch
- Changing instance type later

**How to avoid:**
- Always select **t2.micro** (only free tier option)
- Double-check before launching

**Check:** EC2 → Instances → Instance Type column (should say "t2.micro")

### Mistake 5: Creating RDS Database

**Cost:** ~$15/month minimum

**How it happens:**
- Following tutorial that uses RDS
- Thinking "managed database" is better

**How to avoid:**
- Use **MongoDB Atlas M0** (free forever tier)
- OR use MongoDB in Docker on EC2

**Check:** RDS → Databases → (should be empty)

### Mistake 6: Exceeding Data Transfer

**Cost:** $0.09/GB after 15GB/month

**How it happens:**
- High traffic to your site
- Large file downloads
- Docker image pulls/pushes

**How to avoid:**
- Use compression (gzip)
- Cache responses
- Optimize image sizes
- Use Docker Hub (not AWS ECR)

**Check:** Billing → Data Transfer usage

---

## Monitoring with CloudWatch

### Create Custom Dashboard

1. Go to **CloudWatch** → **Dashboards**
2. Click **Create dashboard**
3. Name: `SSO-Auth-Monitoring`
4. Add widgets:
   - EC2 CPU Utilization
   - EC2 Network In/Out
   - Billing Estimated Charges

### Useful Alarms to Create

1. **High CPU (Free Tier):**
   - Metric: CPUUtilization
   - Threshold: > 80% for 5 minutes
   - Alert: Email

2. **Billing Alert (Already created):**
   - Metric: EstimatedCharges
   - Threshold: > $1.00
   - Alert: Email

3. **Instance Status (Free Tier):**
   - Metric: StatusCheckFailed
   - Threshold: >= 1
   - Alert: Email

---

## Cost Optimization Tips

### Use Docker Efficiently

```bash
# Clean up unused Docker resources regularly
docker system prune -a --volumes

# This frees disk space and prevents exceeding 30GB EBS limit
```

### Optimize Data Transfer

```javascript
// Enable gzip compression in Express
const compression = require('compression');
app.use(compression());

// Reduce response sizes
// Use CDN for static assets (future)
```

### Monitor Logs

```bash
# Set log retention to 7 days in CloudWatch
# Prevents exceeding 5GB free tier

# Or use log rotation in Docker
docker-compose.yml:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

---

## Cost Projection After Free Tier (12 Months)

**After 12 months, some services start charging:**

| Service | Current (Free) | After 12 Months |
|---------|---------------|-----------------|
| EC2 t2.micro | $0.00 | ~$8.50/month |
| EBS 20GB | $0.00 | ~$2.00/month |
| Data Transfer | $0.00 | ~$0.50/month (assuming 5GB) |
| CloudWatch | $0.00 (always free) | $0.00 |
| **Total** | **$0.00** | **~$11.00/month** |

**Alternative after 12 months:**
- Migrate to **AWS Lightsail** (~$3.50/month for equivalent)
- Use **Heroku** free tier (if available)
- Use **Railway** free tier ($5 credit/month)
- Use **Render** free tier (limited)

---

## Summary: Your Free Tier Budget

### ✅ What We're Using (All Free)

```
EC2 t2.micro (1 instance):        $0.00
EBS Storage (20GB):               $0.00  
Elastic IP (attached):            $0.00
Data Transfer (<15GB):            $0.00
CloudWatch (basic):               $0.00
MongoDB Atlas M0:                 $0.00
──────────────────────────────────────
TOTAL MONTHLY COST:               $0.00
```

### 📊 Monitoring Strategy

- ✅ Billing alert at $1.00
- ✅ AWS Budget at $1.00/month
- ✅ Daily checks first week
- ✅ Weekly checks ongoing
- ✅ Monthly cleanup checklist

### 🎯 Success Criteria

**You're doing it right if:**
- AWS Billing Dashboard shows $0.00
- Only 1 EC2 instance (t2.micro) running
- Elastic IP is attached
- No Load Balancers, NAT Gateways, or RDS instances
- Data transfer < 15GB/month
- You receive $0.00 monthly invoice emails

---

## Quick Reference Card

**Print this and keep it visible:**

```
┌───────────────────────────────────────────┐
│   AWS FREE TIER SAFETY CHECKLIST          │
├───────────────────────────────────────────┤
│                                           │
│  Daily (First Week):                      │
│  □ Check billing dashboard                │
│  □ Verify $0.00 charges                   │
│                                           │
│  Weekly (Ongoing):                        │
│  □ Check billing dashboard                │
│  □ Verify 1 t2.micro running              │
│  □ Verify Elastic IP attached             │
│                                           │
│  Monthly:                                 │
│  □ Clean up unused resources              │
│  □ Delete old EBS snapshots               │
│  □ Verify data transfer <15GB             │
│                                           │
│  NEVER CREATE:                            │
│  ✗ Load Balancer (~$16/month)             │
│  ✗ NAT Gateway (~$32/month)               │
│  ✗ RDS (~$15/month)                       │
│  ✗ ElastiCache (~$13/month)               │
│  ✗ Multiple EC2 instances                 │
│                                           │
│  Emergency Contact:                       │
│  AWS Support: support.console.aws.amazon  │
│                                           │
└───────────────────────────────────────────┘
```

---

**Last Updated:** 2026-09-10  
**Next Review:** After Phase 4 (EC2 deployment)

---

**END OF AWS COST MONITORING GUIDE**
