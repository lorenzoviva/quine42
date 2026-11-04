// The letter of the ground (T258, ADR-0135): the kernel writes it on the layer where the world's ground is, so one program serves every size;
// a program that does not ask for it runs, is keyed and is kept exactly as before.

import crypto from 'node:crypto';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FormCache, formKey, Forms, InlineRunner } from '../../src/kernel/forms';
import { modelSize } from '../../src/kernel/modeldirector';
import { Mj3Error } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import { MAX_FORM_TIME, runMjx } from '../../src/mj/run';
import { bersaglio } from '../banco/bersagli';
import { esegui, giudica, misura } from '../banco/misure';

const sha = (x: string | Uint8Array) => crypto.createHash('sha256').update(x).digest('hex').slice(0, 16);
const LETTERE = 'BNEZ';
const lettere = (cells: Uint8Array, alphabet: string[]) => [...cells].map((c) => alphabet[c]).join('');

function forme(xml: string, info: Record<string, unknown>) {
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load({ 'models/prova.xml': xml, 'models/index.json': JSON.stringify({ prova: info }) });
  return forms;
}

describe('il motore', () => {
  const strati = (attrs: string, size: [number, number, number], base?: number) => {
    const g = runMjx(compileMjx(`<sequence values="${LETTERE}" ${attrs}><prl in="N" out="N"/></sequence>`, { size, ...(base ? { base } : {}) }), 1).grid;
    const s = lettere(g.cells, g.alphabet);
    return Array.from({ length: g.Z }, (_, z) => s.slice(z * g.X * g.Y, (z + 1) * g.X * g.Y));
  };

  it('scrive la lettera sullo strato del suolo, e origin sta lì', () => {
    expect(strati('suolo="E" origin="bottom"', [3, 3, 4], 2)).toEqual(['.........', '.........', 'EEEENEEEE', '.........']);
  });

  it('con ground il fondo ha la sua lettera', () => {
    expect(strati('suolo="E" ground="Z"', [2, 1, 3], 1)).toEqual(['ZZ', 'EE', '..']);
  });

  it('senza base, o senza posto nella scatola, il suolo è in fondo, come lo posa il kernel', () => {
    expect(strati('suolo="E"', [2, 1, 2])[0]).toBe('EE');
    expect(strati('suolo="E"', [2, 1, 2], 2)[0]).toBe('EE');
  });

  it('a base 0 è ground, voxel per voxel', () => {
    expect(strati('suolo="E" origin="bottom"', [5, 5, 3])).toEqual(strati('ground="E" origin="bottom"', [5, 5, 3]));
  });

  it('una lettera che non è nei values, o un programma con map, tornano con il motivo', () => {
    expect(() => compileMjx('<sequence values="BN" size="2 2 2" suolo="E"><prl in="N" out="N"/></sequence>', { strict: true })).toThrow(Mj3Error);
    expect(() => compileMjx('<sequence values="BE" size="2 2 2" suolo="E"><map values="BE" scale="2 2 2"><rule in="E" out="EE/EE EE/EE"/></map></sequence>')).toThrow(/suolo non vale con map/);
  });
});

describe('la libreria', () => {
  const PROG = '<sequence values="BNE" suolo="E" origin="bottom"><prl in="N" out="N"/></sequence>';

  it.each([
    ['grande', 20, [100, 100, 100]],
    ['enorme', 16, [120, 120, 112]],
  ] as const)('lo stesso XML a %s: il suolo è a z=%i, dove il modello è posato', async (taglia, base, box) => {
    const forms = forme(PROG, { classe: 'grande', ...modelSize({ classe: 'grande', taglia }), sotto: 1 });
    expect(forms.request('prova', 1)!.base).toBe(base);
    const f = (await forms.wait('prova', 1))!;
    expect(f.status).toBe('ready');
    const g = f.result!.grid;
    expect([g.X, g.Y, g.Z]).toEqual(box);
    expect(f.base).toBe(base);
    const E = g.alphabet.indexOf('E');
    const XY = g.X * g.Y;
    expect(g.cells.slice(base * XY, (base + 1) * XY).filter((c) => c === E).length).toBe(XY - 1);
    expect(g.cells.slice(0, base * XY).every((c) => c === 0)).toBe(true);
    expect(g.cells[(g.X >> 1) + (g.Y >> 1) * g.X + base * XY]).toBe(g.alphabet.indexOf('N'));
  });

  it('due profondità sono due risultati: la chiave lo dice', () => {
    const q = forme(PROG, { classe: 'grande', sotto: 1, vpt: 20 }).request('prova', 1)!;
    expect(formKey(q)).not.toBe(formKey({ ...q, base: 16 }));
  });

  it('senza cantina il programma non porta nulla di più', () => {
    expect('base' in forme(PROG, { classe: 'grande' }).request('prova', 1)!).toBe(false);
  });
});

describe('un modello già scolpito', () => {
  // Measured before the letter existed (T258), on a cellar written with `<box>`: the same key means that what is kept stays good, without regenerating anything.
  it('ha la stessa richiesta, la stessa chiave e gli stessi voxel', async () => {
    const xml = fs.readFileSync('lab/banco/conferma/locanda/1/modello.xml', 'utf8');
    const q = forme(xml, { classe: 'grande', sotto: 1 }).request('prova', 1)!;
    expect(Object.keys(q).sort()).toEqual(['model', 'rig', 'seed', 'size', 'sway', 'tint', 'vpt', 'xml']);
    expect(sha(formKey(q))).toBe('e351acf1d064f270');
    const r = await new InlineRunner(new FormCache()).run(q);
    expect(sha(r.grid.cells)).toBe('cf896488fc11fc01');
  }, 60_000);
});

describe('la cantina a mano (riferimento/cantina.xml)', () => {
  const xml = fs.readFileSync('lab/banco/riferimento/cantina.xml', 'utf8');
  it.each(['grande', 'enorme'] as const)('regge a %s, con la cantina raggiunta', (taglia) => {
    const b = { ...bersaglio('locanda')!, taglia };
    // Under the suite's load 8 s may not be enough, and a program cut in half fails everything: here the limit does not count, the bench measures it alone.
    const e = esegui(xml, b, 1, MAX_FORM_TIME);
    const m = misura(e, b);
    expect(m.cantina).toBeGreaterThanOrEqual(1.2);
    // The time depends on what else the machine is doing: the bench measures it alone.
    expect(giudica(m, e.scatola).difetti.filter((d) => !/^(finisce|valido)/.test(d))).toEqual([]);
  }, 120_000);
});
