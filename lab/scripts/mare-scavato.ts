// T432 (docs/design/acqua-spazio.md § 1.2): quanto mare il layout di oggi trasforma in sentiero, su tre bozze di mare con i
// terreni del seme, e quante ne trasformerebbe se l'acqua contasse come passabile (l'approssimazione di P1: il nuoto). In più
// l'errore dei vertici a 32 bit lontano dall'origine (§ 2.6) e quanto nuota un viandante con l'energia piena (§ 1.2).
// Senza chiamate, non scrive: `npx vite-node lab/scripts/mare-scavato.ts`.

import { readFileSync } from 'node:fs';
import { layout } from '../../src/kernel/layout';
import type { TerrainDef } from '../../src/kernel/types';

const S = 18;
const tiles = JSON.parse(readFileSync('universe/modules/world.terrain/manifest.json', 'utf8')).tiles as Record<string, TerrainDef>;

/** Una bozza di S × S dal disegno di una funzione (colonna, riga) → codice. */
const draft = (f: (c: number, r: number) => string): string[] => Array.from({ length: S }, (_, r) => Array.from({ length: S }, (_, c) => f(c, r)).join(''));

const cases: Array<{ name: string; draft: string[]; cx: number; cy: number }> = [
  { name: 'tutto mare aperto', draft: draft(() => 'o'), cx: 7, cy: -3 },
  { name: 'isolotto di 6 × 6 nel mare', draft: draft((c, r) => (c >= 6 && c < 12 && r >= 6 && r < 12 ? 'g' : 'o')), cx: 8, cy: -3 },
  { name: 'costa: terra a ovest, riva, mare a est', draft: draft((c) => (c < 8 ? 'g' : c < 10 ? 'w' : 'o')), cx: 9, cy: -3 },
];

/** Le stesse caselle con l'acqua passabile: `o` e `w` non solidi (ciò che P1 farebbe contare alla connessione). */
const swim: Record<string, TerrainDef> = Object.fromEntries(Object.entries(tiles).map(([k, t]) => [k, k === 'o' || k === 'w' ? { ...t, solid: false } : t]));

const water = (g: string[]) => g.join('').split('').filter((c) => c === 'o' || c === 'w').length;

for (const c of cases) {
  const today = layout(c.draft, tiles, { cx: c.cx, cy: c.cy, seed: 42, pathCode: 'p' });
  const swum = layout(c.draft, swim, { cx: c.cx, cy: c.cy, seed: 42, pathCode: 'p' });
  console.log(`\n## ${c.name}`);
  console.log(`acqua nella bozza: ${water(c.draft)} caselle; oggi diventano sentiero: ${water(c.draft) - water(today.grid)} (varchi compresi); con l'acqua passabile: ${water(c.draft) - water(swum.grid)}`);
  console.log('oggi:');
  for (const row of today.grid) console.log('  ' + row);
}

console.log('\n## I vertici a 32 bit (renderer: coordinate assolute del tappeto)');
for (const x of [1_000, 65_536, 131_072, 1_048_576, 16_777_216]) {
  const step = Math.fround(x + 1 / 64) - x;
  // L'errore massimo di arrotondamento è mezzo passo fra due float vicini.
  let ulp = 1;
  while (Math.fround(x + ulp / 2) !== x) ulp /= 2;
  console.log(`a ${x.toLocaleString('it-IT')} caselle: un float a 32 bit distingue ${ulp} casella (16 voxel per casella: ${ulp * 16} voxel); x + 1/64 = x + ${step}`);
}

console.log('\n## Quanto nuota un viandante con l’energia piena (proposta di P1)');
// sys.needs: energia 0,06 al secondo, ×1,6 in movimento; P1 propone ×3 a nuoto e il nuoto a 0,4 del passo di 6 caselle al secondo.
const drain = 0.06 * 1.6 * 3;
const seconds = 100 / drain;
const tilesSwum = seconds * 6 * 0.4;
console.log(`consumo ${drain.toFixed(3)} al secondo: ${Math.round(seconds)} s a nuoto, ${Math.round(tilesSwum)} caselle (${(tilesSwum / S).toFixed(0)} luoghi) prima che l'energia finisca`);
