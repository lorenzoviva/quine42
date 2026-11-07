// `<in>` and `<out>` as children of a rule, rule files and `<import>` (T333, ADR-0171): the children say what the attributes say, voxel
// by voxel, on the programs of the seed; a program reads only files of models/ by a plain name, within the bounds; whoever reads a file
// changes form when the file changes.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { FormCache, formKey, Forms, InlineRunner } from '../src/kernel/forms';
import { modelErrors, ruleFileErrors, Validator } from '../src/kernel/validator';
import type { Grid3 } from '../src/mj/engine';
import { compileMjx, MJX_INCLUDE_COUNT, MJX_INCLUDE_DEPTH, mjxIncludes, patternText } from '../src/mj/model';
import { FORM_LIMITS, runMjx } from '../src/mj/run';
import { parseXml, writeXml, type XmlElement } from '../src/mj/xml';

const ROOT = path.resolve(__dirname, '..');
const hash = (g: Grid3) => createHash('sha1').update(`${g.X}x${g.Y}x${g.Z}|${g.alphabet.join('')}|`).update(g.cells).digest('hex');
const HOLDERS = new Set(['one', 'all', 'prl', 'rule', 'convolution']);

/** A pattern as a child would write it: a layer per line, a row per line ending in "/". */
const multiline = (p: string) => '\n' + p.trim().split(/\s+/).map((layer) => '  ' + layer.split('/').join('/\n  ')).join('\n') + '\n';

/** The same program with every `in` and `out` attribute of a rule moved into a child `<in>`/`<out>`. */
function childify(xml: string): string {
  const walk = (el: XmlElement): XmlElement => {
    const children = el.children.map(walk);
    if (!HOLDERS.has(el.name)) return { ...el, children };
    const attrs = { ...el.attrs };
    const sides: XmlElement[] = [];
    for (const side of ['in', 'out'] as const) {
      if (attrs[side] === undefined) continue;
      sides.push({ name: side, attrs: {}, children: [], line: el.line, text: multiline(attrs[side]) });
      delete attrs[side];
    }
    return { ...el, attrs, children: [...sides, ...children] };
  };
  return parseXml(xml).map((r) => writeXml(walk(r))).join('\n');
}

const run = (xml: string, size?: [number, number, number], base?: number, files?: Record<string, string>, seed = 1) => {
  const m = compileMjx(xml, { ...(size ? { size } : {}), ...(base ? { base } : {}), ...(files ? { files } : {}) });
  return runMjx(m, seed, { deadline: 600_000, limits: FORM_LIMITS, maxSteps: 60_000 });
};

describe('<in> e <out> figli delle regole', () => {
  it('danno lo stesso esito degli attributi, voxel per voxel, sui programmi del seme', () => {
    const dir = path.join(ROOT, 'universe/models');
    const files: Record<string, string> = { 'models/index.json': fs.readFileSync(path.join(dir, 'index.json'), 'utf8') };
    const ids = fs.readdirSync(dir).filter((f) => f.endsWith('.xml')).map((f) => f.slice(0, -4)).sort();
    for (const id of ids) files[`models/${id}.xml`] = fs.readFileSync(path.join(dir, `${id}.xml`), 'utf8');
    const forms = new Forms(new InlineRunner(new FormCache()));
    forms.load(files);
    // One program in four, structures and figures among them: the step budget keeps it short, the same for both.
    const chosen = ids.filter((_, i) => i % 4 === 0);
    expect(chosen.length).toBeGreaterThan(20);
    let rules = 0;
    for (const id of chosen) {
      const q = forms.request(id, 2)!;
      const kids = childify(q.xml);
      rules += (kids.match(/<in>/g) ?? []).length;
      expect(kids, id).not.toMatch(/\sin="/);
      const a = run(q.xml, q.size, q.base, undefined, 2);
      const b = run(kids, q.size, q.base, undefined, 2);
      expect(hash(b.grid), id).toBe(hash(a.grid));
      expect(b.steps, id).toBe(a.steps);
    }
    expect(rules).toBeGreaterThan(50);
  }, 300_000);

  it('il programma di riferimento del forte, con le regole scritte nei figli', () => {
    const xml = fs.readFileSync(path.join(ROOT, 'lab/banco/riferimento/forte.xml'), 'utf8');
    const size: [number, number, number] = [48, 48, 32];
    expect(hash(run(childify(xml), size).grid)).toBe(hash(run(xml, size).grid));
  }, 120_000);

  it('il testo: strati separati da spazi o righe, una riga che finisce con "/" continua sotto, # è una nota', () => {
    expect(patternText('\n  BW/\n  WB\n  # nota\n  BB/ BB\n').split(/\s+/)).toEqual(['BW/WB', 'BB/BB']);
    const attr = compileMjx('<one values="BWN" size="2 2 2" in="BW/WB BB/BB" out="NN/NN BB/BB"/>');
    const kids = compileMjx('<one values="BWN" size="2 2 2"><in>\n BW/\n WB\n BB/BB\n</in><out>NN/NN <!-- sotto --> BB/BB</out></one>');
    expect(kids.program.program).toEqual(attr.program.program);
  });

  it('su one, rule, convolution e map; attributo e figlio insieme sono un errore chiaro', () => {
    const conv = compileMjx('<sequence values="BW" size="4 4 4"><convolution neighborhood="Moore"><rule values="W" sum="1..26"><in>B</in><out>W</out></rule></convolution></sequence>');
    expect(conv.program.program).toEqual(compileMjx('<sequence values="BW" size="4 4 4"><convolution neighborhood="Moore"><rule in="B" out="W" values="W" sum="1..26"/></convolution></sequence>').program.program);
    const map = '<sequence values="BW" size="4 4 4"><map scale="2 2 2" values="BR"><rule><in>W</in><out>RR/RR RR/RR</out></rule></map></sequence>';
    expect(compileMjx(map).program.program).toEqual(compileMjx('<sequence values="BW" size="4 4 4"><map scale="2 2 2" values="BR"><rule in="W" out="RR/RR RR/RR"/></map></sequence>').program.program);
    expect(() => compileMjx('<one values="BW" size="2 2 2" in="B"><in>B</in><out>W</out></one>')).toThrow(/"in" è scritto in due modi/);
    expect(() => compileMjx('<one values="BW" size="2 2 2"><rule out="W"><in>B</in><out>W</out></rule></one>')).toThrow(/"out" è scritto in due modi/);
    expect(() => compileMjx('<one values="BW" size="2 2 2"><in>B</in><in>B</in><out>W</out></one>')).toThrow(/un solo <in>/);
    expect(() => compileMjx('<sequence values="BW" size="2 2 2"><in>B</in></sequence>')).toThrow(/va dentro rule/);
    expect(() => compileMjx('<one values="BW" size="2 2 2"><in>B</in></one>')).toThrow(/manca "out"/);
  });

  it('il lettore XML tiene il testo e lo riscrive', () => {
    const [el] = parseXml('<one values="BW"><in>B &amp; <!-- c -->\n W</in></one>');
    expect(el.text).toBeUndefined();
    expect(el.children[0].text).toBe('B & \n W');
    expect(writeXml(el.children[0])).toBe('<in>B &amp; \n W</in>');
  });
});

const PARAPET = '<sequence values="BSM" size="7 7 3" ground="S"><color symbol="M" value="aa3333"/><all in="B S" out="M S"/></sequence>';

describe('<import file> e le regole da file', () => {
  it('un programma incluso fa ciò che farebbe scritto lì', () => {
    const files = { 'merli.xml': PARAPET };
    const inc = run('<sequence values="BSM" size="7 7 4" ground="S"><import file="merli"/></sequence>', undefined, undefined, files);
    const inline = run('<sequence values="BSM" size="7 7 4" ground="S"><color symbol="M" value="aa3333"/><all in="B S" out="M S"/></sequence>');
    expect(hash(inc.grid)).toBe(hash(inline.grid));
    const m = compileMjx('<sequence values="BS" size="7 7 4" ground="S"><import file="merli"/></sequence>', { files });
    // Its letters and colours come with it; its ground, a thing of its own box, does not (a warning).
    expect(m.program.palette.M.color).toBe('#aa3333');
    expect(m.warnings.join(' ')).toMatch(/models\/merli\.xml.*ground/);
    // The program's own colour wins.
    expect(compileMjx('<sequence values="BS" size="7 7 4"><color symbol="M" value="00ff00"/><import file="merli"/></sequence>', { files }).program.palette.M.color).toBe('#00ff00');
  });

  it('un file che manca, un ciclo, troppa profondità, troppe inclusioni, un percorso: errori col motivo', () => {
    const prog = (f: string) => `<sequence values="BW" size="3 3 3"><import file="${f}"/></sequence>`;
    expect(() => compileMjx(prog('assente'))).toThrow(/manca il file models\/assente\.xml/);
    const cycle = { 'a.xml': prog('b'), 'b.xml': prog('a') };
    expect(() => compileMjx(prog('a'), { files: cycle })).toThrow(/ciclo di inclusione: a → b → a/);
    expect(() => compileMjx(prog('a'), { files: cycle, self: 'a' })).toThrow(/ciclo di inclusione: a → a/);
    const deep: Record<string, string> = {};
    for (let i = 0; i < MJX_INCLUDE_DEPTH + 2; i++) deep[`p${i}.xml`] = prog(`p${i + 1}`);
    deep[`p${MJX_INCLUDE_DEPTH + 2}.xml`] = '<one values="BW" in="B" out="W"/>';
    expect(() => compileMjx(prog('p0'), { files: deep })).toThrow(/troppe inclusioni una dentro l'altra/);
    // Each one three times, four deep: 121 inclusions.
    const wide: Record<string, string> = { 'w4.xml': '<one values="BW" in="B" out="W" steps="1"/>' };
    for (let i = 0; i < 4; i++) wide[`w${i}.xml`] = `<sequence values="BW">${`<import file="w${i + 1}"/>`.repeat(3)}</sequence>`;
    expect(1 + 3 + 9 + 27 + 81).toBeGreaterThan(MJX_INCLUDE_COUNT);
    expect(() => compileMjx(prog('w0'), { files: wide })).toThrow(/troppe inclusioni \(al più/);
    for (const bad of ['../x', 'x.xml', 'a/b', '..', '', 'C:x'])
      expect(() => compileMjx(prog(bad), { files: { [`${bad}.xml`]: prog('z'), 'x.xml.xml': prog('z') } }), bad).toThrow(/nome semplice/);
    expect(() => compileMjx('<sequence values="BW" size="3 3 3"><import file="rotto"/></sequence>', { files: { 'rotto.xml': '<one values="BW" in="B"' } })).toThrow(/models\/rotto\.xml: XML/);
    expect(() => compileMjx(prog('m'), { files: { 'm.xml': '<one values="BW" in="B" out="W" symmetry="(ab)"/>' } })).toThrow(/models\/m\.xml, riga 1/);
  });

  it('fin, fout e file leggono un file di testo di models/, come gli attributi', () => {
    const attr = run('<one values="BWN" size="5 5 3" ground="W" in="B W" out="N W"/>');
    const files = { 'su.txt': '# sopra il pavimento\nB\nW\n', 'giu.txt': 'N W', 'coppia.txt': 'B\nW\n->\nN\nW\n' };
    expect(hash(run('<one values="BWN" size="5 5 3" ground="W" fin="su" fout="giu"/>', undefined, undefined, files).grid)).toBe(hash(attr.grid));
    expect(hash(run('<one values="BWN" size="5 5 3" ground="W"><rule file="coppia"/></one>', undefined, undefined, files).grid)).toBe(hash(attr.grid));
    expect(() => compileMjx('<one values="BWN" size="5 5 3" fin="su" in="B"/>', { files })).toThrow(/scritto in due modi/);
    expect(() => compileMjx('<one values="BWN" size="5 5 3" file="su"/>', { files })).toThrow(/riga con "->"/);
    expect(() => compileMjx('<one values="BWN" size="5 5 3" fin="nulla" fout="giu"/>', { files })).toThrow(/manca il file models\/nulla\.txt/);
  });

  it('mjxIncludes raccoglie ciò che un programma legge, anche dagli inclusi', () => {
    const disk: Record<string, string> = {
      'torre.xml': '<sequence values="BS"><import file="merli"/><one values="BS" fin="porta-in" fout="porta-out"/></sequence>',
      'merli.xml': '<sequence values="BSM"><all file="crepa"/></sequence>',
      'crepa.txt': 'B S\n->\nM S',
      'porta-in.txt': 'S',
      'porta-out.txt': 'B',
      'altro.xml': PARAPET,
    };
    const got = mjxIncludes('<sequence values="BS"><import file="torre"/><import file="assente"/><import file="../x"/></sequence>', (f) => disk[f]);
    expect(Object.keys(got).sort()).toEqual(['crepa.txt', 'merli.xml', 'porta-in.txt', 'porta-out.txt', 'torre.xml']);
    expect(mjxIncludes(PARAPET, (f) => disk[f])).toEqual({});
  });
});

describe('la cache delle forme e il validatore', () => {
  const library = (merli: string) => ({
    'models/index.json': JSON.stringify({ torre: { class: 'object' }, merli: { class: 'object' } }),
    'models/torre.xml': '<sequence values="BSM" size="7 7 4" ground="S"><import file="merli"/></sequence>',
    'models/merli.xml': merli,
    'models/pino.xml': '<sequence values="BG" size="3 3 3" ground="G"><one in="B G" out="G G" steps="2"/></sequence>',
  });

  it('cambiare un file incluso cambia la forma di chi lo include, e solo la sua', async () => {
    const forms = new Forms(new InlineRunner(new FormCache()));
    forms.load(library(PARAPET));
    const q = forms.request('torre', 1)!;
    expect(Object.keys(q.files ?? {})).toEqual(['merli.xml']);
    expect(forms.request('pino', 1)!.files).toBeUndefined();
    const torre = await forms.settled('torre', 1);
    const pino = forms.get('pino', 1)!;
    expect(torre?.status).toBe('ready');
    const solid = (g: { cells: Uint8Array }) => g.cells.filter((c) => c !== 0).length;
    expect(solid(torre!.result!.grid)).toBe(7 * 7 * 2);
    forms.load(library(PARAPET.replace('<all in="B S" out="M S"/>', '<one in="B S" out="M S" steps="3"/>')));
    const q2 = forms.request('torre', 1)!;
    expect(formKey(q2)).not.toBe(formKey(q));
    const torre2 = await forms.settled('torre', 1);
    expect(torre2!.key).not.toBe(torre!.key);
    expect(solid(torre2!.result!.grid)).toBe(7 * 7 + 3);
    expect(forms.get('pino', 1)!.key).toBe(pino.key);
    // A program that reads no file keeps its key as before (ADR-0108).
    expect(formKey(forms.request('pino', 1)!)).toBe(JSON.stringify(['1', null, null, null]) + library(PARAPET)['models/pino.xml']);
  });

  it('un include che manca torna col motivo; i file di regole si controllano', () => {
    expect(modelErrors('models/torre.xml', library(PARAPET)['models/torre.xml'])).toEqual([expect.stringMatching(/manca il file models\/merli\.xml/)]);
    expect(modelErrors('models/torre.xml', library(PARAPET)['models/torre.xml'], 8_000, undefined, { 'merli.xml': PARAPET })).toEqual([]);
    const v = new Validator({ check: () => undefined } as never);
    const disk: Record<string, string> = library(PARAPET);
    v.modelFile = (name) => disk[`models/${name}`];
    expect(v.validateFile('models/torre.xml', disk['models/torre.xml'])).toEqual([]);
    v.modelFile = () => undefined;
    expect(v.validateFile('models/torre.xml', disk['models/torre.xml']).join(' ')).toMatch(/manca il file models\/merli\.xml/);
    expect(v.validateFile('models/porta.txt', '# la porta\nB/S\n->\nS/S\n')).toEqual([]);
    expect(ruleFileErrors('models/porta.txt', 'B<S')[0]).toMatch(/riga 1: "<"/);
    expect(ruleFileErrors('models/porta.txt', 'B\n->\nS\n->\nS')[0]).toMatch(/al più una riga/);
    expect(ruleFileErrors('models/porta.txt', '\n->\nS')[0]).toMatch(/pattern vuoto/);
    expect(ruleFileErrors('models/a.b.txt', 'B')[0]).toMatch(/nome/);
  });
});

describe('il laboratorio', () => {
  it('la torre merlata include i merli e legge la porta da un file; l\'editor colora il testo di <in> e <out>', async () => {
    const { byId, labIncludes } = await import('../lab/3d/catalog');
    const { highlightXml, validateMjx } = await import('../lab/editor/syntax');
    const torre = byId('torre-merlata')!;
    expect(Object.keys(torre.files ?? {}).sort()).toEqual(['merli.xml', 'torre-porta.txt']);
    expect(validateMjx(torre.xml).ok).toBe(false);
    const ok = validateMjx(torre.xml, undefined, labIncludes(torre.xml));
    expect(ok.ok).toBe(true);
    const r = runMjx(compileMjx(torre.xml, { files: torre.files }), 1);
    expect(r.finished).toBe(true);
    const count = (ch: string) => r.grid.cells.filter((c) => r.grid.alphabet[c] === ch).length;
    expect(count('M')).toBeGreaterThan(8);
    expect(count('K')).toBeGreaterThan(0);
    const html = highlightXml('<one><in>\n  # nota\n  B/S\n</in></one>', { colorChips: true });
    expect(html).toMatch(/data-letter="B" data-attr="in" data-pos="21"/);
    expect(html).not.toMatch(/data-letter="n"/);
  });
});
