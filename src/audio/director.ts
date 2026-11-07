// The sound director (T224, ADR-0126): what plays, from what the client already knows of the world. The choice is a pure function; the rest is timing of the page's own,
// which touches no simulation: the sound is of the client and asks the server nothing.

import { hash32, hashStr } from '../kernel/rng';
import type { DayPhase } from '../kernel/npc/model';
import { namesEnvironment, soundPrograms, type SoundProgram } from '../mj/sound';
import type { SoundRequest } from './prepare';
import type { SoundRenders } from './renders';
import type { SoundOut } from './sfx';

/** All that the choice looks at. */
export interface SoundState {
  /** `kernel.coronaRevealed()`: never anything else, because the music must not tell a wanderer in the circle what is outside it (rule 8). */
  beyond: boolean;
  /** The environment of the place here, if it is known yet. */
  environment?: string;
  phase: DayPhase;
  /** The universe's seed: another universe, other instances of the same programs. */
  seed: number;
}

export interface MusicChoice {
  id: string;
  xml: string;
  seed: number;
}

/** How a universe's program says what it is for, in `models/index.json → suono`. */
const eligible = (p: SoundProgram, s: SoundState) => p.sound?.use === 'music' && !!p.sound.beyond === s.beyond && (!p.sound.moments || s.beyond || p.sound.moments.includes(s.phase));

/**
 * The piece for a state, or nothing if the universe has none. The program is one per type: the one that names this environment, then one that names no environment
 * (a moment of the day), then any of those left, by the environment's name. Who names the environment exactly beats who names part of its id, and of those the last in the
 * index plays: what the Musician wrote for a place comes after what was there (T225). The instance is the seed (rule 11): same state, same music, for everyone in that place.
 */
export function chooseMusic(state: SoundState, programs: readonly SoundProgram[], variant = 0): MusicChoice | undefined {
  const open = programs.filter((p) => eligible(p, state));
  if (!open.length) return undefined;
  const where = state.beyond ? '' : (state.environment ?? '');
  const when = state.beyond ? '' : state.phase;
  const named = open.filter((p) => namesEnvironment(p, where));
  const exact = named.filter((p) => p.sound?.environments?.includes(where));
  const general = open.filter((p) => !p.sound?.environments?.length);
  const pool = exact.length ? exact.slice(-1) : named.length ? named : general.length ? general : open;
  const pick = pool[hashStr(where) % pool.length];
  return { id: pick.id, xml: pick.xml, seed: hash32(state.seed | 0, hashStr(where), hashStr(when), variant) };
}

/** The moments of the game that have a sound: each says what the index calls the effect and the instances it goes through. */
export const SOUND_CUES = {
  'rune:picked': { effect: 'rune', seeds: [1, 2, 3] },
  'item:picked': { effect: 'item', seeds: [1, 2] },
  'item:placed': { effect: 'item', seeds: [2] },
  'item:used': { effect: 'item', seeds: [3] },
  'item:action': { effect: 'item', seeds: [4] },
  'ui:container': { effect: 'item', seeds: [5] },
  'item:crafted': { effect: 'arpeggio', seeds: [1] },
  'rune:inscribed': { effect: 'arpeggio', seeds: [2] },
  'forge:done': { effect: 'arpeggio', seeds: [3] },
  start: { effect: 'arpeggio', seeds: [4] },
  'spell:cast': { effect: 'spell', seeds: [1, 2] },
  fault: { effect: 'fault', seeds: [1, 2, 3] },
  rollback: { effect: 'rollback', seeds: [1] },
  beyond: { effect: 'threshold', seeds: [1] },
  jump: { effect: 'jump', seeds: [1, 2] },
  death: { effect: 'death', seeds: [1] },
} as const satisfies Record<string, { effect: string; seeds: readonly number[] }>;

export type SoundCue = keyof typeof SOUND_CUES;

/** The program of an effect, or nothing. */
export function effectProgram(effect: string, programs: readonly SoundProgram[]): SoundProgram | undefined {
  return programs.find((p) => p.sound?.use === 'effect' && p.sound.effects?.includes(effect));
}

/** A change of place must last this long before the music follows: walking along a border does not make it flicker. */
const SETTLE_MS = 4000;
const CHANGE_FADE = 3;
const FIRST_FADE = 2;
const FAIL_FADE = 1;
/** A piece goes on this long and then becomes another instance of itself, without stopping. */
const VARIATION_MS = 75_000;
const VARIATION_FADE = 4;
/** Then back to the first: so few that the cache holds them. */
const VARIANTS = 4;
/** An effect that arrives later than this is out of place: better nothing. */
const EFFECT_PATIENCE_MS = 250;

/** Index → programs, kept until the text changes. */
export function readPrograms(files: Record<string, string>): SoundProgram[] {
  return soundPrograms(files).filter((p) => p.sound);
}

export class SoundDirector {
  private programs: SoundProgram[] = [];
  private unlocked = false;
  private state?: SoundState;
  /** The piece heard, or on its way. */
  private current?: { key: string; state: SoundState; variant: number; since: number; silent: boolean };
  private candidate?: { key: string; since: number };
  private turn = 0;
  private played = new Map<SoundCue, number>();
  /** What the last `update` read: the id and seed of the piece, for whoever measures. */
  now?: { id: string; seed: number; variant: number };
  /**
   * A program that stays silent, and why (T296): it failed in the worker, did not finish in time, or plays nothing. The game tells the kernel,
   * which isolates a card that does it and shows it to the master; here it is silence as ever (ADR-0126).
   */
  onFail?: (id: string, reason: string) => void;

  constructor(
    private out: SoundOut,
    private renders: Pick<SoundRenders, 'get'> & Partial<Pick<SoundRenders, 'reasonFor'>>,
    private clock: () => number = () => performance.now(),
  ) {}

  /** Who is told of a program that stays silent: never a throw back into the game (rule 7). */
  private failed(id: string, req: SoundRequest): void {
    try {
      this.onFail?.(id, this.renders.reasonFor?.(req) ?? 'non suona nulla');
    } catch {
      /* silence, and the game goes on */
    }
  }

  /** Programs may come and go (a reload, a master's edit): the piece follows at the next update. */
  setPrograms(programs: SoundProgram[]): void {
    this.programs = programs;
    if (this.unlocked) this.prepareEffects();
  }

  /** The first gesture: audio opens, and the effects get ready while nobody is waiting for them. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    this.prepareEffects();
    if (this.state) this.update(this.state);
  }

  private prepareEffects(): void {
    for (const cue of Object.values(SOUND_CUES)) {
      const program = effectProgram(cue.effect, this.programs);
      if (!program) continue;
      for (const seed of cue.seeds) {
        const req: SoundRequest = { xml: program.xml, seed, use: 'effect' };
        void this.renders.get(req).then((sound) => sound || this.failed(program.id, req));
      }
    }
  }

  /** Call it now and then with what the world is: it never throws, whatever the programs say. */
  update(state: SoundState): void {
    this.state = state;
    if (!this.unlocked) return;
    const t = this.clock();
    const choice = chooseMusic(state, this.programs);
    const key = choice ? `${choice.id}|${choice.seed}|${choice.xml.length}` : '';
    const cur = this.current;
    if (key !== (cur?.key ?? '')) {
      if (this.candidate?.key !== key) this.candidate = { key, since: t };
      // Over the edge and back, the music follows at once: the world has changed, not the place.
      const crossing = !!cur && cur.state.beyond !== state.beyond;
      if (!cur || crossing || t - this.candidate.since >= SETTLE_MS) this.start(key, state, 0, cur ? CHANGE_FADE : FIRST_FADE);
      return;
    }
    this.candidate = undefined;
    if (cur && !cur.silent && t - cur.since >= VARIATION_MS) this.start(key, cur.state, (cur.variant + 1) % VARIANTS, VARIATION_FADE);
  }

  private start(key: string, state: SoundState, variant: number, fade: number): void {
    const turn = ++this.turn;
    this.candidate = undefined;
    const choice = chooseMusic(state, this.programs, variant);
    this.current = { key, state, variant, since: this.clock(), silent: !choice };
    this.now = choice && { id: choice.id, seed: choice.seed, variant };
    if (!choice) return this.out.stopMusic(FAIL_FADE);
    const req: SoundRequest = { xml: choice.xml, seed: choice.seed, use: 'music' };
    void this.renders.get(req).then((sound) => {
      if (!sound) this.failed(choice.id, req);
      if (turn !== this.turn) return;
      if (sound) return this.out.playMusic(sound, fade);
      // It fails: silence, and no more tries until the place or the program changes (rule 7).
      if (this.current) this.current.silent = true;
      this.out.stopMusic(FAIL_FADE);
    });
  }

  /** A moment of the game. Quiet if its program is missing, broken or not ready in time. */
  cue(name: SoundCue): void {
    if (!this.unlocked) return;
    const { effect, seeds } = SOUND_CUES[name];
    const program = effectProgram(effect, this.programs);
    if (!program) return;
    const n = this.played.get(name) ?? 0;
    this.played.set(name, n + 1);
    const asked = this.clock();
    const req: SoundRequest = { xml: program.xml, seed: seeds[n % seeds.length], use: 'effect' };
    void this.renders.get(req).then((sound) => {
      if (!sound) return this.failed(program.id, req);
      if (this.clock() - asked <= EFFECT_PATIENCE_MS) this.out.playEffect(sound);
    });
  }
}
