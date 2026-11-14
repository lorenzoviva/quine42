// The symbols of MarkovJunior (T342, ADR-0175): a letter or `#` and a number, greedy (`#12A` is two, `#1#2` two); a digit alone and a
// `#` without a number are errors of the compiler with the reason. More than the 52 letters in a program, up to the engine's ceiling;
// the engine reads `#3` as it read `3`, so a program of before, ported, is the same program. The migration 0.5 → 0.6 ports every
// program of a universe, idempotent, and the handmade cards of 0.5 with it.

import { describe, expect, it } from 'vitest';
import { MAX_CODES, run } from '../src/mj/engine';
import { compileMjx, patternText } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import { hashDigits, isNoteLine, MAX_SYMBOL_NUMBER, MAX_SYMBOLS, numberedSymbol, readSymbols, showSymbols, symbolName, symbolOf, symbolTokens, symbolTexts } from '../src/mj/symbols';
import { traceText } from '../src/mj/trace';
import { migrateUniverse, MIGRATIONS, patternFileFor0_6, portedProgram, programFor0_6 } from '../src/kernel/migrations';
import { readHandmadeCard } from '../src/kernel/handmade';
import { ruleFileErrors } from '../src/kernel/validator';
import { checkKernelVersion, KERNEL_CONTRACT, KERNEL_VERSION } from '../src/kernel/version';
import { countColorSymbolOccurrences, getPaletteSymbols, parsePattern3D, refactorColorSymbol } from '../lab/editor/rules';
import { highlightXml } from '../lab/editor/syntax';
import type { FileMap } from '../src/kernel/types';

const json = (s: string | undefined) => JSON.parse(s ?? 'null');

describe('the symbols of a program', () => {
  it('a symbol is a letter or # and a number, read greedily', () => {
    expect(symbolTexts('#12A')).toEqual(['#12', 'A']);
    expect(symbolTexts('#1#2')).toEqual(['#1', '#2']);
    expect(symbolTexts('A#0b#255*/[B#7]')).toEqual(['A', '#0', 'b', '#255', '*', '/', '[', 'B', '#7', ']']);
    expect(readSymbols('#12A').length).toBe(2);
    expect(readSymbols('#1#2')).toBe('12');
    // The engine's characters: the letters themselves, #0-#9 the digits, then the private use area.
    expect(numberedSymbol(3)).toBe('3');
    expect(numberedSymbol(10)).not.toBe(numberedSymbol(1) + numberedSymbol(0));
    expect(numberedSymbol(10).length).toBe(1);
    for (const n of [0, 9, 10, 99, 255, MAX_SYMBOL_NUMBER]) expect(symbolName(numberedSymbol(n))).toBe(`#${n}`);
    expect(showSymbols(readSymbols('A#12 B/#3*'))).toBe('A#12 B/#3*');
    expect(symbolOf('#12')).toBe(numberedSymbol(12));
    expect(symbolOf('C')).toBe('C');
    for (const no of ['3', '#', '#07', 'AB', '', '?', `#${MAX_SYMBOL_NUMBER + 1}`]) expect(symbolOf(no)).toBeUndefined();
  });

  it('a digit alone, a # without a number, zeros in front and numbers out of range do not read, with the reason', () => {
    expect(() => readSymbols('A3')).toThrow(/la cifra "3" da sola non è un simbolo.*#3/);
    expect(() => readSymbols('A#B')).toThrow(/"#" senza numero/);
    expect(() => readSymbols('#07')).toThrow(/zeri davanti/);
    expect(() => readSymbols(`#${MAX_SYMBOL_NUMBER + 1}`)).toThrow(new RegExp(`da #0 a #${MAX_SYMBOL_NUMBER}`));
    expect(symbolTokens('B3').map((t) => !!t.error)).toEqual([false, true]);
    const src = (values: string, rest = '') => `<sequence values="${values}" size="4 4 1">${rest}<one in="B" out="W" steps="1"/></sequence>`;
    expect(() => compileMjx(src('BW3'))).toThrow(/values: la cifra "3" da sola non è un simbolo/);
    expect(() => compileMjx(src('BW#'))).toThrow(/values: "#" senza numero/);
    expect(() => compileMjx(`<sequence values="BW" size="4 4 1"><one in="B" out="1" steps="1"/></sequence>`)).toThrow(/out: la cifra "1"/);
    expect(() => compileMjx(src('BW', '<union symbol="1" values="BW"/>'))).toThrow(/symbol: la cifra "1"/);
    expect(() => compileMjx(src('BW', '<union symbol="#" values="BW"/>'))).toThrow(/symbol: "#" senza numero/);
    expect(() => compileMjx(src('BW', '<color symbol="2" value="ff0000"/>'))).toThrow(/symbol: la cifra "2"/);
    // The strict compiler of MarkovJunior's own programs says the same.
    expect(() => compileMjx(src('BW3'), { strict: true })).toThrow(/la cifra "3"/);
  });

  it('a numbered symbol is a symbol everywhere a letter is: values, patterns, unions, colours, the nodes', () => {
    const m = compileMjx(`<sequence values="B#12W" size="5 5 1" origin="True">
      <color symbol="#12" value="ff0000" glow="True"/>
      <color symbol="#3" value="00ff00"/>
      <union symbol="#7" values="#12W"/>
      <one in="#12B" out="#12#12" steps="2"/>
      <all in="#7B" out="*#3" steps="1"/>
      <box at="0 0 0" size="1 1 1" color="#3" on="B"/>
    </sequence>`);
    const twelve = numberedSymbol(12);
    expect(m.program.origin).toBe(twelve);
    expect(m.program.palette[twelve]).toMatchObject({ color: '#ff0000', glow: true });
    expect(m.program.unions?.[numberedSymbol(7)]).toBe(`${twelve}W`);
    const r = runMjx(m, 1);
    expect(r.grid.alphabet).toContain(twelve);
    expect(r.grid.alphabet).toContain(numberedSymbol(3));
    // What says a symbol to a person says it as the program writes it.
    const t = traceText(m, 1);
    expect(t).toContain('#12');
    expect(t).not.toContain(twelve);
  });

  it('a program with more than 36 symbols, and more than the 52 letters', () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const numbered = Array.from({ length: 100 }, (_, n) => `#${n}`);
    const values = ['B', ...letters.replace('B', ''), ...numbered];
    expect(values.length).toBe(152);
    // A line of cells, each one the next symbol: a rule per symbol writes the next one to its right.
    const rules = values.slice(1, -1).map((s, i) => `<rule in="${s}B" out="*${values[i + 2]}"/>`).join('');
    const colours = numbered.map((s, n) => `<color symbol="${s}" value="${(n * 2).toString(16).padStart(2, '0')}8040"/>`).join('');
    const m = compileMjx(`<sequence values="${values.join('')}" size="151 1 1" symmetry="()">${colours}<box at="0 0 0" size="1 1 1" color="A"/><all>${rules}</all></sequence>`);
    const r = run(m.program, 1, 20_000, { side: 256, cells: 4096 });
    expect(r.finished).toBe(true);
    const row = Array.from(r.grid.cells, (c) => symbolName(r.grid.alphabet[c]));
    expect(row).toEqual(values.slice(1));
  });

  it('the engine holds at most MAX_SYMBOLS symbols besides the empty cell, and says so', () => {
    expect(MAX_CODES).toBe(MAX_SYMBOLS + 1);
    const values = (n: number) => `B${Array.from({ length: n }, (_, k) => `#${k}`).join('')}`;
    const prog = (n: number) => `<sequence values="${values(n)}" size="2 2 1">${Array.from({ length: n }, (_, k) => `<color symbol="#${k}" hidden="True"/>`).join('')}<one in="B" out="#0" steps="1"/></sequence>`;
    expect(() => compileMjx(prog(MAX_SYMBOLS))).not.toThrow();
    expect(() => compileMjx(prog(MAX_SYMBOLS + 1))).toThrow(new RegExp(`troppi simboli: ${MAX_SYMBOLS + 1} oltre la cella vuota.*al più ${MAX_SYMBOLS}`));
  });

  it('in a text, a line that starts with # and a number is a row, one with # and no number a note', () => {
    expect(isNoteLine('# the roof')).toBe(true);
    expect(isNoteLine('  #roof')).toBe(true);
    expect(isNoteLine('#12AB')).toBe(false);
    expect(patternText('# a note\n#12AB/\nB#12B')).toBe('#12AB/B#12B');
    expect(ruleFileErrors('models/fila.txt', '# a note\n#12A\n->\nA#12')).toEqual([]);
    expect(ruleFileErrors('models/fila.txt', 'A3\n->\nAA').join()).toMatch(/riga 1: la cifra "3"/);
    const m = compileMjx(`<sequence values="BA#12" size="3 1 1" symmetry="()"><color symbol="#12" value="ff0000"/><one steps="1"><in>
      # the in side, a note
      BBB
    </in><out>#12A#12</out></one></sequence>`);
    const r = run(m.program, 1);
    expect(Array.from(r.grid.cells, (c) => symbolName(r.grid.alphabet[c])).join('')).toBe('#12A#12');
  });

  it('wfc and convchain read numbered symbols in their tiles and samples', () => {
    const tileset = `<tileset values="#0#5"><tiles><tile name="Empty">#0#0/#0#0</tile><tile name="Full">#5#5/#5#5</tile></tiles>
      <neighbors><neighbor left="Empty" right="Empty"/><neighbor left="Full" right="Full"/><neighbor left="Empty" right="Full"/><neighbor top="Empty" bottom="Empty"/><neighbor top="Full" bottom="Full"/><neighbor top="Empty" bottom="Full"/></neighbors></tileset>`;
    const m = compileMjx(`<sequence values="BW" size="2 2 1"><color symbol="#0" hidden="True"/><color symbol="#5" value="ffffff"/><wfc tileset="piastre" values="#0#5"><rule in="B" out="Full"/><rule in="W" out="Empty"/></wfc></sequence>`, { files: { 'piastre.xml': tileset } });
    const r = run(m.program, 1);
    expect(r.finished).toBe(true);
    expect(new Set(Array.from(r.grid.cells, (c) => symbolName(r.grid.alphabet[c])))).toEqual(new Set(['#5']));
    const c = compileMjx(`<sequence values="B#1#2" size="8 8 1"><color symbol="#1" value="000000"/><color symbol="#2" value="ffffff"/><convchain sample="campione" n="2" on="B" black="#1" white="#2" steps="2"/></sequence>`, {
      files: { 'campione.txt': '#1#2#1#2/#2#1#2#1/#1#2#1#2/#2#1#2#1' },
    });
    const node = (c.program.program as unknown as { children: Array<{ type: string; sample: string }> }).children[0];
    expect(node.type).toBe('convchain');
    expect(node.sample).toBe('0101101001011010');
  });
});

describe('the port of a program of 0.5 (programFor0_6)', () => {
  const OLD = `<!-- a program of 0.5: digits are symbols -->
<sequence values="B12W" size="6 6 6" origin="True" ground="2" soil="1">
  <union symbol="3" values="12"/>
  <color symbol="1" value="aa2200"/><color symbol="2" value="00aa22" name="erba 2"/>
  <one in="3B" out="*1" steps="3" p="0.5"/>
  <rule in="1/2" out="2/1"/>
  <one><in>
    # a note with 3 in it
    12
  </in><out>21</out></one>
  <path from="1" to="2" on="B" color="W" steps="4"/>
  <line at="1 1 1" to="2 3 4" r="1" color="2"/>
  <box at="3 3 0" size="2 2 2" color="1" on="B2"/>
  <convolution neighborhood="Moore"><rule in="B" out="1" values="12" sum="5..8"/></convolution>
  <map scale="2 2 2" values="B1"><rule in="1" out="11/11 11/11"/></map>
  <wfc tileset="t3" values="B1"><rule in="1" out="Tile2|Line3"/></wfc>
  <wfc sample="s2" values="B12"><rule in="1" out="1|2"/></wfc>
  <one in="1" out="2"><field for="1" to="2" on="B"/><observe value="1" from="2" to="12"/></one>
  <convchain sample="c1" on="B" black="1" white="2"/>
  <animation name="fuoco4" frames="4"><prl in="1" out="2" p="0.3" steps="1"/></animation>
</sequence>`;
  const NEW = programFor0_6(OLD);

  it('writes # before every digit where a symbol stands, and nowhere else', () => {
    expect(NEW).toContain('values="B#1#2W" size="6 6 6" origin="True" ground="#2" soil="#1"');
    expect(NEW).toContain('<union symbol="#3" values="#1#2"/>');
    expect(NEW).toContain('<color symbol="#1" value="aa2200"/><color symbol="#2" value="00aa22" name="erba 2"/>');
    expect(NEW).toContain('<one in="#3B" out="*#1" steps="3" p="0.5"/>');
    expect(NEW).toContain('<rule in="#1/#2" out="#2/#1"/>');
    expect(NEW).toContain('# a note with 3 in it\n    #1#2\n  </in><out>#2#1</out>');
    expect(NEW).toContain('<path from="#1" to="#2" on="B" color="W" steps="4"/>');
    expect(NEW).toContain('<line at="1 1 1" to="2 3 4" r="1" color="#2"/>');
    expect(NEW).toContain('<box at="3 3 0" size="2 2 2" color="#1" on="B#2"/>');
    expect(NEW).toContain('<rule in="B" out="#1" values="#1#2" sum="5..8"/>');
    expect(NEW).toContain('<map scale="2 2 2" values="B#1"><rule in="#1" out="#1#1/#1#1 #1#1/#1#1"/></map>');
    // A wfc's tiles are names, its file names too; a sample's out is symbols.
    expect(NEW).toContain('<wfc tileset="t3" values="B#1"><rule in="#1" out="Tile2|Line3"/></wfc>');
    expect(NEW).toContain('<wfc sample="s2" values="B#1#2"><rule in="#1" out="#1|#2"/></wfc>');
    expect(NEW).toContain('<field for="#1" to="#2" on="B"/><observe value="#1" from="#2" to="#1#2"/>');
    expect(NEW).toContain('<convchain sample="c1" on="B" black="#1" white="#2"/>');
    expect(NEW).toContain('<animation name="fuoco4" frames="4"><prl in="#1" out="#2" p="0.3" steps="1"/></animation>');
    expect(NEW).toContain('<!-- a program of 0.5: digits are symbols -->');
  });

  it('is idempotent, and leaves a program without digits as it is', () => {
    expect(programFor0_6(NEW)).toBe(NEW);
    const plain = '<sequence values="BW" size="3 3 3"><one in="B" out="W" steps="1"/></sequence>';
    expect(programFor0_6(plain)).toBe(plain);
    expect(patternFileFor0_6('# note 1\n12A\n->\nA21\n')).toBe('# note 1\n#1#2A\n->\nA#2#1\n');
    expect(patternFileFor0_6(patternFileFor0_6('12A\n->\nA21'))).toBe('#1#2A\n->\nA#2#1');
    expect(hashDigits('#12 3#4')).toBe('#12 #3#4');
  });

  it('a union "#" of before takes a sign the program does not use', () => {
    const old = '<sequence values="BWN1" size="4 4 1"><union symbol="#" values="WN"/><union symbol="~" values="B1"/><one in="#~" out="*1" steps="1"/></sequence>';
    const port = programFor0_6(old);
    expect(port).toBe('<sequence values="BWN#1" size="4 4 1"><union symbol="^" values="WN"/><union symbol="~" values="B#1"/><one in="^~" out="*#1" steps="1"/></sequence>');
    expect(programFor0_6(port)).toBe(port);
  });

  it('the engine gets the same program from the port as the compiler of 0.5 gave from the original', () => {
    // A program of 0.5 whose digits are symbols, compiled by hand into what 0.5 handed the engine: the digits were its characters.
    const old = '<sequence values="B1W2" size="5 5 3" origin="True"><color symbol="1" value="aa0000"/><color symbol="2" value="00aa00"/><union symbol="?" values="1W"/><all in="?B" out="*2" steps="2"/><one in="1 B" out="* 1" steps="2"/></sequence>';
    const m = compileMjx(programFor0_6(old));
    expect(Object.keys(m.program.palette)).toEqual(['1', '2', 'W']);
    expect(m.program.origin).toBe('1');
    expect(m.program.unions).toEqual({ '?': '1W' });
    expect(JSON.stringify(m.program.program)).toBe(JSON.stringify({ type: 'sequence', children: [
      { type: 'all', rules: [{ in: '?.', out: '*2' }], steps: 2, symmetry: 'all' },
      { type: 'one', rules: [{ in: '. 1', out: '1 *' }], steps: 2, symmetry: 'all' },
    ] }));
  });
});

describe('the migration 0.5 → 0.6', () => {
  const universe05 = (): FileMap => ({
    'universe.json': JSON.stringify({ name: 'vecchio', kernel: '0.5.10', kernels: { from: '0.5' }, seed: 1 }, null, 2) + '\n',
    'models/index.json': JSON.stringify({ lanterna: { class: 'object', tint: '3' }, botte: { class: 'object', tint: 'C' } }, null, 2) + '\n',
    'models/lanterna.xml': '<sequence values="B3W" size="4 4 4"><color symbol="3" value="ffcc00" glow="True"/><one in="B" out="3" steps="1" fin="fila"/></sequence>',
    'models/fila.txt': '# the side of a rule\n3B\n',
    'modules/obj.lume/manifest.json': JSON.stringify({ id: 'obj.lume', name: 'Lume 3', kind: 'entity' }),
  });
  const { files, applied } = migrateUniverse(universe05());

  it('is the fifth migration of the chain, and the universe runs on this kernel', () => {
    expect(MIGRATIONS.map((m) => `${m.from}→${m.to}`).slice(-2)).toEqual(['0.5→0.6', '0.6→0.7']);
    expect(applied).toHaveLength(2);
    expect(applied[0]).toMatch(/^0\.5→0\.6: i simboli dei programmi MarkovJunior/);
    const cfg = json(files['universe.json']);
    expect(cfg).toMatchObject({ kernel: KERNEL_VERSION, kernels: { from: KERNEL_CONTRACT } });
    expect(checkKernelVersion(cfg.kernel, KERNEL_VERSION, cfg.kernels).ok).toBe(true);
  });

  it('ports every program, its text files and the tints; nothing else', () => {
    expect(files['models/lanterna.xml']).toBe('<sequence values="B#3W" size="4 4 4"><color symbol="#3" value="ffcc00" glow="True"/><one in="B" out="#3" steps="1" fin="fila"/></sequence>');
    expect(files['models/fila.txt']).toBe('# the side of a rule\n#3B\n');
    expect(json(files['models/index.json'])).toEqual({ lanterna: { class: 'object', tint: '#3' }, botte: { class: 'object', tint: 'C' } });
    expect(files['modules/obj.lume/manifest.json']).toBe(universe05()['modules/obj.lume/manifest.json']);
  });

  it('is idempotent: the same files give the same files, a universe of 0.6 stays as it is, and its programs too', () => {
    expect(migrateUniverse(universe05()).files).toEqual(files);
    expect(migrateUniverse(files).applied).toEqual([]);
    for (const p of ['models/lanterna.xml']) expect(programFor0_6(files[p])).toBe(files[p]);
    expect(patternFileFor0_6(files['models/fila.txt'])).toBe(files['models/fila.txt']);
  });
});

describe('the handmade cards of 0.5', () => {
  const card = (kernel: string, xml: string) => ({ id: 'handmade-abcdefghij', kind: 'model', class: 'object', name: 'Lume', xml, kernel, author: 'me', made: '2026-11-01T00:00:00Z', changed: '2026-11-01T00:00:00Z' });

  it('read in this contract, their program through the same port', () => {
    const c = readHandmadeCard(card('0.5', '<sequence values="B1" size="2 2 2"><color symbol="1" value="ff0000"/><one in="B" out="1" steps="1"/></sequence>'))!;
    expect(c.kernel).toBe(KERNEL_CONTRACT);
    expect(c.xml).toBe('<sequence values="B#1" size="2 2 2"><color symbol="#1" value="ff0000"/><one in="B" out="#1" steps="1"/></sequence>');
    // A card of this contract stays as it is; one of a contract after this kernel's is not read as this one's.
    const now = readHandmadeCard(card(KERNEL_CONTRACT, c.xml))!;
    expect(now.xml).toBe(c.xml);
    expect(portedProgram('<x values="B1"/>', '9.9')).toEqual({ xml: '<x values="B1"/>', contract: '9.9' });
    // A card of 0.4 stays of 0.4, as it stayed in 0.5 (ADR-0161): the step 0.4 → 0.5 does not carry programs alone.
    expect(readHandmadeCard(card('0.4', '<x values="B1"/>'))).toMatchObject({ kernel: '0.4', xml: '<x values="B1"/>' });
  });
});

describe('the editor of the lab reads numbered symbols', () => {
  const xml = '<sequence values="B#12W" size="4 4 4"><color symbol="#12" value="ff0000" name="mattone"/><one in="B#12" out="*#12" steps="1"/><box at="1 1 0" size="1 1 1" color="#12"/></sequence>';

  it('the palette, the count and the renaming of a symbol', () => {
    expect(getPaletteSymbols(xml).map((s) => s.symbol)).toEqual(['#12', 'B', 'W']);
    expect(countColorSymbolOccurrences(xml, '#12')).toMatchObject({ colorDecl: 1, valuesDecl: 1, rulePatterns: 2, shapesAndOther: 1 });
    expect(countColorSymbolOccurrences(xml, '#1').total).toBe(0);
    const r = refactorColorSymbol(xml, '#12', '#4');
    expect(r.newXml).toBe(xml.replaceAll('#12', '#4'));
    expect(refactorColorSymbol(xml, '#1', '#4').count).toBe(0);
  });

  it('a chip per symbol, and the 3D filter cell per symbol', () => {
    const html = highlightXml(xml, { colorChips: true, palette: { '#12': { color: '#ff0000', name: 'mattone' } } });
    expect(html).toContain('data-letter="#12"');
    expect(parsePattern3D('B#12/#3B').layers).toEqual([[['B', '#12'], ['#3', 'B']]]);
  });
});
