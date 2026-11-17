// The structures' Sculptor as the master chooses it (T398, D57): three tiers, in the Genesis and in the lobby, each with the model it writes
// the structures with on this route and what one structure costs, and who pays it. The choice goes in `universe.json → ai.sculptorTier`
// with the other knobs and is fixed while a match is under way (ADR-0133).

import { sculptorTiers, TIER_NAMES } from '../kernel/coefficients';
import type { AiRoute, SculptorTier } from '../kernel/agents/sculptor';
import type { AiConfig } from '../kernel/types';
import { usd } from '../kernel/ai/prices';
import { el } from './dom';

/** A model's name as a player reads it. */
const MODEL_NAMES: Record<string, string> = { 'claude-opus-5-5': 'Opus 5.5', 'claude-fable-5-1': 'Fable 5.1', 'gemini-4-argon': 'Argon' };
export const modelName = (id: string): string => MODEL_NAMES[id] ?? id;

const WHAT: Record<SculptorTier, string> = {
  standard: 'il predefinito: Argon, e su OpenRouter Opus 5.5 dall’1/12',
  strong: 'Opus 5.5 su OpenRouter da subito',
  max: 'Fable 5.1 su OpenRouter: il più bravo e il più caro',
};

export interface TierPicker {
  select: HTMLSelectElement;
  note: HTMLElement;
  /** The labels again, after a change of what they depend on (the structures' model of a class, who pays). */
  refresh: (ai: Pick<AiConfig, 'sculptors'>, payer: string) => void;
  value: () => SculptorTier;
}

/**
 * The select of the tiers and the note under it. `route`: the route of the world's models where the page knows it (else Google's, where every
 * tier is Argon). `payer`: who pays a structure, in words (the player alone, the master, the common expenses).
 */
export function tierPicker(id: string, value: SculptorTier, route: AiRoute | undefined, onChange: () => void): TierPicker {
  const select = el('select', { id }, ...(Object.keys(TIER_NAMES) as SculptorTier[]).map((t) => el('option', { value: t }, TIER_NAMES[t]))) as HTMLSelectElement;
  select.value = value;
  const note = el('div', { class: 'note tier-note' });
  const refresh = (ai: Pick<AiConfig, 'sculptors'>, payer: string) => {
    const views = sculptorTiers(ai, route ?? 'google');
    for (const v of views) {
      const option = (Array.from(select.children) as HTMLOptionElement[]).find((o) => o.value === v.tier);
      if (option) option.textContent = `${v.name} · ${modelName(v.model)} · circa ${usd(v.perStructure)} a struttura`;
    }
    const chosen = views.find((v) => v.tier === select.value) ?? views[0];
    const onGoogle = (route ?? 'google') === 'google';
    note.textContent =
      `Scultore delle strutture ${chosen.name}: ${WHAT[chosen.tier]}. ` +
      (onGoogle ? 'Questo mondo va con la chiave di Google, che ha solo i Gemini: ogni scelta scrive le strutture con Argon e costa uguale. ' : '') +
      `Una struttura di un concetto nuovo costa circa ${usd(chosen.perStructure)} con ${modelName(chosen.model)}; ${payer}`;
  };
  select.onchange = onChange;
  return { select, note, refresh, value: () => (select.value as SculptorTier) };
}
