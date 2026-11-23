// The cut towards the camera (T476, ADR-0257, row 3 of T459, `docs/design/terreno-3d.md` § 3.2): where the ground in front hides the
// wanderer from the 3/4 camera (`hiddenFromCamera`, with the true relief of ADR-0256), the disc of T416 at the height of the head, only on
// the camera's side (`Cut.around` false, `inCutDisc`); once its columns are lowered to the cut the line from the wanderer's middle to the
// camera passes; with the relief of today nothing ever hides; the caps of the cut (`buildCut`) only over the disc's tiles on that side.

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { DEFAULT_NATURE } from '../src/kernel/nature';
import { Rng } from '../src/kernel/rng';
import {
  CAMERA_AIM,
  cameraCutAt,
  CUT_ABOVE,
  CUT_REACH,
  cutDisc,
  hiddenFromCamera,
  inCutDisc,
  undergroundAt,
  type CameraLine,
  type Cut,
  type Towards,
} from '../src/kernel/underground';
import { buildCut, cutSig } from '../src/render/terrain';
import { cutBackOf } from '../src/render/materials';

const PITCH = 0.95;
const QUARTERS: Towards[] = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }];
/** The camera of the simulation (renderer.ts: the pitch of the 3/4, the distance of `ZOOM.max`). */
const view = (towards: Towards, distance = 15): CameraLine => ({ towards, rise: Math.tan(PITCH), reach: Math.cos(PITCH) * distance });

function trueReliefFiles() {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const terrain = JSON.parse(bundledFiles['modules/world.terrain/manifest.json']);
  // `k` walkable bare rock, as Genesis writes it for a world with the true relief (T475).
  terrain.tiles.k = { id: 'mountain', name: 'monte', description: 'roccia nuda di montagna', color: '#6e6a66', solid: false, cross: 'walk', layer: 'ground', speed: 0.9 };
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, nature: { ...DEFAULT_NATURE, relief: 'true' } }, null, 2) + '\n',
    'modules/world.terrain/manifest.json': JSON.stringify(terrain, null, 2) + '\n',
  };
}

/** The columns once the cut has lowered those of its disc to the head (what the shaders and the caps do). */
const lowered = (top: (x: number, y: number) => number, cut: Cut, towards: Towards) => (x: number, y: number) =>
  inCutDisc(x - cut.tile.x, y - cut.tile.y, towards, cut.around) ? Math.min(top(x, y), cut.cut) : top(x, y);

describe('the disc on the camera\'s side (T476)', () => {
  it('is the disc of T416 without the rows behind the one standing on', () => {
    for (const t of QUARTERS) {
      const all = cutDisc({ x: 7, y: -3 }, t);
      const front = cutDisc({ x: 7, y: -3 }, t, false);
      const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;
      const inFront = new Set(front.map(key));
      for (const p of all) {
        const along = (p.x - 7) * t.x + (p.y + 3) * t.y;
        expect(inFront.has(key(p)), key(p)).toBe(along >= 0);
      }
      expect(front.every((p) => all.some((q) => key(q) === key(p)))).toBe(true);
      // The tile one stands on and its row are in it; the tile behind is not; the far end towards the camera is.
      expect(inCutDisc(0, 0, t, false)).toBe(true);
      expect(inCutDisc(-t.x, -t.y, t, false)).toBe(false);
      expect(inCutDisc(t.y * 6, t.x * 6, t, false)).toBe(true);
      expect(inCutDisc(t.x * CUT_REACH, t.y * CUT_REACH, t, false)).toBe(true);
      // Under the ground the disc goes all around, as before.
      expect(inCutDisc(-t.x, -t.y, t)).toBe(true);
    }
    // Under the ground the whole disc, towards the camera only its side: what the shaders read (`uCutBack`).
    expect(undergroundAt(0.5, 0.5, -2, 0)!.around).toBe(true);
    expect(cutBackOf(true)).toBeLessThan(-CUT_REACH);
    expect(cutBackOf(false)).toBe(0);
  });

  it('is asked when a column hides the middle at its near edge, as far as the camera and the disc go', () => {
    const rise = Math.tan(PITCH);
    const tile = { x: 0, y: 0 };
    const mid = CAMERA_AIM;
    const wall = (at: { x: number; y: number }, h: number) => (x: number, y: number) => (x === at.x && y === at.y ? h : 0);
    for (const t of QUARTERS) {
      const one = { x: t.x, y: t.y };
      // The next tile towards the camera: its near edge half a tile from the middle of the tile one stands on.
      expect(hiddenFromCamera(wall(one, mid + rise * 0.5 + 0.01), tile, mid, view(t))).toBe(true);
      expect(hiddenFromCamera(wall(one, mid + rise * 0.5 - 0.01), tile, mid, view(t))).toBe(false);
      // Behind, or on the side, nothing hides.
      expect(hiddenFromCamera(wall({ x: -t.x, y: -t.y }, 50), tile, mid, view(t))).toBe(false);
      expect(hiddenFromCamera(wall({ x: t.y, y: t.x }, 50), tile, mid, view(t))).toBe(false);
      // As far as the camera stands (8.7 tiles at the simulation's view: the ninth column's near edge is nearer), never past the disc.
      const nine = { x: t.x * 9, y: t.y * 9 }, ten = { x: t.x * 10, y: t.y * 10 };
      expect(hiddenFromCamera(wall(nine, 50), tile, mid, view(t))).toBe(true);
      expect(hiddenFromCamera(wall(nine, 50), tile, mid, view(t, 14))).toBe(false);
      expect(hiddenFromCamera(wall(ten, 50), tile, mid, view(t, 45))).toBe(false);
    }
    // What is not a number hides nothing.
    expect(hiddenFromCamera(() => NaN, tile, mid, view(QUARTERS[0]!))).toBe(false);
    expect(hiddenFromCamera(() => 50, tile, NaN, view(QUARTERS[0]!))).toBe(false);
    expect(hiddenFromCamera(() => 50, tile, mid, { ...view(QUARTERS[0]!), reach: NaN })).toBe(false);
  });

  it('cuts at the head, only in front, and once cut the camera sees the middle', () => {
    const rng = new Rng(476);
    let cuts = 0;
    for (let n = 0; n < 400; n++) {
      // Rough columns: terraces and cliffs of up to fifteen tiles, as the true relief has them.
      const heights = new Map<string, number>();
      const top = (x: number, y: number) => {
        const key = `${x},${y}`;
        if (!heights.has(key)) heights.set(key, Math.floor(rng.next() * 60) * 0.25);
        return heights.get(key)!;
      };
      const x = rng.next() * 4 - 2, y = rng.next() * 4 - 2;
      const floor = top(Math.floor(x), Math.floor(y));
      const t = QUARTERS[n % 4]!;
      const cut = cameraCutAt(x, y, floor, top, view(t));
      const tile = { x: Math.floor(x), y: Math.floor(y) };
      expect(!!cut).toBe(hiddenFromCamera(top, tile, floor + CAMERA_AIM, view(t)));
      if (!cut) continue;
      cuts++;
      expect(cut).toEqual({ cut: floor + CUT_ABOVE, tile, around: false });
      expect(hiddenFromCamera(lowered(top, cut, t), tile, floor + CAMERA_AIM, view(t))).toBe(false);
    }
    expect(cuts).toBeGreaterThan(50);
    expect(cameraCutAt(NaN, 0, 0, () => 50, view(QUARTERS[0]!))).toBeUndefined();
    expect(cameraCutAt(0, 0, Infinity, () => 50, view(QUARTERS[0]!))).toBeUndefined();
  });
});

describe('the kernel and the cut towards the camera (T476)', () => {
  /** Of the tiles of a square around the origin, at the four quarters: how many the ground hides, and how many still once cut. */
  function survey(k: Kernel, from: number, to: number) {
    let views = 0, hidden = 0, after = 0;
    const top = (x: number, y: number) => k.groundAt(x + 0.5, y + 0.5);
    for (let y = from; y < to; y++)
      for (let x = from; x < to; x++) {
        const at = { x: x + 0.5, y: y + 0.5 };
        for (const t of QUARTERS) {
          views++;
          const cut = k.cameraCut(view(t), at);
          if (!cut) continue;
          hidden++;
          expect(cut.around).toBe(false);
          expect(cut.cut).toBeCloseTo(k.floorAt(at.x, at.y) + CUT_ABOVE, 9);
          if (hiddenFromCamera(lowered(top, cut, t), cut.tile, k.floorAt(at.x, at.y) + CAMERA_AIM, view(t))) after++;
        }
      }
    return { views, hidden, after };
  }

  it('with the relief of today nothing ever hides; with the true relief some tiles, all seen once cut', async () => {
    const seed = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const today = survey(seed, -60, 60);
    expect(today.hidden).toBe(0);

    const k = await Kernel.boot({ files: trueReliefFiles(), store: memoryStore(), ai: new MockAiModels() });
    const vero = survey(k, -60, 60);
    expect(vero.hidden).toBeGreaterThan(0);
    expect(vero.hidden / vero.views).toBeLessThan(0.15);
    expect(vero.after).toBe(0);

    // The wanderer's own, only in the simulation; the point asked as the master following a player does.
    k.carpet()!.active = false;
    const p = k.wandererCarpet();
    expect(k.cameraCut(view(QUARTERS[0]!))).toEqual(k.cameraCut(view(QUARTERS[0]!), { x: p.x, y: p.y, z: k.wandererPos().z }));
    k.zone = 'corona';
    expect(k.cameraCut(view(QUARTERS[0]!))).toBeUndefined();
    k.zone = 'sim';
  }, 90_000);

  it('caps the columns over the head only on the camera\'s side: the row behind keeps its own', async () => {
    const k = await Kernel.boot({ files: trueReliefFiles(), store: memoryStore(), ai: new MockAiModels() });
    k.carpet()!.active = false;
    const S = k.config.chunkSize;
    // Over the massifs: the wanderer taken where the ground hides, the places around loaded.
    let found: { cut: Cut; t: Towards } | undefined;
    for (let j = -3; j <= 3 && !found; j++)
      for (let i = -3; i <= 3 && !found; i++) {
        const X = i * 3 * S + S / 2, Y = j * 3 * S + S / 2;
        const p = k.wandererPos();
        Object.assign(k.carpet()!, { ox: X - p.x, oy: Y - p.y });
        k.tick(1 / 60);
        for (let dy = -6; dy <= 6 && !found; dy++)
          for (let dx = -6; dx <= 6 && !found; dx++) {
            const at = { x: X + dx + 0.5, y: Y + dy + 0.5 };
            if (k.tileAt(Math.floor(at.x), Math.floor(at.y)) === undefined) continue;
            for (const t of QUARTERS) {
              const cut = k.cameraCut(view(t), at);
              // Wanted: a column over the head behind too (a gorge, a pit), which the cut leaves whole.
              const behind = k.groundAt(at.x - t.x, at.y - t.y);
              if (cut && behind > cut.cut + 0.5 && k.tileAt(Math.floor(at.x) + t.x * 9, Math.floor(at.y) + t.y * 9) !== undefined) {
                found = { cut, t };
                break;
              }
            }
          }
      }
    expect(found).toBeDefined();
    const { cut, t } = found!;
    const mesh = buildCut(k, cut, t)!;
    expect(mesh).toBeDefined();
    expect(cutSig(k, cut, t)).not.toBe(cutSig(k, { ...cut, around: true }, t));
    const pos = mesh.geometry.getAttribute('position'), nor = mesh.geometry.getAttribute('normal');
    let caps = 0, backWall = 0;
    for (let i = 0; i < pos.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(pos, i).add(mesh.position);
      const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1).add(mesh.position);
      const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2).add(mesh.position);
      const mid = a.clone().add(b).add(c).divideScalar(3);
      if (nor.getY(i) === 1) {
        // A cap: at the cut, over a tile of the disc on the camera's side.
        caps++;
        expect(mid.y).toBeCloseTo(cut.cut, 6);
        expect(inCutDisc(Math.floor(mid.x) - cut.tile.x, Math.floor(mid.z) - cut.tile.y, t, false)).toBe(true);
      } else if (nor.getX(i) === t.x && nor.getZ(i) === t.y) {
        // A side facing the camera on the row behind: the back wall of the cut, in the bands of the strata.
        const behind = (Math.floor(mid.x - t.x * 0.01) - cut.tile.x) * t.x + (Math.floor(mid.z - t.y * 0.01) - cut.tile.y) * t.y;
        if (behind === -1) backWall++;
      }
    }
    expect(caps).toBeGreaterThan(0);
    expect(backWall).toBeGreaterThan(0);
    // Under the ground the same place would cap the row behind too.
    const around = buildCut(k, { ...cut, around: true }, t)!;
    const upAround = around.geometry.getAttribute('normal');
    let capsAround = 0;
    for (let i = 0; i < upAround.count; i += 3) if (upAround.getY(i) === 1) capsAround++;
    expect(capsAround).toBeGreaterThan(caps);
  }, 90_000);
});
