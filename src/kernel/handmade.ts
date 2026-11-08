// The handmade cards (T293, ADR-0161): a program a player forked from a model or a sound and changed in the labs, kept in the collection
// of their account, outside every universe (`server/handmade.ts`, `universes/.handmade/`). It enters a world only at the start of a universe
// (T295). Here is what one is, the checks its texts pass, and the check of its program on the real engine, with caps measured on the seed's
// programs (`lab/scripts/carte-mano.ts`): a program a player wrote ends up in other people's browsers and worlds. Pure: the server, the
// process that checks a program (the world's program, `worldProcess.ts`) and the labs read the same.

import { analyse } from '../mj/check';
import { boxOf, classOf, CLASSES, SIZE_TIERS, type SizeTier } from '../mj/classes';
import { run, runOn, type Grid3, type GridLimits } from '../mj/engine';
import { compileMjx } from '../mj/model';
import { parseXml, XmlError } from '../mj/xml';
import { classSeeds, rootTag } from './forms';
import { metaBreak } from './fourthwall';
import { portedProgram } from './migrations';
import { fingerprint, HANDMADE_ID_RE, readOrigins, type CardOrigin } from './heritage';
import { newNodesRefusal, soundErrors } from './validator';
import { contractOf, parseContract, parseVersion, showContract, KERNEL_VERSION } from './version';
import { validWandererId } from './wanderers';

export type HandmadeKind = 'model' | 'sound';
export const HANDMADE_KINDS: readonly HandmadeKind[] = ['model', 'sound'];

/** Where a card was born: a model or a sound of a universe, or another card of the same author. The fingerprint is of the program it came from. */
export type HandmadeFrom = { universe: string; model: string; fingerprint: number[] } | { card: string; fingerprint: number[] };

/** A handmade card, as the archive keeps it. */
export interface HandmadeCard {
  /** Its own: the server's, never the original's nor one the client chose (`newHandmadeId`). A valid model id, so a universe can take it as it is (T295). */
  id: string;
  kind: HandmadeKind;
  /** What its author called it: a text of a player (`cleanText`), maybe one day in a world. */
  name: string;
  /** A model's class (`CLASSES`); a sound has none. */
  class?: string;
  /** A model's size (`SIZE_TIERS`), if not its class's own. */
  size?: SizeTier;
  /** The program, MarkovJunior. */
  xml: string;
  /** The contract (`X.Y`) its program was checked with. */
  kernel: string;
  /** The wanderer of the account that made it. Never in what another is told. */
  author: string;
  from?: HandmadeFrom;
  /** The chain of the holders before it (heritage.ts): the original's, and the original's holder; what is measured is the program. */
  origins?: CardOrigin[];
  /** When it was made and last changed, by the server's clock. */
  made: string;
  changed: string;
}

/** An account's collection of handmade cards: one file of the archive. */
export interface HandmadeRecord {
  /** How the author signs their cards for the others: never their id. */
  signature?: string;
  cards: HandmadeCard[];
  /**
   * Entries with the id of a card that this kernel cannot read as one of this account's (a kernel of tomorrow's, with a class this one does
   * not know; an author that is not the file's): kept as they are at every write, counted in the caps, never served.
   */
  unread?: unknown[];
}

/** How many cards an account holds: those this kernel reads and those it keeps without reading. */
export const heldCards = (record: HandmadeRecord): number => record.cards.length + (record.unread?.length ?? 0);

/** An account's file, as written: its cards, and what this kernel could not read, as it was. */
export function handmadeRecordText(record: HandmadeRecord): string {
  return JSON.stringify({ ...(record.signature ? { signature: record.signature } : {}), cards: [...record.cards, ...(record.unread ?? [])] }) + '\n';
}

/** The contract the cards are checked with now: this kernel's. */
export const HANDMADE_CONTRACT = showContract(contractOf(parseVersion(KERNEL_VERSION)!));

/**
 * What a program of a card may be, measured on the seed's programs (`lab/scripts/carte-mano.ts`; the largest in brackets, on the
 * author's machine, 06/11/2026, with and without the load of the pipeline): the text 128 KiB (88 KB, the structures); the grid 2 million
 * cells and 256 a side, maps included (1.84 million, a Huge structure; 192 a side); a run 250 000 steps (9 238) and 4 s (0.5-1.1 s);
 * every seed of its class; 16 actions and 16 animations (2 and 1 in the seed, 11 animations in a model of the labs), each run of a clip
 * or of a frame 100 000 steps and 1 s (72 ms); a sound's three seeds 8 s (2.2-3 s); all of it 15 s (3 s). Where the game's own runners
 * give more (8 s and 8 million cells to a model, 2 s to a clip), a card that passes here is well inside them. Time is the machine's:
 * a program near a cap may pass on one and not on a slower one.
 */
export const HANDMADE_LIMITS = {
  xmlChars: 128 * 1024,
  grid: { side: 256, cells: 2_000_000 } as GridLimits,
  steps: 250_000,
  runMs: 4_000,
  actions: 16,
  animations: 16,
  clipSteps: 100_000,
  clipMs: 1_000,
  soundMs: 8_000,
  totalMs: 15_000,
};
export type HandmadeLimits = typeof HANDMADE_LIMITS;

/** What an account may keep: cards, and bytes of its file. */
export const HANDMADE_CAPS = { cards: 50, bytes: 2 * 1024 * 1024 };
export type HandmadeCaps = typeof HANDMADE_CAPS;

// The id of a card lives with what measures it (heritage.ts): the cards of a universe read it without the engine.
export { HANDMADE_ID_RE };
const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** A new id from ten random bytes (the server's `randomBytes`): `handmade-` and ten letters or digits. */
export function newHandmadeId(bytes: Uint8Array): string {
  if (bytes.length < 10) throw new Error('servono dieci byte casuali');
  return `handmade-${Array.from(bytes.subarray(0, 10), (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('')}`;
}

export const NAME_MAX = 60;
export const SIGNATURE_MAX = 40;

/**
 * A text a player wrote, for a page and maybe a world: one line, at most `max` characters, at least a letter or a digit, no markup, no
 * control or invisible character (no bidirectional override that turns it round on a page). Spaces collapse; nothing else is changed:
 * what is wrong goes back with the reason.
 */
export function cleanText(raw: unknown, max: number, what: string): { text: string } | { error: string } {
  if (typeof raw !== 'string') return { error: `${what}: serve un testo` };
  const text = raw.normalize('NFC').replace(/\s+/gu, ' ').trim();
  if (/[\p{Cc}\p{Cf}\p{Co}\p{Cn}\p{Cs}]/u.test(text)) return { error: `${what}: contiene caratteri invisibili o di controllo` };
  if (/[<>]/.test(text)) return { error: `${what}: niente «<» né «>»` };
  if (!/[\p{L}\p{N}]/u.test(text)) return { error: `${what}: serve almeno una lettera o una cifra` };
  if ([...text].length > max) return { error: `${what}: al più ${max} caratteri` };
  return { text };
}

/** A card's name: a text of a player that may one day be the name of a thing in a world, so the fourth wall holds for it too (ADR-0025). */
export function cleanCardName(raw: unknown): { text: string } | { error: string } {
  const r = cleanText(raw, NAME_MAX, 'il nome');
  if ('error' in r) return r;
  const broken = metaBreak(r.text);
  return broken ? { error: `il nome: nel mondo non si dice «${broken}»` } : r;
}

/** The contract a client says it wrote for: `X.Y`, or the `X.Y` of an `X.Y.Z`. */
export function contractSaid(raw: unknown): string | undefined {
  const c = parseContract(raw) ?? (parseVersion(raw) ? contractOf(parseVersion(raw)!) : undefined);
  return c ? showContract(c) : undefined;
}

/** What a client says of a program: its kind, class and size, the text. */
export interface HandmadeProgram {
  kind: HandmadeKind;
  xml: string;
  class?: string;
  size?: string;
}

/** Why kind, class and size cannot be, without running anything. */
export function programShapeErrors(q: HandmadeProgram): string[] {
  const errors: string[] = [];
  if (!HANDMADE_KINDS.includes(q.kind)) errors.push('il tipo è «model» o «sound»');
  if (typeof q.xml !== 'string' || !q.xml.trim()) errors.push('manca il programma');
  if (q.kind === 'model') {
    if (!classOf(q.class)) errors.push(`la classe è una di ${CLASSES.map((c) => c.id).join(', ')}`);
    if (q.size !== undefined && !SIZE_TIERS.some((t) => t.id === q.size)) errors.push(`la taglia è una di ${SIZE_TIERS.map((t) => t.id).join(', ')}`);
  } else if (q.kind === 'sound' && (q.class !== undefined || q.size !== undefined)) errors.push('un suono non ha classe né taglia');
  return errors;
}

const copyGrid = (g: Grid3): Grid3 => ({ ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 });

/**
 * Why a program cannot be a handmade card, on the real engine; empty: it can. A model runs once for every seed of its class, in its
 * class's box at its size (or the `size` it says itself), each run within the steps, the time and the grid of `limits`, must finish and
 * stand (`analyse`, as the validator wants of every model); then every action once and every frame of every animation, on the first
 * seed's grid. A sound passes the thresholds of the analysis on three seeds, as the Musician's (`soundErrors`). All within `totalMs`:
 * past it, the check stops. `now` is the clock, for the tests.
 */
export function handmadeProgramErrors(q: HandmadeProgram, limits: HandmadeLimits = HANDMADE_LIMITS, now: () => number = Date.now): string[] {
  const shape = programShapeErrors(q);
  if (shape.length) return shape;
  if (q.xml.length > limits.xmlChars) return [`programma troppo lungo: ${q.xml.length} caratteri, al più ${limits.xmlChars}`];
  const end = now() + limits.totalMs;
  const slow = `il controllo supera ${limits.totalMs / 1000} s: una carta deve costare meno a chi la usa`;
  /** What a run may still take: its own cap, within what is left of the whole. */
  const left = (cap: number) => Math.max(1, Math.min(cap, end - now()));
  try {
    // Read first, with the reader that goes once through the text: what `rootTag` looks for afterwards is then in a text that reads.
    parseXml(q.xml);
    if (q.kind === 'sound') {
      const m = compileMjx(q.xml, {});
      if (!m.sound) return ['manca <sound>: questo programma è un modello, salvalo come modello'];
      const infers = newNodesRefusal(m);
      if (infers) return [infers];
      const errors = soundErrors('programma', m, left(limits.soundMs));
      return now() > end ? [slow] : errors;
    }
    const cls = classOf(q.class)!;
    // The box as the game gives it (`Forms`): the program's own `size`, or its class's at its size.
    const box = /\ssize="/.test(rootTag(q.xml)) ? undefined : boxOf(cls, q.size);
    const m = compileMjx(q.xml, box ? { size: box } : {});
    if (m.sound) return ['questo programma è un suono (<sound>): salvalo come suono'];
    const infers = newNodesRefusal(m);
    if (infers) return [infers];
    if (m.actions.length > limits.actions) return [`troppe azioni: ${m.actions.length}, al più ${limits.actions}`];
    if (m.animations.length > limits.animations) return [`troppe animazioni: ${m.animations.length}, al più ${limits.animations}`];
    let first: Grid3 | undefined;
    for (let seed = 1; seed <= classSeeds(cls.id); seed++) {
      if (now() >= end) return [slow];
      const r = run(m.program, seed, limits.steps, limits.grid, { deadline: left(limits.runMs) });
      if (!r.finished) return [`il seme ${seed} non finisce entro ${limits.steps} passi e ${limits.runMs / 1000} s (ogni crescita deve avere steps)`];
      const errors = analyse(r, m.program.palette, { grounded: true }).errors;
      if (errors.length) return errors.map((e) => `seme ${seed}: ${e}`);
      first ??= r.grid;
    }
    for (const clip of m.actions) {
      if (now() >= end) return [slow];
      const r = runOn(copyGrid(first!), clip.program, 1, limits.clipSteps, limits.grid, { deadline: left(limits.clipMs) });
      if (!r.finished) return [`l'azione «${clip.name}» non finisce entro ${limits.clipSteps} passi e ${limits.clipMs / 1000} s`];
    }
    for (const clip of m.animations) {
      // As the renderer makes the frames (`clipFrames`): each one the clip run on the one before.
      let g = first!;
      for (let k = 1; k < clip.frames; k++) {
        if (now() >= end) return [slow];
        const next = copyGrid(g);
        const r = runOn(next, clip.program, 31 + k, limits.clipSteps, limits.grid, { deadline: left(limits.clipMs) });
        if (!r.finished) return [`l'animazione «${clip.name}» non finisce al fotogramma ${k + 1} entro ${limits.clipSteps} passi e ${limits.clipMs / 1000} s`];
        g = next;
      }
    }
    return now() > end ? [slow] : [];
  } catch (e) {
    // The engine's and the reader's words say the line; anything else (a stack too deep) says only that it cannot be read.
    if (e instanceof XmlError) return [`XML: ${e.message}`];
    const message = e instanceof Error ? e.message : String(e);
    return [e instanceof RangeError ? 'il programma non si legge: troppo annidato o troppo grande' : message.slice(0, 500)];
  }
}

/** The content a handmade card is measured by, here and in a universe (T295): its program. */
export const handmadeFingerprint = (xml: string): number[] => fingerprint(xml);

/** The chain of a card forked from a model of a universe: the model's own chain, and its holder there; a model without a card (the seed's) has none. */
export function forkedOrigins(stamp: { holder?: unknown; origins?: unknown } | undefined, universe: string, xml: string): CardOrigin[] {
  if (!stamp || typeof stamp.holder !== 'string') return [];
  return [...readOrigins(stamp.origins), { holder: stamp.holder, universe, fingerprint: handmadeFingerprint(xml) }];
}

const isDate = (v: unknown): v is string => typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));
const isPrint = (v: unknown): v is number[] => Array.isArray(v) && v.length <= 64 && v.every((n) => Number.isInteger(n));

/** A card as the archive has it, or undefined: what does not read as one is left out, never taken for another thing. */
export function readHandmadeCard(raw: unknown): HandmadeCard | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const c = raw as Record<string, unknown>;
  if (typeof c.id !== 'string' || !HANDMADE_ID_RE.test(c.id)) return undefined;
  if (!HANDMADE_KINDS.includes(c.kind as HandmadeKind) || typeof c.name !== 'string' || typeof c.xml !== 'string') return undefined;
  if (!contractSaid(c.kernel) || !validWandererId(c.author) || !isDate(c.made) || !isDate(c.changed)) return undefined;
  // A card of an older contract reads in this one through the migration of the programs (T342: its digits `#d`, the same voxels).
  const ported = portedProgram(c.xml, contractSaid(c.kernel)!);
  const card: HandmadeCard = { id: c.id, kind: c.kind as HandmadeKind, name: c.name, xml: ported.xml, kernel: ported.contract, author: c.author, made: c.made, changed: c.changed };
  if (card.kind === 'model') {
    if (!classOf(c.class as string)) return undefined;
    card.class = c.class as string;
    if (SIZE_TIERS.some((t) => t.id === c.size)) card.size = c.size as SizeTier;
  }
  const from = c.from as Record<string, unknown> | undefined;
  if (from && isPrint(from.fingerprint)) {
    if (typeof from.universe === 'string' && typeof from.model === 'string') card.from = { universe: from.universe, model: from.model, fingerprint: from.fingerprint };
    else if (typeof from.card === 'string' && HANDMADE_ID_RE.test(from.card)) card.from = { card: from.card, fingerprint: from.fingerprint };
  }
  const origins = readOrigins(c.origins);
  if (origins.length) card.origins = origins;
  return card;
}

/** An account's file, read: the cards that are cards, the signature if it is one. */
export function readHandmadeRecord(raw: unknown, author?: string): HandmadeRecord {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const cards: HandmadeCard[] = [];
  const unread: unknown[] = [];
  for (const entry of Array.isArray(r.cards) ? r.cards : []) {
    const card = readHandmadeCard(entry);
    if (card && (author === undefined || card.author === author)) cards.push(card);
    // What has a card's id is a card, even if not one this kernel reads: it is not lost at the next write. The rest is not a card.
    else if (entry && typeof entry === 'object' && HANDMADE_ID_RE.test(String((entry as { id?: unknown }).id))) unread.push(entry);
  }
  const signature = cleanText(r.signature, SIGNATURE_MAX, 'la firma');
  return { ...('text' in signature ? { signature: signature.text } : {}), cards, ...(unread.length ? { unread } : {}) };
}

/** What anyone with an account may read of a card (rule 8f: by list). Not who made it, but how they sign; not the chain nor the fingerprints. */
export interface HandmadeSummary {
  id: string;
  kind: HandmadeKind;
  name: string;
  class?: string;
  size?: SizeTier;
  kernel: string;
  /** The author's signature, or empty. */
  signature: string;
  /** Whether it is the card of who asks. */
  mine: boolean;
  from?: { universe: string; model: string } | { card: string };
  made: string;
  changed: string;
  /** The program's length, in characters. */
  length: number;
}

/** A card opened: its summary and its program; its author also sees its chain. */
export interface HandmadeView extends HandmadeSummary {
  xml: string;
  origins?: CardOrigin[];
}

export function handmadeSummary(card: HandmadeCard, signature: string | undefined, mine: boolean): HandmadeSummary {
  const from = card.from && ('card' in card.from ? { card: card.from.card } : { universe: card.from.universe, model: card.from.model });
  return {
    id: card.id,
    kind: card.kind,
    name: card.name,
    ...(card.class ? { class: card.class } : {}),
    ...(card.size ? { size: card.size } : {}),
    kernel: card.kernel,
    signature: signature ?? '',
    mine,
    ...(from ? { from } : {}),
    made: card.made,
    changed: card.changed,
    length: card.xml.length,
  };
}

export function handmadeView(card: HandmadeCard, signature: string | undefined, mine: boolean): HandmadeView {
  return { ...handmadeSummary(card, signature, mine), xml: card.xml, ...(mine && card.origins?.length ? { origins: card.origins } : {}) };
}
