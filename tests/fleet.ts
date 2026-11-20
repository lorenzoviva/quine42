// A fleet for the tests of the vehicle in a game of many (T442, ADR-0232): the boat of the tests (`fixtures/barca-prova.xml`) in a pool,
// a server, three wanderers each with a client of their own (Anna and Bruno on its deck, Carla on the shore). Used by
// `veicolo-molti.test.ts` and by the suite of the vulnerabilities (`sicurezza/veicolo-molti.test.ts`, V-046).

import { readFileSync } from 'node:fs';
import { expect } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { offDeck, onDeck } from '../src/kernel/vehicle';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import type { FileMap } from '../src/kernel/types';

export const DT = 1 / 60;
export const BOAT = 'veicolo.prova';
const BOAT_XML = readFileSync(new URL('./fixtures/barca-prova.xml', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/** The seed with the boat of the tests (T439), in a game of many. */
export function files(game: Record<string, unknown>): FileMap {
  const index = JSON.parse(bundledFiles['models/index.json']);
  index['barca-prova'] = { class: 'object', name: 'Barca di prova' };
  const manifest = {
    id: BOAT,
    name: 'Barca',
    kind: 'entity',
    description: 'Una barca a vela per le prove.',
    appearance: { glyph: 'B', color: '#8a5a2b', model: 'barca-prova', class: 'object' },
    physics: { solid: true, radius: 0.5 },
    vehicle: { medium: 'water', speed: 3, accel: 2, turn: 1 },
  };
  const cfg = JSON.parse(bundledFiles['universe.json']);
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3, ...game } }, null, 2),
    'models/index.json': JSON.stringify(index, null, 1),
    'models/barca-prova.xml': BOAT_XML,
    [`modules/${BOAT}/manifest.json`]: JSON.stringify(manifest, null, 1),
  };
}

export async function thin(server: SessionServer, id: string, name: string): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, name });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
  return new ThinClient(k, session);
}

export function run(server: SessionServer, clients: ThinClient[], frames: number, each?: () => void) {
  for (let i = 0; i < frames; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
    each?.();
  }
}

/** Waits for an answer while the world goes on (the server answers when it ticks). */
export async function ask<T>(server: SessionServer, clients: ThinClient[], p: Promise<T>): Promise<T> {
  let done = false;
  void p.finally(() => (done = true));
  for (let i = 0; i < 200 && !done; i++) {
    run(server, clients, 1);
    await new Promise((r) => setTimeout(r, 0));
  }
  return p;
}

/** The entity of the boat in a client's mirror. */
export const boatIn = (c: ThinClient) => c.k.ecs.query('vehicle')[0];
/** Another wanderer's body in a client's mirror. */
export const avatarOf = (c: ThinClient, id: string) => c.k.ecs.query('remote').find((e) => c.k.ecs.get(e, 'remote').id === id)!;

/**
 * A pool of deep water ringed by ground, the boat in its middle with its bow toward the east (+x), its form ready on the server and in every
 * mirror; Anna and Bruno on its deck, each from a client of their own, Carla on the shore.
 */
export async function fleet(game: Record<string, unknown> = {}) {
  const k = await Kernel.boot({ files: files(game), store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(DT);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.carpet()!.active = false;
  const server = new SessionServer(k);
  const anna = await thin(server, 'anna', 'Anna');
  const bruno = await thin(server, 'bruno', 'Bruno');
  const carla = await thin(server, 'carla', 'Carla');
  const all = [anna, bruno, carla];
  const c = k.wandererCarpet();
  const x0 = Math.floor(c.x) + 3, y0 = Math.floor(c.y) + 4;
  const ground = Object.keys(k.palette).find((t) => t !== '?' && !k.palette[t].solid && (k.palette[t].layer ?? 'ground') === 'ground')!;
  for (let r = 0; r <= 8; r++) for (let col = 0; col <= 12; col++) expect(k.setTile(x0 + col, y0 + r, r >= 1 && r <= 7 && col >= 1 && col <= 11 ? 'o' : ground)).toBe(true);
  for (const id of k.ecs.query('pos')) {
    const p = k.ecs.get(id, 'pos');
    if (!k.ecs.has(id, 'player') && Math.abs(p.x - (x0 + 6.5)) < 14 && Math.abs(p.y - (y0 + 4.5)) < 12) k.ecs.destroy(id);
  }
  const boat = k.spawnModuleEntity(k.modules.get(BOAT)!, x0 + 6.5, y0 + 4.5);
  k.ecs.get(boat, 'vehicle').heading = Math.PI / 2;
  const fc = k.ecs.get(boat, 'form');
  fc.yaw = Math.PI / 2;
  await k.forms.wait(fc.model, fc.seed, fc.tint);
  /** Puts a wanderer somewhere in the world (their carpet under them), as the world would: their client is told. */
  const put = (id: string, x: number, y: number) => {
    k.as(id, () => {
      const p = k.wandererPos();
      delete p.z;
      Object.assign(k.carpet()!, { ox: x - p.x, oy: y - p.y });
    });
    k.tick(DT);
    k.bus.emit('wanderer:pushed', { id });
  };
  const board = (id: string, lx: number, ly: number) => {
    const [x, y] = offDeck(k.vehiclePose(boat)!, lx, ly);
    put(id, x, y);
  };
  put('carla', x0 + 6.5, y0 - 2);
  run(server, all, 12);
  for (const t of all) {
    const f = t.k.ecs.get(boatIn(t), 'form');
    await t.k.forms.wait(f.model, f.seed, f.tint);
  }
  run(server, all, 2);
  board('anna', 0, -0.9);
  board('bruno', 0.35, -0.3);
  run(server, all, 12);
  /** Where a wanderer stands on the deck, on the server. */
  const deckOf = (id: string) => k.carriedOn(k.wandererAt(id)!.entity);
  /** Where a client's own wanderer stands on its mirror's deck. */
  const mine = (t: ThinClient) => {
    const at = t.k.wandererCarpet();
    return onDeck(t.k.vehiclePose(boatIn(t))!, at.x, at.y);
  };
  return { k, server, anna, bruno, carla, all, boat, x0, y0, put, board, deckOf, mine };
}
