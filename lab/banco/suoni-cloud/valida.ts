// Validates the sound programs of the cloud workshop (Cantiere 3): ten triples of seeds, the validator, the report in rapporti/<nome>.md.
//
//   npx vite-node lab/banco/suoni-cloud/valida.ts -- <file.xml> [<file.xml> …] [--quiet]
//
// Exit code 1 if one triple or the validator finds a defect. No browser, no model: the same program gives the same report, to the byte.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileMjx } from '../../../src/mj/model';
import { run } from '../../../src/mj/engine';
import { scoreOf, type ScoreEvent } from '../../../src/mj/sound';
import { analyzeSound, soundReportText, type SoundReport } from '../../../src/mj/soundanalysis';
import { SOUND_LIMITS, SOUND_MAX_STEPS } from '../../../src/mj/synth';
import { renderTrace, traceProgram } from '../../../src/mj/trace';
import { modelErrors } from '../../../src/kernel/validator';

export const TRIPLES: number[][] = Array.from({ length: 10 }, (_, i) => [3 * i + 1, 3 * i + 2, 3 * i + 3]);
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'rapporti');

const key = (e: ScoreEvent) => `${e.step}:${e.track}:${e.z}:${e.voice}`;
function distance(a: ScoreEvent[], b: ScoreEvent[]): number {
  const A = new Set(a.map(key)), B = new Set(b.map(key));
  let both = 0;
  for (const k of A) if (B.has(k)) both++;
  const any = A.size + B.size - both;
  return any ? 1 - both / any : 0;
}
const n = (x: number, d = 2) => x.toFixed(d);

export interface Verdict { name: string; ok: boolean; lines: string[] }

export function validate(file: string): Verdict {
  const name = path.basename(file, '.xml');
  const xml = fs.readFileSync(file, 'utf8');
  const m = compileMjx(xml);
  if (!m.sound) throw new Error(`${file}: manca <sound>`);
  const rows: string[] = [];
  const problems: string[] = [];
  const reports: SoundReport[] = [];
  for (const t of TRIPLES) {
    const r = analyzeSound(m, { seeds: t });
    reports.push(r);
    const sig = r.seeds.map((s) => s.signal!).filter(Boolean);
    const max = (f: (g: (typeof sig)[number]) => number) => Math.max(...sig.map(f));
    const min = (f: (g: (typeof sig)[number]) => number) => Math.min(...sig.map(f));
    const verdict = r.issues.length ? r.issues.map((i) => `${i.defect.toUpperCase()}: ${i.message}`).join('; ') : 'pulito';
    if (r.issues.length) problems.push(`[${t.join(',')}] ${verdict}`);
    // The threshold is 0.05: here every triple must stay three times above it.
    if ((r.seedDistance ?? 0) < 0.15) problems.push(`[${t.join(',')}] distanza fra i semi ${n(r.seedDistance ?? 0)}, sotto 0,15 (tre volte la soglia)`);
    rows.push(`| ${t.join(', ')} | ${verdict} | ${n(r.seedDistance ?? 0)} | ${Math.min(...r.seeds.map((s) => s.score.events))}-${Math.max(...r.seeds.map((s) => s.score.events))} | ${Math.min(...r.seeds.map((s) => s.score.pitches))} | ${n(min((g) => g.rmsDb), 1)}..${n(max((g) => g.rmsDb), 1)} | ${n(max((g) => g.rawPeak))} | ${Math.round(max((g) => g.silence) * 100)} % | ${n(min((g) => g.dynamics), 1)} | ${n(max((g) => g.seam))} | ${Math.round(Math.max(...r.seeds.map((s) => s.score.harsh)) * 100)} % | ${Math.min(...r.seeds.map((s) => s.score.period))}/${r.seeds[0].score.steps} |`);
  }
  // All thirty seeds together: how far apart they are, and how many different scores.
  const scores = TRIPLES.flat().map((s) => scoreOf(run(m.program, s, SOUND_MAX_STEPS, SOUND_LIMITS).grid, m.sound!).events);
  let sum = 0, pairs = 0, minD = 1;
  for (let i = 0; i < scores.length; i++)
    for (let j = i + 1; j < scores.length; j++) {
      const d = distance(scores[i], scores[j]);
      sum += d;
      pairs++;
      minD = Math.min(minD, d);
    }
  const distinct = new Set(scores.map((s) => s.map(key).sort().join(','))).size;
  const validator = modelErrors(`models/${name}.xml`, xml, 20_000);
  if (validator.length) problems.push(`validatore: ${validator.join('; ')}`);
  if (sum / pairs < 0.15) problems.push(`distanza media sui 30 semi ${n(sum / pairs)}: troppo vicina alla soglia 0,05`);
  const trace = renderTrace(traceProgram(m, 1, { limits: SOUND_LIMITS, maxSteps: SOUND_MAX_STEPS }), m, { limits: SOUND_LIMITS, maxSteps: SOUND_MAX_STEPS }).replace(/ in \d+ ms\./, '.');
  const comment = /<!--\s*([\s\S]*?)\s*-->/.exec(xml)?.[1] ?? '';
  const md = [
    `# ${name}`,
    '',
    comment ? `> ${comment}` : '',
    '',
    `Sorgente: \`lab/banco/suoni-cloud/${path.relative(here, file).replace(/\\/g, '/')}\`. Rigenera con \`npx vite-node lab/banco/suoni-cloud/valida.ts -- ${path.relative(process.cwd(), file).replace(/\\/g, '/')}\`.`,
    '',
    '## Esito',
    problems.length ? problems.map((p) => `- ${p}`).join('\n') : `Dieci terne su dieci senza difetti; il validatore (\`modelErrors\`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi ${n(sum / pairs)} (minima fra due semi ${n(minD)}), ${distinct} partiture diverse su 30.`,
    '',
    '## Le dieci terne',
    '| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows,
    '',
    soundReportText({ ...reports[0], name }).replace(/^# /, '## Rapporto completo: ').replace(/\n## /g, '\n### '),
    '## Traccia, seme 1',
    '```',
    trace.split('\n').slice(0, 60).join('\n'),
    '```',
    '',
  ].join('\n');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, `${name}.md`), md);
  return { name, ok: !problems.length, lines: problems.length ? problems : [`ok: distanza ${n(sum / pairs)} (min ${n(minD)}), ${distinct}/30 diverse`] };
}

{
  const files = process.argv.slice(2).filter((a) => a !== '--' && !a.startsWith('--'));
  let bad = 0;
  for (const f of files) {
    let v: Verdict;
    try {
      v = validate(f);
    } catch (e) {
      v = { name: path.basename(f, '.xml'), ok: false, lines: [`non compila: ${(e as Error).message}`] };
    }
    if (!v.ok) bad++;
    console.log(`${v.ok ? 'OK  ' : 'NO  '} ${v.name}: ${v.lines.join(' | ')}`);
  }
  console.log(`${files.length - bad}/${files.length} puliti`);
  if (bad) process.exitCode = 1;
}
