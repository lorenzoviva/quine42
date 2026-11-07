// The trades of the people (T327, ADR-0166; T245b, T245c, ADR-0140, ADR-0141): the valid programs of the trades of the universe, the
// deposit of a place, an individual using a thing (`world.act`), and what ripens on the tiles the trades sowed. Part of `npc/`.

import type { Id } from '../ecs';
import { internalJobProgram } from '../internalNames';
import type { FileMap } from '../types';
import type { NpcHost, NpcPlace } from './host';
import { validateJobProgram, WORK_MODULE, type JobProgram } from './jobs';
import type { Places } from './places';

export class Trades {
  constructor(
    private readonly host: NpcHost,
    private readonly places: Places,
  ) {}

  private jobCache?: { files: FileMap; programs: JobProgram[] };

  private maturedPhase = '';

  private actingAs = 0;

  /** The programs of the trades of this universe: the `mestieri` of its `data` modules, those that are valid. */
  jobPrograms(): JobProgram[] {
    if (this.jobCache?.files === this.host.files()) return this.jobCache.programs;
    const world = { codes: new Set(Object.keys(this.host.palette)), items: new Set(this.host.content.items.keys()), tags: new Set([...this.host.modules.values()].flatMap((m) => m.manifest.tags ?? [])) };
    const programs: JobProgram[] = [];
    const seen = new Set<string>();
    for (const m of this.host.modules.values()) {
      // The programs of the trades (`jobs`, `mestieri` until the contract 0.4: a module the validator let through as it was).
      const list = (m.manifest as { jobs?: unknown; mestieri?: unknown }).jobs ?? (m.manifest as { mestieri?: unknown }).mestieri;
      if (m.manifest.kind !== 'data' || !Array.isArray(list)) continue;
      for (const raw of list) {
        // A program of the contract 0.2 (Italian values) reads internal (T307b): the migration ports the seed's, this a stray one.
        const { program, errors } = validateJobProgram(internalJobProgram(raw), world);
        if (!program) {
          this.host.log('lavoro', `${m.manifest.id}: programma scartato: ${errors.slice(0, 3).join('; ')}`);
          continue;
        }
        if (seen.has(program.id)) continue;
        seen.add(program.id);
        programs.push({ ...program, module: m.manifest.id });
      }
    }
    this.jobCache = { files: this.host.files(), programs };
    return programs;
  }

  /** What the deposit of a place holds (T245c, ADR-0141): what the trades brought there, in the store of `sys.work`. */
  placeDeposit(chunkKey: string): Record<string, number> {
    const v = this.host.stores.get(WORK_MODULE, `deposit:${chunkKey.replace(',', ':')}`);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, number>) : {};
  }

  /**
   * An individual uses a thing (T245c, ADR-0141): the `on_act` of its module with the individual as user, as «Usa» does for the wanderer.
   * Only an action without effects (the effects of a manifest are the wanderer's: needs, items, states), only within reach, never a
   * wanderer as user (they act through the kernel), never more than two deep.
   */
  actAs(user: Id, target: Id, action?: string): string | undefined {
    if (this.actingAs >= 2 || !this.host.ecs.alive.has(user) || !this.host.ecs.alive.has(target) || user === target || this.host.wandererOf(user) !== undefined || this.host.ecs.has(user, 'player')) return undefined;
    const modId: string | undefined = this.host.ecs.get(target, 'module')?.id;
    const entry = modId ? this.host.modules.get(modId) : undefined;
    const pu = this.host.ecs.get(user, 'pos');
    const pt = this.host.ecs.get(target, 'pos');
    if (!entry?.logicPath || !pu || !pt || Math.hypot(pu.x - pt.x, pu.y - pt.y) > 2.5 || !this.host.hasHook(modId!, 'on_act')) return undefined;
    const actions = entry.manifest.actions ?? [];
    const a = action === undefined ? actions.find((x) => !x.effects?.length) : actions.find((x) => x.id === action);
    if (!a || a.effects?.length) return undefined;
    this.actingAs++;
    try {
      const { value, failed } = this.host.runModule(modId!, 'on_act', target, user, a.id);
      return !failed && typeof value === 'string' && value ? value.slice(0, 300) : undefined;
    } finally {
      this.actingAs--;
    }
  }

  /**
   * What ripens ripens (T245b, ADR-0140): at each phase of the day, in the places loaded, a tile whose terrain says `matura` becomes
   * the tile it says once its days have passed from when it was written. An edit with no day is of today (the plans of before).
   */
  matureTick(): void {
    const phase = `${this.host.day()}|${this.host.phase()}`;
    if (phase === this.maturedPhase || this.host.mirror) return;
    this.maturedPhase = phase;
    for (const ch of this.host.chunks.values()) this.matureChunk(ch);
  }

  /** What ripens in one planned place, by date: in a loaded place at each phase, in one coming back at once (T245f). */
  matureChunk(ch: NpcPlace): void {
    const edits = ch.plan?.edits;
    if (ch.stage !== 'planned' || !edits) return;
    const today = this.host.day();
    const S = this.host.config.chunkSize;
    for (const [idx, code] of Object.entries(edits)) {
      const m = this.host.palette[code]?.ripens;
      const into = m && this.places.tileCodeOf(m.in);
      if (!m || !into) continue;
      const days = (ch.plan!.days ??= {});
      const since = days[idx] ??= today;
      if (today - since < m.after) continue;
      const i = Number(idx);
      this.host.setTile(ch.cx * S + (i % S), ch.cy * S + Math.floor(i / S), into);
    }
  }
}
