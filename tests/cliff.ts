// The cliffs of the tests of the climb (T477): the plateau of the synthetic rise (`syntheticRise`, never saved), a clean edge of it, the
// wanderer put beside it, the rope of the seed held, a world of many with a thin client. No call to the models.

import { expect } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { LEVEL } from '../src/kernel/relief';
import { CLIMB_ACTION } from '../src/kernel/climb';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { developAll } from './espressivita/banco';

export const S = 18;
/** A plateau in the middle of every place: tiles 6-11 of its columns and rows, `h` levels up. */
export const plateau = (h: number) => (c: number, r: number) => {
  const a = ((c % S) + S) % S, b = ((r % S) + S) % S;
  return a >= 6 && a <= 11 && b >= 6 && b <= 11 ? h : 0;
};
export const level = (k: Kernel, c: number, r: number) => Math.round(k.groundAt(c + 0.5, r + 0.5) / LEVEL);
export const planned = (k: Kernel) => [...k.chunks.values()].filter((ch) => ch.stage === 'planned' && ch.plan);
export const walked = (k: Kernel, c: number, r: number) => k.palette[k.tileAt(c, r) ?? '']?.solid === false;

/** A clean west edge of the plateau `h` levels up: three walked tiles below it and three on it, each side at one level. */
export function edgeOf(k: Kernel, h: number, near?: (cx: number, cy: number) => boolean): { row: number; col: number } | undefined {
  for (const ch of planned(k)) {
    if (near && !near(ch.cx, ch.cy)) continue;
    const onRamp = new Set(Object.keys(ch.ramps ?? {}).map(Number));
    const inLot = (c: number, r: number) => ch.lots.some((b) => c >= b.x0 - 1 && c <= b.x1 + 1 && r >= b.y0 - 1 && r <= b.y1 + 1);
    for (let r = 7; r <= 10; r++) {
      const cols = [3, 4, 5, 6, 7, 8];
      const rows = [r - 1, r, r + 1];
      const ok = cols.every((c) => rows.every((rr) => walked(k, ch.cx * S + c, ch.cy * S + rr) && !onRamp.has(rr * S + c) && !inLot(c, rr)));
      const lv = cols.map((c) => level(k, ch.cx * S + c, ch.cy * S + r));
      if (ok && lv[0] === lv[1] && lv[1] === lv[2] && lv[3] === lv[4] && lv[4] === lv[5] && lv[3] - lv[2] === h) return { row: ch.cy * S + r, col: ch.cx * S + 6 };
    }
  }
  return undefined;
}

export async function boot(rise: (c: number, r: number) => number) {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
  k.syntheticRise(rise);
  await developAll(k);
  k.carpet()!.active = false;
  return k;
}

/** Puts the wanderer acting at a point of the carpet, on the ground there. */
export function standAt(k: Kernel, x: number, y: number) {
  const p = k.wandererPos();
  Object.assign(k.carpet()!, { ox: x - p.x, oy: y - p.y });
  delete p.z;
}

export const run = (k: Kernel, s: number) => {
  for (let i = 0; i < s * 60; i++) k.tick(1 / 60);
};

/** The climb of the menu of a tile, if it offers one. */
export const climbOption = (k: Kernel, col: number, row: number) => k.tileMenu(col, row).options.find((o) => o.id === `t:${CLIMB_ACTION}`);

/** The rope of the seed, held. */
export function holdRope(k: Kernel) {
  k.give('item.corda', 1);
  const i = k.inventory().slots.findIndex((s) => s?.item === 'item.corda');
  k.equipSlot(i);
  expect(k.inventory().equipped).toBe(i);
}

/** A world of many with Anna on a thin client, the same rise on the server and in the mirror. */
export async function many(rise: (c: number, r: number) => number) {
  const cfg = JSON.parse(bundledFiles['universe.json']!);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  k.syntheticRise(rise);
  const server = new SessionServer(k);
  const { server: s, client: c } = fakeLink();
  const sent: Array<{ t: string }> = [];
  const send = c.send.bind(c);
  c.send = (m) => {
    sent.push(m as { t: string });
    send(m);
  };
  server.connect(s);
  const session = new SessionClient(c, { id: 'anna', name: 'Anna' });
  await session.ready;
  const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
  mirror.syntheticRise(rise);
  const thin = new ThinClient(mirror, session);
  const frames = (n: number) => {
    for (let i = 0; i < n; i++) {
      mirror.tick(1 / 60);
      thin.frame(1 / 60);
      server.tick(1 / 60);
    }
  };
  // The places around the start planned on the server, and come into the mirror.
  for (let i = 0; i < 200 && planned(k).filter((ch) => Math.abs(ch.cx) <= 1 && Math.abs(ch.cy) <= 1).length < 9; i++) {
    frames(1);
    await new Promise((r) => setTimeout(r, 20));
  }
  frames(12);
  /** Anna at a point of the carpet, on the server and in the mirror. */
  const put = (x: number, y: number, facing = 'right') => {
    k.as('anna', () => {
      const p = k.wandererPos();
      Object.assign(k.carpet()!, { ox: x - p.x, oy: y - p.y });
      k.wandererComp().facing = facing;
    });
    standAt(mirror, x, y);
    mirror.wandererComp().facing = facing;
    frames(3);
  };
  const where = () => ({ server: k.wandererAt('anna')!, mirror: mirror.wandererCarpet() });
  return { k, server, mirror, thin, session, c, sent, frames, put, where };
}

export const near = (cx: number, cy: number) => Math.abs(cx) <= 1 && Math.abs(cy) <= 1;
