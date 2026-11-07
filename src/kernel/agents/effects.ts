// Free actions ("Altro…"): the player writes what they do to an entity; the Narrator judges whether it
// can happen and what follows, choosing effects from a closed set (types.ts → Effect). The kernel
// validates them (validator.ts → validateEffects) and core.effects (Lua) applies them. An action that
// makes sense and can be repeated is learned by the object: it enters its menu, no further calls.

import type { Schema } from '../ai/models';
import { internalName, internalValues } from '../internalNames';
import type { Council } from './council';

export interface ActionContext {
  /** What the player wrote. */
  text: string;
  target: { name: string; description: string; tags: string[]; container: boolean; kind: string };
  /** Names of what the player carries, and what they hold. */
  carrying: string[];
  holding: string;
  /** Tile under the target and the terrains of the world (names). */
  tile: string;
  terrains: string[];
  /** Modules that can be summoned (names), and loot tables. */
  summonable: string[];
  loot: string[];
  place: string;
  /** The wanderer transcended: the Council goes along with almost anything. */
  transcended?: boolean;
  /** The entity has a model of its own: what changes its look can become a rule of the model (ADR-0044). */
  shape?: boolean;
  /** The target is another wanderer (T43b): whether they may be harmed (`partita.pvp`), whether they are the master (a god). */
  between?: { pvp: boolean; god: boolean };
}

export interface ActionJudgement {
  possible: boolean;
  story: string;
  effects: unknown[];
  repeatable: boolean;
  label: string;
  /** Item (name) the action needs, if any. */
  requires?: string;
  /** How the entity's look changes, if it does: the Sculptor writes it as an action of its model. */
  shape?: string;
}

const EFFECT_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    // The effects and their fields are internal since T310 (the prompts are English); validateEffects still makes an Italian one internal.
    type: { type: 'STRING', enum: internalValues('effetti') },
    text: { type: 'STRING' },
    item: { type: 'STRING', description: 'name of a thing (create_item, consume)' },
    name: { type: 'STRING', description: 'state/remove_state: the name of the condition, in the language of the world (e.g. «a cavallo»)' },
    speed: { type: 'NUMBER' },
    weight: { type: 'NUMBER' },
    light: { type: 'NUMBER' },
    bond: { type: 'STRING' },
    quantity: { type: 'INTEGER' },
    to: { type: 'STRING', description: 'terrain: name of the resulting terrain' },
    from: { type: 'STRING', description: 'terrain: only the tiles of this terrain (optional)' },
    delta: { type: 'INTEGER', description: 'relief: levels to dig or raise (positive = raise, negative = dig)' },
    radius: { type: 'NUMBER' },
    duration: { type: 'NUMBER', description: 'seconds' },
    force: { type: 'NUMBER' },
    module: { type: 'STRING', description: 'summon: name of what appears' },
    hunger: { type: 'NUMBER' },
    thirst: { type: 'NUMBER' },
    energy: { type: 'NUMBER' },
    health: { type: 'NUMBER' },
    capacity: { type: 'INTEGER' },
    loot: { type: 'STRING' },
  },
  required: ['type'],
};

const JUDGE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    possibile: { type: 'BOOLEAN' },
    racconto: { type: 'STRING', description: 'what happens, 1-2 sentences, second person' },
    effetti: { type: 'ARRAY', items: EFFECT_SCHEMA },
    ripetibile: { type: 'BOOLEAN', description: 'true if it is a sensible action that can always be done again the same way on things like this one' },
    etichetta: { type: 'STRING', description: 'the action as a menu entry, 1-3 words (e.g. «Forza la serratura»)' },
    serve: { type: 'STRING', description: 'thing the wanderer must have to do it (optional, among the ones they carry)' },
    forma: { type: 'STRING', description: 'if the look of the thing itself changes, and it stays there: how it changes, in a few words (optional)' },
  },
  required: ['possibile', 'racconto', 'effetti', 'ripetibile', 'etichetta'],
};

export const EFFECTS_GUIDE = [
  'message {text}: only a story, no change',
  'needs {hunger, thirst, energy, health}: changes from -40 to +40 (positive = better)',
  'create_item {item, quantity}: a thing appears on the ground (a new one too, if it makes sense)',
  'consume {item, quantity}: the wanderer spends another thing they carry (an ingredient, some food); NEVER the thing acted upon: that one stays, unless destroy',
  'destroy: the thing breaks or ends (and leaves what it held)',
  'open: it opens (if it is a container)',
  'container {capacity, loot}: the thing becomes openable (it has a space inside)',
  'terrain {to, from, radius}: the terrain around changes (radius 0-3)',
  'relief {delta, radius}: raises (positive delta) or digs (negative delta) the ground by whole levels around (radius 0-3)',
  'fire {radius, duration}: flames that burn what is flammable',
  'light {radius, duration}: a light',
  'shield {duration}: the wanderer is protected',
  'push {force}: the thing is pushed away',
  'summon {module}: something or someone that already exists in the world appears',
  'state {name, speed, weight, light, duration}: a condition of the wanderer that makes a new mechanic possible (on horseback: speed 1.8; with the backpack: weight 15; with the torch: light 5; duration in seconds, 0 = until it is removed)',
  'remove_state {name}: a condition ends (getting off the horse, putting down the backpack)',
  'ONLY ON A PERSON — bond {bond}: what they become to the wanderer, a word of the world (amico, innamorata, moglie, marito, nemico…); memory {text, weight 1-3}: what they will remember; birth {name}: a child is born (only between spouses, and only if the person wants it)',
].join('\n');

export async function judgeAction(c: Council, ctx: ActionContext, focus?: string[]): Promise<ActionJudgement> {
  const t = ctx.target;
  const prompt = [
    `The wanderer, in front of «${t.name}» (${t.kind}: ${t.description}${t.tags.length ? `; tags ${t.tags.join(', ')}` : ''}${t.container ? '; it is a container' : ''}), writes: «${ctx.text}».`,
    `Carries: ${ctx.carrying.join(', ') || 'nothing'}. Holds: ${ctx.holding}. Under the thing: ${ctx.tile}. Place: ${ctx.place || 'unknown'}.`,
    ctx.transcended
      ? `The wanderer has transcended: they are a member of the Council and have seen the code of the world. Go along with what they want to do (as long as it does not destroy the universe, themselves or the laws of the game), choosing the effects that make it happen best.`
      : `Judge as the Council: is it possible, in the world and for physics? If not, "possibile" false and tell why it does not work (no effects or only a message).`,
    `If so, choose the effects (at most 4) ONLY from this list:\n${EFFECTS_GUIDE}`,
    `Existing terrains: ${ctx.terrains.join(', ')}. Things that can be summoned: ${ctx.summonable.slice(0, 30).join(', ') || 'none'}. Loot tables: ${ctx.loot.join(', ')}.`,
    `Be faithful to physics: no miracles without tools or runes; it takes the right tool to pick a lock, cut, dig. If a thing the wanderer carries is needed, put it in "serve".`,
    `Make the game evolve: if the action opens a sensible new mechanic (riding the saddled horse, rowing the boat, wearing the backpack), make it possible with a "state", and it will become a repeatable action of the thing.`,
    ctx.between &&
      [
        `«${t.name}» is another wanderer, a real person like them: judge as on a person. The effects needs, shield, state and remove_state apply to «${t.name}», not to whoever acts; push pushes them away; no bond, memory, birth, destroy, open, container.`,
        ctx.between.god
          ? `Nothing reaches «${t.name}»: only a message.`
          : ctx.between.pvp
            ? 'In this world the wanderers can hurt each other.'
            : 'In this world the wanderers cannot hurt each other: no needs that go down, push, fire, states that slow down, remove_state; if the action means to hurt, it fails (or stays a message).',
      ].join(' '),
    ctx.shape &&
      `If what the wanderer does changes the look of the thing, which stays there (it opens, chips, lights up, goes out, bends, gets stained), write in "forma" how it changes, in a few words: it will become a rule of its shape, for all the things of this kind. In that case no "destroy"; the effects are for what is not look (light, fire, needs, things).`,
  ]
    .filter(Boolean)
    .join('\n\n');
  const r = await c.ask<{ possibile: boolean; racconto: string; effetti?: unknown[]; ripetibile?: boolean; etichetta?: string; serve?: string; forma?: string }>('narrator', 'action.judge', prompt, JUDGE_SCHEMA, {
    data: ctx,
    temperature: 0.5,
    focus,
  });
  return {
    possible: !!r.possibile,
    story: String(r.racconto ?? ''),
    effects: Array.isArray(r.effetti) ? r.effetti : [],
    repeatable: !!r.ripetibile,
    label: String(r.etichetta ?? ctx.text).slice(0, 40),
    requires: r.serve ? String(r.serve) : undefined,
    shape: ctx.shape && r.forma?.trim() ? String(r.forma).trim().slice(0, 200) : undefined,
  };
}

const SPELL_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    nome: { type: 'STRING', description: 'name of the incantation, 1-2 words, in the language of the world' },
    descrizione: { type: 'STRING', description: 'what it does, one sentence' },
    costo: { type: 'INTEGER', description: 'energy of the wanderer it consumes, from 3 to 40' },
    effetti: { type: 'ARRAY', items: EFFECT_SCHEMA },
    runa_nuova: { type: 'STRING', description: 'almost always empty; only if this formula calls for an element no rune has: that element in one word (e.g. blood, ice), a new rune to be found' },
  },
  required: ['nome', 'descrizione', 'costo', 'effetti'],
};

/**
 * How a sequence of runes composes (T57a): a program, where order matters and repetition strengthens.
 * The examples guide, they are not a list; the effects stay the closed set the kernel validates.
 */
export const SPELL_GUIDE = [
  'A sequence of runes is a program: the order matters (terra ignis ≠ ignis terra: two different incantations) and repeating a rune strengthens it (bigger radius, duration, force).',
  'Usually the first rune gives the form (terra: body and weight, a ball, a wall; ventus: throws, pushes, scatters; scutum: encloses, protects; lux: reveals) and the others what it carries (ignis, aqua, vita, lux).',
  'Examples of how it composes, not a list to copy: terra ignis → fireball (fire radius 2); terra ignis ignis → bigger fireball (fire radius 3, longer duration); ignis terra ignis → fiery darts (fire radius 1 and push); aqua → makes water (terrain to water); terra ventus terra → the ground rises (relief delta 2 radius 1); ventus terra ventus → the ground sinks (relief delta -2 radius 1).',
  'Like an incantation of D&D: a real effect on the place or on people (fire, push, terrain, relief, light, needs, shield, state), never only a message; more runes = stronger and more costly.',
  'Not all the runes are known: if the formula calls for an element no rune has (blood, ice), write it in runa_nuova and the world will have one to find; rarely, it almost always stays empty.',
].join(' ');

export interface SpellDraft {
  name: string;
  description: string;
  cost: number;
  effects: unknown[];
  /** The element of a new rune this formula calls for (T57b), if any. */
  newRune?: string;
}

/**
 * An incantation never spoken before: the Narrator decides, once, what this sequence of runes does.
 * Coherent with the runes' elements and with the incantations already known; stronger costs more.
 */
export async function nameSpell(
  c: Council,
  runes: Array<{ token: string; name: string; element: string; description: string }>,
  known: Array<{ sequence: string; name: string; description: string }>,
  terrains: string[],
  focus?: string[],
): Promise<SpellDraft> {
  const seq = runes.map((r) => r.token).join(' ');
  // The same runes in another order are another incantation: the Narrator sees which ones already exist.
  const sorted = (s: string) => s.split(' ').sort().join(' ');
  const reordered = known.filter((k) => k.sequence !== seq && sorted(k.sequence) === sorted(seq));
  const prompt = [
    `The wanderer speaks, in this order, the runes: ${runes.map((r) => `"${r.token}" (${r.name}, ${r.element}: ${r.description})`).join(', ')}.`,
    `Incantations already known:\n${known.map((k) => `- ${k.sequence} → ${k.name}: ${k.description}`).join('\n') || '(none)'}`,
    reordered.length ? `The same runes in another order are already another incantation (${reordered.map((k) => `${k.sequence} → ${k.name}`).join('; ')}): this sequence must do something else.` : '',
    `Decide what this sequence (${seq}) does, consistent with the elements of the runes, with the known incantations and with the world. ${SPELL_GUIDE}\nEffects (at most 4) ONLY from this list:\n${EFFECTS_GUIDE}`,
    `Existing terrains: ${terrains.join(', ')}. The effects act on what the wanderer has in front of them (or on the wanderer themselves for needs and shield).`,
  ]
    .filter(Boolean)
    .join('\n\n');
  const r = await c.ask<{ nome: string; descrizione: string; costo: number; effetti?: unknown[]; runa_nuova?: string }>('narrator', 'spell.name', prompt, SPELL_SCHEMA, {
    data: { runes, known, terrains },
    temperature: 0.7,
    focus,
  });
  return {
    name: String(r.nome ?? seq).slice(0, 40),
    description: String(r.descrizione ?? '').slice(0, 200),
    cost: Math.max(3, Math.min(40, Math.round(Number(r.costo) || 10))),
    effects: Array.isArray(r.effetti) ? r.effetti : [],
    ...(typeof r.runa_nuova === 'string' && r.runa_nuova.trim() ? { newRune: r.runa_nuova.trim().slice(0, 60) } : {}),
  };
}

const RUNE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    token: { type: 'STRING', description: 'the word of the rune, in Latin like the others, lower case, 3-12 letters without accents (e.g. sanguis): it is also the word of the code' },
    nome: { type: 'STRING', description: 'the ancient name of the rune, one word (like Kenaz, Laguz), different from all the others' },
    glifo: { type: 'STRING', description: 'a single runic sign (one Unicode character of the runic block), different from the ones already used' },
    colore: { type: 'STRING', description: 'the colour of its light, #rrggbb' },
    elemento: { type: 'STRING', description: 'the element, one word, in English (e.g. blood)' },
    descrizione: { type: 'STRING', description: 'what it means, like the others, in the language of the world: «la fiaccola: brucia, scalda»' },
    canone: { type: 'STRING', description: 'a line of the canon, in the language of the world: what those who live in the world know of this rune, without saying who carved it or why' },
  },
  required: ['token', 'nome', 'glifo', 'colore', 'elemento', 'descrizione', 'canone'],
};

/**
 * A new magic rune (T57b): the Narrator invents it, with what it means in the canon, for a reason (a session of
 * the Council, a formula that called for it). `errors` are the reasons a previous attempt was refused.
 */
export async function inventRune(
  c: Council,
  known: Array<{ token: string; name: string; glyph: string; element: string; description: string }>,
  reason: string,
  errors: string[] = [],
  focus?: string[],
): Promise<Record<string, unknown>> {
  const prompt = [
    `The world has one more magic rune to be found: ${reason}.`,
    `The magic runes there are already:\n${known.map((r) => `- ${r.glyph} ${r.name} ("${r.token}", ${r.element}): ${r.description}`).join('\n')}`,
    'Invent the new rune: an element none of these has, a word (its token, Latin) that does not look like the others, an ancient name, a sign and a colour of its own, what it means. It must compose with the others in formulas (the order matters, repeating it strengthens it), with real effects on the place and on people; like all the runes it is a slab on the ground, rare, that stays until someone picks it up.',
    errors.length ? `The previous proposal was refused: ${errors.join('; ')}. Fix it.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  return c.ask<Record<string, unknown>>('narrator', 'rune.invent', prompt, RUNE_SCHEMA, { data: { known, reason, errors }, temperature: 0.8, focus });
}

const CRAFT_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    possibile: { type: 'BOOLEAN' },
    racconto: { type: 'STRING', description: 'how you do it, or why it cannot be done: 1-2 sentences, second person' },
    risultato: { type: 'STRING', description: 'name of the thing you get' },
    descrizione: { type: 'STRING', description: 'what the thing you get is like, if it is new' },
    quantita: { type: 'INTEGER' },
    ingredienti: { type: 'ARRAY', items: { type: 'OBJECT', properties: { oggetto: { type: 'STRING' }, quantita: { type: 'INTEGER' } }, required: ['oggetto', 'quantita'] }, description: 'things you carry that are consumed' },
    attrezzi: { type: 'ARRAY', items: { type: 'STRING' }, description: 'things you carry, needed but not consumed' },
  },
  required: ['possibile', 'racconto'],
};

export interface CraftJudgement {
  possible: boolean;
  story: string;
  result?: string;
  description?: string;
  count: number;
  inputs: Array<{ item: string; count: number }>;
  tools: string[];
}

/**
 * Free crafting: the player says what they want to make from what they carry. The Narrator (with the
 * Physicist's sense) decides whether it can be made and from what; the kernel checks that every
 * ingredient is really carried, and a possible recipe becomes a rule of the world (a known recipe).
 */
export async function judgeCraft(c: Council, text: string, carrying: string[], known: string[], focus?: string[]): Promise<CraftJudgement> {
  const prompt = [
    `The wanderer wants to make: «${text}».`,
    `Carries: ${carrying.join(', ') || 'nothing'}.`,
    `Things that already exist in the world (use these names if the result is one of them): ${known.slice(0, 80).join(', ')}.`,
    `Can it be made with what they carry, by hand, believably? If so: "risultato" (name), "quantita", the "ingredienti" consumed and the "attrezzi" used, ONLY among the things they carry and with exact names; if the result does not exist yet, describe it. If not, "possibile" false and explain what is missing. Be as strict as a real craftsman.`,
  ].join('\n\n');
  const r = await c.ask<{ possibile: boolean; racconto: string; risultato?: string; descrizione?: string; quantita?: number; ingredienti?: Array<{ oggetto: string; quantita: number }>; attrezzi?: string[] }>('narrator', 'craft.free', prompt, CRAFT_SCHEMA, {
    data: { text, carrying, known },
    temperature: 0.4,
    focus,
  });
  return {
    possible: !!r.possibile && !!r.risultato,
    story: String(r.racconto ?? ''),
    result: r.risultato ? String(r.risultato).slice(0, 40) : undefined,
    description: r.descrizione ? String(r.descrizione).slice(0, 200) : undefined,
    count: Math.max(1, Math.min(10, Math.round(Number(r.quantita) || 1))),
    inputs: (r.ingredienti ?? []).slice(0, 5).map((i) => ({ item: String(i.oggetto ?? ''), count: Math.max(1, Math.min(20, Math.round(Number(i.quantita) || 1))) })),
    tools: (r.attrezzi ?? []).slice(0, 3).map(String),
  };
}

const SESSION_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    valutazione: { type: 'STRING', description: 'in one sentence: how the world is going' },
    intervento: { type: 'STRING', enum: ['nessuno', 'oggetti', 'abitante', 'cosa', 'meccanica', 'runa'] },
    richiesta: { type: 'STRING', description: 'for abitante or cosa: the request to the Forge in one sentence; for oggetti: what kind of things are missing; for runa: the element of the new magic rune' },
  },
  required: ['valutazione', 'intervento'],
};

/**
 * A session of the Council: from time to time it looks at how the world is being played (rules made,
 * people met, places seen) and decides whether to intervene — new items, a new kind of inhabitant, a
 * new entity — so the world keeps evolving coherently with what happened.
 */
export async function councilSession(c: Council, summary: string): Promise<{ assessment: string; action: 'nessuno' | 'oggetti' | 'abitante' | 'cosa' | 'meccanica' | 'runa'; request?: string }> {
  const r = await c.ask<{ valutazione: string; intervento: string; richiesta?: string }>(
    'arbiter',
    'council.session',
    `Session of the Council. Here is how the wanderer is living the world:\n${summary}\n\nThe world must evolve while staying consistent. Is an intervention needed? At most one: "oggetti" (a pack of things that is missing, say which), "abitante" (a new kind of person that makes the society livelier), "cosa" (a thing or piece of furniture of the world that the wanderer's actions bring to mind), "meccanica" (a mechanic with its interface: slots for the equipment, a quiver, a reputation sheet… — above all if the summary says MANCA), "runa" (a new magic rune, of an element no rune has and that the lived world brings to mind: say which; only rarely), or "nessuno". Intervene only if it is really needed.`,
    SESSION_SCHEMA,
    { data: { summary }, temperature: 0.6 },
  );
  const action = (['nessuno', 'oggetti', 'abitante', 'cosa', 'meccanica', 'runa'] as const).find((a) => a === r.intervento) ?? 'nessuno';
  return { assessment: String(r.valutazione ?? ''), action, request: r.richiesta ? String(r.richiesta).slice(0, 200) : undefined };
}

export interface DeathContext {
  cause: string;
  /** The level chosen at the Genesis (0-4) and what it means. */
  level: number;
  punishment: string;
  carried: Array<{ name: string; count: number }>;
  states: string[];
  place: string;
}

/** The effects death may use: it takes away, it never gives (internal, T310; an Italian one is read internal). */
export const DEATH_EFFECTS = ['message', 'needs', 'consume', 'remove_state', 'state'] as const;

const DEATH_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    racconto: { type: 'STRING', description: 'how the wanderer comes back to life, 1-2 sentences, second person' },
    perde_tutto: { type: 'BOOLEAN', description: 'true if they lose everything they carry and every condition' },
    ripartenza: { type: 'STRING', enum: ['qui', 'piazza'], description: 'where they open their eyes again: where they fell (qui) or in the square (piazza)' },
    effetti: { type: 'ARRAY', items: EFFECT_SCHEMA },
  },
  required: ['racconto', 'perde_tutto', 'ripartenza', 'effetti'],
};

/**
 * The wanderer died: the Narrator turns the punishment chosen at the Genesis into what is lost and where
 * they wake up, with the effects that take away (the kernel validates them and gives back fresh needs).
 */
export async function judgeDeath(c: Council, ctx: DeathContext): Promise<{ story: string; loseAll: boolean; restart: 'qui' | 'piazza'; effects: unknown[] }> {
  const prompt = [
    `The wanderer died (${ctx.cause}) at ${ctx.place || 'a place without a name'}. They come back to life: decide what it costs them.`,
    `The punishment of death in this world is chosen forever: ${ctx.punishment}. Respect it to the letter, no more, no less.`,
    `Carries: ${ctx.carried.map((x) => `${x.name} ×${x.count}`).join(', ') || 'nothing'}. Conditions: ${ctx.states.join(', ') || 'none'}.`,
    `"perde_tutto" takes away everything they carry and every condition. Otherwise choose the effects (at most 6) ONLY among: consume {item, quantity} (loses what they carry), remove_state {name}, state {name, speed, duration} (a passing weakness), needs {…} (negative), message {text}. The needs come back full anyway before the effects.`,
  ].join('\n\n');
  const r = await c.ask<{ racconto?: string; perde_tutto?: boolean; ripartenza?: string; effetti?: unknown[] }>('narrator', 'player.death', prompt, DEATH_SCHEMA, { data: ctx, temperature: 0.4 });
  return {
    story: String(r.racconto ?? '').slice(0, 300),
    loseAll: !!r.perde_tutto,
    restart: r.ripartenza === 'qui' ? 'qui' : 'piazza',
    effects: (Array.isArray(r.effetti) ? r.effetti : []).filter((e) => {
      const kind = (e as { type?: unknown; tipo?: unknown })?.type ?? (e as { tipo?: unknown })?.tipo;
      return (DEATH_EFFECTS as readonly string[]).includes(internalName('effetti', String(kind)));
    }),
  };
}
