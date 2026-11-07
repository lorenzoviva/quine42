// The resources of MarkovJunior's repository that the models of T335 read (github.com/mxgmn/MarkovJunior, MIT, © 2022 Maxim Gumin), as
// the text the lab's engine reads (rule 11: no images, no .vox): tilesets with their tiles inside, rule files, flat samples. The original
// lays the colours of a .vox or a .png on letters by the order they first appear (Helper.Ords): the same order is kept here, written with
// the letters of the program that uses them, so a program reads the file as the original reads the image.
//   npx vite-node lab/scripts/mjx-risorse.ts -- <the repository, unpacked> [--out lab/mjx/official/resources]
// Run it on a copy of the repository downloaded on purpose: it only reads its files.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { parseXml, type XmlElement } from '../../src/mj/xml';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : fallback;
};
const out = path.resolve(opt('out', 'lab/mjx/official/resources'));
const repo = path.resolve(args[0] ?? '');
if (!fs.existsSync(path.join(repo, 'resources'))) throw new Error('il primo argomento è la cartella del repository di MarkovJunior (con resources/)');
fs.mkdirSync(out, { recursive: true });

/** Each tileset with the letters of the first program that reads it: the k-th colour of its tiles is the k-th letter. */
const TILESETS: Array<[string, string, string]> = [
  ['Paths', 'BYDAWPRFUENC', 'Apartemazements'],
  ['OrientedStairs', 'BEAWDRF', 'PillarsOfEternity'],
  ['Partition', 'BCA', 'Partitioning'],
  ['Surface', 'BW', 'Surface'],
  ['Escher', 'BAYRW', 'Escher'],
  ['EscherSurface', 'BADG', 'EscherSurface'],
  ['OrientedEscher', 'BODAWEU', 'OrientedEscher'],
  ['PartitionedEdges', 'BOaFXowSLsVJKkARrWhNYnxevDUZdQu', 'ModernHouse'],
  ['MarchingHills', 'BaVOoYhSAWwRrlgvPpxbUuCcKkXGEFi', 'SeaVilla'],
];
/** The programs whose rule files (with their legends) are read from resources/rules/<folder>/. */
const RULE_PROGRAMS = ['ModernHouse', 'SeaVilla', 'StairsPath'];
/** ConvChain's samples: white pixels are the white letter, the rest the black one. */
const SAMPLES: Array<[string, string, string, string]> = [
  ['Room', 'D', 'A', 'ChainDungeon'],
  ['Maze', 'D', 'A', 'ChainDungeonMaze'],
];
/** The overlap model's samples (wfc sample): the k-th colour, in the order colours first appear, is the k-th letter of the node. */
const WAVE_SAMPLES: Array<[string, string, string]> = [['Dungeon', 'BWP', 'WaveDungeon']];

const SOURCE = (what: string) => `MarkovJunior (github.com/mxgmn/MarkovJunior, ${what}, MIT, © 2022 Maxim Gumin), as text by lab/scripts/mjx-risorse.ts`;

interface Vox {
  X: number;
  Y: number;
  Z: number;
  /** The colour of each voxel, -1 where there is none; x fastest, then y, then z from the bottom. */
  cells: Int32Array;
}

/** MagicaVoxel's format as VoxHelper.LoadVox reads it: SIZE and XYZI. */
function readVox(file: string): Vox {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'VOX ') throw new Error(`${file}: non è un .vox`);
  let i = 8;
  let X = -1, Y = -1, Z = -1;
  let cells: Int32Array | undefined;
  while (i + 12 <= b.length) {
    const id = b.toString('ascii', i, i + 4);
    const n = b.readInt32LE(i + 4), m = b.readInt32LE(i + 8);
    const body = i + 12;
    if (id === 'MAIN') {
      i = body + n;
      continue;
    }
    if (id === 'SIZE') [X, Y, Z] = [b.readInt32LE(body), b.readInt32LE(body + 4), b.readInt32LE(body + 8)];
    if (id === 'XYZI') {
      cells = new Int32Array(X * Y * Z).fill(-1);
      const k = b.readInt32LE(body);
      for (let v = 0; v < k; v++) {
        const o = body + 4 + v * 4;
        cells[b[o] + b[o + 1] * X + b[o + 2] * X * Y] = b[o + 3];
      }
    }
    i = body + n + m;
  }
  if (!cells) throw new Error(`${file}: senza voxel`);
  return { X, Y, Z, cells };
}

/** A PNG's pixels as ARGB integers (Graphics.LoadBitmap): 8-bit grey, RGB, RGBA or palette, not interlaced. */
function readPng(file: string): { W: number; H: number; pixels: Int32Array } {
  const b = fs.readFileSync(file);
  let i = 8;
  let W = 0, H = 0, depth = 0, type = 0;
  const idat: Buffer[] = [];
  let palette: Buffer | undefined;
  while (i < b.length) {
    const n = b.readUInt32BE(i);
    const id = b.toString('ascii', i + 4, i + 8);
    const body = b.subarray(i + 8, i + 8 + n);
    if (id === 'IHDR') {
      W = body.readUInt32BE(0);
      H = body.readUInt32BE(4);
      depth = body[8];
      type = body[9];
      if (body[12] !== 0) throw new Error(`${file}: interlacciato`);
    } else if (id === 'PLTE') palette = body;
    else if (id === 'IDAT') idat.push(body);
    i += 12 + n;
  }
  if (depth !== 8) throw new Error(`${file}: profondità ${depth}, non 8`);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type as 0 | 2 | 3 | 4 | 6];
  if (!channels) throw new Error(`${file}: tipo di colore ${type}`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = W * channels;
  const img = new Uint8Array(H * stride);
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= channels ? img[y * stride + x - channels] : 0;
      const up = y ? img[(y - 1) * stride + x] : 0;
      const c = y && x >= channels ? img[(y - 1) * stride + x - channels] : 0;
      const p = a + up - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c);
      const paeth = pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
      img[y * stride + x] = (v + [0, a, up, (a + up) >> 1, paeth][f]) & 255;
    }
  }
  const pixels = new Int32Array(W * H);
  for (let k = 0; k < W * H; k++) {
    const o = k * channels;
    const [r, g, bl, al] =
      type === 0 ? [img[o], img[o], img[o], 255] : type === 4 ? [img[o], img[o], img[o], img[o + 1]] : type === 3 ? [palette![img[o] * 3], palette![img[o] * 3 + 1], palette![img[o] * 3 + 2], 255] : [img[o], img[o + 1], img[o + 2], type === 6 ? img[o + 3] : 255];
    pixels[k] = ((al << 24) | (r << 16) | (g << 8) | bl) | 0;
  }
  return { W, H, pixels };
}

/** Helper.Ords: each value's place in the order values first appear (`uniques` shared by the calls that pass it). */
function ords(data: ArrayLike<number>, uniques: number[] = []): number[] {
  return Array.from(data, (d) => {
    let k = uniques.indexOf(d);
    if (k < 0) k = uniques.push(d) - 1;
    return k;
  });
}

/** Cells (x fastest, z from the bottom) as a pattern's text: a line per layer from the top, rows apart by "/". */
function text(letters: string[], X: number, Y: number, Z: number, indent = ''): string {
  const lines: string[] = [];
  for (let z = Z - 1; z >= 0; z--) {
    const rows: string[] = [];
    for (let y = 0; y < Y; y++) rows.push(letters.slice(z * X * Y + y * X, z * X * Y + (y + 1) * X).join(''));
    lines.push(indent + rows.join('/'));
  }
  return lines.join('\n');
}

const attr = (el: XmlElement) => Object.entries(el.attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
const written: string[] = [];
const write = (name: string, body: string) => {
  fs.writeFileSync(path.join(out, name), body.endsWith('\n') ? body : `${body}\n`);
  written.push(name);
};

for (const [name, letters, program] of TILESETS) {
  const dir = path.join(repo, 'resources', 'tilesets');
  const root = parseXml(fs.readFileSync(path.join(dir, `${name}.xml`), 'utf8')).find((r) => r.name === 'tileset')!;
  const tiles = root.children.find((c) => c.name === 'tiles')!.children.filter((c) => c.name === 'tile');
  const neighbors = root.children.find((c) => c.name === 'neighbors')!.children.filter((c) => c.name === 'neighbor');
  const uniques: number[] = [];
  const body = tiles.map((t) => {
    const v = readVox(path.join(dir, name, `${t.attrs.name}.vox`));
    const o = ords(v.cells, uniques);
    if (uniques.length > letters.length) throw new Error(`${name}: più colori (${uniques.length}) delle lettere di ${program}`);
    return `    <tile${attr(t)}>\n${text(o.map((k) => letters[k]), v.X, v.Y, v.Z, '      ')}\n    </tile>`;
  });
  write(
    `${name}.xml`,
    [
      `<!-- ${SOURCE(`resources/tilesets/${name}.xml and ${name}/*.vox`)}; the letters are those of ${program}. -->`,
      `<tileset values="${letters.slice(0, uniques.length)}"${root.attrs.fullSymmetry ? ` fullSymmetry="${root.attrs.fullSymmetry}"` : ''}>`,
      '  <tiles>',
      ...body,
      '  </tiles>',
      '  <neighbors>',
      ...neighbors.map((n) => `    <neighbor${attr(n)}/>`),
      '  </neighbors>',
      '</tileset>',
    ].join('\n'),
  );
}

for (const program of RULE_PROGRAMS) {
  const roots = parseXml(fs.readFileSync(path.join(repo, 'models', `${program}.xml`), 'utf8'));
  const visit = (el: XmlElement, folder: string | undefined) => {
    const inner = el.name === 'map' || el.name === 'wfc' ? el.attrs.folder : folder;
    for (const a of ['fin', 'fout', 'file']) {
      const f = el.attrs[a];
      if (f === undefined) continue;
      const legend = el.attrs.legend;
      if (!legend) throw new Error(`${program}: ${f} senza legend`);
      const sub = el.name === 'rule' ? folder : inner;
      const v = readVox(path.join(repo, 'resources', 'rules', ...(sub ? [sub] : []), `${f}.vox`));
      const o = ords(v.cells);
      if (o.some((k) => k >= legend.length)) throw new Error(`${program}: ${f} ha più colori della legenda "${legend}"`);
      const letters = o.map((k) => legend[k]);
      const name = `${sub ? `${sub}-` : ''}${f}.txt`;
      const head = `# ${SOURCE(`resources/rules/${sub ? `${sub}/` : ''}${f}.vox`)}, with the legend "${legend}" of ${program}`;
      if (a === 'file') {
        const half = v.X / 2;
        const side = (dx: number) => letters.filter((_, i) => i % v.X >= dx && i % v.X < dx + half);
        write(name, `${head}\n${text(side(0), half, v.Y, v.Z)}\n->\n${text(side(half), half, v.Y, v.Z)}`);
      } else write(name, `${head}\n${text(letters, v.X, v.Y, v.Z)}`);
    }
    for (const c of el.children) visit(c, inner);
  };
  for (const r of roots) visit(r, r.attrs.folder);
}

for (const [name, black, white, program] of SAMPLES) {
  const { W, H, pixels } = readPng(path.join(repo, 'resources', 'samples', `${name}.png`));
  const letters = Array.from(pixels, (p) => (p === -1 ? white : black));
  write(`${name}.txt`, `# ${SOURCE(`resources/samples/${name}.png`)}: white pixels are ${white}, the others ${black}, as in ${program}\n${text(letters, W, H, 1)}`);
}

for (const [name, letters, program] of WAVE_SAMPLES) {
  const { W, H, pixels } = readPng(path.join(repo, 'resources', 'samples', `${name}.png`));
  const o = ords(pixels);
  if (o.some((k) => k >= letters.length)) throw new Error(`${name}: più colori delle lettere di ${program}`);
  write(`${name}.txt`, `# ${SOURCE(`resources/samples/${name}.png`)}: the colours, in the order they first appear, are ${letters}, as in ${program}\n${text(o.map((k) => letters[k]), W, H, 1)}`);
}

console.log(`${written.length} file in ${path.relative(process.cwd(), out)}`);
