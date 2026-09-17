---
inclusion: auto
name: Security and Secrets Policy
description: Rules for handling secrets, passwords, IPs, and sensitive data
---

# Security and Secrets Policy

## ❌ NEVER INCLUDE IN CODE OR DOCUMENTATION:

1. **Secrets & Passwords:**
   - Redis passwords
   - MongoDB passwords
   - JWT private keys
   - API keys or tokens
   - OAuth client secrets

2. **Infrastructure Details:**
   - EC2 public IPs (Elastic IPs)
   - EC2 private IPs
   - Instance IDs
   - SSH key names or content
   - Security group IDs

3. **Service Identifiers:**
   - MongoDB cluster URLs (with usernames)
   - Docker Hub usernames in examples
   - Actual database names with sensitive context

## ✅ ALWAYS USE PLACEHOLDERS:

- `<your-ec2-public-ip>` instead of actual IP
- `<your-elastic-ip>` instead of Elastic IP
- `<your-redis-password>` instead of actual password
- `<your-mongo-username>` instead of actual username
- `<your-cluster-url>` instead of actual cluster URL
- `<your-private-key-content>` instead of actual keys

## 📋 DOCUMENTATION RULES:

1. Show STRUCTURE, not VALUES
2. Use generic examples
3. Teach HOW to get/set values, not provide them
4. If user provides secrets in chat, acknowledge but don't echo them back

## 🚨 IF VIOLATION OCCURS:

1. Immediately notify user
2. Help sanitize all files
3. Guide through secret rotation
4. Commit sanitized versions
5. Rotate compromised credentials
