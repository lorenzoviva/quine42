// The labs for the players (T294, ADR-0169): what a lab does with a handmade card (T293, ADR-0161), without the page. Where the copy comes
// from (the address: `?card=<id>` or `?fork=<universe>/<model>`), what can be forked from a universe (only what `publicFiles` gives: the
// models and their index), the draft that keeps the work of a page that was not saved, and what is sent to `/api/handmade`. Pure: the
// tests read it as the pages do (`tests/handmade-labs.test.ts`).

import { MODELS_DIR, MODELS_INDEX, rootTag, vptOf } from '../../src/kernel/forms';
import { cleanCardName, HANDMADE_CONTRACT, HANDMADE_ID_RE, NAME_MAX, type HandmadeKind, type HandmadeView } from '../../src/kernel/handmade';
import { internalFields } from '../../src/kernel/internalNames';
import { UNIVERSE_NAME_RE } from '../../src/kernel/paths';
import type { FileMap } from '../../src/kernel/types';
import { boxOf, classOf, SIZE_TIERS } from '../../src/mj/classes';
import type { Vec3 } from '../../src/mj/engine';
import { SOUND_CLASS } from '../../src/mj/sound';

/** The labs a player has (T294): the sandbox, the model editor, the SoundLab. Their folders under `/lab/`. */
export const PLAYER_LABS = ['3d', 'editor', 'suono'] as const;
export type PlayerLab = (typeof PLAYER_LABS)[number];

/** A model of a universe (`MODEL_RE`, without importing the validator's weight in a page). */
const MODEL_ID_RE = /^[a-z0-9][a-z0-9-]{0,40}$/i;

/** Where the copy a lab opens comes from: a model or a sound of a universe, or a card (one's own, or another's to look at). */
export type CardSource = { universe: string; model: string } | { card: string };

/** The source the address asks for, or undefined (free work). What does not read as one is none. */
export function sourceFromSearch(search: string): CardSource | undefined {
  const q = new URLSearchParams(search);
  const card = q.get('card');
  if (card !== null) return HANDMADE_ID_RE.test(card) ? { card } : undefined;
  const fork = q.get('fork');
  if (fork === null) return undefined;
  const [universe, model, ...rest] = fork.split('/');
  return !rest.length && UNIVERSE_NAME_RE.test(universe ?? '') && MODEL_ID_RE.test(model ?? '') ? { universe, model } : undefined;
}

/** The lab a kind of card is changed in: a model in the editor, a sound in the SoundLab. */
export const labOf = (kind: HandmadeKind): PlayerLab => (kind === 'sound' ? 'suono' : 'editor');

/** The address of a lab with this source, from the site's pages (`/site/…`) or the labs' (`/lab/…`): always from the root. */
export function labLink(lab: PlayerLab, source?: CardSource): string {
  const q = !source ? '' : 'card' in source ? `?card=${encodeURIComponent(source.card)}` : `?fork=${encodeURIComponent(`${source.universe}/${source.model}`)}`;
  return `/lab/${lab}/${q}`;
}

/** A program of a universe that can be forked: a model with its class and size, or a sound. */
export interface Forkable {
  id: string;
  kind: HandmadeKind;
  name: string;
  class?: string;
  size?: string;
  /** The voxels per tile its index entry says (the editor draws it at this density). */
  vpt: number;
  xml: string;
}

/**
 * What can be forked of a universe, from the files a player reads of it (`publicFiles`): every model of its index with its program,
 * models first, by name. The entries of an older contract read as this kernel's (`internalFields`); a class this kernel does not know is
 * not a model it could check, and is left out.
 */
export function forkables(files: FileMap): Forkable[] {
  let index: Record<string, unknown>;
  try {
    const raw = JSON.parse(files[MODELS_INDEX] ?? '{}');
    index = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return [];
  }
  const out: Forkable[] = [];
  for (const [id, raw] of Object.entries(index)) {
    const xml = files[`${MODELS_DIR}${id}.xml`];
    if (xml === undefined || !MODEL_ID_RE.test(id) || !raw || typeof raw !== 'object') continue;
    const info = internalFields('modelInfo', raw as Record<string, unknown>) as { class?: unknown; size?: unknown; name?: unknown; vpt?: unknown };
    const name = typeof info.name === 'string' && info.name.trim() ? info.name.trim() : id;
    if (info.class === SOUND_CLASS || info.class === 'sound') {
      out.push({ id, kind: 'sound', name, vpt: 20, xml });
      continue;
    }
    if (typeof info.class !== 'string' || !classOf(info.class)) continue;
    const size = SIZE_TIERS.some((t) => t.id === info.size) ? (info.size as string) : undefined;
    out.push({ id, kind: 'model', name, class: info.class, ...(size ? { size } : {}), vpt: vptOf({ class: info.class, vpt: info.vpt as number | undefined }), xml });
  }
  return out.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name, 'it') : a.kind === 'model' ? -1 : 1));
}

/** The box the game gives a model (`Forms`): none if its program says its own `size`, else its class's at its size. */
export function boxFor(xml: string, cls: string | undefined, size?: string): Vec3 | undefined {
  const c = classOf(cls);
  if (!c) return undefined;
  try {
    if (/\ssize="/.test(rootTag(xml))) return undefined;
  } catch {
    /* a text that does not read yet: the class's box, and the lab says what does not read */
  }
  return boxOf(c, size);
}

/** What a lab is working on: the program and what the card says of it. `base` is what it was when opened or saved last. */
export interface Draft {
  kind: HandmadeKind;
  xml: string;
  name: string;
  class?: string;
  size?: string;
  /** The program as it was opened or last saved: a draft that differs from it is work not saved. */
  base: string;
  /** The name, class and size as they were. */
  baseMeta?: string;
}

const metaOf = (d: Pick<Draft, 'name' | 'class' | 'size'>) => JSON.stringify([d.name, d.class ?? '', d.size ?? '']);

/** Whether there is something not saved. */
export const unsaved = (d: Draft): boolean => d.xml !== d.base || (d.baseMeta !== undefined && metaOf(d) !== d.baseMeta);

/** The draft that opens a fork of a universe's program: the name says it is a copy, cut to what a name may be. */
export function forkDraft(f: Forkable): Draft {
  const name = copyName(f.name);
  const d: Draft = { kind: f.kind, xml: f.xml, name, ...(f.class ? { class: f.class } : {}), ...(f.size ? { size: f.size } : {}), base: f.xml };
  d.baseMeta = metaOf(d);
  return d;
}

/** The draft that opens a card: as it is on the server. */
export function cardDraft(v: HandmadeView): Draft {
  const d: Draft = { kind: v.kind, xml: v.xml, name: v.name, ...(v.class ? { class: v.class } : {}), ...(v.size ? { size: v.size } : {}), base: v.xml };
  d.baseMeta = metaOf(d);
  return d;
}

/** «<name> (copia)», within the length of a name. */
export function copyName(name: string): string {
  const tail = ' (copia)';
  const head = [...name.replace(/\s+/g, ' ').trim()].slice(0, NAME_MAX - tail.length).join('').trim();
  return `${head || 'Programma'}${tail}`;
}

/** The program a model's card says: kind, class and size, the text. A sound has no class or size. */
function programPart(d: Draft): Record<string, unknown> {
  return d.kind === 'model' ? { kind: 'model', xml: d.xml, class: d.class, ...(d.size ? { size: d.size } : {}) } : { kind: 'sound', xml: d.xml };
}

/** The body that makes a new card of a draft (POST /api/handmade): from where it was forked, if from anywhere; the contract it is written for. */
export function createBody(d: Draft, source?: CardSource): Record<string, unknown> {
  return { ...programPart(d), name: d.name, kernel: HANDMADE_CONTRACT, ...(source ? { from: 'card' in source ? { card: source.card } : { universe: source.universe, model: source.model } } : {}) };
}

/** The body that changes one's own card (POST /api/handmade/<id>): only what changed; the program with its contract. Undefined: nothing to save. */
export function updateBody(d: Draft, card: Pick<HandmadeView, 'name' | 'class' | 'size' | 'xml'>): Record<string, unknown> | undefined {
  const body: Record<string, unknown> = {};
  if (d.name !== card.name) body.name = d.name;
  const programChanged = d.xml !== card.xml || (d.kind === 'model' && ((d.class ?? '') !== (card.class ?? '') || (d.size ?? '') !== (card.size ?? '')));
  if (programChanged) {
    body.xml = d.xml;
    body.kernel = HANDMADE_CONTRACT;
    if (d.kind === 'model') {
      body.class = d.class;
      body.size = d.size ?? null;
    }
  }
  return Object.keys(body).length ? body : undefined;
}

/** Why a draft cannot be sent yet, said before asking the server (which checks it again, and alone decides). */
export function draftProblems(d: Draft): string[] {
  const problems: string[] = [];
  const name = cleanCardName(d.name);
  if ('error' in name) problems.push(name.error);
  if (!d.xml.trim()) problems.push('manca il programma');
  if (d.kind === 'model' && !classOf(d.class)) problems.push('scegli la classe del modello');
  return problems;
}

/** What the server said when it refused: its reason and, for a program, every motive of the check. */
export function reasonsOf(body: unknown): string[] {
  const b = body && typeof body === 'object' ? (body as { reason?: unknown; errors?: unknown; error?: unknown }) : {};
  const head = typeof b.reason === 'string' ? b.reason : typeof b.error === 'string' ? b.error : 'il server non ha risposto';
  const errors = Array.isArray(b.errors) ? b.errors.filter((e): e is string => typeof e === 'string').slice(0, 20) : [];
  return [head, ...errors];
}

// --- The draft in the browser: work not saved stays on this machine ------------------------------------------------------------------

/** Where a lab keeps the draft of a source (or of free work): one per lab and source. */
export function draftKey(lab: PlayerLab, source?: CardSource): string {
  const what = !source ? 'new' : 'card' in source ? `card:${source.card}` : `fork:${source.universe}/${source.model}`;
  return `quine:lab:${lab}:${what}`;
}

/** A draft read back, or undefined if what is there is not one (another version's, a broken text). */
export function readDraft(text: string | null | undefined, kind: HandmadeKind): Draft | undefined {
  if (!text) return undefined;
  try {
    const d = JSON.parse(text) as Partial<Draft>;
    if (d.kind !== kind || typeof d.xml !== 'string' || typeof d.name !== 'string' || typeof d.base !== 'string') return undefined;
    return {
      kind,
      xml: d.xml,
      name: d.name,
      ...(typeof d.class === 'string' ? { class: d.class } : {}),
      ...(typeof d.size === 'string' ? { size: d.size } : {}),
      base: d.base,
      ...(typeof d.baseMeta === 'string' ? { baseMeta: d.baseMeta } : {}),
    };
  } catch {
    return undefined;
  }
}

/**
 * The draft a lab opens with: what the server has (`fresh`), unless this machine kept work not saved on the same base. If the card changed
 * on the server meanwhile (saved elsewhere), the server's wins and the kept work is said, not lost: `kept` is it.
 */
export function resume(fresh: Draft, kept: Draft | undefined): { draft: Draft; resumed: boolean; kept?: Draft } {
  if (!kept || !unsaved(kept)) return { draft: fresh, resumed: false };
  if (kept.base === fresh.base) return { draft: { ...kept, baseMeta: fresh.baseMeta ?? kept.baseMeta }, resumed: true };
  return { draft: fresh, resumed: false, kept };
}

/** After a save: what was sent is the new base. */
export function saved(d: Draft): Draft {
  return { ...d, base: d.xml, baseMeta: metaOf(d) };
}
