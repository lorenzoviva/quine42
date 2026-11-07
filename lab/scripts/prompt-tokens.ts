// How many tokens the Council's requests cost before and after a change of their prompts (T310: the prompts in English).
// `--capture <file>`: a Genesis and the first places offline (MockAiModels, as in the tests), every request recorded as it goes to
// the models (system, prompt, schema); no key, no network. `--count <before> <after>`: a sample of each task of both files counted
// with Gemini's countTokens (free, no generation), the key from the .env of --root.
// npx vite-node lab/scripts/prompt-tokens.ts -- --capture lab/out/prompts-it.json
// npx vite-node lab/scripts/prompt-tokens.ts -- --count lab/out/prompts-it.json lab/out/prompts-en.json [--root H:/projects/rune] [--per-task 2]
// npx vite-node lab/scripts/prompt-tokens.ts -- --roles eceb3b21 [--root H:/projects/rune]  # the fixed texts alone: roles, theme, principles, the Language block

import fs from 'node:fs';
import path from 'node:path';
import type { TextCall } from '../../src/kernel/ai/models';

const argv = process.argv.slice(2);
const opt = (n: string) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);

interface Recorded {
  agent: string;
  task: string;
  system: string;
  prompt: string;
  schema?: unknown;
}

async function capture(file: string): Promise<void> {
  const { Kernel } = await import('../../src/kernel/kernel');
  const { bundledFiles } = await import('../../src/kernel/bundle');
  const { memoryStore } = await import('../../src/kernel/repo');
  const { MockAiModels } = await import('../../src/kernel/ai/mock');
  const { WORLD_THEMES } = await import('../../src/kernel/themes');
  const recorded: Recorded[] = [];
  class Recording extends MockAiModels {
    async text(call: TextCall): Promise<string> {
      recorded.push({ agent: call.agent ?? '', task: call.task, system: call.system ?? '', prompt: call.prompt, ...(call.schema ? { schema: call.schema } : {}) });
      return super.text(call);
    }
  }
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new Recording() });
  await k.runGenesis(WORLD_THEMES[0].text);
  const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 300; i++) {
    k.tick(1 / 60);
    await settle(10);
  }
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(path.resolve(file), JSON.stringify(recorded, null, 1));
  const tasks = new Set(recorded.map((r) => r.task));
  console.log(`${recorded.length} richieste registrate, ${tasks.size} compiti: ${file}`);
}

async function count(before: string, after: string): Promise<void> {
  const root = path.resolve(opt('root') ?? '../../..');
  const key = /^GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync(path.join(root, '.env'), 'utf8'))?.[1]?.trim();
  if (!key) throw new Error('nessuna chiave');
  const perTask = Number(opt('per-task') ?? 2);
  const tokens = async (r: Recorded): Promise<number> => {
    // The response schema travels in generationConfig and counts as prompt: it goes in as text here.
    const parts = [{ text: r.prompt }, ...(r.schema ? [{ text: JSON.stringify(r.schema) }] : [])];
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:countTokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ generateContentRequest: { model: 'models/gemini-3.1-flash-lite', systemInstruction: { parts: [{ text: r.system }] }, contents: [{ role: 'user', parts }] } }),
    });
    const j = (await res.json()) as { totalTokens?: number };
    if (!res.ok || typeof j.totalTokens !== 'number') throw new Error(`countTokens ${res.status}`);
    return j.totalTokens;
  };
  const read = (f: string): Recorded[] => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));
  const a = read(before);
  const b = read(after);
  const group = (rs: Recorded[]) => rs.reduce((m, r) => m.set(r.task, [...(m.get(r.task) ?? []), r]), new Map<string, Recorded[]>());
  const ga = group(a);
  const gb = group(b);
  let sa = 0;
  let sb = 0;
  const rows: string[] = ['| compito | richieste | prima (token) | dopo (token) | differenza |', '|---|---:|---:|---:|---:|'];
  for (const task of [...ga.keys()].filter((t) => gb.has(t)).sort()) {
    const n = Math.min(perTask, ga.get(task)!.length, gb.get(task)!.length);
    const avg = async (rs: Recorded[]) => (await Promise.all(rs.slice(0, n).map(tokens))).reduce((x, y) => x + y, 0) / n;
    const ta = await avg(ga.get(task)!);
    const tb = await avg(gb.get(task)!);
    // Weighted by how many requests of the task a Genesis and its first places make.
    const calls = ga.get(task)!.length;
    sa += ta * calls;
    sb += tb * calls;
    rows.push(`| ${task} | ${calls} | ${Math.round(ta)} | ${Math.round(tb)} | ${(((tb - ta) / ta) * 100).toFixed(1)} % |`);
  }
  rows.push(`| **tutte, pesate** | ${a.length} | ${Math.round(sa)} | ${Math.round(sb)} | ${(((sb - sa) / sa) * 100).toFixed(1)} % |`);
  console.log(rows.join('\n'));
  const only = (x: Map<string, Recorded[]>, y: Map<string, Recorded[]>) => [...x.keys()].filter((t) => !y.has(t));
  if (only(ga, gb).length || only(gb, ga).length) console.log(`solo prima: ${only(ga, gb).join(', ') || '-'}; solo dopo: ${only(gb, ga).join(', ') || '-'}`);
}

/** The fixed texts alone: each agent's role, the theme, the principles at a git ref and now, and the Language block (which is new). */
async function roles(ref: string): Promise<void> {
  const { execSync } = await import('node:child_process');
  const { COUNCIL_PRINCIPLES } = await import('../../src/kernel/fourthwall');
  const { languageBlock } = await import('../../src/kernel/language');
  const root = path.resolve(opt('root') ?? '../../..');
  const key = /^GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync(path.join(root, '.env'), 'utf8'))?.[1]?.trim();
  if (!key) throw new Error('nessuna chiave');
  const tokens = async (text: string): Promise<number> => {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:countTokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }] }),
    });
    const j = (await res.json()) as { totalTokens?: number };
    if (!res.ok || typeof j.totalTokens !== 'number') throw new Error(`countTokens ${res.status}`);
    return j.totalTokens;
  };
  const at = (p: string) => execSync(`git show ${ref}:${p}`, { encoding: 'utf8' });
  const before = /export const COUNCIL_PRINCIPLES = `([\s\S]*?)`;/.exec(at('src/kernel/fourthwall.ts'))![1];
  const files = [...fs.readdirSync('universe/prompts/agents').map((f) => `universe/prompts/agents/${f}`), 'universe/prompts/theme.md'];
  const rows: string[] = ['| testo | prima (token) | dopo (token) | differenza |', '|---|---:|---:|---:|'];
  let sa = 0;
  let sb = 0;
  for (const [name, a, b] of [['COUNCIL_PRINCIPLES', before, COUNCIL_PRINCIPLES], ...files.map((f) => [f.replace('universe/', ''), at(f), fs.readFileSync(f, 'utf8')])]) {
    const [ta, tb] = [await tokens(a), await tokens(b)];
    sa += ta;
    sb += tb;
    rows.push(`| ${name} | ${ta} | ${tb} | ${(((tb - ta) / ta) * 100).toFixed(1)} % |`);
  }
  rows.push(`| **testi fissi** | ${sa} | ${sb} | ${(((sb - sa) / sa) * 100).toFixed(1)} % |`);
  rows.push(`| blocco «Lingua» (nuovo, con ogni richiesta) | — | ${await tokens(languageBlock('it'))} | |`);
  console.log(rows.join('\n'));
}

if (opt('capture')) await capture(opt('capture')!);
else if (argv.includes('--count')) await count(argv[argv.indexOf('--count') + 1], argv[argv.indexOf('--count') + 2]);
else if (opt('roles')) await roles(opt('roles')!);
else console.log('uso: --capture <file> | --count <prima> <dopo> | --roles <ref git>');
