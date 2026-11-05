// Il compositore del Cantiere 3: dalle partiture descritte in brani.mjs ed effetti.mjs ai programmi MarkovJunior in XML.
// Non sceglie niente a caso: scrive regole; il caso lo sceglie il seme del programma, a ogni ascolto.
//
//   node lab/banco/suoni-cloud/componi.mjs [filtro]
//
// Le tracce di un brano (y): 0 melodia (lead), 1 armonia (pad), poi arpeggio, basso, batteria, controcanto, se ci sono.
// L'armonia cammina sulla traccia del basso, sotto un soffitto (W), di battuta in battuta; ogni radice (R) diventa un segno
// per il pad (X), per l'arpeggio (Z) e per il basso (Y), e ogni segno si apre in un disegno della battuta scelto dal seme.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRANI } from './brani.mjs';
import { EFFETTI } from './effetti.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- i disegni

/** "N024 S024*3 . KH" → per passo, le celle: [{o, c}]. N A S G con le quote (cifre), K H C O la batteria. */
export function cells(text) {
  const steps = [];
  for (const raw of text.trim().split(/\s+/)) {
    const [tok, times] = raw.includes('*') ? [raw.split('*')[0], Number(raw.split('*')[1])] : [raw, 1];
    for (let i = 0; i < times; i++) {
      const here = [];
      if (tok !== '.' && tok !== '-')
        for (const part of tok.split('+')) {
          const m = /^([NSAG])([0-9ab]+)$/.exec(part);
          if (m) for (const d of m[2]) here.push({ o: parseInt(d, 16), c: m[1] });
          else
            for (const ch of part) {
              if (ch === 'K') here.push({ o: 0, c: 'K' });
              else if (ch === 'H') here.push({ o: 1, c: 'H' });
              else if (ch === 'C') here.push({ o: 2, c: 'C' });
              else if (ch === 'O') here.push({ o: 4, c: 'H' });
              else throw new Error(`segno sconosciuto "${part}" in "${text}"`);
            }
        }
      steps.push(here);
    }
  }
  return steps;
}

/** Un disegno che parte da un segno: regola in/out su una traccia, il segno in basso a sinistra. */
export function voiceRule(marker, text, len, p = 1) {
  const steps = cells(text);
  if (steps.length !== len) throw new Error(`il disegno "${text}" ha ${steps.length} passi, non ${len}`);
  const top = Math.max(0, ...steps.flat().map((c) => c.o));
  const inL = [], outL = [];
  for (let o = top; o >= 0; o--) {
    let i = '', u = '';
    for (let x = 0; x < len; x++) {
      const c = steps[x].find((k) => k.o === o);
      if (x === 0 && o === 0) {
        i += marker;
        u += c ? c.c : 'B';
      } else {
        i += c ? 'B' : '*';
        u += c ? c.c : '*';
      }
    }
    inL.push(i);
    outL.push(u);
  }
  return `    <rule in="${inL.join(' ')}" out="${outL.join(' ')}"${p !== 1 ? ` p="${p}"` : ''}/>`;
}

/** Una testa che scrive una nota (o niente) lunga `len` e si sposta di `dz` gradi. */
function walkRule(head, kind, len, dz, p) {
  const h = Math.abs(dz) + 1;
  const layers = Array.from({ length: h }, () => ({ i: Array(len + 1).fill('*'), o: Array(len + 1).fill('*') }));
  // Indice dello strato: 0 è il più alto.
  const from = dz >= 0 ? h - 1 : 0;
  const to = dz >= 0 ? 0 : h - 1;
  layers[from].i[0] = head;
  for (let x = 1; x < len; x++) layers[from].i[x] = 'B';
  layers[to].i[len] = 'B';
  const note = kind === 'R' ? 'B' : kind;
  layers[from].o[0] = note;
  for (let x = 1; x < len; x++) layers[from].o[x] = kind === 'R' ? '*' : 'S';
  layers[to].o[len] = head;
  const s = (k) => layers.map((l) => l[k].join('')).join(' ');
  return `    <rule in="${s('i')}" out="${s('o')}"${p !== 1 ? ` p="${p}"` : ''}/>`;
}

// ---------------------------------------------------------------- un brano

const COLORS = {
  N: '<color symbol="N" value="38bdf8" name="Nota" glow="True"/>',
  S: '<color symbol="S" value="0284c7" name="Sustain" alpha="0.85"/>',
  A: '<color symbol="A" value="f43f5e" name="Accento" glow="True"/>',
  G: '<color symbol="G" value="818cf8" name="Ghost" alpha="0.7"/>',
  K: '<color symbol="K" value="fbbf24" name="Kick" glow="True"/>',
  H: '<color symbol="H" value="fde047" name="Hi-hat" alpha="0.85"/>',
  C: '<color symbol="C" value="fb923c" name="Rullante" glow="True"/>',
  M: '<color symbol="M" value="10b981" name="Testa della melodia" hidden="True"/>',
  Q: '<color symbol="Q" value="14b8a6" name="Testa del controcanto" hidden="True"/>',
  T: '<color symbol="T" value="ec4899" name="Testa degli accordi" hidden="True"/>',
  W: '<color symbol="W" value="334155" name="Soffitto degli accordi" hidden="True"/>',
  R: '<color symbol="R" value="a855f7" name="Radice" hidden="True"/>',
  X: '<color symbol="X" value="c084fc" name="Segno del pad" hidden="True"/>',
  Y: '<color symbol="Y" value="7c3aed" name="Segno del basso" hidden="True"/>',
  Z: '<color symbol="Z" value="e879f9" name="Segno dell\'arpeggio" hidden="True"/>',
  D: '<color symbol="D" value="475569" name="Battuta" hidden="True"/>',
};

function rows(Y, y, s) {
  // Una cella sulla traccia y, le altre tracce libere: righe da y a fine griglia non servono, basta una riga.
  return s;
}

export function brano(b) {
  const tracks = [];
  const y = {};
  const add = (k, instrument, volume) => {
    y[k] = tracks.length;
    tracks.push(`    <track y="${y[k]}" instrument="${instrument}" volume="${volume}"/>`);
  };
  add('lead', 'lead', b.vol.lead);
  add('pad', 'pad', b.vol.pad);
  if (b.arp) add('arp', b.arp.instrument ?? 'lead', b.vol.arp);
  add('bass', 'bass', b.vol.bass);
  if (b.drums) add('drums', 'bass', b.vol.drums);
  if (b.counter) add('counter', b.counter.instrument ?? 'lead', b.vol.counter);
  const Y = tracks.length;
  const [L, Z] = b.size;
  const H = b.harmony.bar;
  const ceil = b.harmony.ceiling;
  const o = [];
  o.push(`<!-- ${b.comment} -->`);
  o.push(`<sequence name="${b.name}" values="BNSAGKHCMQTWRXYZD" size="${L} ${Y} ${Z}" symmetry="()">`);
  o.push(`  <sound bpm="${b.bpm}" scale="${b.scale}" root="${b.root}" swing="${b.swing}" cutoff="${b.cutoff}" space="${b.space}">`);
  o.push(...tracks);
  o.push('  </sound>');
  for (const c of Object.values(COLORS)) o.push(`  ${c}`);
  o.push('');
  // Le teste.
  o.push('  <!-- Le teste, all\'inizio del ciclo; il soffitto tiene gli accordi nel registro grave. -->');
  o.push(`  <line at="0 ${y.lead} ${b.melody.start}" to="0 ${y.lead} ${b.melody.start}" r="0" color="M"/>`);
  if (b.counter) o.push(`  <line at="${b.counter.at ?? 0} ${y.counter} ${b.counter.start}" to="${b.counter.at ?? 0} ${y.counter} ${b.counter.start}" r="0" color="Q"/>`);
  o.push(`  <line at="0 ${y.bass} ${b.harmony.start}" to="0 ${y.bass} ${b.harmony.start}" r="0" color="T"/>`);
  for (let z = ceil; z < Z; z++) o.push(`  <line at="0 ${y.bass} ${z}" to="${L - 1} ${y.bass} ${z}" r="0" color="W"/>`);
  if (b.drums) for (let x = 0; x < L; x += b.drums.bar ?? 16) o.push(`  <line at="${x} ${y.drums} 0" to="${x} ${y.drums} 0" r="0" color="D"/>`);
  o.push('');
  // L'armonia.
  o.push(`  <!-- L'armonia: la testa cammina di ${H} in ${H} passi e lascia una radice; il seme sceglie il grado. -->`);
  o.push('  <one>');
  for (const [dz, p] of b.harmony.moves) {
    const h = Math.abs(dz) + 1;
    const layers = Array.from({ length: h }, () => ({ i: Array(H + 1).fill('*'), o: Array(H + 1).fill('*') }));
    const from = dz >= 0 ? h - 1 : 0, to = dz >= 0 ? 0 : h - 1;
    layers[from].i[0] = 'T';
    layers[to].i[H] = 'B';
    layers[from].o[0] = 'R';
    layers[to].o[H] = 'T';
    const s = (k) => layers.map((l) => l[k].join('')).join(' ');
    o.push(`    <rule in="${s('i')}" out="${s('o')}"${p !== 1 ? ` p="${p}"` : ''}/>`);
  }
  o.push('  </one>');
  o.push('  <all in="T" out="R"/>');
  o.push('  <all in="W" out="B"/>');
  // Ogni radice diventa i segni delle tracce che la seguono.
  const span = [];
  for (let t = y.pad; t <= y.bass; t++) span.push(t);
  const inRow = span.map((t) => (t === y.bass ? 'R' : t === y.pad || t === y.arp ? 'B' : '*')).join('/');
  const outRow = span.map((t) => (t === y.bass ? 'Y' : t === y.pad ? 'X' : t === y.arp ? 'Z' : '*')).join('/');
  o.push(`  <all in="${inRow}" out="${outRow}"/>`);
  o.push('');
  const block = (title, marker, patterns, len) => {
    o.push(`  <!-- ${title} -->`);
    o.push('  <one>');
    for (const [text, p] of patterns) o.push(voiceRule(marker, text, len, p));
    o.push('  </one>');
  };
  block('Il pad: un disegno per battuta.', 'X', b.pad, H);
  if (b.arp) block('L\'arpeggio sopra la radice.', 'Z', b.arp.patterns, H);
  block('Il basso sulla radice.', 'Y', b.bass, H);
  if (b.drums) block('La batteria: un disegno per battuta.', 'D', b.drums.patterns, b.drums.bar ?? 16);
  o.push('');
  const walker = (title, head, rules) => {
    o.push(`  <!-- ${title} -->`);
    o.push('  <one>');
    for (const [kind, len, dz, p] of rules) o.push(walkRule(head, kind, len, dz, p));
    o.push('  </one>');
    o.push(`  <all in="${head}" out="B"/>`);
  };
  walker('La melodia: una testa che va avanti nel tempo e sale o scende.', 'M', b.melody.rules);
  if (b.counter) walker('Il controcanto, più lento.', 'Q', b.counter.rules);
  if (b.melody.accents) {
    o.push(`  <one in="${['N', ...Array(Y - 1).fill('*')].join('/')}" out="${['A', ...Array(Y - 1).fill('*')].join('/')}" steps="${b.melody.accents}"/>`);
  }
  for (const k of 'XYZD') o.push(`  <all in="${k}" out="B"/>`);
  o.push('</sequence>');
  return `${o.join('\n')}\n`;
}

const filtro = process.argv[2] ?? '';
for (const b of BRANI) {
  if (!b.file.includes(filtro)) continue;
  const file = path.join(here, b.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, brano(b));
  console.log(b.file);
}
for (const e of EFFETTI) {
  if (!e.file.includes(filtro)) continue;
  const file = path.join(here, e.file.startsWith('suono-effetto-morte') ? '' : 'effetti', e.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, e.xml);
  console.log(path.relative(here, file));
}
