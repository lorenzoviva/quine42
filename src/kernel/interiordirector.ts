// The interiors the buildings still lack, one type at a time (T410, ADR-0214; `docs/design/scenografo.md` § 6 and § 10.2). A structure that
// grows by rules is entered bare, valid and walkable, until the Scenografo chooses its furniture: once for the type, kept on its entry of
// `models/index.json` (`interior`), as a model is kept once for its kind; the kernel places it on every seed (`src/kernel/furnish.ts`).
// Within a cap per session and the coefficient of interiors (`interiors`, ADR-0133); like the Sculptor and the Musician, not with the local
// models by itself (offline the director is called by hand, from the console or a test).

import { BudgetError } from './ai/models';
import { designInterior, INTERIOR_TASK, type CataloguePiece, type MeasuredSeed } from './agents/scenographer';
import { interiorGap } from './coefficients';
import { furnishable, pieceOf } from './furnish';
import { interiorPlan } from './interior';
import type { Kernel } from './kernel';
import { GENERIC } from './modeldirector';
import { classOf, growsByRules } from '../mj/classes';

/** The most interiors a session asks for: one per type of building, and a world has few. */
export const MAX_INTERIORS = 16;
/** The seeds of a building the Scenografo is told of (T303, T406: the seeds 1 and 2). */
export const INTERIOR_SEEDS = 2;

export class InteriorDirector {
  private busy = false;
  private used = 0;
  private skip = new Set<string>();
  private stopped = false;
  private nextAt = 0;

  constructor(private k: Kernel) {}

  /** The interiors asked for this session (out of `MAX_INTERIORS`). */
  get count(): number {
    return this.used;
  }

  get active(): boolean {
    return this.k.ai.name !== 'offline' && !this.stopped;
  }

  /** Why the director cannot ask for an interior now, or undefined if it can. */
  blocked(): string | undefined {
    if (this.k.ai.name === 'offline') return 'i modelli sono locali: lo Scenografo non arreda da sé';
    if (this.stopped) return 'il budget degli interni è finito';
    if (this.used >= MAX_INTERIORS) return `lo Scenografo ha già arredato i ${MAX_INTERIORS} edifici di questa sessione`;
    if (this.k.coefficients().interiors <= 0) return 'il master ha spento gli interni';
    return undefined;
  }

  /**
   * Whether a model is a building the Scenografo furnishes and has no interior yet: a structure that grows by rules, of its own (not the
   * generic of its class, which stands in for one still to sculpt). One the local models furnished is asked again once the models are not local.
   */
  wants(model: string): boolean {
    const info = this.k.forms.info(model);
    const cls = info && classOf(info.class);
    if (!info || !cls || !growsByRules(cls, info.size) || GENERIC.has(model)) return false;
    const spec = this.k.forms.interiorSpec(model);
    return !spec || (spec.author === 'offline' && this.k.ai.name !== 'offline');
  }

  /** The buildings of the places loaded that wear a model of their own without an interior, the first met first. */
  missing(): string[] {
    const out: string[] = [];
    for (const id of this.k.ecs.query('structure')) {
      const fc = this.k.ecs.get(id, 'form');
      const model = fc?.model;
      // A building still wearing the generic of its class waits for its own model.
      if (!model || out.includes(model) || this.skip.has(model) || (fc.wanted && fc.wanted !== model) || !this.wants(model)) continue;
      out.push(model);
    }
    return out;
  }

  /** Called every few seconds: starts the next interior if idle. */
  pump(): void {
    if (!this.active || this.busy || this.k.generationHeld || this.k.paceHeld() || this.used >= MAX_INTERIORS || this.k.time < this.nextAt || this.k.coefficients().interiors <= 0) return;
    const model = this.missing()[0];
    if (model) void this.make(model);
  }

  /** The catalogue at a building's density: the library's furniture, each run once (its first seed) and measured as the kernel places it. */
  async catalogue(vpt: number): Promise<CataloguePiece[]> {
    const out: CataloguePiece[] = [];
    for (const id of this.k.forms.furniture()) {
      const f = await this.k.forms.settled(id, 1);
      const piece = f?.result && pieceOf(id, f.result, f.vpt, vpt);
      if (piece) out.push({ id, name: this.k.forms.info(id)?.name ?? id, size: [piece.X / vpt, piece.Y / vpt, piece.Z / vpt] });
    }
    return out;
  }

  /**
   * Asks the Scenografo for a building's interior now and keeps it on its entry; `chi` pays, else the world (`interior.design` is a common
   * task: the interior is part of the type, as its model). A building where nothing could be furnished is not asked for. `error` says that the
   * call itself failed (the queue, the network), not that the Scenografo found nothing: who asked may try again (T411). `author` is who the
   * entry says wrote it, if not the world's text model (the regeneration on the queue: the model of the CLI).
   */
  async make(model: string, chi?: string, author?: string): Promise<{ ok: boolean; summary: string; error?: string }> {
    const k = this.k;
    const forms = k.forms;
    const name = forms.info(model)?.name ?? model;
    if (this.busy) return { ok: false, summary: 'Lo Scenografo sta già arredando un edificio.' };
    this.busy = true;
    const lacking = (outcome: 'invalid' | 'error', reason: string) => k.noteShortfall({ request: `l'interno di ${name}`, ...(chi ? { who: chi } : {}), agent: 'scenographer', task: INTERIOR_TASK, outcome, reason });
    try {
      // What the kernel measures of the bare building, seed by seed: the Scenografo never sees the program.
      const actions = forms.compiled(model)?.actions ?? [];
      const seeds: MeasuredSeed[] = [];
      let box: [number, number, number] = [0, 0, 0];
      for (let s = 1; s <= Math.min(INTERIOR_SEEDS, forms.seedsOf(model)); s++) {
        const f = await forms.settled(model, s, undefined, undefined, { bare: true });
        if (!f?.result) continue;
        const g = f.result.grid;
        box = [g.X, g.Y, g.Z];
        seeds.push({ seed: s, plan: interiorPlan({ grid: g, palette: f.result.palette, vpt: f.vpt, base: f.base, actions, seed: s }) });
      }
      if (!seeds.some((s) => furnishable(s.plan))) {
        this.skip.add(model);
        k.council.say('kernel', 'info', `«${name}» non ha stanze da arredare: resta com'è`, 'scenographer', INTERIOR_TASK);
        return { ok: false, summary: `«${name}» non ha stanze da arredare.` };
      }
      const vpt = seeds[0].plan.vpt;
      const catalogue = await this.catalogue(vpt);
      if (!catalogue.length) {
        this.skip.add(model);
        return { ok: false, summary: 'La libreria non ha mobili da posare.' };
      }
      this.used++;
      k.council.say('scenographer', 'propone', `l'interno di «${name}»`, undefined, INTERIOR_TASK);
      const r = await designInterior(k.council, { model, name, box, vpt, seeds, catalogue }, chi ? { chi } : {});
      this.nextAt = k.time + k.pacedGap(interiorGap(k.coefficients().interiors));
      if (!r) {
        this.skip.add(model);
        lacking('invalid', k.lastDiscard('scenographer', INTERIOR_TASK));
        return { ok: false, summary: `Lo Scenografo non ha trovato un interno per «${name}».` };
      }
      const by = k.ai.name === 'offline' ? 'offline' : (author ?? k.config.ai.textModel ?? k.ai.name);
      if (!k.setInterior(model, { rules: r.rules, author: by }, `scenografo: ${name}`)) {
        this.skip.add(model);
        lacking('invalid', `l'interno di «${name}» non si è potuto scrivere`);
        return { ok: false, summary: `L'interno di «${name}» non si è potuto scrivere.` };
      }
      return { ok: true, summary: `Lo Scenografo ha arredato «${name}» (${r.rules.length} regole).` };
    } catch (e) {
      if (e instanceof BudgetError) this.stopped = true;
      k.council.say('scenographer', 'errore', (e as Error).message, undefined, INTERIOR_TASK);
      this.skip.add(model);
      lacking('error', (e as Error).message);
      return { ok: false, summary: `Lo Scenografo non ha potuto arredare: ${(e as Error).message}`, error: (e as Error).message };
    } finally {
      this.busy = false;
    }
  }
}
