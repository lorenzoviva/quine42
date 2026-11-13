// The views in text of the bench (T337) live in the kernel since T354 (`src/mj/views.ts`, ADR-0183): the Sculptor of the game gets them
// back after every block. Here the names the bench's scripts use (`blocchi.ts`), over the same functions; the text is English, as the
// requests of the game.

import type { Grid3, PaletteEntry } from '../../src/mj/engine';
import { elevationView, legend, planView, sectionView, viewsText, type ViewOptions } from '../../src/mj/views';

export interface OpzioniVista {
  passo?: number;
  larghezza?: number;
  nascoste?: boolean;
}

const opts = (o: OpzioniVista): ViewOptions => ({ ...(o.passo !== undefined ? { step: o.passo } : {}), ...(o.larghezza !== undefined ? { width: o.larghezza } : {}), ...(o.nascoste !== undefined ? { hidden: o.nascoste } : {}) });

export function vistaPianta(g: Grid3, palette: Record<string, PaletteEntry>, o: OpzioniVista = {}): { pianta: string; altezze: string; passo: number } {
  const p = planView(g, palette, opts(o));
  return { pianta: p.plan, altezze: p.heights, passo: p.step };
}

export function vistaAlzato(g: Grid3, palette: Record<string, PaletteEntry>, lato: 'fronte' | 'destra', o: OpzioniVista = {}): { testo: string; passo: number } {
  const e = elevationView(g, palette, lato === 'fronte' ? 'front' : 'right', opts(o));
  return { testo: e.text, passo: e.step };
}

export function vistaSezione(g: Grid3, palette: Record<string, PaletteEntry>, z: number, o: OpzioniVista = {}): { testo: string; passo: number } {
  const s = sectionView(g, palette, z, opts(o));
  return { testo: s.text, passo: s.step };
}

export const legenda = legend;

export function vistePerTesto(g: Grid3, palette: Record<string, PaletteEntry>, titolo: string, o: OpzioniVista & { sezioni?: number[] } = {}): string {
  return viewsText(g, palette, titolo, { ...opts(o), ...(o.sezioni ? { sections: o.sezioni } : {}) });
}
