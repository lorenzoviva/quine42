// The master's directives (T374, ADR-0188 §4, ADR-0191): world/campaign.md in sections, in every request the section of everyone and the
// agent's own, the Referente's `directive` with the local filter of the fourth wall, the caps, the editor's file.
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { AGENTS, Council, type AgentId } from '../src/kernel/agents/council';
import {
  CAMPAIGN_CHARS,
  CAMPAIGN_FILE,
  CAMPAIGN_SECTIONS,
  campaignPrompt,
  campaignSectionsFor,
  campaignTemplate,
  DIRECTIVE_CHARS,
  directiveDay,
  directiveText,
  readCampaign,
  SECTION_CHARS,
  sectionOf,
  withDirective,
  type CampaignSection,
} from '../src/kernel/campaign';
import { Validator } from '../src/kernel/validator';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';

const DT = 1 / 60;

/** A campaign with a mark in every section, and a line that breaks the fourth wall. */
const CAMPAIGN = [
  '# Campagna',
  '',
  '<!-- note per chi apre il file: segno-commento -->',
  '',
  '## Per tutti',
  '- niente draghi a nord del fiume (segno-tutti)',
  '- i giocatori non devono trovare la spada (segno-meta)',
  '',
  '## Narratore',
  '- la gente parla in lingua arcaica (segno-narratore)',
  '',
  '## Cartografo',
  '- i nomi dei luoghi in lingua d’oïl (segno-cartografo)',
  '',
  '## Scultore e Artista',
  '- le case di pietra a nord, di legno a sud (segno-scultore)',
  '',
  '## Ingegnere e Fisico',
  '- le barche reggono al più due persone (segno-ingegnere)',
  '',
  '## Musicista',
  '- solo flauti e tamburi (segno-musicista)',
  '',
].join('\n');

const MARKS: Record<CampaignSection, string> = {
  all: 'segno-tutti',
  narrator: 'segno-narratore',
  cartographer: 'segno-cartografo',
  'sculptor-artist': 'segno-scultore',
  'engineer-physicist': 'segno-ingegnere',
  musician: 'segno-musicista',
};

class Recording extends MockAiModels {
  calls: Array<{ agent: string; task: string; system: string; prompt: string }> = [];
  async text(call: TextCall): Promise<string> {
    this.calls.push({ agent: call.agent ?? '', task: call.task, system: call.system ?? '', prompt: call.prompt });
    return super.text(call);
  }
}

async function boot(extra: Record<string, string> = {}, game: Record<string, unknown> = {}, ai = new Recording()): Promise<{ k: Kernel; ai: Recording }> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, ...extra, 'universe.json': JSON.stringify({ ...cfg, game: { ...cfg.game, ...game } }, null, 2) };
  return { k: await Kernel.boot({ files, store: memoryStore(), ai }), ai };
}

describe('il file delle direttive', () => {
  it('si legge a sezioni, in ogni lingua del mondo, senza commenti né righe che rompono la quarta parete', () => {
    const r = readCampaign(CAMPAIGN);
    expect(r.errors).toEqual([]);
    for (const s of CAMPAIGN_SECTIONS) expect(r.sections[s].join('\n')).toContain(MARKS[s]);
    expect(JSON.stringify(r.sections)).not.toMatch(/segno-meta|segno-commento/);
    expect(r.left).toEqual([expect.objectContaining({ section: 'all', reason: expect.stringMatching(/giocator/i) })]);
    // An English title is the same section; the ids too.
    expect(sectionOf('For everyone')).toBe('all');
    expect(sectionOf('scultore e artista')).toBe('sculptor-artist');
    expect(sectionOf('Cartógrafo')).toBe('cartographer');
    expect(sectionOf('engineer-physicist')).toBe('engineer-physicist');
    expect(sectionOf('Note')).toBeUndefined();
    expect(readCampaign(campaignTemplate('en').replace('## Narrator\n', '## Narrator\n- speak plainly (x)\n')).sections.narrator).toEqual(['- speak plainly (x)']);
  });

  it('una sezione che nessuno legge, il testo fuori dalle sezioni e i tetti sono errori del validatore', () => {
    const v = new Validator({ check: () => undefined } as never);
    expect(v.validateFile(CAMPAIGN_FILE, CAMPAIGN)).toEqual([]);
    expect(v.validateFile(CAMPAIGN_FILE, campaignTemplate())).toEqual([]);
    expect(v.validateFile(CAMPAIGN_FILE, '## Note\n- qualcosa')).toEqual([expect.stringMatching(/sezione sconosciuta «Note»/)]);
    expect(v.validateFile(CAMPAIGN_FILE, 'prima di tutto\n## Per tutti\n- poi')).toEqual([expect.stringMatching(/fuori da una sezione/)]);
    expect(v.validateFile(CAMPAIGN_FILE, '## Per tutti\n- a\n## Per tutti\n- b')).toEqual([expect.stringMatching(/due volte/)]);
    const long = `## Narratore\n${Array.from({ length: 60 }, (_, i) => `- direttiva ${i} ${'x'.repeat(80)}`).join('\n')}`;
    expect(v.validateFile(CAMPAIGN_FILE, long)).toEqual([expect.stringMatching(/al più 4000/)]);
    // Read anyway (the master may force it): the first lines, within the cap.
    const kept = readCampaign(long).sections.narrator;
    expect(kept[0]).toMatch(/direttiva 0 /);
    expect(kept.join('\n').length).toBeLessThanOrEqual(SECTION_CHARS);
    const sections = CAMPAIGN_SECTIONS.map((s) => `## ${s}\n${Array.from({ length: 40 }, (_, i) => `- ${s} ${i} ${'y'.repeat(80)}`).join('\n')}`).join('\n');
    const whole = readCampaign(sections);
    expect(whole.errors.some((e) => /al più 12000/.test(e))).toBe(true);
    expect(CAMPAIGN_SECTIONS.reduce((n, s) => n + whole.sections[s].join('\n').length, 0)).toBeLessThanOrEqual(CAMPAIGN_CHARS);
  });

  it('ogni agente riceve la sua sezione e quella di tutti; l’Arbitro e il Referente tutto; l’Attore solo «Per tutti»', () => {
    const r = readCampaign(CAMPAIGN);
    for (const agent of Object.keys(AGENTS) as AgentId[]) {
      const text = campaignPrompt(r, agent);
      const mine = campaignSectionsFor(agent);
      for (const s of CAMPAIGN_SECTIONS) expect(text.includes(MARKS[s]), `${agent} ${s}`).toBe(mine.includes(s));
    }
    expect(campaignSectionsFor('actor')).toEqual(['all']);
    expect(campaignSectionsFor('arbiter')).toEqual(CAMPAIGN_SECTIONS);
    expect(campaignSectionsFor('liaison')).toEqual(CAMPAIGN_SECTIONS);
    expect(campaignSectionsFor('artist')).toEqual(['all', 'sculptor-artist']);
    expect(campaignSectionsFor('physicist')).toEqual(['all', 'engineer-physicist']);
    // Nothing written, nothing sent.
    expect(campaignPrompt(readCampaign(campaignTemplate()), 'arbiter')).toBe('');
    expect(campaignPrompt(readCampaign(undefined), 'narrator')).toBe('');
  });

  it('una direttiva è una riga pulita, nella sua sezione, con il giorno del mondo; il file pieno la rifiuta col motivo', () => {
    const first = withDirective(undefined, 'cartographer', `(${directiveDay(2)}) le città sui fiumi`);
    expect('text' in first).toBe(true);
    const text = (first as { text: string }).text;
    expect(readCampaign(text).sections.cartographer).toEqual(['- (giorno 3) le città sui fiumi']);
    expect(readCampaign(text).errors).toEqual([]);
    const second = (withDirective(text, 'cartographer', 'i porti a sud') as { text: string }).text;
    expect(readCampaign(second).sections.cartographer).toEqual(['- (giorno 3) le città sui fiumi', '- i porti a sud']);
    // A section the file has not yet is made; the others stay as they are.
    const bare = (withDirective('# Campagna\n\n## Narratore\n- arcaico\n', 'musician', 'flauti') as { text: string }).text;
    expect(readCampaign(bare).sections).toMatchObject({ narrator: ['- arcaico'], musician: ['- flauti'] });
    let full = text;
    for (let i = 0; i < 20; i++) full = (withDirective(full, 'all', `${i} ${'z'.repeat(DIRECTIVE_CHARS - 10)}`) as { text: string }).text ?? full;
    const refused = withDirective(full, 'all', 'w'.repeat(DIRECTIVE_CHARS));
    expect(refused).toEqual({ error: expect.stringMatching(/piena|pieni/) });
    expect(directiveText('  - le case basse ')).toEqual({ text: 'le case basse' });
    expect(directiveText('<b>case</b>')).toEqual({ error: expect.stringMatching(/niente «<»/) });
    expect(directiveText('x'.repeat(DIRECTIVE_CHARS + 1))).toEqual({ error: expect.stringMatching(/al più 300/) });
    expect(directiveText('i giocatori non devono morire')).toEqual({ error: expect.stringMatching(/nel mondo non si dice «giocatori»/), wall: true });
    expect(directiveText('the players never die', { lang: 'en' })).toMatchObject({ wall: true });
  });
});

describe('le direttive nelle richieste del Concilio', () => {
  it('Council.write mette la sezione dopo la partita, nella parte stabile, e dice una volta sola ciò che resta fuori', async () => {
    const ai = new Recording();
    const files = { ...bundledFiles, [CAMPAIGN_FILE]: CAMPAIGN };
    const c = new Council(ai, () => ({ files, palette: {}, catalog: [] }));
    for (const agent of Object.keys(AGENTS) as AgentId[]) await c.write(agent, 'prova', 'p', { focus: ['qualcuno'] });
    for (const call of ai.calls) {
      const mine = campaignSectionsFor(call.agent as AgentId);
      for (const s of CAMPAIGN_SECTIONS) expect(call.system.includes(MARKS[s]), `${call.agent} ${s}`).toBe(mine.includes(s));
      expect(call.system).not.toMatch(/segno-meta|segno-commento/);
      expect(call.prompt).not.toMatch(/segno-/);
    }
    // After the game, before the agent's own context.
    const narrator = ai.calls.find((x) => x.agent === 'narrator')!.system;
    expect(narrator.indexOf('## The game')).toBeGreaterThan(-1);
    expect(narrator.indexOf('segno-tutti')).toBeGreaterThan(narrator.indexOf('## The game'));
    expect(narrator.indexOf('segno-tutti')).toBeLessThan(narrator.search(/## (Bible of the world|The world)/));
    expect(c.feed.filter((e) => /segno-meta/.test(e.text))).toHaveLength(1);
    expect(c.feed.find((e) => /segno-meta/.test(e.text))!.text).toMatch(/^direttive: «i giocatori non devono/);
  });
});

describe('il Referente scrive le direttive del master', () => {
  it('da soli: la direttiva va nella sua sezione con il giorno del mondo, in un commit, e la richiesta dopo la porta', async () => {
    const { k, ai } = await boot();
    const r = await k.talkToAgent('liaison', "d'ora in poi le case di pietra a nord e di legno a sud");
    expect(r.forged).toMatch(/Nelle direttive, per «Scultore e Artista»: le case di pietra/);
    const read = readCampaign(k.files[CAMPAIGN_FILE]);
    expect(read.errors).toEqual([]);
    expect(read.sections['sculptor-artist']).toEqual([`- (${directiveDay(k.day())}) le case di pietra a nord e di legno a sud`]);
    expect(k.repo.head().message).toMatch(/^direttiva \(Scultore e Artista\)/);
    expect(k.repo.head().files[CAMPAIGN_FILE]).toBe(k.files[CAMPAIGN_FILE]);
    ai.calls = [];
    await k.council.write('sculptor', 'model.sculpt', 'una casa');
    await k.council.write('narrator', 'npc.reply', 'ciao');
    expect(ai.calls[0].system).toMatch(/le case di pietra a nord/);
    expect(ai.calls[1].system).not.toMatch(/le case di pietra a nord/);
    // A section nobody reads is everyone's.
    expect(k.addDirective('nessuna', 'niente draghi')).toMatchObject({ ok: true, section: 'all' });
  });

  it('una direttiva con meta-gioco torna al Referente col motivo e, se resta, è rifiutata: niente nel file, la mancanza scritta', async () => {
    const { k, ai } = await boot();
    const before = k.files[CAMPAIGN_FILE];
    const head = k.repo.head().id;
    ai.calls = [];
    const r = await k.talkToAgent('liaison', 'direttiva: i giocatori non devono mai trovare la spada');
    expect(r.forged).toMatch(/La direttiva non entra: nel mondo non si dice «giocatori»/);
    // Sent back once, with the reason.
    const asked = ai.calls.filter((x) => x.task === 'referente.coordinate');
    expect(asked).toHaveLength(2);
    expect(asked[1].prompt).toMatch(/Your directive was sent back: .*giocatori/);
    expect(k.files[CAMPAIGN_FILE]).toBe(before);
    expect(k.repo.head().id).toBe(head);
    expect(k.shortfalls.list().at(-1)).toMatchObject({ task: 'referente.coordinate', outcome: 'invalid', reason: expect.stringMatching(/giocatori/) });
  });

  it('in una partita di molti la scrive solo il master, sul suo ramo: gli altri non la ricevono', async () => {
    const { k } = await boot({}, { mode: 'multiplayer', death: 3 }, new Recording());
    const server = new SessionServer(k);
    const join = async (id: string) => {
      const { server: s, client: c } = fakeLink();
      server.connect(s);
      const session = new SessionClient(c, { id });
      await session.ready;
      return new ThinClient(await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true }), session);
    };
    const master = await join('me');
    const anna = await join('anna');
    const step = (n: number) => {
      for (let i = 0; i < n; i++) {
        for (const c of [master, anna]) {
          c.k.tick(DT);
          c.frame(DT);
        }
        server.tick(DT);
      }
    };
    step(6);
    let done = false;
    let answer: { forged?: string } = {};
    void master.k.talkToAgent('liaison', 'direttiva per il Narratore: la gente parla poco e a bassa voce').then((v) => ((answer = v), (done = true)));
    for (let i = 0; i < 400 && !done; i++) {
      step(2);
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(done).toBe(true);
    expect(answer.forged).toMatch(/Nelle direttive, per «Narratore»/);
    step(12);
    // On the master's branch and in their mirror; not in the world until they publish, never in a player's files.
    expect(server.branchFiles()[CAMPAIGN_FILE]).toMatch(/la gente parla poco/);
    expect(master.k.files[CAMPAIGN_FILE]).toMatch(/la gente parla poco/);
    expect(k.files[CAMPAIGN_FILE]).toBeUndefined();
    expect(anna.k.files[CAMPAIGN_FILE]).toBeUndefined();
    // A player asks the kernel directly: refused.
    expect(k.as('anna', () => k.addDirective('all', 'niente lupi'))).toEqual({ ok: false, reason: expect.stringMatching(/solo il master/) });
  });
});
