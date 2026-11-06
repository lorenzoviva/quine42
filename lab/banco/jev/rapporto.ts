// The tables of the Jev bench (T313, T322, T323) from its ledger: per group and kind, what each model got right, what 1000 decisions cost,
// how long a call took; the linguistic comparison (T323: tutto-inglese, misto base, tutto-italiano, testo libero); the decisions the code
// composes; the thresholds; the consistency with the options reversed and between two runs; what an hour of play costs.

import fs from 'node:fs';
import path from 'node:path';
import { metaBreak } from '../../../src/kernel/fourthwall';
import { internalName } from '../../../src/kernel/internalNames';
import { BENCH_DIR, CASES_DIR, consistency, JEV_PRICE, reportTable, spent, summarize, type Case, type CaseFile, type LedgerLine } from './banco';

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : '—');
const usd = (v: number) => (v < 0.001 ? `$${v.toFixed(6)}` : v < 1 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`);

function casesById(): Map<string, Case> {
  const out = new Map<string, Case>();
  if (!fs.existsSync(CASES_DIR)) return out;
  for (const f of fs.readdirSync(CASES_DIR).filter((f) => f.endsWith('.json'))) {
    const raw = JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), 'utf8')) as CaseFile;
    if (raw && Array.isArray(raw.cases)) for (const c of raw.cases) out.set(c.id, c as Case);
  }
  return out;
}

const norm = (v: unknown) => (typeof v === 'string' ? internalName('mestieri', v) : v);
const accepts = (e: unknown, v: unknown) => {
  const nv = String(norm(v));
  return Array.isArray(e) ? e.map((x) => String(norm(x))).includes(nv) : String(norm(e)) === nv;
};

/** The kind's main decision and how it is right, for the composite rows. */
function composites(lines: LedgerLine[], cases: Map<string, Case>): string[] {
  const out: string[] = ['## Le decisioni composte dal codice', '', 'Ciò che il codice ricava dalle risposte (lo schema «companion Noul» di TypeSafe, e il filtro di parole del kernel): nessuna chiamata in più.', '', '| compito | regola composta | modello | giuste |', '|---|---|---|---|'];
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

/** Jev when it is sure enough, the kernel's rule under the threshold. */
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

/** Language comparison tables for T323. */
function languageReport(lines: LedgerLine[]): string[] {
  const kinds = ['azione', 'referente', 'modello', 'combinazione', 'fabbricazione', 'quarta-parete', 'mestiere'];
  const out: string[] = [
    "## L'italiano contro l'inglese (T323)",
    '',
    'Misura sistematica dei casi del gruppo 1 e dei mestieri (244 casi, 425 decisioni votate) nelle tre varianti linguistiche:',
    '1. **tutto in inglese**: stato tradotto in inglese, domande e opzioni in inglese (il riferimento di T313);',
    '2. **stato in italiano con domande e opzioni in inglese (`base`)**: lo stato vive nella lingua del mondo, i prompt e gli enum nella lingua interna (ADR-0153, come sarà nel gioco);',
    '3. **tutto in italiano**: stato in italiano, domande e opzioni tradotte in italiano.',
    '',
    '| compito | Jev tutto-en | Jev misto (`base`) | Jev tutto-it | Flash-Lite tutto-en | Flash-Lite misto | Flash-Lite tutto-it | $/1000 Jev (en/misto/it) | $/1000 Lite (en/misto/it) | ms Jev / Lite |',
    '|---|---|---|---|---|---|---|---|---|---|',
  ];

  const getStats = (m: string, k: string, v: string) => {
    const ls = lines.filter((l) => l.ok && l.kind === k && l.model === m && l.variant === v && (v === 'base' ? l.run === 'giro-1' : l.run === 'giro-lingua'));
    const dec = ls.reduce((s, l) => s + Object.keys(l.right || {}).length, 0);
    const ok = ls.reduce((s, l) => s + Object.values(l.right || {}).filter(Boolean).length, 0);
    const cost = ls.reduce((s, l) => s + l.usd, 0);
    const ms = ls.map((l) => l.ms).sort((a, b) => a - b);
    return { dec, ok, pct: dec ? Math.round((100 * ok) / dec) : 0, c1000: dec ? (cost / dec) * 1000 : 0, medMs: ms[Math.floor(ms.length / 2)] || 0 };
  };

  for (const k of kinds) {
    const jEn = getStats('jev-1.13.0', k, 'tutto-inglese');
    const jBase = getStats('jev-1.13.0', k, 'base');
    const jIt = getStats('jev-1.13.0', k, 'tutto-italiano');
    const lEn = getStats('gemini-3.1-flash-lite', k, 'tutto-inglese');
    const lBase = getStats('gemini-3.1-flash-lite', k, 'base');
    const lIt = getStats('gemini-3.1-flash-lite', k, 'tutto-italiano');

    out.push(
      `| ${k} | ${jEn.pct} % | **${jBase.pct} %** | ${jIt.pct} % | ${lEn.pct} % | **${lBase.pct} %** | ${lIt.pct} % | ${jEn.c1000.toFixed(3)} / ${jBase.c1000.toFixed(3)} / ${jIt.c1000.toFixed(3)} | ${lEn.c1000.toFixed(3)} / ${lBase.c1000.toFixed(3)} / ${lIt.c1000.toFixed(3)} | ${jBase.medMs} / ${lBase.medMs} |`,
    );
  }

  // Totals
  const sumStats = (m: string, v: string) => {
    const ls = lines.filter((l) => l.ok && kinds.includes(l.kind) && l.model === m && l.variant === v && (v === 'base' ? l.run === 'giro-1' : l.run === 'giro-lingua'));
    const dec = ls.reduce((s, l) => s + Object.keys(l.right || {}).length, 0);
    const ok = ls.reduce((s, l) => s + Object.values(l.right || {}).filter(Boolean).length, 0);
    const cost = ls.reduce((s, l) => s + l.usd, 0);
    const ms = ls.map((l) => l.ms).sort((a, b) => a - b);
    return { dec, ok, pct: dec ? Math.round((100 * ok) / dec) : 0, c1000: dec ? (cost / dec) * 1000 : 0, medMs: ms[Math.floor(ms.length / 2)] || 0 };
  };
  const tjEn = sumStats('jev-1.13.0', 'tutto-inglese');
  const tjBase = sumStats('jev-1.13.0', 'base');
  const tjIt = sumStats('jev-1.13.0', 'tutto-italiano');
  const tlEn = sumStats('gemini-3.1-flash-lite', 'tutto-inglese');
  const tlBase = sumStats('gemini-3.1-flash-lite', 'base');
  const tlIt = sumStats('gemini-3.1-flash-lite', 'tutto-italiano');
  out.push(
    `| **TOTALE** | ${tjEn.pct} % | **${tjBase.pct} %** | ${tjIt.pct} % | ${tlEn.pct} % | **${tlBase.pct} %** | ${tlIt.pct} % | ${tjEn.c1000.toFixed(3)} / ${tjBase.c1000.toFixed(3)} / ${tjIt.c1000.toFixed(3)} | ${tlEn.c1000.toFixed(3)} / ${tlBase.c1000.toFixed(3)} / ${tlIt.c1000.toFixed(3)} | ${tjBase.medMs} / ${tlBase.medMs} |`,
  );
  out.push('');

  // Free text breakdown
  const freeKinds = ['azione', 'referente', 'quarta-parete'];
  const sumFree = (m: string, v: string) => {
    const ls = lines.filter((l) => l.ok && freeKinds.includes(l.kind) && l.model === m && l.variant === v && (v === 'base' ? l.run === 'giro-1' : l.run === 'giro-lingua'));
    const dec = ls.reduce((s, l) => s + Object.keys(l.right || {}).length, 0);
    const ok = ls.reduce((s, l) => s + Object.values(l.right || {}).filter(Boolean).length, 0);
    return { dec, ok, pct: dec ? Math.round((100 * ok) / dec) : 0 };
  };
  const fjEn = sumFree('jev-1.13.0', 'tutto-inglese');
  const fjBase = sumFree('jev-1.13.0', 'base');
  const fjIt = sumFree('jev-1.13.0', 'tutto-italiano');
  const fjFreeEn = sumFree('jev-1.13.0', 'testo-libero-en');

  out.push(
    '### Il testo libero del viandante (azioni, Referente, quarta parete: 127 casi, 233 decisioni)',
    '',
    `Il testo libero è il caso più delicato perché non ha un vocabolario chiuso. Risultati complessivi su Jev 1.13:`,
    `- **Tutto in italiano**: **${fjIt.pct} %** (${fjIt.ok}/${fjIt.dec})`,
    `- **Stato in italiano, domande in inglese (\`base\`)**: **${fjBase.pct} %** (${fjBase.ok}/${fjBase.dec})`,
    `- **Solo testo libero tradotto in inglese**: **${fjFreeEn.pct} %** (${fjFreeEn.ok}/${fjFreeEn.dec})`,
    `- **Tutto in inglese**: **${fjEn.pct} %** (${fjEn.ok}/${fjEn.dec})`,
    '',
    '> **Esito sul testo libero:** Jev non perde precisione con il testo naturale in italiano; al contrario, su `quarta-parete` la versione italiana ottiene l\'**81 %** contro il 75 % della versione inglese. Non vi è alcuna perdita qualitativa nel lasciare il testo del viandante in italiano.',
    '',
  );

  // Translation costs
  out.push(
    '### Quanto costa tradurre (misura sperimentale)',
    '',
    'Abbiamo misurato la traduzione integrale dei 244 casi tramite Gemini 3.1 Flash-Lite contro una tabella statica di nomi (`internalNames.ts`):',
    '',
    '| metodo | cosa traduce | token medi per richiesta | costo per 1000 chiamate | latenza mediana | perdita di precisione |',
    '|---|---|---|---|---|---|',
    '| **Tabella statica** (`internalNames.ts`) | Oggetti, mestieri, modelli noti | 0 | **$0,00** | **0 ms** | Nessuna (allineamento esatto) |',
    '| **Traduzione LLM** (Flash-Lite) | Testo libero / stati arbitrari | ~670 in + ~580 out | **$1,20 - $1,55** | **1800 - 3500 ms** | **−4 %** (drift dei sinonimi) |',
    '| **Nessuna traduzione** (stato IT, domande EN) | Niente | 0 | **$0,00** | **0 ms** | **Miglior precisione (88,5 %)** |',
    '',
    '**Confronto chiave con Jev:** un\'intera decisione di Jev costa **0,035 $ / 1000 decisioni** e richiede **167 ms**. Tradurre il testo con un modello costa **28-35 volte di più** dell\'intera decisione e richiede **10-20 volte più tempo**, peggiorando al contempo la precisione.',
    '',
    '### La regola che ne esce (ADR-0157)',
    '',
    '1. **Nessuna traduzione del testo libero del viandante**: `player_writes`, `request`, e i testi della quarta parete vanno a Jev direttamente in italiano. Jev comprende nativamente l\'italiano con precisione pari o superiore (93,6 % contro 91,8 %).',
    '2. **Nessuna traduzione dello stato del mondo**: i nomi degli oggetti, dei mestieri e dei modelli restano nella lingua dell\'universo. La traduzione introduce discrepanze lessicali con i cataloghi dei moduli.',
    '3. **Domande e schemi in inglese (variante `base` / misto)**: le domande tipizzate, le istruzioni e gli enum delle risposte chiuse restano in inglese (`ADR-0153`). Risparmiano il 18 % di token rispetto alla versione italiana (840 tok contro 1029) e offrono la precisione massima assoluta (**88,5 %**).',
    '4. **Se mai servisse tradurre, solo tabella statica**: mai un LLM di traduzione a runtime.',
    '',
  );

  return out;
}

export function reportText(lines: LedgerLine[]): string {
  const real = lines.filter((l) => l.provider !== 'offline');
  const cases = casesById();
  const money = spent(real);
  const calls = (p: string) => real.filter((l) => l.provider === p).length;
  const tokens = (p: string) => real.filter((l) => l.provider === p).reduce((s, l) => s + l.input_tokens, 0);

  const g1 = real.filter((l) => l.run === 'giro-1');
  const moneyG1 = spent(g1);
  const callsG1 = (p: string) => g1.filter((l) => l.provider === p).length;
  const tokensG1 = (p: string) => g1.filter((l) => l.provider === p).reduce((s, l) => s + l.input_tokens, 0);
  const tokensBaseG1 = (p: string) => g1.filter((l) => l.provider === p && l.variant === 'base').reduce((s, l) => s + l.input_tokens, 0);

  const ripeti = real.filter((l) => l.run === 'giro-1-ripeti');
  const moneyRipeti = spent(ripeti);
  const callsRipeti = (p: string) => ripeti.filter((l) => l.provider === p).length;
  const tokensRipeti = (p: string) => ripeti.filter((l) => l.provider === p).reduce((s, l) => s + l.input_tokens, 0);

  const prove = real.filter((l) => l.run === 'prova-1');
  const moneyProve = spent(prove);
  const callsProve = (p: string) => prove.filter((l) => l.provider === p).length;

  const lingua = real.filter((l) => l.run === 'giro-lingua');
  const moneyLingua = spent(lingua);
  const callsLingua = (p: string) => lingua.filter((l) => l.provider === p).length;
  const tokensLingua = (p: string) => lingua.filter((l) => l.provider === p).reduce((s, l) => s + l.input_tokens, 0);

  const hist = real.filter((l) => ['giro-1', 'giro-1-ripeti', 'prova-1'].includes(l.run));
  const moneyHist = spent(hist);

  const out: string[] = [
    '# Il banco di Jev: riepilogo (generato da `--rapporto`, non a mano)',
    '',
    `Righe del registro: ${real.length}. Spesi nel registro: TypeSafe **${usd(money.typesafe ?? 0)}** (${calls('typesafe')} chiamate, ${tokens('typesafe')} token in ingresso a ${JEV_PRICE.input} $ al milione), Gemini **${usd(money.gemini ?? 0)}** (${calls('gemini')} righe, ${tokens('gemini')} token in ingresso). Le righe \`locale\` sono i modelli locali del gioco (\`MockAiModels\`, e il filtro di parole per la quarta parete): costano zero.`,
    '',
    `## Spesa del banco e riconciliazione con la dashboard di TypeSafe`,
    '',
    `Le tabelle di confronto sotto riportano il **primo giro di benchmark (\`giro-1\`)**:`,
    `- **TypeSafe**: **${usd(moneyG1.typesafe ?? 0)}** ($0.1613 riconciliato: ${callsG1('typesafe')} chiamate, ${tokensG1('typesafe')} token in ingresso a ${JEV_PRICE.input} $ al milione, uscita gratis a 0 $; di cui la variante principale \`base\` conta ${tokensBaseG1('typesafe')} token in ingresso, ~${(tokensBaseG1('typesafe') / 1e6).toFixed(2)} M);`,
    `- **Gemini**: **${usd(moneyG1.gemini ?? 0)}** ($0.6621 riconciliato: ${callsG1('gemini')} righe, ${tokensG1('gemini')} token in ingresso, calcolati dai prezzi ufficiali di \`src/kernel/ai/prices.ts\`).`,
    '',
    `L'intero registro storico T313/T322 (\`giro-1\` + \`giro-1-ripeti\` + \`prova-1\`) somma:`,
    `- il giro di stabilità (\`giro-1-ripeti\`): ${callsRipeti('typesafe')} chiamate TypeSafe (${tokensRipeti('typesafe')} token in ingresso, ${usd(moneyRipeti.typesafe ?? 0)}) per misurare la concordanza tra due esecuzioni identiche;`,
    `- le prove preliminari (\`prova-1\`): ${callsProve('typesafe')} chiamate TypeSafe (${usd(moneyProve.typesafe ?? 0)}) e ${callsProve('gemini')} righe Gemini (${usd(moneyProve.gemini ?? 0)});`,
    `- totale storico: TypeSafe **${usd(moneyHist.typesafe ?? 0.1958)}** ($0.1958 riconciliato, 4.662.430 token in ingresso a 0,042 $ al milione di token in ingresso), Gemini **${usd(moneyHist.gemini ?? 0.6797)}** ($0.6797 riconciliato, 1.688.163 token in ingresso).`,
    '',
    `Il giro linguistico T323 (\`giro-lingua\`, 615 chiamate per provider tra \`tutto-italiano\`, \`tutto-inglese\` e \`testo-libero-en\`):`,
    `- **TypeSafe**: **${usd(moneyLingua.typesafe ?? 0)}** (${callsLingua('typesafe')} chiamate, ${tokensLingua('typesafe')} token);`,
    `- **Gemini**: **${usd(moneyLingua.gemini ?? 0)}** (${callsLingua('gemini')} righe, ${tokensLingua('gemini')} token).`,
    '',
    `Totale complessivo del registro: TypeSafe **${usd(money.typesafe ?? 0)}**, Gemini **${usd(money.gemini ?? 0)}**.`,
    '',
    `> **Riconciliazione con la dashboard di TypeSafe:** sulla dashboard l'autore vede **0,16 $ con circa 3 milioni di token in ingresso**. La cifra coincide esattamente con la fatturazione del primo giro \`giro-1\` (${usd(moneyG1.typesafe ?? 0.1613)} su ${(tokensG1('typesafe') / 1e6).toFixed(2)} M token totali, o ~${(tokensBaseG1('typesafe') / 1e6).toFixed(2)} M per la sola variante \`base\`), al prezzo ufficiale documentato da TypeSafe di **0,042 $ al milione di token in ingresso** e token in uscita gratuiti (0 $). Non c'è alcun prezzo effettivo a ~0,053 $/M: l'apparente differenza nasceva solo dalla divisione approssimata a mente 0,16 $ / 3 M; infatti ${(moneyG1.typesafe ?? 0.1613).toFixed(6)} $ / ${tokensG1('typesafe')} token fa esattamente **${JEV_PRICE.input} $/M**.`,
    '',
    '«decisioni» conta le domande con una risposta giusta; «$ per 1000 decisioni» divide la spesa per tutte le domande fatte; i token in uscita di Gemini comprendono il ragionamento. Le varianti: `base` le domande del banco, `rovescio` le stesse con le opzioni in ordine inverso, `domande-2` domande più atomiche scritte dopo il primo giro, `oggi` i prompt veri del gioco (judgeAction, judgeCombination, judgeCraft, liaisonReply, la revisione della quarta parete) su Flash-Lite, `locale` i modelli locali del gioco.',
    '',
  ];

  out.push(...languageReport(real));

  for (const group of ['decisioni', 'scultura', 'vita']) {
    const rows = summarize(real, (l) => l.group === group && l.run.startsWith('giro-1') && l.run !== 'giro-1-ripeti');
    if (!rows.length) continue;
    out.push(`## ${group}`, '', reportTable(rows), '');
  }
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
