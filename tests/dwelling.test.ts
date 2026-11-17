// The house that uses the Large (T413, ADR-0213): a dwelling that grows by rules gives the house the floor of its size. The kernel measures
// the covered floor of every storey as rooms (`storeyFloors`, as the Scenografo's bench measures it, `stanzeDi`) and the Sculptor's checks
// send back a dwelling under `DWELLING`; on the buildings of the bench: T406's (one room a storey, 5-6 tiles²) do not pass, the ones
// written with the new prompt (`lab/banco/scenografo/casa/`) and the offline country house do.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Bersaglio } from '../lab/banco/misure';
import { scena } from '../lab/banco/scenografo/scenografo';
import { stanzeDi } from '../lab/banco/scenografo/misura';
import { MOCK_STRUCTURE_PROGRAM } from '../src/kernel/ai/mockStructure';
import { checkProgram, describe as describeRequest, dwellingOf, filesOf, withMeaning } from '../src/kernel/agents/sculptor';
import { bundledFiles } from '../src/kernel/bundle';
import { walkIn } from '../src/kernel/forms';
import { SMALL_STOREY, storeyFloors } from '../src/kernel/interior';
import { dwellingErrors } from '../src/mj/check';
import { classOf, DWELLING, isDwelling } from '../src/mj/classes';

const structure = classOf('structure')!;
const SCENOGRAFO = path.resolve(__dirname, '../lab/banco/scenografo');
const grande = (nome: string): Bersaglio => ({ id: nome, nome, stile: '', descrizione: '', classe: 'structure', taglia: 'large', gioco: true });
const program = (dir: string, giro: string, nome: string) => path.join(SCENOGRAFO, dir, 'vuoto/claude-opus-5-5', giro, `${nome}-large`, 'programma.xml');
const read = (f: string) => fs.readFileSync(f, 'utf8');
/** The programs the bench keeps, as the game checks them: without the comment the Sculptor's answer starts with. */
const bare = (xml: string) => xml.replace(/^\s*<!--[\s\S]*?-->\s*/, '');

describe('which structures are dwellings (T413)', () => {
  it('a word of a house and none of a fort, a tower, a temple; Italian and English', () => {
    for (const c of ['villetta', 'una casa', 'fattoria', 'la cascina dei Rossi', 'una locanda sul passo', 'baita', 'farmhouse', 'a cottage by the river', 'Inn'])
      expect(isDwelling(c), c).toBe(true);
    for (const c of ['forte', 'una torre di guardia', 'casa-torre', 'tempio', 'la rocca', 'caserma', 'casamatta', 'mulino', 'a lighthouse', 'castle keep', 'temple', 'un ponte'])
      expect(isDwelling(c), c).toBe(false);
  });

  it('the request says it, or its concept does: a common house of the world is one whatever its words', () => {
    expect(dwellingOf({ nome: 'villetta' })).toBe(true);
    expect(dwellingOf({ nome: 'forte' })).toBe(false);
    expect(dwellingOf({ nome: 'muri di fango con tetti di paglia', dwelling: true })).toBe(true);
    expect(dwellingOf({ nome: 'una casa', dwelling: false })).toBe(false);
  });

  it("a dwelling's request says the floor it wants; a fort's does not", () => {
    const house = describeRequest({ id: 'struttura-villetta', nome: 'villetta', aspetto: 'villetta', classe: 'structure' }, structure);
    expect(house).toContain(`It is a dwelling (see «What fits»)`);
    expect(house).toContain(`At least ${DWELLING.floor} tiles² of covered floor`);
    expect(describeRequest({ id: 'struttura-forte', nome: 'forte', aspetto: 'forte', classe: 'structure' }, structure)).not.toContain('It is a dwelling');
  });
});

describe("a dwelling's floor (T413)", () => {
  const floor = (...rooms: number[]) => ({ cellar: false, rooms });

  it('passes with 10 tiles² on the ground floor and on another storey and two rooms below; a small attic does not count against it', () => {
    expect(dwellingErrors([floor(7, 4), floor(14)])).toEqual([]);
    expect(dwellingErrors([floor(7, 4), floor(12), floor(3)])).toEqual([]);
    // A cellar is not the ground floor.
    expect(dwellingErrors([{ cellar: true, rooms: [2] }, floor(7, 4), floor(14)])).toEqual([]);
  });

  it('says the floor of every storey and the rooms of the ground floor, with what it wants', () => {
    const [area, rooms] = dwellingErrors([floor(6.2), floor(6)]);
    expect(area).toMatch(/^casa: pavimento coperto 6,2 · 6,0 caselle² per piano, un'abitazione ne vuole almeno 10 al piano terra e a un altro piano/);
    expect(rooms).toMatch(/^casa: il piano terra ha una stanza sola \(6,2 caselle²\), un'abitazione vuole a terra almeno 2 stanze di 1,5 caselle²/);
    // A room under 1.5 tiles² is not the second room (the farm of T303: 4.75 + 1.06).
    expect(dwellingErrors([floor(10, 1.06), floor(11)])).toHaveLength(1);
    // The ground floor large enough, the storey above not.
    expect(dwellingErrors([floor(8, 4), floor(6)])[0]).toMatch(/12,0 · 6,0 caselle²/);
    expect(withMeaning(`taglia Grande, seme 1: ${area}`)).toMatch(/— a dwelling: the covered floor of each storey where the centre of a body stands/);
  });
});

describe('the measure of the kernel is the bench’s (T413)', () => {
  for (const [dir, nome] of [['misura16', 'villetta'], ['misura16', 'fattoria'], ['misura', 'fattoria']] as const)
    it(`${nome} of ${dir === 'misura16' ? 'T406' : 'T303'}, read at 16: the same rooms storey by storey as \`stanzeDi\``, () => {
      for (const seme of [1, 3]) {
        const s = scena(read(program(dir, 'giro1', nome)), grande(nome), seme, { piccolo: SMALL_STOREY, coperto: true });
        const vpt = s.e.scatola.vpt;
        const floors = storeyFloors(walkIn(s.e.result.grid, s.e.model.program.palette, vpt, s.e.scatola.base, s.e.model.actions, seme), vpt, s.e.scatola.base);
        const bench = stanzeDi(s);
        expect(floors.map((f) => f.rooms.map((r) => r.toFixed(3)))).toEqual(floors.map((_, k) => bench.filter((r) => r.piano === k).map((r) => r.caselle.toFixed(3))));
      }
    }, 60_000);
});

describe("the Sculptor's checks on the bench's buildings (T413)", () => {
  it("T406's country house and farm do not pass as dwellings (one room a storey, 4.5-6.2 tiles²); as something else they do", () => {
    for (const nome of ['villetta', 'fattoria']) {
      const xml = bare(read(program('misura16', 'giro1', nome)));
      const c = checkProgram(xml, structure, undefined, filesOf(xml, bundledFiles), { dwelling: true });
      expect(c.error).toMatch(/^taglia Grande, seme 1: casa: pavimento coperto \d,\d · \d,\d caselle² per piano/);
      expect(c.error).toMatch(/casa: il piano terra ha una stanza sola/);
      expect(checkProgram(xml, structure, undefined, filesOf(xml, bundledFiles)).error).toBeUndefined();
    }
  }, 120_000);

  it('the offline country house passes as a dwelling at every seed and at the next size', () => {
    const c = checkProgram(MOCK_STRUCTURE_PROGRAM, structure, undefined, filesOf(MOCK_STRUCTURE_PROGRAM, bundledFiles), { dwelling: true });
    expect(c.error).toBeUndefined();
  }, 120_000);

  const casa = path.join(SCENOGRAFO, 'casa/vuoto/claude-opus-5-5');
  for (const giro of fs.existsSync(casa) ? fs.readdirSync(casa).filter((g) => /^giro\d+$/.test(g)) : [])
    for (const nome of ['villetta', 'fattoria']) {
      const f = program('casa', giro, nome);
      if (!fs.existsSync(f)) continue;
      it(`${nome} of T413 (${giro}), written with the new prompt: passes as a dwelling`, () => {
        const xml = bare(read(f));
        expect(checkProgram(xml, structure, undefined, filesOf(xml, bundledFiles), { dwelling: true }).error).toBeUndefined();
      }, 120_000);
    }
});
