import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { canonBreak, readPlots, reviewPlot, writePlots, PLOTS_FILE, type Plot } from '../src/kernel/plots';
import { repairSociety, type People, type Person } from '../src/kernel/society';
import type { TextCall } from '../src/kernel/ai/models';
import type { FileMap } from '../src/kernel/types';

const cats = (t: string) => (t === 'npc.cat' ? 'animale' : 'persona') as 'animale' | 'persona';

function person(nome: string, tipo: string, genere: 'maschio' | 'femmina', famiglia: Array<[string, string]>, mestiere = 'contadino'): Person {
  return { nome, tipo, genere, mestiere, famiglia: famiglia.map(([n, legame]) => ({ nome: n, legame })), routine: [] };
}

// The people of the plots of valmora (22/10/2026): Fiocco is a cat, Bastiano his owner, Tazio a miller
// who is nobody's brother, Ada and Berta sisters.
const society = (): People =>
  repairSociety(
    {
      persone: [
        person('Fiocco', 'npc.cat', 'maschio', [['Bastiano', 'animale']], 'Cacciatore di topi'),
        person('Bastiano', 'npc.villager', 'maschio', [], 'fornaio'),
        person('Tazio il Mugnaio', 'npc.villager', 'maschio', [], 'mugnaio'),
        person('Ada', 'npc.villager', 'femmina', [['Berta', 'sorella']], 'tessitrice'),
        person('Berta', 'npc.villager', 'femmina', [], 'ortolana'),
      ],
      attesi: [],
    },
    cats,
  ).people;

const plot = (p: Partial<Plot>): Plot => ({ id: 'trama-t', titolo: 'Una storia', mistero: '', coinvolti: [], tappe: [], inizio: 0, stato: 'attiva', ...p });
const beat = (chi: string, cosa: string, battuta?: string) => ({ giorno: 0, momento: 'giorno' as const, chi, dove: 'piazza', cosa, ...(battuta ? { battuta } : {}) });

describe('plots coherent with the people', () => {
  it('a coherent plot passes untouched: real relations, animals as animals', () => {
    const p = plot({
      mistero: 'Ada, sorella di Berta, nasconde un debito. Fiocco lo sa.',
      tappe: [beat('Ada', 'conta le monete sotto il letto', 'Mia sorella Berta non deve saperlo.'), beat('Fiocco', 'si struscia sulle gambe di Bastiano'), beat('Berta', 'osserva sua sorella Ada')],
      missione: { da: 'Bastiano', testo: 'Porta questa mela a Berta.', obiettivo: { tipo: 'porta', oggetto: 'mela', a: 'Berta' }, stato: 'offerta' },
    });
    const r = reviewPlot(p, society());
    expect(r.problems).toEqual([]);
    expect(r.plot!.coinvolti).toEqual(['Ada', 'Fiocco', 'Berta']);
    expect(r.plot!.missione?.da).toBe('Bastiano');
  });

  it('repairs what it can: unknown people go, animals stay silent and ask nothing', () => {
    // «Il Ciclo delle Lettere Dimenticate», without its fourth-wall lines: a cat that talks and gives a quest.
    const p = plot({
      tappe: [beat('Fiocco', 'scava vicino al pozzo', 'Non è terra, è una lingua.'), beat('Ottone', 'osserva il lago'), beat('Fiocco', 'scrive un biglietto'), beat('Bastiano', 'osserva il lago')],
      missione: { da: 'Fiocco', testo: 'Porta questo sigillo a Bastiano.', obiettivo: { tipo: 'porta', oggetto: 'sigillo', a: 'Bastiano' }, stato: 'offerta' },
    });
    const r = reviewPlot(p, society());
    expect(r.problems.join('\n')).toMatch(/Fiocco è un animale e non parla/);
    expect(r.problems.join('\n')).toMatch(/Ottone non esiste/);
    expect(r.problems.join('\n')).toMatch(/Fiocco è un animale e non «scrive»/);
    expect(r.problems.join('\n')).toMatch(/non chiede nulla al viandante/);
    expect(r.plot!.tappe.map((b) => b.chi)).toEqual(['Fiocco', 'Bastiano']);
    expect(r.plot!.tappe[0].battuta).toBeUndefined();
    expect(r.plot!.missione).toBeUndefined();
    // Repaired, it has nothing left to repair.
    expect(reviewPlot(r.plot!, society()).problems).toEqual([]);
  });

  it('a plot that contradicts the registry cannot be repaired', () => {
    const people = society();
    // «Il Ritmo del Lago Muto»: Tazio calls Bastiano his brother; they are nothing to each other.
    const lake = reviewPlot(plot({ tappe: [beat('Tazio il Mugnaio', 'macina grano', 'Mio fratello Bastiano ha paura.'), beat('Bastiano', 'conta le onde')] }), people);
    expect(lake.plot).toBeUndefined();
    expect(lake.problems[0]).toMatch(/per il registro Bastiano non è parente di Tazio il Mugnaio/);
    // «Fiocco, fratello di Bastiano»: Bastiano is the cat's owner.
    const cat = reviewPlot(plot({ mistero: 'Bastiano, fratello di Fiocco, tace.', tappe: [beat('Bastiano', 'tace'), beat('Ada', 'cuce')] }), people);
    expect(cat.problems[0]).toMatch(/Bastiano è padrone di Fiocco/);
    // Sisters are sisters, not mothers.
    expect(reviewPlot(plot({ tappe: [beat('Ada', 'cuce', 'Mia madre Berta è severa.')] }), people).problems[0]).toMatch(/Berta è sorella di Ada/);
  });

  it('the runes do only what the canon says', () => {
    expect(canonBreak('Di notte la runa si sposta verso il pozzo.')).toBeTruthy();
    expect(canonBreak('Le rune sussurrano a chi le calpesta.')).toBeTruthy();
    expect(canonBreak('Una runa nuova è apparsa nel campo.')).toBeTruthy();
    expect(canonBreak('Le rune non si spostano: restano dove sono.')).toBeUndefined();
    expect(canonBreak('Ada nasconde una runa nella cassa e la vende a un mercante.')).toBeUndefined();
    expect(canonBreak('La runa chiamata Sowilo è stata rubata.')).toBeUndefined();
    const r = reviewPlot(plot({ mistero: 'La runa del pozzo canta di notte.', tappe: [beat('Ada', 'ascolta'), beat('Berta', 'dorme')] }), society());
    expect(r.plot).toBeUndefined();
    expect(r.problems[0]).toMatch(/le rune non fanno ciò che il canone non dice/);
    // Nor other glowing signs, nor hints at the game.
    const doubles = reviewPlot(plot({ tappe: [beat('Ada', 'scava vicino a un simbolo luminoso'), beat('Berta', 'dorme')] }), society());
    expect(doubles.plot).toBeUndefined();
    expect(doubles.problems[0]).toMatch(/quarta parete o duplica le rune/);
  });
});

/** Mock models whose Narrator answers the plots given, in order, and records the prompts. */
function narrator(answers: unknown[]) {
  const asked: TextCall[] = [];
  const models = new MockModels();
  const text = models.text.bind(models);
  models.text = async (call: TextCall) => {
    if (call.task !== 'plot.weave') return text(call);
    asked.push(call);
    return JSON.stringify(answers[Math.min(asked.length - 1, answers.length - 1)]);
  };
  return { models, asked };
}

async function bootWith(models: MockModels, extra: FileMap = {}) {
  const files: FileMap = { ...bundledFiles, 'world/people.json': JSON.stringify(society()), ...extra };
  return Kernel.boot({ files, store: memoryStore(), models });
}

const incoherent = { titolo: 'Il gatto che parla', mistero: 'Bastiano, fratello di Fiocco, mente.', coinvolti: ['Fiocco'], tappe: [beat('Fiocco', 'guarda il pozzo', 'Miao.'), beat('Ada', 'cuce')] };
const coherent = { titolo: 'Il debito di Ada', mistero: 'Ada nasconde un debito a sua sorella.', coinvolti: ['Ada', 'Berta'], tappe: [beat('Ada', 'conta le monete', 'Mia sorella Berta non deve saperlo.'), beat('Berta', 'cerca qualcosa in casa')] };

describe('the Narrator weaves coherent plots', () => {
  it('what does not hold goes back to the Narrator with the reasons; the second answer is kept', async () => {
    const { models, asked } = narrator([incoherent, coherent]);
    const k = await bootWith(models);
    const p = (await k.weaveStory(true))!;
    expect(asked.length).toBe(2);
    expect(asked[0].prompt).toMatch(/COERENZA/);
    expect(asked[1].prompt).toMatch(/DA CORREGGERE[\s\S]*Fiocco è un animale e non parla[\s\S]*Bastiano è padrone di Fiocco/);
    expect(p.titolo).toBe('Il debito di Ada');
    expect(readPlots(k.files).map((x) => x.titolo)).toEqual(['Il debito di Ada']);
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
      plot({ id: 'a', titolo: 'Il gatto che parla', tappe: [beat('Fiocco', 'guarda il pozzo', 'Miao, ascoltami.'), beat('Ada', 'cuce')] }),
      plot({ id: 'b', titolo: 'Il fratello finto', tappe: [beat('Tazio il Mugnaio', 'macina', 'Mio fratello Bastiano ha paura.'), beat('Ada', 'cuce')] }),
      plot({ id: 'c', titolo: 'Il debito di Ada', tappe: coherent.tappe }),
      plot({ id: 'd', titolo: 'Chiusa', stato: 'chiusa', tappe: [beat('Nessuno', 'niente')] }),
    ];
    const k = await bootWith(new MockModels(), { [PLOTS_FILE]: writePlots(plots) });
    const after = readPlots(k.files);
    expect(after.map((p) => p.id)).toEqual(['a', 'c', 'd']);
    expect(after[0].tappe[0].battuta).toBeUndefined();
    expect(k.repo.log().some((c) => c.message.startsWith('trame:'))).toBe(true);
    expect(k.reviewPlots()).toEqual([]);
  });
});
