// Sound as a MarkovJunior program (T221, ADR-0123): the language in XML on the real engine, the score, the one source of samples, the presets.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { CLASSES } from '../src/mj/classes';
import { modelErrors } from '../src/kernel/validator';
import { at, Mj3Error, run, type Node3 } from '../src/mj/engine';
import { compileMjx, MJX_NODES } from '../src/mj/model';
import { FORM_LIMITS } from '../src/mj/run';
import { MAX_EVENTS, pitchOf, SCALES, scoreOf, SOUND_CLASS, soundPrograms, soundSettings, type Score } from '../src/mj/sound';
import { MAX_SECONDS, renderScore, renderSoundProgram, scoreOfProgram } from '../src/mj/synth';
import { parseXml } from '../src/mj/xml';

const SEEDS = [1, 2, 3, 7, 42, 1234, 421337, 987654];
const presets = soundPrograms(bundledFiles);
const SOUND = '<sound bpm="120" scale="dorian" root="50"/>';

/** Every node the XML knows, each with something to do, in a program that is a score. */
const ALL_NODES = `<sequence values="BNSAGKHCRTMPDE" size="8 3 8" symmetry="()" origin="True">
  ${SOUND}
  <union symbol="X" values="NS"/>
  <one in="B" out="R" steps="2"/>
  <all in="N" out="A"/>
  <prl in="B" out="G" p="0.2" steps="1"/>
  <box at="1 0 0" size="2 1 2" color="P" on="BG"/>
  <cylinder at="4 1 0" size="2 1 2" color="P" on="B"/>
  <cone at="6 1 0" size="1 1 2" color="P" on="BG"/>
  <ellipsoid at="2 2 3" size="2 1 2" color="P" on="BG"/>
  <line at="0 0 7" to="7 0 7" r="0" color="T"/>
  <markov>
    <one in="B" out="P" steps="4"/>
    <all in="G" out="B"/>
  </markov>
  <path from="R" to="T" on="BP" color="N" steps="2" inertia="True" longest="True"/>
  <convolution neighborhood="Moore" periodic="True" steps="2">
    <rule in="B" out="H" values="X" sum="1..3" p="0.5"/>
    <rule in="P" out="K" values="P" sum="2..26"/>
  </convolution>
  <map scale="2 1 1" values="BNSAGKHCRTMPDE" clear="False">
    <rule in="T" out="CE"/>
  </map>
  <map scale="2 1 1" values="BNSAGKHCRTMPDE">
    <rule in="N" out="NS"/>
    <rule in="K" out="KB"/>
    <rule in="H" out="HB"/>
    <rule in="C" out="CB"/>
  </map>
</sequence>`;

function kindsOf(n: Node3, out = new Set<string>()): Set<string> {
  if (n.type === 'sequence' || n.type === 'markov') {
    out.add(n.type);
    n.children.forEach((c) => kindsOf(c, out));
  } else if (n.type === 'shape') out.add(n.shape);
  else out.add(n.type === 'conv' ? 'convolution' : n.type);
  return out;
}

describe('the language: sound programs are the engine\'s XML', () => {
  it('a sound program uses every node the engine knows, and each of them does something', () => {
    const m = compileMjx(ALL_NODES, { strict: true });
    expect([...kindsOf(m.program.program)].sort()).toEqual([...MJX_NODES].sort());
    const fired = new Set<string>();
    const r = run(m.program, 5, 200_000, FORM_LIMITS, {
      watch: {
        start() {},
        step: ({ node }) => void fired.add(node.type === 'shape' ? node.shape : node.type === 'conv' ? 'convolution' : node.type),
      },
    });
    expect(r.finished).toBe(true);
    expect(r.unused).toEqual([]);
    for (const k of MJX_NODES.filter((n) => n !== 'sequence' && n !== 'markov')) expect([...fired], k).toContain(k);
    expect(scoreOf(r.grid, m.sound!).events.length).toBeGreaterThan(0);
  });

  it('every attribute the SoundLab used reaches the engine', () => {
    const { program } = compileMjx(`<path values="BRTPN" size="4 1 1" from="R" to="T" on="P" color="N" steps="4" inertia="True" longest="True"/>`);
    expect(program.program).toMatchObject({ type: 'path', steps: 4, inertia: true, longest: true });
    const conv = compileMjx(`<convolution values="BN" size="4 1 1" neighborhood="VonNeumann" periodic="True" steps="4"><rule in="B" out="N" values="N" sum="1,2" p="0.65"/></convolution>`).program.program;
    expect(conv).toMatchObject({ type: 'conv', neighborhood: 'vonneumann', periodic: true, steps: 4, rules: [{ neighbors: 'N', sums: [1, 2], p: 0.65 }] });
    const unions = compileMjx(`<one values="BNS" size="2 1 1" in="X" out="N"><union symbol="X" values="BS"/></one>`).program.unions;
    expect(unions).toEqual({ X: '.S' });
  });

  it('a map can keep the grid it scales (clear="False"): every cell a block of itself', () => {
    const xml = (clear: string) => `<sequence values="BAC" size="2 1 1"><one in="B" out="A" steps="1"/><map scale="2 1 1" values="BAC"${clear}><rule in="C" out="CC"/></map></sequence>`;
    const count = (s: string) => {
      const g = run(compileMjx(s).program, 3).grid;
      return [...g.cells].filter((c) => g.alphabet[c] === 'A').length;
    };
    expect(count(xml(' clear="False"'))).toBe(2);
    expect(count(xml(''))).toBe(0);
  });

  it('the musical parameters stay in the XML, and what is out of range goes back', () => {
    const el = (s: string) => parseXml(s)[0];
    expect(soundSettings(el('<sound bpm="90" scale="phrygian" root="48" swing="0.2" cutoff="900" space="0.1"><track y="1" instrument="pad" volume="0.5"/></sound>'))).toEqual({
      bpm: 90,
      scale: 'phrygian',
      root: 48,
      swing: 0.2,
      cutoff: 900,
      space: 0.1,
      tracks: [{ y: 1, instrument: 'pad', volume: 0.5 }],
    });
    // Nothing said: the SoundLab's defaults, its three tracks.
    expect(soundSettings(el('<sound/>'))).toMatchObject({ bpm: 122, scale: 'dorian', root: 50, tracks: [{ instrument: 'lead' }, { instrument: 'pad' }, { instrument: 'bass' }] });
    for (const bad of ['<sound bpm="NaN"/>', '<sound bpm="0"/>', '<sound bpm=""/>', '<sound scale="constructor"/>', '<sound root="1.5"/>', '<sound swing="9"/>', '<sound><track instrument="pad"/></sound>', '<sound><track y="0" instrument="kazoo"/></sound>', '<sound><one/></sound>', '<sound><track y="0" instrument="pad"/><track y="0" instrument="lead"/></sound>'])
      expect(() => soundSettings(el(bad)), bad).toThrow(Mj3Error);
    expect(() => compileMjx(`<one values="BN" size="1 1 1" in="B" out="N">${SOUND}${SOUND}</one>`)).toThrow(/un solo <sound>/);
  });

  it('a visual program is not a score, and scoreOfProgram says so', () => {
    expect(compileMjx('<one values="BN" size="1 1 1" in="B" out="N"/>').sound).toBeUndefined();
    expect(() => scoreOfProgram('<one values="BN" size="1 1 1" in="B" out="N"/>', 1)).toThrow(/manca <sound>/);
  });

  it('the visual programs give the grids they gave before', () => {
    const fnv = (b: Uint8Array) => {
      let h = 0x811c9dc5;
      for (let i = 0; i < b.length; i++) h = Math.imul(h ^ b[i], 16777619);
      return (h >>> 0).toString(16);
    };
    const golden = JSON.parse(readFileSync('tests/fixtures/griglie-visive.json', 'utf8')) as Record<string, string>;
    expect(Object.keys(golden).length).toBeGreaterThanOrEqual(20);
    for (const [id, want] of Object.entries(golden)) {
      const r = run(compileMjx(bundledFiles[`models/${id}.xml`]).program, 1, 2_000_000, FORM_LIMITS);
      expect(`${r.grid.X}x${r.grid.Y}x${r.grid.Z}:${r.steps}:${r.grid.alphabet.join('').length}:${fnv(r.grid.cells)}`, id).toBe(want);
    }
  }, 60_000);
});

describe('the score', () => {
  const settings = soundSettings(parseXml('<sound bpm="120" scale="dorian" root="50"/>')[0]);
  const grid = (cells: Record<string, string>, X = 4, Y = 3, Z = 2) => {
    const alphabet = ['.', ...new Set(Object.values(cells))];
    const g = { X, Y, Z, cells: new Uint8Array(X * Y * Z), alphabet, log: [], epoch: 0 };
    for (const [k, c] of Object.entries(cells)) {
      const [x, y, z] = k.split(',').map(Number);
      g.cells[x + y * X + z * X * Y] = alphabet.indexOf(c);
    }
    return g;
  };

  it('X is time, Y the track, Z the height; sustains lengthen the note before them', () => {
    const { events } = scoreOf(grid({ '0,0,1': 'N', '1,0,1': 'S', '2,0,1': 'S', '3,0,1': 'G' }), settings);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ step: 0, track: 0, z: 1, voice: 'lead', hold: 3, midi: pitchOf(1, settings, 'lead'), accent: false });
    expect(events[1]).toMatchObject({ step: 3, voice: 'lead', hold: 1 });
    expect(events[1].gain).toBeLessThan(events[0].gain);
  });

  it('the instruments sit an octave apart, on the scale', () => {
    expect(pitchOf(0, settings, 'lead') - pitchOf(0, settings, 'pad')).toBe(12);
    expect(pitchOf(0, settings, 'pad') - pitchOf(0, settings, 'bass')).toBe(12);
    expect(pitchOf(2, settings, 'pad')).toBe(50 + SCALES.dorian[2]);
    expect(pitchOf(60, settings, 'lead')).toBeLessThanOrEqual(127);
  });

  it('a sustain on its own is a short note; markers and other letters are silent', () => {
    const { events } = scoreOf(grid({ '0,1,0': 'S', '1,0,0': 'R', '2,0,0': 'T', '3,0,0': 'Q' }), settings);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ voice: 'pad', hold: 1 });
  });

  it('drums play on any track; an accent on the lowest bass is also a kick; an open hat from height 4', () => {
    const { events } = scoreOf(grid({ '0,0,0': 'K', '1,1,0': 'C', '2,2,0': 'A', '3,2,0': 'H', '3,2,5': 'H' }, 4, 3, 6), settings);
    expect(events.map((e) => e.voice)).toEqual(['kick', 'snare', 'kick', 'bass', 'hat', 'openhat']);
  });

  it('only the tracks it declares sound, and a score has a ceiling', () => {
    const only = { ...settings, tracks: [{ y: 1, instrument: 'pad' as const, volume: 1 }] };
    const { events } = scoreOf(grid({ '0,0,0': 'N', '0,1,0': 'N', '0,2,0': 'N' }), only);
    expect(events.map((e) => e.track)).toEqual([1]);
    const full = run(compileMjx(`<all values="BN" size="64 3 64" in="B" out="N" symmetry="()"/>`).program, 1).grid;
    const big = scoreOf(full, settings);
    expect(big.events).toHaveLength(MAX_EVENTS);
    expect(big.truncated).toBe(true);
  });
});

describe('the presets, all of them, in XML on the real engine', () => {
  it('are the four of the SoundLab, in models/ with their own class, which is no class of the world', () => {
    expect(presets.map((p) => p.nome)).toEqual(['Sentiero Melodico', 'Fuga Cellular Automata', 'Architettura Frattale', 'Boss Fight Cyber-Dungeon']);
    expect(CLASSES.map((c) => c.id)).not.toContain(SOUND_CLASS);
    // Parameters as in the SoundLab.
    const params = presets.map((p) => compileMjx(p.xml).sound!).map((s) => [s.scale, s.root, s.bpm]);
    expect(params).toEqual([['dorian', 50, 120], ['harmonic_minor', 52, 128], ['hirajoshi', 53, 114], ['phrygian', 48, 138]]);
  });

  it.each(presets.map((p) => [p.id, p.xml] as const))('%s: strict XML, a score on every track it declares, with every seed', (_id, xml) => {
    const m = compileMjx(xml, { strict: true });
    expect(m.warnings).toEqual([]);
    expect(m.sound!.tracks.length).toBe(3);
    for (const seed of SEEDS) {
      const score = scoreOfProgram(xml, seed);
      expect(score.steps, `seed ${seed}`).toBe(16);
      for (const t of m.sound!.tracks) expect(score.events.filter((e) => e.track === t.y).length, `seed ${seed}, y=${t.y}`).toBeGreaterThan(0);
      // Every node had its chance to do something: nothing left dead from the translation.
      const r = run(m.program, seed, 200_000, FORM_LIMITS);
      expect(r.finished, `seed ${seed}`).toBe(true);
    }
  });

  it.each(presets.map((p) => [p.id, p.xml] as const))('%s: a signal without NaN and without clipping, that is really there', (_id, xml) => {
    const s = renderSoundProgram(xml, 421337);
    let peak = 0;
    let energy = 0;
    for (const v of s.samples) {
      expect(Number.isFinite(v)).toBe(true);
      peak = Math.max(peak, Math.abs(v));
      energy += v * v;
    }
    expect(peak).toBeLessThanOrEqual(1);
    expect(peak).toBeGreaterThan(0.1);
    expect(Math.sqrt(energy / s.samples.length)).toBeGreaterThan(0.01);
    expect(s.loopEnd).toBeGreaterThan(s.loopStart);
    expect(s.loopEnd).toBeLessThanOrEqual(s.samples.length);
    expect(s.truncated).toBe(false);
  });

  it('pass the validator, which refuses a score with nothing to hear', () => {
    for (const p of presets) expect(modelErrors(`models/${p.id}.xml`, p.xml), p.id).toEqual([]);
    expect(modelErrors('models/x.xml', `<one values="BR" size="4 3 4" in="B" out="R" steps="3" symmetry="()">${SOUND}</one>`).join()).toMatch(/partitura è vuota/);
    expect(modelErrors('models/x.xml', '<one values="BN" size="4 3 4" in="B" out="N"><sound bpm="1"/></one>').join()).toMatch(/bpm/);
  });
});

describe('the one source of sound', () => {
  const xml = presets[0].xml;

  it('same program and seed, identical samples; another seed, others', () => {
    const a = renderSoundProgram(xml, 99);
    const b = renderSoundProgram(xml, 99);
    expect(Buffer.from(a.samples.buffer).equals(Buffer.from(b.samples.buffer))).toBe(true);
    const c = renderSoundProgram(xml, 100);
    expect(Buffer.from(a.samples.buffer).equals(Buffer.from(c.samples.buffer))).toBe(false);
  });

  it('the seed alone changes the noise of the drums: same score, other samples', () => {
    const score = scoreOfProgram(presets[3].xml, 5);
    const a = renderScore(score, 1);
    const b = renderScore(score, 2);
    expect(Buffer.from(a.samples.buffer).equals(Buffer.from(b.samples.buffer))).toBe(false);
  });

  it('never asks the clock nor Math.random: it would not know what to do with them', () => {
    const score = scoreOfProgram(xml, 7);
    const expected = renderScore(score, 7).samples;
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random');
    });
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('Date.now');
    });
    const perf = vi.spyOn(performance, 'now').mockImplementation(() => {
      throw new Error('performance.now');
    });
    try {
      expect(Buffer.from(renderScore(score, 7).samples.buffer).equals(Buffer.from(expected.buffer))).toBe(true);
    } finally {
      random.mockRestore();
      now.mockRestore();
      perf.mockRestore();
    }
    // The way there uses no random numbers but the seed's (the engine reads the clock only to say how long it took).
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random');
    });
    try {
      expect(() => scoreOfProgram(xml, 7)).not.toThrow();
    } finally {
      rnd.mockRestore();
    }
    // And it needs nothing of the page: this is Node.
    expect(typeof (globalThis as { AudioContext?: unknown }).AudioContext).toBe('undefined');
  });

  it('the loop is really a loop: from the second pass on the sound repeats', () => {
    const s = renderScore(scoreOfProgram(xml, 7), 7, { loops: 4 });
    const len = s.loopEnd - s.loopStart;
    let diff = 0;
    let energy = 0;
    for (let i = 0; i < len; i++) {
      const a = s.samples[s.loopStart + i];
      const b = s.samples[s.loopStart - len + i];
      diff += (a - b) ** 2;
      energy += a * a;
    }
    expect(diff / energy).toBeLessThan(0.02);
  });

  it('the rhythm is where the score says, late on the odd steps', () => {
    const settings = { ...soundSettings(parseXml(`<sound bpm="120" swing="0.4" space="0"/>`)[0]) };
    const kick = (step: number): Score => ({ steps: 8, settings, truncated: false, events: [{ step, track: 2, z: 0, voice: 'kick', hold: 1, gain: 0.9, accent: false }] });
    const first = (step: number) => {
      const { samples } = renderScore(kick(step), 1, { loops: 1 });
      return samples.findIndex((v) => Math.abs(v) > 0.01);
    };
    const stepSamples = (60 / 120 / 4) * 44_100;
    expect(first(2) - first(0)).toBeCloseTo(2 * stepSamples, 0);
    expect(first(1) - first(0)).toBeCloseTo(1.4 * stepSamples, 0);
  });

  it('whatever the program wrote, the signal stays whole: a box full of accents does not clip', () => {
    const xmlFull = `<all values="BA" size="16 3 8" in="B" out="A" symmetry="()"><sound bpm="400" swing="0.45" cutoff="18000" space="0.85"/></all>`;
    const { samples } = renderSoundProgram(xmlFull, 3);
    let peak = 0;
    for (const v of samples) {
      expect(Number.isFinite(v)).toBe(true);
      peak = Math.max(peak, Math.abs(v));
    }
    expect(peak).toBeLessThanOrEqual(1);
  });

  it('a long program does not become an endless sound', () => {
    const settings = soundSettings(parseXml('<sound bpm="20"/>')[0]);
    const score: Score = { steps: 256, settings, truncated: false, events: [{ step: 0, track: 0, z: 0, voice: 'kick', hold: 1, gain: 1, accent: false }] };
    const s = renderScore(score, 1, { sampleRate: 8000 });
    expect(s.samples.length).toBeLessThanOrEqual((MAX_SECONDS + 1) * 8000 + 1);
    expect(s.truncated).toBe(true);
  });

  it('the grid is read through the engine letters: at() and the score agree', () => {
    const m = compileMjx(xml);
    const r = run(m.program, 11);
    const score = scoreOf(r.grid, m.sound!);
    for (const e of score.events) expect('NSAGKHC').toContain(at(r.grid, e.step, e.track, e.z));
  });
});
