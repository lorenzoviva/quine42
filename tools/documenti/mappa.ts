// The map of the documents (T524, ADR-0266): `npx vite-node tools/documenti/mappa.ts`. Each document with its level, who reads it,
// its size and the tokens it costs to read whole, then what is wrong with level 1. Reads only; writes nothing.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { docMap, overviewProblems, unlevelled, type DocLevel } from './livelli';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LABEL: Record<DocLevel, string> = { overview: '1', core: '2', detail: '3', register: 'registro' };

const kb = (bytes: number) => `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;

console.log('| Livello | Documento | File | Dimensione | Token stimati | Chi lo legge |');
console.log('|---|---|---:|---:|---:|---|');
for (const row of docMap(ROOT)) {
  console.log(`| ${LABEL[row.level]} | \`${row.path}\` | ${row.files} | ${kb(row.bytes)} | ${row.tokens.toLocaleString('it-IT')} | ${row.readers} |`);
}

const problems = [...overviewProblems(ROOT), ...unlevelled(ROOT).map((p) => `${p} non ha un livello in DOC_LEVELS`)];
console.log('');
console.log(problems.length ? problems.map((p) => `- ${p}`).join('\n') : 'Il livello 1 tiene: lunghezza, link, regole, sezioni.');
