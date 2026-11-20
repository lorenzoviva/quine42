// V-045 (T439, ADR-0227): the vehicle for Lua. Lua reads a vehicle (`world.vehicle`), asks it for power, course, anchor and helm within
// the kernel's limits (`world.vehicle_set`), never moves it: its place and its state are read as copies, the component is not written,
// what Lua spawns is not a vehicle, a value that is not one is ignored, the helm goes only to a wanderer on its deck.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { memoryStore } from '../../src/kernel/repo';
import type { FileMap } from '../../src/kernel/types';

const BOAT = { id: 'veicolo.sonda', name: 'Barca', kind: 'entity', description: 'Una barca.', appearance: { glyph: 'B', color: '#8a5a2b' }, physics: { solid: false, radius: 0.4 }, vehicle: { medium: 'water', speed: 3 } };

/** A system that tries, at every tick, what Lua should not be able to do to the first vehicle, and writes what it saw on the wanderer. */
const PROBE = `local M = {}
function M.update(dt)
  local id = ecs.first("vehicle")
  if not id then return end
  local before = world.vehicle(id)
  local p = ecs.get(id, "pos")
  p.x = p.x + 50
  local st = ecs.get(id, "vehicle")
  st.speed = 99
  st.anchored = false
  local wrote = ecs.set(id, "vehicle", { speed = 99, anchored = false })
  local moved = ecs.set(id, "pos", { x = 1000, y = 1000 })
  local spawned = ecs.spawn({ pos = { x = 0, y = 0 }, vehicle = { speed = 5, helm = "me" } })
  local asked = world.vehicle_set(id, { power = 7, thrust = 0/0, steer = "a", anchored = "yes" })
  local notone = world.vehicle_set(world.player(), { power = 1 })
  local helm = world.vehicle_set(id, { helm = world.player() })
  local after = world.vehicle(id)
  ecs.set(world.player(), "probe", {
    medium = before and before.medium or "", wrote = wrote, moved = moved, asked = asked, notone = notone, helm = helm,
    spawnedIsVehicle = spawned ~= nil and world.vehicle(spawned) ~= nil, power = after and after.power or -1, thrust = after and after.thrust or -1,
    anchored = after and after.anchored, speed = after and after.speed or -1, under = world.vehicle_of(world.player()) or -1,
  })
end
return M
`;

function files(): FileMap {
  return {
    ...bundledFiles,
    'modules/veicolo.sonda/manifest.json': JSON.stringify(BOAT),
    'modules/sys.sonda/manifest.json': JSON.stringify({ id: 'sys.sonda', name: 'Sonda', kind: 'system', logic: 'logic.lua', order: 90 }),
    'modules/sys.sonda/logic.lua': PROBE,
  };
}

async function boot() {
  const k = await Kernel.boot({ files: files(), store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(1 / 60);
  k.carpet()!.active = false;
  return k;
}

describe('il veicolo per Lua (T439)', () => {
  it('V-045 Lua legge un veicolo e non lo sposta: posizione e stato sono copie, il componente non si scrive', async () => {
    const k = await boot();
    const far = k.wandererCarpet();
    const boat = k.spawnModuleEntity(k.modules.get('veicolo.sonda')!, far.x + 6.5, far.y + 6.5);
    const at = { ...k.ecs.get(boat, 'pos') };
    for (let i = 0; i < 5; i++) k.tick(1 / 60);
    const probe = k.ecs.get(k.wandererEntity, 'probe');
    expect(probe.medium).toBe('water');
    expect(probe.wrote).toBe(false);
    expect(probe.moved).toBe(false);
    expect(k.ecs.get(boat, 'pos').x).toBe(at.x);
    expect(k.ecs.get(boat, 'pos').y).toBe(at.y);
    // Nobody aboard: at anchor, still, whatever Lua wrote on its copy.
    expect(k.ecs.get(boat, 'vehicle').anchored).toBe(true);
    expect(k.ecs.get(boat, 'vehicle').speed).toBe(0);
  }, 60_000);

  it('V-045 ciò che Lua fa nascere non è un veicolo, e chiedere a ciò che non lo è non fa niente', async () => {
    const k = await boot();
    const far = k.wandererCarpet();
    k.spawnModuleEntity(k.modules.get('veicolo.sonda')!, far.x + 6.5, far.y + 6.5);
    k.tick(1 / 60);
    const probe = k.ecs.get(k.wandererEntity, 'probe');
    expect(probe.spawnedIsVehicle).toBe(false);
    expect(probe.notone).toBe(false);
    expect(k.ecs.query('vehicle')).toHaveLength(1);
  }, 60_000);

  it('V-045 world.vehicle_set resta nei limiti, ignora ciò che non è un valore, dà il timone solo a chi è sul ponte', async () => {
    const k = await boot();
    const far = k.wandererCarpet();
    const boat = k.spawnModuleEntity(k.modules.get('veicolo.sonda')!, far.x + 6.5, far.y + 6.5);
    k.tick(1 / 60);
    let probe = k.ecs.get(k.wandererEntity, 'probe');
    expect(probe.asked).toBe(true);
    expect(probe.power).toBe(1);
    expect(probe.thrust).toBe(0);
    // Not on its deck: no helm, no vehicle under the feet.
    expect(probe.helm).toBe(false);
    expect(probe.under).toBe(-1);
    expect(k.ecs.get(boat, 'vehicle').helm).toBeUndefined();
    // On its deck (the disc of its body: it has no form): the helm is theirs.
    const b = k.ecs.get(boat, 'pos'), { ox, oy } = k.offset();
    Object.assign(k.wandererPos(), { x: b.x - ox, y: b.y - oy });
    k.tick(1 / 60);
    probe = k.ecs.get(k.wandererEntity, 'probe');
    expect(probe.helm).toBe(true);
    expect(probe.under).toBe(boat);
    expect(k.ecs.get(boat, 'vehicle').helm).toBe(k.wanderer().id);
  }, 60_000);
});
