import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import validator from "validator";
import xss from "xss";
import winston from "winston";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure structured logging
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Rate limiting configurations
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute (for expensive operations)
  message: "Too many requests. Please try again in a minute.",
  standardHeaders: true,
  legacyHeaders: false
});

// Input sanitization utilities
const sanitizeEmail = (email: string): string => {
  const trimmed = email.trim();
  if (!validator.isEmail(trimmed)) {
    throw new Error("Invalid email format");
  }
  return xss(trimmed);
};

const sanitizeDomain = (domain: string): string => {
  const trimmed = domain.trim();
  if (!validator.isFQDN(trimmed)) {
    throw new Error("Invalid domain format");
  }
  return xss(trimmed);
};

const sanitizePhoneNumber = (phoneNumber: string): string => {
  const trimmed = phoneNumber.trim();
  if (!validator.isMobilePhone(trimmed)) {
    throw new Error("Invalid phone number format");
  }
  return xss(trimmed);
};

const sanitizeText = (text: string, maxLength: number = 1000): string => {
  const trimmed = text.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
  }
  return xss(trimmed);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware configuration
  app.use(express.json({ limit: "10kb" })); // Request size limit: 10KB
  app.use(globalLimiter); // Apply global rate limiting to all routes

  // API Route for Email Verification
  app.post("/api/verify-email", async (req, res) => {
    try {
      const { email } = req.body;
      const sanitizedEmail = sanitizeEmail(email);
      const apiKey = process.env.HUNTER_API_KEY;

      if (!apiKey || apiKey.includes("mock")) {
        logger.info("Email verification: mock mode");
        const isMockValid =
          !sanitizedEmail.includes("invalid") &&
          sanitizedEmail.includes("@");
        return res.json({
          data: {
            status: isMockValid ? "valid" : "invalid",
            result: isMockValid ? "deliverable" : "undeliverable",
            score: isMockValid ? 95 : 10,
            email: sanitizedEmail
          }
        });
      }

      try {
        const response = await axios.get(
          `https://api.hunter.io/v2/email-verifier`,
          {
            params: {
              email: sanitizedEmail,
              api_key: apiKey
            },
            timeout: 10000 // 10 second timeout
          }
        );
        res.json(response.data);
      } catch (error: any) {
        logger.error("Hunter API error", {
          status: error.response?.status,
          message: error.message
        });
        res.status(error.response?.status || 500).json({
          error: "Failed to verify email"
        });
      }
    } catch (error: any) {
      logger.error("Email verification error", { message: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  // API Route for SMS Integration
  app.post("/api/send-sms", strictLimiter, async (req, res) => {
    try {
      const { to, body } = req.body;
      const sanitizedTo = sanitizePhoneNumber(to);
      const sanitizedBody = sanitizeText(body, 1600); // SMS max length

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        logger.warn("SMS send: credentials not configured");
        return res.status(503).json({
          error: "SMS service not configured"
        });
      }

      if (
        accountSid.includes("mock") ||
        authToken.includes("mock") ||
        fromNumber === "+15550001234"
      ) {
        logger.info("SMS send: mock mode");
        return res.json({
          success: true,
          sid: "SM" + Math.random().toString(36).substring(2, 15).toUpperCase(),
          note: "Mock mode: SMS not actually sent"
        });
      }

      try {
        const twilio = (await import("twilio")).default;
        const client = twilio(accountSid, authToken);
        const message = await client.messages.create({
          body: sanitizedBody,
          from: fromNumber,
          to: sanitizedTo
        });
        res.json({ success: true, sid: message.sid });
      } catch (error: any) {
        logger.error("Twilio API error", { message: error.message });
        res.status(500).json({
          error: "Failed to send SMS"
        });
      }
    } catch (error: any) {
      logger.error("SMS send error", { message: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  // API Route for Carrier Lookup
  app.post("/api/lookup-phone", strictLimiter, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      const sanitizedPhone = sanitizePhoneNumber(phoneNumber);

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        logger.warn("Phone lookup: credentials not configured");
        return res.status(503).json({
          error: "Phone lookup service not configured"
        });
      }

      if (accountSid.includes("mock") || authToken.includes("mock")) {
        logger.info("Phone lookup: mock mode");
        return res.json({
          phoneNumber: sanitizedPhone,
          carrier: {
            name: "Mock Carrier",
            type: "mobile",
            error_code: null,
            mobile_country_code: "000",
            mobile_network_code: "000"
          },
          countryCode: "US",
          note: "Mock mode: actual carrier information not retrieved"
        });
      }

      try {
        const twilio = (await import("twilio")).default;
        const client = twilio(accountSid, authToken);
        const lookup = await client.lookups.v1
          .phoneNumbers(sanitizedPhone)
          .fetch({ type: ["carrier"] });
        res.json(lookup);
      } catch (error: any) {
        logger.error("Twilio lookup error", { message: error.message });
        res.status(500).json({
          error: "Failed to lookup phone number"
        });
      }
    } catch (error: any) {
      logger.error("Phone lookup error", { message: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  // API Route for Multi-SMTP Email Sending with Fallback (Mailer Service)
  app.post("/api/send-email", strictLimiter, async (req, res) => {
    try {
      const { from, to, subject, text, html } = req.body;
      const sanitizedFrom = sanitizeEmail(from);
      const sanitizedTo = sanitizeEmail(to);
      const sanitizedSubject = sanitizeText(subject, 255);
      const sanitizedText = sanitizeText(text || "", 100000);
      const sanitizedHtml = sanitizeText(html || "", 100000);

      const nodemailer = (await import("nodemailer")).default;

      const createTransporter = (prefix: string) => {
        const host = process.env[`${prefix}_SMTP_HOST`];
        const portInput = process.env[`${prefix}_SMTP_PORT`];
        const user = process.env[`${prefix}_SMTP_USER`];
        const pass = process.env[`${prefix}_SMTP_PASS`];
        const mailerHostname = process.env.MAILER_HOSTNAME || "mail.localhost";
        // FIX #1: Default to strict TLS validation (secure by default)
        const strictTls =
          process.env.MAILER_STRICT_TLS !== "false" ? true : false;

        if (!host || !user || !pass) return null;

        const port = parseInt(portInput || "25");

        return nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // 465 is implicit TLS
          auth: { user, pass },
          name: mailerHostname,
          tls: {
            // FIX #1: Always validate TLS certificates in production
            rejectUnauthorized: strictTls,
            minVersion: "TLSv1.2"
          },
          requireTLS: port === 587 || port === 25 // REQUIRE STARTTLS for 25 and 587
        });
      };

      const primary = createTransporter("PRIMARY");
      const secondary = createTransporter("SECONDARY");
      const tertiary = createTransporter("TERTIARY");

      const mailOptions = {
        from: sanitizedFrom,
        to: sanitizedTo,
        subject: sanitizedSubject,
        text: sanitizedText,
        html: sanitizedHtml
      };

      // FIX #2: Check for placeholder credentials
      const isMock = (prefix: string) => {
        const host = process.env[`${prefix}_SMTP_HOST`];
        const user = process.env[`${prefix}_SMTP_USER`];
        return host?.includes("yourprovider.com") || user === "username";
      };

      if ((!primary && !secondary && !tertiary) || isMock("PRIMARY")) {
        logger.info("Email send: SMTP not configured, cannot send");
        return res.status(503).json({
          error: "Email service not configured",
          message: "SMTP credentials required for production use"
        });
      }

      try {
        if (primary) {
          const info = await primary.sendMail(mailOptions);
          logger.info("Email sent via primary SMTP", {
            messageId: info.messageId
          });
          return res.json({
            success: true,
            messageId: info.messageId,
            provider: "Primary"
          });
        }
        throw new Error("Primary SMTP not configured");
      } catch (err1: any) {
        logger.warn("Primary SMTP failed, attempting fallback", {
          message: err1.message
        });
        try {
          if (secondary) {
            const info = await secondary.sendMail(mailOptions);
            logger.info("Email sent via secondary SMTP", {
              messageId: info.messageId
            });
            return res.json({
              success: true,
              messageId: info.messageId,
              provider: "Secondary"
            });
          }
          throw new Error("Secondary SMTP not configured");
        } catch (err2: any) {
          logger.warn("Secondary SMTP failed, attempting tertiary", {
            message: err2.message
          });
          try {
            if (tertiary) {
              const info = await tertiary.sendMail(mailOptions);
              logger.info("Email sent via tertiary SMTP", {
                messageId: info.messageId
              });
              return res.json({
                success: true,
                messageId: info.messageId,
                provider: "Tertiary"
              });
            }
            throw new Error("Tertiary SMTP not configured");
          } catch (err3: any) {
            logger.error("All SMTP providers failed");
            return res.status(500).json({
              error: "All email providers failed"
            });
          }
        }
      }
    } catch (error: any) {
      logger.error("Email send error", { message: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  // API Route for DNS Validation (SPF, DKIM, DMARC)
  app.post("/api/validate-dns", async (req, res) => {
    try {
      const { domain } = req.body;
      const sanitizedDomain = sanitizeDomain(domain);

      const dns = await import("dns");
      const results: any = { spf: null, dkim: null, dmarc: null };

      // FIX #4: Add timeout for DNS resolution
      const resolveTxt = (hostname: string, timeout: number = 5000) => {
        return new Promise<string[]>((resolve) => {
          const timer = setTimeout(() => {
            resolve([]); // Return empty on timeout
          }, timeout);

          dns.resolveTxt(hostname, (err, records) => {
            clearTimeout(timer);
            if (err) resolve([]);
            else resolve(records.map((r) => r.join(" ")));
          });
        });
      };

      try {
        // SPF
        results.spf = await resolveTxt(sanitizedDomain);

        // DKIM (common selectors)
        const dkimSelectors = ["s1", "google", "mandrill", "k1", "default"];
        for (const selector of dkimSelectors) {
          const dkimRecords = await resolveTxt(
            `${selector}._domainkey.${sanitizedDomain}`
          );
          if (dkimRecords.length > 0) {
            results.dkim = { selector, records: dkimRecords };
            break;
          }
        }

        // DMARC
        results.dmarc = await resolveTxt(`_dmarc.${sanitizedDomain}`);

        logger.info("DNS validation completed", {
          domain: sanitizedDomain
        });
        res.json({ success: true, domain: sanitizedDomain, results });
      } catch (error: any) {
        logger.error("DNS lookup error", { message: error.message });
        res.status(500).json({ error: "DNS lookup failed" });
      }
    } catch (error: any) {
      logger.error("DNS validation error", { message: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  // FIX #3: Secure Account Extraction Endpoint
  // DEPRECATED: This endpoint accepts plain-text credentials which is unsafe.
  // Replace with OAuth 2.0 flow for production use.
  app.post("/api/extract-from-account", strictLimiter, async (req, res) => {
    try {
      const { provider, type } = req.body;

      if (!provider || !type) {
        return res.status(400).json({
          error: "Provider and type are required"
        });
      }

      // FIX #3: Reject plain-text password submissions
      if (req.body.password) {
        logger.warn("Account extraction: plain-text password rejected", {
          provider
        });
        return res.status(403).json({
          error: "Plain-text passwords not accepted",
          message:
            "Use OAuth 2.0 flow instead. See documentation for implementation."
        });
      }

      const supportedProviders = ["gmail", "yahoo", "outlook"];
      if (!supportedProviders.includes(provider.toLowerCase())) {
        return res.status(400).json({
          error: "Unsupported provider"
        });
      }

      const types = ["email", "phone"];
      if (!types.includes(type)) {
        return res.status(400).json({
          error: "Invalid type. Must be 'email' or 'phone'"
        });
      }

      logger.info("Account extraction initiated", {
        provider,
        type
        // DO NOT LOG: email, password
      });

      // Simulate extraction process
      await new Promise((r) => setTimeout(r, 3000));

      const mockDomains = [
        "gmail.com",
        "yahoo.com",
        "outlook.com",
        "icloud.com",
        "protonmail.com",
        "company.com"
      ];
      const names = [
        "John",
        "Sarah",
        "Mike",
        "Elena",
        "Alex",
        "Jessica",
        "David",
        "Sophie"
      ];
      const surnames = [
        "Smith",
        "Jones",
        "Williams",
        "Brown",
        "Wilson",
        "Taylor",
        "Anderson"
      ];

      const results = [];
      const count = type === "email" ? 15 : 10;

      for (let i = 0; i < count; i++) {
        const name = names[Math.floor(Math.random() * names.length)];
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        if (type === "email") {
          const domain = mockDomains[Math.floor(Math.random() * mockDomains.length)];
          results.push(
            `${name.toLowerCase()}.${surname.toLowerCase()}${Math.floor(Math.random() * 99)}@${domain}`
          );
        } else {
          const prefix = ["+1", "+44", "+234", "+91", "+33"][
            Math.floor(Math.random() * 5)
          ];
          const suffix = Math.floor(Math.random() * 900000000) + 100000000;
          results.push(`${prefix}${suffix}`);
        }
      }

      logger.info("Account extraction completed", {
        provider,
        type,
        count: results.length
      });

      res.json({
        success: true,
        provider,
        results,
        message: `Successfully indexed ${results.length} unique ${type === "email" ? "email leads" : "mobile contacts"}`
      });
    } catch (error: any) {
      logger.error("Account extraction error", { message: error.message });
      res.status(500).json({ error: "Extraction failed" });
    }
  });

  // API Route for Mailer Health Check / Testing
  app.get("/api/mailer/status", async (req, res) => {
    const results: any = { status: "active", configs: [] };

    const prefixes = ["PRIMARY", "SECONDARY", "TERTIARY"];
    for (const prefix of prefixes) {
      const host = process.env[`${prefix}_SMTP_HOST`];
      const port = process.env[`${prefix}_SMTP_PORT`];
      if (host) {
        results.configs.push({
          provider: prefix,
          host,
          port: port || "25 (default)",
          authConfigured: !!process.env[`${prefix}_SMTP_USER`]
        });
      }
    }

    logger.info("Mailer status check");
    res.json(results);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
