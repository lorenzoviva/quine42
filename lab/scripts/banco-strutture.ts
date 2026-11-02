// The bench of the structures' prompt (T154): a program from `claude -p` with only the prompt and the target, or an XML already written;
// the game's engine runs it; four photos, a cut per storey, a plan, the measures and the defects, all in one folder per attempt.
//
//   npx vite-node lab/scripts/banco-strutture.ts -- --bersagli moderna,steampunk|tutti [--giro v1] [--prompt lab/banco/prompt.md] [--modello sonnet] [--tentativi 1]
//   npx vite-node lab/scripts/banco-strutture.ts -- --xml modello.xml --bersagli moderna [--giro prove]
//
// → lab/out/banco/<giro>/<bersaglio>/<n>/ {prompt.md, bersaglio.txt, risposta.txt, modello.xml, lati.png, sezioni.png, pianta.png, misure.json, giudizio.md}
//   and lab/out/banco/<giro>/riepilogo.md. Costs subscription credit only without `--xml`. The criteria are in lab/banco/README.md.

import fs from 'node:fs';
import path from 'node:path';
import { extractXml } from '../../src/kernel/agents/sculptor';
import type { Picture } from '../../src/mj/photo';
import { BERSAGLI, bersaglio, testoBersaglio } from '../banco/bersagli';
import { chiedi, LimiteAbbonamento, type Risposta } from '../banco/claude';
import { fotoLati, fotoPianta, fotoSezioni } from '../banco/foto';
import { esegui, giudica, misura, type Bersaglio, type Giudizio, type Misure } from '../banco/misure';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);

const giro = opt('giro') ?? 'prove';
const promptFile = path.resolve(opt('prompt') ?? 'lab/banco/prompt.md');
const fileXml = opt('xml');
const modello = opt('modello');
const quanti = Number(opt('tentativi') ?? 1);
const scelti = opt('bersagli') ?? (fileXml ? 'moderna' : '');
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
  fs.writeFileSync(
    path.join(dir, 'misure.json'),
    JSON.stringify(
      {
        bersaglio: b.id,
        ...(errore ? { errore } : {}),
        ...(r ? { token: r.token, modello: r.modello, dollari: r.dollari, ms: r.ms } : {}),
        caratteriXml: xml.length,
        passa: g?.passa ?? false,
        difetti: g?.difetti ?? [errore],
        voci: g?.voci,
        misure: m ? { ...misure, errori: analisi.errors } : undefined,
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(path.join(dir, 'giudizio.md'), `# Giudizio di chi guarda le foto — ${b.nome}\n\nVoto per ogni criterio (sì / in parte / no) e una riga su ciò che si vede.\n\n${CRITERI}\n`);
  return { bersaglio: b.id, dir, passa: g?.passa ?? false, difetti: g?.difetti ?? [`il gioco lo rifiuta: ${errore}`], ...(r ? { inputTotale: r.token.inputTotale, output: r.token.output } : {}) };
}

const righe: Riga[] = [];
const system = fileXml ? '' : fs.readFileSync(promptFile, 'utf8').trim();
fuori: for (const b of lista) {
  for (let t = 0; t < (fileXml ? 1 : quanti); t++) {
    const dir = cartella(b);
    const testo = testoBersaglio(b);
    let riga: Riga;
    if (fileXml) riga = valuta(fs.readFileSync(fileXml, 'utf8'), b, dir);
    else {
      fs.writeFileSync(path.join(dir, 'prompt.md'), `${system}\n`);
      fs.writeFileSync(path.join(dir, 'bersaglio.txt'), `${testo}\n`);
      console.log(`${b.id}: chiedo a claude…`);
      try {
        const r = await chiedi(system, testo, { ...(modello ? { modello } : {}) });
        fs.writeFileSync(path.join(dir, 'risposta.txt'), r.testo);
        riga = valuta(extractXml(r.testo), b, dir, r);
      } catch (e) {
        fs.writeFileSync(path.join(dir, 'errore.txt'), `${(e as Error).message}\n`);
        console.error(`${b.id}: ${(e as Error).message}`);
        // A limit or a CLI that is not isolated stops everything: the next call would meet the same.
        if (e instanceof LimiteAbbonamento || /isolamento/.test((e as Error).message)) break fuori;
        continue;
      }
    }
    righe.push(riga);
    console.log(`${b.id} → ${path.relative(process.cwd(), riga.dir)}: ${riga.passa ? 'PASSA le misure' : `${riga.difetti.length} difetti`}${riga.inputTotale !== undefined ? ` · input ${riga.inputTotale} · output ${riga.output}` : ''}`);
    for (const d of riga.difetti) console.log(`   - ${d}`);
  }
}

const passano = righe.filter((r) => r.passa).length;
fs.mkdirSync(radice, { recursive: true });
fs.appendFileSync(
  path.join(radice, 'riepilogo.md'),
  [`\n## ${new Date().toISOString()} — ${passano}/${righe.length} passano le misure`, ...righe.map((r) => `- ${r.bersaglio} (${path.relative(radice, r.dir)}): ${r.passa ? 'passa' : r.difetti.join('; ')}${r.inputTotale !== undefined ? ` · input ${r.inputTotale}, output ${r.output}` : ''}`), ''].join('\n'),
);
console.log(`${passano}/${righe.length} passano le misure → ${path.join(radice, 'riepilogo.md')}`);
