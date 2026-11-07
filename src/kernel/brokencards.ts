// The cards that came with a choice and do not work in this world (T296, ADR-0172). A brought card passed the check of the server it came in
// through (ADR-0170), on the seeds of its class and in the box of the check; in a world it runs with other seeds, other boxes, other
// browsers, and it may still fail: its program throws or stops a worker (a fault), it makes nothing to see (empty), its form does not stop
// a body that is solid (footless), a sound is silent (mute). Then it is isolated: what wore it wears the generic model of its class, the
// sound is silent, the master is told why; the master takes it away from the console, with a commit. Here what needs no kernel: what a
// broken card is, which entries of a library are the same card, what taking it away changes, what the wire says, read.

import { readIndex } from './bring';
import { MODELS_DIR, MODELS_INDEX } from './forms';
import type { FileMap } from './types';
import { SOUND_CLASS } from '../mj/sound';

/** How a brought card fails in a world: its program throws or stops a worker, makes nothing to see, does not stop a solid body, is silent. */
export type BreakKind = 'fault' | 'empty' | 'footless' | 'mute';
export const BREAK_KINDS: readonly BreakKind[] = ['fault', 'empty', 'footless', 'mute'];

/** A brought card that does not work in this world, and why: what the master is shown. */
export interface BrokenCard {
  id: string;
  name: string;
  kind: 'model' | 'sound';
  why: BreakKind;
  reason: string;
  /** Broken because it is the same program as this card, which failed: a copy the `ModelDirector` took under another id (T295). */
  same?: string;
}

/** What taking a card away came to: the ids gone (the card and its copies) and the commit, or why not. */
export interface RemoveCardAnswer {
  ok: boolean;
  reason?: string;
  /** What the master reads: what went, and what comes in its place. */
  text?: string;
  removed?: string[];
  commit?: string;
}

/** A model's id, as the library names them (validator.ts `MODEL_RE`). */
export const CARD_ID_RE = /^[a-z0-9][a-z0-9-]{0,40}$/i;

/** The most cards a list on the wire says: far more than a choice brings (24, `BRING_MAX`), with their copies. */
export const MAX_BROKEN = 64;
const MAX_NAME = 120;
const MAX_REASON = 300;

/** One line of plain text, at most `max` characters: a reason may carry what an engine or a worker said. */
export const reasonText = (text: unknown, max = MAX_REASON): string =>
  String(text ?? '')
    .replace(/[\s\u0000-\u001f\u007f]+/g, ' ')
    .trim()
    .slice(0, max);

/** The fault a broken card opens (`card:<id>`), as the master reads it in the HUD and in the console. */
export const brokenFault = (b: Pick<BrokenCard, 'name' | 'reason'>): string => `la carta «${b.name}» non funziona in questo mondo: ${b.reason}`;

/** What the master reads of a failure: what happened, on which seed; the details of the engine at the end. */
export function breakReason(why: BreakKind, detail: { seed?: number; error?: string } = {}): string {
  const seed = Number.isInteger(detail.seed) ? ` (seme ${detail.seed})` : '';
  switch (why) {
    case 'fault':
      return reasonText(`il programma si guasta${seed}: ${detail.error ?? 'senza un motivo'}`);
    case 'empty':
      return reasonText(`il programma non produce niente${seed}: nessun voxel visibile`);
    case 'footless':
      return reasonText(`forma senza impronta${seed}: è una cosa solida, ma il suo modello non ferma nessuno`);
    case 'mute':
      return reasonText(`il suono è muto: ${detail.error ?? 'non suona nulla'}`);
  }
}

/**
 * The entries of a library that are the same brought card as `id`: from the same place (`brought`), with the same card (its stamp and its
 * chain) and the same program, as the `ModelDirector` copies a brought model under the id of a request (`reused`, T295) or shares it with
 * another size (`shared`, ADR-0160). Two cards of one universe with one program are two cards: their chains end with other fingerprints.
 * `id` first; nothing if `id` is not a brought card.
 */
export function cardFamily(files: FileMap, id: string): string[] {
  const index = readIndex(files);
  const from = index[id]?.brought;
  const xml = files[`${MODELS_DIR}${id}.xml`];
  if (typeof from !== 'string' || xml === undefined) return [];
  const card = JSON.stringify(index[id].card ?? null);
  const same = Object.keys(index)
    .filter((other) => other !== id && index[other]?.brought === from && files[`${MODELS_DIR}${other}.xml`] === xml && JSON.stringify(index[other].card ?? null) === card)
    .sort();
  return [id, ...same];
}

/** Whether an entry of a library is a brought card, a sound or a model. */
export function broughtKind(files: FileMap, id: string): 'model' | 'sound' | undefined {
  const e = readIndex(files)[id];
  if (typeof e?.brought !== 'string' || files[`${MODELS_DIR}${id}.xml`] === undefined) return undefined;
  return e.class === SOUND_CLASS ? 'sound' : 'model';
}

/**
 * What taking cards away from a universe changes: their programs gone, their entries out of the index; every other entry as it is on the
 * disk, field by field (the index is written as `addModel` writes it). Nothing else: the uses already counted (`world/cards.json`) stay, and
 * the card stays where it came from (the universe of its card, the archive of its author).
 */
export function withoutCards(files: FileMap, ids: readonly string[]): Record<string, string | null> {
  let raw: unknown;
  try {
    raw = JSON.parse(files[MODELS_INDEX] ?? '{}');
  } catch {
    raw = {};
  }
  const index: Record<string, unknown> = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...(raw as Record<string, unknown>) } : {};
  const out: Record<string, string | null> = {};
  for (const id of ids) {
    delete index[id];
    if (files[`${MODELS_DIR}${id}.xml`] !== undefined) out[`${MODELS_DIR}${id}.xml`] = null;
  }
  out[MODELS_INDEX] = JSON.stringify(index, null, 1) + '\n';
  return out;
}

/** A list of broken cards as the wire says it (the world's, to its clients): what does not read as one is left out, never taken for another thing. */
export function readBrokenCards(raw: unknown): BrokenCard[] {
  if (!Array.isArray(raw)) return [];
  const out: BrokenCard[] = [];
  for (const r of raw.slice(0, MAX_BROKEN)) {
    const o = r && typeof r === 'object' ? (r as Record<string, unknown>) : {};
    if (typeof o.id !== 'string' || !CARD_ID_RE.test(o.id) || !BREAK_KINDS.includes(o.why as BreakKind) || (o.kind !== 'model' && o.kind !== 'sound')) continue;
    const same = typeof o.same === 'string' && CARD_ID_RE.test(o.same) ? o.same : undefined;
    out.push({ id: o.id, name: reasonText(o.name, MAX_NAME) || o.id, kind: o.kind, why: o.why as BreakKind, reason: reasonText(o.reason), ...(same ? { same } : {}) });
  }
  return out;
}

/** A brought card as the console of the master shows it: its family (the copies under other ids), where it came from, whether it works here. */
export interface BroughtCardView {
  id: string;
  name: string;
  kind: 'model' | 'sound';
  /** Its class, for a model. */
  class?: string;
  /** The universe it came from, or `.handmade`. */
  from: string;
  /** The other ids the same card is in the library under (copies the `ModelDirector` took, T295). */
  copies: string[];
  /** Why it does not work in this world, if it does not. */
  broken?: BrokenCard;
}

/** The brought cards of a library, one per family (the first id in order, its copies with it), with what is broken of them. */
export function broughtCardsOf(files: FileMap, broken: ReadonlyMap<string, BrokenCard>): BroughtCardView[] {
  const index = readIndex(files);
  const seen = new Set<string>();
  const out: BroughtCardView[] = [];
  for (const id of Object.keys(index).sort()) {
    const e = index[id];
    if (seen.has(id) || typeof e?.brought !== 'string' || files[`${MODELS_DIR}${id}.xml`] === undefined) continue;
    const family = cardFamily(files, id);
    for (const f of family) seen.add(f);
    const failing = family.map((f) => broken.get(f)).find((b) => b && !b.same) ?? family.map((f) => broken.get(f)).find(Boolean);
    out.push({
      id,
      name: reasonText(e.name, MAX_NAME) || id,
      kind: e.class === SOUND_CLASS ? 'sound' : 'model',
      ...(e.class !== SOUND_CLASS && typeof e.class === 'string' ? { class: e.class } : {}),
      from: e.brought,
      copies: family.slice(1),
      ...(failing ? { broken: failing } : {}),
    });
  }
  return out;
}
