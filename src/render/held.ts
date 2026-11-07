// What a figure wields, on it (T288, ADR-0167): the thing's mesh from the ground, the very geometry every instance shares (on the
// ground, on a shelf, in every hand), hung on the pivot of the arm its mount takes and posed by `holdPose` (src/mj/hold.ts), so it
// swings with the arm and turns with the body. A change of what is held makes two objects and nothing else: the grip of a form is
// read once from its grid, the hands of a figure once from its model's (models.ts), and no program runs again for it.

import * as THREE from 'three';
import type { Id } from '../kernel/ecs';
import type { Form } from '../kernel/forms';
import type { Kernel } from '../kernel/kernel';
import type { ItemDef } from '../kernel/types';
import { chooseHand, gripOf, holdPose, MOUNTS, mountOf, type Grip, type Hand } from '../mj/hold';
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
}

/** A view that can hold: its limbs (the arms with their hand), and what it holds. */
export interface Holder {
  limbs: Array<{ pivot: THREE.Object3D; hand?: Hand }>;
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

/** The item a slot of an inventory holds, read without trusting it: a component Lua may have written. */
function equipped(inv: unknown): string | undefined {
  if (!inv || typeof inv !== 'object') return undefined;
  const { slots, equipped: at } = inv as { slots?: unknown; equipped?: unknown };
  if (!Array.isArray(slots) || typeof at !== 'number' || !Number.isInteger(at)) return undefined;
  const item = (slots[at] as { item?: unknown } | null | undefined)?.item;
  return typeof item === 'string' && item ? item : undefined;
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
export function hold(k: Kernel, view: Holder, item: string | undefined, material: THREE.Material, t: number, mark?: (o: THREE.Object3D) => void): void {
  const was = view.holding;
  if (!item && !was?.holder) return;
  // A frame like the one before costs a lookup: the definition is made anew when the universe is read again, a form that gets
  // ready (or a model that arrives) bumps the version.
  const def = item ? k.content.get(item) : undefined;
  if (was && was.item === item && was.def === def && was.version === k.forms.version) {
    if (was.frames.length) showFrame(was.frames, t);
    return;
  }
  const seen = { item, def, version: k.forms.version };
  let key = '';
  let f: Form | undefined;
  let mountId: ReturnType<typeof mountOf> | undefined;
  let limb: Holder['limbs'][number] | undefined;
  // A thing this client does not know (its pack has not arrived, or it is gone) has no look: nothing, not the generic one.
  if (item && def) {
    const look = k.itemLook(item);
    f = k.forms.ready(look.model, look.seed, look.tint);
    mountId = mountOf(def.slot);
    limb = chooseHand(view.limbs, MOUNTS[mountId].side);
    if (f && limb && geoOf(f) && gripFor(f)) key = `${f.key}|${mountId}|${view.limbs.indexOf(limb)}`;
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
  const pose = holdPose(gripFor(f)!, MOUNTS[mountId], limb.hand);
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
  limb.pivot.add(holder);
  view.holding = { key, holder, frames, ...seen };
}
