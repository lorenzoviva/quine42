import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { countItem } from '../src/kernel/inventory';
import { carpetLine, COUNCIL_RUNE, extractLines } from '../src/kernel/runes';
import { repairPartita } from '../src/kernel/validator';

const DT = 1 / 60;

async function develop(k: Kernel) {
  for (let i = 0; i < 80; i++) {
    k.tick(DT);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(DT);
}

const run = (k: Kernel, seconds: number) => {
  for (let t = 0; t < seconds; t += DT) k.tick(DT);
};

const giveRunes = (k: Kernel, tokens: string[]) => tokens.forEach((t) => k.give(`rune:${t}`, 1));

/** Moves the acting wanderer next to a run of free cells, facing right (as in kernel.test.ts). */
function clearArea(k: Kernel, width = 24) {
  const { ox, oy } = k.offset();
  const free = (c: number, r: number) => (k as any).freeCell(c, r) && !k.runeCells.has(`${c},${r}`) && k.tileAt(c, r) !== undefined && !k.buildingAt(c + 0.5, r + 0.5);
  for (let d = 0; d < 30; d++)
    for (const row of [d, -d])
      for (let col = -30; col < 0; col++) {
        let ok = true;
        for (let i = 0; i <= width && ok; i++) ok = free(col + i, row);
        if (!ok) continue;
        const p = k.playerPos();
        p.x = col + 0.5 - ox;
        p.y = row + 0.5 - oy;
        k.playerComp().facing = 'right';
        return;
      }
  throw new Error('nessuno spazio libero trovato');
}

async function bootWith(partita: Record<string, unknown>) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita }, null, 2) };
  const k = await Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
  await develop(k);
  return k;
}

const many = () => bootWith({ modalita: 'multigiocatore', morte: 3 });

/** How far a wanderer is from the centre of their circle. */
const away = (k: Kernel, id: string) => k.as(id, () => Math.hypot(k.playerPos().x, k.playerPos().y));

/** A wanderer writes a phrase on the carpet in front of them. */
function write(k: Kernel, id: string, tokens: string[]) {
  k.as(id, () => {
    clearArea(k);
    giveRunes(k, tokens);
    expect(k.inscribe(tokens)).toBe(true);
  });
  // The kernel sees the new runes (and their cells) at the next tick.
  k.tick(DT);
}

describe('runes and bindings by role (T37)', () => {
  it('a line of the carpet touches the carpet, writes a binding or is the master’s rune', () => {
    for (const l of ['carpet . active = false', 'carpet.strength=0', 'x = 9999', 'speed = speed', 'x , y = 1 , 2', 'time = 0', COUNCIL_RUNE])
      expect(carpetLine(l), l).toBe(true);
    for (const l of ['x', 'speed * 2', 'x == 3', 'luce', 'p . x = 3', 'log ( time )']) expect(carpetLine(l), l).toBe(false);
  });

  it('the master is who created the game of many; alone, everyone is', async () => {
    expect(repairPartita({ modalita: 'multigiocatore' }).master).toBe('io');
    expect(repairPartita({ modalita: 'multigiocatore', master: 'Bea!' }).master).toBe('io');
    expect(repairPartita({ modalita: 'multigiocatore', master: 'bea' }).master).toBe('bea');
    expect(repairPartita({ master: 'bea' }).master).toBeUndefined();
    const k = await many();
    k.addWanderer('bea', 'Bea');
    expect(k.isMaster('io')).toBe(true);
    expect(k.isMaster('bea')).toBe(false);
    expect(k.as('bea', () => k.isMaster())).toBe(false);
  });

  it('in a game of many no place has runes of the carpet; alone the start still has speed = speed', async () => {
    const lines = (k: Kernel) => extractLines(k.ecs.query('rune').map((id) => ({ id, rune: k.ecs.get(id, 'rune') }))).map((l) => l.src);
    const solo = await bootWith({ modalita: 'singola' });
    const runes = (k: Kernel) => k.ecs.query('rune').map((id) => k.ecs.get(id, 'rune').token as string);
    expect(runes(solo)).toContain('speed');
    const k = await many();
    expect(runes(k)).not.toContain('speed');
    expect(runes(k)).not.toContain('carpet');
    expect(runes(k)).toContain('luce');
    for (const l of lines(k)) expect(carpetLine(l), l).toBe(false);
  });

  it('a player who writes x = 9999 on the carpet stays in the circle; the master leaves it', async () => {
    const k = await many();
    k.addWanderer('bea', 'Bea');
    const R = k.config.circleRadius;
    write(k, 'bea', ['x', '=', '9999']);
    run(k, 0.5);
    expect(away(k, 'bea')).toBeLessThan(R);
    write(k, 'bea', ['carpet', '.', 'active', '=', 'false']);
    write(k, 'bea', ['carpet', '=', 'nil']);
    run(k, 0.5);
    expect(away(k, 'bea')).toBeLessThan(R);
    expect(k.carpet()!.active).toBe(true);
    expect(k.faults.has('module:core.carpet:update')).toBe(false);
    expect(k.coronaRevealed()).toBe(false);
    // The same phrase written by the master moves the master.
    write(k, 'io', ['x', '=', '9999']);
    run(k, 0.5);
    expect(away(k, 'io')).toBeGreaterThan(R);
  });

  it('the master carries the Council’s rune, never spent, and it takes them to the Council’s hall', async () => {
    const k = await many();
    k.addWanderer('bea', 'Bea');
    k.as('bea', () => k.give(`rune:${COUNCIL_RUNE}`, 1));
    run(k, 0.25);
    expect(countItem(k.inventory(), `rune:${COUNCIL_RUNE}`)).toBe(1);
    expect(k.as('bea', () => countItem(k.inventory(), `rune:${COUNCIL_RUNE}`))).toBe(0);
    expect(k.as('bea', () => k.councilRune())).toBe(false);
    expect(k.as('bea', () => k.corona.isInterior(k.playerPos().x))).toBe(false);

    expect(k.composeRune(COUNCIL_RUNE)).toBe(true);
    expect(await k.castSpell()).toBe(true);
    const p = k.playerPos();
    expect(k.zone).toBe('studio');
    expect(k.corona.roomAt(p.x, p.y)?.building.id).toBe('concilio');
    // The carpet lets them go: a second later they are still in the hall, with the rune.
    run(k, 1);
    expect(k.corona.roomAt(k.playerPos().x, k.playerPos().y)?.building.id).toBe('concilio');
    expect(countItem(k.inventory(), `rune:${COUNCIL_RUNE}`)).toBe(1);
    expect(k.hand().tokens).not.toContain(COUNCIL_RUNE);
  });

  it('R: a player takes back their runes, the repository is the master’s', async () => {
    const k = await many();
    k.addWanderer('bea', 'Bea');
    let rolled = 0;
    k.bus.on('rollback', () => rolled++);
    write(k, 'bea', ['x', '=', '1']);
    write(k, 'io', ['speed', '=', 'speed']);
    const head = k.repo.head().id;
    k.as('bea', () => k.rollback());
    run(k, 2 / 60);
    expect(rolled).toBe(0);
    expect(k.repo.head().id).toBe(head);
    expect(k.as('bea', () => k.hand().tokens)).toEqual(['x', '=', '1']);
    const mine = k.ecs.query('rune').map((id) => k.ecs.get(id, 'rune')).filter((r) => r.source === 'player');
    expect(mine.map((r) => r.by)).toEqual(['io', 'io', 'io']);
    // The master's rollback brings the world back, and every rune to whoever wrote it.
    write(k, 'bea', ['y', '=', '2']);
    k.rollback();
    expect(rolled).toBe(1);
    expect(k.hand().tokens).toEqual(['speed', '=', 'speed']);
    expect(k.as('bea', () => k.hand().tokens)).toEqual(['x', '=', '1', 'y', '=', '2']);
  });

  it('alone nothing changes: the wanderer’s x = 9999 still breaks out', async () => {
    const k = await bootWith({ modalita: 'singola' });
    expect(k.isMaster()).toBe(true);
    write(k, 'io', ['x', '=', '9999']);
    run(k, 0.5);
    expect(away(k, 'io')).toBeGreaterThan(k.config.circleRadius);
  });
});
