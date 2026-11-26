// The random generator of a run and the switch of the semantics (T526, A1-1, ADR-0262; docs/design/markov-allineamento.md § 2, § 7).
// - `ours`: the engine as it has always been, mulberry32 (`Rng` of src/kernel/rng.ts): every grid of today, voxel for voxel (ADR-0142).
// - `mj`: the semantics of MarkovJunior of mxgmn, which the chain A1-1…A1-8 aligns node by node; for now System.Random of .NET with the
//   run's seed (`new Random(seed)` in Interpreter.Run) and every generator of its own seeded by one `Next()` of the run's, as the original
//   does (`new Random(ip.random.Next())` in WFCNode, PathNode and Search). Off for every program of today: only a compiler told so
//   (`compileMjx(…, { semantics: 'mj' })`) or a run told so (`RunOptions.semantics`) turns it on.

import { Rng } from '../kernel/rng';

/** Which semantics a run follows: ours (the default, every program of today) or MarkovJunior's (the chain A1, behind the switch). */
export type Semantics = 'ours' | 'mj';

/** What the engine draws from: the three draws of System.Random, and generators of the same kind. */
export interface RunRandom {
  /** A double in [0, 1) (`NextDouble()`). */
  next(): number;
  /** An integer in [0, n) (`Next(n)`). */
  int(n: number): number;
  /** A draw that seeds a generator of its own (`Next()`: an integer in [0, 2³¹ − 1)). */
  seed(): number;
  /** A generator of the same kind from a seed. */
  spawn(seed: number): RunRandom;
}

const MBIG = 2147483647;
const MSEED = 161803398;

/**
 * System.Random of .NET with a seed: with a seed .NET still uses the algorithm of .NET Framework, kept for compatibility
 * (Net5CompatSeedImpl, CompatPrng): Knuth's subtractive generator, 55 numbers. The same numbers as .NET, bit for bit (checked by
 * tests/mj-random.test.ts and tests/mj-conformita.test.ts against what lab/banco/conformita/caso/Program.cs printed). The seed is an
 * `int` of C#: a seed past 2³¹ − 1 (our seeds are often unsigned) is the same 32 bits read as signed.
 */
export class SystemRandom implements RunRandom {
  private seedArray = new Int32Array(56);
  private inext = 0;
  private inextp = 21;

  constructor(seed: number) {
    const s = this.seedArray;
    const signed = seed | 0;
    const subtraction = signed === -2147483648 ? MBIG : Math.abs(signed);
    let mj = MSEED - subtraction;
    s[55] = mj;
    let mk = 1;
    let ii = 0;
    for (let i = 1; i < 55; i++) {
      if ((ii += 21) >= 55) ii -= 55;
      s[ii] = mk;
      mk = mj - mk;
      if (mk < 0) mk += MBIG;
      mj = s[ii];
    }
    for (let k = 1; k < 5; k++)
      for (let i = 1; i < 56; i++) {
        let n = i + 30;
        if (n >= 55) n -= 55;
        s[i] = (s[i] - s[1 + n]) | 0;
        if (s[i] < 0) s[i] += MBIG;
      }
  }

  /** InternalSample: an integer in [0, int.MaxValue). */
  private internalSample(): number {
    let locINext = this.inext;
    if (++locINext >= 56) locINext = 1;
    let locINextp = this.inextp;
    if (++locINextp >= 56) locINextp = 1;
    const s = this.seedArray;
    let retVal = (s[locINext] - s[locINextp]) | 0;
    if (retVal === MBIG) retVal--;
    if (retVal < 0) retVal += MBIG;
    s[locINext] = retVal;
    this.inext = locINext;
    this.inextp = locINextp;
    return retVal;
  }

  /** Next(): an integer in [0, int.MaxValue). */
  nextInt(): number {
    return this.internalSample();
  }

  /** Next(maxValue): an integer in [0, maxValue), as `(int)(Sample() * maxValue)`. */
  int(maxValue: number): number {
    return Math.trunc(this.internalSample() * (1.0 / MBIG) * maxValue);
  }

  /** NextDouble(): Sample(), the integer times 1/int.MaxValue. */
  next(): number {
    return this.internalSample() * (1.0 / MBIG);
  }

  seed(): number {
    return this.internalSample();
  }

  spawn(seed: number): SystemRandom {
    return new SystemRandom(seed);
  }
}

/** The generator a run of this semantics starts from its seed. */
export function randomFor(semantics: Semantics | undefined, seed: number): RunRandom {
  return semantics === 'mj' ? new SystemRandom(seed) : new Rng(seed);
}

/** The semantics a run follows: what the run is told, else what the program was compiled for, else ours. */
export function semanticsOf(program: { semantics?: Semantics } | undefined, opts: { semantics?: Semantics } = {}): Semantics {
  return opts.semantics ?? program?.semantics ?? 'ours';
}
