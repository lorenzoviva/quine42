// The corona is drawn only out of the circle (T226, ADR-0124): one decision, for anybody, with any camera. The camera
// keeps its 3/4 view in the simulation, and turning it free says nothing about what is drawn.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { CORONA_READY_AT, coronaNearby, coronaShown, INTERIOR_X } from '../src/kernel/corona';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { ringMeshes } from '../src/render/coronaview';
import { Renderer } from '../src/render/renderer';

const R = 42;
const DT = 1 / 60;
const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
/** The renderer's camera choice, without a GPU. */
const cameraOf = (k: Kernel, godMode = false) => Object.assign(Object.create(Renderer.prototype), { kernel: k, godMode }) as Renderer;

describe('whether the corona is drawn', () => {
  it('asks only where the wanderer stands', () => {
    expect(coronaShown(0, 0, R), 'never left: at the centre').toBe(false);
    expect(coronaShown(R * 0.45, 0, R), 'at the old threshold').toBe(false);
    expect(coronaShown(R * 0.45 + 0.01, 0, R), 'just over the old threshold').toBe(false);
    expect(coronaShown(R - 0.01, 0, R), 'just inside the edge').toBe(false);
    expect(coronaShown(0, -(R - 0.01), R), 'just inside the edge, on another side').toBe(false);
    expect(coronaShown(R, 0, R), 'on the edge').toBe(true);
    expect(coronaShown(R + 0.01, 0, R), 'just outside the edge').toBe(true);
    expect(coronaShown(INTERIOR_X + 12, 8, R), 'in a room of the studio').toBe(true);
    expect(coronaShown(Number.NaN, 0, R), 'a position that means nothing').toBe(false);
  });

  it('readies the ring before the edge, not while the carpet holds', () => {
    expect(coronaNearby(0.9, 0, R), 'the carpet keeps its wanderer within a tile').toBe(false);
    expect(coronaNearby(R * CORONA_READY_AT - 0.01, 0, R)).toBe(false);
    expect(coronaNearby(R * CORONA_READY_AT, 0, R)).toBe(true);
    expect(coronaNearby(R - 0.01, 0, R)).toBe(true);
    expect(coronaNearby(R + 1, 0, R)).toBe(true);
    expect(coronaNearby(INTERIOR_X + 12, 8, R)).toBe(true);
    // Ready and shown are not the same thing: between the two nothing is drawn.
    expect(coronaShown(R * CORONA_READY_AT, 0, R)).toBe(false);
  });

  it('in the kernel: out and back in, the corona comes and goes, and the zone with it', async () => {
    const k = await boot();
    const R = k.config.circleRadius;
    const at = (x: number, y = 0) => {
      Object.assign(k.wandererPos(), { x, y });
      k.tick(DT);
    };
    expect(k.coronaRevealed()).toBe(false);
    expect(k.coronaNear()).toBe(false);
    k.carpet()!.active = false;
    at(R * 0.45 + 1);
    expect(k.coronaRevealed(), 'past the old threshold').toBe(false);
    expect(k.coronaNear(), 'but near enough to get it ready').toBe(true);
    expect(k.zone).toBe('sim');
    at(R - 0.1);
    expect(k.coronaRevealed(), 'just inside').toBe(false);
    at(R + 0.1);
    expect(k.coronaRevealed(), 'just outside').toBe(true);
    expect(k.zone).toBe('corona');
    at(R - 0.1);
    expect(k.coronaRevealed(), 'back in').toBe(false);
    expect(k.zone).toBe('sim');
    const b = k.corona.buildings[0];
    Object.assign(k.wandererPos(), k.corona.entrance(b));
    k.tick(DT);
    expect(k.zone).toBe('studio');
    expect(k.coronaRevealed(), 'in the studio').toBe(true);
  });

  it('inside the circle the campus is not hovered; out of it, it is', async () => {
    const k = await boot();
    const R = k.config.circleRadius;
    const b = k.corona.buildings[0];
    const door = { x: b.door.x + 0.5, y: b.door.y + 0.5 };
    k.carpet()!.active = false;
    Object.assign(k.wandererPos(), { x: R - 2, y: 0 });
    k.tick(DT);
    expect(k.hoverAt(door.x, door.y)?.kind).not.toBe('door');
    Object.assign(k.wandererPos(), { x: R + 1, y: 0 });
    k.tick(DT);
    expect(k.hoverAt(door.x, door.y)?.kind).toBe('door');
  });

  it('the world stays loaded just beyond the edge, for who walks back in, and is cut further out', async () => {
    const k = await boot();
    const R = k.config.circleRadius;
    k.carpet()!.active = false;
    k.view = { w: 120, h: 120 };
    const wantAt = (x: number) => {
      Object.assign(k.wandererPos(), { x, y: 0 });
      const want = new Set<string>();
      (k as any).wantChunks(want);
      return want;
    };
    const S = k.config.chunkSize;
    const beyond = (want: Set<string>) => want.has((k as any).chunkKey(Math.floor((R + 30) / S), 0));
    expect(beyond(wantAt(R - 1)), 'inside: the world fills the view').toBe(true);
    expect(beyond(wantAt(R + 1)), 'just out: as if still inside').toBe(true);
    expect(beyond(wantAt(R + 8)), 'further out: nothing beyond the circle is drawn').toBe(false);
  });
});

describe('the camera does not decide what is drawn', () => {
  it('free orbit does not light the corona', async () => {
    const k = await boot();
    const god = cameraOf(k, true);
    expect(god.canFreeOrbit()).toBe(true);
    expect(k.coronaRevealed(), 'god mode at the centre').toBe(false);
    k.carpet()!.active = false;
    Object.assign(k.wandererPos(), { x: k.config.circleRadius - 1, y: 0 });
    k.tick(DT);
    expect(god.canFreeOrbit()).toBe(true);
    expect(k.coronaRevealed(), 'god mode at the edge').toBe(false);
  });

  it('inside the circle the base is the 3/4 view, wherever the wanderer stands; out of it the orbit is free', async () => {
    const k = await boot();
    const R = k.config.circleRadius;
    const view = cameraOf(k);
    expect(view.canFreeOrbit()).toBe(false);
    k.carpet()!.active = false;
    for (const x of [R * 0.45, R * 0.45 + 1, R - 0.1]) {
      Object.assign(k.wandererPos(), { x, y: 0 });
      k.tick(DT);
      expect(view.canFreeOrbit(), `at ${x}`).toBe(false);
    }
    Object.assign(k.wandererPos(), { x: R + 0.1, y: 0 });
    k.tick(DT);
    expect(view.canFreeOrbit()).toBe(true);
    // Back in, the base view again.
    Object.assign(k.wandererPos(), { x: R - 0.1, y: 0 });
    k.tick(DT);
    expect(view.canFreeOrbit()).toBe(false);
  });

  it('walking into a structure the carpet still holds: 3/4 view, no corona', async () => {
    const k = await boot();
    for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
      k.tick(DT);
      await new Promise((r) => setTimeout(r, 25));
    }
    const pc = k.wandererCarpet();
    const id = k.spawnModuleEntity(k.modules.get('object.well')!, pc.x + 2, pc.y, undefined, 'test#struttura');
    Object.assign(k.ecs.get(id, 'form'), { model: 'structure', seed: 1, yaw: 0 });
    k.ecs.set(id, 'structure', {});
    await k.forms.wait('structure', 1);
    k.tick(DT);
    k.carpet()!.ox += 2; // the wanderer stands in the middle of it
    k.tick(DT);
    const view = cameraOf(k);
    let inside = false;
    k.input.setHeld('right', true);
    for (let i = 0; i < 300; i++) {
      k.tick(DT);
      const c = k.wandererCarpet();
      inside ||= k.structureAt(c.x, c.y) === id;
      expect(Math.hypot(k.wandererPos().x, k.wandererPos().y)).toBeLessThan(2);
      expect(k.coronaRevealed() || k.coronaNear() || view.canFreeOrbit()).toBe(false);
    }
    k.input.setHeld('right', false);
    expect(inside, 'the walk does go through the structure').toBe(true);
  });

  it('following a player the corona is hidden, wherever the master stands', async () => {
    const k = await boot();
    Object.defineProperty(k, 'watched', { value: () => ({ x: 3, y: 3 }) });
    k.carpet()!.active = false;
    Object.assign(k.wandererPos(), { x: k.config.circleRadius + 5, y: 0 });
    k.tick(DT);
    expect(k.coronaRevealed(), 'following a player the corona is hidden, wherever the master stands').toBe(false);
    expect(k.coronaNear()).toBe(false);
  });
});

describe('getting the ring ready', () => {
  it('loads each pair of geometry and material once, hidden ones too', () => {
    const shared = new THREE.BoxGeometry();
    const a = new THREE.MeshBasicMaterial();
    const b = new THREE.MeshBasicMaterial();
    const ring = new THREE.Group();
    const hidden = new THREE.Mesh(new THREE.BoxGeometry(), a);
    hidden.visible = false;
    const nested = new THREE.Group();
    nested.add(new THREE.Mesh(shared, a), new THREE.Mesh(shared, a));
    ring.add(new THREE.Mesh(shared, a), new THREE.Mesh(shared, b), hidden, nested, new THREE.Mesh(shared, [a, b]));
    expect(ringMeshes(ring)).toHaveLength(4);
  });
});
