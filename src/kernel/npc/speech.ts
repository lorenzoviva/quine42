// What the people say a little later (T327, ADR-0166): the lines of a greeting, a dialogue, a beat of a plot, each at its moment of the
// world, said in the order they were queued. Part of `npc/`.

import type { Id } from '../ecs';
import type { NpcHost } from './host';

export class Speech {
  private queued: Array<{ id: Id; text: string; at: number }> = [];

  constructor(private readonly host: NpcHost) {}

  /** A line said at a moment of the world (`at`, in seconds of `time`). */
  later(id: Id, text: string, at: number): void {
    this.queued.push({ id, text, at });
  }

  /** The lines whose moment came are said. */
  flush(): void {
    for (const q of this.queued.filter((x) => x.at <= this.host.time)) this.host.speak(q.id, q.text);
    this.queued = this.queued.filter((x) => x.at > this.host.time);
  }
}
