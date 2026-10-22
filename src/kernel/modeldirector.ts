// The models the world still lacks, sculpted one at a time (ADR-0042). A module, an item or a terrain
// names a model the library does not have (the Forge names one for every new thing, the Narrator gives
// items a common shape, the Genesis a model to each terrain that has things standing on it): until the
// Sculptor writes it, the thing shows the generic model of its class. Within a budget per session.

import type { Kernel } from './kernel';
import { sculpt, type SculptRequest } from './agents/sculptor';
import { guessClass } from '../mj/classes';
import { BudgetError } from './ai/models';

/** Common shapes of items: one program each, tinted with each item's colour. */
export const FORME = ['sacco', 'bottiglia', 'vaso', 'cesto', 'frutto', 'pane', 'formaggio', 'attrezzo', 'lama', 'arco', 'gemma', 'cristallo', 'libro', 'pergamena', 'abito', 'cappello', 'scarpe', 'anello', 'moneta', 'erba', 'fiore', 'fungo', 'pietra', 'legna', 'carne', 'pesce', 'chiave', 'candela', 'lanterna', 'corda'] as const;
export type Forma = (typeof FORME)[number];
export const formaModel = (f: string) => `forma-${f}`;

const GENERIC = new Set(['persona', 'animale', 'bestia', 'albero', 'cespuglio', 'roccia', 'sasso', 'oggetto', 'mobile', 'edificio', 'monumento', 'grande']);

/** A model id for a module or an item of its own ("npc.mugnaio" → "npc-mugnaio"). */
export const ownModelId = (id: string) => id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cosa';

export class ModelDirector {
  private busy = false;
  private used = 0;
  private skip = new Set<string>();
  private stopped = false;
  /** Structures sculpted by the best model this session (it is the dearest). */
  private important = 0;

  constructor(private k: Kernel) {}

  get active(): boolean {
    return this.k.models.name !== 'offline' && !this.stopped;
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
      const classe = app.classe ?? guessClass(`${man.name} ${man.description ?? ''} ${app.aspetto ?? ''}`, man.persona ? 'figura' : undefined).id;
      out.push({ id: app.model!, nome: man.name, aspetto: app.aspetto ?? man.description ?? man.name, classe, contesto: man.context });
    }
    for (const d of k.content.items.values()) {
      if (!lacks(d.model)) continue;
      const forma = d.model!.startsWith('forma-') ? d.model!.slice('forma-'.length) : undefined;
      out.push(forma ? { id: d.model!, nome: `${forma} (forma comune degli oggetti)`, aspetto: `un ${forma} semplice e riconoscibile, come tanti oggetti del mondo (per esempio: ${d.name})`, classe: 'oggetto', tinta: true } : { id: d.model!, nome: d.name, aspetto: d.aspetto ?? d.description, classe: 'oggetto' });
    }
    // Structures the Cartographer asked for (ADR-0043): the important ones by the best model, a few per session.
    for (const id of k.ecs.query('struttura')) {
      const s = k.ecs.get(id, 'struttura') as { model?: string; concetto: string; classe: string; importante?: boolean };
      if (!lacks(s.model)) continue;
      const place = k.chunkAt(k.ecs.get(id, 'pos').x, k.ecs.get(id, 'pos').y)?.place;
      out.push({ id: s.model!, nome: s.concetto, aspetto: `${s.concetto}: un edificio in cui si entra, con la porta sul davanti${place ? `, a «${place.name}» (${place.description})` : ''}`, classe: s.classe, importante: !!s.importante && this.important < 3, contesto: place?.name });
    }
    for (const [code, t] of Object.entries(k.palette)) {
      if (code === '?' || !lacks(t.model)) continue;
      out.push({ id: t.model!, nome: t.name, aspetto: t.description ?? t.name, classe: t.layer === 'vegetation' ? 'albero' : t.layer === 'rock' ? 'roccia' : 'cespuglio', contesto: `sulle caselle di ${t.name}` });
    }
    return out;
  }

  /** Called every few seconds: starts the next model if idle. */
  pump(): void {
    if (!this.active || this.busy || this.k.generationHeld || this.used >= (this.k.config.ai.maxModels ?? 40)) return;
    const req = this.missing()[0];
    if (req) void this.make(req);
  }

  /** Sculpts a model now and puts it in the library (true if it did). */
  async make(req: SculptRequest): Promise<boolean> {
    this.busy = true;
    this.used++;
    try {
      if (req.importante) this.important++;
      const r = await sculpt(this.k.council, req, this.k.sculptors());
      if (!r) {
        this.skip.add(req.id);
        return false;
      }
      this.k.addModel(req.id, r.xml, { classe: req.classe, nome: req.nome, autore: r.model, ...(r.voto !== undefined ? { voto: r.voto } : {}), ...(req.tinta ? { tinta: 'C' } : {}) }, `scultore: ${req.nome}`);
      return true;
    } catch (e) {
      if (e instanceof BudgetError) this.stopped = true;
      this.k.council.say('scultore', 'errore', `«${req.nome}»: ${(e as Error).message}`, undefined, 'model.sculpt');
      this.skip.add(req.id);
      return false;
    } finally {
      this.busy = false;
    }
  }

  /** A model of its own for a thing that showed a generic one, or a new version of its own. */
  isGeneric(id: string): boolean {
    return GENERIC.has(id);
  }
}
