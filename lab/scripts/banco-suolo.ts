// The structures with a cellar of D33 (T258): four more buildings with `suolo="E"` and `sotto: 1`, tried at Grande and Enorme on five seeds
// with the bench's own threshold and the variance of T180. No model is called: the programs are in lab/banco/suolo/strutture/.
//
//   npx vite-node lab/scripts/banco-suolo.ts -- [--solo vinicola,cripta] [--out lab/banco/suolo/strutture]

import fs from 'node:fs';
import path from 'node:path';
import { STRUTTURE } from '../banco/suolo/strutture';
import { fotoSemi, prova } from '../banco/varianza';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);

const out = path.resolve(opt('out') ?? 'lab/banco/suolo/strutture');
const solo = opt('solo')?.split(',');
const righe: string[] = [];
const n2 = (v: number | undefined) => (v === undefined ? '—' : v.toFixed(2).replace('.', ','));
for (const b of STRUTTURE) {
  if (solo && !solo.includes(b.id)) continue;
  const xml = fs.readFileSync(path.join(out, `${b.id}.xml`), 'utf8');
  const p = prova(xml, b, { taglie: ['large', 'huge'] });
  const pic = fotoSemi(p);
  if (pic) fs.writeFileSync(path.join(out, `${b.id}.png`), png(pic));
  const v = p.taglie[0].varianza;
  const taglie = p.taglie.map((t) => {
    const ok = t.semi.filter((s) => !s.difetti.length).length;
    const cadute = [...new Set(t.semi.flatMap((s) => s.difetti.map((d) => d.split(':')[0])))];
    const ms = Math.max(...t.semi.map((s) => s.ms));
    return `${ok}/${t.semi.length}${cadute.length ? `: ${cadute.join(', ')}` : ''} (max ${(ms / 1000).toFixed(2)} s)`;
  });
  const varia = p.taglie.flatMap((t) => t.difettiVarianza.map((d) => `${t.taglia} ${d}`));
  righe.push(`| ${b.id} | ${n2(v?.voxel)} | ${n2(v?.pianta)} | ${n2(v?.perimetro)} | ${n2(v?.interno)} | ${v?.architetture ?? '—'}/5 | ${taglie.join(' | ')} | ${varia.join('; ') || 'sì'} |`);
  console.log(righe[righe.length - 1]);
}
const md = [
  '# Strutture con la cantina (D33): 5 semi, Grande ed Enorme',
  '',
  'Misura e varianza a Grande; per ogni taglia i semi che passano `giudica` e il tempo più lungo misurato con le misure (il programma da solo è meno).',
  '',
  '| struttura | voxel | pianta | perimetro | interno | architetture | grande | enorme | varianza |',
  '|---|---|---|---|---|---|---|---|---|',
  ...righe,
  '',
].join('\n');
if (!solo) fs.writeFileSync(path.join(out, 'riepilogo.md'), md);
