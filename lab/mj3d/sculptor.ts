// The sculptor (writes voxel programs) and the artist's review, for the lab. Same model layer as the
// Council (src/kernel/ai), its own prompts (lab/prompts). Nothing here touches the game.

import { parseJson, type Models, type Schema } from '../../src/kernel/ai/models';
import { analyse, mendProgram, type Analysis } from './check';
import { Mj3Error, run, type Program3, type RunResult, type Vec3 } from './engine';
import { EXAMPLES } from './examples';
import { boxOf, classOf, CLASSES, guessClass, TILE, type AssetClass } from './scale';
import { DEFAULT_RENDER, render, sheet, type Picture } from './render';
import SCULPTOR from '../prompts/scultore.md?raw';
import ARTIST from '../prompts/artista.md?raw';

export type Category = 'semplice' | 'struttura' | 'figura';

export const CATEGORY_LABEL: Record<Category, string> = {
  semplice: 'elemento semplice (oggetto, roccia, pianta)',
  struttura: 'struttura (edificio, colonna, porta, mobile grande)',
  figura: 'figura (persona, animale, mostro)',
};

export interface Target {
  id: string;
  name: string;
  category: Category;
  description?: string;
  /** How it looks (the imagePrompt of a module). */
  look?: string;
  context?: string;
  /** Asset class (scale.ts): gives the box. Guessed from the text when missing. */
  kind?: string;
  /** A box that overrides the class one (the blocks of a structure). */
  size?: Vec3;
  /** The current sprite in the universe (an img: id), for comparison. */
  sprite?: string;
  /** Where it comes from (module id, tile code, preset). */
  source?: string;
  /** The walk frames it has in the universe (direction → img: ids), for comparison. */
  frames?: Record<string, string[]>;
  /** Other sprites of the same thing (obstacle variants of a tile). */
  variants?: string[];
}

export interface SculptOptions {
  /** Few-shot examples in the prompt. */
  examples: boolean;
  /** Whether the shape node is allowed (false: rules, conv and path only). */
  shapes: boolean;
  /** Further attempts when the program is invalid. */
  retries: number;
  temperature?: number;
  /** The world's style guide (world/style.md). */
  style?: string;
  seed: number;
}

export const DEFAULT_SCULPT: SculptOptions = { examples: true, shapes: true, retries: 2, seed: 1 };

export interface Attempt {
  raw: string;
  program: Program3 | null;
  notes: string[];
  error?: string;
  analysis?: Analysis;
}

export interface Sculpture {
  program: Program3 | null;
  result?: RunResult;
  analysis?: Analysis;
  attempts: Attempt[];
}

export interface Critique {
  voto: number;
  riconoscibile: boolean;
  problemi: string[];
  consigli: string[];
  verdetto: 'approvato' | 'da rifare';
}

/** Runs a program (the page runs it in a worker, scripts directly). */
export type Executor = (p: Program3, seed: number) => Promise<RunResult>;
export const directExecutor: Executor = async (p, seed) => run(p, seed);

const SHAPE_DOC = `- shape: {"type":"shape","shape":"box","at":[x,y,z],"size":[larghezza,profondità,altezza],"color":"A","on":"."}
  una forma piena che poggia su "at" (il centro della sua base): box, ellipsoid, cylinder, cone; oppure
  {"type":"shape","shape":"line","at":[x,y,z],"to":[x,y,z],"r":1,"color":"A"} (un segmento di raggio r).
  "on" limita i codici che può sovrascrivere ("." = solo l'aria); con "color":"." scava.`;

const RULES_ONLY = `- In questa prova il nodo shape NON esiste: costruisci tutto con one, all, prl, conv e path, come in
  MarkovJunior. Semi e punti di partenza si ottengono con "origin", con regole che spostano o
  moltiplicano i semi e con "steps".`;

/** The class of a target, and the box its model must fill. */
export function classFor(t: Target): { cls: AssetClass; box: Vec3; minHeight: number } {
  const cls = classOf(t.kind) ?? guessClass(`${t.name} ${t.description ?? ''} ${t.look ?? ''}`, t.category);
  const box = t.size ?? boxOf(cls);
  return { cls, box, minHeight: t.size ? 0 : Math.round((cls.minHeight ?? 0) * box[2]) };
}

const classLine = (c: AssetClass) => {
  const b = boxOf(c);
  return `  - ${c.id} (${c.name}): [${b.join(', ')}] = ${c.tiles.join('×')} caselle${c.minHeight ? `, alto almeno ${Math.round(c.minHeight * b[2])}` : ''}; ${c.hint}`;
};

/** Figures, plants, things: the examples that teach most for a class. */
const FAMILY: Record<string, string> = { persona: 'figura', animale: 'figura', bestia: 'figura', albero: 'pianta', cespuglio: 'pianta', roccia: 'pietra', sasso: 'pietra' };

/**
 * The instructions; with a class, only up to two examples of the same class or family (the examples are
 * half of what every call pays in input), otherwise all of them.
 */
export function sculptorSystem(opts: SculptOptions, kind?: string): string {
  let s = SCULPTOR.replace('@@SHAPES@@', opts.shapes ? SHAPE_DOC : '')
    .replace('@@RULES_ONLY@@', opts.shapes ? '' : RULES_ONLY)
    .replaceAll('@@TILE@@', String(TILE))
    .replace('@@CLASSES@@', CLASSES.map(classLine).join('\n'));
  if (opts.examples) {
    const uses = (p: Program3) => JSON.stringify(p.program).includes('"shape"');
    let shown = EXAMPLES.filter((e) => opts.shapes || !uses(e.program));
    if (kind) {
      const same = shown.filter((e) => e.kind === kind);
      const family = shown.filter((e) => e.kind !== kind && FAMILY[e.kind] && FAMILY[e.kind] === FAMILY[kind]);
      const picked = [...same, ...family].slice(0, 2);
      shown = picked.length ? picked : shown.filter((e) => e.id === 'masso' || e.id === 'quercia');
    }
    s += `\n## Esempi\n${shown.map((e) => `Richiesta: ${e.ask} (classe ${e.kind})\n${JSON.stringify(e.program)}`).join('\n\n')}\n`;
  }
  return s.trim();
}

export function describe(t: Target, style?: string): string {
  return [
    `Scolpisci: ${t.name}`,
    `Tipo: ${CATEGORY_LABEL[t.category]}`,
    t.description && `Descrizione: ${t.description}`,
    t.look && `Aspetto: ${t.look}`,
    t.context && `Dove si trova: ${t.context}`,
    t.kind !== 'struttura' &&
      (() => {
      const { cls, box, minHeight } = classFor(t);
      return `Classe: ${t.size ? 'blocco di una struttura' : cls.id} · scatola (size) [${box.join(', ')}]${minHeight ? ` · alto almeno ${minHeight} voxel` : ''}`;
    })(),
    style && `Guida di stile del mondo:\n${style.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Turns an answer into a measured program, or says what is wrong with it. */
async function attempt(raw: string, t: Target, opts: SculptOptions, exec: Executor): Promise<Attempt & { result?: RunResult }> {
  const notes: string[] = [];
  let json: unknown;
  try {
    json = parseJson(raw);
  } catch (e) {
    return { raw, program: null, notes, error: `JSON non valido: ${(e as Error).message}` };
  }
  const program = mendProgram(json, notes);
  if (!program) return { raw, program: null, notes, error: notes.join('; ') || 'programma incomprensibile' };
  // The box is the class's, whatever the model wrote: that is what keeps assets in proportion.
  const { box, minHeight } = classFor(t);
  if (program.size.join() !== box.join()) {
    notes.push(`size [${program.size.join(', ')}] sostituita dalla scatola della classe [${box.join(', ')}]`);
    program.size = [...box];
  }
  if (!opts.shapes && JSON.stringify(program.program).includes('"shape"')) return { raw, program, notes, error: 'il nodo shape non è ammesso in questa prova' };
  try {
    const result = await exec(program, opts.seed);
    const analysis = analyse(result, program.palette, { grounded: !t.size, minHeight });
    return { raw, program, notes, analysis, result, ...(analysis.errors.length ? { error: analysis.errors.join('; ') } : {}) };
  } catch (e) {
    return { raw, program, notes, error: e instanceof Mj3Error ? e.message : `errore di esecuzione: ${(e as Error).message}` };
  }
}

export interface Previous {
  program: Program3;
  critique?: Critique;
  /** The four views of the previous model (data URL), so the sculptor sees what it made. */
  views?: string;
}

/**
 * Asks the sculptor for a program, runs it, and sends it back with the reasons while it is invalid.
 * With `previous`, it is a revision: the old program, the artist's review and the views go along.
 */
export async function sculpt(models: Models, t: Target, opts: SculptOptions, exec: Executor = directExecutor, previous?: Previous): Promise<Sculpture> {
  const system = sculptorSystem(opts, classFor(t).cls.id);
  let prompt = describe(t, opts.style);
  const images: string[] = [];
  if (previous) {
    prompt += `\n\nIl tuo programma precedente:\n${JSON.stringify(previous.program)}`;
    if (previous.views) {
      prompt += '\nL\'immagine allegata mostra le quattro viste del modello che costruisce (fronte, destra, retro, sinistra).';
      images.push(previous.views);
    }
    if (previous.critique)
      prompt += `\nL'Artista gli ha dato ${previous.critique.voto}/10.\nProblemi: ${previous.critique.problemi.join('; ') || '—'}\nConsigli: ${previous.critique.consigli.join('; ') || '—'}`;
    prompt += '\nMiglioralo: rispondi con il programma completo.';
  }
  const attempts: Sculpture['attempts'] = [];
  let last: (Attempt & { result?: RunResult }) | undefined;
  for (let i = 0; i <= opts.retries; i++) {
    const p =
      i === 0
        ? prompt
        : `${prompt}\n\nIl programma che hai scritto:\n${last!.program ? JSON.stringify(last!.program) : last!.raw.slice(0, 4000)}\nNon va: ${last!.error}\n${last!.notes.length ? `(riparazioni del kernel: ${last!.notes.join('; ')})\n` : ''}Correggilo e rispondi con il programma completo.`;
    const raw = await models.text({ agent: 'Scultore', task: 'lab.sculpt', system, prompt: p, images, temperature: opts.temperature ?? 0.7, data: { target: t, attempt: i, previous } });
    last = await attempt(raw, t, opts, exec);
    const { result: _r, ...kept } = last;
    attempts.push(kept);
    if (!last.error) break;
  }
  return { program: last!.program, result: last!.result, analysis: last!.analysis, attempts };
}

const CRITIQUE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    voto: { type: 'INTEGER' },
    riconoscibile: { type: 'BOOLEAN' },
    problemi: { type: 'ARRAY', items: { type: 'STRING' } },
    consigli: { type: 'ARRAY', items: { type: 'STRING' } },
    verdetto: { type: 'STRING', enum: ['approvato', 'da rifare'] },
  },
  required: ['voto', 'riconoscibile', 'problemi', 'consigli', 'verdetto'],
};

export async function review(models: Models, t: Target, views: string, reference?: string, style?: string, details: string[] = []): Promise<Critique> {
  const raw = await models.text({
    agent: 'Artista',
    task: 'lab.review',
    system: ARTIST.trim(),
    prompt: describe(t, style) + (reference ? "\nL'ultima immagine è lo sprite attuale del gioco." : ''),
    images: [views, ...details, ...(reference ? [reference] : [])],
    schema: CRITIQUE_SCHEMA,
    temperature: 0.3,
    data: { target: t },
  });
  const c = parseJson<Partial<Critique>>(raw);
  const voto = Math.max(0, Math.min(10, Math.round(Number(c.voto) || 0)));
  const riconoscibile = c.riconoscibile === true;
  return {
    voto,
    riconoscibile,
    problemi: Array.isArray(c.problemi) ? c.problemi.map(String) : [],
    consigli: Array.isArray(c.consigli) ? c.consigli.map(String) : [],
    verdetto: voto >= 7 && riconoscibile ? 'approvato' : 'da rifare',
  };
}

/** The four views on the grass, enlarged so a model can see them: what the artist looks at. */
export function contactSheet(r: RunResult, p: Program3, scale = 0): Picture {
  const views = [0, 1, 2, 3].map((v) => render(r.grid, p.palette, v, DEFAULT_RENDER));
  const w = views.reduce((s, v) => s + v.w + 4, 4);
  return sheet(views, scale || Math.max(2, Math.min(6, Math.floor(1024 / w))), 4, [112, 150, 84]);
}
