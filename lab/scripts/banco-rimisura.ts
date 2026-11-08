// Measures again the attempts of a round already asked (T337): the same files a round writes, from `modello.xml`, without calling any model.
// The tokens, the dollars and the time of the answer stay those of the round. Useful when the bench changes (the door `open`, T337).
//
//   npx vite-node lab/scripts/banco-rimisura.ts -- --dir lab/banco/metodo/prima [--bersagli rocca,tempio]

import fs from 'node:fs';
import path from 'node:path';
import { BERSAGLI } from '../banco/bersagli';
import { fotoLati, fotoPianta, fotoSezioni } from '../banco/foto';
import { esegui, giudica, misura } from '../banco/misure';
import { difettiDiProva, fotoSemi, prova } from '../banco/varianza';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const radice = path.resolve(opt('dir') ?? '');
const scelti = opt('bersagli')?.split(',');
const righe: string[] = [];
for (const b of BERSAGLI) {
  if (scelti && !scelti.includes(b.id)) continue;
  const dirB = path.join(radice, b.id);
  if (!fs.existsSync(dirB)) continue;
  for (const n of fs.readdirSync(dirB).sort())
    for (const sub of ['', 'seconda', 'terza', 'quarta']) {
      const dir = path.join(dirB, n, sub);
      const file = path.join(dir, 'modello.xml');
      if (!fs.existsSync(file)) continue;
      const xml = fs.readFileSync(file, 'utf8');
      const vecchio = fs.existsSync(path.join(dir, 'misure.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'misure.json'), 'utf8')) : {};
      let difetti: string[] = [];
      let passa = false;
      try {
        const e = esegui(xml, b);
        const m = misura(e, b);
        const g = giudica(m, e.scatola);
        fs.writeFileSync(path.join(dir, 'lati.png'), png(fotoLati(e)));
        const sez = fotoSezioni(e, m);
        if (sez) fs.writeFileSync(path.join(dir, 'sezioni.png'), png(sez));
        const pi = fotoPianta(e, m);
        if (pi) fs.writeFileSync(path.join(dir, 'pianta.png'), png(pi));
        const p = prova(xml, b);
        const { esecuzioni: _e, ...resto } = p;
        fs.writeFileSync(path.join(dir, 'varianza.json'), `${JSON.stringify(resto, null, 2)}\n`);
        const s = fotoSemi(p);
        if (s) fs.writeFileSync(path.join(dir, 'semi.png'), png(s));
        difetti = difettiDiProva(p);
        passa = g.passa && p.passa;
        const { celle: _c, analisi, ...misure } = m;
        fs.writeFileSync(path.join(dir, 'misure.json'), `${JSON.stringify({ ...vecchio, passa, difetti, voci: g.voci, misure: { ...misure, errori: analisi.errors }, rimisurato: new Date().toISOString() }, null, 2)}\n`);
      } catch (err) {
        difetti = [`il gioco lo rifiuta: ${(err as Error).message}`];
        fs.writeFileSync(path.join(dir, 'misure.json'), `${JSON.stringify({ ...vecchio, passa: false, difetti, rimisurato: new Date().toISOString() }, null, 2)}\n`);
      }
      const riga = `- ${b.id} (${path.relative(radice, dir)}): ${passa ? 'passa' : difetti.join('; ')}`;
      righe.push(riga);
      console.log(riga.slice(0, 400));
    }
}
fs.appendFileSync(path.join(radice, 'riepilogo.md'), `\n## ${new Date().toISOString()} — rimisurato (la porta \`open\`, T337): ${righe.filter((r) => r.endsWith('passa')).length}/${righe.length} passano\n${righe.join('\n')}\n`);
