// T489: what every thing the Council generated in a universe on disk is for, without opening it in a browser and without writing anything:
//   npx vite-node lab/scripts/oggetti-uso.ts -- universes/<nome> [--tag prima-della-run-1] [--scrivi f.md] [--json f]
// A kernel on the local models opens the universe in memory (the plans of maps/ are not read) and, for every thing of the packs that are not
// the seed's (`seed.json`) and of the things forged with a module of their own, says the uses the kernel finds (`usesOf`, ADR-0250: an
// effect, an action, a recipe it goes into, a trade, a place on the body, a site, a mission), where it comes from (the recipes it comes out
// of, the trades that make it), its role (food, a tool, a garment, a bag, a key, a material) or that it has none, and so the kernel marks it
// as a decoration (`markDecorations`). With --tag, which things came in after that tag (the things of the run).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundledFiles } from '../../src/kernel/bundle';
import { prepareUniverse } from '../../src/kernel/universes';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { madeBy, roleOf, usesOf, workingUses, type ItemRole, type ItemUse, type ItemUseKind } from '../../src/kernel/itemuse';
import type { ItemDef } from '../../src/kernel/types';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const dir = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--tag', '--scrivi', '--json'].includes(args[i - 1]))!);
const tag = opt('--tag');
const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', maxBuffer: 1e9 });
const tracked = git('ls-files', '-z').split('\0').filter(Boolean);
const files: Record<string, string> = {};
for (const p of tracked) if (!p.startsWith('maps/') && !p.startsWith('.')) files[p] = await fs.readFile(path.join(dir, p), 'utf8');

// The things that were there before the tag: the ids of every pack at that commit.
const before = new Set<string>();
if (tag) {
  for (const p of git('ls-tree', '-r', '--name-only', tag).split('\n').filter((f) => /^modules\/[^/]+\/manifest\.json$/.test(f))) {
    try {
      const m = JSON.parse(git('show', `${tag}:${p}`));
      for (const it of m.items ?? []) before.add(it.id);
      if (m.kind === 'item') before.add(m.id);
    } catch {
      /* a manifest that does not parse had no things */
    }
  }
}

const seed = JSON.parse(files['seed.json'] ?? '{}') as Record<string, string>;
const up = prepareUniverse(files, bundledFiles);
const k = await Kernel.boot({ files: up.files, store: memoryStore(), ai: new MockAiModels() });
const world = k.useWorld();
const name = (id: string) => k.itemInfo(id).name;

// The packs of the universe (not the seed's) and the things with a module of their own.
const generated: Array<{ def: ItemDef; pack: string }> = [];
for (const [p, text] of Object.entries(up.files).sort(([a], [b]) => a.localeCompare(b))) {
  if (!/^modules\/[^/]+\/manifest\.json$/.test(p) || p in seed) continue;
  let m: { id?: string; kind?: string; items?: ItemDef[] };
  try {
    m = JSON.parse(text);
  } catch {
    continue;
  }
  const pack = String(m.id ?? p);
  if (m.kind === 'item' && m.id && k.content.items.get(m.id)) generated.push({ def: k.content.items.get(m.id)!, pack });
  for (const it of m.items ?? []) {
    const def = k.content.items.get(it.id);
    if (def) generated.push({ def, pack });
  }
}

const ROLE: Record<ItemRole, string> = { food: 'cibo', tool: 'attrezzo', garment: 'capo', container: 'contenitore', key: 'chiave', material: 'materia', light: 'luce', magic: 'magia', other: 'altro' };
const KIND: Record<ItemUseKind, string> = { consume: 'effetto', light: 'si accende', bag: 'borsa', wear: 'posto addosso', action: 'azione', needed: 'serve a un\'azione del mondo', cuts: 'taglia', ingredient: 'ricetta (entra)', tool: 'ricetta (attrezzo)', trade: 'mestiere', venture: 'cantiere', quest: 'missione', decoration: 'decorazione' };

function said(u: ItemUse): string {
  switch (u.kind) {
    case 'consume':
      return `effetto: ${u.verb} ${Object.entries(u.effects).map(([e, v]) => `${e} ${v! > 0 ? '+' : ''}${v}`).join(' ')}`;
    case 'wear':
      return u.zone ? `addosso: ${u.zone}` : `addosso: «${u.slot}» di ${u.panel}`;
    case 'action':
      return u.label ? `azione: «${u.label}»` : 'azione: il suo modulo';
    case 'needed':
      return `serve a «${u.label}» (${u.on})`;
    case 'ingredient':
      return `entra in ${name(u.makes)}`;
    case 'tool':
      return `attrezzo per ${name(u.makes)}`;
    case 'trade':
      return `mestiere: ${u.word}`;
    case 'quest':
      return `missione: ${u.to}`;
    case 'bag':
      return `borsa da ${u.size}`;
    default:
      return KIND[u.kind];
  }
}

const rows = generated.map(({ def, pack }) => {
  const uses = workingUses(usesOf({ ...def, decoration: false }, world));
  const from = madeBy(def, world);
  return {
    id: def.id,
    name: def.name,
    pack,
    category: def.category,
    role: roleOf(def),
    uses: [...new Set(uses.map(said))],
    kinds: [...new Set(uses.map((u) => u.kind))],
    // The slot of a panel taken only by a category or a tag, with a bonus: a use, but the weakest.
    weak: uses.length > 0 && uses.every((u) => u.kind === 'wear' && !u.zone),
    from: [...from.recipes.map((r) => `ricetta: ${r.inputs.map((i) => name(i.item)).join(' + ')}${r.tools?.length ? ` (con ${r.tools.map(name).join(', ')})` : ''}`), ...from.trades.map((t) => `mestiere: ${t}`)],
    run: tag ? !before.has(def.id) : undefined,
  };
});

const count = <T,>(xs: T[], key: (x: T) => string) => xs.reduce<Record<string, number>>((m, x) => ((m[key(x)] = (m[key(x)] ?? 0) + 1), m), {});
const none = rows.filter((r) => !r.kinds.length);
const inRun = rows.filter((r) => r.run);
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)} %` : '—');
const kindTotals = Object.fromEntries((Object.keys(KIND) as ItemUseKind[]).filter((x) => x !== 'decoration').map((x) => [x, rows.filter((r) => r.kinds.includes(x)).length]));
const marked = k.repo.log().find((c) => c.message.startsWith('riparazione:') && c.message.includes('da tenere'));

const lines: string[] = [];
lines.push(`# Gli oggetti di «${k.config.name}»: a cosa servono (T489)`, '');
lines.push(`Generato da \`npx vite-node lab/scripts/oggetti-uso.ts -- ${path.relative(process.cwd(), dir).replace(/\\/g, '/')}${tag ? ` --tag ${tag}` : ''}\` sul kernel ${k.config.kernel ?? ''}: un kernel sui modelli locali apre l'universo in memoria e legge gli usi che il kernel riconosce (\`usesOf\`, ADR-0250), senza chiamate e senza scrivere niente. Sono gli oggetti dei pacchetti che non sono del seme e quelli forgiati con un modulo loro.`, '');
lines.push('## In breve', '');
lines.push(`- Oggetti generati: **${rows.length}**${tag ? `, di cui **${inRun.length}** entrati dopo il tag \`${tag}\` (la run)` : ''}.`);
lines.push(`- Con almeno un uso: **${rows.length - none.length}** (${pct(rows.length - none.length, rows.length)}); **senza nessun uso: ${none.length}** (${pct(none.length, rows.length)})${tag ? `, nella run ${inRun.filter((r) => !r.kinds.length).length} su ${inRun.length} (${pct(inRun.filter((r) => !r.kinds.length).length, inRun.length)})` : ''}.`);
lines.push(`- Con un uso solo perché una scheda del mondo ha un posto per loro (l'equipaggiamento: «In mano», «Ai piedi»): ${rows.filter((r) => r.weak).length}; un uso vero, ma il più debole.`);
lines.push(`- Senza uso, la riparazione del kernel li marca da tenere (\`decoration\`): ${marked ? `«${marked.message}»` : 'niente da marcare'}.`, '');
lines.push('| uso | oggetti |', '|---|---:|');
for (const [x, n] of Object.entries(kindTotals)) lines.push(`| ${KIND[x as ItemUseKind]} | ${n} |`);
lines.push(`| **nessuno** | **${none.length}** |`, '');
lines.push('| ruolo | oggetti | senza uso |', '|---|---:|---:|');
for (const [role, n] of Object.entries(count(rows, (r) => r.role)).sort((a, b) => b[1] - a[1])) lines.push(`| ${ROLE[role as ItemRole]} | ${n} | ${rows.filter((r) => r.role === role && !r.kinds.length).length} |`);
lines.push('', '| pacchetto | oggetti | senza uso |', '|---|---:|---:|');
for (const [pack, n] of Object.entries(count(rows, (r) => r.pack))) lines.push(`| \`${pack}\` | ${n} | ${rows.filter((r) => r.pack === pack && !r.kinds.length).length} |`);
lines.push('', '## Che cosa dice', '');
const cited = rows.filter((r) => r.pack === 'items.citati');
lines.push(`- I pacchetti (\`items.pacco-*\`, la Genesi) hanno le ricette accanto: la maggior parte dei loro oggetti entra in una ricetta o si consuma. Gli oggetti di \`items.citati\` (\`content.define\`: ciò che qualcuno porta, nomina, trova a terra) nascono pochi per volta, senza ricette e senza azioni: lì stanno quasi tutti gli oggetti senza uso (${cited.filter((r) => !r.kinds.length).length} su ${cited.length}).`);
lines.push(`- La materia e gli attrezzi sono i più muti: una materia che nessuna ricetta usa, un attrezzo che non apre niente. Il cibo e i capi hanno quasi sempre un uso (l'effetto, il posto addosso).`);
lines.push(`- Un uso c'era e non si vedeva: ${kindTotals.needed} oggetti servono a un'azione di una cosa o di una persona del mondo («Dai un pane per del carbone» al caldaista), ma niente lo diceva dove li si tiene; la scheda «Crea» elencava tutte le ricette del mondo (${k.content.recipes.length} qui), anche di cose mai viste.`);
lines.push(`- Nessun oggetto dei pacchetti ha un'azione propria (le ${kindTotals.action} azioni sono dei moduli forgiati): le azioni le impara solo «Altro…». Una chiave non apre niente: il kernel non ha serrature, la chiave è un ruolo, non un uso, finché un'azione del mondo non la chiede.`, '');
lines.push('## Dopo T489 (ADR-0250)', '');
lines.push('- Il Narratore dà a ogni oggetto un uso fra quelli che il kernel sa fare (`use`: consume, wear, light, bag, action, craft, decoration) con ciò che lo regge; il validatore rifiuta col motivo ciò che non ne ha e il Narratore lo riceve una volta; poi l\'oggetto resta fuori, o resta da tenere se lo ha fatto il viandante o gli è stato dato.');
lines.push(`- Gli oggetti di prima senza uso restano, marcati da tenere dal kernel senza chiamate (qui ${none.length}); un uso trovato dopo vince sul segno.`);
lines.push('- L\'inventario e «Esamina» dicono cosa ci si fa, con parole del mondo; la scheda «Crea» mostra solo le ricette che ciò che si porta apre, con ciò che manca; un oggetto preso che completa una ricetta fa pensare il viandante a cosa potrebbe fare.', '');
lines.push('## Ogni oggetto', '');
for (const pack of Object.keys(count(rows, (r) => r.pack))) {
  const list = rows.filter((r) => r.pack === pack);
  lines.push(`### \`${pack}\` (${list.length})`, '');
  lines.push(`| oggetto | ruolo | usi | da dove viene |${tag ? ' run |' : ''}`, `|---|---|---|---|${tag ? '---|' : ''}`);
  for (const r of list) lines.push(`| ${r.name.replace(/\|/g, '/')} | ${ROLE[r.role]} | ${r.uses.length ? r.uses.join('; ').replace(/\|/g, '/') : '**niente** → da tenere'} | ${r.from.join('; ').replace(/\|/g, '/') || '—'} |${tag ? ` ${r.run ? 'sì' : ''} |` : ''}`);
  lines.push('');
}

const text = lines.join('\n') + '\n';
const out = opt('--scrivi');
if (out) await fs.writeFile(out, text);
else console.log(text.split('## Ogni oggetto')[0]);
const json = opt('--json');
if (json) await fs.writeFile(json, JSON.stringify({ universe: k.config.name, tag, total: rows.length, none: none.length, inRun: inRun.length, kinds: kindTotals, rows }, null, 2) + '\n');
console.log(`${k.config.name}: ${rows.length} oggetti generati, ${none.length} senza uso${tag ? `, ${inRun.length} della run` : ''}${out ? ` → ${out}` : ''}`);
process.exit(0);
