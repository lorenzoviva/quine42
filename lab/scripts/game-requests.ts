// How big the game's requests to Gemini are. The kernel never kept its usage, so this measures what it
// sends: a Genesis and the first places, offline (MockModels, as in the tests), every request recorded,
// then a sample of each kind counted with Gemini's countTokens (free, no generation). Images in a
// request (the Artist's photos) are counted too. Output is not measured here (the report uses the lab's measured answers).
// npx vite-node lab/scripts/game-requests.ts -- [--root H:/projects/rune] [--per-task 3]

import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import { MockModels } from '../../src/kernel/ai/mock';
import type { TextCall } from '../../src/kernel/ai/models';

const argv = process.argv.slice(2);
const opt = (n: string) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);
const root = path.resolve(opt('root') ?? '../../..');
const key = /^GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync(path.join(root, '.env'), 'utf8'))?.[1]?.trim();
if (!key) throw new Error('nessuna chiave');
const perTask = Number(opt('per-task') ?? 3);

const recorded: Array<{ kind: 'text'; task: string; body: unknown }> = [];
const inline = (u: string) => {
  const m = /^data:([^;]+);base64,(.*)$/.exec(u);
  return m ? { inlineData: { mimeType: m[1], data: m[2] } } : { text: u };
};

class Recording extends MockModels {
  async text(call: TextCall): Promise<string> {
    recorded.push({
      kind: 'text',
      task: call.task,
      body: {
        systemInstruction: { parts: [{ text: call.system }] },
        contents: [{ role: 'user', parts: [{ text: call.prompt }, ...(call.images ?? []).map(inline)] }],
        ...(call.schema ? { schema: call.schema } : {}),
      },
    });
    return super.text(call);
  }
}

const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new Recording() });
await k.runGenesis('un regno di pastori sulle colline');
const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 200; i++) {
  k.tick(1 / 60);
  await settle(10);
}
console.log(`richieste registrate: ${recorded.length} (${recorded.filter((r) => r.kind === 'text').length} di testo)`);

async function count(body: any): Promise<number> {
  const { schema, ...rest } = body;
  // The response schema travels in generationConfig and counts as prompt: it goes in as text here.
  const contents = schema ? [{ role: 'user', parts: [...rest.contents[0].parts, { text: JSON.stringify(schema) }] }] : rest.contents;
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:countTokens', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key! },
    body: JSON.stringify({ generateContentRequest: { model: 'models/gemini-3.1-flash-lite', ...rest, contents } }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`countTokens ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return j.totalTokens;
}

const byTask = new Map<string, typeof recorded>();
for (const r of recorded) (byTask.get(`${r.kind}:${r.task}`) ?? byTask.set(`${r.kind}:${r.task}`, []).get(`${r.kind}:${r.task}`)!).push(r);
const rows: Array<{ task: string; calls: number; tokens: number }> = [];
for (const [task, list] of [...byTask].sort((a, b) => b[1].length - a[1].length)) {
  const sample = list.slice(0, perTask);
  const counts = await Promise.all(sample.map((r) => count(r.body)));
  const avg = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);
  rows.push({ task, calls: list.length, tokens: avg });
  console.log(`${task.padEnd(34)} ${String(list.length).padStart(4)} richieste · input medio ${avg} token (campione ${counts.join(', ')})`);
}
const out = path.resolve('lab/out/game-requests.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(rows, null, 2));
console.log('scritto', out);
