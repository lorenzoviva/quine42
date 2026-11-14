// The tables of docs/lingua-interna.md (T306, ADR-0153), from src/kernel/internalNames.ts: rewrites what lies between the two markers.
// npx vite-node lab/scripts/lingua-interna.ts             (writes the document)
// npx vite-node lab/scripts/lingua-interna.ts -- --misura (also counts, per step, the files that quote a value of its domains)

import fs from 'node:fs';
import path from 'node:path';
import { INTERNAL_NAMES, type NameDomain, type NameStep } from '../../src/kernel/internalNames';

const ROOT = path.resolve('.');
const DOC = path.join(ROOT, 'docs/lingua-interna.md');
const START = '<!-- tabelle: inizio (lab/scripts/lingua-interna.ts) -->';
const END = '<!-- tabelle: fine -->';

const CONTRACT: Record<NameStep, string> = { T307a: '0.2', T307b: '0.3', T308a: '0.4', T308b: '0.5', T310b: '0.7' };
const KIND: Record<NameDomain['kind'], string> = { values: 'valori', fields: 'campi', paths: 'percorsi' };
const REACH: Record<string, string> = { disco: 'disco', filo: 'filo', lua: 'Lua', prompt: 'prompt', codice: 'solo codice' };

function tables(): string {
  const out: string[] = ['| dominio | genere | voci | tocca | task (contratto) |', '|---|---|---:|---|---|'];
  const per = new Map<NameStep, number>();
  for (const d of INTERNAL_NAMES) {
    const n = Object.keys(d.names).length;
    per.set(d.step, (per.get(d.step) ?? 0) + n);
    out.push(`| [${d.title}](#${d.id}) | ${KIND[d.kind]} | ${n} | ${d.reach.map((r) => REACH[r]).join(', ')} | ${d.step} (${CONTRACT[d.step]}) |`);
  }
  const total = [...per.values()].reduce((a, b) => a + b, 0);
  out.push(`| **totale** | | **${total}** | | ${[...per].map(([s, n]) => `${s}: ${n}`).join(' · ')} |`, '');
  for (const d of INTERNAL_NAMES) {
    out.push(`<a id="${d.id}"></a>`, `### ${d.title} (\`${d.id}\`)`, '');
    out.push(`- **Dove si legge**: ${d.where.map((w) => `\`${w}\``).join(', ')}`);
    out.push(`- **Tocca**: ${d.reach.map((r) => REACH[r]).join(', ')} · **lingua**: ${d.lang === 'la' ? 'latino' : 'inglese'} · **task**: ${d.step}, contratto ${CONTRACT[d.step]}`);
    if (d.taken?.length) out.push(`- **Già usati, da non prendere**: ${d.taken.map((t) => `\`${t}\``).join(', ')}`);
    if (d.note) out.push(`- **Nota**: ${d.note}`);
    out.push('', '| italiano | interno |', '|---|---|');
    for (const [it, en] of Object.entries(d.names)) out.push(`| \`${it}\` | \`${en}\` |`);
    out.push('');
  }
  return out.join('\n');
}

/** Files of the project that quote (between quotes) an Italian value of the step's value domains, or name a field of its field domains. */
function measure(): string {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.git', 'dist', 'graphify-out'].includes(e.name)) continue;
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (/\.(ts|mjs|json|lua|xml|md|html)$/.test(e.name) && !rel.startsWith('docs/')) files.push(rel);
    }
  };
  for (const d of ['src', 'tests', 'universe', 'server', 'site']) walk(d);
  const lines: string[] = ['| task | file | di cui test | di cui seme (`universe/`) | di cui `src/` |', '|---|---:|---:|---:|---:|'];
  for (const step of Object.keys(CONTRACT) as NameStep[]) {
    const words = INTERNAL_NAMES.filter((d) => d.step === step).flatMap((d) => Object.entries(d.names).filter(([it, en]) => it !== en && it.length > 2).map(([it]) => it));
    const re = new RegExp(`["'\`](${[...new Set(words)].map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})["'\`]`);
    const hit = files.filter((f) => re.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
    lines.push(`| ${step} | ${hit.length} | ${hit.filter((f) => f.startsWith('tests/')).length} | ${hit.filter((f) => f.startsWith('universe/')).length} | ${hit.filter((f) => f.startsWith('src/')).length} |`);
  }
  return lines.join('\n');
}

const doc = fs.readFileSync(DOC, 'utf8');
const a = doc.indexOf(START);
const b = doc.indexOf(END);
if (a < 0 || b < a) throw new Error(`mancano i segni ${START} … ${END} in ${DOC}`);
fs.writeFileSync(DOC, `${doc.slice(0, a + START.length)}\n\n${tables()}\n${doc.slice(b)}`);
console.log(`scritto ${path.relative(ROOT, DOC)}: ${INTERNAL_NAMES.length} domini`);
if (process.argv.includes('--misura')) console.log(measure());
