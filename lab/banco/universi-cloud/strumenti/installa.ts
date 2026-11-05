// The installation of the four universes (T273), for lab/scripts/installa-universi-cloud.ts and its test: see there.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { MockAiModels } from '../../../../src/kernel/ai/mock';
import { readBible } from '../../../../src/kernel/agents/council';
import { Kernel } from '../../../../src/kernel/kernel';
import { memoryStore } from '../../../../src/kernel/repo';
import { allowedPath } from '../../../../src/kernel/paths';
import { SEED_FILE, seedHashes, upgradeFromSeed } from '../../../../src/kernel/universes';
import type { FileMap } from '../../../../src/kernel/types';
import { runGit } from '../../../../server/git';
import { sealLedger } from '../../../../server/ledger';
import { leggiUniverso, negozioMappe } from './carica';
import { collocate, leggi, PROGETTO, UNIVERSI, type Universo } from './cloud';

const GENESI: [string, string] = ['Genesi', 'genesi@rune.local'];

export interface Installato {
  nome: string;
  cartella: string;
  head: string;
  file: number;
  luoghi: number;
  strutture: number;
  /** What `upgradeFromSeed` brought from the seed (written now, so that the browser's first load has nothing to do). */
  dalSeme: string[];
  /** Where the universe that was there went. */
  cestino?: string;
}

/** The seed as the browser has it (`bundledFiles`: every file of universe/, LF). */
const seme = (): FileMap => leggiUniverso(path.join(PROGETTO, 'universe') + '/').files;

/** A universe's files with its maps, as they go on disk. */
export function componi(u: Universo, seed = seme()): { files: FileMap; maps: Record<string, string>; dalSeme: string[] } {
  // In models/ a universe has its programs and their index: sidera keeps beside them two reports of its bench (`index.sidera.json`,
  // `rapporto-modelli.md`, its README says to leave them out), which no kernel reads.
  const files = Object.fromEntries(Object.entries(leggi(u).files).filter(([p]) => !p.startsWith('models/') || p === 'models/index.json' || p.endsWith('.xml')));
  const dir = path.join(PROGETTO, u.mappe);
  const maps: Record<string, string> = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) maps[`maps/${f}`] = readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
  const born = { ...files, [SEED_FILE]: JSON.stringify(seedHashes(seed), null, 1) + '\n' };
  const up = upgradeFromSeed(born, seed);
  return { files: up.files, maps, dalSeme: up.updated.filter((p) => p !== SEED_FILE) };
}

/** What would be wrong with it in the game: a fault of the kernel at boot, a structure the library does not have. */
export async function controlla(files: FileMap, maps: Record<string, string>): Promise<{ problemi: string[]; strutture: number }> {
  const records = Object.fromEntries(Object.entries(maps).map(([p, text]) => [p.slice(5, -5), JSON.parse(text)]));
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), chunks: negozioMappe(files, records) });
  const problemi = k.faults.list().map((f) => `fault ${f.key}: ${f.message}`);
  const c = await collocate(files, records);
  return { problemi: [...problemi, ...c.problemi], strutture: c.strutture.length };
}

export async function installa(opts: { dir: string; nomi?: string[]; log?: (s: string) => void }): Promise<Installato[]> {
  const log = opts.log ?? (() => undefined);
  const seed = seme();
  const out: Installato[] = [];
  mkdirSync(opts.dir, { recursive: true });
  for (const u of UNIVERSI) {
    if (opts.nomi?.length && !opts.nomi.includes(u.nome)) continue;
    const { files, maps, dalSeme } = componi(u, seed);
    const all = { ...files, ...maps };
    const refused = Object.keys(all).filter((p) => !allowedPath(p));
    if (refused.length) throw new Error(`${u.nome}: percorsi non ammessi: ${refused.join(', ')}`);
    const { problemi, strutture } = await controlla(files, maps);
    if (problemi.length) throw new Error(`${u.nome}: non si installa:\n  ${problemi.join('\n  ')}`);
    const root = path.join(opts.dir, u.nome);
    let cestino: string | undefined;
    if (existsSync(root)) {
      cestino = path.join(opts.dir, '.cestino', `${u.nome}-${Date.now()}`);
      mkdirSync(path.dirname(cestino), { recursive: true });
      renameSync(root, cestino);
      log(`  ${u.nome}: quello che c'era è in ${path.relative(opts.dir, cestino)}`);
    }
    mkdirSync(root, { recursive: true });
    await runGit(root, ['init', '-q'], { author: GENESI });
    for (const [rel, text] of Object.entries(all)) {
      const abs = path.join(root, ...rel.split('/'));
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, text, 'utf8');
    }
    writeFileSync(path.join(root, '.gitattributes'), '* text=auto eol=lf\n', 'utf8');
    sealLedger(opts.dir, u.nome);
    await runGit(root, ['add', '-A'], { author: GENESI });
    const titolo = readBible(files)?.titolo ?? u.nome;
    await runGit(root, ['commit', '-q', '-m', `genesi: ${titolo} (dai cantieri di Claude Cloud, T273)`], { author: GENESI });
    const head = (await runGit(root, ['rev-parse', '--short=7', 'HEAD'], { author: GENESI })).trim();
    const r: Installato = { nome: u.nome, cartella: root, head, file: Object.keys(all).length, luoghi: Object.keys(maps).length, strutture, dalSeme, ...(cestino ? { cestino } : {}) };
    log(`  ${u.nome}: ${r.file} file, ${r.luoghi} luoghi, ${r.strutture} strutture sui lotti, commit ${head}${dalSeme.length ? `; dal seme: ${dalSeme.join(', ')}` : ''}`);
    out.push(r);
  }
  return out;
}
