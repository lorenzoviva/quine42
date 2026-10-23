import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { UsageLedger } from '../src/kernel/ai/usage';
import { Council, type CatalogEntry } from '../src/kernel/agents/council';
import { npcReply, weavePlot } from '../src/kernel/agents/minds';
import { buildGraph, type GraphPlace } from '../src/kernel/graph';
import { readPeople } from '../src/kernel/society';
import { readPlots } from '../src/kernel/plots';
import type { FileMap, Manifest } from '../src/kernel/types';

/** Offline models that keep every call, to look at what the agents were sent. */
class Recording extends MockModels {
  calls: TextCall[] = [];
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    return super.text(call);
  }
}

const cats = (t: string) => (t === 'npc.cat' ? 'animale' : t ? 'persona' : undefined) as 'animale' | 'persona' | undefined;
const manifest = (m: Record<string, unknown>) => JSON.stringify({ version: '0.1.0', ...m });
const person = (nome: string, tipo: string, famiglia: Array<[string, string]>, extra: Record<string, unknown> = {}) => ({
  nome,
  tipo,
  mestiere: 'contadino',
  famiglia: famiglia.map(([n, legame]) => ({ nome: n, legame })),
  routine: [{ quando: 'giorno', fa: 'lavora', dove: 'lavoro' }, { quando: 'notte', fa: 'dorme', dove: 'casa' }],
  ...extra,
});

function universe(): { files: FileMap; places: GraphPlace[] } {
  const files: FileMap = {
    'universe.json': JSON.stringify({ name: 'prova' }),
    'modules/npc.cat/manifest.json': manifest({ id: 'npc.cat', name: 'Gatto', kind: 'entity', persona: 'Sei un gatto.' }),
    'modules/npc.villager/manifest.json': manifest({ id: 'npc.villager', name: 'Abitante', kind: 'entity', persona: 'Sei un abitante.' }),
    'world/canone.md': '# Canone\n\nLe rune restano ferme dove sono finché qualcuno non le raccoglie.',
    'world/people.json': JSON.stringify({
      persone: [
        person('Fiocco', 'npc.cat', [['Bastiano', 'animale']], { luogo: 'Piazza del Borgo', genere: 'femmina', specie: 'animale' }),
        person('Bastiano', 'npc.villager', [['Fiocco', 'padrone'], ['Nereo', 'fratello']], { luogo: 'Piazza del Borgo', genere: 'maschio' }),
        person('Nereo', 'npc.villager', [['Bastiano', 'fratello']], { luogo: 'Riva del Lago', genere: 'maschio' }),
        person('Ottavia', 'npc.villager', [], { luogo: 'Riva del Lago', genere: 'femmina' }),
      ],
      attesi: [],
    }),
    'world/plots.json': JSON.stringify({ trame: [{ id: 'trama-reti', titolo: 'Le reti tagliate', mistero: 'Nereo taglia di notte le reti del fratello.', coinvolti: ['Nereo', 'Bastiano'], tappe: [{ giorno: 0, momento: 'notte', chi: 'Nereo', dove: 'Riva del Lago', cosa: 'si aggira tra le barche' }], inizio: 0, stato: 'attiva' }] }),
    'world/bible.json': JSON.stringify({
      titolo: 'Prova',
      tono: 'quieto',
      sintesi: 'Un borgo sul lago.',
      storia: 'Una lunga storia del borgo. '.repeat(40),
      luoghi: ['Piazza del Borgo', 'Riva del Lago', ...Array.from({ length: 25 }, (_, i) => `Luogo lontano ${i}`)],
      personaggi: Array.from({ length: 20 }, (_, i) => `Personaggio ${i}`),
      fatti: ['Bastiano ripara le reti in Piazza del Borgo.', ...Array.from({ length: 29 }, (_, i) => `Un fatto lontano numero ${i} che nessuno di qui conosce.`)],
    }),
  };
  const places: GraphPlace[] = [
    { cx: 0, cy: 0, nome: 'Piazza del Borgo', cose: ['npc.villager', 'npc.cat'] },
    { cx: 1, cy: 0, nome: 'Riva del Lago', cose: ['npc.villager'] },
  ];
  return { files, places };
}

const catalogOf = (files: FileMap): CatalogEntry[] =>
  Object.entries(files)
    .filter(([p]) => /^modules\/[^/]+\/manifest\.json$/.test(p))
    .map(([, t]) => JSON.parse(t) as Manifest)
    .filter((m) => m.kind === 'entity')
    .map((m) => ({ id: m.id, name: m.name, kind: m.persona ? 'npc' : 'oggetto', tiles: m.spawn?.tiles ?? [], context: m.context ?? m.description ?? '' }));

function council(files: FileMap, places: GraphPlace[], models = new Recording()) {
  const graph = buildGraph(files, places, cats);
  return { models, c: new Council(models, () => ({ files, palette: {}, catalog: catalogOf(files), graph: () => graph })) };
}

const npc = (name: string) => ({ name, persona: 'Sei tu.', mood: 'tranquillo', mode: 'vaga', carrying: [], place: 'Piazza del Borgo', history: [], facts: {} });

describe('the context of the agents from the graph (T13)', () => {
  it('a task with a focus gets the neighbourhood of what it is about instead of the whole bible and catalog', async () => {
    const { files, places } = universe();
    const { c, models } = council(files, places);
    await npcReply(c, npc('Bastiano'), 'ciao');
    await npcReply(c, npc('Bastiano'), 'ciao', ['Bastiano', 'luogo:0_0']);
    const [plain, focused] = models.calls.map((x) => x.system);
    expect(plain).toMatch(/## Bibbia del mondo/);
    expect(plain).toMatch(/Un fatto lontano numero 28/);
    expect(plain).toMatch(/## Moduli esistenti/);
    expect(focused).not.toMatch(/## Bibbia del mondo|## Moduli esistenti|Un fatto lontano|Luogo lontano/);
    expect(focused).toMatch(/## Il mondo\nTitolo: Prova\nTono: quieto\nSintesi: Un borgo sul lago\./);
    // The canon goes with every narrative task, focused or not.
    expect(focused).toMatch(/Canone delle rune[\s\S]*restano ferme/);
    const ctx = focused.split('## Ciò che il mondo sa di questo compito')[1];
    expect(ctx).toBeDefined();
    expect(ctx).toMatch(/- Bastiano, uomo, contadino: padrone di Fiocco; fratello di Nereo; abita a Piazza del Borgo; lavora a Piazza del Borgo/);
    expect(ctx).toMatch(/- Fiocco, animale femmina/);
    expect(ctx).toMatch(/trama «Le reti tagliate»: Nereo taglia di notte le reti del fratello\./);
    expect(ctx).toMatch(/fatto: Bastiano ripara le reti in Piazza del Borgo\./);
    // Who has nothing to do with it is not there; the kinds are named, not described.
    expect(ctx).not.toMatch(/Ottavia/);
    expect(ctx).not.toMatch(/\(tipo\)/);
    // What is the same for every focused task comes first (the cache), the focus last.
    expect(focused.indexOf('## Il mondo')).toBeLessThan(focused.indexOf('## Ciò che il mondo sa'));
    expect(focused.length).toBeLessThan(plain.length);
  });

  it('a focus the graph does not know, or no graph at all, falls back to the summaries', async () => {
    const { files, places } = universe();
    const { c, models } = council(files, places);
    await npcReply(c, npc('Nessuno'), 'ciao', ['Qualcuno che non esiste', 'luogo:9_9']);
    const bare = new Council(models, () => ({ files, palette: {}, catalog: [] }));
    await npcReply(bare, npc('Bastiano'), 'ciao', ['Bastiano']);
    for (const call of models.calls) {
      expect(call.system).toMatch(/## Bibbia del mondo/);
      expect(call.system).not.toMatch(/## Ciò che il mondo sa/);
    }
  });

  it('the kernel gives the Narrator the person, the place and the wanderer when the wanderer talks to someone', async () => {
    const models = new Recording();
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models });
    for (let i = 0; i < 80; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 25));
      if ([...k.chunks.values()].every((ch) => ch.stage !== 'draft')) break;
    }
    const p = k.playerCarpet();
    const id = k.spawnModuleEntity(k.modules.get('npc.villager')!, p.x + 1, p.y);
    await k.talk(id, 'Buongiorno!');
    const name = k.ecs.get(id, 'identity')?.name as string;
    const reply = models.calls.filter((x) => x.task === 'npc.reply').at(-1)!;
    expect(reply.system).toMatch(/## Ciò che il mondo sa di questo compito/);
    expect(reply.system).toContain(`- ${name}`);
    expect(reply.system).toMatch(/\(luogo 0,0\)/);
    expect(reply.system).not.toMatch(/## Moduli esistenti/);
    // The individual was created with the context of its kind and place, too.
    const individuate = models.calls.find((x) => x.task === 'npc.individuate')!;
    expect(individuate.system).toMatch(/## Ciò che il mondo sa di questo compito/);
  });

  // The measure of T13 on a real universe: tokens of the context before (summaries) and after (graph),
  // estimated at four characters per token and put through the usage ledger with the text model's price.
  const valmora = [resolve(__dirname, '../universes/valmora'), resolve(__dirname, '../../../../universes/valmora')].find((p) => existsSync(join(p, 'world/people.json')));
  it.skipIf(!valmora)('on valmora the narrative tasks cost far fewer tokens with the graph', async () => {
    const files: FileMap = {};
    const walk = (root: string, d: string) => {
      for (const e of readdirSync(join(root, d))) {
        const p = d ? `${d}/${e}` : e;
        if (p === 'maps' || p === 'assets' || p === '.git') continue;
        if (statSync(join(root, p)).isDirectory()) walk(root, p);
        else if (/\.(json|md)$/.test(e)) files[p] = readFileSync(join(root, p), 'utf8');
      }
    };
    walk(resolve(__dirname, '../universe'), '');
    walk(valmora!, '');
    const places: GraphPlace[] = readdirSync(join(valmora!, 'maps')).map((f) => {
      const [, cx, cy] = /_(-?\d+)_(-?\d+)\.json$/.exec(f)!;
      const { plan } = JSON.parse(readFileSync(join(valmora!, 'maps', f), 'utf8'));
      return { cx: +cx, cy: +cy, nome: plan.place.name, ambiente: plan.layout, cose: plan.objects.map((o: { module: string }) => o.module), a_terra: plan.ground };
    });
    const { c, models } = council(files, places);
    const people = readPeople(files).persone;
    const plot = readPlots(files)[0];
    const who = people.find((p) => p.nome === plot.coinvolti[0]) ?? people[0];
    const home = places.find((p) => p.nome === who.luogo) ?? places[0];
    const focus = [who.nome, `luogo:${home.cx}_${home.cy}`];
    const society = people.slice(-20).map((p) => `- ${p.nome}, ${p.mestiere}`).join('\n');
    for (const f of [undefined, focus]) {
      await npcReply(c, { ...npc(who.nome), place: home.nome }, 'Cosa succede al lago?', f);
      await weavePlot(c, society, home.nome, '', '', f && [...people.slice(-20).map((p) => p.nome), ...f.slice(1)]);
    }
    const ledger = (calls: TextCall[]) => {
      const l = new UsageLedger();
      for (const x of calls) l.record({ model: 'gemini-3.1-flash-lite', agent: x.agent, task: x.task, prompt: Math.ceil((x.system.length + x.prompt.length) / 4), cached: 0, output: 0, thoughts: 0 });
      return l.session;
    };
    const [r0, p0, r1, p1] = models.calls;
    const before = ledger([r0, p0]);
    const after = ledger([r1, p1]);
    // T13_DUMP=1: the size of every section, to see where the tokens go.
    if (process.env.T13_DUMP)
      for (const x of [r0, r1]) console.log(x.system.split(/\n(?=## )/).map((s) => `${Math.ceil(s.length / 4)}\t${s.slice(0, 60).replace(/\n/g, ' ')}`).join('\n'), `\nPROMPT ${Math.ceil(x.prompt.length / 4)}\n${x === r1 ? x.system.split('## Ciò che il mondo sa')[1] : ''}`);
    console.log(`T13 su valmora — npc.reply: ${Math.ceil((r0.system.length + r0.prompt.length) / 4)} → ${Math.ceil((r1.system.length + r1.prompt.length) / 4)} token; plot.weave: ${Math.ceil((p0.system.length + p0.prompt.length) / 4)} → ${Math.ceil((p1.system.length + p1.prompt.length) / 4)}; dollari ${before.usd.toFixed(5)} → ${after.usd.toFixed(5)}`);
    expect(r1.system).toContain(`- ${who.nome}`);
    expect(after.prompt).toBeLessThan(before.prompt * 0.6);
    expect(after.usd).toBeLessThan(before.usd);
  });
});
