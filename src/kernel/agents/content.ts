// Content: what fills the world. Text is cheap, so the Council writes a lot of it: packs of items
// (with categories, weights, effects, tags), recipes and loot tables; things mentioned in
// conversation; individuals behind every NPC archetype.

import type { Schema } from '../ai/models';
import { hashStr } from '../rng';
import { CATEGORY_GLYPHS, normName } from '../content';
import { ITEM_CATEGORIES, type ItemDef, type LootTable, type Recipe } from '../types';
import { slug } from './forge';
import type { AgentId, Council } from './council';
import { ITEM_SHAPES, itemShapeModel } from '../modeldirector';
import { internalName, internalValues } from '../internalNames';
import { ACTIVITIES, DAY_PHASES, defaultRoutine, inferActivity, RELATION_KINDS, RELATION_WORDS, WHERES, type Activity, type DayPhase, type Gender, type Relation, type RoutineStep, type Species, type Where } from '../npc/model';

/** The places of the things (T310b, `posti`): where a thing is worn or held, as the Narrator's schema lists them. */
const SLOTS = internalValues('posti');

const ITEM_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    description: { type: 'STRING' },
    // Categories and shapes are internal since T310 (the prompts are English); an Italian one of the contract 0.1 is still made internal by toItemDef.
    category: { type: 'STRING', enum: internalValues('categorie') },
    weight: { type: 'NUMBER' },
    stack: { type: 'INTEGER' },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    effects: { type: 'OBJECT', properties: { hunger: { type: 'NUMBER' }, thirst: { type: 'NUMBER' }, energy: { type: 'NUMBER' }, health: { type: 'NUMBER' }, mana: { type: 'NUMBER' } } },
    equippable: { type: 'BOOLEAN' },
    container: { type: 'INTEGER', description: 'only for bags, sacks, baskets, saddlebags carried on oneself: how many things fit inside (2-12)' },
    slot: { type: 'STRING', enum: SLOTS, description: 'only for what is worn or held: where' },
    bonus: { type: 'OBJECT', description: 'only for what is worn or held: what it gives', properties: { defense: { type: 'NUMBER' }, attack: { type: 'NUMBER' }, speed: { type: 'NUMBER', description: 'a multiplier, e.g. 0.95 for a heavy armour, 1.1 for light boots' }, weight: { type: 'NUMBER', description: 'extra carrying weight (backpacks)' }, light: { type: 'NUMBER' }, warmth: { type: 'NUMBER' } } },
    look: { type: 'STRING' },
    shape: { type: 'STRING', enum: internalValues('impronte').filter((f) => f !== 'shape'), description: 'the common shape it looks like (one model per shape, coloured like the thing)' },
  },
  required: ['name', 'description', 'category', 'weight', 'stack', 'tags', 'look', 'shape'],
};

interface RawItem {
  name: string;
  description: string;
  category: string;
  weight: number;
  stack: number;
  tags: string[];
  /** The list of before T310b (`tag`): `internalAnswer` leaves it, it is also a loot entry's tag. */
  tag?: string[];
  effects?: { hunger?: number; thirst?: number; energy?: number; health?: number; mana?: number };
  equippable?: boolean;
  container?: number;
  look: string;
  shape?: string;
  slot?: string;
  bonus?: Record<string, number>;
}

/** The pack's items of an answer: `items`, or `oggetti` of before T310b (not in `internalAnswer`: a plan's `oggetti` are its objects). */
const itemsOf = (r: { items?: RawItem[]; oggetti?: RawItem[] }): RawItem[] => (Array.isArray(r.items) ? r.items : Array.isArray(r.oggetti) ? r.oggetti : []);

export interface Pack {
  items: ItemDef[];
  recipes: Recipe[];
  loot: Record<string, LootTable>;
}

const clamp = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

export function toItemDef(r: RawItem, taken: Set<string>): ItemDef | null {
  if (!r?.name?.trim()) return null;
  let id = `item.${slug(r.name)}`;
  for (let i = 2; taken.has(id); i++) id = `item.${slug(r.name)}-${i}`;
  taken.add(id);
  const named = internalName('categorie', String(r.category ?? ''));
  const category = (ITEM_CATEGORIES as readonly string[]).includes(named) ? (named as ItemDef['category']) : 'misc';
  const e = r.effects ?? {};
  const effects = { hunger: clamp(e.hunger, -50, 60, 0), thirst: clamp(e.thirst, -50, 60, 0), energy: clamp(e.energy, -50, 60, 0), health: clamp(e.health, -50, 60, 0), mana: clamp(e.mana, -50, 60, 0) };
  const bag = category === 'container' && Number(r.container) >= 2 ? { size: Math.round(clamp(r.container, 2, 12, 4)) } : undefined;
  const hasEffects = Object.values(effects).some((v) => v !== 0);
  // A place or a bonus in the Italian of the contract 0.6 (`testa`, `difesa`) is still the one it means (T310b).
  const slot = internalName('posti', String(r.slot ?? '').toLowerCase().trim());
  const tags = Array.isArray(r.tags) ? r.tags : Array.isArray(r.tag) ? r.tag : [];
  return {
    id,
    name: r.name.trim().slice(0, 40),
    description: String(r.description ?? '').slice(0, 240),
    category,
    weight: clamp(r.weight, 0, 30, 1),
    stack: bag ? 1 : Math.round(clamp(r.stack, 1, 50, 1)),
    tags: [...new Set(tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 8))],
    glyph: CATEGORY_GLYPHS[category] ?? '•',
    color: `hsl(${hashStr(id) % 360} 60% 66%)`,
    look: String(r.look ?? r.name).slice(0, 200),
    ...((ITEM_SHAPES as readonly string[]).includes(internalName('impronte', r.shape ?? '')) ? { model: itemShapeModel(internalName('impronte', r.shape!)) } : {}),
    equippable: !!r.equippable,
    ...(hasEffects ? { effects } : {}),
    ...(bag ? { container: bag } : {}),
    ...(slot && /^[a-z]{3,12}$/.test(slot) ? { slot } : {}),
    ...(r.bonus && typeof r.bonus === 'object' ? { bonus: Object.fromEntries(Object.entries(r.bonus).filter(([, v]) => typeof v === 'number' && Number.isFinite(v)).map(([k, v]) => [internalName('bonus', k), Math.max(-50, Math.min(50, v as number))])) } : {}),
  };
}

/** A pack of new items with recipes and loot tables, cross-checked by the Physicist and the Arbiter. */
export async function itemPack(c: Council, opts: { count: number; existing: string[]; hints: string[]; tags: string[] }): Promise<{ items: RawItem[]; recipes: unknown[]; loot: unknown }> {
  const askItems = (feedback = '') =>
    c.ask<{ items?: RawItem[]; oggetti?: RawItem[] }>(
      'narrator',
      'content.items',
      [
        `Invent ${opts.count} things for this world, of the kind often found in houses, workshops, fields and woods (Project Zomboid style: many common, useful, believable things; few rare ones).`,
        `Vary the categories: food, drinks, medicines, tools, weapons, materials, lights, clothing, containers, misc.`,
        opts.hints.length ? `Include, if consistent with the world: ${opts.hints.join(', ')}.` : '',
        opts.existing.length ? `They exist already (do not repeat them): ${opts.existing.slice(-80).join(', ')}.` : '',
        `"effects" (from -50 to 60) only for what is consumed: hunger/thirst/energy/health restored. "stack": how many stack (1 for tools and weapons). "weight" in units (the wanderer carries 20). "tags": words useful to find and combine them, like the common ones (in Italian e.g. cucina, legno, metallo, erbe, bottega, contadino). Common tags to use: ${opts.tags.join(', ')}.`,
        feedback && `The Arbiter objected: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n'),
      { type: 'OBJECT', properties: { items: { type: 'ARRAY', items: ITEM_SCHEMA } }, required: ['items'] },
      { data: { ...opts, feedback }, temperature: 0.95 },
    ).then(itemsOf);
  let items = await askItems();
  c.say('narrator', 'propone', `${items.length} oggetti: ${items.slice(0, 8).map((o) => o.name).join(', ')}${items.length > 8 ? '…' : ''}`);

  // The Physicist checks weights, stacks and effects against what the things are.
  const phys = await c.ask<{ fixes: Array<{ name: string; weight?: number; stack?: number; effects?: RawItem['effects']; note?: string }> }>(
    'physicist',
    'content.physics',
    `Check the weight, stack and effects of these things: fix only what is physically inconsistent (an anvil does not weigh 1, an axe does not stack, bread does not give 60 energy).\n${items.map((o) => `${o.name}: weight ${o.weight}, stack ${o.stack}, effects ${JSON.stringify(o.effects ?? {})}`).join('\n')}`,
    {
      type: 'OBJECT',
      properties: {
        fixes: {
          type: 'ARRAY',
          items: { type: 'OBJECT', properties: { name: { type: 'STRING' }, weight: { type: 'NUMBER' }, stack: { type: 'INTEGER' }, effects: ITEM_SCHEMA.properties!.effects, note: { type: 'STRING' } }, required: ['name'] },
        },
      },
      required: ['fixes'],
    },
    { data: { items }, temperature: 0.2 },
  );
  for (const fix of phys.fixes ?? []) {
    const it = items.find((o) => o.name === fix.name);
    if (!it) continue;
    if (typeof fix.weight === 'number') it.weight = fix.weight;
    if (typeof fix.stack === 'number') it.stack = fix.stack;
    if (fix.effects) it.effects = fix.effects;
  }
  if (phys.fixes?.length) c.say('physicist', 'corregge', phys.fixes.slice(0, 4).map((f) => `${f.name}${f.note ? `: ${f.note}` : ''}`).join('; '), 'narrator');

  const review = await c.ask<{ approved: boolean; problems: Array<{ agent: AgentId; problem: string }> }>(
    'arbiter',
    'content.review',
    `Are these things consistent with the world (age, tone, technology)? Point out only the ones out of place.\n${items.map((o) => `${o.name} (${o.category}): ${o.description}`).join('\n')}`,
    { type: 'OBJECT', properties: { approved: { type: 'BOOLEAN' }, problems: { type: 'ARRAY', items: { type: 'OBJECT', properties: { agent: { type: 'STRING', enum: ['narrator'] }, problem: { type: 'STRING' } }, required: ['agent', 'problem'] } } }, required: ['approved', 'problems'] },
    { data: { items }, temperature: 0.2 },
  );
  if (!review.approved && review.problems?.length) {
    const issues = review.problems.map((p) => p.problem).join('; ');
    c.say('arbiter', 'obietta', issues, 'narrator');
    items = await askItems(issues);
    c.say('narrator', 'corregge', `${items.length} oggetti riscritti`);
  } else c.say('arbiter', 'approva', 'Gli oggetti appartengono al mondo.');

  const names = [...opts.existing, ...items.map((o) => o.name)];
  const rec = await c.ask<{ recipes: unknown[]; loot: unknown }>(
    'narrator',
    'content.recipes',
    [
      `Write 6-10 crafting recipes using ONLY these things (exact names): ${names.slice(-120).join(', ')}.`,
      'Each recipe: inputs consumed, tools needed but not consumed, one result. They must make sense (rope + stick → a rough fishing rod, only if it exists).',
      'Then "loot": tables of what is found where. Suggested keys (in Italian): comune, cucina, cassa, bottega, terreno, contadino, bosco. Each entry picks by "tag" (a category or a tag of the things) or by "item" (exact name), with a weight.',
    ].join('\n'),
    {
      type: 'OBJECT',
      properties: {
        recipes: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              inputs: { type: 'ARRAY', items: { type: 'OBJECT', properties: { item: { type: 'STRING' }, quantity: { type: 'INTEGER' } }, required: ['item', 'quantity'] } },
              tools: { type: 'ARRAY', items: { type: 'STRING' } },
              result: { type: 'OBJECT', properties: { item: { type: 'STRING' }, quantity: { type: 'INTEGER' } }, required: ['item', 'quantity'] },
            },
            required: ['name', 'inputs', 'result'],
          },
        },
        loot: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              table: { type: 'STRING' },
              entries: { type: 'ARRAY', items: { type: 'OBJECT', properties: { tag: { type: 'STRING' }, item: { type: 'STRING' }, weight: { type: 'NUMBER' } }, required: ['weight'] } },
            },
            required: ['table', 'entries'],
          },
        },
      },
      required: ['recipes', 'loot'],
    },
    { data: { names }, temperature: 0.6 },
  );
  c.say('narrator', 'propone', `${(rec.recipes ?? []).length} ricette e ${Array.isArray(rec.loot) ? rec.loot.length : 0} tabelle di bottino`);
  return { items, recipes: rec.recipes ?? [], loot: rec.loot ?? [] };
}

/** Things someone talked about that do not exist yet: the Narrator defines them, coherently. */
export async function defineItems(c: Council, names: string[], context: string): Promise<RawItem[]> {
  if (!names.length) return [];
  const r = await c.ask<{ items?: RawItem[]; oggetti?: RawItem[] }>(
    'narrator',
    'content.define',
    `In the world people talked about: ${names.join(', ')} (${context}). Define each one as a thing of the world, consistent with the bible. If something cannot exist in this world, leave it out.`,
    { type: 'OBJECT', properties: { items: { type: 'ARRAY', items: ITEM_SCHEMA } }, required: ['items'] },
    { data: { names, context }, temperature: 0.6 },
  );
  const items = itemsOf(r);
  if (items.length) c.say('narrator', 'propone', `nuovi oggetti nel mondo: ${items.map((o) => o.name).join(', ')}`);
  return items;
}

/** Raw model output → typed pack. Names in recipes and loot are resolved against all known items. */
export function assemblePack(raw: { items: RawItem[]; recipes: unknown[]; loot: unknown }, known: Map<string, string>, taken: Set<string>): Pack {
  const items = raw.items.map((r) => toItemDef(r, taken)).filter((d): d is ItemDef => !!d);
  const ids = new Map(known);
  for (const d of items) ids.set(normName(d.name), d.id);
  // Models rarely repeat names exactly ("Pane" for "Pagnotta di pane"): exact first, then by containment.
  const resolve = (name: unknown): string | undefined => {
    const n = normName(String(name ?? ''));
    if (!n) return undefined;
    if (ids.has(n)) return ids.get(n);
    let best: [string, number] | undefined;
    for (const [k, id] of ids) {
      if (!(k.includes(n) || n.includes(k)) || Math.min(k.length, n.length) < 3) continue;
      const score = Math.abs(k.length - n.length);
      if (!best || score < best[1]) best = [id, score];
    }
    return best?.[0];
  };
  const recipes: Recipe[] = [];
  for (const r of (raw.recipes ?? []) as Array<any>) {
    const inputs = (r?.inputs ?? []).map((i: any) => ({ item: resolve(i?.item), count: Math.round(clamp(i?.quantity, 1, 10, 1)) }));
    const out = resolve(r?.result?.item);
    const tools = (r?.tools ?? []).map(resolve).filter(Boolean);
    if (!out || !inputs.length || inputs.some((i: any) => !i.item) || inputs.some((i: any) => i.item === out)) continue;
    recipes.push({ id: `ricetta.${slug(String(r.name))}-${recipes.length}`, name: String(r.name).slice(0, 50), inputs, tools, output: { item: out, count: Math.round(clamp(r?.result?.quantity, 1, 10, 1)) } });
  }
  const loot: Record<string, LootTable> = {};
  for (const t of (Array.isArray(raw.loot) ? raw.loot : []) as Array<any>) {
    const key = slug(String(t?.table ?? ''));
    const entries = (t?.entries ?? [])
      .map((v: any) => (v?.item ? { item: resolve(v.item), weight: clamp(v.weight, 0.1, 100, 1) } : { tag: String(v?.tag ?? '').toLowerCase(), weight: clamp(v?.weight, 0.1, 100, 1) }))
      .filter((v: any) => v.item || v.tag);
    if (key && entries.length) loot[key] = { rolls: [1, 3], entries };
  }
  return { items, recipes, loot };
}

export interface Identity {
  name: string;
  persona: string;
  look: string;
  carrying: string[];
  /** What they wear on the head, the torso and the back (T353, ADR-0181): names of garments, the common ones first; empty if the card says nothing. */
  wearing: string[];
  /** Their place in society (ADR-0018). */
  job?: string;
  gender?: Gender;
  age?: string;
  family?: Relation[];
  routine?: RoutineStep[];
  story?: string;
}

const INDIVIDUAL_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    persona: { type: 'STRING' },
    look: { type: 'STRING' },
    carries: { type: 'ARRAY', items: { type: 'STRING' } },
    wears: { type: 'ARRAY', items: { type: 'STRING' }, description: 'what they wear on the head, the torso and the back, 0-3 garments by name: the common ones that exist when they fit, else new ones' },
    job: { type: 'STRING' },
    gender: { type: 'STRING', enum: ['male', 'female'] },
    age: { type: 'STRING', description: 'young, adult, old…, in the language of the world' },
    story: { type: 'STRING', description: 'two sentences: where they come from, what happened to them' },
    family: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          bond: { type: 'STRING', description: 'what THIS individual is to that person, in their gender, a word of the world (in Italian: madre, padre, figlia, figlio, sorella, fratello, moglie, marito, amica, amico, rivale, maestra, apprendista, padrone of an animal, animale of an owner…)' },
          // The kind of the bond as an id (T310b): the word is the world's, the kind is what the kernel checks.
          kind: { type: 'STRING', enum: [...RELATION_KINDS], description: 'the kind of the bond' },
        },
        required: ['name', 'bond', 'kind'],
      },
    },
    routine: {
      type: 'ARRAY',
      description: 'their day: 4 entries, one per moment',
      // The values are internal since T310 (the prompts are English); an Italian one is still taken internal (internalName).
      items: { type: 'OBJECT', properties: { when: { type: 'STRING', enum: internalValues('momenti') }, does: { type: 'STRING', description: 'what they do, short, in the language of the world (e.g. "impasta il pane")' }, where: { type: 'STRING', enum: internalValues('dove') }, activity: { type: 'STRING', enum: internalValues('attivita'), description: 'the gesture one sees them make' } }, required: ['when', 'does', 'where', 'activity'] },
    },
  },
  required: ['name', 'persona', 'look', 'carries', 'job', 'gender', 'family', 'routine'],
};

/** What the Narrator must know of relations for this species (the kernel repairs the rest). */
function relationRules(specie: Species): string {
  return [
    `In "family" each bond says what YOU are to that person, in the form of your gender, with its kind: {"name": "Tazio", "bond": "figlia", "kind": "child"} means you are Tazio's daughter. Kinds: ${RELATION_KINDS.join(', ')}; the words of the world (Italian): ${RELATION_WORDS.join(', ')}.`,
    specie === 'animal'
      ? 'It is an ANIMAL: no trades of a person (the "job" is what it does: catches mice, keeps watch), no human relatives, masters or apprentices. With a person it can only be "pet" (of an owner: one only), "friend" or "rival"; parent, child, sibling only with other animals of its kind.'
      : 'It is a PERSON: an animal is not their relative nor their apprentice; of an animal they can be "owner" (the animal has only one). At most one father, one mother and one spouse.',
    'The name must be new: different, also in its first word, from those of the people already known (no "Elias il Giovane" next to "Elias il Vecchio", no "Ombroso" next to "Ombra").',
  ].join('\n');
}

/**
 * Behind every archetype there are individuals: a name, a past, their own pockets — and a place in
 * society: a job, a family related to the people already known, a daily routine.
 */
export async function individuate(c: Council, archetype: { name: string; description: string; persona: string; specie?: Species }, ctx: { place: string; common: string[]; society?: string; avoid?: string[]; focus?: string[] }): Promise<Identity> {
  const specie = archetype.specie ?? 'person';
  const r = await c.ask<{ name: string; persona: string; look: string; carries: string[]; wears?: string[]; job?: string; gender?: string; age?: string; story?: string; storia?: string; family?: Array<{ name: string; bond: string; kind?: string }>; routine?: Array<{ when: string; does: string; where: string; activity?: string; action?: string }> }>(
    'narrator',
    'npc.individuate',
    [
      `Create an individual of this kind of character: «${archetype.name}» (${archetype.description}), ${specie === 'animal' ? 'an animal' : 'a person'}.`,
      `Sheet of the kind:\n${archetype.persona}`,
      `Place where they are: ${ctx.place || 'unknown'}.`,
      ctx.society ? `THE SOCIETY OF THE WORLD\n${ctx.society}` : '',
      'Give them a proper name, a short character and a story of their own (not generic), a gender (male or female), a trade, a detail of their look, and 3-6 things they carry consistent with their life (tools of the trade, food, keepsakes, small things).',
      specie === 'animal' ? 'An animal wears nothing: "wears" is empty.' : 'In "wears" what they wear on the head, the torso and the back (a hat, a tunic or an apron, a cloak or a shawl): 0-3 garments by name, of their trade and their means, the common ones that exist when they fit; an empty list if they wear nothing worth a word.',
      'Put them into society: give them a family (1-3 bonds) and, when it makes sense, bind them to people already known using EXACTLY their names (the miller\'s daughter, the mechanic\'s brother, the barmaid\'s rival: the trades of your world); they may also name relatives not met yet. If among the people named and never met there is one that fits this kind, you can be that very one (use their name).',
      relationRules(specie),
      ctx.avoid?.length ? `Names already taken or too similar, NOT to use: ${ctx.avoid.join(', ')}.` : '',
      'Describe their day in "routine": morning, day, evening, night — what they do and where (home, work, square, about).',
      `Prefer common things that exist already when they make sense: ${ctx.common.slice(0, 60).join(', ')}.`,
      'In "persona" write the sheet in the second person, in the language of the world (in Italian "Sei …"): how you speak, what you want, who your dear ones are, what you know and believe of your world (its legends, your way). You are a person of the world: you know nothing of games, code or simulations.',
    ]
      .filter(Boolean)
      .join('\n'),
    INDIVIDUAL_SCHEMA,
    { data: { archetype, ctx }, temperature: 1, focus: ctx.focus },
  );
  const job = String(r.job ?? '').slice(0, 40);
  const routine = (r.routine ?? [])
    // The `azione` of the schema of before is `action` once ported: the activity.
    .map((s) => (s && typeof s === 'object' ? { ...s, when: internalName('momenti', String(s.when)), where: internalName('dove', String(s.where)), activity: s.activity === undefined && s.action === undefined ? undefined : internalName('attivita', String(s.activity ?? s.action)) } : s))
    .filter((s) => (DAY_PHASES as string[]).includes(s?.when) && s?.does)
    .map((s) => {
      const where = ((WHERES as string[]).includes(s.where) ? s.where : 'about') as Where;
      const does = String(s.does).slice(0, 60);
      return { when: s.when as DayPhase, does, where, activity: (ACTIVITIES as readonly string[]).includes(s.activity ?? '') ? (s.activity as Activity) : inferActivity(does, where) };
    });
  const gender = typeof r.gender === 'string' ? internalName('specie', r.gender) : undefined;
  // `storia` is not in internalAnswer (it is `history` in the bible): an answer of before still says it.
  const story = r.story ?? r.storia;
  return {
    name: String(r.name ?? archetype.name).slice(0, 40),
    persona: String(r.persona ?? archetype.persona),
    look: String(r.look ?? ''),
    carrying: (r.carries ?? []).map(String).slice(0, 8),
    // An animal wears nothing, whatever the card says (T353).
    wearing: specie === 'animal' ? [] : (Array.isArray(r.wears) ? r.wears : []).filter((n) => typeof n === 'string' && n.trim()).map((n) => String(n).trim().slice(0, 60)).slice(0, 3),
    job,
    gender: gender === 'male' || gender === 'female' ? gender : undefined,
    age: r.age ? String(r.age).slice(0, 20) : undefined,
    story: story ? String(story).slice(0, 300) : undefined,
    // The kind of a bond as the schema says it (T310b); without it, the society reads the word (repairSociety).
    family: (r.family ?? []).filter((f) => f?.name && f?.bond).slice(0, 4).map((f) => ({ name: String(f.name).slice(0, 40), bond: String(f.bond).toLowerCase().slice(0, 20), ...(typeof f.kind === 'string' && (RELATION_KINDS as readonly string[]).includes(f.kind) ? { kind: f.kind } : {}) })),
    routine: DAY_PHASES.map((q) => routine.find((s) => s.when === q) ?? defaultRoutine(job).find((s) => s.when === q)!),
  };
}
