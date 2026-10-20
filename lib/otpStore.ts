/**
 * Resilient In-Memory & Database OTP Verification Store
 * Provides instant verification with 10-minute TTL.
 */

interface OtpEntry {
  identifier: string; // email or username
  code: string;
  userId?: string;
  fullName?: string;
  email: string;
  expiresAt: number;
}

// In-memory store (scoped across global serverless runtime lifetime)
const g = globalThis as any;
if (!g.__intelliwaste_otps) {
  g.__intelliwaste_otps = new Map<string, OtpEntry>();
}
const memoryStore = g.__intelliwaste_otps as Map<string, OtpEntry>;

export const otpStore = {
  set: (identifier: string, data: Omit<OtpEntry, "identifier">) => {
    const key = identifier.toLowerCase().trim();
    memoryStore.set(key, { ...data, identifier: key });
    // Also store by email key if different
    if (data.email) {
      memoryStore.set(data.email.toLowerCase().trim(), { ...data, identifier: key });
    }
  },

  get: (identifier: string): OtpEntry | null => {
    const key = identifier.toLowerCase().trim();
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry;
  },

  verify: (identifier: string, code: string): boolean => {
    const entry = otpStore.get(identifier);
    if (!entry) return false;
    return entry.code === code.trim();
  },

  consume: (identifier: string, code: string): boolean => {
    const entry = otpStore.get(identifier);
    if (!entry) return false;
    if (entry.code !== code.trim()) return false;
    
    // Remove after successful usage
    memoryStore.delete(identifier.toLowerCase().trim());
    if (entry.email) {
      memoryStore.delete(entry.email.toLowerCase().trim());
    }
    return true;
  },
};

export default otpStore;
