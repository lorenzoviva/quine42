// The bench of the structures that fit their size (T338, lab/banco/taglie/README.md): what the parts one lives in measure (doors,
// storeys, rooms: `habitableParts`) and what a structure contains (`compositionOf`) at three sizes, with the checks of the kernel
// (`partErrors`, `varietyError`), the time and the photos from four sides.
//
//   npx vite-node lab/scripts/banco-taglie.ts -- --misura [--semi 2]                 # the seed's structures and the skeleton, at their boxes
//   npx vite-node lab/scripts/banco-taglie.ts -- [--semi 2] [--solo fattoria,forte] [--foto] [--json lab/banco/taglie/misure.json]

import fs from 'node:fs';
import path from 'node:path';
import { classOf, SIZE_TIERS, tilesOf, voxelsOf, type SizeTier } from '../../src/mj/classes';
import { varietyError, type Composition } from '../../src/mj/check';
import { giro, riga } from '../banco/taglie/misure';
import { compileMjx, type MjxModel } from '../../src/mj/model';
import { cartoonRender, render, sheet } from '../../src/mj/photo';
import { vptOf, entryBox, type ModelInfo } from '../../src/kernel/forms';
import { checkProgram, sculptorRole, skeletonOf } from '../../src/kernel/agents/sculptor';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const SEMI = Number(opt('semi') ?? 2);
const DIR = path.resolve('lab/banco/taglie');
const STRUCTURE = classOf('structure')!;

function misura(): void {
  const index = JSON.parse(fs.readFileSync('universe/models/index.json', 'utf8')) as Record<string, ModelInfo>;
  const ids = Object.keys(index).filter((id) => index[id].class === 'structure');
  const prog: Array<[string, string, ModelInfo]> = ids.map((id) => [id, fs.readFileSync(`universe/models/${id}.xml`, 'utf8'), index[id]]);
  const role = sculptorRole({ 'prompts/agents/sculptor.md': fs.readFileSync('universe/prompts/agents/sculptor.md', 'utf8') }, true);
  prog.push(['scheletro', skeletonOf(role)!, { class: 'structure' } as ModelInfo]);
  for (const [id, xml, info] of prog) {
    const vpt = vptOf(info);
    const box = entryBox(STRUCTURE, info);
    let model: MjxModel;
    try {
      model = compileMjx(xml, /\ssize="/.test(xml.replace(/<!--[\s\S]*?-->/g, '').slice(0, 400)) ? {} : { size: box });
    } catch (e) {
      console.log(`${id}: ${(e as Error).message}`);
      continue;
    }
    console.log(`${id} (vpt ${vpt})`);
    for (let s = 1; s <= SEMI; s++) console.log(`   ${riga(giro(model, vpt, s), vpt)}`);
  }
}

/** The programs of the bench, at the three sizes a structure that grows by rules has (Large, Huge, Gargantuan). */
const BANCHI = [
  { id: 'fattoria', file: 'lab/banco/taglie/fattoria.xml' },
  { id: 'forte', file: 'lab/banco/taglie/forte.xml' },
];
const TAGLIE: SizeTier[] = ['large', 'huge', 'gargantuan'];

function banco(): void {
  const solo = opt('solo')?.split(',');
  const out: Record<string, unknown> = {};
  fs.mkdirSync(DIR, { recursive: true });
  for (const b of BANCHI.filter((x) => !solo || solo.includes(x.id))) {
    const xml = fs.readFileSync(b.file, 'utf8');
    const righe: Record<string, unknown> = {};
    const prima: Record<string, Composition> = {};
    const foto = [];
    for (const t of TAGLIE) {
      const box = voxelsOf(tilesOf(STRUCTURE, t), 20);
      const model = compileMjx(xml, { size: box });
      const giri = Array.from({ length: SEMI }, (_, i) => giro(model, 20, i + 1));
      console.log(`${b.id} · ${t} (${tilesOf(STRUCTURE, t).slice(0, 2).join(' × ')} caselle, ${box.join('×')})`);
      for (const g of giri) console.log(`   ${riga(g, 20)}`);
      prima[t] = giri[0].composizione;
      righe[t] = giri.map(({ grid: _g, ...g }) => g);
      if (args.includes('--foto')) {
        const g = giri[0].grid;
        const scala = Math.max(1, Math.round(240 / box[0]));
        const lati = [0, 1, 2, 3].map((v) => render(g, model.program.palette, v, cartoonRender(scala)));
        fs.writeFileSync(path.join(DIR, `${b.id}-${t}.png`), png(sheet(lati, 1, 8, [112, 150, 84])));
        foto.push(`${b.id}-${t}.png`);
      }
    }
    for (let i = 1; i < TAGLIE.length; i++) {
      const e = varietyError(prima[TAGLIE[i - 1]], prima[TAGLIE[i]], SIZE_TIERS.find((s) => s.id === TAGLIE[i - 1])!.name, SIZE_TIERS.find((s) => s.id === TAGLIE[i])!.name);
      console.log(`   varietà ${TAGLIE[i - 1]} → ${TAGLIE[i]}: ${e ?? 'cresce'}`);
    }
    // The kernel's own check, as the Sculptor's program would have it at its size (Large: 4 seeds, and Huge).
    const c = checkProgram(xml.replace(/\ssize="[^"]*"/, ''), STRUCTURE, 'large');
    console.log(`   checkProgram (grande): ${c.error ?? 'passa'}`);
    out[b.id] = { taglie: righe, controllo: c.error ?? 'passa', foto };
  }
  const json = opt('json');
  if (json) fs.writeFileSync(json, JSON.stringify(out, null, 1));
}

if (args.includes('--misura')) misura();
else banco();
