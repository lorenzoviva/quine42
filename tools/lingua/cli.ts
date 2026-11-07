// The comments of the seed in English (T309): `npx vite-node tools/lingua/cli.ts -- <command>`.
//   estrai <cartella>      the Italian comments of the seed, one unit per text, in files of about 2.500 words to translate
//   applica <cartella>     every `=== <id>` of the translated files replaces that unit, in the seed and in its copies under lab/
//   confronta <ref>        every .lua and .xml changed since <ref> has the same code (Lua tokens, XML tree): exit 1 if one does not
//   italiano               the comments of the seed that still read as Italian

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { codeDifference, commentUnits, isItalian } from './commenti';

/** The seed's programs and code: the comments T309 translates. */
export const SEED = ['universe/modules', 'universe/models', 'src/kernel/prelude.lua', 'lab/mjx/official'];
/** Where copies of the seed's programs live: a unit with the same text is translated there too. */
const COPIES = ['lab'];

const kindOf = (f: string): 'lua' | 'xml' | undefined => (f.endsWith('.lua') ? 'lua' : f.endsWith('.xml') ? 'xml' : undefined);

function files(root: string, out: string[] = []): string[] {
  if (!fs.existsSync(root)) return out;
  if (fs.statSync(root).isFile()) {
    if (kindOf(root)) out.push(root);
    return out;
  }
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'out') continue;
    files(`${root}/${e.name}`, out);
  }
  return out;
}

const idOf = (text: string) => createHash('sha1').update(text).digest('hex').slice(0, 10);
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
const ENGLISH = /\b(the|of|and|is|are|to|with|for|from|that|this|it|on|in|one|its|by|as|at)\b/gi;
const reads = (t: string) => isItalian(t) || new Set((t.match(ENGLISH) ?? []).map((w) => w.toLowerCase())).size < 2;

function extract(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
  const seen = new Map<string, { text: string; file: string }>();
  for (const f of SEED.flatMap((r) => files(r))) {
    const src = fs.readFileSync(f, 'utf8');
    for (const u of commentUnits(src, kindOf(f)!)) {
      const text = src.slice(u.start, u.end);
      if (/[A-Za-z]{3}/.test(text) && reads(text) && !seen.has(text)) seen.set(text, { text, file: f });
    }
  }
  let part = 1;
  let n = 0;
  let body = '';
  let last = '';
  const flush = () => {
    if (!body) return;
    fs.writeFileSync(path.join(dir, `parte-${String(part++).padStart(2, '0')}.txt`), body);
    body = '';
    n = 0;
  };
  let total = 0;
  for (const { text, file } of seen.values()) {
    if (file !== last) body += `### ${file}\n`;
    last = file;
    body += `=== ${idOf(text)}\n${text}\n`;
    n += words(text);
    total += words(text);
    if (n >= 2500) {
      flush();
      last = '';
    }
  }
  flush();
  console.log(`${seen.size} commenti, ${total} parole, ${part - 1} file in ${dir}`);
}

function translations(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.txt')).sort()) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
    const parts = src.split(/^=== ([0-9a-f]{10})\n/m);
    for (let k = 1; k < parts.length; k += 2) out.set(parts[k], parts[k + 1].replace(/\n(### [^\n]*\n)*$/, '').replace(/\n$/, ''));
  }
  return out;
}

function apply(dir: string) {
  const map = translations(dir);
  let units = 0;
  const changed: string[] = [];
  for (const f of [...SEED, ...COPIES].flatMap((r) => files(r)).filter((f, i, all) => all.indexOf(f) === i)) {
    const kind = kindOf(f)!;
    const src = fs.readFileSync(f, 'utf8');
    let out = '';
    let at = 0;
    for (const u of commentUnits(src, kind)) {
      const text = map.get(idOf(src.slice(u.start, u.end)));
      if (text === undefined) continue;
      if (kind === 'xml' && (!text.startsWith('<!--') || !text.endsWith('-->') || text.slice(4, -3).includes('--')))
        throw new Error(`${f}: un commento XML tradotto non è un commento (${text.slice(0, 60)})`);
      out += src.slice(at, u.start) + text;
      at = u.end;
      units++;
    }
    if (!at) continue;
    out += src.slice(at);
    const why = codeDifference(src, out, kind);
    if (why) throw new Error(`${f}: il codice cambierebbe (${why})`);
    if (out !== src) {
      fs.writeFileSync(f, out);
      changed.push(f);
    }
  }
  console.log(`${units} commenti sostituiti in ${changed.length} file`);
}

function compare(ref: string) {
  const changed = execFileSync('git', ['diff', '--name-only', ref, '--'], { encoding: 'utf8' }).split('\n').filter((f) => kindOf(f) && fs.existsSync(f));
  const bad: string[] = [];
  for (const f of changed) {
    let before = '';
    try {
      before = execFileSync('git', ['show', `${ref}:${f}`], { encoding: 'utf8', maxBuffer: 1 << 28 });
    } catch {
      continue; // a file new since ref has nothing to compare with
    }
    const why = codeDifference(before, fs.readFileSync(f, 'utf8'), kindOf(f)!);
    if (why) bad.push(`${f}: ${why}`);
  }
  console.log(`${changed.length} file .lua/.xml cambiati da ${ref}; codice diverso in ${bad.length}`);
  for (const b of bad) console.log(`  ${b}`);
  if (bad.length) process.exit(1);
}

function italian() {
  let n = 0;
  for (const f of SEED.flatMap((r) => files(r))) {
    const src = fs.readFileSync(f, 'utf8');
    for (const u of commentUnits(src, kindOf(f)!)) {
      const text = src.slice(u.start, u.end);
      if (!isItalian(text)) continue;
      n++;
      console.log(`${f}: ${text.slice(0, 100).replace(/\s+/g, ' ')}`);
    }
  }
  console.log(`${n} commenti italiani`);
}

const [cmd, arg] = process.argv.slice(2).filter((a) => a !== '--');
if (cmd === 'estrai' && arg) extract(arg);
else if (cmd === 'applica' && arg) apply(arg);
else if (cmd === 'confronta' && arg) compare(arg);
else if (cmd === 'italiano') italian();
else {
  console.error('uso: estrai <cartella> | applica <cartella> | confronta <ref> | italiano');
  process.exit(1);
}
