import test from 'node:test';
import assert from 'node:assert/strict';

import { sanitizeText, validateEmail, validateUrl } from './validators';

test('sanitizeText strips script payloads and dangerous handlers', () => {
  const input = 'Hello <script>alert(1)</script> <a href="javascript:alert(1)" onclick="evil()">link</a>'; 
  const sanitized = sanitizeText(input, 500);

  assert.equal(sanitized.includes('<script'), false);
  assert.equal(sanitized.includes('javascript:'), false);
  assert.equal(sanitized.includes('onclick'), false);
  assert.equal(sanitized.includes('link'), true);
});

test('validateUrl rejects javascript scheme and accepts valid https URLs', () => {
  assert.equal(validateUrl('javascript:alert(1)'), false);
  assert.equal(validateUrl('https://example.com/path?q=and'), true);
  assert.equal(validateEmail('user@example.com'), true);
});
