// The models the world still lacks, sculpted one at a time (ADR-0042). A module, an item or a terrain
// names a model the library does not have (the Forge names one for every new entity, the Narrator gives
// items a common shape, the Genesis a model to each terrain that has entities standing on it): until the
// Sculptor writes it, the entity shows the generic model of its class. Within a budget per session.

import type { Kernel } from './kernel';
import { procedural, sculpt, shareableProgram, STRUCTURE_SEEDS, type SculptRequest } from './agents/sculptor';
import { classOf, densityFor, guessClass, sizeOf, SIZE_TIERS, TILE, type SizeTier } from '../mj/classes';
import type { ModelInfo } from './forms';
import { BudgetError } from './ai/models';
import { modelGap, sculptPlan } from './coefficients';
import { hashStr, hex } from './rng';
import { italianName } from './internalNames';
import { sameName } from './bring';

/**
 * What a model's index entry says of its size (ADR-0092): the size, if not its class's own, and the coarser density
 * the large boxes run at (ADR-0049), so that the library runs it in the box it was sculpted in.
 */
export function modelSize(req: Pick<SculptRequest, 'classe' | 'taglia'>): Pick<ModelInfo, 'size' | 'vpt'> {
  const cls = classOf(req.classe), t = sizeOf(req.taglia);
  if (!cls || !t || t.id === cls.taglia) return {};
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
export const GENERIC = new Set(['person', 'animal', 'beast', 'tree', 'bush', 'rock', 'pebble', 'object', 'furniture', 'building', 'monument', 'structure']);

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

/** The entries of the same concept at every size: where a program to share is looked for. */
export const structureSiblings = (concept: string): string[] => [...new Set([structureModel(concept), ...SIZE_TIERS.map((t) => structureModel(concept, t.id))])];

/**
 * What the Sculptor writes for the world is a card of the world (ADR-0056: the world pays for `model.sculpt`), so another universe may bring it
 * (T295); a model that came with the cards keeps the card it came with.
 */
const SCULPTED = { task: 'model.sculpt', author: 'sculptor' };

export class ModelDirector {
  private busy = false;
  private used = 0;
  private skip = new Set<string>();
  private stopped = false;
  /** World time before which no model starts (T45b: the pause of the coefficient of models). */
  private nextAt = 0;

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

  /** What is missing, in the order it matters: people and things first, then items' shapes, then terrains. */
  missing(): SculptRequest[] {
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
    // Gargantuan per realm, the kernel sees to it) by the best model.
    for (const id of k.ecs.query('structure')) {
      const s = k.ecs.get(id, 'structure') as { model?: string; concept: string; class: string; size?: SizeTier };
      if (!lacks(s.model)) continue;
      const place = k.chunkAt(k.ecs.get(id, 'pos').x, k.ecs.get(id, 'pos').y)?.place;
      out.push({ id: s.model!, nome: s.concept, shareWith: structureSiblings(s.concept).filter((x) => x !== s.model), aspetto: `${s.concept}: a building one enters, with the door at the front${place ? `, at «${place.name}» (${place.description})` : ''}`, classe: s.class, ...(s.size ? { taglia: s.size } : {}), contesto: place?.name });
    }
    for (const [code, t] of Object.entries(k.palette)) {
      if (code === '?' || !lacks(t.model)) continue;
      out.push({ id: t.model!, nome: t.name, aspetto: t.description ?? t.name, classe: t.layer === 'vegetation' ? 'tree' : t.layer === 'rock' ? 'rock' : 'bush', contesto: `on the tiles of ${t.name}` });
    }
    // Every common lot shows them: before anything else, or the budget may end on the seed's cottages.
    return [...out.filter((r) => r.id.startsWith(COMMON_HOUSE)), ...out.filter((r) => !r.id.startsWith(COMMON_HOUSE))];
  }

  /**
   * A structure at a size the library has another entry of, for the same concept (ADR-0160): the same program, if it is the same
   * size (an entry of before, without the suffix) or if it scales (no box of its own); no call. Undefined if it has to be sculpted.
   */
  shared(req: SculptRequest): { xml: string; info: ModelInfo } | undefined {
    const k = this.k;
    const cls = classOf(req.classe);
    if (!cls) return undefined;
    const own = (t?: string) => sizeOf(t)?.id ?? cls.taglia;
    for (const id of req.shareWith ?? []) {
      const info = k.forms.info(id), xml = k.files[`models/${id}.xml`];
      if (!info || !xml || info.class !== req.classe) continue;
      const { size: _s, vpt: _v, ...rest } = info;
      if (own(info.size) === own(req.taglia)) return { xml, info };
      if (procedural(cls, req.taglia) && procedural(cls, info.size) && shareableProgram(xml)) return { xml, info: { ...rest, ...modelSize(req), name: req.nome } };
    }
    return undefined;
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
    if (!this.active || this.busy || this.k.generationHeld) return;
    // What another size already has costs nothing, and does not wait for the budget; nor what came with the cards.
    for (const r of this.missing()) if (this.free(r)) return;
    if (this.used >= (this.k.config.ai.maxModels ?? 40) || this.k.time < this.nextAt || this.k.coefficients().models <= 0) return;
    const req = this.missing()[0];
    if (req) void this.make(req);
  }

  /** Sculpts a model now and puts it in the library (true if it did). */
  async make(req: SculptRequest): Promise<boolean> {
    this.busy = true;
    this.used++;
    const cls = classOf(req.classe);
    try {
      const coef = this.k.coefficients();
      const r = await sculpt(this.k.council, req, this.k.sculptors(), sculptPlan(coef.reviews));
      this.nextAt = this.k.time + modelGap(coef.models);
      if (!r) {
        this.skip.add(req.id);
        this.lacking(req, 'invalid', this.k.lastDiscard('sculptor', 'model.sculpt'));
        return false;
      }
      const added = this.k.addModel(req.id, r.xml, { class: req.classe, ...modelSize(req), name: req.nome, author: r.model, ...(cls && procedural(cls, req.taglia) ? { seeds: STRUCTURE_SEEDS } : {}), ...(r.voto !== undefined ? { score: r.voto } : {}), ...(req.tinta ? { tint: 'C' } : {}) }, `scultore: ${req.nome}`, SCULPTED);
      if (!added) this.lacking(req, 'invalid', this.k.lastDiscard('sculptor', 'model.sculpt'));
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

  private lacking(req: SculptRequest, esito: 'invalid' | 'error', motivo: string): void {
    this.k.noteShortfall({ request: `il modello di «${req.nome}»`, agent: 'sculptor', task: 'model.sculpt', outcome: esito, reason: motivo });
  }

  /** A model of its own for an entity that showed a generic one, or a new version of its own. */
  isGeneric(id: string): boolean {
    return GENERIC.has(id);
  }
}
