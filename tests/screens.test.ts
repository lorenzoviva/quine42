// T46b: the Direction's wall of screens. Against its back wall, as wide as the room: the timeline of the commits (a film
// that «<» «>» move and that stops at its ends, looking never goes back), the live log of the Council (who works, on
// what, with which model), the board of the costs (by agent and by task, the budgets of universe.json as full scale).

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { ROOM_W, WALL_AT } from '../src/kernel/corona';
import { FILM, liveFeed, timeline, whoWanted } from '../src/kernel/screens';
import { UsageLedger } from '../src/kernel/ai/usage';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });

function stand(k: Kernel, x: number, y: number): void {
  Object.assign(k.playerPos(), { x, y });
  k.zone = 'studio';
}

/** n commits on top of the genesis, each changing one file. */
function commits(k: Kernel, n: number): void {
  for (let i = 0; i < n; i++) {
    k.repo.write(`world/prova-${i}.md`, `prova ${i}\n`);
    k.repo.commit(i % 2 ? `scultore: prova ${i}` : `trama: prova ${i}`, 'agent');
  }
}

describe('the wall of screens', () => {
  it('stands against the back wall of the Direction, three fields as wide as the room, the arrows under the film', async () => {
    const k = await boot();
    const f = k.corona.building('universo')!.floors[0];
    const wall = f.items.filter((i) => i.kind === 'parete');
    expect(wall.map((i) => i.target)).toEqual(['tempo', 'registro', 'costi']);
    expect(new Set(wall.map((i) => i.y - f.oy))).toEqual(new Set([1]));
    const width = wall.reduce((s, i) => s + (i.w ?? 1), 0);
    expect(width).toBeGreaterThanOrEqual(ROOM_W - 4);
    // Side by side, nothing else on them.
    for (let j = 1; j < wall.length; j++) expect(wall[j].x).toBe(wall[j - 1].x + (wall[j - 1].w ?? 1));
    for (const i of wall)
      for (let x = i.x; x < i.x + (i.w ?? 1); x++) expect(f.items.filter((o) => o.y === i.y && x >= o.x && x < o.x + (o.w ?? 1))).toEqual([i]);
    const film = wall[0];
    const arrows = f.items.filter((i) => (i.kind === 'prev' || i.kind === 'next') && i.target === 'tempo');
    expect(arrows.map((a) => [a.kind, a.x - film.x, a.y - film.y])).toEqual([['prev', 0, 1], ['next', WALL_AT[0].w - 1, 1]]);
    // The row in front of the film can be walked between the arrows; no other building has the wall.
    for (let x = film.x + 1; x < film.x + film.w! - 1; x++) expect(k.corona.free(x + 0.5, film.y + 1.5), `${x}`).toBe(true);
    expect(k.corona.buildings.filter((b) => b.floors.some((fl) => fl.items.some((i) => i.kind === 'parete'))).map((b) => b.id)).toEqual(['universo']);
  });

  it('the film moves with «<» «>» and stops at its ends, without going back', async () => {
    const k = await boot();
    commits(k, 7);
    const head = k.repo.head().id;
    const n = k.repo.log().length;
    let t = k.screens().tempo;
    // At first it is the present: the newest on the right.
    expect([t.index, t.count, t.frames.length, t.at]).toEqual([0, n, FILM, FILM - 1]);
    expect(t.chosen?.id).toBe(head);
    expect(t.frames.map((x) => x.time)).toEqual([...t.frames.map((x) => x.time)].sort((a, b) => a - b));
    const msgs: string[] = [];
    k.bus.on('message', (m: any) => msgs.push(typeof m === 'string' ? m : (m?.text ?? '')));
    // Forward from the present: it stays.
    k.stepTimeline(-1);
    expect(k.screens().tempo.index).toBe(0);
    // Back three: the chosen is in the middle of the film.
    for (let i = 0; i < 3; i++) k.stepTimeline(1);
    t = k.screens().tempo;
    expect(t.index).toBe(3);
    expect(t.chosen?.id).toBe(k.repo.log()[3].id);
    expect(t.at).toBe(Math.floor(FILM / 2));
    // To the beginning and past it: it stops at the first commit.
    for (let i = 0; i < n + 3; i++) k.stepTimeline(1);
    t = k.screens().tempo;
    expect(t.index).toBe(n - 1);
    expect(t.at).toBe(0);
    expect(t.chosen?.id).toBe(k.repo.log()[n - 1].id);
    // Looking changes nothing.
    expect(k.repo.head().id).toBe(head);
    // A new commit while the film is in the past: it stays where it was.
    commits(k, 1);
    expect(k.screens().tempo.chosen?.id).toBe(t.chosen?.id);
  });

  it('a frame says what changed and who wanted it', async () => {
    const k = await boot();
    commits(k, 2);
    const t = k.screens().tempo;
    expect(t.chosen).toMatchObject({ message: 'scultore: prova 1', who: 'lo Scultore', changed: ['world/prova-1.md'] });
    expect(whoWanted('trama: Le reti sparite', 'agent')).toBe('il Narratore');
    expect(whoWanted('modifica modules/x/logic.lua', 'player')).toBe('il viandante');
    expect(whoWanted('qualcosa di nuovo', 'genesis')).toBe('la Genesi');
    // An earlier session's commit has no snapshot: what it changed is not known.
    const old = timeline([{ id: 'a1', parent: null, message: 'genesi: Aurora', author: 'agent', time: 1, files: {} }], 0, () => undefined);
    expect(old.chosen?.changed).toBeUndefined();
    expect(old.chosen?.who).toBe('il Concilio, alla Genesi');
  });

  it('the live log shows who works, on what, with which model', () => {
    const now = 1_000_000;
    const feed = [
      { time: now - 300_000, from: 'arbitro' as const, kind: 'approva' as const, text: 'va bene', task: 'forge.review' },
      { time: now - 5_000, from: 'cartografo' as const, kind: 'propone' as const, text: 'un borgo sul fiume', task: 'chunk.plan' },
    ];
    const live = liveFeed(feed, { scultore: { model: 'gemini-3.8-flash', task: 'model.sculpt', time: now - 20_000 } }, now, 'gemini-3.1-flash-lite');
    expect(live.desks.length).toBe(8);
    expect(live.desks.filter((d) => d.working).map((d) => d.agent)).toEqual(['cartografo', 'scultore']);
    expect(live.desks[0]).toMatchObject({ agent: 'cartografo', task: 'chunk.plan', model: 'gemini-3.1-flash-lite', ago: 5, text: 'un borgo sul fiume' });
    expect(live.desks[1]).toMatchObject({ agent: 'scultore', task: 'model.sculpt', model: 'gemini-3.8-flash' });
    expect(live.desks.find((d) => d.agent === 'arbitro')).toMatchObject({ working: false, ago: 300 });
    expect(live.desks.find((d) => d.agent === 'fisico')?.model).toBeUndefined();
    expect(live.lines.map((l) => l.from)).toEqual(['Arbitro', 'Cartografo']);
  });

  it('the board of the costs adds up as the Council panel does, by agent and by task, with the budgets', async () => {
    const k = await boot();
    const u: UsageLedger = k.usage;
    u.record({ model: 'gemini-3.1-flash-lite', agent: 'narratore', task: 'npc.reply', prompt: 4000, cached: 1000, output: 300, thoughts: 100 });
    u.record({ model: 'gemini-3.1-flash-lite', agent: 'cartografo', task: 'chunk.plan', prompt: 9000, cached: 0, output: 1200, thoughts: 400 });
    u.record({ model: 'gemini-3.1-flash-lite', agent: 'narratore', task: 'npc.reply', prompt: 3000, cached: 0, output: 200, thoughts: 0 });
    const c = k.screens().costi;
    // The Council panel: session, today, total (src/ui/feed.ts).
    expect(c.session.usd).toBeCloseTo(u.session.usd, 12);
    expect(c.today.usd).toBeCloseTo(u.day().total.usd, 12);
    expect(c.total.usd).toBeCloseTo(u.total().usd, 12);
    expect(c.session.usd).toBeGreaterThan(0);
    const sum = (xs: Array<{ tally: { usd: number; calls: number } }>) => xs.reduce((s, x) => ({ usd: s.usd + x.tally.usd, calls: s.calls + x.tally.calls }), { usd: 0, calls: 0 });
    expect(sum(c.byAgent).usd).toBeCloseTo(c.session.usd, 12);
    expect(sum(c.byAgent).calls).toBe(3);
    expect(sum(c.byTask).usd).toBeCloseTo(c.today.usd, 12);
    expect(c.byAgent.map((a) => a.name).sort()).toEqual(['Cartografo', 'Narratore']);
    expect(c.byTask.find((t) => t.task === 'npc.reply')?.tally.calls).toBe(2);
    // The budgets of universe.json → ai as full scale.
    const ai = k.config.ai;
    expect(c.budgets.find((b) => b.nome === 'testo')).toMatchObject({ max: ai.maxText });
    expect(c.budgets.find((b) => b.nome === 'Fucina')).toMatchObject({ max: ai.maxForges });
    expect(c.budgets.every((b) => b.usati >= 0 && b.usati <= Math.max(b.max, b.usati))).toBe(true);
    // The live log knows the model each agent last called.
    expect(k.screens().registro.desks.find((d) => d.agent === 'cartografo')?.model).toBe('gemini-3.1-flash-lite');
  });

  it('opens with E in front of a field or a click within reach, and the arrows move the film', async () => {
    const k = await boot();
    commits(k, 3);
    const f = k.corona.building('universo')!.floors[0];
    const wall = f.items.filter((i) => i.kind === 'parete');
    const opened: any[] = [];
    k.bus.on('ui:screens', (e) => opened.push(e));
    const head = k.repo.head().id;
    // In front of the live log.
    const mid = wall[1];
    stand(k, mid.x + 2.5, mid.y + 1.5);
    await k.interact();
    expect(opened.map((o) => o.field)).toEqual(['registro']);
    expect(opened[0].screens.registro.desks.length).toBe(8);
    stand(k, wall[2].x + 2.5, wall[2].y + 1.5);
    expect(k.clickStudio(wall[2].x + 1.5, wall[2].y + 0.5)).toBe(true);
    expect(opened.at(-1).field).toBe('costi');
    // Between the film and the shelf behind, E opens the film.
    const film = wall[0];
    stand(k, film.x + 3.5, film.y + 1.5);
    await k.interact();
    expect(opened.at(-1).field).toBe('tempo');
    // The film's arrow «<», clicked: one commit back.
    const prev = f.items.find((i) => i.kind === 'prev' && i.target === 'tempo')!;
    stand(k, prev.x + 1.5, prev.y + 0.5);
    expect(k.clickStudio(prev.x + 0.5, prev.y + 0.5)).toBe(true);
    expect(k.screens().tempo.index).toBe(1);
    // Too far away.
    stand(k, mid.x + 2.5, mid.y + 10.5);
    expect(k.clickStudio(wall[0].x + 1.5, wall[0].y + 0.5)).toBe(false);
    expect(k.repo.head().id).toBe(head);
  });
});
