// The golden ratio in the Sculptor's prompt (T242): the same requests with the prompt of the seed without its line on proportions and with
// it, a few attempts, the game's checks, the measures and the variance over seeds, and the four sides for the eye. No API: the program comes
// from a subscription (`agy`, Gemini as in the game, or `claude -p`), with the isolation of the bench (T154, T156).
//
//   npx vite-node lab/scripts/banco-aureo.ts -- [--provider agy|claude] [--modello gemini-3.8-flash-high] [--tentativi 1] [--solo albero,conchiglia] [--out lab/banco/aureo]
//   npx vite-node lab/scripts/banco-aureo.ts -- --rimisura [--out lab/banco/aureo]   (only the measures of the programs already written)
//
// → <out>/<request>/<variant>/<n>/{prompt.md, richiesta.txt, risposta*.txt, modello.xml, lati.png, misure.json} and <out>/riepilogo.md.
// Only the simple classes and the small buildings: a procedural structure is written in blocks with the views coming back, and its bench
// round is T355's.

import fs from 'node:fs';
import path from 'node:path';
import { bundledFiles } from '../../src/kernel/bundle';
import { checkProgram, describe, examplesFor, extractXml, filesOf, libraryResources, sculptorRole, sculptorSection, specialtyOf, views, type Checked, type SculptRequest } from '../../src/kernel/agents/sculptor';
import { analyse } from '../../src/mj/check';
import { boxOf, classOf } from '../../src/mj/classes';
import { compileMjx } from '../../src/mj/model';
import { runMjx } from '../../src/mj/run';
import { chiediAgy } from '../banco/agy';
import { chiedi, type Risposta } from '../banco/claude';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const out = path.resolve(opt('out') ?? 'lab/banco/aureo');
const provider = opt('provider') ?? 'agy';
const modello = opt('modello');
const tentativi = Number(opt('tentativi') ?? 1);
const rimisura = args.includes('--rimisura');
const SEMI = 4;

const RICHIESTE: Array<SculptRequest & { chiave: string }> = [
  { chiave: 'albero', id: 'tree-quercia', nome: 'Quercia', aspetto: 'una quercia frondosa con il tronco robusto, rami che si aprono e la chioma larga e tondeggiante', classe: 'tree' },
  { chiave: 'girasole', id: 'bush-girasole', nome: 'Girasoli', aspetto: 'un ciuffo di girasoli alti, foglie larghe attorno agli steli e i capolini gialli col cuore scuro', classe: 'bush' },
  { chiave: 'conchiglia', id: 'shape-conchiglia', nome: 'Conchiglia', aspetto: 'una grande conchiglia a spirale, color crema e rosa, come quelle che si trovano sulla riva', classe: 'object' },
  { chiave: 'tempietto', id: 'building-tempietto', nome: 'Tempietto', aspetto: 'un piccolo tempio rotondo di pietra chiara, colonne attorno e una cupola, tre gradini davanti', classe: 'building' },
];

/** The line this task adds to the part of the prompt for every class but the procedural structures: the variant `base` goes without. */
const RIGA = /^- Proportions: where nothing else fixes a measure, lean on the golden ratio[\s\S]*?come first\.\n/m;

/** The Sculptor's system without the principles of the Council: the role of the trade, its section (T468), the examples. */
function sistema(files: Record<string, string>, req: SculptRequest): string {
  const trade = specialtyOf(classOf(req.classe)!, req);
  const examples = examplesFor(files, req);
  return [sculptorRole(files, trade), sculptorSection(files, trade), examples.length ? `## Examples (programs of the library)\n${examples.join('\n\n')}` : ''].filter(Boolean).join('\n\n');
}

function messaggio(req: SculptRequest): string {
  const cls = classOf(req.classe)!;
  let prompt = describe(req, cls);
  const resources = libraryResources(bundledFiles);
  if (resources.length) prompt += `\n\nFiles of models/ the program may read (wfc tileset or sample, convchain sample, rules with file/fin/fout):\n${resources.join('\n')}`;
  return prompt;
}

interface Misura {
  passa: boolean;
  richieste: number;
  errore?: string;
  voxel?: number;
  materiali?: number;
  dominante?: number;
  corpo?: number;
  /** Height over the larger side of the footprint. */
  snellezza?: number;
  /** Mean distance of Jaccard between the solid cells of every pair of seeds: 0 the same model, 1 nothing in common. */
  varianza?: number;
  token?: { input: number; output: number };
  dollari?: number;
}

function misura(c: Checked, cls: NonNullable<ReturnType<typeof classOf>>): Omit<Misura, 'passa' | 'richieste'> {
  if (!c.result || !c.model) return { errore: c.error };
  const a = analyse(c.result, c.model.program.palette, { grounded: true });
  const tot = Object.values(a.colors).reduce((s, n) => s + n, 0) || 1;
  const quote = Object.values(a.colors).map((n) => n / tot).filter((q) => q >= 0.002);
  const b = a.bbox;
  const lato = b ? Math.max(b.max[0] - b.min[0] + 1, b.max[1] - b.min[1] + 1) : 0;
  const alto = b ? b.max[2] - b.min[2] + 1 : 0;
  // The variance: the same program at SEMI seeds in its box, as the world shows its instances.
  const model = compileMjx(c.xml, { size: boxOf(cls), files: filesOf(c.xml, bundledFiles) });
  const pieni: Array<Set<number>> = [];
  for (let s = 1; s <= SEMI; s++) {
    const r = runMjx(model, s, { deadline: 8_000 });
    const set = new Set<number>();
    r.grid.cells.forEach((v, i) => v && set.add(i));
    pieni.push(set);
  }
  let d = 0, n = 0;
  for (let i = 0; i < pieni.length; i++)
    for (let j = i + 1; j < pieni.length; j++) {
      let inter = 0;
      for (const v of pieni[i]) if (pieni[j].has(v)) inter++;
      const uni = pieni[i].size + pieni[j].size - inter;
      d += uni ? 1 - inter / uni : 0;
      n++;
    }
  return {
    ...(c.error ? { errore: c.error } : {}),
    voxel: a.voxels,
    materiali: quote.length,
    dominante: Math.max(...quote),
    corpo: a.mainPart,
    snellezza: lato ? alto / lato : 0,
    varianza: n ? d / n : 0,
  };
}

const salva = (file: string, testo: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, testo);
};

const solo = opt('solo')?.split(',');
const righe: Array<{ chiave: string; variante: string; n: number; m: Misura }> = [];
for (const req of RICHIESTE.filter((r) => !solo || solo.includes(r.chiave))) {
  const cls = classOf(req.classe)!;
  for (const variante of ['base', 'aureo'] as const) {
    const files = { ...bundledFiles } as Record<string, string>;
    if (variante === 'base') {
      const senza = files['prompts/agents/sculptor.md'].replace(RIGA, '');
      if (senza === files['prompts/agents/sculptor.md']) throw new Error('la riga delle proporzioni non è nel prompt del seme');
      files['prompts/agents/sculptor.md'] = senza;
    }
    const system = sistema(files, { ...req, classe: cls.id });
    const msg = messaggio(req);
    for (let n = 1; n <= tentativi; n++) {
      const dir = path.join(out, req.chiave, variante, String(n));
      const fileMisure = path.join(dir, 'misure.json');
      let m: Misura;
      if (rimisura || fs.existsSync(fileMisure)) {
        if (!fs.existsSync(path.join(dir, 'modello.xml'))) continue;
        const prima = fs.existsSync(fileMisure) ? (JSON.parse(fs.readFileSync(fileMisure, 'utf8')) as Misura) : undefined;
        const xml = fs.readFileSync(path.join(dir, 'modello.xml'), 'utf8');
        const c = checkProgram(xml, cls, undefined, filesOf(xml, bundledFiles));
        m = { passa: !c.error, richieste: prima?.richieste ?? 1, ...misura(c, cls), ...(prima?.token ? { token: prima.token } : {}), ...(prima?.dollari !== undefined ? { dollari: prima.dollari } : {}) };
      } else {
        salva(path.join(dir, 'prompt.md'), `${system}\n`);
        salva(path.join(dir, 'richiesta.txt'), `${msg}\n`);
        const ask = (u: string): Promise<Risposta> => (provider === 'agy' ? chiediAgy(system, u, { ...(modello ? { modello } : {}) }) : chiedi(system, u, { ...(modello ? { modello } : {}) }));
        const token = { input: 0, output: 0 };
        let dollari = 0;
        let c: Checked | undefined;
        let richieste = 0;
        // As the game does (`write`): the invalid goes back with its reason, once.
        for (let i = 0; i < 2 && (!c || c.error); i++) {
          const u = i === 0 ? msg : `${msg}\n\nThe program you wrote:\n${c!.xml.slice(0, 6000)}\nIt does not pass: ${c!.error}\nFix it and answer with the whole program.`;
          const r = await ask(u);
          richieste++;
          token.input += r.token.inputTotale;
          token.output += r.token.output;
          dollari += r.dollari ?? 0;
          salva(path.join(dir, `risposta${i ? '-2' : ''}.txt`), r.testo);
          c = checkProgram(extractXml(r.testo), cls, undefined, filesOf(extractXml(r.testo), bundledFiles));
        }
        salva(path.join(dir, 'modello.xml'), `${c!.xml}\n`);
        m = { passa: !c!.error, richieste, ...misura(c!, cls), token, ...(dollari ? { dollari } : {}) };
        if (c!.result) fs.writeFileSync(path.join(dir, 'lati.png'), Buffer.from(views(c!).split(',')[1], 'base64'));
      }
      salva(fileMisure, `${JSON.stringify(m, null, 2)}\n`);
      righe.push({ chiave: req.chiave, variante, n, m });
      console.log(`${req.chiave} ${variante} ${n}: ${m.passa ? 'passa' : `no (${m.errore?.slice(0, 120)})`} · materiali ${m.materiali} · varianza ${m.varianza?.toFixed(2)}`);
    }
  }
}

const f = (v: number | undefined, d = 2) => (v === undefined ? '—' : v.toFixed(d).replace('.', ','));
salva(
  path.join(out, 'riepilogo.md'),
  [
    `# Il rapporto aureo nel prompt dello Scultore (T242) — ${provider}${modello ? ` ${modello}` : ''}`,
    '',
    '`base` è il prompt del seme senza la riga delle proporzioni, `aureo` con la riga. Varianza: distanza di Jaccard media fra le celle piene di ogni coppia di 4 semi.',
    '',
    '| richiesta | variante | n | passa | richieste | materiali | dominante | corpo | snellezza | varianza | token in/out |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...righe.map(({ chiave, variante, n, m }) =>
      `| ${chiave} | ${variante} | ${n} | ${m.passa ? 'sì' : 'no'} | ${m.richieste} | ${m.materiali ?? '—'} | ${f(m.dominante)} | ${f(m.corpo)} | ${f(m.snellezza)} | ${f(m.varianza)} | ${m.token ? `${m.token.input}/${m.token.output}` : '—'} |`,
    ),
    '',
  ].join('\n'),
);
