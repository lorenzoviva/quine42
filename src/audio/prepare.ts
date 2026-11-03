// From a sound program to what the game plays, off the page (ADR-0126): pure, in Node as in a worker. The samples come only from the synthesizer (ADR-0123);
// here a piece of music keeps the one pass that loops and an effect loses the silence after it.

import { renderSoundProgram } from '../mj/synth';

export type SoundUse = 'musica' | 'effetto';

export interface SoundRequest {
  xml: string;
  seed: number;
  use: SoundUse;
}

/** What is played: a piece of music from end to end as a loop, an effect once. */
export interface PreparedSound {
  samples: Float32Array;
  sampleRate: number;
}

/**
 * The version of what the persistent cache holds: its keys say the program and the seed, not the code that turned them into samples.
 * Raise it when the synthesizer or `prepareSound` changes what comes out; `tests/sounddirector.test.ts` pins a render to this number.
 */
export const SOUND_CACHE_VERSION = 1;

/** Below this an effect's tail is silence (about -70 dB). */
const TAIL_FLOOR = 3e-4;

export const soundKey = (q: SoundRequest): string => JSON.stringify([SOUND_CACHE_VERSION, q.use, q.seed]) + q.xml;

/** Throws what the program throws. */
export function prepareSound(q: SoundRequest): PreparedSound {
  if (q.use === 'musica') {
    // Two passes: the second holds the tails of the first, and its end runs into its start without a seam.
    const r = renderSoundProgram(q.xml, q.seed, { loops: 2 });
    return { samples: r.samples.slice(r.loopStart, r.loopEnd), sampleRate: r.sampleRate };
  }
  const r = renderSoundProgram(q.xml, q.seed, { loops: 1 });
  let end = r.samples.length;
  while (end > 0 && Math.abs(r.samples[end - 1]) < TAIL_FLOOR) end--;
  return { samples: r.samples.slice(0, end), sampleRate: r.sampleRate };
}

/** A program that fails stays silent, and says why: whatever comes in, nothing is thrown (rule 7). */
export function tryPrepareSound(q: SoundRequest): { sound: PreparedSound } | { error: string } {
  try {
    const sound = prepareSound(q);
    return sound.samples.length ? { sound } : { error: 'non suona nulla' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
