// The bench of Cantiere 8 (fauna, flora, monuments): every program of `catalogo.ts` through the game's validator (`modelErrors`, the class's
// box), then five seeds as the game runs them, measured: floating voxels, the shape distance between seeds, the time. It writes the report
// next to each program (`<nome>.md`, metrics and the trace of the nodes), a contact sheet (`<nome>.png`) and the index (`README.md`).
//
//   npx vite-node lab/banco/fauna-biomi-cloud/banco.ts                  every program of the catalogue
//   npx vite-node lab/banco/fauna-biomi-cloud/banco.ts -- cervo-reale   only the named ones (the index keeps the others' last line)

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withSize } from '../../../src/kernel/agents/sculptor';
import { modelErrors } from '../../../src/kernel/validator';
import { analyse } from '../../../src/mj/check';
import { boxOf, classOf } from '../../../src/mj/classes';
import type { Grid3 } from '../../../src/mj/engine';
import { colorTable } from '../../../src/mj/mesh';
import { compileMjx } from '../../../src/mj/model';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../../src/mj/photo';
import { FORM_LIMITS, MAX_FORM_TIME, runMjx } from '../../../src/mj/run';
import { traceText } from '../../../src/mj/trace';
import { png } from '../../scripts/png';
import { CATALOGO, type Voce } from './catalogo';

const QUI = dirname(fileURLToPath(import.meta.url));
export const SEMI = [1, 2, 3, 4, 5];
/** The thresholds of the cantiere. */
export const SOGLIE = { distanza: 0.15, ms: 1500 } as const;

export interface Esito {
  voce: Voce;
  errori: string[];
  /** Voxels outside the largest piece, at the worst seed. */
  fluttuanti: number;
  /** Mean of the shape distances over the pairs of seeds (full in one, empty in the other, over full in either). */
  distanza: number;
  minima: number;
  ms: number;
  voxel: number[];
  passa: boolean;
}

/** Voxels outside the largest 26-connected piece. */
function fuoriDalCorpo(pieni: Uint8Array, X: number, Y: number, Z: number): number {
  const seen = new Uint8Array(pieni.length);
  let tot = 0, best = 0;
  const XY = X * Y;
  for (let i = 0; i < pieni.length; i++) {
    if (!pieni[i] || seen[i]) continue;
    let n = 0;
    const st = [i];
    seen[i] = 1;
    while (st.length) {
      const c = st.pop()!;
      n++;
      const x = c % X, y = Math.floor(c / X) % Y, z = Math.floor(c / XY);
      for (let dz = -1; dz <= 1; dz++)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const a = x + dx, b = y + dy, d = z + dz;
            if (a < 0 || b < 0 || d < 0 || a >= X || b >= Y || d >= Z) continue;
            const k = a + b * X + d * XY;
            if (pieni[k] && !seen[k]) (seen[k] = 1), st.push(k);
          }
    }
    tot += n;
    best = Math.max(best, n);
  }
  return tot - best;
}

function distanza(a: Uint8Array, b: Uint8Array): number {
  let xor = 0, or = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] || b[i]) or++;
    if (a[i] !== b[i]) xor++;
  }
  return or ? xor / or : 0;
}

/** Rows of pictures one under the other: the side of each seed above, the front below. */
function pila(righe: Picture[]): Picture {
  const w = Math.max(...righe.map((r) => r.w));
  const h = righe.reduce((s, r) => s + r.h, 0);
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([112, 150, 84, 255], i * 4);
  let oy = 0;
  for (const r of righe) {
    for (let y = 0; y < r.h; y++) data.set(r.data.subarray(y * r.w * 4, (y + 1) * r.w * 4), (oy + y) * w * 4);
    oy += r.h;
  }
  return { w, h, data };
}

const r2 = (v: number) => (Math.round(v * 1000) / 1000).toFixed(3);

export function provaVoce(v: Voce): Esito {
  const file = join(QUI, v.collezione, v.ambientazione, `${v.nome}.xml`);
  const classe = classOf(v.classe)!;
  const box = boxOf(classe);
  const xml = withSize(readFileSync(file, 'utf8'), box);
  const errori = modelErrors(`${v.nome}.xml`, xml, MAX_FORM_TIME);
  const pieni: Uint8Array[] = [];
  const grids: Grid3[] = [];
  const voxel: number[] = [];
  let fluttuanti = 0, ms = 0;
  let model;
  try {
    model = compileMjx(xml, { size: box });
  } catch (e) {
    errori.push(`compilazione: ${(e as Error).message}`);
  }
  if (model)
    for (const seme of SEMI) {
      const t = Date.now();
      const r = runMjx(model, seme, { deadline: MAX_FORM_TIME, limits: FORM_LIMITS });
      ms = Math.max(ms, Date.now() - t);
      const a = analyse(r, model.program.palette, { grounded: true, minHeight: classe.minHeight ? Math.ceil(classe.minHeight * box[2]) : undefined });
      for (const e of a.errors) errori.push(`seme ${seme}: ${e}`);
      const g = r.grid;
      const colors = colorTable(g.alphabet, model.program.palette);
      const p = new Uint8Array(g.cells.length);
      for (let i = 0; i < p.length; i++) if (colors[g.cells[i]]) p[i] = 1;
      fluttuanti = Math.max(fluttuanti, fuoriDalCorpo(p, g.X, g.Y, g.Z));
      pieni.push(p);
      grids.push(g);
      voxel.push(a.voxels);
    }
  const coppie: number[] = [];
  for (let i = 0; i < pieni.length; i++) for (let j = i + 1; j < pieni.length; j++) coppie.push(distanza(pieni[i], pieni[j]));
  const dist = coppie.length ? coppie.reduce((s, x) => s + x, 0) / coppie.length : 0;
  const minima = coppie.length ? Math.min(...coppie) : 0;
  const passa = !errori.length && fluttuanti === 0 && dist >= SOGLIE.distanza && ms < SOGLIE.ms && pieni.length === SEMI.length;
  const esito: Esito = { voce: v, errori, fluttuanti, distanza: dist, minima, ms, voxel, passa };
  if (model && grids.length) {
    const o = { ...DEFAULT_RENDER, px: 3, top: 3, front: 3 };
    const righe = [1, 0].map((vista) => sheet(grids.map((g) => render(g, model!.program.palette, vista, o)), 1, 6, [112, 150, 84]));
    writeFileSync(file.replace(/\.xml$/, '.png'), png(pila(righe)));
    writeFileSync(file.replace(/\.xml$/, '.md'), rapporto(esito, model, box));
  }
  return esito;
}

function rapporto(e: Esito, model: Parameters<typeof traceText>[0], box: number[]): string {
  const v = e.voce;
  const traccia = traceText(model, 1, { forma: 'nodi', tetto: 1500 });
  return [
    `# ${v.titolo} (\`${v.nome}\`)`,
    '',
    `${v.descrizione}`,
    '',
    `- Collezione: \`${v.collezione}\` · ambientazione: \`${v.ambientazione}\` · classe: \`${v.classe}\` (scatola ${box.join(' × ')})`,
    `- Scelte procedurali: ${v.procedura}`,
    `- Esito: **${e.passa ? 'valido' : 'NON valido'}**`,
    '',
    '| misura | valore | soglia |',
    '|---|---|---|',
    `| errori del validatore (\`modelErrors\`) e dell'analisi | ${e.errori.length} | 0 |`,
    `| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | ${e.fluttuanti} | 0 |`,
    `| distanza media fra i 5 semi (forma) | ${r2(e.distanza)} | ≥ ${SOGLIE.distanza} |`,
    `| distanza minima fra due semi | ${r2(e.minima)} | — |`,
    `| tempo del seme più lento | ${e.ms} ms | < ${SOGLIE.ms} ms |`,
    `| voxel per seme (1-5) | ${e.voxel.join(', ')} | — |`,
    '',
    ...(e.errori.length ? ['## Errori', '', ...e.errori.map((x) => `- ${x}`), ''] : []),
    `Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [\`${v.nome}.png\`](${v.nome}.png).`,
    '',
    '## Traccia (seme 1, nodi)',
    '',
    '```',
    traccia.trim(),
    '```',
    '',
  ].join('\n');
}

function indice(esiti: Map<string, Esito>): string {
  const righe: string[] = [];
  let collezione = '';
  for (const v of CATALOGO) {
    if (v.collezione !== collezione) {
      collezione = v.collezione;
      righe.push('', `## \`${collezione}/\``, '', '| ambientazione | modello | classe | distanza | fluttuanti | tempo | esito |', '|---|---|---|---|---|---|---|');
    }
    const e = esiti.get(v.nome);
    const rel = `${v.collezione}/${v.ambientazione}/${v.nome}`;
    righe.push(
      e
        ? `| ${v.ambientazione} | [${v.titolo}](${rel}.md) ([xml](${rel}.xml)) | ${v.classe} | ${r2(e.distanza)} | ${e.fluttuanti} | ${e.ms} ms | ${e.passa ? 'valido' : 'NON valido'} |`
        : `| ${v.ambientazione} | ${v.titolo} | ${v.classe} | — | — | — | da fare |`,
    );
  }
  const fatti = [...esiti.values()].filter((e) => e.passa).length;
  return [
    '# Cantiere 8 — fauna, flora, veicoli e monumenti (60 programmi MarkovJunior 3D)',
    '',
    'Sessanta programmi in tre collezioni da venti, cinque per ambientazione (`fantasy` = aurora, `steampunk` = orichalcum, `moderno` = neapolis,',
    '`futuristico` = sidera; `src/kernel/themes.ts`). Ognuno fa **scelte iniziali a caso** (pose, rami, numero di parti, proporzioni) con le',
    'regole di MarkovJunior: semi diversi, modelli diversi. Il metodo è in [`metodo.md`](metodo.md).',
    '',
    `Ogni programma passa dal banco (\`banco.ts\`): il validatore del gioco (\`modelErrors\` di \`src/kernel/validator.ts\`, nella scatola della`,
    `sua classe), cinque semi (1-5) con 0 voxel fluttuanti, distanza media di forma fra i semi ≥ ${SOGLIE.distanza} (voxel pieni in un seme e vuoti`,
    `nell'altro su quelli pieni in uno dei due, la misura \`voxel\` di \`lab/banco/varianza.ts\`), meno di ${SOGLIE.ms} ms per seme.`,
    '',
    '```bash',
    'npx vite-node lab/banco/fauna-biomi-cloud/banco.ts            # tutti',
    'npx vite-node lab/banco/fauna-biomi-cloud/banco.ts -- <nome>  # uno',
    '```',
    '',
    `Validi: **${fatti} su ${CATALOGO.length}**.`,
    ...righe,
    '',
  ].join('\n');
}

const STATO = join(QUI, '.esiti.json');

function main() {
  const nomi = process.argv.slice(2).filter((a) => a !== '--');
  const precedenti: Record<string, Omit<Esito, 'voce'>> = existsSync(STATO) ? JSON.parse(readFileSync(STATO, 'utf8')) : {};
  const esiti = new Map<string, Esito>();
  for (const v of CATALOGO) if (precedenti[v.nome]) esiti.set(v.nome, { ...precedenti[v.nome], voce: v });
  for (const v of CATALOGO) {
    if (nomi.length && !nomi.includes(v.nome)) continue;
    if (!existsSync(join(QUI, v.collezione, v.ambientazione, `${v.nome}.xml`))) continue;
    const e = provaVoce(v);
    esiti.set(v.nome, e);
    console.log(`${e.passa ? 'OK ' : 'NO '} ${v.nome.padEnd(28)} dist ${r2(e.distanza)} (min ${r2(e.minima)}) flutt ${e.fluttuanti} ${e.ms} ms voxel ${e.voxel.join('/')}`);
    for (const x of e.errori.slice(0, 6)) console.log(`     ${x}`);
  }
  const salva: Record<string, Omit<Esito, 'voce'>> = {};
  for (const [k, e] of esiti) {
    const { voce: _, ...resto } = e;
    salva[k] = resto;
  }
  writeFileSync(STATO, JSON.stringify(salva, null, 1) + '\n');
  writeFileSync(join(QUI, 'README.md'), indice(esiti));
}

main();
