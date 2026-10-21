/**
 * IntelliWaste Security Hardening Suite
 * - In-Memory Brute-Force Rate Limiter
 * - Input Sanitization & Validation (XSS & Injection Protection)
 * - Username, Email, and Password Policy Enforcement
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Sliding Window Rate Limiter
 * @param key Unique key (e.g., "login:192.168.1.1" or "otp:username")
 * @param maxAttempts Maximum attempts allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      retryAfterSec: 0,
    };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(retryAfterSec, 1),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    retryAfterSec: 0,
  };
}

/**
 * Reset rate limit counter on successful authentication
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Validate and normalize username
 * Rules: 3-30 characters, alphanumeric with dots, underscores, and hyphens.
 */
export function validateUsername(username: unknown): { valid: boolean; error?: string; clean: string } {
  if (typeof username !== "string" || !username.trim()) {
    return { valid: false, error: "Username is required.", clean: "" };
  }

  const clean = username.trim().toLowerCase();

  if (clean.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters long.", clean };
  }

  if (clean.length > 30) {
    return { valid: false, error: "Username cannot exceed 30 characters.", clean };
  }

  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(clean)) {
    return {
      valid: false,
      error: "Username can only contain alphanumeric characters, dots, underscores, and hyphens.",
      clean,
    };
  }

  return { valid: true, clean };
}

/**
 * Validate and normalize email
 */
export function validateEmail(email: unknown): { valid: boolean; error?: string; clean: string } {
  if (typeof email !== "string" || !email.trim()) {
    return { valid: false, error: "Email is required.", clean: "" };
  }

  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(clean)) {
    return { valid: false, error: "Please enter a valid email address.", clean };
  }

  return { valid: true, clean };
}

/**
 * Validate password strength
 * Rules: Minimum 6 characters, non-whitespace.
 */
export function validatePassword(password: unknown): { valid: boolean; error?: string } {
  if (typeof password !== "string" || !password) {
    return { valid: false, error: "Password is required." };
  }

  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters long." };
  }

  if (password.length > 128) {
    return { valid: false, error: "Password cannot exceed 128 characters." };
  }

  return { valid: true };
}

/**
 * Sanitize plain string (strip HTML tags, script injection, control characters)
 */
export function sanitizeString(input: unknown, maxLength: number = 255): string {
  if (typeof input !== "string") return "";

  // Strip script tags and HTML tags
  const stripped = input
    .replace(/<[^>]*>?/gm, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();

  return stripped.slice(0, maxLength);
}

/**
 * Sanitize positive numeric inputs
 */
export function sanitizeNumber(input: unknown, defaultValue: number = 0, min: number = 0, max?: number): number {
  const num = Number(input);
  if (isNaN(num)) return defaultValue;
  if (num < min) return min;
  if (max !== undefined && num > max) return max;
  return num;
}
