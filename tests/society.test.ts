import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { Council } from '../src/kernel/agents/council';
import { individuate } from '../src/kernel/agents/content';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { readPlots, writePlots, PLOTS_FILE, type Plot } from '../src/kernel/npc/plots';
import { addIndividual, applyRenames, checkSociety, readPeople, repairSociety, reverseRelation, similarNames, type People, type Individual } from '../src/kernel/npc/society';
import type { AiModels, TextCall } from '../src/kernel/ai/models';
import type { FileMap } from '../src/kernel/types';

const cats = (t: string) => (t === 'npc.cat' ? 'animal' : 'person') as 'animal' | 'person';

function individual(nome: string, tipo: string, famiglia: Array<[string, string]>, mestiere = 'contadino'): Individual {
  return { name: nome, kind: tipo, job: mestiere, family: famiglia.map(([n, legame]) => ({ name: n, bond: legame })), routine: [] };
}

/** What an individual is to another, after the repair. */
const rel = (p: People, a: string, b: string) => p.people.find((x) => x.name === a)?.family.find((r) => r.name === b)?.bond;

// The cases of valmora (the analysis of 22/10/2026 and the measures of T07).
const valmora = (): People => ({
  people: [
    individual('Micetto', 'npc.cat', [['Ombra', 'padrone'], ['Fiocco', 'figlio'], ['Elara', 'padrone'], ['Bruna', 'apprendista']], 'Cacciatore di topi'),
    individual('Ombra', 'npc.cat', [['Micetto', 'apprendista']], 'Cacciatore di topi'),
    individual('Fiocco', 'npc.cat', [['Bastiano', 'fratello'], ['Micetto', 'madre']], 'Cacciatore di topi'),
    individual('Bastiano', 'npc.villager', [['Fiocco', 'fratello']], 'fornaio'),
    individual('Elara', 'npc.villager', [['Micetto', 'apprendista'], ['Aldo', 'padre']], 'erborista'),
    individual('Bruna', 'npc.villager', [['Micetto', 'maestro']], 'erborista'),
    individual('Aldo', 'npc.villager', [['Marta', 'moglie'], ['Nessuno Mai', 'fratello']], 'bottaio'),
    individual('Marta', 'npc.villager', [], 'ortolana'),
    individual('Elias il Cercatore', 'npc.villager', [['Pino', 'fratello']], 'cartografo'),
    individual('Elias la Rossa', 'npc.villager', [['Pino', 'fratello']], 'cartografo'),
    individual('Ottone', 'npc.cat', [], 'tessitrice'),
  ],
  expected: [],
});

describe('a coherent society', () => {
  it('a cat has no human brother, no cat owner, no human apprentice, and one owner only', () => {
    const { people } = repairSociety(valmora(), cats);
    expect(people.people.find((p) => p.name === 'Micetto')!.species).toBe('animal');
    // "Fiocco is Bastiano's brother": across species, family becomes ownership.
    expect(rel(people, 'Fiocco', 'Bastiano')).toBe('animale');
    expect(rel(people, 'Bastiano', 'Fiocco')).toBe('padrone');
    // A cat is no cat's owner, and nobody is a cat's apprentice.
    expect(rel(people, 'Micetto', 'Ombra')).toBe('amico');
    expect(rel(people, 'Ombra', 'Micetto')).toBe('amica');
    expect(people.people.flatMap((p) => p.family).some((r) => /apprendista|maestr/.test(r.bond))).toBe(false);
    // Micetto has a single owner: Elara (the first said); Bruna is a friend.
    const owners = people.people.filter((p) => rel(people, p.name, 'Micetto') === 'padrona' || rel(people, p.name, 'Micetto') === 'padrone');
    expect(owners.map((p) => p.name)).toEqual(['Elara']);
    expect(rel(people, 'Bruna', 'Micetto')).toBe('amica');
    // Animals among themselves are family: Micetto is Fiocco's son, Fiocco (male) his father.
    expect(rel(people, 'Micetto', 'Fiocco')).toBe('figlio');
    expect(rel(people, 'Fiocco', 'Micetto')).toBe('padre');
    // A cat does what cats do.
    expect(people.people.find((p) => p.name === 'Ottone')!.job).toBe('Cacciatore di topi');
  });

  it('relations agree with the gender and exist on both sides; nobody named is lost', () => {
    const { people } = repairSociety(valmora(), cats);
    // Elara said she is Aldo's «padre»: a woman is a mother; Aldo is her son.
    expect(rel(people, 'Elara', 'Aldo')).toBe('madre');
    expect(rel(people, 'Aldo', 'Elara')).toBe('figlio');
    // Aldo said "moglie": he is Marta's husband, and she knows it.
    expect(rel(people, 'Aldo', 'Marta')).toBe('marito');
    expect(rel(people, 'Marta', 'Aldo')).toBe('moglie');
    // Every relation between two people met has its other side.
    for (const p of people.people) for (const r of p.family) {
      const q = people.people.find((x) => x.name === r.name);
      if (q) expect(q.family.some((x) => x.name === p.name)).toBe(true);
    }
    // Someone named and never met is awaited, as what they are to who named them.
    expect(people.expected).toContainEqual({ name: 'Nessuno Mai', bond: 'fratello', of: 'Aldo' });
    expect(reverseRelation('madre', 'female')).toBe('figlia');
    expect(reverseRelation('padrone', 'male', 'person', 'animal')).toBe('animale');
  });

  it('one father, one mother, one spouse; spouses are not children of the same parent', () => {
    const { people, fixes } = repairSociety({
      people: [
        individual('Aldo', 'npc.villager', [['Marta', 'marito'], ['Pino', 'figlio'], ['Cosimo', 'figlio']]),
        individual('Marta', 'npc.villager', [['Pino', 'figlia']]),
        individual('Pino', 'npc.villager', []),
        individual('Cosimo', 'npc.villager', []),
      ],
      expected: [],
    });
    expect(rel(people, 'Aldo', 'Pino')).toBe('figlio');
    expect(rel(people, 'Aldo', 'Cosimo')).toBe('conoscente');
    expect(rel(people, 'Marta', 'Pino')).toBe('conoscente');
    expect(fixes.some((f) => /genitore del suo coniuge/.test(f))).toBe(true);
  });

  it('names are not alike: later namesakes get a new name, in the society and in the plots', () => {
    expect(similarNames('Elias il Giovane', 'Elias la Rossa')).toBe(true);
    expect(similarNames('Vecchia Elara', 'Elara del Pozzo')).toBe(true);
    expect(similarNames('Ombra', 'Ombroso')).toBe(true);
    expect(similarNames('Elia delle Rive', 'Elias')).toBe(true);
    expect(similarNames('Isolde del Riflesso', 'Lyra del Riflesso')).toBe(false);
    expect(similarNames('Marta', 'Aldo')).toBe(false);
    const { people, renames } = repairSociety(valmora(), cats);
    expect(renames.map(([a]) => a)).toEqual(['Elias la Rossa']);
    const nuovo = renames[0][1];
    expect(people.people.map((p) => p.name)).toContain(nuovo);
    expect(people.people.every((p, i) => people.people.every((q, j) => i === j || !similarNames(p.name, q.name)))).toBe(true);
    // Pino (awaited) knows the new name; a plot follows it too, but leaves "Elias il Cercatore" alone.
    expect(people.expected.some((a) => a.name === 'Pino' && a.of === 'Elias il Cercatore')).toBe(true);
    const plot = { titolo: 'Due cartografi', mistero: 'Elias la Rossa e Elias il Cercatore litigano', coinvolti: ['Elias la Rossa'], tappe: [{ chi: 'Elias la Rossa', cosa: 'parla con Elias il Cercatore' }] };
    const renamed = applyRenames(plot, renames);
    expect(renamed.coinvolti).toEqual([nuovo]);
    expect(renamed.mistero).toBe(`${nuovo} e Elias il Cercatore litigano`);
  });

  it('the repair is the validator: a repaired society has nothing left to repair', () => {
    const first = repairSociety(valmora(), cats);
    expect(first.fixes.length).toBeGreaterThan(10);
    expect(checkSociety(first.people, cats)).toEqual([]);
    // Adding someone keeps it coherent: the other side is written, in the right gender.
    const next = addIndividual(first.people, { ...individual('Gemma', 'npc.villager', [['Marta', 'sorella']]), gender: 'female' }, cats);
    expect(rel(next, 'Marta', 'Gemma')).toBe('sorella');
    expect(checkSociety(next, cats)).toEqual([]);
  });

  it('the Narrator is told the species, the gender and what relations are possible', async () => {
    const asked: TextCall[] = [];
    const models = { text: async (r: TextCall) => (asked.push(r), JSON.stringify({ nome: 'Briciola', persona: 'Sei Briciola', aspetto: 'pelo grigio', porta: [], mestiere: 'caccia topi', genere: 'female', famiglia: [], routine: [] })) } as unknown as AiModels;
    const c = new Council(models, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const id = await individuate(c, { name: 'Gatto', description: 'un gatto', persona: 'Sei un gatto', specie: 'animal' }, { place: 'piazza', common: [], avoid: ['Ombra'] });
    expect(id.gender).toBe('female');
    const prompt = asked[0].prompt;
    expect(prompt).toContain('an animal');
    expect(prompt).toMatch(/It is an ANIMAL: no trades of a person/);
    expect(prompt).toMatch(/what YOU are to that person/);
    expect(prompt).toContain('NOT to use: Ombra');
  });

  it('at boot the kernel repairs an old registry and commits it; new people are unlike the others', async () => {
    const files: FileMap = { ...bundledFiles, 'world/people.json': JSON.stringify(valmora()) };
    const plots: Plot[] = [{ id: 'trama-x', title: 'Cartografi', mystery: 'Elias la Rossa nasconde una mappa', involved: ['Elias la Rossa'], beats: [{ day: 0, moment: 'day', who: 'Elias la Rossa', where: 'square', what: 'disegna' }], start: 0, state: 'active' }];
    files[PLOTS_FILE] = writePlots(plots);
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    expect(k.repo.log().some((c) => c.message.startsWith('società:'))).toBe(true);
    const people = readPeople(k.files);
    expect(rel(people, 'Fiocco', 'Bastiano')).toBe('animale');
    expect(people.people.some((p) => p.name === 'Elias la Rossa')).toBe(false);
    expect(readPlots(k.files)[0].beats[0].who).not.toBe('Elias la Rossa');
    expect(k.speciesOf('npc.cat')).toBe('animal');
    expect(k.speciesOf('npc.villager')).toBe('person');
    // Nothing more to repair at the next boot.
    expect(k.reviewSociety()).toEqual([]);
    // Two newcomers of the same kind: their names are unlike each other and everyone's.
    const pc = k.wandererCarpet();
    for (const i of [1, 2, 3]) {
      const e = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + i, pc.y, undefined, `test#n${i}`);
      await k.ensureIdentity(e);
    }
    const after = readPeople(k.files);
    expect(after.people.every((p, i) => after.people.every((q, j) => i === j || !similarNames(p.name, q.name)))).toBe(true);
    expect(after.people.every((p) => p.gender && p.species)).toBe(true);
    expect(checkSociety(after, (t) => k.speciesOf(t))).toEqual([]);
  });
});
