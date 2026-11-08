// The bench in blocks (T337): the Sculptor writes a building in three requests and, after each, gets back in text what the game made of it
// (`lab/banco/blocchi.ts`: views, cuts, measures, trace). The substitute for looking at the result. Costs subscription credit.
//
//   npx vite-node lab/scripts/banco-blocchi.ts -- --bersagli rocca,castello,tempio,palazzina,villetta --giro zone --dir lab/banco/metodo [--prompt lab/banco/metodo/prompt-zone.md] [--modello opus] [--insieme 3]
//
// → <dir>/<giro>/<bersaglio>/<n>/ {prompt.md, richiesta-1.txt, risposta-1.txt, modello-1.xml, ritorno-1.md, …, modello.xml (the last), misure.json, lati.png, …}

import fs from 'node:fs';
import path from 'node:path';
import { extractXml } from '../../src/kernel/agents/sculptor';
import { BERSAGLI, bersaglio, testoBersaglio } from '../banco/bersagli';
import { ritorno, valutaFinale } from '../banco/blocchi';
import { chiedi, LimiteAbbonamento, type Risposta } from '../banco/claude';
import type { Bersaglio } from '../banco/misure';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const giro = opt('giro') ?? 'zone';
const radice = path.resolve(opt('dir') ?? 'lab/out/banco', giro);
const system = fs.readFileSync(path.resolve(opt('prompt') ?? 'lab/banco/metodo/prompt-zone.md'), 'utf8').trim();
const modello = opt('modello');
const insieme = Math.max(1, Number(opt('insieme') ?? 1));
const lista: Bersaglio[] = (opt('bersagli') ?? '')
  .split(',')
  .filter(Boolean)
  .map((id) => bersaglio(id) ?? (() => { throw new Error(`bersaglio sconosciuto: ${id}; ci sono ${BERSAGLI.map((b) => b.id).join(' ')}`); })());
if (!lista.length) throw new Error('--bersagli rocca,tempio,…');

const BLOCCO = [
  'Block 1 of 3: the composition. Write the program with level A only: the root, the map to 1/4 and the composition on the coarse plan (z=0); no heights and no map back yet (the grid stays the coarse one, and the game shows it as it is). Begin with a few comment lines: the parts of this concept, their letters, where each goes relative to the others, what the seeds change. Give every letter a <color> so that the views show it.',
  'Block 2 of 3: the heights and the full scale. First correct the composition if what came back says so (the concept, the variety between the seeds, something outside the box or missing). Then add level B (the columns, storeys of 8 layers, the strips of the stairs and their holes) and level C (the map back to 4 4 4 with a block for every coarse letter, the steps, parapets, windows, roofs, cleaning, colours). Answer with the whole program.',
  "Block 3 of 3: the corrections. What came back is the game's verdict at every seed and at both sizes: correct the program so that every seed holds, keeping the concept and the variety. Answer with the whole program.",
];

function cartella(b: Bersaglio): string {
  const dir = path.join(radice, b.id);
  fs.mkdirSync(dir, { recursive: true });
  let n = 1;
  while (fs.existsSync(path.join(dir, String(n)))) n++;
  fs.mkdirSync(path.join(dir, String(n)));
  return path.join(dir, String(n));
}

interface Chiamata {
  blocco: number;
  input: number;
  output: number;
  dollari?: number;
  ms: number;
}

const righe: string[] = [];
let fermo = false;

async function lavora(b: Bersaglio): Promise<void> {
  const dir = cartella(b);
  fs.writeFileSync(path.join(dir, 'prompt.md'), `${system}\n`);
  const chiamate: Chiamata[] = [];
  let xml = '';
  let testoRitorno = '';
  for (let k = 0; k < BLOCCO.length && !fermo; k++) {
    const msg = [testoBersaglio(b), ...(k ? [`## Your program so far\n\`\`\`xml\n${xml}\n\`\`\``, `## What the game made of it\n${testoRitorno}`] : []), `## ${BLOCCO[k]}`].join('\n\n');
    fs.writeFileSync(path.join(dir, `richiesta-${k + 1}.txt`), `${msg}\n`);
    console.log(`${b.id}: blocco ${k + 1}…`);
    let r: Risposta;
    try {
      r = await chiedi(system, msg, { ...(modello ? { modello } : {}) });
    } catch (e) {
      fs.writeFileSync(path.join(dir, `errore-${k + 1}.txt`), `${(e as Error).message}\n`);
      console.error(`${b.id}: ${(e as Error).message}`);
      if (e instanceof LimiteAbbonamento || /isolamento/.test((e as Error).message)) fermo = true;
      break;
    }
    chiamate.push({ blocco: k + 1, input: r.token.inputTotale, output: r.token.output, ...(r.dollari !== undefined ? { dollari: r.dollari } : {}), ms: r.ms });
    fs.writeFileSync(path.join(dir, `risposta-${k + 1}.txt`), r.testo);
    xml = extractXml(r.testo);
    fs.writeFileSync(path.join(dir, `modello-${k + 1}.xml`), `${xml}\n`);
    const ret = ritorno(xml, b, { semi: [1, 2, 3], finale: k > 0 });
    testoRitorno = ret.testo;
    fs.writeFileSync(path.join(dir, `ritorno-${k + 1}.md`), `${testoRitorno}\n`);
    console.log(`${b.id}: blocco ${k + 1} · input ${r.token.inputTotale} · output ${r.token.output} · ${ret.gira ? 'gira' : 'non gira'}${ret.prova ? ` · ${ret.prova.passa ? 'PASSA' : 'non passa'}` : ''}`);
    // A program that already holds and varies after the second block needs no third request.
    if (k === 1 && ret.prova?.passa) break;
  }
  if (!xml) return;
  fs.writeFileSync(path.join(dir, 'modello.xml'), `${xml}\n`);
  const tot = chiamate.reduce((s, c) => ({ input: s.input + c.input, output: s.output + c.output, dollari: s.dollari + (c.dollari ?? 0), ms: s.ms + c.ms }), { input: 0, output: 0, dollari: 0, ms: 0 });
  const v = valutaFinale(xml, b, dir, { chiamate, totale: tot });
  const riga = `- ${b.id} (${path.relative(radice, dir)}): ${v.passa ? 'passa' : v.difetti.join('; ')} · ${chiamate.length} richieste, input ${tot.input}, output ${tot.output}, ${tot.dollari.toFixed(2)} $`;
  righe.push(riga);
  console.log(riga);
}

let prossimo = 0;
await Promise.all(
  Array.from({ length: insieme }, async () => {
    while (!fermo && prossimo < lista.length) await lavora(lista[prossimo++]!);
  }),
);
fs.mkdirSync(radice, { recursive: true });
fs.appendFileSync(path.join(radice, 'riepilogo.md'), `\n## ${new Date().toISOString()} — ${righe.filter((r) => r.includes(': passa')).length}/${righe.length} passano\n${righe.join('\n')}\n`);
