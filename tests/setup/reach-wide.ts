// The reach of T488 (ADR-0244), for the tests only: the tests of the kernel see a world with every loaded place planned, as the kernel planned
// it before T488 (their worlds are the seed's places around the start). `setupFiles` in vite.config.ts loads this, nothing under src/ or server/
// does; tests/raggio.test.ts, which proves the reach, puts the game's back (`Kernel.REACH = REACH`).

import { KERNEL_REACH, REACH } from '../../src/kernel/reach';

KERNEL_REACH.current = { ...REACH, near: Infinity };
