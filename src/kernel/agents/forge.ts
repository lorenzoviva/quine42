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
import { luaFor0_5 } from '../migrations';
import { ownModelId } from '../modeldirector';
import { AGENTS, type AgentId, type Council } from './council';

export type ForgeOrigin = 'genesi' | 'agente' | 'cartografo' | 'combinazione';

export interface ForgeRequest {
  prompt: string;
  origin: ForgeOrigin;
  existingIds: string[];
  paletteCodes: string[];
  /** Restrict the kind (e.g. combinations always produce items). */
  kind?: 'npc' | 'oggetto' | 'strumento';
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

export interface Concept {
  nome: string;
  tipo: 'npc' | 'oggetto' | 'strumento';
  descrizione: string;
  lore: string;
  aspetto: string;
  classe?: string;
  /** Its size of D&D (ADR-0092), if not its class's own: a wolf is a Medium beast, a dragon a Large one. */
  taglia?: string;
  contesto: { terreni: string[]; luoghi: string; rarita: number };
  interazione: 'parla' | 'leggi' | 'usa' | 'nessuna';
  comandi: Array<{ azione: string; descrizione: string }>;
  persona?: string;
  unico?: boolean;
  azioni?: Array<{ id: string; etichetta: string; richiede?: string }>;
  contenitore?: { capienza: number; bottino: string };
  porta?: string[];
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
  solido: boolean;
  spingibile: boolean;
  massa: number;
  attrito: number;
  raggio: number;
  velocita: number;
  peso: number;
  impilabile: boolean;
  max_pila: number;
  equipaggiabile: boolean;
  note?: string;
}

export interface CodeSpec {
  logic: string;
  componenti_json?: string;
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
    nome: { type: 'STRING' },
    tipo: { type: 'STRING', enum: ['npc', 'oggetto', 'strumento'] },
    descrizione: { type: 'STRING' },
    lore: { type: 'STRING' },
    aspetto: { type: 'STRING', description: 'what it is made like: shape, proportions, materials, colours (the Sculptor makes a 3D model of it)' },
    // Classes and sizes are internal since T310 (the prompts are English); the Forge still makes an Italian one of the contract 0.1 internal.
    classe: { type: 'STRING', enum: internalValues('classi'), description: 'its class of size (person, animal, furniture, object, building…)' },
    taglia: { type: 'STRING', enum: SIZE_TIERS.filter((t) => !RARE_SIZES.includes(t.id)).map((t) => t.id), description: 'the size of D&D, only if different from the usual one of its class (a giant: large)' },
    contesto: {
      type: 'OBJECT',
      properties: { terreni: { type: 'ARRAY', items: { type: 'STRING' } }, luoghi: { type: 'STRING' }, rarita: { type: 'NUMBER' } },
      required: ['terreni', 'luoghi', 'rarita'],
    },
    interazione: { type: 'STRING', enum: ['parla', 'leggi', 'usa', 'nessuna'] },
    comandi: { type: 'ARRAY', items: { type: 'OBJECT', properties: { azione: { type: 'STRING', enum: ['usa', 'azione'] }, descrizione: { type: 'STRING' } }, required: ['azione', 'descrizione'] } },
    persona: { type: 'STRING' },
    unico: { type: 'BOOLEAN', description: 'true for an individual with a name (exists only once in the world), false for animals, common things, things that repeat' },
    azioni: {
      type: 'ARRAY',
      description: 'for an object: what can be done with it (menu entries), the id in English and the label in the language of the world, e.g. {id:"draw_water", etichetta:"Attingi acqua", richiede:"secchio"}',
      items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, etichetta: { type: 'STRING' }, richiede: { type: 'STRING' } }, required: ['id', 'etichetta'] },
    },
    contenitore: {
      type: 'OBJECT',
      description: 'for furniture and chests: how many places and which loot table (cucina, cassa, bottega, comune…)',
      properties: { capienza: { type: 'INTEGER' }, bottino: { type: 'STRING' } },
      required: ['capienza', 'bottino'],
    },
    porta: { type: 'ARRAY', items: { type: 'STRING' }, description: 'for an npc: things they carry' },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    takeable: { type: 'BOOLEAN', description: 'for an object: true if a wanderer could lift it and set it down elsewhere (a cupboard, a chest, a stool, a crate), false if it is fixed or built in place (a well, an oven, a statue, an altar of stone)' },
  },
  required: ['nome', 'tipo', 'descrizione', 'lore', 'aspetto', 'contesto', 'interazione', 'comandi', 'tags'],
};

const PHYSICS_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    solido: { type: 'BOOLEAN' },
    spingibile: { type: 'BOOLEAN' },
    massa: { type: 'NUMBER' },
    attrito: { type: 'NUMBER' },
    raggio: { type: 'NUMBER' },
    velocita: { type: 'NUMBER' },
    peso: { type: 'NUMBER' },
    impilabile: { type: 'BOOLEAN' },
    max_pila: { type: 'INTEGER' },
    equipaggiabile: { type: 'BOOLEAN' },
    note: { type: 'STRING' },
  },
  required: ['solido', 'spingibile', 'massa', 'attrito', 'raggio', 'velocita', 'peso', 'impilabile', 'max_pila', 'equipaggiabile'],
};

const CODE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: { logic: { type: 'STRING' }, componenti_json: { type: 'STRING' }, note: { type: 'STRING' } },
  required: ['logic'],
};

const REVIEW_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    approvato: { type: 'BOOLEAN' },
    problemi: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { agente: { type: 'STRING', enum: ['narrator', 'physicist', 'engineer'] }, problema: { type: 'STRING' } }, required: ['agente', 'problema'] },
    },
  },
  required: ['approvato', 'problemi'],
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
  const prefix = concept.tipo === 'npc' ? 'npc' : concept.tipo === 'strumento' ? 'item' : 'obj';
  let id = `${prefix}.${slug(concept.nome)}`;
  for (let i = 2; existing.includes(id); i++) id = `${prefix}.${slug(concept.nome)}-${i}`;
  return id;
}

const STRUCTURES = /^(?:(?:la|il|lo|l'|una|un|uno|le|i|gli|vecchi[oa]|antic[oa]|piccol[oa]|grande|modesta?)\s+)*(casa|case|casetta|capanna|casupola|baracca|edificio|torre|mulino|fienile|stalla|chiesa|cappella|tempio|castello|taverna|locanda|osteria|bottega|negozio|ponte|muro|mura|recinto|palizzata|villaggio|borgo|piazza|strada|sentiero|fattoria|palazzo|condominio|grattacielo|stazione|fabbrica|officina|capannone|centrale|deposito|hangar)\b/i;
const FURNITURE = /cass|baule|forziere|scrigno|credenz|armadi|cesta|cesto|madia|cassett|dispens|scaffal|librer|comò|como\b|banco/i;

export function isStructure(concept: Pick<Concept, 'nome' | 'tipo'>): boolean {
  return concept.tipo !== 'npc' && STRUCTURES.test(concept.nome.trim());
}

/** Hooks a module must define, given what the concept promises. */
export function requiredHooks(concept: Concept): string[] {
  const hooks = new Set<string>();
  if (concept.tipo === 'oggetto' && concept.azioni?.length) hooks.add('on_act');
  else if (concept.tipo === 'oggetto' && concept.interazione === 'usa') hooks.add('on_interact');
  if (concept.tipo === 'strumento') {
    for (const c of concept.comandi) hooks.add(c.azione === 'usa' ? 'on_use' : 'on_action');
  }
  return [...hooks];
}

/** The kernel, not an agent, writes the manifest: agents provide its content, the shape is guaranteed. */
export function assembleManifest(id: string, concept: Concept, physics: PhysicsSpec, code: CodeSpec, paletteCodes: string[], origin: ForgeOrigin): Manifest {
  let extra: Record<string, any> = {};
  try {
    const parsed = code.componenti_json ? JSON.parse(code.componenti_json) : {};
    // The components of 0.4 the Engineer may still write (`luce`, T308b) take the names of 0.5.
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) extra = internalComponents(parsed) as Record<string, any>;
  } catch {
    extra = {};
  }
  const hue = hashStr(id) % 360;
  const tiles = (concept.contesto?.terreni ?? []).filter((t) => paletteCodes.includes(t));
  const npc = concept.tipo === 'npc';
  const item = concept.tipo === 'strumento';
  const glyph = [...(concept.nome.trim() || '?')][0].toUpperCase();
  const m: Manifest = {
    id,
    name: concept.nome.trim(),
    kind: item ? 'item' : 'entity',
    version: '0.1.0',
    description: concept.descrizione,
    lore: concept.lore,
    context: concept.contesto?.luoghi ?? '',
    tags: concept.tags ?? [],
    origin,
    logic: 'logic.lua',
    appearance: { glyph, color: `hsl(${hue} 65% 68%)`, look: concept.aspetto, model: ownModelId(id), class: classOf(internalName('classi', concept.classe ?? ''))?.id ?? guessClass(`${concept.nome} ${concept.aspetto}`, npc ? 'figure' : undefined).id, ...forgedSize(concept.taglia) },
    physics: {
      solid: item ? false : !!physics.solido,
      radius: clamp(physics.raggio, 0.2, 0.5, 0.35),
      pushable: !item && !!physics.spingibile,
      mass: clamp(physics.massa, 0.1, 100, 1),
      friction: clamp(physics.attrito, 0, 1, 0.6),
      speed: clamp(physics.velocita, 0, 4, npc ? 1.2 : 0),
    },
    components: { ...extra },
    spawn: { tiles: tiles.length ? tiles : [paletteCodes[0] ?? 'g'], chance: clamp(concept.contesto?.rarita, 0.02, 0.5, 0.15), max: 1 },
  };
  if (concept.unico) m.unique = true;
  if (npc) {
    m.interaction = { type: 'talk' };
    m.persona = concept.persona || `${concept.nome}: ${concept.descrizione}`;
    m.components!.wander = { dx: 0, dy: 0, t: 0, speed: m.physics!.speed };
    m.components!.mind = { mode: 'vaga', mood: 'tranquillo' };
  } else if (item) {
    m.item = {
      stackable: !!physics.impilabile,
      maxStack: physics.impilabile ? Math.round(clamp(physics.max_pila, 1, 99, 10)) : 1,
      weight: clamp(physics.peso, 0, 50, 1),
      equippable: !!physics.equipaggiabile,
      controls: Object.fromEntries((concept.comandi ?? []).map((c) => [c.azione, c.descrizione])),
    };
  } else if (concept.interazione === 'leggi') m.interaction = { type: 'read' };
  else if (concept.interazione === 'usa' && !concept.azioni?.length) m.interaction = { type: 'lua' };
  if (concept.tipo === 'oggetto' && concept.azioni?.length)
    m.actions = concept.azioni.slice(0, 6).map((a) => ({ id: slug(a.id || a.etichetta), label: String(a.etichetta).slice(0, 40), ...(a.richiede ? { requires: String(a.richiede) } : {}) }));
  if (concept.tipo === 'oggetto' && concept.contenitore) m.container = { size: Math.round(clamp(concept.contenitore.capienza, 2, 16, 6)), loot: slug(concept.contenitore.bottino || 'comune') };
  // A chest that cannot be opened is incoherent: furniture that holds things always does.
  else if (concept.tipo === 'oggetto' && FURNITURE.test(concept.nome)) m.container = { size: 8, loot: /credenz|madia|dispens|cucin/i.test(concept.nome) ? 'cucina' : /banco|bottega|attrezz/i.test(concept.nome) ? 'bottega' : 'cassa' };
  if (m.physics!.pushable) m.components!.vel = { x: 0, y: 0 };
  // What a wanderer can carry elsewhere (T292): an object the Narrator (or who asked for it) says so of, of a class one lifts.
  const size = m.appearance!.size ?? (m.appearance as { taglia?: string }).taglia;
  if (concept.tipo === 'oggetto' && concept.takeable === true && TAKEABLE_CLASSES.has(m.appearance!.class!) && size !== 'large') m.takeable = true;
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
        req.kind ? `It must be of type "${req.kind}".` : 'Choose the type: npc (a simulated person), oggetto (stands in the world, inert or interactive), strumento (it is picked up and goes into the inventory).',
        `Valid terrains for "contesto.terreni": ${codes}. "rarita" between 0.02 and 0.5.`,
        'For an npc: a concrete trade or role of the world (baker, guard, shepherd, healer, brigand, merchant…), never abstract roles; in "persona" the sheet of the kind of character (every individual will then have a name and a story of their own), in the language of the world: how they speak, what they want, what they know and believe of their world; in "porta" 3-6 common things of their trade.',
        req.existingNames?.length ? `They exist already (no doubles, neither of name nor of role): ${req.existingNames.slice(0, 80).join(', ')}.` : '',
        'For an object: in "azioni" 1-4 concrete things one can do with it (open, sit down, draw water, sleep, light, pray…), with "richiede" if a tool is needed; if it is a piece of furniture that holds things, "contenitore" with capacity and loot table (cucina, cassa, bottega, comune, contadino); "takeable" true if a wanderer could lift it and set it down elsewhere (a cupboard, a chest, a stool), false if it is fixed or built in place (a well, an oven, a statue).',
        req.takeable !== undefined ? `Who asked for it decided: ${req.takeable ? 'a wanderer can lift it and set it down elsewhere ("takeable": true)' : 'it stays where it is built ("takeable": false)'}.` : '',
        'For a tool list in "comandi" at most two entries: "usa" = effect on whoever uses it, or consumption (eat, drink, read, light); "azione" = effect on what the wanderer has in front of them (cut, hit, open, dig).',
        'Do not create modules for elements of the terrain (paths, rivers, bridges, walls, meadows): those are the Cartographer\'s map. Create concrete things that stand on the terrain.',
        feedback && `The Arbiter objected: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n'),
      CONCEPT_SCHEMA,
      { data, chi: req.chi },
    );
  const askPhysics = (concept: Concept, feedback = '') =>
    c.ask<PhysicsSpec>(
      'physicist',
      'forge.physics',
      [
        `Define the physics of this element consistently with what it is and with the look described:\n${JSON.stringify(concept, null, 1)}`,
        'Units: "raggio" in tiles (0.2-0.5), "velocita" in tiles/s (0 if it does not move by itself), "massa" in kg, "attrito" 0-1 (how fast it stops if pushed), "peso" in inventory units (the wanderer carries 20 without slowing down).',
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
        'In "componenti_json" any extra components as a JSON object (a string), e.g. {"light":{"lit":false}}. No state in Lua variables.',
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
  if (req.kind) concept.tipo = req.kind;
  c.say('narrator', 'propone', `«${concept.nome}» (${concept.tipo}): ${concept.descrizione}`);
  // Inside the world nothing knows of the Council's table; nor is anything made twice.
  // The words metaBreak knows, then the four questions of `text.fourthwall` (T350): what breaks goes back to the Narrator with the reason.
  const breaks = (x: Concept) => c.fourthWall(`${x.nome} ${x.descrizione} ${x.persona ?? ''} ${x.lore ?? ''}`, req.chi);
  for (let tries = 0; tries < 2; tries++) {
    const meta = await breaks(concept);
    const dup = req.existingNames?.find((n) => normName(n) === normName(concept.nome));
    if (!meta && !dup) break;
    const why = meta ? `«${concept.nome}» rompe la quarta parete («${meta}»): dentro il mondo nessuno sa di codice, simulazioni o del Concilio. Crea una persona o una cosa vera del mondo.` : `«${concept.nome}» esiste già: crea qualcosa di diverso.`;
    c.say('kernel', 'scarta', why, 'narrator');
    concept = decided(await askConcept(why));
    if (req.kind) concept.tipo = req.kind;
    if (tries === 1 && ((await breaks(concept)) || req.existingNames?.some((n) => normName(n) === normName(concept.nome)))) throw new ForgeRejected(`ancora fuori dal mondo o doppione: ${concept.nome}`, 'narrator');
  }
  // Buildings are environments (the Cartographer's layouts), never one-tile objects.
  if (isStructure(concept)) {
    const why = `«${concept.nome}» è un edificio o una struttura: quelli sono ambienti del Cartografo, non oggetti. Crea invece qualcosa che sta dentro o fuori un edificio (un mobile, un attrezzo, una persona).`;
    c.say('kernel', 'scarta', why, 'narrator');
    concept = decided(await askConcept(why));
    if (req.kind) concept.tipo = req.kind;
    if (isStructure(concept)) throw new ForgeRejected(`ancora una struttura: ${concept.nome}`, 'narrator');
    c.say('narrator', 'corregge', `«${concept.nome}» (${concept.tipo}): ${concept.descrizione}`);
  }
  let physics = await askPhysics(concept);
  c.say('physicist', 'propone', `${physics.solido ? 'solido' : 'attraversabile'}${physics.spingibile ? ', spingibile' : ''}, ${physics.massa} kg, peso ${physics.peso}${physics.note ? ` — ${physics.note}` : ''}`);
  let code = await askCode(concept, physics);
  c.say('engineer', 'propone', `logic.lua, ${code.logic.split('\n').length} righe${code.note ? ` — ${code.note}` : ''}`);

  // The Arbiter checks that narrative, physics and code tell the same story.
  const review = await c.ask<{ approvato: boolean; problemi: Array<{ agente: AgentId; problema: string }> }>(
    'arbiter',
    'forge.review',
    `${req.permissive ? 'The wanderer has transcended: they are a member of the Council. Take their request as they want it; refuse only what would destroy the universe, themselves or the laws of the game. Do not object to the idea itself: only to technical inconsistencies that would break the game.\n' : ''}Check that the narrative, the look, the physics and the code of this module agree. Point out only concrete inconsistencies, naming the agent responsible.\nConcept:\n${JSON.stringify(concept, null, 1)}\nPhysics:\n${JSON.stringify(physics)}\nlogic.lua:\n${code.logic}`,
    REVIEW_SCHEMA,
    { chi: req.chi, data: { ...data, concept, physics, code }, temperature: 0.2 },
  );
  if (review.approvato || !review.problemi?.length) c.say('arbiter', 'approva', `«${concept.nome}» è coerente.`);
  else {
    for (const p of review.problemi.slice(0, 3)) c.say('arbiter', 'obietta', p.problema, p.agente);
    const issues = (agent: AgentId) => review.problemi.filter((p) => p.agente === agent).map((p) => p.problema).join('; ');
    if (issues('narrator')) {
      concept = decided(await askConcept(issues('narrator')));
      if (req.kind) concept.tipo = req.kind;
      c.say('narrator', 'corregge', `«${concept.nome}»: ${concept.descrizione}`);
    }
    if (issues('physicist') || issues('narrator')) {
      physics = await askPhysics(concept, issues('physicist'));
      c.say('physicist', 'corregge', `${physics.solido ? 'solido' : 'attraversabile'}, ${physics.massa} kg, peso ${physics.peso}`);
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

  return { id, manifest, logic: code.logic, concept, summary: `${concept.tipo === 'npc' ? 'Nuovo abitante' : concept.tipo === 'strumento' ? 'Nuovo strumento' : 'Nuovo oggetto'} «${concept.nome}» (${id})${manifest.takeable ? ', si può spostare' : ''}` };
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
 * The Engineer's code with the names of the contract 0.5 (T308b): what it may still write with those of before (`ecs.get(u, "luce")`,
 * `world.impresa`) is ported as a universe of 0.4 is (`luaFor0_5`): its prompts are English since T310, the port stays a contract more.
 */
function internalCode(code: CodeSpec): CodeSpec {
  return { ...code, logic: luaFor0_5(String(code.logic ?? '')) };
}


const JUDGE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    possibile: { type: 'BOOLEAN' },
    risultato: { type: 'STRING', description: 'name of the resulting tool; if it exists already, use exactly that name' },
    descrizione: { type: 'STRING' },
    spiegazione: { type: 'STRING' },
  },
  required: ['possibile', 'spiegazione'],
};

/** Narrator and Physicist decide together whether two things can be combined, and into what. */
export async function judgeCombination(
  c: Council,
  a: { name: string; description: string },
  b: { name: string; description: string },
  knownItems: string[],
  focus?: string[],
): Promise<{ possible: boolean; result?: string; description?: string; reason: string }> {
  const r = await c.ask<{ possibile: boolean; risultato?: string; descrizione?: string; spiegazione: string }>(
    'narrator',
    'craft.judge',
    `The wanderer tries to combine «${a.name}» (${a.description}) with «${b.name}» (${b.description}). Does it make sense in the world and physically? If so, what comes out of it (a tool)? Tools that already exist: ${knownItems.join(', ') || 'none'}. Be strict: most combinations produce nothing.`,
    JUDGE_SCHEMA,
    { data: { a, b, knownItems }, temperature: 0.4, focus },
  );
  c.say('narrator', r.possibile ? 'propone' : 'obietta', r.possibile ? `«${a.name}» + «${b.name}» → «${r.risultato}». ${r.spiegazione}` : r.spiegazione);
  return { possible: !!r.possibile && !!r.risultato, result: r.risultato, description: r.descrizione, reason: r.spiegazione };
}

export const agentName = (id: AgentId | 'kernel') => (id === 'kernel' ? 'Kernel' : AGENTS[id].name);
