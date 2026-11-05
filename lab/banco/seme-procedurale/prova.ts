// The bench of the procedural models (Cantiere 2): a program run as the game runs it (the class's box, `withSize`), at five seeds,
// judged by the validator (`modelErrors`, `checkProgram`: compiles, finishes, stands, not in pieces, tall enough) at every seed, and
// measured for variance: the share of visible voxels full in one seed and empty in the other, over those full in either, averaged over
// the ten pairs. Colour does not count. Writes `<id>.md` (the measures and the trace of three seeds) and `<id>.png` (the five seeds).
//
//   npx vite-node lab/banco/seme-procedurale/prova.ts -- lab/banco/seme-procedurale [id…]
//   npx vite-node lab/banco/seme-procedurale/prova.ts -- lab/banco/props-tematici [id…]
//
// The folder holds `index.json` or `index-<setting>.json` ({ id: { classe, nome, … } }); without ids every entry is tried. Exit code 1 if any fails.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkProgram, withSize } from '../../../src/kernel/agents/sculptor';
import { modelErrors } from '../../../src/kernel/validator';
import { analyse } from '../../../src/mj/check';
import { boxOf, classOf } from '../../../src/mj/classes';
import { AIR, type Grid3, type PaletteEntry } from '../../../src/mj/engine';
import { compileMjx } from '../../../src/mj/model';
import { DEFAULT_RENDER, render, sheet } from '../../../src/mj/photo';
import { FORM_LIMITS, runMjx } from '../../../src/mj/run';
import { traceText } from '../../../src/mj/trace';
import { png } from '../../scripts/png';

export const SEMI = [1, 2, 3, 4, 5];
/** The mean distance between seeds a procedural model must reach. */
export const SOGLIA = 0.15;

export interface Voce {
  classe: string;
  nome: string;
  ambientazione?: string;
  originale?: string;
  [k: string]: unknown;
}

export interface Esito {
  id: string;
  errori: string[];
  avvisi: string[];
  distanze: number[];
  media: number;
  minima: number;
  voxel: number[];
  ms: number[];
  passa: boolean;
}

const pieni = (g: Grid3, palette: Record<string, PaletteEntry>): Uint8Array => {
  const vis = g.alphabet.map((c) => c !== AIR && !!palette[c]?.color && !palette[c]?.hidden);
  const out = new Uint8Array(g.cells.length);
  for (let i = 0; i < out.length; i++) if (vis[g.cells[i]]) out[i] = 1;
  return out;
};

const distanza = (a: Uint8Array, b: Uint8Array) => {
  let xor = 0, or = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] || b[i]) or++;
    if (a[i] !== b[i]) xor++;
  }
  return or ? xor / or : 0;
};

const n2 = (v: number) => v.toFixed(3);

/** The program at five seeds, judged and measured. */
export function prova(id: string, xml: string, voce: Voce, cartella?: string): Esito {
  const cls = classOf(voce.classe);
  if (!cls) throw new Error(`${id}: classe sconosciuta ${voce.classe}`);
  const box = boxOf(cls);
  const scritto = withSize(xml, box);
  const errori: string[] = [];
  const avvisi = new Set<string>();
  // The validator of the game, as the library checks a model (seed 1), and the sculptor's check (class, minimum height).
  errori.push(...modelErrors(`models/${id}.xml`, scritto));
  const c = checkProgram(xml, cls);
  if (c.error) errori.push(`classe ${cls.id}: ${c.error}`);
  const model = compileMjx(scritto, /<map\b/.test(scritto) ? {} : { size: box });
  const masks: Uint8Array[] = [];
  const voxel: number[] = [];
  const ms: number[] = [];
  const grids: Grid3[] = [];
  for (const seme of SEMI) {
    const t = Date.now();
    const r = runMjx(model, seme, { deadline: 8_000, limits: FORM_LIMITS });
    ms.push(Date.now() - t);
    const a = analyse(r, model.program.palette, { grounded: true, minHeight: Math.round((cls.minHeight ?? 0) * box[2]) });
    for (const e of a.errors) errori.push(`seme ${seme}: ${e}`);
    // Not even a fragment may float: every visible voxel joined to the body that stands on the ground.
    if (a.parts > 1) errori.push(`seme ${seme}: ${a.parts - 1} frammenti staccati (voxel fluttuanti)`);
    for (const w of a.warnings) if (!/frammenti/.test(w)) avvisi.add(w);
    masks.push(pieni(r.grid, model.program.palette));
    voxel.push(a.voxels);
    grids.push(r.grid);
  }
  const distanze: number[] = [];
  for (let i = 0; i < masks.length; i++) for (let k = i + 1; k < masks.length; k++) distanze.push(masks[i].length === masks[k].length ? distanza(masks[i], masks[k]) : 1);
  const media = distanze.reduce((s, d) => s + d, 0) / distanze.length;
  const minima = Math.min(...distanze);
  if (media < SOGLIA) errori.push(`varianza: distanza media ${n2(media)} (serve ≥ ${SOGLIA})`);
  if (minima === 0) errori.push('varianza: due semi danno la stessa forma');
  const esito: Esito = { id, errori, avvisi: [...avvisi], distanze, media, minima, voxel, ms, passa: !errori.length };
  if (cartella) {
    const foto = sheet(grids.map((g) => render(g, model.program.palette, 0, DEFAULT_RENDER)), box[0] > 60 ? 1 : box[0] > 24 ? 2 : 4, 6, [112, 150, 84]);
    writeFileSync(join(cartella, `${id}.png`), png(foto));
    writeFileSync(join(cartella, `${id}.md`), rapporto(id, voce, esito, model, box));
  }
  return esito;
}

function rapporto(id: string, voce: Voce, e: Esito, model: ReturnType<typeof compileMjx>, box: number[]): string {
  const righe = [
    `# ${voce.nome} (\`${id}.xml\`)`,
    '',
    `Classe \`${voce.classe}\`, scatola ${box.join(' × ')} voxel${voce.ambientazione ? `, ambientazione \`${voce.ambientazione}\`` : ''}${voce.originale ? `; riscrittura procedurale di \`universe/models/${voce.originale}\`` : ''}.`,
    '',
    voce.descrizione ? String(voce.descrizione) : '',
    '',
    '## Esito',
    '',
    `- validatore (\`modelErrors\`, \`checkProgram\`, \`analyse\` a ogni seme): ${e.errori.filter((x) => !x.startsWith('varianza')).length ? e.errori.filter((x) => !x.startsWith('varianza')).join('; ') : 'nessun errore, nessun frammento staccato'}`,
    `- varianza su ${SEMI.length} semi (voxel pieni in un seme e vuoti nell'altro, sui pieni in almeno uno; il colore non conta): **media ${n2(e.media)}**, minima ${n2(e.minima)}, massima ${n2(Math.max(...e.distanze))} (soglia ${SOGLIA}) → ${e.passa ? 'passa' : 'NON passa'}`,
    `- voxel per seme: ${e.voxel.join(', ')}; tempo per seme: ${e.ms.join(', ')} ms`,
    ...(e.avvisi.length ? [`- avvisi: ${e.avvisi.join('; ')}`] : []),
    '',
    '| coppia | ' + SEMI.flatMap((a, i) => SEMI.slice(i + 1).map((b) => `${a}-${b}`)).join(' | ') + ' |',
    '|---|' + e.distanze.map(() => '---').join('|') + '|',
    '| distanza | ' + e.distanze.map(n2).join(' | ') + ' |',
    '',
    `![i cinque semi](${id}.png)`,
    '',
    '## Traccia di tre semi a confronto',
    '',
    'La traccia di `src/mj/trace.ts` (forma `nodi`): per ogni nodo quante volte gira, quante celle scrive e la scatola di ciò che scrive. Le',
    'righe che cambiano fra i semi sono le scelte del programma.',
    '',
  ];
  for (const seme of SEMI.slice(0, 3)) {
    righe.push(`### Seme ${seme}`, '', '```text', traceText(model, seme, { forma: 'nodi', tetto: 900, deadline: 8_000, limits: FORM_LIMITS }).trim(), '```', '');
  }
  return righe.join('\n');
}

const main = () => {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  if (!args.length) return;
  const cartella = args[0];
  // `index.json`, or one `index-<ambientazione>.json` per setting (props-tematici): all of them together.
  const indice: Record<string, Voce> = {};
  for (const f of readdirSync(cartella).filter((f) => /^index(-[a-z]+)?\.json$/.test(f)).sort())
    Object.assign(indice, JSON.parse(readFileSync(join(cartella, f), 'utf8')));
  if (!Object.keys(indice).length && !existsSync(join(cartella, 'index.json'))) throw new Error(`${cartella}: nessun index.json`);
  const ids = args.length > 1 ? args.slice(1) : Object.keys(indice);
  let falliti = 0;
  for (const id of ids) {
    const xml = readFileSync(join(cartella, `${id}.xml`), 'utf8');
    const e = prova(id, xml, indice[id], cartella);
    if (!e.passa) falliti++;
    console.log(`${e.passa ? 'OK  ' : 'NO  '} ${id.padEnd(28)} media ${n2(e.media)} min ${n2(e.minima)} voxel ${e.voxel.join('/')} ms ${Math.max(...e.ms)}${e.errori.length ? `\n      ${e.errori.slice(0, 6).join('\n      ')}` : ''}`);
  }
  if (falliti) process.exitCode = 1;
};

main();
