// What a wanderer wears (T290, ADR-0180): a thing of the inventory marked as worn on a zone of the body (`Inventory.worn`: zone →
// slot), as the thing held in hand is marked (`equipped`). It stays in the inventory (its weight counts, it can be dropped or given,
// and then it is no longer worn); the renderer dresses the body with it (src/mj/worn.ts), and another wanderer sees it on the wire
// (`OtherView.worn`, only the ids). The zones are three: the head, the torso and the back (T290; legs, feet and hands later).
//
// Which zone a thing goes on is its place (`ItemDef.slot`, the `posto` of the Narrator's packs: «testa», «corpo», «schiena»…, in
// the language of the world as the packs write it today, and in English); a garment without a place (the seed's cloak) by the words
// of its name, in Italian and in English. Nothing here trusts what it reads: an inventory is a component Lua may have written.

import { normName, isCategory } from './content';
import { addItem, type Inventory } from './inventory';
import type { ItemDef, ItemSpec } from './types';
import { WORN_ZONES, type WornZone } from '../mj/worn';

export { WORN_ZONES, type WornZone } from '../mj/worn';

/** The places of the packs that go on a zone (`ItemDef.slot`), as the Narrator writes them and in English. */
export const SLOT_ZONES: Readonly<Record<string, WornZone>> = {
  testa: 'head',
  capo: 'head',
  head: 'head',
  corpo: 'torso',
  busto: 'torso',
  petto: 'torso',
  torso: 'torso',
  body: 'torso',
  chest: 'torso',
  schiena: 'back',
  spalle: 'back',
  back: 'back',
  shoulders: 'back',
};

/**
 * Words of the name of a garment without a place, by zone: the first said decides («Mantello con cappuccio» is a cloak). Italian
 * and English, as the fourth wall reads the world (ADR-0165); on the name as `normName` writes it (no accents, no articles).
 */
const GARMENT_WORDS: ReadonlyArray<readonly [WornZone, RegExp]> = [
  ['head', /\b(?:elm[oi]|elmett[oi]|cappell[oi]|cappucc(?:io|i)|berrett[oi]|cuffi[ae]|copricap[oi]|turbant[ei]|helm(?:et)?s?|hats?|hoods?|caps?|coifs?)\b/],
  ['torso', /\b(?:corazz[ae]|armatur[ae]|cott[ae]|giubb(?:a|e|ott[oi])|tunic(?:a|he)|camici[ae]|vest[ei]|vestit[oi]|gilet|corpett[oi]|pettoral[ei]|giacc(?:a|he)|farsett[oi]|usberg[oi]|cuirass(?:es)?|armou?rs?|tunics?|shirts?|vests?|jerkins?|doublets?|robes?|coats?|jackets?)\b/],
  ['back', /\b(?:mantell(?:[oiae]|in[ae])|capp[ae]|sciall[ei]|cloaks?|capes?|mantles?|shawls?)\b/],
];

/** The zone a thing goes on, or undefined if it is not worn there (a ring, boots, a sword; a place of another zone). */
export function wornZoneOf(def: Pick<ItemDef, 'slot' | 'category' | 'name'> | undefined): WornZone | undefined {
  if (!def) return undefined;
  const slot = typeof def.slot === 'string' ? def.slot.toLowerCase().trim() : '';
  if (slot) return Object.hasOwn(SLOT_ZONES, slot) ? SLOT_ZONES[slot] : undefined;
  if (!isCategory(def, 'clothing') || typeof def.name !== 'string') return undefined;
  const name = normName(def.name);
  let best: [WornZone, number] | undefined;
  for (const [zone, re] of GARMENT_WORDS) {
    const m = re.exec(name);
    if (m && (!best || m.index < best[1])) best = [zone, m.index];
  }
  return best?.[0];
}

/** How a zone is said in the world (the inventory, the messages). */
export const ZONE_WORDS: Readonly<Record<WornZone, string>> = { head: 'sulla testa', torso: 'sul busto', back: 'sulla schiena' };

/**
 * What an inventory has on, read without trusting it (a component Lua may write, a file of the universe): zone → the slot, only where
 * the mark is a whole number, the slot holds a thing, and the thing goes on that zone (`zoneOf`, the content of the world).
 */
export function wornSlots(inv: unknown, zoneOf: (item: string) => WornZone | undefined): Partial<Record<WornZone, number>> {
  const out: Partial<Record<WornZone, number>> = {};
  if (!inv || typeof inv !== 'object') return out;
  const { slots, worn } = inv as { slots?: unknown; worn?: unknown };
  if (!Array.isArray(slots) || !worn || typeof worn !== 'object') return out;
  const used = new Set<number>();
  for (const zone of WORN_ZONES) {
    const at = (worn as Record<string, unknown>)[zone];
    if (typeof at !== 'number' || !Number.isInteger(at) || at < 0 || at >= slots.length || used.has(at)) continue;
    const item = (slots[at] as { item?: unknown } | null | undefined)?.item;
    if (typeof item !== 'string' || !item || zoneOf(item) !== zone) continue;
    out[zone] = at;
    used.add(at);
  }
  return out;
}

/** What an inventory has on, zone → the thing's id (`wornSlots`). */
export function wornItems(inv: unknown, zoneOf: (item: string) => WornZone | undefined): Partial<Record<WornZone, string>> {
  const out: Partial<Record<WornZone, string>> = {};
  const slots = (inv as { slots?: Array<{ item: string } | null> } | undefined)?.slots;
  for (const [zone, at] of Object.entries(wornSlots(inv, zoneOf)) as Array<[WornZone, number]>) out[zone] = slots![at]!.item;
  return out;
}

/**
 * Dresses an inventory as the kernel decides (an individual, T353): each thing of `outfit` on its zone, found in the slot it is in or
 * added (a trade's apron they did not carry); the zones not in `outfit` keep what they had. The marks are those of the wanderer
 * (`Inventory.worn`): the renderer and the wire read them the same way. Returns the zones dressed.
 */
export function dressInventory(inv: Inventory, outfit: Partial<Record<WornZone, string>>, spec: (item: string) => ItemSpec | undefined): WornZone[] {
  const dressed: WornZone[] = [];
  for (const zone of WORN_ZONES) {
    const item = outfit[zone];
    if (!item) continue;
    let at = inv.slots.findIndex((s) => s?.item === item && !s.thing);
    if (at < 0) {
      if (addItem(inv, item, 1, spec(item)) < 1) continue;
      at = inv.slots.findIndex((s) => s?.item === item && !s.thing);
      if (at < 0) continue;
    }
    inv.worn = { ...(inv.worn ?? {}), [zone]: at };
    dressed.push(zone);
  }
  return dressed;
}

/** The marks of an inventory brought back to what holds (a saved file, a component written by Lua): nothing else changes. */
export function keepWornMarks(inv: Inventory, zoneOf: (item: string) => WornZone | undefined): void {
  if (inv.worn === undefined) return;
  const good = wornSlots(inv, zoneOf);
  if (Object.keys(good).length) inv.worn = good;
  else delete inv.worn;
}

/**
 * What another wanderer wears, as the wire says it (`OtherView.worn`): only the zones, and for each a text of an id, cut. Whatever
 * else came is left out.
 */
export function readWorn(v: unknown): Partial<Record<WornZone, string>> | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: Partial<Record<WornZone, string>> = {};
  for (const zone of WORN_ZONES) {
    const item = (v as Record<string, unknown>)[zone];
    if (typeof item === 'string' && item) out[zone] = item.slice(0, 120);
  }
  return Object.keys(out).length ? out : undefined;
}
