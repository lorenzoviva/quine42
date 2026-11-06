// The realms of Step 37 on the bench (lab/banco/coming-soon-cloud/): what the verification script checks, in the suite, without the
// sound analysis (ten triples of seeds per program take a minute a realm: `npx vite-node lab/banco/coming-soon-cloud/verifica.ts`).
// And proof that the checks refuse what they must: a check that never fails says nothing.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { lexiconWords } from '../src/kernel/fourthwall';
import { checkModel, checkRunes, checkWorld, realmFiles, realmUniverse, REAMI, runRealm, TICKS } from '../lab/banco/coming-soon-cloud/verifica';

const present = REAMI.filter((r) => fs.existsSync(path.join('lab/banco/coming-soon-cloud', r, 'world/people.json')));
const seedWords = lexiconWords(bundledFiles['world/lexicon.md']);

describe.each(present)('il reame %s', (reame) => {
  const own = realmFiles(reame);
  const files = realmUniverse(reame);

  it('ten magic runes that the validator takes one after the other, each with its spell and its line of the canon', () => {
    const r = checkRunes(own, lexiconWords(own['world/lexicon.md']));
    expect(r.errori).toEqual([]);
    expect(r.rune).toBe(10);
  });

  it('people, plots, bible, atlas and every text of the realm pass the kernel validators and the fourth wall', () => {
    const w = checkWorld(files, own, seedWords);
    expect(w.errori).toEqual([]);
    expect(w.conteggi).toMatchObject({ persone: 16, trame: 6, regioni: 8 });
  });

  it('ten models that pass the game measures on five seeds and are not static', () => {
    const index = JSON.parse(own['models/index.json']) as Record<string, { class: string }>;
    const models = Object.entries(index).filter(([, v]) => v.class !== 'suono');
    expect(models.length).toBe(10);
    for (const [id] of models) expect(checkModel(id, own[`models/${id}.xml`]).errori).toEqual([]);
  });

  it(`runs on a real kernel: every module acted on, ${TICKS} ticks, no fault`, async () => {
    const ids = Object.keys(own).flatMap((p) => /^modules\/([^/]+)\/logic\.lua$/.exec(p)?.[1] ?? []);
    expect(ids.length).toBe(12);
    const r = await runRealm(files, ids, () => {});
    expect(r.errori).toEqual([]);
    expect(r.faults).toBe(0);
    expect(r.quarta).toBe(0);
    expect(r.tick).toBeGreaterThanOrEqual(TICKS);
  }, 120_000);
});

describe('la verifica dei reami rifiuta', () => {
  it('a plot that breaks the fourth wall, a person who does not exist, a relation said one way only', () => {
    const own = { ...realmFiles('pirati') };
    const plots = JSON.parse(own['world/plots.json']);
    plots.plots[0].mystery = 'Il giocatore trova un tesoro.';
    plots.plots[1].beats[0].who = 'Nessuno Inesistente';
    const people = JSON.parse(own['world/people.json']);
    people.people[0].family = people.people[0].family.filter((r: { bond: string }) => r.bond !== 'madre');
    const changed = { ...own, 'world/plots.json': JSON.stringify(plots), 'world/people.json': JSON.stringify(people) };
    const errori = checkWorld({ ...realmUniverse('pirati'), ...changed }, changed, seedWords).errori.join('\n');
    expect(errori).toMatch(/giocatore/);
    expect(errori).toMatch(/Nessuno Inesistente non esiste/);
    expect(errori).toMatch(/manca/);
  });

  it('a rune whose token is taken or too like another, and a spell whose effect the validator drops', () => {
    const own = realmFiles('pirati');
    const m = JSON.parse(own['modules/magic.runes/manifest.json']);
    m.runes.mareo = { ...m.runes.marea, name: 'Altra onda', glyph: '⛵' };
    m.spells.mareo = { name: 'Onda', description: 'Un\'onda.', cost: 4, effects: [{ tipo: 'teletrasporto' }] };
    const errori = checkRunes({ ...own, 'modules/magic.runes/manifest.json': JSON.stringify(m) }, []).errori.join('\n');
    expect(errori).toMatch(/troppo simile/);
    expect(errori).toMatch(/effetti scartati/);
  });

  it('a model that is the same on every seed, and one that floats', () => {
    const fixed = '<sequence values="BW" size="10 10 10"><color symbol="W" value="8c532b"/><box at="5 5 0" size="6 6 6" color="W"/></sequence>';
    expect(checkModel('fermo', fixed).errori.join()).toMatch(/statico/);
    const floating = '<sequence values="BW" size="10 10 10"><color symbol="W" value="8c532b"/><box at="5 5 4" size="6 6 3" color="W"/><prl in="B W" out="W W" p="0.3" steps="1"/></sequence>';
    expect(checkModel('sospeso', floating).errori.join()).toMatch(/terra|galleggia/);
  });
});
