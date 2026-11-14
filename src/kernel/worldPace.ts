// The pace of the world (T373, ADR-0188 §3, ADR-0196): a knob of the master that only goes down. `normal` is what the lobby set; `slow` plans
// fewer new places a minute (never more than the lobby's) and doubles the pauses of the Sculptor and of the Musician; `hold` keeps every new
// place a draft and stops what the world does by itself (models, pieces, plots, sessions, dialogues between individuals, new individuals):
// what is in flight finishes, the answers to the wanderers' words go on. Nothing here raises anything the lobby fixed (ADR-0133): a master
// may make the world spend less, never more. Pure: the kernel, the server and the tests read it.

export type PaceMode = 'normal' | 'slow' | 'hold';

export const PACE_MODES: readonly PaceMode[] = ['normal', 'slow', 'hold'];

export interface WorldPace {
  mode: PaceMode;
  /** Only for `slow`: new places a minute, at most the lobby's (`ai.placesPerMinute`). */
  placesPerMinute?: number;
}

/** What setting the pace answers: the pace as the world took it, or why not. */
export type PaceAnswer = { ok: true; pace: WorldPace } | { ok: false; reason: string };

/** The lobby's scale of `placesPerMinute` (`BUDGET_SCALE` in universe.ts, which a test keeps equal): here so that the server reads this file alone. */
export const PACE_PLACES_SCALE = [1, 120] as const;

export const NORMAL_PACE: WorldPace = Object.freeze({ mode: 'normal' }) as WorldPace;

/** New places a minute of a slow world when the master does not say. */
export const SLOW_PLACES = 4;
/** The least pause (world seconds) of the Sculptor and of the Musician in a slow world: at full coefficient their pause is 0, and twice 0 is 0. */
export const SLOW_LEAST_GAP = 60;

/** What the master's words say of the pace, repaired: an unknown mode is `normal`, the places a minute only for `slow`, an integer in the lobby's scale. */
export function readPace(raw: unknown): WorldPace {
  if (!raw || typeof raw !== 'object') return NORMAL_PACE;
  const r = raw as Record<string, unknown>;
  const mode = PACE_MODES.includes(r.mode as PaceMode) ? (r.mode as PaceMode) : 'normal';
  if (mode !== 'slow') return mode === 'normal' ? NORMAL_PACE : { mode };
  const [least, most] = PACE_PLACES_SCALE;
  const n = typeof r.placesPerMinute === 'number' && Number.isFinite(r.placesPerMinute) ? Math.round(r.placesPerMinute) : undefined;
  return n === undefined ? { mode } : { mode, placesPerMinute: Math.min(most, Math.max(least, n)) };
}

/** Whether two paces say the same. */
export const samePace = (a: WorldPace, b: WorldPace): boolean => a.mode === b.mode && a.placesPerMinute === b.placesPerMinute;

/**
 * New places a minute with this pace, given what the lobby set (`lobby`; `Infinity` for a game alone, where the lobby's quota does not apply):
 * never above it. `hold` is 0.
 */
export function placesPerMinute(pace: WorldPace, lobby: number): number {
  if (pace.mode === 'hold') return 0;
  if (pace.mode === 'slow') return Math.min(lobby, pace.placesPerMinute ?? SLOW_PLACES);
  return lobby;
}

/** A pause of the Sculptor or of the Musician with this pace: in a slow world twice as long, at least `SLOW_LEAST_GAP`; never shorter. */
export function paceGap(gap: number, pace: WorldPace): number {
  return pace.mode === 'slow' ? Math.max(gap * 2, SLOW_LEAST_GAP) : gap;
}

/** The pace in the words of the master's tools. */
export const PACE_NAME: Record<PaceMode, string> = { normal: 'normale', slow: 'lento', hold: 'in pausa' };

/** What a wanderer's HUD says while the world is held (D54.4): outside the world, as the notice of the credits. */
export const HELD_NOTICE = 'Il mondo è in pausa: il master lo sta scrivendo';
/** The same to the master, who held it. */
export const HELD_NOTICE_MASTER = 'Il mondo è in pausa: i luoghi nuovi restano abbozzati finché non lo riprendi';
