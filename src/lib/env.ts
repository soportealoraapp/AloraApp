/**
 * Environment variable validation for Alora.
 * Validates required variables at server startup.
 * FAILS EXPLICITLY if critical variables are missing.
 */

const REQUIRED_SERVER_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'UPLOADTHING_TOKEN',
] as const;

const REQUIRED_CLIENT_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const OPTIONAL_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'MEMORY_ENCRYPTION_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_APP_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

/**
 * Validate that all required environment variables are set.
 * Throws a descriptive error if any are missing.
 */
export function validateEnv(): void {
  if (typeof window !== 'undefined') {
    // Client-side: only check client vars
    const missing = REQUIRED_CLIENT_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.error(
        `[ENV ERROR] Missing client environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env.local and fill in the values.'
      );
    }
    return;
  }

  // Server-side: check all required vars
  const missing = REQUIRED_SERVER_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[ENV ERROR] Missing required server environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env.local and fill in the values.'
    );
  }
}

/**
 * Get a required environment variable. Throws if not set.
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value;
}

/**
 * Get an optional environment variable. Returns fallback if not set.
 */
export function getEnv(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
}

// Auto-validate on import (server-side only)
if (typeof window === 'undefined') {
  validateEnv();
}
