// What a figure wields, on it (T288, ADR-0167): the thing's mesh from the ground, the very geometry every instance shares (on the
// ground, on a shelf, in every hand), hung on the pivot of the arm its mount takes and posed by `holdPose` (src/mj/hold.ts), so it
// swings with the arm and turns with the body. A change of what is held makes two objects and nothing else: the grip of a form is
// read once from its grid, the hands of a figure once from its model's (models.ts), and no program runs again for it. A thing of the
// world carried (T292) rides over the head instead, on the body, its arms up (`overheadPose`), with the seed of its look as it stood.

import * as THREE from 'three';
import type { Id } from '../kernel/ecs';
import type { Form } from '../kernel/forms';
import type { Kernel } from '../kernel/kernel';
import type { ItemDef } from '../kernel/types';
import { isThing, thingSeed } from '../kernel/moving';
import { boxOf, chooseHand, gripOf, holdPose, MOUNTS, mountOf, overheadPose, type Grip, type Hand, type MountId } from '../mj/hold';
import type { Vec3 } from '../mj/engine';
import { casts } from './materials';
import { geoOf, modelMaterials, showFrame } from './models';

/** What a view holds now: the holder hung on an arm, the frames of an animated thing, and what it was made of (`key`). */
export interface Holding {
  key: string;
  holder?: THREE.Group;
  frames: THREE.Mesh[];
  /** What it was looked up from: while the item, its definition and the forms' version stay, nothing is looked up again. */
  item?: string;
  def?: ItemDef;
  version?: number;
  /** The seed of a thing of the world carried, as it stood (T292). */
  seed?: number;
  /** Carried over the head (T292): the arms stay up while it is. */
  overhead?: boolean;
}

/** A view that can hold: its body (what a thing over the head rides on), its limbs (the arms with their hand), and what it holds. */
export interface Holder {
  body?: THREE.Object3D;
  limbs: Array<{ pivot: THREE.Object3D; hand?: Hand; part?: string }>;
  holding?: Holding;
}

const grips = new Map<string, Grip | null>();

/** The grip of a ready form, read once from its grid (a form is of a program as it is written: its key changes with it). */
export function gripFor(f: Form): Grip | undefined {
  let g = grips.get(f.key);
  if (g === undefined) {
    g = (f.result && gripOf(f.result.grid, f.result.palette, f.vpt)) ?? null;
    grips.set(f.key, g);
  }
  return g ?? undefined;
}

const boxes = new Map<string, { min: Vec3; max: Vec3 } | null>();

/** The box of a ready form's voxels, read once from its grid (T292: what is carried over the head is sized by it). */
export function boxFor(f: Form): { min: Vec3; max: Vec3 } | undefined {
  let b = boxes.get(f.key);
  if (b === undefined) {
    b = (f.result && boxOf(f.result.grid, f.result.palette, f.vpt)) ?? null;
    boxes.set(f.key, b);
  }
  return b ?? undefined;
}

/** The slot of an inventory held in hand, read without trusting it: a component Lua may have written. */
function equippedSlot(inv: unknown): { item: string; thing?: unknown } | undefined {
  if (!inv || typeof inv !== 'object') return undefined;
  const { slots, equipped: at } = inv as { slots?: unknown; equipped?: unknown };
  if (!Array.isArray(slots) || typeof at !== 'number' || !Number.isInteger(at)) return undefined;
  const slot = slots[at] as { item?: unknown; thing?: unknown } | null | undefined;
  return typeof slot?.item === 'string' && slot.item ? (slot as { item: string; thing?: unknown }) : undefined;
}

/** The item a slot of an inventory holds in hand. */
const equipped = (inv: unknown): string | undefined => equippedSlot(inv)?.item;

/**
 * The seed of the look of a thing of the world an entity carries (T292): the wanderer's, from its slot; another wanderer's, as the
 * server says it (`remote.heldSeed`). Undefined for anything else: its look is its item's.
 */
export function heldSeedOf(k: Kernel, id: Id): number | undefined {
  const remote = id === k.wandererEntity ? undefined : k.ecs.get(id, 'remote');
  if (remote) return typeof remote.heldSeed === 'number' && Number.isInteger(remote.heldSeed) ? remote.heldSeed : undefined;
  return thingSeed(equippedSlot(k.ecs.get(id, 'inventory')));
}

/**
 * What an entity holds: the wanderer, what it wields; another wanderer, what the server says they wield (`remote.held`); an
 * individual, the thing of its inventory in hand, if it has one (none has today: nothing gives them one).
 */
export function heldBy(k: Kernel, id: Id): string | undefined {
  const remote = id === k.wandererEntity ? undefined : k.ecs.get(id, 'remote');
  if (remote) return typeof remote.held === 'string' && remote.held ? remote.held : undefined;
  return equipped(k.ecs.get(id, 'inventory'));
}

/**
 * Shows on `view` the thing `item` (nothing if undefined): with its mesh of the ground, on the arm of its mount, as its grip says.
 * Nothing shows while its form is not ready, for a thing without a model or that the client does not know, on a body without
 * arms. `mark` tags what is added as the rest of the view is tagged; `material` is the body's (the wanderer's is never cut).
 */
export function hold(k: Kernel, view: Holder, item: string | undefined, material: THREE.Material, t: number, mark?: (o: THREE.Object3D) => void, seed?: number): void {
  const was = view.holding;
  if (!item && !was?.holder) return;
  // A frame like the one before costs a lookup: the definition is made anew when the universe is read again, a form that gets
  // ready (or a model that arrives) bumps the version.
  const def = item ? k.content.get(item) : undefined;
  if (was && was.item === item && was.def === def && was.version === k.forms.version && was.seed === seed) {
    if (was.frames.length) showFrame(was.frames, t);
    return;
  }
  const overhead = isThing(item);
  const seen = { item, def, version: k.forms.version, seed, overhead };
  let key = '';
  let f: Form | undefined;
  let mountId: MountId | undefined;
  let limb: Holder['limbs'][number] | undefined;
  // A thing this client does not know (its pack has not arrived, or it is gone) has no look: nothing, not the generic one.
  if (item && def) {
    const look = k.itemLook(item, seed);
    f = k.forms.ready(look.model, look.seed, look.tint);
    // A thing of the world carried goes over the head (T292), on the body: it needs arms to hold it up, and a body to ride on.
    mountId = overhead ? 'overhead' : mountOf(def.slot);
    limb = chooseHand(view.limbs, MOUNTS[mountId].side);
    if (overhead) {
      if (f && limb && view.body && geoOf(f) && boxFor(f)) key = `${f.key}|overhead`;
    } else if (f && limb && geoOf(f) && gripFor(f)) key = `${f.key}|${mountId}|${view.limbs.indexOf(limb)}`;
  }
  if (was && was.key === key) {
    view.holding = { ...was, ...seen };
    showFrame(was.frames, t);
    return;
  }
  was?.holder?.removeFromParent();
  view.holding = { key, frames: [], ...seen };
  if (!key || !f || !limb?.hand || !mountId) return;
  const g = geoOf(f)!;
  const hands = view.limbs.flatMap((l) => (l.hand ? [l.hand] : []));
  const pose = overhead ? overheadPose(boxFor(f)!, hands) : holdPose(gripFor(f)!, MOUNTS[mountId], limb.hand);
  const holder = new THREE.Group();
  holder.position.set(...pose.position);
  holder.quaternion.set(...pose.quaternion);
  holder.scale.setScalar(pose.scale);
  const mesh = (geo: THREE.BufferGeometry) => {
    const m = casts(new THREE.Mesh(geo, modelMaterials(geo, material)), true);
    m.position.set(...pose.offset);
    holder.add(m);
    return m;
  };
  const body = mesh(g.body);
  // An animated thing (a flame) shows one frame at a time instead of its body, as on the ground.
  const frames = g.frames.map((geo) => {
    const m = mesh(geo);
    m.visible = false;
    return m;
  });
  if (frames.length) body.visible = false;
  showFrame(frames, t);
  if (mark) holder.traverse(mark);
  (overhead ? view.body! : limb.pivot).add(holder);
  view.holding = { key, holder, frames, ...seen };
}
