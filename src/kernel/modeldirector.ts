// The models the world still lacks, sculpted one at a time (ADR-0042). A module, an item or a terrain
// names a model the library does not have (the Forge names one for every new entity, the Narrator gives
// items a common shape, the Genesis a model to each terrain that has entities standing on it): until the
// Sculptor writes it, the entity shows the generic model of its class. Within a budget per session.

import type { Kernel } from './kernel';
import { sculpt, type SculptRequest } from './agents/sculptor';
import { classOf, densityOf, guessClass, sizeOf, TILE, tilesOf, type SizeTier } from '../mj/classes';
import type { ModelInfo } from './forms';
import { BudgetError } from './ai/models';
import { modelGap, sculptPlan } from './coefficients';
import { hashStr, hex } from './rng';
import { italianName } from './internalNames';

/**
 * What a model's index entry says of its size (ADR-0092): the size, if not its class's own, and the coarser density
 * the large boxes run at (ADR-0049), so that the library runs it in the box it was sculpted in.
 */
export function modelSize(req: Pick<SculptRequest, 'classe' | 'taglia'>): Pick<ModelInfo, 'size' | 'vpt'> {
  const cls = classOf(req.classe), t = sizeOf(req.taglia);
  if (!cls || !t || t.id === cls.taglia) return {};
  const vpt = densityOf(tilesOf(cls, t.id));
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
      out.push(forma ? { id: d.model!, nome: `${forma} (forma comune degli oggetti)`, aspetto: `un ${forma} semplice e riconoscibile, come tanti oggetti del mondo (per esempio: ${d.name})`, classe: 'object', tinta: true } : { id: d.model!, nome: d.name, aspetto: d.look ?? d.description, classe: 'object' });
    }
    // Structures the Cartographer asked for (ADR-0043), at their size (ADR-0092): the rare ones (Huge per zone,
    // Gargantuan per realm, the kernel sees to it) by the best model.
    for (const id of k.ecs.query('struttura')) {
      const s = k.ecs.get(id, 'struttura') as { model?: string; concetto: string; classe: string; taglia?: SizeTier };
      if (!lacks(s.model)) continue;
      const place = k.chunkAt(k.ecs.get(id, 'pos').x, k.ecs.get(id, 'pos').y)?.place;
      out.push({ id: s.model!, nome: s.concetto, aspetto: `${s.concetto}: un edificio in cui si entra, con la porta sul davanti${place ? `, a «${place.name}» (${place.description})` : ''}`, classe: s.classe, ...(s.taglia ? { taglia: s.taglia } : {}), contesto: place?.name });
    }
    for (const [code, t] of Object.entries(k.palette)) {
      if (code === '?' || !lacks(t.model)) continue;
      out.push({ id: t.model!, nome: t.name, aspetto: t.description ?? t.name, classe: t.layer === 'vegetation' ? 'tree' : t.layer === 'rock' ? 'rock' : 'bush', contesto: `sulle caselle di ${t.name}` });
    }
    // Every common lot shows them: before anything else, or the budget may end on the seed's cottages.
    return [...out.filter((r) => r.id.startsWith(COMMON_HOUSE)), ...out.filter((r) => !r.id.startsWith(COMMON_HOUSE))];
  }

  /** Called every few seconds: starts the next model if idle. */
  pump(): void {
    if (!this.active || this.busy || this.k.generationHeld || this.used >= (this.k.config.ai.maxModels ?? 40) || this.k.time < this.nextAt || this.k.coefficients().models <= 0) return;
    const req = this.missing()[0];
    if (req) void this.make(req);
  }

  /** Sculpts a model now and puts it in the library (true if it did). */
  async make(req: SculptRequest): Promise<boolean> {
    this.busy = true;
    this.used++;
    try {
      const coef = this.k.coefficients();
      const r = await sculpt(this.k.council, req, this.k.sculptors(), sculptPlan(coef.reviews));
      this.nextAt = this.k.time + modelGap(coef.models);
      if (!r) {
        this.skip.add(req.id);
        this.lacking(req, 'invalid', this.k.lastDiscard('sculptor', 'model.sculpt'));
        return false;
      }
      const added = this.k.addModel(req.id, r.xml, { class: req.classe, ...modelSize(req), name: req.nome, author: r.model, ...(r.voto !== undefined ? { score: r.voto } : {}), ...(req.tinta ? { tint: 'C' } : {}) }, `scultore: ${req.nome}`);
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
