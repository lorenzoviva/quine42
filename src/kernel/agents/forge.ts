// The Forge: how a new entity enters the universe as a module.
//   Narrator  → concept (what it is, where it belongs, how it looks, how it is used, who it is)
//   Physicist → physics (solid, pushable, mass, friction, weight, stacking…)
//   Engineer  → Lua logic and extra components
//   Arbiter   → reviews the whole bundle; sends issues back to the responsible agent (1 round)
//   Kernel    → validator + dry load in the sandbox; errors go back to the Engineer (2 rounds)
//   (the Sculptor then gives it a model)
// Nothing reaches the universe unless it passes the validator.

import type { Schema } from '../ai/models';
import { hashStr } from '../rng';
import { normName } from '../content';
import type { Manifest } from '../types';
import { classOf, guessClass, RARE_SIZES, sizeOf, SIZE_TIERS } from '../../mj/classes';
import { internalComponents, internalName, internalValues } from '../internalNames';
import { luaFor0_5, luaFor0_7 } from '../migrations';
import { ownModelId } from '../modeldirector';
import { AGENTS, type AgentId, type Council } from './council';

export type ForgeOrigin = 'genesi' | 'agente' | 'cartografo' | 'combinazione';

/** The kinds of what the Forge creates (T310b, `tipi-fucina`): a person, a thing that stands in the world, a tool that goes in the inventory. */
export const FORGE_KINDS = ['npc', 'object', 'item'] as const;
export type ForgeKind = (typeof FORGE_KINDS)[number];

/** A kind as the Narrator wrote it (or in the Italian of before T310b, `strumento`): one of the three, `object` otherwise. */
export const forgeKindOf = (v: unknown): ForgeKind => {
  const said = internalName('tipi-fucina', String(v ?? ''));
  return (FORGE_KINDS as readonly string[]).includes(said) ? (said as ForgeKind) : 'object';
};

export interface ForgeRequest {
  prompt: string;
  origin: ForgeOrigin;
  existingIds: string[];
  paletteCodes: string[];
  /** Restrict the kind (e.g. combinations always produce items). */
  kind?: ForgeKind;
  /** Asked by the wanderer who transcended (in the corona): the Council goes along with it. */
  permissive?: boolean;
  /** Names of the modules that exist: no duplicates. */
  existingNames?: string[];
  /** Who pays (T36): the world (`comune`) for the Genesis and the Council's sessions; default the Council's policy. */
  chi?: string;
  /** Whether the thing can be taken and put down elsewhere (T292), when who asks for it decided (the Cartographer, for what a place calls for). */
  takeable?: boolean;
}

/**
 * The size a forged entity may have (ADR-0092): any but the two rare ones, which are the world's (one per zone, one
 * per realm) and only for structures.
 */
export const forgedSize = (t: string | undefined): { taglia?: string } => {
  const s = sizeOf(internalName('taglie', t?.trim().toLowerCase() ?? ''));
  return s && !RARE_SIZES.includes(s.id) ? { taglia: s.id } : {};
};

/** How a thing of the world is used (T310b, `interazioni`): someone talks, something is read, something is used, nothing. */
export const INTERACTIONS = ['talk', 'read', 'use', 'none'] as const;
export type Interaction = (typeof INTERACTIONS)[number];

/** The controls of a tool (T310b, `comandi`): `use` acts on whoever uses it, `action` on what is in front of the wanderer. */
export const CONTROLS = ['use', 'action'] as const;

export interface Concept {
  name: string;
  type: ForgeKind;
  description: string;
  lore: string;
  look: string;
  class?: string;
  /** Its size of D&D (ADR-0092), if not its class's own: a wolf is a Medium beast, a dragon a Large one. */
  size?: string;
  context: { terrains: string[]; places: string; rarity: number };
  interaction: Interaction;
  controls: Array<{ action: string; description: string }>;
  persona?: string;
  unique?: boolean;
  actions?: Array<{ id: string; label: string; requires?: string }>;
  container?: { capacity: number; loot: string };
  carries?: string[];
  tags: string[];
  /** For an object: a wanderer can lift it and put it down elsewhere (T292, ADR-0168), a cupboard yes, a well no. */
  takeable?: boolean;
}

/**
 * The classes of what can be taken (T292): furniture and small things, not what is built or grows in place (a well is a building, a
 * statue a monument), not someone; and not of a large size.
 */
export const TAKEABLE_CLASSES: ReadonlySet<string> = new Set(['furniture', 'object', 'pebble']);

export interface PhysicsSpec {
  solid: boolean;
  pushable: boolean;
  mass: number;
  friction: number;
  radius: number;
  speed: number;
  weight: number;
  stackable: boolean;
  max_stack: number;
  equippable: boolean;
  note?: string;
}

export interface CodeSpec {
  logic: string;
  components_json?: string;
  note?: string;
}

export interface ForgeResult {
  id: string;
  manifest: Manifest;
  logic: string;
  summary: string;
  concept: Concept;
}

export type ModuleValidator = (manifest: Manifest, logic: string) => string[];

const CONCEPT_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    type: { type: 'STRING', enum: [...FORGE_KINDS] },
    description: { type: 'STRING' },
    lore: { type: 'STRING' },
    look: { type: 'STRING', description: 'what it is made like: shape, proportions, materials, colours (the Sculptor makes a 3D model of it)' },
    // Classes and sizes are internal since T310 (the prompts are English); the Forge still makes an Italian one of the contract 0.1 internal.
    class: { type: 'STRING', enum: internalValues('classi'), description: 'its class of size (person, animal, furniture, object, building…)' },
    size: { type: 'STRING', enum: SIZE_TIERS.filter((t) => !RARE_SIZES.includes(t.id)).map((t) => t.id), description: 'the size of D&D, only if different from the usual one of its class (a giant: large)' },
    context: {
      type: 'OBJECT',
      properties: { terrains: { type: 'ARRAY', items: { type: 'STRING' } }, places: { type: 'STRING' }, rarity: { type: 'NUMBER' } },
      required: ['terrains', 'places', 'rarity'],
    },
    interaction: { type: 'STRING', enum: [...INTERACTIONS] },
    controls: { type: 'ARRAY', items: { type: 'OBJECT', properties: { action: { type: 'STRING', enum: [...CONTROLS] }, description: { type: 'STRING' } }, required: ['action', 'description'] } },
    persona: { type: 'STRING' },
    unique: { type: 'BOOLEAN', description: 'true for an individual with a name (exists only once in the world), false for animals, common things, things that repeat' },
    actions: {
      type: 'ARRAY',
      description: 'for an object: what can be done with it (menu entries), the id in English and the label in the language of the world, e.g. {id:"draw_water", label:"Attingi acqua", requires:"secchio"}',
      items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, label: { type: 'STRING' }, requires: { type: 'STRING' } }, required: ['id', 'label'] },
    },
    container: {
      type: 'OBJECT',
      description: 'for furniture and chests: how many places and which loot table (in Italian: cucina, cassa, bottega, comune…)',
      properties: { capacity: { type: 'INTEGER' }, loot: { type: 'STRING' } },
      required: ['capacity', 'loot'],
    },
    carries: { type: 'ARRAY', items: { type: 'STRING' }, description: 'for an npc: things they carry' },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    takeable: { type: 'BOOLEAN', description: 'for an object: true if a wanderer could lift it and set it down elsewhere (a cupboard, a chest, a stool, a crate), false if it is fixed or built in place (a well, an oven, a statue, an altar of stone)' },
  },
  required: ['name', 'type', 'description', 'lore', 'look', 'context', 'interaction', 'controls', 'tags'],
};

const PHYSICS_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    solid: { type: 'BOOLEAN' },
    pushable: { type: 'BOOLEAN' },
    mass: { type: 'NUMBER' },
    friction: { type: 'NUMBER' },
    radius: { type: 'NUMBER' },
    speed: { type: 'NUMBER' },
    weight: { type: 'NUMBER' },
    stackable: { type: 'BOOLEAN' },
    max_stack: { type: 'INTEGER' },
    equippable: { type: 'BOOLEAN' },
    note: { type: 'STRING' },
  },
  required: ['solid', 'pushable', 'mass', 'friction', 'radius', 'speed', 'weight', 'stackable', 'max_stack', 'equippable'],
};

const CODE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: { logic: { type: 'STRING' }, components_json: { type: 'STRING' }, note: { type: 'STRING' } },
  required: ['logic'],
};

const REVIEW_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    approved: { type: 'BOOLEAN' },
    problems: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { agent: { type: 'STRING', enum: ['narrator', 'physicist', 'engineer'] }, problem: { type: 'STRING' } }, required: ['agent', 'problem'] },
    },
  },
  required: ['approved', 'problems'],
};

const clamp = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'cosa'
  );
}

export function moduleId(concept: Concept, existing: string[]): string {
  const prefix = concept.type === 'npc' ? 'npc' : concept.type === 'item' ? 'item' : 'obj';
  let id = `${prefix}.${slug(concept.name)}`;
  for (let i = 2; existing.includes(id); i++) id = `${prefix}.${slug(concept.name)}-${i}`;
  return id;
}

// What the name of a concept says of it, when the schema's fields do not: a building (the Cartographer's, never a one-tile object),
// furniture that holds things. In the Italian of today and in English (the words a model may slip into); the other languages are T239's.
const STRUCTURES = /^(?:(?:la|il|lo|l'|una|un|uno|le|i|gli|the|an?|old|vecchi[oa]|antic[oa]|piccol[oa]|grande|modesta?|small|big|great|little)\s+)*(casa|case|casetta|capanna|casupola|baracca|edificio|torre|mulino|fienile|stalla|chiesa|cappella|tempio|castello|taverna|locanda|osteria|bottega|negozio|ponte|muro|mura|recinto|palizzata|villaggio|borgo|piazza|strada|sentiero|fattoria|palazzo|condominio|grattacielo|stazione|fabbrica|officina|capannone|centrale|deposito|hangar|house|houses|cottage|hut|shack|building|tower|mill|barn|stable|church|chapel|temple|castle|tavern|inn|shop|bridge|wall|walls|fence|palisade|village|town|square|street|road|path|farm|palace|skyscraper|station|factory|workshop|warehouse|depot)\b/i;
const FURNITURE = /cass|baule|forziere|scrigno|credenz|armadi|cesta|cesto|madia|cassett|dispens|scaffal|librer|comò|como\b|banco|chest|trunk|coffer|cupboard|wardrobe|basket|drawer|pantry|shelf|shelves|bookcase|dresser|counter/i;

export function isStructure(concept: Pick<Concept, 'name' | 'type'>): boolean {
  return concept.type !== 'npc' && STRUCTURES.test(concept.name.trim());
}

/** Hooks a module must define, given what the concept promises. */
export function requiredHooks(concept: Concept): string[] {
  const hooks = new Set<string>();
  if (concept.type === 'object' && concept.actions?.length) hooks.add('on_act');
  else if (concept.type === 'object' && concept.interaction === 'use') hooks.add('on_interact');
  if (concept.type === 'item') {
    for (const c of concept.controls) hooks.add(c.action === 'use' ? 'on_use' : 'on_action');
  }
  return [...hooks];
}

/** A concept as the Narrator wrote it, with its closed values internal (T310b): a kind, an interaction or a control in the Italian of before is the one it means. */
export function internalConcept(raw: Concept): Concept {
  const interaction = internalName('interazioni', String(raw.interaction ?? ''));
  return {
    ...raw,
    type: forgeKindOf(raw.type),
    interaction: (INTERACTIONS as readonly string[]).includes(interaction) ? (interaction as Interaction) : 'none',
    controls: (Array.isArray(raw.controls) ? raw.controls : []).map((c) => ({ ...c, action: internalName('comandi', String(c?.action ?? '')) })),
  };
}

/** The kernel, not an agent, writes the manifest: agents provide its content, the shape is guaranteed. */
export function assembleManifest(id: string, concept: Concept, physics: PhysicsSpec, code: CodeSpec, paletteCodes: string[], origin: ForgeOrigin): Manifest {
  let extra: Record<string, any> = {};
  try {
    const parsed = code.components_json ? JSON.parse(code.components_json) : {};
    // The components of 0.4 the Engineer may still write (`luce`, T308b) take the names of 0.5.
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) extra = internalComponents(parsed) as Record<string, any>;
  } catch {
    extra = {};
  }
  const hue = hashStr(id) % 360;
  const tiles = (concept.context?.terrains ?? []).filter((t) => paletteCodes.includes(t));
  const npc = concept.type === 'npc';
  const item = concept.type === 'item';
  const glyph = [...(concept.name.trim() || '?')][0].toUpperCase();
  const m: Manifest = {
    id,
    name: concept.name.trim(),
    kind: item ? 'item' : 'entity',
    version: '0.1.0',
    description: concept.description,
    lore: concept.lore,
    context: concept.context?.places ?? '',
    tags: concept.tags ?? [],
    origin,
    logic: 'logic.lua',
    appearance: { glyph, color: `hsl(${hue} 65% 68%)`, look: concept.look, model: ownModelId(id), class: classOf(internalName('classi', concept.class ?? ''))?.id ?? guessClass(`${concept.name} ${concept.look}`, npc ? 'figure' : undefined).id, ...forgedSize(concept.size) },
    physics: {
      solid: item ? false : !!physics.solid,
      radius: clamp(physics.radius, 0.2, 0.5, 0.35),
      pushable: !item && !!physics.pushable,
      mass: clamp(physics.mass, 0.1, 100, 1),
      friction: clamp(physics.friction, 0, 1, 0.6),
      speed: clamp(physics.speed, 0, 4, npc ? 1.2 : 0),
    },
    components: { ...extra },
    spawn: { tiles: tiles.length ? tiles : [paletteCodes[0] ?? 'g'], chance: clamp(concept.context?.rarity, 0.02, 0.5, 0.15), max: 1 },
  };
  if (concept.unique) m.unique = true;
  if (npc) {
    m.interaction = { type: 'talk' };
    m.persona = concept.persona || `${concept.name}: ${concept.description}`;
    m.components!.wander = { dx: 0, dy: 0, t: 0, speed: m.physics!.speed };
    m.components!.mind = { mode: 'wander', mood: 'tranquillo' };
  } else if (item) {
    m.item = {
      stackable: !!physics.stackable,
      maxStack: physics.stackable ? Math.round(clamp(physics.max_stack, 1, 99, 10)) : 1,
      weight: clamp(physics.weight, 0, 50, 1),
      equippable: !!physics.equippable,
      controls: Object.fromEntries((concept.controls ?? []).map((c) => [c.action, c.description])),
    };
  } else if (concept.interaction === 'read') m.interaction = { type: 'read' };
  else if (concept.interaction === 'use' && !concept.actions?.length) m.interaction = { type: 'lua' };
  if (concept.type === 'object' && concept.actions?.length)
    m.actions = concept.actions.slice(0, 6).map((a) => ({ id: slug(a.id || a.label), label: String(a.label).slice(0, 40), ...(a.requires ? { requires: String(a.requires) } : {}) }));
  if (concept.type === 'object' && concept.container) m.container = { size: Math.round(clamp(concept.container.capacity, 2, 16, 6)), loot: slug(concept.container.loot || 'comune') };
  // A chest that cannot be opened is incoherent: furniture that holds things always does.
  else if (concept.type === 'object' && FURNITURE.test(concept.name)) m.container = { size: 8, loot: /credenz|madia|dispens|cucin|cupboard|pantry|kitchen/i.test(concept.name) ? 'cucina' : /banco|bottega|attrezz|counter|workshop|tool/i.test(concept.name) ? 'bottega' : 'cassa' };
  if (m.physics!.pushable) m.components!.vel = { x: 0, y: 0 };
  // What a wanderer can carry elsewhere (T292): an object the Narrator (or who asked for it) says so of, of a class one lifts.
  const size = m.appearance!.size ?? (m.appearance as { taglia?: string }).taglia;
  if (concept.type === 'object' && concept.takeable === true && TAKEABLE_CLASSES.has(m.appearance!.class!) && size !== 'large') m.takeable = true;
  return m;
}

/** The last attempt did not pass the kernel's checks: `agent` is whose it was, as on an error of `Council.ask`. */
export class ForgeRejected extends Error {
  constructor(message: string, readonly agent: AgentId) {
    super(message);
  }
}

export async function forge(c: Council, req: ForgeRequest, validate: ModuleValidator): Promise<ForgeResult> {
  const data = { request: req };
  const codes = req.paletteCodes.join(', ');

  const askConcept = (feedback = '') =>
    c.ask<Concept>(
      'narrator',
      'forge.concept',
      [
        `Request (${req.origin}): ${req.prompt}`,
        req.permissive ? 'The wanderer has transcended: they are a member of the Council. Take their request as they want it; refuse only what would destroy the universe, themselves or the laws of the game. Stay faithful to their request, even if it is unusual.' : '',
        req.kind ? `It must be of type "${req.kind}".` : 'Choose the type: npc (a simulated person), object (stands in the world, inert or interactive), item (it is picked up and goes into the inventory).',
        `Valid terrains for "context.terrains": ${codes}. "rarity" between 0.02 and 0.5.`,
        'For an npc: a concrete trade or role of the world (baker, guard, shepherd, healer, brigand, merchant…), never abstract roles; in "persona" the sheet of the kind of character (every individual will then have a name and a story of their own), in the language of the world: how they speak, what they want, what they know and believe of their world; in "carries" 3-6 common things of their trade.',
        req.existingNames?.length ? `They exist already (no doubles, neither of name nor of role): ${req.existingNames.slice(0, 80).join(', ')}.` : '',
        'For an object: in "actions" 1-4 concrete things one can do with it (open, sit down, draw water, sleep, light, pray…), with "requires" if a tool is needed; if it is a piece of furniture that holds things, "container" with capacity and loot table (in Italian: cucina, cassa, bottega, comune, contadino); "takeable" true if a wanderer could lift it and set it down elsewhere (a cupboard, a chest, a stool), false if it is fixed or built in place (a well, an oven, a statue).',
        req.takeable !== undefined ? `Who asked for it decided: ${req.takeable ? 'a wanderer can lift it and set it down elsewhere ("takeable": true)' : 'it stays where it is built ("takeable": false)'}.` : '',
        'For an item list in "controls" at most two entries: "use" = effect on whoever uses it, or consumption (eat, drink, read, light); "action" = effect on what the wanderer has in front of them (cut, hit, open, dig).',
        'Do not create modules for elements of the terrain (paths, rivers, bridges, walls, meadows): those are the Cartographer\'s map. Create concrete things that stand on the terrain.',
        feedback && `The Arbiter objected: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n'),
      CONCEPT_SCHEMA,
      { data, chi: req.chi },
    ).then(internalConcept);
  const askPhysics = (concept: Concept, feedback = '') =>
    c.ask<PhysicsSpec>(
      'physicist',
      'forge.physics',
      [
        `Define the physics of this element consistently with what it is and with the look described:\n${JSON.stringify(concept, null, 1)}`,
        'Units: "radius" in tiles (0.2-0.5), "speed" in tiles/s (0 if it does not move by itself), "mass" in kg, "friction" 0-1 (how fast it stops if pushed), "weight" in inventory units (the wanderer carries 20 without slowing down).',
        feedback && `The Arbiter objected: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n'),
      PHYSICS_SCHEMA,
      { chi: req.chi, data: { ...data, concept } },
    );
  const askCode = (concept: Concept, physics: PhysicsSpec, feedback = '') =>
    c.ask<CodeSpec>(
      'engineer',
      'forge.code',
      [
        `Write logic.lua for this module.\nConcept:\n${JSON.stringify(concept, null, 1)}\nPhysics:\n${JSON.stringify(physics)}`,
        `Required functions: ${requiredHooks(concept).join(', ') || 'none (return a table M anyway)'}.`,
        'In "components_json" any extra components as a JSON object (a string), e.g. {"light":{"lit":false}}. No state in Lua variables.',
        feedback && `TO FIX: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n'),
      CODE_SCHEMA,
      { chi: req.chi, data: { ...data, concept, physics }, temperature: 0.3 },
    ).then(internalCode);

  // Who asked for it decided whether it can be taken (T292): the concept says what they said.
  const decided = (x: Concept): Concept => (req.takeable === undefined ? x : { ...x, takeable: req.takeable });
  let concept = decided(await askConcept());
  if (req.kind) concept.type = req.kind;
  c.say('narrator', 'propone', `«${concept.name}» (${concept.type}): ${concept.description}`);
  // Inside the world nothing knows of the Council's table; nor is anything made twice.
  // The words metaBreak knows, then the four questions of `text.fourthwall` (T350): what breaks goes back to the Narrator with the reason.
  const breaks = (x: Concept) => c.fourthWall(`${x.name} ${x.description} ${x.persona ?? ''} ${x.lore ?? ''}`, req.chi);
  for (let tries = 0; tries < 2; tries++) {
    const meta = await breaks(concept);
    const dup = req.existingNames?.find((n) => normName(n) === normName(concept.name));
    if (!meta && !dup) break;
    const why = meta ? `«${concept.name}» rompe la quarta parete («${meta}»): dentro il mondo nessuno sa di codice, simulazioni o del Concilio. Crea una persona o una cosa vera del mondo.` : `«${concept.name}» esiste già: crea qualcosa di diverso.`;
    c.say('kernel', 'scarta', why, 'narrator');
    concept = decided(await askConcept(why));
    if (req.kind) concept.type = req.kind;
    if (tries === 1 && ((await breaks(concept)) || req.existingNames?.some((n) => normName(n) === normName(concept.name)))) throw new ForgeRejected(`ancora fuori dal mondo o doppione: ${concept.name}`, 'narrator');
  }
  // Buildings are environments (the Cartographer's layouts), never one-tile objects.
  if (isStructure(concept)) {
    const why = `«${concept.name}» è un edificio o una struttura: quelli sono ambienti del Cartografo, non oggetti. Crea invece qualcosa che sta dentro o fuori un edificio (un mobile, un attrezzo, una persona).`;
    c.say('kernel', 'scarta', why, 'narrator');
    concept = decided(await askConcept(why));
    if (req.kind) concept.type = req.kind;
    if (isStructure(concept)) throw new ForgeRejected(`ancora una struttura: ${concept.name}`, 'narrator');
    c.say('narrator', 'corregge', `«${concept.name}» (${concept.type}): ${concept.description}`);
  }
  let physics = await askPhysics(concept);
  c.say('physicist', 'propone', `${physics.solid ? 'solido' : 'attraversabile'}${physics.pushable ? ', spingibile' : ''}, ${physics.mass} kg, peso ${physics.weight}${physics.note ? ` — ${physics.note}` : ''}`);
  let code = await askCode(concept, physics);
  c.say('engineer', 'propone', `logic.lua, ${code.logic.split('\n').length} righe${code.note ? ` — ${code.note}` : ''}`);

  // The Arbiter checks that narrative, physics and code tell the same story.
  const review = await c.ask<{ approved: boolean; problems: Array<{ agent: AgentId; problem: string }> }>(
    'arbiter',
    'forge.review',
    `${req.permissive ? 'The wanderer has transcended: they are a member of the Council. Take their request as they want it; refuse only what would destroy the universe, themselves or the laws of the game. Do not object to the idea itself: only to technical inconsistencies that would break the game.\n' : ''}Check that the narrative, the look, the physics and the code of this module agree. Point out only concrete inconsistencies, naming the agent responsible.\nConcept:\n${JSON.stringify(concept, null, 1)}\nPhysics:\n${JSON.stringify(physics)}\nlogic.lua:\n${code.logic}`,
    REVIEW_SCHEMA,
    { chi: req.chi, data: { ...data, concept, physics, code }, temperature: 0.2 },
  );
  if (review.approved || !review.problems?.length) c.say('arbiter', 'approva', `«${concept.name}» è coerente.`);
  else {
    for (const p of review.problems.slice(0, 3)) c.say('arbiter', 'obietta', p.problem, p.agent);
    const issues = (agent: AgentId) => review.problems.filter((p) => p.agent === agent).map((p) => p.problem).join('; ');
    if (issues('narrator')) {
      concept = decided(await askConcept(issues('narrator')));
      if (req.kind) concept.type = req.kind;
      c.say('narrator', 'corregge', `«${concept.name}»: ${concept.description}`);
    }
    if (issues('physicist') || issues('narrator')) {
      physics = await askPhysics(concept, issues('physicist'));
      c.say('physicist', 'corregge', `${physics.solid ? 'solido' : 'attraversabile'}, ${physics.mass} kg, peso ${physics.weight}`);
    }
    if (issues('engineer') || issues('narrator') || issues('physicist')) {
      code = await askCode(concept, physics, issues('engineer'));
      c.say('engineer', 'corregge', `logic.lua riscritto (${code.logic.split('\n').length} righe)`);
    }
  }

  // The kernel's validator has the last word; its errors go back to the Engineer.
  const id = moduleId(concept, req.existingIds);
  let manifest = assembleManifest(id, concept, physics, code, req.paletteCodes, req.origin);
  for (let round = 0; ; round++) {
    const missing = requiredHooks(concept).filter((h) => !new RegExp(`function\\s+M\\.${h}\\b|M\\.${h}\\s*=\\s*function`).test(code.logic));
    const errors = [...validate(manifest, code.logic), ...missing.map((h) => `manca la funzione M.${h}`)];
    if (!errors.length) break;
    c.say('kernel', 'scarta', errors.join('; '), 'engineer');
    if (round >= 2) throw new ForgeRejected(`modulo non valido: ${errors.join('; ')}`, 'engineer');
    code = await askCode(concept, physics, errors.join('; '));
    c.say('engineer', 'corregge', 'logic.lua corretto');
    manifest = assembleManifest(id, concept, physics, code, req.paletteCodes, req.origin);
  }

  return { id, manifest, logic: code.logic, concept, summary: `${concept.type === 'npc' ? 'Nuovo abitante' : concept.type === 'item' ? 'Nuovo strumento' : 'Nuovo oggetto'} «${concept.name}» (${id})${manifest.takeable ? ', si può spostare' : ''}` };
}

/** A generated module failed at runtime: the Engineer gets the code and the error, and fixes it. */
export async function repairLogic(c: Council, manifest: Manifest, logic: string, error: string, feedback = ''): Promise<string> {
  const code = await c.ask<CodeSpec>(
    'engineer',
    'forge.fix',
    [
      `The module ${manifest.id} («${manifest.name}», ${manifest.description ?? ''}) entered the universe but fails during play.`,
      `Runtime error: ${error}`,
      `Current logic.lua:\n${logic}`,
      'Fix it keeping the same intended behaviour. Use only the documented API.',
      feedback && `The validator refused the previous fix: ${feedback}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
    CODE_SCHEMA,
    { data: { manifest, logic, error }, temperature: 0.2 },
  );
  return internalCode(code).logic;
}

/**
 * The Engineer's code with the names of the contract 0.5 (T308b) and the values of 0.7 (T310b): what it may still write with those of
 * before (`ecs.get(u, "luce")`, `world.impresa`, `mind.mode == "vaga"`, `items.bonus(it, "difesa")`) is ported as a universe of before
 * is (`luaFor0_5`, `luaFor0_7`): its prompts are English since T310, the port stays a contract more.
 */
function internalCode(code: CodeSpec): CodeSpec {
  return { ...code, logic: luaFor0_7(luaFor0_5(String(code.logic ?? ''))) };
}


const JUDGE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    possible: { type: 'BOOLEAN' },
    result: { type: 'STRING', description: 'name of the resulting tool; if it exists already, use exactly that name' },
    description: { type: 'STRING' },
    reason: { type: 'STRING' },
  },
  required: ['possible', 'reason'],
};

/** Narrator and Physicist decide together whether two things can be combined, and into what. */
export async function judgeCombination(
  c: Council,
  a: { name: string; description: string },
  b: { name: string; description: string },
  knownItems: string[],
  focus?: string[],
): Promise<{ possible: boolean; result?: string; description?: string; reason: string }> {
  const r = await c.ask<{ possible: boolean; result?: string; description?: string; reason: string }>(
    'narrator',
    'craft.judge',
    `The wanderer tries to combine «${a.name}» (${a.description}) with «${b.name}» (${b.description}). Does it make sense in the world and physically? If so, what comes out of it (a tool)? Tools that already exist: ${knownItems.join(', ') || 'none'}. Be strict: most combinations produce nothing.`,
    JUDGE_SCHEMA,
    { data: { a, b, knownItems }, temperature: 0.4, focus },
  );
  c.say('narrator', r.possible ? 'propone' : 'obietta', r.possible ? `«${a.name}» + «${b.name}» → «${r.result}». ${r.reason}` : r.reason);
  return { possible: !!r.possible && !!r.result, result: r.result, description: r.description, reason: r.reason };
}

export const agentName = (id: AgentId | 'kernel') => (id === 'kernel' ? 'Kernel' : AGENTS[id].name);
