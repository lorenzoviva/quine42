// Out of sight (T327, ADR-0166; T245f, ADR-0149): the accounting once a day of the places nobody sees — the ventures there go on,
// the trades there fill the deposits — and what a place finds when it is seen again: what ripened, the buildings at the stage their
// ventures reached, and `on_return(luogo, trascorso)` for the modules that want it. Part of `npc/`.

import type { ChunkPlan } from '../agents/cartography';
import type { NpcHost, NpcPlace } from './host';
import { dailyProduce, matchJob, WORK_MODULE } from './jobs';
import { readPeople } from './society';
import type { Trades } from './trades';
import { addWork, bring, openVentures, stillNeeded, ventureProgress } from './ventures';
import type { Worksites } from './worksites';

/** A day's work of a team where nobody sees it, per person: the seconds of the phase `day`, less the walking. */
export const AWAY_WORK = 0.3 * 600 * 0.8;
/** What the accounting puts in a deposit at most, per item: a granary is full. */
export const AWAY_DEPOSIT_CAP = 60;

export class Away {
  constructor(
    private readonly host: NpcHost,
    private readonly worksites: Worksites,
    private readonly trades: Trades,
  ) {}

  private awayDone = '';

  /**
   * The accounting of the places nobody sees (section 5): once a day, when the day's work ends (the evening begins), with no Lua and
   * no call. A venture whose place is not loaded takes what it needs from the deposit of its place and adds a day's work of each one
   * of its team; every individual with a trade, of a place not loaded and in no venture, adds to the deposit of its place what its
   * trade brings there in a day. A clock moved forward counts once: what was not lived is not work.
   */
  awayTick(): void {
    if (this.host.mirror) return;
    const fase = this.host.phase();
    const key = `${this.host.day()}`;
    if (fase !== 'evening' || this.awayDone === key) return;
    this.awayDone = key;
    const loaded = (luogo: string | undefined) => !!luogo && this.host.chunks.get(luogo)?.stage === 'planned';
    const depKey = (luogo: string) => `deposit:${luogo.replace(',', ':')}`;
    const deposit = (luogo: string) => ({ ...this.trades.placeDeposit(luogo) });
    const setDeposit = (luogo: string, d: Record<string, number>) => this.host.stores.set(WORK_MODULE, depKey(luogo), Object.keys(d).length ? d : undefined);
    const busy = new Set<string>();
    for (const v of openVentures(this.worksites.ventureList)) {
      for (const m of v.team) busy.add(m.name);
      if (loaded(v.chunk) || !v.team.length) continue;
      const d = deposit(v.chunk);
      const before = ventureProgress(v).fase;
      for (const [it, n] of Object.entries(stillNeeded(v))) {
        const { taken } = bring(v, it, Math.min(n, d[it] ?? 0));
        if (taken) d[it] -= taken;
        if (d[it] !== undefined && d[it] <= 0) delete d[it];
      }
      setDeposit(v.chunk, d);
      addWork(v, v.team.length * AWAY_WORK);
      v.last = this.host.day();
      this.worksites.touchVentures();
      this.worksites.phasesClosed(v, Array.from({ length: ventureProgress(v).fase - before }, (_, i) => before + i));
    }
    // The trades of the places nobody sees fill their deposits.
    const programs = this.trades.jobPrograms();
    const byPlace = new Map<string, Record<string, number>>();
    for (const p of readPeople(this.host.files()).people) {
      const luogo = p.origin?.split('#')[0];
      if (!luogo || loaded(luogo) || busy.has(p.name) || (p.origin && this.host.consumed.has(p.origin))) continue;
      const job = matchJob(p.job, programs);
      if (!job) continue;
      const d = byPlace.get(luogo) ?? deposit(luogo);
      byPlace.set(luogo, d);
      const add = (it: string, n: number) => (d[it] = Math.min(AWAY_DEPOSIT_CAP, (d[it] ?? 0) + n));
      const { gathered, made } = dailyProduce(job);
      for (const [it, n] of Object.entries(gathered)) if ((d[it] ?? 0) < AWAY_DEPOSIT_CAP) add(it, n);
      for (const m of made)
        for (let i = 0; i < m.quante && (d[m.oggetto] ?? 0) < AWAY_DEPOSIT_CAP; i++) {
          if (m.con) {
            if ((d[m.con] ?? 0) < 1) break;
            d[m.con] -= 1;
            if (d[m.con] <= 0) delete d[m.con];
          }
          add(m.oggetto, 1);
        }
    }
    for (const [luogo, d] of byPlace) setDeposit(luogo, d);
  }

  /**
   * Back in a place (T245f): before Lua sees it, what ripened by date ripens and the buildings take the stage their ventures reached
   * while nobody looked. How many seconds of the world it was away, if it was left (undefined the first time, or if it never was).
   */
  returnToPlace(ch: NpcPlace, plan: ChunkPlan): number | undefined {
    if (this.host.mirror) return undefined;
    let changed = false;
    for (const v of this.worksites.ventureList) if (v.chunk === ch.key && this.worksites.ventureIntoPlan(v, plan)) changed = true;
    // A plan goes to disk on its own, ahead of the file of the ventures: after a tab closed in between, or `R`, a stage no venture backs
    // would keep its scaffolding for ever. The ventures say what is being built; without one the building is whole, the new house was never begun.
    const building = new Set(this.worksites.ventureList.filter((v) => v.chunk === ch.key && v.state !== 'finished').map((v) => v.origin));
    for (const origin of Object.keys(plan.stages ?? {})) {
      if (building.has(origin)) continue;
      delete plan.stages![origin];
      changed = true;
    }
    if (plan.stages && !Object.keys(plan.stages).length) delete plan.stages;
    const houses = plan.houses?.filter((h) => !(Number.isFinite(h.stage) && h.stage < 1) || building.has(h.origin));
    if (houses && houses.length !== plan.houses!.length) {
      plan.houses = houses;
      changed = true;
    }
    this.trades.matureChunk(ch);
    const away = Number.isFinite(plan.seen) ? Math.max(0, this.host.time - plan.seen!) : undefined;
    if (plan.seen !== undefined) {
      delete plan.seen;
      changed = true;
    }
    if (changed) this.host.saveChunkSoon(ch);
    return away;
  }

  /** `on_return(luogo, trascorso)`: the modules that want it hear that a place nobody saw is seen again, and after how long. */
  onReturn(key: string, away: number): void {
    for (const m of this.host.modules.values()) {
      if (!m.logicPath || !this.host.hasHook(m.manifest.id, 'on_return')) continue;
      this.host.runModule(m.manifest.id, 'on_return', key, Math.round(away));
    }
  }
}
