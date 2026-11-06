// What a sound program plays and what is wrong with it (T223, src/mj/soundanalysis.ts): no browser, no model is called.
//
//   npx vite-node lab/scripts/mjx-sound.ts -- <file.xml | id of universe/models> [--semi 1,2,3,4,5] [--out lab/out/suono/<nome>] [--tetto 4000]
//
// Writes in the folder rapporto.md, then seme-<n>.wav and traccia-<n>.txt for every seed, and prints the report. Exit code 1 if the report finds a defect.

import fs from 'node:fs';
import path from 'node:path';
import { compileMjx } from '../../src/mj/model';
import { analyzeSound, DEFAULT_SOUND_SEEDS, soundReportText } from '../../src/mj/soundanalysis';
import { renderScore, SOUND_LIMITS, SOUND_MAX_STEPS } from '../../src/mj/synth';
import { DEFAULT_CEILING, renderTrace, traceProgram } from '../../src/mj/trace';
import { scoreOf } from '../../src/mj/sound';
import { run } from '../../src/mj/engine';
import { wavOf } from './wav';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const what = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!what) throw new Error('quale programma? npx vite-node lab/scripts/mjx-sound.ts -- sound-cellular-fugue');
const file = fs.existsSync(what) ? what : path.join('universe/models', `${what}.xml`);
const nome = path.basename(file, '.xml');
const semi = opt('semi')?.split(',').map(Number) ?? [...DEFAULT_SOUND_SEEDS];
if (semi.some((s) => !Number.isInteger(s))) throw new Error('--semi vuole numeri interi separati da virgole');
const out = path.resolve(opt('out') ?? path.join('lab/out/suono', nome));
const tetto = Number(opt('tetto') ?? DEFAULT_CEILING);

const m = compileMjx(fs.readFileSync(file, 'utf8'));
const report = { ...analyzeSound(m, { seeds: semi }), name: nome };
const testo = soundReportText(report);

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'rapporto.md'), testo);
for (const seme of semi) {
  const grid = run(m.program, seme, SOUND_MAX_STEPS, SOUND_LIMITS).grid;
  const suono = renderScore(scoreOf(grid, m.sound!), seme);
  fs.writeFileSync(path.join(out, `seme-${seme}.wav`), wavOf(suono.samples, suono.sampleRate));
  // The trace says how long the run took: out of the file, so that the same program gives the same bytes.
  const traccia = renderTrace(traceProgram(m, seme, { limits: SOUND_LIMITS, maxSteps: SOUND_MAX_STEPS }), m, { tetto, limits: SOUND_LIMITS, maxSteps: SOUND_MAX_STEPS }).replace(/ in \d+ ms\./, '.');
  fs.writeFileSync(path.join(out, `traccia-${seme}.txt`), `${traccia}\n`);
}
console.log(testo);
console.log(`In ${path.relative(process.cwd(), out)}: rapporto.md, seme-<n>.wav, traccia-<n>.txt.`);
if (report.issues.length) process.exitCode = 1;
