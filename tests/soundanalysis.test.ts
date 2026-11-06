// What a sound program plays and what is wrong with it, without ears (T223, ADR-0125): the presets pass, a program built for each defect is told.
import { italianName } from '../src/kernel/internalNames';
import { describe, expect, it, vi } from 'vitest';
import { wavOf } from '../lab/scripts/wav';
import { bundledFiles } from '../src/kernel/bundle';
import { modelErrors } from '../src/kernel/validator';
import { compileMjx } from '../src/mj/model';
import { soundPrograms, soundSettings, type Score, type ScoreEvent } from '../src/mj/sound';
import { analyzeSound, measureScore, measureSignal, noteName, SOUND_THRESHOLDS, soundIssues, soundReportText, type SoundDefect } from '../src/mj/soundanalysis';
import { renderSoundProgram, SAMPLE_RATE } from '../src/mj/synth';
import { keptByTheAuthor } from './helpers';
import { parseXml } from '../src/mj/xml';

const presets = soundPrograms(bundledFiles).filter((p) => !p.suono);
const inGame = soundPrograms(bundledFiles).filter((p) => p.suono);
const BOX = 'size="16 3 8" symmetry="()"';
const hits = (at: number[], y: number, z: number, color: string) => at.map((x) => `<box at="${x} ${y} ${z}" size="1 1 1" color="${color}"/>`).join('');

/** One program per defect: each is what its name says, and some of them nothing else. */
const DEFECTS: Array<[string, SoundDefect, RegExp, string]> = [
  ['un colpo solo in tutta la battuta', 'empty', /eventi a battuta/, `<one values="BK" ${BOX} in="B" out="K" steps="1"><sound bpm="120"><track y="0" instrument="lead"/><track y="1" instrument="pad"/><track y="2" instrument="bass"/></sound></one>`],
  ['niente che suoni', 'empty', /partitura è vuota/, `<one values="BR" ${BOX} in="B" out="R" steps="3"><sound/></one>`],
  ['una traccia dichiarata e muta', 'empty', /y=1 \(pad\).*muta/, `<sequence values="BN" size="16 2 8" symmetry="()"><sound><track y="0" instrument="lead"/><track y="1" instrument="pad"/></sound><box at="0 1 0" size="16 1 8" color="B"/><prl in="B" out="B" steps="1"/>${hits([0, 3, 6, 9, 12], 0, 0, 'N')}${hits([1, 5, 10, 14], 0, 3, 'N')}${hits([2, 7, 11], 0, 5, 'N')}</sequence>`],
  ['note sotto i 20 Hz', 'empty', /sotto i 20 Hz/, `<one values="BN" size="16 1 3" symmetry="()" in="B" out="N" steps="20"><sound root="0"><track y="0" instrument="bass"/></sound></one>`],
  ['una nota sola, a caso nel tempo', 'flat', /1 note diverse/, `<one values="BN" size="16 1 1" symmetry="()" in="B" out="N" steps="7"><sound><track y="0" instrument="lead"/></sound></one>`],
  ['la battuta ridice ogni quattro passi lo stesso', 'repetitive', /si ripete ogni 4 passi/, `<sequence values="BKHC" ${BOX}><sound><track y="2" instrument="bass"/></sound>${hits([0, 4, 8, 12], 2, 0, 'K')}${hits([2, 6, 10, 14], 2, 0, 'H')}</sequence>`],
  ['i semi non cambiano niente', 'repetitive', /i semi danno quasi la stessa partitura/, `<sequence values="BN" ${BOX}><sound><track y="0" instrument="lead"/></sound>${hits([0], 0, 0, 'N')}${hits([3], 0, 2, 'N')}${hits([6], 0, 4, 'N')}${hits([9], 0, 3, 'N')}${hits([13], 0, 1, 'N')}</sequence>`],
  ['due tracce a un semitono', 'off_key', /semitono o un tritono/, `<sequence values="BN" ${BOX}><sound scale="phrygian"><track y="0" instrument="pad"/><track y="1" instrument="pad"/></sound><box at="0 0 0" size="16 1 1" color="N"/><box at="0 1 1" size="16 1 1" color="N"/></sequence>`],
  ['altezze che sbattono sul tetto MIDI, fuori scala', 'off_key', /sulla scala dichiarata/, `<one values="BN" size="16 1 32" symmetry="()" in="B" out="N" steps="40"><sound root="90"><track y="0" instrument="lead"/></sound></one>`],
  ['tracce a volume 0,02', 'off_volume', /troppo piano/, `<one values="BN" ${BOX} in="B" out="N" steps="30"><sound bpm="120"><track y="0" instrument="lead" volume="0.02"/><track y="1" instrument="pad" volume="0.02"/></sound></one>`],
  ['una scatola piena di accenti', 'off_volume', /troppe note/, `<all values="BA" size="64 3 64" in="B" out="A" symmetry="()"><sound bpm="400" swing="0.45" cutoff="18000" space="0.85"/></all>`],
];

const analyzed = (xml: string, seeds?: number[]) => analyzeSound(compileMjx(xml), { ...(seeds ? { seeds } : {}), frugal: xml.includes('size="64') });

describe('the thresholds, on the presets', () => {
  it.each(presets.map((p) => [p.id, p.xml] as const))('%s has nothing wrong, on the default seeds and on others', (_id, xml) => {
    expect(analyzed(xml).issues).toEqual([]);
    expect(analyzed(xml, [1, 2, 3, 7, 42, 1234, 421337, 987654]).issues).toEqual([]);
  });

  it('the validator lets them through, in the time of a request', () => {
    for (const p of presets) expect(modelErrors(`models/${p.id}.xml`, p.xml), p.id).toEqual([]);
  });
});

describe('the thresholds, on the programs of the game (T228)', () => {
  it('are the pieces and the effects of the seed: seven and nine of T224, six, nineteen and the Death made again of Claude Cloud (T273)', () => {
    expect(inGame.map((p) => p.suono!.uso).sort()).toEqual([...new Array(9 + 19 + 1).fill('effect'), ...new Array(7 + 6).fill('music')]);
  });

  it.each(inGame.map((p) => [p.id, p.xml] as const))('%s passes, on the default seeds and on others, unless the author keeps it as it is', (id, xml) => {
    const defects = keptByTheAuthor(id);
    expect(analyzed(xml).issues.map((i) => i.defect)).toEqual(defects);
    // The other seeds on the score and one render: the pieces take a second each.
    expect(analyzeSound(compileMjx(xml), { seeds: [7, 42, 1234, 421337, 987654], frugal: true }).issues.map((i) => i.defect)).toEqual(defects);
  });
});

describe('a program built for each defect', () => {
  it.each(DEFECTS)('%s → %s', (_what, defect, reason, xml) => {
    const issue = analyzed(xml).issues.find((i) => i.defect === defect);
    expect(issue?.message).toMatch(reason);
    // The validator is told the same, and it goes back to who wrote it.
    expect(modelErrors('models/x.xml', xml).join('\n')).toMatch(new RegExp(`models/x\\.xml: suono ${italianName('solo-codice', defect)}`));
  });

  it('the defects that are measures of the signal only: built on the samples', () => {
    const rate = 8000;
    const tone = (n: number, f: (i: number) => number) => Float32Array.from({ length: n }, (_, i) => f(i));
    const base = { score: measureScore({ steps: 16, settings: soundSettings(parseXml('<sound><track y="0" instrument="lead"/></sound>')[0]), truncated: false, events: Array.from({ length: 16 }, (_, i): ScoreEvent => ({ step: i, track: 0, z: i % 8, voice: 'lead', midi: 60 + (i % 8), hold: 1, gain: 0.5, accent: false })) }, 1) };
    const judge = (samples: Float32Array) => soundIssues({ seeds: [{ ...base, signal: measureSignal({ samples, sampleRate: rate, loopStart: 0, loopEnd: samples.length }, rate / 8) }], settings: soundSettings(parseXml('<sound><track y="0" instrument="lead"/></sound>')[0]), effect: false }).map((i) => i.defect);
    // A steady tone: no step louder than another, and all the energy in one band.
    const steady = tone(rate * 2, (i) => 0.2 * Math.sin((2 * Math.PI * 1000 * i) / rate));
    expect(judge(steady)).toContain('flat');
    // The same tone cut half a period off: a click at every turn. The synthesizer's passes are aligned to the sample, so no program gets here today.
    const cut = tone(rate * 2 + 2, (i) => 0.2 * Math.sin((2 * Math.PI * 1000 * i) / rate) * Math.min(1, (i + 1) / rate) * (1 + (i % rate) / rate));
    cut[cut.length - 1] = 1;
    cut[0] = -1;
    expect(judge(cut)).toContain('seam');
    // Hard clipping: a square at full scale.
    const square = tone(rate * 2, (i) => (Math.floor(i / 20) % 2 ? 1 : -1));
    expect(judge(square)).toContain('off_volume');
    // Nothing at all.
    expect(judge(new Float32Array(rate * 2))).toContain('empty');
  });

  it('a rare seed does not condemn a program: the limits speak when most seeds pass them', () => {
    const settings = soundSettings(parseXml('<sound scale="phrygian"><track y="0" instrument="pad"/></sound>')[0]);
    const note = (step: number, midi: number): ScoreEvent => ({ step, track: 0, z: 0, voice: 'pad', midi, hold: 1, gain: 0.5, accent: false });
    const score = (e: ScoreEvent[]): Score => ({ steps: 16, settings, truncated: false, events: e });
    const melody = Array.from({ length: 8 }, (_, i) => note(i * 2, 50 + (i % 5) * 3));
    const clean = measureScore(score([...melody, note(0, 53), note(4, 58)]), 1);
    const rough = measureScore(score([...melody, note(0, 51), note(2, 54), note(4, 57), note(6, 60), note(8, 63)]), 2);
    expect(rough.harsh).toBeGreaterThan(SOUND_THRESHOLDS.maxHarsh);
    const said = (...s: typeof clean[]) => soundIssues({ seeds: s.map((x) => ({ score: x })), settings, effect: false }).map((i) => i.message).join();
    expect(said(clean, clean, rough)).not.toMatch(/semitono/);
    expect(said(clean, rough, rough)).toMatch(/semitono/);
  });

  it('under a bar it is an effect: one note goes through, what does not sound does not', () => {
    const blip = `<sequence values="BNS" size="4 1 8" symmetry="()"><sound bpm="240"><track y="0" instrument="lead"/></sound><box at="0 0 4" size="1 1 1" color="N"/><box at="1 0 4" size="1 1 1" color="S"/></sequence>`;
    const r = analyzed(blip);
    expect(r.effect).toBe(true);
    expect(r.issues).toEqual([]);
    expect(modelErrors('models/x.xml', blip)).toEqual([]);
    expect(soundReportText(r)).toMatch(/un effetto/);
    expect(modelErrors('models/x.xml', `<one values="BR" size="4 1 8" in="B" out="R" steps="1" symmetry="()"><sound/></one>`).join()).toMatch(/partitura è vuota/);
  });

  it('what does not finish goes back as such', () => {
    const xml = `<markov values="BN" size="16 1 8" symmetry="()"><sound><track y="0" instrument="lead"/></sound><one in="B" out="N"/><one in="N" out="B"/></markov>`;
    expect(analyzed(xml).issues.map((i) => i.message).join()).toMatch(/non finisce/);
  });
});

describe('the measures', () => {
  const settings = soundSettings(parseXml('<sound bpm="120" scale="dorian" root="50"><track y="0" instrument="lead" volume="1"/><track y="2" instrument="bass" volume="1"/></sound>')[0]);
  const note = (step: number, midi: number, hold = 1, track = 0): ScoreEvent => ({ step, track, z: 0, voice: track ? 'bass' : 'lead', midi, hold, gain: 0.7, accent: false });

  it('notes per track and per bar, range, density, length', () => {
    const score: Score = { steps: 32, settings, truncated: false, events: [note(0, 62, 3), note(4, 69), note(20, 65), note(0, 38, 1, 2), { step: 16, track: 2, z: 0, voice: 'kick', hold: 1, gain: 1, accent: false }] };
    const m = measureScore(score, 9);
    expect(m).toMatchObject({ seed: 9, bars: 2, events: 5, pitches: 4, lowest: 38, highest: 69 });
    expect(m.density).toBeCloseTo(4 / 32);
    expect(m.tracks[0]).toMatchObject({ y: 0, notes: 3, hits: 0, perBar: [2, 1], pitches: 3, lowest: 62, highest: 69, meanHold: 5 / 3 });
    expect(m.tracks[1]).toMatchObject({ y: 2, notes: 1, hits: 1, perBar: [1, 1] });
  });

  it('the key: what is played against what is declared', () => {
    const inD: Score = { steps: 16, settings, truncated: false, events: [note(0, 62, 4), note(4, 69, 3), note(7, 65, 2), note(9, 62, 4), note(13, 57, 2)] };
    const m = measureScore(inD);
    expect(m.inScale).toBe(1);
    expect(m.effective?.root).toBe(2);
    expect(m.tonicShare).toBeGreaterThan(0.4);
    // Off the scale only what the MIDI ceiling has flattened can be: here by hand.
    const off = measureScore({ ...inD, events: [note(0, 63, 4), note(4, 66, 4), note(8, 68, 4)] });
    expect(off.inScale).toBeLessThan(SOUND_THRESHOLDS.minInScale);
    expect(off.declaredFit).toBeLessThan(m.declaredFit);
  });

  it('simultaneous semitones and tritones are harsh, an octave is no interval, a third is not harsh', () => {
    const harsh = (a: number, b: number) => measureScore({ steps: 4, settings, truncated: false, events: [note(0, a, 4), note(0, b, 4, 2)] }).harsh;
    expect(harsh(62, 63)).toBe(1);
    expect(harsh(62, 68)).toBe(1);
    expect(harsh(62, 65)).toBe(0);
    expect(harsh(62, 74)).toBe(0);
    expect(harsh(62, 75)).toBe(1);
  });

  it('the period: the smallest shift that lands on itself, per track and overall', () => {
    const kick = (step: number): ScoreEvent => ({ step, track: 2, z: 0, voice: 'kick', hold: 1, gain: 1, accent: false });
    const m = measureScore({ steps: 16, settings, truncated: false, events: [0, 4, 8, 12].map(kick).concat(note(3, 62)) });
    expect(m.tracks[1].period).toBe(4);
    expect(m.tracks[0].period).toBe(16);
    expect(m.period).toBe(16);
  });

  it('the signal: peak, RMS, silence, bands, on a tone that says them', () => {
    const rate = SAMPLE_RATE;
    const samples = Float32Array.from({ length: rate * 2 }, (_, i) => (i < rate ? 0.5 * Math.sin((2 * Math.PI * 1000 * i) / rate) : 0));
    const s = measureSignal({ samples, sampleRate: rate, loopStart: 0, loopEnd: samples.length });
    expect(s.seconds).toBe(2);
    expect(s.peak).toBeCloseTo(0.5, 3);
    expect(s.rawPeak).toBeCloseTo(0.5, 3);
    expect(s.rmsDb).toBeCloseTo(20 * Math.log10(0.25), 1); // half a sine's power: 0.5/√2 over half the time
    expect(s.silence).toBeCloseTo(0.5, 2);
    expect(s.longestSilence).toBeCloseTo(1, 1);
    expect(s.clipped).toBe(0);
    expect(s.bands[3]).toBeGreaterThan(0.99); // «medi»: 500-2000 Hz
    expect(s.centroid).toBeGreaterThan(950);
    expect(s.centroid).toBeLessThan(1050);
  });

  it('measures the samples the player gets: the render of the program, not a copy of it', () => {
    const { xml } = presets[0];
    const sound = renderSoundProgram(xml, 1);
    const direct = measureSignal(sound, (60 / sound.score.settings.bpm / 4) * sound.sampleRate);
    expect(analyzed(xml, [1]).seeds[0].signal).toEqual(direct);
  });

  it('names the notes', () => {
    expect([noteName(60), noteName(50), noteName(38), noteName(69), noteName(-12)]).toEqual(['C4', 'D3', 'D2', 'A4', 'C-2']);
  });
});

describe('the report', () => {
  const xml = presets[3].xml;

  it('says what plays and what is measured, in text', () => {
    const text = soundReportText(analyzed(xml));
    for (const part of ['## Verdetto', '## La partitura', '## Per seme', '## Per traccia', '## Tra i semi', '## Il segnale', '## Lo spettro', 'C phrygian', 'semi 1, 2, 3, 4, 5', 'y2 bass', 'giuntura', 'brillanza', 'Nessun difetto']) expect(text).toContain(part);
    expect(text).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('names the defect when there is one', () => {
    const text = soundReportText(analyzed(DEFECTS[7][3]));
    expect(text).toMatch(/- STONATO \(semi 1, 2, 3, 4, 5\): 100 %/);
  });

  it('is deterministic: same program, same seeds, same bytes, and no random numbers asked', () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random');
    });
    try {
      for (const p of presets) expect(soundReportText(analyzed(p.xml, [3, 8]))).toBe(soundReportText(analyzed(p.xml, [3, 8])));
    } finally {
      random.mockRestore();
    }
    // The seeds matter, or there would be nothing to report.
    expect(soundReportText(analyzed(xml, [3, 8]))).not.toBe(soundReportText(analyzed(xml, [4, 9])));
  });

  it('the WAV holds the samples: the header a player reads, 16 bit mono', () => {
    const samples = Float32Array.from([0, 0.5, -0.5, 1, -1]);
    const w = wavOf(samples, 44_100);
    expect(w.length).toBe(44 + 10);
    expect(w.toString('ascii', 0, 4)).toBe('RIFF');
    expect(w.toString('ascii', 8, 12)).toBe('WAVE');
    expect(w.readUInt32LE(24)).toBe(44_100);
    expect(w.readUInt16LE(22)).toBe(1);
    expect(w.readUInt16LE(34)).toBe(16);
    expect([0, 1, 2, 3, 4].map((i) => w.readInt16LE(44 + i * 2))).toEqual([0, 16384, -16383, 32767, -32767]);
  });
});
