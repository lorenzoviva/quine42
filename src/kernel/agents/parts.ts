// The Sculptor takes a part of the world from a good model of its own (T472, S6 of T458, ADR-0242). After a model passes with a vote of at
// least `EXAMPLE_SCORE` (the author's 6), the Sculptor of its trade gets the program with its lines numbered and says which of them are a
// part other things of its trade would want (a wheel, a row of windows, a door that opens), with the part's contract; the kernel writes the
// part and the model with `<import>` in place of those lines (`composePart`, src/kernel/worldparts.ts), and takes it only if the model so
// rewritten makes the same grid, voxel by voxel, on every seed the world gives it (`sameGridErrors`): three at least. One call, its answer a
// few lines of XML (`<part …>contract</part>` or `<none/>`), on the model that sculpted the thing, with the core and the section of its trade
// in the system: the same prefix the cache keeps for its sculptures.

import { classOf, sizeOf, type SizeTier } from '../../mj/classes';
import { mjxIncludes } from '../../mj/model';
import { act } from '../../mj/run';
import type { Grid3 } from '../../mj/engine';
import type { WornZone } from '../../mj/worn';
import { runForm, type Forms } from '../forms';
import { composePart, numberedLines, partContract, readPartAnswer, type ComposedPart, type PartAnswer } from '../worldparts';
import type { Council } from './council';
import { sculptorRole, sculptorSection, specialtyOf, SPECIALTY_NAMES, type SculptorSpecialty } from './sculptor';

/** The task of the Sculptor that takes a part from a model (T472): in the census with the knob of the models, a card of the world. */
export const PART_TASK = 'model.part';
/** The seeds the same grid is tried on at least: the study's three, or every seed the world gives the model if it has more (`seedsOf`). */
export const PART_SEEDS = 3;
/** How many times in a session the director asks a trade for a part (a `<none/>` counts): the rest of its good models wait for another session. */
export const PART_TRIES = 2;

/** What the Sculptor is shown of a model to take a part from. */
export interface PartRequest {
  /** The model's id in the library, and its program as the library has it now. */
  id: string;
  xml: string;
  nome: string;
  classe: string;
  taglia?: SizeTier;
  worn?: WornZone;
  /** The Artist's vote it passed with. */
  score: number;
}

/** What the request of `model.part` says (in English, like every prompt, ADR-0165): the model, what a part is, the parts the trade has, the answer. */
export function partPrompt(req: PartRequest, specialty: SculptorSpecialty, others: ReadonlyArray<{ id: string; xml: string }> = []): string {
  const cls = classOf(req.classe) ?? classOf('object')!;
  const size = sizeOf(req.taglia);
  const has = others.map((o) => `- <import file="${o.id}"/>: ${partContract(o.xml) ?? 'a part of this world'}`);
  return [
    `Take a part of this world from a program of yours: «${req.nome}» (class ${cls.id}${size && size.id !== cls.taglia ? `, size ${size.id}` : ''}; ${SPECIALTY_NAMES[specialty]}) passed the kernel's checks and the Artist gave it ${req.score}/10.`,
    "A part is a run of whole nodes, one after the other in the same <sequence>, that other programs of your trade include with <import file=\"…\"/> instead of writing it again: what this kind of thing shares with others of its trade (a wheel on its axle, a row of windows in a band of the walls, a door or a lid that opens, a roof on its walls, a crown of leaves on a trunk, a face on a head). It works on letters the program has drawn before it, not on fixed places of this box, so that another thing of another shape can draw those letters and include it.",
    has.length ? `This world already has these parts of your trade: do not take one of them again.\n${has.join('\n')}` : '',
    `The program, its lines numbered:\n\`\`\`\n${numberedLines(req.xml)}\n\`\`\``,
    'Answer with:\n<part name="what it makes, two or three words in the language of the world" lines="A-B" reads="the letters it needs drawn before it" writes="the letters it draws">\nIts contract, one paragraph in English for whoever includes it: what to build and mark before it, what it makes of that, how to colour its letters.\n</part>',
    "The kernel moves lines A-B into the part as they are and puts the import in their place: it takes the part only if the program then makes the same grid, voxel by voxel, on every seed. So whole elements (every element that begins in those lines ends there), nodes of one <sequence> (in a <markov> the order of the rules changes), none of an animation, an action or a worn section, nothing that reads a file or includes another; the grid must use neither S nor #90-#97, which the parts of the seed keep. If nothing in it is worth sharing, answer <none/>.",
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** What becomes of a request of a part: its id if the kernel took it, `none` if the Sculptor found nothing to share, the calls made. */
export interface PartOutcome {
  id?: string;
  none?: boolean;
  error?: string;
  calls: number;
}

/** What the kernel answers to a part composed: its id, or why not (`final`: asking again would change nothing, as a model changed meanwhile). */
export type PartTaken = { id: string } | { error: string; final?: boolean };

/**
 * Asks the Sculptor of the model's trade for a part of it (T472), on `model` (the one that sculpted the thing), and hands what it composes to
 * `take` (the kernel's `addWorldPart`); what does not pass goes back once with the reason. The core of the trade and its section in the system,
 * as when it sculpts; the parts the world has of the trade in the request, so that it takes no second one of the same.
 */
export async function extractPart(c: Council, req: PartRequest, model: string, take: (made: ComposedPart, answer: PartAnswer) => Promise<PartTaken>, others: ReadonlyArray<{ id: string; xml: string }> = [], retries = 1): Promise<PartOutcome> {
  const cls = classOf(req.classe) ?? classOf('object')!;
  const specialty = specialtyOf(cls, req);
  const role = sculptorRole(c.files, specialty);
  const section = sculptorSection(c.files, specialty);
  const prompt = partPrompt(req, specialty, others);
  c.say('sculptor', 'propone', `«${req.nome}» (${SPECIALTY_NAMES[specialty]}, ${req.score}/10): una parte da condividere?`, undefined, PART_TASK);
  let calls = 0;
  let last: { said: string; error: string } | undefined;
  for (let i = 0; i <= retries; i++) {
    const p = last ? `${prompt}\n\nYou answered:\n${last.said}\nIt does not pass: ${last.error}\nFix it and answer with the <part> only, or <none/>.` : prompt;
    calls++;
    const raw = await c.write('sculptor', PART_TASK, p, { role, system: [section], model, temperature: 0.4, specialty, data: { request: { id: req.id, nome: req.nome, classe: req.classe, ...(req.taglia ? { taglia: req.taglia } : {}) }, xml: req.xml, score: req.score } });
    const said = (/<part\b[\s\S]*?<\/part\s*>/i.exec(raw)?.[0] ?? raw).slice(0, 1200);
    const answer = readPartAnswer(raw);
    if (answer === 'none') {
      c.say('sculptor', 'info', `«${req.nome}»: niente da condividere`, undefined, PART_TASK);
      return { none: true, calls };
    }
    if ('error' in answer) {
      last = { said, error: answer.error };
      c.say('kernel', 'scarta', `parte di «${req.nome}»: ${answer.error.slice(0, 160)}`, 'sculptor', PART_TASK);
      continue;
    }
    const made = composePart(req.xml, answer, { id: req.id, name: req.nome });
    if ('error' in made) {
      last = { said, error: made.error };
      c.say('kernel', 'scarta', `parte di «${req.nome}»: ${made.error.slice(0, 160)}`, 'sculptor', PART_TASK);
      continue;
    }
    const took = await take(made, answer);
    if ('id' in took) return { id: took.id, calls };
    if (took.final) return { error: took.error, calls };
    last = { said, error: took.error };
  }
  return { error: last?.error, calls };
}

/** A grid of a form as the engine runs actions on it: its own cells, the alphabet copied. */
const gridOf = (g: { X: number; Y: number; Z: number; cells: Uint8Array; alphabet: string[] }): Grid3 => ({ X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 });

/** Where two grids of the same box differ, by the symbol of each voxel (the codes may differ, the letters may not): how many, and the first. */
function gridDifference(a: Pick<Grid3, 'X' | 'Y' | 'Z' | 'cells' | 'alphabet'>, b: Pick<Grid3, 'X' | 'Y' | 'Z' | 'cells' | 'alphabet'>): string | undefined {
  if (a.X !== b.X || a.Y !== b.Y || a.Z !== b.Z) return `la scatola cambia: ${b.X}×${b.Y}×${b.Z} invece di ${a.X}×${a.Y}×${a.Z}`;
  let n = 0;
  let first = -1;
  for (let i = 0; i < a.cells.length; i++) {
    if (a.alphabet[a.cells[i]] === b.alphabet[b.cells[i]]) continue;
    if (first < 0) first = i;
    n++;
  }
  if (!n) return undefined;
  const XY = a.X * a.Y;
  const at = `${first % a.X},${Math.floor(first / a.X) % a.Y},${Math.floor(first / XY)}`;
  return `${n} voxel diversi (il primo a ${at}: ${b.alphabet[b.cells[first]] ?? '?'} invece di ${a.alphabet[a.cells[first]] ?? '?'})`;
}

/** What a voxel of a letter looks like: its colour, whether it is hidden, glows, is translucent, marks an area. */
const look = (p: { color?: string; hidden?: boolean; glow?: boolean; alpha?: number; area?: string } | undefined) => JSON.stringify([p?.color ?? null, !!p?.hidden, !!p?.glow, p?.alpha ?? 1, p?.area ?? null]);

/**
 * Whether a model rewritten with a part makes the same grid as before (T472): on seeds 1 to `seeds`, as the world runs it (`Forms.request`,
 * without the interior), the same letter in every voxel, every letter with the same look, the same actions, and each of them, run once on the
 * first seed, the same grid again. Between two runs the loop turns (`pause`): a structure's runs are seconds each, and a world of many must
 * not fall silent (ADR-0110). Empty: the same grid; else what differs, seed by seed.
 */
export async function sameGridErrors(forms: Pick<Forms, 'request' | 'file'>, source: string, made: Pick<ComposedPart, 'id' | 'part' | 'rewritten'>, seeds: number, pause: () => Promise<void> = () => new Promise((r) => setTimeout(r, 0))): Promise<string[]> {
  const read = (f: string) => (f === `${made.id}.xml` ? made.part : forms.file(f));
  const files = mjxIncludes(made.rewritten, read);
  for (let seed = 1; seed <= seeds; seed++) {
    const q = forms.request(source, seed, undefined, { bare: true });
    if (!q) return ['il modello non è più nella libreria'];
    let before: ReturnType<typeof runForm>, after: ReturnType<typeof runForm>;
    try {
      before = runForm(q);
      await pause();
      after = runForm({ ...q, xml: made.rewritten, files });
      await pause();
    } catch (e) {
      return [`seme ${seed}: ${(e as Error).message}`];
    }
    if (!before.finished || !after.finished) return [`seme ${seed}: ${before.finished ? 'riscritto, ' : ''}il programma non finisce nel suo tempo`];
    const diff = gridDifference(before.grid as Grid3, after.grid as Grid3);
    if (diff) return [`seme ${seed}: ${diff}`];
    const present = new Set(Array.from(before.grid.cells, (c) => before.grid.alphabet[c]));
    for (const s of present) if (look(before.palette[s]) !== look(after.palette[s])) return [`seme ${seed}: la lettera ${s} cambia colore o aspetto`];
    if (seed !== 1) continue;
    const names = (r: typeof before) => r.model.actions.map((a) => a.name).join(' ');
    if (names(before) !== names(after)) return [`le azioni cambiano: ${names(after) || 'nessuna'} invece di ${names(before) || 'nessuna'}`];
    for (let i = 0; i < before.model.actions.length; i++) {
      const a = gridOf(before.grid), b = gridOf(after.grid);
      act(a, before.model.actions[i], 1);
      act(b, after.model.actions[i], 1);
      const d = gridDifference(a, b);
      if (d) return [`l'azione «${before.model.actions[i].name}»: ${d}`];
    }
  }
  return [];
}
