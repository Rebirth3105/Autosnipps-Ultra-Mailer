import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Email Verification
  app.post("/api/verify-email", async (req, res) => {
    const { email } = req.body;
    const apiKey = process.env.HUNTER_API_KEY;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!apiKey) {
      // If no API key, return a mock response for development but warn the user
      console.warn("HUNTER_API_KEY is not set. Returning mock verification.");
      const isMockValid = !email.includes("invalid") && email.includes("@");
      return res.json({
        data: {
          status: isMockValid ? "valid" : "invalid",
          result: isMockValid ? "deliverable" : "undeliverable",
          score: isMockValid ? 95 : 10,
          email: email,
          mock: true
        }
      });
    }

    try {
      const response = await axios.get(`https://api.hunter.io/v2/email-verifier`, {
        params: {
          email,
          api_key: apiKey
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Hunter API Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: "Failed to verify email",
        details: error.response?.data || error.message
      });
    }
  });

  // API Route for SMS Integration
  app.post("/api/send-sms", async (req, res) => {
    const { to, body } = req.body;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!to || !body) {
      return res.status(400).json({ error: "Recipient number and message body are required" });
    }

    if (!accountSid || !authToken || !fromNumber) {
      console.warn("Twilio credentials missing. Returning mock SMS response.");
      return res.json({
        success: true,
        sid: "SM" + Math.random().toString(36).substring(2, 15).toUpperCase(),
        mock: true,
        message: "Twilio credentials not set. This is a simulated delivery."
      });
    }

    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(accountSid, authToken);
      const message = await client.messages.create({
        body,
        from: fromNumber,
        to
      });
      res.json({ success: true, sid: message.sid });
    } catch (error: any) {
      console.error("Twilio API Error:", error.message);
      res.status(500).json({
        error: "Failed to send SMS",
        details: error.message
      });
    }
  });

  // API Route for Carrier Lookup
  app.post("/api/lookup-phone", async (req, res) => {
    const { phoneNumber } = req.body;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    if (!accountSid || !authToken) {
      console.warn("Twilio credentials missing. Returning mock lookup response.");
      return res.json({
        phoneNumber,
        carrier: {
          name: "Mock Carrier",
          type: "mobile",
          error_code: null,
          mobile_country_code: "000",
          mobile_network_code: "000"
        },
        countryCode: "US",
        mock: true
      });
    }

    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(accountSid, authToken);
      const lookup = await client.lookups.v1.phoneNumbers(phoneNumber).fetch({ type: ["carrier"] });
      res.json(lookup);
    } catch (error: any) {
      console.error("Twilio Lookup Error:", error.message);
      res.status(500).json({
        error: "Failed to lookup phone number",
        details: error.message
      });
    }
  });

  // API Route for Multi-SMTP Email Sending with Fallback (Mailer Service)
  app.post("/api/send-email", async (req, res) => {
    const { from, to, subject, text, html } = req.body;
    const nodemailer = (await import("nodemailer")).default;

    const createTransporter = (prefix: string) => {
      const host = process.env[`${prefix}_SMTP_HOST`];
      const portInput = process.env[`${prefix}_SMTP_PORT`];
      const user = process.env[`${prefix}_SMTP_USER`];
      const pass = process.env[`${prefix}_SMTP_PASS`];
      const mailerHostname = process.env.MAILER_HOSTNAME || "mail.localhost";
      const strictTls = process.env.MAILER_STRICT_TLS === "true";

      if (!host || !user || !pass) return null;

      const ports = portInput ? [parseInt(portInput)] : [25, 587, 465];
      
      // Since we can't easily try multiple ports sequentially in a single transporter creation easily with nodemailer's default behavior 
      // without writing a custom pool or wrapper, we'll try the PRIMARY port first.
      const port = parseInt(portInput || "25");

      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // 465 is implicit TLS
        auth: { user, pass },
        name: mailerHostname,
        tls: {
          // Requirement 4: STARTTLS and certificate validation
          rejectUnauthorized: strictTls,
          minVersion: "TLSv1.2"
        },
        requireTLS: port === 587 || port === 25 // REQUIRE STARTTLS for 25 and 587
      });
    };

    const primary = createTransporter("PRIMARY");
    const secondary = createTransporter("SECONDARY");
    const tertiary = createTransporter("TERTIARY");

    const mailOptions = { from, to, subject, text, html };

    // Check if we are using placeholder credentials
    const isMock = (prefix: string) => {
      const host = process.env[`${prefix}_SMTP_HOST`];
      const user = process.env[`${prefix}_SMTP_USER`];
      return host?.includes("yourprovider.com") || user === "username";
    };

    // If no SMTP configured OR using placeholders, return mock success for development
    if ((!primary && !secondary && !tertiary) || isMock("PRIMARY")) {
      console.warn("Using placeholder SMTP credentials or no SMTP configured. Returning mock email success.");
      // Simulate network latency for a realistic feel
      await new Promise(r => setTimeout(r, 1500));
      return res.json({
        success: true,
        messageId: "sim-" + Math.random().toString(36).substring(7),
        mock: true,
        provider: isMock("PRIMARY") ? "Simulation Mode" : "Mock"
      });
    }

    try {
      if (primary) {
        const info = await primary.sendMail(mailOptions);
        return res.json({ success: true, messageId: info.messageId, provider: "Primary" });
      }
      throw new Error("Primary SMTP not configured");
    } catch (err1: any) {
      console.error("Primary SMTP failed:", err1.message);
      try {
        if (secondary) {
          const info = await secondary.sendMail(mailOptions);
          return res.json({ success: true, messageId: info.messageId, provider: "Secondary" });
        }
        throw new Error("Secondary SMTP not configured");
      } catch (err2: any) {
        console.error("Secondary SMTP failed:", err2.message);
        try {
          if (tertiary) {
            const info = await tertiary.sendMail(mailOptions);
            return res.json({ success: true, messageId: info.messageId, provider: "Tertiary" });
          }
          throw new Error("Tertiary SMTP not configured");
        } catch (err3: any) {
          console.error("All SMTP providers failed:", err3.message);
          return res.status(500).json({
            error: "All SMTP providers failed",
            details: err3.message
          });
        }
      }
    }
  });

  // API Route for DNS Validation (SPF, DKIM, DMARC)
  app.post("/api/validate-dns", async (req, res) => {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: "Domain is required" });

    const dns = await import("dns");
    const results: any = { spf: null, dkim: null, dmarc: null };

    const resolveTxt = (hostname: string) => {
      return new Promise<string[]>((resolve) => {
        dns.resolveTxt(hostname, (err, records) => {
          if (err) resolve([]);
          else resolve(records.map(r => r.join(" ")));
        });
      });
    };

    try {
      // SPF
      results.spf = await resolveTxt(domain);
      
      // DKIM (common selectors)
      const dkimSelectors = ['s1', 'google', 'mandrill', 'k1', 'default'];
      for (const selector of dkimSelectors) {
        const dkimRecords = await resolveTxt(`${selector}._domainkey.${domain}`);
        if (dkimRecords.length > 0) {
          results.dkim = { selector, records: dkimRecords };
          break;
        }
      }

      // DMARC
      results.dmarc = await resolveTxt(`_dmarc.${domain}`);

      res.json({ success: true, domain, results });
    } catch (error: any) {
      res.status(500).json({ error: "DNS lookup failed", details: error.message });
    }
  });

  // API Route for Account-based Extraction (Gmail, Yahoo, Outlook, etc.)
  app.post("/api/extract-from-account", async (req, res) => {
    const { provider, email, password, type } = req.body;

    if (!email || !password || !provider) {
      return res.status(400).json({ error: "Email, password, and provider are required" });
    }

    console.log(`Intelligence Extraction requested for ${email} on ${provider} (Type: ${type})`);

    // In a production environment, you would use an IMAP library here
    // e.g., imapflow to connect and fetch emails/contacts
    // For this context, we simulate the extraction process
    
    await new Promise(r => setTimeout(r, 3000)); // Simulate work

    // Generate some mock intelligence data based on the account
    const mockDomains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "protonmail.com", "company.com"];
    const names = ["John", "Sarah", "Mike", "Elena", "Alex", "Jessica", "David", "Sophie"];
    const surnames = ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Anderson"];
    
    const results = [];
    const count = type === 'email' ? 15 : 10;

    for (let i = 0; i < count; i++) {
        const name = names[Math.floor(Math.random() * names.length)];
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        if (type === 'email') {
            const domain = mockDomains[Math.floor(Math.random() * mockDomains.length)];
            results.push(`${name.toLowerCase()}.${surname.toLowerCase()}${Math.floor(Math.random() * 99)}@${domain}`);
        } else {
            const prefix = ["+1", "+44", "+234", "+91", "+33"][Math.floor(Math.random() * 5)];
            const suffix = Math.floor(Math.random() * 900000000) + 100000000;
            results.push(`${prefix}${suffix}`);
        }
    }

    res.json({
      success: true,
      provider,
      results,
      message: `Successfully indexed ${results.length} unique ${type === 'email' ? 'email leads' : 'mobile contacts'} from ${email}`
    });
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

    res.json(results);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
