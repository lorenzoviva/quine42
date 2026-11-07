// Who sleeps does not greet (T332): the meetings read `activity.kind`, the component's field since contract 0.5 (ADR-0163).
// A bench of one piece: `Talk` with a real ECS and a port that holds only what the meetings read.

import { describe, expect, it } from 'vitest';
import { World } from '../src/kernel/ecs';
import type { NpcHost } from '../src/kernel/npc/host';
import type { People } from '../src/kernel/npc/people';
import type { Speech } from '../src/kernel/npc/speech';
import type { Stories } from '../src/kernel/npc/stories';
import { Talk } from '../src/kernel/npc/talk';

function bench(activityA: string, activityB: string) {
  const ecs = new World();
  const said: string[] = [];
  const later: string[] = [];
  const host = { ecs, time: 1000, generationHeld: false, coefficients: () => ({ dialogues: 1 }), speak: (_id: number, text: string) => said.push(text) } as unknown as NpcHost;
  const people = { routineNow: () => ({ does: 'lavoro' }) } as unknown as People;
  const speech = { later: (_id: number, text: string) => later.push(text) } as unknown as Speech;
  const talk = new Talk(host, people, {} as Stories, speech);
  const a = ecs.spawn({ pos: { x: 0, y: 0 }, identity: { name: 'Ada', job: 'fornaia', family: [{ name: 'Bruno', bond: 'fratello' }] }, activity: { kind: activityA, still: true } });
  const b = ecs.spawn({ pos: { x: 1, y: 0 }, identity: { name: 'Bruno', job: 'fabbro', family: [{ name: 'Ada', bond: 'sorella' }] }, activity: { kind: activityB, still: true } });
  // The wanderer far away: no conversation of the Council, only the greeting by the bond.
  talk.meetings([a, b], { x: 100, y: 100 });
  return { said, later };
}

describe('meetings (T332)', () => {
  it('two awake relatives who meet greet each other', () => {
    const { said, later } = bench('work', 'stroll');
    expect(said).toHaveLength(1);
    expect(later).toHaveLength(1);
  });

  it('two who meet, one of them asleep, do not greet each other', () => {
    expect(bench('sleep', 'stroll').said).toEqual([]);
    expect(bench('work', 'sleep').said).toEqual([]);
    expect(bench('sleep', 'stroll').later).toEqual([]);
  });
});
