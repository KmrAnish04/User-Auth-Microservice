# Phase 4: AWS Infrastructure Setup - Overview

**Status:** 🚧 Ready to Start  
**Estimated Time:** 2-3 hours  
**Objective:** Deploy application to AWS EC2 within free tier constraints

---

## 🎯 Phase 4 Goals

1. Setup AWS account with billing protection
2. Launch t2.micro EC2 instance (free tier)
3. Install Docker and Docker Compose on EC2
4. Configure application environment on EC2
5. Complete GitHub Actions deploy job
6. Test end-to-end deployment pipeline

---

## ⚠️ CRITICAL: Cost Protection

**Before starting Phase 4, you MUST:**

1. ✅ Setup billing alerts at $1 threshold
2. ✅ Create AWS Budget with $1 monthly limit
3. ✅ Enable cost anomaly detection
4. ✅ Only use t2.micro instance (750 hrs/month free)
5. ✅ Keep Elastic IP attached (free when attached)

**Expected cost:** $0.00/month (within free tier)

**Read:** `docs/deployment/aws-cost-monitoring.md` before proceeding

---

## 📋 Phase 4 Checklist

### Part 1: AWS Account Setup (30 minutes)

- [ ] Create AWS account or login
- [ ] Add payment method (required but won't be charged)
- [ ] Enable billing alerts
- [ ] Create CloudWatch billing alarm ($1 threshold)
- [ ] Create AWS Budget ($1 monthly limit)
- [ ] Verify alert emails received

**Guide:** I'll provide step-by-step instructions for this

---

### Part 2: EC2 Instance Launch (30 minutes)

- [ ] Choose AWS region (us-east-1 recommended)
- [ ] Launch EC2 instance:
  - AMI: Ubuntu 22.04 LTS (or Amazon Linux 2023)
  - Instance type: **t2.micro** (ONLY free tier option)
  - Create new key pair (.pem file)
  - Storage: 20 GB GP2 (within 30GB free tier)
  - Add Name tag: "SSO-Auth-Server"

- [ ] Configure Security Group:
  - SSH (22) from your IP only
  - Custom TCP (3000) from anywhere (0.0.0.0/0)
  - Do NOT expose MongoDB (27017) or Redis (6379)

- [ ] Allocate Elastic IP
- [ ] Associate Elastic IP with instance
- [ ] **Save .pem key file securely** (you can't download it again!)

**Guide:** I'll walk you through AWS Console

---

### Part 3: EC2 Server Setup (45 minutes)

- [ ] Connect via SSH:
  ```bash
  ssh -i your-key.pem ubuntu@<ELASTIC_IP>
  ```

- [ ] Update system packages
- [ ] Install Docker
- [ ] Install Docker Compose v2
- [ ] Create application directory structure
- [ ] Generate RSA keys for JWT on server
- [ ] Create `.env.production` file
- [ ] Setup MongoDB (Atlas or self-hosted decision)
- [ ] Test Docker and Docker Compose work

**Guide:** I'll provide exact commands to run

---

### Part 4: Database Setup (20 minutes)

**Option A: MongoDB Atlas (Recommended)**
- [ ] Create free M0 cluster
- [ ] Whitelist all IPs (0.0.0.0/0)
- [ ] Create database user
- [ ] Get connection string
- [ ] Test connection from EC2

**Option B: Self-Hosted MongoDB**
- [ ] Already configured in docker-compose.yml
- [ ] Uses local Docker volume
- [ ] Less reliable, but fully free

**Redis:** Runs in Docker (already configured)

**Guide:** I'll help you choose and setup

---

### Part 5: GitHub Configuration (15 minutes)

- [ ] Add EC2 secrets to GitHub:
  - `EC2_HOST` = Your Elastic IP address
  - `EC2_USERNAME` = `ubuntu` or `ec2-user`
  - `EC2_SSH_KEY` = Content of your .pem file

- [ ] Test SSH connection from GitHub Actions (dry run)

**Guide:** I'll show you exact values to use

---

### Part 6: Complete Deploy Job (30 minutes)

- [ ] Update `.github/workflows/production-cicd.yaml`
- [ ] Add SSH action to deploy job
- [ ] Implement deployment steps:
  1. SSH to EC2
  2. Navigate to app directory
  3. Pull latest Docker image
  4. Update docker-compose.yml with new tag
  5. Run `docker-compose up -d`
  6. Wait for health check (up to 5 minutes)
  7. Verify deployment successful
  8. Rollback on failure

**Guide:** I'll provide the complete deploy job code

---

### Part 7: Test End-to-End (20 minutes)

- [ ] Make small code change
- [ ] Push to feature branch
- [ ] Verify pipeline runs (no deploy)
- [ ] Create PR and merge to main
- [ ] Watch complete pipeline run
- [ ] Verify deployment to EC2
- [ ] Test application endpoints
- [ ] Verify health check passes

**Guide:** I'll help you verify each step

---

## 🛠️ Tools You'll Need

1. **SSH Client**
   - Windows: Built-in SSH in PowerShell
   - Mac/Linux: Built-in ssh command

2. **AWS Account**
   - Email address
   - Credit card (required, won't be charged)
   - Phone number for verification

3. **Text Editor**
   - For editing .env.production on server
   - `nano` or `vim` (I'll show you commands)

4. **Your .pem Key File**
   - Download when creating EC2 instance
   - Keep it secure!
   - Store in safe location

---

## 📚 Resources to Read First

### Required Reading
1. `docs/deployment/aws-cost-monitoring.md` - **READ THIS FIRST!**
2. `.kiro/steering/deployment-context.md` - Deployment strategy

### Reference (Read if needed)
1. `.kiro/steering/cicd-conventions.md` - GitHub Actions standards
2. `docs/deployment/phase2-deferred-items.md` - Items to address later

---

## 🔐 Security Best Practices

### During Phase 4

1. **SSH Key Security**
   - Never commit .pem file to git
   - Store in secure location
   - Use appropriate file permissions (chmod 400)

2. **Security Group Rules**
   - SSH only from your IP (not 0.0.0.0/0)
   - Only expose port 3000 publicly
   - Never expose MongoDB or Redis ports

3. **Environment Variables**
   - Never log secrets
   - Use .env.production (not tracked in git)
   - Validate all required vars on startup

4. **GitHub Secrets**
   - Store EC2_SSH_KEY in GitHub Secrets
   - Never print secrets in workflow logs
   - Use secrets only in necessary steps

---

## 💰 Cost Breakdown

### Free Tier Limits (First 12 Months)

| Service | Free Tier | Our Usage | Status |
|---------|-----------|-----------|--------|
| EC2 t2.micro | 750 hrs/month | ~730 hrs | ✅ Free |
| EBS Storage | 30 GB | 20 GB | ✅ Free |
| Data Transfer | 15 GB/month | ~1 GB | ✅ Free |
| Elastic IP | Free if attached | 1 attached | ✅ Free |
| CloudWatch | 10 metrics | ~5 | ✅ Free |
| CloudWatch Alarms | 10 alarms | 1-2 | ✅ Free |

**Total Expected Cost:** $0.00/month

### ⚠️ Things That Cost Money

1. **Multiple EC2 instances** - Only run ONE t2.micro
2. **Elastic IP detached** - Costs $0.005/hour if not attached
3. **Instance stopped but not terminated** - EBS storage charges
4. **Data transfer > 15GB/month** - $0.09/GB after free tier
5. **CloudWatch Logs > 5GB** - $0.50/GB after free tier

**Solution:** We'll stay within free tier!

---

## 🎓 Learning Objectives

By the end of Phase 4, you'll understand:

1. ✅ How to launch and configure EC2 instances
2. ✅ AWS Security Groups and networking
3. ✅ SSH key management
4. ✅ Docker deployment on remote servers
5. ✅ GitHub Actions SSH deployment
6. ✅ MongoDB Atlas vs self-hosted trade-offs
7. ✅ Health checks and automatic rollbacks
8. ✅ AWS billing and cost management

---

## 📝 Step-by-Step Approach

### I will guide you through each step:

**Step 1:** "First, go to AWS Console and..."  
**You do:** Follow instructions  
**Report back:** "Done, here's what I see..."

**Step 2:** "Great! Now run this command..."  
**You do:** Copy-paste and run command  
**Report back:** "Here's the output..."

**And so on...**

This way you'll:
- ✅ Learn by doing
- ✅ Understand each step
- ✅ Troubleshoot issues yourself
- ✅ Build confidence with AWS

---

## ⚠️ Common Issues (We'll Handle These)

1. **SSH connection refused**
   - Check Security Group rules
   - Verify .pem permissions
   - Check instance is running

2. **Docker permission denied**
   - User not in docker group
   - Need to logout/login after adding to group

3. **Health check fails**
   - MongoDB connection issue
   - Redis connection issue
   - App not starting properly

4. **Deployment fails**
   - SSH key not configured in GitHub
   - Wrong EC2_HOST or EC2_USERNAME
   - docker-compose.yml syntax error

**Don't worry!** I'll help you fix these as they come up.

---

## 🚀 Ready to Start?

Before we begin Phase 4, confirm:

- ✅ Phase 3 is complete (CI/CD pipeline working)
- ✅ Docker images pushed to Docker Hub
- ✅ You have AWS account (or ready to create one)
- ✅ You have credit card for AWS (required, won't charge)
- ✅ You've read `aws-cost-monitoring.md`
- ✅ You're ready to spend 2-3 hours on this phase

**When ready, tell me: "Let's start Phase 4"**

I'll guide you step-by-step through:
1. AWS account and billing setup
2. EC2 instance launch
3. Server configuration
4. Database setup
5. GitHub Actions deployment
6. End-to-end testing

**Goal:** Have your app running on EC2 with automated deployments! 🎉

---

**Document Status:** Ready for Phase 4  
**Created:** 2026-09-10  
**Next Action:** Wait for user confirmation to start
