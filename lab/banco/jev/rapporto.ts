// The tables of the Jev bench (T313) from its ledger: per group and kind, what each model got right, what 1000 decisions cost,
// how long a call took; the decisions the code composes (the companion Noul, the four Nouls and the kernel's own filter of words);
// the threshold under which the kernel's rule answers; the consistency with the options reversed and between two runs; the requests
// that ask for several people at once; what an hour of play would cost with N people. Everything from the ledger and the case files.

import fs from 'node:fs';
import path from 'node:path';
import { metaBreak } from '../../../src/kernel/fourthwall';
import { BENCH_DIR, CASES_DIR, consistency, JEV_PRICE, reportTable, spent, summarize, type Case, type CaseFile, type LedgerLine } from './banco';

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : '—');
const usd = (v: number) => (v < 0.001 ? `$${v.toFixed(6)}` : v < 1 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`);

function casesById(): Map<string, Case> {
  const out = new Map<string, Case>();
  if (!fs.existsSync(CASES_DIR)) return out;
  for (const f of fs.readdirSync(CASES_DIR).filter((f) => f.endsWith('.json'))) for (const c of (JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), 'utf8')) as CaseFile).cases) out.set(c.id, c as Case);
  return out;
}

const accepts = (e: unknown, v: unknown) => (Array.isArray(e) ? e.map(String).includes(String(v)) : String(e) === String(v));

/** The kind's main decision and how it is right, for the composite rows. */
function composites(lines: LedgerLine[], cases: Map<string, Case>): string[] {
  const out: string[] = ['## Le decisioni composte dal codice', '', 'Ciò che il codice ricava dalle risposte (lo schema «companion Noul» di TypeSafe, e il filtro di parole del kernel): nessuna chiamata in più.', '', '| compito | regola composta | modello | giuste |', '|---|---|---|---|'];
  // The model reuse: the Choice only when the companion Noul says that one fits.
  const models = new Map<string, [number, number]>();
  for (const l of lines.filter((l) => l.ok && l.kind === 'modello' && l.variant === 'base')) {
    const c = cases.get(l.case);
    if (!c) continue;
    const fits = (l.answers?.fits?.p ?? 0) >= 0.5;
    const top = (l.answers?.model?.top ?? []).find(([k]) => k !== 'nuovo')?.[0] ?? String(l.answers?.model?.v);
    const pick = fits ? (String(l.answers?.model?.v) !== 'nuovo' ? String(l.answers?.model?.v) : top) : 'nuovo';
    const r = models.get(l.model) ?? [0, 0];
    r[1]++;
    if (accepts(c.expected.model, pick)) r[0]++;
    models.set(l.model, r);
  }
  for (const [m, [a, b]] of models) out.push(`| modello | \`fits\` ≥ 0,5 ? la scelta migliore che non è «nuovo» : «nuovo» | ${m} | ${a}/${b} (${pct(a, b)}) |`);
  // The fourth wall: the kernel's words (metaBreak, free) or the model.
  const walls = new Map<string, [number, number]>();
  for (const l of lines.filter((l) => l.ok && l.kind === 'quarta-parete' && (l.variant === 'base' || l.variant === 'domande-2' || l.variant === 'oggi'))) {
    const c = cases.get(l.case);
    if (!c) continue;
    const words = !!metaBreak((c.state as any).text);
    const key = `${l.model} (${l.variant})`;
    const r = walls.get(key) ?? [0, 0];
    r[1]++;
    if ((words || l.answers?.breaks?.v === true) === c.expected.breaks) r[0]++;
    walls.set(key, r);
  }
  let regex = 0;
  let n = 0;
  for (const c of cases.values()) if (c.kind === 'quarta-parete') (n++, (regex += !!metaBreak((c.state as any).text) === c.expected.breaks ? 1 : 0));
  out.push(`| quarta-parete | il filtro di parole da solo (\`metaBreak\`) | kernel | ${regex}/${n} (${pct(regex, n)}) |`);
  for (const [m, [a, b]] of [...walls].sort()) out.push(`| quarta-parete | il filtro di parole **o** il modello | ${m} | ${a}/${b} (${pct(a, b)}) |`);
  return [...out, ''];
}

/** Jev when it is sure enough, the kernel's rule under the threshold: how many it decides and how many are right. */
function thresholds(lines: LedgerLine[], cases: Map<string, Case>): string[] {
  const out: string[] = [
    '## La soglia: sotto, decide la regola di oggi',
    '',
    'Per i compiti che il kernel decide già da sé (`rule` del caso): Jev risponde quando la probabilità della sua scelta è almeno la soglia, altrimenti vale la regola. «Jev decide» è la parte delle domande sopra la soglia.',
    '',
    '| compito | modello | regola sola | Jev solo | soglia 0,5 (Jev decide) | soglia 0,7 | soglia 0,9 |',
    '|---|---|---|---|---|---|---|',
  ];
  const kinds = ['mestiere', 'bivio', 'meta', 'squadra', 'passo'];
  for (const kind of kinds) {
    for (const model of ['jev-1.13.0', 'jev-1.14.0']) {
      const ls = lines.filter((l) => l.ok && l.kind === kind && l.variant === 'base' && l.model === model && l.run === 'giro-1');
      if (!ls.length) continue;
      let ruleOk = 0;
      let jevOk = 0;
      let total = 0;
      const at = (t: number) => {
        let ok = 0;
        let jev = 0;
        for (const l of ls) {
          const c = cases.get(l.case)!;
          for (const [q, e] of Object.entries(c.expected)) {
            const a = l.answers?.[q];
            const p = a?.top?.[0]?.[1] ?? a?.p ?? 0;
            const useJev = a !== undefined && p >= t;
            if (useJev) jev++;
            if (accepts(e, useJev ? a!.v : c.rule?.[q])) ok++;
          }
        }
        return { ok, jev };
      };
      for (const l of ls) {
        const c = cases.get(l.case)!;
        for (const [q, e] of Object.entries(c.expected)) {
          total++;
          if (accepts(e, c.rule?.[q])) ruleOk++;
          if (l.answers?.[q] && accepts(e, l.answers[q].v)) jevOk++;
        }
      }
      const cells = [0.5, 0.7, 0.9].map((t) => {
        const r = at(t);
        return `${pct(r.ok, total)} (${pct(r.jev, total)})`;
      });
      out.push(`| ${kind} | ${model} | ${pct(ruleOk, total)} | ${pct(jevOk, total)} | ${cells.join(' | ')} |`);
    }
  }
  return [...out, ''];
}

/** The same requests twice: how many answers stay, how far the probabilities move. */
function stability(lines: LedgerLine[]): string[] {
  const first = new Map(lines.filter((l) => l.ok && l.run === 'giro-1' && l.variant === 'base').map((l) => [`${l.model}|${l.case}`, l]));
  const rows = new Map<string, { same: number; total: number; dp: number[] }>();
  for (const l of lines.filter((l) => l.ok && l.run === 'giro-1-ripeti')) {
    const o = first.get(`${l.model}|${l.case}`);
    if (!o) continue;
    const r = rows.get(l.model) ?? { same: 0, total: 0, dp: [] };
    rows.set(l.model, r);
    for (const [q, x] of Object.entries(l.answers ?? {})) {
      const y = o.answers?.[q];
      if (!y) continue;
      r.total++;
      if (String(x.v) === String(y.v)) r.same++;
      if (x.p !== undefined && y.p !== undefined) r.dp.push(Math.abs(x.p - y.p));
    }
  }
  if (!rows.size) return [];
  const out = ['## Due giri uguali', '', 'Le stesse richieste dei gruppi 1 e 3, rifatte: quante risposte restano le stesse e di quanto si muove la probabilità di un Noul.', '', '| modello | risposte uguali | Δp mediana | Δp al 90 % | Δp massima |', '|---|---|---|---|---|'];
  for (const [m, r] of rows) {
    const s = [...r.dp].sort((a, b) => a - b);
    out.push(`| ${m} | ${r.same} su ${r.total} (${pct(r.same, r.total)}) | ${(s[Math.floor(s.length / 2)] ?? 0).toFixed(2)} | ${(s[Math.floor(s.length * 0.9)] ?? 0).toFixed(2)} | ${(s[s.length - 1] ?? 0).toFixed(2)} |`);
  }
  return [...out, ''];
}

/** One person per request against several in one: tokens and dollars per decision. */
function batches(lines: LedgerLine[]): string[] {
  const out = ['## Più persone in una richiesta', '', 'Le mete della giornata chieste una persona per richiesta (`meta`) e tutte quelle di una fase insieme (`meta-lotto`, 19 persone in 3 richieste): lo stato e il modello pagano una volta.', '', '| modello | forma | richieste | decisioni | token in per decisione | $ per 1000 decisioni | giuste |', '|---|---|---|---|---|---|---|'];
  for (const model of ['jev-1.13.0', 'jev-1.14.0', 'gemini-3.1-flash-lite']) {
    for (const kind of ['meta', 'meta-lotto']) {
      const ls = lines.filter((l) => l.ok && l.run === 'giro-1' && l.variant === 'base' && l.model === model && l.kind === kind);
      if (!ls.length) continue;
      const decisions = ls.reduce((s, l) => s + l.questions, 0);
      const right = ls.reduce((s, l) => s + Object.values(l.right ?? {}).filter(Boolean).length, 0);
      const graded = ls.reduce((s, l) => s + Object.keys(l.right ?? {}).length, 0);
      const tokens = ls.reduce((s, l) => s + l.input_tokens, 0);
      const money = ls.reduce((s, l) => s + l.usd, 0);
      out.push(`| ${model} | ${kind} | ${ls.length} | ${decisions} | ${Math.round(tokens / decisions)} | ${usd((1000 * money) / decisions)} | ${right}/${graded} (${pct(right, graded)}) |`);
    }
  }
  return [...out, ''];
}

/**
 * An hour of play (coefficients.ts → HOUR: 6 days of the world, 4 phases each) with N people in the loaded places: one destination
 * per person and phase, one crossroads per person and phase (the «Teatro» of docs/design/comportamento-npc.md, for everyone and not only
 * for who is near the wanderer). The dollars per decision are the measured ones of `meta` and `meta-lotto`.
 */
function hourly(lines: LedgerLine[]): string[] {
  const per = (model: string, kind: string) => {
    const ls = lines.filter((l) => l.ok && l.run === 'giro-1' && l.variant === 'base' && l.model === model && l.kind === kind);
    const d = ls.reduce((s, l) => s + l.questions, 0);
    return d ? ls.reduce((s, l) => s + l.usd, 0) / d : 0;
  };
  const jevOne = per('jev-1.13.0', 'meta');
  const jevBatch = per('jev-1.13.0', 'meta-lotto');
  const liteOne = per('gemini-3.1-flash-lite', 'meta');
  const liteBatch = per('gemini-3.1-flash-lite', 'meta-lotto');
  // The design's `npc.decide` (comportamento-npc.md, 4): a text call of WEIGHT.testo, 0,13 ¢ on Flash-Lite.
  const designed = 0.0013;
  const phases = 6 * 4;
  const out = [
    "## Un'ora di gioco con N individui",
    '',
    `Una meta e un bivio a fase per ognuno: ${phases * 2} decisioni l'ora a testa, ${((phases * 2) / 60).toFixed(1)} al minuto. Il costo di una decisione è quello misurato (\`meta\` una persona per richiesta, \`meta-lotto\` tutte quelle di una fase insieme); «progetto» è il \`npc.decide\` di docs/design/comportamento-npc.md, una chiamata di testo da 0,13 ¢ su Flash-Lite. Senza cache né filtro: chiedere solo quando la giornata non è quella della routine taglia ancora (vedi README).`,
    '',
    "| N | decisioni l'ora | al minuto | Jev, una per richiesta | Jev, a lotti | Flash-Lite, una per richiesta | Flash-Lite, a lotti | progetto (`npc.decide`) |",
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const n of [10, 30, 100]) {
    const d = n * phases * 2;
    out.push(`| ${n} | ${d} | ${(d / 60).toFixed(0)} | ${usd(d * jevOne)} | ${usd(d * jevBatch)} | ${usd(d * liteOne)} | ${usd(d * liteBatch)} | ${usd(d * designed)} |`);
  }
  return [...out, ''];
}

export function reportText(lines: LedgerLine[]): string {
  const real = lines.filter((l) => l.provider !== 'offline');
  const cases = casesById();
  const money = spent(real);
  const calls = (p: string) => real.filter((l) => l.provider === p).length;
  const tokens = (p: string) => real.filter((l) => l.provider === p).reduce((s, l) => s + l.input_tokens, 0);
  const out: string[] = [
    '# Il banco di Jev: riepilogo (generato da `--rapporto`, non a mano)',
    '',
    `Righe del registro: ${real.length}. Spesi: TypeSafe **${usd(money.typesafe ?? 0)}** (${calls('typesafe')} chiamate, ${tokens('typesafe')} token in ingresso a ${JEV_PRICE.input} $ al milione), Gemini **${usd(money.gemini ?? 0)}** (${calls('gemini')} righe, ${tokens('gemini')} token in ingresso). Le righe \`locale\` sono i modelli locali del gioco (\`MockAiModels\`, e il filtro di parole per la quarta parete): costano zero.`,
    '',
    '«decisioni» conta le domande con una risposta giusta; «$ per 1000 decisioni» divide la spesa per tutte le domande fatte; i token in uscita di Gemini comprendono il ragionamento. Le varianti: `base` le domande del banco, `rovescio` le stesse con le opzioni in ordine inverso, `domande-2` domande più atomiche scritte dopo il primo giro, `oggi` i prompt veri del gioco (judgeAction, judgeCombination, judgeCraft, liaisonReply, la revisione della quarta parete) su Flash-Lite, `locale` i modelli locali del gioco.',
    '',
  ];
  for (const group of ['decisioni', 'scultura', 'vita']) {
    const rows = summarize(real, (l) => l.group === group && l.run.startsWith('giro-1') && l.run !== 'giro-1-ripeti');
    if (!rows.length) continue;
    out.push(`## ${group}`, '', reportTable(rows), '');
  }
  // The first round only: the repeated one is for the stability, the trials before it are in the ledger and out of the tables.
  const first = real.filter((l) => l.run === 'giro-1');
  out.push(...composites(first, cases), ...thresholds(first, cases), ...batches(first), ...hourly(first), ...stability(real));
  const cons = consistency(first, 'base', 'rovescio');
  if (cons.length) {
    out.push('## Con le opzioni al contrario', '', 'Stesse domande, opzioni delle scelte in ordine inverso: quante risposte restano uguali.', '', '| modello | compito | uguali |', '|---|---|---|');
    for (const c of cons.sort((a, b) => a.kind.localeCompare(b.kind) || a.model.localeCompare(b.model))) out.push(`| ${c.model} | ${c.kind} | ${c.same} su ${c.total} (${pct(c.same, c.total)}) |`);
    out.push('');
  }
  return out.join('\n');
}

export function writeReport(lines: LedgerLine[], file = path.join(BENCH_DIR, 'riepilogo.md')): string {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, reportText(lines) + '\n');
  return file;
}
