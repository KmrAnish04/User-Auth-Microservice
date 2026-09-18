# Docker Image Version Policy

## Why We Pin Versions

**Never use `:latest` in production!**

### Problems with `:latest`:
- ❌ Unpredictable - tag changes without warning
- ❌ No rollback - can't downgrade if issues occur
- ❌ Breaking changes - new versions may break your setup
- ❌ Non-reproducible - different servers get different versions
- ❌ Security - can't audit/scan specific version

### ✅ Production Best Practice:
```yaml
# Bad
image: grafana/grafana:latest

# Good
image: grafana/grafana:10.2.3
```

---

## Current Image Versions

| Service | Image | Version | Release Date | Notes |
|---------|-------|---------|--------------|-------|
| **Application** | anish04kmr/sso-auth-microservice | Git SHA tags | - | Tagged by CI/CD |
| **Redis** | redis | 7-alpine | Stable | Alpine for smaller size |
| **Prometheus** | prom/prometheus | v2.48.0 | Nov 2023 | Stable LTS release |
| **Grafana** | grafana/grafana | 10.2.3 | Nov 2023 | Stable release |

---

## Version Selection Criteria

### 1. **Stability Over Cutting Edge**
- Choose LTS (Long Term Support) versions when available
- Avoid `.0` releases (e.g., 10.0.0) - wait for `.1` or `.2`
- Check GitHub releases for "stable" tag

### 2. **Security Updates**
- Check CVE databases before choosing version
- Subscribe to security mailing lists
- Update within 30 days of critical CVEs

### 3. **Alpine vs Full Images**
```yaml
# Prefer Alpine for production (smaller, more secure)
redis:7-alpine      # 40MB
redis:7             # 120MB

# Exception: if you need debugging tools, use full image
```

### 4. **Compatibility Matrix**

| Grafana | Prometheus | Compatible? |
|---------|------------|-------------|
| 10.x | 2.45+ | ✅ Yes |
| 9.x | 2.40+ | ✅ Yes |
| 8.x | 2.30+ | ⚠️ Limited |

---

## Update Policy

### When to Update:

**Security patches (within 7 days):**
- Critical CVE announced
- Security vulnerability fixed
- Update immediately

**Minor versions (quarterly):**
- Bug fixes and improvements
- Review changelog
- Test in staging first

**Major versions (yearly):**
- Breaking changes possible
- Read migration guide
- Test thoroughly in staging

### How to Update:

1. **Check release notes:**
   ```bash
   # Grafana
   https://github.com/grafana/grafana/releases
   
   # Prometheus
   https://github.com/prometheus/prometheus/releases
   ```

2. **Update version in docker-compose.prod.yml:**
   ```yaml
   image: grafana/grafana:10.2.4  # Updated from 10.2.3
   ```

3. **Test locally:**
   ```bash
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Deploy via CI/CD:**
   ```bash
   git add docker-compose.prod.yml
   git commit -m "chore: Update Grafana to 10.2.4 (security patch)"
   git push origin main
   ```

---

## Image Size Comparison

| Image | Tag | Size | Use Case |
|-------|-----|------|----------|
| redis:7 | full | 120MB | Development, debugging |
| redis:7-alpine | alpine | 40MB | ✅ Production |
| prometheus:v2.48.0 | full | 240MB | ✅ Production (Alpine not official) |
| grafana:10.2.3 | full | 380MB | ✅ Production (Alpine deprecated) |

**Total monitoring stack:** ~660MB

---

## Secrets Management

### ❌ NEVER Do This:

```yaml
# WRONG - Hardcoded default
environment:
  - ADMIN_PASSWORD=${PASSWORD:-admin123}
```

**Why it's bad:**
- Default password visible in code
- Same password on all instances
- Can't audit who knows the password

### ✅ Correct Approach:

```yaml
# RIGHT - No default, must be set
environment:
  - ADMIN_PASSWORD=${PASSWORD}
```

**If not set:**
- Container fails to start ✅
- Forces operator to set password
- No weak defaults

**Secrets should be:**
- ✅ In `.env.production` (not in git)
- ✅ Different per environment
- ✅ Stored in AWS Secrets Manager (for ASG)
- ✅ Rotated regularly (every 90 days)

---

## Version Upgrade Checklist

Before upgrading any image:

- [ ] Read release notes and changelog
- [ ] Check for breaking changes
- [ ] Review security advisories
- [ ] Test in local environment
- [ ] Backup current data (volumes)
- [ ] Update docker-compose.prod.yml
- [ ] Commit with descriptive message
- [ ] Deploy via CI/CD
- [ ] Verify service health
- [ ] Monitor logs for 24 hours
- [ ] Document any issues encountered

---

## Emergency Rollback

If update causes issues:

```bash
# SSH to EC2
cd ~/sso-auth-microservice

# Stop services
docker compose -f docker-compose.prod.yml down

# Revert docker-compose.prod.yml to previous version
git checkout HEAD~1 docker-compose.prod.yml

# Start with old version
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## Monitoring for Updates

### Tools to track updates:

1. **Renovate Bot** (GitHub)
   - Auto-creates PRs for updates
   - Free for open source

2. **Dependabot** (GitHub)
   - Native GitHub feature
   - Supports Docker images

3. **Manual checking:**
   ```bash
   # Check for new Grafana versions
   curl -s https://api.github.com/repos/grafana/grafana/releases/latest | grep tag_name
   
   # Check for new Prometheus versions
   curl -s https://api.github.com/repos/prometheus/prometheus/releases/latest | grep tag_name
   ```

---

## Summary

**Golden Rules:**
1. ✅ Always pin specific versions
2. ✅ Never use `:latest` in production
3. ✅ Prefer Alpine images (when available)
4. ✅ No hardcoded secrets/passwords
5. ✅ Document version choices
6. ✅ Test before deploying updates
7. ✅ Keep update policy documented
