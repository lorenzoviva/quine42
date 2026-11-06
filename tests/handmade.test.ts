// The handmade cards (T293, ADR-0161): what one is, the checks its texts pass, the check of its program on the real engine with caps
// measured on the seed, and the routes of the archive (`server/handmade.ts`), with the check in this process. What concerns who may do
// what is in tests/sicurezza/carte-mano.test.ts.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AccountSettings } from '../server/account';
import { handmadeHandler, HANDMADE_ROUTE, type HandmadeRouteOptions } from '../server/handmade';
import { inlineChecker } from '../server/programCheck';
import {
  cleanCardName,
  cleanText,
  contractSaid,
  forkedOrigins,
  handmadeFingerprint,
  handmadeProgramErrors,
  handmadeRecordText,
  handmadeSummary,
  handmadeView,
  HANDMADE_CONTRACT,
  HANDMADE_ID_RE,
  HANDMADE_LIMITS,
  newHandmadeId,
  readHandmadeRecord,
  type HandmadeCard,
} from '../src/kernel/handmade';
import { MODEL_RE } from '../src/kernel/validator';
import { KERNEL_VERSION } from '../src/kernel/version';
import { accountWanderer } from '../src/session/account';

const seed = (id: string) => readFileSync(`universe/models/${id}.xml`, 'utf8');
const SMALL = seed('object');
/** A program that never stops: B becomes W, and when all is W one W becomes B again. */
const ENDLESS = '<markov values="BW" size="4 4 4"><one><rule in="B" out="W"/></one><one><rule in="W" out="B"/></one></markov>';

describe('la forma', () => {
  it('un id è nuovo, del server, e vale come id di un modello', () => {
    const id = newHandmadeId(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 255]));
    expect(id).toMatch(HANDMADE_ID_RE);
    expect(MODEL_RE.test(id)).toBe(true);
    expect(id).toBe('handmade-abcdefghid');
    expect(() => newHandmadeId(new Uint8Array(4))).toThrow();
  });

  it('il contratto è quello del kernel, detto X.Y; un client può dire anche X.Y.Z', () => {
    expect(HANDMADE_CONTRACT).toBe(KERNEL_VERSION.split('.').slice(0, 2).join('.'));
    expect(contractSaid(KERNEL_VERSION)).toBe(HANDMADE_CONTRACT);
    expect(contractSaid('0.3')).toBe('0.3');
    for (const no of [undefined, 3, '0.x', '', '1']) expect(contractSaid(no)).toBeUndefined();
  });

  it('un testo di un giocatore: una riga, spazi uniti, niente markup né caratteri invisibili', () => {
    expect(cleanText('  La   mia\ttorre \n', 60, 'il nome')).toEqual({ text: 'La mia torre' });
    expect(cleanText('Pane & sale', 60, 'x')).toEqual({ text: 'Pane & sale' });
    for (const bad of ['<b>torre</b>', 'a‮b', 'zero​width', 'nul\u0000', '   ', '!!!', 'x'.repeat(61)]) expect(cleanText(bad, 60, 'x'), JSON.stringify(bad)).toHaveProperty('error');
    expect(cleanText(42, 60, 'x')).toHaveProperty('error');
    // Composed and decomposed are one text.
    expect(cleanText('Città', 60, 'x')).toEqual({ text: 'Città' });
  });

  it('il nome di una carta tiene la quarta parete', () => {
    expect(cleanCardName('La fontana del borgo')).toEqual({ text: 'La fontana del borgo' });
    expect(cleanCardName('La simulazione del borgo')).toHaveProperty('error');
    expect(cleanCardName('Il server dei giocatori')).toHaveProperty('error');
  });

  it('dall’archivio si legge solo ciò che è una carta', () => {
    const good: HandmadeCard = { id: 'handmade-aaaaaaaaaa', kind: 'model', name: 'Cosa', class: 'object', xml: SMALL, kernel: '0.4', author: 'alice', made: '2026-11-06T10:00:00.000Z', changed: '2026-11-06T10:00:00.000Z' };
    const record = readHandmadeRecord({
      signature: '  Alice  ',
      cards: [good, { ...good, id: 'mio' }, { ...good, kind: 'quadro' }, { ...good, author: '../x' }, { ...good, class: 'nave' }, { ...good, kernel: 'nuovo' }, null, 'x', { ...good, id: 'handmade-bbbbbbbbbb', kind: 'sound', class: undefined, size: undefined }],
    });
    expect(record.signature).toBe('Alice');
    expect(record.cards.map((c) => c.id)).toEqual(['handmade-aaaaaaaaaa', 'handmade-bbbbbbbbbb']);
    // What has a card's id and does not read is kept as it is, for the next write; the rest is not a card.
    expect(record.unread).toHaveLength(4);
    expect(JSON.parse(handmadeRecordText(record)).cards).toHaveLength(6);
    expect(readHandmadeRecord({ signature: '<i>', cards: 'no' })).toEqual({ cards: [] });
    expect(readHandmadeRecord(null)).toEqual({ cards: [] });
    // In an account's file, a card is that account's: one that says another author is kept, not read.
    const own = readHandmadeRecord({ cards: [good, { ...good, id: 'handmade-cccccccccc', author: 'bruno' }] }, 'alice');
    expect(own.cards.map((c) => c.id)).toEqual(['handmade-aaaaaaaaaa']);
    expect(own.unread).toEqual([{ ...good, id: 'handmade-cccccccccc', author: 'bruno' }]);
  });

  it('agli altri esce un elenco: la firma, non chi l’ha fatta; la catena solo all’autore', () => {
    const card: HandmadeCard = {
      id: 'handmade-aaaaaaaaaa',
      kind: 'model',
      name: 'Cosa',
      class: 'object',
      xml: SMALL,
      kernel: '0.4',
      author: 'uid-alice',
      from: { universe: 'prova', model: 'object', fingerprint: [1, 2] },
      origins: [{ holder: 'uid-bruno', universe: 'prova', fingerprint: [1, 2] }],
      made: 'a',
      changed: 'b',
    };
    const other = handmadeView(card, 'Alice', false);
    expect(JSON.stringify(other)).not.toContain('uid-alice');
    expect(JSON.stringify(other)).not.toContain('uid-bruno');
    expect(other).toMatchObject({ signature: 'Alice', mine: false, from: { universe: 'prova', model: 'object' }, xml: SMALL, length: SMALL.length });
    expect(other.from).not.toHaveProperty('fingerprint');
    expect(handmadeView(card, undefined, true)).toMatchObject({ signature: '', mine: true, origins: card.origins });
    expect(handmadeSummary(card, 'Alice', false)).not.toHaveProperty('xml');
  });

  it('la catena di un modello forkato: la sua, e chi lo teneva; un modello senza carta non ne ha', () => {
    const xml = seed('barile');
    const stamp = { author: 'scultore', payer: 'comune', holder: 'bruno', origins: [{ holder: 'carla', universe: 'primo', fingerprint: [9] }] };
    expect(forkedOrigins(stamp, 'secondo', xml)).toEqual([{ holder: 'carla', universe: 'primo', fingerprint: [9] }, { holder: 'bruno', universe: 'secondo', fingerprint: handmadeFingerprint(xml) }]);
    expect(forkedOrigins(undefined, 'secondo', xml)).toEqual([]);
    expect(forkedOrigins({ holder: 7 }, 'secondo', xml)).toEqual([]);
  });
});

describe('il programma, sul motore vero', () => {
  it('i programmi più pesanti del seme stanno nei tetti (misurati su questi)', () => {
    // The caps of the text, the grid and the steps are those of a card; time is the machine's, and the suite runs on six workers at once:
    // here it is four times as long (the times are measured by lab/scripts/carte-mano.ts).
    const limits = { ...HANDMADE_LIMITS, runMs: 4 * HANDMADE_LIMITS.runMs, clipMs: 4 * HANDMADE_LIMITS.clipMs, soundMs: 4 * HANDMADE_LIMITS.soundMs, totalMs: 4 * HANDMADE_LIMITS.totalMs };
    const cases: Array<[string, 'model' | 'sound', string | undefined, string | undefined]> = [
      ['struttura-locanda-del-cinghiale', 'model', 'structure', 'huge'],
      ['struttura-torre-di-guardia', 'model', 'structure', undefined],
      ['fantasy-fontana-antica', 'model', 'building', undefined],
      ['circuito-3D', 'model', 'object', undefined],
      ['sound-fantasy-sacred-place', 'sound', undefined, undefined],
    ];
    for (const [id, kind, cls, size] of cases) {
      const xml = seed(id);
      expect(xml.length, id).toBeLessThanOrEqual(HANDMADE_LIMITS.xmlChars);
      expect(handmadeProgramErrors({ kind, xml, ...(cls ? { class: cls } : {}), ...(size ? { size } : {}) }, limits), id).toEqual([]);
    }
  }, 120000);

  it('un modello piccolo passa, su ogni seme della sua classe', () => {
    expect(handmadeProgramErrors({ kind: 'model', xml: SMALL, class: 'object' })).toEqual([]);
    expect(handmadeProgramErrors({ kind: 'model', xml: seed('barile'), class: 'furniture', size: 'large' })).toEqual([]);
  });

  it('un suono passa le soglie dell’analisi, come quelli del Musicista; uno che non le passa torna col motivo', () => {
    expect(handmadeProgramErrors({ kind: 'sound', xml: seed('sound-effect-arpeggio') })).toEqual([]);
    const death = handmadeProgramErrors({ kind: 'sound', xml: seed('sound-effect-death') });
    expect(death.join('\n')).toMatch(/ripetitivo/);
  });

  it('tipo, classe e taglia', () => {
    expect(handmadeProgramErrors({ kind: 'quadro' as never, xml: SMALL })).toEqual(['il tipo è «model» o «sound»']);
    expect(handmadeProgramErrors({ kind: 'model', xml: SMALL, class: 'nave' }).join()).toMatch(/la classe/);
    expect(handmadeProgramErrors({ kind: 'model', xml: SMALL, class: 'object', size: 'colossale' }).join()).toMatch(/la taglia/);
    expect(handmadeProgramErrors({ kind: 'sound', xml: seed('sound-effect-arpeggio'), class: 'object' }).join()).toMatch(/un suono non ha classe/);
    expect(handmadeProgramErrors({ kind: 'model', xml: '   ', class: 'object' })).toEqual(['manca il programma']);
  });

  it('un modello non è un suono, un suono non è un modello', () => {
    expect(handmadeProgramErrors({ kind: 'model', xml: seed('sound-effect-arpeggio'), class: 'object' }).join()).toMatch(/salvalo come suono/);
    expect(handmadeProgramErrors({ kind: 'sound', xml: SMALL }).join()).toMatch(/manca <sound>/);
  });

  it('un programma che non finisce torna indietro, nei passi o nel tempo', () => {
    expect(handmadeProgramErrors({ kind: 'model', xml: ENDLESS, class: 'object' }).join()).toMatch(/non finisce entro 250000 passi/);
    const slow = handmadeProgramErrors({ kind: 'model', xml: ENDLESS, class: 'object' }, { ...HANDMADE_LIMITS, steps: 1e9, runMs: 150 });
    expect(slow.join()).toMatch(/non finisce/);
  });

  it('il tempo del controllo intero ha un tetto', () => {
    let t = 0;
    // Every look at the clock is a second later: the second seed is already past the whole.
    const clock = () => (t += 1000);
    expect(handmadeProgramErrors({ kind: 'model', xml: seed('barile'), class: 'furniture' }, { ...HANDMADE_LIMITS, totalMs: 2500 }, clock).join()).toMatch(/il controllo supera 2.5 s/);
  });

  it('la griglia ha un tetto, anche quando un map la ingrandisce', () => {
    const big = '<sequence values="BW" size="300 10 10"><box at="0 0 0" size="5 5 5" color="W"/></sequence>';
    expect(handmadeProgramErrors({ kind: 'model', xml: big, class: 'object' }).join()).toMatch(/size vuole tre interi tra 1 e 256/);
    const many = '<sequence values="BW" size="200 200 60"><box at="0 0 0" size="5 5 5" color="W"/></sequence>';
    expect(handmadeProgramErrors({ kind: 'model', xml: many, class: 'object' }).join()).toMatch(/griglia troppo grande/);
    const grown = '<sequence values="BW" size="120 120 20"><box at="0 0 0" size="5 5 5" color="W"/><map scale="2 2 2" values="BW"><rule in="B" out="BB/BB BB/BB"/><rule in="W" out="WW/WW WW/WW"/></map></sequence>';
    expect(handmadeProgramErrors({ kind: 'model', xml: grown, class: 'object' }).join()).toMatch(/supera i limiti/);
  });

  it('il testo ha un tetto, e le azioni e le animazioni un numero', () => {
    expect(handmadeProgramErrors({ kind: 'model', xml: `<!--${'x'.repeat(HANDMADE_LIMITS.xmlChars)}-->${SMALL}`, class: 'object' }).join()).toMatch(/programma troppo lungo/);
    const action = (i: number) => `<action name="a${i}"><all><rule in="C" out="C"/></all></action>`;
    const actions = SMALL.replace('</sequence>', `</sequence>${Array.from({ length: 17 }, (_, i) => action(i)).join('')}`);
    expect(handmadeProgramErrors({ kind: 'model', xml: actions, class: 'object' }).join()).toMatch(/troppe azioni: 17, al più 16/);
  });

  it('un’azione o un’animazione che non finisce torna indietro', () => {
    const flip = '<one><rule in="C" out="N"/><rule in="N" out="C"/></one>';
    const action = SMALL.replace('</sequence>', `</sequence><action name="gira">${flip}</action>`);
    expect(handmadeProgramErrors({ kind: 'model', xml: action, class: 'object' }).join()).toMatch(/l'azione «gira» non finisce/);
    const animation = SMALL.replace('</sequence>', `</sequence><animation name="pulsa" frames="4">${flip}</animation>`);
    expect(handmadeProgramErrors({ kind: 'model', xml: animation, class: 'object' }).join()).toMatch(/l'animazione «pulsa» non finisce al fotogramma 2/);
  });

  it('un modello deve stare in piedi, come ogni modello del gioco', () => {
    const floating = '<sequence values="BW" size="8 8 8"><box at="2 2 4" size="4 4 3" color="W"/></sequence>';
    expect(handmadeProgramErrors({ kind: 'model', xml: floating, class: 'object' }).join()).toMatch(/seme 1: non tocca terra/);
  });
});

// --- The routes, with the check in this process ------------------------------------------------------------------------------------

const accounts: AccountSettings = {
  config: { projectId: 'prova', apiKey: 'pubblica', authDomain: 'prova.firebaseapp.com' },
  verify: async (t) => (t.startsWith('vero-') ? { uid: t.slice(5), anonimo: false } : t.startsWith('anon-') ? { uid: t.slice(5), anonimo: true } : undefined),
};
const ALICE = accountWanderer('uid-alice');

interface Answer {
  status: number;
  body: any;
}

/** A server with only these routes, on a port of this machine. */
async function serve(o: Partial<HandmadeRouteOptions> & { universesDir: string }) {
  const handler = handmadeHandler({ labs: () => true, checker: inlineChecker(), ...o });
  const server = http.createServer((req, res) =>
    handler(req as never, res, () => {
      res.statusCode = 404;
      res.end('{}');
    }),
  );
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
  const ask = (method: string, target: string, opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {}) =>
    new Promise<Answer>((resolve, reject) => {
      const r = http.request(
        {
          host: '127.0.0.1',
          port,
          path: target,
          method,
          headers: { Host: `127.0.0.1:${port}`, ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}), ...opts.headers },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            resolve({ status: res.statusCode ?? 0, body: text ? JSON.parse(text) : undefined });
          });
        },
      );
      r.on('error', reject);
      r.end(opts.body === undefined ? undefined : typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
    });
  return { ask, close: () => new Promise<void>((r) => server.close(() => r())) };
}

/** A universe on the disk, as far as a fork reads it: its settings and its models, one of them with a card. */
function makeUniverse(universes: string, name: string): void {
  const root = path.join(universes, name);
  mkdirSync(path.join(root, '.git'), { recursive: true });
  mkdirSync(path.join(root, 'models'), { recursive: true });
  writeFileSync(path.join(root, 'universe.json'), JSON.stringify({ name, kernel: KERNEL_VERSION }));
  writeFileSync(path.join(root, 'models', 'barile.xml'), seed('barile'));
  writeFileSync(path.join(root, 'models', 'object.xml'), SMALL);
  writeFileSync(
    path.join(root, 'models', 'index.json'),
    JSON.stringify({
      barile: { class: 'furniture', name: 'Barile', card: { author: 'scultore', payer: 'comune', holder: 'bruno', origins: [{ holder: 'carla', universe: 'primo', fingerprint: [3, 4] }] } },
      object: { class: 'object', name: 'Cosa' },
    }),
  );
}

describe('le rotte', () => {
  let work: string;
  let universes: string;
  let server: Awaited<ReturnType<typeof serve>>;
  const write = { kernel: HANDMADE_CONTRACT };

  beforeAll(async () => {
    work = mkdtempSync(path.join(os.tmpdir(), 'quine-carte-mano-'));
    universes = path.join(work, 'universes');
    makeUniverse(universes, 'prova');
    // The rhythm of the writes has its own test (tests/sicurezza/carte-mano.test.ts).
    server = await serve({ universesDir: universes, accounts, now: () => new Date('2026-11-06T12:00:00.000Z'), writes: { burst: 1000, perSecond: 1000 } });
  });

  afterAll(async () => {
    await server?.close();
    rmSync(work, { recursive: true, force: true });
  });

  it('crea una carta da un modello di un universo: id suo, catena e impronta dal disco, nell’archivio del suo account', async () => {
    const r = await server.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: { ...write, kind: 'model', name: '  Il mio barile ', class: 'furniture', xml: seed('barile').replace('Barile a doghe', 'Barile mio'), from: { universe: 'prova', model: 'barile', fingerprint: [0], origins: [{ holder: 'io', universe: 'x', fingerprint: [] }] } } });
    expect(r.status).toBe(201);
    const card = r.body.card;
    expect(card.id).toMatch(HANDMADE_ID_RE);
    expect(card).toMatchObject({ kind: 'model', name: 'Il mio barile', class: 'furniture', kernel: HANDMADE_CONTRACT, mine: true, from: { universe: 'prova', model: 'barile' }, made: '2026-11-06T12:00:00.000Z' });
    // The chain is the model's and its holder's there, never what the client said.
    expect(card.origins).toEqual([{ holder: 'carla', universe: 'primo', fingerprint: [3, 4] }, { holder: 'bruno', universe: 'prova', fingerprint: handmadeFingerprint(seed('barile')) }]);
    const file = JSON.parse(readFileSync(path.join(universes, '.handmade', `${ALICE}.json`), 'utf8'));
    expect(file.cards).toHaveLength(1);
    expect(file.cards[0]).toMatchObject({ id: card.id, author: ALICE, from: { universe: 'prova', model: 'barile', fingerprint: handmadeFingerprint(seed('barile')) } });
  });

  it('un modello del seme non ha catena; una carta forkata da una propria tiene la sua', async () => {
    const plain = await server.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: { ...write, kind: 'model', name: 'Fagotto', class: 'object', xml: SMALL, from: { universe: 'prova', model: 'object' } } });
    expect(plain.status).toBe(201);
    expect(plain.body.card.origins).toBeUndefined();
    const mine = (await server.ask('GET', `${HANDMADE_ROUTE}?mine=1`, { token: 'vero-uid-alice' })).body.cards;
    const barile = mine.find((c: { name: string }) => c.name === 'Il mio barile');
    const again = await server.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: { ...write, kind: 'model', name: 'Barile due', class: 'furniture', xml: seed('barile'), from: { card: barile.id } } });
    expect(again.status).toBe(201);
    expect(again.body.card.from).toEqual({ card: barile.id });
    expect(again.body.card.origins).toHaveLength(2);
    expect(again.body.card.id).not.toBe(barile.id);
  });

  it('da un universo di un contratto di prima: il programma col nome di adesso, portato come lo legge il kernel', async () => {
    const root = path.join(universes, 'antico');
    mkdirSync(path.join(root, '.git'), { recursive: true });
    mkdirSync(path.join(root, 'models'), { recursive: true });
    writeFileSync(path.join(root, 'universe.json'), JSON.stringify({ name: 'antico', kernel: '0.2.0' }));
    writeFileSync(path.join(root, 'models', 'suono-architettura-frattale.xml'), seed('sound-fractal-architecture'));
    writeFileSync(path.join(root, 'models', 'index.json'), JSON.stringify({ 'suono-architettura-frattale': { classe: 'suono', nome: 'Architettura', carta: { autore: 'musicista', pagante: 'comune', titolare: 'io' } } }));
    const r = await server.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: { ...write, kind: 'sound', name: 'Frattale', xml: seed('sound-fractal-architecture'), from: { universe: 'antico', model: 'sound-fractal-architecture' } } });
    expect(r.status).toBe(201);
    expect(r.body.card.from).toEqual({ universe: 'antico', model: 'sound-fractal-architecture' });
    // The holder of before the contract 0.4 (`io`) is `me`.
    expect(r.body.card.origins).toEqual([{ holder: 'me', universe: 'antico', fingerprint: handmadeFingerprint(seed('sound-fractal-architecture')) }]);
    await server.ask('DELETE', `${HANDMADE_ROUTE}/${r.body.card.id}`, { token: 'vero-uid-alice' });
  });

  it('un suono si salva, senza classe né taglia', async () => {
    const r = await server.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: { ...write, kind: 'sound', name: 'Arpeggio mio', xml: seed('sound-effect-arpeggio') } });
    expect(r.status).toBe(201);
    expect(r.body.card).not.toHaveProperty('class');
  });

  it('l’elenco di tutti: senza programmi, la firma al posto di chi; la carta aperta col programma', async () => {
    expect((await server.ask('POST', `${HANDMADE_ROUTE}/signature`, { token: 'vero-uid-alice', body: { signature: ' Alice del borgo ' } })).body).toEqual({ ok: true, signature: 'Alice del borgo' });
    const list = await server.ask('GET', HANDMADE_ROUTE, { token: 'vero-uid-bruno' });
    expect(list.status).toBe(200);
    expect(list.body.cards.length).toBe(4);
    for (const c of list.body.cards) {
      expect(c).toMatchObject({ signature: 'Alice del borgo', mine: false });
      expect(c).not.toHaveProperty('xml');
    }
    expect(JSON.stringify(list.body)).not.toContain(ALICE);
    const one = await server.ask('GET', `${HANDMADE_ROUTE}/${list.body.cards[0].id}`, { token: 'anon-uid-chi' });
    expect(one.status).toBe(200);
    expect(typeof one.body.card.xml).toBe('string');
    expect(one.body.card).not.toHaveProperty('origins');
    const mine = await server.ask('GET', `${HANDMADE_ROUTE}?mine=1`, { token: 'vero-uid-alice' });
    expect(mine.body).toMatchObject({ ok: true, signature: 'Alice del borgo', used: { cards: 4 }, caps: { cards: 50 } });
    expect(mine.body.used.bytes).toBeGreaterThan(0);
  });

  it('l’autore cambia il nome senza un controllo, e il programma con il controllo e il contratto', async () => {
    const [card] = (await server.ask('GET', `${HANDMADE_ROUTE}?mine=1`, { token: 'vero-uid-alice' })).body.cards.filter((c: { kind: string }) => c.kind === 'model');
    const renamed = await server.ask('POST', `${HANDMADE_ROUTE}/${card.id}`, { token: 'vero-uid-alice', body: { name: 'Nome nuovo' } });
    expect([renamed.status, renamed.body.card.name]).toEqual([200, 'Nome nuovo']);
    expect((await server.ask('POST', `${HANDMADE_ROUTE}/${card.id}`, { token: 'vero-uid-alice', body: { name: 'Nome nuovo' } })).status).toBe(400);
    expect((await server.ask('POST', `${HANDMADE_ROUTE}/${card.id}`, { token: 'vero-uid-alice', body: { xml: SMALL, class: 'object' } })).status).toBe(400);
    const changed = await server.ask('POST', `${HANDMADE_ROUTE}/${card.id}`, { token: 'vero-uid-alice', body: { ...write, xml: SMALL, class: 'object', size: 'small' } });
    expect(changed.status).toBe(200);
    expect(changed.body.card).toMatchObject({ class: 'object', size: 'small', length: SMALL.length });
    const back = await server.ask('POST', `${HANDMADE_ROUTE}/${card.id}`, { token: 'vero-uid-alice', body: { ...write, size: null } });
    expect(back.body.card).not.toHaveProperty('size');
    const broken = await server.ask('POST', `${HANDMADE_ROUTE}/${card.id}`, { token: 'vero-uid-alice', body: { ...write, xml: ENDLESS } });
    expect(broken.status).toBe(422);
    expect(broken.body.errors.join()).toMatch(/non finisce/);
    expect((await server.ask('GET', `${HANDMADE_ROUTE}/${card.id}`, { token: 'vero-uid-alice' })).body.card.xml).toBe(SMALL);
  });

  it('l’autore la toglie', async () => {
    const [card] = (await server.ask('GET', `${HANDMADE_ROUTE}?mine=1`, { token: 'vero-uid-alice' })).body.cards;
    expect((await server.ask('DELETE', `${HANDMADE_ROUTE}/${card.id}`, { token: 'vero-uid-alice' })).status).toBe(200);
    expect((await server.ask('DELETE', `${HANDMADE_ROUTE}/${card.id}`, { token: 'vero-uid-alice' })).status).toBe(404);
    expect((await server.ask('GET', `${HANDMADE_ROUTE}/${card.id}`, { token: 'vero-uid-alice' })).status).toBe(404);
  });

  it('ciò che non va torna col motivo', async () => {
    const post = (body: unknown) => server.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-bruno', body });
    const base = { ...write, kind: 'model', name: 'Cosa', class: 'object', xml: SMALL };
    expect((await post({ ...base, name: '' })).body.reason).toMatch(/il nome/);
    expect((await post({ ...base, class: 'nave' })).body.errors.join()).toMatch(/la classe/);
    expect((await post({ ...base, from: { universe: 'prova', model: 'nessuno' } })).status).toBe(404);
    expect((await post({ ...base, from: { universe: 'altrove', model: 'object' } })).status).toBe(404);
    expect((await post({ ...base, from: { card: 'handmade-zzzzzzzzzz' } })).status).toBe(404);
    expect((await post({ ...base, from: 'prova' })).status).toBe(400);
    expect((await post({ ...base, xml: ENDLESS })).status).toBe(422);
    expect((await server.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-bruno', body: '[1]' })).status).toBe(400);
    expect((await server.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-bruno', body: '{' })).status).toBe(400);
    expect((await server.ask('PUT', HANDMADE_ROUTE, { token: 'vero-uid-bruno', body: base })).status).toBe(405);
    expect((await server.ask('GET', `${HANDMADE_ROUTE}/a/b`, { token: 'vero-uid-bruno' })).status).toBe(404);
  });

  it('senza account, da questa macchina: l’id detto, o chi gioca da solo', async () => {
    const local = await serve({ universesDir: path.join(work, 'locale') });
    try {
      const r = await local.ask('POST', HANDMADE_ROUTE, { body: { ...write, kind: 'model', name: 'Cosa', class: 'object', xml: SMALL } });
      expect(r.status).toBe(201);
      expect(readFileSync(path.join(work, 'locale', '.handmade', 'me.json'), 'utf8')).toContain(r.body.card.id);
      const said = await local.ask('POST', HANDMADE_ROUTE, { headers: { 'X-Quine-Viandante': 'alice' }, body: { ...write, kind: 'model', name: 'Cosa', class: 'object', xml: SMALL } });
      expect(said.status).toBe(201);
      expect(readFileSync(path.join(work, 'locale', '.handmade', 'alice.json'), 'utf8')).toContain(said.body.card.id);
    } finally {
      await local.close();
    }
  });
});
