// What a figure wears, on it (T290, ADR-0180): the body of its form remade in what it wears, in a worker (formmeshes.ts,
// `dressMeshes`), by the things' own worn rules where they have them for that zone (way B) and by their colours otherwise (way C),
// as the author chose on the bench of T289. Asked when what it wears changes (or its form, or a thing's form gets ready); until it
// arrives the figure keeps the body it has, so a change of clothes never shows a stand-in. The same things on the same form make one
// body, shared by whoever wears them; its geometries are kept with the forms' (models.ts) and go as they do when nothing draws them.

import type { Id } from '../kernel/ecs';
import { instanceGrid, type Form, type FormComp } from '../kernel/forms';
import type { Kernel } from '../kernel/kernel';
import { readWorn, wornItems, WORN_ZONES, type WornZone } from '../kernel/wearing';
import { hexColor } from '../mj/palette';
import { backgroundOf, mainColors, wornProgram, type WornPiece } from '../mj/worn';
import type { PaletteEntry } from '../mj/engine';
import { dressMeshes, type DressedMeshes, type DressRequest } from './formmeshes';
import { cachedGeometry, keepGeometry, type ModelGeo } from './models';

/**
 * What an entity wears, zone → the thing's id: the wanderer, from its inventory; another wanderer, as the server says (`remote.worn`);
 * an individual, from its inventory if it has marks (none has today: nothing dresses them yet).
 */
export function wornBy(k: Kernel, id: Id): Partial<Record<WornZone, string>> {
  const remote = id === k.wandererEntity ? undefined : k.ecs.get(id, 'remote');
  if (remote) return readWorn(remote.worn) ?? {};
  const inv = k.ecs.get(id, 'inventory');
  if (!inv?.worn) return {};
  return wornItems(inv, (item) => k.wornZone(item));
}

/** A runner that dresses figures off the page (the browser's `WorkerRunner`); without one they are dressed here (tests, Node). */
interface Dresser {
  dress(key: string, req: DressRequest): Promise<DressedMeshes>;
}

/** The colours of a thing's form (way C), read once per form. */
const colorsOf = new Map<string, PaletteEntry[]>();
/** The worn program of a thing's form for a zone (way B), or null: made once per form and zone. */
const programs = new Map<string, string | null>();

const bounded = <V>(m: Map<string, V>, key: string, v: V): V => {
  if (m.size >= 512) m.delete(m.keys().next().value!);
  m.set(key, v);
  return v;
};

/** The colours of a thing: its form's two main ones, or its pack's colour when its form failed or shows nothing. */
function thingColors(f: Form | undefined, fallback: string | undefined): PaletteEntry[] {
  const own = f?.result ? (colorsOf.get(f.key) ?? bounded(colorsOf, f.key, mainColors(f.result.grid, f.result.palette))) : [];
  if (own.length) return own;
  const hex = hexColor(fallback);
  return hex ? [{ color: hex }] : [];
}

/** The worn program of a thing for a zone, from its model as it is written (its form's palette, its tint too), or undefined. */
function thingProgram(k: Kernel, f: Form, model: string, zone: WornZone): string | undefined {
  const key = `${f.key}|${zone}`;
  let p = programs.get(key);
  if (p === undefined) {
    p = null;
    const xml = k.forms.file(`${model}.xml`);
    const background = xml && backgroundOf(xml);
    if (xml && background && f.result) {
      try {
        p = wornProgram(xml, zone, { background, palette: f.result.palette }) ?? null;
      } catch {
        // A section that cannot be one (its letters are the kernel's): the thing is worn by its colours.
        p = null;
      }
    }
    bounded(programs, key, p);
  }
  return p ?? undefined;
}

/**
 * The pieces a figure wears, as the worker wants them, and what they are made of (the things' forms, a key); undefined while a
 * thing's form is on its way (the figure waits for it as it is). A thing this client does not know shows nothing, as in hand (ADR-0167).
 */
export function piecesOf(k: Kernel, outfit: Partial<Record<WornZone, string>>): { pieces: WornPiece[]; key: string } | undefined {
  const pieces: WornPiece[] = [];
  const key: string[] = [];
  for (const zone of WORN_ZONES) {
    const item = outfit[zone];
    const def = item ? k.content.get(item) : undefined;
    if (!item || !def) continue;
    const look = k.itemLook(item);
    const f = k.forms.get(look.model, look.seed, look.tint);
    if (f?.status === 'pending') return undefined;
    const ready = f?.status === 'ready' ? f : undefined;
    const colors = thingColors(ready, def.color);
    if (!colors.length) continue;
    const program = ready ? thingProgram(k, ready, look.model, zone) : undefined;
    pieces.push({ zone, colors, ...(program ? { program } : {}) });
    key.push(`${zone}=${ready ? ready.key : `pack:${def.color}`}`);
  }
  return { pieces, key: key.join(';') };
}

/** Where each dressing is: asked and on its way, made (its geometry in models.ts under its key), or failed (the figure stays as it is). */
const states = new Map<string, 'pending' | 'done' | 'failed'>();

function remember(key: string, state: 'pending' | 'done' | 'failed'): void {
  states.delete(key);
  states.set(key, state);
  if (states.size > 1024) states.delete(states.keys().next().value!);
}

/**
 * The figure of form `f` (the instance's `fc`, its actions done) in `outfit`: its geometries and their key when they are made, else
 * undefined (asked now if they were not). Nothing worn, or nothing this client knows, is undefined too: the form's own body.
 */
export function dressedFor(k: Kernel, f: Form, fc: FormComp | undefined, outfit: Partial<Record<WornZone, string>>): { key: string; geo: ModelGeo } | undefined {
  if (!f.result) return undefined;
  let any = false;
  for (const z of WORN_ZONES) if (outfit[z]) any = true;
  if (!any) return undefined;
  const made = piecesOf(k, outfit);
  if (!made?.pieces.length) return undefined;
  const done = fc?.done ?? [];
  const key = `dressed|${f.key}|${done.join(',')}|${made.key}`;
  const state = states.get(key);
  if (state === 'done') {
    const geo = cachedGeometry(key);
    if (geo) return { key, geo };
    // Let go of while nothing drew it: made again (the runner may still have the meshes).
  } else if (state) return undefined;
  const grid = done.length ? instanceGrid(k.forms, f, done) : f.result.grid;
  const req: DressRequest = { grid: { X: grid.X, Y: grid.Y, Z: grid.Z, cells: grid.cells, alphabet: [...grid.alphabet] }, palette: f.result.palette, vpt: f.vpt, pieces: made.pieces, seed: f.seed };
  const dresser = k.forms.runner as Partial<Dresser>;
  const arrived = (m: DressedMeshes) => {
    keepGeometry(key, m);
    remember(key, 'done');
  };
  if (typeof dresser.dress !== 'function') {
    try {
      arrived(dressMeshes(req));
      return { key, geo: cachedGeometry(key)! };
    } catch {
      remember(key, 'failed');
      return undefined;
    }
  }
  remember(key, 'pending');
  dresser.dress(key, req).then(arrived, () => remember(key, 'failed'));
  return undefined;
}
