// The paid trial of the OpenRouter adapter (T362, ADR-0193): about ten calls through the game's own OpenRouterAiModels and OpenRouterDecisionModels,
// with the author's key (OPENROUTER_API_KEY, read here only from the .env files, never printed nor written). Schemas on Flash-Lite, 3.8 Flash and
// Argon, a photograph to the Artist's model and to Flash-Lite, three decisions of Jev; every call in the kernel's usage ledger, the cost OpenRouter
// said beside the one of the price list. It stops past a cap (`--tetto`, 0.05 $ by default). The report in lab/banco/openrouter/prova.md and the
// answers as they came (no key, no header) in lab/banco/openrouter/risposte.json: they can become the recorded answers of tests/openrouter.test.ts.
//
//   npx vite-node lab/scripts/openrouter-prova.ts -- --offline            # a fake OpenRouter: nothing spent, the plumbing checked
//   npx vite-node lab/scripts/openrouter-prova.ts -- [--env <file>]… [--tetto 0.05] [--senza argon] [--scrivi lab/banco/openrouter/prova.md]

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { OPENROUTER_API, OpenRouterAiModels, OpenRouterDecisionModels } from '../../src/kernel/ai/openrouter';
import { parseJson, type Schema, type TextCall } from '../../src/kernel/ai/models';
import { callCost, UsageLog, tallyLine, type CallRecord } from '../../src/kernel/ai/usage';
import { costOf, usd } from '../../src/kernel/ai/prices';
import type { DecisionCall, DecisionQuestion } from '../../src/kernel/ai/decisions';

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const opt = (n: string) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);
const opts = (n: string) => argv.flatMap((a, i) => (a === `--${n}` && argv[i + 1] ? [argv[i + 1]] : []));
const OUT = 'lab/banco/openrouter';

/** The .env files to read: the ones given, else this checkout's, the main checkout's and the other worktrees' (a worktree has none of its own). */
function envFiles(): string[] {
  const given = opts('env');
  if (given.length) return given;
  const out = [path.resolve('.env')];
  try {
    const root = path.resolve(execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim(), '..');
    out.push(path.join(root, '.env'));
    const wt = path.join(root, '.claude', 'worktrees');
    if (fs.existsSync(wt)) for (const d of fs.readdirSync(wt)) if (fs.existsSync(path.join(wt, d, '.env'))) out.push(path.join(wt, d, '.env'));
  } catch {
    /* not a repository */
  }
  return out;
}

/** The key from the first .env that has it: only whether there is one is ever told. */
function readKey(name: string): string | undefined {
  for (const f of envFiles()) {
    try {
      const v = new RegExp(`^${name}\\s*=\\s*"?([^"\\r\\n]+)"?`, 'm').exec(fs.readFileSync(f, 'utf8'))?.[1]?.trim();
      if (v) return v;
    } catch {
      /* missing file */
    }
  }
  return undefined;
}

/** A PNG of `size` pixels, white with a red square in the middle: the Artist's photograph, made here (no renderer in Node). */
function squarePng(size = 48): string {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b: Buffer) => {
    let c = 0xffffffff;
    for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const rows: Buffer[] = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    for (let x = 0; x < size; x++) {
      const inside = x >= size / 4 && x < (size * 3) / 4 && y >= size / 4 && y < (size * 3) / 4;
      row.set(inside ? [220, 30, 30] : [255, 255, 255], 1 + x * 3);
    }
    rows.push(row);
  }
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

const PLACE: Schema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING', description: 'nome del luogo, in italiano' },
    kind: { type: 'STRING', enum: ['bosco', 'villaggio', 'palude'] },
    things: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, count: { type: 'INTEGER' } }, required: ['id', 'count'] } },
  },
  required: ['name', 'kind', 'things'],
};
const PHOTO: Schema = { type: 'OBJECT', properties: { color: { type: 'STRING', enum: ['rosso', 'verde', 'blu', 'giallo'] }, shape: { type: 'STRING', description: 'la forma, in una parola' } }, required: ['color', 'shape'] };
const SYSTEM = 'Sei il Cartografo di un mondo di pastori. Rispondi solo con il JSON chiesto, in italiano.';

const TEXTS: Array<{ label: string; call: TextCall; check: (v: any) => boolean }> = [
  { label: 'Flash-Lite, schema', call: { agent: 'cartographer', task: 'chunk.plan', system: SYSTEM, prompt: 'Un luogo sulle colline con pecore e un pozzo: nome, tipo e da 2 a 4 cose con quante sono.', schema: PLACE, thinking: 'low' }, check: (v) => typeof v.name === 'string' && Array.isArray(v.things) },
  { label: 'Flash-Lite, schema (2)', call: { agent: 'cartographer', task: 'chunk.plan', system: SYSTEM, prompt: 'Un luogo nella palude con canne e una barca: nome, tipo e da 2 a 4 cose.', schema: PLACE, thinking: 'low', temperature: 0.4 }, check: (v) => ['bosco', 'villaggio', 'palude'].includes(v.kind) },
  { label: 'Flash-Lite, testo senza ragionamento', call: { agent: 'narrator', task: 'npc.reply', system: 'Sei una pastora delle colline. Rispondi in una frase.', prompt: 'Il viandante chiede: «Dove posso trovare acqua?»', thinking: 'off' }, check: () => true },
  { label: '3.8 Flash, schema (senza temperatura)', call: { agent: 'actor', task: 'chunk.plan', model: 'gemini-3.8-flash', system: SYSTEM, prompt: 'Un villaggio con un mulino: nome, tipo e da 2 a 4 cose.', schema: PLACE, thinking: 'low' }, check: (v) => typeof v.name === 'string' },
  { label: 'Argon, schema', call: { agent: 'sculptor', task: 'chunk.plan', model: 'gemini-4-argon', system: SYSTEM, prompt: 'Un bosco di querce: nome, tipo e due cose.', schema: PLACE, thinking: 'low' }, check: (v) => typeof v.name === 'string' },
  { label: 'Flash-Lite, foto', call: { agent: 'artist', task: 'model.judge', system: 'Sei l’Artista: guardi una foto e dici cosa vedi.', prompt: 'Di che colore è la figura al centro, e che forma ha?', schema: PHOTO, images: [squarePng()], thinking: 'low' }, check: (v) => v.color === 'rosso' },
  { label: '3.5 Flash (l’Artista), foto', call: { agent: 'artist', task: 'model.judge', model: 'gemini-3.5-flash', system: 'Sei l’Artista: guardi una foto e dici cosa vedi.', prompt: 'Di che colore è la figura al centro, e che forma ha?', schema: PHOTO, images: [squarePng()], thinking: 'low' }, check: (v) => v.color === 'rosso' },
];

const TICKET: Record<string, DecisionQuestion> = {
  is_bug: { type: 'noul', instructions: 'Is this a bug report?' },
  team: { type: 'choice', instructions: 'Which team should handle it?', criteria: { payments: 'billing and charges', frontend: 'the web app', account: 'login and profile' } },
  urgency: { type: 'score', instructions: 'How urgent is it?', criteria: ['can wait', 'this week', 'today'] },
};
const REUSE: Record<string, DecisionQuestion> = {
  model: { type: 'choice', instructions: 'Which model of the library already shows the thing asked?', criteria: { barrel: 'a wooden barrel', crate: 'a wooden crate', new: 'none of them' } },
  fits: { type: 'noul', instructions: 'Does the chosen model really show the thing asked?' },
};
const DECISIONS: Array<{ label: string; call: DecisionCall; expect: Record<string, unknown> }> = [
  { label: 'Jev 1.13, tre tipi', call: { agent: 'arbiter', task: 'model.reuse', state: { tier: 'pro', ticket: 'I was charged twice for my subscription this morning' }, questions: TICKET, rule: { is_bug: false, team: 'account', urgency: 0 } }, expect: { team: 'payments' } },
  { label: 'Jev 1.13, riuso', call: { agent: 'sculptor', task: 'model.reuse', state: { thing: { name: 'botte di rovere', class: 'furniture' }, library: [{ id: 'barrel', name: 'botte' }, { id: 'crate', name: 'cassa' }] }, questions: REUSE, rule: { model: 'new', fits: false } }, expect: { model: 'barrel' } },
  { label: 'Jev 1.14, riuso', call: { agent: 'sculptor', task: 'model.reuse', model: 'jev-1.14.0', state: { thing: { name: 'cassa di legno', class: 'furniture' }, library: [{ id: 'barrel', name: 'botte' }, { id: 'crate', name: 'cassa' }] }, questions: REUSE, rule: { model: 'new', fits: false } }, expect: { model: 'crate' } },
];

/** OpenRouter as the tests know it: what the plumbing needs, nothing spent. */
function offlineFetch(): typeof fetch {
  return (async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    const usage = { prompt_tokens: 300, completion_tokens: 60, cost: 0.0001, prompt_tokens_details: { cached_tokens: 0 }, completion_tokens_details: { reasoning_tokens: 10 } };
    if (String(url).endsWith('/alpha/decisions')) {
      const answers = Object.fromEntries(Object.entries(body.questions as Record<string, any>).map(([id, q]) => [id, q.type === 'noul' ? { type: 'noul', noul: 0.8 } : q.type === 'choice' ? { type: 'choice', choice: Object.keys(q.criteria)[0] } : { type: 'score', score: 1, probabilities: { '1': 1 } }]));
      return new Response(JSON.stringify({ model: `${body.model}-offline`, answers, usage: { input_tokens: 400, output_tokens: 50, cost: 0.0000168 } }), { status: 200 });
    }
    const content = body.response_format ? JSON.stringify(body.response_format.json_schema.name === 'model_judge' ? { color: 'rosso', shape: 'quadrato' } : { name: 'Prato', kind: 'villaggio', things: [{ id: 'pozzo', count: 1 }] }) : 'Al pozzo, oltre il prato.';
    return new Response(JSON.stringify({ model: `${body.model}-offline`, choices: [{ finish_reason: 'stop', message: { role: 'assistant', content } }], usage }), { status: 200 });
  }) as unknown as typeof fetch;
}

async function main() {
  const offline = flag('offline');
  const key = offline ? undefined : readKey('OPENROUTER_API_KEY');
  if (!offline && !key) {
    console.error(`nessuna OPENROUTER_API_KEY in ${envFiles().join(', ')} (aggiungila al .env, o passa --env; --offline per provare senza)`);
    process.exit(1);
  }
  const cap = Number(opt('tetto') ?? 0.05);
  const skip = new Set((opt('senza') ?? '').split(',').filter(Boolean));
  // The key only here, in the header of the request: the adapter never sees it, as in the game (the gate adds it).
  const answers: Array<{ url: string; status: number; body: unknown }> = [];
  const base: typeof fetch = offline ? offlineFetch() : ((...a) => fetch(...a));
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const r = await base(url, { ...init, headers: { ...(init.headers as Record<string, string>), ...(key ? { Authorization: `Bearer ${key}` } : {}), 'X-Title': 'QUINE42 (prova T362)' } });
    const text = await r.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* kept as text */
    }
    answers.push({ url: String(url).replace(OPENROUTER_API, ''), status: r.status, body });
    return new Response(text, { status: r.status, headers: r.headers });
  }) as unknown as typeof fetch;

  const ledger = new UsageLog();
  const records: CallRecord[] = [];
  const listen = (r: CallRecord) => {
    ledger.record(r);
    records.push(r);
  };
  const models = new OpenRouterAiModels({ endpoint: OPENROUTER_API, textModel: 'gemini-3.1-flash-lite', limits: { text: 20 }, fetchImpl, timeout: 180_000 });
  models.onCall = listen;
  const jev = new OpenRouterDecisionModels({ endpoint: OPENROUTER_API, fetchImpl });
  jev.onCall = listen;

  const lines: string[] = [];
  const say = (s: string) => {
    console.log(s);
    lines.push(s);
  };
  say(`# La prova di OpenRouter (T362)\n\nData: ${new Date().toISOString().slice(0, 10)} · ${offline ? '**offline** (un OpenRouter finto: niente speso)' : 'con la chiave dell’autore'} · tetto ${usd(cap)}\n`);
  say('| Chiamata | Modello | Esito | ms | Token (ingresso / cache / risposta / ragionamento) | Costo detto | Costo dal listino |');
  say('|---|---|---|---|---|---|---|');
  const row = (label: string, before: number, ok: string, ms: number) => {
    for (const r of records.slice(before)) {
      const listed = costOf(r.model, { prompt: r.prompt, cached: r.cached, output: r.output, thoughts: r.thoughts });
      say(`| ${label} | \`${r.model}\` | ${ok} | ${ms} | ${r.prompt} / ${r.cached} / ${r.output} / ${r.thoughts} | ${r.usd === undefined ? 'non detto' : usd(r.usd)} | ${usd(listed)} |`);
    }
    if (records.length === before) say(`| ${label} | — | ${ok} | ${ms} | — | — | — |`);
  };
  for (const t of TEXTS) {
    if (ledger.session.usd > cap) break;
    if ([...skip].some((s) => (t.call.model ?? '').includes(s))) continue;
    const before = records.length;
    const t0 = Date.now();
    let ok: string;
    try {
      const text = await models.text(t.call);
      const v = t.call.schema ? parseJson<any>(text) : text;
      ok = t.check(v) ? `sì: ${JSON.stringify(v).slice(0, 80).replace(/\|/g, '/')}` : `forma inattesa: ${JSON.stringify(v).slice(0, 80).replace(/\|/g, '/')}`;
    } catch (e) {
      ok = `errore: ${(e as Error).message.slice(0, 120).replace(/\|/g, '/')}`;
    }
    row(t.label, before, ok, Date.now() - t0);
  }
  for (const d of DECISIONS) {
    if (ledger.session.usd > cap) break;
    const before = records.length;
    const t0 = Date.now();
    let ok: string;
    try {
      const got = await jev.decide(d.call);
      const right = Object.entries(d.expect).every(([k, v]) => got[k] === v);
      ok = `${right ? 'sì' : 'diversa'}: ${JSON.stringify(got)}`;
    } catch (e) {
      ok = `errore: ${(e as Error).message.slice(0, 120)}`;
    }
    row(d.label, before, ok, Date.now() - t0);
  }
  const listedTotal = records.reduce((s, r) => s + (costOf(r.model, { prompt: r.prompt, cached: r.cached, output: r.output, thoughts: r.thoughts }) ?? 0), 0);
  say(`\nIn tutto: ${tallyLine(ledger.session)}; dal listino sarebbero ${usd(listedTotal)}. Il registro ha preso il costo detto (\`callCost\`): ${usd(records.reduce((s, r) => s + (callCost(r) ?? 0), 0))}.`);
  say(`Serviti da: ${[...new Set(answers.map((a) => (a.body as any)?.model).filter(Boolean))].join(', ') || '—'}; fornitori: ${[...new Set(answers.map((a) => (a.body as any)?.provider).filter(Boolean))].join(', ') || '—'}.`);
  if (ledger.session.usd > cap) say(`\nFermata al tetto di ${usd(cap)}.`);
  const out = opt('scrivi') ?? `${OUT}/prova${offline ? '-offline' : ''}.md`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.join('\n') + '\n');
  if (!offline) fs.writeFileSync(`${OUT}/risposte.json`, JSON.stringify(answers, null, 1) + '\n');
  console.log(`\nrapporto in ${out}${offline ? '' : `, risposte in ${OUT}/risposte.json`}`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
