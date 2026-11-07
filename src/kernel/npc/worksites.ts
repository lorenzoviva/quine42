// The ventures at work (T327, ADR-0166; T245d, T245e, ADR-0147, ADR-0148): the common work of the people of a place — a building
// rebuilt, a common house, the harvest — born from rules of the kernel without calls, staffed by trade, worked by who is really at it,
// brought what it needs, its building rising by stages in the plan of its place, and the panel of the site. Owns the ventures in
// memory and writes `world/ventures.json` (the format is `ventures.ts`) when the game is saved. Part of `npc/`.

import type { Id } from '../ecs';
import type { ChunkPlan, PlannedHouse } from '../agents/cartography';
import type { FormComp } from '../forms';
import { italianName } from '../internalNames';
import { countItem, removeItem, type Inventory } from '../inventory';
import { commonHouseModel } from '../modeldirector';
import { hash32, hashStr } from '../rng';
import type { FileMap } from '../types';
import { SOLO } from '../wandererIds';
import type { NpcHost, NpcPlace } from './host';
import { matchJob } from './jobs';
import type { People } from './people';
import { readPeople } from './society';
import type { Trades } from './trades';
import { addWork, bring, fillTeam, HARVEST_DAY, HARVEST_DAYS, HARVEST_ROLES, HOUSE_ROLES, housePhases, missingWords, nextStep, openVentures, pruneVentures, readVentures, SITE_REACH, stillNeeded, ventureId, ventureProgress, ventureState, VENTURES_FILE, writeVentures, YEAR_DAYS, type Venture, type VentureCandidate, type VentureStep } from './ventures';

export class Worksites {
  constructor(
    private readonly host: NpcHost,
    private readonly people: People,
    private readonly trades: Trades,
  ) {}

  /** The ventures as the files say (a universe opened, a rollback): read again, nothing to save, the rules of the day to make again. */
  reset(files: FileMap): void {
    this.ventureList = readVentures(files[VENTURES_FILE]);
    this.venturesDirty = false;
    this.ventureDayDone = -1;
  }

  /** The text of `world/ventures.json` when something moved since the last save, else undefined; either way, nothing to save after. */
  takeChanged(): string | undefined {
    if (!this.venturesDirty) return undefined;
    this.venturesDirty = false;
    return writeVentures(this.ventureList);
  }

  ventureList: Venture[] = [];

  private venturesDirty = false;

  private ventureDayDone = -1;

  private ventureTime = 0;

  /** The ventures of this universe as they are now (a copy): open, waiting, stopped and finished. */
  ventures(): Venture[] {
    return structuredClone(this.ventureList);
  }

  touchVentures(): void {
    this.venturesDirty = true;
  }

  /** The open venture whose team has this name, if any. */
  private ventureOfMember(name: string | undefined): Venture | undefined {
    return name ? this.ventureList.find((v) => v.state !== 'finished' && v.team.some((m) => m.name === name)) : undefined;
  }

  /** The venture an individual works at in the day: going on, with something they can do now. */
  ventureWorkable(name: string | undefined): Venture | undefined {
    const v = this.ventureOfMember(name);
    return v && v.state === 'active' ? v : undefined;
  }

  /** How many of an item an individual can bring: what they carry and what the deposit of their place holds. */
  private canBring(id: Id | undefined, luogo: string | undefined, item: string): number {
    const carried = id !== undefined ? Number(this.host.ecs.get(id, 'load')?.[item]) || 0 : 0;
    return carried + (luogo ? Number(this.trades.placeDeposit(luogo)[item]) || 0 : 0);
  }

  /** The place an individual belongs to: the one their trade says, else where they were met. */
  private placeOfPerson(id: Id | undefined, origine: string | undefined): string | undefined {
    const m = id !== undefined ? this.host.ecs.get(id, 'job')?.chunk : undefined;
    return typeof m === 'string' ? m : origine?.split('#')[0];
  }

  /** Who could work at a venture: the individuals with a trade that has a program, grown up, alive. */
  private ventureCandidates(): VentureCandidate[] {
    const programs = this.trades.jobPrograms();
    return readPeople(this.host.files()).people.flatMap((p): VentureCandidate[] => {
      if (/bambin|neonat|infan|piccol/i.test(`${p.age ?? ''} ${p.job}`) || (p.origin && this.host.consumed.has(p.origin))) return [];
      const job = matchJob(p.job, programs);
      return job ? [{ nome: p.name, mestiere: job.id, luogo: p.origin?.split('#')[0] }] : [];
    });
  }

  /** The teams are made again (who left goes, the roles left are filled): at each new day, and when a venture is born. */
  private staffVentures(only?: Venture): void {
    const candidates = this.ventureCandidates();
    for (const v of only ? [only] : openVentures(this.ventureList)) {
      const busy = new Set(openVentures(this.ventureList).filter((o) => o !== v).flatMap((o) => o.team.map((m) => m.name)));
      const { joined, left } = fillTeam(v, candidates, busy, this.host.config.seed);
      if (!joined.length && !left.length) continue;
      this.touchVentures();
      for (const m of joined) this.people.rememberAbout(m.name, `Lavoro a «${v.title}», come ${m.role}.`, undefined, 1);
      if (left.length) this.host.council.say('kernel', 'info', `«${v.title}»: ${left.join(', ')} non ci sono più; la squadra è di ${v.team.length}.`, undefined, 'impresa.squadra');
    }
  }

  /** A venture is born: kept, staffed, said in the registry. */
  private startVenture(v: Venture): void {
    if (this.ventureList.some((o) => o.id === v.id) || openVentures(this.ventureList).length >= 12) return;
    this.ventureList = pruneVentures([...this.ventureList, v]);
    this.touchVentures();
    this.staffVentures(v);
    this.syncVenturePlan(v);
    this.host.council.say('kernel', 'info', `nasce un'impresa: «${v.title}» (${v.type}, ${v.phases.map((f) => f.name).join(' → ')}), squadra di ${v.team.length}`, undefined, 'impresa.nasce');
  }

  /** A building fell (T245d): its rebuilding, on its lot, with the same model and seed. */
  ventureOfRuin(origin: string, ruin: { concept?: string; class?: string; size?: string }, form: FormComp | undefined, p: { x: number; y: number }): void {
    if (this.host.mirror) return;
    const [luogo, lot] = origin.split('#s');
    if (!luogo || lot === undefined || !/^\d+$/.test(lot)) return;
    const id = ventureId(`ricostruzione|${origin}|${this.host.day()}`);
    const concetto = ruin.concept ?? 'una casa';
    this.startVenture({
      id,
      title: `Si ricostruisce ${concetto}`,
      type: 'construction',
      state: 'active',
      chunk: luogo,
      spot: { x: p.x, y: p.y },
      lot: Number(lot),
      origin: origin,
      concept: concetto,
      ...(ruin.class ? { class: ruin.class } : {}),
      ...(ruin.size ? { size: ruin.size } : {}),
      ...(form ? { model: form.wanted ?? form.model, seed: form.seed, yaw: form.yaw } : {}),
      phases: housePhases(ruin.class),
      roles: structuredClone(HOUSE_ROLES),
      brought: {},
      worked: 0,
      team: [],
      start: this.host.day(),
      last: this.host.day(),
      born_from: 'regola:ricostruzione',
      card: { author: 'kernel' },
    });
  }

  /** The households of a place: the individuals who belong to it, grouped by the family bonds among them. */
  private householdsOf(key: string): number {
    const here = readPeople(this.host.files()).people.filter((p) => p.origin?.startsWith(`${key}#`) && !(p.origin && this.host.consumed.has(p.origin)));
    const names = new Set(here.map((p) => p.name));
    const parent = new Map(here.map((p) => [p.name, p.name]));
    const find = (n: string): string => (parent.get(n) === n ? n : find(parent.get(n)!));
    for (const p of here) for (const f of p.family) if (names.has(f.name)) parent.set(find(p.name), find(f.name));
    return new Set(here.map((p) => find(p.name))).size;
  }

  /**
   * Free ground for a new house in a planned place (rule 10): a box of free ground tiles off the paths and the lots, whose taking keeps
   * every gate and every door joined to the rest. The first from a start that the seed gives, always the same for the same place.
   */
  private freeArea(ch: NpcPlace, side: number): { x0: number; y0: number; x1: number; y1: number } | undefined {
    const S = this.host.config.chunkSize;
    const path = this.host.pathCode();
    const lotBox = (c: number, r: number) => ch.lots.some((b) => c >= b.x0 - 1 && c <= b.x1 + 1 && r >= b.y0 - 1 && r <= b.y1 + 1);
    const built = this.ventureList.filter((v) => v.chunk === ch.key && v.area).map((v) => v.area!);
    const inBuilt = (c: number, r: number) => built.some((b) => c >= b.x0 - 1 && c <= b.x1 + 1 && r >= b.y0 - 1 && r <= b.y1 + 1);
    const ground = (i: number) => {
      const t = this.host.palette[ch.tiles[i]];
      return !!t && !t.solid && !t.indoor && (t.layer ?? 'ground') === 'ground' && ch.tiles[i] !== path;
    };
    const passable = (i: number) => !this.host.palette[ch.tiles[i]]?.solid;
    const gates = Array.from({ length: S * S }, (_, i) => i).filter((i) => (i % S === 0 || i % S === S - 1 || i < S || i >= S * (S - 1)) && passable(i));
    const doors = ch.lots.flatMap((b) => b.doors);
    const joined = (blocked: Set<number>) => {
      const starts = [...gates, ...doors].filter((i) => !blocked.has(i));
      if (!starts.length) return true;
      const seen = new Set([starts[0]]);
      const q = [starts[0]];
      while (q.length) {
        const i = q.pop()!;
        const c = i % S, r = Math.floor(i / S);
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = c + dc, nr = r + dr, j = nr * S + nc;
          if (nc < 0 || nr < 0 || nc >= S || nr >= S || seen.has(j) || blocked.has(j) || !(passable(j) || doors.includes(j))) continue;
          seen.add(j);
          q.push(j);
        }
      }
      return starts.every((i) => seen.has(i));
    };
    const start = hash32(this.host.config.seed, hashStr(ch.key), 245) % (S * S);
    for (let k = 0; k < S * S; k++) {
      const i0 = (start + k) % (S * S);
      const x0 = i0 % S, y0 = Math.floor(i0 / S);
      if (x0 < 2 || y0 < 2 || x0 + side > S - 2 || y0 + side > S - 2) continue;
      const cells: number[] = [];
      let ok = true;
      for (let r = y0; r < y0 + side && ok; r++)
        for (let c = x0; c < x0 + side && ok; c++) {
          const i = r * S + c;
          if (!ground(i) || lotBox(c, r) || inBuilt(c, r)) ok = false;
          else cells.push(i);
        }
      if (ok && joined(new Set(cells))) return { x0, y0, x1: x0 + side - 1, y1: y0 + side - 1 };
    }
    return undefined;
  }

  /** The rules of the kernel that make ventures, once a day, without calls: the common house, the harvest. */
  private ventureRules(today: number): void {
    const S = this.host.config.chunkSize;
    for (const ch of this.host.chunks.values()) {
      if (ch.stage !== 'planned' || !ch.plan) continue;
      const name = ch.plan.place?.name ?? 'il paese';
      const open = openVentures(this.ventureList, ch.key);
      // Three families or more without a house, and free ground: a common house (ADR-0134: the house of the world).
      const houses = ch.lots.length + this.ventureList.filter((v) => v.chunk === ch.key && v.area).length;
      if (!open.some((v) => v.area) && this.householdsOf(ch.key) - houses >= 3) {
        const area = this.freeArea(ch, 4);
        if (area) {
          const house = this.host.commonHouse();
          const own = house ? commonHouseModel(house, 'building') : undefined;
          const model = own ?? this.host.forms.resolve(undefined, 'building');
          const origin = `${ch.key}#v${today}`;
          this.startVenture({
            id: ventureId(`casa|${origin}`),
            title: `La casa comune di ${name}`,
            type: 'construction',
            state: 'active',
            chunk: ch.key,
            spot: { x: ch.cx * S + (area.x0 + area.x1 + 1) / 2, y: ch.cy * S + (area.y0 + area.y1 + 1) / 2 },
            area,
            origin: origin,
            concept: house ?? 'una casetta',
            class: 'building',
            model: model,
            seed: this.host.forms.seedFor(model, origin),
            yaw: 0,
            phases: housePhases('building'),
            roles: structuredClone(HOUSE_ROLES),
            brought: {},
            worked: 0,
            team: [],
            start: today,
            last: today,
            born_from: 'regola:casa',
            card: { author: 'kernel' },
          });
        }
      }
      // The harvest, once a year by the calendar of the kernel: where something ripens into what a trade gathers.
      if (today % YEAR_DAYS !== HARVEST_DAY || this.ventureList.some((v) => v.chunk === ch.key && v.type === 'harvest' && v.start > today - YEAR_DAYS)) continue;
      // A crop: gathered by a trade, ripened from a tile some trade sows (`transform` into it). A wood that grows back is not a harvest.
      const tasks = this.trades.jobPrograms().flatMap((p) => [...p.day.morning, ...p.day.day, ...p.day.evening]);
      const sown = new Set(tasks.flatMap((t) => (t.does === 'transform' && t.to ? [t.to] : [])));
      const gather = tasks.find((t) => t.does === 'gather' && t.tile && Object.entries(this.host.palette).some(([c, d]) => d.ripens?.in === t.tile && sown.has(c)));
      if (!gather?.tile || !gather.item) continue;
      const crops = Object.entries(this.host.palette).filter(([c, d]) => c === gather.tile || d.ripens?.in === gather.tile).map(([c]) => c);
      const cells = [...ch.tiles].flatMap((t, i) => (crops.includes(t) ? [i] : []));
      if (cells.length < 4) continue;
      const mid = cells.reduce((a, i) => ({ c: a.c + (i % S) / cells.length, r: a.r + Math.floor(i / S) / cells.length }), { c: 0, r: 0 });
      this.startVenture({
        id: ventureId(`raccolto|${ch.key}|${today}`),
        title: `Il raccolto di ${name}`,
        type: 'harvest',
        state: 'active',
        chunk: ch.key,
        spot: { x: ch.cx * S + mid.c + 0.5, y: ch.cy * S + mid.r + 0.5 },
        phases: [{ name: 'mietitura', materials: {}, work: Math.min(900, 30 * cells.length), stage: 1 }],
        roles: structuredClone(HARVEST_ROLES),
        task: { tile: gather.tile, item: gather.item, drop: gather.drop ?? gather.tile, duration: gather.duration ?? 10, ...(gather.pose ? { pose: gather.pose } : {}) },
        brought: {},
        worked: 0,
        team: [],
        start: today,
        last: today,
        expires: today + HARVEST_DAYS - 1,
        born_from: 'regola:raccolto',
        card: { author: 'kernel' },
      });
    }
  }

  /**
   * The ventures, once a second (T245d): at a new day the rules and the teams; then the work of who is really at it in a loaded place
   * (at the site, still, at the task `costruisci`), the state read from what was brought and worked, the phases that close, the end.
   * Never on a mirror; never a call to the models.
   */
  ventureTick(): void {
    if (this.host.mirror) return;
    const today = this.host.day();
    if (today !== this.ventureDayDone) {
      this.ventureDayDone = today;
      this.ventureRules(today);
      this.staffVentures();
    }
    // Seconds of the world since the last look, a few at most: a clock set forward is not work done.
    const dt = Math.max(0, Math.min(5, this.host.time - this.ventureTime));
    this.ventureTime = this.host.time;
    const bodies = this.people.bodyOfName();
    for (const v of this.ventureList) {
      if (v.state === 'finished') continue;
      const ch = this.host.chunks.get(v.chunk);
      let worked = 0;
      if (ch?.stage === 'planned') {
        for (const m of v.team) {
          const id = bodies.get(m.name);
          if (id === undefined) continue;
          const job = this.host.ecs.get(id, 'job');
          const s = this.host.ecs.get(id, 'work');
          const task = job?.venture === v.id && s ? job.tasks?.[(Number(s.step) || 1) - 1] : undefined;
          if (task?.does !== 'build' || !this.host.ecs.get(id, 'activity')?.still) continue;
          const p = this.host.ecs.get(id, 'pos');
          if (v.task ? this.host.ecs.get(id, 'chunk')?.key === v.chunk || this.host.chunkAt(p.x, p.y)?.key === v.chunk : Math.hypot(p.x - v.spot.x, p.y - v.spot.y) <= SITE_REACH + 1) worked++;
        }
      }
      if (worked && dt > 0) {
        const closed = addWork(v, worked * dt);
        v.last = today;
        this.touchVentures();
        this.phasesClosed(v, closed);
      }
      const available = (item: string) => v.team.reduce((n, m) => n + this.canBring(bodies.get(m.name), this.placeOfPerson(bodies.get(m.name), readPeople(this.host.files()).people.find((p) => p.name === m.name)?.origin), item), 0) + (Number(this.trades.placeDeposit(v.chunk)[item]) || 0);
      const state = ventureState(v, today, available);
      if (state !== v.state) {
        v.state = state;
        this.touchVentures();
        if (state === 'finished') this.ventureDone(v);
      }
    }
    this.worksitePanels();
  }

  /** A phase that closes is a line of the registry, with no call (`impresa.fase`). */
  phasesClosed(v: Venture, closed: number[]): void {
    for (const k of closed) this.host.council.say('kernel', 'info', `«${v.title}»: finita la fase «${v.phases[k]?.name}» (${k + 1} di ${v.phases.length})`, undefined, 'impresa.fase');
    // The building rises a stage (T245e).
    if (closed.length) this.syncVenturePlan(v);
  }

  /** A venture ends: the team remembers it, a rebuilt or a new building stands whole. */
  private ventureDone(v: Venture): void {
    v.end = this.host.day();
    for (const m of v.team) this.people.rememberAbout(m.name, `Abbiamo finito «${v.title}».`, undefined, 3);
    this.host.council.say('kernel', 'info', `«${v.title}» è finita.`, undefined, 'impresa.fine');
    if (v.origin && !v.area) this.host.consumed.delete(v.origin);
    this.syncVenturePlan(v);
    this.ventureList = pruneVentures(this.ventureList);
  }

  /** The stage a venture shows (T245e): that of its last phase done; 1 once it is finished (a harvest has none). */
  private ventureStage(v: Venture): number {
    return v.state === 'finished' ? 1 : ventureProgress(v).stadio;
  }

  /**
   * The plan of a venture's place says its building and its stage (T245e, ADR-0148): `plan.stadi` for a lot built again, `plan.case`
   * for a house on free ground. The plan is what the kernel lays a place from at every load; the structure in the world takes the stage
   * at once (and a client gets it with the entity). Only a loaded place: an unloaded one is brought up to date when it loads (T245f).
   */
  private syncVenturePlan(v: Venture): void {
    if (v.type !== 'construction' || !v.origin || this.host.mirror) return;
    const ch = this.host.chunks.get(v.chunk);
    if (ch?.stage !== 'planned' || !ch.plan) return;
    const stage = this.ventureStage(v);
    const changed = this.ventureIntoPlan(v, ch.plan);
    const sid = this.host.ecs.query('structure', 'origin').find((e) => this.host.ecs.get(e, 'origin').key === v.origin);
    if (sid !== undefined) {
      const st = this.host.ecs.get(sid, 'structure');
      if (stage >= 1) delete st.stage;
      else st.stage = stage;
    } else if (v.area) this.host.spawnPlannedHouse(ch, ch.plan.houses!.find((h) => h.origin === v.origin)!);
    else this.host.spawnLot(ch, v.origin, stage);
    if (changed) this.host.saveChunkSoon(ch);
  }

  /** A venture's building and stage written into the plan of its place (T245e, T245f): whether it changed. */
  ventureIntoPlan(v: Venture, plan: ChunkPlan): boolean {
    if (v.type !== 'construction' || !v.origin) return false;
    const stage = this.ventureStage(v);
    let changed = false;
    if (v.area) {
      const list = (plan.houses ??= []);
      const at = list.findIndex((h) => h.origin === v.origin);
      const classe = v.class ?? 'building';
      const model = v.model ?? this.host.forms.resolve(undefined, classe);
      const house: PlannedHouse = { origin: v.origin, x: v.spot.x, y: v.spot.y, model: model, seed: v.seed ?? this.host.forms.seedFor(model, v.origin), yaw: v.yaw ?? 0, class: classe, concept: v.concept ?? 'una casetta', stage: stage };
      if (at < 0 || list[at].stage !== stage) {
        if (at < 0) list.push(house);
        else list[at] = house;
        changed = true;
      }
    } else {
      const stadi = (plan.stages ??= {});
      if (stage >= 1 ? v.origin in stadi : stadi[v.origin] !== stage) {
        if (stage >= 1) delete stadi[v.origin];
        else stadi[v.origin] = stage;
        changed = true;
      }
      if (!Object.keys(stadi).length) delete plan.stages;
    }
    return changed;
  }

  /** What `costruisci` asks the kernel (`world.venture(id)`): the next step of the venture this individual works at, or nothing. */
  ventureStepFor(id: Id): VentureStep | undefined {
    if (!this.host.ecs.alive.has(id) || this.host.wandererOf(id) !== undefined) return undefined;
    const name = this.host.ecs.get(id, 'identity')?.name;
    const v = this.ventureWorkable(name);
    if (!v) return undefined;
    const luogo = this.placeOfPerson(id, undefined);
    return nextStep(v, name, (item) => this.canBring(id, luogo, item));
  }

  /**
   * Things brought to a venture (`world.venture_bring`): an individual of its team at the site gives what they carry (`load`); a
   * wanderer near a site gives from their bag what it still needs (the panel's button). Only what the venture still needs is taken.
   * The kernel writes the file; whoever brings only acts in the world (rule 8b). How many were taken.
   */
  ventureBring(id: Id, wanted?: string | null): number {
    const item = typeof wanted === 'string' ? wanted : undefined;
    if (!this.host.ecs.alive.has(id)) return 0;
    const wanderer = this.host.wandererOf(id);
    // A wanderer's `pos` is on the carpet: where they are in the world is what the carpet says, as for the sites.
    const p = wanderer !== undefined ? this.host.wandererAt(wanderer) : this.host.ecs.get(id, 'pos');
    if (!p) return 0;
    const name = this.host.ecs.get(id, 'identity')?.name;
    const v = wanderer !== undefined
      ? openVentures(this.ventureList).filter((o) => Math.hypot(o.spot.x - p.x, o.spot.y - p.y) <= 6).sort((a, b) => Math.hypot(a.spot.x - p.x, a.spot.y - p.y) - Math.hypot(b.spot.x - p.x, b.spot.y - p.y))[0]
      : this.ventureOfMember(name);
    if (!v || Math.hypot(v.spot.x - p.x, v.spot.y - p.y) > (wanderer !== undefined ? 6 : SITE_REACH + 1.5)) return 0;
    let total = 0;
    const before = ventureProgress(v).fase;
    for (const it of Object.keys(stillNeeded(v)).filter((x) => item === undefined || x === item)) {
      if (wanderer !== undefined) {
        const inv: Inventory | undefined = this.host.ecs.get(id, 'inventory');
        const have = inv ? countItem(inv, it) : 0;
        const { taken } = bring(v, it, have);
        if (taken && inv) removeItem(inv, it, taken);
        total += taken;
      } else {
        const c = this.host.ecs.get(id, 'load');
        const { taken } = bring(v, it, Number(c?.[it]) || 0);
        if (taken) {
          c[it] -= taken;
          if (c[it] <= 0) delete c[it];
        }
        total += taken;
      }
    }
    if (!total) return 0;
    v.last = this.host.day();
    this.touchVentures();
    this.phasesClosed(v, Array.from({ length: ventureProgress(v).fase - before }, (_, i) => before + i));
    if (wanderer !== undefined) {
      const who = this.host.wandererById(wanderer);
      const bodies = this.people.bodyOfName();
      // Who is there remembers it (section 3.5): weight 2, about this wanderer.
      for (const m of v.team) {
        const b = bodies.get(m.name);
        const q = b !== undefined ? this.host.ecs.get(b, 'pos') : undefined;
        if (q && Math.hypot(q.x - p.x, q.y - p.y) < 12) this.people.rememberAbout(m.name, `${who && who.id !== SOLO ? who.name : 'Il viandante'} ha portato del materiale per «${v.title}».`, who?.name, 2, wanderer);
      }
    }
    return total;
  }

  /**
   * The panel of the site (T245d, «Il cantiere» of `sys.work`): on every wanderer's body, the venture nearest to them, in words of the
   * world. The panel names these fields, so they travel to each client with W (T263, rule 8f); nothing else of the file leaves.
   */
  private worksitePanels(): void {
    for (const w of this.host.wanderersInWorld()) {
      const p = { x: w.x, y: w.y };
      const near = this.ventureList
        .filter((v) => v.state !== 'finished' || (v.end ?? 0) >= this.host.day() - 1)
        .map((v) => ({ v, d: Math.hypot(v.spot.x - p.x, v.spot.y - p.y) }))
        .filter((x) => x.d <= 30)
        .sort((a, b) => a.d - b.d)[0]?.v;
      // No site near: no fields, nothing travels (the panel shows nothing).
      if (!near) {
        if (this.host.ecs.has(w.id, 'worksite')) this.host.ecs.remove(w.id, 'worksite');
        continue;
      }
      const name = (it: string) => this.host.itemInfo(it).name;
      const pr = ventureProgress(near);
      const fields = {
            title: near.title,
            phase: pr.finita ? 'finita' : `${near.phases[pr.fase].name} (${pr.fase + 1} di ${near.phases.length})`,
            state: near.state === 'waiting' ? 'aspetta il materiale' : near.state === 'stopped' ? 'ferma: nessuno ci lavora' : italianName('imprese', near.state),
            missing: missingWords(near, name),
            team: near.team.map((m) => `${m.name} (${m.role})`).join(', ') || 'nessuno',
          };
      const cur = this.host.ecs.get(w.id, 'worksite');
      if (!cur || Object.entries(fields).some(([k, x]) => cur[k] !== x)) this.host.ecs.set(w.id, 'worksite', fields);
    }
  }
}
