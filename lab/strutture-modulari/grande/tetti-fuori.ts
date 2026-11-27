// Which roofs stay unreached after the stitching (T543): by the storey they stand on (a roof on storey 1 is the roof of a palazzo of one
// storey, which has no core), and what stands beside the first ones (to read why the stitching left them).
//
//   npx vite-node lab/strutture-modulari/grande/tetti-fuori.ts [-- --semi 3] [--vicini 6]

import { DX, DY } from '../../../src/mj/wfc';
import { brickSet, faceText } from './facce';
import { massing } from './massa';
import { reachedBays, walkable, type Fabric } from './misure';
import { stitch, wantedBays } from './ricucitura';
import { AIR, SETS, STYLES } from './tasselli';
import { viaA } from './via-a';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string, d: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : d);
const seeds = Number(opt('semi', '3'));
let show = Number(opt('vicini', '6'));
const byStorey = new Map<number, [number, number]>();
const why = new Map<string, number>();
for (const style of STYLES) {
  const set = brickSet([...SETS[style], AIR]);
  for (let seed = 1; seed <= seeds; seed++) {
    const m = massing('quartiere', seed);
    const w = viaA(set, m.grid, m.letter, seed, 100, 300_000);
    if (!w.observed) continue;
    const f: Fabric = { set, X: w.X, Y: w.Y, Z: w.Z, at: Int32Array.from(w.observed), letter: m.letter };
    stitch(f, wantedBays(true));
    const seen = reachedBays(f);
    const { X, Y } = f;
    for (let i = 0; i < f.at.length; i++) {
      const p = set.patterns[f.at[i]];
      if (p.brick.family !== 'roof' || !walkable(p)) continue;
      const z = Math.floor(i / (X * Y));
      const s = byStorey.get(z) ?? [0, 0];
      s[1]++;
      if (!seen[i]) s[0]++;
      byStorey.set(z, s);
      if (seen[i]) continue;
      // What stands beside it: reached or not, its family and the faces that meet.
      const x = i % X, y = Math.floor(i / X) % Y;
      const around = [0, 1, 2, 3].map((d) => {
        const nx = x + DX[d], ny = y + DY[d];
        if (nx < 0 || ny < 0 || nx >= X || ny >= Y) return 'fuori';
        const j = nx + ny * X + z * X * Y;
        const q = set.patterns[f.at[j]];
        return `${q.brick.family}${seen[j] ? '+' : '-'}:${faceText(p.faces[d])}/${faceText(q.faces[(d + 2) % 4])}`;
      });
      const reachedNeighbour = around.some((a) => a.includes('+:'));
      const k = reachedNeighbour ? 'accanto a un vano raggiunto' : 'nessun vano raggiunto accanto';
      why.set(k, (why.get(k) ?? 0) + 1);
      if (show > 0 && reachedNeighbour) {
        show--;
        console.log(`${style} ${seed} tetto ${x},${y},${z} ${p.brick.name.split('/')[1]}: ${around.join('  ')}`);
      }
    }
  }
}
for (const [z, [out, all]] of [...byStorey].sort((a, b) => a[0] - b[0])) console.log(`tetti al piano ${z}: ${out} fuori su ${all} (${Math.round((100 * out) / all)} %)`);
console.log(JSON.stringify(Object.fromEntries(why)));
