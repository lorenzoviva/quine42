// The corona: a still ring of rune-cells around the simulation circle holding the universe's
// entire source. Deterministic mapping: files sorted by path, each laid out as
//   '§' + path + '\n' + content + '∎' (EOF)
// along concentric layers starting at radius R, each layer clockwise from the top.

import type { FileMap } from './types';

export type CoronaCellKind = 'header' | 'code' | 'eof' | 'empty';

export interface CoronaCell {
  ch: string;
  kind: CoronaCellKind;
  path?: string;
  /** 1-based line/col within the file content (code cells only). */
  line?: number;
  col?: number;
}

interface Segment {
  path: string;
  start: number;
  contentStart: number;
  eof: number;
}

export const FILE_MARK = '§';
export const EOF_MARK = '∎';

export class Corona {
  text = '';
  outer: number;
  private segments: Segment[] = [];
  private cells = new Map<string, number>();
  private lineStarts = new Map<string, number[]>();
  private files: FileMap = {};

  constructor(readonly radius: number) {
    this.outer = radius + 1;
  }

  build(files: FileMap): void {
    this.files = files;
    this.segments = [];
    this.lineStarts.clear();
    let text = '';
    for (const path of Object.keys(files).sort()) {
      const start = text.length;
      text += `${FILE_MARK}${path}\n`;
      const contentStart = text.length;
      text += files[path];
      const eof = text.length;
      text += EOF_MARK;
      this.segments.push({ path, start, contentStart, eof });
      const starts = [0];
      const content = files[path];
      for (let i = 0; i < content.length; i++) if (content[i] === '\n') starts.push(i + 1);
      this.lineStarts.set(path, starts);
    }
    this.text = text;
    this.layout(text.length);
  }

  private layout(n: number): void {
    const R = this.radius;
    const layersNeeded = Math.ceil(Math.sqrt(R * R + n / Math.PI) - R) + 3;
    const max = Math.ceil(R + layersNeeded);
    const buckets: Array<Array<{ x: number; y: number; a: number }>> = [];
    for (let y = -max; y < max; y++) {
      for (let x = -max; x < max; x++) {
        const d = Math.hypot(x + 0.5, y + 0.5);
        if (d < R) continue;
        const layer = Math.floor(d - R);
        if (layer >= layersNeeded) continue;
        // Clockwise from the top (y grows downward on screen).
        let a = Math.atan2(y + 0.5, x + 0.5) + Math.PI / 2;
        if (a < 0) a += Math.PI * 2;
        (buckets[layer] ??= []).push({ x, y, a });
      }
    }
    this.cells.clear();
    let index = 0;
    let lastLayer = 0;
    for (let layer = 0; layer < buckets.length; layer++) {
      const b = buckets[layer];
      if (!b) continue;
      b.sort((p, q) => p.a - q.a);
      for (const c of b) this.cells.set(`${c.x},${c.y}`, index++);
      if (index >= n && lastLayer === 0) lastLayer = layer;
      if (index >= n) break;
    }
    this.outer = R + lastLayer + 1;
  }

  /** Cell at integer real-space coordinates, or null outside the ring. */
  at(cx: number, cy: number): CoronaCell | null {
    const index = this.cells.get(`${cx},${cy}`);
    if (index === undefined) return null;
    if (index >= this.text.length) return { ch: ' ', kind: 'empty' };
    const seg = this.segmentAt(index);
    const ch = this.text[index];
    if (!seg) return { ch, kind: 'empty' };
    if (index < seg.contentStart) return { ch, kind: 'header', path: seg.path };
    if (index >= seg.eof) return { ch, kind: 'eof', path: seg.path };
    const offset = index - seg.contentStart;
    const { line, col } = this.position(seg.path, offset);
    return { ch, kind: 'code', path: seg.path, line, col };
  }

  inRing(x: number, y: number): boolean {
    const d = Math.hypot(x, y);
    return d >= this.radius && d < this.outer;
  }

  private segmentAt(index: number): Segment | undefined {
    let lo = 0;
    let hi = this.segments.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const s = this.segments[mid];
      if (index < s.start) hi = mid - 1;
      else if (index > s.eof) lo = mid + 1;
      else return s;
    }
    return undefined;
  }

  private position(path: string, offset: number): { line: number; col: number } {
    const starts = this.lineStarts.get(path)!;
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, col: offset - starts[lo] + 1 };
  }

  fileCount(): number {
    return Object.keys(this.files).length;
  }
}
