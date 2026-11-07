// The tables of the Jev bench with images (T324) from its ledger: per kind and form, what each model got right, what 1000 decisions
// cost, how long a call took; how well the Artist's pass separates the judged buildings and the defective ones; which defect each model
// sees; where it leans in the pairs; the thing → model with the photographs; the stability between two runs; the game's own Artist.

import fs from 'node:fs';
import path from 'node:path';
import { BENCH_DIR, reportTable, summarize, type Case, type CaseFile, type LedgerLine } from './banco';
import { DEFECT_IDS, CASES_FILE } from './immagini';

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : '—');
const usd = (v: number) => (v < 0.001 ? `$${v.toFixed(6)}` : v < 1 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`);
const f2 = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '—');

/** The runs of T324: `img-…` and the first probe. */
export const isImageRun = (l: LedgerLine) => l.run.startsWith('img') || l.run === 'prova-immagini';
const isRepeat = (l: LedgerLine) => /-ripeti$/.test(l.run);
/** The probes before the first run: in the spending, out of the tables. */
const isProbe = (l: LedgerLine) => l.run === 'img-prova' || l.run === 'prova-immagini';

function imageCases(file = CASES_FILE): Map<string, Case> {
  const out = new Map<string, Case>();
  if (!fs.existsSync(file)) return out;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as CaseFile;
  for (const c of raw.cases) out.set(c.id, c as Case);
  return out;
}

/** The area under the curve of a probability against a truth: how often a true one is put above a false one (0.5 is chance). */
export function auc(pos: number[], neg: number[]): number {
  if (!pos.length || !neg.length) return NaN;
  let s = 0;
  for (const p of pos) for (const n of neg) s += p > n ? 1 : p === n ? 0.5 : 0;
  return s / (pos.length * neg.length);
}

/** The threshold of a yes that best separates the true ones from the false ones (most right answers), with what it gets. */
export function bestThreshold(pos: number[], neg: number[]): { t: number; tp: number; fp: number } {
  let best = { t: 0.5, tp: pos.filter((p) => p >= 0.5).length, fp: neg.filter((p) => p >= 0.5).length };
  for (const t of [...new Set([...pos, ...neg])].sort((a, b) => a - b)) {
    const tp = pos.filter((p) => p >= t).length;
    const fp = neg.filter((p) => p >= t).length;
    if (tp - fp > best.tp - best.fp) best = { t, tp, fp };
  }
  return best;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const models = (lines: LedgerLine[]) => [...new Set(lines.map((l) => l.model))].sort();

/** The pass of the Artist's rubric: on the judged buildings (passing and not) and on the defective ones. */
function artistTable(lines: LedgerLine[], cases: Map<string, Case>): string[] {
  const out = [
    '## L\'Artista: passa o no',
    '',
    '`passa` sui 28 programmi giudicati (quelli che passano il giudizio delle foto e quelli che no) e sui programmi che passano con un difetto fatto apposta (non devono passare); «voto ≥ 7» è il livello del voto dall\'alto. AUC: quanto spesso la probabilità del sì è più alta su uno che passa che su uno che non passa (0,5 è il caso; per Flash-Lite la probabilità è 0 o 1).',
    '',
    '| modello | forma | giudicati: passano detti sì | giudicati: non passano detti no | AUC giudicati | soglia migliore sui giudicati (passano sì / non passano sì) | difettosi detti no | AUC interi contro difettosi | p(sì) media: passano / non passano / difettosi | voto ≥ 7 giusto (giudicati / difettosi) |',
    '|---|---|---|---|---|---|---|---|---|---|',
  ];
  const rows = lines.filter((l) => l.ok && l.kind === 'artista' && !isRepeat(l));
  for (const m of models(rows))
    for (const form of ['lati4', 'lato1', 'griglia', 'separate', 'oggi']) {
      const ls = rows.filter((l) => l.model === m && (form === 'oggi' ? l.variant === 'oggi' : l.variant === form && l.variant !== 'oggi'));
      if (!ls.length) continue;
      const judged = ls.filter((l) => !cases.get(l.case)?.meta?.defect);
      const broken = ls.filter((l) => cases.get(l.case)?.meta?.defect);
      const passing = judged.filter((l) => cases.get(l.case)?.expected.passa === true);
      const failing = judged.filter((l) => cases.get(l.case)?.expected.passa === false);
      const p = (l: LedgerLine) => Number(l.answers?.passa?.p ?? (l.answers?.passa?.v === true ? 1 : 0));
      const yes = (l: LedgerLine) => l.answers?.passa?.v === true;
      const vRight = (xs: LedgerLine[]) => xs.filter((l) => l.right?.voto).length;
      out.push(
        `| ${m} | ${form} | ${passing.filter(yes).length}/${passing.length} | ${failing.filter((l) => !yes(l)).length}/${failing.length} | ${f2(auc(passing.map(p), failing.map(p)))} | ${(() => {
          const t = bestThreshold(passing.map(p), failing.map(p));
          return `${f2(t.t)} (${t.tp}/${passing.length} / ${t.fp}/${failing.length})`;
        })()} | ${broken.filter((l) => !yes(l)).length}/${broken.length} | ${f2(auc(passing.map(p), broken.map(p)))} | ${f2(mean(passing.map(p)))} / ${f2(mean(failing.map(p)))} / ${f2(mean(broken.map(p)))} | ${vRight(judged)}/${judged.length} / ${vRight(broken)}/${broken.length} |`,
      );
    }
  // The criteria, against the most frequent answer.
  out.push('', 'I criteri visti da fuori, sui giudicati (giuste / votate); fra parentesi la risposta più frequente del giudizio, che da sola prende:', '');
  const judgedCases = [...cases.values()].filter((c) => c.kind === 'artista' && !c.meta?.defect && c.form === 'lati4');
  const crit = ['riconosce', 'regge', 'lati', 'tetto', 'colori', 'dettaglio'];
  const majority = crit.map((k) => {
    const n = new Map<number, number>();
    for (const c of judgedCases) n.set(Number(c.expected[k]), (n.get(Number(c.expected[k])) ?? 0) + 1);
    return Math.max(...n.values()) / judgedCases.length;
  });
  out.push(`| modello | forma | ${crit.map((k, i) => `${k} (${Math.round(100 * majority[i])} %)`).join(' | ')} |`, `|---|---|${crit.map(() => '---|').join('')}`);
  for (const m of models(rows))
    for (const form of ['lati4', 'lato1', 'griglia', 'separate']) {
      const ls = rows.filter((l) => l.model === m && l.variant === form && !cases.get(l.case)?.meta?.defect);
      if (!ls.length) continue;
      out.push(`| ${m} | ${form} | ${crit.map((k) => pct(ls.filter((l) => l.right?.[k]).length, ls.filter((l) => l.right?.[k] !== undefined).length)).join(' | ')} |`);
    }
  return out;
}

/** Each defect: seen on its own photograph, said of the whole ones and of the others. */
function defectTable(lines: LedgerLine[]): string[] {
  const out = ['## I difetti fatti apposta', '', 'Per ogni difetto: quante volte il modello lo vede dove c\'è (sensibilità) e quante volte lo dice dove non c\'è (falsi allarmi, sugli interi e sugli altri difetti); le cinque domande sono in ogni richiesta.', ''];
  out.push(`| modello | forma | ${DEFECT_IDS.map((d) => `${d}: visto / falsi`).join(' | ')} | interi senza allarmi |`, `|---|---|${DEFECT_IDS.map(() => '---|').join('')}---|`);
  const rows = lines.filter((l) => l.ok && l.kind === 'difetto' && !isRepeat(l));
  for (const m of models(rows))
    for (const form of ['lati4', 'lato1', 'griglia']) {
      const ls = rows.filter((l) => l.model === m && l.variant === form);
      if (!ls.length) continue;
      const of = (l: LedgerLine) => l.case.split('/').slice(-2)[0];
      const cells = DEFECT_IDS.map((d) => {
        const own = ls.filter((l) => of(l) === d);
        const other = ls.filter((l) => of(l) !== d);
        return `${pct(own.filter((l) => l.answers?.[d]?.v === true).length, own.length)} / ${pct(other.filter((l) => l.answers?.[d]?.v === true).length, other.length)}`;
      });
      const whole = ls.filter((l) => of(l) === 'intero');
      out.push(`| ${m} | ${form} | ${cells.join(' | ')} | ${whole.filter((l) => DEFECT_IDS.every((d) => l.answers?.[d]?.v !== true)).length}/${whole.length} |`);
    }
  // Jev's probabilities: how well each question separates the photographs with its defect from the whole ones, at any threshold.
  out.push('', 'Jev dà una probabilità: quanto ogni domanda separa le foto col suo difetto da quelle intere, a qualunque soglia (AUC; 1 è perfetto, 0,5 il caso), e la soglia del sì che lo dimostra (la migliore sui dati: da rifare su casi nuovi prima di usarla).', '');
  out.push(`| modello | forma | ${DEFECT_IDS.map((d) => `${d}: AUC (soglia, visto / falsi sugli interi)`).join(' | ')} |`, `|---|---|${DEFECT_IDS.map(() => '---|').join('')}`);
  for (const m of models(rows).filter((m) => m.startsWith('jev')))
    for (const form of ['lati4', 'lato1', 'griglia']) {
      const ls = rows.filter((l) => l.model === m && l.variant === form);
      if (!ls.length) continue;
      const of = (l: LedgerLine) => l.case.split('/').slice(-2)[0];
      const cells = DEFECT_IDS.map((d) => {
        const pos = ls.filter((l) => of(l) === d).map((l) => Number(l.answers?.[d]?.p ?? 0));
        const neg = ls.filter((l) => of(l) === 'intero').map((l) => Number(l.answers?.[d]?.p ?? 0));
        const t = bestThreshold(pos, neg);
        return `${f2(auc(pos, neg))} (${f2(t.t)}, ${pct(t.tp, pos.length)} / ${pct(t.fp, neg.length)})`;
      });
      out.push(`| ${m} | ${form} | ${cells.join(' | ')} |`);
    }
  return out;
}

/** The pairs and the fours: right, and where the answer leans. */
function pairTable(lines: LedgerLine[]): string[] {
  const out = ['## Quale è migliore', '', 'Coppie: un edificio intero contro un suo difetto (in tutti e due gli ordini), e un edificio che passa il giudizio contro uno dello stesso bersaglio che non passa; il quattro: l\'intero fra tre suoi difetti. «Coppie giuste in tutti e due gli ordini»: la stessa scelta comunque si presentino.', '', '| modello | intero contro difetto | giudizio contro giudizio | coppie giuste in tutti e due gli ordini | sceglie A | uno su quattro |', '|---|---|---|---|---|---|'];
  const rows = lines.filter((l) => l.ok && (l.kind === 'confronto' || l.kind === 'migliore') && !isRepeat(l));
  for (const m of models(rows)) {
    const ls = rows.filter((l) => l.model === m);
    const sab = ls.filter((l) => l.kind === 'confronto' && !l.case.includes('~'));
    const real = ls.filter((l) => l.kind === 'confronto' && l.case.includes('~'));
    const four = ls.filter((l) => l.kind === 'migliore');
    const pairs = new Map<string, boolean[]>();
    for (const l of [...sab, ...real]) {
      const key = l.case.replace(/\/(AB|BA)$/, '');
      pairs.set(key, [...(pairs.get(key) ?? []), !!l.right?.better]);
    }
    const both = [...pairs.values()].filter((v) => v.length === 2);
    const ok = (xs: LedgerLine[]) => `${xs.filter((l) => l.right?.better).length}/${xs.length} (${pct(xs.filter((l) => l.right?.better).length, xs.length)})`;
    out.push(`| ${m} | ${ok(sab)} | ${ok(real)} | ${both.filter((v) => v.every(Boolean)).length}/${both.length} | ${pct([...sab, ...real].filter((l) => l.answers?.better?.v === 'A').length, sab.length + real.length)} | ${ok(four)} |`);
  }
  return out;
}

/** The thing → model with the photographs, the choice composed with the companion Noul as in T313. */
function modelTable(lines: LedgerLine[], cases: Map<string, Case>): string[] {
  const out = ['## L\'oggetto → il modello della libreria, con le foto', '', 'Gli stessi 37 casi di T313. `nomi8`: gli otto candidati che i nomi mettono prima (con quelli giusti), per nome; `foto8`: gli stessi otto, solo foto da quattro lati, chiavi opache; `foto50`: tutta la libreria (50 modelli del mondo), solo la foto del davanti. «Composta»: la scelta vale solo se `fits` ≥ 0,5, altrimenti «nuovo» (il companion Noul di T313).', '', '| modello | forma | scelta | `fits` | composta | token in medi | $/1000 decisioni | ms mediana |', '|---|---|---|---|---|---|---|---|'];
  const rows = lines.filter((l) => l.ok && l.kind === 'modello-foto' && !isRepeat(l));
  const sum = summarize(rows);
  for (const r of sum) {
    const ls = rows.filter((l) => l.model === r.model && l.variant === r.variant);
    let good = 0;
    for (const l of ls) {
      const c = cases.get(l.case);
      if (!c) continue;
      const fits = l.answers?.fits?.p !== undefined ? Number(l.answers.fits.p) >= 0.5 : l.answers?.fits?.v === true;
      const top = (l.answers?.model?.top ?? []).find(([k]) => k !== 'nuovo')?.[0] ?? String(l.answers?.model?.v);
      const pick = fits ? (String(l.answers?.model?.v) !== 'nuovo' ? String(l.answers?.model?.v) : top) : 'nuovo';
      if ((c.expected.model as string[]).includes(pick)) good++;
    }
    const [mr, mt] = r.perQuestion.model ?? [0, 0];
    const [fr, ft] = r.perQuestion.fits ?? [0, 0];
    out.push(`| ${r.model} | ${r.variant} | ${pct(mr, mt)} | ${pct(fr, ft)} | ${pct(good, ls.length)} | ${Math.round(r.input / Math.max(1, r.calls - r.failed))} | ${r.usdPer1000.toFixed(4)} | ${r.msMedian} |`);
  }
  return out;
}

/** The same requests asked twice: the same answer, and how far the probability of a yes moves. */
function stabilityTable(lines: LedgerLine[]): string[] {
  const out = ['## Stabilità tra due giri', '', 'Le stesse richieste rifatte (il giro `…-ripeti`): risposte uguali, e di quanto si muove la probabilità di un sì (mediana, 90° percentile).', '', '| modello | compito | risposte uguali | Δp mediana | Δp al 90 % |', '|---|---|---|---|---|'];
  const first = new Map<string, LedgerLine>();
  for (const l of lines) if (l.ok && !isRepeat(l) && l.variant !== 'oggi') first.set(`${l.model}|${l.case}|${l.variant}`, l);
  const acc = new Map<string, { same: number; total: number; dp: number[] }>();
  for (const l of lines) {
    if (!l.ok || !isRepeat(l)) continue;
    const a = first.get(`${l.model}|${l.case}|${l.variant}`);
    if (!a) continue;
    const key = `${l.model}|${l.kind}`;
    const r = acc.get(key) ?? { same: 0, total: 0, dp: [] };
    acc.set(key, r);
    for (const [q, x] of Object.entries(l.answers ?? {})) {
      const y = a.answers?.[q];
      if (!y) continue;
      r.total++;
      if (String(x.v) === String(y.v)) r.same++;
      if (typeof x.p === 'number' && typeof y.p === 'number' && typeof x.v === 'boolean') r.dp.push(Math.abs(x.p - y.p));
    }
  }
  for (const [key, r] of [...acc].sort()) {
    const [m, k] = key.split('|');
    const dp = [...r.dp].sort((a, b) => a - b);
    out.push(`| ${m} | ${k} | ${r.same}/${r.total} (${pct(r.same, r.total)}) | ${dp.length ? f2(dp[Math.floor(dp.length / 2)]) : '—'} | ${dp.length ? f2(dp[Math.min(dp.length - 1, Math.floor(0.9 * dp.length))]) : '—'} |`);
  }
  return out;
}

/** What the images cost: tokens per picture, by its pixels (Jev) or flat (Gemini). */
function tokenTable(lines: LedgerLine[], cases: Map<string, Case>): string[] {
  const out = ['## Quanto costa un\x27immagine', '', 'Le richieste dei difetti (lo stesso testo in ogni forma): pixel, token in ingresso e dollari, in mediana. Jev conta circa due token per riquadro di 28 × 28 pixel e un centinaio a immagine (≈ 390 pixel a token), al prezzo del testo (0,042 $ al milione); Gemini 3.1 Flash-Lite ~1100 token per foto qualunque sia la misura (0,25 $ al milione, più il ragionamento e l\x27uscita).', '', '| modello | forma | pixel mediani | token in mediani | $ per richiesta (mediana) |', '|---|---|---|---|---|'];
  const rows = lines.filter((l) => l.ok && !isRepeat(l) && l.kind === 'difetto');
  const med = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  };
  for (const m of models(rows))
    for (const form of ['lato1', 'lati4', 'griglia', 'separate']) {
      const ls = rows.filter((l) => l.model === m && l.variant === form);
      if (!ls.length) continue;
      const px = ls.map((l) => cases.get(l.case)?.meta?.pixels).filter((x): x is number => typeof x === 'number');
      out.push(`| ${m} | ${form} | ${px.length ? med(px) : '—'} | ${med(ls.map((l) => l.input_tokens))} | ${usd(med(ls.map((l) => l.usd)))} |`);
    }
  return out;
}

export function imageReport(lines: LedgerLine[], file = CASES_FILE): string {
  const cases = imageCases(file);
  const mine = lines.filter(isImageRun);
  const spend = (p: string) => mine.filter((l) => l.provider === p).reduce((s, l) => s + l.usd, 0);
  const calls = (p: string) => mine.filter((l) => l.provider === p).length;
  const tokens = (p: string) => mine.filter((l) => l.provider === p).reduce((s, l) => s + l.input_tokens, 0);
  const shown = mine.filter((l) => !isProbe(l));
  const main = summarize(shown.filter((l) => !isRepeat(l) && l.variant !== 'oggi'));
  return [
    '# Il banco di Jev con le immagini (T324): le tabelle',
    '',
    'Generato da `npx vite-node lab/scripts/jev-banco.ts -- --rapporto` dal registro `consumi.jsonl` (i giri `img…` e `prova-immagini`). Il metodo e le conclusioni sono in [`README.md`](README.md), «Le immagini».',
    '',
    `Spesa di T324: TypeSafe ${usd(spend('typesafe'))} in ${calls('typesafe')} chiamate (${(tokens('typesafe') / 1e6).toFixed(2)} milioni di token in ingresso); Gemini ${usd(spend('gemini'))} in ${calls('gemini')} righe (${(tokens('gemini') / 1e6).toFixed(2)} milioni di token in ingresso).`,
    '',
    '## Tutti i compiti',
    '',
    reportTable(main),
    '',
    ...artistTable(shown, cases),
    '',
    ...defectTable(shown),
    '',
    ...pairTable(shown),
    '',
    ...modelTable(shown, cases),
    '',
    ...tokenTable(shown, cases),
    '',
    ...stabilityTable(shown),
    '',
  ].join('\n');
}

export function writeImageReport(lines: LedgerLine[], file = path.join(BENCH_DIR, 'riepilogo-immagini.md')): string {
  fs.writeFileSync(file, imageReport(lines));
  return file;
}
