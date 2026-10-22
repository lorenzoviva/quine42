// The two agents of multi-tile structures (structure.ts). The architect comes first (ADR-0035): it writes
// the plan, zones described by what they are for and empty cells of their own kinds, without knowing any
// block; the kernel reads off the plan the configurations each zone needs (commission.ts) and orders them
// from the block sculptor. The sculptor works in two phases: first the catalogue (blocks, sockets, what
// each socket's face looks like, which sockets may face outside, which configurations each block serves),
// then the programs, a few blocks at a time, each checked against the faces already accepted. Last the
// kernel composes the plan with the blocks; if something does not hold the architect mends its plan.
// Same loop as the sculptor: the kernel mends, runs and checks, and sends back the reasons.

import { parseJson, type Models } from '../../src/kernel/ai/models';
import { mendProgram } from './check';
import { run, type Vec3 } from './engine';
import { buildBlocks, catalogue, faceMatch, LEVEL, mendBlockset, mendLayout, profile, rotateGrid, runLayout, SIDES, unclosable, type Block, type BlockReport, type Blockset, type Layout, type LayoutResult } from './structure';
import { commission, commissionText, planCells, uncovered, type Commission, type Config } from './commission';
import { TILE } from './scale';
import { ROCCA, rocca } from '../programs/rocca';
import { cripta } from '../programs/cripta';
import SCULPTOR from '../prompts/scultore.md?raw';
import BLOCKS from '../prompts/blocchi.md?raw';
import ARCHITECT from '../prompts/architetto.md?raw';

export interface StructureTarget {
  id: string;
  name: string;
  description: string;
  /** Size of the layout, in blocks: tiles across, tiles deep, levels. */
  tiles?: Vec3;
  /** How many different blocks the sculptor should make. */
  blocks?: number;
  source?: string;
}

export const STRUCTURE_PRESETS: StructureTarget[] = [
  { id: 'struct:castello', name: 'Castello con ponte levatoio', description: 'Un grande castello di pietra: fossato tutto attorno, mura merlate con torri agli angoli e lungo le cortine, un portone con ponte levatoio, una seconda cinta interna, cortili con edifici (mastio, caserme, stalle, cappella, pozzo), strade lastricate', tiles: [100, 100, 3], blocks: 30, source: 'prova' },
  { id: 'struct:sotterraneo', name: 'Sotterraneo su due livelli', description: 'Un sotterraneo scavato nella roccia: corridoi, curve, bivi, sale con pilastri e scrigni, scale che portano al livello di sotto', tiles: [40, 40, 2], blocks: 14, source: 'prova' },
  { id: 'struct:casa', name: 'Casa a due piani', description: 'Una casa di pietra e legno a due piani con porta e finestre, un balcone di legno al primo piano e un tetto a due falde di coppi', tiles: [6, 5, 3], blocks: 14, source: 'prova' },
  { id: 'struct:ponte', name: 'Ponte sul fiume', description: 'Un ponte di pietra ad arcate che attraversa un fiume, con due piccole torri di guardia alle estremità e un cancello che si chiude', tiles: [20, 9, 2], blocks: 12, source: 'prova' },
  { id: 'struct:tempio', name: 'Tempio in rovina', description: "Il recinto di un antico tempio: colonne, alcune crollate, gradini, un altare al centro, edera e muri spezzati", tiles: [16, 16, 2], blocks: 14, source: 'prova' },
];

/**
 * Structures unlike the hand-written examples (step 8E): to see whether the agents take the MarkovJunior
 * idioms (growth, contour, context, detail) and the commission somewhere new.
 */
export const STRUCTURE_TRIALS: StructureTarget[] = [
  { id: 'trial:borgo-lago', name: 'Borgo di pescatori', description: "Un villaggio di pescatori sulla riva di un lago: l'acqua occupa un lato della mappa, la riva è irregolare; case di legno su palafitte sopra l'acqua e case di pietra sulla terra, pontili di assi che entrano nel lago con barche ormeggiate, reti stese ad asciugare, un sentiero che corre lungo la riva", tiles: [24, 24, 2], blocks: 18, source: 'prova 8E' },
  { id: 'trial:monastero', name: 'Monastero', description: 'Un monastero di pietra chiara: un chiostro quadrato con il portico ad archi attorno a un giardino con un pozzo al centro, la chiesa con il campanile su un lato, il refettorio e le celle dei monaci sugli altri, un orto e un frutteto fuori, un muro basso con un portale tutto attorno', tiles: [20, 20, 3], blocks: 18, source: 'prova 8E' },
  { id: 'trial:miniera', name: 'Miniera abbandonata', description: 'Una miniera scavata nella roccia su due livelli: gallerie strette puntellate da travi di legno, binari con carrelli rovesciati, camere più ampie dove si estraeva il minerale con vene luccicanti nella roccia, un pozzo con una scala a pioli tra i livelli, crolli che chiudono alcune gallerie', tiles: [20, 20, 2], blocks: 14, source: 'prova 8E' },
  { id: 'trial:fortino', name: 'Fortino di confine', description: 'Un fortino di legno al confine: una palizzata di tronchi appuntiti con torri di guardia agli angoli, un portone di tronchi, dentro una caserma, una stalla con il recinto dei cavalli, un deposito, un pozzo e un pennone con la bandiera', tiles: [18, 18, 2], blocks: 14, source: 'prova 8E' },
];

export interface StructOptions {
  retries: number;
  examples: boolean;
  style?: string;
  seed: number;
  temperature?: number;
  /** Blocks written per call in the second phase. */
  batch: number;
}

export const DEFAULT_STRUCT: StructOptions = { retries: 2, examples: true, seed: 1, batch: 6 };

/** The language reference of the sculptor's prompt (patterns and nodes), shared by both agents. */
export function dslDoc(): string {
  const a = SCULPTOR.indexOf('## Pattern');
  const b = SCULPTOR.indexOf('## Come scolpire bene');
  const shape = `- shape: {"type":"shape","shape":"box","at":[x,y,z],"size":[larghezza,profondità,altezza],"color":"A","on":"."}
  una forma piena che poggia su "at" (il centro della sua base; per coprire da 0 a 19 usa at 9.5 e size 20):
  box, ellipsoid, cylinder, cone; oppure {"type":"shape","shape":"line","at":[…],"to":[…],"r":1,"color":"A"}.
  "on" limita i codici che può sovrascrivere ("." = solo l'aria); con "color":"." scava.`;
  return SCULPTOR.slice(a, b).replace('@@SHAPES@@', shape).replace('@@RULES_ONLY@@', '').trim();
}

/** A face read the other way round (each row reversed). */
const mirror = (f: Uint8Array) => {
  const out = new Uint8Array(f.length);
  for (let i = 0; i < f.length; i++) out[i] = f[Math.floor(i / TILE) * TILE + TILE - 1 - (i % TILE)];
  return out;
};

const fill = (s: string) => s.replaceAll('@@TILE@@', String(TILE)).replaceAll('@@LEVEL@@', String(LEVEL)).replaceAll('@@MAX@@', String(TILE - 1));

/** What the catalogue says, without the programs. */
const catalogueOf = (set: Blockset) => ({ name: set.name, faces: set.faces, open: set.open, blocks: set.blocks.map(({ program: _p, ...b }) => b) });

const CATALOGUE_TASK = `## Compito: il catalogo
Scrivi il catalogo dei blocchi, senza i loro programmi (quelli li scriverai dopo, pochi alla volta):
{ "name": "…", "faces": { "etichetta": "com'è fatta la faccia, in voxel" }, "open": ["…"],
  "blocks": [ { "code": "M", "name": "muro", "role": "muro", "walk": false,
               "sockets": { "n": "vuoto", "e": "muro", "s": "acqua", "w": "muro", "u": "vuoto" },
               "actions": [ { "label": "apri il portone", "to": "H" } ], "serves": ["W1", "W2"] } ] }
Ogni etichetta usata nelle prese (tranne "vuoto" e "*") ha la sua voce in "faces". Codici: lettere e cifre,
uno per blocco. Rispondi solo con il JSON.

Se c'è la commissione dell'Architetto, "serves" dice per quali configurazioni hai fatto il blocco: i loro
nomi ("W3") oppure il codice di una zona ("A": tutte le sue configurazioni). Ogni configurazione deve
avere almeno un blocco; in quella casella il kernel sceglierà solo fra i blocchi che la servono, girandoli
come vogliono le prese. Configurazioni con gli stessi quattro lati ma diagonali diverse (un angolo col
fossato fuori, un angolo fra due cortili) chiedono di solito blocchi diversi: guarda le diagonali.

Se più blocchi servono la stessa configurazione, il kernel sceglie fra loro a caso: "weight" (1 se manca) dice
quanto spesso. Un accento (una barca sull'acqua, un sasso sulla riva, un vaso di fiori) ha peso basso,
0.05-0.2: altrimenti metà del lago sarà barche.

Con la commissione puoi (e conviene) omettere "sockets" e "faces": il kernel ricava le prese dalla pianta,
per ogni configurazione che il blocco serve (fra due zone che si toccano c'è sempre la stessa etichetta), e
combaciano per costruzione. In cambio disegna ogni blocco orientato come la configurazione è scritta: n è
il lato y=0, e il lato x massimo, s il lato y massimo, o il lato x=0. Un blocco che serve più
configurazioni deve andare bene per tutte in quella orientazione (l'acqua, la roccia, un pavimento vanno
bene ovunque; un muro con il fossato a sud no: per un muro con il fossato altrove fai un altro blocco).
I lati verso un'altra zona devono continuare i voxel del blocco di quella zona: il kernel lo controlla.`;

const PROGRAMS_TASK = `## Compito: i programmi
Ti do il catalogo (con le facce) e i codici dei blocchi da scrivere ora. Per ognuno scrivi il programma
MarkovJunior del blocco (palette e nodo; la size [${TILE}, ${TILE}, ${LEVEL}] la mette il kernel), rispettando
le facce del catalogo su ogni lato: il kernel confronta i lati con quelli dei blocchi già accettati che
hanno la stessa etichetta. Rispondi solo con il JSON: { "programs": { "M": { "palette": { … }, "program": { … } } } }.

Il linguaggio dei programmi:
${'@@DSL@@'}`;

export function blocksSystem(phase: 'catalogo' | 'programmi', opts: StructOptions): string {
  let s = fill(BLOCKS).replace('@@TASK@@', phase === 'catalogo' ? CATALOGUE_TASK : PROGRAMS_TASK.replace('@@DSL@@', dslDoc()));
  if (opts.examples) {
    if (phase === 'catalogo') s += `\n\n## Esempio: il catalogo di una rocca (borgo fortificato con fossato)\n${JSON.stringify(catalogueOf(ROCCA))}\n`;
    else {
      const two = ROCCA.blocks.filter((b) => b.code === 'M' || b.code === 'L');
      s += `\n\n## Esempio: due programmi di quella rocca, il muro e l'albero (facce: ${JSON.stringify(ROCCA.faces)})\n${JSON.stringify({ programs: Object.fromEntries(two.map((b) => [b.code, { palette: b.program.palette, program: b.program.program }])) })}\n`;
    }
  }
  return s.trim();
}

export function blocksSummary(set: Blockset): string {
  const lines = set.blocks.map((b) => {
    const s = b.sockets;
    return `- ${b.code} «${b.name}» (${b.role ?? '—'}), ${b.walk ? 'calpestabile' : 'non calpestabile'}; n "${s.n}" e "${s.e}" s "${s.s}" w "${s.w}"${s.u ? ` sopra "${s.u}"` : ''}${s.d ? ` sotto "${s.d}"` : ''}${b.actions?.length ? `; azioni: ${b.actions.map((a) => `${a.label} → ${a.to}`).join(', ')}` : ''}`;
  });
  if (set.faces) lines.push(`Facce: ${Object.entries(set.faces).map(([k, v]) => `"${k}" ${v}`).join('; ')}`);
  lines.push(`Prese che possono guardare fuori: "vuoto"${(set.open ?? []).map((o) => `, "${o}"`).join('')}`);
  return lines.join('\n');
}

const PLAN_PHASE = `## Questa volta: la pianta, prima dei blocchi
I blocchi non esistono ancora: li farà lo Scultore dei blocchi su tua commissione. Scrivi la pianta con le
zone senza "blocks" e con "describe": a cosa serve la zona, in parole («tratti dritti di mura, cortile da un
lato e fossato dall'altro»). Il kernel esegue la pianta e ricava, zona per zona, le configurazioni che
servono (cosa c'è sui quattro lati, sulle diagonali, sopra e sotto): sono l'ordine per lo Scultore.
Perciò:
- distingui con zone diverse ciò che deve essere diverso (un angolo convesso, un angolo concavo, un
  incrocio di mura), con regole di contesto come negli esempi;
- dichiara in "open" i vuoti che non sono il fuori (cortili, strade dentro le mura, orti) e le prese che
  accettano: un cortile accetta "vuoto" e le facciate, mai l'acqua;
- tieni le configurazioni poche e chiare: pulisci la pianta da strozzature, buchi, nodi inutili.`;

/** The architect's instructions: the plan before any block (no set), or the composition with the blocks. */
export function architectSystem(set: Blockset | undefined, opts: StructOptions): string {
  let s = fill(ARCHITECT).replace('@@DSL@@', dslDoc()).replace('@@BLOCKS@@', set ? `I blocchi a disposizione (codice, nome, ruolo, calpestabile, prese n e s w, sopra e sotto, azioni), le facce e le prese aperte:\n${blocksSummary(set)}` : PLAN_PHASE);
  if (opts.examples)
    s += `\n\n## Esempi\nUna rocca (blocchi: A fossato, M muro, T torre, I torre d'angolo interno, U cima della torre, G portone, P ponte levatoio, K mastio, R falda a padiglione, X casa, F J N falde a due spioventi, L albero, O pozzo; materiali R pietra, A acqua, P intonaco…):\n${JSON.stringify(rocca([24, 24, 3]))}\n\nUna cripta su due livelli (blocchi: X roccia, O pavimento, P pilastro, A pozza, C scrigno, D porta, U scala, V arrivo della scala; materiali R roccia, F lastricato…):\n${JSON.stringify(cripta([20, 20, 2]))}\n`;
  return s.trim();
}

const describeStructure = (t: StructureTarget, style?: string) =>
  [
    `Struttura: ${t.name}`,
    `Descrizione: ${t.description}`,
    t.tiles && `Griglia della pianta: [${t.tiles.join(', ')}] (caselle in x, in y, livelli): usala tutta`,
    t.blocks && `Blocchi diversi da fare: circa ${t.blocks}`,
    style && `Guida di stile del mondo:\n${style.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');

export interface BlockAttempt {
  phase: 'catalogo' | 'programmi';
  raw: string;
  notes: string[];
  error?: string;
}

export interface BlocksResult {
  set: Blockset | null;
  report?: BlockReport;
  attempts: BlockAttempt[];
}

const socketsText = (b: Block) => ['n', 'e', 's', 'w', 'u', 'd'].map((k) => `${k} ${(b.sockets as Record<string, string | undefined>)[k] ?? '—'}`).join(', ');

/** Blocks that can never be part of a closed structure, as the sculptor should read it. */
const deadText = (set: Blockset, dead: Array<{ code: string; name: string }>) =>
  `questi blocchi non possono far parte di nessuna struttura chiusa, perché nessun altro blocco chiude le loro prese (mancano testate, angoli o raccordi verso prese aperte): ${dead.map((d) => `${d.code} «${d.name}» (${socketsText(set.blocks.find((b) => b.code === d.code)!)})`).join('; ')}`;

/** Checks a catalogue before any program is written (sockets only: the faces come with the programs). */
function checkCatalogue(cat: Blockset, wanted?: number): string[] {
  const errors: string[] = [];
  if (wanted && cat.blocks.length < wanted * 0.7) errors.push(`ne hai fatti ${cat.blocks.length}, ne servono circa ${wanted}: aggiungi varietà e i pezzi di raccordo`);
  const dead = unclosable(cat);
  if (dead.length) errors.push(deadText(cat, dead));
  const labels = new Set<string>();
  for (const b of cat.blocks) for (const k of [...SIDES, 'u', 'd'] as const) if (b.sockets[k]) labels.add(b.sockets[k]!);
  for (const l of labels) if (l !== 'vuoto' && l !== '*' && !cat.faces?.[l] && !['piano'].includes(l)) errors.push(`l'etichetta "${l}" non ha la sua faccia in "faces"`);
  return errors;
}

/** The faces a block shows on its four sides (in every turn: n e s w of rot 0 is enough, labels turn with it). */
function facesOf(b: Block, seed: number): { faces: Uint8Array[]; error?: string } {
  try {
    const r = run(b.program, seed);
    const vis = r.grid.alphabet.map((c) => !!b.program.palette[c]?.color && !b.program.palette[c]?.hidden);
    if (!r.finished) return { faces: [], error: 'il programma non termina' };
    if (!r.grid.cells.some((c) => vis[c]) && b.role !== 'vuoto') return { faces: [], error: 'il blocco è vuoto' };
    return { faces: SIDES.map((s) => profile(rotateGrid(r.grid, 0), vis, s)) };
  } catch (e) {
    return { faces: [], error: (e as Error).message };
  }
}

/** What the architect orders: its plan and the configurations the kernel read off it. */
export interface Order {
  layout: Layout;
  commission: Commission;
}

/** For the programs: the configurations each block serves, so that water, walls and courtyards go where they must. */
function servedText(set: Blockset, codes: string[], order: Order): string {
  const lines = codes.flatMap((code) => {
    const b = set.blocks.find((x) => x.code === code);
    const ks = order.commission.configs.filter((k) => b?.serves?.includes(k.sig) || b?.serves?.includes(k.zone)).slice(0, 4);
    return ks.length ? [`${code} serve: ${ks.map((k) => `${k.id} (${k.text})`).join('; ')}`] : [];
  });
  return lines.length ? `Per quali configurazioni li hai fatti (nella rotazione scritta; il kernel li gira):\n${lines.join('\n')}` : '';
}

export async function sculptBlocks(models: Models, t: StructureTarget, opts: StructOptions, previous?: { set: Blockset; problems: string[] }, order?: Order): Promise<BlocksResult> {
  const attempts: BlockAttempt[] = [];
  // Phase 1: the catalogue.
  const sysA = blocksSystem('catalogo', opts);
  let prompt = describeStructure(t, opts.style);
  if (order?.layout.materials) prompt += `\n\nI materiali della struttura, scelti dall'Architetto (usa queste lettere per questi materiali, con questi colori, in tutti i blocchi; per i dettagli di un blocco puoi aggiungere altre lettere):\n${JSON.stringify(order.layout.materials)}`;
  if (order) prompt += `\n\nLa commissione dell'Architetto (zone e configurazioni della sua pianta; per ogni configurazione i quattro lati n e s o, le diagonali, sopra e sotto):\n${commissionText(order.layout, order.commission)}`;
  if (previous) prompt += `\n\nIl catalogo precedente:\n${JSON.stringify(catalogueOf(previous.set))}\nDa migliorare: ${previous.problems.join('; ') || '—'}`;
  let cat: Blockset | null = null;
  let last: BlockAttempt | undefined;
  for (let i = 0; i <= opts.retries; i++) {
    // The whole catalogue goes back, mended (with the kernel's codes) when it could be read: a cut one loses blocks.
    const shown = cat ? JSON.stringify(catalogueOf(cat)) : last?.raw.slice(0, 20000);
    const p = i === 0 ? prompt : `${prompt}\n\nIl catalogo che hai scritto:\n${shown}\nNon va: ${last!.error}\nCorreggilo e rispondi con il catalogo completo.`;
    const raw = await models.text({ agent: 'Scultore dei blocchi', task: 'lab.catalog', system: sysA, prompt: p, temperature: opts.temperature ?? 0.6, data: { target: t, attempt: i } });
    const notes: string[] = [];
    let error: string | undefined;
    try {
      const j = parseJson<any>(raw);
      // A catalogue has no programs yet: each block gets an empty one, written in the next phase.
      for (const b of j?.blocks ?? []) b.program = { palette: {}, program: { type: 'sequence', children: [{ type: 'shape', shape: 'box', at: [9.5, 9.5, 0], size: [1, 1, 1], color: '.' }] } };
      cat = mendBlockset(j, notes, undefined, order?.commission);
      if (!cat) error = notes.join('; ') || 'nessun blocco comprensibile';
      else {
        const errs = checkCatalogue(cat, t.blocks);
        if (order) {
          const open = uncovered(order.layout, cat, order.commission);
          if (open.length) errs.push(`configurazioni senza nessun blocco che le serva: ${open.slice(0, 12).map((k) => `${k.id} (${k.text})`).join('; ')}${open.length > 12 ? ` e altre ${open.length - 12}` : ''}`);
        }
        if (errs.length) error = errs.join('; ');
      }
    } catch (e) {
      error = `JSON non valido: ${(e as Error).message}`;
    }
    last = { phase: 'catalogo', raw, notes: notes.filter((n) => !n.includes('programma')), ...(error ? { error } : {}) };
    attempts.push(last);
    if (!error) break;
  }
  if (!cat || last?.error) return { set: cat, attempts };

  // Phase 2: the programs, a few blocks at a time, each kept to the faces already accepted.
  const sysB = blocksSystem('programmi', opts);
  const accepted = new Map<string, Block>();
  const faceByLabel = new Map<string, Array<{ code: string; side: string; face: Uint8Array }>>();
  const codes = cat.blocks.map((b) => b.code);
  for (let k = 0; k < codes.length; k += opts.batch) {
    let todo = codes.slice(k, k + opts.batch);
    let lastB: BlockAttempt | undefined;
    for (let i = 0; i <= opts.retries && todo.length; i++) {
      const ref = [...accepted.values()].slice(-3).map((b) => [b.code, { palette: b.program.palette, program: b.program.program }]);
      const p = [
        `Catalogo:\n${JSON.stringify(catalogueOf(cat))}`,
        ref.length ? `Programmi già accettati (per riferimento, stesse facce):\n${JSON.stringify(Object.fromEntries(ref))}` : '',
        order ? servedText(cat, todo, order) : '',
        order?.layout.materials ? `Materiali della struttura (stesse lettere, stessi colori in tutti i blocchi): ${JSON.stringify(order.layout.materials)}` : '',
        `Scrivi ora i programmi dei blocchi: ${todo.join(' ')}`,
        i > 0 ? `Il tentativo precedente non va: ${lastB!.error}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      const raw = await models.text({ agent: 'Scultore dei blocchi', task: 'lab.programs', system: sysB, prompt: p, temperature: opts.temperature ?? 0.6, data: { target: t, codes: todo, attempt: i } });
      const notes: string[] = [];
      const errors: string[] = [];
      let programs: Record<string, unknown> = {};
      try {
        const j = parseJson<any>(raw);
        programs = j?.programs ?? j ?? {};
      } catch (e) {
        errors.push(`JSON non valido: ${(e as Error).message}`);
      }
      const still: string[] = [];
      for (const code of todo) {
        const base = cat.blocks.find((b) => b.code === code)!;
        const pn: string[] = [];
        const given = programs[code] ?? (base.alias ? programs[base.alias] : undefined);
        const program = given ? mendProgram({ ...(given as object), size: [TILE, TILE, LEVEL] }, pn) : null;
        notes.push(...pn.map((n) => `${code}: ${n}`));
        if (!program) {
          errors.push(`${code}: manca il programma`);
          still.push(code);
          continue;
        }
        // The structure's materials keep their colour in every block (the detail names them by letter).
        for (const [k, m] of Object.entries(order?.layout.materials ?? {})) if (program.palette[k] && !program.palette[k].hidden) program.palette[k] = { ...program.palette[k], name: m.name ?? program.palette[k].name, color: m.color };
        const b = { ...base, program };
        const { faces, error } = facesOf(b, opts.seed);
        if (error) {
          errors.push(`${code}: ${error}`);
          still.push(code);
          continue;
        }
        // Each side against the sides already accepted with the same label. Two faces touch mirrored, but an
        // asymmetric face (the flank of a roof slope) only ever meets its mirror image (the other flank): it
        // is enough that one of the two readings continues. Heights that differ are caught either way, and
        // the layout checks the faces that really touch.
        const bad: string[] = [];
        SIDES.forEach((side, si) => {
          const label = b.sockets[side];
          if (label === '*' || label === 'vuoto') return;
          for (const other of faceByLabel.get(label) ?? []) {
            const m = Math.max(faceMatch(faces[si], other.face, TILE), faceMatch(faces[si], mirror(other.face), TILE));
            if (m < 0.6) bad.push(`il lato ${side} ("${label}") si continua solo al ${Math.round(m * 100)}% con il lato ${other.side} di ${other.code}`);
          }
        });
        // The last attempt keeps what it has (the layout will show the seams).
        if (bad.length && i < opts.retries) {
          errors.push(`${code}: ${bad.slice(0, 3).join('; ')}`);
          still.push(code);
          continue;
        }
        accepted.set(code, b);
        SIDES.forEach((side, si) => {
          const label = b.sockets[side];
          if (label !== '*' && label !== 'vuoto') (faceByLabel.get(label) ?? faceByLabel.set(label, []).get(label)!).push({ code, side, face: faces[si] });
        });
      }
      lastB = { phase: 'programmi', raw, notes, ...(errors.length ? { error: errors.join('; ') } : {}) };
      attempts.push(lastB);
      todo = still;
    }
  }
  const blocks = cat.blocks.flatMap((b) => (accepted.has(b.code) ? [accepted.get(b.code)!] : []));
  // Actions towards blocks that did not make it are dropped.
  const have = new Set(blocks.map((b) => b.code));
  for (const b of blocks) if (b.actions) b.actions = b.actions.filter((a) => have.has(a.to));
  let set: Blockset = { ...cat, blocks };
  let report = buildBlocks(set, opts.seed);
  // Phase 3: with the real faces, blocks that still cannot close get the pieces they miss.
  let dead = unclosable(set, report.built);
  for (let round = 0; round < 2 && dead.length; round++) {
    const p = [
      `Catalogo con i blocchi scritti finora:\n${JSON.stringify(catalogueOf(set))}`,
      `Con le facce vere, ${deadText(set, dead)}.`,
      'Aggiungi i blocchi che mancano (con programma), oppure riscrivi interi i blocchi da correggere con lo stesso codice. Rispondi solo con il JSON: { "blocks": [ { "code", "name", "role", "walk", "sockets", "actions", "program": { "palette", "program" } } ] }.',
    ].join('\n\n');
    const raw = await models.text({ agent: 'Scultore dei blocchi', task: 'lab.complete', system: sysB, prompt: p, temperature: opts.temperature ?? 0.6, data: { target: t, dead, round } });
    const notes: string[] = [];
    let error: string | undefined;
    try {
      const add = mendBlockset(parseJson(raw), notes, set);
      if (!add) error = notes.join('; ') || 'nessun blocco comprensibile';
      else {
        const byCode = new Map(set.blocks.map((b) => [b.code, b]));
        for (const b of add.blocks) byCode.set(b.code, b);
        set = { ...set, blocks: [...byCode.values()] };
        report = buildBlocks(set, opts.seed);
        dead = unclosable(set, report.built);
        if (dead.length) error = deadText(set, dead);
      }
    } catch (e) {
      error = `JSON non valido: ${(e as Error).message}`;
    }
    attempts.push({ phase: 'programmi', raw, notes, ...(error ? { error } : {}) });
  }
  const missing = cat.blocks.filter((b) => !set.blocks.some((x) => x.code === b.code)).map((b) => b.code);
  if (missing.length) report.errors.push(`blocchi senza un programma valido: ${missing.join(' ')}`);
  if (dead.length) report.errors.push(deadText(set, dead));
  return { set, report, attempts };
}

export interface LayoutAttempt {
  raw: string;
  layout: Layout | null;
  notes: string[];
  error?: string;
}

export interface ComposeResult {
  layout: Layout | null;
  result?: LayoutResult;
  attempts: LayoutAttempt[];
}

export interface PlanResult {
  layout: Layout | null;
  commission?: Commission;
  attempts: LayoutAttempt[];
}

/** Nodes of the plan that did nothing with any of six seeds (the first already run). */
function neverUsed(l: Layout, first: string[]): string[] {
  // A node is named by what it is; the reason (after the dash) may change from seed to seed.
  const key = (u: string) => u.split(' — ')[0];
  let left = first;
  for (let seed = 2; seed <= 6 && left.length; seed++) {
    const u = new Set(planCells(l, seed).unused.map(key));
    left = left.filter((x) => u.has(key(x)));
  }
  return left;
}

/** Codes the detail program uses that nothing defines (zone codes, typically: the detail sees voxels). */
function detailUnknown(l: Layout): string[] {
  if (!l.detail) return [];
  const known = new Set([...Object.keys(l.materials ?? {}), ...Object.keys(l.paint ?? {}), ...Object.keys(l.detail.palette ?? {}), ...Object.keys(l.detail.unions ?? {}), '*', '.', '/', ' ', '[', ']']);
  const used = new Set<string>();
  const walk = (n: any) => {
    if (!n || typeof n !== 'object') return;
    for (const r of n.rules ?? []) for (const ch of `${r.in ?? ''}${r.out ?? ''}${r.neighbors ?? ''}`) used.add(ch);
    for (const k of ['from', 'to', 'on', 'color']) if (typeof n[k] === 'string') for (const ch of n[k]) used.add(ch);
    if (typeof n.color === 'string') used.add(n.color);
    for (const c of n.children ?? []) walk(c);
  };
  walk(l.detail.program);
  for (const v of Object.values(l.detail.unions ?? {})) for (const ch of v) used.add(ch);
  return [...used].filter((c) => !known.has(c));
}

/** The architect's plan, before any block: zones by purpose, kinds of empty cell; then the kernel's commission. */
export async function planStructure(models: Models, t: StructureTarget, opts: StructOptions, previous?: { layout: Layout; critique: string; image?: string; blocks?: Blockset }): Promise<PlanResult> {
  const system = architectSystem(undefined, opts);
  let prompt = `${describeStructure(t, opts.style)}\nScrivi la pianta: le zone senza blocchi, con "describe".`;
  // A round of improvement: the plan, what came of it (the image) and the artist's judgement.
  if (previous) {
    prompt += `\n\nLa tua pianta precedente:\n${JSON.stringify(previous.layout)}\n${previous.image ? "L'immagine mostra la struttura che ne è venuta, vista da sud.\n" : ''}Il giudizio dell'Artista: ${previous.critique}`;
    if (previous.blocks) prompt += `\nI blocchi già fatti (restano; per le configurazioni nuove lo Scultore ne farà altri):\n${blocksSummary(previous.blocks)}`;
    prompt += '\nRiscrivi la pianta completa, migliorata: tieni gli stessi codici per le zone che restano.';
  }
  const images = previous?.image ? [previous.image] : [];
  const attempts: LayoutAttempt[] = [];
  let layout: Layout | null = null;
  let order: Commission | undefined;
  for (let i = 0; i <= opts.retries; i++) {
    const last = attempts.at(-1);
    const p = i === 0 ? prompt : `${prompt}\n\nLa pianta che hai scritto:\n${last!.layout ? JSON.stringify(last!.layout) : last!.raw.slice(0, 6000)}\nNon va: ${last!.error}\nCorreggila e rispondi con la pianta completa.`;
    const raw = await models.text({ agent: 'Architetto', task: 'lab.plan', system, prompt: p, images, temperature: opts.temperature ?? 0.6, data: { target: t, attempt: i } });
    const notes: string[] = [];
    let error: string | undefined;
    layout = null;
    try {
      layout = mendLayout(parseJson(raw), undefined, notes);
      if (!layout) error = notes.join('; ') || 'pianta incomprensibile';
      else {
        order = commission(layout, opts.seed);
        const used = new Set(order.configs.map((k) => k.zone));
        const problems = [
          ...(order.finished ? [] : [`il programma della pianta non termina dopo ${order.steps} passi`]),
          ...detailUnknown(layout).map((c) => `il dettaglio usa "${c}", che non è un materiale (materials), un segno dipinto (paint) né un colore del dettaglio: il dettaglio lavora sui voxel, non sulle zone`),
          ...(layout.materials ? [] : ['mancano i "materials": la tavolozza dei materiali della struttura, che lo Scultore userà']),
          ...(order.configs.length ? [] : ['nessuna casella appartiene a una zona: la pianta non chiede niente']),
        ];
        // A zone that does not show up with this seed (a rare corner) is worth knowing, not a retry.
        notes.push(...Object.keys(layout.zones ?? {}).filter((z) => !used.has(z)).map((z) => `la zona ${z} non compare con questo seme`));
        // Nodes that never do anything waste the plan, they do not break it: a reason to retry, not to
        // stop the chain (on the last attempt they become notes).
        const idle = neverUsed(layout, order.unused).slice(0, 8).map((u) => `il nodo ${u} non ha mai trovato niente da riscrivere in 6 semi: correggilo (le celle che cerca esistono in quel momento? sono vicine così?), toglilo, o se serve solo per casi rari aggiungi "optional": true`);
        if (i < opts.retries) problems.push(...idle);
        else notes.push(...idle);
        if (problems.length) error = problems.join('; ');
      }
    } catch (e) {
      error = e instanceof SyntaxError ? `JSON non valido: ${e.message}` : (e as Error).message;
    }
    attempts.push({ raw, layout, notes, ...(error ? { error } : {}) });
    if (!error) break;
  }
  return { layout, ...(order ? { commission: order } : {}), attempts };
}

export async function compose(models: Models, t: StructureTarget, set: Blockset, report: BlockReport, opts: StructOptions, previous?: { layout: Layout; problems: string[]; views?: string }, planned?: Layout): Promise<ComposeResult> {
  const system = architectSystem(set, opts);
  const cat = catalogue(set, report.built);
  let prompt = `${describeStructure(t, opts.style)}\nIl kernel ha ricavato dai blocchi ${cat.K - 1} varianti.`;
  const images: string[] = [];
  if (previous) {
    prompt += `\n\nLa tua pianta precedente:\n${JSON.stringify(previous.layout)}\nDa migliorare: ${previous.problems.join('; ') || '—'}`;
    if (previous.views) {
      prompt += "\nL'immagine mostra la struttura che ne viene.";
      images.push(previous.views);
    }
    prompt += '\nRispondi con la pianta completa.';
  }
  const attempts: LayoutAttempt[] = [];
  let last: (LayoutAttempt & { result?: LayoutResult }) | undefined;
  // With a plan already written (and its blocks made to order), the first attempt is that plan, without a call.
  const first = planned ? 1 : 0;
  for (let i = 0; i <= opts.retries + first; i++) {
    if (planned && i === 0) {
      const notes: string[] = [];
      const result = runLayout(planned, set, opts.seed, report.built);
      const problems = [...(result.placements.length ? [] : ['la pianta non posa nessun blocco']), ...result.mismatches.slice(0, 12)];
      last = { raw: JSON.stringify(planned), layout: planned, notes, ...(problems.length ? { error: problems.join('; ') } : {}), result };
      const { result: _r, ...kept } = last;
      attempts.push(kept);
      if (!problems.length) break;
      continue;
    }
    const p = i === 0 ? prompt : `${prompt}\n\nLa pianta che hai scritto:\n${last!.layout ? JSON.stringify(last!.layout) : last!.raw.slice(0, 6000)}\nNon va: ${last!.error}\nCorreggila e rispondi con la pianta completa.`;
    const raw = await models.text({ agent: 'Architetto', task: 'lab.layout', system, prompt: p, images, temperature: opts.temperature ?? 0.6, data: { target: t, set, attempt: i } });
    const notes: string[] = [];
    let layout: Layout | null = null;
    let error: string | undefined;
    let result: LayoutResult | undefined;
    try {
      layout = mendLayout(parseJson(raw), set, notes);
      if (!layout) error = notes.join('; ') || 'pianta incomprensibile';
      else {
        result = runLayout(layout, set, opts.seed, report.built);
        const problems = [...(result.placements.length ? [] : ['la pianta non posa nessun blocco']), ...result.mismatches.slice(0, 12)];
        if (result.mismatches.length > 12) problems.push(`…e altre ${result.mismatches.length - 12} prese sbagliate`);
        if (problems.length) error = problems.join('; ');
      }
    } catch (e) {
      error = e instanceof SyntaxError ? `JSON non valido: ${e.message}` : (e as Error).message;
    }
    last = { raw, layout, notes, ...(error ? { error } : {}), result };
    const { result: _r, ...kept } = last;
    attempts.push(kept);
    if (!error) break;
  }
  return { layout: last!.layout, result: last!.result, attempts };
}

// ------------------------------------------------------------------ late orders and the whole chain

/**
 * Configurations the composition found without a block become a new order for the block sculptor: the
 * plan stays as the architect meant it, the vocabulary grows. Blocks rewritten with the same code replace
 * the old ones.
 */
export async function orderMissing(models: Models, t: StructureTarget, set: Blockset, order: Order, missing: Config[], opts: StructOptions): Promise<BlocksResult> {
  const sys = blocksSystem('programmi', opts);
  const attempts: BlockAttempt[] = [];
  let current = set;
  let report = buildBlocks(current, opts.seed);
  let todo = missing;
  for (let i = 0; i <= opts.retries && todo.length; i++) {
    const p = [
      `Catalogo con i blocchi che hai fatto:\n${JSON.stringify(catalogueOf(current))}`,
      `Componendo la pianta dell'Architetto, queste configurazioni sono rimaste senza un blocco che ci stia (lati, diagonali, sopra, sotto):\n${todo.map((k) => `${k.id} ×${k.count} (per esempio in ${k.at.join(',')}): ${k.text}`).join('\n')}`,
      i > 0 ? `Il tentativo precedente non basta: ${attempts.at(-1)?.error}` : '',
      'Aggiungi i blocchi che servono (con programma e con "serves": i nomi delle configurazioni), oppure riscrivi interi, con lo stesso codice, i blocchi da correggere. Le prese dei lati devono combaciare con i vicini della configurazione. Rispondi solo con il JSON: { "blocks": [ { "code", "name", "role", "walk", "sockets", "actions", "serves", "program": { "palette", "program" } } ] }.',
    ]
      .filter(Boolean)
      .join('\n\n');
    const raw = await models.text({ agent: 'Scultore dei blocchi', task: 'lab.order', system: sys, prompt: p, temperature: opts.temperature ?? 0.6, data: { target: t, missing: todo.map((k) => ({ id: k.id, zone: k.zone })), attempt: i } });
    const notes: string[] = [];
    let error: string | undefined;
    try {
      const add = mendBlockset(parseJson(raw), notes, current, order.commission);
      if (!add) error = notes.join('; ') || 'nessun blocco comprensibile';
      else {
        const byCode = new Map(current.blocks.map((b) => [b.code, b]));
        for (const b of add.blocks) byCode.set(b.code, b);
        current = { ...current, blocks: [...byCode.values()] };
        report = buildBlocks(current, opts.seed);
        if (report.errors.length) error = report.errors.join('; ');
        const r = runLayout(order.layout, current, opts.seed, report.built);
        todo = r.missing;
        if (todo.length) error = [error, `restano senza blocco: ${todo.map((k) => k.id).join(' ')}`].filter(Boolean).join('; ');
      }
    } catch (e) {
      error = `JSON non valido: ${(e as Error).message}`;
    }
    attempts.push({ phase: 'programmi', raw, notes, ...(error ? { error } : {}) });
  }
  return { set: current, report, attempts };
}

export interface BuildResult {
  plan: PlanResult;
  blocks?: BlocksResult;
  /** Late orders, one per round. */
  orders: BlocksResult[];
  /** The architect mending its plan, when the orders were not enough. */
  repair?: ComposeResult;
  set?: Blockset;
  report?: BlockReport;
  layout?: Layout;
  result?: LayoutResult;
  /** Text calls made. */
  calls: number;
}

/**
 * The whole chain: the architect's plan, the commission, the blocks made to order, the composition; if
 * configurations remain without a block, late orders to the sculptor (up to `rounds`); only then, if
 * something still does not hold, the architect mends its plan.
 */
export async function buildStructure(models: Models, t: StructureTarget, opts: StructOptions, say: (s: string) => void = () => {}, rounds = 2): Promise<BuildResult> {
  const plan = await planStructure(models, t, opts);
  const out: BuildResult = { plan, orders: [], calls: plan.attempts.length };
  if (!plan.layout || !plan.commission || plan.attempts.at(-1)?.error) {
    say(`pianta non valida dopo ${plan.attempts.length} tentativi: ${plan.attempts.at(-1)?.error ?? ''}`);
    return out;
  }
  say(`pianta ${plan.layout.size.join('×')}, ${plan.commission.configs.length} configurazioni commissionate`);
  const order: Order = { layout: plan.layout, commission: plan.commission };
  const b = await sculptBlocks(models, t, opts, undefined, order);
  out.blocks = b;
  out.calls += b.attempts.length;
  if (!b.set?.blocks.length || !b.report) {
    say(`nessun blocco valido dopo ${b.attempts.length} chiamate: ${b.attempts.at(-1)?.error ?? ''}`);
    return out;
  }
  say(`${b.set.blocks.length} blocchi in ${b.attempts.length} chiamate${b.report.errors.length ? ` (problemi: ${b.report.errors.join('; ').slice(0, 300)})` : ''}`);
  let set = b.set;
  let report = b.report;
  let result = runLayout(plan.layout, set, opts.seed, report.built);
  for (let round = 0; round < rounds && result.mismatches.length && result.missing.length; round++) {
    say(`composizione: ${result.missing.length} configurazioni senza blocco (${result.missing.map((k) => k.id).join(' ')}), ordine aggiuntivo allo Scultore`);
    const o = await orderMissing(models, t, set, order, result.missing, opts);
    out.orders.push(o);
    out.calls += o.attempts.length;
    if (o.set && o.report) {
      set = o.set;
      report = o.report;
      result = runLayout(plan.layout, set, opts.seed, report.built);
    }
  }
  let layout = plan.layout;
  if (result.mismatches.length) {
    say(`la pianta non si compone ancora (${result.mismatches[0].slice(0, 200)}): l'Architetto la ritocca`);
    const c = await compose(models, t, set, report, opts, { layout, problems: result.mismatches.slice(0, 12) });
    out.repair = c;
    out.calls += c.attempts.length;
    if (c.layout && c.result && c.result.mismatches.length <= result.mismatches.length) {
      layout = c.layout;
      result = c.result;
    }
  }
  say(`composta: ${result.placements.length} blocchi, ${result.mismatches.length ? `problemi: ${result.mismatches.slice(0, 2).join('; ').slice(0, 300)}` : 'nessun problema'}`);
  return { ...out, set, report, layout, result };
}

/**
 * A round of improvement after the artist: the architect rewrites its plan seeing the image and the
 * judgement; the blocks made so far stay, the configurations the new plan adds are ordered late.
 */
export async function improveStructure(models: Models, t: StructureTarget, opts: StructOptions, prev: BuildResult, critique: string, image: string, say: (s: string) => void = () => {}): Promise<BuildResult> {
  if (!prev.layout || !prev.set) return prev;
  const plan = await planStructure(models, t, opts, { layout: prev.layout, critique, image, blocks: prev.set });
  const out: BuildResult = { plan, orders: [], calls: plan.attempts.length };
  if (!plan.layout || !plan.commission || plan.attempts.at(-1)?.error) {
    say(`pianta migliorata non valida: ${plan.attempts.at(-1)?.error ?? ''}`);
    return { ...prev, calls: prev.calls + out.calls };
  }
  const order: Order = { layout: plan.layout, commission: plan.commission };
  let set = prev.set;
  let report = buildBlocks(set, opts.seed);
  let result = runLayout(plan.layout, set, opts.seed, report.built);
  // Configurations of the new plan that no block serves yet, or where none fits.
  const todo = () => [...new Map([...uncovered(plan.layout!, set, plan.commission!), ...result.missing].map((k) => [k.sig, k])).values()];
  for (let round = 0; round < 2 && todo().length; round++) {
    say(`pianta migliorata: ${todo().length} configurazioni da commissionare (${todo().slice(0, 8).map((k) => k.id).join(' ')})`);
    const o = await orderMissing(models, t, set, order, todo().slice(0, 12), opts);
    out.orders.push(o);
    out.calls += o.attempts.length;
    if (o.set && o.report) {
      set = o.set;
      report = o.report;
      result = runLayout(plan.layout, set, opts.seed, report.built);
    }
  }
  say(`pianta migliorata composta: ${result.placements.length} blocchi, ${result.mismatches.length ? `problemi: ${result.mismatches.slice(0, 2).join('; ').slice(0, 300)}` : 'nessun problema'}`);
  // The better of the two: the new one unless it composes worse.
  if (result.mismatches.length > (prev.result?.mismatches.length ?? Infinity)) return { ...prev, calls: prev.calls + out.calls };
  return { ...out, blocks: prev.blocks, set, report, layout: plan.layout, result, calls: prev.calls + out.calls };
}
