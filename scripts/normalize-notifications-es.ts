#!/usr/bin/env node

/**
 * ALORA — Normalize stored notifications from voseo (Argentine "tenés") to
 * neutral Spanish ("tienes").
 *
 * By default this runs in DRY-RUN mode and only prints what it would change.
 * To actually apply the updates, run:
 *   FIX=1 npx tsx scripts/normalize-notifications-es.ts
 *
 * Requires DATABASE_URL (or DIRECT_URL) to be set in the environment.
 */

import { prisma } from '../src/lib/prisma';

// Curated voseo -> tú dictionary (lowercase keys).
const REPLACEMENTS: Record<string, string> = {
  tenés: 'tienes',
  podés: 'puedes',
  querés: 'quieres',
  decís: 'dices',
  sos: 'eres',
  hacés: 'haces',
  salís: 'sales',
  venís: 'vienes',
  ponés: 'pones',
  mirás: 'miras',
  pasás: 'pasas',
  quedás: 'quedas',
  llevás: 'llevas',
  encontrás: 'encuentras',
  recibís: 'recibes',
  abrís: 'abres',
  necesitás: 'necesitas',
  pensás: 'piensas',
  sentís: 'sientes',
  volvés: 'vuelves',
  dejás: 'dejas',
  terminás: 'terminas',
  empezás: 'empiezas',
  contestás: 'contestas',
  cancelás: 'cancelas',
  activás: 'activas',
  desactivás: 'desactivas',
  compartís: 'compartes',
  seguís: 'sigues',
  vivís: 'vives',
  cumplís: 'cumples',
  preguntás: 'preguntas',
  mostrás: 'muestras',
  ganás: 'ganas',
  perdés: 'pierdes',
  elegís: 'eliges',
  subís: 'subes',
  traés: 'traes',
  conocés: 'conoces',
  respondés: 'respondes',
  parecés: 'pareces',
  sirvés: 'sirves',
  resolvés: 'resolves',
  aprendés: 'aprendes',
  entrés: 'entras',
};

const KEYS = Object.keys(REPLACEMENTS);
// Unicode-aware boundaries: require a non-letter immediately before/after so
// accented voseo words (e.g. "tenés") match correctly without \b quirks.
const VOSEO_RE = new RegExp(`(?<![\\p{L}])(${KEYS.join('|')})(?![\\p{L}])`, 'giu');

function normalizeText(input: string | null | undefined): { text: string; changed: boolean } {
  if (!input) return { text: input as string, changed: false };
  let changed = false;
  const text = input.replace(VOSEO_RE, (match) => {
    changed = true;
    const lower = match.toLowerCase();
    const repl = REPLACEMENTS[lower];
    if (!repl) return match;
    // Preserve leading capitalization.
    if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
      return repl.charAt(0).toUpperCase() + repl.slice(1);
    }
    return repl;
  });
  return { text, changed };
}

async function main() {
  const fix = process.env.FIX === '1';
  console.log(`\n🧹 Notification Spanish normalization — mode: ${fix ? 'APPLY' : 'DRY-RUN (set FIX=1 to apply)'}\n`);

  let total = 0;
  let updated = 0;
  let skipped = 0;
  let cursor: string | undefined = undefined;

  type NotifRow = { id: string; title: string | null; body: string | null };

  while (true) {
    const batch: NotifRow[] = await prisma.notification.findMany({
      take: 1000,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
      select: { id: true, title: true, body: true },
    });
    if (batch.length === 0) break;
    cursor = batch[batch.length - 1].id;
    total += batch.length;

    for (const n of batch) {
      const t = normalizeText(n.title);
      const b = normalizeText(n.body);
      if (!t.changed && !b.changed) {
        skipped++;
        continue;
      }
      updated++;
      console.log(`• [${n.id}]`);
      if (t.changed) console.log(`    title: ${(n.title || '').slice(0, 80)}  ->  ${t.text.slice(0, 80)}`);
      if (b.changed) console.log(`    body:  ${(n.body || '').slice(0, 80)}  ->  ${b.text.slice(0, 80)}`);

      if (fix) {
        await prisma.notification.update({
          where: { id: n.id },
          data: { title: t.text, body: b.text },
        });
      }
    }
  }

  console.log(`\n✅ Scanned ${total} notifications. ${updated} would be updated${fix ? ' (applied)' : ''}, ${skipped} unchanged.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Script failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
