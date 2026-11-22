// How many tokens the Council's requests cost before and after a change of their prompts (T310: the prompts in English).
// `--capture <file>`: a Genesis and the first places offline (MockAiModels, as in the tests), every request recorded as it goes to
// the models (system, prompt, schema); no key, no network. `--count <before> <after>`: a sample of each task of both files counted
// with Gemini's countTokens (free, no generation), the key from the .env of --root.
// npx vite-node lab/scripts/prompt-tokens.ts -- --capture lab/out/prompts-it.json
// npx vite-node lab/scripts/prompt-tokens.ts -- --count lab/out/prompts-it.json lab/out/prompts-en.json [--root H:/projects/rune] [--per-task 2]
// npx vite-node lab/scripts/prompt-tokens.ts -- --roles eceb3b21 [--root H:/projects/rune]  # the fixed texts alone: roles, theme, principles, the Language block
// npx vite-node lab/scripts/prompt-tokens.ts -- --cache [--persone 6] [--ore 1] [--json f]  # the Actor's explicit cache (T351), offline: its requests
//   recorded after an offline Genesis, the cache's policy (ExplicitCaches) at the pace of an hour of HOUR, the tokens and dollars it saves
// npx vite-node lab/scripts/prompt-tokens.ts -- --campaign [--file f.md] [--json f]  # the master's directives (T374), offline: whether every
//   request of an offline Genesis carries its sections and no other, what they add agent by agent and in an hour of HOUR
// npx vite-node lab/scripts/prompt-tokens.ts -- --scultore [--conta] [--universi <dir>] [--prima f.json] [--md f] [--json f]  # the Sculptor's prompt request by
//   request (T458): what each kind of model needs of it and what not, the dollars a cut saves, today's examples, the few-shot candidates;
//   with --universi the examples each library gives every request, with the rule of before and with T467's, and what they cost an hour;
//   since T468 the role and the section of each trade, and with --prima (a --json of this mode from before) what each request lost

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
  // A file that was not there at the ref (the sections of the Sculptor's trades, T468) counts as empty before.
  const at = (p: string) => {
    try {
      return execSync(`git show ${ref}:${p}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      return '';
    }
  };
  const before = /export const COUNCIL_PRINCIPLES = `([\s\S]*?)`;/.exec(at('src/kernel/fourthwall.ts'))![1];
  const prompts = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? prompts(`${dir}/${e.name}`) : e.name.endsWith('.md') ? [`${dir}/${e.name}`] : []));
  const files = [...prompts('universe/prompts/agents'), 'universe/prompts/theme.md'];
  const rows: string[] = ['| testo | prima (token) | dopo (token) | differenza |', '|---|---:|---:|---:|'];
  let sa = 0;
  let sb = 0;
  for (const [name, a, b] of [['COUNCIL_PRINCIPLES', before, COUNCIL_PRINCIPLES], ...files.map((f) => [f.replace('universe/', ''), at(f), fs.readFileSync(f, 'utf8')])]) {
    const [ta, tb] = [a.trim() ? await tokens(a) : 0, b.trim() ? await tokens(b) : 0];
    sa += ta;
    sb += tb;
    rows.push(`| ${name} | ${ta || '—'} | ${tb} | ${ta ? `${(((tb - ta) / ta) * 100).toFixed(1)} %` : 'nuovo'} |`);
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

/** A campaign of about 900 tokens as the study measured it (T347, § 4.3): 250 for everyone, Narrator 250, Cartographer 200, Sculptor and Artist 100, Engineer and Physicist 50, Musician 50. */
const SAMPLE_CAMPAIGN = `# Campagna

## Per tutti
- (giorno 1) Niente draghi, niente giganti: le bestie sono lupi, orsi, cinghiali, e qualche serpe grossa nelle paludi.
- (giorno 1) Il regno è povero e stanco di guerra: la gente diffida dei soldati e dei forestieri armati, rispetta chi lavora la terra.
- (giorno 1) Il fiume Lenta divide il nord di pietra dal sud di legno e paglia; i ponti sono pochi e chi li tiene riscuote un pedaggio.
- (giorno 2) La magia delle rune è rara e temuta: chi la usa in pubblico viene guardato storto, e i preti la chiamano superbia.
- (giorno 2) I mesi si contano a lune e le feste seguono il raccolto: la fiera del grano a fine estate, il fuoco dei morti d'inverno.
- (giorno 3) Le monete sono di rame e d'argento; l'oro lo vede solo il conte, e chi ne mostra viene creduto un ladro.

## Narratore
- (giorno 1) La gente parla in modo semplice e un poco arcaico: «voi» per chi non si conosce, proverbi del raccolto, poche parole dotte.
- (giorno 1) I nomi delle persone sono brevi e di suono antico (Orm, Tilde, Berto, Sabe, Gunda); i soprannomi vengono dal mestiere.
- (giorno 2) Le trame nascono da debiti, eredità, matrimoni combinati, confini dei campi e furti di bestiame, mai da profezie.
- (giorno 2) Il conte Aldo di Rocca Bassa è assente e lontano: se ne parla, non si incontra; i suoi esattori sì, e non sono amati.
- (giorno 3) I bambini hanno sempre un compito (guardare le oche, portare l'acqua) e sanno più di quello che dicono.
- (giorno 3) Le locande sono il posto delle notizie: l'oste sa tutto, ma vuole qualcosa in cambio, anche solo una storia nuova.

## Cartografo
- (giorno 1) I nomi dei luoghi in lingua d'oïl o che ne hanno il suono: Vaudrè, Lenta, Mont Gris, Bois-Clair, la Ferté.
- (giorno 1) A nord del fiume colline sassose, pecore e villaggi murati; a sud pianura, paludi, mulini e cascine sparse.
- (giorno 2) Ogni villaggio ha un pozzo o una fonte in piazza e una cappella; le città più grandi stanno sul fiume.
- (giorno 2) Le strade sono di terra battuta; solo la via del conte, da nord a sud, ha un selciato e pietre miliari.
- (giorno 3) Le paludi del sud hanno passerelle di legno e capanne su pali; d'inverno gelano e diventano una scorciatoia.

## Scultore e Artista
- (giorno 1) Le case di pietra grigia con tetti di lastre a nord, di legno e paglia con il graticcio a sud.
- (giorno 2) I colori del regno sono smorti: ocra, grigio, verde muschio; il rosso solo per le insegne del conte.
- (giorno 3) Gli attrezzi sono di legno e ferro battuto, rozzi, consumati dall'uso.

## Ingegnere e Fisico
- (giorno 1) Le barche del fiume portano al più due persone e un carico piccolo; i carri si rompono sulle strade di terra.
- (giorno 2) Il ferro è caro: le cose di ferro pesano e si consumano piano.

## Musicista
- (giorno 1) Solo flauti di canna, cornamuse, tamburi a cornice e voci; niente archi, niente ottoni.
- (giorno 2) Le melodie sono modali e lente, da lavoro o da festa; la notte nelle paludi quasi silenzio.
`;

/**
 * The master's directives (T374, ADR-0191), offline: a Genesis and its first places with a campaign (the file of `--file`, or a sample of
 * about 900 tokens like the study's), every request recorded; whether each carries its sections and no other (the teams a Genesis does
 * not call are asked once each); what they add to a request, agent by agent, at T325's 3.26 characters a token; an hour of the lobby's
 * estimate (HOUR, knobs at 1) shared among the agents as its rows are; the dollars at full price and with the implicit cache (75 %).
 */
async function campaignCost(): Promise<void> {
  const { Kernel } = await import('../../src/kernel/kernel');
  const { bundledFiles } = await import('../../src/kernel/bundle');
  const { memoryStore } = await import('../../src/kernel/repo');
  const { MockAiModels } = await import('../../src/kernel/ai/mock');
  const { WORLD_THEMES } = await import('../../src/kernel/themes');
  const { AGENTS } = await import('../../src/kernel/agents/council');
  const { CAMPAIGN_FILE, CAMPAIGN_SECTIONS, campaignPrompt, campaignSectionsFor, readCampaign } = await import('../../src/kernel/campaign');
  const { COEFFICIENT_INFO, hourlyEstimate, repairActor } = await import('../../src/kernel/coefficients');
  const { DEFAULT_SCULPTORS } = await import('../../src/kernel/agents/sculptor');
  const { costOf } = await import('../../src/kernel/ai/prices');
  type Agent = keyof typeof AGENTS;
  const text = opt('file') ? fs.readFileSync(path.resolve(opt('file')!), 'utf8') : SAMPLE_CAMPAIGN;
  const recorded: Recorded[] = [];
  class Recording extends MockAiModels {
    async text(call: TextCall): Promise<string> {
      recorded.push({ agent: call.agent ?? '', task: call.task, system: call.system ?? '', prompt: call.prompt });
      return super.text(call);
    }
  }
  const k = await Kernel.boot({ files: { ...bundledFiles, [CAMPAIGN_FILE]: text }, store: memoryStore(), ai: new Recording() });
  await k.runGenesis(WORLD_THEMES[0].text);
  for (let i = 0; i < 300; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 10));
  }
  const fromWorld = recorded.length;
  for (const agent of Object.keys(AGENTS) as Agent[]) if (!recorded.some((r) => r.agent === agent)) await k.council.write(agent, 'prova', 'p').catch(() => undefined);
  const read = readCampaign(text);
  const written = CAMPAIGN_SECTIONS.filter((s) => read.sections[s].length);
  let right = 0;
  for (const r of recorded) {
    const mine = campaignSectionsFor(r.agent as Agent);
    if (written.every((s) => r.system.includes(read.sections[s][0]) === mine.includes(s))) right++;
  }
  const tok = (chars: number) => chars / 3.26;
  // What a request of an agent gains: its block and the blank line before it.
  const added = (agent: Agent) => {
    const block = campaignPrompt(read, agent);
    return block ? tok(block.length + 2) : 0;
  };
  // The hour of the lobby's estimate, shared among the agents as its rows are (a Forge: concept, physics, code, review, repair; a pack:
  // items, physics, review, recipes; a session: the Arbiter, then half a Forge in two and a half calls).
  const est = hourlyEstimate(k.config.ai);
  const forge: Partial<Record<Agent, number>> = { narrator: 0.2, physicist: 0.2, engineer: 0.4, arbiter: 0.2 };
  const pack: Partial<Record<Agent, number>> = { narrator: 0.5, physicist: 0.25, arbiter: 0.25 };
  const plays: Agent = repairActor(k.config.ai.actor).on ? 'actor' : 'narrator';
  const rows: Array<[string, Partial<Record<Agent, number>>]> = [
    [COEFFICIENT_INFO.chunks.nome, { cartographer: 1 }],
    [COEFFICIENT_INFO.sessions.nome, { arbiter: 1 / 3.5 + (2.5 / 3.5) * 0.2, narrator: (2.5 / 3.5) * 0.2, physicist: (2.5 / 3.5) * 0.2, engineer: (2.5 / 3.5) * 0.4 }],
    [COEFFICIENT_INFO.packs.nome, pack],
    [COEFFICIENT_INFO.inhabitants.nome, forge],
    [COEFFICIENT_INFO.entities.nome, forge],
    [COEFFICIENT_INFO.people.nome, { narrator: 1 }],
    [COEFFICIENT_INFO.dialogues.nome, { [plays]: 1 }],
    [COEFFICIENT_INFO.plots.nome, { narrator: 1 }],
    [COEFFICIENT_INFO.models.nome, { sculptor: 1 }],
    [COEFFICIENT_INFO.reviews.nome, { artist: 1 }],
    [COEFFICIENT_INFO.pieces.nome, { musician: 1 }],
    [COEFFICIENT_INFO.words.nome, { [plays]: 1 }],
    [COEFFICIENT_INFO.actions.nome, { narrator: 1 }],
    [COEFFICIENT_INFO.looks.nome, { narrator: 1 }],
  ];
  const perHour: Partial<Record<Agent, number>> = {};
  for (const [name, share] of rows) {
    const row = est.righe.find((r) => r.voce === name);
    for (const [agent, f] of Object.entries(share)) perHour[agent as Agent] = (perHour[agent as Agent] ?? 0) + (row?.chiamate ?? 0) * (f ?? 0);
  }
  const ai = k.config.ai;
  const modelOf = (a: Agent) => (a === 'sculptor' ? DEFAULT_SCULPTORS.figure : a === 'artist' ? DEFAULT_SCULPTORS.artist : a === 'musician' ? DEFAULT_SCULPTORS.musician : ai.textModel);
  const CACHE = 0.75;
  const lines = ["| agente | richieste registrate | token in più a richiesta | chiamate l'ora | token in più l'ora | $/ora pieni | $/ora in cache |", '|---|---:|---:|---:|---:|---:|---:|'];
  let sumTok = 0;
  let sumFull = 0;
  let sumCached = 0;
  for (const a of Object.keys(AGENTS) as Agent[]) {
    const t = added(a);
    const calls = perHour[a] ?? 0;
    const hourTok = t * calls;
    const full = costOf(modelOf(a), { prompt: hourTok, output: 0 }) ?? 0;
    const cached = costOf(modelOf(a), { prompt: hourTok, cached: hourTok * CACHE, output: 0 }) ?? 0;
    sumTok += hourTok;
    sumFull += full;
    sumCached += cached;
    lines.push(`| ${AGENTS[a].name} | ${recorded.filter((r) => r.agent === a).length} | ${Math.round(t)} | ${Math.round(calls * 10) / 10} | ${Math.round(hourTok)} | ${full.toFixed(4)} | ${cached.toFixed(4)} |`);
  }
  const calls = Object.values(perHour).reduce((x, y) => x + (y ?? 0), 0);
  lines.push(`| **tutti** | ${recorded.length} | | ${Math.round(calls)} | ${Math.round(sumTok)} | **${sumFull.toFixed(4)}** | **${sumCached.toFixed(4)}** |`);
  const sizes = CAMPAIGN_SECTIONS.map((s) => `${s} ${Math.round(tok(read.sections[s].join('\n').length))}`).join(', ');
  console.log(`direttive: ${Math.round(tok(CAMPAIGN_SECTIONS.reduce((n, s) => n + read.sections[s].join('\n').length, 0)))} token (${sizes}); ${read.left.length} righe fuori; ${read.errors.length} errori`);
  console.log(`richieste: ${fromWorld} dalla Genesi offline e dai primi luoghi, ${recorded.length - fromWorld} chieste alle squadre che non ha chiamato; con le sezioni giuste: ${right}/${recorded.length}`);
  console.log(`un'ora della lobby (${ai.textModel}, manopole a 1): ${est.chiamate} chiamate, ${est.dollari.toFixed(3)} $; le direttive ${((sumFull / est.dollari) * 100).toFixed(1)} % pieni, ${((sumCached / est.dollari) * 100).toFixed(1)} % in cache (${CACHE * 100} %)`);
  console.log(lines.join('\n'));
  if (opt('json')) fs.writeFileSync(path.resolve(opt('json')!), JSON.stringify({ tokenOra: Math.round(sumTok), dollariPieni: sumFull, dollariCache: sumCached, oraLobby: est.dollari, sezioniGiuste: right, richieste: recorded.length }, null, 1) + '\n');
  if (right !== recorded.length) process.exitCode = 1;
}

/**
 * How the model classes of the real universes share the Sculptor's work (T458), measured on 21/11/2026 on the five generated universes
 * (aurora, mesa, neapolis, orichalcum, sidera: the models the Sculptor wrote, not the hand-written ones nor the sounds; a structure that
 * grows by rules counted once per program, not once per size). `--universi <dir>` measures them again.
 */
const SCULPTED_SHARE: Record<string, number> = { pebble: 0, rock: 2, bush: 0, tree: 7, object: 3, 'object-tinted': 84, 'object-worn': 4, furniture: 100, person: 75, animal: 1, beast: 0, monument: 27, building: 71, 'structure-medium': 5, 'structure-large': 49, 'structure-fort': 0, vessel: 0 };

/**
 * The Sculptor's examples as the kernel chose them before T467 (kernel 0.10.14), only to measure the rule of today against them: the first
 * two programs of the library of the class's family, the hand-written first, then those that came with the cards, then the rest, in the
 * order of the index.
 */
function examplesBeforeT467(files: Record<string, string>, req: { classe: string } | string): string[] {
  const classe = typeof req === 'string' ? req : req.classe;
  let index: Record<string, { class?: string; author?: string; brought?: string; classe?: string; autore?: string }> = {};
  try {
    index = JSON.parse(files['models/index.json'] ?? '{}');
  } catch {
    index = {};
  }
  const family: Record<string, string[]> = { person: ['person', 'animal'], animal: ['animal', 'person'], beast: ['beast', 'animal'], tree: ['tree', 'bush'], bush: ['bush', 'tree'], rock: ['rock', 'pebble'], pebble: ['pebble', 'rock'], object: ['object', 'furniture'], furniture: ['furniture', 'object'], building: ['building', 'structure'], structure: ['structure', 'building'], monument: ['monument', 'building'], vessel: ['vessel'] };
  // The fields of 0.3 (`classe`, `autore`) as `internalFields` read them.
  const classOfEntry = (id: string) => index[id].class ?? index[id].classe;
  const authorOf = (id: string) => index[id].author ?? index[id].autore ?? '';
  const ids = Object.keys(index).filter((id) => files[`models/${id}.xml`]);
  const picked: string[] = [];
  for (const cls of family[classe] ?? [classe, 'furniture']) {
    const rank = (id: string) => (/mano/.test(authorOf(id)) ? 2 : typeof index[id].brought === 'string' ? 1 : 0);
    const of = ids.filter((id) => classOfEntry(id) === cls).sort((a, b) => rank(b) - rank(a));
    for (const id of of) if (picked.length < 2 && !picked.includes(id)) picked.push(id);
  }
  return picked.map((id) => files[`models/${id}.xml`].trim());
}

/**
 * The Sculptor's prompt class by class (T458, `docs/design/scultori-specializzati.md`), offline: an offline Genesis for a real style guide,
 * then one request of every kind of model (the classes, a thing tinted, a thing worn, a structure that grows by rules, a vessel, an action)
 * sculpted with the local models, every request recorded as it goes to the models; each system cut into its parts (the sections of
 * `prompts/agents/sculptor.md`, the principles, the Language block, the style guide, the library's examples) and each part marked as
 * needed by that request or not (a part in doubt is needed: what is not needed is a floor). Tokens at 3.5 characters each (`--conta`:
 * Gemini's countTokens, free, the key from the .env of --root); the dollars on each class's Sculptor, at the implicit cache's share.
 * The Genesis: the models an offline Genesis asks for, by class; the hour: the lobby's estimate (HOUR), shared as the real universes are.
 */
async function sculptorSpecialties(): Promise<void> {
  const { Kernel } = await import('../../src/kernel/kernel');
  const { bundledFiles } = await import('../../src/kernel/bundle');
  const { memoryStore } = await import('../../src/kernel/repo');
  const { MockAiModels } = await import('../../src/kernel/ai/mock');
  const { WORLD_THEMES } = await import('../../src/kernel/themes');
  const { COUNCIL_PRINCIPLES } = await import('../../src/kernel/fourthwall');
  const { languageBlock, languageOf } = await import('../../src/kernel/language');
  const S = await import('../../src/kernel/agents/sculptor');
  const { classOf, isFortified, isVessel, sizeOf, CLASSES } = await import('../../src/mj/classes');
  const { costOf, priceOf } = await import('../../src/kernel/ai/prices');
  const { COEFFICIENT_INFO, hourlyEstimate, IMPLICIT_CACHE_SHARE, NO_IMPLICIT_CACHE, sculptPlan, STRUCTURE_SCULPT } = await import('../../src/kernel/coefficients');
  type Req = Parameters<typeof S.sculpt>[1];

  // Tokens: countTokens (free) or 3.5 characters a token (T434: sculptor.md 30 KB, 8 565 tokens).
  const counting = argv.includes('--conta');
  const key = counting ? /^GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync(path.join(path.resolve(opt('root') ?? '../../..'), '.env'), 'utf8'))?.[1]?.trim() : undefined;
  if (counting && !key) throw new Error('nessuna chiave');
  const counted = new Map<string, number>();
  const tokens = async (text: string): Promise<number> => {
    if (!text.trim()) return 0;
    if (!key) return Math.round(text.length / 3.5);
    const seen = counted.get(text);
    if (seen !== undefined) return seen;
    // A busy server (429, 5xx) answers again after a while (T470): a few tries, a little longer each time; any other answer is an error.
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
  };

  const recorded: Recorded[] = [];
  class Recording extends MockAiModels {
    async text(call: TextCall): Promise<string> {
      recorded.push({ agent: call.agent ?? '', task: call.task, system: call.system ?? '', prompt: call.prompt });
      return super.text(call);
    }
  }
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new Recording() });
  await k.runGenesis(WORLD_THEMES[0].text);
  // The models the world asks for once the Genesis is done (offline: the seed's world with the Cartographer's local entities).
  const atGenesis = k.sculpting.missing();
  const files = k.council.files;

  // The kinds of request: a class, and what changes the prompt (a tint, a zone worn, a size, a fortification), with its proposed trade.
  type Spec = 'landscaper' | 'joiner' | 'tailor' | 'figurist' | 'mason' | 'architect' | 'coachbuilder' | 'actions';
  interface Case {
    key: string;
    spec: Spec;
    req: Req;
  }
  const r = (id: string, classe: string, nome: string, aspetto: string, more: Partial<Req> = {}): Req => ({ id, classe, nome, aspetto, ...more });
  const CASES: Case[] = [
    { key: 'pebble', spec: 'landscaper', req: r('t458-ciottolo', 'pebble', 'Ciottolo di fiume', 'un sasso liscio e grigio, venato di bianco') },
    { key: 'rock', spec: 'landscaper', req: r('t458-masso', 'rock', 'Masso coperto di licheni', 'una roccia tozza, grigia, con macchie gialle') },
    { key: 'bush', spec: 'landscaper', req: r('t458-ginepro', 'bush', 'Ginepro', 'un cespuglio basso e spinoso, verde scuro con bacche blu') },
    { key: 'tree', spec: 'landscaper', req: r('t458-castagno', 'tree', 'Castagno', 'un albero dal tronco largo e la chioma tonda') },
    { key: 'object', spec: 'joiner', req: r('t458-lanterna', 'object', 'Lanterna di ferro', 'una lanterna a gabbia con la fiamma dentro') },
    { key: 'object-tinted', spec: 'joiner', req: r('t458-fiasco', 'object', 'Fiasco', 'una bottiglia panciuta col collo stretto e il tappo', { tinta: true }) },
    { key: 'object-worn', spec: 'tailor', req: r('t458-cappello', 'object', 'Cappello di paglia', 'un cappello a tesa larga, intrecciato', { worn: 'head' }) },
    { key: 'furniture', spec: 'joiner', req: r('t458-baule', 'furniture', 'Baule da viaggio', 'un baule di legno coi cerchi di ferro e il coperchio bombato') },
    { key: 'person', spec: 'figurist', req: r('t458-mugnaia', 'person', 'Mugnaia', 'una donna robusta col grembiule infarinato e un fazzoletto in testa') },
    { key: 'animal', spec: 'figurist', req: r('t458-gatto', 'animal', 'Gatto rosso', 'un gatto tigrato, la coda alta') },
    { key: 'beast', spec: 'figurist', req: r('t458-cinghiale', 'beast', 'Cinghiale', 'un cinghiale massiccio con le zanne') },
    { key: 'monument', spec: 'mason', req: r('t458-statua', 'monument', 'Statua del fondatore', 'un uomo di pietra su un basamento, il braccio teso') },
    { key: 'building', spec: 'mason', req: r('t458-pozzo', 'building', 'Pozzo coperto', 'un pozzo di pietra con un tetto di coppi su due pali') },
    { key: 'structure-medium', spec: 'mason', req: r('t458-capanno', 'structure', 'Capanno del pescatore', 'una baracca di assi con la rete stesa', { taglia: 'medium' }) },
    { key: 'structure-large', spec: 'architect', req: r('t458-mulino', 'structure', 'Mulino ad acqua', 'un mulino di pietra con la ruota e la casa del mugnaio', { taglia: 'large' }) },
    { key: 'structure-fort', spec: 'architect', req: r('t458-rocca', 'structure', 'Rocca di confine', 'una piccola fortezza con il mastio e le mura', { taglia: 'large' }) },
    { key: 'vessel', spec: 'coachbuilder', req: r('t458-barca', 'vessel', 'Barca da pesca', 'una barca a vela con lo scafo di legno', { taglia: 'large' }) },
  ];

  // One request of each kind, as the Sculptor sends it: the first call (for a structure that grows by rules, the first block).
  const sent = new Map<string, Recorded>();
  for (const c of CASES) {
    const before = recorded.length;
    await S.sculpt(k.council, c.req, S.DEFAULT_SCULPTORS, { semplici: 1, revisione: false, giudizio: false });
    const first = recorded.slice(before).find((x) => x.task === 'model.sculpt');
    if (first) sent.set(c.key, first);
  }
  // An action («Altro…» on a chest): since T468 the core of the actions and the section of the chest's trade.
  {
    const xml = files['models/credenza.xml'] ?? files['models/barile.xml'];
    const before = recorded.length;
    if (xml) await S.sculptAction(k.council, { nome: 'Credenza', xml, classe: 'furniture', azione: 'open', etichetta: 'Apri le ante', testo: 'apro le ante', cambia: 'le ante si aprono' }, S.DEFAULT_SCULPTORS.simple, 0);
    const first = recorded.slice(before).find((x) => x.task === 'model.action');
    if (first) sent.set('action', first);
  }
  CASES.push({ key: 'action', spec: 'actions', req: r('t458-credenza', 'furniture', 'Credenza', 'una credenza a due ante') });

  // The parts of the system, as `Council.write` puts it together (T468): the role (the core, the architect's prompt, the core of the
  // actions), the principles, the Language block, the agent's context, the section of the trade, the examples.
  const language = languageBlock(languageOf(files));
  const context = k.council.context('sculptor');
  const resources = S.libraryResources(files);
  const { systemOf } = await import('../../src/kernel/agents/council');
  /** What a request reads as its role and its section, as `write` and `sculptAction` give them. */
  const roleOf = (c: Case): string => S.sculptorRole(files, c.spec);
  const sectionOf = (c: Case): string => (c.spec === 'actions' ? S.sculptorSection(files, 'actions', S.specialtyOf(classOf(c.req.classe)!, c.req)) : S.sculptorSection(files, c.spec));
  interface Part {
    id: string;
    text: string;
  }
  /** A whole item of a list that starts with these words, on all its lines: up to the next item, a blank line or the end. */
  const bullet = (id: string, start: string): [string, RegExp] => [id, new RegExp(`^- ${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n- |\\n\\n|(?![\\s\\S]))`, 'm')];
  /** A role or a section cut at its titles, and inside some of them the lines that serve one kind of request only. */
  const cut = (role: string): Part[] => {
    const out: Part[] = [];
    const take = (id: string, whole: string, pieces: Array<[string, RegExp]>) => {
      let rest = whole;
      for (const [pid, re] of pieces) {
        for (const m of [...whole.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`))]) {
          out.push({ id: typeof pid === 'string' && pid.includes('$1') ? pid.replace('$1', m[1]) : pid, text: m[0] });
          rest = rest.replace(m[0], '');
        }
      }
      out.push({ id, text: rest });
    };
    const sections = role.split(/\n(?=## )/);
    for (const s of sections) {
      const title = /^## (.*)/.exec(s)?.[1] ?? '';
      const files_ = [['look.wfc', /^- `<wfc[\s\S]*?(?=\n- |$)/m], ['look.convchain', /^- `<convchain[\s\S]*?(?=\n- |$)/m], ['look.import', /^- `<import[\s\S]*?(?=\n- |$)/m]] as Array<[string, RegExp]>;
      const palette: [string, RegExp] = ['palette', /^[A-Za-z#0-9]+ [0-9a-f]{6}( · [A-Za-z#0-9]+ [0-9a-f]{6})+$/m];
      const lines: Array<[string, RegExp]> = [['class:$1', /^ {2}- ([a-z]+): .*$/m], ['sizes', /^ {2}Sizes \(D&D\).*$/m]];
      const limbs: [string, RegExp] = ['program.limbs', /(- )?For people and animals,\s+`part`[\s\S]*?for the limbs\./];
      if (!title) take('intro', s, []);
      else if (title.startsWith('Coordinates')) take('coordinates', s, lines);
      else if (title.startsWith('The program')) take('program', s, [limbs, palette]);
      // The core of T468: the palette in its own section, the files in theirs, the trades in their sections.
      else if (title.startsWith('The palette')) take('palette.colours', s, [palette]);
      else if (title.startsWith('Tiles and files')) take('look.files', s, files_);
      else if (title.startsWith('Your trade')) take(`trade:${/the ([a-z]+)/.exec(title)?.[1] ?? '?'}`, s, [...lines, limbs, ['sculpt.people', /^- People:.*$/m]]);
      else if (title.startsWith('Patterns')) take('patterns', s, []);
      else if (title.startsWith('Nodes that look ahead')) take('look.children', s, [['look.field', /^- `<field[\s\S]*?(?=\n- |$)/m], ['look.observe', /^- `<observe[\s\S]*?(?=\n- |$)/m], ...files_]);
      else if (title.startsWith('Nodes')) take('nodes', s, []);
      else if (title.startsWith('The colour')) take('colour', s, []);
      else if (title.startsWith('How to sculpt')) take('sculpt', s, [['sculpt.people', /^- People:.*$/m]]);
      else if (title.startsWith('Examples of high')) take('showcase', s, []);
      else if (title.startsWith('Traps')) take('traps', s, []);
      else if (title.startsWith('Worn')) take('worn', s, []);
      else if (title.startsWith('Vessels')) take('vessels', s, []);
      // The crafts of T470 (S4): inside some of them the lines that serve some classes of the trade only.
      else if (title.startsWith('Growing like nature')) take('craft:landscaper', s, [bullet('craft.wind', 'Trees and bushes bend')]);
      else if (title.startsWith('What the world does')) take('craft:joiner', s, [bullet('craft.opening', 'Opening:'), bullet('craft.shelves', 'Putting down:'), bullet('craft.carrying', 'Carrying:'), bullet('craft.holding', 'Holding:')]);
      else if (title.startsWith('Every body')) take('craft:tailor', s, []);
      else if (title.startsWith('How the kernel moves')) take('craft:figurist', s, [bullet('craft.fours', 'On all fours:'), bullet('craft.hand', 'The hand is')]);
      else if (title.startsWith('Building in one box')) take('craft:mason', s, [bullet('craft.door', 'A door one goes through'), bullet('craft.windows', 'Windows are marks'), bullet('craft.roofs', 'Roofs:'), bullet('craft.monument', 'A monument stands')]);
      else if (title.startsWith('Building a hull')) take('craft:coachbuilder', s, []);
      else take(`other:${title}`, s, []);
    }
    return out;
  };
  /** The architect's prompt cut at its titles: it serves the structures that grow by rules whole. */
  const structureCut = (text: string): Part[] => text.split(/\n(?=## )/).map((s, i) => ({ id: `structures:${/^## (.*)/.exec(s)?.[1] ?? (i ? '?' : 'intro')}`, text: s }));
  /** The parts a request reads, each with where it comes from: its role (the core, the core of the actions, the architect's prompt) and its section. */
  const partsOf = (c: Case): Array<Part & { where: string }> => {
    if (c.spec === 'architect') return structureCut(roleOf(c)).map((p) => ({ ...p, where: 'architect' }));
    const trade = c.spec === 'actions' ? S.specialtyOf(classOf(c.req.classe)!, c.req) : c.spec;
    return [...cut(roleOf(c)).map((p) => ({ ...p, where: c.spec === 'actions' ? 'nucleo delle azioni' : 'nucleo' })), ...cut(sectionOf(c)).map((p) => ({ ...p, where: `sezione ${trade}` }))];
  };

  /** Whether a request needs a part of what it reads: in doubt it does. */
  const SHOWCASE = ['schermo-scritte', 'schermo-struttura', 'circuito-3D'];
  const needs = (c: Case, part: string, examples: string[]): boolean => {
    const cls = classOf(c.req.classe)!;
    const figure = ['person', 'animal', 'beast'].includes(cls.id);
    if (c.spec === 'architect') return true;
    // An action writes `<action>`s: of its trade's section it uses the lines on opening and shutting (T470).
    if (c.spec === 'actions') return ['intro', 'coordinates', 'program', 'patterns', 'nodes', 'traps', 'look.children', 'craft.opening'].includes(part);
    if (part === 'palette.colours' || part.startsWith('trade:') || part === 'trade') return true;
    if (part === 'look.files') return resources.length > 0;
    if (part.startsWith('class:')) return part === `class:${cls.id}`;
    if (part === 'sizes') return !!c.req.taglia && sizeOf(c.req.taglia)?.id !== cls.taglia;
    if (part === 'program.limbs' || part === 'sculpt.people') return figure;
    if (part === 'look.wfc' || part === 'look.convchain' || part === 'look.import') return resources.length > 0;
    if (part === 'colour') return !!c.req.tinta;
    if (part === 'showcase') return examples.some((x) => SHOWCASE.some((id) => x.includes(id)));
    if (part === 'worn') return !!c.req.worn;
    if (part === 'vessels') return isVessel(cls);
    // The lines of the crafts of T470 that serve some classes of their trade only: the wind the plants, opening, putting down and
    // carrying the furniture, holding the objects; four legs the animals and the beasts, the hand who has hands; doors, windows and
    // roofs what one enters, the base of a monument the monuments.
    if (part === 'craft.wind') return cls.id === 'tree' || cls.id === 'bush';
    if (part === 'craft.opening' || part === 'craft.shelves' || part === 'craft.carrying') return cls.id === 'furniture';
    if (part === 'craft.holding') return cls.id === 'object';
    if (part === 'craft.fours') return cls.id === 'animal' || cls.id === 'beast';
    if (part === 'craft.hand') return cls.id === 'person' || cls.id === 'beast';
    if (part === 'craft.door' || part === 'craft.windows' || part === 'craft.roofs') return cls.id === 'building' || cls.id === 'structure';
    if (part === 'craft.monument') return cls.id === 'monument';
    return true;
  };

  const sculptors = (route: 'google' | 'openrouter', day: string) => S.sculptorsOn({}, route, day);
  const ROUTES: Array<{ name: string; route: 'google' | 'openrouter'; day: string }> = [
    { name: 'Google, oggi', route: 'google', day: '2026-11-21' },
    { name: 'Google, dall’1/12', route: 'google', day: '2026-12-01' },
    { name: 'OpenRouter, dall’1/12', route: 'openrouter', day: '2026-12-01' },
  ];
  /** Dollars a token of the stable prefix costs on a model: the implicit cache serves a share of it (T325), none on 3.8 Flash. */
  const perToken = (model: string, day: string): number => {
    const p = priceOf(model, day);
    if (!p) return 0;
    const s = NO_IMPLICIT_CACHE.has(model) ? 0 : IMPLICIT_CACHE_SHARE;
    return ((1 - s) * p.input + s * p.cached) / 1e6;
  };
  const modelOf = (c: Case, route: 'google' | 'openrouter', day: string): string => {
    const m = sculptors(route, day);
    return c.spec === 'actions' ? m.simple : S.modelFor(c.req, classOf(c.req.classe)!, m, day);
  };

  // Each request: its parts, their tokens, what is not needed.
  interface Row {
    c: Case;
    system: number;
    role: number;
    section: number;
    examples: number;
    rest: number;
    prompt: number;
    waste: number;
    wasted: string[];
    /** The parts it reads and those it does not use, as `where|id`. */
    reads: Set<string>;
    unused: Set<string>;
    sameSystem: boolean;
    exampleIds: string[];
  }
  const rows: Row[] = [];
  // The tokens of every part the requests read, by where it comes from (the core, a section, the architect's prompt): `where|id`.
  const partTokens = new Map<string, number>();
  const fixed = { principles: await tokens(COUNCIL_PRINCIPLES), language: await tokens(language), context: await tokens(context) };
  for (const c of CASES) {
    const rec = sent.get(c.key);
    if (!rec) continue;
    const cls = classOf(c.req.classe)!;
    const proc = c.spec !== 'actions' && S.procedural(cls, c.req.taglia);
    const examples = proc || c.spec === 'actions' ? [] : S.examplesFor(files, { ...c.req, classe: cls.id });
    const exampleText = examples.length ? `## Examples (programs of the library)\n${examples.join('\n\n')}` : '';
    const role = roleOf(c);
    const section = sectionOf(c);
    const sameSystem = rec.system === systemOf([role, COUNCIL_PRINCIPLES, language, context], [section, exampleText]).system;
    const tokensOf = new Map<string, number>();
    for (const p of partsOf(c)) {
      const key = `${p.where}|${p.id}`;
      tokensOf.set(key, (tokensOf.get(key) ?? 0) + (await tokens(p.text)));
    }
    for (const [key, t] of tokensOf) if (!partTokens.has(key)) partTokens.set(key, t);
    const idOf = (key: string) => key.slice(key.indexOf('|') + 1);
    const unused = new Set([...tokensOf.keys()].filter((key) => !needs(c, idOf(key), examples)));
    const wasted = [...unused].map(idOf);
    const waste = [...unused].reduce((n, key) => n + (tokensOf.get(key) ?? 0), 0);
    rows.push({
      c,
      system: await tokens(rec.system),
      role: await tokens(role),
      section: await tokens(section),
      examples: await tokens(exampleText),
      rest: fixed.principles + fixed.language + fixed.context,
      prompt: await tokens(rec.prompt),
      waste,
      wasted,
      reads: new Set(tokensOf.keys()),
      unused,
      sameSystem,
      exampleIds: examples.map((x) => Object.keys(files).find((p) => /^models\/[^/]+\.xml$/.test(p) && files[p].trim() === x)?.slice(7, -4) ?? '?'),
    });
  }
  // The measure of before (`--prima`, a --json of this mode before T468): the system each request had then.
  const prima = opt('prima') ? (JSON.parse(fs.readFileSync(path.resolve(opt('prima')!), 'utf8')) as { rows: Array<{ key: string; system: number; role: number; section?: number }> }) : undefined;
  const before = new Map((prima?.rows ?? []).map((x) => [x.key, x]));

  // The share of the Sculptor's work: the real universes (or `--universi`), each kind by its calls (two programs for a simple thing,
  // one and half a revision for a figure or a built thing, three for a structure that grows by rules).
  let share = { ...SCULPTED_SHARE };
  const read: string[] = [];
  const best: Array<{ universe: string; id: string; cls: string; score: number; author: string; xml: string }> = [];
  // The library of each universe (T467): its models/ as the kernel reads them, for the examples each request would get there.
  const libraries = new Map<string, Record<string, string>>();
  if (opt('universi')) {
    share = Object.fromEntries(Object.keys(SCULPTED_SHARE).map((k2) => [k2, 0]));
    const root = path.resolve(opt('universi')!);
    for (const u of fs.readdirSync(root)) {
      const idxFile = path.join(root, u, 'models', 'index.json');
      if (!fs.existsSync(idxFile)) continue;
      read.push(u);
      const library: Record<string, string> = { 'models/index.json': fs.readFileSync(idxFile, 'utf8') };
      for (const f of fs.readdirSync(path.join(root, u, 'models'))) if (f.endsWith('.xml')) library[`models/${f}`] = fs.readFileSync(path.join(root, u, 'models', f), 'utf8');
      libraries.set(u, library);
      const idx = JSON.parse(fs.readFileSync(idxFile, 'utf8')) as Record<string, { class?: string; author?: string; size?: string; tint?: string; sound?: unknown; name?: string }>;
      const programs = new Set<string>();
      for (const [id, info] of Object.entries(idx)) {
        const scored = (info as { score?: number } | undefined)?.score;
        if (typeof scored === 'number' && info.class && !/mano/.test(info.author ?? '')) best.push({ universe: u, id, cls: info.class, score: scored, author: info.author ?? '', xml: path.join(root, u, 'models', `${id}.xml`) });
        if (!info || typeof info !== 'object' || /mano/.test(info.author ?? '') || info.sound || !info.class || info.class === 'suono' || info.class === 'sound') continue;
        const xml = fs.existsSync(path.join(root, u, 'models', `${id}.xml`)) ? fs.readFileSync(path.join(root, u, 'models', `${id}.xml`), 'utf8') : '';
        const cls = classOf(info.class);
        if (!cls) continue;
        let kind = cls.id;
        if (cls.id === 'object') kind = /<worn\b/.test(xml) ? 'object-worn' : info.tint || id.startsWith('shape-') ? 'object-tinted' : 'object';
        if (cls.id === 'structure') {
          if (!S.procedural(cls, info.size)) kind = 'structure-medium';
          else {
            // One program for its sizes (ADR-0160): counted once.
            const body = xml.replace(/^\s*<!--[\s\S]*?-->\s*/, '');
            if (programs.has(body)) continue;
            programs.add(body);
            kind = isFortified(info.name ?? id) ? 'structure-fort' : 'structure-large';
          }
        }
        share[kind] = (share[kind] ?? 0) + 1;
      }
    }
  }
  const plan = sculptPlan(1);
  const callsOf = (c: Case): number => {
    const cls = classOf(c.req.classe)!;
    if (S.procedural(cls, c.req.taglia)) return STRUCTURE_SCULPT.calls;
    return S.categoryOf(cls) === 'simple' ? plan.semplici : 1 + (plan.revisione ? 0.5 : 0);
  };
  const sculpts = rows.filter((x) => x.c.spec !== 'actions');
  const total = sculpts.reduce((n, x) => n + (share[x.c.key] ?? 0), 0) || 1;
  const callsPerModel = sculpts.reduce((n, x) => n + ((share[x.c.key] ?? 0) / total) * callsOf(x.c), 0);

  // The hour of the lobby (HOUR, knobs at 1): its calls of «Modelli nuovi», as many models as those calls make at the real mix.
  const est = hourlyEstimate(k.config.ai);
  const hourCalls = est.righe.find((x) => x.voce === COEFFICIENT_INFO.models.nome)?.chiamate ?? 0;
  const modelsPerHour = hourCalls / callsPerModel;
  // The Genesis: the models it asks for, by class (a structure that grows by rules once per concept).
  const genesisKinds = new Map<string, number>();
  const concepts = new Set<string>();
  for (const q of atGenesis) {
    const cls = classOf(q.classe);
    if (!cls) continue;
    let kind = cls.id;
    if (cls.id === 'object') kind = q.worn ? 'object-worn' : q.tinta ? 'object-tinted' : 'object';
    if (cls.id === 'structure') {
      if (!S.procedural(cls, q.taglia)) kind = 'structure-medium';
      else {
        const concept = q.nome;
        if (concepts.has(concept)) continue;
        concepts.add(concept);
        kind = S.fortifiedOf(q) ? 'structure-fort' : 'structure-large';
      }
    }
    genesisKinds.set(kind, (genesisKinds.get(kind) ?? 0) + 1);
  }

  const fmt = (v: number) => v.toLocaleString('it-IT', { maximumFractionDigits: 0 });
  const usd = (v: number) => (v < 0.01 ? v.toFixed(4) : v.toFixed(3));
  const out: string[] = [];
  out.push(`Token: ${counting ? 'countTokens di Gemini (gemini-3.1-flash-lite)' : 'stima a 3,5 caratteri per token'}. Risorse di models/ nella richiesta (tileset, campioni, regole da file): ${resources.length}.`);
  out.push('', '### Le richieste, una per tipo', '', `| tipo | specialità | modello (Google, oggi) | sistema | di cui ruolo | di cui sezione | di cui esempi | principi, lingua, stile | richiesta | non serve | quota del totale |${prima ? ' sistema prima | differenza |' : ''} esempi della libreria |`, `|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|${prima ? '---:|---:|' : ''}---|`);
  for (const x of rows) {
    const all = x.system + x.prompt;
    const then = before.get(x.c.key);
    const diff = then ? `${x.system - then.system > 0 ? '+' : ''}${fmt(x.system - then.system)}` : '—';
    out.push(`| ${x.c.key} | ${x.c.spec} | ${modelOf(x.c, 'google', '2026-11-21')} | ${fmt(x.system)} | ${fmt(x.role)} | ${fmt(x.section)} | ${fmt(x.examples)} | ${fmt(x.rest)} | ${fmt(x.prompt)} | ${fmt(x.waste)} | ${Math.round((x.waste / all) * 100)} % |${prima ? ` ${then ? fmt(then.system) : '—'} | ${diff} |` : ''} ${x.exampleIds.join(', ') || '—'} |`);
  }
  // The parts of the core, of each section and of the architect's prompt (T468): their tokens, and who of the requests that read them needs them.
  out.push('', '### Le parti del nucleo, delle sezioni e del prompt dell’Architetto', '', '| dove | parte | token | chi la legge e la usa |', '|---|---|---:|---|');
  for (const [key, t] of partTokens) {
    const [where, id] = [key.slice(0, key.indexOf('|')), key.slice(key.indexOf('|') + 1)];
    const readers = rows.filter((x) => x.reads.has(key));
    const users = readers.filter((x) => !x.unused.has(key)).map((x) => x.c.key);
    out.push(`| ${where} | ${id.replace('structures:', '')} | ${fmt(t)} | ${users.length === readers.length ? `tutti quelli che la leggono (${readers.length})` : `${users.join(', ') || 'nessuno'} (su ${readers.length}: ${readers.map((x) => x.c.key).join(', ')})`} |`);
  }
  const coreTokens = await tokens(S.sculptorRole(files, 'joiner'));
  out.push(`| **nucleo** | | **${fmt(coreTokens)}** | ogni mestiere tranne l’Architetto |`);
  out.push(`| **nucleo delle azioni** | | **${fmt(await tokens(S.sculptorRole(files, 'actions')))}** | le azioni |`);
  for (const s of S.SPECIALTIES.filter((x) => x !== 'architect' && x !== 'actions')) out.push(`| **sezione ${s}** (${S.SPECIALTY_NAMES[s]}) | | **${fmt(await tokens(S.sculptorSection(files, s)))}** | |`);
  out.push(`| **prompt dell’Architetto** | | **${fmt(await tokens(S.sculptorRole(files, 'architect')))}** | le strutture che crescono a regole |`);
  out.push('', `Principi del Concilio ${fmt(fixed.principles)}, blocco «Lingua» ${fmt(fixed.language)}, contesto dello Scultore (guida di stile della Genesi offline) ${fmt(fixed.context)} token.`);

  // The dollars: per call, per Genesis, per hour, on each route; against the measure of before, what the trades took away.
  out.push('', '### Il risparmio', '', `Ripartizione del lavoro dello Scultore (modelli scolpiti negli universi veri${read.length ? `, ${read.join(', ')}` : ', 21/11/2026'}): ${sculpts.map((x) => `${x.c.key} ${share[x.c.key] ?? 0}`).join(', ')}; ${callsPerModel.toFixed(2)} chiamate a modello. Un'ora della lobby (HOUR, manopole a 1): ${fmt(hourCalls)} chiamate di «${COEFFICIENT_INFO.models.nome}», ${modelsPerHour.toFixed(1)} modelli. La Genesi offline chiede ${atGenesis.length} modelli (${[...genesisKinds.entries()].map(([k2, n]) => `${k2} ${n}`).join(', ')}).${prima ? ` «Tolti rispetto a prima»: il sistema di ogni richiesta contro quello di \`${opt('prima')}\`.` : ''}`, '', `| via | ciò che non serve ancora, $ a chiamata (media pesata) | token che non servono ancora, a chiamata | ${prima ? 'token tolti rispetto a prima, a chiamata | $ tolti a chiamata | $ tolti per Genesi | $ tolti per ora di gioco | ' : ''}$ per ora di gioco di ciò che non serve | quota della spesa dello Scultore l’ora | gli esempi, $ l’ora | lo Scultore l’ora nella stima della lobby, $ |`, `|---|---:|---:|${prima ? '---:|---:|---:|---:|' : ''}---:|---:|---:|---:|`);
  const json: Record<string, unknown> = { rows: rows.map((x) => ({ key: x.c.key, spec: x.c.spec, system: x.system, role: x.role, section: x.section, examples: x.examples, prompt: x.prompt, waste: x.waste, wasted: x.wasted, ...(before.get(x.c.key) ? { before: before.get(x.c.key)!.system } : {}) })), share, callsPerModel, hourCalls, modelsPerHour, genesis: Object.fromEntries(genesisKinds), parts: Object.fromEntries(partTokens), fixed, core: coreTokens };
  const routes: Record<string, unknown> = {};
  for (const route of ROUTES) {
    let perCall = 0;
    let tokensCut = 0;
    let hourSpend = 0;
    let examplesPerCall = 0;
    let savedTokens = 0;
    let savedPerCall = 0;
    for (const x of sculpts) {
      const w = ((share[x.c.key] ?? 0) / total) * callsOf(x.c) / callsPerModel;
      const model = modelOf(x.c, route.route, route.day);
      perCall += w * x.waste * perToken(model, route.day);
      examplesPerCall += w * x.examples * perToken(model, route.day);
      tokensCut += w * x.waste;
      const then = before.get(x.c.key);
      if (then) {
        savedTokens += w * (then.system - x.system);
        savedPerCall += w * (then.system - x.system) * perToken(model, route.day);
      }
      // What a call of that kind costs whole (its system and request at the cache share, the output of T352, a structure's of T397).
      const proc = S.procedural(classOf(x.c.req.classe)!, x.c.req.taglia);
      const outTok = proc ? STRUCTURE_SCULPT.output : 3000;
      const promptTok = proc ? STRUCTURE_SCULPT.prompt : x.system + x.prompt;
      hourSpend += w * ((x.system * perToken(model, route.day) * 1e6 + (promptTok - x.system) * (priceOf(model, route.day)?.input ?? 0)) / 1e6 + (costOf(model, { prompt: 0, output: outTok }, route.day) ?? 0));
    }
    let genesis = 0;
    let genesisSaved = 0;
    for (const [kind, n] of genesisKinds) {
      const x = sculpts.find((y) => y.c.key === kind);
      if (!x) continue;
      const per = perToken(modelOf(x.c, route.route, route.day), route.day);
      genesis += n * callsOf(x.c) * x.waste * per;
      const then = before.get(x.c.key);
      if (then) genesisSaved += n * callsOf(x.c) * (then.system - x.system) * per;
    }
    const hour = perCall * hourCalls;
    const lobby = hourlyEstimate(k.config.ai, route.day, { route: route.route }).righe.find((x) => x.voce === COEFFICIENT_INFO.models.nome)?.dollari ?? 0;
    out.push(`| ${route.name} | ${usd(perCall)} | ${fmt(tokensCut)} | ${prima ? `${fmt(savedTokens)} | ${usd(savedPerCall)} | ${usd(genesisSaved)} | ${usd(savedPerCall * hourCalls)} | ` : ''}${usd(hour)} | ${Math.round((perCall / hourSpend) * 100)} % | ${usd(examplesPerCall * hourCalls)} | ${usd(lobby)} |`);
    routes[route.name] = { perCall, tokensCut, genesis, hour, share: perCall / hourSpend, examplesHour: examplesPerCall * hourCalls, callSpend: hourSpend, lobby, ...(prima ? { savedTokens, savedPerCall, genesisSaved, savedHour: savedPerCall * hourCalls } : {}) };
  }
  json.routes = routes;

  // The examples in the seed and in the real universes (T467): what each request gets from each library, with the rule of before
  // (`examplesBeforeT467`) and with today's (`examplesFor`), and what they cost in an hour of the lobby on each route.
  {
    const libs: Array<[string, Record<string, string>]> = [['seme', files], ...libraries];
    const ruleOf = { prima: examplesBeforeT467, dopo: S.examplesFor } as const;
    const seen = new Map<string, number>();
    const chosen: Record<string, Record<string, Record<string, { ids: string[]; tokens: number }>>> = { prima: {}, dopo: {} };
    for (const [rule, pick] of Object.entries(ruleOf) as Array<[keyof typeof ruleOf, typeof S.examplesFor]>) {
      for (const [u, lib] of libs) {
        const idx = JSON.parse(lib['models/index.json'] ?? '{}') as Record<string, { score?: unknown }>;
        const idOf = new Map<string, string>();
        for (const p of Object.keys(lib).sort()) if (/^models\/[^/]+\.xml$/.test(p) && !idOf.has(lib[p].trim())) idOf.set(lib[p].trim(), p.slice(7, -4));
        chosen[rule][u] = {};
        for (const x of sculpts) {
          const cls = classOf(x.c.req.classe)!;
          const ex = S.procedural(cls, x.c.req.taglia) ? [] : pick(lib, { ...x.c.req, classe: cls.id });
          const text = ex.length ? `## Examples (programs of the library)\n${ex.join('\n\n')}` : '';
          const t = seen.get(text) ?? (await tokens(text));
          seen.set(text, t);
          const ids = ex.map((e) => {
            const id = idOf.get(e) ?? '?';
            const v = idx[id]?.score;
            return typeof v === 'number' ? `${id} (${v})` : id;
          });
          chosen[rule][u][x.c.key] = { ids, tokens: t };
        }
      }
    }
    out.push('', '### Gli esempi di ogni richiesta, nel seme e negli universi veri (T467)', '', `Prima: i primi due programmi della famiglia, quelli a mano davanti. Dopo (\`examplesFor\`): un modello a mano del seme della classe (il generico per primo, nella scatola della richiesta) e, se c’è, il migliore dell’universo della stessa classe, taglia e densità con voto ≥ ${S.EXAMPLE_SCORE} (il voto fra parentesi). Ogni cella: gli esempi, poi i token della loro sezione.`, '', `| tipo | ${libs.map(([u]) => `${u}, prima | ${u}, dopo`).join(' | ')} |`, `|---|${libs.map(() => '---|---').join('|')}|`);
    const cell = (c?: { ids: string[]; tokens: number }) => (c && c.ids.length ? `${c.ids.join(' + ')}: ${fmt(c.tokens)}` : '—');
    for (const x of sculpts) out.push(`| ${x.c.key} | ${libs.map(([u]) => `${cell(chosen.prima[u][x.c.key])} | ${cell(chosen.dopo[u][x.c.key])}`).join(' | ')} |`);
    out.push('', '| via | ' + libs.map(([u]) => `${u}, prima | ${u}, dopo`).join(' | ') + ' |', `|---|${libs.map(() => '---:|---:').join('|')}|`);
    const hours: Record<string, Record<string, Record<string, number>>> = {};
    for (const route of ROUTES) {
      const cells: string[] = [];
      for (const [u] of libs) {
        for (const rule of ['prima', 'dopo'] as const) {
          let perCall = 0;
          let tokensPerCall = 0;
          for (const x of sculpts) {
            const w = (((share[x.c.key] ?? 0) / total) * callsOf(x.c)) / callsPerModel;
            const t = chosen[rule][u][x.c.key]?.tokens ?? 0;
            perCall += w * t * perToken(modelOf(x.c, route.route, route.day), route.day);
            tokensPerCall += w * t;
          }
          ((hours[route.name] ??= {})[u] ??= {})[rule] = perCall * hourCalls;
          ((hours.tokens ??= {})[u] ??= {})[rule] = tokensPerCall;
          cells.push(usd(perCall * hourCalls));
        }
      }
      out.push(`| ${route.name}, gli esempi in $ l’ora | ${cells.join(' | ')} |`);
    }
    out.push(`| token di esempi a chiamata (media pesata) | ${libs.map(([u]) => `${fmt(hours.tokens[u].prima)} | ${fmt(hours.tokens[u].dopo)}`).join(' | ')} |`);
    json.examples = { chosen, hours };
  }

  // The trades (T468): what each reads now (its role and its section) against what it read before, and what of it its requests do not use.
  out.push('', '### Le specialità: ciò che leggono', '', `| specialità | richieste | ruolo e sezione | di cui non serve (la richiesta che ne usa meno) |${prima ? ' ruolo e sezione di prima | differenza |' : ''}`, `|---|---|---:|---:|${prima ? '---:|---:|' : ''}`);
  for (const spec of [...new Set(rows.map((x) => x.c.spec))]) {
    const of = rows.filter((x) => x.c.spec === spec);
    const reads = Math.max(...of.map((x) => x.role + x.section));
    const unused = Math.max(...of.map((x) => x.waste));
    // What the same requests read before: the role and, since T468, the section (a measure of before T468 has the whole prompt as its role).
    const then = Math.max(0, ...of.map((x) => (before.get(x.c.key)?.role ?? 0) + (before.get(x.c.key)?.section ?? 0)));
    out.push(`| ${spec} (${S.SPECIALTY_NAMES[spec as keyof typeof S.SPECIALTY_NAMES]}) | ${of.map((x) => x.c.key).join(', ')} | ${fmt(reads)} | ${fmt(unused)} |${prima ? ` ${then ? fmt(then) : '—'} | ${then ? `${reads - then > 0 ? '+' : ''}${fmt(reads - then)}` : '—'} |` : ''}`);
  }

  // Few-shot (T458 § c): what the candidate examples cost, against the instructions they would stand beside or replace.
  const fort = fs.existsSync('lab/mjx/models/handmade/forte-handmade.xml') ? fs.readFileSync('lab/mjx/models/handmade/forte-handmade.xml', 'utf8') : '';
  const snippet = (re: RegExp) => re.exec(fort)?.[0] ?? '';
  const candidates: Array<[string, string]> = [
    ['il forte dell’autore, intero (forte-handmade.xml)', fort],
    ['il forte: il ciclo che allarga il mastio (<markov> con l’uscita z)', snippet(/<!-- expands the keep -->[\s\S]*?<\/markov>/)],
    ['il forte: il cortile a bracci che si fermano a caso (il primo <markov>)', snippet(/<!-- the courtyard: a rectangle[\s\S]*?<\/markov>/)],
    ['il forte: i piani del mastio, uno dopo l’altro finché il 50 % lo ferma', snippet(/<one in="B x" out="#6 x" steps="1"\/>[\s\S]*?<all in="r" out="D" steps="1" symmetry="\(\)"\/>/)],
    ['il forte: le viste in testo (forte-v1-viste.txt)', fs.existsSync('lab/banco/riferimento/ottima/forte-v1-viste.txt') ? fs.readFileSync('lab/banco/riferimento/ottima/forte-v1-viste.txt', 'utf8') : ''],
    ...['forte', 'palazzina', 'tempio', 'cantiere', 'cantina'].map((n): [string, string] => [`riferimento del banco: ${n}.xml`, fs.existsSync(`lab/banco/riferimento/${n}.xml`) ? fs.readFileSync(`lab/banco/riferimento/${n}.xml`, 'utf8') : '']),
    ['la villetta offline (MOCK_STRUCTURE_PROGRAM)', (await import('../../src/kernel/ai/mockStructure')).MOCK_STRUCTURE_PROGRAM],
    ...Object.keys(files).filter((p) => /^models\/part-[a-z-]+\.xml$/.test(p)).sort().map((p): [string, string] => [`parte del seme: ${p.slice(7)}`, files[p]]),
  ];
  out.push('', '### I candidati del few-shot', '', '| esempio | caratteri | token |', '|---|---:|---:|');
  const fewShot: Record<string, number> = {};
  for (const [name, text] of candidates) {
    if (!text) continue;
    const t = await tokens(text);
    fewShot[name] = t;
    out.push(`| ${name} | ${fmt(text.length)} | ${fmt(t)} |`);
  }
  json.fewShot = fewShot;
  if (best.length) {
    // The best of each class in the real universes by the Artist's vote: what an example of the universe itself would cost.
    out.push('', '### I migliori degli universi per voto dell’Artista (un esempio per classe)', '', '| classe | modello | universo | voto | autore | token |', '|---|---|---|---:|---|---:|');
    const byClass = new Map<string, (typeof best)[number]>();
    for (const b of best.sort((a, z) => z.score - a.score || a.id.localeCompare(z.id))) if (!byClass.has(b.cls) && fs.existsSync(b.xml)) byClass.set(b.cls, b);
    const scores = best.map((b) => b.score);
    for (const b of byClass.values()) out.push(`| ${b.cls} | ${b.id} | ${b.universe} | ${b.score} | ${b.author} | ${fmt(await tokens(fs.readFileSync(b.xml, 'utf8')))} |`);
    out.push('', `Modelli con un voto: ${best.length}; il voto medio ${(scores.reduce((a, z) => a + z, 0) / scores.length).toFixed(1)}, da 7 in su ${scores.filter((v) => v >= 7).length}.`);
  }
  out.push('', `Classi del gioco: ${CLASSES.map((c) => c.id).join(', ')}.`);
  console.log(out.join('\n'));
  if (opt('json')) fs.writeFileSync(path.resolve(opt('json')!), JSON.stringify(json, null, 1) + '\n');
  const head = [
    '# Il prompt dello Scultore, richiesta per richiesta (T458, S1-S4)',
    '',
    `Scritto da \`npx vite-node lab/scripts/prompt-tokens.ts -- ${argv.join(' ')}\` il ${new Date().toISOString().slice(0, 10)}, kernel ${(await import('../../src/kernel/version')).KERNEL_VERSION}: nessuna chiamata ai modelli (\`countTokens\` è gratis). Lo studio è [\`../scultori-specializzati.md\`](../scultori-specializzati.md).`,
    '',
  ];
  if (opt('md')) fs.writeFileSync(path.resolve(opt('md')!), [...head, ...out].join('\n') + '\n');
  const bad = rows.filter((x) => !x.sameSystem).map((x) => x.c.key);
  if (bad.length) console.log(`attenzione: il sistema registrato non è quello ricomposto per ${bad.join(', ')}`);
}

if (opt('capture')) await capture(opt('capture')!);
else if (argv.includes('--scultore')) await sculptorSpecialties();
else if (argv.includes('--cache')) await cacheSaving();
else if (argv.includes('--campaign')) await campaignCost();
else if (argv.includes('--count')) await count(argv[argv.indexOf('--count') + 1], argv[argv.indexOf('--count') + 2]);
else if (opt('roles')) await roles(opt('roles')!);
else console.log('uso: --capture <file> | --count <prima> <dopo> | --roles <ref git> | --cache [--persone 6] [--ore 1] [--json f] | --campaign [--file f.md] [--json f] | --scultore [--conta] [--universi <cartella>] [--md f] [--json f]');
