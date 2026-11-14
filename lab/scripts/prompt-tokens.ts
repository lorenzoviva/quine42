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

if (opt('capture')) await capture(opt('capture')!);
else if (argv.includes('--cache')) await cacheSaving();
else if (argv.includes('--campaign')) await campaignCost();
else if (argv.includes('--count')) await count(argv[argv.indexOf('--count') + 1], argv[argv.indexOf('--count') + 2]);
else if (opt('roles')) await roles(opt('roles')!);
else console.log('uso: --capture <file> | --count <prima> <dopo> | --roles <ref git> | --cache [--persone 6] [--ore 1] [--json f] | --campaign [--file f.md] [--json f]');
