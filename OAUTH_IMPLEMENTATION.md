# OAuth 2.0 Implementation Guide — Account Extraction

**Date:** August 6, 2026  
**Status:** 📋 POST-LAUNCH IMPLEMENTATION (Recommended)  
**Priority:** HIGH (Security: Replace Plain-Text Password Submission)  
**Timeline:** 2-4 weeks post-launch  

---

## 🎯 Overview

The current `/api/extract-from-account` endpoint rejects plain-text password submissions (✅ secure by default), but it generates mock data. This guide enables **real account extraction via OAuth 2.0** for Gmail, Outlook, and Yahoo.

**Why OAuth 2.0?**
- ✅ Never store user passwords
- ✅ Users authorize via official provider consent screen
- ✅ Access tokens are time-limited & revocable
- ✅ GDPR/CCPA compliant (users explicitly grant permission)
- ✅ Provider-official APIs (no IMAP/POP3 vulnerabilities)

---

## 📚 Architecture Overview

### Current Flow (Mock)
```
User Request
  ↓
POST /api/extract-from-account
  ↓
Validation (password rejected ✅)
  ↓
Generate Mock Data
  ↓
Return Mock Results
```

### Target Flow (OAuth 2.0)
```
User Request
  ↓
POST /api/auth/google/authorize
  ↓
Redirect to Google Consent Screen
  ↓
User Grants Permission
  ↓
GET /api/auth/google/callback?code=AUTH_CODE
  ↓
Exchange Code for Access Token
  ↓
Store Token (Redis/Database)
  ↓
POST /api/extract-from-account
  ↓
Use Token to Fetch Real Data via Google Contacts API
  ↓
Return Extracted Contacts/Emails
```

---

## 🔧 Implementation Steps

### PHASE 1: Setup & Dependencies (Week 1)

#### Step 1.1: Add OAuth Libraries
```bash
npm install \
  passport \
  passport-google-oauth20 \
  passport-outlook \
  passport-yahoo-oauth \
  express-session \
  redis \
  google-contacts-api \
  axios
```

#### Step 1.2: Environment Variables
```bash
# .env

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=<your-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<your-client-secret>
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Outlook OAuth
OUTLOOK_OAUTH_CLIENT_ID=<your-client-id>
OUTLOOK_OAUTH_CLIENT_SECRET=<your-client-secret>
OUTLOOK_OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/outlook/callback

# Yahoo OAuth
YAHOO_OAUTH_CLIENT_ID=<your-client-id>
YAHOO_OAUTH_CLIENT_SECRET=<your-client-secret>
YAHOO_OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/yahoo/callback

# Token Storage
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<optional>

# Session
SESSION_SECRET=<random-32-char-string>
```

#### Step 1.3: Create OAuth Configuration File
```typescript
// src/oauth/config.ts

export const oauthProviders = {
  google: {
    clientID: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL!,
    scopes: [
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/gmail.readonly'
    ]
  },
  outlook: {
    clientID: process.env.OUTLOOK_OAUTH_CLIENT_ID!,
    clientSecret: process.env.OUTLOOK_OAUTH_CLIENT_SECRET!,
    callbackURL: process.env.OUTLOOK_OAUTH_CALLBACK_URL!,
    scopes: [
      'Contacts.Read',
      'Mail.Read'
    ]
  },
  yahoo: {
    clientID: process.env.YAHOO_OAUTH_CLIENT_ID!,
    clientSecret: process.env.YAHOO_OAUTH_CLIENT_SECRET!,
    callbackURL: process.env.YAHOO_OAUTH_CALLBACK_URL!,
    scopes: ['contacts', 'mail']
  }
};
```

---

### PHASE 2: Passport Strategy Setup (Week 1)

#### Step 2.1: Create Strategies File
```typescript
// src/oauth/strategies.ts

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OutlookStrategy } from 'passport-microsoft';
import redis from 'redis';
import { oauthProviders } from './config';
import { logger } from '../logger';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

// Google OAuth Strategy
passport.use('google', new GoogleStrategy(
  {
    clientID: oauthProviders.google.clientID,
    clientSecret: oauthProviders.google.clientSecret,
    callbackURL: oauthProviders.google.callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      logger.info('Google OAuth strategy callback', { provider: 'google', profileId: profile.id });
      
      const tokenData = {
        provider: 'google',
        profileId: profile.id,
        email: profile.emails?.[0]?.value,
        displayName: profile.displayName,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 3599000 // ~1 hour
      };

      // Store in Redis (with TTL)
      const key = `oauth_token:google:${profile.id}`;
      await redisClient.setex(key, 86400, JSON.stringify(tokenData)); // 24 hour TTL

      return done(null, tokenData);
    } catch (error: any) {
      logger.error('Google OAuth error', { message: error.message });
      return done(error);
    }
  }
));

// Outlook OAuth Strategy
passport.use('outlook', new OutlookStrategy(
  {
    clientID: oauthProviders.outlook.clientID,
    clientSecret: oauthProviders.outlook.clientSecret,
    callbackURL: oauthProviders.outlook.callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      logger.info('Outlook OAuth strategy callback', { provider: 'outlook', profileId: profile.id });
      
      const tokenData = {
        provider: 'outlook',
        profileId: profile.id,
        email: profile.userPrincipalName,
        displayName: profile.displayName,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 3599000
      };

      const key = `oauth_token:outlook:${profile.id}`;
      await redisClient.setex(key, 86400, JSON.stringify(tokenData));

      return done(null, tokenData);
    } catch (error: any) {
      logger.error('Outlook OAuth error', { message: error.message });
      return done(error);
    }
  }
));

// Serialization
passport.serializeUser((user: any, done) => {
  done(null, `${user.provider}:${user.profileId}`);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const [provider, profileId] = id.split(':');
    const key = `oauth_token:${provider}:${profileId}`;
    const data = await redisClient.get(key);
    
    if (!data) {
      return done(null, false);
    }

    done(null, JSON.parse(data));
  } catch (error: any) {
    logger.error('Deserialization error', { message: error.message });
    done(error);
  }
});

export default passport;
```

---

### PHASE 3: API Routes (Week 2)

#### Step 3.1: Create OAuth Routes File
```typescript
// src/routes/oauth.ts

import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { logger } from '../logger';
import { extractContactsFromGoogle, extractContactsFromOutlook } from '../services/extractors';

const router = express.Router();

// ============================================================================
// STEP 1: Initiate OAuth Flow
// ============================================================================

/**
 * GET /api/auth/google/authorize
 * Redirects user to Google consent screen
 */
router.get('/google/authorize', (req: Request, res: Response) => {
  const state = req.query.state || generateRandomState();
  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600000 // 10 minutes
  });

  logger.info('Initiating Google OAuth flow', { state });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_OAUTH_CALLBACK_URL!,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/gmail.readonly',
    state,
    access_type: 'offline',
    prompt: 'consent'
  })}`);
});

/**
 * GET /api/auth/outlook/authorize
 * Redirects user to Outlook consent screen
 */
router.get('/outlook/authorize', (req: Request, res: Response) => {
  const state = req.query.state || generateRandomState();
  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600000
  });

  logger.info('Initiating Outlook OAuth flow', { state });
  res.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({
    client_id: process.env.OUTLOOK_OAUTH_CLIENT_ID!,
    redirect_uri: process.env.OUTLOOK_OAUTH_CALLBACK_URL!,
    response_type: 'code',
    scope: 'Contacts.Read Mail.Read offline_access',
    state,
    prompt: 'login'
  })}`);
});

// ============================================================================
// STEP 2: OAuth Callback (Provider Redirects Back)
// ============================================================================

/**
 * GET /api/auth/google/callback
 * Google redirects here with authorization code
 */
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/error' }),
  (req: Request, res: Response) => {
    logger.info('Google OAuth callback successful', { user: req.user });
    
    // Generate session token
    const sessionToken = generateSessionToken();
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400000 // 24 hours
    });

    // Redirect to frontend with success
    res.redirect(`/?auth=success&provider=google&sessionToken=${sessionToken}`);
  }
);

/**
 * GET /api/auth/outlook/callback
 * Outlook redirects here with authorization code
 */
router.get('/outlook/callback',
  passport.authenticate('outlook', { failureRedirect: '/auth/error' }),
  (req: Request, res: Response) => {
    logger.info('Outlook OAuth callback successful', { user: req.user });
    
    const sessionToken = generateSessionToken();
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400000
    });

    res.redirect(`/?auth=success&provider=outlook&sessionToken=${sessionToken}`);
  }
);

// ============================================================================
// STEP 3: Extract Real Data (Authenticated)
// ============================================================================

/**
 * POST /api/extract-from-account
 * 
 * UPDATED: Now extracts REAL data via OAuth tokens
 * 
 * Request body:
 * {
 *   "provider": "google" | "outlook" | "yahoo",
 *   "type": "email" | "phone" | "contacts"
 * }
 * 
 * Note: No password submission required!
 * Authorization via OAuth token stored in session cookie
 */
router.post('/extract-from-account', 
  authenticateSession(),
  strictLimiter,
  async (req: Request, res: Response) => {
    try {
      const { provider, type } = req.body;
      const user = req.user as any;

      // Validation
      if (!provider || !type) {
        return res.status(400).json({ error: 'Provider and type required' });
      }

      if (!['google', 'outlook', 'yahoo'].includes(provider)) {
        return res.status(400).json({ error: 'Unsupported provider' });
      }

      if (!['email', 'phone', 'contacts'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type' });
      }

      // Verify user is authenticated
      if (!user || user.provider !== provider) {
        return res.status(403).json({ 
          error: 'Not authenticated',
          message: 'Please authorize with the provider first'
        });
      }

      logger.info('Account extraction initiated', { 
        provider, 
        type, 
        userId: user.profileId 
      });

      let results: any = [];

      // Extract based on provider
      if (provider === 'google') {
        results = await extractContactsFromGoogle(user.accessToken, type);
      } else if (provider === 'outlook') {
        results = await extractContactsFromOutlook(user.accessToken, type);
      }

      logger.info('Account extraction completed', { 
        provider, 
        type, 
        count: results.length 
      });

      res.json({
        success: true,
        provider,
        type,
        count: results.length,
        results,
        message: `Successfully extracted ${results.length} ${type} from ${provider}`
      });

    } catch (error: any) {
      logger.error('Account extraction error', { message: error.message });
      res.status(500).json({ error: 'Extraction failed' });
    }
  }
);

// ============================================================================
// STEP 4: Logout (Revoke Token)
// ============================================================================

/**
 * POST /api/auth/logout
 * Revokes OAuth token and clears session
 */
router.post('/logout', authenticateSession(), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (user) {
      logger.info('Revoking OAuth token', { provider: user.provider, profileId: user.profileId });

      // Revoke access token with provider
      if (user.provider === 'google') {
        await revokeGoogleToken(user.accessToken);
      } else if (user.provider === 'outlook') {
        await revokeOutlookToken(user.accessToken);
      }

      // Clear Redis
      const key = `oauth_token:${user.provider}:${user.profileId}`;
      await redisClient.del(key);
    }

    // Clear session cookie
    res.clearCookie('session_token');
    res.clearCookie('oauth_state');

    logger.info('User logged out');
    res.json({ success: true, message: 'Logged out successfully' });

  } catch (error: any) {
    logger.error('Logout error', { message: error.message });
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

function generateRandomState(): string {
  return require('crypto').randomBytes(16).toString('hex');
}

function generateSessionToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

function authenticateSession() {
  return (req: Request, res: Response, next: NextFunction) => {
    const sessionToken = req.cookies.session_token;
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate session token from Redis
    redisClient.get(`session:${sessionToken}`, (err, data) => {
      if (err || !data) {
        return res.status(401).json({ error: 'Session expired' });
      }

      req.user = JSON.parse(data);
      next();
    });
  };
}

async function revokeGoogleToken(accessToken: string): Promise<void> {
  try {
    await axios.get(`https://oauth2.googleapis.com/revoke?token=${accessToken}`);
  } catch (error) {
    logger.warn('Failed to revoke Google token');
  }
}

async function revokeOutlookToken(accessToken: string): Promise<void> {
  try {
    await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/revoke', {
      token: accessToken
    });
  } catch (error) {
    logger.warn('Failed to revoke Outlook token');
  }
}

export default router;
```

---

### PHASE 4: Data Extraction Services (Week 2)

#### Step 4.1: Create Extractor Functions
```typescript
// src/services/extractors.ts

import axios from 'axios';
import { logger } from '../logger';

/**
 * Extract contacts from Google via Google Contacts API v3
 */
export async function extractContactsFromGoogle(
  accessToken: string,
  type: 'email' | 'phone' | 'contacts'
): Promise<any[]> {
  try {
    const response = await axios.get(
      'https://www.googleapis.com/contacts/v3/people/me/connections',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          personFields: 'names,emailAddresses,phoneNumbers',
          pageSize: 100
        },
        timeout: 10000
      }
    );

    const connections = response.data.connections || [];
    const results: any[] = [];

    connections.forEach((contact: any) => {
      if (type === 'email' && contact.emailAddresses) {
        contact.emailAddresses.forEach((email: any) => {
          results.push({
            name: contact.names?.[0]?.displayName || 'Unknown',
            email: email.value,
            type: email.type || 'other'
          });
        });
      } else if (type === 'phone' && contact.phoneNumbers) {
        contact.phoneNumbers.forEach((phone: any) => {
          results.push({
            name: contact.names?.[0]?.displayName || 'Unknown',
            phone: phone.value,
            type: phone.type || 'other'
          });
        });
      } else if (type === 'contacts') {
        results.push({
          name: contact.names?.[0]?.displayName || 'Unknown',
          emails: contact.emailAddresses?.map((e: any) => e.value) || [],
          phones: contact.phoneNumbers?.map((p: any) => p.value) || []
        });
      }
    });

    logger.info('Google contacts extracted', { type, count: results.length });
    return results;

  } catch (error: any) {
    logger.error('Google extraction error', { message: error.message });
    throw new Error(`Failed to extract from Google: ${error.message}`);
  }
}

/**
 * Extract contacts from Outlook via Microsoft Graph API
 */
export async function extractContactsFromOutlook(
  accessToken: string,
  type: 'email' | 'phone' | 'contacts'
): Promise<any[]> {
  try {
    const response = await axios.get(
      'https://graph.microsoft.com/v1.0/me/contacts',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          $top: 100
        },
        timeout: 10000
      }
    );

    const contacts = response.data.value || [];
    const results: any[] = [];

    contacts.forEach((contact: any) => {
      if (type === 'email' && contact.emailAddresses) {
        contact.emailAddresses.forEach((email: any) => {
          results.push({
            name: contact.displayName || 'Unknown',
            email: email.address,
            type: email.address.split('@')[1]
          });
        });
      } else if (type === 'phone' && contact.mobilePhone) {
        results.push({
          name: contact.displayName || 'Unknown',
          phone: contact.mobilePhone
        });
      } else if (type === 'contacts') {
        results.push({
          name: contact.displayName || 'Unknown',
          emails: contact.emailAddresses?.map((e: any) => e.address) || [],
          phones: contact.mobilePhone ? [contact.mobilePhone] : []
        });
      }
    });

    logger.info('Outlook contacts extracted', { type, count: results.length });
    return results;

  } catch (error: any) {
    logger.error('Outlook extraction error', { message: error.message });
    throw new Error(`Failed to extract from Outlook: ${error.message}`);
  }
}
```

---

### PHASE 5: Frontend Integration (Week 3)

#### Step 5.1: Frontend OAuth Flow
```typescript
// src/pages/AccountExtraction.tsx

import React, { useState } from 'react';

export default function AccountExtraction() {
  const [provider, setProvider] = useState<'google' | 'outlook' | 'yahoo'>('google');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Step 1: Initiate OAuth
  const handleAuthorize = async (selectedProvider: string) => {
    window.location.href = `/api/auth/${selectedProvider}/authorize`;
  };

  // Step 2: Extract Data (after OAuth callback)
  const handleExtract = async (type: 'email' | 'phone' | 'contacts') => {
    setLoading(true);
    try {
      const response = await fetch('/api/extract-from-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, type }),
        credentials: 'include' // Include cookies
      });

      if (!response.ok) throw new Error('Extraction failed');
      
      const data = await response.json();
      setResults(data.results);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    });
    setIsAuthenticated(false);
    setResults([]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Account Extraction (OAuth 2.0)</h1>

      {!isAuthenticated ? (
        <div>
          <h2>Step 1: Authorize Account Access</h2>
          <button onClick={() => handleAuthorize('google')}>
            Authorize with Google
          </button>
          <button onClick={() => handleAuthorize('outlook')}>
            Authorize with Outlook
          </button>
          <button onClick={() => handleAuthorize('yahoo')}>
            Authorize with Yahoo
          </button>
        </div>
      ) : (
        <div>
          <h2>Step 2: Extract Data</h2>
          <button onClick={() => handleExtract('email')} disabled={loading}>
            {loading ? 'Extracting...' : 'Extract Emails'}
          </button>
          <button onClick={() => handleExtract('phone')} disabled={loading}>
            {loading ? 'Extracting...' : 'Extract Phones'}
          </button>
          <button onClick={() => handleExtract('contacts')} disabled={loading}>
            {loading ? 'Extracting...' : 'Extract Contacts'}
          </button>

          <h3>Results ({results.length})</h3>
          <pre>{JSON.stringify(results, null, 2)}</pre>

          <button onClick={handleLogout}>Logout & Revoke Access</button>
        </div>
      )}
    </div>
  );
}
```

---

### PHASE 6: Testing & Deployment (Week 4)

#### Step 6.1: Unit Tests
```typescript
// tests/oauth.test.ts

import request from 'supertest';
import app from '../src/app';

describe('OAuth Flow', () => {
  
  it('should redirect to Google consent screen', async () => {
    const response = await request(app)
      .get('/api/auth/google/authorize')
      .expect(302);

    expect(response.headers.location).toContain('accounts.google.com');
  });

  it('should reject extraction without auth', async () => {
    const response = await request(app)
      .post('/api/extract-from-account')
      .send({ provider: 'google', type: 'email' })
      .expect(401);

    expect(response.body.error).toBe('Not authenticated');
  });

  it('should handle logout', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .expect(401); // Not authenticated

    expect(response.body.error).toBe('Not authenticated');
  });
});
```

#### Step 6.2: Security Checklist
- [ ] OAuth tokens stored in Redis with TTL
- [ ] Session cookies httpOnly + secure + sameSite
- [ ] State parameter used to prevent CSRF
- [ ] Tokens revoked on logout
- [ ] No passwords stored or logged
- [ ] API calls use HTTPS only
- [ ] Rate limiting on extraction endpoint
- [ ] Input validation on all parameters

---

## 🚀 Rollout Timeline

### Week 1
- [ ] Add dependencies
- [ ] Configure OAuth providers (Google, Outlook, Yahoo)
- [ ] Setup Passport strategies
- [ ] Create Redis for token storage

### Week 2
- [ ] Implement API routes (authorize, callback, extract, logout)
- [ ] Create data extraction services
- [ ] Add error handling & logging
- [ ] Test OAuth flow locally

### Week 3
- [ ] Frontend integration
- [ ] UI/UX for OAuth buttons
- [ ] Test with real Google/Outlook accounts
- [ ] Security review

### Week 4
- [ ] Deploy to staging
- [ ] Load testing
- [ ] Security audit
- [ ] Production rollout

---

## 🔒 Security Considerations

✅ **Tokens**: Stored in Redis with TTL (time-limited access)  
✅ **Session**: Cookies are httpOnly + secure + sameSite=lax  
✅ **CSRF**: State parameter prevents token hijacking  
✅ **Logging**: No credentials, tokens, or user data logged  
✅ **Revocation**: Tokens revoked on logout (user control)  
✅ **HTTPS**: All OAuth calls require HTTPS  
✅ **Rate Limiting**: 5 requests/minute on extraction  
✅ **Validation**: Provider & type validated, strict enum checks  

---

## 📋 Deployment Checklist

- [ ] All OAuth provider credentials configured
- [ ] Redis service running (token storage)
- [ ] Session secret is strong & random
- [ ] HTTPS enforced in production
- [ ] Rate limits acceptable
- [ ] Logging configured (no secrets)
- [ ] Error pages user-friendly
- [ ] Security headers set (HSTS, CSP, X-Frame-Options)

---

## 🆘 Troubleshooting

### "Redirect URI mismatch"
→ Verify `GOOGLE_OAUTH_CALLBACK_URL` matches provider settings  
→ Use exact domain including protocol: `https://yourdomain.com/api/auth/google/callback`  

### "Invalid access token"
→ Check token TTL in Redis  
→ Verify token hasn't expired  
→ Regenerate fresh access token  

### "Session expired"
→ Increase Redis TTL (default: 24 hours)  
→ Check Redis connection  
→ Clear browser cookies & try again  

### "Rate limit exceeded"
→ Wait 1 minute before retry  
→ Check IP address (might be behind proxy)  
→ Adjust `strictLimiter` settings if needed  

---

## 📚 References

- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Outlook OAuth Docs](https://docs.microsoft.com/en-us/graph/auth-v2-oauth2-auth-code-flow)
- [Passport.js Docs](http://www.passportjs.org/)
- [Redis Session Store](https://github.com/tj/connect-redis)

---

**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Timeline:** 2-4 weeks post-launch  
**Priority:** HIGH (Security upgrade from current implementation)  
**Effort:** Medium (4-5 developer days)  

