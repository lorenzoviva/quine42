// The bench of the structures' prompt (T154): a program from `claude -p` with only the prompt and the target, or an XML already written;
// the game's engine runs it; four photos, a cut per storey, a plan, the measures and the defects, all in one folder per attempt.
//
//   npx vite-node lab/scripts/banco-strutture.ts -- --bersagli moderna,steampunk|tutti [--giro v1] [--prompt lab/banco/prompt.md] [--modello sonnet] [--tentativi 1]
//   npx vite-node lab/scripts/banco-strutture.ts -- --xml modello.xml --bersagli moderna [--giro prove]
//   npx vite-node lab/scripts/banco-strutture.ts -- --xml modello.xml --bersagli rocca --varianza   (T180: anche varianza.json e semi.png; da sola, lab/scripts/banco-varianza.ts)
//   npx vite-node lab/scripts/banco-strutture.ts -- --seconda --giro conferma --dir lab/banco [--bersagli …] [--insieme 3] [--traccia] [--tetto 4000]   (T173; la traccia, T179)
//
// → lab/out/banco/<giro>/<bersaglio>/<n>/ {prompt.md, bersaglio.txt, risposta.txt, modello.xml, lati.png, sezioni.png, pianta.png, misure.json, giudizio.md}
//   --seconda: each attempt of the round that does not pass gets its XML back, with its defects or its `problemi.md` → <n>/seconda/{richiesta.txt, …}.
//   and lab/out/banco/<giro>/riepilogo.md. Costs subscription credit only without `--xml`. The criteria are in lab/banco/README.md.

import fs from 'node:fs';
import path from 'node:path';
import { extractXml } from '../../src/kernel/agents/sculptor';
import type { Picture } from '../../src/mj/photo';
import { DEFAULT_CEILING, traceText } from '../../src/mj/trace';
import { BERSAGLI, bersaglio, testoBersaglio } from '../banco/bersagli';
import { chiedi, LimiteAbbonamento, type Risposta } from '../banco/claude';
import { fotoLati, fotoPianta, fotoSezioni } from '../banco/foto';
import { esegui, giudica, misura, type Bersaglio, type Giudizio, type Misure } from '../banco/misure';
import { daCorreggere, testoSeconda, type Scheda } from '../banco/seconda';
import { difettiDiProva, fotoSemi, primaCaduta, prova } from '../banco/varianza';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);

const giro = opt('giro') ?? 'prove';
const promptFile = path.resolve(opt('prompt') ?? 'lab/banco/prompt.md');
const fileXml = opt('xml');
const modello = opt('modello');
const quanti = Number(opt('tentativi') ?? 1);
const seconda = args.includes('--seconda');
/** The second request also says what the program did (T179). */
const conTraccia = args.includes('--traccia');
/** More seeds and more sizes for each attempt (T180): no call, a few seconds per program. */
const conVarianza = args.includes('--varianza');
const tetto = Number(opt('tetto') ?? DEFAULT_CEILING);
/** Attempts at the same time: the 5-hour window does not take many (T173). */
const insieme = Math.max(1, Number(opt('insieme') ?? 1));
const scelti = opt('bersagli') ?? (fileXml ? 'moderna' : seconda ? 'tutti' : '');
if (!scelti) throw new Error('--bersagli moderna,steampunk o --bersagli tutti');
const lista: Bersaglio[] = scelti === 'tutti' ? BERSAGLI : scelti.split(',').map((id) => bersaglio(id) ?? (() => { throw new Error(`bersaglio sconosciuto: ${id}; ci sono ${BERSAGLI.map((b) => b.id).join(' ')}`); })());
const radice = path.resolve(opt('dir') ?? 'lab/out/banco', giro);

const CRITERI = fs.readFileSync(path.resolve('lab/banco/README.md'), 'utf8').match(/<!-- criteri -->([\s\S]*?)<!-- \/criteri -->/)?.[1]?.trim() ?? '';

/** The next free attempt of a target: nothing is overwritten, so attempts can be compared. */
function cartella(b: Bersaglio): string {
  const dir = path.join(radice, b.id);
  fs.mkdirSync(dir, { recursive: true });
  let n = 1;
  while (fs.existsSync(path.join(dir, String(n)))) n++;
  const out = path.join(dir, String(n));
  fs.mkdirSync(out);
  return out;
}

const salvaFoto = (dir: string, nome: string, p: Picture | undefined) => {
  if (p) fs.writeFileSync(path.join(dir, nome), png(p));
};

interface Riga {
  bersaglio: string;
  dir: string;
  passa: boolean;
  difetti: string[];
  inputTotale?: number;
  output?: number;
}

/** Everything that comes after the answer. Nothing here throws: a program the game refuses is a result too. */
function valuta(xml: string, b: Bersaglio, dir: string, r?: Risposta): Riga {
  fs.writeFileSync(path.join(dir, 'modello.xml'), xml.endsWith('\n') ? xml : `${xml}\n`);
  let m: Misure | undefined;
  let g: Giudizio | undefined;
  let errore: string | undefined;
  try {
    const e = esegui(xml, b);
    m = misura(e, b);
    g = giudica(m, e.scatola);
    salvaFoto(dir, 'lati.png', fotoLati(e));
    salvaFoto(dir, 'sezioni.png', fotoSezioni(e, m));
    salvaFoto(dir, 'pianta.png', fotoPianta(e, m));
  } catch (err) {
    errore = (err as Error).message;
  }
  const { celle: _celle, analisi, ...misure } = m ?? ({} as Misure);
  // With variance (T182) a program passes only if it holds at every seed and size and varies: seed 1 alone says little.
  const p = conVarianza && !errore ? prova(xml, b) : undefined;
  const passa = (g?.passa ?? false) && (p?.passa ?? true);
  const difetti = p ? difettiDiProva(p) : (g?.difetti ?? [errore]);
  const caduta = p ? primaCaduta(p) : undefined;
  fs.writeFileSync(
    path.join(dir, 'misure.json'),
    JSON.stringify(
      {
        bersaglio: b.id,
        ...(errore ? { errore } : {}),
        ...(r ? { token: r.token, modello: r.modello, dollari: r.dollari, ms: r.ms } : {}),
        caratteriXml: xml.length,
        passa,
        difetti,
        ...(caduta ? { caduta } : {}),
        voci: g?.voci,
        misure: m ? { ...misure, errori: analisi.errors } : undefined,
      },
      null,
      2,
    ),
  );
  if (p) {
    const { esecuzioni: _esecuzioni, ...resto } = p;
    fs.writeFileSync(path.join(dir, 'varianza.json'), `${JSON.stringify(resto, null, 2)}\n`);
    salvaFoto(dir, 'semi.png', fotoSemi(p));
  }
  fs.writeFileSync(path.join(dir, 'giudizio.md'), `# Giudizio di chi guarda le foto — ${b.nome}\n\nVoto per ogni criterio (sì / in parte / no) e una riga su ciò che si vede.\n\n${CRITERI}\n`);
  return { bersaglio: b.id, dir, passa, difetti: p ? difettiDiProva(p) : (g?.difetti ?? [`il gioco lo rifiuta: ${errore}`]), ...(r ? { inputTotale: r.token.inputTotale, output: r.token.output } : {}) };
}

const righe: Riga[] = [];
const system = fileXml ? '' : fs.readFileSync(promptFile, 'utf8').trim();

/** One thing to ask: where it goes, what the message is. */
interface Lavoro {
  b: Bersaglio;
  dir: () => string;
  testo: string;
  file: string;
}

/** The trace of a program, if the game can run it at all: what it refuses comes back with its reason, and there is nothing to trace. */
function tracciaDi(xml: string, b: Bersaglio, caduta?: Scheda['caduta']): string | undefined {
  try {
    return traceText(esegui(xml, caduta ? { ...b, taglia: caduta.taglia } : b, caduta?.seme ?? 1).model, caduta?.seme ?? 1, { tetto });
  } catch {
    return undefined;
  }
}

/** The attempts of the round that have something to correct and have not had their second request. */
function lavoriSeconda(): Lavoro[] {
  const out: Lavoro[] = [];
  for (const b of lista) {
    const cartellaB = path.join(radice, b.id);
    if (!fs.existsSync(cartellaB)) continue;
    for (const n of fs.readdirSync(cartellaB).sort()) {
      const att = path.join(cartellaB, n);
      if (!fs.existsSync(path.join(att, 'modello.xml')) || fs.existsSync(path.join(att, 'seconda', 'misure.json'))) continue;
      const scheda = JSON.parse(fs.readFileSync(path.join(att, 'misure.json'), 'utf8')) as Scheda;
      const fileProblemi = path.join(att, 'problemi.md');
      const esame = daCorreggere(scheda, fs.existsSync(fileProblemi) ? fs.readFileSync(fileProblemi, 'utf8') : undefined);
      if (!esame) continue;
      const xml = fs.readFileSync(path.join(att, 'modello.xml'), 'utf8');
      const traccia = conTraccia ? tracciaDi(xml, b, scheda.caduta) : undefined;
      const testo = testoSeconda(testoBersaglio(b), xml, { ...esame, ...(traccia ? { traccia } : {}) });
      out.push({
        b,
        testo,
        file: 'richiesta.txt',
        dir: () => {
          const dir = path.join(att, 'seconda');
          fs.mkdirSync(dir, { recursive: true });
          return dir;
        },
      });
    }
  }
  return out;
}

if (fileXml) for (const b of lista) righe.push(valuta(fs.readFileSync(fileXml, 'utf8'), b, cartella(b)));
else {
  const lavori: Lavoro[] = seconda ? lavoriSeconda() : lista.flatMap((b) => Array.from({ length: quanti }, () => ({ b, dir: () => cartella(b), testo: testoBersaglio(b), file: 'bersaglio.txt' })));
  let prossimo = 0;
  let fermo = false;
  const operaio = async () => {
    while (!fermo && prossimo < lavori.length) {
      const { b, dir: crea, testo, file } = lavori[prossimo++]!;
      const dir = crea();
      if (!seconda) fs.writeFileSync(path.join(dir, 'prompt.md'), `${system}\n`);
      fs.writeFileSync(path.join(dir, file), `${testo}\n`);
      console.log(`${b.id}: chiedo a claude…`);
      try {
        const r = await chiedi(system, testo, { ...(modello ? { modello } : {}) });
        fs.writeFileSync(path.join(dir, 'risposta.txt'), r.testo);
        const riga = valuta(extractXml(r.testo), b, dir, r);
        righe.push(riga);
        console.log(`${b.id} → ${path.relative(process.cwd(), riga.dir)}: ${riga.passa ? 'PASSA le misure' : `${riga.difetti.length} difetti`}${riga.inputTotale !== undefined ? ` · input ${riga.inputTotale} · output ${riga.output}` : ''}`);
        for (const d of riga.difetti) console.log(`   - ${d}`);
      } catch (e) {
        fs.writeFileSync(path.join(dir, 'errore.txt'), `${(e as Error).message}\n`);
        console.error(`${b.id}: ${(e as Error).message}`);
        // A limit or a CLI that is not isolated stops everything: the next call would meet the same.
        if (e instanceof LimiteAbbonamento || /isolamento/.test((e as Error).message)) fermo = true;
      }
    }
  };
  await Promise.all(Array.from({ length: insieme }, operaio));
}

const passano = righe.filter((r) => r.passa).length;
fs.mkdirSync(radice, { recursive: true });
fs.appendFileSync(
  path.join(radice, 'riepilogo.md'),
  [`\n## ${new Date().toISOString()} — ${passano}/${righe.length} passano le misure`, ...righe.map((r) => `- ${r.bersaglio} (${path.relative(radice, r.dir)}): ${r.passa ? 'passa' : r.difetti.join('; ')}${r.inputTotale !== undefined ? ` · input ${r.inputTotale}, output ${r.output}` : ''}`), ''].join('\n'),
);
console.log(`${passano}/${righe.length} passano le misure → ${path.join(radice, 'riepilogo.md')}`);
