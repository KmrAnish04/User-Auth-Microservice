---
inclusion: auto
name: Security and Secrets Policy
description: Rules for handling secrets, passwords, and sensitive data
---

# Security and Secrets Policy

## CRITICAL RULES - NEVER VIOLATE

### 1. NO SECRETS IN CODE OR DOCUMENTATION
- ❌ NEVER write actual passwords, API keys, or secrets in ANY file
- ❌ NEVER commit real Redis passwords, MongoDB passwords, JWT keys
- ❌ NEVER put secrets in documentation, README, or markdown files
- ❌ NEVER put secrets in code comments or commit messages

### 2. USE PLACEHOLDERS ONLY
- ✅ Use: `REDIS_PASSWORD=<your-secure-password-here>`
- ✅ Use: `MONGO_PASSWORD=<your-mongo-atlas-password>`
- ✅ Use: `JWT_PRIVATE_KEY=<content-of-your-private-key>`
- ✅ Use: `API_KEY=<your-api-key-from-provider>`

### 3. ENVIRONMENT VARIABLES
- All secrets MUST be in `.env` files (already in .gitignore)
- Never suggest committing `.env*` files
- Always verify `.gitignore` includes sensitive files

### 4. DOCUMENTATION
- In troubleshooting guides, use generic examples
- Show directory structure, not file contents with secrets
- Teach users HOW to set secrets, not provide actual values

### 5. IF VIOLATION OCCURS
- Immediately alert the user
- Guide secret rotation process
- Update all affected systems
- Revoke compromised credentials

## Files That Should NEVER Contain Secrets
- `README.md`
- `docs/**/*.md`
- `*.js`, `*.ts`, `*.py` (source code)
- `.github/workflows/*.yaml` (except encrypted secrets)
- Any file tracked by git (except `.env.example` with placeholders)

## Secret Rotation Checklist
When secrets are exposed:
1. Generate new secret
2. Update on production server
3. Update in environment variables
4. Restart affected services
5. Revoke old secret
6. Verify new secret works
