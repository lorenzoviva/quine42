// Where the ceiling of a model is today, and what the grid in pieces moves (T339, lab/banco/pezzi/README.md): programs run in boxes
// larger and larger, each in a process of its own so that its peak of memory is its own. For each run: the time of the program, its
// steps, whether it finished, the peak of resident memory over the process's baseline, the heap it leaves, and the meshes the worker
// would make (`meshVoxels`: their time, their vertices, their bytes), which in the browser cost more than the program (T331).
//
//   npx vite-node lab/scripts/misura-tetto.ts -- [--solo id,id] [--lati 120,240,360,480] [--z 96] [--semi 1] [--json f] [--senza-mesh]
//   npx vite-node lab/scripts/misura-tetto.ts -- --uno <file.xml> <x> <y> <z> <seme> [--senza-pezzi] [--senza-mesh]   (one run, one line of JSON)
//
// `--senza-pezzi` runs a program's `<pieces>` as a plain `<sequence>` on the whole grid: the same rules, the grid not cut.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { run, type GridLimits } from '../../src/mj/engine';
import { meshVoxels } from '../../src/mj/mesh';
import { compileMjx, mjxIncludes } from '../../src/mj/model';
import { FORM_LIMITS, FORM_PIECES } from '../../src/mj/run';
import { senzaPezzi } from '../banco/pezzi/bordi';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);

/** The programs measured: the seed's procedural structures, the bench's references, the bench of the pieces (with and without them). */
export const PROGRAMMI: Array<{ id: string; file: string; pezzi?: boolean }> = [
  { id: 'forte-di-frontiera', file: 'universe/models/struttura-forte-di-frontiera.xml' },
  { id: 'locanda', file: 'universe/models/struttura-locanda.xml' },
  { id: 'tempio-della-luna', file: 'universe/models/struttura-tempio-della-luna.xml' },
  { id: 'riferimento-forte', file: 'lab/banco/riferimento/forte.xml' },
  { id: 'riferimento-palazzina', file: 'lab/banco/riferimento/palazzina.xml' },
  { id: 'fattoria-pezzi', file: 'lab/banco/pezzi/fattoria.xml', pezzi: true },
  { id: 'fattoria-intera', file: 'lab/banco/pezzi/fattoria.xml', pezzi: false },
  { id: 'forte-pezzi', file: 'lab/banco/pezzi/forte.xml', pezzi: true },
  { id: 'forte-intero', file: 'lab/banco/pezzi/forte.xml', pezzi: false },
];

export interface Misura {
  id: string;
  box: [number, number, number];
  seme: number;
  celle: number;
  ms: number;
  passi: number;
  finito: boolean;
  /** Peak resident memory over the baseline of the process when the program has run (before the meshes), MB. */
  picco: number;
  /** The same after the meshes, MB. */
  piccoMesh?: number;
  /** What the run leaves on the heap and in array buffers, MB. */
  resta: number;
  pezzi?: number;
  pezzoLento?: number;
  mesh?: { ms: number; vertici: number; mb: number };
  errore?: string;
}

/** The files of models/ a program reads, from the folder it is in (the bench's programs read none today). */
function files(file: string, xml: string): Record<string, string> {
  const dir = path.dirname(file);
  return mjxIncludes(xml, (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : undefined));
}

function uno(file: string, box: [number, number, number], seme: number, pezzi: boolean, mesh: boolean): Misura {
  const id = path.basename(file, '.xml');
  const base = { id, box, seme, celle: box[0] * box[1] * box[2] };
  const raw = fs.readFileSync(file, 'utf8');
  const xml = pezzi ? raw : senzaPezzi(raw);
  // As large as the run asks: the measure is where it breaks, not where the game refuses (the game's ceilings are in the table apart).
  const limits: GridLimits = { side: 4096, cells: 256_000_000, pieces: { ...FORM_PIECES, side: 4096, cells: 256_000_000, totalMs: 600_000 } };
  global.gc?.();
  const rss0 = process.memoryUsage().rss;
  const heap0 = process.memoryUsage();
  try {
    const inc = files(file, xml);
    const m = compileMjx(xml, { size: box, ...(Object.keys(inc).length ? { files: inc } : {}) });
    const t0 = performance.now();
    const r = run(m.program, seme, 50_000_000, limits, { deadline: 600_000 });
    const ms = Math.round(performance.now() - t0);
    const heap1 = process.memoryUsage();
    const out: Misura = {
      ...base,
      ms,
      passi: r.steps,
      finito: r.finished,
      picco: Math.round((process.resourceUsage().maxRSS * 1024 - rss0) / 1e6),
      resta: Math.round((heap1.heapUsed + heap1.arrayBuffers - heap0.heapUsed - heap0.arrayBuffers) / 1e6),
      ...(r.pieces ? { pezzi: r.pieces.length, pezzoLento: Math.max(...r.pieces.map((p) => p.ms)) } : {}),
    };
    if (mesh) {
      const t1 = performance.now();
      const md = meshVoxels(r.grid, m.program.palette, { vpt: 10 });
      const bytes = md.positions.byteLength + md.normals.byteLength + md.colors.byteLength + md.indices.byteLength + (md.part?.byteLength ?? 0) + (md.alpha?.byteLength ?? 0) + (md.glow?.byteLength ?? 0);
      out.mesh = { ms: Math.round(performance.now() - t1), vertici: md.positions.length / 3, mb: Math.round(bytes / 1e5) / 10 };
      out.piccoMesh = Math.round((process.resourceUsage().maxRSS * 1024 - rss0) / 1e6);
    }
    return out;
  } catch (e) {
    return { ...base, ms: 0, passi: 0, finito: false, picco: Math.round((process.resourceUsage().maxRSS * 1024 - rss0) / 1e6), resta: 0, errore: (e as Error).message.slice(0, 200) };
  }
}

if (args[0] === '--uno') {
  const [, file, x, y, z, seme] = args;
  console.log(JSON.stringify(uno(file, [Number(x), Number(y), Number(z)], Number(seme), !args.includes('--senza-pezzi'), !args.includes('--senza-mesh'))));
} else {
  const solo = opt('solo')?.split(',');
  const lati = (opt('lati') ?? '120,240,360,480').split(',').map(Number);
  const Z = Number(opt('z') ?? 96);
  const semi = Number(opt('semi') ?? 1);
  const righe: Misura[] = [];
  for (const p of PROGRAMMI) {
    if (solo && !solo.includes(p.id)) continue;
    if (!fs.existsSync(p.file)) continue;
    for (const lato of lati)
      for (let seme = 1; seme <= semi; seme++) {
        const child = spawnSync(process.execPath, ['--expose-gc', path.resolve('node_modules/vite-node/dist/cli.mjs'), __filename, '--', '--uno', p.file, String(lato), String(lato), String(Z), String(seme), ...(p.pezzi === false ? ['--senza-pezzi'] : []), ...(args.includes('--senza-mesh') ? ['--senza-mesh'] : [])], { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 1_200_000 });
        const line = child.stdout.trim().split('\n').reverse().find((l) => l.startsWith('{'));
        const m: Misura = line ? { ...JSON.parse(line), id: p.id } : { id: p.id, box: [lato, lato, Z], seme, celle: lato * lato * Z, ms: 0, passi: 0, finito: false, picco: 0, resta: 0, errore: (child.stderr || 'nessuna risposta').trim().split('\n').slice(-3).join(' ').slice(0, 200) };
        righe.push(m);
        const gioco = lato > FORM_LIMITS.side || lato * lato * Z > FORM_LIMITS.cells ? ' (oltre FORM_LIMITS)' : '';
        console.log(`${p.id.padEnd(22)} ${`${lato}×${lato}×${Z}`.padEnd(13)} ${(m.celle / 1e6).toFixed(1).padStart(5)} M celle ${String(m.ms).padStart(7)} ms ${m.finito ? 'finito ' : 'NO     '} picco ${String(m.picco).padStart(5)} MB${m.piccoMesh !== undefined ? ` (con la mesh ${m.piccoMesh})` : ''}${m.pezzi ? ` · ${m.pezzi} pezzi, il più lento ${m.pezzoLento} ms` : ''}${m.mesh ? ` · mesh ${m.mesh.ms} ms, ${(m.mesh.vertici / 1e6).toFixed(2)} M vertici, ${m.mesh.mb} MB` : ''}${m.errore ? ` · ${m.errore}` : ''}${gioco}`);
      }
  }
  const out = opt('json');
  if (out) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(righe, null, 1));
  }
}
