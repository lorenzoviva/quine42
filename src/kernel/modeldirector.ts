// The models the world still lacks, sculpted one at a time (ADR-0042). A module, an item or a terrain
// names a model the library does not have (the Forge names one for every new entity, the Narrator gives
// items a common shape, the Genesis a model to each terrain that has entities standing on it): until the
// Sculptor writes it, the entity shows the generic model of its class. Within a budget per session.

import type { Kernel } from './kernel';
import { EXAMPLE_SCORE, procedural, requestSpecialty, sculpt, shareableProgram, STRUCTURE_SEEDS, type SculptorSpecialty, type SculptRequest, type SculptResult } from './agents/sculptor';
import { extractPart, PART_TASK, PART_TRIES } from './agents/parts';
import { WORLD_PARTS } from './worldparts';
import { classOf, densityFor, growsByRules, guessClass, isVessel, RARE_SIZES, sizeOf, SIZE_TIERS, TILE, type SizeTier } from '../mj/classes';
import { cellarOf, type ModelInfo } from './forms';
import { BudgetError } from './ai/models';
import { modelGap, sculptPlan } from './coefficients';
import { hashStr, hex } from './rng';
import { italianName } from './internalNames';
import { sameName } from './bring';
import type { DecisionQuestion } from './ai/decisions';

/**
 * The classes whose missing models may wear one of the library before the Sculptor is asked (T349, ADR-0157 §4.1, D45.2): furniture,
 * plants, rocks and structures. Never people, nor animals and beasts (the bench's wrong guesses were there: the wolf for the dragon, the cat
 * for the sheep), nor small objects, which already share the common shapes.
 */
export const REUSE_CLASSES: readonly string[] = ['furniture', 'tree', 'bush', 'rock', 'pebble', 'monument', 'building', 'structure'];
/** The option «none of them»: a new model is sculpted. A library model with this id is never an option. */
export const REUSE_NEW = 'new';
/** At most this many models of the library in a question: the same class and size seldom have more, and a long list confuses a choice. */
export const REUSE_MAX_OPTIONS = 48;
/** Today's rule, the floor (ADR-0157 §3): nothing in the library fits, the Sculptor writes it. */
export const REUSE_RULE = { model: REUSE_NEW, fits: false };

/**
 * The questions of `model.reuse`, as the bench asked them (`lab/banco/jev/domande.ts → modello`): a Choice among the library and its
 * companion Noul. The choice counts only when the Noul says yes: alone, Jev picks the nearest model even when it does not fit; with the
 * companion the bench had no wrong reuse (T313: 97 %).
 */
export function reuseQuestions(library: Array<{ id: string; name: string }>, cls: string): Record<string, DecisionQuestion> {
  return {
    model: {
      type: 'choice',
      instructions: 'Which model of `library` can show `thing` in the world well enough: the same kind of thing with a similar shape, so that nobody would find it odd? Choose `new` if none of them can.',
      criteria: { ...Object.fromEntries(library.map((m) => [m.id, `${m.name} [${cls}]`])), [REUSE_NEW]: 'None of the models looks like it: a new model is needed.' },
    },
    fits: { type: 'noul', instructions: 'Is there a model in `library` that shows `thing` well enough (the same kind of thing, a similar shape)?' },
  };
}

/**
 * What a model's index entry says of its size (ADR-0092): the size, if not its class's own, and the coarser density
 * the large boxes run at (ADR-0049), so that the library runs it in the box it was sculpted in. A structure that grows by rules says
 * no density (T405): without one it is at `STRUCTURE_VPT` (`vptOf`), and a `vpt` would make it an entry of before (`entryBox`).
 */
export function modelSize(req: Pick<SculptRequest, 'classe' | 'taglia'>): Pick<ModelInfo, 'size' | 'vpt'> {
  const cls = classOf(req.classe), t = sizeOf(req.taglia);
  if (!cls || !t || t.id === cls.taglia) return {};
  // A vessel too (T440): without a density it is at `VESSEL_VPT` (`vptOf`) at every size.
  if (growsByRules(cls, t.id) || isVessel(cls)) return { size: t.id };
  const vpt = densityFor(cls, t.id);
  return { size: t.id, ...(vpt !== TILE ? { vpt } : {}) };
}

/** Common shapes of items: one program each, tinted with each item's colour. */
export const ITEM_SHAPES = ['sack', 'bottle', 'jar', 'basket', 'fruit', 'bread', 'cheese', 'tool', 'blade', 'bow', 'gem', 'crystal', 'book', 'scroll', 'garment', 'hat', 'shoes', 'ring', 'coin', 'herb', 'flower', 'mushroom', 'stone', 'firewood', 'meat', 'fish', 'key', 'candle', 'lantern', 'rope'] as const;
export type ItemShape = (typeof ITEM_SHAPES)[number];
/** The prefix of the model of a common shape (`shape-sack`): the kernel knows these ids, the Sculptor writes them when they are missing. */
export const SHAPE_PREFIX = 'shape-';
export const itemShapeModel = (f: string) => `${SHAPE_PREFIX}${f}`;

/** The generic programs of the classes: shared by every kind of entity without a model of its own. */
export const GENERIC = new Set(['person', 'animal', 'beast', 'tree', 'bush', 'rock', 'pebble', 'object', 'furniture', 'building', 'monument', 'structure', 'vessel']);

/** A model id for a module or an item of its own ("npc.mugnaio" → "npc-mugnaio"). */
const COMMON_HOUSE = 'casa-comune-';
/** The model of a world's common houses (ADR-0134): another description, another model, so a new Genesis does not find the old one. */
export const commonHouseModel = (house: string, classe: string) => `${COMMON_HOUSE}${classe}-${hex(hashStr(house))}`;

export const ownModelId = (id: string) => id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cosa';

/**
 * The model of a structure the Cartographer asks for (ADR-0043): one per concept and size (ADR-0160). The class's own size has no
 * suffix, as ever; the others say theirs, so a Huge fort and a Gargantuan one are two entries, which share one program when it scales.
 */
export function structureModel(concept: string, size?: SizeTier): string {
  const suffix = size && size !== 'large' ? `-${size}` : '';
  return `struttura-${ownModelId(concept).slice(0, 30 - suffix.length)}${suffix}`;
}

/**
 * The tiles of cellar a structure the Cartographer asks with one gets (T417, ADR-0091 point 4): one, two for the rare sizes (Huge, Gargantuan,
 * the important ones of ADR-0092). Only a structure that grows by rules has one (`hasCellar`).
 */
export const cellarFor = (size?: SizeTier): number => (size && RARE_SIZES.includes(size) ? 2 : 1);

/** Whether a structure of a class and a size can have a cellar (T417): the Sculptor digs one only in a structure that grows by rules. */
export const hasCellar = (classe: string, size?: SizeTier): boolean => {
  const cls = classOf(classe);
  return !!cls && growsByRules(cls, size);
};

/** The entries of the same concept at every size: where a program to share is looked for. */
export const structureSiblings = (concept: string): string[] => [...new Set([structureModel(concept), ...SIZE_TIERS.map((t) => structureModel(concept, t.id))])];

/**
 * What the Sculptor writes for the world is a card of the world (ADR-0056: the world pays for `model.sculpt`), so another universe may bring it
 * (T295); a model that came with the cards keeps the card it came with.
 */
const SCULPTED = { task: 'model.sculpt', author: 'sculptor' };
/** A model of the library worn by another request (T349): a card of the world as well, which the decision brought. */
const REUSED = { task: 'model.reuse', author: 'sculptor' };

/**
 * Requests in a queue by specialty (T468, ADR-0239): those of `last` (the trade sculpted last) first, then the others in groups, each group
 * where its first request was; inside a group the order of before. The calls that follow one another read the same prefix (the core, the
 * section), which the cache keeps for minutes.
 */
export function bySpecialty<T>(reqs: readonly T[], trade: (r: T) => string, last?: string): T[] {
  const groups = new Map<string, T[]>();
  if (last !== undefined) groups.set(last, []);
  for (const r of reqs) {
    const s = trade(r);
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s)!.push(r);
  }
  return [...groups.values()].flat();
}

export class ModelDirector {
  private busy = false;
  private used = 0;
  private skip = new Set<string>();
  private stopped = false;
  /** The models this session wore from the library instead of sculpting them (T349). */
  reusedCount = 0;
  /** World time before which no model starts (T45b: the pause of the coefficient of models). */
  private nextAt = 0;
  /** The trade the Sculptor was last asked for (T468): its requests come first, while the cache keeps its prefix. */
  private lastSpecialty?: SculptorSpecialty;
  /** How many times this session each trade was asked for a part of the world (T472): at most `PART_TRIES`. */
  private partTries = new Map<SculptorSpecialty, number>();
  /** The parts of the world this session took (T472). */
  partsTaken = 0;

  constructor(private k: Kernel) {}

  /** The models sculpted this session (out of `ai.maxModels`). */
  get count(): number {
    return this.used;
  }

  get active(): boolean {
    return this.k.ai.name !== 'offline' && !this.stopped;
  }

  /**
   * Why the director cannot sculpt now, or undefined if it can (T296: a card taken away waits for it): the local models, the budget that ended,
   * its cap for the session, the knob the master turned to zero.
   */
  blocked(): string | undefined {
    if (this.k.ai.name === 'offline') return 'i modelli sono locali: lo Scultore non scrive';
    if (this.stopped) return 'il budget dei modelli è finito';
    const max = this.k.config.ai.maxModels ?? 40;
    if (this.used >= max) return `lo Scultore ha già scritto i ${max} modelli di questa sessione`;
    if (this.k.coefficients().models <= 0) return 'il master ha spento i modelli nuovi';
    return undefined;
  }

  /**
   * What is missing, in the order it matters: the common houses first, then in a queue by specialty (T468, `bySpecialty`): the trade
   * sculpted last, then the others where their first request is (people and things first, then items' shapes, then terrains).
   */
  missing(all = false): SculptRequest[] {
    const k = this.k;
    const out: SculptRequest[] = [];
    const lacks = (id: string | undefined) => !!id && !k.forms.info(id) && !this.skip.has(id) && !out.some((r) => r.id === id);
    for (const m of k.modules.values()) {
      const man = m.manifest;
      const app = man.appearance;
      if (!app || !lacks(app.model)) continue;
      const classe = app.class ?? guessClass(`${man.name} ${man.description ?? ''} ${app.look ?? ''}`, man.persona ? 'figure' : undefined).id;
      const taglia = sizeOf(app.size)?.id;
      out.push({ id: app.model!, nome: man.name, aspetto: app.look ?? man.description ?? man.name, classe, ...(taglia ? { taglia } : {}), contesto: man.context });
    }
    for (const d of k.content.items.values()) {
      if (!lacks(d.model)) continue;
      // A common shape is asked for by its word in the language of the world (T307a: the id is internal, `shape-sack`; the word is «sacco»).
      const forma = d.model!.startsWith(SHAPE_PREFIX) ? italianName('impronte', d.model!.slice(SHAPE_PREFIX.length)) : undefined;
      // A thing worn on the body (T290) has its section for the zone: its own model, or the common shape every hat shares.
      const zone = k.wornZone(d.id);
      const worn = zone && (!forma || d.model === itemShapeModel('hat')) ? { worn: zone } : {};
      out.push(forma ? { id: d.model!, nome: `${forma} (forma comune degli oggetti)`, aspetto: `a simple, recognisable ${forma}, like many things of the world (for example: ${d.name})`, classe: 'object', tinta: true, ...worn } : { id: d.model!, nome: d.name, aspetto: d.look ?? d.description, classe: 'object', ...worn });
    }
    // Structures the Cartographer asked for (ADR-0043), at their size (ADR-0092): the rare ones (Huge per zone,
    // Gargantuan per realm, the kernel sees to it) by the best model. Only those of a place a wanderer can reach soon (T488, ADR-0245), the
    // nearest first; `all` every loaded one (what costs nothing: another size's program, a card's model).
    const structures = k.ecs
      .query('structure')
      .map((id) => ({ id, pos: k.ecs.get(id, 'pos') as { x: number; y: number } }))
      .filter((s) => all || k.inReach(s.pos.x, s.pos.y))
      .sort((a, b) => k.wandererDistance(a.pos) - k.wandererDistance(b.pos));
    for (const { id, pos } of structures) {
      const s = k.ecs.get(id, 'structure') as { model?: string; concept: string; class: string; size?: SizeTier; cellar?: number };
      if (!lacks(s.model)) continue;
      const place = k.chunkAt(pos.x, pos.y)?.place;
      // With its cellar, if the Cartographer asked for one (T417): the request says how deep, the Sculptor digs it.
      const cellar = s.cellar && hasCellar(s.class, s.size) ? s.cellar : undefined;
      out.push({ id: s.model!, nome: s.concept, shareWith: structureSiblings(s.concept).filter((x) => x !== s.model), aspetto: `${s.concept}: a building one enters, with the door at the front${cellar ? ', with a cellar under it' : ''}${place ? `, at «${place.name}» (${place.description})` : ''}`, classe: s.class, ...(s.size ? { taglia: s.size } : {}), contesto: place?.name, ...(s.model!.startsWith(COMMON_HOUSE) ? { dwelling: true } : {}), ...(cellar ? { cellar } : {}) });
    }
    for (const [code, t] of Object.entries(k.palette)) {
      if (code === '?' || !lacks(t.model)) continue;
      out.push({ id: t.model!, nome: t.name, aspetto: t.description ?? t.name, classe: t.layer === 'vegetation' ? 'tree' : t.layer === 'rock' ? 'rock' : 'bush', contesto: `on the tiles of ${t.name}` });
    }
    // Every common lot shows them: before anything else, or the budget may end on the seed's cottages.
    return [...out.filter((r) => r.id.startsWith(COMMON_HOUSE)), ...bySpecialty(out.filter((r) => !r.id.startsWith(COMMON_HOUSE)), requestSpecialty, this.lastSpecialty)];
  }

  /**
   * A structure at a size the library has another entry of, for the same concept (ADR-0160): the same program, if it is the same
   * size (an entry of before, without the suffix) or if it scales (no box of its own); no call. Undefined if it has to be sculpted.
   */
  shared(req: SculptRequest): { xml: string; info: ModelInfo } | undefined {
    for (const id of req.shareWith ?? []) {
      const s = this.wearable(req, id);
      if (s) return s;
    }
    return undefined;
  }

  /**
   * Whether the library's model `id` can be worn by a request as it is (ADR-0160): the same class, and the same size or a program that
   * scales to the request's. Its program and the entry it would have; undefined if not.
   */
  private wearable(req: SculptRequest, id: string): { xml: string; info: ModelInfo } | undefined {
    const k = this.k;
    const cls = classOf(req.classe);
    if (!cls) return undefined;
    const own = (t?: string) => sizeOf(t)?.id ?? cls.taglia;
    const info = k.forms.info(id), xml = k.files[`models/${id}.xml`];
    if (!info || !xml || info.class !== req.classe) return undefined;
    const { size: _s, vpt: _v, ...rest } = info;
    if (own(info.size) === own(req.taglia)) return { xml, info };
    if (procedural(cls, req.taglia) && procedural(cls, info.size) && shareableProgram(xml)) return { xml, info: { ...rest, ...modelSize(req), name: req.nome } };
    return undefined;
  }

  /**
   * The library models a request may wear instead of being sculpted (T349): only for the classes of `REUSE_CLASSES`; the same class and a
   * size it runs at, usable (not an isolated card), not a sound nor a model of the studio, not the request itself; at most
   * `REUSE_MAX_OPTIONS`, the generic of the class first.
   */
  reuseOptions(req: SculptRequest): Array<{ id: string; name: string }> {
    // A request to sculpt again (what it had, what is wished: maybe a wanderer's words) and a thing worn or tinted are the Sculptor's.
    if (!REUSE_CLASSES.includes(req.classe) || req.previous !== undefined || req.desiderio !== undefined || req.worn || req.tinta) return [];
    const k = this.k;
    const out: Array<{ id: string; name: string; xml: string }> = [];
    for (const [id, info] of Object.entries(k.forms.models())) {
      // Not the parts of the seed (`part-…`, T417: a stair, a cellar alone is not a building); a request with a cellar only what has one.
      if (id === req.id || id === REUSE_NEW || info.class !== req.classe || info.sound || /^(corona-|schermo-|circuito-|part-)/.test(id)) continue;
      if (req.cellar && !cellarOf(info)) continue;
      const s = k.forms.usable(id) ? this.wearable(req, id) : undefined;
      if (s) out.push({ id, name: info.name ?? id, xml: s.xml });
    }
    out.sort((a, b) => Number(GENERIC.has(b.id)) - Number(GENERIC.has(a.id)) || a.id.localeCompare(b.id));
    // A program worn under more ids (what was reused, a card's copies) is one option: the first.
    const seen = new Set<string>();
    return out.filter((o) => !seen.has(o.xml) && !!seen.add(o.xml)).slice(0, REUSE_MAX_OPTIONS).map(({ id, name }) => ({ id, name }));
  }

  /**
   * Before the Sculptor (T349, ADR-0157 §4.1): does a model of the library already show this? A closed decision (`model.reuse`): the thing
   * as the world describes it (data of the world, never what a wanderer wrote: D45.3), the options of `reuseOptions`; a model is worn
   * only if the companion Noul says it fits. Today's rule is the floor: none fits, the Sculptor writes it. True if one was put in the
   * library under the request's id (its program copied, as for the cards: the same program, another entry).
   */
  async reuse(req: SculptRequest): Promise<boolean> {
    const options = this.reuseOptions(req);
    if (!options.length) return false;
    const k = this.k;
    const thing = { name: req.nome, kind: classOf(req.classe)?.name ?? req.classe, description: req.aspetto, ...(req.taglia ? { size: req.taglia } : {}), ...(req.contesto ? { where: req.contesto } : {}) };
    const d = await k.council.decide('sculptor', 'model.reuse', { state: { thing, library: options.map((o) => ({ id: o.id, name: o.name })) }, questions: reuseQuestions(options, req.classe), rule: REUSE_RULE });
    const chosen = d.fits === true && typeof d.model === 'string' && d.model !== REUSE_NEW ? d.model : undefined;
    const s = chosen && options.some((o) => o.id === chosen) ? this.wearable(req, chosen) : undefined;
    if (!s) return false;
    const { brought: _b, advice: _a, problems: _p, ...info } = s.info;
    if (!k.addModel(req.id, s.xml, { ...info, name: req.nome }, `scultore: ${req.nome}, come «${s.info.name ?? chosen}» (${chosen}) della libreria`, REUSED)) return false;
    this.reusedCount++;
    k.council.say('sculptor', 'info', `«${req.nome}» veste «${s.info.name ?? chosen}» della libreria: niente da scolpire`, undefined, 'model.reuse');
    return true;
  }

  /**
   * A model that came with the cards (T295, ADR-0170) for a request of the same class and the same name (the Narrator was told their names):
   * its program and its entry under the request's id, with its card (the same card, the same chain), no call. Undefined if none fits.
   */
  reused(req: SculptRequest): { xml: string; info: ModelInfo } | undefined {
    const k = this.k;
    const own = (t?: string) => sizeOf(t)?.id ?? classOf(req.classe)?.taglia;
    for (const { id, info } of k.broughtModels()) {
      const xml = k.files[`models/${id}.xml`];
      if (id === req.id || info.class !== req.classe || !xml || !sameName(info.name, req.nome) || own(info.size) !== own(req.taglia)) continue;
      return { xml, info: { ...info, name: req.nome } };
    }
    return undefined;
  }

  /**
   * A request that costs nothing: the program of another size of its structure (ADR-0160), or a model that came with the cards (T295).
   * Put in the library now; true if it was one (added, or skipped as invalid).
   */
  free(r: SculptRequest): boolean {
    const shared = r.shareWith?.length ? this.shared(r) : undefined;
    const s = shared ?? this.reused(r);
    if (!s) return false;
    if (!this.k.addModel(r.id, s.xml, s.info, shared ? `scultore: ${r.nome}, lo stesso programma di un'altra taglia` : `scultore: ${r.nome}, il modello venuto con le carte`, SCULPTED)) this.skip.add(r.id);
    return true;
  }

  /** Called every few seconds: starts the next model if idle. */
  pump(): void {
    if (!this.active || this.busy || this.k.generationHeld || this.k.paceHeld()) return;
    // What another size already has costs nothing, and does not wait for the budget; nor what came with the cards (in reach or not, T488).
    for (const r of this.missing(true)) if (this.free(r)) return;
    if (this.used >= (this.k.config.ai.maxModels ?? 40) || this.k.time < this.nextAt || this.k.coefficients().models <= 0) return;
    const req = this.missing()[0];
    if (req) void this.make(req);
  }

  /**
   * Sculpts a model now and puts it in the library (true if it did). First the library is asked (`reuse`, T349): a model worn as it is
   * costs no sculpture, does not count in `ai.maxModels` and starts no pause.
   */
  async make(req: SculptRequest): Promise<boolean> {
    this.busy = true;
    const cls = classOf(req.classe);
    try {
      if (await this.reuse(req)) return true;
      this.used++;
      this.lastSpecialty = requestSpecialty(req);
      const coef = this.k.coefficients();
      const r = await sculpt(this.k.council, req, this.k.sculptors(), sculptPlan(coef.reviews));
      this.nextAt = this.k.time + this.k.pacedGap(modelGap(coef.models));
      if (!r) {
        this.skip.add(req.id);
        this.lacking(req, 'invalid', this.k.lastDiscard('sculptor', 'model.sculpt'));
        return false;
      }
      // Its cellar (T417): the one the program holds, which the entry says, so the library runs it under the ground.
      const added = this.k.addModel(req.id, r.xml, { class: req.classe, ...modelSize(req), name: req.nome, author: r.model, ...(cls && procedural(cls, req.taglia) ? { seeds: STRUCTURE_SEEDS } : {}), ...(r.score !== undefined ? { score: r.score } : {}), ...(req.tinta ? { tint: 'C' } : {}), ...(r.cellar ? { cellar: r.cellar } : {}) }, `scultore: ${req.nome}`, SCULPTED);
      if (!added) this.lacking(req, 'invalid', this.k.lastDiscard('sculptor', 'model.sculpt'));
      // A good model of a trade that lacks its parts may give one (T472): while the cache still keeps the trade's prefix.
      else await this.part(req, r);
      return added;
    } catch (e) {
      if (e instanceof BudgetError) this.stopped = true;
      this.k.council.say('sculptor', 'errore', `«${req.nome}»: ${(e as Error).message}`, undefined, 'model.sculpt');
      this.skip.add(req.id);
      this.lacking(req, 'error', (e as Error).message);
      return false;
    } finally {
      this.busy = false;
    }
  }

  /**
   * The trade a model just made may give a part of the world to (T472, ADR-0243), or undefined: only while the director sculpts with the models
   * (the local ones write no part), for a model the Artist gave at least `EXAMPLE_SCORE`, of a trade (not the actions) with fewer than
   * `WORLD_PARTS` parts and asked fewer than `PART_TRIES` times this session; the knob of the models above 0, a universe that is written.
   */
  partWanted(req: Pick<SculptRequest, 'classe' | 'taglia' | 'worn'>, score: number | undefined): SculptorSpecialty | undefined {
    if (!this.active || score === undefined || score < EXAMPLE_SCORE) return undefined;
    if (this.k.coefficients().models <= 0 || this.k.readOnly() !== undefined) return undefined;
    const specialty = requestSpecialty(req);
    if (specialty === 'actions' || (this.partTries.get(specialty) ?? 0) >= PART_TRIES) return undefined;
    return this.k.worldParts(specialty).length >= WORLD_PARTS ? undefined : specialty;
  }

  /**
   * Asks the Sculptor for a part of a model just made (T472): one call on the model that sculpted it, the kernel takes the part if the model
   * rewritten with it makes the same grid on every seed (`addWorldPart`). True if it did. Never throws: a part is the world's own good, not
   * something it lacks, so what goes wrong is said in the feed and is no shortfall.
   */
  async part(req: SculptRequest, r: Pick<SculptResult, 'model' | 'score'>): Promise<boolean> {
    const specialty = this.partWanted(req, r.score);
    const xml = this.k.files[`models/${req.id}.xml`];
    if (!specialty || !xml) return false;
    this.partTries.set(specialty, (this.partTries.get(specialty) ?? 0) + 1);
    try {
      const out = await extractPart(this.k.council, { id: req.id, xml, nome: req.nome, classe: req.classe, ...(req.taglia ? { taglia: req.taglia } : {}), ...(req.worn ? { worn: req.worn } : {}), score: r.score! }, r.model, (made) => this.k.addWorldPart(req.id, made, { specialty, author: r.model }), this.k.worldParts(specialty));
      if (!out.id) return false;
      this.partsTaken++;
      return true;
    } catch (e) {
      if (e instanceof BudgetError) this.stopped = true;
      this.k.council.say('sculptor', 'errore', `parte di «${req.nome}»: ${(e as Error).message}`, undefined, PART_TASK);
      return false;
    }
  }

  private lacking(req: SculptRequest, esito: 'invalid' | 'error', motivo: string): void {
    this.k.noteShortfall({ request: `il modello di «${req.nome}»`, agent: 'sculptor', task: 'model.sculpt', outcome: esito, reason: motivo });
  }

  /** A model of its own for an entity that showed a generic one, or a new version of its own. */
  isGeneric(id: string): boolean {
    return GENERIC.has(id);
  }
}
