// The browser's FormRunner: a small pool of Web Workers that run the models' programs and make their
// meshes (src/render/worker.ts). The kernel keeps the grid for collision and actions; the renderer draws
// the meshes that came with it.

import type { FormRequest, FormResult, FormRunner } from '../kernel/forms';
import type { WorkerAnswer } from './worker';

export class WorkerRunner implements FormRunner {
  private idle: Worker[] = [];
  private queue: Array<{ id: number; req: FormRequest }> = [];
  private waiting = new Map<number, { ok: (r: FormResult) => void; fail: (e: Error) => void }>();
  private next = 1;

  constructor(n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1))) {
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (ev: MessageEvent<WorkerAnswer>) => {
        const a = ev.data;
        const p = this.waiting.get(a.id);
        this.waiting.delete(a.id);
        if (a.ok) p?.ok(a.result);
        else p?.fail(new Error(a.error));
        this.idle.push(w);
        this.pump();
      };
      this.idle.push(w);
    }
  }

  /** Jobs waiting or running (the HUD may show it). */
  get busy(): number {
    return this.queue.length + this.waiting.size;
  }

  run(req: FormRequest): Promise<FormResult> {
    return new Promise((ok, fail) => {
      const id = this.next++;
      this.waiting.set(id, { ok, fail });
      this.queue.push({ id, req });
      this.pump();
    });
  }

  private pump(): void {
    while (this.idle.length && this.queue.length) this.idle.pop()!.postMessage(this.queue.shift()!);
  }
}
