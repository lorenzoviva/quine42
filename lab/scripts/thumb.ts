// A small copy of a picture (for looking at big structure photographs). npx vite-node lab/scripts/thumb.ts -- <png> <width>
import fs from 'node:fs';
import { inflateSync } from 'node:zlib';
import { shrink } from '../mj3d/render';
import { png } from './png';

const [file, width] = process.argv.slice(2).filter((a) => a !== '--');
const buf = fs.readFileSync(file);
// Our own PNGs: one IDAT, RGBA, no filters.
const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
const idat: Buffer[] = [];
for (let o = 8; o < buf.length; ) {
  const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8);
  if (type === 'IDAT') idat.push(buf.subarray(o + 8, o + 8 + len));
  o += 12 + len;
}
const raw = inflateSync(Buffer.concat(idat));
const data = new Uint8ClampedArray(w * h * 4);
for (let y = 0; y < h; y++) data.set(raw.subarray(y * (w * 4 + 1) + 1, (y + 1) * (w * 4 + 1)), y * w * 4);
fs.writeFileSync(file.replace(/\.png$/, '.small.png'), png(shrink({ w, h, data }, Number(width ?? 900))));
