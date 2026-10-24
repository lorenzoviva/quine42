// The chain of the Systems Room (T27a): every system is a station on a belt of light, in the order of the tick. Each tick
// the kernel runs them one after the other; the meter keeps, for each, how long it took and how many entities it touched
// (the ids it read, wrote, made or destroyed through the Host), and once a second publishes the means: the stations show
// them live, red with the fault when one is open. Pure: the kernel feeds it.

import type { Fault } from './faults';
import type { ModuleEntry } from './types';

/** The ticks per second of the loop (src/main.ts): the chain runs this many times a second. */
export const TICK_HZ = 60;
/** The ticks of a window: the means are published once a second. */
export const WINDOW = TICK_HZ;

/** What a system did in the last window, per tick. */
export interface Measure {
  /** Mean milliseconds per tick, and the longest tick. */
  ms: number;
  peak: number;
  /** Mean entities touched per tick. */
  touched: number;
}

export class ChainMeter {
  private acc = new Map<string, Measure>();
  private ticks = 0;
  /** The last window published, by system. */
  last = new Map<string, Measure>();
  /** How many windows were published. */
  windows = 0;

  record(id: string, ms: number, touched: number): void {
    const a = this.acc.get(id) ?? { ms: 0, peak: 0, touched: 0 };
    a.ms += ms;
    a.peak = Math.max(a.peak, ms);
    a.touched += touched;
    this.acc.set(id, a);
  }

  /** After the systems of a tick; returns whether a window was published. */
  endTick(): boolean {
    if (++this.ticks < WINDOW) return false;
    this.last = new Map([...this.acc].map(([id, a]) => [id, { ms: a.ms / this.ticks, peak: a.peak, touched: Math.round(a.touched / this.ticks) }]));
    this.acc.clear();
    this.ticks = 0;
    this.windows++;
    return true;
  }
}

/** Whose a system is: the Nucleus's (core.*), of the seed or forged (sys.*), a forged mechanic with its panel (mech.*). */
export type StationKind = 'nucleo' | 'sistema' | 'meccanica';

export const STATION_KIND: Record<StationKind, string> = { nucleo: 'del Nucleo', sistema: 'sistema', meccanica: 'meccanica' };

export interface Station {
  id: string;
  name: string;
  /** Its place in the tick, from 1. */
  step: number;
  order: number;
  kind: StationKind;
  description?: string;
  /** Its code, to open (logic.lua, or the manifest without one). */
  path: string;
  /** The title of its panel, for a mechanic with one. */
  panel?: string;
  /** What it did in the last window; undefined before the first one. */
  measure?: Measure;
  /** The open fault of its code, if any. */
  fault?: { message: string; count: number };
}

export interface Chain {
  stations: Station[];
  /** Milliseconds of all the systems per tick (the last window). */
  ms: number;
  hz: number;
  /** Whether a window has been measured yet. */
  measured: boolean;
}

export const stationKind = (id: string): StationKind => (id.startsWith('core.') ? 'nucleo' : id.startsWith('mech.') ? 'meccanica' : 'sistema');

/** The stations in the order of the tick (`systems` as the kernel runs them), with the meter's last window and the faults. */
export function chainOf(systems: ModuleEntry[], meter: ChainMeter, faults: Fault[]): Chain {
  const stations = systems.map((m, i): Station => {
    const id = m.manifest.id;
    const f = faults.find((x) => x.key === `module:${id}` || x.key.startsWith(`module:${id}:`));
    const measure = meter.last.get(id);
    return {
      id,
      name: m.manifest.name || id,
      step: i + 1,
      order: m.manifest.order ?? 50,
      kind: stationKind(id),
      ...(m.manifest.description ? { description: m.manifest.description } : {}),
      path: m.logicPath ?? m.manifestPath,
      ...(m.manifest.ui?.titolo ? { panel: m.manifest.ui.titolo } : {}),
      ...(measure ? { measure } : {}),
      ...(f ? { fault: { message: f.message, count: f.count } } : {}),
    };
  });
  return { stations, ms: stations.reduce((s, x) => s + (x.measure?.ms ?? 0), 0), hz: TICK_HZ, measured: meter.windows > 0 };
}

/** «0.12 ms», «1.4 ms», «12 ms». */
export const msText = (ms: number) => `${ms < 1 ? ms.toFixed(2) : ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;
