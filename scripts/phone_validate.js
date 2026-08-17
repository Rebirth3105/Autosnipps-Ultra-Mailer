import fs from 'fs';

const path = 'combined.csv';
const out = 'invalid_phones.csv';
const text = fs.readFileSync(path, 'utf8');
const lines = text.trim().split('\n');
if (lines.length <= 1) { console.error('No data'); process.exit(1); }
const header = lines.shift();

const results = [];
for (const line of lines) {
    if (!line) continue;
    const parts = line.split(',');
    const id = parts[0];
    const mobile = (parts[2] || '').trim();
    const m = mobile.match(/^\+(\d+)$/);
    if (!m) {
        results.push([id, mobile, 'format']);
        continue;
    }
    const digits = m[1];
    if (digits.length < 6 || digits.length > 15) {
        results.push([id, mobile, 'bad_length']);
    }
}

if (results.length === 0) {
    console.log('No invalid phones found.');
} else {
    const csv = ['id,mobile,reason', ...results.map(r => r.join(','))].join('\n');
    fs.writeFileSync(out, csv);
    console.log(`Wrote ${out} (${results.length} entries).`);
}
