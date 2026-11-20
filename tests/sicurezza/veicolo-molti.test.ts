// V-046 (T442, ADR-0232): the vehicle in a game of many. A client on a deck says its steps in the deck's frame (`step.on`): the point goes
// where the server has the vehicle, and is a step like any other (the pace, `FAR`, the collision), so that `on` carries nobody anywhere they
// could not walk to, and names no vehicle out of sight nor what is not one. The helm only to who is on the deck and at the helm, a held one
// only to the master (or anyone with `pvp`), never by Lua; over the side always, so that nobody is carried where they do not want to go. Of
// a vehicle a client gets the fields a list names (rule 8f).

import { describe, expect, it } from 'vitest';
import { playerFiles } from '../../src/session/files';
import { BOAT, DT, ask, boatIn, fleet, run } from '../fleet';

/** Where a wanderer is on the server, and how far from a point. */
const far = (k: Awaited<ReturnType<typeof fleet>>['k'], id: string, x: number, y: number) => {
  const at = k.wandererAt(id)!;
  return Math.hypot(at.x - x, at.y - y);
};

describe('V-046 · the vehicle in a game of many', () => {
  it('V-046 a step on a deck goes where the server has the vehicle, and only as far as a step goes: no teleport onto a deck', async () => {
    const { k, server, carla, boat, x0, y0, put } = await fleet();
    const pose = k.vehiclePose(boat)!;
    const d0 = far(k, 'carla', pose.x, pose.y);
    expect(d0).toBeGreaterThan(5);
    // Carla, on the shore, says she stands in the middle of the deck: she walks toward it as far as her credit goes, never onto it at once.
    const credit = k.paceOf('carla') * 0.5 + 0.25;
    const sent = carla.session.corrections;
    carla.session.move(pose.x, pose.y, { on: boat, lx: 0, ly: 0 });
    run(server, [], 1);
    expect(far(k, 'carla', pose.x, pose.y)).toBeGreaterThan(d0 - credit - 0.05);
    expect(k.carriedOn(k.wandererAt('carla')!.entity)).toBeUndefined();
    expect(carla.session.corrections).toBe(sent + 1);
    // Farther than a step may be (`FAR`): not walked at all.
    put('carla', x0 + 6.5, y0 - 5);
    run(server, [], 1);
    const at = { ...k.wandererAt('carla')! };
    expect(far(k, 'carla', pose.x, pose.y)).toBeGreaterThan(8);
    carla.session.move(pose.x, pose.y, { on: boat, lx: 0, ly: 0 });
    run(server, [], 1);
    expect(far(k, 'carla', at.x, at.y)).toBeLessThan(0.01);
  }, 90_000);

  it('V-046 `on` names a vehicle in sight: not an entity that is not one, nor a vehicle far away, nor a point that is not a number', async () => {
    const f = await fleet();
    const { k, server, bruno, x0, y0 } = f;
    // A second boat, far from everyone.
    const away = k.spawnModuleEntity(k.modules.get(BOAT)!, x0 + 6.5 + server.near + 30, y0 + 4.5);
    k.tick(DT);
    const carlaBody = k.wandererAt('carla')!.entity;
    const was = { ...k.wandererAt('bruno')! };
    const tries: Array<Record<string, unknown>> = [
      { on: carlaBody, x: 0, y: 0 },
      { on: away, x: 0, y: 0 },
      { on: 999_999, x: 0, y: 0 },
      { on: 'barca', x: 0, y: 0 },
      { on: 1.5, x: 0, y: 0 },
      { on: f.boat, x: Number.NaN, y: 0 },
      { on: f.boat, x: 'a', y: 0 },
      { on: f.boat, x: 1e9, y: 1e9 },
      { on: f.boat, x: null, y: null },
    ];
    let seq = 1000;
    for (const t of tries) {
      const corrections = bruno.session.corrections;
      (bruno.session as unknown as { link: { send: (m: unknown) => void } }).link.send({ t: 'step', seq: ++seq, ...t });
      run(server, [], 1);
      const now = k.wandererAt('bruno')!;
      expect(Math.hypot(now.x - was.x, now.y - was.y)).toBeLessThan(0.01);
      expect(bruno.session.corrections).toBe(corrections + 1);
    }
  }, 90_000);

  it('V-046 on a sailing deck the steps cost what they walk on it: a burst of them is cut to the credit, the voyage is free', async () => {
    const { k, server, anna, bruno, all, boat } = await fleet();
    await ask(server, all, anna.k.perform(boatIn(anna), 'helm') as Promise<void>);
    anna.k.input.setHeld('up', true);
    run(server, all, 60);
    // The deck carried Bruno well past what a second of walking gives credit for, and he said not a step: no correction.
    const deck0 = k.carriedOn(k.wandererAt('bruno')!.entity)!;
    expect(deck0.vehicle).toBe(boat);
    // Now his client claims, in one go, more than half a second of walking on the deck, there and back.
    const credit = k.paceOf('bruno') * 0.5 + 0.25;
    const send = (bruno.session as unknown as { link: { send: (m: unknown) => void } }).link.send.bind((bruno.session as unknown as { link: unknown }).link);
    let seq = 5000;
    let walked = 0;
    let last = deck0;
    for (const ly of [1.2, -1.2, 1.2, -1.2]) {
      send({ t: 'step', seq: ++seq, x: deck0.lx, y: ly, on: boat });
      run(server, [anna], 0);
      server.tick(0);
      const now = k.carriedOn(k.wandererAt('bruno')!.entity)!;
      walked += Math.hypot(now.lx - last.lx, now.ly - last.ly);
      last = now;
    }
    expect(walked).toBeLessThanOrEqual(credit + 0.05);
    anna.k.input.setHeld('up', false);
  }, 90_000);

  it('V-046 the helm: not from the shore, a held one not by a player nor by Lua; over the side always, whoever steers', async () => {
    const { k, server, anna, bruno, carla, all, boat } = await fleet();
    // From the shore, the boat is out of reach; and, were it not, nobody off its deck takes its helm.
    const shore = await ask(server, all, carla.session.act({ t: 'action', entity: boat, action: 'helm' }));
    expect(shore.ok).toBe(false);
    expect(k.ecs.get(boat, 'vehicle').helm).toBeUndefined();
    expect(k.as('carla', () => k.takeHelm(boat))).toBe(false);
    // Anna steers; Bruno, a player without pvp, does not take it, nor does Lua give it to him.
    await ask(server, all, anna.k.perform(boatIn(anna), 'helm') as Promise<void>);
    const no = await ask(server, all, bruno.session.act({ t: 'action', entity: boat, action: 'helm' }));
    expect(no.messages).toContain('Al timone c’è già qualcuno.');
    expect(k.takeHelm(boat, 'bruno', true)).toBe(false);
    expect(k.ecs.get(boat, 'vehicle').helm).toBe('anna');
    // Anna takes him away: he goes over the side when he wants, wherever she steers.
    anna.k.input.setHeld('up', true);
    run(server, all, 40);
    const over = await ask(server, all, bruno.session.act({ t: 'action', entity: boat, action: 'over' }));
    expect(over.ok).toBe(true);
    run(server, all, 2);
    expect(k.carriedOn(k.wandererAt('bruno')!.entity)).toBeUndefined();
    anna.k.input.setHeld('up', false);
    // Over the side of a vehicle one does not stand on: refused, nobody moves.
    const at = { ...k.wandererAt('carla')! };
    const no2 = await ask(server, all, carla.session.act({ t: 'action', entity: boat, action: 'over' }));
    expect(no2.ok).toBe(false);
    expect(far(k, 'carla', at.x, at.y)).toBeLessThan(0.01);
  }, 90_000);

  it('V-046 what leaves of a vehicle is a list: its way and its helm, the manifest of what it moves on; never what is asked of it', async () => {
    const { k, server, anna, bruno, all, boat } = await fleet();
    await ask(server, all, anna.k.perform(boatIn(anna), 'helm') as Promise<void>);
    anna.k.input.setHeld('up', true);
    run(server, all, 30);
    anna.k.input.setHeld('up', false);
    const v = k.ecs.get(boat, 'vehicle');
    expect(v.thrust).not.toBe(0);
    const seen = bruno.session.entities.get(boat)!;
    expect(Object.keys(seen.vehicle!).sort()).toEqual(['anchored', 'heading', 'helm', 'speed', 'turn']);
    expect(JSON.stringify(seen)).not.toMatch(/thrust|steer|power|bumped/);
    // Of another wanderer on a deck: where on it, nothing else new.
    const other = bruno.session.others.get('anna')!;
    expect(Object.keys(other).filter((key) => ['on', 'lx', 'ly'].includes(key)).sort()).toEqual(['lx', 'ly', 'on']);
    // The manifest a client reads says what the vehicle moves on and how fast, nothing else of it.
    const manifest = JSON.parse(playerFiles(k.files)[`modules/${BOAT}/manifest.json`]);
    expect(Object.keys(manifest.vehicle).sort()).toEqual(['accel', 'medium', 'speed', 'turn']);
  }, 90_000);
});
