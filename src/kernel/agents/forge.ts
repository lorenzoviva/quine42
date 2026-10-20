// The Forge: how a new thing enters the universe as a module.
//   Narrator  → concept (what it is, where it belongs, how it looks, how it is used, who it is)
//   Physicist → physics (solid, pushable, mass, friction, weight, stacking…)
//   Engineer  → Lua logic and extra components
//   Arbiter   → reviews the whole bundle; sends issues back to the responsible agent (1 round)
//   Kernel    → validator + dry load in the sandbox; errors go back to the Engineer (2 rounds)
//   Artist    → sprite
// Nothing reaches the universe unless it passes the validator.

import type { Schema } from '../ai/models';
import { hashStr } from '../rng';
import type { Manifest } from '../types';
import { AGENTS, type AgentId, type Council } from './council';
import { Atelier, type StylePair } from './atelier';

export type ForgeOrigin = 'genesi' | 'agente' | 'cartografo' | 'combinazione';

export interface ForgeRequest {
  prompt: string;
  origin: ForgeOrigin;
  existingIds: string[];
  paletteCodes: string[];
  /** Restrict the kind (e.g. combinations always produce items). */
  kind?: 'npc' | 'oggetto' | 'strumento';
  /** False when the kernel's ArtDirector will paint the sprite later (few-shot, with walk cycle). */
  paint?: boolean;
}

export interface Concept {
  nome: string;
  tipo: 'npc' | 'oggetto' | 'strumento';
  descrizione: string;
  lore: string;
  aspetto: string;
  contesto: { terreni: string[]; luoghi: string; rarita: number };
  interazione: 'parla' | 'leggi' | 'usa' | 'nessuna';
  comandi: Array<{ azione: string; descrizione: string }>;
  persona?: string;
  unico?: boolean;
  azioni?: Array<{ id: string; etichetta: string; richiede?: string }>;
  contenitore?: { capienza: number; bottino: string };
  porta?: string[];
  tags: string[];
}

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
  /** Raw sprite (data URL) from the image model, before chroma keying; null offline. */
  sprite: string | null;
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
    aspetto: { type: 'STRING', description: 'descrizione visiva per lo sprite, vista dall\'alto' },
    contesto: {
      type: 'OBJECT',
      properties: { terreni: { type: 'ARRAY', items: { type: 'STRING' } }, luoghi: { type: 'STRING' }, rarita: { type: 'NUMBER' } },
      required: ['terreni', 'luoghi', 'rarita'],
    },
    interazione: { type: 'STRING', enum: ['parla', 'leggi', 'usa', 'nessuna'] },
    comandi: { type: 'ARRAY', items: { type: 'OBJECT', properties: { azione: { type: 'STRING', enum: ['usa', 'azione'] }, descrizione: { type: 'STRING' } }, required: ['azione', 'descrizione'] } },
    persona: { type: 'STRING' },
    unico: { type: 'BOOLEAN', description: 'true per un individuo con un nome (esiste una sola volta nel mondo), false per animali, oggetti comuni, cose che si ripetono' },
    azioni: {
      type: 'ARRAY',
      description: 'per un oggetto: cosa ci si può fare (voci del menu), es. {id:"attingi", etichetta:"Attingi acqua", richiede:"secchio"}',
      items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, etichetta: { type: 'STRING' }, richiede: { type: 'STRING' } }, required: ['id', 'etichetta'] },
    },
    contenitore: {
      type: 'OBJECT',
      description: 'per mobili e casse: quanti posti e quale tabella di bottino (cucina, cassa, bottega, comune…)',
      properties: { capienza: { type: 'INTEGER' }, bottino: { type: 'STRING' } },
      required: ['capienza', 'bottino'],
    },
    porta: { type: 'ARRAY', items: { type: 'STRING' }, description: 'per un npc: oggetti che porta con sé' },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
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
      items: { type: 'OBJECT', properties: { agente: { type: 'STRING', enum: ['narratore', 'fisico', 'ingegnere'] }, problema: { type: 'STRING' } }, required: ['agente', 'problema'] },
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

const STRUCTURES = /^(?:(?:la|il|lo|l'|una|un|uno|le|i|gli|vecchi[oa]|antic[oa]|piccol[oa]|grande|modesta?)\s+)*(casa|case|casetta|capanna|casupola|baracca|edificio|torre|mulino|fienile|stalla|chiesa|cappella|tempio|castello|taverna|locanda|osteria|bottega|negozio|ponte|muro|mura|recinto|palizzata|villaggio|borgo|piazza|strada|sentiero|fattoria)\b/i;
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
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) extra = parsed;
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
    appearance: { glyph, color: `hsl(${hue} 65% 68%)`, imagePrompt: concept.aspetto, scale: npc ? 1.25 : 1.1 },
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
  return m;
}

export async function forge(c: Council, req: ForgeRequest, validate: ModuleValidator, art?: { examples: StylePair[] }): Promise<ForgeResult> {
  const data = { request: req };
  const codes = req.paletteCodes.join(', ');

  const askConcept = (feedback = '') =>
    c.ask<Concept>(
      'narratore',
      'forge.concept',
      [
        `Richiesta (${req.origin}): ${req.prompt}`,
        req.kind ? `Deve essere di tipo "${req.kind}".` : 'Scegli il tipo: npc (persona simulata), oggetto (sta nel mondo, inerte o interattivo), strumento (si raccoglie e va nell\'inventario).',
        `Terreni validi per "contesto.terreni": ${codes}. "rarita" tra 0.02 e 0.5.`,
        'Per un npc scrivi in "persona" la scheda del tipo di personaggio (ogni individuo avrà poi nome e storia propri): come parla, cosa vuole, cosa sa del mondo (e delle sue crepe); in "porta" 3-6 oggetti comuni del suo mestiere.',
        'Per un oggetto: in "azioni" 1-4 cose concrete che ci si può fare (aprire, sedersi, attingere, dormire, accendere, pregare…), con "richiede" se serve uno strumento; se è un mobile che contiene cose, "contenitore" con capienza e tabella di bottino (cucina, cassa, bottega, comune, contadino).',
        'Per uno strumento elenca in "comandi" al massimo due voci: "usa" = effetto su chi lo usa o consumo (mangiare, bere, leggere, accendere); "azione" = effetto su ciò che il viandante ha davanti (tagliare, colpire, aprire, scavare).',
        'Non creare moduli per elementi del terreno (sentieri, fiumi, ponti, muri, prati): quelli sono la mappa del Cartografo. Crea cose concrete che stanno sul terreno.',
        feedback && `L'Arbitro ha obiettato: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n'),
      CONCEPT_SCHEMA,
      { data },
    );
  const askPhysics = (concept: Concept, feedback = '') =>
    c.ask<PhysicsSpec>(
      'fisico',
      'forge.physics',
      [
        `Definisci la fisica di questo elemento in modo coerente con ciò che è e con l'aspetto descritto:\n${JSON.stringify(concept, null, 1)}`,
        'Unità: raggio in caselle (0.2-0.5), velocita in caselle/s (0 se non si muove da solo), massa in kg, attrito 0-1 (quanto in fretta si ferma se spinto), peso in unità di inventario (il giocatore porta 20 senza rallentare).',
        feedback && `L'Arbitro ha obiettato: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n'),
      PHYSICS_SCHEMA,
      { data: { ...data, concept } },
    );
  const askCode = (concept: Concept, physics: PhysicsSpec, feedback = '') =>
    c.ask<CodeSpec>(
      'ingegnere',
      'forge.code',
      [
        `Scrivi logic.lua per questo modulo.\nConcetto:\n${JSON.stringify(concept, null, 1)}\nFisica:\n${JSON.stringify(physics)}`,
        `Funzioni obbligatorie: ${requiredHooks(concept).join(', ') || 'nessuna (restituisci comunque una tabella M)'}.`,
        'In "componenti_json" eventuali componenti extra come oggetto JSON (stringa), es. {"luce":{"accesa":false}}. Niente stato nelle variabili Lua.',
        feedback && `DA CORREGGERE: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n'),
      CODE_SCHEMA,
      { data: { ...data, concept, physics }, temperature: 0.3 },
    );

  let concept = await askConcept();
  if (req.kind) concept.tipo = req.kind;
  c.say('narratore', 'propone', `«${concept.nome}» (${concept.tipo}): ${concept.descrizione}`);
  // Buildings are environments (the Cartographer's layouts), never one-tile objects.
  if (isStructure(concept)) {
    const why = `«${concept.nome}» è un edificio o una struttura: quelli sono ambienti del Cartografo, non oggetti. Crea invece qualcosa che sta dentro o fuori un edificio (un mobile, un attrezzo, una persona).`;
    c.say('kernel', 'scarta', why, 'narratore');
    concept = await askConcept(why);
    if (req.kind) concept.tipo = req.kind;
    if (isStructure(concept)) throw new Error(`ancora una struttura: ${concept.nome}`);
    c.say('narratore', 'corregge', `«${concept.nome}» (${concept.tipo}): ${concept.descrizione}`);
  }
  let physics = await askPhysics(concept);
  c.say('fisico', 'propone', `${physics.solido ? 'solido' : 'attraversabile'}${physics.spingibile ? ', spingibile' : ''}, ${physics.massa} kg, peso ${physics.peso}${physics.note ? ` — ${physics.note}` : ''}`);
  let code = await askCode(concept, physics);
  c.say('ingegnere', 'propone', `logic.lua, ${code.logic.split('\n').length} righe${code.note ? ` — ${code.note}` : ''}`);

  // The Arbiter checks that narrative, physics and code tell the same story.
  const review = await c.ask<{ approvato: boolean; problemi: Array<{ agente: AgentId; problema: string }> }>(
    'arbitro',
    'forge.review',
    `Verifica la coerenza tra narrativa, aspetto, fisica e codice di questo modulo. Segnala solo incoerenze concrete, indicando l'agente responsabile.\nConcetto:\n${JSON.stringify(concept, null, 1)}\nFisica:\n${JSON.stringify(physics)}\nlogic.lua:\n${code.logic}`,
    REVIEW_SCHEMA,
    { data: { ...data, concept, physics, code }, temperature: 0.2 },
  );
  if (review.approvato || !review.problemi?.length) c.say('arbitro', 'approva', `«${concept.nome}» è coerente.`);
  else {
    for (const p of review.problemi.slice(0, 3)) c.say('arbitro', 'obietta', p.problema, p.agente);
    const issues = (agent: AgentId) => review.problemi.filter((p) => p.agente === agent).map((p) => p.problema).join('; ');
    if (issues('narratore')) {
      concept = await askConcept(issues('narratore'));
      if (req.kind) concept.tipo = req.kind;
      c.say('narratore', 'corregge', `«${concept.nome}»: ${concept.descrizione}`);
    }
    if (issues('fisico') || issues('narratore')) {
      physics = await askPhysics(concept, issues('fisico'));
      c.say('fisico', 'corregge', `${physics.solido ? 'solido' : 'attraversabile'}, ${physics.massa} kg, peso ${physics.peso}`);
    }
    if (issues('ingegnere') || issues('narratore') || issues('fisico')) {
      code = await askCode(concept, physics, issues('ingegnere'));
      c.say('ingegnere', 'corregge', `logic.lua riscritto (${code.logic.split('\n').length} righe)`);
    }
  }

  // The kernel's validator has the last word; its errors go back to the Engineer.
  const id = moduleId(concept, req.existingIds);
  let manifest = assembleManifest(id, concept, physics, code, req.paletteCodes, req.origin);
  for (let round = 0; ; round++) {
    const missing = requiredHooks(concept).filter((h) => !new RegExp(`function\\s+M\\.${h}\\b|M\\.${h}\\s*=\\s*function`).test(code.logic));
    const errors = [...validate(manifest, code.logic), ...missing.map((h) => `manca la funzione M.${h}`)];
    if (!errors.length) break;
    c.say('kernel', 'scarta', errors.join('; '), 'ingegnere');
    if (round >= 2) throw new Error(`modulo non valido: ${errors.join('; ')}`);
    code = await askCode(concept, physics, errors.join('; '));
    c.say('ingegnere', 'corregge', 'logic.lua corretto');
    manifest = assembleManifest(id, concept, physics, code, req.paletteCodes, req.origin);
  }

  let sprite: string | null = null;
  if (c.models.canPaint && req.paint !== false) {
    c.say('artista', 'dipinge', `«${concept.nome}»: ${concept.aspetto}${art?.examples.length ? ` (sullo stile di ${art.examples.length} esempi)` : ''}`);
    sprite = await new Atelier(c).sprite(`${concept.nome}: ${concept.aspetto}`, concept.tipo, art?.examples ?? []).catch((e: Error) => {
      c.say('artista', 'errore', e.message);
      return null;
    });
  }
  return { id, manifest, logic: code.logic, sprite, concept, summary: `${concept.tipo === 'npc' ? 'Nuovo abitante' : concept.tipo === 'strumento' ? 'Nuovo strumento' : 'Nuovo oggetto'} «${concept.nome}» (${id})` };
}

/** A generated module failed at runtime: the Engineer gets the code and the error, and fixes it. */
export async function repairLogic(c: Council, manifest: Manifest, logic: string, error: string, feedback = ''): Promise<string> {
  const code = await c.ask<CodeSpec>(
    'ingegnere',
    'forge.fix',
    [
      `Il modulo ${manifest.id} («${manifest.name}», ${manifest.description ?? ''}) è entrato nell'universo ma fallisce durante il gioco.`,
      `Errore a runtime: ${error}`,
      `logic.lua attuale:\n${logic}`,
      'Correggilo mantenendo lo stesso comportamento previsto. Usa solo l\'API documentata.',
      feedback && `Il validatore ha rifiutato la correzione precedente: ${feedback}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
    CODE_SCHEMA,
    { data: { manifest, logic, error }, temperature: 0.2 },
  );
  return code.logic;
}

export function spritePrompt(c: Council, concept: Pick<Concept, 'nome' | 'aspetto' | 'tipo'>): string {
  const style = c.files['world/style.md'] ?? '';
  return [
    `ART DIRECTION:\n${style}`,
    `Game sprite of "${concept.nome}": ${concept.aspetto}.`,
    concept.tipo === 'npc' ? 'A single character seen from a high top-down angle, full body, facing down.' : 'A single object seen strictly from above (top-down), as it lies on the ground.',
    'Centered, filling about 70% of the frame, crisp edges, no shadow on the ground, no text, no frame.',
    'Background: one flat uniform pure magenta (#FF00FF) colour, nothing else, so it can be cut out.',
  ].join('\n');
}

const JUDGE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    possibile: { type: 'BOOLEAN' },
    risultato: { type: 'STRING', description: 'nome dello strumento risultante, se esiste già usa esattamente quel nome' },
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
): Promise<{ possible: boolean; result?: string; description?: string; reason: string }> {
  const r = await c.ask<{ possibile: boolean; risultato?: string; descrizione?: string; spiegazione: string }>(
    'narratore',
    'craft.judge',
    `Il giocatore prova a combinare «${a.name}» (${a.description}) con «${b.name}» (${b.description}). Ha senso nel mondo e fisicamente? Se sì, cosa ne esce (uno strumento)? Strumenti già esistenti: ${knownItems.join(', ') || 'nessuno'}. Sii severo: la maggior parte delle combinazioni non produce nulla.`,
    JUDGE_SCHEMA,
    { data: { a, b, knownItems }, temperature: 0.4 },
  );
  c.say('narratore', r.possibile ? 'propone' : 'obietta', r.possibile ? `«${a.name}» + «${b.name}» → «${r.risultato}». ${r.spiegazione}` : r.spiegazione);
  return { possible: !!r.possibile && !!r.risultato, result: r.risultato, description: r.descrizione, reason: r.spiegazione };
}

export const agentName = (id: AgentId | 'kernel') => (id === 'kernel' ? 'Kernel' : AGENTS[id].name);
