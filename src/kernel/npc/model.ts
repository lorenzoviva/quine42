// The people of the world as data (T327, ADR-0166): one of the two faces of `npc/`. What the files of the people say and how they read —
// `world/people.json` (society.ts), `world/plots.json` (plots.ts), the programs of the trades (jobs.ts), `world/ventures.json`
// (ventures.ts) — and the words the world uses for them (phases of the day, places, activities, bonds). Pure: no state, no call to the
// models, no import of the behaviour of `npc/` nor of the agents' code. Whoever only reads (the graph, the cards, the site, the renderer,
// the agents that write people) comes in from here; the kernel moves the people through the other face, `npc/index.ts`.

import type { Turn } from '../agents/minds';

export * from './society';
export * from './plots';
export * from './jobs';
export * from './ventures';

/** The mind of a character on the ECS (`mind`): how it moves (`vaga` its routine, `segui` the wanderer, `resta` where it is), its mood, what was said with it. */
export interface Mind {
  mode: 'vaga' | 'segui' | 'resta';
  mood: string;
  history: Turn[];
}
