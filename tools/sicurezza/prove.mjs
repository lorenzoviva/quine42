#!/usr/bin/env node
// `npm run sicurezza:prove` (T137): the probes that an agent's session may not run, measured by the author on a server in a
// throwaway project. Prints, for each one, V-NNN, the property, `ok` or `FALLA`, and writes docs/sicurezza/esiti/<data>.json.
// Options: --solo V-001,V-014 (only those voices); --senza-build (no build of dist/); --resta [porta] (only starts the server
// for the blocks of docs/sicurezza/prove-f12.md, until Ctrl+C). The exit code is 0 when the kit ran to the end, whatever it found.

import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { existsSync, promises as fs, readdirSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { WebSocket } from 'ws';
import { assertLoopback, cleanEnv, fakeSecrets, git, makeProject, removeProject, REPO, scrub, versions, writeEnv } from './ambiente.mjs';
import { PROBES } from './catalogo.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n) => (flag(n) ? args[args.indexOf(n) + 1] : undefined);
const voices = value('--solo')?.split(',').map((v) => v.trim());
const KIT = path.join(REPO, 'tools', 'sicurezza');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A request as it is written: no normalised path, any header. Loopback only. */
function request(base, method, p, { body, headers = {}, timeout = 30000 } = {}) {
  const target = new URL(base);
  assertLoopback(base);
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: target.hostname, port: target.port, method, path: p, headers: { ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}), ...headers }, timeout }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('tempo scaduto')));
    req.on('error', reject);
    req.end(body);
  });
}

/** A client of a world: enters, then can ask (one message, its answer) until it closes. */
function enter(base, universo, entra, { origin, headers, wait = 90000 } = {}) {
  const url = `${base.replace(/^http/, 'ws')}/api/session?universo=${universo}&offline`;
  assertLoopback(base);
  const ws = new WebSocket(url, { ...(origin ? { origin } : {}), ...(headers ? { headers } : {}) });
  const client = {
    /** What the server said of the world (stopped, started again), and the last tick it told. */
    mondo: [],
    tick: 0,
    answers: new Map(),
    waiting: new Map(),
    send: (m) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(m)),
    close: () => ws.close(),
    ask(m, ms = 5000) {
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(undefined), ms);
        client.waiting.set(m.seq, (a) => {
          clearTimeout(timer);
          resolve(a);
        });
        client.send(m);
      });
    },
  };
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(client), wait);
    const done = () => {
      clearTimeout(timer);
      resolve(client);
    };
    ws.on('open', () => client.send({ t: 'entra', nome: entra.id, ...entra }));
    ws.on('message', (data) => {
      const m = JSON.parse(String(data));
      if (m.t === 'mondo') client.mondo.push(m.stato);
      if (m.t === 'aggiorna') client.tick = m.tick;
      if (m.t === 'ingresso') {
        client.ingresso = m;
        done();
      } else if (m.t === 'rifiuto') {
        client.rifiuto = m.motivo;
        done();
      } else if (m.t === 'esito') {
        client.answers.set(m.seq, m);
        client.waiting.get(m.seq)?.(m);
      }
    });
    ws.on('close', done);
    ws.on('error', done);
  });
}

// --- The universes of the probes, written directly on the disk: their setting up does not go through what is being measured. ---

/** The seed's text files, without reading anything else of the repository. */
function seedFiles() {
  const out = {};
  const dir = path.join(REPO, 'universe');
  for (const f of readdirSync(dir, { recursive: true })) {
    const abs = path.join(dir, String(f));
    if (statSync(abs).isFile()) out[String(f).replace(/\\/g, '/')] = readFileSync(abs, 'utf8');
  }
  return out;
}

const seedConfig = () => readFileSync(path.join(REPO, 'universe', 'universe.json'), 'utf8');
const many = (name) => JSON.stringify({ ...JSON.parse(seedConfig()), name, partita: { modalita: 'multigiocatore', morte: 3, master: 'io' } }, null, 2);

async function writeUniverse(root, files) {
  for (const [rel, text] of Object.entries(files)) {
    const abs = path.join(root, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, text, 'utf8');
  }
  await fs.writeFile(path.join(root, '.gitattributes'), '* text=auto eol=lf\n', 'utf8');
  git(root, ['init', '-q']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'sonda: nasce']);
}

/** A small universe of many: a module, a wanderer with a balance. */
const small = (name) => ({
  'universe.json': many(name),
  'modules/sonda/manifest.json': JSON.stringify({ id: 'sonda', name: 'Sonda', kind: 'data' }),
  'modules/sonda/logic.lua': 'return {}\n',
  'world/giocatori/altro.json': JSON.stringify({ nome: 'Altro', crediti: 5 }),
});

/** The whole seed as a universe of many, with a wanderer who has a balance. */
const world = (name, seed, extra = {}) => ({ ...seed, 'universe.json': many(name), 'world/giocatori/altro.json': JSON.stringify({ nome: 'Altro', crediti: 5 }), ...extra });

async function makeUniverses(work) {
  const at = (n) => path.join(work, 'universes', n);
  for (const n of ['sonda-base', 'sonda-git', 'sonda-crediti', 'sonda-doppio', 'sonda-cestino', 'sonda-silenzio']) await writeUniverse(at(n), small(n));
  // With a second commit to go back from, on the disk of the probes.
  for (const n of ['sonda-ritorno', 'sonda-rollback']) {
    await writeUniverse(at(n), small(n));
    await fs.writeFile(path.join(at(n), 'world', 'secondo.txt'), 'secondo\n', 'utf8');
    git(at(n), ['add', '-A']);
    git(at(n), ['commit', '-q', '-m', 'sonda: secondo']);
  }
  await writeUniverse(at('sonda-fusione'), small('sonda-fusione'));
  git(at('sonda-fusione'), ['branch', 'rami/master']);
  // What the webhook's name could reach out of universes/: a folder that looks like a universe, in the throwaway project.
  await writeUniverse(path.join(work, 'fuori'), small('fuori'));
  const seed = seedFiles();
  await writeUniverse(at('sonda-mondo'), world('sonda-mondo', seed));
  // A world whose system blocks in a C function at every tick: for V-007.c, whose server does not come back.
  await writeUniverse(
    at('sonda-bloccato'),
    world('sonda-bloccato', seed, {
      'modules/sys.sonda/manifest.json': JSON.stringify({ id: 'sys.sonda', name: 'Sonda', kind: 'system', order: 1, logic: 'logic.lua' }),
      'modules/sys.sonda/logic.lua': `local M = {}\nfunction M.update()\n  return string.find(string.rep('a', 3000), string.rep('.-', 24) .. 'x')\nend\nreturn M\n`,
    }),
  );
  // For the block of the seed in the sessions' page (docs/sicurezza/prove-f12.md): a seed that is not a number.
  const odd = JSON.parse(many('sonda-seme'));
  odd.seed = '<b id="sonda-v015">sonda</b>';
  await writeUniverse(at('sonda-seme'), { ...small('sonda-seme'), 'universe.json': JSON.stringify(odd, null, 2) });
}

// --- The server, in a process of its own in the throwaway project -------------------------------------------------------------

async function startServer(work, port) {
  const log = await fs.open(path.join(work, 'server.log'), 'a');
  const child = spawn(process.execPath, [path.join(KIT, 'server.mjs')], { cwd: work, env: { ...cleanEnv(work), ...(port ? { KIT_PORTA: String(port) } : {}) }, stdio: ['ignore', 'pipe', log.fd], windowsHide: true });
  const started = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('il server non è partito in 120 s')), 120000);
    let out = '';
    child.stdout.on('data', (d) => {
      out += d;
      const m = /\{"pronto":true.*\}/.exec(out);
      if (m) {
        clearTimeout(timer);
        resolve(JSON.parse(m[0]));
      }
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`il server è uscito con il codice ${code}`));
    });
  });
  const base = `http://localhost:${started.porta}`;
  assertLoopback(base);
  return { base, stop: () => stopChild(child, log) };
}

async function stopChild(child, log) {
  child.removeAllListeners('exit');
  const gone = new Promise((r) => child.once('exit', r));
  child.kill('SIGKILL');
  await Promise.race([gone, sleep(5000)]);
  await log?.close().catch(() => undefined);
}

/** A sandbox's case in a process of its own, with a time limit: `null` if it had to be killed. */
function runCase(work, caso, limit) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(KIT, 'sandbox.mjs'), caso], { cwd: work, env: cleanEnv(work), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    const timer = setTimeout(() => child.kill('SIGKILL'), limit);
    child.on('exit', () => {
      clearTimeout(timer);
      const line = out.split('\n').reverse().find((l) => l.startsWith('{'));
      resolve(line ? JSON.parse(line) : null);
    });
  });
}

// --- The run -----------------------------------------------------------------------------------------------------------------

async function main() {
  const secrets = fakeSecrets();
  const work = await makeProject(secrets);
  const results = [];
  const servers = [];
  const bodies = [];
  const print = (p, esito, dettaglio) => {
    const line = scrub(dettaglio ?? '', secrets, work);
    results.push({ id: p.id, voce: p.voce, proprieta: p.proprieta, esito, dettaglio: line });
    console.log(`${p.id.padEnd(8)} ${esito.padEnd(5)} ${p.proprieta}${line ? ` (${line})` : ''}`);
  };

  const cleanup = async () => {
    for (const s of servers.splice(0)) await s.stop().catch(() => undefined);
    const left = await removeProject(work);
    if (left) console.log(`ATTENZIONE: ${left}`);
  };
  let stopping = false;
  process.on('SIGINT', async () => {
    if (stopping) return;
    stopping = true;
    await cleanup();
    process.exit(130);
  });

  try {
    await makeUniverses(work);

    if (flag('--resta')) {
      const s = await startServer(work, Number(value('--resta')) || 0);
      servers.push(s);
      console.log(`Server di prova su ${s.base} (segreti finti, universi temporanei). Ctrl+C per fermarlo e cancellare tutto.`);
      console.log(`Blocchi da incollare: docs/sicurezza/prove-f12.md. Il segreto finto da cercare nel blocco 1 è: ${secrets.GEMINI_API_KEY}`);
      await new Promise(() => {});
    }

    const signing = (raw) => {
      const t = Math.floor(Date.now() / 1000);
      return `t=${t},v1=${createHmac('sha256', secrets.STRIPE_WEBHOOK_SECRET).update(`${t}.${raw}`, 'utf8').digest('hex')}`;
    };
    const contextFor = (base) => ({
      secrets,
      work,
      workUrl: work.replace(/\\/g, '/'),
      git: (cwd, a) => git(cwd, a),
      universes: () => path.join(work, 'universes'),
      uni: (n) => path.join(work, 'universes', n),
      seedConfig,
      sign: signing,
      enter: (u, e, o) => enter(base, u, e, o),
      /** A socket on a universe that says nothing for `ms`, then closes. */
      silent: (u, ms) =>
        new Promise((resolve) => {
          const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/api/session?universo=${u}`);
          ws.on('error', () => resolve());
          ws.on('open', () =>
            setTimeout(() => {
              ws.close();
              resolve();
            }, ms),
          );
        }),
      waitFor: async (fn, ms) => {
        const end = Date.now() + ms;
        while (Date.now() < end && !fn()) await sleep(100);
      },
      network: () => {
        const f = path.join(work, 'rete.jsonl');
        return existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
      },
      http: async (method, p, o) => {
        const r = await request(base, method, p, o);
        bodies.push(r.text, JSON.stringify(r.headers));
        return r;
      },
    });

    const chosen = PROBES.filter((p) => !voices || voices.includes(p.voce));
    const runAll = async (list, ctx) => {
      for (const p of list) {
        try {
          const r = await p.run(ctx);
          print(p, r.ok ? 'ok' : 'FALLA', r.dettaglio);
        } catch (e) {
          print(p, 'ERRORE', String(e?.message ?? e).slice(0, 300));
        }
      }
    };

    // Sandbox's cases: each its own process.
    const cases = new Map();
    for (const p of chosen.filter((x) => x.fase === 'S')) {
      if (!cases.has(p.caso)) cases.set(p.caso, await runCase(work, p.caso, p.tempo ?? 60000));
      const r = cases.get(p.caso);
      if (r === null) print(p, 'FALLA', `processo ucciso dopo ${(p.tempo ?? 60000) / 1000} s`);
      else if (r.errore) print(p, 'ERRORE', r.errore);
      else if (p.lettura) {
        const v = p.lettura(r);
        if (v.errore) print(p, 'ERRORE', v.errore);
        else print(p, v.ok ? 'ok' : 'FALLA', v.dettaglio);
      } else print(p, r.ok ? 'ok' : 'FALLA', r.dettaglio);
    }

    // Plain server: A, then F (it does not come back).
    const plain = chosen.filter((x) => x.fase === 'A' || x.fase === 'F');
    if (plain.length) {
      await writeEnv(work, { GEMINI_API_KEY: secrets.GEMINI_API_KEY });
      const s = await startServer(work);
      servers.push(s);
      await runAll(plain.filter((x) => x.fase === 'A'), contextFor(s.base));
      await runAll(plain.filter((x) => x.fase === 'F'), contextFor(s.base));
      await s.stop();
      servers.splice(servers.indexOf(s), 1);
    }

    // The server with the webhook's secret and a Stripe key (the requests to Stripe answered by the kit).
    const signed = chosen.filter((x) => x.fase === 'B');
    if (signed.length) {
      await writeEnv(work, secrets);
      const s = await startServer(work);
      servers.push(s);
      await runAll(signed, contextFor(s.base));
      await s.stop();
      servers.splice(servers.indexOf(s), 1);
    }

    const values = Object.values(secrets);
    for (const p of chosen.filter((x) => x.fase === 'Z')) {
      if (p.interna === 'scansione') {
        const log = existsSync(path.join(work, 'server.log')) ? readFileSync(path.join(work, 'server.log'), 'utf8') : '';
        const hits = [...bodies, log].filter((t) => values.some((v) => t.includes(v))).length;
        // Answers to the `.env` probes are V-014's: a value found there is reported there.
        const envLeaks = results.filter((r) => r.voce === 'V-014' && r.esito === 'FALLA').length;
        print(p, hits > envLeaks ? 'FALLA' : 'ok', `${bodies.length / 2} risposte e il log; ${hits} testi con un valore, ${envLeaks} già di V-014`);
      }
      if (p.interna === 'build') {
        if (flag('--senza-build')) {
          print(p, 'SALTA', '--senza-build');
          continue;
        }
        await writeEnv(work, secrets);
        const code = await new Promise((resolve) => {
          const child = spawn(process.execPath, [path.join(KIT, 'server.mjs'), 'build'], { cwd: work, env: cleanEnv(work), stdio: 'ignore', windowsHide: true });
          child.on('exit', resolve);
        });
        const dist = path.join(work, 'dist');
        if (code !== 0 || !existsSync(dist)) {
          print(p, 'ERRORE', `build con codice ${code}`);
          continue;
        }
        let files = 0;
        let hits = 0;
        for (const f of readdirSync(dist, { recursive: true })) {
          const abs = path.join(dist, String(f));
          if (!statSync(abs).isFile()) continue;
          files++;
          const text = readFileSync(abs).toString('latin1');
          if (values.some((v) => text.includes(v))) hits++;
        }
        print(p, hits ? 'FALLA' : 'ok', `${files} file, ${hits} con un valore`);
      }
    }

    const count = (e) => results.filter((r) => r.esito === e).length;
    const summary = { ok: count('ok'), falle: count('FALLA'), errori: count('ERRORE'), saltate: count('SALTA') };
    const date = new Date().toISOString().slice(0, 10);
    const out = path.join(REPO, 'docs', 'sicurezza', 'esiti', `${date}.json`);
    const text = scrub(JSON.stringify({ data: date, ...versions(), solo: voices ?? null, riepilogo: summary, prove: results }, null, 1), secrets, work);
    // A value of the machine's own environment must not be there either: checked here, never printed.
    if (values.some((v) => text.includes(v)) || ['GEMINI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'].some((k) => process.env[k] && text.includes(process.env[k]))) throw new Error('un segreto sarebbe finito nell’esito: non scritto');
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, text + '\n', 'utf8');
    console.log(`\n${summary.ok} ok, ${summary.falle} FALLA, ${summary.errori} ERRORE, ${summary.saltate} saltate. Esito in docs/sicurezza/esiti/${date}.json: FALLA misura lo stato di oggi, non è un errore del kit.`);
  } finally {
    await cleanup();
  }
  process.exit(0);
}

await main();
