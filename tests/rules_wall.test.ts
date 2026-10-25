// T47b: The Library of the World: the tablets of the rules and the rune canon.
// A stone tablet on the wall for each judgement in world/rules.json (the newest 12 shine),
// click -> the judgement in a panel; the rune canon engraved above the door, with the magic
// runes in their authentic colors.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { FOCUSED_RULES, ruleTablets, TABLETS_MAX, TABLETS_WALL } from '../src/kernel/corona';
import type { Rule } from '../src/kernel/types';

function createSampleRules(count: number): Rule[] {
  return Array.from({ length: count }, (_, i) => ({
    chiave: `azione.test_${i + 1}`,
    testo: `Azione di prova ${i + 1}`,
    possibile: i % 2 === 0,
    racconto: `Il Concilio giudica l'azione ${i + 1}: ${i % 2 === 0 ? 'è possibile e consentita.' : 'non è consentita dalle leggi del mondo.'}`,
    effetti: i % 2 === 0 ? ['luce'] : undefined,
  }));
}

const bootWithRules = (rules: Rule[]) => {
  const files = {
    ...bundledFiles,
    'world/rules.json': JSON.stringify({ regole: rules }, null, 2),
  };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
};

function stand(k: Kernel, x: number, y: number): void {
  Object.assign(k.playerPos(), { x, y });
  k.zone = 'studio';
}

describe('ruleTablets function', () => {
  it('returns empty when there are no rules', () => {
    expect(ruleTablets(0, 0, [])).toEqual([]);
  });

  it('places exactly as many tablets as rules when <= TABLETS_MAX, all marked if <= 12', () => {
    const rules = createSampleRules(5);
    const tablets = ruleTablets(100, 0, rules);

    // Exactly 5 tablets, no arrows
    expect(tablets.length).toBe(5);
    expect(tablets.every((t) => t.kind === 'lastra')).toBe(true);

    // All 5 rules are among the newest 12 -> all marked
    expect(tablets.every((t) => t.marked === true)).toBe(true);

    // Check properties and coordinates
    tablets.forEach((t, i) => {
      expect(t.target).toBe(rules[i].chiave);
      expect(t.rule).toBe(rules[i]);
      expect(t.y).toBe(TABLETS_WALL.y);
    });
  });

  it('marks only the newest 12 rules when count is 15 (< TABLETS_MAX)', () => {
    const rules = createSampleRules(15);
    const tablets = ruleTablets(100, 0, rules);

    expect(tablets.length).toBe(15);
    // First 3 are older -> marked === false
    expect(tablets[0].marked).toBe(false);
    expect(tablets[1].marked).toBe(false);
    expect(tablets[2].marked).toBe(false);

    // Last FOCUSED_RULES are newest -> marked === true
    for (let i = 15 - FOCUSED_RULES; i < 15; i++) {
      expect(tablets[i].marked).toBe(true);
    }
  });

  it('caps at TABLETS_MAX tablets with prev and next arrows when exceeding capacity', () => {
    const rules = createSampleRules(25);
    const offset = 25 - TABLETS_MAX; // offset showing the last 16
    const items = ruleTablets(100, 0, rules, offset);

    const prevArrow = items.find((it) => it.kind === 'prev');
    const nextArrow = items.find((it) => it.kind === 'next');
    const tablets = items.filter((it) => it.kind === 'lastra');

    expect(prevArrow).toBeDefined();
    expect(prevArrow?.target).toBe('regole');
    expect(nextArrow).toBeDefined();
    expect(nextArrow?.target).toBe('regole');

    // Exactly TABLETS_MAX tablets shown
    expect(tablets.length).toBe(TABLETS_MAX);

    // In the newest window, the last 12 tablets of the 25 total are marked
    // offset is 9; tablets index 0..15 correspond to global index 9..24
    // global index >= 13 (25 - 12) are marked -> tablet index >= 4 are marked
    for (let i = 0; i < 4; i++) {
      expect(tablets[i].marked).toBe(false);
    }
    for (let i = 4; i < TABLETS_MAX; i++) {
      expect(tablets[i].marked).toBe(true);
    }
  });
});

describe('the Library of the World (T47b): rules wall in Kernel', () => {
  it('builds the ground floor of the Library with rule tablets on the back wall', async () => {
    const rules = createSampleRules(6);
    const k = await bootWithRules(rules);
    const b = k.corona.building('mondo')!;
    const f = b.floors[0];

    const tablets = f.items.filter((it) => it.kind === 'lastra');
    expect(tablets.length).toBe(6);
    expect(tablets.every((t) => t.marked === true)).toBe(true);

    const canon = f.items.find((it) => it.kind === ('canone' as any));
    expect(canon).toBeUndefined();
  });

  it('steps through rules with stepRules and stops at the edges', async () => {
    const rules = createSampleRules(20);
    const k = await bootWithRules(rules);
    const max = TABLETS_MAX; // 16
    const maxOffset = rules.length - max; // 4

    // Starts at newest offset (4)
    expect(k.rulesWall().offset).toBe(maxOffset);
    expect(k.rulesWall().visible.length).toBe(max);

    // Stepping forward at the newest edge: stops ("i bordi fermano")
    k.stepRules(1);
    expect(k.rulesWall().offset).toBe(maxOffset);

    // Stepping backward steps through history
    k.stepRules(-1);
    expect(k.rulesWall().offset).toBe(maxOffset - 1);

    k.stepRules(-3);
    expect(k.rulesWall().offset).toBe(0);

    // Stepping backward at the oldest edge: stops ("i bordi fermano")
    k.stepRules(-1);
    expect(k.rulesWall().offset).toBe(0);
  });

  it('opens rule panel on E in front of a tablet or click within reach', async () => {
    const rules = createSampleRules(4);
    const k = await bootWithRules(rules);
    const b = k.corona.building('mondo')!;
    const f = b.floors[0];
    const firstTablet = f.items.find((it) => it.kind === 'lastra')!;

    const opened: unknown[] = [];
    k.bus.on('ui:rule', (e) => opened.push(e));

    // Stand in front of the tablet (south of it, facing north)
    stand(k, firstTablet.x + 0.5, firstTablet.y + 1.2);
    await k.interact();
    expect(opened.length).toBe(1);

    // Click on tablet within reach
    expect(k.clickStudio(firstTablet.x + 0.5, firstTablet.y + 0.5)).toBe(true);
    expect(opened.length).toBe(2);

    // Too far away: click does not trigger
    stand(k, firstTablet.x + 0.5, firstTablet.y + 8.0);
    expect(k.clickStudio(firstTablet.x + 0.5, firstTablet.y + 0.5)).toBe(false);
    expect(opened.length).toBe(2);
  });
});

