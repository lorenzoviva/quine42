// The parts of the world (T472, S6 of T458, ADR-0243), offline: what the local Sculptor cuts from the programs of the seed (`mockPart`, the
// last rule node of a root `<sequence>`), whether each program rewritten with its part makes the same grid on every seed the world gives it
// (`sameGridErrors`), and what it costs in tokens: the request of `model.part` as it goes to the models (its system, the Sculptor's of the trade;
// the program with its lines numbered) and the line a part adds to every request of its trade (`worldPartResources`). Tokens at 3.5 characters
// each, or with --conta Gemini's countTokens (free, the key from the .env of --root, never printed); the dollars on each class's Sculptor at
// the lobby's share of the implicit cache.
//
//   npx vite-node lab/scripts/parti-mondo.ts -- [--conta] [--root ../../..] [--scrivi docs/design/scultori-specializzati/misure-s6.md]

import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels, mockPart } from '../../src/kernel/ai/mock';
import type { TextCall } from '../../src/kernel/ai/models';
import { costOf } from '../../src/kernel/ai/prices';
import { CALL_TOKENS, implicitCacheShare } from '../../src/kernel/coefficients';
import { DEFAULT_SCULPTORS, categoryOf, specialtyOf, SPECIALTY_NAMES } from '../../src/kernel/agents/sculptor';
import { extractPart, PART_SEEDS, sameGridErrors } from '../../src/kernel/agents/parts';
import { composePart, partContract, readPartAnswer } from '../../src/kernel/worldparts';
import { classOf } from '../../src/mj/classes';

const argv = process.argv.slice(2);
const opt = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const counting = argv.includes('--conta');
const key = counting ? /^GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync(path.join(path.resolve(opt('root') ?? '../../..'), '.env'), 'utf8'))?.[1]?.trim() : undefined;
if (counting && !key) throw new Error('nessuna chiave');
const counted = new Map<string, number>();
async function tokens(text: string): Promise<number> {
  if (!text.trim()) return 0;
  if (!key) return Math.round(text.length / 3.5);
  const seen = counted.get(text);
  if (seen !== undefined) return seen;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:countTokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }] }),
    });
    const j = (await res.json().catch(() => ({}))) as { totalTokens?: number };
    if (res.ok && typeof j.totalTokens === 'number') {
      counted.set(text, j.totalTokens);
      return j.totalTokens;
    }
    if (attempt >= 4 || !(res.status === 429 || res.status >= 500)) throw new Error(`countTokens ${res.status}`);
    await new Promise((ok) => setTimeout(ok, 2000 * (attempt + 1)));
  }
}

const recorded: TextCall[] = [];
class Recording extends MockAiModels {
  async text(call: TextCall): Promise<string> {
    recorded.push(call);
    return super.text(call);
  }
}
const ai = new Recording();
ai.parts = true;
ai.latency = 0;
const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
const index = JSON.parse(bundledFiles['models/index.json']) as Record<string, { class?: string; name?: string; size?: string }>;

interface Row {
  id: string;
  cls: string;
  trade: string;
  lines: string;
  seeds: number;
  same: boolean;
  request: number;
  system: number;
  line: number;
  usd: number;
}
const rows: Row[] = [];
let tried = 0;
for (const [id, info] of Object.entries(index)) {
  const cls = classOf(info.class);
  if (!cls || /^(part-|corona-|schermo-|circuito-|sound-)/.test(id)) continue;
  tried++;
  const xml = k.files[`models/${id}.xml`];
  const raw = mockPart(xml, info.name ?? id);
  const answer = readPartAnswer(raw);
  if (answer === 'none' || 'error' in answer) continue;
  const made = composePart(xml, answer, { id, name: info.name ?? id });
  if ('error' in made) continue;
  const seeds = Math.max(PART_SEEDS, k.forms.seedsOf(id));
  const same = !(await sameGridErrors(k.forms, id, made, seeds)).length;
  // The request as it goes to the models: the kernel is asked nothing (the take answers at once).
  recorded.length = 0;
  const trade = specialtyOf(cls, { ...(info.size ? { taglia: info.size as never } : {}) });
  const model = DEFAULT_SCULPTORS[categoryOf(cls)];
  await extractPart(k.council, { id, xml, nome: info.name ?? id, classe: cls.id, score: 7 }, model, async () => ({ error: 'misura', final: true }));
  const call = recorded.find((c) => c.task === 'model.part')!;
  const system = await tokens(call.system ?? '');
  const request = system + (await tokens(call.prompt));
  const line = await tokens(`- <import file="${made.id}"/> (from «${info.name ?? id}»): ${partContract(made.part)}`);
  const cached = Math.round(system * implicitCacheShare(model));
  const usd = costOf(model, { prompt: request, cached, output: CALL_TOKENS['model.part'].output }) ?? 0;
  rows.push({ id, cls: cls.id, trade: SPECIALTY_NAMES[trade], lines: `${made.from}-${made.to}`, seeds, same, request, system, line, usd });
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const out = [
  `# Le parti del mondo offline (T472, S6 di T458)`,
  '',
  `Data: ${new Date().toISOString().slice(0, 10)} · \`npx vite-node lab/scripts/parti-mondo.ts --${counting ? ' --conta' : ''}\` · token ${counting ? 'di `countTokens` (Gemini, gratis)' : 'a 3,5 caratteri l’uno'} · nessuna chiamata ai modelli.`,
  '',
  `Lo Scultore locale (\`mockPart\`: l'ultimo nodo di regole della \`<sequence>\` radice) taglia una parte da ${rows.length} dei ${tried} programmi del seme che sono cose del mondo; `,
  `${rows.filter((r) => r.same).length} su ${rows.length} danno la stessa griglia, voxel per voxel, su ogni seme che il mondo dà loro (tre almeno). La richiesta di \`model.part\` è in media `,
  `${Math.round(mean(rows.map((r) => r.request)))} token (${Math.round(mean(rows.map((r) => r.system)))} di sistema, il prefisso che la cache serve alle sculture dello stesso mestiere), `,
  `${(mean(rows.map((r) => r.usd)) * 1000).toFixed(2)} millesimi di dollaro sul modello della classe con ${CALL_TOKENS['model.part'].output} token di uscita; la riga che una parte aggiunge a ogni richiesta del suo mestiere `,
  `${Math.round(mean(rows.map((r) => r.line)))} token in media (al più ${Math.max(0, ...rows.map((r) => r.line))}).`,
  '',
  '| modello | classe | mestiere | righe | semi | stessa griglia | richiesta | sistema | riga | $ |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.cls} | ${r.trade} | ${r.lines} | ${r.seeds} | ${r.same ? 'sì' : '**no**'} | ${r.request} | ${r.system} | ${r.line} | ${r.usd.toFixed(5)} |`),
  '',
]
  .join('\n')
  .replace(/ +$/gm, '');
const file = opt('scrivi');
if (file) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(path.resolve(file), out);
  console.log(`scritto ${file}`);
}
console.log(out);
