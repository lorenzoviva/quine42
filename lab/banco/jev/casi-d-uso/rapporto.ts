// T325: the tables of the trials, from the measures (misure/contesto.json, misure/scelta.json) and the ledger (consumi.jsonl), into
// riepilogo.md. The analysis that reads them is lab/banco/jev/casi-d-uso.md, written by hand.

import fs from 'node:fs';
import path from 'node:path';
import { readLedger, type LedgerLine } from '../banco';
import { FAMILIES, FAMILY_NAME, familyOf, MEASURED_OUTPUT, type HourRow } from './contesto';
import { guardRoute } from './domande';
import { MEASURES, USE_DIR, type ContextMeasures } from './misura';
import { CHOICE_RESULTS, type ChoiceResult } from './scelta';
import { USE_LEDGER } from './prove';

export const USE_REPORT = path.join(USE_DIR, 'riepilogo.md');

const usd = (v: number, d = 3) => `${v.toFixed(d)} $`;
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : '—');
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0);

// ---------------------------------------------------------------------------------------------------------- point 1

export function contextTables(m: ContextMeasures): string {
  const sum = (rows: HourRow[], k: keyof HourRow) => rows.reduce((s, r) => s + Number(r[k]), 0);
  const out: string[] = [];
  out.push(
    `Misura del ${m.date} (prezzi del ${m.prices}), ${m.exact ? 'token contati con countTokens di Gemini' : 'token stimati dai caratteri'} (${m.charsPerToken} caratteri a token), ` +
      `passeggiate di ${m.places} luoghi in ${m.universes.map((u) => `${u.name} (${u.calls} chiamate, ${u.modules} moduli, ${u.catalog} nel catalogo)`).join(', ')}.`,
  );
  out.push('', '### Compito per compito: token in ingresso medi, per famiglia', '');
  out.push(`| compito | agente | chiamate registrate | in ingresso | ${FAMILIES.map((f) => FAMILY_NAME[f]).join(' | ')} | contesto | prefisso stabile |`);
  out.push(`|---|---|---|---|${FAMILIES.map(() => '---').join('|')}|---|---|`);
  for (const t of [...m.mean].sort((a, b) => b.input - a.input)) {
    const fam = FAMILIES.map((f) => familyOf(t, f));
    const ctx = fam[1] + fam[2];
    out.push(`| ${t.task} | ${t.agent} | ${t.calls} | ${t.input} | ${fam.join(' | ')} | ${pct(ctx, t.input)} | ${t.prefix} |`);
  }
  out.push('', '### Le parti più grandi, compito per compito (token medi)', '');
  out.push('| compito | canone | lessico | bibbia | catalogo | grafo | regole | società | ruolo | compito (istruzioni) |');
  out.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const t of [...m.mean].sort((a, b) => b.input - a.input)) {
    const p = t.parts as Record<string, number>;
    out.push(`| ${t.task} (${t.agent}) | ${p.canone ?? 0} | ${p.lessico ?? 0} | ${p.bibbia ?? 0} | ${p.catalogo ?? 0} | ${p.grafo ?? 0} | ${p.regole ?? 0} | ${p.societa ?? 0} | ${p.ruolo ?? 0} | ${p.compito ?? 0} |`);
  }
  const table = (rows: HourRow[]) => {
    const lines = ['| compito | modello | chiamate l’ora | in ingresso | contesto | uscita | $ l’ora: senza cache / miste / calda | contesto $ l’ora: senza / miste / calda | uscita $ l’ora |', '|---|---|---|---|---|---|---|---|---|'];
    for (const r of rows)
      lines.push(
        `| ${r.task}${r.agent === 'actor' ? ' (Attore)' : ''}${r.measured ? '' : ' *'} | ${r.model} | ${r.perHour} | ${r.input} | ${r.context} | ${r.output}${MEASURED_OUTPUT.has(r.task) || MEASURED_OUTPUT.has(`${r.task}:${r.agent}`) ? '' : ' †'} | ${r.usd.toFixed(4)} / ${r.usdCached.toFixed(4)} / ${r.usdWarm.toFixed(4)} | ${r.usdContext.toFixed(4)} / ${r.usdContextCached.toFixed(4)} / ${r.usdContextWarm.toFixed(4)} | ${r.usdOutput.toFixed(4)} |`,
      );
    lines.push(
      `| **in tutto** | | ${Math.round(sum(rows, 'perHour'))} | | | | **${usd(sum(rows, 'usd'))} / ${usd(sum(rows, 'usdCached'))} / ${usd(sum(rows, 'usdWarm'))}** | **${usd(sum(rows, 'usdContext'))} / ${usd(sum(rows, 'usdContextCached'))} / ${usd(sum(rows, 'usdContextWarm'))}** | **${usd(sum(rows, 'usdOutput'))}** |`,
    );
    return lines.join('\n');
  };
  out.push('', "### Un'ora di gioco (le ipotesi di `HOUR`, ogni manopola a 1, l'Attore spento)", '', table(m.hour));
  out.push('', '\\* non registrato nella passeggiata: 3500 token, come la stima del gioco. † uscita non misurata: 500 token (3000 per i programmi), come la stima del gioco.');
  out.push('', "### Con l'Attore acceso: le righe che cambiano", '', table(m.actor));
  out.push('', "### Che cosa costa ogni parte in un'ora (Attore spento)", '', '| parte | famiglia | token l’ora | $ l’ora senza cache | $ l’ora con la cache calda |', '|---|---|---|---|---|');
  for (const p of m.parts) out.push(`| ${p.part} | ${FAMILY_NAME[p.family]} | ${Math.round(p.tokens)} | ${p.usd.toFixed(4)} | ${p.usdWarm.toFixed(4)} |`);
  return out.join('\n');
}


// ---------------------------------------------------------------------------------------------------------- (a) and (b)

export function guardTables(lines: LedgerLine[], cases: Array<{ id: string; state: { channel: string }; expected: Record<string, boolean> }>): string {
  const byId = Object.fromEntries(cases.map((c) => [c.id, c]));
  const ls = lines.filter((l) => l.group === ('guardia' as never) && l.ok);
  const models = [...new Set(ls.map((l) => l.model))];
  const out = ['| modello | giuste | steers | meta | outside | explicit | nonsense | rotta giusta (soglia 0,7) | legittimi fermati | pericolosi passati | token in medi | $ per 1000 testi | ms mediana |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const m of models) {
    const mine = ls.filter((l) => l.model === m);
    const per: Record<string, [number, number]> = {};
    let ok = 0;
    let tot = 0;
    let route = 0;
    let stopped = 0;
    let passed = 0;
    for (const l of mine) {
      for (const [q, r] of Object.entries(l.right ?? {})) {
        (per[q] ??= [0, 0])[1]++;
        tot++;
        if (r) {
          per[q][0]++;
          ok++;
        }
      }
      const c = byId[l.case];
      if (!c) continue;
      const p = Object.fromEntries(Object.entries(l.answers ?? {}).map(([q, a]) => [q, a.p ?? (a.v ? 1 : 0)]));
      const want = guardRoute(c.state.channel, Object.fromEntries(Object.entries(c.expected).map(([q, v]) => [q, v ? 1 : 0])));
      const got = guardRoute(c.state.channel, p);
      if (got === want) route++;
      else if (want === 'passa') stopped++;
      else if (got === 'passa') passed++;
    }
    const q = (k: string) => (per[k] ? `${per[k][0]}/${per[k][1]}` : '—');
    out.push(`| ${m} | ${pct(ok, tot)} | ${q('steers')} | ${q('meta')} | ${q('outside')} | ${q('explicit')} | ${q('nonsense')} | ${route}/${mine.length} | ${stopped} | ${passed} | ${Math.round(avg(mine.map((l) => l.input_tokens)))} | ${((1000 * mine.reduce((s, l) => s + l.usd, 0)) / mine.length).toFixed(4)} | ${median(mine.map((l) => l.ms))} |`);
  }
  return out.join('\n');
}

/** The decision of a line reused, from the answers in the ledger: the Choice's pick if its probability and its companion Noul pass. */
export function reuseFromLedger(l: LedgerLine, tChoice: number, tFits: number): string {
  const pick = String(l.answers?.same?.v ?? 'none');
  if (pick === 'none') return 'none';
  const pChoice = l.answers?.same?.top?.find(([k]) => k === pick)?.[1] ?? (l.provider === 'gemini' ? 1 : 0);
  const fits = l.answers?.[`fits_${pick}`];
  const pFits = fits?.p ?? (fits?.v ? 1 : 0);
  return pChoice >= tChoice && pFits >= tFits ? pick : 'none';
}

export function reuseTables(lines: LedgerLine[], cases: Array<{ id: string; reuse: string }>): string {
  const byId = Object.fromEntries(cases.map((c) => [c.id, c]));
  const ls = lines.filter((l) => l.group === ('battute' as never) && l.ok);
  const models = [...new Set(ls.map((l) => l.model))];
  const out = ['| modello | soglie (Choice / Noul) | decisioni giuste | riusi trovati | riusi sbagliati | riusi mancati | token in medi | $ per 1000 controlli | ms mediana |', '|---|---|---|---|---|---|---|---|---|'];
  for (const m of models) {
    const mine = ls.filter((l) => l.model === m);
    for (const [tc, tf] of [
      [0.5, 0.5],
      [0.5, 0.7],
      [0.7, 0.8],
    ]) {
      let ok = 0;
      let found = 0;
      let wrong = 0;
      let missed = 0;
      let reusable = 0;
      for (const l of mine) {
        const c = byId[l.case];
        if (!c) continue;
        const d = reuseFromLedger(l, tc, tf);
        if (c.reuse !== 'none') reusable++;
        if (d === c.reuse) {
          ok++;
          if (d !== 'none') found++;
        } else if (d !== 'none') wrong++;
        else missed++;
      }
      out.push(`| ${m} | ${tc} / ${tf} | ${ok}/${mine.length} | ${found}/${reusable} | ${wrong} | ${missed} | ${Math.round(avg(mine.map((l) => l.input_tokens)))} | ${((1000 * mine.reduce((s, l) => s + l.usd, 0)) / mine.length).toFixed(4)} | ${median(mine.map((l) => l.ms))} |`);
    }
  }
  return out.join('\n');
}

// ---------------------------------------------------------------------------------------------------------- (c)

const PRICE: Record<string, { i: number; c: number; o: number }> = { 'gemini-3.1-flash-lite': { i: 0.25, c: 0.025, o: 1.5 }, 'gemini-3.8-flash': { i: 0.75, c: 0.075, o: 3.75 } };
const callUsd = (model: string, c: ChoiceResult['full'], cache: boolean) => {
  const p = PRICE[model] ?? PRICE['gemini-3.1-flash-lite'];
  const cached = cache ? c.cached : 0;
  return ((c.input - cached) * p.i + cached * p.c + (c.output + c.thoughts) * p.o) / 1e6;
};

export function choiceTables(results: ChoiceResult[]): string {
  const out = [
    '| compito | taglio | casi | token in: intero (in cache) → scelto | Jev legge | ragionamento: intero → scelto | $ a chiamata: intero misurato / a cache calda / senza cache | $ scelto + Jev | giudice Flash-Lite: intero/scelto/pari | giudice Jev | «rompe il mondo» medio (Flash-Lite): intero / scelto | controlli falliti: intero / scelto | righe tenute |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  const groups = new Map<string, ChoiceResult[]>();
  for (const r of results) {
    const k = `${r.task}${r.task === 'npc.reply' ? ` (${r.agent === 'actor' ? 'Attore' : 'Narratore'})` : ''}|${r.cut ?? 'stretto'}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }
  for (const [k, rs] of [...groups].sort()) {
    const [task, cut] = k.split('|');
    const model = rs[0].model;
    const warm = rs.filter((r) => r.full.cached > 0);
    const verdict = (j: string) => {
      const o = { intero: 0, scelto: 0, pari: 0 } as Record<string, number>;
      for (const r of rs) if (r.judges[j]) o[r.judges[j].better]++;
      return `${o.intero}/${o.scelto}/${o.pari}`;
    };
    const breaks = (key: 'fullBreaks' | 'thinBreaks') => avg(rs.map((r) => r.judges['gemini-3.1-flash-lite']?.[key]).filter((x): x is number => typeof x === 'number')).toFixed(2);
    const parts = Object.keys(rs[0].jev.of)
      .map((p) => `${p} ${avg(rs.map((r) => r.jev.kept[p] ?? 0)).toFixed(1)}/${Math.round(avg(rs.map((r) => r.jev.of[p] ?? 0)))}`)
      .join(', ');
    out.push(
      `| ${task} | ${cut} | ${rs.length} | ${Math.round(avg(rs.map((r) => r.full.input)))} (${Math.round(avg(rs.map((r) => r.full.cached)))}) → ${Math.round(avg(rs.map((r) => r.thin.input)))} | ${Math.round(avg(rs.map((r) => r.jev.input)))} | ${Math.round(avg(rs.map((r) => r.full.thoughts)))} → ${Math.round(avg(rs.map((r) => r.thin.thoughts)))} | ${avg(rs.map((r) => callUsd(model, r.full, true))).toFixed(5)} / ${warm.length ? avg(warm.map((r) => callUsd(model, r.full, true))).toFixed(5) : '—'} / ${avg(rs.map((r) => callUsd(model, r.full, false))).toFixed(5)} | ${avg(rs.map((r) => callUsd(model, r.thin, true) + r.jev.usd)).toFixed(5)} | ${verdict('gemini-3.1-flash-lite')} | ${verdict('jev-1.13.0')} | ${breaks('fullBreaks')} / ${breaks('thinBreaks')} | ${rs.filter((r) => r.checks.full.length).length} / ${rs.filter((r) => r.checks.thin.length).length} | ${parts} |`,
    );
  }
  return out.join('\n');
}

// ---------------------------------------------------------------------------------------------------------- the file

export function spendLines(lines: LedgerLine[]): string {
  const by: Record<string, { usd: number; calls: number; input: number }> = {};
  for (const l of lines) {
    const k = `${l.provider}|${l.group}`;
    const r = (by[k] ??= { usd: 0, calls: 0, input: 0 });
    r.usd += l.usd;
    r.calls++;
    r.input += l.input_tokens;
  }
  const out = ['| fornitore | prova | chiamate | token in ingresso | dollari |', '|---|---|---|---|---|'];
  for (const [k, r] of Object.entries(by).sort()) {
    const [p, g] = k.split('|');
    out.push(`| ${p} | ${g} | ${r.calls} | ${r.input} | ${r.usd.toFixed(4)} |`);
  }
  const tot = (p: string) => lines.filter((l) => l.provider === p).reduce((s, l) => s + l.usd, 0);
  out.push(`| **typesafe** | in tutto | | | **${tot('typesafe').toFixed(4)}** |`, `| **gemini** | in tutto | | | **${tot('gemini').toFixed(4)}** |`);
  return out.join('\n');
}

export function reportText(o: { measures?: ContextMeasures; lines: LedgerLine[]; choice: ChoiceResult[]; guard: Array<{ id: string; state: { channel: string }; expected: Record<string, boolean> }>; reuse: Array<{ id: string; reuse: string }> }): string {
  return [
    '# Riepilogo delle misure di T325 (generato)',
    '',
    '> Generato da `npx vite-node lab/scripts/jev-casi-d-uso.ts -- --rapporto` dalle misure (`misure/`) e dal registro (`consumi.jsonl`). La lettura è in [`../casi-d-uso.md`](../casi-d-uso.md).',
    '',
    '## 1. La spesa di oggi: quanto delle richieste è contesto',
    '',
    o.measures ? contextTables(o.measures) : '(nessuna misura: `--contesto`)',
    '',
    '## 2a. Le guardie sui testi del viandante',
    '',
    guardTables(o.lines, o.guard),
    '',
    '## 2b. Le battute riusate',
    '',
    reuseTables(o.lines, o.reuse),
    '',
    '## 2c. Il contesto scelto da Jev',
    '',
    o.choice.length ? choiceTables(o.choice) : '(nessun risultato: `--scelta`)',
    '',
    '## La spesa delle prove',
    '',
    spendLines(o.lines),
    '',
  ].join('\n');
}

export function writeUseReport(o: { offline?: boolean; ledger?: string; measures?: string; results?: string; out?: string }): string {
  const ledger = o.ledger ?? (o.offline ? path.resolve('lab/out/jev/casi-d-uso-offline.jsonl') : USE_LEDGER);
  const measuresFile = o.measures ?? (o.offline ? path.resolve('lab/out/jev/contesto-offline.json') : MEASURES);
  const resultsFile = o.results ?? (o.offline ? path.resolve('lab/out/jev/scelta-offline.json') : CHOICE_RESULTS);
  const read = (f: string) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : undefined);
  const casesOf = (name: string) => read(path.join(USE_DIR, 'casi', name))?.cases ?? [];
  const text = reportText({ measures: read(measuresFile), lines: readLedger(ledger), choice: read(resultsFile)?.results ?? [], guard: casesOf('guardia.json'), reuse: casesOf('battute.json') });
  const out = o.out ?? (o.offline ? path.resolve('lab/out/jev/riepilogo-casi-d-uso-offline.md') : USE_REPORT);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, text);
  return out;
}
