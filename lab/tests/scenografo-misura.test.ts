// The Scenografo measured for real (T303): what the kernel gives the three ways, and every program and choice the CLI wrote run again
// in the engine, through the guard and the checks.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Bersaglio } from '../banco/misure';
import { arredaValidato, catalogo, regge, scena } from '../banco/scenografo/scenografo';
import { arredaConProgramma, arredaConRegole, arredoInsieme, CLASSI, compilaArredo, controlli, descrivi, leggiRegole, MOBILI, palco } from '../banco/scenografo/misura';

const DIR = path.resolve(__dirname, '../banco/scenografo/misura');
const OPZIONI = { piccolo: 2, coperto: true };
const b = (nome: string): Bersaglio => ({ id: nome, nome, stile: '', descrizione: '', classe: 'structure', taglia: 'large' });
const edificio = (nome: string) => fs.readFileSync(path.join(DIR, 'vuoto/claude-opus-5-5/giro1', `${nome}-large`, 'programma.xml'), 'utf8');

describe('lo Scenografo misurato (T303)', () => {
  const s = scena(edificio('fattoria'), b('fattoria'), 1, OPZIONI);
  const mobili = catalogo(20, MOBILI);

  it('il palco: il programma vede solo le classi, il pavimento coperto libero e il protetto', () => {
    const st = palco(s);
    expect(st.alphabet.slice(1, 6)).toEqual([CLASSI.muro, CLASSI.libero, CLASSI.cantina, CLASSI.protetto, CLASSI.animali]);
    const n = (c: number) => st.cells.reduce((k, v) => k + (v === c ? 1 : 0), 0);
    expect(n(1)).toBeGreaterThan(0);
    expect(n(2)).toBeGreaterThan(0);
    expect(n(4)).toBeGreaterThan(0);
    const d = descrivi('fattoria', [s]);
    expect(d).toMatch(/storeys one reaches on foot/);
    expect(d).toMatch(/the animals stand on/);
  }, 120_000);

  it('la risposta offline del programma arreda e non rompe nulla', () => {
    const m = compilaArredo(fs.readFileSync(path.resolve(__dirname, '../banco/scenografo/offline/programma.xml'), 'utf8'), [s.e.grid.X, s.e.grid.Y, s.e.grid.Z]);
    const v = arredaValidato(s, (k) => arredaConProgramma(s, m, k), 1);
    expect(v.a.voxel.size).toBeGreaterThan(0);
    expect(regge(v.c)).toBe(true);
    expect(controlli(s, v.a).piani).toBe(2);
  }, 120_000);

  it('le regole dei dati si leggono senza fidarsi e posano i mobili esistenti', () => {
    const r = leggiRegole('```json\n{"rules":[{"storey":0,"room":"hall","furniture":["banco","sedia-volante"],"count":9},{"furniture":"x"}]}\n```', mobili);
    expect(r.ignoti).toEqual(['sedia-volante']);
    expect(r.regole).toEqual([{ storey: 0, room: 'hall', furniture: ['banco'], count: 6 }]);
    const v = arredaValidato(s, (k) => arredaConRegole(s, k, mobili, r.regole), 1);
    expect(regge(v.c)).toBe(true);
  }, 120_000);

  // Every answer the CLI gave (b, c) and every building written with its interior (a): run again, it holds.
  const risposte = fs.existsSync(DIR)
    ? fs.readdirSync(DIR, { withFileTypes: true }).filter((e) => e.isDirectory() && fs.existsSync(path.join(DIR, 'vuoto/claude-opus-5-5/giro1', `${e.name}-large`))).flatMap((e) =>
        fs.readdirSync(path.join(DIR, e.name)).filter((v) => /^(programma|dati)-\d+$/.test(v)).map((v) => ({ nome: e.name, via: v })),
      )
    : [];
  for (const { nome, via } of risposte) {
    const dir = path.join(DIR, nome, via);
    const xml = path.join(dir, 'programma.xml');
    const json = path.join(dir, 'regole.json');
    if (!fs.existsSync(xml) && !fs.existsSync(json)) continue;
    it(`${nome} ${via}: gira nel motore e regge`, () => {
      const t = scena(edificio(nome), b(nome), 1, OPZIONI);
      const v = fs.existsSync(xml)
        ? (() => {
            const m = compilaArredo(fs.readFileSync(xml, 'utf8'), [t.e.grid.X, t.e.grid.Y, t.e.grid.Z]);
            return arredaValidato(t, (k) => arredaConProgramma(t, m, k), 1);
          })()
        : arredaValidato(t, (k) => arredaConRegole(t, k, mobili, JSON.parse(fs.readFileSync(json, 'utf8')).regole), 1);
      expect(v.tentativi).toBeLessThanOrEqual(4);
      expect(regge(v.c)).toBe(true);
    }, 180_000);
  }

  const insieme = path.join(DIR, 'insieme/claude-opus-5-5');
  for (const giro of fs.existsSync(insieme) ? fs.readdirSync(insieme) : [])
    for (const nome of ['villetta', 'fattoria']) {
      const xml = path.join(insieme, giro, `${nome}-large`, 'programma.xml');
      if (!fs.existsSync(xml)) continue;
      it(`${nome} insieme ${giro}: l'interno scritto con l'edificio si conta`, () => {
        const t = scena(fs.readFileSync(xml, 'utf8'), b(nome), 1, OPZIONI);
        const a = arredoInsieme(t);
        expect(controlli(t, { e: t.e, m: t.m, voxel: a.voxel }).piani).toBeGreaterThanOrEqual(2);
      }, 120_000);
    }
});
