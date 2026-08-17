import fs from 'fs';

const path = 'combined.csv';
const text = fs.readFileSync(path, 'utf8');
const lines = text.trim().split('\n');
if (lines.length <= 1) { console.error('No data'); process.exit(1); }
lines.shift(); // header

const known = ['234', '44', '91', '86', '55', '33', '39', '81', '61', '1', '7', '62', '27', '20', '380', '213', '34', '49'];
const domains = {};
const country = {};
const emails = new Set();
const mobiles = new Set();
let dupEmails = 0;
let dupMobiles = 0;
const invalidPhones = [];

for (const line of lines) {
    if (!line) continue;
    const parts = line.split(',');
    const id = parts[0];
    const email = (parts[1] || '').toLowerCase().trim();
    const mobile = (parts[2] || '').trim();
    const domain = email.includes('@') ? email.split('@')[1] : '';
    domains[domain] = (domains[domain] || 0) + 1;
    const m = mobile.match(/^\+(\d+)$/);
    if (m) {
        const digits = m[1];
        let code = null;
        for (const k of known) { if (digits.startsWith(k)) { code = k; break; } }
        if (!code) code = digits.slice(0, Math.min(3, digits.length));
        country[code] = (country[code] || 0) + 1;
        if (!(digits.length >= 6 && digits.length <= 15)) invalidPhones.push([id, mobile, 'bad_length']);
    } else {
        invalidPhones.push([id, mobile, 'format']);
    }
    if (emails.has(email)) dupEmails++; else emails.add(email);
    if (mobiles.has(mobile)) dupMobiles++; else mobiles.add(mobile);
}

function topCounts(obj, n) {
    return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
}

const report = {
    rows: lines.filter(Boolean).length,
    unique_emails: emails.size,
    duplicate_emails: dupEmails,
    unique_mobiles: mobiles.size,
    duplicate_mobiles: dupMobiles,
    top_domains: topCounts(domains, 20),
    top_country_codes: topCounts(country, 20),
    invalid_phones_sample: invalidPhones.slice(0, 20)
};

console.log(JSON.stringify(report, null, 2));
