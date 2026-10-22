// The content registry: items, recipes, loot tables and layouts, gathered from every module.
// Content is mostly data (text is cheap): items arrive in packs of dozens, each with category,
// weight, effects and tags; loot tables pick by tag, so every new pack enriches every chest.

import { Rng } from './rng';
import { runeGlyph } from './runes';
import type { ItemDef, ItemSpec, LayoutDef, LootTable, MagicRune, ModuleEntry, Recipe, Spell } from './types';

export const CATEGORY_GLYPHS: Record<string, string> = {
  cibo: 'ò', bevanda: 'Ů', medicina: '+', attrezzo: '⚒', arma: '†', materiale: '▪', luce: '☼', vestiario: 'Ʌ', contenitore: '◘', magia: '✦', varie: '•',
};

export function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(il|lo|la|i|gli|le|un|uno|una|di|del|della|dei|delle|da)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function specOf(d: ItemDef | undefined): ItemSpec | undefined {
  if (!d) return undefined;
  return { stackable: d.stack > 1, maxStack: Math.max(1, d.stack), weight: d.weight, equippable: !!d.equippable };
}

export class Content {
  readonly items = new Map<string, ItemDef>();
  recipes: Recipe[] = [];
  loot: Record<string, LootTable> = {};
  layouts: Record<string, LayoutDef> = {};
  /** Magic runes by token, incantations by sequence of tokens ("fuoco luce"). */
  runes: Record<string, MagicRune> = {};
  spells: Record<string, Spell> = {};
  /** Which module defines each item / layout (for writing updates back). */
  readonly itemSource = new Map<string, string>();

  rebuild(modules: ModuleEntry[]): void {
    this.items.clear();
    this.itemSource.clear();
    this.recipes = [];
    this.loot = {};
    this.layouts = {};
    this.runes = {};
    this.spells = {};
    for (const m of modules) {
      const man = m.manifest;
      if (man.kind === 'item') {
        const app = man.appearance;
        this.items.set(man.id, {
          id: man.id,
          name: man.name,
          description: man.description ?? '',
          category: (man.tags?.find((t) => t in CATEGORY_GLYPHS) as ItemDef['category']) ?? 'varie',
          weight: man.item?.weight ?? 1,
          stack: man.item?.stackable ? man.item.maxStack : 1,
          tags: man.tags ?? [],
          glyph: app?.glyph ?? '?',
          color: app?.color ?? '#aaa',
          ...(app?.aspetto ? { aspetto: app.aspetto } : {}),
          equippable: man.item?.equippable,
          module: man.id,
          ...(man.actions?.length ? { actions: man.actions } : {}),
        });
        this.itemSource.set(man.id, man.id);
      }
      for (const it of man.items ?? []) {
        this.items.set(it.id, { ...it, tags: [...new Set([...(it.tags ?? []), it.category])] });
        this.itemSource.set(it.id, man.id);
      }
      this.recipes.push(...(man.recipes ?? []));
      Object.assign(this.loot, man.loot ?? {});
      Object.assign(this.layouts, man.layouts ?? {});
      Object.assign(this.runes, man.runes ?? {});
      Object.assign(this.spells, man.spells ?? {});
    }
  }

  /**
   * Runes are items too (`rune:<token>`): small, light, stackable, kept in pockets or in a rune pouch.
   * They are not written in any pack: every token is a rune.
   */
  get(id: string): ItemDef | undefined {
    const d = this.items.get(id);
    if (d || !id.startsWith('rune:')) return d;
    const token = id.slice(5);
    if (!token || token.length > 24) return undefined;
    const magic = this.runes[token];
    const look = runeGlyph(token, magic);
    return {
      id,
      name: magic ? `Runa ${magic.name} («${token}»)` : `Runa «${token}»`,
      description: magic ? `Runa magica (${magic.element}): ${magic.description}. Come codice è la parola «${token}».` : `Un frammento del codice del mondo: la parola «${token}». Incisa sul tappeto, si esegue.`,
      category: magic ? 'magia' : 'varie',
      weight: 0.02,
      stack: 50,
      tags: magic ? ['runa', 'magica'] : ['runa'],
      glyph: look.glyph,
      color: magic?.color ?? '#ffcf5c',
    };
  }

  /** Finds an item by a name a model or the player used ("una corda" → item.corda). */
  byName(name: string): ItemDef | undefined {
    const n = normName(name);
    if (!n) return undefined;
    let best: ItemDef | undefined;
    for (const d of this.items.values()) {
      const dn = normName(d.name);
      if (dn === n) return d;
      if (!best && (dn.includes(n) || n.includes(dn)) && Math.min(dn.length, n.length) >= 4) best = d;
    }
    return best;
  }

  withTag(tag: string): ItemDef[] {
    return [...this.items.values()].filter((d) => d.tags.includes(tag) || d.category === tag);
  }

  /** Rolls a loot table: items found in a chest, a drawer, on the ground. */
  roll(tableId: string, rng: Rng, favour: string[] = []): Array<{ item: string; count: number }> {
    const table = this.loot[tableId] ?? this.loot.comune;
    if (!table) return [];
    const [lo, hi] = table.rolls;
    const rolls = lo + rng.int(Math.max(1, hi - lo + 1));
    const out: Array<{ item: string; count: number }> = [];
    const entries = table.entries.filter((e) => (e.item ? !!this.get(e.item) : this.withTag(e.tag ?? '').length));
    const total = entries.reduce((s, e) => s + e.weight, 0);
    for (let i = 0; i < rolls && total > 0; i++) {
      let r = rng.next() * total;
      const e = entries.find((x) => (r -= x.weight) < 0) ?? entries[0];
      let item = e.item;
      if (!item) {
        const pool = this.withTag(e.tag!);
        // Things people talked about turn up more often, if they fit.
        const wanted = pool.filter((d) => favour.includes(d.id));
        item = (wanted.length && rng.chance(0.5) ? rng.pick(wanted) : rng.pick(pool)).id;
      }
      const min = e.min ?? 1;
      const max = Math.max(min, e.max ?? 1);
      out.push({ item, count: min + rng.int(max - min + 1) });
    }
    // Magic hides inside things: any chest or drawer may hold something from the "magia" table.
    if (tableId !== 'magia' && tableId !== 'terreno' && this.loot.magia && rng.chance(0.18)) out.push(...this.roll('magia', rng));
    return out;
  }

  craftable(has: (item: string) => number): Recipe[] {
    return this.recipes.filter((r) => r.inputs.every((i) => has(i.item) >= i.count) && (r.tools ?? []).every((t) => has(t) > 0));
  }
}
