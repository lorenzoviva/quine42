// The substitute for «looking at the result» (T337): after every block of a program the Sculptor gets back, in text, what the game made of
// it. The program so far runs with some seeds (and at the end at the sizes it serves); what comes back is short enough for a request:
//   - what the game refuses, with its reason;
//   - the views of `viste.ts` (plan, heights, front, side) at the first seed, the plan only at the others: the seeds side by side say
//     whether the composition varies and keeps its kind;
//   - the measures of the shape (`concetti.ts`: cover, courtyard, peaks, heights, how much the seeds differ);
//   - at the last block the bench's measures and defects at every seed and size (`varianza.ts`), as the second request says them;
//   - the trace of the first seed, node by node (`src/mj/trace.ts`), within a ceiling of tokens.

import fs from 'node:fs';
import path from 'node:path';
import { Mj3Error, type Grid3 } from '../../src/mj/engine';
import { traceText } from '../../src/mj/trace';
import { png } from '../scripts/png';
import { formaDi, distanza, mediana, piedeDi, type Forma } from './concetti';
import { fotoLati, fotoPianta, fotoSezioni } from './foto';
import { esegui, giudica, misura, scatolaDi, type Bersaglio, type Eseguito } from './misure';
import { rigaDifetto } from './seconda';
import { difettiDiProva, fotoSemi, prova, type Prova } from './varianza';
import { vistaPianta, vistePerTesto } from './viste';

export interface Ritorno {
  testo: string;
  /** The game takes it at every seed tried. */
  gira: boolean;
  /** Only at the last block: the bench's trial. */
  prova?: Prova;
  forme: Forma[];
}

export interface OpzioniRitorno {
  semi?: number[];
  /** The last block: the bench's measures at every seed and size. */
  finale?: boolean;
  /** Tokens of the trace (estimated). */
  tetto?: number;
  larghezza?: number;
}

const n2 = (v: number) => v.toFixed(2).replace('.', ',');

/** Runs what there is of the program and says what came of it, as text for the next request. Nothing here throws. */
export function ritorno(xml: string, b: Bersaglio, o: OpzioniRitorno = {}): Ritorno {
  const semi = o.semi ?? [1, 2, 3];
  const parti: string[] = [];
  const forme: Forma[] = [];
  const corse: Array<{ seme: number; e: Eseguito }> = [];
  const errori: string[] = [];
  // On the coarse grid of a first block the plan lies on the ground layer: its letter does not count as building.
  const classe = scatolaDi(b).box;
  const suolo = /\sground="([^"]+)"/.exec(xml)?.[1];
  for (const seme of semi) {
    try {
      const e = esegui(xml, b, seme);
      corse.push({ seme, e });
      const fine = e.grid.X === classe[0] && e.grid.Z === classe[2];
      const pal = e.model.program.palette;
      const vista = fine || !suolo ? pal : { ...pal, [suolo]: { ...pal[suolo], hidden: true } };
      forme.push(formaDi('programma', seme, e.grid, vista, fine ? piedeDi(e.scatola.base, e.scatola.vpt) : 0));
      if (!e.result.finished) errori.push(`seme ${seme}: non finisce entro il tempo del gioco (${Math.round(e.result.ms)} ms): metti steps a ciò che cresce`);
    } catch (err) {
      errori.push(`seme ${seme}: ${err instanceof Mj3Error ? err.message : (err as Error).message}`);
    }
  }
  if (errori.length) parti.push(`## Cosa non va\n${errori.map((e) => `- ${e}`).join('\n')}`);
  const primo = corse[0];
  if (primo) {
    const g = primo.e.grid as Grid3;
    const pal = primo.e.model.program.palette;
    parti.push(`## Le viste\n${vistePerTesto(g, pal, `Seme ${primo.seme}`, { larghezza: o.larghezza ?? 50, sezioni: sezioniDi(g) })}`);
    for (const { seme, e } of corse.slice(1)) {
      const p = vistaPianta(e.grid, e.model.program.palette, { larghezza: o.larghezza ?? 50 });
      parti.push(`### Seme ${seme}: pianta e altezze\n\`\`\`\n${affianca(p.pianta, p.altezze)}\n\`\`\``);
    }
    if (forme.length) {
      const d: number[] = [];
      forme.forEach((a, i) => forme.slice(i + 1).forEach((c) => d.push(distanza(a, c).distanza)));
      const m = (k: 'copertura' | 'cortile' | 'torri' | 'altezzaMassima' | 'pieno') => n2(forme.reduce((s, f) => s + f[k], 0) / forme.length);
      parti.push(
        [
          '## La forma (media dei semi)',
          `copertura della pianta ${m('copertura')}, cortili chiusi ${m('cortile')}, picchi ${m('torri')}, altezza massima ${m('altezzaMassima')} della griglia, pieno ${m('pieno')} (1 è un blocco pieno)`,
          d.length ? `quanto differiscono i semi: ${n2(mediana(d))} (0 uguali, 1 niente in comune; un edificio che varia sta fra 0,25 e 0,6)` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }
    try {
      parti.push(`## La traccia (seme ${primo.seme})\n${traceText(primo.e.model, primo.seme, { deadline: 8_000, tetto: o.tetto ?? 2500, forma: 'nodes' })}`);
    } catch {
      /* a trace that cannot be made says nothing more than the errors above */
    }
  }
  let p: Prova | undefined;
  if (o.finale && !errori.length) {
    p = prova(xml, b);
    const difetti = difettiDiProva(p, 16);
    parti.push(`## Le misure del gioco (5 semi, ${p.taglie.map((t) => t.taglia).join(' e ')})\n${difetti.length ? difetti.map(rigaDifetto).join('\n') : 'Tutto regge e varia.'}`);
  }
  return { testo: parti.join('\n\n'), gira: !errori.length && corse.length === semi.length, ...(p ? { prova: p } : {}), forme };
}

/** Where to cut a grid: a third of the way up each storey of 32 voxels (a quarter-scale grid: of 8 cells), up to the top. */
export function sezioniDi(g: Grid3): number[] {
  const piano = g.Z > 40 ? 32 : 8;
  const out: number[] = [];
  for (let z = Math.round(piano / 3); z < g.Z && out.length < 3; z += piano) out.push(z);
  return out;
}

/** Two blocks of text side by side. */
function affianca(a: string, b: string): string {
  const la = a.split('\n'), lb = b.split('\n');
  const w = Math.max(...la.map((l) => l.length));
  return Array.from({ length: Math.max(la.length, lb.length) }, (_, i) => `${(la[i] ?? '').padEnd(w)}   ${lb[i] ?? ''}`).join('\n');
}

/** What a round writes for a final program: the bench's files (misure.json, lati.png, sezioni.png, pianta.png, varianza.json, semi.png). */
export function valutaFinale(xml: string, b: Bersaglio, dir: string, extra: Record<string, unknown> = {}): { passa: boolean; difetti: string[] } {
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
    fs.writeFileSync(path.join(dir, 'misure.json'), `${JSON.stringify({ bersaglio: b.id, ...extra, caratteriXml: xml.length, passa, difetti, voci: g.voci, misure: { ...misure, errori: analisi.errors } }, null, 2)}\n`);
  } catch (err) {
    difetti = [`il gioco lo rifiuta: ${(err as Error).message}`];
    fs.writeFileSync(path.join(dir, 'misure.json'), `${JSON.stringify({ bersaglio: b.id, ...extra, caratteriXml: xml.length, passa: false, difetti }, null, 2)}\n`);
  }
  return { passa, difetti };
}
