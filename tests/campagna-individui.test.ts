// Individuals and plots the master declares (T376, ADR-0188 §5.2-5.3): the Referente's `individual` (the Narrator writes them with the
// facts given, where the master said; awaited until that place is planned), «Scrivi trama» of the Direction (the validator of the plots,
// no call, the beats play as the Narrator's do), «Modifica» on the lectern (the editor, nothing new for the Council).
import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { bundledFiles } from '../src/kernel/bundle';
import { MemoryChunks } from '../src/kernel/chunks';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { ATLAS_FILE, writeAtlas, readAtlas } from '../src/kernel/atlas';
import { buildGraph } from '../src/kernel/graph';
import { awaitedDeclared, declaredFor, masterPlot, readPeople, readPlots, PLOTS_FILE, type People } from '../src/kernel/npc/model';
import type { FileMap } from '../src/kernel/types';
import { developAll, manyPlayers } from './espressivita/banco';

class Recording extends MockAiModels {
  tasks: string[] = [];
  async text(call: TextCall): Promise<string> {
    this.tasks.push(call.task);
    return super.text(call);
  }
}

async function world(files: FileMap = bundledFiles): Promise<{ k: Kernel; ai: Recording }> {
  const ai = new Recording();
  const k = await Kernel.boot({ files, store: memoryStore(), ai, chunks: new MemoryChunks() });
  await developAll(k);
  return { k, ai };
}

/** The place where the wanderer stands, planned. */
function here(k: Kernel) {
  const pc = k.wandererCarpet();
  const ch = k.chunkAt(pc.x, pc.y)!;
  expect(ch.stage).toBe('planned');
  return ch;
}

function setPeople(k: Kernel, people: Array<{ name: string; job: string }>): void {
  const src = JSON.stringify({ people: people.map((p) => ({ kind: 'npc.villager', species: 'person', routine: [], family: [], ...p })), expected: [] }, null, 2) + '\n';
  k.repo.write('world/people.json', src);
  k.applyFiles({ ...k.repo.working });
}

const DAY = Kernel.DAY_SECONDS;
const STEP = 1 / 60;

describe('gli individui dichiarati dal master', () => {
  it('in un luogo fatto: il Narratore lo scrive coi fatti dati e compare lì, con la sua origine, senza un’altra chiamata', async () => {
    const { k, ai } = await world();
    const ch = here(k);
    const place = ch.place!.name;
    ai.tasks = [];
    const r = await k.talkToAgent('liaison', `Un individuo: si chiama Gualtiero, fa il fabbro e ha nascosto una chiave nel pozzo; vive a «${place}».`);
    expect(r.forged).toMatch(new RegExp(`Nel registro delle persone: Gualtiero, fabbro, a «${place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}»\\.$`));
    // The Referente, then one call of the Narrator.
    expect(ai.tasks).toEqual(['referente.coordinate', 'npc.individuate']);
    const p = readPeople(k.files).people.find((x) => x.name === 'Gualtiero')!;
    expect(p).toMatchObject({ job: 'fabbro', kind: 'npc.villager', place, declared: { place, at: [ch.cx, ch.cy] } });
    expect(p.story).toMatch(/chiave nel pozzo/);
    expect(p.origin).toMatch(new RegExp(`^${ch.key}#o\\d+$`));
    expect(k.repo.log().some((c) => /persone: Gualtiero, fabbro \(dichiarato dal master\)/.test(c.message))).toBe(true);
    // Their character in the plan of the place, marked with their name.
    const index = Number(p.origin!.split('#o')[1]);
    expect(ch.plan!.objects[index]).toMatchObject({ module: 'npc.villager', individual: 'Gualtiero' });
    // And in the world, in that place: met, they are themselves, with no call.
    const id = k.ecs.query('origin').find((e) => k.ecs.get(e, 'origin').key === p.origin)!;
    expect(id).toBeDefined();
    const pos = k.ecs.get(id, 'pos');
    const S = k.config.chunkSize;
    expect([Math.floor(pos.x / S), Math.floor(pos.y / S)]).toEqual([ch.cx, ch.cy]);
    ai.tasks = [];
    const identity = await k.npc.ensureIdentity(id);
    expect(identity).toMatchObject({ name: 'Gualtiero', job: 'fabbro' });
    expect(ai.tasks).not.toContain('npc.individuate');
    // The plan read again does not add them twice.
    const before = ch.plan!.objects.length;
    (k as unknown as { settleDeclared(c: unknown, plan: unknown): number[] }).settleDeclared(ch, ch.plan);
    expect(ch.plan!.objects.length).toBe(before);
  });

  it('in una regione dell’atlante non ancora pianificata: atteso, poi il primo luogo della regione lo accoglie', async () => {
    const { k } = await world();
    const env = Object.keys(k.content.layouts)[0];
    const atlas = readAtlas(k.files);
    k.saveFile(ATLAS_FILE, writeAtlas({ regions: [...atlas.regions, { id: 'corvi', name: 'Valle dei Corvi', description: 'una valle stretta e fredda', environment: env, center: [40, 0], radius: 0 }] }));
    const made = await k.declareIndividual({ facts: 'Ortensia, erborista, conosce le erbe della valle e non si fida dei forestieri', name: 'Ortensia', where: 'valle dei corvi' });
    expect(made).toMatchObject({ ok: true, name: 'Ortensia', awaited: true });
    const people = readPeople(k.files);
    expect(awaitedDeclared(people).map((p) => p.name)).toEqual(['Ortensia']);
    expect(people.people.find((p) => p.name === 'Ortensia')!.declared).toEqual({ place: 'Valle dei Corvi', region: 'corvi' });
    // The graph and the studio say they are awaited.
    const node = [...buildGraph(k.files, []).nodes.values()].find((n) => n.label === 'Ortensia')!;
    expect(node).toMatchObject({ atteso: true, dichiarato: true });
    // The place is planned: they are there.
    expect(await k.planAhead(40, 0)).toBe('nuovo');
    const p = readPeople(k.files).people.find((x) => x.name === 'Ortensia')!;
    expect(p.origin).toMatch(/^40,0#o\d+$/);
    expect(awaitedDeclared(readPeople(k.files))).toEqual([]);
    expect(k.ecs.query('origin').some((e) => k.ecs.get(e, 'origin').key === p.origin)).toBe(true);
  });

  it('ciò che non regge torna col motivo: chi non è il master, un luogo che non c’è, il meta-gioco, un nome già preso', async () => {
    const { k } = await world(manyPlayers(bundledFiles));
    k.addWanderer('anna', 'Anna');
    const place = here(k).place!.name;
    const head = k.repo.head().id;
    expect(await k.as('anna', () => k.declareIndividual({ facts: 'Bruno, mugnaio', name: 'Bruno', where: place }))).toEqual({ ok: false, reason: expect.stringMatching(/solo il master/) });
    expect(await k.declareIndividual({ facts: 'Bruno, mugnaio', name: 'Bruno', where: 'Atlantide' })).toEqual({ ok: false, reason: expect.stringMatching(/non conosco «Atlantide».*regione dell'atlante/) });
    expect(await k.declareIndividual({ facts: 'Bruno, mugnaio, sa che i giocatori lo cercano', name: 'Bruno', where: place })).toEqual({ ok: false, reason: expect.stringMatching(/nel mondo non si dice «giocatori»/) });
    expect(await k.declareIndividual({ facts: 'Bruno, <b>mugnaio</b>', name: 'Bruno', where: place })).toEqual({ ok: false, reason: expect.stringMatching(/niente «<»/) });
    expect(k.repo.head().id).toBe(head);
    setPeople(k, [{ name: 'Bruno', job: 'oste' }]);
    expect(await k.declareIndividual({ facts: 'Bruno, mugnaio', name: 'bruno', where: place })).toEqual({ ok: false, reason: expect.stringMatching(/c'è già qualcuno che si chiama bruno/) });
    // The Referente says it to the master and notes the shortfall.
    const r = await k.talkToAgent('liaison', 'un individuo di nome Ugo, pescatore, vive a Atlantide');
    expect(r.forged).toMatch(/^L'individuo non entra: non conosco «Atlantide»/);
    expect(k.shortfalls.list().at(-1)).toMatchObject({ agent: 'narrator', task: 'referente.coordinate', outcome: 'invalid' });
  });

  it('chi aspetta un luogo è solo chi lo aspetta: per luogo o per regione', () => {
    const people: People = {
      people: [
        { name: 'A', kind: 'k', job: 'j', family: [], routine: [], declared: { place: 'P', at: [1, 2] } },
        { name: 'B', kind: 'k', job: 'j', family: [], routine: [], declared: { place: 'R', region: 'r' } },
        { name: 'C', kind: 'k', job: 'j', family: [], routine: [], declared: { place: 'P', at: [1, 2] }, origin: '1,2#o3' },
        { name: 'D', kind: 'k', job: 'j', family: [], routine: [] },
      ],
      expected: [],
    };
    expect(declaredFor(people, 1, 2).map((p) => p.name)).toEqual(['A']);
    expect(declaredFor(people, 5, 5, 'r').map((p) => p.name)).toEqual(['B']);
    expect(declaredFor(people, 5, 5).map((p) => p.name)).toEqual([]);
  });
});

describe('le trame scritte dal master', () => {
  const PLOT = {
    title: 'La chiave nel pozzo',
    mystery: 'Baldo ha nascosto la chiave della cantina di Ivo',
    beats: [
      { day: 0, moment: 'notte', who: 'Baldo', where: 'piazza', what: 'cala qualcosa nel pozzo', line: 'Nessuno deve saperlo.' },
      { day: 1, moment: 'morning', who: 'Ivo', where: 'work', what: 'cerca la chiave della cantina' },
    ],
  };

  it('il validatore delle trame la prende così com’è, o dice tutto ciò che non regge', () => {
    const people: People = { people: ['Baldo', 'Ivo'].map((name) => ({ name, kind: 'npc.villager', species: 'person' as const, job: 'oste', family: [], routine: [] })), expected: [] };
    const ok = masterPlot(PLOT, people, 3, 'trama-master-1');
    expect(ok).toEqual({ plot: expect.objectContaining({ id: 'trama-master-1', title: 'La chiave nel pozzo', involved: ['Baldo', 'Ivo'], start: 3, state: 'active' }) });
    if ('plot' in ok) expect(ok.plot.beats.map((b) => [b.day, b.moment, b.where])).toEqual([[0, 'night', 'square'], [1, 'morning', 'work']]);
    const bad = masterPlot({ title: '', beats: [{ ...PLOT.beats[0], day: 7, who: 'Nessuno', moment: 'aurora' }] }, people, 0, 'x');
    expect('errors' in bad && bad.errors).toEqual([expect.stringMatching(/il titolo/), expect.stringMatching(/giorno va da 0 a 4/), expect.stringMatching(/momento è uno di/)]);
    const ghost = masterPlot({ ...PLOT, beats: [{ ...PLOT.beats[0], who: 'Nessuno' }] }, people, 0, 'x');
    expect('errors' in ghost && ghost.errors).toEqual([expect.stringMatching(/Nessuno non esiste/)]);
    const meta = masterPlot({ ...PLOT, mystery: 'i giocatori devono scoprirlo' }, people, 0, 'x');
    expect('errors' in meta && meta.errors.join()).toMatch(/quarta parete/);
    expect(masterPlot({ ...PLOT, beats: [] }, people, 0, 'x')).toEqual({ errors: ['serve almeno una tappa'] });
  });

  it('scritta a mano entra in un commit e avanza come le altre: le tappe accadono e chi le fa le ricorda', async () => {
    const { k, ai } = await world();
    setPeople(k, [
      { name: 'Baldo', job: 'fabbro' },
      { name: 'Ivo', job: 'oste' },
    ]);
    ai.tasks = [];
    const r = k.writePlot(PLOT);
    expect(r).toMatchObject({ ok: true });
    expect(ai.tasks).toEqual([]);
    expect(k.repo.head().message).toBe(`modifica ${PLOTS_FILE}`);
    const plot = readPlots(k.files).find((p) => p.title === 'La chiave nel pozzo')!;
    expect(plot).toMatchObject({ start: k.day(), state: 'active', involved: ['Baldo', 'Ivo'] });
    // The night comes: the first beat happens, and Baldo remembers it.
    k.time = DAY * (k.day() + 0.7);
    for (let i = 0; i < 61; i++) k.tick(STEP);
    let now = readPlots(k.files).find((p) => p.id === plot.id)!;
    expect(now.beats.map((b) => !!b.done)).toEqual([true, false]);
    expect(readPeople(k.files).people.find((p) => p.name === 'Baldo')!.memories?.at(-1)?.text).toMatch(/cala qualcosa nel pozzo/);
    // The morning after (a day of the world starts at dawn): the second.
    k.time = DAY * (plot.start + 1 - 0.06);
    for (let i = 0; i < 61; i++) k.tick(STEP);
    now = readPlots(k.files).find((p) => p.id === plot.id)!;
    expect(now.beats.every((b) => b.done)).toBe(true);
  });

  it('solo il master la scrive; ciò che non regge non entra', async () => {
    const { k } = await world(manyPlayers(bundledFiles));
    k.addWanderer('anna', 'Anna');
    setPeople(k, [
      { name: 'Baldo', job: 'fabbro' },
      { name: 'Ivo', job: 'oste' },
    ]);
    const before = k.files[PLOTS_FILE];
    expect(k.as('anna', () => k.writePlot(PLOT))).toEqual({ ok: false, reasons: ['solo il master scrive le trame'] });
    expect(k.writePlot({ ...PLOT, beats: [{ ...PLOT.beats[0], who: 'Ottone' }] })).toEqual({ ok: false, reasons: [expect.stringMatching(/Ottone non esiste/)] });
    expect(k.files[PLOTS_FILE]).toBe(before);
  });
});
