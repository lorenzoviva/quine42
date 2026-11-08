// The programs of the repository in the symbols of the contract 0.6 (T342, ADR-0175): every digit alone `#` and the digit, with the
// same functions as the migration 0.5 → 0.6 (src/kernel/migrations.ts), so what it writes is what a universe of before becomes.
//
//   npx vite-node lab/scripts/mj-simboli.ts                      # dice cosa cambierebbe in universe/models e in lab/
//   npx vite-node lab/scripts/mj-simboli.ts -- --scrivi          # e lo scrive
//   npx vite-node lab/scripts/mj-simboli.ts -- --scrivi <cartella…>  # solo quelle (una cartella di models/ di un universo, per esempio)
//
// Every `.xml` is a program (or a tileset); a `.txt` is a pattern only beside programs (`models/`, `lab/mjx/`): the records of the bench
// (requests, answers, traces) stay as they were written. The index of a folder of models (`index.json`) has the tints.

import fs from 'node:fs';
import path from 'node:path';
import { patternFileFor0_6, programFor0_6 } from '../../src/kernel/migrations';
import { hashDigits } from '../../src/mj/symbols';

const ROOT = path.resolve(__dirname, '../..');
const args = process.argv.slice(2).filter((a) => a !== '--');
const write = args.includes('--scrivi');
const folders = args.filter((a) => !a.startsWith('--'));
const roots = folders.length ? folders.map((f) => path.resolve(f)) : [path.join(ROOT, 'universe/models'), path.join(ROOT, 'lab')];

/** Whether a text file is a pattern a program reads: beside programs, not a record of the bench. */
const patternFile = (file: string) => /[\\/](models|mjx)[\\/]/.test(file);

/** The files under a folder; a universe inside it (a folder with its `universe.json`, lab/banco/universi-cloud/) is its contract's: the migrations port it when it is loaded. */
function* walk(dir: string, root = true): Generator<string> {
  if (!root && fs.existsSync(path.join(dir, 'universe.json'))) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p, false);
    else yield p;
  }
}

/** The tints of an index of models, in the symbols of 0.6; the same text if none changes. */
function indexFor0_6(text: string): string {
  let index: Record<string, { tint?: unknown }>;
  try {
    index = JSON.parse(text);
  } catch {
    return text;
  }
  let changed = false;
  for (const info of Object.values(index ?? {}))
    if (info && typeof info.tint === 'string' && hashDigits(info.tint) !== info.tint) {
      info.tint = hashDigits(info.tint);
      changed = true;
    }
  return changed ? JSON.stringify(index, null, /^[[{]\r?\n( +)/.exec(text)?.[1].length ?? 2) + (text.endsWith('\n') ? '\n' : '') : text;
}

let changed = 0;
let seen = 0;
for (const root of roots)
  for (const file of walk(root)) {
    const ext = path.extname(file);
    const port = ext === '.xml' ? programFor0_6 : ext === '.txt' && patternFile(file) ? patternFileFor0_6 : path.basename(file) === 'index.json' && patternFile(file) ? indexFor0_6 : undefined;
    if (!port) continue;
    seen++;
    const before = fs.readFileSync(file, 'utf8');
    const after = port(before);
    if (after === before) continue;
    changed++;
    console.log(`${write ? 'scritto' : 'cambia'} ${path.relative(ROOT, file)}`);
    if (write) fs.writeFileSync(file, after);
  }
console.log(`${changed} file da cambiare su ${seen}${write ? ', scritti' : ' (--scrivi per scriverli)'}`);
