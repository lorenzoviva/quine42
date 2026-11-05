// T260 + T273: the four universes one can explore (the seed `universe/` for aurora, and the three of Claude Cloud in
// lab/banco/universi-cloud/) say the kernel they were written for, and that kernel is this one: the same X.Y, a Z not above ours.
// And what Claude Cloud made is in them (lab/banco/universi-cloud/strumenti/integra.ts): every structure of the theme's catalogue stands
// on a lot of a planned place, from the library (no `wanted`: the Sculptor is never asked), at the size the plan says, and the plans pass
// the validator. Zero calls to a model: MockAiModels only.

import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runGit } from '../server/git';
import { upgradeFromSeed } from '../src/kernel/universes';
import { leggiUniverso } from '../lab/banco/universi-cloud/strumenti/carica';
import { installa } from '../lab/banco/universi-cloud/strumenti/installa';
import { MockAiModels } from '../src/kernel/ai/mock';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { checkKernelVersion, KERNEL_VERSION, parseVersion } from '../src/kernel/version';
import { soundPrograms } from '../src/mj/sound';
import { collocate, leggi, luogoDi, modelloDi, props, strutture, suoni, UNIVERSI } from '../lab/banco/universi-cloud/strumenti/cloud';

describe('the four universes say their kernel', () => {
  for (const u of UNIVERSI) {
    it(`${u.nome} is of this kernel's contract`, () => {
      const cfg = JSON.parse(leggi(u).files['universe.json']) as { name: string; kernel?: unknown };
      expect(cfg.name).toBe(u.nome);
      // Written, not implied: a universe without the field would be read as 0.1.0.
      expect(typeof cfg.kernel).toBe('string');
      expect(parseVersion(cfg.kernel)).toBeDefined();
      expect(checkKernelVersion(cfg.kernel, KERNEL_VERSION)).toEqual({ ok: true });
    });
  }
});

describe('what Claude Cloud made, in the four universes', () => {
  for (const u of UNIVERSI) {
    describe(u.nome, () => {
      const { files, maps } = leggi(u);
      const index = JSON.parse(files['models/index.json']) as Record<string, { classe?: string; sotto?: number; taglia?: string; suono?: unknown }>;
      const catalogo = strutture(u.tema);

      it(`has the ${catalogo.length} structures of its theme (${u.tema}), the props and the sounds in its library`, () => {
        expect(catalogo.length).toBe(12);
        for (const s of catalogo) {
          expect(index[s.id], s.id).toMatchObject({ classe: 'grande' });
          expect(files[`models/${s.id}.xml`], s.id).toBeTruthy();
          // A cellar is a tile under the ground (ADR-0135): without `sotto` the library would cut it off.
          expect(index[s.id].sotto, s.id).toBe(s.cantina ? 1 : undefined);
        }
        for (const p of props(u.tema)) expect(index[p.id]?.classe, p.id).toBe(p.voce.classe);
        const programs = new Map(soundPrograms(files).map((p) => [p.id, p]));
        for (const m of suoni(u)) expect(programs.get(m.id)?.suono, m.id).toEqual(m.voce.suono);
        for (const f of Object.keys(files).filter((p) => /^models\/[^/]+\.xml$/.test(p))) expect(index[f.slice(7, -4)], f).toBeDefined();
      });

      it('builds every structure of its plans from the library, at the size the plan says, and the plans pass the validator', async () => {
        const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
        const layouts = new Set(Object.keys(k.content.layouts));
        const placeable = new Set([...k.modules.values()].filter((m) => m.manifest.kind === 'entity' || m.manifest.kind === 'item').map((m) => m.manifest.id));
        for (const [name, rec] of Object.entries(maps)) {
          expect(luogoDi(files, name), name).toBeDefined();
          const v = k.validator.validatePlan(rec.plan, layouts, placeable);
          expect([...v.errors, ...v.dropped], name).toEqual([]);
          for (const s of rec.plan.strutture ?? []) expect(k.forms.resolve(modelloDi(s.concetto), 'grande'), `${name}: ${s.concetto}`).toBe(modelloDi(s.concetto));
        }
        const { strutture: placed, problemi } = await collocate(files, maps);
        expect(problemi).toEqual([]);
        expect(placed.filter((p) => p.wanted)).toEqual([]);
        // Every structure of the catalogue stands somewhere, and the one Enorme of the zone is its model's size.
        const ids = new Set(placed.map((p) => p.modello));
        for (const s of catalogo) expect(ids.has(s.id), s.id).toBe(true);
        for (const p of placed) if (p.taglia === 'enorme') expect(index[p.modello]?.taglia, p.modello).toBe('enorme');
        expect(placed.filter((p) => p.taglia === 'enorme').length).toBeLessThanOrEqual(1);
      });
    });
  }
});

describe('the installation in universes/ (lab/scripts/installa-universi-cloud.ts)', () => {
  it('writes four git repositories of a world already born, that the browser loads without committing anything', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'universi-cloud-'));
    try {
      const done = await installa({ dir });
      expect(done.map((d) => d.nome)).toEqual(UNIVERSI.map((u) => u.nome));
      const seed = leggiUniverso(path.resolve('universe') + '/').files;
      for (const d of done) {
        const root = path.join(dir, d.nome);
        const log = await runGit(root, ['log', '--format=%an %s'], { author: ['Prova', 'prova@rune.local'] });
        // `needsGenesis` looks for a commit that starts with «genesi:»: the world is not asked for again.
        expect(log.trim().split('\n')).toEqual([expect.stringMatching(/^Genesi genesi: /)]);
        expect((await runGit(root, ['status', '--porcelain'], { author: ['Prova', 'prova@rune.local'] })).trim()).toBe('');
        expect(existsSync(path.join(dir, '.saldi', `${d.nome}.json`))).toBe(true);
        // What the browser reads (the snapshot leaves maps/ out) and upgrades from the seed at every load: nothing left to change.
        const { files } = leggiUniverso(root + '/');
        expect(Object.keys(upgradeFromSeed(files, seed).changes)).toEqual([]);
        expect(readdirSync(path.join(root, 'maps')).length).toBe(d.luoghi);
        expect(d.strutture).toBeGreaterThanOrEqual(12);
      }
      // Installed again, what was there goes aside, never away.
      const again = await installa({ dir, nomi: ['sidera'] });
      expect(again[0].cestino).toBeDefined();
      expect(existsSync(path.join(again[0].cestino!, 'universe.json'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
