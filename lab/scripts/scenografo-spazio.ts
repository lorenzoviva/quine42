// The floor one walks inside a building, before and after the rescaling (T406): the same programs read at the bench's 20 voxels a tile
// (T303's measure) and at the game's 16 (T405, ADR-0209: the same voxels a quarter larger), storey by storey and room by room, and how many
// pieces of the seed's furniture (resampled to the density, as the Scenografo's way (c) has them) the kernel finds a place for when every
// room asks for six. No call.
//
//   npx vite-node lab/scripts/scenografo-spazio.ts -- [--solo villetta,fattoria] [--out lab/banco/scenografo/casa] [--senza-casa]
//
// The buildings: T303's empty ones (lab/banco/scenografo/misura/vuoto, written by Opus 5.5 with the prompt at 20) and T406's
// (lab/banco/scenografo/misura16/vuoto, the same Sculptor with the prompt at 16), read at 20 and at 16; then T413's (T413/vuoto/…/giro<n>,
// the prompt of the dwelling, ADR-0213), read at 16, with the kernel's check of a dwelling (`storeyFloors`, `dwellingErrors`): how many
// seeds pass. The parts are measured against the voxels of before at both densities (a room 28, a storey 30: PARTS read at 16, T405), so
// that 20 is T303's measure. --senza-casa leaves T413's out (T406's table, `--out lab/banco/scenografo/misura16`).
// → <out>/spazio.md, <out>/spazio.json.

import fs from 'node:fs';
import path from 'node:path';
import { habitableParts, walkIn } from '../../src/kernel/forms';
import { storeyFloors } from '../../src/kernel/interior';
import { dwellingErrors } from '../../src/mj/check';
import { DWELLING } from '../../src/mj/classes';
import { STRUCTURE_SEEDS } from '../../src/kernel/agents/sculptor';
import { partVoxels, STRUCTURE_VPT } from '../../src/mj/classes';
import type { Bersaglio } from '../banco/misure';
import { arredaDati, catalogo, piante, scena, type Mobile, type Scena } from '../banco/scenografo/scenografo';
import { MOBILI, stanzeDi } from '../banco/scenografo/misura';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const T406 = 'lab/banco/scenografo/misura16';
const T413 = 'lab/banco/scenografo/casa';
const CASA = !args.includes('--senza-casa');
const OUT = path.resolve(opt('out') ?? (CASA ? T413 : T406));
const EDIFICI = (opt('solo') ?? 'villetta,fattoria').split(',');
/** As the measure of the Scenografo reads the floors (T303): covered only, a storey of at least 2 tiles². */
const OPZIONI = { piccolo: 2, coperto: true };
/** How tall a wanderer is, in tiles (`core.player`): the heights are said in wanderers too. */
const VIANDANTE = 1.5;

interface Edificio {
  nome: string;
  chi: string;
  file: string;
  /** The densities it is read at: the bench's 20 and the game's (16). */
  densita: Array<{ etichetta: string; b: Partial<Bersaglio> }>;
  taglia: Bersaglio['taglia'];
}

const PRIMA_DOPO = [
  { etichetta: '20', b: {} },
  { etichetta: '16', b: { gioco: true } },
];
/** T413's rounds (the prompt of the dwelling), read at the game's density only. */
const giriCasa = CASA && fs.existsSync(path.join(T413, 'vuoto/claude-opus-5-5')) ? fs.readdirSync(path.join(T413, 'vuoto/claude-opus-5-5')).filter((g) => /^giro\d+$/.test(g)).sort() : [];
const edifici: Edificio[] = EDIFICI.flatMap((nome) => [
  { nome, chi: 'T303 (prompt a 20)', file: `lab/banco/scenografo/misura/vuoto/claude-opus-5-5/giro1/${nome}-large/programma.xml`, densita: CASA ? PRIMA_DOPO.slice(1) : PRIMA_DOPO, taglia: 'large' as const },
  { nome, chi: 'T406 (prompt a 16)', file: path.join(T406, 'vuoto/claude-opus-5-5/giro1', `${nome}-large/programma.xml`), densita: CASA ? PRIMA_DOPO.slice(1) : PRIMA_DOPO, taglia: 'large' as const },
  ...giriCasa.map((g) => ({ nome, chi: `T413 ${g} (abitazione)`, file: path.join(T413, 'vuoto/claude-opus-5-5', g, `${nome}-large/programma.xml`), densita: PRIMA_DOPO.slice(1), taglia: 'large' as const })),
]);

interface Piano {
  piano: number;
  /** Rooms, covered tiles² where a body's centre stands (all of them, the largest), the side of the largest square (kernel). */
  stanze: number;
  caselle: number;
  sala: number;
  lato?: number;
  soffitto?: number;
}

interface Riga {
  nome: string;
  chi: string;
  vpt: number;
  semi: Array<{ seme: number; piani: Piano[]; porte: string[]; mobili: number; ms: number; casa: string[] }>;
}

const n1 = (x: number) => x.toFixed(1).replace('.', ',');
const n2 = (x: number) => x.toFixed(2).replace('.', ',');
const mobiliPer = new Map<number, Map<string, Mobile>>();
const righe: Riga[] = [];

for (const ed of edifici) {
  if (!fs.existsSync(ed.file)) {
    console.log(`${ed.nome} ${ed.chi}: manca ${ed.file}`);
    continue;
  }
  const xml = fs.readFileSync(ed.file, 'utf8');
  for (const d of ed.densita) {
    const b: Bersaglio = { id: ed.nome, nome: ed.nome, stile: '', descrizione: '', classe: 'structure', taglia: ed.taglia, ...d.b };
    const semi: Riga['semi'] = [];
    let vpt = 0;
    for (const seme of Array.from({ length: STRUCTURE_SEEDS }, (_, i) => i + 1)) {
      const t0 = performance.now();
      const s: Scena = scena(xml, b, seme, OPZIONI);
      vpt = s.e.scatola.vpt;
      const parts = habitableParts(s.e.result.grid, s.e.model.program.palette, vpt, partVoxels(STRUCTURE_VPT).storey.clear, s.e.scatola.base, s.e.model.actions, seme);
      // The kernel's check of a dwelling (T413), on the walk of the game.
      const casa = dwellingErrors(storeyFloors(walkIn(s.e.result.grid, s.e.model.program.palette, vpt, s.e.scatola.base, s.e.model.actions, seme), vpt, s.e.scatola.base));
      const zs = piante(s).filter((p) => !p.cantina).map((p) => p.z);
      const rooms = stanzeDi(s);
      const piani: Piano[] = zs.map((z, piano) => {
        const mine = rooms.filter((r) => r.piano === piano);
        // The kernel's room of this storey: the one whose floor is nearest (its z is the floor's, the bench's the feet's).
        const part = parts.rooms.slice().sort((a, b2) => Math.abs(a.z - z) - Math.abs(b2.z - z))[0];
        const near = part && Math.abs(part.z - z) <= 2;
        return {
          piano,
          stanze: mine.length,
          caselle: mine.reduce((t, r) => t + r.caselle, 0),
          sala: Math.max(0, ...mine.map((r) => r.caselle)),
          ...(near ? { lato: part.room / vpt, soffitto: part.clear / vpt } : {}),
        };
      });
      if (!mobiliPer.has(vpt)) mobiliPer.set(vpt, catalogo(vpt, MOBILI));
      const mobili = mobiliPer.get(vpt)!;
      // Every room asks for six pieces of any furniture of the list: how many the kernel finds a place for, with its guard.
      const ogni = [...mobili.keys()];
      const a = arredaDati(s, 1, mobili, { per: () => ({ mobili: ogni, quanti: 6 }) });
      semi.push({ seme, piani, porte: parts.doors.map((p) => `${n2(p.width / vpt)} × ${n2(p.height / vpt)}`), mobili: a.pezzi, ms: Math.round(performance.now() - t0), casa });
    }
    righe.push({ nome: ed.nome, chi: ed.chi, vpt, semi });
    console.log(`${ed.nome} ${ed.chi} a ${vpt}: ${semi.map((x) => `seme ${x.seme} ${x.piani.map((p) => `p${p.piano} ${p.stanze} stanze ${n1(p.caselle)} c² (sala ${n1(p.sala)}${p.lato ? `, lato ${n2(p.lato)}` : ''})`).join(' · ')} · mobili ${x.mobili} · ${x.ms} ms`).join(' | ')}`);
  }
}

// ---------------------------------------------------------------- the table: the mean of the seeds, storey by storey

const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const lines = [
  '| edificio | scritto da | voxel per casella | piano | stanze | calpestabile (caselle²) | la sala (caselle²) | lato della stanza dello Scultore (caselle) | soffitto (caselle, viandanti) | porte (caselle) | mobili che entrano | abitazione: semi che passano |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
];
for (const r of righe) {
  const nPiani = Math.max(...r.semi.map((s) => s.piani.length));
  for (let p = 0; p < nPiani; p++) {
    const ps = r.semi.map((s) => s.piani[p]).filter((x): x is Piano => !!x);
    const lati = ps.map((x) => x.lato).filter((x): x is number => x !== undefined);
    const soff = ps.map((x) => x.soffitto).filter((x): x is number => x !== undefined);
    const porte = [...new Set(r.semi.flatMap((s) => s.porte))].join(', ') || '—';
    lines.push(`| ${r.nome} | ${r.chi} | ${r.vpt} | ${p}${ps.length < r.semi.length ? ` (${ps.length} semi su ${r.semi.length})` : ''} | ${n1(media(ps.map((x) => x.stanze)))} | ${n2(media(ps.map((x) => x.caselle)))} | ${n2(media(ps.map((x) => x.sala)))} | ${lati.length ? n2(media(lati)) : '—'} | ${soff.length ? `${n2(media(soff))}, ${n2(media(soff) / VIANDANTE)}` : '—'} | ${p === 0 ? porte : ''} | ${p === 0 ? n1(media(r.semi.map((s) => s.mobili))) : ''} | ${p === 0 ? `${r.semi.filter((s) => !s.casa.length).length} su ${r.semi.length}` : ''} |`);
  }
}
const md = `# Lo spazio calpestabile prima e dopo ${CASA ? 'il prompt della casa (T413)' : 'il riscalamento (T406)'}

Gli stessi programmi letti a 20 voxel per casella (il banco di T303) e a 16 (il gioco da T405, ADR-0209): i voxel sono gli stessi, un quarto
più grandi. «Calpestabile» è il pavimento coperto dove sta il centro di un corpo (il viandante, 0,44 caselle), tagliato nei passaggi stretti
(\`stanzeDi\` della misura dello Scenografo), in caselle²; «la sala» è la stanza più grande del piano; il lato è il quadrato più grande del
kernel (\`habitableParts\`), la misura dello Scultore (almeno 28 voxel). «Mobili che entrano»: ogni stanza chiede 6 pezzi fra i 10 mobili del
seme ricampionati alla densità, e il kernel li posa contro i muri con la sua guardia (\`arredaDati\`). Media dei ${STRUCTURE_SEEDS} semi dell'edificio.${
  CASA
    ? `
«Abitazione»: i semi su cui il controllo del kernel (\`storeyFloors\`, \`dwellingErrors\`, ADR-0213) passa: almeno ${DWELLING.floor} caselle² al piano
terra e a un altro piano, il piano terra in ${DWELLING.groundRooms} stanze di ${String(DWELLING.room).replace('.', ',')} caselle² o più. T303 e T406 sono le case di prima, lette alla
densità del gioco; T413 quelle scritte dallo stesso Scultore col prompt dell'abitazione.`
    : ''
}

${lines.join('\n')}
`;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'spazio.md'), md);
fs.writeFileSync(path.join(OUT, 'spazio.json'), JSON.stringify(righe, null, 1));
console.log(`\n${md}`);
