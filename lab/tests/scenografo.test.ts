// The Scenografo's bench (T259): both ways furnish a building and break nothing, with the kernel's guard.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { bersaglio } from '../banco/bersagli';
import { arredaDati, arredaProgramma, arredaValidato, catalogo, confronta, programmaArredo, regge, scena } from '../banco/scenografo/scenografo';
import { STRUTTURE } from '../banco/suolo/strutture';

const leggi = (f: string) => fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');

describe('lo Scenografo sul banco', () => {
  it('il programma d\'arredo è un programma del motore, con regole di forma valida', () => {
    const p = programmaArredo(11);
    expect(p.type).toBe('sequence');
  });
  it('la palazzina: il programma e i modelli arredano e non rompono nulla', () => {
    const s = scena(leggi('banco/riferimento/palazzina.xml'), bersaglio('moderna')!, 1);
    const a = arredaProgramma(s, 1);
    expect(a.voxel.size).toBeGreaterThan(0);
    expect(regge(confronta(s, a))).toBe(true);
    const d = arredaValidato(s, (k) => arredaDati(s, k, catalogo(20)), 1);
    expect(d.tentativi).toBeLessThanOrEqual(4);
    expect(d.c.raggiunte).toBe(1);
  }, 120_000);
  it('il laboratorio con la cantina: la cantina resta', () => {
    const s = scena(leggi('banco/suolo/strutture/laboratorio.xml'), STRUTTURE.find((b) => b.id === 'laboratorio')!, 2);
    const v = arredaValidato(s, (k) => arredaProgramma(s, k), 1);
    expect(v.c.cantina[1]).toBeGreaterThan(0);
    expect(regge(v.c)).toBe(true);
  }, 120_000);
});
