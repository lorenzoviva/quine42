// T288 (ADR-0167): what the wanderer wields is seen on its body. The hand comes from the arms of the rig, the grip from the thing's
// voxels, the mount from its place, the pose from all three: pure functions, tried on the seed's own figures and things and on things
// built by hand (a sword, an axe, a torch, a bow, a staff, a shield). Then the renderer in Node, with the meshes the worker makes:
// the mesh in hand is the one of the ground, shared, and nothing is made again when what is held changes, with many holders in the
// scene. Then what goes out to the other clients: the item they wield, and nothing else of what they carry.

import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Forms, InlineRunner, runForm, type Form, type FormRequest, type FormResult, type FormRunner } from '../src/kernel/forms';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import type { PaletteEntry, Vec3 } from '../src/mj/engine';
import { colorTable, type VoxelGrid } from '../src/mj/mesh';
import { hexColor } from '../src/mj/palette';
import {
  chooseHand,
  gripOf,
  handsOf,
  aimOf,
  heldPoint,
  HOLD_AIM,
  holdPose,
  MAX_SHARE,
  mountOf,
  MOUNTS,
  principalAxes,
  turn,
  turnBetween,
  woody,
  type Grip,
  type Hand,
} from '../src/mj/hold';
import { Entities, Wanderer } from '../src/render/entities';
import { formMeshes } from '../src/render/formmeshes';
import { gripFor, heldBy, hold } from '../src/render/held';
import { geoOf } from '../src/render/models';
import { MAT } from '../src/render/materials';
import { fakeLink, type ServerMsg } from '../src/session/protocol';
import { SessionClient } from '../src/session/client';
import { SessionServer } from '../src/session/server';
import { ThinClient } from '../src/session/thin';
import { DT, develop } from './world';

const forms = new Forms(new InlineRunner());
forms.load(bundledFiles);

async function formOf(model: string, seed = 1, tint?: string): Promise<Form> {
  const f = await forms.wait(model, seed, tint);
  expect(f?.status, model).toBe('ready');
  return f!;
}

const close = (a: Vec3, b: Vec3, eps = 1e-6) => a.every((v, i) => Math.abs(v - b[i]) <= eps);
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// --- Things built by hand: boxes of letters on a grid, as a program would leave them ------------------------------------------------

type Box = [x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, letter: string];

function thing(size: Vec3, boxes: Box[], palette: Record<string, PaletteEntry>): { grid: VoxelGrid; palette: Record<string, PaletteEntry> } {
  const [X, Y, Z] = size;
  const alphabet = ['.', ...Object.keys(palette)];
  const cells = new Uint8Array(X * Y * Z);
  for (const [x0, y0, z0, x1, y1, z1, l] of boxes)
    for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cells[x + y * X + z * X * Y] = alphabet.indexOf(l);
  return { grid: { X, Y, Z, cells, alphabet }, palette };
}

/** The same thing turned: its grid rewritten by a map of coordinates (a quarter turn, a flip, standing it up). */
function moved(t: ReturnType<typeof thing>, size: Vec3, at: (x: number, y: number, z: number) => Vec3): ReturnType<typeof thing> {
  const { X, Y, Z, cells, alphabet } = t.grid;
  const out = new Uint8Array(size[0] * size[1] * size[2]);
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const [a, b, c] = at(x, y, z);
        out[a + b * size[0] + c * size[0] * size[1]] = cells[x + y * X + z * X * Y];
      }
  return { grid: { X: size[0], Y: size[1], Z: size[2], cells: out, alphabet }, palette: t.palette };
}

const METAL = { S: { color: '#c8d0d8' }, s: { color: '#8a929c' }, G: { color: '#9aa2ac' } };
/** A sword lying along x, all of metal: pommel (x 0-1), grip (2-4), guard (5, wide in y), blade (6-14, three wide), tip (15). */
const sword = (grip = 'G') =>
  thing(
    [16, 7, 2],
    [
      [0, 2, 0, 1, 4, 0, 'G'],
      [2, 3, 0, 4, 3, 0, grip],
      [5, 0, 0, 5, 6, 0, 'G'],
      [6, 2, 0, 14, 4, 0, 'S'],
      [15, 3, 0, 15, 3, 0, 's'],
    ],
    { ...METAL, H: { color: '#6b4626' } },
  );
/** An axe lying along y: a wooden handle (y 0-13 at x 3), an iron head on one side at the far end. */
const axe = () =>
  thing(
    [7, 14, 2],
    [
      [3, 0, 0, 3, 13, 0, 'H'],
      [0, 10, 0, 2, 13, 1, 'I'],
    ],
    { H: { color: '#7a5532' }, I: { color: '#8a8e96' } },
  );
/** A torch standing up: a stick, a small flame on top (lighter than the stick's end: only its glow says it is the head). */
const torch = () =>
  thing(
    [5, 5, 14],
    [
      [1, 1, 0, 3, 3, 1, 'H'],
      [2, 2, 2, 2, 2, 11, 'H'],
      [2, 2, 12, 2, 2, 13, 'F'],
    ],
    { H: { color: '#9a9a9a' }, F: { color: '#ffb040', glow: true } },
  );
/** A bow lying along x: thin at both ends, thick in its middle, all of one wood. */
const bow = () =>
  thing(
    [15, 5, 2],
    [
      [0, 0, 0, 2, 0, 0, 'H'],
      [3, 1, 0, 5, 1, 0, 'H'],
      [6, 1, 0, 8, 3, 1, 'H'],
      [9, 1, 0, 11, 1, 0, 'H'],
      [12, 0, 0, 14, 0, 0, 'H'],
    ],
    { H: { color: '#9a6a3a' } },
  );
/** A staff: a rod and nothing else. */
const staff = () => thing([3, 3, 16], [[1, 1, 0, 1, 1, 15, 'H']], { H: { color: '#a07848' } });
/** A round shield lying flat. */
const shield = () =>
  thing(
    [10, 10, 2],
    [
      [1, 2, 0, 8, 7, 0, 'I'],
      [2, 1, 0, 7, 8, 0, 'I'],
      [4, 4, 1, 5, 5, 1, 'G'],
    ],
    { I: { color: '#5a7a9a' }, G: { color: '#d8b048' } },
  );

const gripOfThing = (t: ReturnType<typeof thing>, vpt = 20) => gripOf(t.grid, t.palette, vpt)!;
/** Which end of the grid the hand is at, along an axis of the mesh frame (-1 the low one, +1 the high one). */
const endOf = (g: Grip, axis: Vec3) => Math.sign(dot(g.at, axis) - dot(g.centre, axis));

describe('the hand, from the arms of the rig', () => {
  it('the wanderer holds with its free arm, its right: at the bottom of it along the side, at the top when it is raised', async () => {
    const seen = { along: 0, raised: 0 };
    for (let seed = 1; seed <= 8; seed++) {
      const f = await formOf('viandante', seed);
      const hands = handsOf(f.result!.grid, f.result!.palette, f.vpt);
      expect(hands, `seme ${seed}`).toHaveLength(1);
      const [h] = hands;
      expect(h.side).toBe('right');
      // Its right is small x: on the screen's left when it faces the camera.
      expect(h.joint[0]).toBeLessThan(0);
      const over = h.joint[1] + h.at[1];
      if (h.raised) {
        seen.raised++;
        expect(over, `seme ${seed}`).toBeGreaterThan(1);
      } else {
        seen.along++;
        expect(h.at[1]).toBeLessThan(-0.25);
        expect(over).toBeGreaterThan(0.3);
        expect(over).toBeLessThan(0.7);
      }
      expect(h.height).toBeGreaterThan(1.2);
    }
    // Both arms of the program are among the seeds.
    expect(seen.along).toBeGreaterThan(0);
    expect(seen.raised).toBeGreaterThan(0);
  });

  it('a person with two arms has a right hand and a left one; a body without arms has none', async () => {
    const p = await formOf('person');
    const hands = handsOf(p.result!.grid, p.result!.palette, p.vpt);
    expect(hands.map((h) => h.side).sort()).toEqual(['left', 'right']);
    for (const h of hands) expect(h.raised).toBe(false);
    for (const model of ['contadina', 'animal', 'beast', 'tree', 'object']) {
      const f = await formOf(model);
      expect(handsOf(f.result!.grid, f.result!.palette, f.vpt), model).toEqual([]);
    }
  });

  it('each hand is on the joint where the worker puts the arm', async () => {
    for (const [model, seed] of [['viandante', 1], ['viandante', 3], ['person', 1]] as const) {
      const f = await formOf(model, seed);
      const req = forms.request(model, seed)!;
      const meshes = formMeshes(runForm(req), req);
      const arms = meshes.limbs.filter((l) => l.part === 'arm');
      const hands = handsOf(f.result!.grid, f.result!.palette, f.vpt);
      expect(hands.map((h) => h.joint)).toEqual(arms.map((a) => a.joint));
    }
  });
});

describe('the grip, from the thing', () => {
  it('a sword is held by its hilt, however it lies or stands, and points toward its blade', () => {
    const lying = gripOfThing(sword());
    expect(lying.by).toBe('end');
    expect(Math.abs(lying.axis[0])).toBeGreaterThan(0.99);
    expect(endOf(lying, [1, 0, 0])).toBe(-1);
    expect(lying.axis[0]).toBeGreaterThan(0);
    // A leather grip says the same by its colour.
    expect(endOf(gripOfThing(sword('H')), [1, 0, 0])).toBe(-1);
    // Turned end for end, along y, standing on its tip, standing on its pommel.
    const flipped = gripOfThing(moved(sword(), [16, 7, 2], (x, y, z) => [15 - x, y, z]));
    expect(endOf(flipped, [1, 0, 0])).toBe(1);
    expect(flipped.axis[0]).toBeLessThan(0);
    const along = gripOfThing(moved(sword(), [7, 16, 2], (x, y, z) => [y, x, z]));
    expect(Math.abs(along.axis[2])).toBeGreaterThan(0.99);
    expect(endOf(along, [0, 0, 1])).toBe(-1);
    const onTip = gripOfThing(moved(sword(), [7, 2, 16], (x, y, z) => [y, z, 15 - x]));
    expect(onTip.axis[1]).toBeLessThan(-0.99);
    expect(endOf(onTip, [0, 1, 0])).toBe(1);
    const onPommel = gripOfThing(moved(sword(), [7, 2, 16], (x, y, z) => [y, z, x]));
    expect(onPommel.axis[1]).toBeGreaterThan(0.99);
    expect(endOf(onPommel, [0, 1, 0])).toBe(-1);
  });

  it('an axe is held by its handle, along the handle, its width toward its head', () => {
    const g = gripOfThing(axe());
    expect(g.by).toBe('end');
    expect(endOf(g, [0, 0, 1])).toBe(-1);
    // Exactly along the handle (x 3 of 7, three's x 0.025), not leaning toward the head as the whole does.
    expect(close(g.axis, [0, 0, 1], 1e-9)).toBe(true);
    expect(g.at[0]).toBeCloseTo((3 + 0.5 - 3.5) / 20, 9);
    // The head is at small x: that is the side the width looks to (a little down: the head is thicker than the handle).
    expect(g.width[0]).toBeLessThan(-0.95);
    expect(Math.abs(g.width[1])).toBeLessThan(0.3);
    expect(g.width[2]).toBeCloseTo(0, 9);
  });

  it('a torch is held by what does not glow, a bow in its middle, a staff from below, a sack from its top', async () => {
    const t = gripOfThing(torch());
    expect(t.by).toBe('end');
    expect(t.axis[1]).toBeGreaterThan(0.99);
    expect(t.at[1]).toBeLessThan(0.3);
    const b = gripOfThing(bow());
    expect(b.by).toBe('middle');
    expect(b.at[0]).toBeCloseTo(0, 6);
    const st = gripOfThing(staff());
    expect(st.by).toBe('end');
    expect(st.axis[1]).toBeGreaterThan(0.99);
    expect(st.at[1]).toBeLessThan(0.2);
    const sack = await formOf('object', 1, '#c0c8d0');
    const s = gripFor(sack)!;
    expect(s.by).toBe('top');
    expect(s.at[1]).toBeCloseTo(s.height, 6);
  });

  it('the seed\'s shears are held by their wooden handles, the blades forward; nothing visible holds nothing', async () => {
    const f = await formOf('forbici');
    const g = gripFor(f)!;
    expect(g.by).toBe('end');
    // The handles are at large y of the program: three's +z.
    expect(g.at[2]).toBeGreaterThan(0.15);
    expect(g.axis[2]).toBeLessThan(-0.99);
    const empty = thing([4, 4, 4], [], { H: { color: '#7a5532' } });
    expect(gripOf(empty.grid, empty.palette, 20)).toBeUndefined();
  });

  it('the same voxels give the same grip, and the colours of hands are wood, leather, cord', () => {
    expect(gripOfThing(axe())).toEqual(gripOfThing(axe()));
    for (const c of ['#7a5532', '#6b4626', '#8a5a30', '#4a3424', '#a07848']) expect(woody(c), c).toBe(true);
    for (const c of ['#c0c8d0', '#d8b048', '#e0b48c', '#d8a860', '#ffb040', '#3f6470', 'hsl(30 40% 30%)', undefined]) expect(woody(c), String(c)).toBe(false);
  });

  it('the principal axes are those of the voxels, the longest first, the same every time', () => {
    const { values, vectors } = principalAxes([
      [1, 0, 0],
      [0, 9, 0],
      [0, 0, 4],
    ]);
    expect(values).toEqual([9, 4, 1]);
    expect(vectors).toEqual([
      [0, 1, 0],
      [0, 0, 1],
      [1, 0, 0],
    ]);
    // A covariance turned by 30° about y: its first axis turned with it.
    const [c, s] = [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)];
    const r = [
      [c, 0, s],
      [0, 1, 0],
      [-s, 0, c],
    ];
    const d = [9, 1, 4];
    const m = [0, 1, 2].map((i) => [0, 1, 2].map((j) => r[i][0] * d[0] * r[j][0] + r[i][1] * d[1] * r[j][1] + r[i][2] * d[2] * r[j][2]));
    const turned = principalAxes(m);
    expect(turned.values[0]).toBeCloseTo(9, 9);
    expect(Math.abs(dot(turned.vectors[0], [c, 0, -s]))).toBeCloseTo(1, 9);
  });
});

describe('the mount, from the place', () => {
  it('a shield goes on the forearm, as the packs write it today and as they will; anything else in the hand', () => {
    expect(mountOf('scudo')).toBe('forearm');
    expect(mountOf('shield')).toBe('forearm');
    expect(mountOf(' Scudo ')).toBe('forearm');
    for (const slot of ['arma', 'mani', 'testa', 'anello', '', undefined, 42, '__proto__', 'constructor']) expect(mountOf(slot), String(slot)).toBe('hand');
    expect(MOUNTS.hand).toEqual({ side: 'right', pose: 'grip' });
    expect(MOUNTS.forearm).toEqual({ side: 'left', pose: 'strap' });
  });

  it('the arm of a mount: the one on its side, else the one there is, else none', () => {
    const hand = (side: 'right' | 'left'): Hand => ({ joint: [0, 0, 0], at: [0, -0.3, 0], side, raised: false, girth: 0.07, height: 1.5 });
    const two = [{ hand: hand('left') }, {}, { hand: hand('right') }];
    expect(chooseHand(two, 'right')).toBe(two[2]);
    expect(chooseHand(two, 'left')).toBe(two[0]);
    const one = [{}, { hand: hand('right') }];
    expect(chooseHand(one, 'left')).toBe(one[1]);
    expect(chooseHand([{}, {}], 'right')).toBeUndefined();
    expect(chooseHand([], 'right')).toBeUndefined();
  });
});

describe('the pose, in the frame of the arm', () => {
  let along: Hand;
  let raised: Hand;
  beforeAll(async () => {
    const one = await formOf('viandante', 1);
    along = handsOf(one.result!.grid, one.result!.palette, one.vpt)[0];
    const three = await formOf('viandante', 3);
    raised = handsOf(three.result!.grid, three.result!.palette, three.vpt)[0];
    expect(along.raised).toBe(false);
    expect(raised.raised).toBe(true);
  });

  /** The middles of a thing's voxels, in the frame of its mesh. */
  const corners = (t: ReturnType<typeof thing>, vpt = 20): Vec3[] => {
    const { X, Y, Z } = t.grid;
    const s = 1 / vpt;
    const out: Vec3[] = [];
    const colors = colorTable(t.grid.alphabet, t.palette);
    for (let i = 0; i < t.grid.cells.length; i++) {
      if (!colors[t.grid.cells[i]]) continue;
      const [x, y, z] = [i % X, Math.floor(i / X) % Y, Math.floor(i / (X * Y))];
      out.push([(x + 0.5 - X / 2) * s, (z + 0.5) * s, (y + 0.5 - Y / 2) * s]);
    }
    expect(Z).toBeGreaterThan(0);
    return out;
  };

  it('by one end: the grip in the hand, the far end forward and out of its side, down from a hand along it, up from a raised one; level, over the ground', () => {
    for (const hand of [along, raised]) {
      const aim = aimOf(hand);
      // Out of the side the arm is on (the right is -x), forward, and down or up as the arm hangs or is raised.
      expect(aim[0]).toBeLessThan(0);
      expect(aim[2]).toBeGreaterThan(0.7);
      expect(Math.sign(aim[1])).toBe(hand.raised ? 1 : -1);
      for (const t of [sword(), axe(), torch(), staff()]) {
        const g = gripOfThing(t);
        const pose = holdPose(g, MOUNTS.hand, hand);
        expect(close(heldPoint(pose, g.at), hand.at)).toBe(true);
        expect(close(turn(pose.quaternion, g.axis), aim, 1e-9)).toBe(true);
        const bulk = turn(pose.quaternion, g.width);
        expect(bulk[1]).toBeCloseTo(0, 9);
        expect(bulk[2]).toBeGreaterThan(0);
        for (const p of corners(t)) expect(hand.joint[1] + heldPoint(pose, p)[1]).toBeGreaterThan(0);
        expect(pose.scale).toBe(1);
      }
    }
    const left: Hand = { ...along, side: 'left' };
    expect(aimOf(left)[0]).toBeGreaterThan(0);
  });

  it('what is held by one end is long on the screen from every quarter of the camera, walking toward it too', () => {
    // The camera of the simulation looks down from its pitch (0.95 rad) from the south; the figure faces one of four ways.
    const pitch = 0.95;
    const view: Vec3 = [0, -Math.sin(pitch), -Math.cos(pitch)];
    for (const hand of [along, raised]) {
      const aim = aimOf(hand);
      for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        const [c, s] = [Math.cos(yaw), Math.sin(yaw)];
        const world: Vec3 = [aim[0] * c + aim[2] * s, aim[1], -aim[0] * s + aim[2] * c];
        expect(Math.sqrt(1 - dot(world, view) ** 2), `${hand.raised ? 'alzato' : 'lungo il fianco'}, ${yaw}`).toBeGreaterThan(0.69);
      }
    }
    expect(HOLD_AIM.forward).toBeGreaterThan(HOLD_AIM.outward);
  });

  it('by the middle it stands up; from its top it hangs, over the ground', async () => {
    const b = gripOfThing(bow());
    const up = holdPose(b, MOUNTS.hand, along);
    expect(close(turn(up.quaternion, b.axis), [0, 1, 0], 1e-9)).toBe(true);
    const sack = await formOf('object', 1, '#c0c8d0');
    const g = gripFor(sack)!;
    const pose = holdPose(g, MOUNTS.hand, along);
    expect(pose.quaternion).toEqual([0, 0, 0, 1]);
    expect(close(heldPoint(pose, g.at), along.at)).toBe(true);
    expect(pose.scale).toBeLessThanOrEqual(1);
    const bottom = along.joint[1] + heldPoint(pose, [g.at[0], 0, g.at[2]])[1];
    expect(bottom).toBeGreaterThan(0.03);
  });

  it('strapped, a shield looks outward on the forearm, outside the arm', () => {
    const g = gripOfThing(shield());
    const left: Hand = { ...along, joint: [-along.joint[0], along.joint[1], along.joint[2]], side: 'left' };
    for (const hand of [left, along]) {
      const pose = holdPose(g, MOUNTS.forearm, hand);
      const out = hand.side === 'right' ? -1 : 1;
      expect(turn(pose.quaternion, g.axes[2])[0] * out).toBeCloseTo(1, 9);
      const centre = heldPoint(pose, g.centre);
      expect(centre[0] * out).toBeGreaterThan(hand.girth);
      expect(centre[1]).toBeLessThan(0);
    }
  });

  it('a thing longer than the body is held smaller, and every turn is a turn', () => {
    const giant = thing([3, 3, 60], [[1, 1, 0, 1, 1, 59, 'H']], { H: { color: '#a07848' } });
    const pose = holdPose(gripOfThing(giant), MOUNTS.hand, along);
    expect(pose.scale * 3).toBeCloseTo(MAX_SHARE * along.height, 2);
    const q = turnBetween(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      [
        [0, 0, -1],
        [0, 1, 0],
        [1, 0, 0],
      ],
    );
    expect(Math.hypot(...q)).toBeCloseTo(1, 12);
    expect(close(turn(q, [1, 0, 0]), [0, 0, -1], 1e-12)).toBe(true);
    expect(close(turn(q, [0, 0, 1]), [1, 0, 0], 1e-12)).toBe(true);
  });
});

describe('the tint of a model', () => {
  it('the colours the packs write are read: a thing coloured hsl() keeps every voxel of its model', async () => {
    expect(hexColor('hsl(120 60% 66%)')).toBe('#74dc74');
    expect(hexColor('hsl(0, 100%, 50%)')).toBe('#ff0000');
    expect(hexColor('#ABC')).toBe('#aabbcc');
    expect(hexColor('c0c8d0')).toBe('#c0c8d0');
    for (const bad of ['', 'rosso', 'hsl(a b c)', undefined, 7]) expect(hexColor(bad)).toBeUndefined();
    const count = (f: Form) => {
      const t = colorTable(f.result!.grid.alphabet, f.result!.palette);
      return [...f.result!.grid.cells].filter((c) => t[c]).length;
    };
    const hex = await formOf('object', 1, '#74dc74');
    const hsl = await formOf('object', 1, 'hsl(120 60% 66%)');
    expect(count(hsl)).toBe(count(hex));
    expect(hsl.result!.palette.C.color).toBe('#74dc74');
  });
});

// --- The renderer, in Node: the meshes the worker makes, three.js objects without a screen -----------------------------------------

/** The worker's work in this thread, for what is drawn here: figures and things get their meshes, the rest only the grid. */
class Meshing implements FormRunner {
  runs = 0;
  private inline = new InlineRunner();
  constructor(private drawn: Set<string>) {}
  async run(q: FormRequest): Promise<FormResult> {
    if (!q.model || !this.drawn.has(q.model)) return this.inline.run(q);
    this.runs++;
    const r = runForm(q);
    const { model: _m, finished: _f, ...result } = r;
    return { ...result, meshes: formMeshes(r, q) };
  }
}

/** Every mesh hung under an object, with the arm it hangs on. */
function heldMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.parent?.parent?.userData.heldTest) out.push(o as THREE.Mesh);
  });
  return out;
}

const wield = (k: Kernel, item: string) => {
  const inv = k.inventory();
  let i = inv.slots.findIndex((s) => s?.item === item);
  if (i < 0) {
    i = inv.slots.findIndex((s) => !s);
    inv.slots[i] = { item, count: 1 };
  }
  inv.equipped = i;
};

describe('the renderer', () => {
  let k: Kernel;
  let runner: Meshing;
  const SWORD = 'shape-blade';
  beforeAll(async () => {
    runner = new Meshing(new Set(['viandante', 'person', 'contadina', 'forbici', 'object', SWORD]));
    const index = JSON.parse(bundledFiles['models/index.json']);
    const xml = `<sequence values="BSGH" size="16 7 2" name="Lama"><color symbol="S" value="c8d0d8"/><color symbol="G" value="9aa2ac"/><color symbol="H" value="6b4626"/>
      <box at="1 3 0" size="2 3 1" color="G"/><box at="3 3 0" size="3 1 1" color="H"/><box at="5 3 0" size="1 7 1" color="G"/><box at="10 3 0" size="9 3 1" color="S"/></sequence>`;
    const files = { ...bundledFiles, [`models/${SWORD}.xml`]: xml, 'models/index.json': JSON.stringify({ ...index, [SWORD]: { class: 'object', name: 'Lama' } }) };
    k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), forms: runner });
    await develop(k);
  }, 120_000);

  /** A sword of the world: an item with the common shape of blades, as the Narrator's packs give one. */
  const swordItem = () => {
    const def = { id: 'item.spada-prova', name: 'Spada', description: 'Una spada.', category: 'weapon' as const, weight: 2, stack: 1, tags: [], glyph: '†', color: 'hsl(210 20% 70%)', equippable: true, model: SWORD };
    k.content.items.set(def.id, def);
    return def.id;
  };

  async function ready(item: string): Promise<Form> {
    const look = k.itemLook(item);
    const f = await k.forms.wait(look.model, look.seed, look.tint);
    expect(f?.status).toBe('ready');
    expect(geoOf(f!)).toBeDefined();
    return f!;
  }

  it('the wanderer holds the shears with their mesh of the ground, on its arm; puts them away; holds them again with the same mesh', async () => {
    const scene = new THREE.Scene();
    const w = new Wanderer(scene);
    const fc = k.ecs.get(k.wandererEntity, 'form');
    await k.forms.wait(fc.model, fc.seed, fc.tint);
    const f = await ready('item.scissors');
    w.update(k, DT, 0);
    const arm = w.view.limbs.find((l) => l.hand)!;
    expect(arm).toBeDefined();
    arm.pivot.userData.heldTest = true;
    expect(heldMeshes(w.view.root)).toEqual([]);
    wield(k, 'item.scissors');
    w.update(k, DT, 0.1);
    const [mesh] = heldMeshes(w.view.root);
    expect(mesh).toBeDefined();
    // The same geometry as every instance of the shears: on the ground, on a shelf, in any hand.
    expect(mesh.geometry).toBe(geoOf(f)!.body);
    expect(mesh.material).toBe(MAT.corona);
    expect(mesh.userData.player).toBe(true);
    // It follows the arm: the arm swings, the shears with it.
    const before = mesh.getWorldPosition(new THREE.Vector3());
    arm.pivot.rotation.x = 0.4;
    scene.updateMatrixWorld(true);
    expect(mesh.getWorldPosition(new THREE.Vector3()).distanceTo(before)).toBeGreaterThan(0.01);
    arm.pivot.rotation.x = 0;
    const runs = runner.runs;
    k.inventory().equipped = null;
    w.update(k, DT, 0.2);
    expect(heldMeshes(w.view.root)).toEqual([]);
    wield(k, 'item.scissors');
    w.update(k, DT, 0.3);
    expect(heldMeshes(w.view.root)[0].geometry).toBe(mesh.geometry);
    expect(runner.runs).toBe(runs);
    k.inventory().equipped = null;
  });

  it('a sword made tomorrow, coloured as the packs colour things, is held by its hilt and keeps its blade', async () => {
    const item = swordItem();
    const f = await ready(item);
    const visible = (g: THREE.BufferGeometry) => g.getAttribute('position').count;
    // The blade is the tinted letter of nothing here: the whole model is drawn.
    expect(visible(geoOf(f)!.body)).toBeGreaterThan(100);
    const grip = gripFor(f)!;
    expect(grip.by).toBe('end');
    expect(grip.at[0]).toBeLessThan(0);
  });

  it('many holders in the scene share one mesh per thing, and changing what they hold makes nothing again', async () => {
    const world = new THREE.Group();
    const view = new Entities(k, world);
    const sword = swordItem();
    const things = ['item.scissors', sword, 'item.coltello'];
    for (const t of things) await ready(t);
    const at = k.wandererCarpet();
    const N = 60;
    const ids: number[] = [];
    for (let i = 0; i < N; i++) {
      const seed = 1 + (i % 8);
      ids.push(k.ecs.spawn({ pos: { x: at.x + (i % 10) * 0.8 - 4, y: at.y + Math.floor(i / 10) * 0.8 - 2 }, glyph: { ch: '@', color: '#fff' }, body: { r: 0.3, solid: false }, identity: { name: `v${i}` }, remote: { id: `v${i}`, name: `v${i}`, held: things[i % 3] }, form: { model: 'viandante', seed, yaw: 0 } }));
    }
    for (let seed = 1; seed <= 8; seed++) await k.forms.wait('viandante', seed);
    view.update(DT, 0);
    const meshesOf = () => {
      const out: THREE.Mesh[] = [];
      for (const id of ids) {
        const v = view.views.get(id)!;
        v.holding?.holder?.traverse((o) => (o as THREE.Mesh).isMesh && out.push(o as THREE.Mesh));
      }
      return out;
    };
    const first = meshesOf();
    expect(first).toHaveLength(N);
    expect(new Set(first.map((m) => m.geometry)).size).toBe(things.length);
    for (const m of first) expect(m.material).toBe(MAT.world);
    // Everyone takes another thing, then nothing, then the first again: no program runs, no geometry is made.
    const runs = runner.runs;
    const geometries = new Set(first.map((m) => m.geometry));
    let clock = 0.1;
    /** The mean time of a frame of the renderer's (every view of the world, the 60 too), in ms. */
    const frame = (n = 30) => {
      const t0 = performance.now();
      for (let i = 0; i < n; i++) view.update(DT, (clock += DT));
      return (performance.now() - t0) / n;
    };
    const swaps: number[] = [];
    for (let round = 1; round <= 6; round++) {
      ids.forEach((id, i) => (k.ecs.get(id, 'remote').held = things[(i + round) % 3]));
      const t0 = performance.now();
      view.update(DT, (clock += DT));
      swaps.push(performance.now() - t0);
      const now = meshesOf();
      expect(now).toHaveLength(N);
      for (const m of now) expect(geometries.has(m.geometry)).toBe(true);
    }
    // Full hands and empty ones in turn, the best of each: what is left between them is what holding costs.
    const full = () => ids.forEach((id, i) => (k.ecs.get(id, 'remote').held = things[i % 3]));
    const none = () => ids.forEach((id) => delete k.ecs.get(id, 'remote').held);
    let holding = Infinity;
    let empty = Infinity;
    for (let round = 0; round < 4; round++) {
      full();
      view.update(DT, (clock += DT));
      holding = Math.min(holding, frame(100));
      none();
      view.update(DT, (clock += DT));
      expect(meshesOf()).toEqual([]);
      empty = Math.min(empty, frame(100));
    }
    expect(runner.runs).toBe(runs);
    // What it costs, said (ADR-0167): a frame with 60 holders against the same frame with empty hands, and all 60 changing at once.
    const warm = swaps.slice(1);
    const mean = warm.reduce((x, y) => x + y, 0) / warm.length;
    console.log(`[T288] 60 viandanti: un fotogramma ${holding.toFixed(3)} ms con le mani piene, ${empty.toFixed(3)} ms vuote; cambiano tutti insieme in ${mean.toFixed(2)} ms (il primo ${swaps[0].toFixed(2)} ms)`);
    for (const id of ids) k.ecs.destroy(id);
    view.update(DT, 0.4);
  });

  it('a body without arms, a thing without a model, an inventory written by Lua: nothing shows, nothing breaks', async () => {
    const world = new THREE.Group();
    const view = new Entities(k, world);
    const at = k.wandererCarpet();
    const farmer = k.ecs.spawn({ pos: { x: at.x + 2, y: at.y }, glyph: { ch: 'c', color: '#fff' }, body: { r: 0.3, solid: false }, identity: { name: 'Contadina' }, form: { model: 'contadina', seed: 1, yaw: 0 }, inventory: { slots: [{ item: 'item.scissors', count: 1 }], equipped: 0 } });
    const odd = k.ecs.spawn({ pos: { x: at.x + 3, y: at.y }, glyph: { ch: 'c', color: '#fff' }, body: { r: 0.3, solid: false }, identity: { name: 'Strano' }, form: { model: 'person', seed: 1, yaw: 0 }, inventory: { slots: 'niente', equipped: '0' } });
    await k.forms.wait('contadina', 1);
    await k.forms.wait('person', 1);
    expect(heldBy(k, farmer)).toBe('item.scissors');
    expect(heldBy(k, odd)).toBeUndefined();
    expect(() => view.update(DT, 0)).not.toThrow();
    expect(view.views.get(farmer)!.holding?.holder).toBeUndefined();
    expect(view.views.get(odd)!.holding?.holder).toBeUndefined();
    // A thing whose program is not in the library at all: the kernel gives nothing ready, the hand stays empty.
    const nobody = { itemLook: () => ({ model: 'nessuno', seed: 1, yaw: 0 }), forms: { ready: () => undefined }, content: { get: () => undefined } } as unknown as Kernel;
    const v = { limbs: view.views.get(odd)!.limbs };
    expect(() => hold(nobody, v, 'item.inesistente', MAT.world, 0)).not.toThrow();
    expect(v).not.toHaveProperty('holding.holder');
    k.ecs.destroy(farmer);
    k.ecs.destroy(odd);
  });
});

// --- Two wanderers: what goes out ----------------------------------------------------------------------------------------------------

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}

async function thin(server: SessionServer, id: string, heard: ServerMsg[] = []): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  c.onMessage((m) => heard.push(m));
  server.connect(s);
  const session = new SessionClient(c, { id });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
  return new ThinClient(k, session);
}

function frames(server: SessionServer, clients: ThinClient[], n: number) {
  for (let i = 0; i < n; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

describe('two wanderers', () => {
  it('what one wields the other sees in their hand, at once, and nothing else of what they carry', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna');
    const heard: ServerMsg[] = [];
    const bruno = await thin(server, 'bruno', heard);
    for (let i = 0; i < 60; i++) {
      frames(server, [anna, bruno], 1);
      await new Promise((r) => setTimeout(r, 10));
    }
    // Anna has the knife and the shears; she wields the shears from her own client.
    k.as('anna', () => {
      k.give('item.coltello', 1);
      k.give('item.scissors', 1);
    });
    frames(server, [anna, bruno], 6);
    const slot = anna.k.inventory().slots.findIndex((s) => s?.item === 'item.scissors');
    expect(slot).toBeGreaterThanOrEqual(0);
    anna.k.equipSlot(slot);
    // Her own client shows it at once.
    expect(heldBy(anna.k, anna.k.wandererEntity)).toBe('item.scissors');
    for (let i = 0; i < 6; i++) {
      frames(server, [anna, bruno], 3);
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(k.as('anna', () => k.inventory().equipped)).toBe(slot);
    const herOnBruno = () => bruno.k.ecs.query('remote').find((e) => bruno.k.ecs.get(e, 'remote').id === 'anna');
    const her = herOnBruno()!;
    expect(her).toBeDefined();
    expect(heldBy(bruno.k, her)).toBe('item.scissors');
    // On the wire: the item, and of what she carries nothing else.
    const views = heard.flatMap((m) => (m.t === 'update' || m.t === 'welcome' ? (m.wanderers ?? []) : [])).filter((w) => w.id === 'anna');
    const last = views[views.length - 1];
    expect(last.held).toBe('item.scissors');
    for (const v of views) expect(Object.keys(v).every((key) => ['id', 'name', 'x', 'y', 'facing', 'form', 'text', 'introduction', 'held'].includes(key)), JSON.stringify(v)).toBe(true);
    expect(JSON.stringify(views)).not.toContain('item.coltello');
    // She puts it away: it leaves her hand for Bruno too.
    anna.k.equipSlot(slot);
    for (let i = 0; i < 6; i++) {
      frames(server, [anna, bruno], 3);
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(heldBy(bruno.k, herOnBruno()!)).toBeUndefined();
    // What the individuals of the world are, on the wire, has no hand: nothing gives them one yet.
    const entities = heard.flatMap((m) => (m.t === 'update' || m.t === 'welcome' ? (m.entities ?? []) : []));
    expect(entities.length).toBeGreaterThan(0);
    for (const e of entities) expect(e.c?.inventory, String(e.m)).toBeUndefined();
  }, 120_000);
});
