import fs from 'fs';

const path = 'combined.csv';
const out = 'cleaned_combined.csv';
const text = fs.readFileSync(path, 'utf8');
const lines = text.trim().split('\n');
if (lines.length <= 1) { console.error('No data'); process.exit(1); }
const header = lines.shift();

const seenEmails = new Set();
const seenMobiles = new Set();
const outLines = [header];
let removed = 0;

for (const line of lines) {
    if (!line) continue;
    const parts = line.split(',');
    const email = (parts[1] || '').toLowerCase().trim();
    const mobile = (parts[2] || '').trim();
    if (seenEmails.has(email) || seenMobiles.has(mobile)) {
        removed++;
        continue;
    }
    seenEmails.add(email);
    seenMobiles.add(mobile);
    outLines.push(line);
}

fs.writeFileSync(out, outLines.join('\n'));
console.log(`Wrote ${out} (${outLines.length - 1} rows). Removed ${removed} duplicates.`);
