// The nodes of T333-T335 in the world (T336, ADR-0176): the validator takes them within `WORLD_NODE_LIMITS` (cells and bytes of a wave,
// tries, the states of a search, convchain's steps, files read and imports one inside the other), a tileset of models/ is validated as a
// wfc would read it, the ceilings of a run change nothing below them, the handmade cards and the Sculptor want the same, and the offline
// Sculptor has a program that uses them.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { run } from '../src/mj/engine';
import { compileMjx, mjxIncludes } from '../src/mj/model';
import { FORM_LIMITS } from '../src/mj/run';
import { importDepth, isTileset, modelErrors, tilesetErrors, Validator, WORLD_NODE_LIMITS, worldNodeErrors } from '../src/kernel/validator';
import { handmadeProgramErrors } from '../src/kernel/handmade';
import { checkProgram, libraryResources, sculpt } from '../src/kernel/agents/sculptor';
import { MOCK_FIELD_PROGRAM, MockAiModels } from '../src/kernel/ai/mock';
import { Council } from '../src/kernel/agents/council';
import { classOf } from '../src/mj/classes';
import { newNodesIn } from '../src/mj/model';

const DAMA = `<tileset values="BXY">
  <tiles><tile name="X">X</tile><tile name="Y" weight="3">Y</tile></tiles>
  <neighbors>
    <neighbor left="X" right="X"/><neighbor left="Y" right="Y"/>
    <neighbor top="X" bottom="X"/><neighbor top="Y" bottom="Y"/>
  </neighbors>
</tileset>`;
const official = (name: string) => fs.readFileSync(`lab/mjx/official/${name}.xml`, 'utf8');
const resources = (xml: string) => mjxIncludes(xml, (f) => (fs.existsSync(`lab/mjx/official/resources/${f}`) ? fs.readFileSync(`lab/mjx/official/resources/${f}`, 'utf8') : undefined));

describe('i tetti del mondo (WORLD_NODE_LIMITS)', () => {
  it('una wfc dice i suoi tries, una ricerca il suo limit, una convchain i suoi steps e il suo n', () => {
    const wfc = (attrs: string) => compileMjx(`<sequence values="BW" size="3 3 1"><all in="B" out="W"/><wfc values="BAC" tileset="dama"${attrs}><rule in="W" out="X|Y"/></wfc></sequence>`, { files: { 'dama.xml': DAMA } });
    expect(worldNodeErrors(wfc('')).join()).toMatch(/tries da 1 a 100 \(scritto/);
    expect(worldNodeErrors(wfc(' tries="500"')).join()).toMatch(/non 500/);
    expect(worldNodeErrors(wfc(' tries="20"'))).toEqual([]);
    const search = (limit: string) => compileMjx(`<one values="BR" size="5 1 1" in="RB" out="BR" search="True"${limit}><observe value="R" to="B"/></one>`);
    expect(worldNodeErrors(search('')).join()).toMatch(/search nel mondo vuole limit da 1 a 2000/);
    expect(worldNodeErrors(search(' limit="3000"')).join()).toMatch(/non 3000/);
    expect(worldNodeErrors(search(' limit="100"'))).toEqual([]);
    const chain = (attrs: string) => compileMjx(`<sequence values="BAD" size="4 4 1"><convchain sample="c" on="B" black="D" white="A"${attrs}/></sequence>`, { files: { 'c.txt': 'AD/DA' } });
    expect(worldNodeErrors(chain('')).join()).toMatch(/convchain nel mondo vuole steps/);
    expect(worldNodeErrors(chain(' steps="5" n="4"')).join()).toMatch(/n fino a 3/);
    expect(worldNodeErrors(chain(' steps="5" n="2"'))).toEqual([]);
  });

  it('ciò che sta dentro pieces conta come il resto (T339, ADR-0177)', () => {
    const chain = (attrs: string) =>
      compileMjx(`<sequence values="BAD" size="8 8 1"><pieces piece="4" margin="2"><convchain sample="c" on="B" black="D" white="A"${attrs}/></pieces></sequence>`, { files: { 'c.txt': 'AD/DA' } });
    expect(worldNodeErrors(chain('')).join()).toMatch(/convchain nel mondo vuole steps/);
    expect(worldNodeErrors(chain(' steps="5" n="4"')).join()).toMatch(/n fino a 3/);
    expect(worldNodeErrors(chain(' steps="5" n="2"'))).toEqual([]);
  });

  it('ciò che sta in un\'animazione o in un\'azione conta come il resto', () => {
    const m = compileMjx('<sequence values="BR" size="5 1 1"><all in="B" out="R" steps="1"/></sequence><action name="a" label="A"><one in="RB" out="BR" search="True"><observe value="R" to="B"/></one></action>');
    expect(worldNodeErrors(m).join()).toMatch(/search nel mondo/);
  });

  it('i file letti: quanti, quanto lunghi, gli import uno dentro l\'altro', () => {
    const files: Record<string, string> = {};
    for (let i = 0; i < WORLD_NODE_LIMITS.files + 1; i++) files[`r${i}.txt`] = 'B';
    const m = compileMjx('<one values="BW" size="2 2 2" in="B" out="W"/>');
    expect(worldNodeErrors(m, '', files).join()).toMatch(/legge 65 file/);
    expect(worldNodeErrors(m, '', { 'a.txt': 'B'.repeat(WORLD_NODE_LIMITS.fileChars + 1) }).join()).toMatch(/caratteri, nel mondo al più/);
    // a → b → c → d: four imports one inside the other, the world takes three.
    const chainOf = (n: number) => {
      const fs: Record<string, string> = {};
      for (let i = 0; i < n; i++) fs[`i${i}.xml`] = i === n - 1 ? '<all values="BW" in="B" out="W" steps="1"/>' : `<sequence values="BW"><import file="i${i + 1}"/></sequence>`;
      return fs;
    };
    const host = '<sequence values="BW" size="2 2 2"><import file="i0"/></sequence>';
    expect(importDepth(host, chainOf(3))).toBe(3);
    expect(importDepth(host, chainOf(4))).toBe(4);
    const deep = chainOf(4);
    expect(worldNodeErrors(compileMjx(host, { files: deep }), host, deep).join()).toMatch(/fino a 4, nel mondo al più 3/);
    const ok = chainOf(3);
    expect(worldNodeErrors(compileMjx(host, { files: ok }), host, ok)).toEqual([]);
  });

  it('l\'onda e i potenziali: oltre il tetto della corsa un errore che lo dice, sotto la stessa griglia', () => {
    const files = { 'dama.xml': DAMA };
    const xml = '<sequence values="BW"><all in="B" out="W"/><wfc values="BAC" tileset="dama" tries="5"><rule in="W" out="X|Y"/></wfc></sequence>';
    const big = compileMjx(xml, { size: [40, 40, 40], files });
    expect(() => run(big.program, 1, 100_000, FORM_LIMITS, { ceilings: WORLD_NODE_LIMITS })).toThrow(/nel mondo l'onda sta su al più 32768 celle/);
    const small = compileMjx(xml, { size: [12, 12, 6], files });
    const a = run(small.program, 3, 100_000, FORM_LIMITS);
    const b = run(small.program, 3, 100_000, FORM_LIMITS, { ceilings: WORLD_NODE_LIMITS });
    expect(b.finished).toBe(true);
    expect([...b.grid.cells]).toEqual([...a.grid.cells]);
    // A field on a big grid of many codes: its potentials past 32 MB.
    const field = compileMjx('<one values="BRG" in="RB" out="BR" steps="2"><field for="R" to="G" on="B"/></one>', { size: [512, 512, 40] });
    expect(() => run(field.program, 1, 10, { side: 512, cells: 12_000_000 }, { ceilings: { ...WORLD_NODE_LIMITS, potentialBytes: 1 << 20 } })).toThrow(/superano 1 MB/);
  });

  it('il validatore li prende: field, observe, wfc, convchain, import e regole da file entro i tetti', () => {
    const files = { 'dama.xml': DAMA };
    const xml = '<sequence values="BW" size="6 6 2"><all in="B" out="W"/><wfc values="BAC" tileset="dama" tries="10"><rule in="W" out="X|Y"/></wfc></sequence>';
    expect(newNodesIn(compileMjx(xml, { files }))).toEqual(['wfc']);
    expect(modelErrors('models/x.xml', xml, 8_000, undefined, files).join()).not.toMatch(/tries|ammess|nel mondo/);
    // The original's StairsPath (observe, search with limit 1000, rule files) passes the world's ceilings.
    const stairs = official('StairsPath');
    const sf = resources(stairs);
    expect(worldNodeErrors(compileMjx(stairs, { size: [33, 33, 33], files: sf }), stairs, sf)).toEqual([]);
  });

  it('un tileset di models/ si valida come lo leggerebbe una wfc', () => {
    expect(isTileset(DAMA)).toBe(true);
    expect(isTileset('<sequence values="BW"/>')).toBe(false);
    // Many comments before the root: a linear look, not an expression that backtracks (the library's models have dozens).
    const t0 = Date.now();
    expect(isTileset('<!-- a -->\n<!-- b -->\n'.repeat(400) + '<sequence values="BW"/>')).toBe(false);
    expect(isTileset('<?xml version="1.0"?>\n<!-- a -->\n' + DAMA)).toBe(true);
    expect(Date.now() - t0).toBeLessThan(200);
    expect(tilesetErrors('models/dama.xml', DAMA)).toEqual([]);
    expect(tilesetErrors('models/dama.xml', DAMA.replace('<tile name="Y" weight="3">Y</tile>', '<tile name="Y">YY/YY</tile>')).join()).toMatch(/la tessera Y è 2×2×1, le altre 1×1×1/);
    expect(tilesetErrors('models/dama.xml', DAMA.replace('left="X" right="X"', 'left="X" right="Z"')).join()).toMatch(/Z/);
    expect(tilesetErrors('models/../x.xml', DAMA).join()).toMatch(/un tileset è models/);
    // Tiles in files of their own: read through the validator's files.
    const own = '<tileset values="BX"><tiles><tile name="X"/></tiles><neighbors><neighbor left="X" right="X"/><neighbor top="X" bottom="X"/></neighbors></tileset>';
    expect(tilesetErrors('models/pieno.xml', own).join()).toMatch(/manca il file models\/pieno-X\.txt/);
    expect(tilesetErrors('models/pieno.xml', own, (f) => (f === 'pieno-X.txt' ? 'X' : undefined))).toEqual([]);
    for (const f of fs.readdirSync('lab/mjx/official/resources').filter((f) => f.endsWith('.xml'))) {
      const text = fs.readFileSync(`lab/mjx/official/resources/${f}`, 'utf8');
      expect(tilesetErrors(`models/${f}`, text, (x) => (fs.existsSync(`lab/mjx/official/resources/${x}`) ? fs.readFileSync(`lab/mjx/official/resources/${x}`, 'utf8') : undefined)), f).toEqual([]);
    }
    // The Validator's door: a tileset goes to tilesetErrors, not to the model's checks.
    const v = new Validator({ check: () => undefined } as never);
    expect(v.validateFile('models/dama.xml', DAMA)).toEqual([]);
  });
});

describe('le carte fatte a mano e lo Scultore vogliono gli stessi tetti', () => {
  it('una carta con un campo passa, una ricerca senza limit torna col motivo', () => {
    expect(handmadeProgramErrors({ kind: 'model', class: 'object', xml: MOCK_FIELD_PROGRAM })).toEqual([]);
    const searching = MOCK_FIELD_PROGRAM.replace('<one temperature="0.2" steps="60">', '<one steps="60" search="True">').replace('<field for="R" to="G" on="B"/>', '<observe value="R" to="W"/>');
    expect(handmadeProgramErrors({ kind: 'model', class: 'object', xml: searching }).join()).toMatch(/search nel mondo vuole limit/);
  });

  it('i controlli dello Scultore leggono i file dell\'universo e applicano i tetti', () => {
    const cls = classOf('object')!;
    const xml = '<sequence values="BW"><all in="B" out="W"/><wfc values="BAC" tileset="dama"><rule in="W" out="X|Y"/></wfc></sequence>';
    expect(checkProgram(xml, cls).error).toMatch(/manca il file models\/dama\.xml/);
    expect(checkProgram(xml, cls, undefined, { 'dama.xml': DAMA }).error).toMatch(/tries da 1 a 100/);
    expect(checkProgram(xml.replace('tileset="dama"', 'tileset="dama" tries="10"'), cls, undefined, { 'dama.xml': DAMA }).error).not.toMatch(/tries|manca il file/);
    expect(libraryResources({ 'models/dama.xml': DAMA, 'models/torre.xml': '<sequence values="BW"/>', 'models/porta.txt': 'B/W\n->\nW/B' })).toEqual(['- porta.txt: a rule (file="…")', '- tileset="dama" (its values "BXY"): tiles X, Y']);
  });

  it('lo Scultore offline, senza un programma della classe nella biblioteca, risponde con un campo', async () => {
    const council = new Council(new MockAiModels(), () => ({ files: { 'prompts/agents/sculptor.md': 'You are the Sculptor.' }, palette: {}, catalog: [] }) as never);
    const r = await sculpt(council, { id: 'muretto', nome: 'muretto', aspetto: 'un muretto che va verso un pozzo', classe: 'object' }, undefined, { semplici: 1, revisione: false, giudizio: false });
    expect(r?.xml).toMatch(/<field for="R" to="G" on="B"\/>/);
    const body = r!.xml.replace(/^\s*<!--[\s\S]*?-->\s*/, '');
    expect(modelErrors('models/muretto.xml', body)).toEqual([]);
  });
});
