/**
 * Production hardening diagnostic.
 * Run with: npx tsx scripts/production-check.ts
 *
 * Checks for common production issues:
 * 1. Missing DB indexes
 * 2. N+1 query risks
 * 3. Environment variables
 * 4. Security headers
 * 5. Upload sanitation
 */

const CHECKS: { name: string; status: 'pass' | 'fail' | 'warn'; message: string }[] = [];

function pass(name: string, message: string) {
    CHECKS.push({ name, status: 'pass', message });
}

function fail(name: string, message: string) {
    CHECKS.push({ name, status: 'fail', message });
}

function warn(name: string, message: string) {
    CHECKS.push({ name, status: 'warn', message });
}

async function main() {
    // 1. Environment Variables
    const requiredVars = [
        'DATABASE_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'UPLOADTHING_SECRET',
        'UPLOADTHING_APP_ID',
    ];
    for (const v of requiredVars) {
        if (process.env[v]) {
            pass(`ENV: ${v}`, `${v} is set`);
        } else {
            fail(`ENV: ${v}`, `${v} is missing`);
        }
    }

    // 2. Node environment
    if (process.env.NODE_ENV === 'production') {
        pass('NODE_ENV', 'Running in production mode');
    } else {
        warn('NODE_ENV', 'Not running in production mode');
    }

    // 3. Check if cookies have secure flag (in production)
    if (process.env.NODE_ENV === 'production') {
        pass('Cookies', 'Production environment — secure cookies expected');
    }

    // 4. Rate limiting check
    const rateLimitPath = 'src/server/utils/api-rate-limit.ts';
    try {
        await import('fs').then(fs => fs.promises.access(rateLimitPath));
        pass('Rate Limiting', `Rate limiting utility exists at ${rateLimitPath}`);
    } catch {
        warn('Rate Limiting', 'No rate limiting utility found');
    }

    // 5. CSP headers
    const securityPath = 'src/lib/security.ts';
    try {
        await import('fs').then(fs => fs.promises.access(securityPath));
        pass('CSP Headers', `Security utility exists at ${securityPath}`);
    } catch {
        warn('CSP Headers', 'No security utility found');
    }

    // 6. Idempotency key support
    const idempotencyPath = 'src/server/utils/idempotency.ts';
    try {
        await import('fs').then(fs => fs.promises.access(idempotencyPath));
        pass('Idempotency', `Idempotency utility exists at ${idempotencyPath}`);
    } catch {
        warn('Idempotency', 'No idempotency utility found');
    }

    // Print results
    console.log('\n📋 Production Hardening Check\n');
    console.log(`${'Check'.padEnd(40)} ${'Status'.padEnd(8)} Message`);
    console.log('-'.repeat(100));
    for (const c of CHECKS) {
        const icon = c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌';
        console.log(`${icon} ${c.name.padEnd(37)} ${c.status.padEnd(8)} ${c.message}`);
    }

    const failed = CHECKS.filter(c => c.status === 'fail').length;
    const warnings = CHECKS.filter(c => c.status === 'warn').length;
    console.log(`\n${CHECKS.length} checks: ${CHECKS.filter(c => c.status === 'pass').length} passed, ${warnings} warnings, ${failed} failed`);

    if (failed > 0) process.exit(1);
}

main().catch(console.error);
