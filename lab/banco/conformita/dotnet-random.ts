// System.Random of .NET with a seed (T500, docs/design/markov-allineamento.md § 2): the generator MarkovJunior of mxgmn draws from
// (`new Random(seed)` in Interpreter.Run, `new Random(ip.random.Next())` in PathNode, WFCNode and Search). With a seed .NET still uses the
// algorithm of .NET Framework, kept for compatibility (Net5CompatSeedImpl, CompatPrng): Knuth's subtractive generator, 55 numbers. The
// same numbers as .NET, checked by tests/mj-conformita.test.ts against what lab/banco/conformita/caso/Program.cs printed.

const MBIG = 2147483647;
const MSEED = 161803398;

export class DotnetRandom {
  private seedArray = new Int32Array(56);
  private inext = 0;
  private inextp = 21;

  constructor(seed: number) {
    const s = this.seedArray;
    const subtraction = seed === -2147483648 ? MBIG : Math.abs(seed | 0);
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

  /** Sample: a double in [0, 1). */
  private sample(): number {
    return this.internalSample() * (1.0 / MBIG);
  }

  /** Next(): an integer in [0, int.MaxValue). */
  next(): number {
    return this.internalSample();
  }

  /** Next(maxValue): an integer in [0, maxValue), as `(int)(Sample() * maxValue)`. */
  nextMax(maxValue: number): number {
    return Math.trunc(this.sample() * maxValue);
  }

  /** NextDouble(). */
  nextDouble(): number {
    return this.sample();
  }
}
