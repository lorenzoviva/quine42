// Minimal ECS. Entities are ids, components are plain data objects, all state lives here.
// Lua systems are stateless: they read/write these objects through the sandbox proxy.

export type Id = number;

export class World {
  private nextId = 1;
  private stores = new Map<string, Map<Id, any>>();
  readonly alive = new Set<Id>();

  spawn(components: Record<string, any> = {}): Id {
    const id = this.nextId++;
    this.alive.add(id);
    for (const [name, data] of Object.entries(components)) this.set(id, name, data);
    return id;
  }

  destroy(id: Id): void {
    if (!this.alive.delete(id)) return;
    for (const store of this.stores.values()) store.delete(id);
  }

  set<T = any>(id: Id, name: string, data: T): T {
    let store = this.stores.get(name);
    if (!store) this.stores.set(name, (store = new Map()));
    store.set(id, data);
    return data;
  }

  /** The component, or undefined at runtime if absent (typed as T for ergonomics: check with has() when unsure). */
  get<T = any>(id: Id, name: string): T {
    return this.stores.get(name)?.get(id);
  }

  has(id: Id, name: string): boolean {
    return this.stores.get(name)?.has(id) ?? false;
  }

  remove(id: Id, name: string): void {
    this.stores.get(name)?.delete(id);
  }

  /** Ids having all the given components. Returns a snapshot, safe to mutate the world while iterating. */
  query(...names: string[]): Id[] {
    if (names.length === 0) return [...this.alive];
    const stores = names.map((n) => this.stores.get(n));
    if (stores.some((s) => !s)) return [];
    stores.sort((a, b) => a!.size - b!.size);
    const [first, ...rest] = stores as Map<Id, any>[];
    const out: Id[] = [];
    for (const id of first.keys()) if (rest.every((s) => s.has(id))) out.push(id);
    return out;
  }

  count(): number {
    return this.alive.size;
  }
}
