// The people of the world as one object (T327, ADR-0166): the facade of `npc/`. Every individual's behaviour — who they are, their day
// and their trade, the ventures, the places nobody sees, the walk, what they say, the plots — lives behind this class, which owns all
// its state; the kernel makes one with the port (`NpcHost`), gives it the beat (`tick`) and the moments of the places (a place laid
// again, left, a building fallen), and asks it what the Host gives Lua (`world.path`, `find_tile`, `act`, `venture`, `venture_bring`)
// and what the wanderer does with the people (talk, quests). The other face, `npc/model.ts`, is the data: who only reads comes from there.
//
// Inside, one way only: the facade → talk → stories → people, places, speech; worksites → people, trades; away → worksites, trades;
// trades → places; and all of them → the data (society, plots, jobs, ventures, route) and the port. Nothing of `npc/` imports the
// kernel, the wanderers, the session, the renderer, the UI or the server (tests/npc-architecture.test.ts).

import type { Id } from '../ecs';
import type { Identity } from '../agents/content';
import type { ChunkPlan } from '../agents/cartography';
import type { NpcReply } from '../agents/minds';
import type { FormComp } from '../forms';
import type { FileMap } from '../types';
import { Away } from './away';
import type { NpcHost, NpcPlace, NpcWanderer } from './host';
import { matchJob, WORKERS_PER_PLACE, type JobProgram, type JobTask } from './jobs';
import type { Mind } from './model';
import { People } from './people';
import { Places } from './places';
import type { Plot } from './plots';
import { inferActivity, type Activity, type DayPhase, type DeclaredPlace, type Individual, type Species } from './society';
import { Speech } from './speech';
import { Stories } from './stories';
import { Talk } from './talk';
import { Trades } from './trades';
import type { Venture, VentureStep } from './ventures';
import { Worksites } from './worksites';

export type { NpcHost, NpcPlace, NpcWanderer } from './host';
export { AWAY_DEPOSIT_CAP, AWAY_WORK } from './away';

export class Npc {
  private readonly people: People;
  private readonly places: Places;
  private readonly trades: Trades;
  private readonly worksites: Worksites;
  private readonly away: Away;
  private readonly speech: Speech;
  private readonly stories: Stories;
  private readonly talks: Talk;

  constructor(private readonly host: NpcHost) {
    this.people = new People(host);
    this.places = new Places(host);
    this.trades = new Trades(host, this.places);
    this.worksites = new Worksites(host, this.people, this.trades);
    this.away = new Away(host, this.worksites, this.trades);
    this.speech = new Speech(host);
    this.stories = new Stories(host, this.people, this.places, this.speech);
    this.talks = new Talk(host, this.people, this.stories, this.speech);
  }

  // --- The moments of the world the kernel tells ------------------------------------------------

  /** The files were read again from scratch (a universe opened, a rollback): the ventures are what `world/ventures.json` says. */
  reset(files: FileMap): void {
    this.worksites.reset(files);
  }

  /** `world/ventures.json` to save when something moved since the last save (undefined: nothing). */
  venturesToSave(): string | undefined {
    return this.worksites.takeChanged();
  }

  /** A place is laid again (before Lua sees it): what ripened ripens, the buildings are at their ventures' stage. How long it was away. */
  returnToPlace(ch: NpcPlace, plan: ChunkPlan): number | undefined {
    return this.away.returnToPlace(ch, plan);
  }

  /** A place nobody saw is seen again, after `away` seconds: `on_return` for the modules that want it. */
  onReturn(key: string, away: number): void {
    this.away.onReturn(key, away);
  }

  /** The ground under the ways changed (a place laid or left, a tile changed): the ways are found again. */
  forgetWays(): void {
    this.places.forgetWays();
  }

  /** A building fell (T245d): its lot becomes a venture of its place. */
  buildingFell(origin: string, ruin: { concept?: string; class?: string; size?: string }, form: FormComp | undefined, p: { x: number; y: number }): void {
    this.worksites.ventureOfRuin(origin, ruin, form, p);
  }

  // --- What the Host gives Lua -------------------------------------------------------------------

  /** `world.path`: the next point of the way. */
  routeStep(x: number, y: number, tx: number, ty: number, r?: number): { x: number; y: number } | undefined {
    return this.places.routeStep(x, y, tx, ty, r);
  }

  /** `world.find_tile`: the nearest tile of a terrain. */
  findTile(word: string, x: number, y: number, r: number): { x: number; y: number } | undefined {
    return this.places.findTile(word, x, y, r);
  }

  /** `world.act`: an individual uses a thing. */
  actAs(user: Id, target: Id, action?: string): string | undefined {
    return this.trades.actAs(user, target, action);
  }

  /** `world.venture`: the next step of the venture this individual works at. */
  ventureStep(id: Id): VentureStep | undefined {
    return this.worksites.ventureStepFor(id);
  }

  /** `world.venture_bring`: things brought to a venture (an individual of its team, or a wanderer at the site). How many were taken. */
  ventureBring(id: Id, item?: string | null): number {
    return this.worksites.ventureBring(id, item);
  }

  // --- The people, for the kernel, the wanderer and the Council --------------------------------

  ensureIdentity(id: Id): Promise<Identity | undefined> {
    return this.people.ensureIdentity(id);
  }

  ensureSheet(name: string, chi?: string): Promise<string | undefined> {
    return this.people.ensureSheet(name, chi);
  }

  routineNow(identity: Identity | undefined): { when: DayPhase; does: string; where: string } | undefined {
    return this.people.routineNow(identity);
  }

  speciesOf(type: string): Species | undefined {
    return this.people.speciesOf(type);
  }

  reviewSociety(): string[] {
    return this.people.reviewSociety();
  }

  reviewPlots(): string[] {
    return this.people.reviewPlots();
  }

  individualOf(name: string): Individual | undefined {
    return this.people.individualOf(name);
  }

  /** An individual the master declares (T376): the Narrator writes them with the facts given; awaited where they are. */
  declare(d: { facts: string; name?: string; kind: string; place: DeclaredPlace; chi?: string }): Promise<{ ok: true; individual: Individual } | { ok: false; reason: string }> {
    return this.people.declare(d);
  }

  /** A declared individual taken in by a place (T376): the origin of their character in its plan. */
  placeDeclared(name: string, origin: string, place: string): void {
    this.people.placeDeclared(name, origin, place);
  }

  entityOf(name: string): Id | undefined {
    return this.people.entityOf(name);
  }

  rememberAbout(name: string, text: string, withWhom?: string, weight = 1, wanderer?: string): void {
    this.people.rememberAbout(name, text, withWhom, weight, wanderer);
  }

  rememberWanderer(name: string, text: string, weight: number): void {
    this.people.rememberWanderer(name, text, weight);
  }

  wandererWord(w: NpcWanderer): string {
    return this.people.wandererWord(w);
  }

  setBond(name: string, bond: string, kind?: string): void {
    this.people.setBond(name, bond, kind);
  }

  bondOf(name: string): string | undefined {
    return this.people.bondOf(name);
  }

  birth(parentId: Id, name?: string): Promise<Id | undefined> {
    return this.people.birth(parentId, name);
  }

  talk(id: Id, text: string, wanderer?: string): Promise<NpcReply> {
    return this.talks.talk(id, text, wanderer);
  }

  weaveStory(force = false): Promise<Plot | undefined> {
    return this.stories.weaveStory(force);
  }

  quests(): Array<{ titolo: string; da: string; testo: string; obiettivo: string }> {
    return this.stories.quests();
  }

  jobPrograms(): JobProgram[] {
    return this.trades.jobPrograms();
  }

  placeDeposit(chunkKey: string): Record<string, number> {
    return this.trades.placeDeposit(chunkKey);
  }

  ventures(): Venture[] {
    return this.worksites.ventures();
  }

  // --- The beat ---------------------------------------------------------------------------------

  private lastPhase = new Map<Id, string>();

  /**
   * Society, once a second (the lines due, at every tick): people met nearby get an identity; everyone follows their routine — goes
   * where it happens and does it visibly; people who meet talk (by their relation); plots unfold.
   */
  tick(): void {
    this.speech.flush();
    if (this.host.ticks % 60 !== 0) return;
    const pc = this.host.wandererCarpet();
    const people = this.host.ecs.query('mind', 'pos');
    let started = 0;
    this.trades.matureTick();
    this.worksites.ventureTick();
    this.away.awayTick();
    const workers = new Map<string, number>();
    for (const id of this.host.ecs.query('job', 'chunk')) {
      const k = this.host.ecs.get(id, 'chunk')?.key;
      if (k) workers.set(k, (workers.get(k) ?? 0) + 1);
    }
    for (const id of people) {
      const p = this.host.ecs.get(id, 'pos');
      const identity: Identity | undefined = this.host.ecs.get(id, 'identity');
      if (!identity) {
        if (!this.host.generationHeld && started < 2 && this.people.pending < 2 && Math.hypot(p.x - pc.x, p.y - pc.y) < 9) {
          started++;
          void this.people.ensureIdentity(id);
        }
        continue;
      }
      const mind: Mind = this.host.ecs.get(id, 'mind');
      // A trade with a program (T245b): sys.work carries out its day; the kernel says which phase it is and where home is.
      if (this.workTick(id, identity, mind, workers)) continue;
      const now = this.people.routineNow(identity);
      if (!now) continue;
      const activity: Activity = (now as { activity?: Activity }).activity ?? inferActivity(now.does, now.where);
      const phaseKey = `${now.when}`;
      if (this.lastPhase.get(id) !== phaseKey) {
        this.lastPhase.set(id, phaseKey);
        this.host.ecs.set(id, 'activity', { kind: activity, still: false });
        if (mind.mode === 'wander') this.host.ecs.set(id, 'goal', this.places.placeFor(id, identity, now.where, activity) ?? { none: true });
        if (Math.hypot(p.x - pc.x, p.y - pc.y) < 10) this.host.speak(id, `(${now.does})`);
      }
      // Arrived: they do it, there, visibly (lying in bed, hoeing the field, fishing on the bank).
      const meta = this.host.ecs.get(id, 'goal');
      const att = this.host.ecs.get(id, 'activity');
      if (att && mind.mode === 'wander') {
        const arrived = !meta?.x || Math.hypot(meta.x - p.x, meta.y - p.y) < 1.3;
        att.still = arrived && activity !== 'stroll' && activity !== 'patrol';
        att.kind = activity;
      } else if (att) att.still = false;
    }
    this.talks.meetings(people, pc);
    this.stories.plotTick();
    this.stories.questTick();
  }

  /**
   * An individual with a trade that has a program (T245b): at each phase of the day the kernel gives them its tasks (`mestiere`), the
   * places they need (home, the square, the work) and nothing else; `sys.work` does the rest. At most `WORKERS_PER_PLACE` per place:
   * the others live as before. False when they are not at work (no program, following someone, the place full).
   */
  private workTick(id: Id, identity: Identity, mind: Mind, workers: Map<string, number>): boolean {
    const had = this.host.ecs.get(id, 'job');
    const program = mind.mode === 'wander' ? matchJob(identity.job, this.trades.jobPrograms()) : undefined;
    const place: string | undefined = this.host.ecs.get(id, 'chunk')?.key;
    if (!program || (!had && place && (workers.get(place) ?? 0) >= WORKERS_PER_PLACE)) {
      if (had) {
        this.host.ecs.remove(id, 'job');
        this.host.ecs.remove(id, 'work');
      }
      return false;
    }
    const fase = this.host.phase();
    // In a team (T245d): the venture takes the place of the work of the day, as long as there is something to do there.
    const venture = fase === 'day' ? this.worksites.ventureWorkable(identity.name) : undefined;
    if (had?.id === program.id && had.phase === fase && had.venture === venture?.id) return true;
    if (!had && place) workers.set(place, (workers.get(place) ?? 0) + 1);
    const first = program.day.morning.concat(program.day.day).find((t) => t.pose)?.pose;
    const home = this.places.placeFor(id, identity, 'home', 'sleep') ?? this.places.placeFor(id, identity, 'home');
    const square = this.places.placeFor(id, identity, 'square');
    const anchor = home ?? this.host.ecs.get(id, 'pos');
    // The work: the nearest tile of its kind, or the nearest thing with its tag (the bench of the smith), or the place the routine would give.
    const bench = program.workplace?.entity && anchor ? this.host.nearest(anchor.x, anchor.y, 18, program.workplace.entity) : undefined;
    const benchAt = bench !== undefined ? this.host.ecs.get(bench, 'pos') : undefined;
    const work = (program.workplace?.tile && anchor ? this.places.findTile(program.workplace.tile, anchor.x, anchor.y, 18) : undefined) ?? (benchAt ? { x: benchAt.x, y: benchAt.y } : undefined) ?? this.places.placeFor(id, identity, 'work', first);
    const p = this.host.ecs.get(id, 'pos');
    // The place they belong to: its deposit is where what they make goes (T245c).
    const luogo = place ?? (p ? this.host.chunkAt(p.x, p.y)?.key : undefined);
    this.host.ecs.set(id, 'job', {
      id: program.id,
      phase: fase,
      day: this.host.day(),
      ...(luogo ? { chunk: luogo } : {}),
      tasks: venture ? [{ does: 'build' } as JobTask, ...structuredClone(program.day[fase])] : structuredClone(program.day[fase]),
      ...(venture ? { venture: venture.id, venture_spot: { x: venture.spot.x, y: venture.spot.y } } : {}),
      // The places by the values of `dove` (T307b): sys.work reads `m[dove]`.
      ...(home ? { home } : {}),
      ...(square ? { square } : {}),
      ...(work ? { work } : {}),
    });
    this.host.ecs.remove(id, 'goal');
    return true;
  }
}
