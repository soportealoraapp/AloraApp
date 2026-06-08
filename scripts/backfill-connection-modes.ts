#!/usr/bin/env node

/**
 * ALORA — Backfill `connectionModes` for existing profiles
 *
 * The new schema adds `Profile.connectionModes String[] @default(["dating"])`.
 * Existing profiles with `lookingFor = 'friendship'` or `'networking'` will
 * have the incorrect default `["dating"]`. This script fixes them.
 *
 * Mapping:
 *   friendship / networking  →  ["friendship"]
 *   serious / casual / null  →  ["dating"]  (already correct by default)
 *
 * Run: npx tsx scripts/backfill-connection-modes.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function deriveConnectionModes(lookingFor: string | null): string[] {
  const lf = (lookingFor || '').toLowerCase();
  if (lf === 'friendship' || lf === 'networking') return ['friendship'];
  return ['dating'];
}

function needsBackfill(current: string[], expected: string[]): boolean {
  if (current.length !== expected.length) return true;
  return !expected.every((m) => current.includes(m));
}

async function main() {
  console.log('🔍 Scanning all profiles for connectionModes backfill...\n');

  const profiles = await prisma.profile.findMany({
    select: {
      userId: true,
      displayName: true,
      lookingFor: true,
      connectionModes: true,
    },
  });

  console.log(`   Total profiles: ${profiles.length}\n`);

  let updated = 0;
  let skipped = 0;

  for (const p of profiles) {
    const expected = deriveConnectionModes(p.lookingFor);

    if (!needsBackfill(p.connectionModes, expected)) {
      skipped++;
      continue;
    }

    await prisma.profile.update({
      where: { userId: p.userId },
      data: { connectionModes: expected },
    });

    console.log(
      `   ✅ ${p.displayName || 'unknown'} (${p.userId})` +
      `   [${p.connectionModes.join(', ')}] → [${expected.join(', ')}]` +
      `   (lookingFor: ${p.lookingFor || 'null'})`
    );
    updated++;
  }

  console.log(`\n📊 Done. Updated: ${updated}, Already correct: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
