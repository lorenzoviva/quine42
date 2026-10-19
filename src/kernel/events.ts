export type Handler = (payload: any) => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler>>();

  on(name: string, fn: Handler): () => void {
    let set = this.handlers.get(name);
    if (!set) this.handlers.set(name, (set = new Set()));
    set.add(fn);
    return () => set!.delete(fn);
  }

  emit(name: string, payload?: any): void {
    for (const fn of this.handlers.get(name) ?? []) fn(payload);
    for (const fn of this.handlers.get('*') ?? []) fn({ name, payload });
  }
}
