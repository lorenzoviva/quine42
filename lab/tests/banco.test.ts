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
import { daCorreggere, SIGNIFICATO, testoSeconda } from '../banco/seconda';
import { fotoSemi, prova as provaSemi, SEMI, SOGLIA_VARIANZA, taglieDiProva } from '../banco/varianza';

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

describe('i modelli finali (T155)', () => {
  const radice = 'lab/banco/finale';
  const tentativi = BERSAGLI.flatMap((b) => ['1', '2'].map((n) => ({ b, dir: `${radice}/${b.id}/${n}` })));
  const passa = (dir: string) => (JSON.parse(fs.readFileSync(`${dir}/misure.json`, 'utf8')) as { passa: boolean }).passa;

  it.each(tentativi.filter(({ dir }) => passa(dir)).map(({ b, dir }) => [dir, b] as const))('%s gira nel motore e passa i controlli', (dir, b) => {
    const e = esegui(fs.readFileSync(`${dir}/modello.xml`, 'utf8'), b);
    const m = misura(e, b);
    expect(m.analisi.errors).toEqual([]);
    expect(giudica(m, e.scatola).difetti).toEqual([]);
  }, 30_000);

  it("una locanda finale ha la cantina raggiunta, e l'aria sotto il piano terra non è un pavimento perso", () => {
    const b = BERSAGLI.find((x) => x.id === 'locanda')!;
    const e = esegui(fs.readFileSync(`${radice}/locanda/2/modello.xml`, 'utf8'), b);
    const m = misura(e, b);
    expect(m.cantina).toBeGreaterThan(1.2);
    expect(m.murato).toBeLessThanOrEqual(0.25);
  }, 30_000);

  it('chi chiede una cantina e non la raggiunge non passa', () => {
    const b = { ...CASA, sotto: 1 };
    const e = esegui(esempio('buono'), b);
    expect(giudica(misura(e, b), e.scatola).voci.find((v) => v.id === 'cantina')?.ok).toBe(false);
  }, 30_000);
});

describe('i modelli del giro di conferma (T173)', () => {
  const radice = 'lab/banco/conferma';
  const passa = (dir: string) => (JSON.parse(fs.readFileSync(`${dir}/misure.json`, 'utf8')) as { passa: boolean }).passa;
  /** The last request of each attempt: the second, if it had one. */
  const finali = BERSAGLI.flatMap((b) => ['1', '2'].map((n) => ({ b, dir: fs.existsSync(`${radice}/${b.id}/${n}/seconda`) ? `${radice}/${b.id}/${n}/seconda` : `${radice}/${b.id}/${n}` })));

  it.each(finali.filter(({ dir }) => passa(dir)).map(({ b, dir }) => [dir, b] as const))('%s gira nel motore e passa i controlli', (dir, b) => {
    const e = esegui(fs.readFileSync(`${dir}/modello.xml`, 'utf8'), b);
    const m = misura(e, b);
    expect(m.analisi.errors).toEqual([]);
    expect(giudica(m, e.scatola).difetti).toEqual([]);
  }, 30_000);

  it('dice quanti passano le misure alla fine: uno solo è fuori, quello che il gioco rifiuta', () => {
    expect(finali.filter(({ dir }) => !passa(dir)).map(({ dir }) => dir)).toEqual([`${radice}/futuristica/2/seconda`]);
    expect(() => esegui(fs.readFileSync(`${radice}/futuristica/2/seconda/modello.xml`, 'utf8'), BERSAGLI.find((x) => x.id === 'futuristica')!)).toThrow(/tre numeri/);
  });

  it('il prompt è quello di T155: non è cambiato', () => {
    expect(fs.readFileSync(`${radice}/prompt.md`, 'utf8').trim()).toBe(fs.readFileSync('lab/banco/finale/prompt.md', 'utf8').trim());
  });
});

describe('la seconda richiesta (T173)', () => {
  it('chi passa misure e foto non torna; chi non passa le misure torna con i difetti; chi passa le misure torna con i problemi delle foto', () => {
    expect(daCorreggere({ passa: true, difetti: [] })).toBeUndefined();
    expect(daCorreggere({ passa: true, difetti: [] }, '  \n')).toBeUndefined();
    expect(daCorreggere({ passa: true, difetti: [] }, 'il tetto non si legge')).toEqual({ difetti: [], problemi: 'il tetto non si legge' });
    expect(daCorreggere({ passa: false, difetti: ['piani: 1 (serve ≥ 2)'] }, 'non conta')).toEqual({ difetti: ['piani: 1 (serve ≥ 2)'] });
    // The game refused it: its reason is all there is.
    expect(daCorreggere({ passa: false, difetti: ['at vuole tre numeri', null] })?.difetti).toEqual(['at vuole tre numeri']);
  });

  it('una scala stretta torna con il suo XML, il difetto, e dove sta il pavimento non raggiunto', () => {
    const { m, g, e } = prova(esempio('scala-stretta'));
    expect(g.passa).toBe(false);
    expect(m.persi.length).toBeGreaterThan(0);
    const [p] = m.persi;
    expect(p!.x1).toBeGreaterThan(p!.x0);
    expect(p!.z).toBeGreaterThan(e.scatola.base);
    const xml = esempio('scala-stretta');
    const testo = testoSeconda('Edificio: prova', xml, daCorreggere({ passa: false, difetti: g.difetti, misure: { piani: m.piani, persi: m.persi } })!);
    expect(testo).toContain('Edificio: prova');
    expect(testo).toContain(xml.trim());
    for (const d of g.difetti) expect(testo).toContain(d);
    expect(testo).toContain(SIGNIFICATO.piani);
    expect(testo).toContain(`z=${p!.z}, x ${p!.x0}-${p!.x1}`);
    expect(testo).not.toContain('Chi ha guardato le foto');
  }, 60_000);

  it('ogni misura ha il suo significato, e le foto arrivano senza difetti né numeri', () => {
    const { g } = prova(esempio('buono'));
    for (const v of g.voci) expect(SIGNIFICATO[v.id], v.id).toBeDefined();
    const testo = testoSeconda('Edificio: prova', '<sequence values="B"/>', { difetti: [], problemi: 'dentro è buio' });
    expect(testo).toContain('Chi ha guardato le foto ha scritto:\ndentro è buio');
    expect(testo).not.toContain('Il gioco lo ha provato');
  }, 30_000);

  it('le misure dei modelli di T155 non cambiano', () => {
    for (const dir of ['locanda/1', 'locanda/2', 'moderna/2']) {
      const scritta = JSON.parse(fs.readFileSync(`lab/banco/finale/${dir}/misure.json`, 'utf8')) as { misure: { murato: number }; passa: boolean };
      const b = BERSAGLI.find((x) => x.id === dir.split('/')[0])!;
      const e = esegui(fs.readFileSync(`lab/banco/finale/${dir}/modello.xml`, 'utf8'), b);
      const m = misura(e, b);
      expect(m.murato).toBeCloseTo(scritta.misure.murato, 6);
      expect(giudica(m, e.scatola).passa).toBe(scritta.passa);
    }
  }, 60_000);
});

describe('varianza e scala (T180)', () => {
  const ROCCA = BERSAGLI.find((b) => b.id === 'rocca')!;
  /** A shell that repaints itself with the seed: every letter changes, no voxel does. */
  const SOLO_COLORE = `<sequence values="BWS">
    <color symbol="W" value="c8b89a" name="muro"/>
    <color symbol="S" value="7d766c" name="pietra"/>
    <box at="49.5 49.5 0" size="80 80 40" color="W"/>
    <box at="49.5 49.5 3" size="74 74 34" color="B"/>
    <prl in="W" out="S" p="0.5" steps="1"/>
  </sequence>`;
  /** The same, with a few voxels of the wall dug away at random: speckle is not architecture either. */
  const PUNTINI = SOLO_COLORE.replace('<prl in="W" out="S" p="0.5" steps="1"/>', '<prl in="W" out="B" p="0.002" steps="1"/>');

  it('un programma di sole scatole è statico, con il numero: niente cambia da un seme all’altro', () => {
    const p = provaSemi(esempio('buono'), CASA, { taglie: ['grande'] });
    const [t] = p.taglie;
    expect(p.statico).toBe(true);
    expect(p.varia).toBe(false);
    expect(t!.semi).toHaveLength(SEMI);
    expect(SEMI).toBeGreaterThanOrEqual(5);
    expect(t!.varianza).toMatchObject({ voxel: 0, colore: 0, pianta: 0, perimetro: 0, interno: 0, architetture: 1, firmePiani: 1, firmeStanze: 1 });
    expect(t!.difettiVarianza.join(' ')).toContain('statico');
    // Today's bench is happy with it: only the seeds tell.
    expect(t!.regge).toBe(true);
    expect(p.passa).toBe(false);
  }, 60_000);

  it('il solo rumore di colore non conta come varianza, né una manciata di puntini', () => {
    const colore = provaSemi(SOLO_COLORE, CASA, { taglie: ['grande'] }).taglie[0]!.varianza!;
    expect(colore.colore).toBeGreaterThan(0.3);
    expect(colore.voxel).toBe(0);
    expect(colore.statico).toBe(true);
    const puntini = provaSemi(PUNTINI, CASA, { taglie: ['grande'] }).taglie[0]!.varianza!;
    expect(puntini.voxel).toBeGreaterThan(0);
    expect(puntini.statico).toBe(true);
    expect(puntini.architetture).toBe(1);
  }, 60_000);

  it('un programma le cui masse cambiano col seme varia: pianta, perimetro, interno, architetture', () => {
    const p = provaSemi(esempio('variabile'), CASA, { taglie: ['grande'] });
    const v = p.taglie[0]!.varianza!;
    expect(p.statico).toBe(false);
    expect(p.varia).toBe(true);
    expect(v.voxel).toBeGreaterThanOrEqual(SOGLIA_VARIANZA.voxel);
    expect(v.pianta).toBeGreaterThanOrEqual(SOGLIA_VARIANZA.pianta);
    expect(v.perimetro).toBeGreaterThanOrEqual(SOGLIA_VARIANZA.perimetro);
    expect(v.interno).toBeGreaterThanOrEqual(SOGLIA_VARIANZA.interno);
    expect(v.architetture).toBeGreaterThanOrEqual(SOGLIA_VARIANZA.architetture);
    // It varies and it is no building: the two judgements are separate.
    expect(p.regge).toBe(false);
    expect(p.passa).toBe(false);
  }, 60_000);

  it('la stessa casa ritoccata dal seme non è un’altra architettura, anche se molti voxel cambiano', () => {
    const p = provaSemi(bundledFiles['models/fattoria.xml']!, CASA, { taglie: ['grande'] });
    const v = p.taglie[0]!.varianza!;
    expect(v.statico).toBe(false);
    expect(v.voxel).toBeGreaterThan(SOGLIA_VARIANZA.voxel);
    expect(v.architetture).toBeLessThan(SOGLIA_VARIANZA.architetture);
    expect(p.varia).toBe(false);
  }, 60_000);

  it('un cortile non è perimetro esterno: conta l’aria che viene da fuori', () => {
    // A ring of walls whose courtyard moves with the seed: the plan changes, its outer perimeter does not.
    const cortile = `<sequence values="BWI" symmetry="(xy)">
      <color symbol="W" value="c8b89a" name="muro"/>
      <color symbol="I" hidden="True" name="cortile"/>
      <box at="49.5 49.5 0" size="90 90 30" color="W"/>
      <box at="49.5 49.5 1" size="50 50 28" color="I"/>
      <one in="I" out="B" steps="1"/>
      <all in="BI" out="*B" steps="12" symmetry="(x)"/>
      <all in="B/I" out="*/B" steps="12" symmetry="(y)"/>
      <all in="B I" out="* B"/>
      <all in="I B" out="B *"/>
      <prl in="I" out="W" steps="1"/>
      <all in="W B" out="B *"/>
    </sequence>`;
    const v = provaSemi(cortile, CASA, { taglie: ['grande'] }).taglie[0]!.varianza!;
    expect(v.pianta).toBeGreaterThan(0.05);
    expect(v.perimetro).toBe(0);
  }, 60_000);

  it('Enorme e Gargantuesca hanno la stessa griglia: cambia il corpo, e una scala fatta per uno non regge l’altro', () => {
    const [enorme, garg] = (['enorme', 'gargantuesca'] as const).map((taglia) => scatolaDi({ ...ROCCA, taglia }));
    expect(enorme!.box).toEqual(garg!.box);
    expect([enorme!.vpt, garg!.vpt, enorme!.gradino, garg!.gradino]).toEqual([16, 12, 3, 2]);
    expect(taglieDiProva(ROCCA)).toEqual(['enorme', 'gargantuesca']);
    expect(taglieDiProva(CASA)).toEqual(['grande', 'enorme']);
    expect(taglieDiProva({ classe: 'grande', taglia: 'gargantuesca' })).toEqual(['gargantuesca', 'enorme']);
    const p = provaSemi(fs.readFileSync('lab/banco/finale/rocca/1/modello.xml', 'utf8'), ROCCA, { semi: 2 });
    expect(p.taglie.map((t) => t.regge)).toEqual([true, false]);
    expect(p.taglie[1]!.semi[0]!.difetti.join(' ')).toContain('piani');
    expect(p.regge).toBe(false);
  }, 60_000);

  it('chi si rompe a una taglia è bocciato: a ogni seme, con le misure che cadono', () => {
    const p = provaSemi(esempio('buono'), CASA);
    expect(p.taglie.map((t) => t.taglia)).toEqual(['grande', 'enorme']);
    const [grande, enorme] = p.taglie;
    expect(grande!.regge).toBe(true);
    expect(enorme!.regge).toBe(false);
    expect(enorme!.box).toEqual([120, 120, 96]);
    expect(enorme!.gradino).toBe(3);
    for (const s of enorme!.semi) expect(s.difetti.map((d) => d.split(':')[0])).toEqual(expect.arrayContaining(['piani', 'murato']));
    expect(p.regge).toBe(false);
    expect(p.passa).toBe(false);
  }, 60_000);

  it('ciò che il gioco rifiuta è un difetto, non un’eccezione, e non è statico', () => {
    const p = provaSemi('<sequence values="BW"><box at="1 1"/></sequence>', CASA, { semi: 2, taglie: ['grande'] });
    expect(p.regge).toBe(false);
    expect(p.statico).toBe(false);
    expect(p.taglie[0]!.semi[0]!.difetti[0]).toContain('il gioco lo rifiuta');
    expect(p.taglie[0]!.difettiVarianza).toHaveLength(1);
    expect(fotoSemi(p)).toBeUndefined();
  });

  it('un programma con una `size` sua non cresce con la taglia, e si dice', () => {
    const p = provaSemi(bundledFiles['models/grande.xml']!, CASA, { semi: 2 });
    expect(p.taglie.map((t) => t.box)).toEqual([[72, 72, 90], [72, 72, 90]]);
    expect(p.taglie[1]!.semi[0]!.difetti.join(' ')).toContain('scatola: 72 × 72 × 90 (la taglia enorme dà 120 × 120 × 96)');
  }, 60_000);

  it('la scatola attesa conta la cantina: una locanda non è sbagliata per i suoi voxel sotto il suolo', () => {
    const b = BERSAGLI.find((x) => x.id === 'locanda')!;
    const p = provaSemi(fs.readFileSync('lab/banco/finale/locanda/2/modello.xml', 'utf8'), b, { semi: 1, taglie: ['grande'] });
    expect(p.taglie[0]!.box).toEqual([100, 100, 100]);
    expect(p.taglie[0]!.semi[0]!.difetti).toEqual([]);
  }, 60_000);

  it('il foglio di contatto è un solo PNG: una riga per taglia, un modello per seme, e le piante', () => {
    const p = provaSemi(esempio('variabile'), CASA);
    const pic = fotoSemi(p)!;
    expect(pic.data.length).toBe(pic.w * pic.h * 4);
    // Five models at 100 voxels side by side; three rows.
    expect(pic.w).toBeGreaterThan(5 * 100);
    expect(pic.h).toBeGreaterThan(2 * 100);
    expect(pic.w).toBeLessThan(1000);
  }, 60_000);
});
