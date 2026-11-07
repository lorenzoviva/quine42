// In what language the Council wrote the world of a universe (T310): every text of the places, of the people and of the rules, passed
// through the detector of src/kernel/language.ts. A long text (four function words or more) gets its language; a short one (a name)
// counts as English only if it has an English function word and no Italian one.
// npx vite-node lab/scripts/lingua-uscite.ts -- universes/t310prova [--since <file of a map>]

import fs from 'node:fs';
import path from 'node:path';
import { detectLanguage } from '../../src/kernel/language';

const dir = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'universes/t310prova');
const read = (p: string): any => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, p), 'utf8'));
  } catch {
    return undefined;
  }
};

const texts: Array<{ where: string; text: string }> = [];
const add = (where: string, v: unknown) => {
  if (typeof v === 'string' && v.trim()) texts.push({ where, text: v.trim() });
};
for (const f of fs.readdirSync(path.join(dir, 'maps'))) {
  const plan = read(`maps/${f}`)?.plan;
  // The plans of the models (not the offline ones, whose descriptions are a few fixed lines): the Cartographer's card says who paid.
  if (!plan || plan.card?.payer === undefined || /^(L'erba|In lontananza|Qualcuno ha lasciato|Un sentiero di pecore|Sul fondo|L'acqua è|Il vento muove|Gli alberi|Tra i tronchi|Le onde|Le pietre|Da quassù|L'eco)/.test(plan.place?.description ?? '')) continue;
  add(`${f} luogo`, plan.place?.name);
  add(`${f} descrizione`, plan.place?.description);
  for (const s of plan.structures ?? []) add(`${f} struttura`, s.concept);
  for (const s of plan.fresh ?? []) add(`${f} nuovo`, s.concept);
  for (const g of plan.ground ?? []) add(`${f} a terra`, g);
}
for (const p of read('world/people.json')?.people ?? []) {
  for (const k of ['persona', 'story', 'job', 'look', 'age'] as const) add(`${p.name} ${k}`, p[k]);
  for (const r of p.routine ?? []) add(`${p.name} giornata`, r.does);
  for (const r of p.family ?? []) add(`${p.name} legame`, r.bond);
  for (const m of p.memories ?? []) add(`${p.name} ricordo`, typeof m === 'string' ? m : m.text);
  add(`${p.name} scheda`, p.sheet?.text);
}
for (const r of read('world/rules.json')?.rules ?? []) if (!String(r.key ?? '').startsWith('revisione')) add(`regola ${r.key}`, r.story);

// `a` and `in` are words of both languages: they say nothing.
const IT = /\b(il|lo|la|gli|le|di|del|della|dei|che|è|un|una|con|per|nel|nella|e)\b/i;
const EN = /\b(the|of|and|with|is|an|to|on|for|by|at)\b/i;
const verdict = (t: string) => detectLanguage(t) ?? (EN.test(t) && !IT.test(t) ? 'en' : IT.test(t) ? 'it' : '?');
const counts: Record<string, number> = {};
const english: string[] = [];
for (const t of texts) {
  const v = verdict(t.text);
  counts[v] = (counts[v] ?? 0) + 1;
  if (v === 'en') english.push(`${t.where}: ${t.text.slice(0, 160)}`);
}
console.log(`testi del mondo: ${texts.length}; per lingua: ${JSON.stringify(counts)}`);
console.log(english.length ? `in inglese:\n${english.join('\n')}` : 'nessuno in inglese');
