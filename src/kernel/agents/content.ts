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
import { ACTIVITIES, DAY_PHASES, defaultRoutine, inferActivity, RELATION_WORDS, WHERES, type Activity, type DayPhase, type Gender, type Relation, type RoutineStep, type Species, type Where } from '../npc/model';

const ITEM_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    nome: { type: 'STRING' },
    descrizione: { type: 'STRING' },
    // Categories and shapes are internal since T310 (the prompts are English); an Italian one of the contract 0.1 is still made internal by toItemDef.
    categoria: { type: 'STRING', enum: internalValues('categorie') },
    peso: { type: 'NUMBER' },
    pila: { type: 'INTEGER' },
    tag: { type: 'ARRAY', items: { type: 'STRING' } },
    effetti: { type: 'OBJECT', properties: { fame: { type: 'NUMBER' }, sete: { type: 'NUMBER' }, energia: { type: 'NUMBER' }, salute: { type: 'NUMBER' }, mana: { type: 'NUMBER' } } },
    impugnabile: { type: 'BOOLEAN' },
    contenitore: { type: 'INTEGER', description: 'only for bags, sacks, baskets, saddlebags carried on oneself: how many things fit inside (2-12)' },
    posto: { type: 'STRING', description: 'only for what is worn or held, one of these slot ids: testa, corpo, gambe, piedi, mani, arma, scudo, anello, collo, schiena' },
    bonus: { type: 'OBJECT', description: 'only for what is worn or held: what it gives', properties: { difesa: { type: 'NUMBER' }, attacco: { type: 'NUMBER' }, velocita: { type: 'NUMBER', description: 'a multiplier, e.g. 0.95 for a heavy armour, 1.1 for light boots' }, peso: { type: 'NUMBER', description: 'extra carrying weight (backpacks)' }, luce: { type: 'NUMBER' }, calore: { type: 'NUMBER' } } },
    aspetto: { type: 'STRING' },
    forma: { type: 'STRING', enum: internalValues('impronte').filter((f) => f !== 'shape'), description: 'the common shape it looks like (one model per shape, coloured like the thing)' },
  },
  required: ['nome', 'descrizione', 'categoria', 'peso', 'pila', 'tag', 'aspetto', 'forma'],
};

interface RawItem {
  nome: string;
  descrizione: string;
  categoria: string;
  peso: number;
  pila: number;
  tag: string[];
  effetti?: { fame?: number; sete?: number; energia?: number; salute?: number; mana?: number };
  impugnabile?: boolean;
  contenitore?: number;
  aspetto: string;
  forma?: string;
  posto?: string;
  bonus?: Record<string, number>;
}

export interface Pack {
  items: ItemDef[];
  recipes: Recipe[];
  loot: Record<string, LootTable>;
}

const clamp = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

export function toItemDef(r: RawItem, taken: Set<string>): ItemDef | null {
  if (!r?.nome?.trim()) return null;
  let id = `item.${slug(r.nome)}`;
  for (let i = 2; taken.has(id); i++) id = `item.${slug(r.nome)}-${i}`;
  taken.add(id);
  const named = internalName('categorie', String(r.categoria ?? ''));
  const category = (ITEM_CATEGORIES as readonly string[]).includes(named) ? (named as ItemDef['category']) : 'misc';
  const e = r.effetti ?? {};
  const effects = { hunger: clamp(e.fame, -50, 60, 0), thirst: clamp(e.sete, -50, 60, 0), energy: clamp(e.energia, -50, 60, 0), health: clamp(e.salute, -50, 60, 0), mana: clamp(e.mana, -50, 60, 0) };
  const bag = category === 'container' && Number(r.contenitore) >= 2 ? { size: Math.round(clamp(r.contenitore, 2, 12, 4)) } : undefined;
  const hasEffects = Object.values(effects).some((v) => v !== 0);
  return {
    id,
    name: r.nome.trim().slice(0, 40),
    description: String(r.descrizione ?? '').slice(0, 240),
    category,
    weight: clamp(r.peso, 0, 30, 1),
    stack: bag ? 1 : Math.round(clamp(r.pila, 1, 50, 1)),
    tags: [...new Set((r.tag ?? []).map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 8))],
    glyph: CATEGORY_GLYPHS[category] ?? '•',
    color: `hsl(${hashStr(id) % 360} 60% 66%)`,
    look: String(r.aspetto ?? r.nome).slice(0, 200),
    ...((ITEM_SHAPES as readonly string[]).includes(internalName('impronte', r.forma ?? '')) ? { model: itemShapeModel(internalName('impronte', r.forma!)) } : {}),
    equippable: !!r.impugnabile,
    ...(hasEffects ? { effects } : {}),
    ...(bag ? { container: bag } : {}),
    ...(r.posto && /^[a-z]{3,12}$/.test(String(r.posto).toLowerCase().trim()) ? { slot: String(r.posto).toLowerCase().trim() } : {}),
    ...(r.bonus && typeof r.bonus === 'object' ? { bonus: Object.fromEntries(Object.entries(r.bonus).filter(([, v]) => typeof v === 'number' && Number.isFinite(v)).map(([k, v]) => [k, Math.max(-50, Math.min(50, v as number))])) } : {}),
  };
}

/** A pack of new items with recipes and loot tables, cross-checked by the Physicist and the Arbiter. */
export async function itemPack(c: Council, opts: { count: number; existing: string[]; hints: string[]; tags: string[] }): Promise<{ items: RawItem[]; recipes: unknown[]; loot: unknown }> {
  const askItems = (feedback = '') =>
    c.ask<{ oggetti: RawItem[] }>(
      'narrator',
      'content.items',
      [
        `Invent ${opts.count} things for this world, of the kind often found in houses, workshops, fields and woods (Project Zomboid style: many common, useful, believable things; few rare ones).`,
        `Vary the categories: food, drinks, medicines, tools, weapons, materials, lights, clothing, containers, misc.`,
        opts.hints.length ? `Include, if consistent with the world: ${opts.hints.join(', ')}.` : '',
        opts.existing.length ? `They exist already (do not repeat them): ${opts.existing.slice(-80).join(', ')}.` : '',
        `"effetti" (from -50 to 60) only for what is consumed: hunger/thirst/energy/health restored ("fame", "sete", "energia", "salute"). "pila": how many stack (1 for tools and weapons). "peso" in units (the wanderer carries 20). "tag": words useful to find and combine them, like the common ones (e.g. cucina, legno, metallo, erbe, bottega, contadino). Common tags to use: ${opts.tags.join(', ')}.`,
        feedback && `The Arbiter objected: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n'),
      { type: 'OBJECT', properties: { oggetti: { type: 'ARRAY', items: ITEM_SCHEMA } }, required: ['oggetti'] },
      { data: { ...opts, feedback }, temperature: 0.95 },
    );
  let { oggetti } = await askItems();
  c.say('narrator', 'propone', `${oggetti.length} oggetti: ${oggetti.slice(0, 8).map((o) => o.nome).join(', ')}${oggetti.length > 8 ? '…' : ''}`);

  // The Physicist checks weights, stacks and effects against what the things are.
  const phys = await c.ask<{ correzioni: Array<{ nome: string; peso?: number; pila?: number; effetti?: RawItem['effetti']; nota?: string }> }>(
    'physicist',
    'content.physics',
    `Check the weight, stack and effects of these things: fix only what is physically inconsistent (an anvil does not weigh 1, an axe does not stack, bread does not give 60 energy).\n${oggetti.map((o) => `${o.nome}: weight ${o.peso}, stack ${o.pila}, effects ${JSON.stringify(o.effetti ?? {})}`).join('\n')}`,
    {
      type: 'OBJECT',
      properties: {
        correzioni: {
          type: 'ARRAY',
          items: { type: 'OBJECT', properties: { nome: { type: 'STRING' }, peso: { type: 'NUMBER' }, pila: { type: 'INTEGER' }, effetti: ITEM_SCHEMA.properties!.effetti, nota: { type: 'STRING' } }, required: ['nome'] },
        },
      },
      required: ['correzioni'],
    },
    { data: { oggetti }, temperature: 0.2 },
  );
  for (const fix of phys.correzioni ?? []) {
    const it = oggetti.find((o) => o.nome === fix.nome);
    if (!it) continue;
    if (typeof fix.peso === 'number') it.peso = fix.peso;
    if (typeof fix.pila === 'number') it.pila = fix.pila;
    if (fix.effetti) it.effetti = fix.effetti;
  }
  if (phys.correzioni?.length) c.say('physicist', 'corregge', phys.correzioni.slice(0, 4).map((f) => `${f.nome}${f.nota ? `: ${f.nota}` : ''}`).join('; '), 'narrator');

  const review = await c.ask<{ approvato: boolean; problemi: Array<{ agente: AgentId; problema: string }> }>(
    'arbiter',
    'content.review',
    `Are these things consistent with the world (age, tone, technology)? Point out only the ones out of place.\n${oggetti.map((o) => `${o.nome} (${o.categoria}): ${o.descrizione}`).join('\n')}`,
    { type: 'OBJECT', properties: { approvato: { type: 'BOOLEAN' }, problemi: { type: 'ARRAY', items: { type: 'OBJECT', properties: { agente: { type: 'STRING', enum: ['narrator'] }, problema: { type: 'STRING' } }, required: ['agente', 'problema'] } } }, required: ['approvato', 'problemi'] },
    { data: { oggetti }, temperature: 0.2 },
  );
  if (!review.approvato && review.problemi?.length) {
    const issues = review.problemi.map((p) => p.problema).join('; ');
    c.say('arbiter', 'obietta', issues, 'narrator');
    ({ oggetti } = await askItems(issues));
    c.say('narrator', 'corregge', `${oggetti.length} oggetti riscritti`);
  } else c.say('arbiter', 'approva', 'Gli oggetti appartengono al mondo.');

  const names = [...opts.existing, ...oggetti.map((o) => o.nome)];
  const rec = await c.ask<{ ricette: unknown[]; bottino: unknown }>(
    'narrator',
    'content.recipes',
    [
      `Write 6-10 crafting recipes using ONLY these things (exact names): ${names.slice(-120).join(', ')}.`,
      'Each recipe: ingredients consumed, tools needed but not consumed, one result. They must make sense (rope + stick → a rough fishing rod, only if it exists).',
      'Then "bottino": tables of what is found where. Suggested keys: comune, cucina, cassa, bottega, terreno, contadino, bosco. Each entry picks by "tag" (a category or a tag of the things) or by "oggetto" (exact name), with a weight.',
    ].join('\n'),
    {
      type: 'OBJECT',
      properties: {
        ricette: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              nome: { type: 'STRING' },
              ingredienti: { type: 'ARRAY', items: { type: 'OBJECT', properties: { oggetto: { type: 'STRING' }, quantita: { type: 'INTEGER' } }, required: ['oggetto', 'quantita'] } },
              attrezzi: { type: 'ARRAY', items: { type: 'STRING' } },
              risultato: { type: 'OBJECT', properties: { oggetto: { type: 'STRING' }, quantita: { type: 'INTEGER' } }, required: ['oggetto', 'quantita'] },
            },
            required: ['nome', 'ingredienti', 'risultato'],
          },
        },
        bottino: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              tabella: { type: 'STRING' },
              voci: { type: 'ARRAY', items: { type: 'OBJECT', properties: { tag: { type: 'STRING' }, oggetto: { type: 'STRING' }, peso: { type: 'NUMBER' } }, required: ['peso'] } },
            },
            required: ['tabella', 'voci'],
          },
        },
      },
      required: ['ricette', 'bottino'],
    },
    { data: { names }, temperature: 0.6 },
  );
  c.say('narrator', 'propone', `${(rec.ricette ?? []).length} ricette e ${Array.isArray(rec.bottino) ? rec.bottino.length : 0} tabelle di bottino`);
  return { items: oggetti, recipes: rec.ricette ?? [], loot: rec.bottino ?? [] };
}

/** Things someone talked about that do not exist yet: the Narrator defines them, coherently. */
export async function defineItems(c: Council, names: string[], context: string): Promise<RawItem[]> {
  if (!names.length) return [];
  const r = await c.ask<{ oggetti: RawItem[] }>(
    'narrator',
    'content.define',
    `In the world people talked about: ${names.join(', ')} (${context}). Define each one as a thing of the world, consistent with the bible. If something cannot exist in this world, leave it out.`,
    { type: 'OBJECT', properties: { oggetti: { type: 'ARRAY', items: ITEM_SCHEMA } }, required: ['oggetti'] },
    { data: { names, context }, temperature: 0.6 },
  );
  if (r.oggetti?.length) c.say('narrator', 'propone', `nuovi oggetti nel mondo: ${r.oggetti.map((o) => o.nome).join(', ')}`);
  return r.oggetti ?? [];
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
    const inputs = (r?.ingredienti ?? []).map((i: any) => ({ item: resolve(i?.oggetto), count: Math.round(clamp(i?.quantita, 1, 10, 1)) }));
    const out = resolve(r?.risultato?.oggetto);
    const tools = (r?.attrezzi ?? []).map(resolve).filter(Boolean);
    if (!out || !inputs.length || inputs.some((i: any) => !i.item) || inputs.some((i: any) => i.item === out)) continue;
    recipes.push({ id: `ricetta.${slug(String(r.nome))}-${recipes.length}`, name: String(r.nome).slice(0, 50), inputs, tools, output: { item: out, count: Math.round(clamp(r?.risultato?.quantita, 1, 10, 1)) } });
  }
  const loot: Record<string, LootTable> = {};
  for (const t of (Array.isArray(raw.loot) ? raw.loot : []) as Array<any>) {
    const key = slug(String(t?.tabella ?? ''));
    const entries = (t?.voci ?? [])
      .map((v: any) => (v?.oggetto ? { item: resolve(v.oggetto), weight: clamp(v.peso, 0.1, 100, 1) } : { tag: String(v?.tag ?? '').toLowerCase(), weight: clamp(v?.peso, 0.1, 100, 1) }))
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
    nome: { type: 'STRING' },
    persona: { type: 'STRING' },
    aspetto: { type: 'STRING' },
    porta: { type: 'ARRAY', items: { type: 'STRING' } },
    indossa: { type: 'ARRAY', items: { type: 'STRING' }, description: 'what they wear on the head, the torso and the back, 0-3 garments by name: the common ones that exist when they fit, else new ones' },
    mestiere: { type: 'STRING' },
    genere: { type: 'STRING', enum: ['male', 'female'] },
    eta: { type: 'STRING', description: 'young, adult, old…, in the language of the world' },
    storia: { type: 'STRING', description: 'two sentences: where they come from, what happened to them' },
    famiglia: { type: 'ARRAY', items: { type: 'OBJECT', properties: { nome: { type: 'STRING' }, legame: { type: 'STRING', description: 'what THIS individual is to that person, in their gender, a word of the world: madre, padre, figlia, figlio, sorella, fratello, moglie, marito, amica, amico, rivale, maestra, apprendista, padrone (of an animal), animale (of an owner)…' } }, required: ['nome', 'legame'] } },
    routine: {
      type: 'ARRAY',
      description: 'their day: 4 entries, one per moment',
      // The values are internal since T310 (the prompts are English); an Italian one is still taken internal (internalName).
      items: { type: 'OBJECT', properties: { quando: { type: 'STRING', enum: internalValues('momenti') }, fa: { type: 'STRING', description: 'what they do, short, in the language of the world (e.g. "impasta il pane")' }, dove: { type: 'STRING', enum: internalValues('dove') }, azione: { type: 'STRING', enum: internalValues('attivita'), description: 'the gesture one sees them make' } }, required: ['quando', 'fa', 'dove', 'azione'] },
    },
  },
  required: ['nome', 'persona', 'aspetto', 'porta', 'mestiere', 'genere', 'famiglia', 'routine'],
};

/** What the Narrator must know of relations for this species (the kernel repairs the rest). */
function relationRules(specie: Species): string {
  return [
    `In "famiglia" each bond says what YOU are to that person, in the form of your gender: {"nome": "Tazio", "legame": "figlia"} means you are Tazio's daughter. Possible words: ${RELATION_WORDS.join(', ')}.`,
    specie === 'animal'
      ? 'It is an ANIMAL: no trades of a person (the "mestiere" is what it does: catches mice, keeps watch), no human relatives, masters or apprentices. With a person it can only be "animale" (of an owner: one only), "amico" or "rivale"; madre, padre, figlio, fratello only with other animals of its kind.'
      : 'It is a PERSON: an animal is not their relative nor their apprentice; of an animal they can be "padrone" (the animal has only one). At most one father, one mother and one spouse.',
    'The name must be new: different, also in its first word, from those of the people already known (no "Elias il Giovane" next to "Elias il Vecchio", no "Ombroso" next to "Ombra").',
  ].join('\n');
}

/**
 * Behind every archetype there are individuals: a name, a past, their own pockets — and a place in
 * society: a job, a family related to the people already known, a daily routine.
 */
export async function individuate(c: Council, archetype: { name: string; description: string; persona: string; specie?: Species }, ctx: { place: string; common: string[]; society?: string; avoid?: string[]; focus?: string[] }): Promise<Identity> {
  const specie = archetype.specie ?? 'person';
  const r = await c.ask<{ nome: string; persona: string; aspetto: string; porta: string[]; indossa?: string[]; mestiere?: string; genere?: string; eta?: string; storia?: string; famiglia?: Array<{ nome: string; legame: string }>; routine?: Array<{ quando: string; fa: string; dove: string; azione?: string }> }>(
    'narrator',
    'npc.individuate',
    [
      `Create an individual of this kind of character: «${archetype.name}» (${archetype.description}), ${specie === 'animal' ? 'an animal' : 'a person'}.`,
      `Sheet of the kind:\n${archetype.persona}`,
      `Place where they are: ${ctx.place || 'unknown'}.`,
      ctx.society ? `THE SOCIETY OF THE WORLD\n${ctx.society}` : '',
      'Give them a proper name, a short character and a story of their own (not generic), a gender (male or female), a trade, a detail of their look, and 3-6 things they carry consistent with their life (tools of the trade, food, keepsakes, small things).',
      specie === 'animal' ? 'An animal wears nothing: "indossa" is empty.' : 'In "indossa" what they wear on the head, the torso and the back (a hat, a tunic or an apron, a cloak or a shawl): 0-3 garments by name, of their trade and their means, the common ones that exist when they fit; an empty list if they wear nothing worth a word.',
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
  const job = String(r.mestiere ?? '').slice(0, 40);
  const routine = (r.routine ?? [])
    .map((s) => (s && typeof s === 'object' ? { ...s, quando: internalName('momenti', String(s.quando)), dove: internalName('dove', String(s.dove)), azione: s.azione === undefined ? undefined : internalName('attivita', String(s.azione)) } : s))
    .filter((s) => (DAY_PHASES as string[]).includes(s?.quando) && s?.fa)
    .map((s) => {
      const dove = ((WHERES as string[]).includes(s.dove) ? s.dove : 'about') as Where;
      const fa = String(s.fa).slice(0, 60);
      return { when: s.quando as DayPhase, does: fa, where: dove, activity: (ACTIVITIES as readonly string[]).includes(s.azione ?? '') ? (s.azione as Activity) : inferActivity(fa, dove) };
    });
  const genere = typeof r.genere === 'string' ? internalName('specie', r.genere) : undefined;
  return {
    name: String(r.nome ?? archetype.name).slice(0, 40),
    persona: String(r.persona ?? archetype.persona),
    look: String(r.aspetto ?? ''),
    carrying: (r.porta ?? []).map(String).slice(0, 8),
    // An animal wears nothing, whatever the card says (T353).
    wearing: specie === 'animal' ? [] : (Array.isArray(r.indossa) ? r.indossa : []).filter((n) => typeof n === 'string' && n.trim()).map((n) => String(n).trim().slice(0, 60)).slice(0, 3),
    job,
    gender: genere === 'male' || genere === 'female' ? genere : undefined,
    age: r.eta ? String(r.eta).slice(0, 20) : undefined,
    story: r.storia ? String(r.storia).slice(0, 300) : undefined,
    // The Narrator writes with the Italian fields of its schema (until T310b): the individual has those of 0.4 (T308a).
    family: (r.famiglia ?? []).filter((f) => f?.nome && f?.legame).slice(0, 4).map((f) => ({ name: String(f.nome).slice(0, 40), bond: String(f.legame).toLowerCase().slice(0, 20) })),
    routine: DAY_PHASES.map((q) => routine.find((s) => s.when === q) ?? defaultRoutine(job).find((s) => s.when === q)!),
  };
}
