// Variance and scale on the bench (T180): XML already written, more seeds and more sizes, a table and a contact sheet. No model is called.
//
//   npx vite-node lab/scripts/banco-varianza.ts -- --xml modello.xml --bersagli rocca [--taglie enorme,gargantuesca] [--semi 5] [--out lab/out/banco/varianza]
//   npx vite-node lab/scripts/banco-varianza.ts -- --radici lab/banco/finale,lab/banco/conferma [--taglie grande,enorme,gargantuesca] [--foto rocca/1] [--out lab/banco/varianza]
//
// → <out>/riepilogo.md, <out>/riepilogo.json, and <out>/<nome>.png for what `--xml` or `--foto` says. The criteria are in lab/banco/README.md.

import fs from 'node:fs';
import path from 'node:path';
import type { SizeTier } from '../../src/mj/classes';
import { BERSAGLI, bersaglio } from '../banco/bersagli';
import type { Bersaglio } from '../banco/misure';
import { fotoSemi, prova, SEMI, type Prova, type ProvaTaglia } from '../banco/varianza';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);

const out = path.resolve(opt('out') ?? 'lab/out/banco/varianza');
const semi = Number(opt('semi') ?? SEMI);
const taglie = opt('taglie')?.split(',') as SizeTier[] | undefined;
const foto = (opt('foto') ?? '').split(',').filter(Boolean);
const fileXml = opt('xml');

interface Voce {
  nome: string;
  file: string;
  b: Bersaglio;
}

/** What a folder of attempts has: `<target>/<n>/modello.xml` and, if it had one, `<target>/<n>/seconda/modello.xml`. */
function vociDi(radice: string): Voce[] {
  const voci: Voce[] = [];
  for (const b of BERSAGLI) {
    const dir = path.join(radice, b.id);
    if (!fs.existsSync(dir)) continue;
    for (const n of fs.readdirSync(dir).sort())
      for (const sub of ['', 'seconda']) {
        const file = path.join(dir, n, sub, 'modello.xml');
        if (fs.existsSync(file)) voci.push({ nome: [path.basename(radice), b.id, n, sub].filter(Boolean).join('/'), file, b });
      }
  }
  return voci;
}

const voci: Voce[] = fileXml
  ? (opt('bersagli') ?? 'moderna').split(',').map((id) => ({ nome: `${path.basename(fileXml, '.xml')}-${id}`, file: fileXml, b: bersaglio(id) ?? (() => { throw new Error(`bersaglio sconosciuto: ${id}`); })() }))
  : (opt('radici') ?? 'lab/banco/finale,lab/banco/conferma').split(',').flatMap(vociDi);

const n2 = (v: number | undefined) => (v === undefined ? '—' : v.toFixed(2).replace('.', ','));
const conta = (t: ProvaTaglia) => `${t.semi.filter((s) => !s.difetti.length).length}/${t.semi.length}`;
/** The measures a size fails, without their numbers: `piani, murato`. */
const cadute = (t: ProvaTaglia) => [...new Set(t.semi.flatMap((s) => s.difetti.map((d) => (d.startsWith('il gioco') ? 'rifiutato' : d.split(':')[0]))))].join(', ') || '—';

fs.mkdirSync(out, { recursive: true });
const righe: Array<{ nome: string; prova: Omit<Prova, 'esecuzioni'> }> = [];
for (const v of voci) {
  const p = prova(fs.readFileSync(v.file, 'utf8'), v.b, { semi, ...(taglie ? { taglie } : {}) });
  const { esecuzioni: _e, ...resto } = p;
  righe.push({ nome: v.nome, prova: resto });
  if (fileXml || foto.some((f) => v.nome.includes(f))) {
    const pic = fotoSemi(p);
    if (pic) fs.writeFileSync(path.join(out, `${v.nome.replace(/[\\/]/g, '-')}.png`), png(pic));
  }
  console.log(`${v.nome}: ${p.ms} ms · ${p.taglie.some((t) => !t.varianza) ? 'rifiutato' : p.statico ? 'statico' : p.varia ? 'varia' : 'varia poco'} · ${p.taglie.map((t) => `${t.taglia} ${conta(t)}`).join(' · ')}`);
}

const tutte = [...new Set(righe.flatMap((r) => r.prova.taglie.map((t) => t.taglia)))];
const quante = righe.flatMap((r) => r.prova.taglie).flatMap((t) => t.semi).length;
const msTot = righe.reduce((s, r) => s + r.prova.ms, 0);
const tabella = [
  `# Varianza e scala: ${righe.length} programmi, ${semi} semi, taglie ${tutte.join(', ')}`,
  '',
  `${righe.filter((r) => r.prova.statico).length} statici su ${righe.length}; ${righe.filter((r) => r.prova.varia).length} variano quanto chiede la soglia; ${righe.filter((r) => r.prova.regge).length} reggono le misure a ogni seme e a ogni taglia. Tempo: ${(msTot / 1000).toFixed(0)} s per ${quante} esecuzioni misurate (${(msTot / Math.max(1, quante)).toFixed(0)} ms l'una, ${(msTot / Math.max(1, righe.length) / 1000).toFixed(1)} s a programma), su un solo processo.`,
  '',
  'Le quote sono le mediane delle coppie di semi alla taglia del bersaglio: `voxel` è la forma, `colore` non conta. Per ogni taglia: semi che passano tutte le misure, e quali cadono.',
  '',
  `| programma | voxel | colore | pianta | perimetro | interno | architetture | ${tutte.join(' | ')} |`,
  `|---|---|---|---|---|---|---|${tutte.map(() => '---').join('|')}|`,
  ...righe.map(({ nome, prova: p }) => {
    const v = p.taglie.find((t) => t.varianza)?.varianza;
    const cols = tutte.map((id) => {
      const t = p.taglie.find((x) => x.taglia === id);
      return t ? `${conta(t)}${t.regge ? '' : `: ${cadute(t)}`}` : '';
    });
    return `| ${nome} | ${n2(v?.voxel)} | ${n2(v?.colore)} | ${n2(v?.pianta)} | ${n2(v?.perimetro)} | ${n2(v?.interno)} | ${v ? `${v.architetture}/${v.semi}` : '—'} | ${cols.join(' | ')} |`;
  }),
  '',
].join('\n');
fs.writeFileSync(path.join(out, 'riepilogo.md'), tabella);
fs.writeFileSync(path.join(out, 'riepilogo.json'), `${JSON.stringify(righe, null, 1)}\n`);
console.log(`→ ${path.join(out, 'riepilogo.md')}`);
