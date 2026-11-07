// The sound in the game (T224, ADR-0126): the choice is pure, a broken program stays silent, the seed's programs are all there and all sound.

import { describe, expect, it, vi } from 'vitest';
import { chooseMusic, effectProgram, readPrograms, SOUND_CUES, SoundDirector, type SoundCue, type SoundState } from '../src/audio/director';
import { prepareSound, SOUND_CACHE_VERSION, soundKey, tryPrepareSound, type PreparedSound, type SoundRequest } from '../src/audio/prepare';
import { SOUND_MEMORY_BYTES, SoundRenders, type SoundWorker } from '../src/audio/renders';
import { readSoundPrefs, type SoundOut } from '../src/audio/sfx';
import { bundledFiles } from '../src/kernel/bundle';
import { hashStr } from '../src/kernel/rng';
import { DAY_PHASES } from '../src/kernel/npc/society';
import { modelErrors } from '../src/kernel/validator';
import { compileMjx } from '../src/mj/model';
import { soundPrograms, type SoundProgram } from '../src/mj/sound';
import { expectedModelErrors } from './helpers';

const programs = readPrograms(bundledFiles);
const music = programs.filter((p) => p.sound?.use === 'music');
const state = (s: Partial<SoundState> = {}): SoundState => ({ beyond: false, environment: 'village', phase: 'day', seed: 42, ...s });
const environments = Object.keys(JSON.parse(bundledFiles['modules/world.layouts/manifest.json']).layouts as object);

describe('the choice of the music', () => {
  it('is pure: the same state gives the same piece, and the order of questions does not matter', () => {
    const a = chooseMusic(state(), programs);
    chooseMusic(state({ environment: 'woods' }), programs);
    expect(chooseMusic(state(), programs)).toEqual(a);
    expect(a?.id).toBe('sound-music-pastoral');
  });

  it('follows the environment and the moment of the day', () => {
    const id = (s: Partial<SoundState>) => chooseMusic(state(s), programs)?.id;
    expect(id({ environment: 'woods' })).toBe('sound-music-woods');
    expect(id({ environment: 'castle' })).toBe('sound-music-stone');
    expect(id({ environment: 'dungeon', phase: 'night' })).toBe('sound-music-deep');
    expect(id({ environment: 'village', phase: 'evening' })).toBe('sound-music-sunset');
    expect(id({ environment: 'village', phase: 'night' })).toBe('sound-music-night');
  });

  it('an environment of the Cartographer goes by what its name contains; an unknown one and a place not known yet still have music', () => {
    expect(chooseMusic(state({ environment: 'castello_nero' }), programs)?.id).toBe('sound-music-stone');
    for (const phase of DAY_PHASES) {
      expect(chooseMusic(state({ environment: 'qualcosa di mai visto', phase }), programs)).toBeDefined();
      expect(chooseMusic(state({ environment: undefined, phase }), programs)).toBeDefined();
    }
  });

  it('every environment of the seed has music at every moment', () => {
    for (const environment of environments) for (const phase of DAY_PHASES) expect(chooseMusic(state({ environment, phase }), programs), `${environment} ${phase}`).toBeDefined();
  });

  it('the instance is a seed: another place, moment, universe or variant is another seed of the same program', () => {
    const base = chooseMusic(state(), programs)!;
    expect(chooseMusic(state({ environment: 'campi' }), programs)).toMatchObject({ id: base.id });
    for (const other of [chooseMusic(state({ environment: 'campi' }), programs), chooseMusic(state({ phase: 'morning' }), programs), chooseMusic(state({ seed: 43 }), programs), chooseMusic(state(), programs, 1)]) expect(other?.seed).not.toBe(base.seed);
  });

  it('within the circle nothing plays what is beyond it, and beyond it only that, at any hour (rule 8)', () => {
    for (const environment of [...environments, undefined])
      for (const phase of DAY_PHASES) {
        expect(chooseMusic(state({ environment, phase }), programs)?.id).not.toBe('sound-music-beyond');
        expect(chooseMusic(state({ environment, phase, beyond: true }), programs)?.id).toBe('sound-music-beyond');
      }
    // The place and the hour under the feet do not leak into the music out there.
    expect(chooseMusic(state({ beyond: true, environment: 'bosco', phase: 'night' }), programs)).toEqual(chooseMusic(state({ beyond: true }), programs));
  });

  it('a universe without sound programs has no music, and a bad index is no index', () => {
    expect(chooseMusic(state(), [])).toBeUndefined();
    expect(readPrograms({ 'models/index.json': '{nope' })).toEqual([]);
    const odd = { 'models/index.json': JSON.stringify({ a: { classe: 'suono', suono: 'musica' }, b: { classe: 'suono', suono: { uso: 'music', ambienti: 3, momenti: [1, 'notte'] } } }), 'models/a.xml': '', 'models/b.xml': '' };
    expect(readPrograms(odd).map((p) => [p.id, p.sound])).toEqual([['b', { use: 'music', moments: ['night'] }]]);
  });
});

describe('the programs of the seed', () => {
  it('are few, one for a type, and the presets of the SoundLab stay for the SoundLab', () => {
    // The seven of T224 and the six of the fantasy theme of Claude Cloud (T273): each its own type, in environments of their own.
    expect(music).toHaveLength(13);
    expect(soundPrograms(bundledFiles).filter((p) => !p.sound)).toHaveLength(4);
  });

  it('every moment of the game has its program', () => {
    for (const cue of Object.keys(SOUND_CUES) as SoundCue[]) expect(effectProgram(SOUND_CUES[cue].effect, programs), cue).toBeDefined();
  });

  it.each(programs.map((p) => [p.id, p] as const))('%s: valid, every track sounds in every instance, without silence or clipping', (_id, p: SoundProgram) => {
    expect(compileMjx(p.xml, { strict: true }).warnings).toEqual([]);
    const errors = modelErrors(`models/${p.id}.xml`, p.xml);
    const expected = expectedModelErrors(p.id);
    expect(errors).toHaveLength(expected.length);
    expected.forEach((e, i) => expect(errors[i]).toMatch(e));
    const use = p.sound!.use;
    const seeds = use === 'music' ? [1, 987654321] : [1, 2, 3, 4, 5];
    for (const seed of seeds) {
      const s = prepareSound({ xml: p.xml, seed, use });
      let peak = 0;
      let sum = 0;
      for (const x of s.samples) {
        peak = Math.max(peak, Math.abs(x));
        sum += x * x;
      }
      // A NaN anywhere makes the sum NaN, and the comparison below fails.
      expect(peak, `seed ${seed}`).toBeGreaterThan(0.05);
      expect(peak).toBeLessThanOrEqual(1);
      expect(Math.sqrt(sum / s.samples.length)).toBeGreaterThan(0.01);
    }
  }, 60_000);

  it('a piece of music is one whole loop, long enough not to tire at once; an effect is short', () => {
    const piece = prepareSound({ xml: music[0].xml, seed: 7, use: 'music' });
    expect(piece.samples.length / piece.sampleRate).toBeGreaterThan(15);
    const blip = prepareSound({ xml: effectProgram('rune', programs)!.xml, seed: 1, use: 'effect' });
    expect(blip.samples.length / blip.sampleRate).toBeLessThan(1.5);
    // An effect loses the silence after it.
    expect(Math.abs(blip.samples[blip.samples.length - 1])).toBeGreaterThanOrEqual(3e-4);
  }, 60_000);

  it('the persistent cache says the version of what made it: changing the sound means raising it', () => {
    const { samples } = prepareSound({ xml: effectProgram('rune', programs)!.xml, seed: 1, use: 'effect' });
    const print = hashStr(Array.from(samples.subarray(0, 4000), (x) => x.toFixed(5)).join());
    expect([SOUND_CACHE_VERSION, samples.length, print]).toEqual(PINNED);
  });
});

/** Raise SOUND_CACHE_VERSION with these numbers, never these alone: what is on the players' disks would stay the old sound. */
const PINNED = [1, 45239, 778898533];

describe('a broken program', () => {
  const broken = ['', 'not xml <', '<sequence values="B"></sequence>', '<one values="BN" size="4 4 1" in="B" out="N"/>', '<sequence values="B" size="99999 99999 99999"><sound/></sequence>', '<sequence values="BN" size="4 1 4"><sound bpm="nan"/></sequence>'];

  it.each(broken)('throws nothing and says why: %s', (xml) => {
    for (const use of ['music', 'effect'] as const) {
      const out = tryPrepareSound({ xml, seed: 1, use });
      expect('error' in out).toBe(true);
    }
  });

  it('nor with a strange seed', () => {
    const xml = effectProgram('rune', programs)!.xml;
    for (const seed of [NaN, Infinity, -1, 1.5]) expect(() => tryPrepareSound({ xml, seed, use: 'effect' })).not.toThrow();
  });
});

class FakeOut implements SoundOut {
  music: PreparedSound[] = [];
  stops = 0;
  effects: PreparedSound[] = [];
  playMusic(s: PreparedSound) {
    this.music.push(s);
  }
  stopMusic() {
    this.stops++;
  }
  playEffect(s: PreparedSound) {
    this.effects.push(s);
  }
}

const tiny = (): PreparedSound => ({ samples: new Float32Array(8), sampleRate: 44_100 });
const flush = () => new Promise((r) => setTimeout(r, 0));

function directed(fail = (_q: SoundRequest) => false) {
  const out = new FakeOut();
  const asked: SoundRequest[] = [];
  const renders = {
    get: async (q: SoundRequest) => {
      asked.push(q);
      return fail(q) ? undefined : tiny();
    },
  };
  let t = 0;
  const d = new SoundDirector(out, renders, () => t);
  d.setPrograms(programs);
  return { d, out, asked, advance: (ms: number) => (t += ms) };
}

describe('the director', () => {
  it('is silent until the first gesture, and then plays and prepares the effects', async () => {
    const { d, out, asked } = directed();
    d.update(state());
    d.cue('rune:picked');
    await flush();
    expect(out.music).toHaveLength(0);
    expect(out.effects).toHaveLength(0);
    expect(asked).toHaveLength(0);
    d.unlock();
    await flush();
    expect(out.music).toHaveLength(1);
    expect(asked.filter((q) => q.use === 'effect').length).toBeGreaterThan(10);
    d.cue('rune:picked');
    await flush();
    expect(out.effects).toHaveLength(1);
  });

  it('waits before following a change of place, so a border does not make it flicker', async () => {
    const { d, out, advance } = directed();
    d.unlock();
    d.update(state());
    await flush();
    advance(1000);
    d.update(state({ environment: 'woods' }));
    advance(1000);
    d.update(state());
    advance(1000);
    d.update(state({ environment: 'woods' }));
    await flush();
    expect(out.music).toHaveLength(1);
    advance(4100);
    d.update(state({ environment: 'woods' }));
    await flush();
    expect(out.music).toHaveLength(2);
    expect(d.now?.id).toBe('sound-music-woods');
  });

  it('crossing the edge changes the music at once', async () => {
    const { d, out } = directed();
    d.unlock();
    d.update(state());
    await flush();
    d.update(state({ beyond: true }));
    await flush();
    expect(out.music).toHaveLength(2);
    expect(d.now?.id).toBe('sound-music-beyond');
  });

  it('a piece becomes other instances of itself, and comes back: as many as the cache holds', async () => {
    const { d, advance, asked } = directed();
    d.unlock();
    d.update(state());
    await flush();
    const seeds = new Set<number>();
    for (let i = 0; i < 8; i++) {
      advance(80_000);
      d.update(state());
      await flush();
      seeds.add(d.now!.seed);
    }
    expect(seeds.size).toBe(4);
    expect(new Set(asked.filter((q) => q.use === 'music').map((q) => q.xml)).size).toBe(1);
  });

  it('a program that fails stops the music, does not throw and is not asked for again at every update', async () => {
    const { d, out, asked, advance } = directed((q) => q.use === 'music');
    d.unlock();
    d.update(state());
    await flush();
    expect(out.music).toHaveLength(0);
    expect(out.stops).toBe(1);
    const n = asked.length;
    for (let i = 0; i < 5; i++) {
      advance(100_000);
      d.update(state());
    }
    await flush();
    expect(asked.length).toBe(n);
  });

  it('an effect that fails, or that has no program, is silence', async () => {
    const { d, out } = directed((q) => q.use === 'effect');
    d.unlock();
    d.cue('fault');
    await flush();
    expect(out.effects).toHaveLength(0);
    d.setPrograms([]);
    expect(() => d.cue('fault')).not.toThrow();
  });

  it('an effect that comes too late is dropped', async () => {
    const out = new FakeOut();
    let t = 0;
    let release: (s: PreparedSound) => void = () => {};
    const d = new SoundDirector(out, { get: () => new Promise<PreparedSound>((r) => (release = r)) }, () => t);
    d.setPrograms(programs);
    d.unlock();
    d.cue('fault');
    t += 1000;
    release(tiny());
    await flush();
    expect(out.effects).toHaveLength(0);
  });

  it('an effect goes through its instances', async () => {
    const { d, asked } = directed();
    d.unlock();
    const n = asked.length;
    for (let i = 0; i < 4; i++) d.cue('rune:picked');
    await flush();
    expect(asked.slice(n).map((q) => q.seed)).toEqual([1, 2, 3, 1]);
  });
});

/** A worker that answers from the real code, one job at a time, when told. */
function fakeWorker(answer: (q: SoundRequest) => 'ok' | 'error' | 'hang' | 'crash' = () => 'ok') {
  const made: SoundWorker[] = [];
  const factory = () => {
    const w: SoundWorker = {
      onmessage: null,
      onerror: null,
      terminate: vi.fn(),
      postMessage(job) {
        const a = answer(job.req);
        if (a === 'hang') return;
        if (a === 'crash') return void setTimeout(() => w.onerror?.({}), 0);
        setTimeout(() => w.onmessage?.({ data: a === 'error' ? { id: job.id, error: 'no' } : { id: job.id, sound: tiny(), ms: 1, fromDisk: false } }), 0);
      },
    };
    made.push(w);
    return w;
  };
  return { factory, made };
}

describe('the renders', () => {
  const q = (seed: number, use: SoundRequest['use'] = 'music'): SoundRequest => ({ xml: '<x/>', seed, use });

  it('ask once for the same thing, and keep it', async () => {
    const answer = vi.fn(() => 'ok' as const);
    const r = new SoundRenders(fakeWorker(answer).factory);
    const [a, b] = await Promise.all([r.get(q(1)), r.get(q(1))]);
    expect(a).toBe(b);
    expect(await r.get(q(1))).toBe(a);
    expect(answer).toHaveBeenCalledTimes(1);
  });

  it('music goes before the effects still waiting', async () => {
    const order: string[] = [];
    const r = new SoundRenders(
      fakeWorker((x) => {
        order.push(`${x.use}${x.seed}`);
        return 'ok';
      }).factory,
    );
    await Promise.all([r.get(q(1, 'effect')), r.get(q(2, 'effect')), r.get(q(3, 'effect')), r.get(q(4))]);
    expect(order).toEqual(['effect1', 'music4', 'effect2', 'effect3']);
  });

  it('a failure answers nothing, is remembered, and the next job still runs', async () => {
    const answer = vi.fn((x: SoundRequest) => (x.seed === 1 ? ('error' as const) : ('ok' as const)));
    const r = new SoundRenders(fakeWorker(answer).factory);
    expect(await r.get(q(1))).toBeUndefined();
    expect(await r.get(q(1))).toBeUndefined();
    expect(answer).toHaveBeenCalledTimes(1);
    expect(r.failures.get(soundKey(q(1)))).toBe('no');
    expect(await r.get(q(2))).toBeDefined();
  });

  it('a worker that dies is replaced', async () => {
    const f = fakeWorker((x) => (x.seed === 1 ? 'crash' : 'ok'));
    const r = new SoundRenders(f.factory);
    expect(await r.get(q(1))).toBeUndefined();
    expect(await r.get(q(2))).toBeDefined();
    expect(f.made).toHaveLength(2);
  });

  it('a worker that cannot even start is silence', async () => {
    const r = new SoundRenders(() => {
      throw new Error('no workers here');
    });
    expect(await r.get(q(1))).toBeUndefined();
  });

  it('a program that does not end is stopped by the watchdog, and the others go on', async () => {
    vi.useFakeTimers();
    try {
      const f = fakeWorker((x) => (x.seed === 1 ? 'hang' : 'ok'));
      const r = new SoundRenders(f.factory);
      const hung = r.get(q(1));
      const next = r.get(q(2));
      await vi.advanceTimersByTimeAsync(25_000);
      expect(await hung).toBeUndefined();
      expect(await next).toBeDefined();
      expect(f.made[0].terminate).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stay within their memory, least recently used out first', async () => {
    const big = (): PreparedSound => ({ samples: new Float32Array(1000), sampleRate: 44_100 });
    const make = (): SoundWorker => {
      const w: SoundWorker = { onmessage: null, onerror: null, terminate: () => {}, postMessage: (job) => void setTimeout(() => w.onmessage?.({ data: { id: job.id, sound: big(), ms: 1, fromDisk: false } }), 0) };
      return w;
    };
    const r = new SoundRenders(make, false, 8000);
    const first = await r.get(q(1));
    await r.get(q(2));
    await r.get(q(1));
    await r.get(q(3));
    expect(r.bytes).toBeLessThanOrEqual(8000);
    expect(await r.get(q(1))).toBe(first);
    expect(SOUND_MEMORY_BYTES).toBeGreaterThan(10_000_000);
  });
});

describe('the choices of who listens', () => {
  it('read whatever was left in the browser', () => {
    expect(readSoundPrefs(null)).toEqual({ volume: 0.7, muted: false });
    expect(readSoundPrefs('{nope')).toEqual({ volume: 0.7, muted: false });
    expect(readSoundPrefs('null')).toEqual({ volume: 0.7, muted: false });
    expect(readSoundPrefs('{"volume":3,"muted":true}')).toEqual({ volume: 1, muted: true });
    expect(readSoundPrefs('{"volume":"loud","muted":"yes"}')).toEqual({ volume: 0.7, muted: false });
    expect(readSoundPrefs('{"volume":0.25}')).toEqual({ volume: 0.25, muted: false });
  });
});
