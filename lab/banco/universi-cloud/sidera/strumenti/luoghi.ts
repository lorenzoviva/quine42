// I 19 luoghi pre-pianificati di Sidera: (0, 0) e i 18 attorno entro raggio 2. Ogni piano passa da validatePlan con gli
// ambienti che il kernel gli darebbe (quello della regione dell'atlante, o quelli liberi), si dispone con layout.ts sulla bozza
// vera del terreno (varchi, sentieri garantiti, lotti) e si salva in maps/ con la chiave che il kernel cerca (`recordKey`).
// Esegui: npx vite-node lab/banco/universi-cloud/sidera/strumenti/luoghi.ts
import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../../../../src/kernel/kernel';
import { memoryStore } from '../../../../../src/kernel/repo';
import { MockAiModels } from '../../../../../src/kernel/ai/mock';
import { layout } from '../../../../../src/kernel/layout';
import { readAtlas, regionAt } from '../../../../../src/kernel/atlas';
import { lexiconWords, metaBreak } from '../../../../../src/kernel/fourthwall';
import { hashStr } from '../../../../../src/kernel/rng';
import type { ChunkPlan } from '../../../../../src/kernel/agents/cartography';
import { fileDi, SIDERA } from './carica';

interface Voce {
  cx: number;
  cy: number;
  plan: ChunkPlan;
}

const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');

export function chiaveMappa(files: Record<string, string>, cx: number, cy: number): string {
  const cfg = JSON.parse(files['universe.json']);
  const titolo = JSON.parse(files['world/bible.json']).titolo ?? '';
  return `${cfg.name}:${cfg.seed}:${hex(hashStr(titolo))}:${cx},${cy}`;
}

export async function luoghi(scrivi = true): Promise<{ errori: string[]; righe: string[] }> {
  const files = fileDi();
  const voci: Voce[] = JSON.parse(fs.readFileSync(path.join(SIDERA, 'strumenti/luoghi.json'), 'utf8'));
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  const words = lexiconWords(files['world/lexicon.md']);
  const atlas = readAtlas(files);
  const regional = new Set(atlas.regions.map((r) => r.environment));
  const free = Object.keys(k.content.layouts).filter((l) => !regional.has(l));
  const placeable = new Set(k.catalog().map((c) => c.id));
  const S = k.config.chunkSize;
  const errori: string[] = [];
  const righe: string[] = [];
  if (fs.existsSync(path.join(SIDERA, 'maps')) && scrivi) for (const f of fs.readdirSync(path.join(SIDERA, 'maps'))) fs.unlinkSync(path.join(SIDERA, 'maps', f));
  for (const v of voci) {
    const key = `${v.cx},${v.cy}`;
    const region = v.cx === 0 && v.cy === 0 ? undefined : regionAt(atlas, v.cx, v.cy);
    const allowed = new Set(region ? [region.environment] : free);
    const verdict = k.validator.validatePlan(v.plan, allowed, placeable);
    const err = (s: string) => errori.push(`${key} ${v.plan.place.name}: ${s}`);
    verdict.errors.forEach(err);
    verdict.dropped.forEach((d) => err(`scartato: ${d}`));
    for (const t of [v.plan.place.name, v.plan.place.description, ...v.plan.ground, ...(v.plan.structures ?? []).map((s) => s.concept)]) {
      const m = metaBreak(t, words);
      if (m) err(`quarta parete «${m}»`);
    }
    for (const g of v.plan.ground) if (!k.content.byName(g)) err(`a terra «${g}»: oggetto sconosciuto`);
    // Disposto come lo dispone il kernel: la bozza vera, il programma dell'ambiente, varchi e sentieri.
    const draft = (k as any).genDraft(v.cx, v.cy) as string;
    const rows = Array.from({ length: S }, (_, r) => draft.slice(r * S, (r + 1) * S));
    const program = k.content.layouts[v.plan.layout]?.program;
    const r = layout(rows, k.palette, { cx: v.cx, cy: v.cy, seed: k.config.seed, program, pathCode: 'p' });
    const open = r.grid.join('').split('').filter((c) => k.palette[c]?.solid === false).length;
    if (open < S * S * 0.25) err(`poco spazio calpestabile (${open})`);
    righe.push(`| ${key} | ${v.plan.place.name} | ${v.plan.layout} | ${region?.name ?? '(libero)'} | ${v.plan.objects.length} | ${v.plan.runes.join(', ')} | ${r.lots.length} | ${open} |`);
    if (scrivi) {
      const file = `maps/${chiaveMappa(files, v.cx, v.cy).replace(/[:,]/g, '_')}.json`;
      fs.mkdirSync(path.join(SIDERA, 'maps'), { recursive: true });
      fs.writeFileSync(path.join(SIDERA, file), JSON.stringify({ plan: verdict.plan }, null, 1) + '\n');
    }
  }
  return { errori, righe };
}

if (process.env.SIDERA_SOLO_FUNZIONI !== '1') {
  const { errori, righe } = await luoghi(true);
  console.log('| luogo | nome | ambiente | regione | oggetti | rune | lotti | calpestabili |\n|---|---|---|---|---|---|---|---|');
  console.log(righe.join('\n'));
  console.log(errori.length ? `ERRORI (${errori.length}):\n${errori.join('\n')}` : `${righe.length} luoghi validi`);
  if (errori.length) process.exit(1);
}
