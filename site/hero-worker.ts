// The worker of the landing's 3D stage (T315): runs the stage's programs away from the page's thread. A large one (the pine, a quarter of
// a second on a fast machine and a second on a modest one) used to stop the page, three.js and the skins' effects with it.

import { HERO_PROGRAMS, runHero, showOf, transferOf } from './hero-programs';

self.onmessage = (ev: MessageEvent<{ id: number; program: number; seed: number }>) => {
  const { id, program, seed } = ev.data;
  try {
    const show = showOf(runHero(HERO_PROGRAMS[program % HERO_PROGRAMS.length], seed));
    (self as unknown as Worker).postMessage({ id, show }, transferOf(show));
  } catch {
    // A program that does not run: the stage keeps the one it has.
    (self as unknown as Worker).postMessage({ id });
  }
};
