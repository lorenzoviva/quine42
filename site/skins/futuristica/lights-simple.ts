// The lights of the futuristic skin without MarkovJunior (T284): the same heads, waves and fading as lights-mj.ts, written as one would
// write them by hand. It is the «animazione semplice» the program is measured against: the page paints both the same way.

import { DIM, FADE, FRONT, HEAD, NEXT, OUT, RATES, TRAIL, WAKE, restingStates, type LightsMaker } from './surface';

/** A small seeded generator (mulberry32): the same seed, the same lights. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const simpleLights: LightsMaker = (s, seed) => {
  const { X, Y, mask } = s;
  const states = restingStates(s);
  const rnd = random(seed * 31 + 7);
  const N = X * Y;
  // Where a run of letters starts: a head can start only there.
  const starts = Int32Array.from(
    [...mask.keys()].filter((i) => mask[i] && (i % X === 0 || !mask[i - 1])),
  );
  const letters = mask.reduce((n, m) => n + m, 0);
  const near = [-1, 1, -X, X];
  return {
    states,
    step() {
      // Fading: each place looks only at itself, so nothing fades twice.
      for (let i = 0; i < N; i++) {
        const v = states[i];
        if (v === TRAIL) {
          if (rnd() < RATES.trail) states[i] = FADE;
        } else if (v === FADE) {
          if (rnd() < RATES.fade) states[i] = DIM;
        } else if (v === WAKE) {
          if (rnd() < RATES.wake) states[i] = FADE;
        }
      }
      // The heads move one place right: from the right, so a head never moves twice.
      for (let y = 0; y < Y; y++) {
        for (let x = X - 1; x >= 0; x--) {
          const i = x + y * X;
          if (states[i] !== HEAD) continue;
          const next = x + 1 < X ? states[i + 1] : OUT;
          if (next === DIM || next === FADE || next === WAKE) {
            states[i + 1] = HEAD;
            states[i] = TRAIL;
          } else if (next === OUT) states[i] = TRAIL;
        }
      }
      // The wave: the front lights the places at rest beside it, becomes the wake, and the new ring is the front.
      for (let i = 0; i < N; i++) {
        if (states[i] !== FRONT) continue;
        const x = i % X;
        for (const d of near) {
          const j = i + d;
          if (j < 0 || j >= N || (d === -1 && x === 0) || (d === 1 && x === X - 1)) continue;
          if (states[j] === DIM) states[j] = NEXT;
        }
      }
      for (let i = 0; i < N; i++) {
        if (states[i] === FRONT) states[i] = WAKE;
        else if (states[i] === NEXT) states[i] = FRONT;
      }
      // New heads at the start of a run of letters.
      for (const i of starts) if (states[i] === DIM && rnd() < RATES.head) states[i] = HEAD;
      // And now and then a wave, from a letter at rest picked at random: one draw a tick, not one per letter.
      if (rnd() < 1 - Math.pow(1 - RATES.wave, letters)) {
        const i = Math.floor(rnd() * N);
        for (let k = 0; k < N; k++) {
          const j = (i + k) % N;
          if (states[j] === DIM) {
            states[j] = FRONT;
            break;
          }
        }
      }
    },
  };
};
