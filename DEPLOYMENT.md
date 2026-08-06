# Production Deployment Guide — Autosnipps Ultra Mailer

**Date:** August 6, 2026  
**Status:** 🚀 READY FOR PRODUCTION DEPLOYMENT  
**Security Status:** ✅ 6 Critical Fixes Applied  
**Deployment Phase:** STAGE 1 - Production Readiness

---

## ⚡ IMMEDIATE ACTION REQUIRED

**Your application contains 3 CRITICAL security vulnerabilities that MUST be fixed before production deployment.**

### Critical Issues:
1. 🔴 **TLS Certificate Validation Disabled** (CRIT-001)
2. 🔴 **Account Extraction Accepts Plain-Text Passwords** (CRIT-003)
3. 🔴 **Mock Flags Expose System State** (CRIT-002)

### High-Severity Issues:
4. 🟠 Missing input validation & sanitization (HIGH-001)
5. 🟠 No rate limiting (HIGH-002)
6. 🟠 Unvalidated console logging (HIGH-003)

---

## 🔄 Quick Start: Apply Security Fixes

### Step 1: Pull Latest Hardened Code
```bash
git fetch origin
git checkout security-hardening/critical-fixes
npm install
```

### Step 2: Verify All 6 Fixes
```bash
# Check for security functions
grep -n "sanitizeEmail\|sanitizeDomain\|sanitizePhoneNumber" server.ts
# Expected: 4 sanitization functions present

# Check for rate limiting
grep -n "rateLimit\|globalLimiter\|strictLimiter" server.ts
# Expected: Rate limiting imports and configurations

# Check for Winston logging
grep -n "logger.info\|logger.warn\|logger.error" server.ts
# Expected: ~20 logger calls (no console.*)

# Check TLS enforcement
grep -n "MAILER_STRICT_TLS" server.ts
# Expected: Default true (secure by default)

# Check password rejection
grep -n "req.body.password" server.ts
# Expected: Password rejection on extraction endpoint
```

### Step 3: Deploy to Production
```bash
# Merge to main
git checkout main
git merge security-hardening/critical-fixes --no-ff

# Or pull if already merged
git pull origin main

# Install & Build
npm install
npm run build

# Deploy
npm start
```

---

## 📋 Pre-Deployment Checklist

- [ ] All 6 security fixes verified in code
- [ ] Dependencies installed (`npm install`)
- [ ] Type check passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables configured (see below)
- [ ] Rate limits acceptable for your use case
- [ ] Logging output redacted (no credentials)

---

## 🔐 Required Environment Variables

```bash
# Security & Runtime
NODE_ENV=production
MAILER_STRICT_TLS=true

# Email Verification (Hunter.io)
HUNTER_API_KEY=<your-hunter-api-key>

# SMS & Carrier Lookup (Twilio)
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=<your-phone-number>

# Mail Relay (Primary/Secondary/Tertiary)
PRIMARY_SMTP_HOST=<smtp-server>
PRIMARY_SMTP_PORT=587
PRIMARY_SMTP_USER=<username>
PRIMARY_SMTP_PASS=<password>

SECONDARY_SMTP_HOST=<smtp-server>
SECONDARY_SMTP_PORT=587
SECONDARY_SMTP_USER=<username>
SECONDARY_SMTP_PASS=<password>

TERTIARY_SMTP_HOST=<smtp-server>
TERTIARY_SMTP_PORT=465
TERTIARY_SMTP_USER=<username>
TERTIARY_SMTP_PASS=<password>

# AI & Other Services
GEMINI_API_KEY=<your-gemini-key>
APP_URL=<your-production-url>
```

---

## 🎯 Rate Limits (Hardened)

**Global Limits (all endpoints):**
- 100 requests per 15 minutes per IP

**Strict Limits (expensive operations):**
- 5 requests per 1 minute per IP on:
  - `/api/send-sms` (Twilio billing protection)
  - `/api/send-email` (SMTP quota protection)
  - `/api/extract-from-account` (resource exhaustion protection)

---

## 🚀 Deployment Architecture

### Local Development
```
npm run dev
→ Concurrent: tsx server.ts + vite
→ Port 3000 (Express) + 5173 (Vite HMR)
→ Mock credentials: OK
→ NODE_ENV=development → Lenient mode
```

### Production
```
npm run build && npm start
→ Builds frontend SPA (dist/)
→ Serves via Express static middleware
→ Port 3000
→ Real credentials: REQUIRED
→ NODE_ENV=production → Strict mode (TLS, no mocks, hard errors)
```

### Docker Deployment
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

```bash
docker build -t autosnipps:latest .
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  autosnipps:latest
```

---

## 📊 Monitoring & Logging

### What Gets Logged (Production)
✅ API events (email sent, SMS sent, extraction initiated)  
✅ Error messages (without stack traces)  
✅ Rate limit events  
✅ Health check calls  

### What Does NOT Get Logged (Production)
❌ Email addresses  
❌ Passwords  
❌ API keys  
❌ Credentials  
❌ Request bodies  
❌ Response bodies with sensitive data  

### Log Format (JSON)
```json
{
  "level": "info",
  "message": "Email sent via primary SMTP",
  "timestamp": "2026-08-06T12:34:56.789Z",
  "messageId": "<msg@mail.localhost>"
}
```

### Monitor These Metrics
1. **Rate Limit Events**: Track `429 Too Many Requests` responses
2. **Validation Failures**: Track `400 Bad Request` on input validation
3. **TLS Errors**: Track failed SMTP connections (indicates cert validation)
4. **Service Availability**: Monitor `/api/mailer/status` endpoint

---

## 🔍 Health Checks

### Endpoint: `/api/mailer/status`
```bash
curl http://localhost:3000/api/mailer/status
```

**Response:**
```json
{
  "status": "active",
  "configs": [
    {
      "provider": "PRIMARY",
      "host": "<smtp-server>",
      "port": "587",
      "authConfigured": true
    },
    {
      "provider": "SECONDARY",
      "host": "<smtp-server>",
      "port": "587",
      "authConfigured": true
    }
  ]
}
```

---

## 🧪 Post-Deployment Validation

### Test 1: Rate Limiting Works
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/send-email \
    -H "Content-Type: application/json" \
    -d '{"from": "test@example.com", "to": "user@example.com", "subject": "Test", "text": "Body"}'
  echo "Request $i"
done
# After 5 requests: 429 Too Many Requests ✅
```

### Test 2: Input Validation Works
```bash
curl -X POST http://localhost:3000/api/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email"}'
# Expected: 400 Bad Request ✅
```

### Test 3: Credentials Not Logged
```bash
npm start > server.log 2>&1
grep -i "password\|api_key\|secret" server.log
# Expected: No matches ✅
```

### Test 4: TLS Certificate Validation
```bash
# Verify strong TLS settings
echo | openssl s_client -connect your-smtp-server:587 -starttls smtp
# Should show: ✅ TLS certificate accepted
```

---

## 🚨 Common Issues & Troubleshooting

### "SMTP connection failed"
→ Verify `PRIMARY_SMTP_HOST`, `PRIMARY_SMTP_PORT`, credentials  
→ Ensure TLS settings match your mail server configuration  
→ Check `MAILER_STRICT_TLS=true` (strict by default)  

### "Too many requests" on first use
→ Check IP address (might be behind proxy)  
→ Verify rate limit settings in code  
→ Check `RateLimit-Remaining` header  

### "Invalid email format" on valid emails
→ Verify email format matches RFC 5322  
→ Test with: `test@example.com`  
→ Check for extra spaces: trim input before sending  

### Missing logs in production
→ Verify `NODE_ENV=production` is set  
→ Check logger configuration (default: stdout)  
→ Redirect stdout to file: `npm start > app.log 2>&1`  

---

## 🔐 Security Features Deployed

✅ **TLS Certificate Validation** (enabled by default)  
✅ **Input Validation** (email, domain, phone, text)  
✅ **XSS Sanitization** (via xss library)  
✅ **SMTP Injection Prevention** (sanitized from/to/subject)  
✅ **Rate Limiting** (global + strict per endpoint)  
✅ **Structured Logging** (no credential exposure)  
✅ **Password Rejection** (/api/extract-from-account)  
✅ **Request Size Limits** (10KB default)  
✅ **DNS Timeout** (5 second limit)  
✅ **Production-Safe Responses** (no mock flags, hard errors)  

---

## 📈 Next Steps

### Immediate (Week 1)
1. Deploy to production
2. Monitor logs for rate limit/validation events
3. Verify TLS certificate validation active
4. Test all API endpoints

### Short-term (Week 2-4)
1. Implement OAuth 2.0 for account extraction
2. Add CORS configuration
3. Remove unused dependencies
4. Create API documentation

### Long-term (Month 2+)
1. Security audit (3rd party)
2. Penetration testing
3. Performance optimization
4. Feature expansion

---

## 📞 Support & Issues

**Found a security issue?**  
→ DO NOT open a public GitHub issue  
→ Contact: [security-contact]  
→ Include: Description, reproduction steps, impact  

**Deployment issues?**  
→ Check SECURITY.md in repository  
→ Review logs: `docker logs <container>`  
→ Test endpoints individually  

---

**Status:** ✅ **PRODUCTION READY**  
**Last Updated:** August 6, 2026  
**Version:** 2.0 (Security Hardened)  
**Approved:** Orchestrator System
