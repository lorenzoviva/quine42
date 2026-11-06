// The SoundLab (/lab/suono/, T222): write, hear, correct and save a sound program, by hand, in the browser. It does what the mockup of docs/userchats did, on the
// real engine: the program is XML and the only source of sound is the synthesizer of src/mj/synth.ts, in a worker. The page has no voices: it plays those samples.
// Whatever can be saved is in the program's text: the knobs write into <sound>, the piano roll writes <box> nodes (lab/suono/logic.ts).

import indexJson from '../../universe/models/index.json';
import { AIR, type PaletteEntry } from '../../src/mj/engine';
import { pitchOf, SCALES, soundPrograms, type Instrument, type SoundSettings, type SoundTrack } from '../../src/mj/sound';
import { escapeHtml, highlightXml } from '../editor/syntax';
import { brushFor, leadComment, letterAt, levels, noteName, paintCell, retouchCount, rollCell, ROLL, seedNote, setSoundAttr, setTrackVolume, stepSlice, wavBytes, withSeedNote, type GridData } from './logic';
import { LoopPlayer } from './player';
import { VoxelView, type VoxelStyle } from './voxels';
import type { RunReply, SoundReply, SoundRequest } from './worker';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const DRAFT_KEY = 'quine.soundlab.bozza';
/** A program that keeps the worker this long does not end: it goes back to whoever wrote it. */
const RUN_PATIENCE_MS = 8000;
const DEBOUNCE_MS = 350;
const MORPH_MS = 220;
const SEED_DEFAULT = 421337;
/** The letters that sound (src/mj/sound.ts), with the name a brush has if the program gives none. */
const SOUNDING: Record<string, { name: string; color: string }> = {
  N: { name: 'Nota', color: '#38bdf8' },
  S: { name: 'Sustain', color: '#0284c7' },
  A: { name: 'Accento', color: '#f43f5e' },
  G: { name: 'Ghost', color: '#818cf8' },
  K: { name: 'Cassa', color: '#fbbf24' },
  H: { name: 'Hi-hat', color: '#fde047' },
  C: { name: 'Rullante', color: '#fb923c' },
};
const TRACK_COLOR: Record<Instrument, string> = { lead: '#38bdf8', pad: '#e879f9', bass: '#fbbf24' };
const TRACK_TINT: Record<Instrument, { note: string; held: string }> = { lead: { note: '#38bdf8', held: '#0284c7' }, pad: { note: '#e879f9', held: '#a21caf' }, bass: { note: '#fbbf24', held: '#d97706' } };
const SCALE_NAMES: Record<string, string> = { pentatonic_minor: 'Pentatonica minore', dorian: 'Dorica', harmonic_minor: 'Minore armonica', phrygian: 'Frigia', hirajoshi: 'Hirajoshi' };

const files = import.meta.glob('../../universe/models/suono-*.xml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const presets = soundPrograms({
  'models/index.json': JSON.stringify(indexJson),
  ...Object.fromEntries(Object.entries(files).map(([k, v]) => [`models/${k.split('/').pop()}`, v])),
});

// ---- state ----

type Sound = Extract<SoundReply, { kind: 'render' }>;

const player = new LoopPlayer();
const voxels = new VoxelView($('voxels'));
let xml = '';
let seed = SEED_DEFAULT;
let fileName = 'suono-nuovo.xml';
/** The text of the last save or load: what is on disk. */
let savedText = '';
let settings: SoundSettings | undefined;
let palette: Record<string, PaletteEntry> = {};
/** The last state of the run, with what the roll painted on it. */
let finalGrid: GridData | undefined;
let shots: RunReply['shots'] = [];
let shot = 0;
const muted = new Set<number>();
let layer: number | undefined;
let brush = 'N';
let showMarkers = true;
let sound: Sound | undefined;
let playWanted = false;
let cursor = 0;
let morphTimer: ReturnType<typeof setInterval> | undefined;
const undoStack: string[] = [];

// ---- the two workers ----

const newWorker = () => {
  const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  w.onmessage = (ev: MessageEvent<SoundReply>) => onReply(ev.data);
  return w;
};
let programs = newWorker();
const renders = newWorker();
let nextId = 1;
let lastRun = 0;
let lastEdit = 0;
let killTimer: ReturnType<typeof setTimeout> | undefined;
let asked = 0;
let rendering = false;
let renderAgain = false;
const settled: Array<() => void> = [];

function askPrograms(q: SoundRequest): void {
  asked++;
  clearTimeout(killTimer);
  killTimer = setTimeout(() => {
    programs.terminate();
    programs = newWorker();
    asked = 0;
    retouching = false;
    showError(`Dopo ${RUN_PATIENCE_MS / 1000} s il programma non ha finito: fermato. Si sente ancora ciò che c'era.`);
  }, RUN_PATIENCE_MS);
  programs.postMessage(q);
}

function runProgram(): void {
  lastRun = nextId++;
  stopMorph();
  askPrograms({ kind: 'run', id: lastRun, xml, seed });
}

function onReply(r: SoundReply): void {
  if (r.kind === 'render') return onRender(r);
  if (r.kind === 'audition') return player.shot(r);
  if (--asked <= 0) clearTimeout(killTimer);
  if (r.kind === 'run') {
    if (r.id !== lastRun) return;
    if (r.ok) onRun(r);
    else showError(r.error, r.line);
  } else if (r.kind === 'retouch') onRetouch(r.id, r.result);
  else if (r.grid) {
    finalGrid = r.grid;
    shot = shots.length - 1;
    gridChanged();
    writeRetouches();
    toast('Le regole sono girate sulla griglia');
  } else if (r.error) showError(r.error);
}

function onRun(r: RunReply): void {
  // A stroke still on its way wins: this grid is older than the one on the screen.
  if (!retouching && !strokePending) finalGrid = r.grid;
  shots = r.shots;
  shot = shots.length - 1;
  palette = r.palette;
  settings = r.settings;
  const slider = $<HTMLInputElement>('shot');
  slider.max = String(Math.max(0, shot));
  slider.value = String(shot);
  $('dims').textContent = `${r.grid.X}×${r.grid.Y}×${r.grid.Z}`;
  if (!settings) showError('Non è un programma sonoro: manca <sound>. Finché non c\'è, non suona.');
  else setStatus(r.finished ? 'finito' : 'al tetto dei passi', r.finished ? 'ok' : 'warn');
  markLine();
  const count = retouchCount(xml);
  $('retouch').classList.remove('warn');
  $('retouch').textContent = count ? `Ritocchi in fondo al programma: ${count}. Si salvano, e stanno sopra a ciò che le regole scrivono con ogni seme.` : '';
  diagnose(r);
  syncKnobs();
  buildTracks();
  buildBrushes();
  buildLayers();
  gridChanged(true);
}

// ---- sound: the newest wins, one render at a time ----

const activeGrid = (): GridData | undefined => {
  if (!finalGrid) return undefined;
  if (shot >= shots.length - 1) return finalGrid;
  const s = shots[shot];
  return { X: s.X, Y: s.Y, Z: s.Z, cells: s.cells, alphabet: finalGrid.alphabet };
};

const listening = (): SoundSettings | undefined => settings && { ...settings, tracks: settings.tracks.map((t) => (muted.has(t.y) ? { ...t, volume: 0 } : t)) };

function requestRender(): void {
  const g = activeGrid();
  const s = listening();
  if (!g || !s) return;
  if (rendering) {
    renderAgain = true;
    return;
  }
  rendering = true;
  renders.postMessage({ kind: 'render', id: nextId++, grid: { ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet] }, settings: s, seed } satisfies SoundRequest);
}

function onRender(r: Sound): void {
  rendering = false;
  sound = r;
  if (playWanted) player.play(r);
  diagnoseSound();
  if (renderAgain) {
    renderAgain = false;
    requestRender();
  } else settled.splice(0).forEach((f) => f());
}

/** After every render asked for has arrived: what is then heard, saved or exported is what the controls say. */
const whenSettled = () => new Promise<void>((done) => (rendering ? settled.push(done) : done()));

function audition(c: { x: number; y: number; z: number }, letter: string): void {
  const g = finalGrid;
  const s = listening();
  if (!g || !s) return;
  const one: GridData = { X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells.length), alphabet: [...g.alphabet] };
  paintCell(one, c, letter);
  player.unlock();
  renders.postMessage({ kind: 'audition', id: nextId++, grid: one, settings: s, seed } satisfies SoundRequest);
}

function togglePlay(): void {
  playWanted = !playWanted;
  const b = $('play');
  b.textContent = playWanted ? '⏸ Ferma' : '▶ Suona';
  b.classList.toggle('on', playWanted);
  if (!playWanted) return player.stop();
  player.unlock();
  if (sound) player.play(sound);
}

function stepOnce(): void {
  if (!sound || !finalGrid) return;
  if (playWanted) togglePlay();
  const g = activeGrid()!;
  cursor = (cursor + 1) % g.X;
  const { from, to } = stepSlice(sound, cursor, sound.steps);
  player.shot(sound, from, to);
  rollDirty = true;
}

// ---- the program's text ----

function setText(next: string): void {
  xml = next;
  const area = $<HTMLTextAreaElement>('xml');
  if (area.value !== next) {
    const { scrollTop, scrollLeft } = area;
    area.value = next;
    area.scrollTop = scrollTop;
    area.scrollLeft = scrollLeft;
  }
  paintCode();
  $('dirty').hidden = next === savedText;
  $<HTMLButtonElement>('undo').disabled = !undoStack.length;
  $('desc').textContent = leadComment(next);
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ xml: next, seed, fileName, savedText }));
  } catch {
    /* no storage: the draft stays in the page */
  }
}

const remember = () => {
  if (undoStack[undoStack.length - 1] !== xml) undoStack.push(xml);
  if (undoStack.length > 100) undoStack.shift();
  $<HTMLButtonElement>('undo').disabled = false;
};

/** A program from outside: from a preset or from a file. */
function loadProgram(text: string, name: string): void {
  if (xml) remember();
  fileName = name;
  $('file-name').textContent = name;
  savedText = text;
  const s = seedNote(text);
  if (s !== undefined) setSeed(s);
  finalGrid = undefined;
  setText(text);
  runProgram();
}

function setSeed(s: number): void {
  seed = s;
  $<HTMLInputElement>('seed').value = String(s);
}

let errorLine = 0;

function paintCode(): void {
  $('highlight-code').innerHTML = `${highlightXml(xml)}\n`;
  const lines = xml.split('\n').length;
  $('gutter').innerHTML = Array.from({ length: lines }, (_, i) => `<div${i + 1 === errorLine ? ' class="bad"' : ''}>${i + 1}</div>`).join('');
  syncScroll();
}

function syncScroll(): void {
  const a = $('xml');
  $('highlight').scrollTop = a.scrollTop;
  $('highlight').scrollLeft = a.scrollLeft;
  $('gutter').scrollTop = a.scrollTop;
}

function markLine(line = 0): void {
  if (errorLine !== line) {
    errorLine = line;
    paintCode();
  }
}

// ---- the piano roll writes into the program ----

/** A stroke waits for the worker's answer; meanwhile newer strokes pile up in the grid. */
let retouching = false;
let strokePending = false;
let retouchFrom = '';

function writeRetouches(): void {
  if (!finalGrid) return;
  if (retouching) {
    strokePending = true;
    return;
  }
  retouching = true;
  strokePending = false;
  lastEdit = nextId++;
  retouchFrom = xml;
  askPrograms({ kind: 'retouch', id: lastEdit, xml, seed, grid: { ...finalGrid, cells: new Uint8Array(finalGrid.cells), alphabet: [...finalGrid.alphabet] } });
}

function onRetouch(id: number, r: Extract<SoundReply, { kind: 'retouch' }>['result']): void {
  retouching = false;
  if (id !== lastEdit) return;
  const note = $('retouch');
  // Typed over while the worker was at it: the text wins, and the next run says what it gives.
  if (xml !== retouchFrom) return;
  if (r.ok) setText(r.xml);
  else {
    note.classList.add('warn');
    note.textContent = `⚠ Non si può scrivere nel programma: ${r.why}. Si sente, ma il file non lo dirà: «Rigenera» la perde.`;
  }
  if (strokePending) writeRetouches();
  else if (r.ok) runProgram();
}

// ---- drawing ----

function styleOf(letter: string, y: number): VoxelStyle | undefined {
  const e = palette[letter];
  if (!SOUNDING[letter]) return showMarkers ? { color: e?.color ?? '#94a3b8', hidden: true, alpha: 0.45 } : undefined;
  let color = e?.color ?? SOUNDING[letter].color;
  const tint = settings?.tracks.find((t) => t.y === y);
  if (tint && 'NSG'.includes(letter)) color = letter === 'S' ? TRACK_TINT[tint.instrument].held : TRACK_TINT[tint.instrument].note;
  return { color, hidden: false, alpha: e?.alpha ?? 0.95 };
}

let rollDirty = true;

function gridChanged(fresh = false): void {
  const g = activeGrid();
  if (!g) return;
  voxels.show(g, styleOf, layer, !fresh || shot > 0);
  const note = $('voxel-note');
  note.textContent = voxels.cut ? `${voxels.cut} voxel non disegnati` : '';
  const s = shots[shot];
  $('shot-label').textContent = shot >= shots.length - 1 ? `Finale · passo ${s?.step ?? 0}` : `${shot}/${shots.length - 1} · passo ${s?.step ?? 0}`;
  $<HTMLInputElement>('shot').value = String(shot);
  rollDirty = true;
  requestRender();
}

function drawRoll(step: number): void {
  const g = activeGrid();
  const c = $<HTMLCanvasElement>('roll');
  if (!g) return;
  const dpr = window.devicePixelRatio || 1;
  const cw = c.clientWidth, ch = c.clientHeight;
  if (c.width !== Math.floor(cw * dpr) || c.height !== Math.floor(ch * dpr)) {
    c.width = Math.floor(cw * dpr);
    c.height = Math.floor(ch * dpr);
  }
  const x2d = c.getContext('2d')!;
  x2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  x2d.fillStyle = '#07090e';
  x2d.fillRect(0, 0, cw, ch);
  const gw = cw - ROLL.left - ROLL.right, gh = ch - ROLL.top - ROLL.bottom;
  const cellW = gw / g.X, cellH = gh / g.Z;
  const seeTrack = settings?.tracks.find((t) => t.y === (layer ?? 0)) ?? settings?.tracks[0];
  x2d.font = '10px ui-monospace, Consolas, monospace';
  for (let z = 0; z < g.Z; z++) {
    const py = ROLL.top + (g.Z - 1 - z) * cellH;
    x2d.fillStyle = z % 2 ? '#090c14' : '#0c101a';
    x2d.fillRect(ROLL.left, py, gw, cellH);
    if (cellH >= 9 && settings && seeTrack) {
      x2d.fillStyle = z === 0 ? '#fbbf24' : '#64748b';
      x2d.textAlign = 'right';
      x2d.fillText(noteName(pitchOf(z, settings, seeTrack.instrument)), ROLL.left - 5, py + cellH * 0.65);
    }
  }
  const labelEvery = cellW >= 14 ? 1 : cellW >= 7 ? 2 : 4;
  for (let x = 0; x <= g.X; x++) {
    const px = ROLL.left + x * cellW;
    if (x === step) {
      x2d.fillStyle = 'rgba(56, 189, 248, 0.16)';
      x2d.fillRect(px, ROLL.top, cellW, gh);
    }
    x2d.strokeStyle = x % 4 ? '#141b29' : '#2c3850';
    x2d.beginPath();
    x2d.moveTo(px, ROLL.top);
    x2d.lineTo(px, ROLL.top + gh);
    x2d.stroke();
    if (x < g.X && x % labelEvery === 0) {
      x2d.fillStyle = x === step ? '#38bdf8' : x % 4 ? '#475569' : '#94a3b8';
      x2d.textAlign = 'center';
      x2d.fillText(String(x), px + cellW / 2, ch - 6);
    }
  }
  const bands = layer === undefined ? g.Y : 1;
  for (let y = 0; y < g.Y; y++) {
    if (layer !== undefined && layer !== y) continue;
    const band = layer === undefined ? y : 0;
    for (let z = 0; z < g.Z; z++)
      for (let x = 0; x < g.X; x++) {
        const letter = letterAt(g, x, y, z);
        if (letter === AIR) continue;
        const s = styleOf(letter, y);
        if (!s) continue;
        const h = cellH / bands;
        const px = ROLL.left + x * cellW;
        const py = ROLL.top + (g.Z - 1 - z) * cellH + band * h;
        x2d.globalAlpha = x === step ? 1 : s.alpha;
        x2d.fillStyle = s.color;
        x2d.fillRect(px + (letter === 'S' ? 0 : 1), py + 0.5, Math.max(1, cellW - (letter === 'S' ? 0 : 2)), Math.max(1, h - 1));
        if (h >= 11 && cellW >= 9) {
          x2d.globalAlpha = 1;
          x2d.fillStyle = '#090b10';
          x2d.textAlign = 'center';
          x2d.fillText(letter, px + cellW / 2, py + h * 0.78);
        }
        x2d.globalAlpha = 1;
      }
  }
}

function drawScope(): void {
  const c = $<HTMLCanvasElement>('scope');
  const w = (c.width = c.clientWidth), h = (c.height = c.clientHeight);
  const x2d = c.getContext('2d')!;
  const a = player.analyser;
  x2d.strokeStyle = a ? '#38bdf8' : '#1e293b';
  x2d.beginPath();
  if (!a) {
    x2d.moveTo(0, h / 2);
    x2d.lineTo(w, h / 2);
  } else {
    const data = new Float32Array(a.fftSize);
    a.getFloatTimeDomainData(data);
    for (let i = 0; i < data.length; i++) {
      const px = (i / data.length) * w, py = ((1 - data[i]) / 2) * h;
      if (i) x2d.lineTo(px, py);
      else x2d.moveTo(px, py);
    }
  }
  x2d.stroke();
}

let lastStep = -1;

function frame(): void {
  const g = activeGrid();
  const step = !g ? -1 : playWanted && player.playing ? Math.min(g.X - 1, Math.floor(player.phase * g.X)) : cursor;
  if (rollDirty || step !== lastStep) {
    drawRoll(step);
    voxels.paint(step);
    rollDirty = false;
    lastStep = step;
  }
  voxels.frame();
  drawScope();
  requestAnimationFrame(frame);
}

// ---- controls ----

const fmtHz = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v} Hz`);

function syncKnobs(): void {
  if (!settings) return;
  const set = (id: string, v: number, text: string) => {
    $<HTMLInputElement>(id).value = String(v);
    $(`${id}-v`).textContent = text;
  };
  set('bpm', settings.bpm, String(settings.bpm));
  set('swing', Math.round(settings.swing * 100), `${Math.round(settings.swing * 100)}%`);
  set('cutoff', settings.cutoff, fmtHz(settings.cutoff));
  set('space', Math.round(settings.space * 100), `${Math.round(settings.space * 100)}%`);
  $<HTMLSelectElement>('scale').value = settings.scale;
  const root = $<HTMLSelectElement>('root');
  if (![...root.options].some((o) => Number(o.value) === settings!.root)) root.add(new Option(noteName(settings.root), String(settings.root)));
  root.value = String(settings.root);
}

/** A knob: into the text at once, heard as soon as the render is ready. The grid does not depend on it, so the program does not run again. */
function knob(id: 'bpm' | 'swing' | 'cutoff' | 'space', apply: (s: SoundSettings, v: number) => void, attr: (v: number) => number, text: (v: number) => string): void {
  const el = $<HTMLInputElement>(id);
  let holding = false;
  el.addEventListener('input', () => {
    if (!settings) return;
    if (!holding) remember();
    holding = true;
    const v = attr(Number(el.value));
    apply(settings, v);
    $(`${id}-v`).textContent = text(Number(el.value));
    setText(setSoundAttr(xml, id, v));
    requestRender();
  });
  el.addEventListener('change', () => (holding = false));
}

function buildTracks(): void {
  const box = $('tracks');
  box.innerHTML = '';
  for (const t of settings?.tracks ?? []) box.append(trackRow(t));
}

function trackRow(t: SoundTrack): HTMLElement {
  const row = document.createElement('div');
  row.className = 'track';
  row.innerHTML = `<span class="dot" style="background:${TRACK_COLOR[t.instrument]}"></span><span>Y=${t.y} · ${t.instrument} <small class="vol"></small></span><button></button><input type="range" min="0" max="100" step="1" aria-label="volume di ${t.instrument}"/>`;
  const btn = row.querySelector('button')!;
  const slider = row.querySelector('input')!;
  const vol = row.querySelector<HTMLElement>('.vol')!;
  const paint = () => {
    btn.textContent = muted.has(t.y) ? 'MUTO' : 'ON';
    btn.classList.toggle('muted', muted.has(t.y));
    vol.textContent = `${Math.round(t.volume * 100)}%`;
    slider.value = String(Math.round(t.volume * 100));
  };
  paint();
  btn.addEventListener('click', () => {
    if (muted.has(t.y)) muted.delete(t.y);
    else muted.add(t.y);
    paint();
    requestRender();
  });
  let holding = false;
  slider.addEventListener('input', () => {
    if (!holding) remember();
    holding = true;
    t.volume = Number(slider.value) / 100;
    vol.textContent = `${slider.value}%`;
    setText(setTrackVolume(xml, t.y, t.volume, settings!.tracks));
    requestRender();
  });
  slider.addEventListener('change', () => (holding = false));
  return row;
}

function buildBrushes(): void {
  const box = $('brushes');
  box.innerHTML = '';
  const others = Object.keys(palette).filter((k) => !SOUNDING[k]);
  for (const letter of [AIR, ...Object.keys(SOUNDING), ...others]) {
    const known = letter === AIR || letter in palette;
    const b = document.createElement('button');
    const color = letter === AIR ? '#334155' : (palette[letter]?.color ?? SOUNDING[letter]?.color ?? '#64748b');
    const name = letter === AIR ? 'Vuoto' : (palette[letter]?.name ?? SOUNDING[letter]?.name ?? letter);
    b.innerHTML = `<b style="background:${color}">${escapeHtml(letter)}</b>${escapeHtml(name)}`;
    b.disabled = !known;
    b.title = known ? (SOUNDING[letter] || letter === AIR ? '' : 'Lettera muta: un seme per le regole') : `"${letter}" non è tra i values del programma: aggiungila lì per dipingerla`;
    b.classList.toggle('on', brush === letter);
    b.addEventListener('click', () => {
      brush = letter;
      buildBrushes();
    });
    box.append(b);
  }
}

function buildLayers(): void {
  const g = finalGrid;
  const box = $('layers');
  box.innerHTML = '';
  if (!g) return;
  const tab = (label: string, value: number | undefined) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.classList.toggle('on', layer === value);
    b.addEventListener('click', () => {
      layer = value;
      buildLayers();
      gridChanged();
    });
    box.append(b);
  };
  if (layer !== undefined && layer >= g.Y) layer = undefined;
  tab('Tutte', undefined);
  for (let y = 0; y < g.Y; y++) {
    const t = settings?.tracks.find((k) => k.y === y);
    tab(`Y${y}${t ? ` ${t.instrument}` : ' muta'}`, y);
  }
}

function setStatus(text: string, cls: 'ok' | 'warn' | 'bad'): void {
  const s = $('status');
  s.textContent = text;
  s.className = `badge ${cls}`;
}

function showError(msg: string, line = 0): void {
  setStatus('errore', 'bad');
  markLine(line);
  $('diag').innerHTML = `<div class="bad">${escapeHtml(msg)}</div>`;
}

let nodesHtml = '';

function diagnose(r: RunReply): void {
  const lines = [`<div>${r.steps} passi, ${r.ms} ms, griglia ${r.grid.X}×${r.grid.Y}×${r.grid.Z}, seme ${seed}, ritocchi ${retouchCount(xml)}</div>`];
  for (const w of r.warnings) lines.push(`<div class="warn">⚠ ${escapeHtml(w)}</div>`);
  const fired = r.nodes.filter((n) => n.runs);
  const idle = r.nodes.filter((n) => !n.runs);
  if (fired.length) lines.push(`<div class="good">✔ Nodi al lavoro (${fired.length})</div>`, ...fired.map((n) => `<div>· ${escapeHtml(n.what)} ×${n.runs}, ${n.cells} celle</div>`));
  if (idle.length) lines.push(`<div class="warn">⚠ Nodi fermi (${idle.length})</div>`, ...idle.map((n) => `<div>· ${escapeHtml(n.what)}${n.why ? ` — ${escapeHtml(n.why)}` : ''}</div>`));
  const lost = settings ? Array.from({ length: r.grid.Y }, (_, y) => y).filter((y) => !settings!.tracks.some((t) => t.y === y)) : [];
  if (lost.length) lines.push(`<div class="warn">⚠ Piani senza &lt;track&gt;, muti: Y=${lost.join(', ')}</div>`);
  nodesHtml = lines.join('');
  $('diag').innerHTML = nodesHtml;
}

function diagnoseSound(): void {
  if (!sound) return;
  const seconds = (sound.loopEnd - sound.loopStart) / sound.sampleRate;
  const { peak, rms } = levels(sound.samples);
  const parts = (settings?.tracks ?? []).map((t) => `${t.instrument} ${muted.has(t.y) ? 'muto' : (sound!.byTrack[t.y] ?? 0)}`).join(', ');
  const empty = (settings?.tracks ?? []).filter((t) => !muted.has(t.y) && !sound!.byTrack[t.y]).map((t) => t.instrument);
  const lines = [`<div>♪ ${sound.events} eventi (${parts}), ciclo ${seconds.toFixed(2)} s, picco ${peak.toFixed(2)}, RMS ${rms.toFixed(3)}, resa ${Math.round(sound.ms)} ms</div>`];
  if (empty.length) lines.push(`<div class="warn">⚠ Tracce senza eventi: ${empty.join(', ')}</div>`);
  if (sound.truncated) lines.push('<div class="warn">⚠ Oltre i tetti del sintetizzatore: una parte è rimasta fuori</div>');
  if (!$('diag').querySelector('.bad')) $('diag').innerHTML = lines.join('') + nodesHtml;
}

const toastEl = $('toast');
let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toast(msg: string): void {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 2600);
}

function download(data: BlobPart, type: string, name: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function saveXml(): void {
  const text = withSeedNote(xml, seed);
  remember();
  savedText = text;
  setText(text);
  download(text, 'application/xml', fileName);
  toast(`Salvato ${fileName}, con il seme ${seed}`);
}

async function exportWav(): Promise<void> {
  await whenSettled();
  if (!sound) return;
  const whole = !$<HTMLInputElement>('wav-loop').checked;
  const samples = whole ? sound.samples : sound.samples.subarray(sound.loopStart, sound.loopEnd);
  download(new Uint8Array(wavBytes(samples, sound.sampleRate)), 'audio/wav', `${fileName.replace(/\.xml$/i, '')}-seme${seed}${whole ? '' : '-ciclo'}.wav`);
  toast('WAV pronto');
}

function setShot(i: number): void {
  shot = Math.max(0, Math.min(shots.length - 1, i));
  gridChanged();
}

function stopMorph(): void {
  if (morphTimer) clearInterval(morphTimer);
  morphTimer = undefined;
  $('morph').textContent = '🎞 Morph';
}

function startMorph(): void {
  if (morphTimer) return stopMorph();
  setShot(0);
  $('morph').textContent = '⏹ Ferma';
  morphTimer = setInterval(() => {
    if (shot >= shots.length - 1) return stopMorph();
    setShot(shot + 1);
  }, MORPH_MS);
}

/** A stroke of the roll: only on the finished grid, which is what the program's text can say. */
function bindRoll(): void {
  const c = $<HTMLCanvasElement>('roll');
  const cellOf = (e: PointerEvent) => {
    const g = finalGrid;
    if (!g) return undefined;
    const box = c.getBoundingClientRect();
    return rollCell(e.clientX - box.left, e.clientY - box.top, box.width, box.height, g, layer);
  };
  let stroke: string | undefined;
  let touched = false;
  c.addEventListener('pointerdown', (e) => {
    const cell = cellOf(e);
    if (!cell || !finalGrid) return;
    if (shot < shots.length - 1) {
      toast('Qui si guarda: si dipinge sull\'ultimo passo, quello che il programma dà');
      return;
    }
    remember();
    stopMorph();
    stroke = brushFor(finalGrid, cell, brush);
    paintCell(finalGrid, cell, stroke);
    touched = true;
    c.setPointerCapture(e.pointerId);
    if (stroke !== AIR) audition(cell, stroke);
    gridChanged();
  });
  c.addEventListener('pointermove', (e) => {
    const cell = cellOf(e);
    const g = activeGrid();
    if (!cell || !g) return;
    const t = settings?.tracks.find((k) => k.y === cell.y);
    const note = t && settings ? noteName(pitchOf(cell.z, settings, t.instrument)) : 'muta';
    $('hover').textContent = `Cella x ${cell.x}, y ${cell.y} (${t?.instrument ?? 'senza traccia'}), z ${cell.z} (${note}) = ${letterAt(g, cell.x, cell.y, cell.z)}`;
    if (stroke !== undefined && finalGrid && letterAt(finalGrid, cell.x, cell.y, cell.z) !== stroke) {
      paintCell(finalGrid, cell, stroke);
      gridChanged();
    }
  });
  c.addEventListener('pointerup', () => {
    stroke = undefined;
    if (touched) writeRetouches();
    touched = false;
  });
}

function bindAll(): void {
  const presetSel = $<HTMLSelectElement>('preset');
  for (const p of presets) presetSel.add(new Option(p.name ?? p.id, p.id));
  presetSel.add(new Option('— da file o bozza —', ''));
  presetSel.addEventListener('change', () => {
    const p = presets.find((x) => x.id === presetSel.value);
    if (!p) return;
    loadProgram(p.xml, `${p.id}.xml`);
  });
  const seedEl = $<HTMLInputElement>('seed');
  seedEl.addEventListener('change', () => {
    const n = Math.floor(Number(seedEl.value));
    setSeed(Number.isFinite(n) && n >= 0 ? n : SEED_DEFAULT);
    setText(xml);
    runProgram();
  });
  $('dice').addEventListener('click', () => {
    setSeed(100000 + Math.floor(Math.random() * 900000));
    setText(xml);
    runProgram();
  });
  $('rerun').addEventListener('click', () => {
    finalGrid = undefined;
    runProgram();
  });
  $('play').addEventListener('click', togglePlay);
  $('once').addEventListener('click', stepOnce);
  const fileEl = $<HTMLInputElement>('file');
  $('open').addEventListener('click', () => fileEl.click());
  fileEl.addEventListener('change', async () => {
    const f = fileEl.files?.[0];
    if (!f) return;
    presetSel.value = '';
    loadProgram(await f.text(), f.name);
    fileEl.value = '';
  });
  $('save').addEventListener('click', saveXml);
  $('copy').addEventListener('click', () => void navigator.clipboard.writeText(xml).then(() => toast('Copiato')));
  $('undo').addEventListener('click', () => {
    const before = undoStack.pop();
    if (before === undefined) return;
    finalGrid = undefined;
    setText(before);
    runProgram();
  });
  $('wav').addEventListener('click', () => void exportWav());
  const area = $<HTMLTextAreaElement>('xml');
  let typing: ReturnType<typeof setTimeout> | undefined;
  area.addEventListener('input', () => {
    setText(area.value);
    clearTimeout(typing);
    typing = setTimeout(() => {
      finalGrid = undefined;
      runProgram();
    }, DEBOUNCE_MS);
  });
  area.addEventListener('scroll', syncScroll);
  knob('bpm', (s, v) => (s.bpm = v), (v) => v, String);
  knob('swing', (s, v) => (s.swing = v), (v) => v / 100, (v) => `${v}%`);
  knob('cutoff', (s, v) => (s.cutoff = v), (v) => v, fmtHz);
  knob('space', (s, v) => (s.space = v), (v) => v / 100, (v) => `${v}%`);
  const scaleSel = $<HTMLSelectElement>('scale');
  for (const k of Object.keys(SCALES)) scaleSel.add(new Option(SCALE_NAMES[k] ?? k, k));
  scaleSel.addEventListener('change', () => {
    if (!settings) return;
    remember();
    settings.scale = scaleSel.value;
    setText(setSoundAttr(xml, 'scale', scaleSel.value));
    rollDirty = true;
    requestRender();
  });
  const rootSel = $<HTMLSelectElement>('root');
  for (let m = 36; m <= 72; m++) rootSel.add(new Option(noteName(m), String(m)));
  rootSel.addEventListener('change', () => {
    if (!settings) return;
    remember();
    settings.root = Number(rootSel.value);
    setText(setSoundAttr(xml, 'root', rootSel.value));
    rollDirty = true;
    requestRender();
  });
  const shotEl = $<HTMLInputElement>('shot');
  shotEl.addEventListener('input', () => {
    stopMorph();
    setShot(Number(shotEl.value));
  });
  $('back').addEventListener('click', () => {
    stopMorph();
    setShot(shot - 1);
  });
  $('forward').addEventListener('click', () => {
    stopMorph();
    setShot(shot + 1);
  });
  $('morph').addEventListener('click', startMorph);
  $('clear').addEventListener('click', () => {
    if (!finalGrid) return;
    remember();
    stopMorph();
    shot = shots.length - 1;
    finalGrid.cells.fill(0);
    gridChanged();
    writeRetouches();
  });
  $('run-on').addEventListener('click', () => {
    if (!finalGrid) return;
    remember();
    stopMorph();
    askPrograms({ kind: 'runOn', id: nextId++, xml, seed, grid: { ...finalGrid, cells: new Uint8Array(finalGrid.cells), alphabet: [...finalGrid.alphabet] } });
  });
  $<HTMLInputElement>('markers').addEventListener('change', (e) => {
    showMarkers = (e.target as HTMLInputElement).checked;
    gridChanged();
  });
  $('cam').addEventListener('click', () => voxels.resetCamera());
  bindRoll();
  window.addEventListener('keydown', (e) => {
    const inText = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement || (e.target instanceof HTMLInputElement && e.target.type === 'number');
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      finalGrid = undefined;
      runProgram();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveXml();
    } else if (e.key === ' ' && !inText) {
      e.preventDefault();
      togglePlay();
    }
  });
}

function start(): void {
  bindAll();
  $<HTMLButtonElement>('undo').disabled = true;
  let draft: { xml?: string; seed?: number; fileName?: string; savedText?: string } = {};
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}');
  } catch {
    /* a draft that does not read is no draft */
  }
  setSeed(Number.isInteger(draft.seed) ? draft.seed! : SEED_DEFAULT);
  if (draft.xml) {
    fileName = draft.fileName ?? fileName;
    savedText = draft.savedText ?? '';
    $('file-name').textContent = fileName;
    $<HTMLSelectElement>('preset').value = presets.find((p) => p.xml === draft.xml) ? presets.find((p) => p.xml === draft.xml)!.id : '';
    setText(draft.xml);
    runProgram();
  } else if (presets[0]) loadProgram(presets[0].xml, `${presets[0].id}.xml`);
  requestAnimationFrame(frame);
}

start();

// In the console: what a test in the browser needs, the same objects the page plays and draws with.
(window as unknown as { soundlab: unknown }).soundlab = {
  player,
  presets,
  whenSettled,
  get xml() {
    return xml;
  },
  get seed() {
    return seed;
  },
  get sound() {
    return sound;
  },
  get grid() {
    return finalGrid;
  },
  get shots() {
    return shots.length;
  },
  get shot() {
    return shot;
  },
  get settings() {
    return settings;
  },
  load: (text: string, name = 'prova.xml') => loadProgram(text, name),
  /** A grid from elsewhere (the mockup's, to compare): it is heard, and the program's text does not change. */
  hear(g: GridData) {
    finalGrid = g;
    gridChanged();
  },
};
