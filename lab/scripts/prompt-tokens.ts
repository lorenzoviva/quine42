// How many tokens the Council's requests cost before and after a change of their prompts (T310: the prompts in English).
// `--capture <file>`: a Genesis and the first places offline (MockAiModels, as in the tests), every request recorded as it goes to
// the models (system, prompt, schema); no key, no network. `--count <before> <after>`: a sample of each task of both files counted
// with Gemini's countTokens (free, no generation), the key from the .env of --root.
// npx vite-node lab/scripts/prompt-tokens.ts -- --capture lab/out/prompts-it.json
// npx vite-node lab/scripts/prompt-tokens.ts -- --count lab/out/prompts-it.json lab/out/prompts-en.json [--root H:/projects/rune] [--per-task 2]
// npx vite-node lab/scripts/prompt-tokens.ts -- --roles eceb3b21 [--root H:/projects/rune]  # the fixed texts alone: roles, theme, principles, the Language block
// npx vite-node lab/scripts/prompt-tokens.ts -- --cache [--persone 6] [--ore 1] [--json f]  # the Actor's explicit cache (T351), offline: its requests
//   recorded after an offline Genesis, the cache's policy (ExplicitCaches) at the pace of an hour of HOUR, the tokens and dollars it saves

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

/**
 * The Actor's explicit cache (T351, ADR-0186), offline: an offline Genesis, then the Actor's requests (`npc.reply` and `npc.dialogue`,
 * with its sheet) for some people, recorded as they go to the models; the policy of the cache (ExplicitCaches, the real one) on a clock
 * at the pace of an hour of HOUR (the wanderer's words and the dialogues the lobby counts); tokens at T325's 3.26 characters each.
 * What the hour costs on 3.8 Flash without the cache and with it (its writes and storage included), and what it saves.
 */
async function cacheSaving(): Promise<void> {
  const { Kernel } = await import('../../src/kernel/kernel');
  const { bundledFiles } = await import('../../src/kernel/bundle');
  const { memoryStore } = await import('../../src/kernel/repo');
  const { WORLD_THEMES } = await import('../../src/kernel/themes');
  const { npcReply, npcDialogue } = await import('../../src/kernel/agents/minds');
  const { readPeople } = await import('../../src/kernel/npc/society');
  const { ExplicitCaches } = await import('../../src/kernel/ai/cache');
  const { costOf, EXPLICIT_CACHE } = await import('../../src/kernel/ai/prices');
  const { ACTOR_MODEL, hourlyEstimate } = await import('../../src/kernel/coefficients');
  // T325's recorder: the local models answer, under a name that is not `offline`, so the kernel meets people as with Gemini.
  const { explore, RecordingModels } = await import('../banco/jev/casi-d-uso/registratore');
  const rec = new RecordingModels('seme');
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: rec });
  await k.runGenesis(WORLD_THEMES[0].text);
  // Some places in a spiral, as T325's walk: the people are met there.
  await explore(k, rec, Number(opt('luoghi') ?? 24));
  const before = rec.calls.length;
  // The people met: those of the file, or the identities of the entities when the file is not written yet.
  const filed = readPeople(k.council.files).people.filter((p) => p.name);
  const people = filed.length ? filed : k.ecs.query('identity').map((id) => k.ecs.get(id, 'identity') as (typeof filed)[number]).filter((p) => p?.name);
  const cast = people.slice(0, Math.max(2, Number(opt('persone') ?? 6)));
  if (cast.length < 2) throw new Error(`troppo poche persone dopo la Genesi offline: ${people.length}`);
  const by = { agent: 'actor' as const, model: ACTOR_MODEL };
  type Person = (typeof cast)[number];
  const sheetOf = (p: Person) => p.sheet?.text ?? `Sei ${p.name}, ${p.job ?? 'abitante'}. Parli poco e guardi molto; ti fidi di chi ti aiuta e ricordi i torti.`;
  const words = ['ciao', 'come va il lavoro?', 'hai visto qualcosa di strano stanotte?', 'mi dai una mano?'];
  for (const p of cast)
    for (const w of words) await npcReply(k.council, { name: p.name, persona: p.persona ?? '', sheet: sheetOf(p), mood: 'calmo', mode: 'wander', carrying: [], place: p.place ?? '', history: [], facts: {} }, w, [p.name], by);
  const two = (p: Person) => ({ name: p.name, job: p.job ?? 'abitante', sheet: sheetOf(p), does: 'lavora', memories: '', secrets: '' });
  for (let i = 0; i + 1 < cast.length; i++) await npcDialogue(k.council, two(cast[i]), two(cast[i + 1]), cast[i].place ?? 'piazza', [cast[i].name, cast[i + 1].name], by);
  const recorded: Recorded[] = rec.calls.slice(before).filter((c) => c.agent === 'actor');

  const tok = (t: string) => t.length / 3.26;
  // The pace: what the lobby counts in an hour for the words to people and the dialogues, every knob at 1, the Actor on.
  const est = hourlyEstimate({ textModel: 'gemini-3.1-flash-lite', budget: { text: 1000 }, maxForges: 4, actor: { on: true, model: ACTOR_MODEL } } as never);
  const rate = est.righe.filter((r) => /Risposte degli individui|Dialoghi/.test(r.voce)).reduce((a, r) => a + r.chiamate, 0);
  const hours = Number(opt('ore') ?? 1);
  const calls = Math.round(rate * hours);
  let now = 0;
  let writes = 0;
  let stored = 0;
  let writeTokens = 0;
  const caches = new ExplicitCaches({
    now: () => now,
    write: async (_m, system, ttl) => {
      writes++;
      writeTokens += tok(system);
      stored += tok(system) * (ttl / 3600);
      return { name: `cachedContents/w${writes}` };
    },
  });
  const OUT = 500;
  let whole = 0;
  let served = 0;
  let without = 0;
  let withCache = 0;
  for (let i = 0; i < calls; i++) {
    now = Math.round((i * 3600_000 * hours) / calls);
    const r = recorded[i % recorded.length];
    const sys = tok(r.system);
    const all = sys + tok(r.prompt);
    const name = await caches.nameFor(ACTOR_MODEL, r.system, 'actor');
    whole += all;
    if (name) served += sys;
    without += costOf(ACTOR_MODEL, { prompt: all, output: OUT })!;
    withCache += costOf(ACTOR_MODEL, { prompt: all, cached: name ? sys : 0, output: OUT })!;
  }
  const cacheCost = costOf(ACTOR_MODEL, { prompt: writeTokens, output: 0, stored })!;
  withCache += cacheCost;
  const avg = (f: (r: Recorded) => number) => Math.round(recorded.reduce((a, r) => a + f(r), 0) / recorded.length);
  const round = (v: number) => Math.round(v * 1e4) / 1e4;
  const out = {
    richieste: recorded.length,
    persone: cast.length,
    prefissi: new Set(recorded.map((r) => r.system)).size,
    tokenPerRichiesta: avg((r) => tok(r.system) + tok(r.prompt)),
    tokenPrefisso: avg((r) => tok(r.system)),
    chiamateOra: Math.round(rate * 10) / 10,
    ore: hours,
    ttl: EXPLICIT_CACHE.ttl,
    scritture: writes,
    tokenServiti: Math.round(served),
    tokenInIngresso: Math.round(whole),
    dollariSenzaCache: round(without),
    dollariConCache: round(withCache),
    dollariDellaCache: round(cacheCost),
    risparmio: round(without - withCache),
    risparmioQuota: Math.round(((without - withCache) / without) * 100),
  };
  console.log(
    [
      '| misura | valore |',
      '|---|---:|',
      `| richieste dell'Attore registrate (risposte e dialoghi, ${out.persone} persone) | ${out.richieste} |`,
      `| prefissi diversi (system) | ${out.prefissi} |`,
      `| token per richiesta, di cui il prefisso | ${out.tokenPerRichiesta}, ${out.tokenPrefisso} (${Math.round((out.tokenPrefisso / out.tokenPerRichiesta) * 100)} %) |`,
      `| chiamate dell'Attore in un'ora (HOUR, manopole a 1) | ${out.chiamateOra} |`,
      `| scritture della cache in ${hours} h (ttl ${out.ttl} s) | ${out.scritture} |`,
      `| token in ingresso serviti dalla cache | ${out.tokenServiti} su ${out.tokenInIngresso} (${Math.round((served / whole) * 100)} %) |`,
      `| dollari senza cache (uscita ${OUT} token a chiamata) | ${out.dollariSenzaCache} |`,
      `| dollari con la cache (di cui scritture e conservazione ${out.dollariDellaCache}) | ${out.dollariConCache} |`,
      `| **risparmio** | **${out.risparmio} $ (${out.risparmioQuota} %)** |`,
    ].join('\n'),
  );
  if (opt('json')) fs.writeFileSync(path.resolve(opt('json')!), JSON.stringify(out, null, 1) + '\n');
}

if (opt('capture')) await capture(opt('capture')!);
else if (argv.includes('--cache')) await cacheSaving();
else if (argv.includes('--count')) await count(argv[argv.indexOf('--count') + 1], argv[argv.indexOf('--count') + 2]);
else if (opt('roles')) await roles(opt('roles')!);
else console.log('uso: --capture <file> | --count <prima> <dopo> | --roles <ref git> | --cache [--persone 6] [--ore 1] [--json f]');
