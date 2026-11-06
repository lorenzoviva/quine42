// The catalogue of the cloud workshop (Cantiere 1): every structure on the bench, 5 seeds × Large and Huge, with the game's own measures
// (`misure.ts`), the variance (`varianza.ts`), the time at Huge and, for who corrects a program, the time of each node and the trace of seed 1.
//
//   npx vite-node lab/banco/catalogo-cloud/valida.ts -- <ambientazione>/<nome>.xml [...]   # prova, rapporto <nome>.md accanto all'XML
//   npx vite-node lab/banco/catalogo-cloud/valida.ts -- --profilo <file.xml> [--taglia enorme] [--seme 1]  # i nodi più lenti
//   npx vite-node lab/banco/catalogo-cloud/valida.ts -- --indice                          # README.md con la tabella di tutti i rapporti
//
// No model is called. The structure has a cellar if its root says `suolo=` and `ground=`: then the target has `sotto: 1` (ADR-0135).

import fs from 'node:fs';
import path from 'node:path';
import { withSize } from '../../../src/kernel/agents/sculptor';
import { compileMjx } from '../../../src/mj/model';
import { describe, type Node3 } from '../../../src/mj/engine';
import { traceText } from '../../../src/mj/trace';
import { FORM_LIMITS } from '../../../src/mj/run';
import type { SizeTier } from '../../../src/mj/classes';
import { esegui, scatolaDi, type Bersaglio } from '../misure';
import { fotoSemi, prova, type Prova } from '../varianza';
import { png } from '../../scripts/png';
import { colonne, imbottisci, leaves, planLeaves, senzaAria } from './ottimizza';

export const DIR = path.resolve('lab/banco/catalogo-cloud');

/**
 * A copy of the engine with a clock on every leaf (`_engineprof.ts`, not in git): the run is the same, the time of each node is known,
 * failed tries included (`RunWatch` sees only the steps that did something). Written again whenever the engine changes.
 */
async function motoreCronometrato() {
  const src = fs.readFileSync(path.resolve('src/mj/engine.ts'), 'utf8').replace("from '../kernel/rng'", "from '../../../src/kernel/rng'");
  const leaf = `  return watch && node.type !== 'sequence' && node.type !== 'markov' ? new WatchedRunner(r, node, watch) : r;
}`;
  if (!src.includes(leaf)) throw new Error('engine.ts è cambiato: aggiorna motoreCronometrato');
  const timed = '// @ts-nocheck — written by valida.ts from src/mj/engine.ts, not in git\n' + src.replace(
    leaf,
    `  if (node.type === 'sequence' || node.type === 'markov') return r;
  return new TimedRunner(r, node);
}
export const PROF = new Map<Node3, { ms: number; calls: number; ok: number; v: number; cells: number }>();
class TimedRunner extends Runner {
  constructor(private inner: Runner, private node: Node3) { super(); }
  reset(): void { this.inner.reset(); }
  go(g: Grid3, rng: Rng): boolean {
    const t = performance.now();
    const before = g.log.length, epoch = g.epoch;
    const ok = this.inner.go(g, rng);
    const e = PROF.get(this.node) ?? { ms: 0, calls: 0, ok: 0, cells: 0, v: ((this.inner as unknown as { patterns?: unknown[] }).patterns ?? []).length };
    e.ms += performance.now() - t; e.calls++; if (ok) e.ok++;
    if (g.epoch === epoch) e.cells += g.log.length - before;
    PROF.set(this.node, e);
    return ok;
  }
}`,
  );
  const file = path.join(DIR, '_engineprof.ts');
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== timed) fs.writeFileSync(file, timed);
  return (await import(/* @vite-ignore */ file)) as { run: typeof import('../../../src/mj/engine').run; PROF: Map<Node3, { ms: number; calls: number; ok: number; v: number; cells: number }> };
}
const { run, PROF } = await motoreCronometrato();
export const AMBIENTAZIONI = ['fantasy', 'steampunk', 'moderno', 'futuristico'] as const;
export const TAGLIE: SizeTier[] = ['large', 'huge'];
export const SEMI = 5;
/** The ceiling of this workshop at Huge, every seed (the game's is `MODEL_TIME`, 8 s). */
export const TETTO_MS = 4500;

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);

/** What the XML says of itself: the name in the first comment, the cellar from the root. */
export function bersaglioDi(xml: string, file: string): Bersaglio {
  const cantina = /<sequence[^>]*\bsuolo="/.test(xml) && /<sequence[^>]*\bground="/.test(xml);
  const nome = /<!--\s*([^\n]*?)\s*-->/.exec(xml)?.[1] ?? path.basename(file, '.xml');
  return { id: path.basename(file, '.xml'), nome, stile: '', descrizione: '', classe: 'structure', ...(cantina ? { sotto: 1 } : {}) };
}

const n2 = (v: number | undefined) => (v === undefined ? '—' : v.toFixed(2));

/** Each node's time in one run, its failed tries included (a copy of the engine with a clock on every leaf, `_engineprof.ts`). */
export function profilo(xml: string, b: Bersaglio, seme = 1) {
  const model = esegui(xml, b, seme, 30_000).model;
  PROF.clear();
  const t0 = performance.now();
  const r = run(model.program, seme, 5_000_000, FORM_LIMITS, { deadline: 30_000 });
  const ordine = [...PROF.keys()];
  const nodi = [...PROF.entries()].map(([n, v]) => ({ ...v, passi: v.ok, i: ordine.indexOf(n) + 1, nome: describe(n) ?? n.type }));
  return { ms: Math.round(performance.now() - t0), finito: r.finished, nodi: nodi.sort((a, b) => b.ms - a.ms) };
}

export interface Riga {
  file: string;
  ambientazione: string;
  nome: string;
  titolo: string;
  cantina: boolean;
  passa: boolean;
  regge: boolean;
  varia: boolean;
  maxMs: Record<string, number>;
  semiOk: Record<string, string>;
  varianza: Record<string, { voxel: number; pianta: number; perimetro: number; interno: number; architetture: number }>;
  difetti: string[];
}

function rapporto(file: string, xml: string, b: Bersaglio, p: Prova, riga: Riga): string {
  const out: string[] = [];
  out.push(`# ${b.nome}`, '');
  out.push(`Programma: \`${path.basename(file)}\` · ambientazione **${riga.ambientazione}** · classe \`grande\` (struttura) · ${riga.cantina ? '**con cantina** (`suolo="E"`, `ground="Z"`, `sotto: 1`)' : 'senza cantina'} · ${xml.length} caratteri.`, '');
  out.push(`![I cinque semi a Grande e a Enorme, sotto la prima riga le piante del piano terra](${path.basename(file, '.xml')}.png)`, '');
  out.push(`Esito: **${riga.passa ? 'passa' : 'non passa'}** — regge ${riga.regge ? 'a ogni seme e taglia' : 'no'}, varia ${riga.varia ? 'sì' : 'no'}, tempo massimo a Enorme ${riga.maxMs.enorme} ms (tetto ${TETTO_MS} ms).`, '');
  for (const t of p.taglie) {
    out.push(`## ${t.taglia} — ${t.box.join(' × ')} voxel, ${t.vpt} voxel per casella, gradino ${t.gradino}`, '');
    const qui = p.esecuzioni.filter((x) => x.taglia === t.taglia);
    out.push('| seme | ms | piani (quota: testa, stanze) | stanze | cantina | murato | porta | salti | finestre | dettagli | materiali | dominante | sagoma | rilievo | ingombro | fluttuanti | difetti |');
    out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const s of t.semi) {
      const x = qui.find((q) => q.seme === s.seme);
      const m = x?.m;
      if (!m) {
        out.push(`| ${s.seme} | ${s.ms} | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ${s.difetti.join('; ')} |`);
        continue;
      }
      const flutt = m.analisi.errors.filter((e) => /stacc|fluttu|float|sospes/i.test(e)).length;
      out.push(
        `| ${s.seme} | ${m.ms} | ${m.piani.map((pp) => `${pp.quota.toFixed(1)}: ${pp.testa.toFixed(1)}, ${pp.stanze}`).join(' · ')} | ${m.stanze} | ${riga.cantina ? n2(m.cantina) : '—'} | ${n2(m.murato)} | ${m.porta ? `${m.porta.libera ? 'libera' : 'ostruita'}, scarto ${n2(m.porta.scarto)}` : 'no'} | ${m.salti.length} | ${m.finestre}/${m.latiConFinestre} lati | ${m.dettagli}/${m.latiVuoti} vuoti | ${m.materiali} | ${n2(m.dominante)} | ${m.sagoma} | ${n2(m.rilievo)} | ${n2(m.ingombro)} | ${flutt} | ${s.difetti.join('; ') || '—'} |`,
      );
    }
    out.push('');
    const v = t.varianza;
    if (v) out.push(`Varianza su ${v.semi} semi (mediane delle coppie): voxel ${n2(v.voxel)} (≥ 0.2), pianta ${n2(v.pianta)} (≥ 0.15), perimetro ${n2(v.perimetro)} (≥ 0.15), interno ${n2(v.interno)} (≥ 0.35), colore ${n2(v.colore)} (non conta), liste di piani ${v.firmePiani} e di stanze ${v.firmeStanze} (≥ 2), architetture ${v.architetture}/${v.semi} (≥ 3). ${t.difettiVarianza.length ? 'Difetti: ' + t.difettiVarianza.join('; ') : 'Sopra ogni soglia.'}`, '');
  }
  out.push('Misure: `lab/banco/misure.ts` (il corpo del gioco cammina dal davanti: piani raggiunti, murato = pavimento coperto non raggiunto, porta libera, salti; `valido` sono i controlli di `src/mj/check.ts`, fra cui i voxel staccati da terra) e `lab/banco/varianza.ts` (soglie di T180).', '');
  const m1 = compileMjx(withSize(xml, scatolaDi({ ...b, taglia: 'large' }).box), { ...(b.sotto ? { base: scatolaDi({ ...b, taglia: 'large' }).base } : {}) });
  out.push('## Traccia del seme 1 (Grande, `src/mj/trace.ts`, forma «differenze»)', '', '```text', traceText(m1, 1, { forma: 'diffs', tetto: 3500 }), '```', '');
  return out.join('\n');
}

export function valida(file: string): Riga {
  const xml = fs.readFileSync(file, 'utf8');
  const b = bersaglioDi(xml, file);
  const p = prova(xml, b, { semi: SEMI, taglie: TAGLIE });
  const maxMs: Record<string, number> = {};
  const semiOk: Record<string, string> = {};
  const varianza: Riga['varianza'] = {};
  const difetti: string[] = [];
  for (const t of p.taglie) {
    const qui = p.esecuzioni.filter((x) => x.taglia === t.taglia);
    maxMs[t.taglia] = Math.max(0, ...qui.map((x) => x.m.ms));
    semiOk[t.taglia] = `${t.semi.filter((s) => !s.difetti.length).length}/${t.semi.length}`;
    if (t.varianza) varianza[t.taglia] = { voxel: t.varianza.voxel, pianta: t.varianza.pianta, perimetro: t.varianza.perimetro, interno: t.varianza.interno, architetture: t.varianza.architetture };
    for (const s of t.semi) for (const d of s.difetti) difetti.push(`${t.taglia} seme ${s.seme}: ${d}`);
    for (const d of t.difettiVarianza) difetti.push(`${t.taglia} varianza: ${d}`);
  }
  if ((maxMs.enorme ?? Infinity) >= TETTO_MS) difetti.push(`enorme: ${maxMs.enorme} ms (tetto ${TETTO_MS})`);
  const riga: Riga = {
    file: path.relative(DIR, file),
    ambientazione: path.basename(path.dirname(file)),
    nome: path.basename(file, '.xml'),
    titolo: b.nome,
    cantina: !!b.sotto,
    passa: p.passa && (maxMs.enorme ?? Infinity) < TETTO_MS,
    regge: p.regge,
    varia: p.varia,
    maxMs,
    semiOk,
    varianza,
    difetti,
  };
  fs.writeFileSync(file.replace(/\.xml$/, '.md'), rapporto(file, xml, b, p, riga));
  const foto = fotoSemi(p);
  if (foto) fs.writeFileSync(file.replace(/\.xml$/, '.png'), png(foto));
  fs.writeFileSync(file.replace(/\.xml$/, '.json'), JSON.stringify(riga, null, 1));
  return riga;
}

function indice() {
  const righe: Riga[] = [];
  for (const a of AMBIENTAZIONI) {
    const d = path.join(DIR, a);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort()) righe.push(JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')));
  }
  const v = (r: Riga, t: string, k: 'voxel' | 'pianta' | 'perimetro' | 'interno') => n2(r.varianza[t]?.[k]);
  const testa = fs.readFileSync(path.join(DIR, 'README.head.md'), 'utf8');
  const tab = [
    `| ambientazione | struttura | file | cantina | esito | semi G / E | ms max G / E | voxel G / E | pianta G / E | perimetro G / E | interno G / E | architetture G / E |`,
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...righe.map((r) => `| ${r.ambientazione} | ${r.titolo} | [\`${r.file}\`](${r.file.replace(/\.xml$/, '.md')}) | ${r.cantina ? 'sì' : '—'} | ${r.passa ? '**passa**' : 'no'} | ${r.semiOk.grande} / ${r.semiOk.enorme} | ${r.maxMs.grande} / ${r.maxMs.enorme} | ${v(r, 'grande', 'voxel')} / ${v(r, 'enorme', 'voxel')} | ${v(r, 'grande', 'pianta')} / ${v(r, 'enorme', 'pianta')} | ${v(r, 'grande', 'perimetro')} / ${v(r, 'enorme', 'perimetro')} | ${v(r, 'grande', 'interno')} / ${v(r, 'enorme', 'interno')} | ${r.varianza.grande?.architetture ?? '—'} / ${r.varianza.enorme?.architetture ?? '—'} |`),
  ];
  const conta = `${righe.filter((r) => r.passa).length} strutture su ${righe.length} passano; ${righe.filter((r) => r.cantina).length} hanno la cantina; tempo massimo a Enorme ${Math.max(0, ...righe.map((r) => r.maxMs.enorme ?? 0))} ms.`;
  fs.writeFileSync(path.join(DIR, 'README.md'), testa.replace('{{TABELLA}}', [conta, '', ...tab].join('\n')));
  console.log(conta);
}

if (args.includes('--indice')) indice();
else if (opt('uguali') || opt('passi') || opt('ottimizza')) { /* below */ } else if (opt('profilo')) {
  const f = path.resolve(opt('profilo')!);
  const xml = fs.readFileSync(f, 'utf8');
  const b = { ...bersaglioDi(xml, f), taglia: (opt('taglia') ?? 'enorme') as SizeTier };
  const p = profilo(xml, b, Number(opt('seme') ?? 1));
  console.log(`${p.ms} ms, finito ${p.finito}, varianti ${p.nodi.reduce((s, n) => s + n.v, 0)} in ${p.nodi.length} nodi`);
  for (const n of p.nodi.slice(0, Number(opt('n') ?? 15))) console.log(`${n.ms.toFixed(0).padStart(6)} ms #${String(n.i).padStart(3)} v${String(n.v).padStart(3)} ${String(n.passi).padStart(5)} passi  ${n.nome.slice(0, 120)}`);
} else
  for (const a of args) {
    const r = valida(path.resolve(DIR, a));
    console.log(`${r.file}: ${r.passa ? 'PASSA' : 'NO'} · G ${r.semiOk.grande} ${r.maxMs.grande} ms · E ${r.semiOk.enorme} ${r.maxMs.enorme} ms`);
    for (const d of r.difetti.slice(0, 14)) console.log('   ', d);
  }

/** Two programs that must give the same grid (an optimisation that keeps the meaning): seeds × sizes, cell by cell. */
function uguali(a: string, b: string) {
  const xa = fs.readFileSync(a, 'utf8'), xb = fs.readFileSync(b, 'utf8');
  for (const taglia of TAGLIE)
    for (let seme = 1; seme <= SEMI; seme++) {
      const ba = { ...bersaglioDi(xa, a), taglia }, bb = { ...bersaglioDi(xb, b), taglia };
      const ea = esegui(xa, ba, seme, 30_000), eb = esegui(xb, bb, seme, 30_000);
      const ga = ea.result.grid, gb = eb.result.grid;
      let diff = 0;
      for (let i = 0; i < ga.cells.length; i++) if (ga.alphabet[ga.cells[i]] !== gb.alphabet[gb.cells[i]]) diff++;
      console.log(`${taglia} seme ${seme}: ${diff ? `${diff} celle diverse` : 'uguali'} · ${ea.result.ms} → ${eb.result.ms} ms`);
    }
}
if (opt('uguali')) uguali(path.resolve(opt('uguali')!), path.resolve(args[args.indexOf('--uguali') + 2]));

/** The leaves of a program in the order of the XML. */
function foglie(n: Node3, out: Node3[] = []): Node3[] {
  if (n.type === 'sequence' || n.type === 'markov') for (const c of n.children) foglie(c, out);
  else out.push(n);
  return out;
}

/** For each leaf in XML order, the most steps it did in one run, over seeds and sizes: who does one step can say so (`steps="1"`). */
function passi(file: string) {
  const xml = fs.readFileSync(file, 'utf8');
  const max: number[] = [];
  for (const taglia of TAGLIE)
    for (let seme = 1; seme <= SEMI; seme++) {
      const b = { ...bersaglioDi(xml, file), taglia };
      const model = esegui(xml, b, seme, 30_000).model;
      PROF.clear();
      run(model.program, seme, 5_000_000, FORM_LIMITS, { deadline: 30_000 });
      foglie(model.program.program).forEach((n, i) => (max[i] = Math.max(max[i] ?? 0, PROF.get(n)?.ok ?? 0)));
    }
  console.log(JSON.stringify(max));
}
if (opt('passi')) passi(path.resolve(opt('passi')!));

/** The readable program → the fast one (`ottimizza.ts`): columns, `9`, padding of the plan nodes that write little; then the same grids. */
function ottimizza(src: string, dst: string) {
  const x1 = senzaAria(colonne(fs.readFileSync(src, 'utf8')));
  const ls = leaves(x1);
  const passes = ls.map(() => 0), cells = ls.map(() => 0);
  for (const taglia of TAGLIE)
    for (let seme = 1; seme <= SEMI; seme++) {
      const b = { ...bersaglioDi(x1, dst), taglia };
      const model = esegui(x1, b, seme, 30_000).model;
      PROF.clear();
      run(model.program, seme, 5_000_000, FORM_LIMITS, { deadline: 30_000 });
      foglie(model.program.program).forEach((n, i) => {
        const p = PROF.get(n);
        passes[i] = Math.max(passes[i], p?.ok ?? 0);
        cells[i] = Math.max(cells[i], p && p.ok ? p.cells / p.ok : 0);
      });
    }
  const pad = new Set<number>(), oneStep = new Set<number>();
  for (const i of planLeaves(x1)) {
    if (passes[i] <= 1 && cells[i] <= 5000) (pad.add(i), oneStep.add(i));
    else if (passes[i] > 1 && cells[i] <= 300) pad.add(i);
  }
  const x2 = imbottisci(x1, pad, oneStep);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, x2);
  let diversi = 0;
  for (const taglia of TAGLIE)
    for (let seme = 1; seme <= (args.includes('--rapido') ? 1 : SEMI); seme++) {
      const g1 = esegui(x1, { ...bersaglioDi(x1, dst), taglia }, seme, 30_000).result, g2 = esegui(x2, { ...bersaglioDi(x2, dst), taglia }, seme, 30_000).result;
      let d = 0;
      for (let i = 0; i < g1.grid.cells.length; i++) if (g1.grid.alphabet[g1.grid.cells[i]] !== g2.grid.alphabet[g2.grid.cells[i]]) d++;
      if (d) diversi++;
      console.log(`${taglia} seme ${seme}: ${d ? `${d} celle diverse` : 'uguali'} · ${g1.ms} → ${g2.ms} ms`);
    }
  console.log(`${pad.size} nodi imbottiti (${oneStep.size} a un passo) · ${diversi ? `ATTENZIONE: ${diversi} esecuzioni diverse` : 'griglie uguali'} → ${path.relative(process.cwd(), dst)}`);
}
if (opt('ottimizza')) ottimizza(path.resolve(opt('ottimizza')!), path.resolve(args[args.indexOf('--ottimizza') + 2]));
