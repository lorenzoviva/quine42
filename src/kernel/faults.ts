// Fault registry: every error raised by universe code (modules or runes) lands here instead of
// crashing the kernel. Faults drive the visible "broken" state (glitch) and clear themselves
// when the offending code runs cleanly again.

export interface Fault {
  key: string;
  message: string;
  since: number;
  count: number;
  /** Where in the world (carpet space) it happened, if it happened there: the Direction shows it (T46a). */
  at?: { x: number; y: number };
}

export class Faults {
  private map = new Map<string, Fault>();
  onRaise?: (fault: Fault, isNew: boolean) => void;

  raise(key: string, message: string, now = performance.now()): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.count++;
      if (existing.message !== message) {
        existing.message = message;
        this.onRaise?.(existing, false);
      }
      return;
    }
    const fault = { key, message, since: now, count: 1 };
    this.map.set(key, fault);
    this.onRaise?.(fault, true);
  }

  clear(key: string): void {
    this.map.delete(key);
  }

  clearPrefix(prefix: string): void {
    for (const key of [...this.map.keys()]) if (key.startsWith(prefix)) this.map.delete(key);
  }

  clearAll(): void {
    this.map.clear();
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  get(key: string): Fault | undefined {
    return this.map.get(key);
  }

  list(): Fault[] {
    return [...this.map.values()];
  }

  get size(): number {
    return this.map.size;
  }
}
