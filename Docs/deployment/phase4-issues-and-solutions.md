# Phase 4: Issues Encountered & Solutions

**Phase:** AWS EC2 Infrastructure Setup and Deployment  
**Status:** ✅ Complete  
**Completion Date:** 2026-09-17  
**Updated By:** Kiro AI Agent

---

## Overview

Phase 4 involved setting up AWS EC2 infrastructure and deploying the application with automated CI/CD. We encountered 8 major issues that provided valuable learning experiences about production deployments.

---

## Issues & Solutions

### **Issue 1: SSH Connection Timeout to EC2**

**Error:**
```
dial tcp ***:22: i/o timeout
```

**Root Cause:**
- EC2 Security Group only allowed SSH from "My IP" (specific IP address)
- GitHub Actions connects from different, rotating IP addresses
- GitHub Actions couldn't establish SSH connection to deploy

**Solution:**
Updated Security Group inbound rules:
```
Type: SSH
Port: 22
Source: 0.0.0.0/0 (Anywhere IPv4)
Source: ::/0 (Anywhere IPv6)
```

**Security Notes:**
- SSH port exposed to internet but protected by SSH key authentication
- Acceptable for learning/small deployments
- Production alternatives:
  - AWS Systems Manager (SSM) - no SSH port needed
  - Bastion host with static IP
  - VPN with static IP range
  - GitHub Actions self-hosted runners in AWS VPC

**File Changed:** EC2 Security Group `sso-auth-sg`

---

### **Issue 2: Docker Compose Command Not Found**

**Error:**
```
bash: line 22: docker-compose: command not found
Process exited with status 127
```

**Root Cause:**
- Docker Compose V2 uses `docker compose` (space, no hyphen)
- Workflow used old V1 syntax `docker-compose` (hyphen)
- EC2 had Docker Compose V2 installed

**Solution:**
Updated all occurrences in `.github/workflows/production-cicd.yaml`:

**Before:**
```bash
docker-compose down
docker-compose up -d
```

**After:**
```bash
docker compose down
docker compose up -d
```

**Learning:** Docker Compose V2 is integrated into Docker CLI. Always use `docker compose` (two words).

---

### **Issue 3: JWT Private Key Not Found in Container**

**Error:**
```
Error: ENOENT: no such file or directory, open '/app/config/keys/jwtPrivate.key'
```

**Root Cause:**
- JWT keys generated on EC2 host at `~/sso-auth-microservice/config/keys/`
- Docker container couldn't see host filesystem
- Keys not baked into Docker image (correctly, for security)
- No volume mount configured

**Solution:**
Added volume mount in `docker-compose.yml`:

```yaml
app:
  volumes:
    - ./config/keys:/app/config/keys:ro
```

**Why `:ro` (read-only):**
- Container only needs to read keys
- Prevents accidental modification
- Security best practice

**Learning:** Secrets should be mounted as volumes, never in Docker images.

---

### **Issue 4: Missing Config Files (index.config.keys.js)**

**Error:**
```
Cannot find module './keys/index.config.keys.js'
No configurations found in configuration directory:/app/config
```

**Root Cause:**
- Mounted only `config/keys` directory
- Volume mount **replaced** container's `/app/config/keys/` with EC2's version
- EC2's version only had key files, missing `index.config.keys.js`
- Also missing `default.json`, `production.json`, etc.

**Solution:**
1. Created `index.config.keys.js` on EC2 manually
2. Created config JSON files on EC2
3. Updated volume mount to entire config directory:

```yaml
app:
  volumes:
    - ./config:/app/config:ro
```

**Learning:** When mounting volumes, you **replace** the container's directory. Ensure all required files exist on the host.

---

### **Issue 5: Permission Denied on JWT Keys**

**Error:**
```
Error: EACCES: permission denied, open '/app/config/keys/jwtPrivate.key'
errno: -13
```

**Root Cause:**
- Keys on EC2 owned by `ubuntu:ubuntu` with `600` permissions (owner read/write only)
- Docker container runs as `nodejs` user (UID 1001, non-root)
- `nodejs` user couldn't read files owned by `ubuntu`

**Solution:**
Changed file permissions to allow read access:

```bash
chmod 644 config/keys/jwtPrivate.key
chmod 644 config/keys/jwtPublic.key
chmod 644 config/keys/index.config.keys.js
```

**Permission breakdown:**
- `600` = Owner only (read/write)
- `644` = Owner (read/write), Others (read only)

**Security consideration:**
- `644` still secure on EC2 (only authorized SSH users can access)
- No other users on EC2 instance
- Alternative: `chown 1001:1001` to match container UID

**Learning:** Container users need appropriate permissions on mounted volumes.

---

### **Issue 6: MongoDB Connection Failed**

**Error:**
```
MongoAPIError: URI must include hostname, domain name, and tld
```

**Root Cause:**
MongoDB Atlas connection string had password with `@` character:
```
mongodb+srv://Kmr:my@pass@cluster.mongodb.net/db
                    ↑ confuses parser as hostname separator
```

**Solution:**
URL-encoded special characters in password:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `/` → `%2F`
- `=` → `%3D`

**Correct format:**
```
mongodb+srv://Kmr:my%40pass@cluster.mongodb.net/db
```

**Also added recommended options:**
```
?retryWrites=true&w=majority
```

**Learning:** Always URL-encode passwords in connection strings.

---

### **Issue 7: Redis Wrong Password**

**Error:**
```
Error connecting to Redis: [ErrorReply: WRONGPASS invalid username-password pair or user is disabled.]
```

**Root Cause:**
1. Initial Redis password (`rTD3M5yjLA7HzsF8tT84xYQrqXEy1e4ScQBzD/3VDc4=`) contained `/` and `=`
2. These needed URL-encoding in connection string
3. Changed password to hex (no special chars)
4. Redis container still using old password from persistent volume

**Solution:**
```bash
# Generate simple hex password
openssl rand -hex 32

# Update .env.production
REDIS_PASSWORD=f968267ebd6d94117f093ea6db3d5b1c1cbf2a459bce0215b102d921a32f97f9
REDIS_DB_URL=redis://:f968267ebd6d94117f093ea6db3d5b1c1cbf2a459bce0215b102d921a32f97f9@redis-stack:6379

# Remove old Redis data
docker compose down -v  # -v removes volumes
docker compose up -d
```

**Learning:** 
- Use hex or alphanumeric passwords to avoid encoding issues
- Always remove volumes (`-v`) when changing passwords
- Redis stores auth in memory, needs restart with new config

---

### **Issue 8: Docker Compose Variable Substitution Failed (CRITICAL)**

**Error:**
```
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string.
command:
  - redis-server
  - --requirepass
  - (blank)
```

**Root Cause:**
Docker Compose has **two different** ways to use environment files:

**A. `env_file:` directive** (loads vars INTO containers)
```yaml
services:
  app:
    env_file:
      - .env.production  # ✅ Works - loads into container environment
```

**B. Variable substitution in docker-compose.yml** (uses `.env` file by convention)
```yaml
command: redis-server --requirepass ${REDIS_PASSWORD}
         # ❌ Docker Compose only looks for `.env` file for THIS
```

We used `.env.production` filename, but Docker Compose expects `.env` for substitution.

**Solution:**
Updated all docker compose commands in CI/CD workflow:

**Before:**
```bash
docker compose down
docker compose up -d
```

**After:**
```bash
docker compose --env-file .env.production down
docker compose --env-file .env.production up -d
```

**Alternative solutions:**
1. Rename `.env.production` to `.env` on server
2. Create symlink: `ln -s .env.production .env`
3. Use `--env-file` flag consistently

**Learning:**
- `.env` is Docker Compose's default for variable substitution
- `env_file:` loads into container, doesn't substitute in docker-compose.yml
- Always use `--env-file` flag if using non-standard env file names

**Files Changed:**
- `.github/workflows/production-cicd.yaml`
- Applied to all `docker compose` commands in deploy job

---

## Production Best Practices Learned

### 1. **Security Groups**
- Whitelist specific IPs when possible
- Use AWS Systems Manager for SSH-less access
- Document security trade-offs

### 2. **Docker Compose**
- Use V2 syntax (`docker compose`)
- Use `.env` filename convention
- Or always specify `--env-file` explicitly

### 3. **Secrets Management**
- Mount as volumes, don't bake into images
- Use appropriate file permissions
- URL-encode passwords in connection strings
- Consider AWS Secrets Manager for production

### 4. **Volume Mounts**
- Understand they **replace** container directories
- Ensure all required files exist on host
- Use `:ro` flag for read-only mounts

### 5. **Password Generation**
- Use hex or base32 encoding (no special chars)
- Avoid characters that need URL-encoding: `@#$%&/=`
- Use strong passwords: `openssl rand -hex 32`

### 6. **MongoDB Atlas**
- Whitelist only necessary IPs (EC2, not 0.0.0.0/0)
- Use `retryWrites=true&w=majority` options
- URL-encode passwords

### 7. **Redis**
- Clear volumes when changing passwords
- Match password in both config and connection string
- Use authentication in production

### 8. **CI/CD Debugging**
- Test manually on server first
- Check docker compose config: `docker compose config`
- View container logs: `docker logs <container>`
- Verify environment variables are set correctly

### 9. **Environment Files**
- Production: Use `.env` on server
- Development: Use `.env.local` or `.env.development`
- Never commit `.env` files to git
- Document required variables in `.env.example`

### 10. **Deployment Verification**
- Always include health checks
- Implement automatic rollback
- Test from external network
- Monitor logs during deployment

---

## Time Spent Debugging

| Issue | Time Spent | Severity |
|-------|------------|----------|
| SSH timeout | ~10 min | High |
| docker-compose command | ~5 min | Medium |
| JWT keys not found | ~15 min | High |
| Missing config files | ~20 min | High |
| Permission denied | ~10 min | Medium |
| MongoDB connection | ~15 min | High |
| Redis password | ~30 min | High |
| Env variable substitution | ~40 min | Critical |
| **Total** | **~2.5 hours** | - |

**Without these issues:** Phase 4 would take ~1 hour  
**With learning from issues:** Future deployments take ~30 minutes

---

## How to Avoid These Issues in Future

### Before Deployment Checklist

1. **Environment File Setup**
   - [ ] Use `.env` filename on production server
   - [ ] Or plan to use `--env-file` flag consistently
   - [ ] Test variable substitution: `docker compose config`

2. **Password Management**
   - [ ] Generate hex passwords: `openssl rand -hex 32`
   - [ ] Avoid special characters in passwords
   - [ ] URL-encode existing passwords if needed

3. **Volume Mounts**
   - [ ] List all files needed from host
   - [ ] Ensure files exist on host before mounting
   - [ ] Set appropriate permissions (644 for read-only secrets)

4. **Connection Strings**
   - [ ] URL-encode passwords
   - [ ] Test connection strings manually
   - [ ] Add recommended options (retryWrites, w=majority)

5. **Security Groups**
   - [ ] Plan for GitHub Actions access
   - [ ] Consider SSM instead of SSH port exposure
   - [ ] Document security decisions

6. **Docker Compose Version**
   - [ ] Use `docker compose` (V2 syntax)
   - [ ] Never use `docker-compose` (V1 hyphenated)

7. **Testing**
   - [ ] Test manually on server first
   - [ ] Verify all environment variables load
   - [ ] Check container health before automating

---

## Conclusion

These 8 issues provided valuable learning experiences. Each issue represents a common production deployment challenge. Understanding and documenting them helps prevent future occurrences and speeds up troubleshooting.

**Key Takeaway:** Real production deployment involves dealing with edge cases around configuration, permissions, networking, and environment management. Testing thoroughly at each step prevents compounding issues.

---

**Document Status:** Complete  
**Last Updated:** 2026-09-17  
**Updated By:** Kiro AI Agent
