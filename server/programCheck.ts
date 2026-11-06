// What checks the program of a handmade card (T293, ADR-0161). A program a player wrote is run here on the real engine, and one step of
// it can take as long as it likes: on the production server it runs in a process of its own, the program of the worlds (`mondo.mjs`,
// which answers `check`), started for each check with nothing of this one (no secret in its environment, its memory limited, reading
// only its own folder: `worldFlags`, `worldEnv`) and killed past its time. One at a time, a short queue, then «busy»: the HTTP never waits
// on a program. In `npm run dev` and in the preview the same function runs in the server's process, as the validator does there: they
// listen only to this machine (rule 8h).

import { fork, type ChildProcess } from 'node:child_process';
import { handmadeProgramErrors, HANDMADE_LIMITS, type HandmadeProgram } from '../src/kernel/handmade';
import type { FromWorld, ToWorld } from '../src/session/worldwire';
import { worldEnv, worldFlags } from './worldHost';

/** What a check says: the reasons (none: the program can be a card), or that the checker has too many waiting. */
export type CheckResult = { errors: string[] } | { busy: true };

export interface ProgramChecker {
  check(q: HandmadeProgram): Promise<CheckResult>;
  /** The checks running are killed; from now on everything is «busy». */
  stop(): void;
}

/** The heap of a checking process, in MB: a grid of two million cells is two, and the sound's samples a few more. */
export const CHECK_MEMORY_MB = 512;
/** When a check is killed: the program's own budget, and the time a process takes to start on a loaded machine. */
export const CHECK_KILL_MS = HANDMADE_LIMITS.totalMs + 10_000;
/** Checks that may wait for the one running. */
export const CHECK_QUEUE = 8;
/** What a checking process may say back, at most. */
const MAX_REASONS = 20;
const MAX_REASON = 500;

/** The check in this process: the dev server's and the preview's, and the tests'. */
export function inlineChecker(): ProgramChecker {
  return { check: async (q) => ({ errors: handmadeProgramErrors(q) }), stop: () => undefined };
}

export interface ProcessCheckerOptions {
  /** The program of the worlds: built when needed in development, already there in production. */
  program: () => Promise<string>;
  /** Its arguments (the tests' fake programs). */
  args?: string[];
  memoryMb?: number;
  killMs?: number;
  queue?: number;
}

/** Each check in a process of its own, one at a time. */
export function processChecker(o: ProcessCheckerOptions): ProgramChecker {
  const killMs = o.killMs ?? CHECK_KILL_MS;
  const queue = o.queue ?? CHECK_QUEUE;
  const running = new Set<ChildProcess>();
  let tail: Promise<unknown> = Promise.resolve();
  let waiting = 0;
  let stopped = false;

  const once = (entry: string, q: HandmadeProgram): Promise<CheckResult> =>
    new Promise((resolve) => {
      if (stopped) return resolve({ busy: true });
      const child = fork(entry, o.args ?? [], {
        execArgv: worldFlags({ entry, memoryMb: o.memoryMb ?? CHECK_MEMORY_MB }),
        env: worldEnv(),
        // What it would print is the program's business, not this server's log.
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        serialization: 'json',
        windowsHide: true,
      });
      running.add(child);
      let done = false;
      const finish = (r: CheckResult) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        running.delete(child);
        if (child.exitCode === null && child.signalCode === null) child.kill();
        resolve(r);
      };
      const timer = setTimeout(() => finish({ errors: [`il controllo non finisce in ${killMs / 1000} s: il programma è troppo lento per una carta`] }), killMs);
      child.on('message', (m: FromWorld) => {
        if (m?.t !== 'checked' || m.id !== 1 || !Array.isArray(m.errors)) return;
        finish({ errors: m.errors.filter((e): e is string => typeof e === 'string').slice(0, MAX_REASONS).map((e) => e.slice(0, MAX_REASON)) });
      });
      // Out of memory, or dead some other way: the program asked for more than a card may have. Killed because the server stops: nobody judged it.
      child.on('exit', () => finish(stopped ? { busy: true } : { errors: ['il controllo si è fermato: il programma chiede più di quanto una carta può avere'] }));
      child.on('error', () => finish({ errors: ['il controllo non è partito: riprova tra poco'] }));
      child.send({ t: 'check', id: 1, program: { kind: q.kind, xml: q.xml, ...(q.class !== undefined ? { class: q.class } : {}), ...(q.size !== undefined ? { size: q.size } : {}) } } satisfies ToWorld);
    });

  return {
    check(q) {
      if (stopped || waiting >= queue + 1) return Promise.resolve({ busy: true });
      waiting++;
      const run = tail.then(async () => once(await o.program(), q)).finally(() => waiting--);
      tail = run.catch(() => undefined);
      return run;
    },
    stop() {
      stopped = true;
      for (const child of running) child.kill();
    },
  };
}
