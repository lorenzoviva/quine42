// The SoundLab's logic that lives without a page (T222): the piano roll → the grid → the program's text, saving and loading, the knobs in the XML, the WAV.
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { modelErrors } from '../src/kernel/validator';
import { AIR, type Grid3 } from '../src/mj/engine';
import { compileMjx } from '../src/mj/model';
import { soundPrograms } from '../src/mj/sound';
import { renderScore, renderSoundProgram, SAMPLE_RATE } from '../src/mj/synth';
import { scoreOf } from '../src/mj/sound';
import {
  brushFor,
  gridOf,
  leadComment,
  letterAt,
  levels,
  paintCell,
  retouch,
  RETOUCH_OPEN,
  retouchBoxes,
  retouchCount,
  rollCell,
  ROLL,
  runOnGrid,
  sameGrid,
  seedNote,
  setSoundAttr,
  setTrackVolume,
  stepSlice,
  toGrid3,
  wavBytes,
  withoutRetouches,
  withSeedNote,
} from '../lab/suono/logic';

const presets = soundPrograms(bundledFiles);
const SEED = 421337;

/** Writes in cells that are empty and in cells that are not, on the first plane and on the last. */
function touched(g: Grid3): Grid3 {
  const e = toGrid3(g);
  paintCell(e, { x: 0, y: 0, z: 0 }, 'N');
  paintCell(e, { x: 1, y: 0, z: 0 }, 'N');
  paintCell(e, { x: 2, y: 0, z: 0 }, 'S');
  paintCell(e, { x: e.X - 1, y: e.Y - 1, z: e.Z - 1 }, 'K');
  for (let x = 0; x < e.X; x++) paintCell(e, { x, y: 1, z: 0 }, AIR);
  return e;
}

describe('the piano roll → the grid', () => {
  const box = { X: 16, Y: 3, Z: 8 };
  const W = 16 * 40 + ROLL.left + ROLL.right;
  const H = 8 * 30 + ROLL.top + ROLL.bottom;
  const px = (x: number) => ROLL.left + x * 40 + 20;
  const py = (z: number, band = 0.5) => ROLL.top + (7 - z) * 30 + band * 30;

  it('a point of the roll is the cell it shows: X left to right, Z from the bottom', () => {
    expect(rollCell(px(0), py(0), W, H, box, 2)).toEqual({ x: 0, y: 2, z: 0 });
    expect(rollCell(px(15), py(7), W, H, box, 0)).toEqual({ x: 15, y: 0, z: 7 });
    expect(rollCell(px(5), py(3), W, H, box, 1)).toEqual({ x: 5, y: 1, z: 3 });
  });

  it('with all the planes drawn, the band inside the row says the plane', () => {
    expect(rollCell(px(4), py(2, 0.1), W, H, box)?.y).toBe(0);
    expect(rollCell(px(4), py(2, 0.5), W, H, box)?.y).toBe(1);
    expect(rollCell(px(4), py(2, 0.9), W, H, box)?.y).toBe(2);
  });

  it('outside the grid there is no cell', () => {
    expect(rollCell(ROLL.left - 1, py(0), W, H, box)).toBeUndefined();
    expect(rollCell(px(0), H - 1, W, H, box)).toBeUndefined();
    expect(rollCell(W, py(0), W, H, box)).toBeUndefined();
  });

  it('a click writes the brush, and on the same letter empties the cell', () => {
    const g = toGrid3(gridOf(presets[0].xml, SEED));
    const c = { x: 3, y: 1, z: 2 };
    paintCell(g, c, 'A');
    expect(letterAt(g, c.x, c.y, c.z)).toBe('A');
    expect(brushFor(g, c, 'A')).toBe(AIR);
    expect(brushFor(g, c, 'N')).toBe('N');
    paintCell(g, c, AIR);
    expect(letterAt(g, c.x, c.y, c.z)).toBe(AIR);
  });

  it('a letter the grid had not used yet gets its code', () => {
    const g = { X: 1, Y: 1, Z: 1, cells: new Uint8Array(1), alphabet: ['.'] };
    paintCell(g, { x: 0, y: 0, z: 0 }, 'K');
    expect(g.alphabet).toEqual(['.', 'K']);
    expect(letterAt(g, 0, 0, 0)).toBe('K');
  });
});

describe('the piano roll → the program', () => {
  for (const p of presets)
    it(`${p.id}: what was painted is what the saved program gives, and still a valid program`, () => {
      const target = touched(gridOf(p.xml, SEED));
      const r = retouch(p.xml, SEED, target);
      if (!r.ok) throw new Error(r.why);
      expect(r.boxes).toBeGreaterThan(0);
      expect(sameGrid(gridOf(r.xml, SEED), target)).toBe(true);
      expect(modelErrors(`models/${p.id}.xml`, r.xml)).toEqual([]);
      // Without the retouches the text is the author's, to the character.
      expect(withoutRetouches(r.xml)).toBe(p.xml);
      expect(retouchCount(r.xml)).toBe(r.boxes);
    });

  it('no difference, no block; a second stroke replaces the block and does not pile up', () => {
    const p = presets[1];
    const base = gridOf(p.xml, SEED);
    const same = retouch(p.xml, SEED, base);
    expect(same).toEqual({ ok: true, xml: p.xml, boxes: 0 });

    const first = touched(base);
    const one = retouch(p.xml, SEED, first);
    if (!one.ok) throw new Error(one.why);
    const second = toGrid3(first);
    paintCell(second, { x: 7, y: 2, z: 3 }, 'C');
    const two = retouch(one.xml, SEED, second);
    if (!two.ok) throw new Error(two.why);
    expect(two.xml.split(RETOUCH_OPEN).length).toBe(2);
    expect(sameGrid(gridOf(two.xml, SEED), second)).toBe(true);
    // Back to what the rules give: the block goes away.
    const back = retouch(two.xml, SEED, base);
    expect(back).toEqual({ ok: true, xml: p.xml, boxes: 0 });
  });

  it('a run of a letter along X is one box, and an emptied cell writes the program\'s empty letter', () => {
    const blank = { X: 4, Y: 1, Z: 1, cells: new Uint8Array(4), alphabet: ['.', 'N'] };
    const full = { ...blank, cells: Uint8Array.from([1, 1, 1, 0]) };
    expect(retouchBoxes(blank, full, 'B')).toEqual([{ x: 0, y: 0, z: 0, n: 3, letter: 'N' }]);
    expect(retouchBoxes(full, blank, 'B')).toEqual([{ x: 0, y: 0, z: 0, n: 3, letter: 'B' }]);
  });

  it('the retouches stay over every seed, on what the rules give there', () => {
    const p = presets[0];
    const base = toGrid3(gridOf(p.xml, SEED));
    // Letters this seed does not have there: a retouch is what differs.
    paintCell(base, { x: 5, y: 2, z: 7 }, 'C');
    paintCell(base, { x: 6, y: 0, z: 7 }, 'H');
    const r = retouch(p.xml, SEED, base);
    if (!r.ok) throw new Error(r.why);
    const other = gridOf(r.xml, 7);
    expect(letterAt(other, 5, 2, 7)).toBe('C');
    expect(letterAt(other, 6, 0, 7)).toBe('H');
  });

  it('what the program cannot say, it says', () => {
    const markov = '<markov values="BN" size="2 1 1" symmetry="()"><sound/><one in="B" out="N" steps="1"/></markov>';
    const g = toGrid3(gridOf(markov, 1));
    // The rule fills the row: a cell emptied by hand is a difference, and nothing comes after a markov.
    paintCell(g, { x: 0, y: 0, z: 0 }, AIR);
    const r = retouch(markov, 1, g);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.why).toMatch(/radice è <markov>/);

    const other = { ...toGrid3(gridOf(presets[0].xml, SEED)), X: 2, Y: 2, Z: 2, cells: new Uint8Array(8) };
    const wrong = retouch(presets[0].xml, SEED, other);
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.why).toMatch(/griglia è 2×2×2/);

    const broken = retouch('<sequence values="BN"', 1, other);
    expect(broken.ok).toBe(false);
  });

  it('the rules once more on a painted grid: the result too can be written, and the old retouches do not run as rules', () => {
    const p = presets[1];
    const empty = toGrid3(gridOf(p.xml, SEED));
    empty.cells.fill(0);
    paintCell(empty, { x: 4, y: 1, z: 4 }, 'M');
    const grown = runOnGrid(p.xml, SEED, empty);
    expect(sameGrid(grown, empty)).toBe(false);
    const r = retouch(p.xml, SEED, grown);
    if (!r.ok) throw new Error(r.why);
    expect(sameGrid(gridOf(r.xml, SEED), grown)).toBe(true);
    expect(sameGrid(runOnGrid(r.xml, SEED, empty), grown)).toBe(true);
  });
});

describe('saving and loading', () => {
  for (const p of presets)
    it(`${p.id}: save → load → save gives the same XML, the same seed, the same samples`, () => {
      const r = retouch(p.xml, 99, touched(gridOf(p.xml, 99)));
      if (!r.ok) throw new Error(r.why);
      const knobbed = setTrackVolume(setSoundAttr(setSoundAttr(r.xml, 'bpm', 133), 'swing', 0.2), 1, 0.4, compileMjx(r.xml).sound!.tracks);
      const saved = withSeedNote(knobbed, 99);
      expect(seedNote(saved)).toBe(99);
      // What a load then a save writes.
      expect(withSeedNote(saved, seedNote(saved)!)).toBe(saved);
      const a = renderSoundProgram(saved, seedNote(saved)!);
      const b = renderSoundProgram(withSeedNote(saved, 99), 99);
      expect(a.samples.length).toBe(b.samples.length);
      expect(Buffer.from(a.samples.buffer).equals(Buffer.from(b.samples.buffer))).toBe(true);
    });

  it('a file with no note has no seed; the note changes nothing of what the program does, and the comment on top is still what it says', () => {
    const p = presets[0];
    expect(seedNote(p.xml)).toBeUndefined();
    const saved = withSeedNote(p.xml, 5);
    expect(sameGrid(gridOf(saved, 5), gridOf(p.xml, 5))).toBe(true);
    expect(leadComment(saved)).toBe(leadComment(p.xml));
    expect(leadComment(p.xml)).toMatch(/SoundLab/);
    expect(withSeedNote(saved, 8)).toBe(withSeedNote(p.xml, 8));
  });
});

describe('the knobs write into <sound>', () => {
  const p = presets[0];
  it('an attribute changes, and nothing else of the text', () => {
    const next = setSoundAttr(p.xml, 'bpm', 90);
    expect(compileMjx(next).sound!.bpm).toBe(90);
    expect(setSoundAttr(next, 'bpm', compileMjx(p.xml).sound!.bpm)).toBe(p.xml);
  });

  it('an attribute that was not there is added; a program with no <sound> stays as it is', () => {
    const next = setSoundAttr('<sequence values="BN" size="1 1 1"><sound bpm="100"/><one in="B" out="N"/></sequence>', 'space', 0.5);
    expect(compileMjx(next).sound).toMatchObject({ bpm: 100, space: 0.5 });
    const plain = '<one values="BN" size="1 1 1" in="B" out="N"/>';
    expect(setSoundAttr(plain, 'bpm', 90)).toBe(plain);
  });

  it('a comment that looks like a tag is not touched', () => {
    const xml = '<!-- <sound bpm="1"/> --><sequence values="BN" size="1 1 1"><sound bpm="100"/><one in="B" out="N"/></sequence>';
    const next = setSoundAttr(xml, 'bpm', 90);
    expect(next).toContain('<!-- <sound bpm="1"/> -->');
    expect(compileMjx(next).sound!.bpm).toBe(90);
  });

  it('the volume of a track; a <sound> with no tracks gets the ones it played', () => {
    const tracks = compileMjx(p.xml).sound!.tracks;
    expect(compileMjx(setTrackVolume(p.xml, 1, 0.33, tracks)).sound!.tracks[1].volume).toBe(0.33);
    const none = '<sequence values="BN" size="1 3 1"><sound bpm="100"/><one in="B" out="N"/></sequence>';
    const t = compileMjx(none).sound!.tracks;
    const next = compileMjx(setTrackVolume(none, 2, 0.5, t)).sound!;
    expect(next.bpm).toBe(100);
    expect(next.tracks.map((k) => k.volume)).toEqual([t[0].volume, t[1].volume, 0.5]);
  });

  it('a muted track is silent in the same render: listening does not touch the program', () => {
    const m = compileMjx(p.xml);
    const g = gridOf(p.xml, SEED);
    const off = { ...m.sound!, tracks: m.sound!.tracks.map((t) => ({ ...t, volume: 0 })) };
    expect(scoreOf(g, off).events.length).toBe(0);
    expect(levels(renderScore(scoreOf(g, off), SEED).samples).peak).toBe(0);
    expect(levels(renderScore(scoreOf(g, m.sound!), SEED).samples).peak).toBeGreaterThan(0.05);
  });
});

describe('what comes out', () => {
  it('a WAV a reader understands, with the samples in it', () => {
    const samples = Float32Array.from([0, 0.5, -0.5, 1, -1, 2]);
    const bytes = wavBytes(samples, SAMPLE_RATE);
    const v = new DataView(bytes.buffer);
    const text = (at: number, n: number) => String.fromCharCode(...bytes.subarray(at, at + n));
    expect(text(0, 4)).toBe('RIFF');
    expect(text(8, 8)).toBe('WAVEfmt ');
    expect(text(36, 4)).toBe('data');
    expect(v.getUint32(4, true)).toBe(bytes.length - 8);
    expect(v.getUint16(22, true)).toBe(1);
    expect(v.getUint32(24, true)).toBe(SAMPLE_RATE);
    expect(v.getUint16(34, true)).toBe(16);
    expect(v.getUint32(40, true)).toBe(samples.length * 2);
    expect(Array.from({ length: samples.length }, (_, i) => v.getInt16(44 + i * 2, true))).toEqual([0, 16384, -16383, 32767, -32767, 32767]);
  });

  it('the steps divide the loop with nothing left over', () => {
    const s = { loopStart: 1000, loopEnd: 1000 + 16 * 441 };
    expect(stepSlice(s, 0, 16)).toEqual({ from: 1000, to: 1441 });
    expect(stepSlice(s, 15, 16).to).toBe(s.loopEnd);
  });
});
