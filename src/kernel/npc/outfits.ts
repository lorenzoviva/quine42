// What the people wear (T353, ADR-0181): the garments of an individual, from the Narrator's card (`indossa` in `npc.individuate`,
// kept in `world/people.json → wears`) and, for the zones the card leaves bare, from their trade: the garments of the world whose
// name, description or tags say the trade («Grembiule del fabbro» for a fabbro), one per zone, chosen by a hash of who they are, so
// the same individual dresses the same way every time they are met, with no call to the models. Pure: data in, an outfit out.

import { normName } from '../content';
import { hashStr } from '../rng';
import { WORN_ZONES, type WornZone } from '../wearing';
import { normalTrade } from './jobs';

/** A garment of the world as the outfit reads it: a thing that goes on a zone. */
export interface Garment {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  zone: WornZone;
}

/** An outfit: zone → the id of the garment on it. */
export type Outfit = Partial<Record<WornZone, string>>;

/** The stem of a word of a trade: «contadina», «contadino», «contadini» → `contad`; «fabbro» → `fabb`; «farmer» → `farm`. */
function stem(word: string): string {
  return word.slice(0, Math.max(4, Math.min(word.length - 2, 7)));
}

/** The stems of the words of a trade, those long enough to mean something («caccia topi» → `cacc`, `topi` left out). */
export function tradeStems(job: string | undefined): string[] {
  if (!job) return [];
  return normName(normalTrade(job))
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 4)
    .map(stem);
}

/** Whether a garment is of a trade: a word of its name, description or tags starts with a stem of the trade. */
export function garmentOfTrade(g: Pick<Garment, 'name' | 'description' | 'tags'>, stems: readonly string[]): boolean {
  if (!stems.length) return false;
  const words = normName(`${g.name} ${g.description ?? ''} ${(g.tags ?? []).join(' ')}`).split(/[^a-z]+/);
  return words.some((w) => stems.some((s) => w.startsWith(s)));
}

/**
 * The outfit of an individual: first what the card says (`wears`, ids in the order the Narrator said them, the first per zone), then,
 * for every zone still bare, a garment of their trade among those of the world, chosen by their name so that it is the same every time.
 * Nothing for a zone without a garment of the trade: the people are not all in the same cloak.
 */
export function outfitOf(wears: readonly string[], job: string | undefined, garments: readonly Garment[], who: string): Outfit {
  const out: Outfit = {};
  const byId = new Map(garments.map((g) => [g.id, g]));
  for (const id of wears) {
    const g = byId.get(id);
    if (g && !out[g.zone]) out[g.zone] = g.id;
  }
  const stems = tradeStems(job);
  if (!stems.length) return out;
  for (const zone of WORN_ZONES) {
    if (out[zone]) continue;
    const fit = garments.filter((g) => g.zone === zone && garmentOfTrade(g, stems)).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (!fit.length) continue;
    out[zone] = fit[hashStr(`${who}|${zone}`) % fit.length].id;
  }
  return out;
}
