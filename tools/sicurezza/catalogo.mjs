// The kit's probes (T137). Each one states a property of this project and looks at the effect, not at the answer: what is on
// disk after a request, what would have gone to Gemini, what a client received. `true` / { ok: true } means the property holds,
// so a probe stays right after its fix. `fase`: A, the plain server (no webhook secret); B, the server with the webhook's secret;
// S, a sandbox case in a process of its own; F, the final ones, whose server does not come back. See docs/sicurezza/README.md.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { STRIPE_DETAIL } from './ambiente.mjs';

const ALTRA = 'http://altro.example';
const JSONB = (v) => JSON.stringify(v);
const J = { 'Content-Type': 'application/json' };
/** The master of a universe of many on a server without accounts: for the probes whose subject is not who is asking (T120). */
const MASTER = { ...J, 'X-Quine-Viandante': 'me' };
/** From outside this machine, as a tunnel or a reverse proxy says it: the kit itself never leaves the loopback. */
const OUTSIDE = { 'X-Forwarded-For': '203.0.113.7' };

/** A balance on the disk: in the universe's ledger (ADR-0104), or, until the server has met the universe, in the file it comes from. */
const saldo = (ctx, uni, id = 'altro') => {
  const book = path.join(path.dirname(ctx.uni(uni)), '.balances', `${uni}.json`);
  if (existsSync(book)) return Number(JSON.parse(readFileSync(book, 'utf8')).saldi?.[id] ?? 0);
  const f = path.join(ctx.uni(uni), 'world', 'players', `${id}.json`);
  return existsSync(f) ? Number(JSON.parse(readFileSync(f, 'utf8')).crediti ?? 0) : undefined;
};

const paid = (id, universo, wandererId, crediti, amount = Math.round(crediti * 100)) => ({
  id,
  type: 'checkout.session.completed',
  data: { object: { id: `cs_${id}`, payment_status: 'paid', amount_total: amount, client_reference_id: wandererId, metadata: { universo, wandererId, crediti: String(crediti) } } },
});

const post = (ctx, p, body, headers = J) => ctx.http('POST', p, { body: typeof body === 'string' ? body : JSONB(body), headers });
const hook = (ctx, event) => {
  const raw = JSONB(event);
  return ctx.http('POST', '/api/stripe/webhook', { body: raw, headers: { ...J, 'stripe-signature': ctx.sign(raw) } });
};
/** What the fake Google has been asked since the probe started. */
const geminiSince = (ctx, n) => ctx.network().slice(n).filter((e) => e.a === 'gemini');
const lines = (s) => s.split('\n').filter(Boolean);

/** A variant of a name of git's folder: does the marker end up inside the real one? */
const gitFolder = (id, segment, proprieta) => ({
  id,
  voce: 'V-003',
  fase: 'A',
  proprieta,
  async run(ctx) {
    const marker = `sonda-${id.replace(/\W/g, '')}`;
    const r = await post(ctx, '/api/universe/sonda-git/commit', { changes: { [`${segment}/${marker}`]: 'sonda\n' }, message: 'sonda', author: 'player' }, MASTER);
    const dir = path.join(ctx.uni('sonda-git'), '.git');
    return { ok: !readdirSync(dir).includes(marker), dettaglio: `risposta ${r.status}` };
  },
});

/** A variant of the way to `.env`: does the fake value come back, as it is or encoded? */
const envPath = (id, form) => ({
  id,
  voce: 'V-014',
  fase: 'A',
  proprieta: 'il server non dà `.env` a chi lo chiede',
  async run(ctx) {
    const p = form.replace('<tmp>', ctx.workUrl);
    const r = await ctx.http('GET', p);
    const value = ctx.secrets.GEMINI_API_KEY;
    const leaked = r.text.includes(value) || r.text.includes(Buffer.from(value).toString('base64').slice(0, 24));
    return { ok: !leaked, dettaglio: `risposta ${r.status} per la forma ${id}` };
  },
});

export const PROBES = [
  // --- V-001: /api/universe ---------------------------------------------------------------------
  {
    id: 'V-001.a',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'senza identità non si leggono il Lua e i saldi di un universo in multigiocatore',
    async run(ctx) {
      const r = await ctx.http('GET', '/api/universe/sonda-base');
      const files = r.status === 200 ? (JSON.parse(r.text).files ?? {}) : {};
      return { ok: !files['modules/sonda/logic.lua'] && !files['world/players/altro.json'], dettaglio: `risposta ${r.status}, ${Object.keys(files).length} file` };
    },
  },
  {
    id: 'V-001.b',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'senza identità non si riscrive il Lua sul server',
    async run(ctx) {
      const r = await post(ctx, '/api/universe/sonda-base/commit', { changes: { 'modules/sonda/logic.lua': '-- V-001.b\nreturn {}\n' }, message: 'sonda', author: 'player' });
      return { ok: !readFileSync(path.join(ctx.uni('sonda-base'), 'modules', 'sonda', 'logic.lua'), 'utf8').includes('V-001.b'), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.c',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'senza identità non si cambia un saldo di crediti',
    async run(ctx) {
      const before = saldo(ctx, 'sonda-base');
      const r = await post(ctx, '/api/universe/sonda-base/commit', { changes: { 'world/players/altro.json': JSONB({ nome: 'Altro', crediti: before + 1000 }) }, message: 'sonda', author: 'player' });
      return { ok: saldo(ctx, 'sonda-base') === before, dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.d',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'senza identità non si scrive il piano di un luogo',
    async run(ctx) {
      const r = await ctx.http('PUT', '/api/universe/sonda-base/map/9_9', { body: '{}', headers: J });
      return { ok: !existsSync(path.join(ctx.uni('sonda-base'), 'maps', '9_9.json')), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.e',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'senza identità non si torna a un commit vecchio',
    async run(ctx) {
      const u = ctx.uni('sonda-ritorno');
      const first = ctx.git(u, ['rev-list', '--max-parents=0', 'HEAD']).trim();
      const r = await post(ctx, '/api/universe/sonda-ritorno/checkout', { id: first.slice(0, 12) });
      return { ok: existsSync(path.join(u, 'world', 'secondo.txt')), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.f',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'senza identità non si scrive il ramo del master',
    async run(ctx) {
      const r = await post(ctx, '/api/universe/sonda-base/branch', { branch: 'master', files: { 'world/sonda.txt': 'sonda\n' }, message: 'sonda', author: 'player' });
      return { ok: !ctx.git(ctx.uni('sonda-base'), ['for-each-ref', 'refs/heads/rami/']).trim(), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.g',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'senza identità non si fonde un ramo',
    async run(ctx) {
      const u = ctx.uni('sonda-fusione');
      const r = await post(ctx, '/api/universe/sonda-fusione/merge', { branch: 'master', message: 'sonda' });
      return { ok: !!ctx.git(u, ['for-each-ref', 'refs/heads/rami/master']).trim(), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.h',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'senza identità non si clona un universo diventandone il master',
    async run(ctx) {
      const r = await post(ctx, '/api/universe/sonda-base/clone', { nome: 'sonda-clone', master: 'intruso' });
      return { ok: !existsSync(ctx.uni('sonda-clone')), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.i',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'senza identità non si cestina un universo',
    async run(ctx) {
      const r = await post(ctx, '/api/universe/sonda-cestino/reset', {});
      return { ok: existsSync(ctx.uni('sonda-cestino')), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.j',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'una pagina di un altro sito non scrive: origine diversa con un corpo text/plain, che il browser manda senza chiedere',
    async run(ctx) {
      const r = await post(ctx, '/api/universe/sonda-base/commit', { changes: { 'world/da-altro-sito.txt': 'sonda\n' }, message: 'sonda', author: 'player' }, { 'Content-Type': 'text/plain', Origin: ALTRA });
      return { ok: !existsSync(path.join(ctx.uni('sonda-base'), 'world', 'da-altro-sito.txt')), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.k',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'una pagina di un altro sito non legge: niente CORS aperto per un’origine diversa',
    async run(ctx) {
      const r = await ctx.http('GET', '/api/universe/sonda-base', { headers: { Origin: ALTRA } });
      const allow = r.headers['access-control-allow-origin'];
      return { ok: !(r.status === 200 && (allow === '*' || allow === ALTRA)), dettaglio: `risposta ${r.status}, Access-Control-Allow-Origin ${allow ?? 'assente'}` };
    },
  },
  {
    id: 'V-001.l',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'un nome di host estraneo è rifiutato (DNS rebinding)',
    async run(ctx) {
      const r = await ctx.http('GET', '/api/universe', { headers: { Host: 'altro.example' } });
      return { ok: r.status !== 200, dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.m',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'senza identità non si crea un universo con un master a piacere',
    async run(ctx) {
      const r = await post(ctx, '/api/universe/sonda-creato/create', { files: { 'universe.json': JSONB({ name: 'sonda-creato', game: { mode: 'multiplayer', master: 'intruso' } }) }, message: 'sonda' });
      return { ok: !existsSync(ctx.uni('sonda-creato')), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-001.p',
    voce: 'V-001',
    fase: 'A',
    proprieta: 'una pagina su un’altra porta di questa macchina, che per il CORS di Vite può leggere le risposte, non legge un universo',
    async run(ctx) {
      const origin = { Origin: 'http://127.0.0.1:4872' };
      const r = await ctx.http('GET', '/api/universe/sonda-base', { headers: origin });
      const file = await ctx.http('GET', '/package.json', { headers: origin });
      const cors = (x) => x.headers['access-control-allow-origin'] ?? 'nessuno';
      return { ok: r.status === 403 && !r.text.includes('"files"'), dettaglio: `risposta ${r.status}, CORS ${cors(r)}; un file del progetto: risposta ${file.status}, CORS ${cors(file)}` };
    },
  },

  // --- V-002: the proxy ---------------------------------------------------------------------------
  {
    id: 'V-002.a',
    voce: 'V-002',
    fase: 'A',
    proprieta: 'un modello fuori dall’elenco non arriva a Google',
    async run(ctx) {
      const n = ctx.network().length;
      const r = await post(ctx, '/api/gemini/models/gemini-sonda-fuori-elenco:generateContent', { contents: [] });
      return { ok: !geminiSince(ctx, n).length, dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-002.b',
    voce: 'V-002',
    fase: 'A',
    proprieta: 'un’altra origine non spende la chiave',
    async run(ctx) {
      const n = ctx.network().length;
      const model = JSON.parse(ctx.seedConfig()).ai?.textModel ?? 'gemini-3.1-flash-lite';
      const r = await post(ctx, `/api/gemini/models/${model}:generateContent`, { contents: [] }, { ...J, Origin: ALTRA });
      return { ok: !geminiSince(ctx, n).length, dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-002.c',
    voce: 'V-002',
    fase: 'A',
    proprieta: 'un corpo da 5 MB non arriva a Google',
    async run(ctx) {
      const n = ctx.network().length;
      const model = JSON.parse(ctx.seedConfig()).ai?.textModel ?? 'gemini-3.1-flash-lite';
      const r = await post(ctx, `/api/gemini/models/${model}:generateContent`, JSONB({ contents: 'x'.repeat(5 * 1024 * 1024) }));
      return { ok: !geminiSince(ctx, n).length, dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-002.d',
    voce: 'V-002',
    fase: 'A',
    // The cap is in dollars (ADR-0099, 10 a day unless `.env` says otherwise), so the loop has to cost enough to reach it: calls of about
    // 1 $ each, as the cap counts them (a long prompt on the dearest model on the list, an answer that does not say what it cost).
    proprieta: 'il tetto di spesa del giorno ferma un loop: 20 chiamate da circa 1 $ non arrivano tutte a Google e l’ultima ha 402',
    async run(ctx) {
      const n = ctx.network().length;
      const body = JSONB({ contents: 'x'.repeat(1900 * 1024) });
      let last = 0;
      for (let i = 0; i < 20; i++) last = (await post(ctx, '/api/gemini/models/gemini-4-argon:generateContent', body)).status;
      const through = geminiSince(ctx, n).length;
      return { ok: through < 20 && last === 402, dettaglio: `${through} su 20 arrivate a Google, ultima risposta ${last}` };
    },
  },

  // --- V-003: git's folder --------------------------------------------------------------------------
  gitFolder('V-003.a', '.git', 'il nome esatto della cartella di git è rifiutato'),
  gitFolder('V-003.b', '.GIT', 'con altre maiuscole non si scrive nella cartella di git'),
  gitFolder('V-003.c', '.Git', 'con altre maiuscole non si scrive nella cartella di git'),
  gitFolder('V-003.d', '.git.', 'con un punto finale non si scrive nella cartella di git'),
  gitFolder('V-003.e', '.git ', 'con uno spazio finale non si scrive nella cartella di git'),
  gitFolder('V-003.f', 'GIT~1', 'con il nome corto di NTFS non si scrive nella cartella di git'),
  gitFolder('V-003.g', '.git::$INDEX_ALLOCATION', 'con un flusso NTFS non si scrive nella cartella di git'),
  {
    id: 'V-003.h',
    voce: 'V-003',
    fase: 'A',
    proprieta: 'nessun percorso esce dalla cartella dell’universo',
    async run(ctx) {
      const names = ['../sonda-fuori-a', '..\\sonda-fuori-b', 'world/../../sonda-fuori-c'];
      for (const p of names) await post(ctx, '/api/universe/sonda-git/commit', { changes: { [p]: 'sonda\n' }, message: 'sonda', author: 'player' }, MASTER);
      const out = readdirSync(ctx.universes()).filter((f) => f.startsWith('sonda-fuori'));
      return { ok: !out.length, dettaglio: `${out.length} file fuori` };
    },
  },

  // --- V-004: the webhook ---------------------------------------------------------------------------
  {
    id: 'V-004.a',
    voce: 'V-004',
    fase: 'A',
    proprieta: 'senza segreto il webhook non accredita nulla',
    async run(ctx) {
      const before = saldo(ctx, 'sonda-crediti');
      const r = await post(ctx, '/api/stripe/webhook', paid('evt_a', 'sonda-crediti', 'altro', 100));
      return { ok: saldo(ctx, 'sonda-crediti') === before, dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-004.b',
    voce: 'V-004',
    fase: 'B',
    proprieta: 'con il segreto una firma falsa è rifiutata',
    async run(ctx) {
      const before = saldo(ctx, 'sonda-crediti');
      const r = await ctx.http('POST', '/api/stripe/webhook', { body: JSONB(paid('evt_b', 'sonda-crediti', 'altro', 100)), headers: { ...J, 'stripe-signature': 't=1,v1=00' } });
      return { ok: saldo(ctx, 'sonda-crediti') === before, dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-004.c',
    voce: 'V-004',
    fase: 'B',
    proprieta: 'il nome dell’universo nei metadati non porta fuori da universes/',
    async run(ctx) {
      const r = await hook(ctx, paid('evt_c', '../fuori', 'altro', 1));
      // What a credit would leave out there: the payments' file of before, or the ledger next to the universes.
      const left = [path.join(ctx.work, 'fuori', 'world', 'pagamenti.json'), path.join(ctx.work, 'fuori.json'), path.join(ctx.work, 'universes', 'fuori.json')].filter(existsSync);
      return { ok: !left.length && r.status === 400, dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-004.d',
    voce: 'V-004',
    fase: 'B',
    proprieta: 'l’id del viandante nei metadati non porta fuori dalla cartella dei viandanti',
    async run(ctx) {
      const r = await hook(ctx, paid('evt_d', 'sonda-crediti', '../../sonda-id-fuori', 1));
      return { ok: !existsSync(path.join(ctx.uni('sonda-crediti'), 'sonda-id-fuori.json')), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-004.e',
    voce: 'V-004',
    fase: 'B',
    proprieta: 'il credito è quello dell’importo pagato, non quello scritto nei metadati',
    async run(ctx) {
      const before = saldo(ctx, 'sonda-crediti');
      const r = await hook(ctx, paid('evt_e', 'sonda-crediti', 'altro', 1000, 100));
      const got = saldo(ctx, 'sonda-crediti') - before;
      return { ok: got <= 1, dettaglio: `risposta ${r.status}, pagato 1 $, accreditati ${got}` };
    },
  },

  // --- V-005: payments ---------------------------------------------------------------------------------
  {
    id: 'V-005.a',
    voce: 'V-005',
    fase: 'B',
    proprieta: 'lo stesso evento in contemporanea accredita una volta sola',
    async run(ctx) {
      const before = saldo(ctx, 'sonda-doppio');
      await Promise.all(Array.from({ length: 8 }, () => hook(ctx, paid('evt_doppio', 'sonda-doppio', 'altro', 1))));
      const got = saldo(ctx, 'sonda-doppio') - before;
      return { ok: got <= 1, dettaglio: `8 consegne, accreditati ${got}` };
    },
  },
  {
    id: 'V-005.b',
    voce: 'V-005',
    fase: 'B',
    proprieta: 'saldi e pagamenti non stanno nella storia dell’universo',
    async run(ctx) {
      const u = ctx.uni('sonda-doppio');
      // The wanderer's file stays (inventory, needs): it no longer says a balance, and the payments have no file.
      const tracked = lines(ctx.git(u, ['ls-files', '--', 'world/pagamenti.json']));
      const said = ctx.git(u, ['show', 'HEAD:world/players/altro.json']).includes('crediti');
      return { ok: !tracked.length && !said, dettaglio: `file dei pagamenti nel repository: ${tracked.length}, saldo nel file del viandante: ${said}` };
    },
  },
  {
    id: 'V-005.c',
    voce: 'V-005',
    fase: 'B',
    proprieta: 'tornare a un commit vecchio non riporta indietro il saldo',
    async run(ctx) {
      const u = ctx.uni('sonda-rollback');
      const first = ctx.git(u, ['rev-list', '--max-parents=0', 'HEAD']).trim();
      await hook(ctx, paid('evt_r', 'sonda-rollback', 'altro', 7));
      const paidUp = saldo(ctx, 'sonda-rollback');
      const r = await post(ctx, '/api/universe/sonda-rollback/checkout', { id: first.slice(0, 12) }, MASTER);
      const now = saldo(ctx, 'sonda-rollback');
      return { ok: now === paidUp, dettaglio: `risposta ${r.status}, saldo dopo il pagamento ${paidUp}, dopo il ritorno ${now}` };
    },
  },

  // --- V-006: who says who they are ---------------------------------------------------------------------------
  {
    id: 'V-006.a',
    voce: 'V-006',
    fase: 'A',
    proprieta: 'nessuno diventa master dicendolo: senza account l\u2019id detto vale solo da questa macchina, e da fuori non si entra',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'me' }, { headers: OUTSIDE });
      c.close();
      return { ok: !c.ingresso?.master, dettaglio: c.ingresso ? `entrato, master: ${!!c.ingresso.master}` : `rifiutato: ${c.rifiuto ?? 'nessuna risposta'}` };
    },
  },
  {
    id: 'V-006.b',
    voce: 'V-006',
    fase: 'A',
    proprieta: 'essere anonimo non lo decide il client',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'sonda-anonimo', anonymous: true });
      c.close();
      return { ok: !c.ingresso?.anonymous, dettaglio: c.ingresso ? `anonimo: ${!!c.ingresso.anonymous}` : `rifiutato: ${c.rifiuto ?? 'nessuna risposta'}` };
    },
  },
  {
    id: 'V-006.c',
    voce: 'V-006',
    fase: 'A',
    proprieta: 'il WebSocket rifiuta un’altra origine',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'sonda-origine' }, { origin: ALTRA });
      c.close();
      return { ok: !c.ingresso, dettaglio: c.ingresso ? 'entrato' : `rifiutato: ${c.rifiuto ?? 'connessione chiusa'}` };
    },
  },
  {
    id: 'V-006.d',
    voce: 'V-006',
    fase: 'A',
    proprieta: '`GET /api/session` non elenca i viandanti a chiunque',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'sonda-elenco' });
      const r = await ctx.http('GET', '/api/session');
      c.close();
      return { ok: !r.text.includes('sonda-elenco'), dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-006.e',
    voce: 'V-006',
    fase: 'A',
    proprieta: 'senza identità non si legge il saldo di un altro viandante: l\u2019id detto vale solo da questa macchina',
    async run(ctx) {
      const r = await ctx.http('GET', '/api/viandante?universo=sonda-base&viandante=altro', { headers: OUTSIDE });
      const seen = r.status === 200 ? JSON.parse(r.text).viandante?.crediti : undefined;
      return { ok: seen === undefined, dettaglio: `risposta ${r.status}` };
    },
  },
  {
    id: 'V-006.f',
    voce: 'V-006',
    fase: 'A',
    proprieta: 'un non master non ha ramo né pubblica né parla al Concilio né segue altri (nel protocollo)',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'sonda-giocatore' });
      if (!c.ingresso) return { ok: true, dettaglio: `rifiutato: ${c.rifiuto ?? 'nessuna risposta'}` };
      const asked = [
        { t: 'branch', files: { 'modules/core.movement/logic.lua': '-- V-006.f\nreturn {}\n' }, base: {} },
        { t: 'publish' },
        { t: 'agent', agent: 'referente', text: 'sonda' },
        { t: 'follow', id: 'me' },
      ];
      const said = [];
      for (const [i, m] of asked.entries()) said.push(await c.ask({ ...m, seq: 100 + i }));
      c.close();
      const passed = said.filter((a) => a?.ok).length;
      const logic = readFileSync(path.join(ctx.uni('sonda-mondo'), 'modules', 'core.movement', 'logic.lua'), 'utf8');
      return { ok: passed === 0 && !logic.includes('V-006.f'), dettaglio: `${passed} su ${asked.length} accettati` };
    },
  },

  // --- V-007: what stops everyone ------------------------------------------------------------------------------
  { id: 'V-007.a', voce: 'V-007', fase: 'S', caso: 'pattern', tempo: 25000, proprieta: 'un pattern patologico di string.find finisce entro un tempo breve' },
  { id: 'V-007.b', voce: 'V-007', fase: 'S', caso: 'allocazione', tempo: 60000, proprieta: 'un’allocazione enorme finisce in un guasto' },
  {
    id: 'V-007.c',
    voce: 'V-007',
    fase: 'F',
    proprieta: 'il codice di un mondo bloccato non ferma l’HTTP né gli altri mondi',
    async run(ctx) {
      const c = await ctx.enter('sonda-bloccato', { id: 'sonda-blocco' }, { wait: 30000 });
      c.close();
      // The world's boot is long too: only what is still silent after a good wait counts.
      let answered = 0;
      for (let i = 0; i < 2; i++) {
        const r = await ctx.http('GET', '/api/universe', { timeout: 12000 }).catch(() => undefined);
        if (r?.status === 200) answered++;
      }
      return { ok: answered > 0, dettaglio: `${answered} risposte su 2 in 12 s` };
    },
  },

  // --- V-008, V-017, V-019: the sandbox's properties, read together ------------------------------------------------
  { id: 'V-008.a', voce: 'V-008', fase: 'S', caso: 'proprieta', lettura: (r) => (r.prova ? { errore: `la prova ha rifiutato il modulo di sonda (${r.prova} errori): non misura` } : { ok: r.avanzo === 'nil', dettaglio: r.avanzo === 'nil' ? 'nulla resta nella sandbox viva' : 'ciò che la prova esegue resta nella sandbox viva' }), proprieta: 'la prova di caricamento non lascia nulla nella sandbox viva' },
  { id: 'V-008.b', voce: 'V-008', fase: 'S', caso: 'proprieta', lettura: (r) => ({ ok: r.funzione !== 'function', dettaglio: `lato kernel: ${r.funzione}` }), proprieta: 'una funzione Lua in una tabella passata all’Host non arriva a JS come funzione' },
  { id: 'V-017.a', voce: 'V-017', fase: 'S', caso: 'proprieta', lettura: (r) => ({ ok: r.dump === 'nil', dettaglio: `tipo: ${r.dump}` }), proprieta: '`dump` non si raggiunge con la sintassi a metodo sulle stringhe' },
  { id: 'V-019.a', voce: 'V-019', fase: 'S', caso: 'proprieta', lettura: (r) => ({ ok: !r.js, dettaglio: r.js ? `raggiunti ${r.js.split(' ').length} campi, per esempio ${r.js.split(' ').slice(0, 2).join(' ')}; nessuno è stato chiamato` : 'nessun campo di JS raggiunto' }), proprieta: 'dai valori che l’Host dà a Lua non si raggiungono costruttori né prototipi di JS' },
  { id: 'V-019.b', voce: 'V-019', fase: 'S', caso: 'proprieta', lettura: (r) => ({ ok: r.ambiente === '0', dettaglio: `${r.ambiente} stringhe` }), proprieta: 'un valore finto dell’ambiente del processo non si trova in ciò che Lua vede' },
  { id: 'V-019.c', voce: 'V-019', fase: 'S', caso: 'budget', tempo: 40000, proprieta: '`pcall` non scavalca il budget di istruzioni' },

  // --- V-009: the queue ---------------------------------------------------------------------------------------------
  {
    id: 'V-009.a',
    voce: 'V-009',
    fase: 'A',
    proprieta: 'senza segreto locale non si mette un compito nella coda delle CLI',
    async run(ctx) {
      const r = await post(ctx, '/api/coda', { provider: 'claude', agent: 'sonda', task: 'sonda', system: 'sonda', prompt: 'sonda' });
      const dir = path.join(ctx.universes(), '.queue');
      const n = existsSync(dir) ? readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.json')).length : 0;
      return { ok: n === 0, dettaglio: `risposta ${r.status}, ${n} file in coda (nessuna CLI gira)` };
    },
  },
  {
    id: 'V-009.b',
    voce: 'V-009',
    fase: 'A',
    proprieta: 'senza segreto locale non si leggono i compiti in coda',
    async run(ctx) {
      const r = await ctx.http('GET', '/api/coda/stato');
      return { ok: r.status !== 200, dettaglio: `risposta ${r.status}` };
    },
  },

  // --- V-010: the master and the credits ------------------------------------------------------------------------------
  {
    id: 'V-010.a',
    voce: 'V-010',
    fase: 'A',
    proprieta: 'i saldi degli altri non arrivano al master nei file',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'me' });
      c.close();
      const text = c.ingresso?.files?.['world/players/altro.json'];
      return { ok: !text || !/crediti/.test(text), dettaglio: c.ingresso ? `file del viandante ${text ? 'presente' : 'assente'}` : `rifiutato: ${c.rifiuto ?? 'nessuna risposta'}` };
    },
  },
  {
    id: 'V-010.b',
    voce: 'V-010',
    fase: 'A',
    proprieta: 'un ramo pubblicato non cambia i saldi',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'me' });
      if (!c.ingresso) return { ok: true, dettaglio: `rifiutato: ${c.rifiuto ?? 'nessuna risposta'}` };
      const before = saldo(ctx, 'sonda-mondo');
      const a = await c.ask({ t: 'branch', seq: 200, files: { 'world/players/altro.json': JSONB({ name: 'Altro', crediti: before + 1000 }) }, base: {} });
      const b = await c.ask({ t: 'publish', seq: 201 });
      await ctx.waitFor(() => saldo(ctx, 'sonda-mondo') !== before, 4000);
      c.close();
      return { ok: saldo(ctx, 'sonda-mondo') === before, dettaglio: `ramo ${a?.ok ? 'accettato' : 'rifiutato'}, pubblicazione ${b?.ok ? 'accettata' : 'rifiutata'}` };
    },
  },

  // --- V-011: messages ---------------------------------------------------------------------------------------------------
  {
    id: 'V-011.a',
    voce: 'V-011',
    fase: 'A',
    proprieta: 'chi inonda il server di messaggi è limitato',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'sonda-inonda' });
      if (!c.ingresso) return { ok: true, dettaglio: `rifiutato: ${c.rifiuto ?? 'nessuna risposta'}` };
      const N = 600;
      for (let i = 0; i < N; i++) c.send({ t: 'say', seq: 1000 + i, wanderer: 'nessuno', text: 'sonda' });
      await ctx.waitFor(() => c.answers.size >= N, 8000);
      const answered = c.answers.size;
      const limited = [...c.answers.values()].some((a) => /tropp|ritmo|limit/i.test(a.reason ?? ''));
      c.close();
      return { ok: limited || answered < N, dettaglio: `${answered} messaggi su ${N} serviti` };
    },
  },

  // --- V-012: what goes to a player --------------------------------------------------------------------------------------
  {
    id: 'V-012.a',
    voce: 'V-012',
    fase: 'A',
    proprieta: 'a un giocatore non arrivano le impostazioni dell’IA',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'sonda-giocatore-a' });
      c.close();
      if (!c.ingresso) return { ok: true, dettaglio: `rifiutato: ${c.rifiuto ?? 'nessuna risposta'}` };
      const config = JSON.parse(c.ingresso.files['universe.json'] ?? '{}');
      return { ok: config.ai === undefined, dettaglio: `campo ai ${config.ai === undefined ? 'assente' : 'presente'}` };
    },
  },
  {
    id: 'V-012.b',
    voce: 'V-012',
    fase: 'A',
    proprieta: 'a un giocatore non arrivano le storie dei moduli (persona, lore, context)',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'sonda-giocatore-b' });
      c.close();
      if (!c.ingresso) return { ok: true, dettaglio: `rifiutato: ${c.rifiuto ?? 'nessuna risposta'}` };
      let n = 0;
      for (const [p, text] of Object.entries(c.ingresso.files)) {
        if (!p.endsWith('/manifest.json')) continue;
        const m = JSON.parse(text);
        if (m.persona !== undefined || m.lore !== undefined || m.context !== undefined) n++;
      }
      return { ok: n === 0, dettaglio: `${n} manifest con quei campi` };
    },
  },
  {
    id: 'V-012.c',
    voce: 'V-012',
    fase: 'A',
    proprieta: 'a un giocatore non arrivano prompt, bibbia, persone, codice degli altri né viandanti',
    async run(ctx) {
      const c = await ctx.enter('sonda-mondo', { id: 'sonda-giocatore-c' });
      c.close();
      if (!c.ingresso) return { ok: true, dettaglio: `rifiutato: ${c.rifiuto ?? 'nessuna risposta'}` };
      const allowedLua = /^modules\/core\.(movement|carpet)\//;
      const wrong = Object.keys(c.ingresso.files).filter((p) => /^(prompts|world\/(bible|people|plots|rules|players|usage|pagamenti))/.test(p) || (p.endsWith('.lua') && !allowedLua.test(p)));
      return { ok: !wrong.length, dettaglio: `${wrong.length} file di troppo` };
    },
  },
  {
    id: 'V-012.d',
    voce: 'V-012',
    fase: 'A',
    proprieta: 'il server di sviluppo non serve i file di `universes/`',
    async run(ctx) {
      const r = await ctx.http('GET', '/universes/sonda-base/world/players/altro.json');
      return { ok: !r.text.includes('crediti'), dettaglio: `risposta ${r.status}` };
    },
  },

  // --- V-014: Vite and `.env` ---------------------------------------------------------------------------------------------
  envPath('V-014.a', '/.env'),
  envPath('V-014.b', '/.env?raw'),
  envPath('V-014.c', '/.env?import&raw??'),
  envPath('V-014.d', '/.env?url'),
  envPath('V-014.e', '/@fs/<tmp>/.env'),
  envPath('V-014.f', '/@fs/<tmp>/.env?raw'),
  envPath('V-014.g', '/@fs/<tmp>/.env?import&raw??'),
  envPath('V-014.h', '/@fs/<tmp>/.env?inline&import'),
  envPath('V-014.i', '/@fs/<tmp>/.env?import&?inline=1.wasm?init'),
  envPath('V-014.j', '/@fs/<tmp>/.env?.svg?.wasm?init'),
  envPath('V-014.k', '/@fs/<tmp>/foo/../.env?import&raw'),

  // --- V-015, V-016: small ones ---------------------------------------------------------------------------------------------
  {
    id: 'V-015.a',
    voce: 'V-015',
    fase: 'B',
    proprieta: 'il checkout torna solo alla stessa origine',
    async run(ctx) {
      const n = ctx.network().length;
      await post(ctx, '/api/stripe/checkout', { universo: 'sonda-crediti', wandererId: 'altro', crediti: 5, returnUrl: `${ALTRA}/dopo` });
      const seen = ctx.network().slice(n).filter((e) => e.a === 'stripe').map((e) => e.ritorno);
      return { ok: !seen.includes('altro.example'), dettaglio: seen.length ? `ritorno su ${seen[0]}` : 'nessuna sessione aperta' };
    },
  },
  {
    id: 'V-015.b',
    voce: 'V-015',
    fase: 'A',
    proprieta: 'le pagine hanno una CSP (sul server di sviluppo: una prova della sua presenza, non della sua forma)',
    async run(ctx) {
      const pages = ['/', '/site/index.html'];
      const missing = [];
      for (const p of pages) {
        const r = await ctx.http('GET', p);
        if (!r.headers['content-security-policy'] && !/http-equiv=["']?content-security-policy/i.test(r.text)) missing.push(p);
      }
      return { ok: !missing.length, dettaglio: `${missing.length} pagine su ${pages.length} senza` };
    },
  },
  {
    id: 'V-016.a',
    voce: 'V-016',
    fase: 'B',
    proprieta: 'il testo d’errore di Stripe non arriva al client',
    async run(ctx) {
      const r = await post(ctx, '/api/stripe/checkout', { universo: 'sonda-crediti', wandererId: 'altro', crediti: 5 });
      return { ok: !r.text.includes(STRIPE_DETAIL), dettaglio: `risposta ${r.status}` };
    },
  },
  // --- The second audit (T167) ---------------------------------------------------------------------------------------------
  {
    id: 'V-020.a',
    voce: 'V-020',
    fase: 'A',
    proprieta: 'il testo di un’eccezione non arriva al client',
    async run(ctx) {
      const bad = await post(ctx, '/api/universe/sonda-base/commit', '{non è json', MASTER);
      const git = await post(ctx, '/api/universe/sonda-base/checkout', { id: 'abcd' }, MASTER);
      const inner = /JSON|position|fatal|pathspec|ENOENT|[A-Za-z]:\\/;
      return { ok: !inner.test(bad.text) && !inner.test(git.text), dettaglio: `risposte ${bad.status} e ${git.status}` };
    },
  },
  {
    id: 'V-021.a',
    voce: 'V-021',
    fase: 'A',
    proprieta: 'un messaggio che non si capisce non ferma il mondo né il suo processo',
    async run(ctx) {
      const altro = await ctx.enter('sonda-mondo', { id: 'sonda-testimone' });
      const io = await ctx.enter('sonda-mondo', { id: 'sonda-veleno' });
      if (!altro.ingresso || !io.ingresso) return { ok: true, dettaglio: `rifiutato: ${altro.rifiuto ?? io.rifiuto ?? 'nessuna risposta'}` };
      // An object JS cannot turn into a primitive, as a field of ordinary messages: at the world's own pace and past it.
      const odd = { toString: 1, valueOf: 1 };
      const from = altro.tick;
      for (let i = 0; i < 60; i++) {
        io.send({ t: 'phrase', seq: odd, tokens: [] });
        await new Promise((r) => setTimeout(r, 25));
      }
      for (let i = 0; i < 200; i++) io.send({ t: 'phrase', seq: odd, tokens: [] });
      await ctx.waitFor(() => altro.mondo.length > 0, 4000);
      const ticks = altro.tick - from;
      io.close();
      altro.close();
      return { ok: ticks >= 30 && !altro.mondo.length, dettaglio: `${ticks} tick in più per chi guarda, del mondo ha sentito: ${altro.mondo.join(', ') || 'niente'}` };
    },
  },
  {
    id: 'V-025.a',
    voce: 'V-025',
    fase: 'A',
    proprieta: 'un socket con un nome che non è un universo non avvia un processo',
    async run(ctx) {
      const c = await ctx.enter('sonda-non-esiste', { id: 'sonda-nome' });
      c.close();
      const left = existsSync(path.join(ctx.universes(), '.balances', 'sonda-non-esiste.json'));
      return { ok: !c.ingresso && !left, dettaglio: `${c.rifiuto ? 'rifiutato' : 'entrato o senza risposta'}, archivio dei saldi ${left ? 'creato' : 'non creato'}` };
    },
  },
  {
    id: 'V-026.a',
    voce: 'V-026',
    fase: 'A',
    proprieta: 'un socket che non dice chi è non avvia il mondo di un universo che esiste',
    async run(ctx) {
      await ctx.silent('sonda-silenzio', 1500);
      const r = await ctx.http('GET', '/api/session');
      const on = JSON.parse(r.text).sessions?.some((s) => s.name === 'sonda-silenzio');
      return { ok: r.status === 200 && !on, dettaglio: `risposta ${r.status}, mondo ${on ? 'acceso' : 'spento'}` };
    },
  },
  {
    id: 'V-028.a',
    voce: 'V-028',
    fase: 'A',
    proprieta: 'il checkout non ascolta un’altra origine né chi non è su questa macchina',
    async run(ctx) {
      const body = { universo: 'sonda-crediti', wandererId: 'altro', crediti: 5 };
      const other = await post(ctx, '/api/stripe/checkout', body, { ...J, Origin: ALTRA });
      const outside = await post(ctx, '/api/stripe/checkout', body, { ...J, ...OUTSIDE });
      return { ok: other.status === 403 && outside.status === 403, dettaglio: `risposte ${other.status} e ${outside.status}` };
    },
  },
  {
    id: 'V-029.a',
    voce: 'V-029',
    fase: 'A',
    proprieta: 'una pagina su un’altra porta di questa macchina non legge i file del progetto',
    async run(ctx) {
      const r = await ctx.http('GET', '/package.json', { headers: { Origin: 'http://127.0.0.1:4872' } });
      const cors = r.headers['access-control-allow-origin'];
      return { ok: !cors, dettaglio: `risposta ${r.status}, CORS ${cors ?? 'assente'}` };
    },
  },
  { id: 'V-016.b', voce: 'V-016', fase: 'Z', proprieta: 'nessun valore finto dei segreti in ciò che il server ha risposto o scritto nel log', interna: 'scansione' },
  { id: 'V-016.c', voce: 'V-016', fase: 'Z', proprieta: 'nessun valore finto dei segreti in `dist/` dopo una build', interna: 'build' },
];

/** The voices no probe of this kit reaches, and why: the register's table says the same. */
export const UNCOVERED = {
  'V-013': 'il Concilio che scrive `ai` si vede solo dentro il kernel: lo prova tests/sicurezza/uscite.test.ts',
  'V-018': 'accettata: non si prova',
  'V-022': 'chi paga si vede solo dentro il kernel: lo prova tests/sicurezza/secondo-audit.test.ts',
  'V-023': 'chi paga si vede solo dentro il kernel: lo prova tests/sicurezza/secondo-audit.test.ts',
  'V-024': 'il costo di una chiamata si vede solo dentro il kernel: lo prova tests/sicurezza/secondo-audit.test.ts',
  'V-027': 'ciò che Lua scrive si vede solo dentro la sandbox: lo prova tests/sicurezza/secondo-audit.test.ts',
};
