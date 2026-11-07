import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { canonBreak, readPlots, reviewPlot, writePlots, PLOTS_FILE, type Plot } from '../src/kernel/npc/plots';
import { repairSociety, type People, type Individual } from '../src/kernel/npc/society';
import type { TextCall } from '../src/kernel/ai/models';
import type { FileMap } from '../src/kernel/types';

const cats = (t: string) => (t === 'npc.cat' ? 'animal' : 'person') as 'animal' | 'person';

function individual(nome: string, tipo: string, genere: 'male' | 'female', famiglia: Array<[string, string]>, mestiere = 'contadino'): Individual {
  return { name: nome, kind: tipo, gender: genere, job: mestiere, family: famiglia.map(([n, legame]) => ({ name: n, bond: legame })), routine: [] };
}

// The people of the plots of valmora (22/10/2026): Fiocco is a cat, Bastiano his owner, Tazio a miller
// who is nobody's brother, Ada and Berta sisters.
const society = (): People =>
  repairSociety(
    {
      people: [
        individual('Fiocco', 'npc.cat', 'male', [['Bastiano', 'animale']], 'Cacciatore di topi'),
        individual('Bastiano', 'npc.villager', 'male', [], 'fornaio'),
        individual('Tazio il Mugnaio', 'npc.villager', 'male', [], 'mugnaio'),
        individual('Ada', 'npc.villager', 'female', [['Berta', 'sorella']], 'tessitrice'),
        individual('Berta', 'npc.villager', 'female', [], 'ortolana'),
      ],
      expected: [],
    },
    cats,
  ).people;

const plot = (p: Partial<Plot>): Plot => ({ id: 'trama-t', title: 'Una storia', mystery: '', involved: [], beats: [], start: 0, state: 'active', ...p });
const beat = (chi: string, cosa: string, battuta?: string) => ({ day: 0, moment: 'day' as const, who: chi, where: 'square', what: cosa, ...(battuta ? { line: battuta } : {}) });

describe('plots coherent with the people', () => {
  it('a coherent plot passes untouched: real relations, animals as animals', () => {
    const p = plot({
      mystery: 'Ada, sorella di Berta, nasconde un debito. Fiocco lo sa.',
      beats: [beat('Ada', 'conta le monete sotto il letto', 'Mia sorella Berta non deve saperlo.'), beat('Fiocco', 'si struscia sulle gambe di Bastiano'), beat('Berta', 'osserva sua sorella Ada')],
      quest: { from: 'Bastiano', text: 'Porta questa mela a Berta.', goal: { type: 'bring', item: 'mela', to: 'Berta' }, state: 'offered' },
    });
    const r = reviewPlot(p, society());
    expect(r.problems).toEqual([]);
    expect(r.plot!.involved).toEqual(['Ada', 'Fiocco', 'Berta']);
    expect(r.plot!.quest?.from).toBe('Bastiano');
  });

  it('repairs what it can: unknown people go, animals stay silent and ask nothing', () => {
    // «Il Ciclo delle Lettere Dimenticate», without its fourth-wall lines: a cat that talks and gives a quest.
    const p = plot({
      beats: [beat('Fiocco', 'scava vicino al pozzo', 'Non è terra, è una lingua.'), beat('Ottone', 'osserva il lago'), beat('Fiocco', 'scrive un biglietto'), beat('Bastiano', 'osserva il lago')],
      quest: { from: 'Fiocco', text: 'Porta questo sigillo a Bastiano.', goal: { type: 'bring', item: 'sigillo', to: 'Bastiano' }, state: 'offered' },
    });
    const r = reviewPlot(p, society());
    expect(r.problems.join('\n')).toMatch(/Fiocco è un animale e non parla/);
    expect(r.problems.join('\n')).toMatch(/Ottone non esiste/);
    expect(r.problems.join('\n')).toMatch(/Fiocco è un animale e non «scrive»/);
    expect(r.problems.join('\n')).toMatch(/non chiede nulla al viandante/);
    expect(r.plot!.beats.map((b) => b.who)).toEqual(['Fiocco', 'Bastiano']);
    expect(r.plot!.beats[0].line).toBeUndefined();
    expect(r.plot!.quest).toBeUndefined();
    // Repaired, it has nothing left to repair.
    expect(reviewPlot(r.plot!, society()).problems).toEqual([]);
  });

  it('a plot that contradicts the registry cannot be repaired', () => {
    const people = society();
    // «Il Ritmo del Lago Muto»: Tazio calls Bastiano his brother; they are nothing to each other.
    const lake = reviewPlot(plot({ beats: [beat('Tazio il Mugnaio', 'macina grano', 'Mio fratello Bastiano ha paura.'), beat('Bastiano', 'conta le onde')] }), people);
    expect(lake.plot).toBeUndefined();
    expect(lake.problems[0]).toMatch(/per il registro Bastiano non è parente di Tazio il Mugnaio/);
    // «Fiocco, fratello di Bastiano»: Bastiano is the cat's owner.
    const cat = reviewPlot(plot({ mystery: 'Bastiano, fratello di Fiocco, tace.', beats: [beat('Bastiano', 'tace'), beat('Ada', 'cuce')] }), people);
    expect(cat.problems[0]).toMatch(/Bastiano è padrone di Fiocco/);
    // Sisters are sisters, not mothers.
    expect(reviewPlot(plot({ beats: [beat('Ada', 'cuce', 'Mia madre Berta è severa.')] }), people).problems[0]).toMatch(/Berta è sorella di Ada/);
  });

  it('the runes do only what the canon says', () => {
    expect(canonBreak('Di notte la runa si sposta verso il pozzo.')).toBeTruthy();
    expect(canonBreak('Le rune sussurrano a chi le calpesta.')).toBeTruthy();
    expect(canonBreak('Una runa nuova è apparsa nel campo.')).toBeTruthy();
    expect(canonBreak('Le rune non si spostano: restano dove sono.')).toBeUndefined();
    expect(canonBreak('Ada nasconde una runa nella cassa e la vende a un mercante.')).toBeUndefined();
    expect(canonBreak('La runa chiamata Sowilo è stata rubata.')).toBeUndefined();
    const r = reviewPlot(plot({ mystery: 'La runa del pozzo canta di notte.', beats: [beat('Ada', 'ascolta'), beat('Berta', 'dorme')] }), society());
    expect(r.plot).toBeUndefined();
    expect(r.problems[0]).toMatch(/le rune non fanno ciò che il canone non dice/);
    // Nor other glowing signs, nor hints at the game.
    const doubles = reviewPlot(plot({ beats: [beat('Ada', 'scava vicino a un simbolo luminoso'), beat('Berta', 'dorme')] }), society());
    expect(doubles.plot).toBeUndefined();
    expect(doubles.problems[0]).toMatch(/quarta parete o duplica le rune/);
  });
});

/** Mock models whose Narrator answers the plots given, in order, and records the prompts. */
function narrator(answers: unknown[]) {
  const asked: TextCall[] = [];
  const models = new MockAiModels();
  const text = models.text.bind(models);
  models.text = async (call: TextCall) => {
    if (call.task !== 'plot.weave') return text(call);
    asked.push(call);
    return JSON.stringify(answers[Math.min(asked.length - 1, answers.length - 1)]);
  };
  return { models, asked };
}

async function bootWith(models: MockAiModels, extra: FileMap = {}) {
  const files: FileMap = { ...bundledFiles, 'world/people.json': JSON.stringify(society()), ...extra };
  return Kernel.boot({ files, store: memoryStore(), ai: models });
}

/** A beat as the Narrator writes it, with the Italian fields of its schema (until T310). */
const beatIt = (chi: string, cosa: string, battuta?: string) => ({ giorno: 0, momento: 'day' as const, chi, dove: 'square', cosa, ...(battuta ? { battuta } : {}) });
const incoherent = { titolo: 'Il gatto che parla', mistero: 'Bastiano, fratello di Fiocco, mente.', coinvolti: ['Fiocco'], tappe: [beatIt('Fiocco', 'guarda il pozzo', 'Miao.'), beatIt('Ada', 'cuce')] };
const coherent = { titolo: 'Il debito di Ada', mistero: 'Ada nasconde un debito a sua sorella.', coinvolti: ['Ada', 'Berta'], tappe: [beatIt('Ada', 'conta le monete', 'Mia sorella Berta non deve saperlo.'), beatIt('Berta', 'cerca qualcosa in casa')] };

describe('the Narrator weaves coherent plots', () => {
  it('what does not hold goes back to the Narrator with the reasons; the second answer is kept', async () => {
    const { models, asked } = narrator([incoherent, coherent]);
    const k = await bootWith(models);
    const p = (await k.weaveStory(true))!;
    expect(asked.length).toBe(2);
    expect(asked[0].prompt).toMatch(/CONSISTENCY/);
    expect(asked[1].prompt).toMatch(/TO FIX[\s\S]*Fiocco è un animale e non parla[\s\S]*Bastiano è padrone di Fiocco/);
    expect(p.title).toBe('Il debito di Ada');
    expect(readPlots(k.files).map((x) => x.title)).toEqual(['Il debito di Ada']);
    expect(k.feed().some((e) => e.kind === 'scarta' && e.task === 'plot.weave')).toBe(true);
  });

  it('a plot still incoherent is dropped, nothing is written', async () => {
    const { models, asked } = narrator([incoherent]);
    const k = await bootWith(models);
    expect(await k.weaveStory(true)).toBeUndefined();
    expect(asked.length).toBe(2);
    expect(readPlots(k.files)).toEqual([]);
  });

  it('at boot the open plots are repaired or retired, once, and committed', async () => {
    const plots: Plot[] = [
      plot({ id: 'a', title: 'Il gatto che parla', beats: [beat('Fiocco', 'guarda il pozzo', 'Miao, ascoltami.'), beat('Ada', 'cuce')] }),
      plot({ id: 'b', title: 'Il fratello finto', beats: [beat('Tazio il Mugnaio', 'macina', 'Mio fratello Bastiano ha paura.'), beat('Ada', 'cuce')] }),
      plot({ id: 'c', title: 'Il debito di Ada', beats: coherent.tappe.map((b) => ({ day: b.giorno, moment: b.momento, who: b.chi, where: b.dove, what: b.cosa, ...(b.battuta ? { line: b.battuta } : {}) })) }),
      plot({ id: 'd', title: 'Chiusa', state: 'closed', beats: [beat('Nessuno', 'niente')] }),
    ];
    const k = await bootWith(new MockAiModels(), { [PLOTS_FILE]: writePlots(plots) });
    const after = readPlots(k.files);
    expect(after.map((p) => p.id)).toEqual(['a', 'c', 'd']);
    expect(after[0].beats[0].line).toBeUndefined();
    expect(k.repo.log().some((c) => c.message.startsWith('trame:'))).toBe(true);
    expect(k.reviewPlots()).toEqual([]);
  });
});
