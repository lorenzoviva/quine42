// The interiors' guard in the kernel (T409, ADR-0212): the plan and the stage of `src/kernel/interior.ts` and its guard, on the buildings of
// the Scenografo's measures (T303 at 20 voxels a tile, T406 at the game's 16) and the six of T259, and the key of a furnished building.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { bersaglio } from '../lab/banco/bersagli';
import type { Bersaglio } from '../lab/banco/misure';
import { arredaDati, arredaValidato, catalogo, confronta, regge, scena, type Scena } from '../lab/banco/scenografo/scenografo';
import { arredaNelKernel, compilaArredo, controlli, guardiaDelKernel, MOBILI, sceltaDi, type Regola } from '../lab/banco/scenografo/misura';
import { STRUTTURE } from '../lab/banco/suolo/strutture';
import { FormCache, formKey, furnishedResult, interiorKey, type FormRequest, type FormResult } from '../src/kernel/forms';
import { InteriorGuard, interiorPlan, SMALL_STOREY, STAGE, STAGE_ALPHABET, stageGrid, type InteriorPlan } from '../src/kernel/interior';

const LAB = path.resolve(__dirname, '../lab');
const SCENOGRAFO = path.join(LAB, 'banco/scenografo');
const OPZIONI = { piccolo: SMALL_STOREY, coperto: true };
const OFFLINE = fs.readFileSync(path.join(SCENOGRAFO, 'offline/programma.xml'), 'utf8');

const grande = (nome: string, gioco: boolean): Bersaglio => ({ id: nome, nome, stile: '', descrizione: '', classe: 'structure', taglia: 'large', ...(gioco ? { gioco } : {}) });
const misurato = (dir: string, nome: string) => fs.readFileSync(path.join(SCENOGRAFO, dir, 'vuoto/claude-opus-5-5/giro1', `${nome}-large`, 'programma.xml'), 'utf8');
const pianoDi = (s: Scena): InteriorPlan =>
  interiorPlan({ grid: s.e.result.grid, palette: s.e.model.program.palette, vpt: s.e.scatola.vpt, base: s.e.scatola.base, actions: s.e.model.actions, seed: s.seme, partsVpt: 16 });
/** What the Sculptor's checks say of the building empty: what furniture may not add to. */
const vuoto = (s: Scena) => controlli(s, { e: s.e, m: s.m, voxel: new Set() });

/** The offline program of the Scenografo on the stage of the kernel: it furnishes, holds, keeps the animals' floor and the Sculptor's parts. */
function arredaERegge(s: Scena): void {
  const m = compilaArredo(OFFLINE, [s.e.grid.X, s.e.grid.Y, s.e.grid.Z]);
  const a = arredaNelKernel(s, m, 1);
  expect(a.pezzi).toBeGreaterThan(0);
  expect(a.voxel.size).toBeGreaterThan(0);
  const c = confronta(s, a);
  expect(c).toMatchObject({ piani: [c.piani[0], c.piani[0]], porta: true, raggiunte: 1 });
  expect(regge(c)).toBe(true);
  const dopo = controlli(s, a);
  expect(dopo.animaliLiberi).toBe(1);
  expect(dopo.parti.filter((p) => !vuoto(s).parti.includes(p))).toEqual([]);
}

describe('la chiave di un edificio arredato (T409)', () => {
  const q: FormRequest = { xml: '<sequence values="BW"/>', seed: 3, vpt: 16, size: [10, 10, 10] };
  it("è un'altra voce da quella dell'edificio vuoto, e cambia con la via, il testo e il seme dell'arredo", () => {
    const k = interiorKey(q, { way: 'program', text: '<sequence values="BWF"/>', seed: 1 });
    expect(k).not.toBe(formKey(q));
    expect(k.startsWith('["interior"')).toBe(true);
    expect(formKey(q).startsWith('["interior"')).toBe(false);
    expect(k.endsWith(formKey(q))).toBe(true);
    const others = [
      interiorKey(q, { way: 'data', text: '<sequence values="BWF"/>', seed: 1 }),
      interiorKey(q, { way: 'program', text: '<sequence values="BWFA"/>', seed: 1 }),
      interiorKey(q, { way: 'program', text: '<sequence values="BWF"/>', seed: 2 }),
      interiorKey({ ...q, seed: 4 }, { way: 'program', text: '<sequence values="BWF"/>', seed: 1 }),
    ];
    expect(new Set([k, ...others]).size).toBe(5);
  });
  it("l'interno si fa una volta e si ritrova nella cache delle forme", () => {
    const cache = new FormCache();
    let made = 0;
    const make = (): FormResult => (made++, { grid: { X: 1, Y: 1, Z: 1, cells: new Uint8Array(1), alphabet: ['B'] }, palette: {}, actions: [], animations: [] });
    const interior = { way: 'data' as const, text: '{"rules":[]}', seed: 1 };
    const a = furnishedResult(cache, q, interior, make);
    const b = furnishedResult(cache, q, interior, make);
    expect(made).toBe(1);
    expect(b).toBe(a);
    expect(cache.get(formKey(q))).toBeUndefined();
  });
});

describe('il palco e la guardia degli interni nel kernel (T409)', () => {
  // The farm of T406 at 16, seed 3: the only seed with the animals' place under a roof.
  const fattoria = scena(misurato('misura16', 'fattoria'), grande('fattoria', true), 3, OPZIONI);

  it('il palco: le classi solo sul pavimento coperto, il posto degli animali, il protetto', () => {
    const plan = pianoDi(fattoria);
    expect(SMALL_STOREY).toBe(2);
    expect(plan.storeys.length).toBe(2);
    expect(plan.animalAreas.length).toBeGreaterThan(0);
    const st = stageGrid(plan);
    expect(st.alphabet).toEqual(STAGE_ALPHABET);
    const n = (ch: string) => st.cells.reduce((k, v) => k + (st.alphabet[v] === ch ? 1 : 0), 0);
    for (const ch of [STAGE.wall, STAGE.free, STAGE.kept, STAGE.animals]) expect(n(ch)).toBeGreaterThan(0);
    // Every floor class has something of the building above it: the yard and the fields are not furnished.
    const { X, Y, Z } = st;
    const XY = X * Y;
    for (let at = 0; at < st.cells.length; at++) {
      const ch = st.alphabet[st.cells[at]];
      if (ch !== STAGE.free && ch !== STAGE.animals && ch !== STAGE.cellar) continue;
      let up = Math.floor(at / XY) + 1;
      while (up < Z && !plan.built.cells[(at % XY) + up * XY]) up++;
      expect(up).toBeLessThan(Z);
    }
  }, 120_000);

  it('la guardia: niente sul muro né sul posto degli animali, niente che chiuda la porta', () => {
    const plan = pianoDi(fattoria);
    const XY = plan.X * plan.Y;
    const guard = new InteriorGuard(plan);
    expect(guard.roomSide).toBe(28);
    const wall = plan.built.cells.findIndex((c, i) => c !== 0 && Math.floor(i / XY) > plan.ground!.z);
    expect(guard.refusal([wall])).toBe('wall');
    const st = stageGrid(plan);
    const animal = st.cells.findIndex((c) => st.alphabet[c] === STAGE.animals);
    expect(guard.refusal([animal])).toBe('animals');
    // The stair filled: the storey above would be cut off.
    const [lo, hi] = [plan.storeys[0].z, plan.storeys[1].z];
    const stair = plan.walked.celle.filter((c) => c.z > lo + 4 && c.z < hi - 4).map((c) => c.x + c.y * plan.X + c.z * XY).filter((at) => !plan.built.cells[at] && !plan.walked.g.cells[at]);
    expect(stair.length).toBeGreaterThan(0);
    expect(guard.refusal(stair)).toBe('cut');
    // A refused piece leaves nothing: the same piece is refused again for the same reason, not as written on.
    expect(guard.refusal(stair)).toBe('cut');
  }, 120_000);
});

describe('la guardia del kernel sugli edifici dello Scenografo (T409)', () => {
  for (const { dir, gioco, semi } of [
    { dir: 'misura', gioco: false, semi: [1] },
    { dir: 'misura16', gioco: true, semi: [1, 3] },
  ])
    for (const nome of ['villetta', 'fattoria'])
      for (const seme of semi)
        it(`${nome} di ${dir === 'misura' ? 'T303 (a 20)' : 'T406 (a 16)'}, seme ${seme}: il programma offline sul palco del kernel regge`, () => {
          arredaERegge(scena(misurato(dir, nome), grande(nome, gioco), seme, OPZIONI));
        }, 120_000);

  const T259: Array<{ nome: string; file: string; b: Bersaglio }> = [
    { nome: 'palazzina', file: 'banco/riferimento/palazzina.xml', b: bersaglio('moderna')! },
    { nome: 'forte', file: 'banco/riferimento/forte.xml', b: bersaglio('rocca')! },
    { nome: 'tempio', file: 'banco/riferimento/tempio.xml', b: bersaglio('tempio')! },
    { nome: 'locanda', file: 'banco/suolo/locanda/1/corretta/modello.xml', b: bersaglio('locanda')! },
    { nome: 'officina', file: 'banco/riferimento/cantiere.xml', b: bersaglio('steampunk')! },
    { nome: 'laboratorio', file: 'banco/suolo/strutture/laboratorio.xml', b: STRUTTURE.find((s) => s.id === 'laboratorio')! },
  ];
  for (const ed of T259)
    it(`${ed.nome} di T259: il programma offline sul palco del kernel regge${ed.b.sotto ? ', la cantina resta' : ''}`, () => {
      const s = scena(fs.readFileSync(path.join(LAB, ed.file), 'utf8'), ed.b, 1);
      arredaERegge(s);
      // The locanda and the laboratory: a shelf beside the stair down took a storey away with the bench's guard; the walk of the kernel sees it.
      if (ed.b.sotto) expect(confronta(s, arredaNelKernel(s, compilaArredo(OFFLINE, [s.e.grid.X, s.e.grid.Y, s.e.grid.Z]), 1)).cantina[1]).toBeGreaterThan(0);
    }, 120_000);

  it('i dati di T406: la stanza dello Scultore non scende più sotto la misura (villetta seme 3, fattoria seme 4)', () => {
    const mobili = catalogo(16, MOBILI);
    for (const [nome, seme] of [['villetta', 3], ['fattoria', 4]] as const) {
      const s = scena(misurato('misura16', nome), grande(nome, true), seme, OPZIONI);
      const regole: Regola[] = JSON.parse(fs.readFileSync(path.join(SCENOGRAFO, 'misura16', nome, 'dati-1', 'regole.json'), 'utf8')).regole;
      expect(vuoto(s).parti).toEqual([]);
      // With the bench's guard (T406): the room under 28 voxels.
      const prima = arredaValidato(s, (k) => arredaDati(s, k, mobili, sceltaDi(s, regole)), 1);
      expect(controlli(s, prima.a).parti.join(' ')).toMatch(/^stanza/);
      // With the kernel's: the room kept, and everything holds.
      const dopo = arredaValidato(s, (k) => arredaDati(s, k, mobili, sceltaDi(s, regole), guardiaDelKernel), 1);
      expect(regge(dopo.c)).toBe(true);
      expect(dopo.a.pezzi).toBeGreaterThan(0);
      expect(controlli(s, dopo.a).parti).toEqual([]);
    }
  }, 240_000);

  it('i programmi di T406 sulla fattoria: il posto degli animali resta libero', () => {
    const s = scena(misurato('misura16', 'fattoria'), grande('fattoria', true), 3, OPZIONI);
    for (const via of ['programma-1', 'programma-2']) {
      const m = compilaArredo(fs.readFileSync(path.join(SCENOGRAFO, 'misura16/fattoria', via, 'programma.xml'), 'utf8'), [s.e.grid.X, s.e.grid.Y, s.e.grid.Z]);
      const a = arredaNelKernel(s, m, 1);
      expect(a.rifiutati.animals).toBeGreaterThan(0);
      expect(regge(confronta(s, a))).toBe(true);
      expect(controlli(s, a).animaliLiberi).toBe(1);
    }
  }, 120_000);
});
