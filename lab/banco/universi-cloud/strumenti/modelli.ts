// The bench of the models of orichalcum: every program through the kernel's validator (`modelErrors`, in the box of its class as the game
// runs it: `size` is the class box), and its variance on five seeds: the median, over the pairs of seeds, of the visible voxels full in one
// and empty in the other over those full in either (as `voxel` of lab/banco/varianza.ts). A sound program goes through `analyzeSound` on
// ten triples of seeds instead: no defect on any.
//   (prova-modelli.ts runs it)
import { readFileSync } from 'node:fs';
import { modelErrors } from '../../../../src/kernel/validator';
import { compileMjx } from '../../../../src/mj/model';
import { FORM_LIMITS, runMjx } from '../../../../src/mj/run';
import { analyzeSound } from '../../../../src/mj/soundanalysis';
import { AIR } from '../../../../src/mj/engine';
import { RADICE } from './carica';

export const MODELLI = [
  'caldaia-vapore', 'valvola-manometro', 'banco-orologiaio', 'fucina-oricalco', 'carrello-minerario', 'telegrafo-pneumatico', 'pilone-ormeggio',
  'enigma-ingranaggi', 'cassaforte-ghisa', 'lampione-gas', 'bacheca-corporazione', 'automa-ottone', 'chiave-inglese', 'persona-vapore',
  'casa-comune-edificio-ee18c0d6', 'casa-comune-grande-ee18c0d6',
];
export const SUONI = [
  'suono-fonderia-notturna', 'suono-valzer-ottone', 'suono-binari-alti', 'suono-miniera-calda', 'suono-dirigibile-ponente',
  'suono-effetto-sfiato', 'suono-effetto-ingranaggio', 'suono-effetto-capsula',
];
export const SOGLIA = 0.15;
const SEMI = [1, 2, 3, 4, 5];
/** Ten triples of seeds for a sound program. */
export const TERNE = Array.from({ length: 10 }, (_, i) => [3 * i + 1, 3 * i + 2, 3 * i + 3]);

const dir = RADICE + 'orichalcum/models/';

/** The visible voxels of a run, as a set of cell indices. */
function pieni(xml: string, seed: number): Set<number> {
  const m = compileMjx(xml);
  const r = runMjx(m, seed, { limits: FORM_LIMITS, deadline: 8000 });
  const pal = m.program.palette;
  const vis = r.grid.alphabet.map((c) => c !== AIR && !!pal[c]?.color && !pal[c]?.hidden);
  const out = new Set<number>();
  r.grid.cells.forEach((v, i) => vis[v] && out.add(i));
  return out;
}

export function varianza(xml: string): { mediana: number; voxel: number[] } {
  const sets = SEMI.map((s) => pieni(xml, s));
  const d: number[] = [];
  for (let i = 0; i < sets.length; i++)
    for (let j = i + 1; j < sets.length; j++) {
      let diff = 0;
      let union = sets[i].size;
      for (const v of sets[j]) if (!sets[i].has(v)) (diff++, union++);
      for (const v of sets[i]) if (!sets[j].has(v)) diff++;
      d.push(union ? diff / union : 0);
    }
  d.sort((a, b) => a - b);
  return { mediana: (d[4] + d[5]) / 2, voxel: sets.map((s) => s.size) };
}

export function provaModello(id: string): { errori: string[]; varianza?: number; voxel?: number[]; ms: number } {
  const xml = readFileSync(dir + id + '.xml', 'utf8');
  const t = Date.now();
  const errori = modelErrors(`models/${id}.xml`, xml);
  if (errori.length) return { errori, ms: Date.now() - t };
  const v = varianza(xml);
  if (v.mediana <= SOGLIA) errori.push(`models/${id}.xml: varianza ${v.mediana.toFixed(3)} ≤ ${SOGLIA}`);
  return { errori, varianza: v.mediana, voxel: v.voxel, ms: Date.now() - t };
}

export function provaSuono(id: string): { errori: string[]; ms: number; effetto?: boolean } {
  const xml = readFileSync(dir + id + '.xml', 'utf8');
  const t = Date.now();
  const errori = modelErrors(`models/${id}.xml`, xml);
  let effetto: boolean | undefined;
  if (!errori.length) {
    const m = compileMjx(xml);
    for (const seeds of TERNE) {
      const r = analyzeSound(m, { seeds, frugal: true });
      effetto = r.effect;
      for (const i of r.issues) errori.push(`models/${id}.xml, semi ${seeds.join(' ')}: ${i.defect}: ${i.message}`);
    }
  }
  return { errori: [...new Set(errori)], ms: Date.now() - t, effetto };
}
