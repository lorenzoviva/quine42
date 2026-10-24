import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { INTERIOR_X } from '../src/kernel/corona';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';

const DT = 1 / 60;

/** The local models, writing down every plan of a place they are asked for: where, and who pays. */
class Recording extends MockModels {
  plans: Array<{ key: string; chi?: string }> = [];
  async text(call: TextCall): Promise<string> {
    if (call.task === 'chunk.plan') {
      const d = call.data as { cx: number; cy: number };
      this.plans.push({ key: `${d.cx},${d.cy}`, chi: call.chi });
    }
    return super.text(call);
  }
}

async function bootMany(ai: Record<string, unknown> = {}): Promise<{ k: Kernel; models: Recording }> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, ...ai }, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
  const models = new Recording();
  return { k: await Kernel.boot({ files, store: memoryStore(), models }), models };
}

async function run(server: SessionServer, rounds: number) {
  for (let i = 0; i < rounds; i++) {
    server.tick(DT);
    await new Promise((r) => setTimeout(r, 15));
  }
}

/** Ticks until no place near anyone is a draft (or `rounds` run out). */
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
  return new SessionClient(c, { id });
}

/** Puts a wanderer of the session somewhere in the world (their carpet under them). */
function put(k: Kernel, id: string, to: { x: number; y: number }) {
  k.as(id, () => {
    const p = k.playerPos();
    Object.assign(k.carpet()!, { ox: to.x - p.x, oy: to.y - p.y });
  });
}

const S = 18;
const middleOf = (cx: number, cy: number) => ({ x: cx * S + S / 2, y: cy * S + S / 2 });

describe('new places with the lock, at the expense of who explores (T40)', () => {
  it('two clients entering the same new place together: one plan, paid by the first, the other gets it ready', async () => {
    const { k, models } = await bootMany();
    const server = new SessionServer(k);
    const anna = join(server, 'anna');
    const bruno = join(server, 'bruno');
    await Promise.all([anna.ready, bruno.ready]);
    await settle(server);
    // Far from everything planned so far: anna arrives first, bruno a tick later.
    const far = middleOf(12, 9);
    put(k, 'anna', far);
    server.tick(DT);
    put(k, 'bruno', { x: far.x + 1, y: far.y });
    await settle(server);
    // Every place was planned once, however many saw it.
    const keys = models.plans.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    const target = models.plans.filter((p) => p.key === '12,9');
    expect(target).toEqual([{ key: '12,9', chi: 'anna' }]);
    const ch = k.chunks.get('12,9')!;
    expect(ch.stage).toBe('planned');
    expect(ch.plan!.carta!.pagante).toBe('anna');
    // Bruno has it, planned, with its name: he did not ask for it again.
    const seen = bruno.places.get(ch.key)!;
    expect(seen.stage).toBe('planned');
    expect(seen.nome).toBe(ch.place!.name);
    expect(models.plans.filter((p) => p.chi === 'bruno').every((p) => p.key !== '12,9')).toBe(true);
  }, 30_000);

  it('a universe of many plans at most so many new places a minute; then the rest', async () => {
    const { k, models } = await bootMany({ placesPerMinute: 2 });
    const server = new SessionServer(k);
    const anna = join(server, 'anna');
    await anna.ready;
    await run(server, 60);
    const before = models.plans.length;
    expect(before).toBeLessThanOrEqual(2);
    put(k, 'anna', middleOf(-11, 7));
    await run(server, 60);
    // The quota of the minute is spent: the places around her wait as drafts.
    expect(models.plans.length).toBe(2);
    expect([...k.chunks.values()].some((c) => c.stage === 'draft' && c.held)).toBe(true);
    // A minute later the world plans the next ones.
    k.time += 61;
    await run(server, 30);
    expect(models.plans.length).toBeGreaterThan(2);
    expect(models.plans.length).toBeLessThanOrEqual(4);
  }, 30_000);

  it('the world goes on planning for the players while the master is in the studio, or not connected', async () => {
    const { k, models } = await bootMany();
    const server = new SessionServer(k);
    const anna = join(server, 'anna');
    await anna.ready;
    await settle(server);
    // The master (`io`, no client) goes to the Council's hall with their rune: inside the studio, nothing to load.
    expect(k.as('io', () => k.councilRune())).toBe(true);
    await run(server, 5);
    expect(k.as('io', () => k.playerPos().x)).toBeGreaterThanOrEqual(INTERIOR_X - 10);
    const before = models.plans.length;
    put(k, 'anna', middleOf(-8, -10));
    await settle(server);
    expect(models.plans.length).toBeGreaterThan(before);
    expect(models.plans.slice(before).every((p) => p.chi === 'anna')).toBe(true);
    expect(k.chunks.get('-8,-10')?.stage).toBe('planned');
  }, 30_000);
});
