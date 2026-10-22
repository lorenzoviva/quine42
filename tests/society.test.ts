import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { Council } from '../src/kernel/agents/council';
import { individuate } from '../src/kernel/agents/content';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { readPlots, writePlots, PLOTS_FILE, type Plot } from '../src/kernel/plots';
import { addPerson, applyRenames, checkSociety, readPeople, repairSociety, reverseRelation, similarNames, type People, type Person } from '../src/kernel/society';
import type { Models, TextCall } from '../src/kernel/ai/models';
import type { FileMap } from '../src/kernel/types';

const cats = (t: string) => (t === 'npc.cat' ? 'animale' : 'persona') as 'animale' | 'persona';

function person(nome: string, tipo: string, famiglia: Array<[string, string]>, mestiere = 'contadino'): Person {
  return { nome, tipo, mestiere, famiglia: famiglia.map(([n, legame]) => ({ nome: n, legame })), routine: [] };
}

/** What a person is to another, after the repair. */
const rel = (p: People, a: string, b: string) => p.persone.find((x) => x.nome === a)?.famiglia.find((r) => r.nome === b)?.legame;

// The cases of valmora (the analysis of 22/10/2026 and the measures of T07).
const valmora = (): People => ({
  persone: [
    person('Micetto', 'npc.cat', [['Ombra', 'padrone'], ['Fiocco', 'figlio'], ['Elara', 'padrone'], ['Bruna', 'apprendista']], 'Cacciatore di topi'),
    person('Ombra', 'npc.cat', [['Micetto', 'apprendista']], 'Cacciatore di topi'),
    person('Fiocco', 'npc.cat', [['Bastiano', 'fratello'], ['Micetto', 'madre']], 'Cacciatore di topi'),
    person('Bastiano', 'npc.villager', [['Fiocco', 'fratello']], 'fornaio'),
    person('Elara', 'npc.villager', [['Micetto', 'apprendista'], ['Aldo', 'padre']], 'erborista'),
    person('Bruna', 'npc.villager', [['Micetto', 'maestro']], 'erborista'),
    person('Aldo', 'npc.villager', [['Marta', 'moglie'], ['Nessuno Mai', 'fratello']], 'bottaio'),
    person('Marta', 'npc.villager', [], 'ortolana'),
    person('Elias il Cercatore', 'npc.villager', [['Pino', 'fratello']], 'cartografo'),
    person('Elias la Rossa', 'npc.villager', [['Pino', 'fratello']], 'cartografo'),
    person('Ottone', 'npc.cat', [], 'tessitrice'),
  ],
  attesi: [],
});

describe('a coherent society', () => {
  it('a cat has no human brother, no cat owner, no human apprentice, and one owner only', () => {
    const { people } = repairSociety(valmora(), cats);
    expect(people.persone.find((p) => p.nome === 'Micetto')!.specie).toBe('animale');
    // "Fiocco is Bastiano's brother": across species, family becomes ownership.
    expect(rel(people, 'Fiocco', 'Bastiano')).toBe('animale');
    expect(rel(people, 'Bastiano', 'Fiocco')).toBe('padrone');
    // A cat is no cat's owner, and nobody is a cat's apprentice.
    expect(rel(people, 'Micetto', 'Ombra')).toBe('amico');
    expect(rel(people, 'Ombra', 'Micetto')).toBe('amica');
    expect(people.persone.flatMap((p) => p.famiglia).some((r) => /apprendista|maestr/.test(r.legame))).toBe(false);
    // Micetto has a single owner: Elara (the first said); Bruna is a friend.
    const owners = people.persone.filter((p) => rel(people, p.nome, 'Micetto') === 'padrona' || rel(people, p.nome, 'Micetto') === 'padrone');
    expect(owners.map((p) => p.nome)).toEqual(['Elara']);
    expect(rel(people, 'Bruna', 'Micetto')).toBe('amica');
    // Animals among themselves are family: Micetto is Fiocco's son, Fiocco (male) his father.
    expect(rel(people, 'Micetto', 'Fiocco')).toBe('figlio');
    expect(rel(people, 'Fiocco', 'Micetto')).toBe('padre');
    // A cat does what cats do.
    expect(people.persone.find((p) => p.nome === 'Ottone')!.mestiere).toBe('Cacciatore di topi');
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
    for (const p of people.persone) for (const r of p.famiglia) {
      const q = people.persone.find((x) => x.nome === r.nome);
      if (q) expect(q.famiglia.some((x) => x.nome === p.nome)).toBe(true);
    }
    // Someone named and never met is awaited, as what they are to who named them.
    expect(people.attesi).toContainEqual({ nome: 'Nessuno Mai', legame: 'fratello', di: 'Aldo' });
    expect(reverseRelation('madre', 'femmina')).toBe('figlia');
    expect(reverseRelation('padrone', 'maschio', 'persona', 'animale')).toBe('animale');
  });

  it('one father, one mother, one spouse; spouses are not children of the same parent', () => {
    const { people, fixes } = repairSociety({
      persone: [
        person('Aldo', 'npc.villager', [['Marta', 'marito'], ['Pino', 'figlio'], ['Cosimo', 'figlio']]),
        person('Marta', 'npc.villager', [['Pino', 'figlia']]),
        person('Pino', 'npc.villager', []),
        person('Cosimo', 'npc.villager', []),
      ],
      attesi: [],
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
    expect(people.persone.map((p) => p.nome)).toContain(nuovo);
    expect(people.persone.every((p, i) => people.persone.every((q, j) => i === j || !similarNames(p.nome, q.nome)))).toBe(true);
    // Pino (awaited) knows the new name; a plot follows it too, but leaves "Elias il Cercatore" alone.
    expect(people.attesi.some((a) => a.nome === 'Pino' && a.di === 'Elias il Cercatore')).toBe(true);
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
    const next = addPerson(first.people, { ...person('Gemma', 'npc.villager', [['Marta', 'sorella']]), genere: 'femmina' }, cats);
    expect(rel(next, 'Marta', 'Gemma')).toBe('sorella');
    expect(checkSociety(next, cats)).toEqual([]);
  });

  it('the Narrator is told the species, the gender and what relations are possible', async () => {
    const asked: TextCall[] = [];
    const models = { text: async (r: TextCall) => (asked.push(r), JSON.stringify({ nome: 'Briciola', persona: 'Sei Briciola', aspetto: 'pelo grigio', porta: [], mestiere: 'caccia topi', genere: 'femmina', famiglia: [], routine: [] })) } as unknown as Models;
    const c = new Council(models, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const id = await individuate(c, { name: 'Gatto', description: 'un gatto', persona: 'Sei un gatto', specie: 'animale' }, { place: 'piazza', common: [], avoid: ['Ombra'] });
    expect(id.gender).toBe('femmina');
    const prompt = asked[0].prompt;
    expect(prompt).toContain('un animale');
    expect(prompt).toMatch(/È un ANIMALE: niente mestieri da persona/);
    expect(prompt).toMatch(/cosa sei TU per quella persona/);
    expect(prompt).toContain('da NON usare: Ombra');
  });

  it('at boot the kernel repairs an old registry and commits it; new people are unlike the others', async () => {
    const files: FileMap = { ...bundledFiles, 'world/people.json': JSON.stringify(valmora()) };
    const plots: Plot[] = [{ id: 'trama-x', titolo: 'Cartografi', mistero: 'Elias la Rossa nasconde una mappa', coinvolti: ['Elias la Rossa'], tappe: [{ giorno: 0, momento: 'giorno', chi: 'Elias la Rossa', dove: 'piazza', cosa: 'disegna' }], inizio: 0, stato: 'attiva' }];
    files[PLOTS_FILE] = writePlots(plots);
    const k = await Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
    expect(k.repo.log().some((c) => c.message.startsWith('società:'))).toBe(true);
    const people = readPeople(k.files);
    expect(rel(people, 'Fiocco', 'Bastiano')).toBe('animale');
    expect(people.persone.some((p) => p.nome === 'Elias la Rossa')).toBe(false);
    expect(readPlots(k.files)[0].tappe[0].chi).not.toBe('Elias la Rossa');
    expect(k.speciesOf('npc.cat')).toBe('animale');
    expect(k.speciesOf('npc.villager')).toBe('persona');
    // Nothing more to repair at the next boot.
    expect(k.reviewSociety()).toEqual([]);
    // Two newcomers of the same kind: their names are unlike each other and everyone's.
    const pc = k.playerCarpet();
    for (const i of [1, 2, 3]) {
      const e = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + i, pc.y, undefined, `test#n${i}`);
      await k.ensureIdentity(e);
    }
    const after = readPeople(k.files);
    expect(after.persone.every((p, i) => after.persone.every((q, j) => i === j || !similarNames(p.nome, q.nome)))).toBe(true);
    expect(after.persone.every((p) => p.genere && p.specie)).toBe(true);
    expect(checkSociety(after, (t) => k.speciesOf(t))).toEqual([]);
  });
});
