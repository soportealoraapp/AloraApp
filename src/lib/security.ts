/**
 * Alora
 * © 2026 Alora Team. All rights reserved.
 *
 * Soporte: soporte.alora.app@gmail.com
 *
 * Desarrollado por:
 * - Alejandro Pérez Vázquez (CEO y fundador)
 * - Caleb Zacarías García
 * - Juan Carlos Moreno López
 * - Erik Barrera Barrera
 */

import { NextResponse } from 'next/server';

/**
 * Security headers for API and page responses.
 */

export const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)',
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
 * NOTE: unsafe-inline for script-src is required by Next.js for hydration scripts.
 * TODO: Migrate to nonce-based CSP when Next.js supports per-request nonces.
 * unsafe-eval is REMOVED for security.
 * upgrade-insecure-requests added for defense in depth.
 */
export function getCSP(): string {
    const directives = [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `img-src 'self' blob: data: https://*.uploadthing.com https://utfs.io https://*.supabase.co https://lh3.googleusercontent.com https://placehold.co https://picsum.photos https://i.scdn.co https://firebasestorage.googleapis.com`,
        `font-src 'self' https://fonts.gstatic.com`,
        `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.uploadthing.com https://uploadthing.com https://utfs.io https://securetoken.googleapis.com https://api.spotify.com`,
        `media-src 'self' blob: https://utfs.io https://*.utfs.io`,
        `frame-src https://open.spotify.com`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
        `worker-src 'self' blob:`,
        `upgrade-insecure-requests`,
    ];
    return directives.join('; ');
}

/**
 * Sanitize a filename to prevent path traversal.
 * Handles null bytes, URL encoding, and directory traversal sequences.
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[/\\<>:"|?*]/g, '_')
        .replace(/\.\./g, '_') // Replace all .. sequences
        .replace(/%/g, '_') // Break URL encoding
        .substring(0, 255);
}
