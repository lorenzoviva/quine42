// The game's Sculptor on Gemini with the prompt without a skeleton (T355, passo 3 di D48, ADR-0183): the fort and the farm asked as the
// ModelDirector asks a structure, through `sculpt` itself (the two blocks with the text views, the fixes, the Artist's vote and the revision),
// once at Large (3.8 Flash) and once at Huge (Argon, the important structures). Each program then runs at the three sizes and two seeds with
// the bench's measures (`lab/banco/taglie/misure.ts`), the kernel's check and photos. Every call is kept, with its cost.
// T391: the same round with other Sculptors at every size (`--modelli`), Gemini through the key, Claude through the isolated CLI of the
// subscriptions (`lab/scripts/claude-cli.ts`) with the Artist still on Gemini, and the table of every model against T355's.
// T397: `--via openrouter` sends the Sculptor's calls to OpenRouter through the game's own adapter (OpenRouterAiModels: the schema, the
// reasoning, the system instructions in the cache, the cost it says), with OPENROUTER_API_KEY from <root>/.env; the Artist stays on Gemini.
// Then --tetto counts OpenRouter's dollars as well. --offline answers with a fake OpenRouter (the offline Sculptor's program, a cost of 0).
//
//   npx vite-node lab/scripts/scultore-gemini.ts -- [--root ../../..] [--giro giro1] [--pensiero low|medium|high] [--scultore <modello>] [--solo forte,fattoria] [--taglie large,huge] [--tetto 10] [--out lab/banco/taglie/gemini]
//   npx vite-node lab/scripts/scultore-gemini.ts -- --modelli gemini-4-carbon,claude-sonnet-5-5 [--ripeti 2] [--sforzo low] [--cli-cmd "claude"] [--senza-immagini] [--finestra 80] [--offline] --out lab/banco/taglie/modelli
//   npx vite-node lab/scripts/scultore-gemini.ts -- --modelli claude-opus-5-5 --via openrouter --tetto 4 [--offline] --out lab/banco/taglie/modelli/openrouter
//   npx vite-node lab/scripts/scultore-gemini.ts -- --misura [--out lab/banco/taglie/gemini]     # no call: measures and photographs the programs kept
//   npx vite-node lab/scripts/scultore-gemini.ts -- --concetti                                   # no call: concepts against seeds (T337), Gemini's and the hand-written
//   npx vite-node lab/scripts/scultore-gemini.ts -- --tabella --out lab/banco/taglie/modelli     # no call: the table of every model (and T355's), → <out>/tabella.md
//
// → <out>/<giro>/<concetto>-<taglia>/{chiamate/<n>-<compito>.md, programma.xml, esito.json, <taglia del giro>.png}, <out>/<giro>/misure.json;
//   with --modelli <out>/<modello>/giro<n>/… instead, and <out>/settimana.json (Claude's week and 5-hour window before and after).
// The key is read from <root>/.env and sent only to Google; it is never printed nor written. --tetto is in dollars at list price on the whole
// register of <out> (every esito.json in it, this run included), counted on Gemini's calls only: past it every call to Gemini throws.
// The calls on Claude's subscription stop when its 5-hour window is over 80 % (`/usage`, read at most once a minute).

import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import { callCost, UsageLog, tallyLine, usd, type CallRecord } from '../../src/kernel/ai/usage';
import type { AiModels, TextCall, Thinking } from '../../src/kernel/ai/models';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { checkProgram, DEFAULT_SCULPTORS, sculpt, STRUCTURE_SEEDS, type SculptorAiModels, type SculptRequest } from '../../src/kernel/agents/sculptor';
import { structureModel } from '../../src/kernel/modeldirector';
import { classOf, SIZE_TIERS, tilesOf, voxelsOf, type SizeTier } from '../../src/mj/classes';
import { varietyError, type Composition } from '../../src/mj/check';
import { compileMjx, mjxIncludes, type MjxFiles } from '../../src/mj/model';
import { cartoonRender, render, sheet, type Picture } from '../../src/mj/photo';
import { animalLetters, giro, merlonRuns, riga } from '../banco/taglie/misure';
import { confronta, formaDi, type Gruppo } from '../banco/concetti';
import { MOCK_STRUCTURE_PROGRAM } from '../../src/kernel/ai/mockStructure';
import { runMjx } from '../../src/mj/run';
import { direct, readKey } from './gemini';
import { claudeCliModels, readWindow, routed, type ClaudeCall, type ClaudeWindow } from './claude-cli';
import { OPENROUTER_API, OPENROUTER_MODELS, OpenRouterAiModels } from '../../src/kernel/ai/openrouter';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const BASE = path.resolve(opt('out') ?? 'lab/banco/taglie/gemini');
/** The thinking of the calls: the game's is `low` (`universe.json → ai`). */
const PENSIERO = (opt('pensiero') ?? 'low') as Thinking;
/** The effort of the CLI of Claude: the game's thinking unless said. */
const SFORZO = opt('sforzo') ?? PENSIERO;
/** The CLI of Claude (a fake one for the offline proof, `lab/scripts/claude-finta.mjs`). */
const CLI_CMD = opt('cli-cmd');
/** No paid call: the Artist and everything not on the CLI answer offline (`MockAiModels`). */
const OFFLINE = args.includes('--offline');
const STRUCTURE = classOf('structure')!;
const TAGLIE: SizeTier[] = ['large', 'huge', 'gargantuan'];
const SEMI = Number(opt('semi') ?? 2);
/** Dollars at list price on the whole register of BASE, Gemini's calls only (T391: 10 $). */
const TETTO = Number(opt('tetto') ?? 10);
/** The 5-hour window of Claude past which the calls on the subscription stop (per cent used). */
const FINESTRA = Number(opt('finestra') ?? 80);
/** The Sculptor of the round through OpenRouter, the game's adapter (T397), instead of the CLI of the subscriptions. */
const VIA_OPENROUTER = opt('via') === 'openrouter';
/** Whether a Sculptor of the round goes to OpenRouter: asked so, and on the adapter's list. */
const onOpenRouter = (model?: string): boolean => VIA_OPENROUTER && !!model && Object.prototype.hasOwnProperty.call(OPENROUTER_MODELS, model);
/** Whether a Sculptor of the round goes to the CLI of Claude's subscription. */
const onCli = (model?: string): boolean => !!model?.startsWith('claude-') && !onOpenRouter(model);

/** OPENROUTER_API_KEY from the environment or from <root>/.env: never printed nor written. */
function openRouterKey(root: string): string | undefined {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  try {
    return /^OPENROUTER_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync(path.join(root, '.env'), 'utf8'))?.[1]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/** A fake OpenRouter (--offline): the offline Sculptor's program (the cottage of ADR-0183) as a chat completion, a cost of 0, about the tokens asked. */
function fakeOpenRouter(): typeof fetch {
  return (async (_url: RequestInfo | URL, init?: RequestInit) => {
    const text = `\`\`\`xml\n${MOCK_STRUCTURE_PROGRAM}\n\`\`\``;
    const tokens = Math.round(String(init?.body ?? '').length / 4);
    return new Response(JSON.stringify({ choices: [{ message: { content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: tokens, completion_tokens: Math.round(text.length / 4), cost: 0 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
}

/** The Sculptor's calls of a model on OpenRouter to `openrouter`, the rest as they were. */
function viaOpenRouter(rest: AiModels, openrouter: (call: TextCall) => Promise<string>): AiModels {
  return {
    name: rest.name,
    get usage() { return rest.usage; },
    limits: rest.limits,
    textModel: rest.textModel,
    text: (call: TextCall) => (call.agent === 'sculptor' && onOpenRouter(call.model) ? openrouter(call) : rest.text(call)),
  };
}

/** A Sculptor at every size (the structures' model and the important ones'), the rest of the game's. */
const sculptors = (model?: string): SculptorAiModels => (model ? { ...DEFAULT_SCULPTORS, structure: model, important: model } : DEFAULT_SCULPTORS);

/** As the ModelDirector words a structure (`modeldirector.ts`, the Cartographer's concept without a place). */
const CONCETTI = ['forte', 'fattoria'];
const request = (concept: string, taglia: SizeTier): SculptRequest => ({
  id: structureModel(concept, taglia),
  nome: concept,
  aspetto: `${concept}: a building one enters, with the door at the front`,
  classe: 'structure',
  taglia,
});

const seedFiles = (xml: string): MjxFiles => mjxIncludes(xml, (f) => (fs.existsSync(`universe/models/${f}`) ? fs.readFileSync(`universe/models/${f}`, 'utf8') : undefined));

/** Every `esito.json` under a folder. */
function esitiIn(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? esitiIn(p) : e.name === 'esito.json' ? [p] : [];
  });
}

/** A structure whose Sculptor on Claude never answered: every call of it failed without a token (the model is not reachable, or the window stopped it). */
const unreachable = (e: Esito): boolean =>
  !!e.errore?.includes('finestra delle 5 ore') || (!!e.claude?.length && e.claude.every((c) => !!c.errore && !c.output && !c.input));

/** What Gemini cost in an esito (T355's had no split: they were all Gemini), and OpenRouter (T397): what the register's cap counts. */
const geminiOf = (e: Partial<Esito>): number => (e.usdGemini ?? (e.usdClaude || e.usdOpenRouter ? 0 : (e.usd ?? 0))) + (e.usdOpenRouter ?? 0);

/** The register: Gemini's dollars already in BASE (the folders this run rewrites excluded) and the ones of this run, as they come. */
const register = {
  before: 0,
  live: new UsageLog(),
  spent() { return this.before + this.live.total().usd; },
};

/** Claude's window, read at most once a minute; why the calls on the subscription stop, once it is over. */
const windowState: { last?: ClaudeWindow; at: number; stop?: string; reads: ClaudeWindow[] } = { at: 0, reads: [] };
function claudeGate(): string | undefined {
  if (windowState.stop || OFFLINE) return windowState.stop;
  if (Date.now() - windowState.at > 60_000) {
    windowState.at = Date.now();
    const w = readWindow();
    if (w) {
      windowState.last = w;
      windowState.reads.push(w);
    }
  }
  const s = windowState.last?.session;
  if (s !== undefined && s > FINESTRA) windowState.stop = `finestra delle 5 ore di Claude al ${s} % (oltre ${FINESTRA} %): il giro si ferma`;
  return windowState.stop;
}

/** Every call written down as it went: the task, the model, the prompt and the answer (the system once, it is the same). */
function logged(inner: AiModels, dir: string): AiModels {
  let n = 0;
  const calls = path.join(dir, 'chiamate');
  fs.mkdirSync(calls, { recursive: true });
  return {
    name: inner.name,
    get usage() { return inner.usage; },
    limits: inner.limits,
    textModel: inner.textModel,
    async text(call: TextCall) {
      const toClaude = call.agent === 'sculptor' && onCli(call.model);
      const spent = register.spent();
      if (!toClaude && !OFFLINE && spent > TETTO) throw new Error(`tetto del registro: ${usd(spent)} di Gemini oltre ${usd(TETTO)}`);
      const i = ++n;
      const file = path.join(calls, `${String(i).padStart(2, '0')}-${call.task}.md`);
      const sys = path.join(calls, `sistema-${call.agent}.md`);
      if (!fs.existsSync(sys)) fs.writeFileSync(sys, call.system);
      const t0 = Date.now();
      try {
        const out = await inner.text(call);
        fs.writeFileSync(file, `# ${call.task} · ${call.model ?? inner.textModel} · ${((Date.now() - t0) / 1000).toFixed(0)} s${call.images?.length ? ` · ${call.images.length} immagini` : ''}\n\n## Richiesta\n\n${call.prompt}\n\n## Risposta\n\n${out}\n`);
        return out;
      } catch (e) {
        fs.writeFileSync(file, `# ${call.task} · ${call.model ?? inner.textModel} · errore dopo ${((Date.now() - t0) / 1000).toFixed(0)} s\n\n## Richiesta\n\n${call.prompt}\n\n## Errore\n\n${(e as Error).message}\n`);
        throw e;
      }
    },
  };
}

interface Esito {
  concetto: string;
  taglia: SizeTier;
  /** The Sculptor asked for (T391); `modello` is who wrote the program kept. */
  scultore?: string;
  modello?: string;
  voto?: number;
  chiamate: number;
  secondi: number;
  usd: number;
  /** Of `usd`: Gemini's calls (the Artist's, and the Sculptor's on Gemini) and Claude's at Anthropic's API list (T391). */
  usdGemini?: number;
  usdClaude?: number;
  /** What the CLI itself said Claude's calls cost. */
  usdCli?: number;
  /** Of `usd`: the Sculptor's calls through OpenRouter, as it said them (T397), and the route. */
  usdOpenRouter?: number;
  via?: 'openrouter';
  /** The Sculptor's calls through OpenRouter one by one: tokens, the cache read, the cost said, the seconds. */
  openrouter?: Array<{ prompt: number; cached: number; output: number; thoughts: number; usd?: number; seconds: number; failed?: string }>;
  token: { prompt: number; output: number; thoughts: number };
  perCompito: Array<{ model: string; task: string; calls: number; usd: number }>;
  /** Claude's calls one by one (T391). */
  claude?: ClaudeCall[];
  errore?: string;
}

async function scolpisci(key: string | undefined, out: string, concept: string, taglia: SizeTier, scultore?: string, orKey?: string): Promise<Esito> {
  const dir = path.join(out, `${concept}-${taglia}`);
  fs.rmSync(path.join(dir, 'chiamate'), { recursive: true, force: true });
  fs.rmSync(path.join(dir, 'programma.xml'), { force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ledger = new UsageLog();
  let usdGemini = 0;
  let usdOpenRouter = 0;
  const orCalls: NonNullable<Esito['openrouter']> = [];
  let orStart = Date.now();
  const record = (r: CallRecord) => {
    ledger.record(r);
    if (r.model.startsWith('claude-')) return;
    register.live.record(r);
    // OpenRouter's ids of Anthropic's models (`anthropic/…`, T397): what it said, in its own column.
    if (r.model.startsWith('anthropic/')) {
      usdOpenRouter += callCost(r) ?? 0;
      orCalls.push({ prompt: r.prompt, cached: r.cached, output: r.output, thoughts: r.thoughts, ...(r.usd !== undefined ? { usd: r.usd } : {}), seconds: Math.round((Date.now() - orStart) / 1000), ...(r.failed ? { failed: r.failed } : {}) });
      return;
    }
    usdGemini += callCost(r) ?? 0;
  };
  // The game's models: the Sculptor's per call (`model` of the call), the thinking of `universe.json → ai`.
  let rest: AiModels;
  if (OFFLINE || !key) {
    rest = new MockAiModels();
  } else {
    const g = direct(DEFAULT_SCULPTORS.structure, key, ledger, { thinking: PENSIERO, timeout: 600_000, max: 40 });
    g.onCall = record;
    rest = g;
  }
  const claude: ClaudeCall[] = [];
  const cli = claudeCliModels({ cmd: CLI_CMD, effort: SFORZO, gate: claudeGate, images: !args.includes('--senza-immagini'), onCall: (c, r) => { claude.push(c); record(r); } });
  let ai = onCli(scultore) ? routed(rest, cli) : rest;
  if (onOpenRouter(scultore)) {
    // The game's adapter, with ten minutes of patience instead of the game's 120 s: the bench measures how long, the table says what the game would drop.
    const or = new OpenRouterAiModels({
      endpoint: OPENROUTER_API,
      textModel: scultore!,
      limits: { text: 40 },
      thinking: PENSIERO,
      timeout: 600_000,
      fetchImpl: OFFLINE ? fakeOpenRouter() : (url, init) => fetch(url, { ...init, headers: { ...(init?.headers as Record<string, string>), Authorization: `Bearer ${orKey}`, 'X-Title': 'QUINE42 banco' } }),
    });
    or.onCall = record;
    // One call at a time per structure (the blocks and the fixes follow each other): its seconds from when it was asked.
    ai = viaOpenRouter(rest, (call) => {
      orStart = Date.now();
      return or.text(call);
    });
  }
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: logged(ai, dir) });
  // The kernel gives every call of the Council its `ai.thinking` (T247): the round's goes there, not to the models.
  k.council.thinking = () => PENSIERO;
  const feed: string[] = [];
  k.council.onFeed = (e) => {
    const line = `[${e.from}${e.to ? ` → ${e.to}` : ''}] ${e.kind}: ${e.text}`;
    feed.push(line);
    console.log(`  ${path.basename(out)} ${concept}-${taglia} ${line.slice(0, 200)}`);
  };
  const t0 = Date.now();
  let r: Awaited<ReturnType<typeof sculpt>>;
  let errore: string | undefined;
  try {
    r = await sculpt(k.council, request(concept, taglia), sculptors(scultore));
  } catch (e) {
    errore = (e as Error).message;
  }
  const secondi = Math.round((Date.now() - t0) / 1000);
  if (r!) fs.writeFileSync(path.join(dir, 'programma.xml'), r.xml);
  fs.writeFileSync(path.join(dir, 'registro.txt'), feed.join('\n') + '\n');
  const tot = ledger.total();
  const day = ledger.tasks();
  const usdClaude = claude.reduce((s, c) => s + (c.usd ?? 0), 0);
  const usdCli = claude.reduce((s, c) => s + (c.usdCli ?? 0), 0);
  const esito: Esito = {
    concetto: concept,
    taglia,
    ...(scultore ? { scultore } : {}),
    ...(r! ? { modello: r.model, ...(r.score !== undefined ? { voto: r.score } : {}) } : {}),
    chiamate: tot.calls,
    secondi,
    usd: Number(tot.usd.toFixed(4)),
    usdGemini: Number(usdGemini.toFixed(4)),
    ...(claude.length ? { usdClaude: Number(usdClaude.toFixed(4)), usdCli: Number(usdCli.toFixed(4)), claude } : {}),
    ...(onOpenRouter(scultore) ? { via: 'openrouter' as const, usdOpenRouter: Number(usdOpenRouter.toFixed(4)), openrouter: orCalls } : {}),
    token: { prompt: tot.prompt, output: tot.output, thoughts: tot.thoughts },
    perCompito: day.map((t) => ({ model: t.model, task: t.task, calls: t.tally.calls, usd: Number(t.tally.usd.toFixed(4)) })),
    ...(errore ? { errore } : !r! ? { errore: 'nessun programma valido' } : {}),
  };
  fs.writeFileSync(path.join(dir, 'esito.json'), JSON.stringify(esito, null, 1));
  console.log(`${path.basename(out)} ${concept}-${taglia}: ${r! ? `fatto (${r.model}, voto ${r.score ?? '—'})` : `NON riuscito (${esito.errore})`} in ${secondi} s · ${tallyLine(tot)}`);
  return esito;
}

/** Pictures one under the other. */
function stack(rows: Picture[]): Picture {
  const w = Math.max(...rows.map((p) => p.w));
  const h = rows.reduce((s, p) => s + p.h, 0);
  const data = new Uint8ClampedArray(w * h * 4);
  let oy = 0;
  for (const p of rows) {
    for (let y = 0; y < p.h; y++) data.set(p.data.subarray(y * p.w * 4, (y + 1) * p.w * 4), ((oy + y) * w) * 4);
    oy += p.h;
  }
  return { w, h, data };
}

/**
 * Whether a program is fortified: the merlons it draws at Huge with the seed 1 (`merlonRuns` of every letter its palette names a merlon). Not what
 * it includes: a farm may import the battlements of the seed and draw none (T391).
 */
const fortifiedSeen = new Map<string, boolean>();
export function fortified(xml: string): boolean {
  const seen = fortifiedSeen.get(xml);
  if (seen !== undefined) return seen;
  const model = compileMjx(xml.replace(/^\s*<!--[\s\S]*?-->\s*/, ''), { size: voxelsOf(tilesOf(STRUCTURE, 'huge'), 20), files: seedFiles(xml) });
  const grid = runMjx(model, 1, { deadline: 30_000 }).grid;
  const letters = Object.entries(model.program.palette).filter(([, v]) => /merl|battlement|crenel/i.test(v.name ?? '')).map(([k]) => k);
  const yes = letters.some((l) => Object.keys(merlonRuns(grid, l)).length > 0);
  fortifiedSeen.set(xml, yes);
  return yes;
}

/** A program kept: the three sizes, the seeds, the kernel's check at its own size, the photos (a row per seed, four sides). */
function misura(dir: string, taglia: SizeTier): Record<string, unknown> | undefined {
  const file = path.join(dir, 'programma.xml');
  if (!fs.existsSync(file)) return undefined;
  const xml = fs.readFileSync(file, 'utf8');
  const files = seedFiles(xml);
  const righe: Record<string, unknown> = {};
  const prima: Record<string, Composition> = {};
  console.log(`\n${path.basename(dir)} (include ${Object.keys(files).join(', ') || 'niente'})`);
  for (const t of TAGLIE) {
    const box = voxelsOf(tilesOf(STRUCTURE, t), 20);
    let model;
    try {
      model = compileMjx(xml, { size: box, files });
    } catch (e) {
      console.log(`   ${t}: non compila: ${(e as Error).message}`);
      righe[t] = { errore: (e as Error).message };
      continue;
    }
    const giri = Array.from({ length: SEMI }, (_, i) => giro(model, 20, i + 1));
    console.log(` ${t} (${box.join('×')})`);
    for (const g of giri) console.log(`   ${riga(g, 20)}`);
    const animali = animalLetters(model.program.palette);
    if (animali.length) console.log(`   animali: ✗ ${animali.join(' ')}`);
    const merli = Object.entries(model.program.palette).find(([, v]) => /merl|battlement|crenel/i.test(v.name ?? ''))?.[0];
    if (merli) console.log(`   merli (${merli}) per lunghezza: ${JSON.stringify(merlonRuns(giri[0].grid, merli))}`);
    prima[t] = giri[0].composizione;
    righe[t] = giri.map(({ grid: _g, ...g }) => g);
    const scala = Math.max(1, Math.round(240 / box[0]));
    const rows = giri.map((g) => sheet([0, 1, 2, 3].map((v) => render(g.grid, model.program.palette, v, cartoonRender(scala))), 1, 8, [112, 150, 84]));
    fs.writeFileSync(path.join(dir, `${t}.png`), png(stack(rows)));
  }
  const varieta: string[] = [];
  for (let i = 1; i < TAGLIE.length; i++) {
    const a = prima[TAGLIE[i - 1]], b = prima[TAGLIE[i]];
    if (!a || !b) continue;
    const e = varietyError(a, b, SIZE_TIERS.find((s) => s.id === TAGLIE[i - 1])!.name, SIZE_TIERS.find((s) => s.id === TAGLIE[i])!.name);
    varieta.push(`${TAGLIE[i - 1]} → ${TAGLIE[i]}: ${e ?? 'cresce'}`);
  }
  console.log(`   varietà: ${varieta.join(' · ')}`);
  const controllo: Record<string, string> = {};
  for (const t of ['large', 'huge'] as SizeTier[]) {
    const c = checkProgram(xml.replace(/^\s*<!--[\s\S]*?-->\s*/, ''), STRUCTURE, t, files);
    controllo[t] = c.error ?? 'passa';
    console.log(`   checkProgram ${t}: ${controllo[t]}`);
  }
  const fortificato = fortified(xml);
  console.log(`   fortificato (merli disegnati a Enorme, seme 1): ${fortificato ? 'sì' : 'no'}`);
  return { taglia, righe, varieta, controllo, fortificato };
}

/** Every program kept under a folder: `<giro>/<concetto>-<taglia>/programma.xml`, at any depth. */
function programmiIn(dir: string, rel = ''): Array<{ nome: string; concetto: string; xml: string }> {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name)).flatMap((e) => {
    const p = path.join(dir, e.name);
    const name = rel ? `${rel}/${e.name}` : e.name;
    const f = path.join(p, 'programma.xml');
    const c = /^(.+)-(large|huge|gargantuan)$/.exec(e.name)?.[1];
    if (c && fs.existsSync(f)) return [{ nome: name, concetto: c, xml: fs.readFileSync(f, 'utf8') }];
    return programmiIn(p, name);
  });
}

/** The Sculptor of a program kept: the folder of its model (with --modelli), or who wrote it (T355's rounds). */
const modelloDi = (nome: string, xml: string) => /sculpted by ([^ (]+)/.exec(xml)?.[1] ?? nome.split('/')[0];

/**
 * How much the concepts differ and how much the seeds of one program differ (T337, `lab/banco/concetti.ts`), at Large with the seeds of the
 * world (4): the programs kept here, one set per Sculptor (with --modelli; all in one for T355's rounds), Argon's of T355 beside them when the
 * register is another, then the ones written by hand (T346 fort and farm, T354 rocca and villetta), each set alone.
 * The feet are the layer above the soil. → <out>/concetti.json, <out>/concetti.png (a row per program, seed by seed, from the front).
 */
function concetti(): void {
  const box = voxelsOf(tilesOf(STRUCTURE, 'large'), 20);
  const tenuti = programmiIn(BASE);
  const insiemi: Record<string, Array<{ nome: string; concetto: string; xml: string }>> = {};
  for (const p of tenuti) (insiemi[modelloDi(p.nome, p.xml)] ??= []).push(p);
  const T355 = path.resolve('lab/banco/taglie/gemini');
  if (BASE !== T355) insiemi['gemini-4-argon (T355)'] = programmiIn(T355).filter((p) => modelloDi(p.nome, p.xml) === 'gemini-4-argon');
  insiemi['a mano'] = [
    { nome: 'forte (T346)', concetto: 'forte', xml: fs.readFileSync('lab/banco/taglie/forte.xml', 'utf8') },
    { nome: 'fattoria (T346)', concetto: 'fattoria', xml: fs.readFileSync('lab/banco/taglie/fattoria.xml', 'utf8') },
    { nome: 'rocca (T354)', concetto: 'rocca', xml: fs.readFileSync('lab/banco/taglie/scultore-rocca.xml', 'utf8') },
    { nome: 'villetta (T354)', concetto: 'villetta', xml: MOCK_STRUCTURE_PROGRAM },
  ];
  const out: Record<string, unknown> = {};
  const righe: Picture[] = [];
  for (const [nome, voci] of Object.entries(insiemi)) {
    if (new Set(voci.map((v) => v.concetto)).size < 2) {
      console.log(`\n${nome}: un concetto solo (${voci.length} programmi), niente separazione`);
      continue;
    }
    const gruppi: Gruppo[] = [];
    for (const v of voci) {
      const model = compileMjx(v.xml.replace(/^\s*<!--[\s\S]*?-->\s*/, ''), { size: box, files: seedFiles(v.xml) });
      const forme = [];
      const foto: Picture[] = [];
      for (let s = 1; s <= STRUCTURE_SEEDS; s++) {
        const r = runMjx(model, s, { deadline: 30_000 });
        forme.push(formaDi(v.nome, s, r.grid, model.program.palette, 1));
        foto.push(render(r.grid, model.program.palette, 0, cartoonRender(2)));
      }
      gruppi.push({ nome: v.nome, concetto: v.concetto, forme });
      righe.push(sheet(foto, 1, 8, [112, 150, 84]));
    }
    const c = confronta(gruppi);
    const f2 = (x: number) => x.toFixed(2);
    console.log(`\n${nome}: tra i semi ${f2(c.dentro.distanza)}, tra concetti ${f2(c.fra.distanza)}, separazione ${f2(c.separazione.distanza)}, vicini ${Math.round(c.vicini * 100)} %`);
    for (const t of c.traSemi) console.log(`   ${t.nome}: tra i semi ${f2(t.quote.distanza)} (impronta ${f2(t.quote.impronta)}, profilo ${f2(t.quote.profilo)}, pieni ${f2(t.quote.pieni)})`);
    console.log(c.matrice.d.map((r, i) => `   ${c.matrice.concetti[i]}: ${r.map(f2).join(' ')}`).join('\n'));
    out[nome] = c;
  }
  fs.writeFileSync(path.join(BASE, 'concetti.json'), JSON.stringify(out, null, 1));
  if (righe.length) fs.writeFileSync(path.join(BASE, 'concetti.png'), png(stack(righe)));
}

/** The seconds of every call of a structure, from the files written as it went (`# compito · modello · N s`, or `errore dopo N s`). */
function callTimes(dir: string): number[] {
  const d = path.join(dir, 'chiamate');
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => /^\d/.test(f)).map((f) => {
    const title = fs.readFileSync(path.join(d, f), 'utf8').split('\n')[0].replace(/ · \d+ immagini$/, '');
    return Number(/(\d+) s$/.exec(title)?.[1] ?? 0);
  });
}

/**
 * The table of every Sculptor (T391): structures that passed over the ones asked, the cost per structure that passed counting every try
 * and every failed fix (Gemini's and Claude's at the API list), calls, time (the game waits 120 s a call), the Artist's votes, the farms
 * fortified, at Large and at Huge; T355's rounds of the game's configuration beside them (3.8 Flash at Large, Argon at Huge and at Large).
 * → <out>/tabella.md and the same in the console.
 */
function tabella(): void {
  type Riga = { esito: Esito; dir: string; scultore: string };
  const leggi = (root: string, scultoreDi: (e: Esito, dir: string) => string | undefined, filtro: (dir: string) => boolean = () => true): Riga[] =>
    esitiIn(root).filter((f) => filtro(f)).flatMap((f) => {
      const esito = JSON.parse(fs.readFileSync(f, 'utf8')) as Esito;
      const s = scultoreDi(esito, path.dirname(f));
      return s ? [{ esito, dir: path.dirname(f), scultore: s }] : [];
    });
  const sculptOf = (e: Esito) => {
    const s = e.scultore ?? e.perCompito.find((t) => t.task === 'model.sculpt')?.model;
    return s && e.via ? `${s} via OpenRouter` : s;
  };
  // A structure whose Sculptor never answered is not an attempt of that model.
  const righe: Riga[] = leggi(BASE, (e) => (unreachable(e) ? undefined : sculptOf(e)));
  const T355 = path.resolve('lab/banco/taglie/gemini');
  // T355: the game's thinking only (giro1-3, giro5); giro4 and giro6 were 3.8 Flash with more thinking.
  if (BASE !== T355) righe.push(...leggi(T355, (e) => `${sculptOf(e)} (T355)`, (f) => !/giro4|giro6/.test(f)));
  const gruppi = new Map<string, Riga[]>();
  for (const r of righe) for (const k of [`${r.scultore} · ${r.esito.taglia}`, `${r.scultore} · tutte`]) (gruppi.get(k) ?? gruppi.set(k, []).get(k)!).push(r);
  const n2 = (x: number) => x.toFixed(2).replace('.', ',');
  const lines = [
    '| Scultore | taglia | riuscite | costo totale | costo per riuscita | chiamate (media) | tempo (media, max) | chiamate oltre 120 s | voti | fattorie con merli | forti con merli |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const [k, rs] of [...gruppi.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const [scultore, taglia] = k.split(' · ');
    const ok = rs.filter((r) => r.esito.modello);
    const costo = rs.reduce((s, r) => s + r.esito.usd, 0);
    const chiamate = rs.reduce((s, r) => s + r.esito.chiamate, 0) / rs.length;
    const tempi = rs.map((r) => r.esito.secondi);
    const lente = rs.flatMap((r) => callTimes(r.dir));
    const fattorie = ok.filter((r) => r.esito.concetto === 'fattoria');
    const merlate = (xs: Riga[]) => xs.filter((r) => fortified(fs.readFileSync(path.join(r.dir, 'programma.xml'), 'utf8'))).length;
    const forti = ok.filter((r) => r.esito.concetto === 'forte');
    const voti = ok.map((r) => r.esito.voto ?? '—').join(', ');
    // Passed with the game's time: no call of it past 120 s (`ai.timeout`), where the game would have given up.
    const inTempo = ok.filter((r) => callTimes(r.dir).every((s) => s <= 120)).length;
    lines.push(`| ${scultore} | ${taglia} | ${ok.length} su ${rs.length} (${inTempo} entro 120 s a chiamata) | ${n2(costo)} $ | ${ok.length ? `${n2(costo / ok.length)} $` : '—'} | ${n2(chiamate)} | ${Math.round(tempi.reduce((a, b) => a + b, 0) / tempi.length)} s, ${Math.max(...tempi)} s | ${lente.filter((s) => s > 120).length} su ${lente.length} | ${voti || '—'} | ${fattorie.length ? `${merlate(fattorie)} su ${fattorie.length}` : '—'} | ${forti.length ? `${merlate(forti)} su ${forti.length}` : '—'} |`);
  }
  // Why they fall: every program the kernel threw away (`registro.txt`), and the calls that never answered (the esito's error).
  const MOTIVI: Array<[string, RegExp]> = [
    ['piani', /piani: \d/],
    ['porta', /porta: \d/],
    ['stanza', /stanza: /],
    ['varietà fra le taglie', /varietà: /],
    ['colore mancante', /non ha colore/],
    ['pezzi staccati o sospesi', /staccat|galleggia|sospes/],
    ['sintassi', /riga \d+|non è ammesso|nessun nodo|vuoto/],
  ];
  const perScultore = new Map<string, Record<string, number>>();
  for (const r of righe) {
    const m = (perScultore.get(r.scultore) ?? perScultore.set(r.scultore, {}).get(r.scultore)!);
    const reg = path.join(r.dir, 'registro.txt');
    for (const l of fs.existsSync(reg) ? fs.readFileSync(reg, 'utf8').split('\n').filter((x) => x.includes('] scarta: ')) : []) {
      const hit = MOTIVI.filter(([, re]) => re.test(l)).map(([k]) => k);
      for (const k of hit.length ? hit : ['altro']) m[k] = (m[k] ?? 0) + 1;
    }
    const e = r.esito.errore ?? '';
    const k = /fetch failed|timeout|scadut/i.test(e) ? 'rete (nessuna risposta)' : /MAX_TOKENS|risposta vuota/.test(e) ? 'risposta vuota (token finiti)' : /tetto|finestra/.test(e) ? 'fermata dal tetto' : undefined;
    if (k) m[k] = (m[k] ?? 0) + 1;
  }
  const colonne = [...MOTIVI.map(([k]) => k), 'altro', 'rete (nessuna risposta)', 'risposta vuota (token finiti)', 'fermata dal tetto'].filter((k) => [...perScultore.values()].some((m) => m[k]));
  const motivi = [
    `| Scultore | ${colonne.join(' | ')} |`,
    `|---|${colonne.map(() => '---').join('|')}|`,
    ...[...perScultore.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([s, m]) => `| ${s} | ${colonne.map((k) => m[k] ?? 0).join(' | ')} |`),
  ];
  const gemini = esitiIn(BASE).reduce((s, f) => s + geminiOf(JSON.parse(fs.readFileSync(f, 'utf8'))), 0);
  const testo = `${lines.join('\n')}\n\nScarti del kernel (un programma può cadere per più motivi) e richieste senza risposta:\n\n${motivi.join('\n')}\n\nRegistro di ${path.relative(process.cwd(), BASE)}: ${usd(gemini)} di Gemini a listino (tetto ${usd(TETTO)}).\n`;
  console.log(testo);
  fs.writeFileSync(path.join(BASE, 'tabella.md'), testo);
}

const solo = opt('solo')?.split(',') ?? CONCETTI;
const taglie = (opt('taglie')?.split(',') ?? ['large', 'huge']) as SizeTier[];
const giri = solo.flatMap((c) => taglie.map((t) => [c, t] as const));
/** With --modelli: every Sculptor, every repetition, in its folder; otherwise T355's one round in --giro. */
const MODELLI = opt('modelli')?.split(',').filter(Boolean);
const RIPETI = Number(opt('ripeti') ?? 1);
const rounds: Array<{ out: string; scultore?: string }> = MODELLI
  ? MODELLI.flatMap((m) => Array.from({ length: RIPETI }, (_, i) => ({ out: path.join(BASE, m, `${opt('giro') ?? 'giro'}${i + 1}`), scultore: m })))
  : [{ out: path.join(BASE, opt('giro') ?? 'giro1'), scultore: opt('scultore') }];

if (args.includes('--concetti')) {
  concetti();
  process.exit(0);
}
if (args.includes('--tabella')) {
  tabella();
  process.exit(0);
}

if (!args.includes('--misura')) {
  const root = path.resolve(opt('root') ?? (fs.existsSync('.env') ? '.' : '../../..'));
  const key = OFFLINE ? undefined : readKey(root);
  const orKey = VIA_OPENROUTER && !OFFLINE ? openRouterKey(root) : undefined;
  if (VIA_OPENROUTER && !OFFLINE && !orKey) {
    console.error(`nessuna OPENROUTER_API_KEY nell'ambiente né in ${path.join(root, '.env')} (aggiungila, o --offline per provare senza)`);
    process.exit(1);
  }
  // The register before this run: every esito of BASE but the ones it rewrites.
  const rewritten = new Set(rounds.flatMap((r) => giri.map(([c, t]) => path.join(r.out, `${c}-${t}`, 'esito.json'))));
  register.before = esitiIn(BASE).filter((f) => !rewritten.has(f)).reduce((s, f) => s + geminiOf(JSON.parse(fs.readFileSync(f, 'utf8'))), 0);
  console.log(`Registro di ${BASE}: ${usd(register.before)} di Gemini prima del giro, tetto ${usd(TETTO)}`);
  const usesClaude = rounds.some((r) => onCli(r.scultore));
  const before = usesClaude && !OFFLINE ? readWindow() : undefined;
  if (usesClaude) console.log(`Claude prima: ${before ? `5 ore ${before.session ?? '?'} %, settimana ${before.week ?? '?'} %` : OFFLINE ? 'non letto (offline)' : 'la CLI non risponde a /usage'}`);
  const settimana: Array<Record<string, unknown>> = [];
  const irraggiungibili = new Set<string>();
  for (const round of rounds) {
    if (round.scultore && irraggiungibili.has(round.scultore)) continue;
    if (onCli(round.scultore) && claudeGate()) {
      console.log(`${path.relative(BASE, round.out)}: non lanciato (${windowState.stop})`);
      continue;
    }
    const t0 = new Date().toISOString();
    const esiti = await Promise.all(giri.map(([c, t]) => scolpisci(key, round.out, c, t, round.scultore, orKey)));
    // A model the CLI does not reach: no call of it gave a token. It is said, and the others go on.
    if (onCli(round.scultore) && !windowState.stop && esiti.every((e) => unreachable(e))) {
      irraggiungibili.add(round.scultore!);
      fs.writeFileSync(path.join(round.out, 'irraggiungibile.txt'), `${round.scultore}: ${esiti[0].errore}
`);
      console.log(`${round.scultore}: non raggiungibile dalla CLI (${esiti[0].errore?.slice(0, 200)}), proseguo con gli altri`);
      continue;
    }
    const somma = esiti.reduce((s, e) => s + e.usd, 0);
    console.log(`\n${path.relative(BASE, round.out) || '.'}: ${usd(somma)} a listino, ${esiti.reduce((s, e) => s + e.chiamate, 0)} chiamate, registro di Gemini ${usd(register.spent())}`);
    if (onCli(round.scultore)) settimana.push({ giro: path.relative(BASE, round.out), da: t0, a: new Date().toISOString(), finestra: windowState.last });
  }
  if (usesClaude) {
    const after = OFFLINE ? undefined : readWindow();
    console.log(`Claude dopo: ${after ? `5 ore ${after.session ?? '?'} %, settimana ${after.week ?? '?'} %` : 'non letto'}${before?.week !== undefined && after?.week !== undefined ? ` · il giro ha preso ${after.week - before.week} punti della settimana` : ''}`);
    const file = path.join(BASE, 'settimana.json');
    const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
    fs.writeFileSync(file, JSON.stringify([...old, { prima: before, dopo: after, giri: settimana, letture: windowState.reads, ...(windowState.stop ? { fermato: windowState.stop } : {}), offline: OFFLINE }], null, 1));
  }
}

for (const round of rounds) {
  const misure: Record<string, unknown> = {};
  for (const [c, t] of giri) misure[`${c}-${t}`] = misura(path.join(round.out, `${c}-${t}`), t);
  const json = path.join(round.out, 'misure.json');
  if (!fs.existsSync(round.out)) continue;
  const old = fs.existsSync(json) ? JSON.parse(fs.readFileSync(json, 'utf8')) : {};
  fs.writeFileSync(json, JSON.stringify({ ...old, ...misure }, null, 1));
}
