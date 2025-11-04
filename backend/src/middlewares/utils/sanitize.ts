/**
 * Log Sanitization Utility
 *
 * Prevents sensitive data from being logged (passwords, tokens, API keys, etc.)
 * to comply with security best practices and data protection regulations.
 */

/**
 * Sensitive field names to redact from logs (case-insensitive matching)
 */
const SENSITIVE_FIELDS = new Set([
  // Authentication & Authorization
  "password",
  "newpassword",
  "oldpassword",
  "currentpassword",
  "confirmpassword",
  "passwd",
  "pwd",
  "secret",
  "token",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "api_key",
  "authorization",
  "auth",
  "bearer",
  "cookie",
  "session",
  "sessionid",
  "csrf",
  "csrftoken",
  "xsrftoken",

  // Payment & Financial
  "creditcard",
  "cardnumber",
  "cvv",
  "cvc",
  "pin",
  "accountnumber",
  "routingnumber",
  "iban",
  "swift",

  // Personal Identifiable Information (PII)
  "ssn",
  "socialsecuritynumber",
  "taxid",
  "passport",
  "driverlicense",
  "nationalid",

  // Security
  "privatekey",
  "publickey",
  "encryptionkey",
  "secretkey",
  "apiSecret",
  "clientsecret",
  "client_secret",
]);

/**
 * Redacted placeholder value
 */
const REDACTED = "[REDACTED]";

/**
 * Check if a field name is sensitive (case-insensitive)
 * Removes underscores, hyphens, and handles x-prefixed headers
 */
function isSensitiveField(fieldName: string): boolean {
  // Normalize: lowercase, remove special chars, strip x- prefix from headers
  const normalized = fieldName
    .toLowerCase()
    .replace(/^x-/, "") // Remove x- prefix (e.g., x-api-key -> apikey)
    .replace(/[_-]/g, ""); // Remove underscores and hyphens

  return SENSITIVE_FIELDS.has(normalized);
}

/**
 * Sanitize a value recursively, redacting sensitive fields
 *
 * @param value - Value to sanitize (can be object, array, or primitive)
 * @param depth - Current recursion depth (prevents infinite loops)
 * @returns Sanitized value with sensitive fields redacted
 */
export function sanitize(value: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) {
    return "[MAX_DEPTH]";
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  // Handle objects
  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      if (isSensitiveField(key)) {
        sanitized[key] = REDACTED;
      } else {
        sanitized[key] = sanitize(val, depth + 1);
      }
    }

    return sanitized;
  }

  // Return primitives as-is
  return value;
}

/**
 * Sanitize HTTP headers, redacting sensitive headers
 *
 * @param headers - HTTP headers object
 * @returns Sanitized headers with sensitive values redacted
 */
export function sanitizeHeaders(
  headers: Record<string, unknown>,
): Record<string, unknown> {
  return sanitize(headers) as Record<string, unknown>;
}

/**
 * Sanitize request body, redacting sensitive fields
 *
 * @param body - Request body object
 * @returns Sanitized body with sensitive fields redacted
 */
export function sanitizeBody(body: unknown): unknown {
  return sanitize(body);
}

/**
 * Sanitize query parameters, redacting sensitive fields
 *
 * @param query - Query parameters object
 * @returns Sanitized query with sensitive fields redacted
 */
export function sanitizeQuery(
  query: Record<string, unknown>,
): Record<string, unknown> {
  return sanitize(query) as Record<string, unknown>;
}
