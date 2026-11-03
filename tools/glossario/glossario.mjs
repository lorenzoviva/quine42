// The glossary (T178, ADR-0117): reads docs/glossario.md and counts its synonyms in the repository.
// Run it to write docs/glossario-censimento.md again: `node tools/glossario/glossario.mjs`.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GLOSSARY = path.join(ROOT, 'docs/glossario.md');
const CENSUS = path.join(ROOT, 'docs/glossario-censimento.md');

/** Where the census looks, column by column. */
export const AREAS = {
  codice: ['src', 'server'],
  prompt: ['universe/prompts'],
  documenti: ['AGENTS.md', 'docs/architettura-dettagli.md', 'docs/adr'],
  sito: ['site'],
};

/** Every entry's fields: the required ones and the one that may be missing. */
export const REQUIRED_FIELDS = ['Inglese', 'Definizione', 'Dove vive', 'Da non usare'];
export const OPTIONAL_FIELDS = ['Fermo'];

/** The `backticked` names of a field's text. */
export const namesIn = (text) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/** The synonyms of an entry: the names outside the parentheses of its «Da non usare», which are remarks. */
export const synonymsOf = (text) => namesIn(text.replace(/\([^)]*\)/g, ''));

/** Entries are the level-3 headings of the file, each with its `- **Field**: text` lines. */
export function parseGlossary(text) {
  const entries = [];
  let entry;
  for (const line of text.split('\n')) {
    const heading = /^### (.+)$/.exec(line);
    if (heading) {
      entry = { name: heading[1].trim(), fields: {}, unknown: [] };
      entries.push(entry);
    } else if (/^##? /.test(line)) {
      entry = undefined;
    } else if (entry) {
      const field = /^- \*\*([^*]+)\*\*: (.+)$/.exec(line);
      if (field) entry.fields[field[1]] = field[2].trim();
      else if (line.trim()) entry.unknown.push(line);
    }
  }
  return entries;
}

/** Words of a text, split at capitals and underscores: `playerPos` counts as `player` and as `pos`. */
function wordsOf(text) {
  const out = [];
  for (const [token] of text.matchAll(/[\p{L}\p{N}_]+/gu)) {
    for (const part of token.split('_')) {
      for (const [word] of part.matchAll(/\p{Lu}+(?!\p{Ll})|\p{Lu}?[\p{Ll}\p{N}]+/gu)) out.push(word.toLowerCase());
    }
  }
  return out;
}

/** How many times `name` (a word, or several, or an identifier) is in the words given, with its English plural. */
function countsOf(name, tally) {
  const words = wordsOf(name);
  if (words.length !== 1) return undefined;
  const hit = (tally.get(words[0]) ?? { occ: 0, files: new Set() });
  const plural = tally.get(`${words[0]}s`) ?? { occ: 0, files: new Set() };
  return { occ: hit.occ + plural.occ, files: new Set([...hit.files, ...plural.files]).size };
}

function tallyOf(paths) {
  const tally = new Map();
  const files = execFileSync('git', ['ls-files', '--', ...paths], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n').filter(Boolean);
  for (const file of files) {
    if (!/\.(ts|mjs|md|html|css|lua)$/.test(file)) continue;
    for (const word of wordsOf(readFileSync(path.join(ROOT, file), 'utf8'))) {
      const seen = tally.get(word) ?? { occ: 0, files: new Set() };
      seen.occ++;
      seen.files.add(file);
      tally.set(word, seen);
    }
  }
  return tally;
}

/** The census's table in Markdown: a row for every synonym of every entry. */
export function censusOf(entries) {
  const tallies = Object.entries(AREAS).map(([area, paths]) => [area, tallyOf(paths)]);
  const rows = [];
  for (const entry of entries) {
    for (const synonym of synonymsOf(entry.fields['Da non usare'] ?? '')) {
      const cells = tallies.map(([, tally]) => {
        const c = countsOf(synonym, tally);
        return c ? `${c.occ} (${c.files})` : '—';
      });
      if (cells.every((c) => c === '—')) continue;
      rows.push(`| ${entry.name} | \`${synonym}\` | ${cells.join(' | ')} |`);
    }
  }
  return [
    '# Il censimento dei sinonimi',
    '',
    'Generato da `node tools/glossario/glossario.mjs` da [`glossario.md`](glossario.md): non si scrive a mano. Per ogni sinonimo',
    'da non usare, le occorrenze e tra parentesi i file. Conta le **parole**: `playerPos` conta come `player`, il plurale inglese è compreso.',
    'Non distingue i significati: `player` è sinonimo di «Viandante» solo quando indica il personaggio, e il conto comprende il giocatore;',
    'gli ADR restano come sono (sono storia). Per ciò che una rinomina tocca davvero vale la tabella «Le rinomine proposte» del glossario.',
    '',
    `| Voce | Sinonimo | ${tallies.map(([area]) => area).join(' | ')} |`,
    `|---|---|${tallies.map(() => '---').join('|')}|`,
    ...rows,
    '',
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(CENSUS, censusOf(parseGlossary(readFileSync(GLOSSARY, 'utf8'))));
  console.log(`scritto ${path.relative(ROOT, CENSUS)}`);
}
