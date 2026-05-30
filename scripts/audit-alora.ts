#!/usr/bin/env node

/**
 * ALORA — Automated Audit Script
 * Run: npx tsx scripts/audit-alora.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
let issues: { category: string; severity: 'ERROR' | 'WARN' | 'INFO'; message: string }[] = [];

function check(category: string, severity: 'ERROR' | 'WARN' | 'INFO', message: string) {
    issues.push({ category, severity, message });
}

// 1. Environment Variables
console.log('\n🔍 Checking environment variables...');
const requiredEnvVars = [
    'DATABASE_URL', 'DIRECT_URL', 'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
    'UPLOADTHING_TOKEN', 'LEMON_SQUEEZY_API_KEY', 'LEMON_SQUEEZY_STORE_ID',
];

const envPath = join(ROOT, '.env');
const envLocalPath = join(ROOT, '.env.local');
const envExists = existsSync(envPath) || existsSync(envLocalPath);

if (!envExists) {
    check('ENV', 'ERROR', 'No .env or .env.local file found');
} else {
    for (const varName of requiredEnvVars) {
        const envContent = readFileSync(envPath, 'utf-8');
        if (!envContent.includes(`${varName}=`) && !envContent.includes(`${varName}="`)) {
            check('ENV', 'WARN', `Missing ${varName}`);
        }
    }
}

// 2. Prisma Schema Validation
console.log('🔍 Checking Prisma schema...');
const schemaPath = join(ROOT, 'prisma', 'schema.prisma');
if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, 'utf-8');

    // Check for required models
    const requiredModels = ['User', 'Profile', 'Match', 'Message', 'Block', 'Report', 'QuizResult', 'ProfileVisit'];
    for (const model of requiredModels) {
        if (!schema.includes(`model ${model}`)) {
            check('PRISMA', 'ERROR', `Missing model: ${model}`);
        }
    }

    // Check for location fields
    if (!schema.includes('cityId')) {
        check('PRISMA', 'WARN', 'Missing cityId field in Profile');
    }
    if (!schema.includes('latitude')) {
        check('PRISMA', 'WARN', 'Missing latitude field in Profile');
    }
} else {
    check('PRISMA', 'ERROR', 'Prisma schema not found');
}

// 3. Route Completeness
console.log('🔍 Checking routes...');
const requiredRoutes = [
    'src/app/(app)/discover/page.tsx',
    'src/app/(app)/chat/page.tsx',
    'src/app/(app)/profile/page.tsx',
    'src/app/(app)/settings/page.tsx',
    'src/app/(app)/compatibility/page.tsx',
    'src/app/api/lemonsqueezy/checkout/route.ts',
    'src/app/api/lemonsqueezy/webhook/route.ts',
];

for (const route of requiredRoutes) {
    if (!existsSync(join(ROOT, route))) {
        check('ROUTES', 'ERROR', `Missing route: ${route}`);
    }
}

// 4. AI Flows
console.log('🔍 Checking AI flows...');
const aiFlows = [
    'src/ai/copilot/profile-coach.ts',
    'src/ai/copilot/bio-improver.ts',
    'src/ai/copilot/icebreaker-ai.ts',
    'src/ai/copilot/compatibility-insights.ts',
    'src/ai/copilot/conversation-coach.ts',
];

for (const flow of aiFlows) {
    if (!existsSync(join(ROOT, flow))) {
        check('AI', 'ERROR', `Missing AI flow: ${flow}`);
    } else {
        const content = readFileSync(join(ROOT, flow), 'utf-8');
        if (!content.includes('ai.definePrompt') && !content.includes('ai.defineFlow')) {
            check('AI', 'WARN', `${flow} may not be using Genkit properly`);
        }
    }
}

// 5. Compatibility Engine
console.log('🔍 Checking compatibility engine...');
const compatFiles = [
    'src/lib/compatibility/engine.ts',
    'src/lib/compatibility/scores.ts',
    'src/lib/compatibility/explanations.ts',
];

for (const file of compatFiles) {
    if (!existsSync(join(ROOT, file))) {
        check('COMPAT', 'ERROR', `Missing compatibility file: ${file}`);
    }
}

// 6. Location System
console.log('🔍 Checking location system...');
const locationFiles = [
    'src/lib/location/index.ts',
    'src/lib/location/data/countries.ts',
    'src/lib/location/data/cities.ts',
    'src/components/ui/city-autocomplete.tsx',
];

for (const file of locationFiles) {
    if (!existsSync(join(ROOT, file))) {
        check('LOCATION', 'ERROR', `Missing location file: ${file}`);
    }
}

// 7. Security
console.log('🔍 Checking security...');
const securityFiles = [
    'src/server/services/visit-tracker.ts',
    'src/server/services/risk-detector.ts',
    'src/components/verification/VerificationBadge.tsx',
];

for (const file of securityFiles) {
    if (!existsSync(join(ROOT, file))) {
        check('SECURITY', 'ERROR', `Missing security file: ${file}`);
    }
}

// 8. Pricing Consistency
console.log('🔍 Checking pricing consistency...');
const subPath = join(ROOT, 'src', 'lib', 'domain', 'subscription.ts');
if (existsSync(subPath)) {
    const content = readFileSync(subPath, 'utf-8');
    if (content.includes('4.99') || content.includes('12.99')) {
        check('PRICING', 'ERROR', 'Legacy pricing found in subscription.ts');
    }
    if (content.includes('99') && content.includes('MXN')) {
        // Good - unified pricing
    }
}

// Report
console.log('\n' + '='.repeat(60));
console.log('ALORA AUDIT REPORT');
console.log('='.repeat(60));

const errors = issues.filter(i => i.severity === 'ERROR');
const warnings = issues.filter(i => i.severity === 'WARN');
const infos = issues.filter(i => i.severity === 'INFO');

if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}):`);
    errors.forEach(e => console.log(`  [${e.category}] ${e.message}`));
}

if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach(w => console.log(`  [${w.category}] ${w.message}`));
}

if (infos.length > 0) {
    console.log(`\nℹ️  INFO (${infos.length}):`);
    infos.forEach(i => console.log(`  [${i.category}] ${i.message}`));
}

console.log('\n' + '='.repeat(60));
console.log(`TOTAL: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info`);
console.log('='.repeat(60));

process.exit(errors.length > 0 ? 1 : 0);
