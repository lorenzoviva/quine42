// The Jev bench with images (T324) without network or keys: the photographs keep TypeSafe's limits, the images go to Jev as assets with
// the Danger Zone header and to Gemini inline in the order of their references, the defects change what they say and nothing else, the
// offline mode runs cases with images and the report reads them; the key and the pictures never reach the ledger.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Budget, caseImages, GeminiJudge, imageUses, JevJudge, jevBody, jevImageTokens, OfflineJudge, readLedger, runBench, typedPrompt, type Case } from '../banco/jev/banco';
import { FORMS, MAX_SIDE, MIN_SIDE, padded, runLibraryModel, seedForms, shoot } from '../banco/jev/foto';
import { artistQuestions, DEFECT_IDS, DEFECTS, refOf, withDefect, worldLibrary } from '../banco/jev/immagini';
import { auc, imageReport } from '../banco/jev/rapporto-immagini';
import { markLevel } from '../banco/jev/artista-oggi';
import { seedLibrary } from '../banco/jev/domande';
import { png } from '../scripts/png';
import { bersaglio } from '../banco/bersagli';
import { esegui } from '../banco/misure';
import type { AiModels, TextCall } from '../../src/kernel/ai/models';
import { emptyUsage } from '../../src/kernel/ai/models';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'jev-immagini-'));

/** A photograph of a small model of the library in a temporary folder (the bench's own are in lab/out, not committed). */
function photoCase(dir: string, id = 'falo'): Case {
  const r = runLibraryModel(seedForms(), id)!;
  const p = shoot(r.grid, r.model.program.palette, 'lati4').pictures[0];
  const file = path.join(dir, `${id}.png`);
  fs.writeFileSync(file, png(p));
  const ref = refOf(`test/${id}`);
  return {
    id: `prova/${id}`,
    group: 'immagini',
    kind: 'difetto',
    form: 'lati4',
    state: { photo: ref },
    images: { [ref]: file },
    questions: DEFECT_IDS.map((d) => ({ id: d, type: 'noul' as const, instructions: DEFECTS[d] })),
    expected: Object.fromEntries(DEFECT_IDS.map((d) => [d, false])),
  };
}

describe('le foto del banco con le immagini', () => {
  it('ogni forma sta nei limiti di TypeSafe: lati fra 280 e 1568 pixel', () => {
    const forms = seedForms();
    for (const id of ['falo', 'struttura-locanda']) {
      const r = runLibraryModel(forms, id)!;
      for (const form of FORMS) {
        const s = shoot(r.grid, r.model.program.palette, form);
        expect(s.pictures).toHaveLength(form === 'separate' ? 4 : 1);
        for (const p of s.pictures) {
          expect(p.w, `${id} ${form}`).toBeGreaterThanOrEqual(MIN_SIDE);
          expect(p.h, `${id} ${form}`).toBeGreaterThanOrEqual(MIN_SIDE);
          expect(p.w).toBeLessThanOrEqual(MAX_SIDE);
          expect(p.h).toBeLessThanOrEqual(MAX_SIDE);
          // Opaque: no transparent pixel reaches the model.
          for (let i = 3; i < p.data.length; i += 4 * 97) expect(p.data[i]).toBe(255);
        }
      }
    }
    const small = padded({ w: 10, h: 300, data: new Uint8ClampedArray(10 * 300 * 4).fill(255) });
    expect([small.w, small.h]).toEqual([MIN_SIDE, 300]);
  });

  it('i difetti cambiano la griglia finita e solo come dicono', () => {
    const b = bersaglio('moderna')!;
    const e = esegui(fs.readFileSync('lab/banco/finale/moderna/2/modello.xml', 'utf8'), b, 1);
    const palette = e.model.program.palette;
    const before = e.result.grid.cells.slice();
    const solid = (cells: Uint8Array) => cells.reduce((s, v) => s + (v ? 1 : 0), 0);
    for (const d of DEFECT_IDS) {
      const r = withDefect(e, d, palette, { x: Math.floor(e.result.grid.X / 2), y: e.result.grid.Y - 3 });
      expect(r.changed, d).toBeGreaterThan(30);
      if (d === 'grigio') expect(new Set([...r.grid.cells].filter(Boolean)).size).toBe(1);
      if (d === 'tetto' || d === 'mezzo') expect(solid(r.grid.cells)).toBeLessThan(solid(before));
      if (d === 'rumore' || d === 'grigio') expect(solid(r.grid.cells)).toBe(solid(before));
    }
    // The program's own grid stays as it was.
    expect(e.result.grid.cells).toEqual(before);
  });

  it('le domande dell’Artista sono i criteri visibili da fuori, il passa e il voto a soglie', () => {
    const qs = artistQuestions('photo');
    expect(qs.map((q) => q.id)).toEqual(['riconosce', 'regge', 'lati', 'tetto', 'colori', 'dettaglio', 'passa', 'voto']);
    for (const q of qs) expect(JSON.stringify(q.instructions)).toContain('`photo`');
    expect([0, 4, 5, 6, 7, 8, 9, 10].map(markLevel)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(auc([0.9, 0.8], [0.1, 0.2])).toBe(1);
    expect(auc([0.5], [0.5])).toBe(0.5);
  });

  it('la libreria del mondo: 50 modelli, niente suoni né studio (anche quella di T313, coi campi del contratto 0.4)', () => {
    const lib = worldLibrary();
    expect(lib.length).toBeGreaterThanOrEqual(45);
    expect(lib.some((m) => m.class === 'suono' || /^corona-/.test(m.id))).toBe(false);
    expect(seedLibrary().map((m) => m.id)).toEqual(lib.map((m) => m.id));
    expect(seedLibrary().every((m) => m.classe && m.nome)).toBe(true);
  });
});

describe('le immagini ai due giudici', () => {
  it('a Jev come assets con l’intestazione della Danger Zone, la chiave solo nell’Authorization', async () => {
    const dir = tmp();
    const c = photoCase(dir);
    const ref = Object.keys(c.images!)[0];
    const body = jevBody(c, 'jev-1.14.0', caseImages(c)) as any;
    expect(body.assets[ref]).toMatchObject({ type: 'image', format: 'png' });
    expect(Buffer.from(body.assets[ref].data_base64, 'base64').subarray(1, 4).toString()).toBe('PNG');
    expect(imageUses(c)).toEqual({ [ref]: 1 });
    expect(jevImageTokens(c)).toBeGreaterThan(100);
    const key = 'ts-chiave-segreta-123';
    let seen: { headers: Record<string, string>; body: any } | undefined;
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      seen = { headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) };
      const answers = Object.fromEntries(DEFECT_IDS.map((d) => [d, { noul: 0.1 }]));
      return new Response(JSON.stringify({ model: 'jev-1.14.0', answers, usage: { input_tokens: 1900, output_tokens: 0 } }), { status: 200 });
    }) as unknown as typeof fetch;
    const ledger = path.join(dir, 'consumi.jsonl');
    const lines = await runBench({ run: 'img-prova', judges: [new JevJudge({ key, model: 'jev-1.14.0', fetchImpl })], cases: [c], ledger, budget: new Budget({ typesafe: 0.5 }, []) });
    expect(seen!.headers['TypeSafe-Danger-Zone-Images']).toBe('true');
    expect(seen!.headers.Authorization).toBe(`Bearer ${key}`);
    expect(Object.keys(seen!.body.assets)).toEqual([ref]);
    expect(lines[0]).toMatchObject({ ok: true, input_tokens: 1900 });
    expect(lines[0].right).toEqual(Object.fromEntries(DEFECT_IDS.map((d) => [d, true])));
    const text = fs.readFileSync(ledger, 'utf8');
    expect(text).not.toContain(key);
    expect(text).not.toContain(body.assets[ref].data_base64.slice(0, 40));
  });

  it('a Gemini in linea, nell’ordine dei riferimenti, con la riga che li nomina', async () => {
    const dir = tmp();
    const a = photoCase(dir, 'falo');
    const b = photoCase(dir, 'barile');
    const [ra, rb] = [Object.keys(a.images!)[0], Object.keys(b.images!)[0]];
    const c: Case = { ...a, id: 'prova/coppia', kind: 'confronto', state: { A: ra, B: rb }, images: { [ra]: a.images![ra], [rb]: b.images![rb] }, questions: [{ id: 'better', type: 'choice', instructions: 'Which is better?', criteria: { A: 'The one in `A`', B: 'The one in `B`' } }], expected: { better: ['A'] } };
    const { prompt } = typedPrompt(c);
    expect(prompt).toContain(`image 1 = \`${ra}\``);
    expect(prompt).toContain(`image 2 = \`${rb}\``);
    let call: TextCall | undefined;
    const models = (): AiModels => {
      const m: AiModels = {
        name: 'finto',
        usage: emptyUsage(),
        limits: { text: 10 },
        async text(t: TextCall) {
          call = t;
          m.onCall?.({ model: 'gemini-3.1-flash-lite', agent: 'banco', task: t.task, prompt: 2300, cached: 0, output: 12, thoughts: 80 });
          return JSON.stringify({ better: 'A' });
        },
      };
      return m;
    };
    const lines = await runBench({ run: 'img-prova', judges: [new GeminiJudge({ model: 'gemini-3.1-flash-lite', models })], cases: [c], budget: new Budget({ gemini: 0.5 }, []), dry: true });
    expect(call!.images).toHaveLength(2);
    expect(call!.images![0]).toBe(`data:image/png;base64,${caseImages(c)[ra].base64}`);
    expect(call!.images![1]).toBe(`data:image/png;base64,${caseImages(c)[rb].base64}`);
    expect(lines[0]).toMatchObject({ ok: true, input_tokens: 2300, right: { better: true } });
    expect(lines[0].usd).toBeGreaterThan(0);
  });

  it('la modalità offline fa girare i casi con le immagini e il rapporto li legge', async () => {
    const dir = tmp();
    const cases = [photoCase(dir, 'falo'), photoCase(dir, 'barile'), photoCase(dir, 'pozzo')];
    const ledger = path.join(dir, 'consumi.jsonl');
    await runBench({ run: 'img-offline', judges: [new OfflineJudge('jev-1.13.0'), new OfflineJudge('gemini-3.1-flash-lite')], cases, variant: 'lati4', ledger, budget: new Budget({}, []) });
    await runBench({ run: 'img-offline-ripeti', judges: [new OfflineJudge('jev-1.13.0')], cases, variant: 'lati4', ledger, budget: new Budget({}, []) });
    const lines = readLedger(ledger);
    expect(lines).toHaveLength(9);
    expect(lines.every((l) => l.ok && l.usd === 0 && l.input_tokens > 300)).toBe(true);
    const casesFile = path.join(dir, 'immagini.json');
    fs.writeFileSync(casesFile, JSON.stringify({ group: 'immagini', description: 'prova', cases }));
    const rep = imageReport(lines, casesFile);
    expect(rep).toContain('## I difetti fatti apposta');
    expect(rep).toContain('| jev-1.13.0 | difetto |');
    expect(rep).toMatch(/\| jev-1\.13\.0 \| difetto \| 15\/15 \(100 %\)/);
  });

  it('un riferimento è opaco e stabile per la sua foto', () => {
    expect(refOf('edifici/finale/rocca/1/lati4')).toBe(refOf('edifici/finale/rocca/1/lati4'));
    expect(refOf('a')).not.toBe(refOf('b'));
    expect(refOf('a')).toMatch(/^img-[0-9a-f]{10}$/);
  });
});
