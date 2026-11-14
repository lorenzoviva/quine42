// The pace of the world (T373, ADR-0188 §3, ADR-0196): held, the new places stay drafts and no call goes out; normal goes on from where the players
// are; the pace never raises `placesPerMinute` above the lobby's. The master's alone, on the wire and on the store's route.

import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { BUDGET_SCALE } from '../src/kernel/universe';
import { NORMAL_PACE, PACE_PLACES_SCALE, paceGap, placesPerMinute, readPace, SLOW_LEAST_GAP, SLOW_PLACES } from '../src/kernel/worldPace';
import { fakeLink } from '../src/session/protocol';
import { LIMITS, SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { worldOf } from '../server/worldCalls';
import { CampaignArchive, keepPace, keptPace, paceAnswer, readCampaign } from '../server/campaign';

const DT = 1 / 60;
const S = 18;
const middleOf = (cx: number, cy: number) => ({ x: cx * S + S / 2, y: cy * S + S / 2 });

/** The local models, writing down every call: what, and for a plan where. */
class Recording extends MockAiModels {
  calls: string[] = [];
  plans: string[] = [];
  async text(call: TextCall): Promise<string> {
    this.calls.push(call.task ?? '?');
    if (call.task === 'chunk.plan') {
      const d = call.data as { cx: number; cy: number };
      this.plans.push(`${d.cx},${d.cy}`);
    }
    return super.text(call);
  }
}

async function boot(ai: Record<string, unknown> = {}, many = true): Promise<{ k: Kernel; models: Recording }> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const game = many ? { mode: 'multiplayer', death: 3 } : cfg.game;
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, ...ai }, game }, null, 2) };
  const models = new Recording();
  const k = await Kernel.boot({ files, store: memoryStore(), ai: models });
  k.giveCredits('me', 100);
  return { k, models };
}

async function run(server: SessionServer, rounds: number) {
  for (let i = 0; i < rounds; i++) {
    server.tick(DT);
    await new Promise((r) => setTimeout(r, 15));
  }
}

async function settle(server: SessionServer, rounds = 80) {
  for (let i = 0; i < rounds; i++) {
    await run(server, 1);
    if ([...server.kernel.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  await run(server, 12);
}

function join(server: SessionServer, id: string): SessionClient {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  server.kernel.giveCredits(id, 100);
  return new SessionClient(c, { id });
}

/** A message's answer: the server reads its inbox at every tick. */
async function asked<T>(server: SessionServer, p: Promise<T>): Promise<T> {
  let done = false;
  void p.finally(() => (done = true));
  for (let i = 0; i < 200 && !done; i++) await run(server, 1);
  return p;
}

function put(k: Kernel, id: string, to: { x: number; y: number }) {
  k.as(id, () => {
    const p = k.wandererPos();
    Object.assign(k.carpet()!, { ox: to.x - p.x, oy: to.y - p.y });
  });
}

describe('il ritmo, una funzione pura (T373)', () => {
  it('ripara ciò che arriva: un modo ignoto è normale, i luoghi al minuto solo per lento e nella scala della lobby', () => {
    expect(PACE_PLACES_SCALE).toEqual(BUDGET_SCALE.placesPerMinute);
    expect(readPace(undefined)).toEqual(NORMAL_PACE);
    expect(readPace({ mode: 'veloce' })).toEqual(NORMAL_PACE);
    expect(readPace({ mode: 'hold', placesPerMinute: 50 })).toEqual({ mode: 'hold' });
    expect(readPace({ mode: 'normal', placesPerMinute: 50 })).toEqual(NORMAL_PACE);
    expect(readPace({ mode: 'slow' })).toEqual({ mode: 'slow' });
    expect(readPace({ mode: 'slow', placesPerMinute: 1e9 })).toEqual({ mode: 'slow', placesPerMinute: 120 });
    expect(readPace({ mode: 'slow', placesPerMinute: -3 })).toEqual({ mode: 'slow', placesPerMinute: 1 });
    expect(readPace({ mode: 'slow', placesPerMinute: NaN })).toEqual({ mode: 'slow' });
    expect(readPace({ mode: 'slow', placesPerMinute: '9' })).toEqual({ mode: 'slow' });
  });

  it('non alza mai i luoghi al minuto sopra la lobby, e le pause solo più lunghe', () => {
    for (const lobby of [1, 2, 4, 20, 120, Infinity])
      for (const raw of [{ mode: 'normal' }, { mode: 'slow' }, { mode: 'slow', placesPerMinute: 120 }, { mode: 'slow', placesPerMinute: 1 }, { mode: 'hold' }]) {
        const n = placesPerMinute(readPace(raw), lobby);
        expect(n).toBeLessThanOrEqual(lobby);
      }
    expect(placesPerMinute({ mode: 'slow' }, 20)).toBe(SLOW_PLACES);
    expect(placesPerMinute({ mode: 'slow' }, Infinity)).toBe(SLOW_PLACES);
    expect(placesPerMinute({ mode: 'hold' }, 20)).toBe(0);
    for (const gap of [0, 10, 60, 600, Infinity]) {
      expect(paceGap(gap, NORMAL_PACE)).toBe(gap);
      expect(paceGap(gap, { mode: 'slow' })).toBeGreaterThanOrEqual(gap);
    }
    expect(paceGap(0, { mode: 'slow' })).toBe(SLOW_LEAST_GAP);
    expect(paceGap(100, { mode: 'slow' })).toBe(200);
  });
});

describe('il ritmo nel kernel (T373)', () => {
  it('in pausa i luoghi nuovi restano bozze e nessuna chiamata parte; «normale» riprende da dove sono i giocatori', async () => {
    const { k, models } = await boot();
    const server = new SessionServer(k);
    const anna = join(server, 'anna');
    await anna.ready;
    await settle(server);
    // Only the master sets it.
    expect((await k.setPace({ mode: 'hold' }, 'anna')).ok).toBe(false);
    expect(k.worldPace()).toEqual(NORMAL_PACE);
    const told: unknown[] = [];
    k.bus.on('pace', (p) => told.push(p));
    expect(await k.setPace({ mode: 'hold' }, k.masterId())).toEqual({ ok: true, pace: { mode: 'hold' } });
    expect(told).toEqual([{ mode: 'hold' }]);
    // What was in flight finishes; from here on nothing is asked of the models, whatever happens in the world for minutes.
    await run(server, 20);
    const before = models.calls.length;
    put(k, 'anna', middleOf(14, -9));
    for (let i = 0; i < 4; i++) {
      await run(server, 30);
      k.time += 70;
    }
    // A new day too: plots, dialogues and new individuals wait.
    k.time += 24 * 60 * 60;
    await run(server, 30);
    expect(models.calls.slice(before)).toEqual([]);
    const here = k.chunks.get('14,-9')!;
    expect(here.stage).toBe('draft');
    expect(here.held).toBe(true);
    // Going on again, the place where the player is comes first.
    const planned = models.plans.length;
    expect((await k.setPace({ mode: 'normal' }, k.masterId())).ok).toBe(true);
    await run(server, 3);
    expect(models.plans.slice(planned)[0]).toBe('14,-9');
    await settle(server);
    expect(k.chunks.get('14,-9')!.stage).toBe('planned');
  }, 60_000);

  it('in pausa un luogo già scritto torna come era, senza chiamate', async () => {
    const { k, models } = await boot();
    const server = new SessionServer(k);
    const anna = join(server, 'anna');
    await anna.ready;
    put(k, 'anna', middleOf(6, 6));
    await settle(server);
    expect(k.chunks.get('6,6')!.stage).toBe('planned');
    // Far away, so that the place is let go; then held, and back.
    put(k, 'anna', middleOf(30, 30));
    await run(server, 10);
    await k.setPace({ mode: 'hold' }, k.masterId());
    await run(server, 20);
    const before = models.calls.length;
    put(k, 'anna', middleOf(6, 6));
    await run(server, 40);
    expect(k.chunks.get('6,6')!.stage).toBe('planned');
    expect(models.calls.slice(before)).toEqual([]);
  }, 60_000);

  it('lento: mai più luoghi nuovi al minuto della lobby, anche se il master ne chiede di più', async () => {
    const { k, models } = await boot({ placesPerMinute: 2 });
    const server = new SessionServer(k);
    const anna = join(server, 'anna');
    await anna.ready;
    // A slow pace that asks for 10: the lobby said 2.
    const r = await k.setPace({ mode: 'slow', placesPerMinute: 10 }, k.masterId());
    expect(r).toEqual({ ok: true, pace: { mode: 'slow', placesPerMinute: 10 } });
    await run(server, 60);
    put(k, 'anna', middleOf(-11, 7));
    await run(server, 60);
    expect(models.plans.length).toBeLessThanOrEqual(2);
    // One a minute: one less than the lobby.
    await k.setPace({ mode: 'slow', placesPerMinute: 1 }, k.masterId());
    k.time += 61;
    const at = models.plans.length;
    await run(server, 60);
    expect(models.plans.length - at).toBe(1);
  }, 60_000);

  it('da soli il ritmo vale nel kernel del browser: lento ha un tetto anche dove la lobby non ne ha', async () => {
    const { k } = await boot({}, false);
    expect(k.manyPlayers()).toBe(false);
    expect((await k.setPace({ mode: 'slow' })).ok).toBe(true);
    expect(k.worldPace()).toEqual({ mode: 'slow' });
    expect(k.pacedGap(0)).toBe(SLOW_LEAST_GAP);
    expect((await k.setPace({ mode: 'hold' })).ok).toBe(true);
    expect(k.paceHeld()).toBe(true);
  });
});

describe('il ritmo sul filo (T373)', () => {
  it('solo il master lo cambia; ogni client lo sa, all’entrata e quando cambia', async () => {
    const { k } = await boot();
    const server = new SessionServer(k);
    const master = join(server, 'me');
    const anna = join(server, 'anna');
    await Promise.all([master.ready, anna.ready]);
    const no = await asked(server, anna.act({ t: 'pace', mode: 'hold' }));
    expect(no.ok).toBe(false);
    expect(k.worldPace()).toEqual(NORMAL_PACE);
    const yes = await asked(server, master.act({ t: 'pace', mode: 'hold' }));
    expect(yes.ok).toBe(true);
    expect(JSON.parse(yes.text!)).toEqual({ mode: 'hold' });
    await run(server, 6);
    expect(anna.pace).toEqual({ mode: 'hold' });
    expect(master.pace).toEqual({ mode: 'hold' });
    // Who comes in now hears it in the welcome.
    const bruno = join(server, 'bruno');
    await asked(server, bruno.ready);
    expect(bruno.pace).toEqual({ mode: 'hold' });
    // Repaired on the way: an unknown mode is normal.
    const odd = await asked(server, master.act({ t: 'pace', mode: 'turbo' }));
    expect(odd.ok).toBe(true);
    expect(k.worldPace()).toEqual(NORMAL_PACE);
    await run(server, 6);
    expect(anna.pace).toEqual(NORMAL_PACE);
  });

  it('ha un ritmo suo: oltre il colpo dei cambi, il server rifiuta', async () => {
    const { k } = await boot();
    const server = new SessionServer(k);
    const master = join(server, 'me');
    await master.ready;
    const answers = await asked(server, Promise.all(Array.from({ length: LIMITS.paceBurst + 2 }, (_, i) => master.act({ t: 'pace', mode: i % 2 ? 'hold' : 'normal' }))));
    expect(answers.filter((a) => a.ok).length).toBe(LIMITS.paceBurst);
    expect(answers.filter((a) => !a.ok).length).toBe(2);
  });

  it('il mondo lo prende per valore dalle rotte, senza ridirlo', async () => {
    const { k } = await boot();
    const told: unknown[] = [];
    k.bus.on('pace', (p) => told.push(p));
    const taken = await worldOf(k).setPace({ mode: 'slow', placesPerMinute: 3 });
    expect(taken).toEqual({ mode: 'slow', placesPerMinute: 3 });
    expect(k.worldPace()).toEqual(taken);
    expect(told).toEqual([]);
  });
});

describe('il ritmo sul server (T373)', () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-ritmo-'));
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));
  const game = { many: true, master: 'anna' };
  const master = { local: false, id: 'anna' };

  it('sta in .campaign, riparato; normale non si scrive; un file illeggibile non ferma il mondo', () => {
    const archive = new CampaignArchive(path.join(dir, '.campaign'), dir);
    expect(keptPace(archive, 'mondo')).toEqual(NORMAL_PACE);
    expect(keepPace(archive, 'mondo', { mode: 'slow', placesPerMinute: 999 })).toEqual({ mode: 'slow', placesPerMinute: 120 });
    expect(keptPace(archive, 'mondo')).toEqual({ mode: 'slow', placesPerMinute: 120 });
    keepPace(archive, 'mondo', { mode: 'normal' });
    expect(archive.read('mondo').pace).toBeUndefined();
    expect(readCampaign({ pace: { mode: 'boh' } }).pace).toBeUndefined();
    expect(readCampaign({ pace: { mode: 'hold' } }).pace).toEqual({ mode: 'hold' });
  });

  it('la rotta: solo il master di un universo di molti, mai il mondo; ciò che tiene lo dice al mondo acceso', async () => {
    const archive = new CampaignArchive(path.join(dir, '.campaign'), dir);
    const told: unknown[] = [];
    const tellPace = async (_: string, p: unknown) => (told.push(p), readPace(p));
    const ctx = { name: 'mondo2', game, archive, tellPace };
    expect((await paceAnswer('POST', { mode: 'hold' }, { ...ctx, who: { local: false, id: 'bruno' } })).status).toBe(403);
    expect((await paceAnswer('POST', { mode: 'hold' }, { ...ctx, who: { local: false, server: true } })).status).toBe(403);
    expect((await paceAnswer('POST', { mode: 'hold' }, { ...ctx, who: { local: true }, game: { many: false, master: 'me' } })).status).toBe(409);
    expect((await paceAnswer('POST', { mode: 'veloce' }, { ...ctx, who: master })).status).toBe(400);
    expect((await paceAnswer('POST', { mode: 'slow', placesPerMinute: 'tanti' }, { ...ctx, who: master })).status).toBe(400);
    expect(told).toEqual([]);
    const r = await paceAnswer('POST', { mode: 'hold' }, { ...ctx, who: master });
    expect(r).toEqual({ status: 200, body: { ok: true, pace: { mode: 'hold' }, running: { mode: 'hold' } } });
    expect(told).toEqual([{ mode: 'hold' }]);
    expect(keptPace(archive, 'mondo2')).toEqual({ mode: 'hold' });
    expect((await paceAnswer('GET', {}, { ...ctx, who: master })).body).toEqual({ ok: true, pace: { mode: 'hold' } });
    expect((await paceAnswer('GET', {}, { ...ctx, who: { local: false, id: 'bruno' } })).status).toBe(403);
  });
});
