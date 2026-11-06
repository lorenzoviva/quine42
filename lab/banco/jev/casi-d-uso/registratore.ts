// T325, point 1: what the Council sends today. A model layer that records every call and lets the game's local models answer
// (`MockAiModels`: nothing goes out, nothing is spent), under another name than `offline`, so that the kernel does what it does
// with Gemini (sessions, cast, plots, packs, models), and a walk through a real universe that makes the calls of an hour of play.

import { emptyUsage, type AiModels, type Limits, type TextCall } from '../../../../src/kernel/ai/models';
import { MockAiModels } from '../../../../src/kernel/ai/mock';
import type { Kernel } from '../../../../src/kernel/kernel';
import { addItem } from '../../../../src/kernel/inventory';
import type { CallRecord } from '../../../../src/kernel/ai/usage';

export interface RecordedCall {
  /** Where it was recorded (the universe) and in which order. */
  universe: string;
  n: number;
  agent: string;
  task: string;
  system: string;
  prompt: string;
  /** The response schema travels with the request and counts as input (generationConfig). */
  schema?: string;
  images: number;
  model?: string;
  temperature?: number;
  thinking?: string;
  chi?: string;
  /** The agent's context as the Council gave it at that moment (council.context): where it ends in the system, the task's own lines begin. */
  context?: string;
}

/** Every call recorded, the local models answering. Its name is not `offline`: the kernel then behaves as with a real model. */
export class RecordingModels implements AiModels {
  readonly name = 'registratore';
  readonly usage = emptyUsage();
  limits: Limits = { text: Infinity };
  textModel?: string;
  onCall?: (r: CallRecord) => void;
  readonly inner = new MockAiModels();
  readonly calls: RecordedCall[] = [];
  /** The agent's context now (the walk sets it to the kernel's `council.context`). */
  contextOf?: (agent: string, focused: boolean) => string;
  /** Only these tasks are answered (the others throw, as a model that failed): a walk that must not start everything. */
  only?: Set<string>;

  constructor(
    public universe: string,
    textModel = 'gemini-3.1-flash-lite',
  ) {
    this.textModel = textModel;
    this.inner.latency = 0;
    this.inner.corruptRate = 0;
  }

  async text(call: TextCall): Promise<string> {
    this.usage.text++;
    let context: string | undefined;
    try {
      context = this.contextOf?.(call.agent, call.system.includes('\n\n## Ciò che il mondo sa di questo compito'));
    } catch {
      context = undefined;
    }
    this.calls.push({
      universe: this.universe,
      n: this.calls.length,
      agent: call.agent,
      task: call.task,
      system: call.system,
      prompt: call.prompt,
      ...(call.schema ? { schema: JSON.stringify(call.schema) } : {}),
      images: call.images?.length ?? 0,
      ...(call.model ? { model: call.model } : {}),
      ...(call.temperature !== undefined ? { temperature: call.temperature } : {}),
      ...(call.thinking ? { thinking: call.thinking } : {}),
      ...(call.chi ? { chi: call.chi } : {}),
      ...(context ? { context } : {}),
    });
    if (this.only && !this.only.has(call.task)) throw new Error(`registratore: ${call.task} non serve a questa misura`);
    return this.inner.text(call);
  }
}

// ---------------------------------------------------------------------------------------------------------- the walk

const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** What the walk asks of the people and of the things: the same words in every universe (the world answers in its own). */
export const WALK = {
  places: 24,
  /** A wanderer's lines to a person: a greeting, the place, the work, the same question again (the reuse of point (b)). */
  lines: ['Buongiorno! Chi sei?', 'Che posto è questo?', 'Di che cosa vivi?', 'Che posto è questo?'],
  people: 6,
  dialogues: 6,
  looks: 8,
  freeActions: ['bussa tre volte', 'prova a sollevarlo', 'ci versa sopra un po’ d’acqua', 'lo annusa da vicino'],
  crafts: ['un bastone da passeggio con un ramo', 'una fionda con una corda e un ramo'],
  liaison: ['Vorrei una lanterna che si accende da sola al tramonto.', 'Mi servirebbe un mercante di spezie nel porto.', 'Cosa fate qui dentro?'],
};

async function ticks(k: Kernel, n: number): Promise<void> {
  for (let t = 0; t < n; t++) {
    k.tick(1 / 60);
    if (t % 4 === 0) await settle(2);
  }
}

/** A step of the walk that may fail (a task without what it needs in this universe) without stopping the rest. */
async function step(log: (s: string) => void, what: string, fn: () => Promise<unknown> | unknown): Promise<void> {
  try {
    await fn();
  } catch (e) {
    log(`  ${what}: ${(e as Error).message.slice(0, 120)}`);
  }
}

/**
 * An hour of play in small: new places in a spiral (plans, Forge, packs, cast, sessions, models), then what a wanderer does with
 * people and things, and what the studio asks. Every call goes to the recorder; the answers are the local models'.
 */
/**
 * New places in a spiral around the start. The world moves under the wanderer as the carpet carries them: the offset goes from place to
 * place and the wanderer stays in the circle (beyond it they would transcend, and the requests would be the studio's).
 */
export async function explore(k: Kernel, rec: RecordingModels, places = WALK.places): Promise<void> {
  rec.contextOf = (agent, focused) => k.council.context(agent as never, focused);
  const carpet = k.carpet();
  const S: number = (k as any).config.chunkSize;
  const spiral: Array<[number, number]> = [];
  for (let r = 1; spiral.length < places; r++)
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) spiral.push([dx, dy]);
  for (const [cx, cy] of spiral.slice(0, places)) {
    if (carpet) Object.assign(carpet, { ox: cx * S + S / 2, oy: cy * S + S / 2 });
    Object.assign(k.wandererPos(), { x: 0, y: 0 });
    await ticks(k, 24);
  }
  await ticks(k, 240);
}

export async function walk(k: Kernel, rec: RecordingModels, log: (s: string) => void = () => {}): Promise<void> {
  const any = k as any;
  await explore(k, rec);
  log(`  luoghi: ${rec.calls.length} chiamate`);

  // The people met: who has a mind and a persona, the first of each kind.
  const minds = k.ecs.query('mind').filter((id) => k.ecs.alive.has(id));
  const seenKinds = new Set<string>();
  const people = minds.filter((id) => {
    const m = k.ecs.get(id, 'module')?.id;
    if (!m || seenKinds.has(m)) return false;
    seenKinds.add(m);
    return true;
  });
  for (const id of people.slice(0, WALK.people)) for (const line of WALK.lines) await step(log, 'talk', () => k.talk(id, line));
  log(`  parole: ${rec.calls.length} chiamate`);

  // Dialogues between two people (the kernel starts them when two are near: here asked directly).
  const identities = k.ecs.query('identity').filter((id) => k.ecs.alive.has(id));
  for (let i = 0; i + 1 < identities.length && i < WALK.dialogues * 2; i += 2) {
    const [a, b] = [identities[i], identities[i + 1]];
    await step(log, 'converse', () => any.converse(a, b, k.ecs.get(a, 'identity'), k.ecs.get(b, 'identity')));
  }

  // «Esamina» and «Leggi» on things of different kinds; «Altro…» on some of them.
  // Things of the world: not the wanderer, not the carpet, not a person.
  const things = k.ecs.query('module').filter((id) => {
    if (!k.ecs.alive.has(id) || k.ecs.get(id, 'mind') || k.ecs.get(id, 'carpet') || id === any.wandererEntity) return false;
    const kind = k.modules.get(k.ecs.get(id, 'module')?.id)?.manifest.kind;
    return kind === 'entity' || kind === 'item';
  });
  const kinds = new Set<string>();
  const distinct = things.filter((id) => {
    const m = k.ecs.get(id, 'module')?.id;
    if (!m || kinds.has(m)) return false;
    kinds.add(m);
    return true;
  });
  for (const id of distinct.slice(0, WALK.looks)) await step(log, 'esamina', () => k.perform(id, 'esamina'));
  for (const id of distinct.filter((id) => k.ecs.get(id, 'interact')?.type === 'read').slice(0, 2)) await step(log, 'leggi', () => k.perform(id, 'leggi'));
  for (const [i, text] of WALK.freeActions.entries()) {
    const id = distinct[(i * 3 + 1) % Math.max(1, distinct.length)];
    if (id !== undefined) await step(log, 'altro', () => k.freeAction(id, text));
  }
  log(`  cose: ${rec.calls.length} chiamate`);

  // Fabrications and combinations, with things in the bag.
  const items = [...k.content.items.keys()].slice(0, 6);
  for (const it of items) addItem(k.inventory(), it, 1, any.itemSpec(it));
  for (const text of WALK.crafts) await step(log, 'freeCraft', () => k.freeCraft(text));
  await step(log, 'combine', () => k.combine(0, 1));
  await step(log, 'combine', () => k.combine(2, 3));

  // The life of the world: plots, a session, a rune, a death, the review of the fourth wall.
  await step(log, 'weaveStory', () => k.weaveStory(true));
  await step(log, 'holdSession', () => k.holdSession(true));
  await step(log, 'inventRune', () => k.inventRune('il Concilio vuole un elemento che nessuna runa ha'));
  await step(log, 'reviewFourthWall', () => k.reviewFourthWall());
  await step(log, 'compose', () => k.composing.make({ richiesta: 'il brano del mercato del porto, di mattina' }));

  // The studio: the Liaison, an agent, an environment, a mechanic.
  for (const text of WALK.liaison) await step(log, 'liaison', () => k.talkToAgent('liaison', text));
  await step(log, 'narrator', () => k.talkToAgent('narrator', 'Come nasce una persona nuova del mondo?'));
  await step(log, 'environment', () => k.createEnvironment('una palude di nebbia con canne alte'));
  await step(log, 'mechanic', () => k.forgeMechanic('un banco del mercato dove si scambiano oggetti'));

  // The Actor on: the sheets and the lines it plays.
  any.config.ai.actor = { on: true, model: 'gemini-3.8-flash' };
  for (const id of people.slice(0, 3)) for (const line of WALK.lines.slice(0, 2)) await step(log, 'talk (Attore)', () => k.talk(id, line));
  any.config.ai.actor = { on: false };

  // A death, last: the world waits after it.
  await step(log, 'die', async () => {
    k.die('una caduta dalla scogliera');
    await settle(50);
  });
  await ticks(k, 60);
  log(`  fine: ${rec.calls.length} chiamate`);
}
