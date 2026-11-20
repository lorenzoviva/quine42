// The vehicle in a game of many (T442, ADR-0232): the server moves it and carries who stands on its deck, the wanderers who play from a
// client of their own too; the clients get its way (`EntityView.vehicle`) and their mirror carries it on between two updates instead of
// chasing it; a client on the deck says its steps in the deck's frame (`step.on`), so that the deck carries it and the walk is only the walk;
// the others on the deck arrive where they stand on it (`OtherView.on`); the helm and the anchor are actions of the menu, the keys steer;
// over the side always; a hull pushes aside who swims where it comes; a helm held by another only the master takes, or anyone with `pvp`.

import { describe, expect, it } from 'vitest';
import { coast, onDeck, readVehicleView, turnBetween } from '../src/kernel/vehicle';
import { isMove } from '../src/session/protocol';
import { ask, avatarOf, boatIn, DT, fleet, run, thin } from './fleet';

describe('the vehicle on the wire (T442)', () => {
  it('reads a vehicle from the wire without trusting it, carries it on along the arc of its bow, tells a move from a look', () => {
    expect(readVehicleView({ heading: 1, speed: 99, turn: -9, anchored: 0, helm: 'anna', thrust: 1 })).toEqual({ heading: 1, speed: 8, turn: -2, anchored: true, helm: 'anna' });
    expect(readVehicleView({ heading: 'x' })).toBeUndefined();
    expect(readVehicleView({ heading: 0, helm: 'x'.repeat(200), anchored: false })).toEqual({ heading: 0, speed: 0, turn: 0, anchored: false });
    // Straight on, and on the arc: the end of the arc is where many small steps take it.
    expect(coast({ x: 1, y: 2, heading: Math.PI / 2 }, 2, 0, 0.5)).toEqual({ x: 2, y: expect.closeTo(2, 9), heading: Math.PI / 2 });
    let p = { x: 0, y: 0, heading: 0.3 };
    for (let i = 0; i < 1000; i++) p = coast(p, 3, 0.8, 0.001);
    const arc = coast({ x: 0, y: 0, heading: 0.3 }, 3, 0.8, 1);
    expect(arc.x).toBeCloseTo(p.x, 4);
    expect(arc.y).toBeCloseTo(p.y, 4);
    expect(turnBetween(6.2, 0.1)).toBeCloseTo(0.1 + 2 * Math.PI - 6.2);
    expect(turnBetween(0.1, 6.2)).toBeCloseTo(-(0.1 + 2 * Math.PI - 6.2));
    // A move says where something is, never what it is.
    expect(isMove({ id: 1, x: 0, y: 0, on: 3, lx: 0, ly: 1, vehicle: {} })).toBe(true);
    expect(isMove({ id: 1, x: 0, y: 0, form: {} })).toBe(false);
  });
});

describe('the vehicle in a game of many (T442)', () => {
  it('reaches every client with its way; who stands on its deck in a client stands on it there too, and has its menu', async () => {
    const { anna, bruno, boat, deckOf, mine } = await fleet();
    const seen = bruno.session.entities.get(boat)!;
    // What leaves of it: where, its form without the heading (that is the vehicle's), its way and its helm; nothing of what is asked of it.
    expect(Object.keys(seen.vehicle!).sort()).toEqual(['anchored', 'heading', 'speed', 'turn']);
    expect(seen.form?.yaw).toBeUndefined();
    expect(seen.vehicle!.heading).toBeCloseTo(Math.PI / 2, 4);
    // On the server both stand on its deck; each mirror has them there too, and the deck carries them (no swimming).
    expect(deckOf('anna')?.vehicle).toBe(boat);
    expect(deckOf('bruno')?.vehicle).toBe(boat);
    for (const t of [anna, bruno]) {
      expect(t.k.aboard()).toBe(boatIn(t));
      expect(t.k.swimming()).toBe(false);
    }
    expect(mine(bruno)[0]).toBeCloseTo(0.35, 2);
    expect(mine(bruno)[1]).toBeCloseTo(-0.3, 2);
    // The others on the deck arrive where they stand on it.
    expect(bruno.session.others.get('anna')).toMatchObject({ on: boat, lx: expect.closeTo(0, 2), ly: expect.closeTo(-0.9, 2) });
    // The menu of the vehicle, in a mirror: the helm, the anchor, over the side.
    expect(anna.k.actionsFor(boatIn(anna)).map((o) => o.id).slice(0, 3)).toEqual(['helm', 'weigh', 'over']);
  }, 90_000);

  it('steers from a client: the keys push it on the server, who is aboard is carried there and in every mirror, without trembling or corrections', async () => {
    const { k, server, anna, bruno, all, boat, deckOf, mine } = await fleet();
    const took = await ask(server, all, anna.k.perform(boatIn(anna), 'helm') as Promise<void>);
    expect(took).toBeUndefined();
    expect(k.ecs.get(boat, 'vehicle').helm).toBe('anna');
    run(server, all, 6);
    // Anna's mirror knows she steers (the camera, no walking); Bruno's that someone else does.
    expect(anna.k.atHelm()).toBe(boatIn(anna));
    expect(bruno.k.atHelm()).toBeUndefined();
    expect(bruno.k.actionsFor(boatIn(bruno)).find((o) => o.id === 'helm')).toMatchObject({ enabled: false, reason: 'Al timone c’è già qualcuno.' });
    const x0 = k.ecs.get(boat, 'pos').x;
    const brunoOn = deckOf('bruno')!;
    const corrections = bruno.session.corrections;
    const annaFrom = anna.k.wandererCarpet().x;
    anna.k.input.setHeld('up', true);
    // Bruno's place on his mirror's deck, and how far his mirror's boat goes at every frame.
    const drift: number[] = [];
    const strides: number[] = [];
    let last = bruno.k.vehiclePose(boatIn(bruno))!;
    run(server, all, 90, () => {
      const [lx, ly] = mine(bruno);
      drift.push(Math.hypot(lx - brunoOn.lx, ly - brunoOn.ly));
      const now = bruno.k.vehiclePose(boatIn(bruno))!;
      strides.push(Math.hypot(now.x - last.x, now.y - last.y));
      last = now;
    });
    anna.k.input.setHeld('up', false);
    // The server moved it, toward its bow; Bruno stayed at his point of the deck there.
    expect(k.ecs.get(boat, 'pos').x - x0).toBeGreaterThan(1);
    expect(deckOf('bruno')!.lx).toBeCloseTo(brunoOn.lx, 3);
    expect(deckOf('bruno')!.ly).toBeCloseTo(brunoOn.ly, 3);
    // In his mirror too, at every frame: carried, not walked, never thrown; no correction came.
    expect(Math.max(...drift)).toBeLessThan(0.02);
    expect(bruno.session.corrections).toBe(corrections);
    // The mirror's boat goes smoothly, never more than its top speed allows in a frame, and is where the server's is.
    expect(Math.max(...strides)).toBeLessThan(3 * DT * 1.5);
    const here = bruno.k.vehiclePose(boatIn(bruno))!, there = k.vehiclePose(boat)!;
    expect(Math.hypot(here.x - there.x, here.y - there.y)).toBeLessThan(0.35);
    // Anna, at the helm, did not walk: her keys steered, the deck carried her as far as it went.
    expect(anna.k.wandererCarpet().x - annaFrom).toBeCloseTo(k.ecs.get(boat, 'pos').x - x0, 0);
    expect(deckOf('anna')!.ly).toBeCloseTo(-0.9, 2);
    // Turning: the boat turns on the server and in the mirrors, Bruno with it.
    anna.k.input.setHeld('left', true);
    run(server, all, 60);
    anna.k.input.setHeld('left', false);
    run(server, all, 6);
    expect(turnBetween(Math.PI / 2, k.vehiclePose(boat)!.heading)).toBeGreaterThan(0.3);
    expect(Math.abs(turnBetween(bruno.k.vehiclePose(boatIn(bruno))!.heading, k.vehiclePose(boat)!.heading))).toBeLessThan(0.1);
    expect(mine(bruno)[0]).toBeCloseTo(brunoOn.lx, 1);
    expect(mine(bruno)[1]).toBeCloseTo(brunoOn.ly, 1);
    expect(bruno.session.corrections).toBe(corrections);
  }, 90_000);

  it('walks on a sailing deck with steps in its frame: the server walks the same, the voyage costs no credit; Anna sees him there', async () => {
    const { server, anna, bruno, all, deckOf, mine } = await fleet();
    await ask(server, all, anna.k.perform(boatIn(anna), 'helm') as Promise<void>);
    anna.k.input.setHeld('up', true);
    run(server, all, 40);
    const corrections = bruno.session.corrections;
    const from = mine(bruno);
    // Bruno walks toward the stern (west, the bow is east) while the boat goes east.
    bruno.k.input.setHeld('left', true);
    run(server, all, 8);
    bruno.k.input.setHeld('left', false);
    run(server, all, 14);
    const walked = mine(bruno);
    expect(walked[1]).toBeLessThan(from[1] - 0.2);
    // The server has him at the same point of its deck, without correcting him: the deck carried, he walked.
    expect(deckOf('bruno')!.lx).toBeCloseTo(walked[0], 1);
    expect(deckOf('bruno')!.ly).toBeCloseTo(walked[1], 1);
    expect(bruno.session.corrections).toBe(corrections);
    // Anna sees him at that point of the deck, in her mirror.
    const b = anna.k.ecs.get(avatarOf(anna, 'bruno'), 'pos');
    const seen = onDeck(anna.k.vehiclePose(boatIn(anna))!, b.x, b.y);
    expect(seen[0]).toBeCloseTo(walked[0], 1);
    expect(seen[1]).toBeCloseTo(walked[1], 1);
    anna.k.input.setHeld('up', false);
  }, 90_000);

  it('over the side always: in the water beside the hull, the client told at once, left behind; the helm let go if held', async () => {
    const { k, server, anna, bruno, all, boat, deckOf } = await fleet();
    await ask(server, all, anna.k.perform(boatIn(anna), 'helm') as Promise<void>);
    anna.k.input.setHeld('up', true);
    run(server, all, 30);
    await ask(server, all, bruno.k.perform(boatIn(bruno), 'over') as Promise<void>);
    run(server, all, 4);
    expect(deckOf('bruno')).toBeUndefined();
    expect(k.as('bruno', () => k.swimming())).toBe(true);
    expect(bruno.k.aboard()).toBeUndefined();
    const there = k.wandererAt('bruno')!;
    const mirror = bruno.k.wandererCarpet();
    expect(Math.hypot(mirror.x - there.x, mirror.y - there.y)).toBeLessThan(0.3);
    run(server, all, 40);
    const p = k.vehiclePose(boat)!;
    expect(Math.hypot(k.wandererAt('bruno')!.x - p.x, k.wandererAt('bruno')!.y - p.y)).toBeGreaterThan(1.8);
    // The helmsman goes over too: the helm is let go, and with nobody aboard the anchor comes down.
    anna.k.input.setHeld('up', false);
    await ask(server, all, anna.k.perform(boatIn(anna), 'over') as Promise<void>);
    run(server, all, 8);
    expect(k.ecs.get(boat, 'vehicle').helm).toBeUndefined();
    expect(k.ecs.get(boat, 'vehicle').anchored).toBe(true);
    expect(anna.k.atHelm()).toBeUndefined();
  }, 90_000);

  it('pushes aside who swims where the hull comes, never through them; the swimmer is told', async () => {
    const { k, server, anna, carla, all, boat, x0, y0, put } = await fleet();
    // Carla in the water before the bow.
    put('carla', x0 + 8.8, y0 + 4.5);
    run(server, all, 6);
    expect(k.as('carla', () => k.swimming())).toBe(true);
    await ask(server, all, anna.k.perform(boatIn(anna), 'helm') as Promise<void>);
    anna.k.input.setHeld('up', true);
    const free: boolean[] = [];
    run(server, all, 50, () =>
      free.push(
        k.as('carla', () => {
          const c = k.wandererCarpet();
          return k.bodyFree(c.x, c.y, 0.3, k.wandererPos().z);
        }),
      ),
    );
    anna.k.input.setHeld('up', false);
    // The boat went on, Carla before its bow (1.775 tiles from its middle), never under it.
    const bow = k.ecs.get(boat, 'pos').x + 1.775;
    expect(bow).toBeGreaterThan(x0 + 8.8);
    expect(k.wandererAt('carla')!.x - 0.3).toBeGreaterThanOrEqual(bow - 0.05);
    expect(free.every(Boolean)).toBe(true);
    expect(carla.session.notices.some((n) => n.type === 'world' && n.text === 'Lo scafo ti spinge da parte.')).toBe(true);
    const there = k.wandererAt('carla')!;
    const mirror = carla.k.wandererCarpet();
    expect(Math.hypot(mirror.x - there.x, mirror.y - there.y)).toBeLessThan(0.3);
  }, 90_000);

  it('a helm held by another: refused to a player, taken by the master (who is told), by anyone with pvp; the bump reaches the helmsman', async () => {
    const plain = await fleet();
    await ask(plain.server, plain.all, plain.anna.k.perform(boatIn(plain.anna), 'helm') as Promise<void>);
    const no = await ask(plain.server, plain.all, plain.bruno.session.act({ t: 'action', entity: plain.boat, action: 'helm' }));
    expect(no.messages).toContain('Al timone c’è già qualcuno.');
    expect(plain.k.ecs.get(plain.boat, 'vehicle').helm).toBe('anna');
    // Against the shore: the helmsman hears it, in their client.
    plain.anna.k.input.setHeld('up', true);
    run(plain.server, plain.all, 360);
    plain.anna.k.input.setHeld('up', false);
    expect(plain.anna.session.notices.filter((n) => n.type === 'world').map((n) => n.text)).toContain('Lo scafo urta e si ferma.');

    const master = await fleet({ master: 'bruno' });
    await ask(master.server, master.all, master.anna.k.perform(boatIn(master.anna), 'helm') as Promise<void>);
    run(master.server, master.all, 6);
    expect(master.bruno.k.actionsFor(boatIn(master.bruno)).find((o) => o.id === 'helm')?.enabled).toBe(true);
    await ask(master.server, master.all, master.bruno.k.perform(boatIn(master.bruno), 'helm') as Promise<void>);
    run(master.server, master.all, 6);
    expect(master.k.ecs.get(master.boat, 'vehicle').helm).toBe('bruno');
    expect(master.anna.session.notices.map((n) => n.text)).toContain('Qualcuno ti prende il timone.');
    expect(master.anna.k.atHelm()).toBeUndefined();
    expect(master.bruno.k.atHelm()).toBe(boatIn(master.bruno));

    const mutiny = await fleet({ pvp: true });
    await ask(mutiny.server, mutiny.all, mutiny.anna.k.perform(boatIn(mutiny.anna), 'helm') as Promise<void>);
    await ask(mutiny.server, mutiny.all, mutiny.bruno.k.perform(boatIn(mutiny.bruno), 'helm') as Promise<void>);
    expect(mutiny.k.ecs.get(mutiny.boat, 'vehicle').helm).toBe('bruno');
  }, 180_000);

  it('the helm of the master, whose id is the one every mirror gives its own wanderer (`me`), is another’s in the other mirrors', async () => {
    const { k, server, anna, bruno, all, boat, board, mine } = await fleet();
    const io = await thin(server, 'me', 'Io');
    const every = [...all, io];
    run(server, every, 12);
    const f = io.k.ecs.get(boatIn(io), 'form');
    await io.k.forms.wait(f.model, f.seed, f.tint);
    board('me', -0.3, 0.9);
    run(server, every, 12);
    await ask(server, every, io.k.perform(boatIn(io), 'helm') as Promise<void>);
    run(server, every, 8);
    expect(k.ecs.get(boat, 'vehicle').helm).toBe('me');
    expect(io.k.atHelm()).toBe(boatIn(io));
    for (const t of [anna, bruno]) {
      expect(t.k.atHelm()).toBeUndefined();
      expect(t.k.actionsFor(boatIn(t)).find((o) => o.id === 'helm')).toMatchObject({ enabled: false });
    }
    // Bruno is not at the helm in his mirror: he walks on the deck.
    const from = mine(bruno);
    bruno.k.input.setHeld('left', true);
    run(server, every, 6);
    bruno.k.input.setHeld('left', false);
    expect(mine(bruno)[1]).toBeLessThan(from[1] - 0.1);
  }, 90_000);
});
