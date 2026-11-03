// The trace of a MarkovJunior program, in text (T179, src/mj/trace.ts): no model is called.
//
//   npx vite-node lab/scripts/mjx-trace.ts -- <file.xml> [--bersaglio moderna | --size "80 80 60"] [--seme 1] [--forma differenze] [--tetto 4000] [--passo N]
//   npx vite-node lab/scripts/mjx-trace.ts -- --confronto [--dir lab/banco/conferma] [--tetto 4000]     the table of lab/banco/traccia.md

import fs from 'node:fs';
import path from 'node:path';
import type { Vec3 } from '../../src/mj/engine';
import { compileMjx, type MjxModel } from '../../src/mj/model';
import { OFFICIAL } from '../mjx/official';
import { boxesText, DEFAULT_CEILING, estimateTokens, renderTrace, sectionLines, framesAt, TRACE_FORMS, traceProgram, type TraceForm } from '../../src/mj/trace';
import { bersaglio } from '../banco/bersagli';
import { esegui } from '../banco/misure';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const seme = Number(opt('seme') ?? 1);
const tetto = Number(opt('tetto') ?? DEFAULT_CEILING);

function modelloDi(file: string, idBersaglio?: string): MjxModel {
  const xml = fs.readFileSync(file, 'utf8');
  if (idBersaglio) {
    const b = bersaglio(idBersaglio);
    if (!b) throw new Error(`bersaglio sconosciuto: ${idBersaglio}`);
    return esegui(xml, b, seme).model;
  }
  const size = opt('size')?.trim().split(/\s+/).map(Number) as Vec3 | undefined;
  return compileMjx(xml, size ? { size } : {});
}

if (args.includes('--confronto')) {
  const dir = path.resolve(opt('dir') ?? 'lab/banco/conferma');
  console.log(`| modello | passi | nodi | (a) sezioni grezze | (a) sezioni piegate | (b) differenze senza tetto | (c) scatole senza tetto | ms |`);
  console.log(`|---|---|---|---|---|---|---|---|`);
  const voci = [
    ...fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, '1', 'modello.xml'))).map((id) => ({ id, m: modelloDi(path.join(dir, id, '1', 'modello.xml'), id) })),
    ...OFFICIAL.map((o) => ({ id: o.name, m: compileMjx(o.xml, { size: o.size }) })),
  ];
  for (const { id, m } of voci) {
    const t = traceProgram(m, seme);
    const f = framesAt(m, seme, [t.steps]).get(t.steps)!;
    const grezze = estimateTokens(sectionLines(f, { plain: true }).flat().join('\n'));
    const piegate = estimateTokens(sectionLines(f).flat().join('\n'));
    const diff = estimateTokens(renderTrace(t, m, { forma: 'differenze', tetto: 1e9 }));
    const scatole = estimateTokens(boxesText(f, 1e9).join('\n'));
    console.log(`| ${id} | ${t.steps} | ${t.nodes.length} | ${grezze} | ${piegate} | ${diff} | ${scatole} | ${t.ms} |`);
  }
} else {
  const file = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  if (!file) throw new Error('quale file? npx vite-node lab/scripts/mjx-trace.ts -- modello.xml');
  const m = modelloDi(file, opt('bersaglio'));
  const forma = (opt('forma') ?? undefined) as TraceForm | undefined;
  if (forma && !TRACE_FORMS.includes(forma)) throw new Error(`forme: ${TRACE_FORMS.join(' ')}`);
  const passo = opt('passo');
  const t = traceProgram(m, seme);
  const testo = renderTrace(t, m, { ...(forma ? { forma } : {}), tetto, ...(passo ? { passo: Number(passo) } : {}) });
  console.log(testo);
  console.error(`\n${testo.length} caratteri, ~${estimateTokens(testo)} token stimati`);
}
