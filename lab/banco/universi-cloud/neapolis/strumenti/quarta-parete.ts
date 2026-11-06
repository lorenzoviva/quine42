// La quarta parete su tutto ciò che di Neapolis il mondo legge: le stringhe dei JSON (world/, modules/, maps/), i letterali
// delle stringhe Lua (i commenti del codice restano al tavolo del Concilio), i Markdown del mondo e il tema; le trame con
// reviewPlot (persone, parentele, canone delle rune), la bibbia con bibleBreaks; metaBreak con le parole del lessico guarda anche il glossario.
// Restano fuori i prompt degli agenti (prompts/agents: istruzioni al Concilio) e i programmi dei modelli (models/).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { bibleBreaks, lexiconWords, metaBreak } from '../../../../../src/kernel/fourthwall';
import { canonBreak, readPlots, reviewPlot } from '../../../../../src/kernel/plots';
import { readPeople } from '../../../../../src/kernel/society';
import { DIR } from './universo';

export interface WallReport {
  files: number;
  texts: number;
  breaks: string[];
}

/** I letterali stringa di un sorgente Lua (doppi apici, con gli escape). */
export function luaStrings(src: string): string[] {
  const code = src.replace(/--\[\[[\s\S]*?\]\]/g, '').replace(/--[^\n]*/g, '');
  return [...code.matchAll(/"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g)].map((m) => (m[1] ?? m[2]).replace(/\\n/g, '\n').replace(/\\(.)/g, '$1'));
}

function jsonStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => jsonStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => jsonStrings(x, out));
  return out;
}

export function checkFourthWall(dir = DIR): WallReport {
  const words = lexiconWords(readFileSync(join(dir, 'world/lexicon.md'), 'utf8'));
  const breaks: string[] = [];
  let files = 0;
  let texts = 0;
  const check = (where: string, t: string, glossary = true) => {
    texts++;
    const m = metaBreak(t, glossary ? words : []);
    if (m) breaks.push(`${where}: «${m}» in «${t.slice(0, 90)}»`);
    const c = canonBreak(t);
    if (c) breaks.push(`${where}: canone delle rune «${c}»`);
  };
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const rel = relative(dir, p).replace(/\\/g, '/');
      const top = rel.split('/')[0];
      if (statSync(p).isDirectory()) {
        // sys.lavoro is the seed's system as it is (T298): its texts are those of the Sala sistemi, not of the world.
        if (['strumenti', 'models'].includes(top) || rel === 'prompts/agents' || rel === 'modules/sys.lavoro') continue;
        walk(p);
        continue;
      }
      if (rel === 'README.md' || rel === 'verifica.ts') continue;
      const src = readFileSync(p, 'utf8');
      files++;
      if (p.endsWith('.json')) jsonStrings(JSON.parse(src)).forEach((t) => check(rel, t));
      else if (p.endsWith('.lua')) luaStrings(src).forEach((t) => check(rel, t));
      // Il lessico spiega le sue parole a chi scrive (non al mondo): lì vale solo il filtro delle parole.
      else if (p.endsWith('.md')) src.split(/\n(?=- |#)/).forEach((t) => check(rel, t, rel !== 'world/lexicon.md'));
    }
  };
  walk(dir);
  // La bibbia con il suo filtro, le trame con il loro validatore.
  const files_ = { 'world/bible.json': readFileSync(join(dir, 'world/bible.json'), 'utf8'), 'world/plots.json': readFileSync(join(dir, 'world/plots.json'), 'utf8'), 'world/people.json': readFileSync(join(dir, 'world/people.json'), 'utf8') };
  for (const b of bibleBreaks(JSON.parse(files_['world/bible.json']), words)) breaks.push(`world/bible.json: ${b}`);
  const people = readPeople(files_);
  for (const plot of readPlots(files_)) {
    const r = reviewPlot(plot, people, words);
    for (const p of r.problems) breaks.push(`world/plots.json «${plot.title}»: ${p}`);
  }
  return { files, texts, breaks };
}
