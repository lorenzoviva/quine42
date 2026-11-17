// The Scenografo measured for real (T303, for T259): two buildings written by today's Sculptor (Opus 5.5 on the CLI of the subscription,
// T391's tool), three ways of furnishing them, two requests per way, every answer through the engine, the guard and the checks.
//
//   (a) the interior in the building's own program: `scultore-gemini.ts --interno` writes it (the game's `sculpt`, with its checks and
//       the Artist), into <out>/insieme; here it is measured.
//   (b) a MarkovJunior program of a second stage (`prompt-programma.md`), (c) a choice of existing furniture as data (`prompt-dati.md`):
//       asked here to the CLI of Claude, isolated (`claudeCliModels`), the same model, effort `low` as the game's thinking; one
//       correction with the kernel's reason when the answer is not one the kernel takes (rule 2).
//
//   npx vite-node lab/scripts/scenografo-misura.ts -- [--vie programma,dati] [--ripeti 2] [--solo villetta,fattoria] [--finestra 80]
//       [--densita gioco|20] [--offline] [--cli-cmd "node lab/scripts/claude-finta.mjs …"] [--misura] [--out lab/banco/scenografo/misura]
//
// The buildings are <out>/vuoto/claude-opus-5-5/giro1/<edificio>-large/programma.xml (the same Sculptor without the interior). With
// --misura no call: every answer kept is measured again. --densita: the buildings at the game's density (`gioco`, the default: 16 voxels a
// tile since T405, ADR-0209, the measure of T406) or at the bench's 20 (T303's measure, `--densita 20 --out lab/banco/scenografo/misura`). --offline answers (b) and (c) with the files of `offline/` (no call).
// → <out>/<edificio>/<via>-<n>/{richiesta.md, risposta.md, programma.xml | regole.json, esito.json}, <out>/<edificio>.png (rows: empty, a1, a2,
//   b1, b2, c1, c2; two columns per seed of the building, the ground floor and the one above, cut above the head), <out>/riepilogo.md, <out>/riepilogo.json.

import fs from 'node:fs';
import path from 'node:path';
import { sculptorRole } from '../../src/kernel/agents/sculptor';
import { STRUCTURE_SEEDS } from '../../src/kernel/agents/sculptor';
import { type Grid3 } from '../../src/mj/engine';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../src/mj/photo';
import type { Bersaglio, Eseguito } from '../banco/misure';
import { arredaValidato, catalogo, scena, varianzaInterna, type Arredato, type Mobile, type Scena } from '../banco/scenografo/scenografo';
import { arredaConProgramma, arredaConRegole, arredoInsieme, compilaArredo, controlli, descrivi, leggiRegole, MOBILI, type Regola } from '../banco/scenografo/misura';
import { claudeCliModels, readWindow, type ClaudeCall, type ClaudeWindow } from './claude-cli';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const OUT = path.resolve(opt('out') ?? 'lab/banco/scenografo/misura');
const VIE = (opt('vie') ?? 'programma,dati').split(',') as Array<'programma' | 'dati'>;
const RIPETI = Number(opt('ripeti') ?? 2);
const EDIFICI = (opt('solo') ?? 'villetta,fattoria').split(',');
const FINESTRA = Number(opt('finestra') ?? 80);
const OFFLINE = args.includes('--offline');
const SOLO_MISURA = args.includes('--misura');
const MODELLO = 'claude-opus-5-5';
const SFORZO = 'low';
const SEMI = STRUCTURE_SEEDS;
/** The density of the buildings: the game's (16 since T405) or the bench's 20 (T303). */
const GIOCO = (opt('densita') ?? 'gioco') === 'gioco';
/** The floors of an interior: covered only, a storey of at least 2 tiles² is furnished (the storeys at Large are 3-4 tiles²). */
const OPZIONI = { piccolo: 2, coperto: true };

const bersaglio = (nome: string): Bersaglio => ({ id: nome, nome, stile: '', descrizione: '', classe: 'structure', taglia: 'large', ...(GIOCO ? { gioco: true } : {}) });
const edificioXml = (nome: string) => path.join(OUT, 'vuoto', MODELLO, 'giro1', `${nome}-large`, 'programma.xml');

// ---------------------------------------------------------------- the prompts

/** The Sculptor's own sections on the language of MarkovJunior (the program, patterns, nodes, traps), as the game gives them. */
function linguaggio(): string {
  const role = sculptorRole({ 'prompts/agents/sculptor.md': fs.readFileSync('universe/prompts/agents/sculptor.md', 'utf8') });
  const keep = ['## The program', '## Patterns', '## Nodes (the same', '## Nodes that look ahead', '## Traps'];
  return role
    .split(/\n(?=## )/)
    .filter((s) => keep.some((k) => s.startsWith(k)))
    .join('\n');
}

function sistema(via: 'programma' | 'dati', mobili: Map<string, Mobile>, vpt: number, corpo: number): string {
  const t = fs.readFileSync(`lab/banco/scenografo/prompt-${via}.md`, 'utf8');
  if (via === 'programma') return t.replace('@@LINGUAGGIO@@', linguaggio()).replaceAll('@@CORPO@@', String(corpo));
  const index = JSON.parse(fs.readFileSync('universe/models/index.json', 'utf8')) as Record<string, { name?: string }>;
  const righe = MOBILI.filter((id) => mobili.has(id)).map((id) => {
    const m = mobili.get(id)!;
    return `- \`${id}\`: ${index[id]?.name ?? id}, ${(m.X / vpt).toFixed(1)} × ${(m.Y / vpt).toFixed(1)} tiles, ${(m.Z / vpt).toFixed(1)} tall`;
  });
  return t.replace('@@CATALOGO@@', righe.join('\n'));
}

// ---------------------------------------------------------------- the calls

const windowState: { last?: ClaudeWindow; at: number; stop?: string; reads: ClaudeWindow[] } = { at: 0, reads: [] };
function gate(): string | undefined {
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
  if (s !== undefined && s > FINESTRA) windowState.stop = `finestra delle 5 ore di Claude al ${s} % (oltre ${FINESTRA} %): la misura si ferma`;
  return windowState.stop;
}

interface Richiesta {
  via: 'programma' | 'dati';
  n: number;
  chiamate: ClaudeCall[];
  secondi: number;
  /** The answer the kernel took, or why none. */
  testo?: string;
  errore?: string;
  correzioni: number;
}

/** One request of a way: the CLI, and one correction with the kernel's reason if the answer is not taken. */
async function chiedi(via: 'programma' | 'dati', n: number, dir: string, system: string, prompt: string, prova: (text: string) => string | undefined): Promise<Richiesta> {
  const calls: ClaudeCall[] = [];
  const cli = claudeCliModels({ cmd: opt('cli-cmd'), effort: SFORZO, gate, onCall: (c) => calls.push(c) });
  const t0 = Date.now();
  const log: string[] = [];
  let text: string | undefined;
  let errore: string | undefined;
  let correzioni = 0;
  let p = prompt;
  for (let k = 0; k < 2; k++) {
    try {
      const raw = OFFLINE ? fs.readFileSync(`lab/banco/scenografo/offline/${via}.${via === 'programma' ? 'xml' : 'json'}`, 'utf8') : await cli({ agent: 'scenografo', task: `interior.${via}`, model: MODELLO, system, prompt: p });
      log.push(`## Richiesta ${k + 1}\n\n${p}\n\n## Risposta ${k + 1}\n\n${raw}\n`);
      const why = prova(raw);
      if (!why) {
        text = raw;
        errore = undefined;
        break;
      }
      errore = why;
      log.push(`## Il kernel\n\n${why}\n`);
      if (k === 0) {
        correzioni++;
        p = `${prompt}\n\nYour answer:\n${raw}\n\nThe kernel did not take it: ${why}\nCorrect it and answer again, whole.`;
      }
    } catch (e) {
      errore = (e as Error).message;
      log.push(`## Errore\n\n${errore}\n`);
      break;
    }
  }
  fs.writeFileSync(path.join(dir, 'richiesta.md'), `# ${via} ${n}\n\n## Sistema\n\n${system}\n`);
  fs.writeFileSync(path.join(dir, 'risposta.md'), log.join('\n'));
  return { via, n, chiamate: calls, secondi: Math.round((Date.now() - t0) / 1000), ...(text ? { testo: text } : {}), ...(errore ? { errore } : {}), correzioni };
}

const xmlOf = (text: string) => (/```(?:xml)?\s*([\s\S]*?)```/.exec(text)?.[1] ?? text).trim();

// ---------------------------------------------------------------- the measures

interface MisuraSeme {
  seme: number;
  regge: boolean;
  tentativi: number;
  ms: number;
  pezzi: number;
  voxel: number;
  raggiunte: number;
  stanzePercorribili: [number, number];
  stanzeArredate: [number, number];
  piani: [number, number];
  parti: string[];
  giudicaPerso: string[];
  animaliLiberi: number;
  varianza: number;
  scartati?: number;
}

function misuraVia(scene: Scena[], fa: (s: Scena, k: number) => Arredato & { scartati?: number }): { semi: MisuraSeme[]; foto: Picture[] } {
  const semi: MisuraSeme[] = [];
  const foto: Picture[] = [];
  for (const s of scene) {
    const v1 = arredaValidato(s, (k) => fa(s, k), 1);
    const v2 = arredaValidato(s, (k) => fa(s, k), 2);
    const c = controlli(s, v1.a);
    const prima = controlli(s, { e: s.e, m: s.m, voxel: new Set() });
    semi.push({
      seme: s.seme,
      regge: v1.tentativi <= 4,
      tentativi: v1.tentativi,
      ms: Math.round(v1.ms),
      pezzi: v1.c.pezzi,
      voxel: v1.a.voxel.size,
      raggiunte: v1.c.raggiunte,
      stanzePercorribili: v1.c.stanzePercorribili,
      stanzeArredate: c.stanzeArredate,
      piani: [prima.piani, c.piani],
      parti: c.parti.filter((p) => !prima.parti.includes(p)),
      giudicaPerso: c.giudica.filter((d) => !prima.giudica.includes(d)),
      animaliLiberi: c.animaliLiberi,
      varianza: varianzaInterna(v1.a.voxel, v2.a.voxel),
      ...((v1.a as { scartati?: number }).scartati !== undefined ? { scartati: (v1.a as { scartati?: number }).scartati } : {}),
    });
    foto.push(...taglio(v1.a.e, s));
  }
  return { semi, foto };
}

/** The ground floor and the one above, each cut a little above a body's head, seen from the front (as `banco-scenografo.ts`): two pictures. */
function taglio(e: Eseguito, s: Scena): Picture[] {
  const g = e.grid;
  const sopra = s.m.piani.filter((p) => p.z >= s.e.scatola.base - 1);
  return [sopra[0]?.z ?? s.e.scatola.base, ...(sopra[1] ? [sopra[1].z] : [])].map((z0) => {
    const top = Math.min(g.Z, z0 + Math.round(0.9 * e.scatola.vpt));
    const cut: Grid3 = { ...g, Z: top, cells: g.cells.slice(0, g.X * g.Y * top), log: [], epoch: 0 };
    return render(cut, e.model.program.palette, 0, DEFAULT_RENDER);
  });
}

/** (a) the interior written with the building: measured on its own seeds, no before to compare with but the empty building of the same concept. */
function misuraInsieme(file: string, nome: string): { semi: Array<Omit<MisuraSeme, 'tentativi' | 'regge' | 'varianza' | 'raggiunte' | 'stanzePercorribili' | 'ms'> & { lettere: string[] }>; foto: Picture[] } {
  const xml = fs.readFileSync(file, 'utf8');
  const semi = [];
  const foto: Picture[] = [];
  for (let seme = 1; seme <= SEMI; seme++) {
    const s = scena(xml, bersaglio(nome), seme, OPZIONI);
    const a = arredoInsieme(s);
    const c = controlli(s, { e: s.e, m: s.m, voxel: a.voxel });
    semi.push({ seme, pezzi: a.pezzi, voxel: a.voxel.size, stanzeArredate: c.stanzeArredate, piani: [c.piani, c.piani] as [number, number], parti: c.parti, giudicaPerso: c.giudica, animaliLiberi: c.animaliLiberi, lettere: a.lettere });
    foto.push(...taglio(s.e, s));
  }
  return { semi, foto };
}

// ---------------------------------------------------------------- the run

const SFONDO: [number, number, number] = [112, 150, 84];
function pila(rs: Picture[]): Picture {
  const gap = 6;
  const w = Math.max(...rs.map((r) => r.w));
  const h = rs.reduce((s, r) => s + r.h, 0) + gap * (rs.length - 1);
  const data = new Uint8ClampedArray(w * h * 4).fill(240);
  let y0 = 0;
  for (const r of rs) {
    for (let y = 0; y < r.h; y++) data.set(r.data.subarray(y * r.w * 4, (y + 1) * r.w * 4), ((y0 + y) * w) * 4);
    y0 += r.h + gap;
  }
  return { w, h, data };
}

const usdOf = (cs: ClaudeCall[]) => cs.reduce((s, c) => s + (c.usd ?? 0), 0);
const cliOf = (cs: ClaudeCall[]) => cs.reduce((s, c) => s + (c.usdCli ?? 0), 0);
const sum = (cs: ClaudeCall[], k: 'input' | 'written5m' | 'written1h' | 'read' | 'output') => cs.reduce((s, c) => s + c[k], 0);

const prima = !OFFLINE && !SOLO_MISURA ? readWindow() : undefined;
if (prima) console.log(`Claude prima: 5 ore ${prima.session ?? '?'} %, settimana ${prima.week ?? '?'} %`);
const riepilogo: Record<string, unknown> = {};
const mobiliPer = new Map<number, Map<string, Mobile>>();

for (const nome of EDIFICI) {
  const file = edificioXml(nome);
  if (!fs.existsSync(file)) {
    console.log(`${nome}: manca ${path.relative(process.cwd(), file)} (lo scrive scultore-gemini.ts --solo ${nome})`);
    continue;
  }
  const xml = fs.readFileSync(file, 'utf8');
  const scene = Array.from({ length: SEMI }, (_, i) => scena(xml, bersaglio(nome), i + 1, OPZIONI));
  const vpt = scene[0].e.scatola.vpt;
  if (!mobiliPer.has(vpt)) mobiliPer.set(vpt, catalogo(vpt, MOBILI));
  const mobili = mobiliPer.get(vpt)!;
  const descrizione = descrivi(nome, scene.slice(0, 2));
  const righe: Picture[] = [sheet(scene.flatMap((s) => taglio(s.e, s)), 2, 4, SFONDO)];
  const out: Record<string, unknown> = { edificio: path.relative(process.cwd(), file) };

  // (a), written by scultore-gemini.ts --interno.
  for (let n = 1; n <= RIPETI; n++) {
    const dir = path.join(OUT, 'insieme', MODELLO, `giro${n}`, `${nome}-large`);
    const esito = fs.existsSync(path.join(dir, 'esito.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'esito.json'), 'utf8')) : undefined;
    if (!esito) continue;
    const prog = path.join(dir, 'programma.xml');
    const m = fs.existsSync(prog) ? misuraInsieme(prog, nome) : undefined;
    if (m) righe.push(sheet(m.foto, 2, 4, SFONDO));
    out[`insieme-${n}`] = { esito: { chiamate: esito.chiamate, secondi: esito.secondi, usd: esito.usd, usdClaude: esito.usdClaude, usdCli: esito.usdCli, usdGemini: esito.usdGemini, voto: esito.voto, errore: esito.errore, claude: esito.claude }, ...(m ? { semi: m.semi } : {}) };
    console.log(`${nome} insieme ${n}: ${esito.modello ? `voto ${esito.voto}` : `NON riuscito (${esito.errore})`} · ${esito.usd} $ · ${m ? m.semi.map((x) => `seme ${x.seme} pezzi ${x.pezzi} voxel ${x.voxel} stanze ${x.stanzeArredate.join('/')} animali ${(x.animaliLiberi * 100).toFixed(0)} %`).join(' · ') : ''}`);
  }

  // (b) and (c): asked here.
  for (const via of VIE) {
    const system = sistema(via, mobili, vpt, scene[0].e.scatola.corpo);
    const prompt = `${descrizione}\n\nFurnish this building.`;
    for (let n = 1; n <= RIPETI; n++) {
      const dir = path.join(OUT, nome, `${via}-${n}`);
      fs.mkdirSync(dir, { recursive: true });
      const esitoFile = path.join(dir, 'esito.json');
      const prova = (text: string): string | undefined => {
        try {
          if (via === 'programma') {
            const model = compilaArredo(xmlOf(text), [scene[0].e.grid.X, scene[0].e.grid.Y, scene[0].e.grid.Z]);
            const a = arredaConProgramma(scene[0], model, 1);
            if (!a.finito) return 'the program does not finish in 8 seconds on the seed 1: every growth needs steps';
            if (!a.voxel.size && !a.scartati) return 'the program wrote no furniture on the seed 1';
            return undefined;
          }
          const r = leggiRegole(text, mobili);
          if (!r.regole.length) return `no rule the kernel can use${r.ignoti.length ? `; not in the list: ${r.ignoti.join(', ')}` : ''}`;
          return undefined;
        } catch (e) {
          return (e as Error).message;
        }
      };
      let req: Richiesta;
      if (SOLO_MISURA) {
        if (!fs.existsSync(esitoFile)) continue;
        req = JSON.parse(fs.readFileSync(esitoFile, 'utf8')).richiesta;
      } else {
        if (gate()) {
          console.log(`${nome} ${via} ${n}: non chiesto (${windowState.stop})`);
          continue;
        }
        req = await chiedi(via, n, dir, system, prompt, prova);
        if (req.testo) fs.writeFileSync(path.join(dir, via === 'programma' ? 'programma.xml' : 'regole.json'), via === 'programma' ? xmlOf(req.testo) : JSON.stringify(leggiRegole(req.testo, mobili), null, 1));
      }
      let misure: ReturnType<typeof misuraVia> | undefined;
      if (req.testo) {
        if (via === 'programma') {
          const model = compilaArredo(xmlOf(req.testo), [scene[0].e.grid.X, scene[0].e.grid.Y, scene[0].e.grid.Z]);
          misure = misuraVia(scene, (s, k) => arredaConProgramma(s, model, k));
        } else {
          const { regole } = leggiRegole(req.testo, mobili);
          misure = misuraVia(scene, (s, k) => arredaConRegole(s, k, mobili, regole as Regola[]));
        }
        righe.push(sheet(misure.foto, 2, 4, SFONDO));
      }
      const usd = usdOf(req.chiamate);
      fs.writeFileSync(esitoFile, JSON.stringify({ richiesta: req, usd, usdCli: cliOf(req.chiamate), ...(misure ? { semi: misure.semi } : {}) }, null, 1));
      out[`${via}-${n}`] = { usd, usdCli: cliOf(req.chiamate), chiamate: req.chiamate.length, secondi: req.secondi, correzioni: req.correzioni, ...(req.errore ? { errore: req.errore } : {}), token: { input: sum(req.chiamate, 'input') + sum(req.chiamate, 'written5m') + sum(req.chiamate, 'written1h') + sum(req.chiamate, 'read'), cache: sum(req.chiamate, 'read'), output: sum(req.chiamate, 'output') }, ...(misure ? { semi: misure.semi } : {}) };
      console.log(`${nome} ${via} ${n}: ${req.testo ? 'preso' : `NON preso (${req.errore})`} · ${req.chiamate.length} chiamate, ${req.correzioni} correzioni, ${req.secondi} s, ${usd.toFixed(3)} $ · ${misure ? misure.semi.map((x) => `seme ${x.seme} ${x.regge ? 'regge' : 'NO'} (${x.tentativi}) pezzi ${x.pezzi} stanze ${x.stanzeArredate.join('/')} animali ${(x.animaliLiberi * 100).toFixed(0)} %${x.giudicaPerso.length ? ` perde ${x.giudicaPerso.join(',')}` : ''}`).join(' · ') : ''}`);
    }
  }
  fs.writeFileSync(path.join(OUT, `${nome}.png`), png(pila(righe)));
  riepilogo[nome] = out;
}

const dopo = !OFFLINE && !SOLO_MISURA ? readWindow() : undefined;
if (dopo) console.log(`Claude dopo: 5 ore ${dopo.session ?? '?'} %, settimana ${dopo.week ?? '?'} %`);
const file = path.join(OUT, 'riepilogo.json');
const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const finestra = prima || dopo ? [...(old.finestra ?? []), { prima, dopo, letture: windowState.reads, ...(windowState.stop ? { fermato: windowState.stop } : {}) }] : old.finestra;
fs.writeFileSync(file, JSON.stringify({ ...old, ...riepilogo, ...(finestra ? { finestra } : {}) }, null, 1));
tabella(JSON.parse(fs.readFileSync(file, 'utf8')));

/** The table of every way and building, → <out>/riepilogo.md. */
function tabella(r: Record<string, Record<string, Record<string, unknown>>>): void {
  const n2 = (x: number) => x.toFixed(2).replace('.', ',');
  const pct = (x: number) => `${Math.round(x * 100)} %`;
  const lines = [
    '| edificio | via | richiesta | costo (listino API) | costo detto dalla CLI | chiamate | correzioni | token in (cache) | token out | secondi | regge al primo | regge entro 4 | pezzi (media) | stanze arredate | animali liberi | piani prima → dopo | perso | varianza |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const [nome, vie] of Object.entries(r)) {
    if (nome === 'finestra') continue;
    for (const [k, v] of Object.entries(vie)) {
      if (k === 'edificio') continue;
      const [via, n] = k.split('-');
      const semi = (v.semi ?? []) as MisuraSeme[];
      const media = (f: (x: MisuraSeme) => number) => (semi.length ? semi.reduce((s, x) => s + f(x), 0) / semi.length : 0);
      const stanze = semi.length ? `${semi.reduce((s, x) => s + x.stanzeArredate[0], 0)}/${semi.reduce((s, x) => s + x.stanzeArredate[1], 0)}` : '—';
      const perso = [...new Set(semi.flatMap((x) => [...(x.giudicaPerso ?? []), ...(x.parti ?? []).map((p) => p.split(':')[0])]))].join(', ') || '—';
      const piani = semi.length ? [...new Set(semi.map((x) => x.piani.join('→')))].join(', ') : '—';
      if (via === 'insieme') {
        const e = v.esito as Record<string, unknown> & { claude?: ClaudeCall[] };
        const cs = e.claude ?? [];
        const tin = cs.reduce((s, c) => s + c.input + c.written5m + c.written1h + c.read, 0);
        lines.push(`| ${nome} | (a) insieme | ${n} | ${n2(Number(e.usdClaude ?? 0))} $ (+ ${n2(Number(e.usdGemini ?? 0))} $ dell'Artista) | ${n2(Number(e.usdCli ?? 0))} $ | ${cs.length} | ${Math.max(0, cs.length - 2)} | ${tin} (${cs.reduce((s, c) => s + c.read, 0)}) | ${cs.reduce((s, c) => s + c.output, 0)} | ${e.secondi} | ${e.errore ? `no: ${String(e.errore).slice(0, 60)}` : `voto ${e.voto}`} | — | ${semi.length ? n2(media((x) => x.pezzi)) : '—'} | ${stanze} | ${semi.length ? pct(media((x) => x.animaliLiberi)) : '—'} | ${piani} | ${perso} | — |`);
        continue;
      }
      const t = v.token as { input: number; cache: number; output: number };
      lines.push(`| ${nome} | ${via === 'programma' ? '(b) programma' : '(c) dati'} | ${n} | ${n2(Number(v.usd))} $ | ${n2(Number(v.usdCli))} $ | ${v.chiamate} | ${v.correzioni} | ${t.input} (${t.cache}) | ${t.output} | ${v.secondi} | ${semi.length ? `${semi.filter((x) => x.tentativi === 1).length}/${semi.length}` : v.errore ? `no: ${String(v.errore).slice(0, 60)}` : '—'} | ${semi.length ? `${semi.filter((x) => x.regge).length}/${semi.length}` : '—'} | ${semi.length ? n2(media((x) => x.pezzi)) : '—'} | ${stanze} | ${semi.length ? pct(media((x) => x.animaliLiberi)) : '—'} | ${piani} | ${perso} | ${semi.length ? n2(media((x) => x.varianza)) : '—'} |`);
    }
  }
  const md = `# Lo Scenografo misurato (${path.relative(process.cwd(), OUT).split(path.sep).join('/')}, gli edifici a ${GIOCO ? 16 : 20} voxel per casella): ${Object.keys(r).filter((k) => k !== 'finestra').join(', ')}, tre vie\n\nOgni costo è in dollari al listino API di Anthropic dai token che la CLI riporta (Opus 5.5, sforzo \`low\`); accanto quello che la CLI stessa dice (\`total_cost_usd\`). I semi dell'edificio sono ${SEMI}; «regge» è la guardia e le misure del banco (\`regge\` di \`scenografo.ts\`) con al più 4 semi d'arredo.\n\n${lines.join('\n')}\n`;
  fs.writeFileSync(path.join(OUT, 'riepilogo.md'), md);
  console.log(md);
}
