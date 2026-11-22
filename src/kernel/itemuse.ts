// What a thing is for (T489, ADR-0250): every item of the world has a use the kernel knows how to do, or is kept as a decoration.
// The uses are read from the data (the item itself and the world around it: recipes, trades, the actions of things and terrains, the
// slots of the mechanics' panels, the building sites, the missions), never asked of a model; a decoration is a mark on the item
// (`ItemDef.decoration`), which the Narrator declares or the kernel writes on the things of before that have no use. The same reading
// gives the validator's rule (a new thing without a use goes back to the Narrator with the reason), the words of the inventory and of
// «Esamina» (in the world: what one does with it, never a list of the game) and the recipes a thing opens where it is held. Pure.

import { normName, isCategory } from './content';
import { wornZoneOf, type WornZone } from './wearing';
import type { ItemDef, Recipe } from './types';
import type { JobProgram } from './npc/model';

/** How a thing is consumed by `core.items` (its category; the breath where the world counts it). */
export type ConsumeVerb = 'eat' | 'drink' | 'apply' | 'absorb' | 'breathe';

/** One use of a thing: what the kernel does with it, and with what. Ids of items, the names are the caller's. */
export type ItemUse =
  /** Eaten, drunk, applied, absorbed, breathed (`core.items`): its effects. */
  | { kind: 'consume'; verb: ConsumeVerb; effects: Partial<Record<'hunger' | 'thirst' | 'energy' | 'health' | 'mana' | 'oxygen', number>> }
  /** Lit and put out (`core.items`, the category `light`). */
  | { kind: 'light' }
  /** Things go inside (`container`). */
  | { kind: 'bag'; size: number }
  /** Worn on a zone of the body (ADR-0180), or put into a slot of a mechanic's panel (`ui`). */
  | { kind: 'wear'; zone?: WornZone; panel?: string; slot?: string }
  /** Something done with it from the inventory: an action of its own with effects, or its module's `on_use`/`on_action`. */
  | { kind: 'action'; label: string }
  /** An action of a thing or of a terrain of the world wants it carried (`requires`: its id or one of its tags). */
  | { kind: 'needed'; label: string; on: string }
  /** It cuts what can be cut (the tag `taglio` on what is held, `tagliabile` on the thing in front: the kernel's). */
  | { kind: 'cuts' }
  /** It goes into a recipe, used up (`inputs`) or as a tool (`tools`): what comes out, the other things used up and the tools it takes. */
  | { kind: 'ingredient' | 'tool'; recipe: string; makes: string; with: string[]; tools: string[] }
  /** A trade of the world works with it (a task of its program says it as `item` or `with`). */
  | { kind: 'trade'; job: string; word: string }
  /** A building site takes it (the materials of a venture). */
  | { kind: 'venture' }
  /** Somebody waits for it (a mission that asks for it to be brought). */
  | { kind: 'quest'; to: string }
  /** Kept for itself: an ornament, a keepsake, something to look at (the mark). */
  | { kind: 'decoration' };

export type ItemUseKind = ItemUse['kind'];

/** The uses the Narrator declares when it defines a thing (the schema's `use`), each backed by the data it gives (T489). */
export const DECLARED_USES = ['consume', 'wear', 'light', 'bag', 'action', 'craft', 'decoration'] as const;
export type DeclaredUse = (typeof DECLARED_USES)[number];

/** Which uses back a declared one: what the kernel must find for it to hold. */
const BACKED_BY: Readonly<Record<DeclaredUse, readonly ItemUseKind[]>> = {
  consume: ['consume'],
  wear: ['wear'],
  light: ['light'],
  bag: ['bag'],
  action: ['action', 'cuts', 'needed'],
  craft: ['ingredient', 'tool'],
  decoration: ['decoration'],
};

/** Whether the use a thing declared holds: what the kernel finds backs it. */
export const declaredHolds = (declared: DeclaredUse, uses: readonly ItemUse[]): boolean => uses.some((u) => BACKED_BY[declared].includes(u.kind));

/** What of the world gives a thing its uses: the caller builds it from its modules, its content and its state. */
export interface UseWorld {
  recipes: readonly Recipe[];
  jobs?: readonly JobProgram[];
  /** The actions of the things and the terrains of the world that want something carried (`requires`: an item id or a tag). */
  wants?: ReadonlyArray<{ label: string; on: string; requires: string }>;
  /** The slots of the panels of the mechanics: what each accepts (places, categories, tags). */
  slots?: ReadonlyArray<{ panel: string; label: string; accepts: readonly string[] }>;
  /** Whether a module of the item reacts to its use (`on_use`, `on_action`). */
  scripted?: (def: ItemDef) => boolean;
  /** Whether something of the world can be cut (`tagliabile`): then what cuts is a use. */
  cuttable?: boolean;
  /** The items building sites take (the materials of the ventures, and of the houses the kernel builds). */
  materials?: ReadonlySet<string>;
  /** Things somebody waits for: the name of the thing as `normName` writes it → who. */
  awaited?: ReadonlyMap<string, string>;
  /** Whether the world counts the breath (`nature.oxygen`): only then a tank is breathed. */
  breath?: boolean;
}

const CONSUME_VERBS: Readonly<Record<string, ConsumeVerb>> = { food: 'eat', drink: 'drink', medicine: 'apply', magic: 'absorb' };
/** The tasks of a trade that work with a thing they name (`item`): taking it from the deposit, eating it. */
const TRADE_USES: ReadonlySet<string> = new Set(['take', 'eat']);
const NEEDS = ['hunger', 'thirst', 'energy', 'health', 'mana', 'oxygen'] as const;

/** The non-zero effects of a thing, read without trusting them. */
function effectsOf(def: ItemDef): Partial<Record<(typeof NEEDS)[number], number>> {
  const out: Partial<Record<(typeof NEEDS)[number], number>> = {};
  const e = def.effects && typeof def.effects === 'object' ? (def.effects as Record<string, unknown>) : {};
  for (const k of NEEDS) if (typeof e[k] === 'number' && Number.isFinite(e[k]) && e[k] !== 0) out[k] = e[k] as number;
  return out;
}

/** Whether a thing has the bonus a mechanic could read: some number that is not zero (a multiplier other than one). */
const hasBonus = (def: ItemDef): boolean => !!def.bonus && typeof def.bonus === 'object' && Object.entries(def.bonus).some(([k, v]) => typeof v === 'number' && Number.isFinite(v) && v !== (k === 'speed' ? 1 : 0));

const tagsOf = (def: ItemDef): string[] => (Array.isArray(def.tags) ? def.tags.filter((t): t is string => typeof t === 'string') : []);

/**
 * The uses of a thing in a world, in a fixed order (what it does by itself first, then what the world does with it, the mark last). A
 * thing that only comes out of a recipe has no use for that: being made is how one gets it, not what one does with it (`madeBy`).
 */
export function usesOf(def: ItemDef, world: UseWorld): ItemUse[] {
  const out: ItemUse[] = [];
  const effects = effectsOf(def);
  const verb = CONSUME_VERBS[def.category] ?? (effects.oxygen && effects.oxygen > 0 && world.breath ? 'breathe' : undefined);
  const consumed = verb === 'breathe' ? { oxygen: effects.oxygen } : effects;
  if (verb && Object.keys(consumed).length) out.push({ kind: 'consume', verb, effects: consumed });
  if (def.category === 'light') out.push({ kind: 'light' });
  if (def.container && Number(def.container.size) >= 1) out.push({ kind: 'bag', size: Math.floor(Number(def.container.size)) });
  const zone = wornZoneOf(def);
  if (zone) out.push({ kind: 'wear', zone });
  // A slot of a panel takes it by its place, or by its category or a tag when it gives the mechanic something to read.
  const tags = tagsOf(def);
  for (const s of world.slots ?? []) {
    const byPlace = !!def.slot && s.accepts.includes(def.slot);
    const byKind = s.accepts.some((a) => isCategory(def, a) || tags.includes(a));
    if (byPlace || (byKind && hasBonus(def))) {
      out.push({ kind: 'wear', panel: s.panel, slot: s.label });
      break;
    }
  }
  for (const a of def.actions ?? []) if (a && typeof a.label === 'string' && Array.isArray(a.effects) && a.effects.length) out.push({ kind: 'action', label: a.label });
  if (world.scripted?.(def)) out.push({ kind: 'action', label: '' });
  const wanted = new Set<string>();
  for (const w of world.wants ?? []) {
    if (!(w.requires === def.id || tags.includes(w.requires)) || wanted.has(`${w.label}|${w.on}`)) continue;
    wanted.add(`${w.label}|${w.on}`);
    out.push({ kind: 'needed', label: w.label, on: w.on });
  }
  if (world.cuttable && tags.includes('taglio')) out.push({ kind: 'cuts' });
  for (const r of world.recipes) {
    const input = r.inputs.some((i) => i.item === def.id);
    const tool = (r.tools ?? []).includes(def.id);
    if (!input && !tool) continue;
    const used = [...new Set(r.inputs.map((i) => i.item))].filter((x) => x !== def.id);
    const tools = [...new Set(r.tools ?? [])].filter((x) => x !== def.id);
    out.push({ kind: input ? 'ingredient' : 'tool', recipe: r.id, makes: r.output.item, with: used, tools });
  }
  for (const j of world.jobs ?? []) {
    // What the trade works with: what it uses up making something, what it takes from the deposit, what it eats; not what it makes and carries.
    const tasks = Object.values(j.day ?? {}).flat();
    if (tasks.some((t) => t && (t.with === def.id || (t.item === def.id && TRADE_USES.has(t.does))))) out.push({ kind: 'trade', job: j.id, word: j.names?.[0] ?? j.id });
  }
  if (world.materials?.has(def.id)) out.push({ kind: 'venture' });
  const to = world.awaited?.get(normName(String(def.name ?? '')));
  if (to) out.push({ kind: 'quest', to });
  if (def.decoration === true) out.push({ kind: 'decoration' });
  return out;
}

/** Whether a thing has a use, the mark of decoration included. */
export const hasUse = (def: ItemDef, world: UseWorld): boolean => usesOf(def, world).length > 0;

/** The uses that are not the mark: what one does with it. */
export const workingUses = (uses: readonly ItemUse[]): ItemUse[] => uses.filter((u) => u.kind !== 'decoration');

/** Where a thing comes from in the world: the recipes it comes out of, the trades that make it. */
export function madeBy(def: ItemDef, world: UseWorld): { recipes: Recipe[]; trades: string[] } {
  const recipes = world.recipes.filter((r) => r.output.item === def.id);
  const trades = (world.jobs ?? []).filter((j) => Object.values(j.day ?? {}).flat().some((t) => t?.item === def.id && (t.does === 'produce' || t.does === 'gather'))).map((j) => j.names?.[0] ?? j.id);
  return { recipes, trades };
}

/** What a thing is, in a word of the report (T489): food, a tool, a garment, a bag, a key, a material, a light, magic, or else. */
export type ItemRole = 'food' | 'tool' | 'garment' | 'container' | 'key' | 'material' | 'light' | 'magic' | 'other';

export function roleOf(def: ItemDef): ItemRole {
  const name = normName(String(def.name ?? ''));
  if (/\b(chiav[ei]|keys?)\b/.test(name) || tagsOf(def).some((t) => /^(chiave|key)$/.test(t))) return 'key';
  if (['food', 'drink', 'medicine'].includes(def.category)) return 'food';
  if (['tool', 'weapon'].includes(def.category)) return 'tool';
  if (def.category === 'clothing' || wornZoneOf(def)) return 'garment';
  if (def.category === 'container' || def.container) return 'container';
  if (def.category === 'material') return 'material';
  if (def.category === 'light') return 'light';
  if (def.category === 'magic') return 'magic';
  return 'other';
}

/**
 * The reason a new thing does not hold (the validator's rule, T489): it has no use and is not a decoration. The use it declared says what
 * was missing (a thing to eat that feeds nothing, a garment without a place, a thing to craft in no recipe). Undefined when it holds:
 * a thing with a use holds even if the one it declared did not (a drink whose recipe fell is still drunk). The words go back to the
 * Narrator, with the fields of its schema.
 */
export function useError(def: ItemDef, world: UseWorld, declared?: string): string | undefined {
  if (usesOf(def, world).length) return undefined;
  const name = `«${def.name}»`;
  const known = (DECLARED_USES as readonly string[]).includes(declared ?? '') ? (declared as DeclaredUse) : undefined;
  if (known && known !== 'decoration') return `${name} dice «${known}» ma ${MISSING[known]}`;
  return `${name} si prende ma non ha un uso: dagli un uso che il mondo sa fare (consume con effects, wear con slot, light, bag con container, action con effects, craft con recipe) o dichiaralo decoration`;
}

/** What a declared use lacks, for the reason. */
const MISSING: Readonly<Record<DeclaredUse, string>> = {
  consume: 'non nutre, non disseta e non cura: dagli effects (o la categoria di ciò che si mangia, si beve, si usa su di sé)',
  wear: 'non ha un posto addosso: dagli slot (head, torso, back, o un posto che una scheda del mondo accetta)',
  light: 'non è della categoria light',
  bag: 'non ha container: quante cose ci stanno dentro (2-12)',
  action: 'non ha un\'azione con effetti che il mondo sa fare (non solo un messaggio)',
  craft: 'non entra in nessuna ricetta: dagli recipe con ciò che si fa e le altre cose, coi loro nomi esatti',
  decoration: 'non è marcato',
};

// --- The words of the world ---------------------------------------------------------------------------------------------------------

/** How a thing is consumed, in the world's words. */
const VERB_WORDS: Readonly<Record<ConsumeVerb, string>> = { eat: 'Si mangia', drink: 'Si beve', apply: 'Si usa su di sé', absorb: 'Si assorbe', breathe: 'Se ne respira l’aria' };

/** What an effect does to the body, in the world's words (positive, negative). */
const NEED_WORDS: Readonly<Record<string, readonly [string, string]>> = {
  hunger: ['sazia', 'mette fame'],
  thirst: ['disseta', 'mette sete'],
  energy: ['dà forza', 'stanca'],
  health: ['cura', 'fa male'],
  mana: ['ridà il mana', 'toglie il mana'],
  oxygen: ['dà aria', 'toglie l’aria'],
};

const ZONE_SAID: Readonly<Record<WornZone, string>> = { head: 'sulla testa', torso: 'sul busto', back: 'sulla schiena' };

/** «il fabbro», «lo scalpellino», «l'oste»: the article of a trade's word. */
function withArticle(word: string): string {
  const w = word.trim();
  if (/^[aeiouàèéìòù]/i.test(w)) return `l’${w}`;
  if (/^(s[^aeiouàèéìòù]|z|gn|ps|x|y)/i.test(w)) return `lo ${w}`;
  return `il ${w}`;
}

/** A list in the world's words: «a», «a e b», «a, b e c». */
function listed(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

export interface UseWordsContext {
  /** The name of an item in the world. */
  name: (id: string) => string;
  /** How many of an item the wanderer carries: the recipes say what they have and what they lack. */
  has?: (id: string) => number;
}

/**
 * What one does with a thing, in the world's words (T489): a line for each use, at most `max`, the mark only when nothing else is said.
 * For the inventory and «Esamina»: no word of the game (no recipe, module, kernel), only what the wanderer can do and with what.
 */
export function useWords(uses: readonly ItemUse[], ctx: UseWordsContext, max = 4): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (line: string) => {
    if (line && !seen.has(line)) seen.add(line), out.push(line);
  };
  const actions = uses.filter((u): u is ItemUse & { kind: 'action' } => u.kind === 'action' && !!u.label).map((u) => `«${u.label}»`);
  for (const u of uses) {
    switch (u.kind) {
      case 'consume': {
        const said = Object.entries(u.effects).map(([k, v]) => NEED_WORDS[k]?.[v! > 0 ? 0 : 1]).filter(Boolean) as string[];
        push(`${VERB_WORDS[u.verb]}${said.length ? `: ${listed([...new Set(said)])}` : ''}.`);
        break;
      }
      case 'light':
        push('Si accende e fa luce.');
        break;
      case 'bag':
        push(`Ci stanno dentro ${u.size} cose.`);
        break;
      case 'wear':
        push(u.zone ? `Si indossa ${ZONE_SAID[u.zone]}.` : `Si mette in «${u.slot}» (${u.panel}).`);
        break;
      case 'action':
        if (actions.length) push(`Puoi: ${listed(actions)}.`);
        else if (!u.label) push('Si usa: prova a usarlo o a impugnarlo.');
        break;
      case 'needed':
        push(`Serve per «${u.label}»${u.on ? ` (${u.on})` : ''}.`);
        break;
      case 'cuts':
        push('Impugnato, taglia ciò che si può abbattere.');
        break;
      case 'ingredient':
      case 'tool': {
        const said = (ids: string[]) => listed(ids.map((id) => (ctx.has && ctx.has(id) > 0 ? `${ctx.name(id)} (ce l’hai)` : ctx.name(id))));
        const made = ctx.name(u.makes);
        const using = u.tools.length ? `, usando ${said(u.tools)},` : '';
        push(u.kind === 'ingredient' ? `Con ${listed(['questo', ...u.with.map((id) => said([id]))])}${using} si fa: ${made}.` : `Serve a fare ${made}${u.with.length ? ` con ${said(u.with)}` : ''}${u.tools.length ? `, insieme a ${said(u.tools)}` : ''}.`);
        break;
      }
      case 'trade':
        push(`Lo usa ${withArticle(u.word)}, al lavoro.`);
        break;
      case 'venture':
        push('Serve per costruire.');
        break;
      case 'quest':
        push(`Lo aspetta ${u.to}.`);
        break;
      case 'decoration':
        break;
    }
  }
  if (!out.length) push('Non serve a un lavoro: si tiene, per com’è o per ricordo.');
  return out.slice(0, max);
}

/**
 * The recipes a thing opens (point 3 of T489), for where it is held: those it goes into, with what the wanderer still lacks. Ready first,
 * then by how little is missing.
 */
export function opened(def: ItemDef, recipes: readonly Recipe[], has: (id: string) => number): Array<{ recipe: Recipe; missing: Array<{ item: string; count: number }> }> {
  return recipes
    .filter((r) => r.inputs.some((i) => i.item === def.id) || (r.tools ?? []).includes(def.id))
    .map((recipe) => ({ recipe, missing: [...recipe.inputs.map((i) => ({ item: i.item, count: Math.max(0, i.count - has(i.item)) })), ...(recipe.tools ?? []).map((t) => ({ item: t, count: has(t) > 0 ? 0 : 1 }))].filter((m) => m.count > 0) }))
    .sort((a, b) => a.missing.length - b.missing.length);
}

// --- The things of before ---------------------------------------------------------------------------------------------------------

/**
 * The packs of a universe with the things of before T489 that have no use marked as decorations (point 4 of T489): every `data` module
 * with `items` that is not one of the seed's (`seed.json`: their things have their uses, and the seed updates them), every item that is
 * not marked yet and of which `hasUse` says no. Pure: the kernel writes the changes in a commit of its own, without calls. Ids of the
 * things marked, in the order of the packs.
 */
export function markedPacks(files: Readonly<Record<string, string>>, hasUse: (item: ItemDef) => boolean): { changes: Record<string, string>; marked: string[] } {
  const changes: Record<string, string> = {};
  const marked: string[] = [];
  let seed: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(files['seed.json'] ?? '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) seed = parsed;
  } catch {
    seed = {};
  }
  for (const path of Object.keys(files).sort()) {
    if (!/^modules\/[^/]+\/manifest\.json$/.test(path) || path in seed) continue;
    let m: { kind?: unknown; items?: unknown };
    try {
      m = JSON.parse(files[path]);
    } catch {
      continue;
    }
    if (!m || typeof m !== 'object' || m.kind !== 'data' || !Array.isArray(m.items)) continue;
    let touched = false;
    for (const it of m.items as ItemDef[]) {
      if (!it || typeof it !== 'object' || typeof it.id !== 'string' || it.decoration === true || hasUse(it)) continue;
      it.decoration = true;
      marked.push(it.id);
      touched = true;
    }
    if (touched) changes[path] = JSON.stringify(m, null, 2) + '\n';
  }
  return { changes, marked };
}
