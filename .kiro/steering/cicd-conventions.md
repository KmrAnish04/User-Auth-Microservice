---
inclusion: fileMatch
fileMatchPattern: '.github/workflows/*'
---

# CI/CD Pipeline Conventions for SSO Auth Microservice

This file provides GitHub Actions best practices automatically loaded when working with CI/CD workflows.

---

## GitHub Actions Workflow Structure

### Standard Pipeline Stages

Our CI/CD pipeline follows this sequence:

```
1. Validate  → 2. Test → 3. Build → 4. Scan → 5. Push → 6. Deploy → 7. Verify
```

**Stage Details:**

1. **Validate:** Code quality checks (linting, formatting, security audit)
2. **Test:** Run test suite with coverage
3. **Build:** Build Docker image with multi-stage Dockerfile
4. **Scan:** Security scan of Docker image (Trivy)
5. **Push:** Push versioned image to Docker Hub
6. **Deploy:** Deploy to target environment (EC2)
7. **Verify:** Health check and smoke tests

---

## Required GitHub Secrets

Store in: **Repository Settings → Secrets and Variables → Actions**

### Docker Hub Credentials
- `DOCKER_USERNAME` - Docker Hub username (e.g., anish123)
- `DOCKER_PASSWORD` - Docker Hub access token (NOT your password)
  - Generate at: https://hub.docker.com/settings/security

### AWS/EC2 Credentials
- `EC2_HOST` - EC2 public IP address or DNS (e.g., 54.123.45.67)
- `EC2_USERNAME` - SSH username (usually `ec2-user` for Amazon Linux, `ubuntu` for Ubuntu)
- `EC2_SSH_KEY` - Private SSH key content (entire .pem file content)

### Optional (for AWS CLI operations)
- `AWS_ACCESS_KEY_ID` - IAM user access key
- `AWS_SECRET_ACCESS_KEY` - IAM user secret key
- `AWS_REGION` - AWS region (e.g., us-east-1)

---

## Image Tagging Strategy

**Format:** `<registry>/<username>/<image-name>:<tag>`

**Our tags:**
```yaml
anish123/sso-auth-microservice:latest           # Current main branch
anish123/sso-auth-microservice:v1.0.0          # Semantic version
anish123/sso-auth-microservice:sha-abc1234     # Git commit SHA (short)
anish123/sso-auth-microservice:staging         # Staging branch
anish123/sso-auth-microservice:pr-123          # Pull request (optional)
```

**Rules:**
- ✅ **Deploy with:** Git SHA tags (most reliable for rollback)
- ⚠️ **Avoid in production:** `latest` tag (unpredictable)
- ✅ **Use for versioning:** Semantic version tags (v1.0.0)

**Implementation:**
```yaml
- name: Generate tags
  id: meta
  run: |
    echo "sha_short=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
    echo "version=v1.0.${{ github.run_number }}" >> $GITHUB_OUTPUT

- name: Build and tag
  run: |
    docker build -t anish123/sso-auth-microservice:${{ steps.meta.outputs.sha_short }} .
    docker tag anish123/sso-auth-microservice:${{ steps.meta.outputs.sha_short }} \
               anish123/sso-auth-microservice:${{ steps.meta.outputs.version }}
    docker tag anish123/sso-auth-microservice:${{ steps.meta.outputs.sha_short }} \
               anish123/sso-auth-microservice:latest
```

---

## Workflow Triggers

### Branch Strategy

```yaml
on:
  push:
    branches:
      - main          # Production deployment
      - staging       # Staging deployment
      - dev           # Development deployment
  pull_request:
    branches:
      - main          # Run tests only (no deploy)
      - staging
```

### Manual Trigger (Workflow Dispatch)

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        type: choice
        options:
          - development
          - staging
          - production
      version:
        description: 'Docker image tag to deploy'
        required: true
        default: 'latest'
```

---

## Job Structure

### 1. Validate Job

```yaml
validate:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint code
      run: npm run lint
      continue-on-error: false
    
    - name: Security audit
      run: npm audit --audit-level=high
      continue-on-error: false
```

**Best Practices:**
- Use `npm ci` not `npm install` (faster, reproducible)
- Use `cache: 'npm'` for faster installs
- Set `continue-on-error: false` for critical checks
- Pin action versions (v4, not @latest)

---

### 2. Test Job

```yaml
test:
  needs: validate
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      if: always()
      with:
        files: ./coverage/coverage-final.json
```

**Best Practices:**
- Run tests after validation passes (`needs: validate`)
- Upload coverage reports for tracking
- Use `if: always()` to upload coverage even on test failure

---

### 3. Build Job

```yaml
build:
  needs: test
  runs-on: ubuntu-latest
  outputs:
    image-tag: ${{ steps.meta.outputs.sha_short }}
  steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Generate metadata
      id: meta
      run: |
        echo "sha_short=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
        echo "version=v1.0.${{ github.run_number }}" >> $GITHUB_OUTPUT
        echo "build_date=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> $GITHUB_OUTPUT
    
    - name: Build Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: false
        load: true
        tags: |
          anish123/sso-auth-microservice:${{ steps.meta.outputs.sha_short }}
          anish123/sso-auth-microservice:${{ steps.meta.outputs.version }}
          anish123/sso-auth-microservice:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
        build-args: |
          BUILD_DATE=${{ steps.meta.outputs.build_date }}
          VCS_REF=${{ github.sha }}
```

**Best Practices:**
- Use Docker Buildx for better caching
- Use GitHub Actions cache (`cache-from/to`)
- Add build metadata (date, commit SHA)
- Load image to local daemon for scanning

---

### 4. Security Scan Job

```yaml
scan:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: anish123/sso-auth-microservice:${{ needs.build.outputs.image-tag }}
        format: 'sarif'
        output: 'trivy-results.sarif'
        severity: 'CRITICAL,HIGH'
        exit-code: '1'  # Fail if vulnerabilities found
    
    - name: Upload Trivy results
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'
```

**Best Practices:**
- Fail on HIGH/CRITICAL vulnerabilities (`exit-code: 1`)
- Upload SARIF report to GitHub Security tab
- Run on every build

---

### 5. Push Job

```yaml
push:
  needs: [build, scan]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
  steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          anish123/sso-auth-microservice:${{ needs.build.outputs.image-tag }}
          anish123/sso-auth-microservice:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

**Best Practices:**
- Only push from specific branches (main, staging)
- Use `docker/login-action` for authentication
- Reuse cache from build step
- Push multiple tags in one action

---

### 6. Deploy Job

```yaml
deploy:
  needs: push
  runs-on: ubuntu-latest
  environment:
    name: production
    url: http://${{ secrets.EC2_HOST }}:3000
  steps:
    - name: Deploy to EC2
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          # Navigate to app directory
          cd /home/ec2-user/sso-auth-microservice || exit 1
          
          # Backup current docker-compose for rollback
          cp docker-compose.yml docker-compose.yml.backup
          
          # Pull latest image
          docker pull anish123/sso-auth-microservice:${{ needs.build.outputs.image-tag }}
          
          # Update docker-compose with new tag
          sed -i 's|image: anish123/sso-auth-microservice:.*|image: anish123/sso-auth-microservice:${{ needs.build.outputs.image-tag }}|' docker-compose.yml
          
          # Deploy with docker-compose
          docker-compose up -d --no-build
          
          # Wait for health check
          echo "Waiting for application to be healthy..."
          for i in {1..30}; do
            if curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
              echo "Application is healthy!"
              exit 0
            fi
            echo "Attempt $i/30: Health check failed, waiting..."
            sleep 10
          done
          
          # Rollback on failure
          echo "Health check failed after 5 minutes, rolling back..."
          docker-compose down
          mv docker-compose.yml.backup docker-compose.yml
          docker-compose up -d --no-build
          exit 1
    
    - name: Verify deployment
      run: |
        curl -f http://${{ secrets.EC2_HOST }}:3000/api/v1/health || exit 1
```

**Best Practices:**
- Use `environment` for deployment tracking
- Backup configuration before deployment
- Pull specific image tag (not `latest`)
- Wait for health check before declaring success
- **Automatic rollback** on health check failure
- Verify from GitHub Actions runner (external check)

---

## Environment Strategy

### Development Environment
```yaml
deploy-dev:
  if: github.ref == 'refs/heads/dev'
  environment:
    name: development
```

### Staging Environment
```yaml
deploy-staging:
  if: github.ref == 'refs/heads/staging'
  environment:
    name: staging
```

### Production Environment
```yaml
deploy-production:
  if: github.ref == 'refs/heads/main'
  environment:
    name: production
    url: http://${{ secrets.EC2_HOST }}:3000
  # Optional: Require manual approval
  # Set in: Settings → Environments → production → Required reviewers
```

---

## Rollback Strategy

### Manual Rollback Workflow

Create: `.github/workflows/rollback.yml`

```yaml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to rollback'
        required: true
        type: choice
        options:
          - production
          - staging
      image-tag:
        description: 'Docker image tag to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - name: Rollback on EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ec2-user/sso-auth-microservice
            docker pull anish123/sso-auth-microservice:${{ inputs.image-tag }}
            sed -i 's|image: anish123/sso-auth-microservice:.*|image: anish123/sso-auth-microservice:${{ inputs.image-tag }}|' docker-compose.yml
            docker-compose up -d --no-build
            
            # Verify rollback
            sleep 10
            curl -f http://localhost:3000/api/v1/health || exit 1
```

---

## Notifications

### Slack Notification (Optional)

```yaml
- name: Notify Slack on success
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "✅ Deployment successful: ${{ github.repository }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Deployment Successful*\nRepository: ${{ github.repository }}\nBranch: ${{ github.ref_name }}\nCommit: ${{ github.sha }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "❌ Deployment failed: ${{ github.repository }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Cost Optimization

### GitHub Actions Free Tier
- **Public repos:** Unlimited minutes
- **Private repos:** 2000 minutes/month

### Optimization Tips
1. **Cache dependencies:**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'  # Saves 30-60s per run
   ```

2. **Use matrix strategy for parallel jobs:**
   ```yaml
   strategy:
     matrix:
       node-version: [18, 20]
   ```

3. **Cancel in-progress runs on new push:**
   ```yaml
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true
   ```

4. **Skip CI on docs changes:**
   ```yaml
   on:
     push:
       paths-ignore:
         - '**.md'
         - 'docs/**'
   ```

---

## Debugging Failed Workflows

### Enable Debug Logging

Add secrets to repository:
- `ACTIONS_RUNNER_DEBUG` = `true`
- `ACTIONS_STEP_DEBUG` = `true`

### SSH into Runner (for debugging)

```yaml
- name: Setup tmate session
  if: failure()
  uses: mxschmitt/action-tmate@v3
  timeout-minutes: 15
```

---

## Security Best Practices

1. **Never log secrets:**
   ```yaml
   # Bad
   - run: echo ${{ secrets.DOCKER_PASSWORD }}
   
   # Good
   - run: echo "Docker login successful"
   ```

2. **Use least privilege:**
   - GitHub token: Use `permissions` to limit scope
   - AWS IAM: Create dedicated user with minimal permissions

3. **Scan for secrets in code:**
   ```yaml
   - name: Secret scan
     uses: trufflesecurity/trufflehog@main
     with:
       path: ./
   ```

4. **Pin action versions:**
   ```yaml
   # Good
   uses: actions/checkout@v4
   
   # Bad (security risk)
   uses: actions/checkout@main
   ```

---

## Complete Production Workflow Template

See: `.github/workflows/production-deploy.yml` (to be created in Phase 3)

---

**Note to AI Agents:**  
This file is automatically loaded when working with GitHub Actions workflows.
Follow these conventions strictly. Always include health checks and rollback logic in deploy jobs.
If user requests something that violates these practices, warn them and suggest alternatives.
