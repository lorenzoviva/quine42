// Inventories: fixed slots, stacks, weight, one equipped slot. Pure functions over component data,
// shared by the player and by NPCs (who can give things away).

import type { ItemSpec } from './types';

export interface Slot {
  item: string;
  count: number;
  /** Contents, for items that are containers (bags, pouches): never stacked. */
  inv?: Inventory;
}

export interface Inventory {
  slots: Array<Slot | null>;
  /** Index of the equipped slot (the item held in hand), or null. */
  equipped: number | null;
}

export const SLOTS = 24;
export const HOTBAR = 6;
/** Weight carried without slowing down. */
export const CARRY_CAPACITY = 20;

export type ItemLookup = (item: string) => ItemSpec | undefined;

export function newInventory(size = SLOTS): Inventory {
  return { slots: Array.from({ length: size }, () => null), equipped: null };
}

const maxStack = (spec: ItemSpec | undefined) => (spec?.stackable ? Math.max(1, spec.maxStack) : 1);

/** Adds up to n items; returns how many fit. */
export function addItem(inv: Inventory, item: string, n: number, spec: ItemSpec | undefined): number {
  let left = Math.max(0, Math.floor(n));
  const cap = maxStack(spec);
  for (const s of inv.slots) {
    if (!left) break;
    if (s && s.item === item && s.count < cap) {
      const k = Math.min(left, cap - s.count);
      s.count += k;
      left -= k;
    }
  }
  for (let i = 0; i < inv.slots.length && left; i++) {
    if (inv.slots[i]) continue;
    const k = Math.min(left, cap);
    inv.slots[i] = { item, count: k };
    left -= k;
  }
  return Math.floor(n) - left;
}

/** Removes up to n items (equipped slot last); returns how many were removed. */
export function removeItem(inv: Inventory, item: string, n: number): number {
  let left = Math.max(0, Math.floor(n));
  const order = inv.slots.map((_, i) => i).sort((a, b) => (a === inv.equipped ? 1 : 0) - (b === inv.equipped ? 1 : 0) || b - a);
  for (const i of order) {
    const s = inv.slots[i];
    if (!left) break;
    if (!s || s.item !== item) continue;
    const k = Math.min(left, s.count);
    s.count -= k;
    left -= k;
    if (s.count <= 0) {
      inv.slots[i] = null;
      if (inv.equipped === i) inv.equipped = null;
    }
  }
  // Then from inside bags.
  for (const s of inv.slots) {
    if (!left) break;
    if (s?.inv) left -= removeItem(s.inv, item, left);
  }
  return Math.floor(n) - left;
}

/** How many, including what is inside bags and pouches. */
export function countItem(inv: Inventory, item: string): number {
  return inv.slots.reduce((n, s) => n + (s && s.item === item ? s.count : 0) + (s?.inv ? countItem(s.inv, item) : 0), 0);
}

/** Drag and drop: merges stacks of the same item, otherwise swaps. The equipped mark follows its item. */
export function moveSlot(inv: Inventory, from: number, to: number, lookup: ItemLookup): void {
  if (from === to || !inv.slots[from]) return;
  const a = inv.slots[from]!;
  const b = inv.slots[to];
  if (b && b.item === a.item) {
    const k = Math.min(a.count, maxStack(lookup(a.item)) - b.count);
    b.count += k;
    a.count -= k;
    if (a.count <= 0) {
      inv.slots[from] = null;
      if (inv.equipped === from) inv.equipped = to;
    }
    return;
  }
  inv.slots[to] = a;
  inv.slots[from] = b;
  if (inv.equipped === from) inv.equipped = to;
  else if (inv.equipped === to) inv.equipped = b ? from : null;
}

/** Takes n items out of a slot (all if omitted). */
export function takeFromSlot(inv: Inventory, index: number, n?: number): Slot | null {
  const s = inv.slots[index];
  if (!s) return null;
  const k = Math.min(s.count, n ?? s.count);
  s.count -= k;
  if (s.count <= 0) {
    inv.slots[index] = null;
    if (inv.equipped === index) inv.equipped = null;
    // A bag leaves with what is inside it.
    if (s.inv) return { item: s.item, count: k, inv: s.inv };
  }
  return { item: s.item, count: k };
}

/** Puts a taken slot back somewhere: bags (with contents) into an empty slot, the rest stacked. */
export function putSlot(inv: Inventory, slot: Slot, spec: ItemSpec | undefined): number {
  if (!slot.inv) return addItem(inv, slot.item, slot.count, spec);
  const i = inv.slots.indexOf(null);
  if (i < 0) return 0;
  inv.slots[i] = { item: slot.item, count: 1, inv: slot.inv };
  return 1;
}

export function totalWeight(inv: Inventory, lookup: ItemLookup): number {
  return inv.slots.reduce((w, s) => w + (s ? (lookup(s.item)?.weight ?? 1) * s.count + (s.inv ? totalWeight(s.inv, lookup) : 0) : 0), 0);
}

export function equippedItem(inv: Inventory): string | null {
  return inv.equipped !== null ? (inv.slots[inv.equipped]?.item ?? null) : null;
}
