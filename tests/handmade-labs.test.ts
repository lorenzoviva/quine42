// The labs for the players (T294, ADR-0168): what a lab does with a handmade card, as the pages do it (lab/handmade/logic.ts), against the
// real routes (server/handmade.ts) with the check in this process. A fork, saved as a card and opened again, gives the same program; a
// change saved and opened again, the changed one; a draft not saved comes back; a universe gives only what a player may read of it.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AccountSettings } from '../server/account';
import { handmadeHandler, HANDMADE_ROUTE } from '../server/handmade';
import { inlineChecker } from '../server/programCheck';
import { HANDMADE_CONTRACT, type HandmadeView } from '../src/kernel/handmade';
import { KERNEL_VERSION } from '../src/kernel/version';
import { publicFiles } from '../src/session/files';
import { WANDERER_HEADER } from '../src/kernel/universes';
import { LOCAL_WANDERER_HEADER } from '../lab/handmade/client';
import { boxOf, classOf } from '../src/mj/classes';
import {
  boxFor,
  cardDraft,
  copyName,
  createBody,
  draftKey,
  draftProblems,
  forkables,
  forkDraft,
  labLink,
  labOf,
  readDraft,
  reasonsOf,
  resume,
  saved,
  sourceFromSearch,
  unsaved,
  updateBody,
  type Draft,
} from '../lab/handmade/logic';

const seed = (id: string) => readFileSync(`universe/models/${id}.xml`, 'utf8');
const BARREL = seed('barile');
const SOUND = seed('sound-effect-arpeggio');

/** The files of a universe as its master has them: a model with a card, a seed's model, a sound, a class this kernel does not know. */
function universeFiles(): Record<string, string> {
  return {
    'universe.json': JSON.stringify({ name: 'prova', kernel: KERNEL_VERSION, ai: { provider: 'gemini' } }),
    'models/index.json': JSON.stringify({
      barile: { class: 'furniture', name: 'Barile', card: { author: 'scultore', payer: 'comune', holder: 'bruno' } },
      'sound-effect-arpeggio': { class: 'suono', name: 'Arpeggio' },
      nave: { class: 'nave', name: 'Nave' },
      orfano: { class: 'object', name: 'Senza programma' },
    }),
    'models/barile.xml': BARREL,
    'models/sound-effect-arpeggio.xml': SOUND,
    'models/nave.xml': BARREL,
    'prompts/agents/narrator.md': 'segreto del Concilio',
  };
}

describe('dove nasce la copia', () => {
  it('senza account, il viandante si dice con l’intestazione del gioco', () => {
    expect(LOCAL_WANDERER_HEADER).toBe(WANDERER_HEADER);
  });

  it('l’indirizzo dice una carta o un modello di un universo; ciò che non si legge non è niente', () => {
    expect(sourceFromSearch('?card=handmade-abcdefghij')).toEqual({ card: 'handmade-abcdefghij' });
    expect(sourceFromSearch('?fork=prova/barile')).toEqual({ universe: 'prova', model: 'barile' });
    expect(sourceFromSearch('?fork=prova%2Fbarile')).toEqual({ universe: 'prova', model: 'barile' });
    for (const bad of ['', '?card=barile', '?card=handmade-x', '?fork=prova', '?fork=../x/barile', '?fork=prova/barile/altro', '?fork=prova/<b>', '?fork=.balances/x']) expect(sourceFromSearch(bad), bad).toBeUndefined();
  });

  it('un modello si cambia nell’editor, un suono nel SoundLab; i link partono dalla radice', () => {
    expect(labOf('model')).toBe('editor');
    expect(labOf('sound')).toBe('suono');
    expect(labLink('editor', { universe: 'prova', model: 'barile' })).toBe('/lab/editor/?fork=prova%2Fbarile');
    expect(labLink('suono', { card: 'handmade-abcdefghij' })).toBe('/lab/suono/?card=handmade-abcdefghij');
    expect(labLink('3d')).toBe('/lab/3d/');
    // What a link says, the lab reads back.
    expect(sourceFromSearch(labLink('editor', { universe: 'prova', model: 'barile' }).split('?')[1])).toEqual({ universe: 'prova', model: 'barile' });
  });

  it('da un universo si forka solo ciò che un giocatore ne legge: i modelli e i suoni del suo indice, con classe e taglia', () => {
    const all = forkables(publicFiles(universeFiles()));
    expect(all.map((f) => [f.id, f.kind, f.class])).toEqual([
      ['barile', 'model', 'furniture'],
      ['sound-effect-arpeggio', 'sound', undefined],
    ]);
    expect(all[0]).toMatchObject({ name: 'Barile', vpt: 20, xml: BARREL });
    // The fields of an index of before the contract 0.4 read as this kernel's.
    expect(forkables({ 'models/index.json': JSON.stringify({ botte: { classe: 'furniture', nome: 'Botte' } }), 'models/botte.xml': BARREL }).map((f) => [f.id, f.class, f.name])).toEqual([['botte', 'furniture', 'Botte']]);
    expect(forkables({ 'models/index.json': '{rotto' })).toEqual([]);
  });

  it('la scatola: quella del programma se la dice, altrimenti della classe alla sua taglia, come nel gioco', () => {
    expect(boxFor('<sequence values="B" size="4 4 4"/>', 'furniture')).toBeUndefined();
    expect(boxFor('<sequence values="B"/>', 'furniture')).toEqual(boxOf(classOf('furniture')!));
    expect(boxFor('<sequence values="B"/>', 'furniture', 'large')).toEqual(boxOf(classOf('furniture')!, 'large'));
    expect(boxFor('<sequence values="B"/>', undefined)).toBeUndefined();
  });
});

describe('la bozza', () => {
  const fork = forkables(publicFiles(universeFiles()))[0];

  it('un fork si chiama come una copia, entro la lunghezza di un nome', () => {
    expect(forkDraft(fork).name).toBe('Barile (copia)');
    expect([...copyName('x'.repeat(80))].length).toBe(60);
    expect(draftProblems(forkDraft(fork))).toEqual([]);
    expect(draftProblems({ ...forkDraft(fork), name: '<b>', class: 'nave' })).toHaveLength(2);
  });

  it('ciò che non è salvato resta su questa macchina, e torna sulla stessa base', () => {
    const fresh = forkDraft(fork);
    expect(unsaved(fresh)).toBe(false);
    const work: Draft = { ...fresh, xml: fresh.xml.replace('</', '<!-- mio --></') };
    expect(unsaved(work)).toBe(true);
    const back = readDraft(JSON.stringify(work), 'model')!;
    expect(resume(fresh, back)).toEqual({ draft: work, resumed: true });
    // Only the name changed: it is work too.
    expect(unsaved({ ...fresh, name: 'Botte mia' })).toBe(true);
    // A draft of the other lab, or a broken one, is none.
    expect(readDraft(JSON.stringify(work), 'sound')).toBeUndefined();
    expect(readDraft('{rotto', 'model')).toBeUndefined();
    // The card changed elsewhere meanwhile: the server's wins, the kept work is said, not lost.
    const elsewhere = { ...fresh, base: 'altro', xml: 'altro' };
    expect(resume(elsewhere, back)).toEqual({ draft: elsewhere, resumed: false, kept: back });
    expect(draftKey('editor', { universe: 'prova', model: 'barile' })).not.toBe(draftKey('editor'));
    expect(draftKey('editor', { card: 'handmade-abcdefghij' })).not.toBe(draftKey('suono', { card: 'handmade-abcdefghij' }));
  });

  it('i motivi del server, tutti', () => {
    expect(reasonsOf({ ok: false, reason: 'il programma non può essere una carta', errors: ['seme 1: fluttua', 3] })).toEqual(['il programma non può essere una carta', 'seme 1: fluttua']);
    expect(reasonsOf(undefined)).toEqual(['il server non ha risposto']);
  });
});

// --- Against the routes ----------------------------------------------------------------------------------------------------------

const accounts: AccountSettings = {
  config: { projectId: 'prova', apiKey: 'pubblica', authDomain: 'prova.firebaseapp.com' },
  verify: async (t) => (t.startsWith('vero-') ? { uid: t.slice(5), anonymous: false } : undefined),
};

describe('fork → carta → riapertura', () => {
  let work: string;
  let server: http.Server;
  let port: number;
  const ask = (method: string, target: string, token: string, body?: unknown) =>
    new Promise<{ status: number; body: any }>((resolve, reject) => {
      const r = http.request(
        { host: '127.0.0.1', port, path: target, method, headers: { Host: `127.0.0.1:${port}`, Authorization: `Bearer ${token}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) } },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') }));
        },
      );
      r.on('error', reject);
      r.end(body === undefined ? undefined : JSON.stringify(body));
    });

  beforeAll(async () => {
    work = mkdtempSync(path.join(os.tmpdir(), 'quine-laboratori-'));
    const universes = path.join(work, 'universes');
    const root = path.join(universes, 'prova');
    mkdirSync(path.join(root, '.git'), { recursive: true });
    for (const [rel, text] of Object.entries(universeFiles())) {
      mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      writeFileSync(path.join(root, rel), text);
    }
    const handler = handmadeHandler({ labs: () => true, checker: inlineChecker(), universesDir: universes, accounts, writes: { burst: 1000, perSecond: 1000 } });
    server = http.createServer((req, res) => handler(req as never, res, () => ((res.statusCode = 404), res.end('{}'))));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((r) => server?.close(() => r()));
    rmSync(work, { recursive: true, force: true });
  });

  it('un modello forkato, salvato e riaperto, è lo stesso programma; cambiato e salvato, quello cambiato', async () => {
    const source = { universe: 'prova', model: 'barile' };
    const fork = forkables(publicFiles(universeFiles())).find((f) => f.id === source.model)!;
    let draft = forkDraft(fork);
    draft = { ...draft, name: 'Il mio barile', xml: draft.xml.replace(/<\/(\w+)>\s*$/, '<!-- mio -->\n</$1>\n') };
    const made = await ask('POST', HANDMADE_ROUTE, 'vero-alice', createBody(draft, source));
    expect(made.status).toBe(201);
    const card: HandmadeView = made.body.card;
    expect(card).toMatchObject({ kind: 'model', class: 'furniture', kernel: HANDMADE_CONTRACT, from: source, mine: true });
    // The chain is the server's: the model's holder in that universe.
    expect(card.origins?.map((o) => o.holder)).toEqual(['bruno']);
    draft = saved(draft);
    expect(unsaved(draft)).toBe(false);

    const opened = await ask('GET', `${HANDMADE_ROUTE}/${card.id}`, 'vero-alice');
    const again = cardDraft(opened.body.card);
    expect(again.xml).toBe(draft.xml);
    expect(again).toMatchObject({ name: 'Il mio barile', class: 'furniture', kind: 'model' });
    expect(updateBody(again, opened.body.card)).toBeUndefined();

    const changed: Draft = { ...again, xml: again.xml.replace('<!-- mio -->', '<!-- mio, ancora -->'), size: 'large' };
    const body = updateBody(changed, opened.body.card)!;
    expect(body).toMatchObject({ xml: changed.xml, kernel: HANDMADE_CONTRACT, class: 'furniture', size: 'large' });
    expect(body).not.toHaveProperty('name');
    expect((await ask('POST', `${HANDMADE_ROUTE}/${card.id}`, 'vero-alice', body)).status).toBe(200);
    const third = cardDraft((await ask('GET', `${HANDMADE_ROUTE}/${card.id}`, 'vero-alice')).body.card);
    expect(third.xml).toBe(changed.xml);
    expect(third.size).toBe('large');
    // Back to the size of its class: the size goes, it is not left as it was.
    const plain = updateBody({ ...third, size: undefined }, (await ask('GET', `${HANDMADE_ROUTE}/${card.id}`, 'vero-alice')).body.card)!;
    expect(plain).toMatchObject({ size: null });
    expect((await ask('POST', `${HANDMADE_ROUTE}/${card.id}`, 'vero-alice', plain)).body.card).not.toHaveProperty('size');

    // «Salva come nuova» from one's own card: another card, born from it.
    const copy = await ask('POST', HANDMADE_ROUTE, 'vero-alice', createBody({ ...third, name: 'Barile due' }, { card: card.id }));
    expect(copy.status).toBe(201);
    expect(copy.body.card.from).toEqual({ card: card.id });
    expect(copy.body.card.id).not.toBe(card.id);
  });

  it('un suono forkato torna uguale; uno rotto torna con i motivi del controllo', async () => {
    const fork = forkables(publicFiles(universeFiles())).find((f) => f.kind === 'sound')!;
    const draft = { ...forkDraft(fork), name: 'Arpeggio mio' };
    const made = await ask('POST', HANDMADE_ROUTE, 'vero-alice', createBody(draft, { universe: 'prova', model: fork.id }));
    expect(made.status).toBe(201);
    expect(made.body.card).not.toHaveProperty('class');
    expect(cardDraft((await ask('GET', `${HANDMADE_ROUTE}/${made.body.card.id}`, 'vero-alice')).body.card).xml).toBe(SOUND);
    const broken = await ask('POST', HANDMADE_ROUTE, 'vero-alice', createBody({ ...draft, xml: BARREL }));
    expect(broken.status).toBe(422);
    const reasons = reasonsOf(broken.body);
    expect(reasons[0]).toMatch(/non può essere una carta/);
    expect(reasons.slice(1).join()).toMatch(/<sound>/);
  });

  it('la carta di un altro si apre, non si scrive', async () => {
    const mine = (await ask('GET', `${HANDMADE_ROUTE}?mine=1`, 'vero-alice')).body.cards;
    const theirs = await ask('GET', `${HANDMADE_ROUTE}/${mine[0].id}`, 'vero-bruno');
    expect(theirs.status).toBe(200);
    expect(theirs.body.card.mine).toBe(false);
    expect(theirs.body.card).not.toHaveProperty('origins');
    const d = cardDraft(theirs.body.card);
    const tried = await ask('POST', `${HANDMADE_ROUTE}/${mine[0].id}`, 'vero-bruno', updateBody({ ...d, xml: `${d.xml} ` }, theirs.body.card));
    expect(tried.status).toBe(404);
    expect((await ask('GET', `${HANDMADE_ROUTE}/${mine[0].id}`, 'vero-alice')).body.card.xml).toBe(d.xml);
  });
});
