import fs from 'node:fs';
import path from 'node:path';

/**
 * How many workers vitest may use (T118, ADR-0088): under the pipeline (a task's CLI has `PIPELINE_TASK`, a command in a turn
 * `PIPELINE_TURNO`) `turni.test.worker` of its config, one per physical core; by hand nothing is said, and vitest uses its default.
 * `--maxWorkers` on the command line still wins.
 */
export function testWorkers(env: NodeJS.ProcessEnv, workers = configuredWorkers()): { maxWorkers?: number; minWorkers?: number } {
  if (!env.PIPELINE_TASK && !env.PIPELINE_TURNO) return {};
  return workers > 0 ? { maxWorkers: workers, minWorkers: 1 } : {};
}

function configuredWorkers(): number {
  try {
    const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'tools/pipeline/config.json'), 'utf8'));
    return Number(config.turni?.test?.worker) || 0;
  } catch {
    return 0;
  }
}
