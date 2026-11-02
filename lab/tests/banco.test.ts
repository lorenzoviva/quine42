// The bench of the structures' prompt (T154): the measures tell a good model from a bad one, offline, on fixed programs, and what they
// say of a body is what the kernel does with it. Nothing here calls a model.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { MockModels } from '../../src/kernel/ai/mock';
import type { FormComp } from '../../src/kernel/forms';
import { memoryStore } from '../../src/kernel/repo';
import { BERSAGLI, testoBersaglio } from '../banco/bersagli';
import { leggiEventi } from '../banco/claude';
import { fotoLati, fotoPianta, fotoSezioni } from '../banco/foto';
import { esegui, giudica, misura, scatolaDi, type Bersaglio } from '../banco/misure';

const CASA: Bersaglio = { id: 'prova', nome: 'prova', stile: '', descrizione: '', classe: 'grande' };
const esempio = (n: string) => fs.readFileSync(`lab/banco/esempi/${n}.xml`, 'utf8');
const prova = (xml: string, b = CASA) => {
  const e = esegui(xml, b);
  const m = misura(e, b);
  return { e, m, g: giudica(m, e.scatola), falliti: giudica(m, e.scatola).voci.filter((v) => !v.ok).map((v) => v.id) };
};

describe('le misure del banco', () => {
  it('un edificio buono passa: piani, stanze, porta, salti, finestre', () => {
    const { m, g } = prova(esempio('buono'));
    expect(g.difetti).toEqual([]);
    expect(g.passa).toBe(true);
    expect(m.piani.map((p) => p.z)).toEqual([3, 40]);
    expect(m.stanze).toBeGreaterThanOrEqual(3);
    expect(m.porta?.libera).toBe(true);
    expect(m.salti.length).toBeGreaterThanOrEqual(2);
    expect(m.finestre).toBeGreaterThanOrEqual(6);
  }, 30_000);

  it('una scatola con la porta sul retro non passa, e si dice perché', () => {
    const { falliti, m } = prova(esempio('brutto'));
    expect(falliti).toEqual(expect.arrayContaining(['piani', 'stanze', 'porta', 'salti', 'materiali', 'finestre', 'dettagli', 'sagoma', 'rilievo']));
    expect(m.porta).toBeUndefined();
  }, 30_000);

  it('una scala che esiste per le colonne e non per un corpo non fa un piano', () => {
    const { falliti, m } = prova(esempio('scala-stretta'));
    expect(m.piani).toHaveLength(1);
    expect(falliti).toEqual(expect.arrayContaining(['piani', 'murato']));
  }, 30_000);

  it('la casa generica del seme ha la sua porta, che si apre, ma non i piani', () => {
    const { e, m, falliti } = prova(bundledFiles['models/grande.xml']!);
    expect(e.aperta).toBe('apri');
    expect(m.porta).toBeDefined();
    expect(m.piani).toHaveLength(1);
    expect(falliti).toContain('piani');
    expect(falliti).not.toContain('porta');
  }, 30_000);

  it('ciò che il gioco rifiuterebbe non arriva alle misure', () => {
    expect(() => esegui('<sequence values="BW"><box at="1 1"/></sequence>', CASA)).toThrow();
  });

  it('dà le foto: i lati, un taglio per piano, la pianta', () => {
    const { e, m } = prova(esempio('buono'));
    expect(fotoLati(e).w).toBeGreaterThan(0);
    expect(fotoSezioni(e, m)!.w).toBeGreaterThan(fotoLati(e).w / 5);
    expect(fotoPianta(e, m)!.w).toBeGreaterThan(2 * e.grid.X);
  }, 60_000);
});

describe('il corpo del banco è quello del kernel', () => {
  it('dove il banco sale, il kernel sale; dove il banco si ferma, il kernel si ferma', async () => {
    const index = JSON.parse(bundledFiles['models/index.json']!);
    index.buono = { classe: 'grande' };
    index.stretta = { classe: 'grande' };
    const files = { ...bundledFiles, 'models/buono.xml': esempio('buono'), 'models/stretta.xml': esempio('scala-stretta'), 'models/index.json': JSON.stringify(index) };
    const k = await Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
    k.tick(1 / 60);
    // A nearly flat patch, clear for the 5 × 5 tiles of the model and around it.
    let spot: [number, number] | undefined;
    for (let y = -14; y <= 14 && !spot; y++)
      for (let x = -14; x <= 14 && !spot; x++) {
        const h = k.groundAt(x + 0.5, y + 0.5);
        let ok = true;
        for (let dy = -4; dy <= 4 && ok; dy++) for (let dx = -4; dx <= 4 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.25) && Math.abs(k.groundAt(x + dx + 0.5, y + dy + 0.5) - h) <= 0.25;
        if (ok) spot = [x + 0.5, y + 0.5];
      }
    expect(spot).toBeDefined();
    const [cx, cy] = spot!;
    const id = k.spawnModuleEntity(k.modules.get('object.well')!, cx, cy, undefined, 'test#banco');
    const base = k.groundAt(cx, cy);
    // In by the door, through the wall's gap, to the foot of the stair and up: where it stops, and at what height.
    const sale = async (model: string, yStair: number) => {
      Object.assign(k.ecs.get(id, 'form') as FormComp, { model, seed: 1, yaw: 0 });
      expect((await k.forms.wait(model, 1))?.status).toBe('ready');
      k.tick(1 / 60);
      const at = (vx: number, vy: number) => [cx + (vx - 50) / 20, cy + (vy - 50) / 20] as const;
      let [x, y] = at(50, 112);
      let z = k.floorAt(x, y);
      let fermo = false;
      const walk = (vx: number, vy: number) => {
        const [tx, ty] = at(vx, vy);
        for (let n = 0; n < 800 && !fermo && Math.hypot(tx - x, ty - y) > 0.01; n++) {
          const d = Math.hypot(tx - x, ty - y), s = Math.min(0.05, d);
          const nx = x + ((tx - x) / d) * s, ny = y + ((ty - y) / d) * s;
          if (!k.free(nx, ny, 0.22, z)) fermo = true;
          else {
            (x = nx), (y = ny);
            z = k.floorAt(x, y, z);
          }
        }
      };
      walk(50, 40);
      walk(14, 40);
      walk(14, yStair);
      walk(62, yStair);
      return { fermo, level: Math.round((z - base) * 20) };
    };
    expect(await sale('buono', 17)).toEqual({ fermo: false, level: 40 });
    expect(misura(esegui(esempio('buono'), CASA), CASA).piani).toHaveLength(2);
    const stretta = await sale('stretta', 10.5);
    expect(stretta.fermo).toBe(true);
    expect(stretta.level).toBeLessThan(40);
    expect(misura(esegui(esempio('scala-stretta'), CASA), CASA).piani).toHaveLength(1);
  }, 120_000);
});

describe('i bersagli e la prova', () => {
  it('sono almeno sei, tra cui moderno, steampunk e futuristico, ognuno con i numeri della sua scatola', () => {
    expect(BERSAGLI.length).toBeGreaterThanOrEqual(6);
    expect(new Set(BERSAGLI.map((b) => b.id)).size).toBe(BERSAGLI.length);
    for (const id of ['moderna', 'steampunk', 'futuristica']) expect(BERSAGLI.some((b) => b.id === id)).toBe(true);
    for (const b of BERSAGLI) {
      const t = testoBersaglio(b);
      const s = scatolaDi(b);
      expect(t).toContain(`${s.box[0]} × ${s.box[1]} × ${s.box[2]}`);
      expect(t).toContain(`gradino ${s.gradino}`);
    }
    // A cellar makes the box taller by its depth; a rare size coarser.
    const locanda = scatolaDi(BERSAGLI.find((b) => b.id === 'locanda')!);
    expect([locanda.base, locanda.box[2]]).toEqual([20, 100]);
    const rocca = scatolaDi(BERSAGLI.find((b) => b.id === 'rocca')!);
    expect([rocca.vpt, rocca.box[0]]).toEqual([16, 120]);
  });

  it('legge risposta e token dagli eventi della CLI, contando tutto l’input', () => {
    const out = [
      '{"type":"system","subtype":"init","model":"claude-prova","tools":[]}',
      'non è un evento',
      '{"type":"result","is_error":false,"result":"<sequence/>","total_cost_usd":0.5,"usage":{"input_tokens":3,"cache_creation_input_tokens":1200,"cache_read_input_tokens":40,"output_tokens":800}}',
    ].join('\n');
    expect(leggiEventi(out)).toEqual({ testo: '<sequence/>', modello: 'claude-prova', dollari: 0.5, token: { input: 3, cacheScritta: 1200, cacheLetta: 40, output: 800, inputTotale: 1243 } });
    expect(leggiEventi('{"type":"result","is_error":true,"result":"no"}').errore).toBe('no');
    expect(leggiEventi('').errore).toBeDefined();
  });
});
