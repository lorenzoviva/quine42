// How big the prompts are (characters and an estimate of tokens), without calling any model:
// what each call of the lab's agents pays in input before the request itself.
// npx vite-node lab/scripts/prompt-sizes.ts

import { architectSystem, blocksSystem, DEFAULT_STRUCT } from '../mj3d/architect';
import { DEFAULT_SCULPT, describe, sculptorSystem } from '../mj3d/sculptor';
import { EXAMPLES } from '../mj3d/examples';
import { ROCCA } from '../programs/rocca';
import ARTIST from '../prompts/artista.md?raw';

// JSON and Italian average about 3.3 characters a token in Gemini's tokenizer.
const tok = (s: string) => Math.round(s.length / 3.3);
const row = (name: string, s: string) => console.log(`${name.padEnd(46)} ${String(s.length).padStart(7)} caratteri  ~${String(tok(s)).padStart(6)} token`);

const sculptor = sculptorSystem(DEFAULT_SCULPT);
row('Scultore: istruzioni (tutti gli esempi)', sculptor);
row('Scultore: istruzioni per un albero (2 esempi)', sculptorSystem(DEFAULT_SCULPT, 'albero'));
row('Scultore: istruzioni per una persona (1 esempio)', sculptorSystem(DEFAULT_SCULPT, 'persona'));
row('Scultore: istruzioni (senza esempi)', sculptorSystem({ ...DEFAULT_SCULPT, examples: false }));
for (const e of EXAMPLES) row(`  di cui esempio ${e.id}`, JSON.stringify(e.program));
row('Scultore: richiesta (un albero)', describe({ id: 'x', name: 'Pino', category: 'semplice', kind: 'albero', description: 'Un pino alto' }));
row('Scultore: un programma rimandato indietro', JSON.stringify(EXAMPLES[2].program));
row('Artista: istruzioni', ARTIST);
row('Scultore dei blocchi: istruzioni (catalogo)', blocksSystem('catalogo', DEFAULT_STRUCT));
row('Scultore dei blocchi: istruzioni (programmi)', blocksSystem('programmi', DEFAULT_STRUCT));
row('Architetto: istruzioni (blocchi della rocca)', architectSystem(ROCCA, DEFAULT_STRUCT));
console.log('Immagini: Gemini conta circa 258 token per riquadro di 768×768; il foglio delle quattro viste (~1000×300) ne vale 2-4.');
