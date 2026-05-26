import { NextResponse } from 'next/server';

/**
 * Security headers for API and page responses.
 */

export const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
};

export function applySecurityHeaders(response: NextResponse): NextResponse {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value);
    }
    return response;
}

/**
 * Generate a Content Security Policy string for the app.
 */
export function getCSP(nonce?: string): string {
    const directives = [
        `default-src 'self'`,
        `script-src 'self' ${nonce ? `'nonce-${nonce}'` : ''} 'unsafe-eval' 'unsafe-inline' 'strict-dynamic' https://apis.google.com https://js.stripe.com`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `img-src 'self' blob: data: https://*.uploadthing.com https://*.supabase.co https://lh3.googleusercontent.com https://placehold.co https://picsum.photos`,
        `font-src 'self' data: https://fonts.gstatic.com`,
        `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://uploadthing.com https://securetoken.googleapis.com`,
        `frame-src 'none'`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
        `worker-src 'self' blob:`,
    ];
    return directives.join('; ');
}

/**
 * Validate that a redirect URL is safe (prevents open redirects).
 */
export function isSafeRedirect(url: string, allowedOrigins: string[]): boolean {
    try {
        const parsed = new URL(url);
        return allowedOrigins.includes(parsed.origin);
    } catch {
        return false;
    }
}

/**
 * Sanitize a filename to prevent path traversal.
 */
export function sanitizeFilename(filename: string): string {
    // Remove path separators and special chars
    return filename
        .replace(/[/\\<>:"|?*]/g, '_')
        .replace(/\.\./g, '_')
        .substring(0, 255);
}
