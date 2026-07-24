/**
 * Input validation and sanitization utilities
 * Prevents injection attacks, XSS, and data validation errors
 */

/**
 * Validate email format
 * Uses standard email regex pattern
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

/**
 * Validate URL format
 * Ensures valid URL with http/https protocol
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url.trim());
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate phone number format
 * Accepts various international formats
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Remove common separators
  const cleaned = phone.replace(/[\s\-\(\)\+\.]/g, '');
  // Check if it's a valid phone number (7-15 digits)
  return /^\d{7,15}$/.test(cleaned);
}

/**
 * Sanitize text input
 * Removes HTML/script tags and trims whitespace
 * Limits length to prevent buffer overflows
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text || typeof text !== 'string') return '';
  
  // Trim whitespace
  let sanitized = text.trim();
  
  // Remove HTML/script tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize email list (comma or newline separated)
 */
export function validateEmailList(emailsText: string, maxEmails: number = 1000): {
  valid: string[];
  invalid: string[];
} {
  if (!emailsText || typeof emailsText !== 'string') {
    return { valid: [], invalid: [] };
  }
  
  // Split by comma or newline
  const emails = emailsText
    .split(/[\n,]/)
    .map(e => e.trim())
    .filter(e => e.length > 0)
    .slice(0, maxEmails);
  
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const email of emails) {
    if (validateEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }
  
  return { valid, invalid };
}

/**
 * Validate text field length constraints
 */
export function validateFieldLength(
  value: string,
  minLength: number = 0,
  maxLength: number = 1000
): boolean {
  if (!value || typeof value !== 'string') return minLength === 0;
  const len = value.trim().length;
  return len >= minLength && len <= maxLength;
}

/**
 * Validate number is within range
 */
export function validateNumberRange(
  value: any,
  min: number = 0,
  max: number = Infinity
): boolean {
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate file upload constraints
 */
export function validateFileUpload(
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = []
): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }
  
  // Check file type if specified
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { isValid: true };
}

/**
 * Create validation error response
 */
export function createValidationError(fieldName: string, reason: string): string {
  return `Invalid ${fieldName}: ${reason}`;
}
