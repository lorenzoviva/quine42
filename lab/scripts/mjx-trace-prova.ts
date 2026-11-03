// The blind test of the trace's forms (T179): the same questions, with the answer computed from the run, to a model that has the program and one form of the trace.
// It also gives the tokens the model really counted for each form, against `estimateTokens`. Costs subscription credit: about 12 short calls.
//
//   npx vite-node lab/scripts/mjx-trace-prova.ts -- [--modello sonnet] [--tetto 4000] [--out lab/banco/traccia-prova]

import fs from 'node:fs';
import path from 'node:path';
import { at } from '../../src/mj/engine';
import { compileMjx, type MjxModel } from '../../src/mj/model';
import { DEFAULT_CEILING, estimateTokens, renderTrace, TRACE_FORMS, traceProgram, type ProgramTrace } from '../../src/mj/trace';
import { bersaglio } from '../banco/bersagli';
import { chiedi } from '../banco/claude';
import { esegui } from '../banco/misure';
import { OFFICIAL } from '../mjx/official';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const modello = opt('modello') ?? 'sonnet';
const tetto = Number(opt('tetto') ?? DEFAULT_CEILING);
const out = path.resolve(opt('out') ?? 'lab/banco/traccia-prova');
const SEME = 1;

interface Domanda {
  testo: string;
  risposta: string;
}

const lettera = (t: ProgramTrace, x: number, y: number, z: number) => at(t.result.grid, x, y, z);
const quante = (t: ProgramTrace, ch: string) => t.result.grid.cells.reduce((s, c) => s + (t.result.grid.alphabet[c] === ch ? 1 : 0), 0);

function dungeon(t: ProgramTrace): Domanda[] {
  const n5 = t.nodes.find((n) => n.id === 5)!;
  const best = n5.fired.indexOf(Math.max(...n5.fired));
  return [
    { testo: 'Quale regola del nodo #5 è stata applicata più volte, e quante volte?', risposta: `r${best + 1}, ${n5.fired[best]}` },
    { testo: 'Quante volte ha agito il nodo #7 prima di fermarsi?', risposta: String(t.nodes.find((n) => n.id === 7)!.runs) },
    { testo: 'Il nodo #5 ha cambiato più celle nella prima o nella seconda metà dei suoi passi?', risposta: 'prima' },
    { testo: 'Alla fine, che lettera c’è nella cella x=2 y=1 z=1?', risposta: lettera(t, 2, 1, 1) },
    { testo: 'Alla fine, che lettera c’è nella cella x=16 y=16 z=8?', risposta: lettera(t, 16, 16, 8) },
    { testo: 'Quante celle W ci sono alla fine?', risposta: String(quante(t, 'W')) },
  ];
}

function moderna(t: ProgramTrace): Domanda[] {
  const leaves = t.nodes.filter((n) => n.runs);
  const big = leaves.reduce((a, b) => (b.cells > a.cells ? b : a));
  const roof = leaves.find((n) => n.changes.has('L→R'));
  return [
    { testo: 'Quale nodo ha cambiato più celle, e quante?', risposta: `#${big.id}, ${big.cells}` },
    { testo: 'Quale nodo ha sostituito L con R?', risposta: `#${roof?.id}` },
    { testo: 'Quanti nodi non hanno cambiato nessuna cella?', risposta: String(t.nodes.filter((n) => !n.runs && n.node.type !== 'sequence' && n.node.type !== 'markov').length) },
    { testo: 'Alla fine, che lettera c’è nella cella x=60 y=50 z=1?', risposta: lettera(t, 60, 50, 1) },
    { testo: 'Alla fine, che lettera c’è nella cella x=5 y=30 z=20?', risposta: lettera(t, 5, 30, 20) },
    { testo: 'Quante celle V ci sono alla fine?', risposta: String(quante(t, 'V')) },
  ];
}

interface Caso {
  id: string;
  xml: string;
  model: MjxModel;
  domande: (t: ProgramTrace) => Domanda[];
}

const fileModerna = 'lab/banco/conferma/moderna/1/modello.xml';
const uff = OFFICIAL.find((o) => o.name === 'StrangeDungeon')!;
const casi: Caso[] = [
  { id: 'StrangeDungeon', xml: uff.xml, model: compileMjx(uff.xml, { size: uff.size }), domande: dungeon },
  { id: 'moderna', xml: fs.readFileSync(fileModerna, 'utf8'), model: esegui(fs.readFileSync(fileModerna, 'utf8'), bersaglio('moderna')!, SEME).model, domande: moderna },
];

const SYSTEM = 'Ricevi un programma MarkovJunior ed eventualmente una traccia della sua esecuzione. Rispondi alle domande guardando ciò che ricevi, senza simulare a mente il programma. Una riga per domanda, numerata, solo la risposta. Se ciò che hai non basta scrivi «non si può».';

fs.mkdirSync(out, { recursive: true });
const righe: string[] = ['| caso | forma | caratteri | token stimati | token reali | risposte |', '|---|---|---|---|---|---|'];
for (const c of casi) {
  const t = traceProgram(c.model, SEME);
  const domande = c.domande(t);
  const elenco = domande.map((d, i) => `${i + 1}. ${d.testo}`).join('\n');
  const atteso = domande.map((d, i) => `${i + 1}. ${d.risposta}`).join('\n');
  fs.writeFileSync(path.join(out, `${c.id}.atteso.txt`), `${atteso}\n`);
  const base = await chiedi(SYSTEM, `Programma:\n${c.xml}\n\nRispondi solo: ok`, { modello });
  for (const forma of ['nessuna', ...TRACE_FORMS] as const) {
    const traccia = forma === 'nessuna' ? '' : renderTrace(t, c.model, { forma, tetto });
    const r = await chiedi(SYSTEM, `Programma:\n${c.xml}\n\n${traccia ? `Traccia:\n${traccia}\n\n` : ''}Domande:\n${elenco}`, { modello });
    fs.writeFileSync(path.join(out, `${c.id}.${forma}.txt`), `${traccia}\n\n--- risposta\n${r.testo}\n`);
    // The questions are in every call but the first: the base is the program alone, so they count in the real tokens of each form.
    const reali = r.token.inputTotale - base.token.inputTotale - estimateTokens(elenco);
    righe.push(`| ${c.id} | ${forma} | ${traccia.length} | ${estimateTokens(traccia)} | ${reali} | ${r.testo.replace(/\n+/g, ' / ')} |`);
    console.log(righe[righe.length - 1]);
  }
  righe.push(`| ${c.id} | **atteso** | | | | ${atteso.replace(/\n+/g, ' / ')} |`);
}
fs.writeFileSync(path.join(out, 'riepilogo.md'), `${righe.join('\n')}\n`);
