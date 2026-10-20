// The ArtDirector: a queue of picture jobs, one at a time, within the image budget. Images are the
// expensive part, so they are few and reused: a texture per terrain (seamless, so tiles repeat with
// no seams), a couple of sprites per obstacle, a sprite (and a walk cycle) per character type, icons
// sixteen to a sheet. Each result is written back into the universe and committed.

import type { Kernel } from './kernel';
import { Atelier, DIRECTIONS, type StylePair } from './agents/atelier';
import { ICON_PX, SPRITE_PX, TEXTURE_PX } from './imaging';
import { BudgetError } from './ai/models';
import type { FileMap } from './types';

export interface AtelierBook {
  pairs: Array<{ description: string; kind: string; sprite: string }>;
  /** Last icon sheet, sent as style reference for the next one. */
  iconSheet?: string;
}

const TERRAIN_PATH = 'modules/world.terrain/manifest.json';
const BOOK_PATH = 'world/atelier.json';

export class ArtDirector {
  private busy = false;
  private stopped = false;
  private failures = 0;
  private skip = new Set<string>();
  private retries = new Map<string, number>();

  constructor(private k: Kernel) {}

  get active(): boolean {
    return this.k.models.canPaint && !!this.k.imageTools && !this.stopped;
  }

  /** Called every few seconds: starts the next job if idle. */
  pump(): void {
    if (!this.active || this.busy || this.k.generationHeld) return;
    const job = this.nextJob();
    if (!job) return;
    this.busy = true;
    void job()
      .catch((e: Error) => {
        this.k.council.say('artista', 'errore', e.message);
        if (e instanceof BudgetError) {
          this.stopped = true;
          this.k.message('Budget immagini esaurito: il resto del mondo resterà disegnato dal kernel.', 'warn');
        } else if (++this.failures > 4) this.stopped = true;
      })
      .finally(() => (this.busy = false));
  }

  private book(): AtelierBook {
    try {
      return JSON.parse(this.k.files[BOOK_PATH] ?? '{"pairs":[]}');
    } catch {
      return { pairs: [] };
    }
  }

  private writeJson(path: string, mutate: (j: any) => void, files: FileMap = this.k.repo.working): void {
    const j = JSON.parse(files[path] ?? '{}');
    mutate(j);
    this.k.repo.write(path, JSON.stringify(j, null, 2) + '\n');
  }

  private commit(message: string): void {
    this.k.applyFiles({ ...this.k.repo.working });
    const c = this.k.repo.commit(`arte: ${message}`, 'agent');
    this.k.council.say('kernel', 'approva', `${message} → commit ${c.id}`);
  }

  private nextJob(): (() => Promise<void>) | null {
    const k = this.k;
    const palette = Object.entries(k.palette).filter(([c]) => c !== '?');
    const roof = k.terrain?.manifest.roof;
    const needTexture = palette.filter(([c, t]) => !t.texture && !this.skip.has(`tex:${c}`)).map(([c]) => c);
    if (needTexture.length || (roof && !roof.texture && !this.skip.has('tex:^'))) return () => this.textures([...needTexture, ...(roof && !roof.texture && !this.skip.has('tex:^') ? ['^'] : [])].slice(0, 4));
    const needObstacles = palette.filter(([c, t]) => (t.layer === 'vegetation' || t.layer === 'rock') && !t.sprites?.length && !this.skip.has(`obs:${c}`)).map(([c]) => c);
    if (needObstacles.length) return () => this.obstacles(needObstacles.slice(0, 2));
    const needSprite = [...k.modules.values()]
      .filter((m) => (m.manifest.kind === 'entity' || m.manifest.kind === 'player') && !m.manifest.appearance?.sprite && !this.skip.has(`spr:${m.manifest.id}`))
      .sort((a, b) => (b.manifest.kind === 'player' ? 1 : 0) - (a.manifest.kind === 'player' ? 1 : 0) || (b.manifest.persona ? 1 : 0) - (a.manifest.persona ? 1 : 0));
    if (needSprite.length) return () => this.sprite(needSprite[0].manifest.id);
    const needIcon = [...k.content.items.values()].filter((d) => !d.icon && !this.skip.has(`ico:${d.id}`));
    if (needIcon.length >= 6 || (needIcon.length && k.time > 60)) return () => this.icons(needIcon.slice(0, 16).map((d) => d.id));
    return null;
  }

  private async textures(codes: string[]): Promise<void> {
    const k = this.k;
    const tools = k.imageTools!;
    const terrains = codes.map((c) =>
      c === '^' ? { name: 'tetto', description: `tegole o copertura dei tetti degli edifici, colore ${k.terrain?.manifest.roof?.color}` } : { name: k.palette[c].name, description: `${k.palette[c].description ?? ''}, colore dominante ${k.palette[c].color}` },
    );
    for (const c of codes) this.skip.add(`tex:${c}`);
    k.council.say('artista', 'dipinge', `texture: ${terrains.map((t) => t.name).join(', ')}`);
    const raw = await new Atelier(k.council).textures(terrains);
    if (!raw) return;
    const cells = await tools.cutGrid(raw, 2, 2, 256);
    const ids = await Promise.all(codes.map(async (_, i) => k.assets.put(await tools.makeSeamless(cells[i], TEXTURE_PX))));
    this.writeJson(TERRAIN_PATH, (m) => {
      codes.forEach((c, i) => {
        if (c === '^') m.roof = { ...(m.roof ?? { color: '#9a4632' }), texture: ids[i] };
        else if (m.tiles?.[c]) m.tiles[c].texture = ids[i];
      });
    });
    this.commit(`texture di ${terrains.map((t) => t.name).join(', ')}`);
  }

  private async obstacles(codes: string[]): Promise<void> {
    const k = this.k;
    const tools = k.imageTools!;
    for (const c of codes) this.skip.add(`obs:${c}`);
    const things = codes.flatMap((c) => [1, 2].map((v) => ({ name: `${k.palette[c].name} (variante ${v})`, description: `${k.palette[c].description ?? k.palette[c].name}, un singolo elemento che occupa una casella` })));
    k.council.say('artista', 'dipinge', `ostacoli: ${codes.map((c) => k.palette[c].name).join(', ')}`);
    const raw = await new Atelier(k.council).obstacles(things);
    if (!raw) return;
    const cells = await tools.cutGrid(raw, 2, 2, SPRITE_PX, { key: true });
    const ids = await Promise.all(cells.slice(0, things.length).map((c) => (c ? k.assets.put(c) : Promise.resolve(''))));
    this.writeJson(TERRAIN_PATH, (m) => codes.forEach((c, i) => m.tiles?.[c] && (m.tiles[c].sprites = ids.slice(i * 2, i * 2 + 2).filter(Boolean))));
    this.commit(`ostacoli: ${codes.map((c) => k.palette[c].name).join(', ')}`);
  }

  private async examples(kind: string): Promise<StylePair[]> {
    const pairs = this.book().pairs.filter((p) => p.kind === kind).slice(-3);
    const out: StylePair[] = [];
    for (const p of pairs) {
      const image = await this.k.assets.get(p.sprite);
      if (image) out.push({ description: p.description, image });
    }
    return out;
  }

  /** A sprite for a module, few-shot on the sprites already in the game; characters also get a walk cycle. */
  async sprite(moduleId: string): Promise<void> {
    const k = this.k;
    const tools = k.imageTools!;
    const entry = k.modules.get(moduleId);
    if (!entry) return;
    this.skip.add(`spr:${moduleId}`);
    const man = entry.manifest;
    const character = man.kind === 'player' || !!man.persona;
    const kind = character ? 'npc' : 'oggetto';
    const description = `${man.name}: ${man.appearance?.imagePrompt ?? man.description ?? man.name}`;
    const examples = await this.examples(kind);
    k.council.say('artista', 'dipinge', `${man.name}${examples.length ? ` (sullo stile di ${examples.length} esempi)` : ''}`);
    const atelier = new Atelier(k.council);
    const raw = await atelier.sprite(description, character ? 'npc' : 'oggetto', examples);
    if (!raw) return;
    const cut = await tools.cutSprite(raw, SPRITE_PX);
    if (!cut) {
      // The background could not be removed cleanly: try once more, never show a magenta square.
      const n = (this.retries.get(moduleId) ?? 0) + 1;
      this.retries.set(moduleId, n);
      if (n < 2) this.skip.delete(`spr:${moduleId}`);
      k.council.say('kernel', 'scarta', `sprite di ${man.name}: sfondo non rimovibile${n < 2 ? ', si ridipinge' : ''}`, 'artista');
      return;
    }
    const sprite = await k.assets.put(cut);
    let frames: Record<string, string[]> | undefined;
    const mode = k.config.ai.animation ?? 'sheet';
    if (character && mode !== 'none') {
      try {
        const base = (await k.assets.get(sprite))!;
        if (mode === 'frames') {
          const down = await atelier.walkFrames(base, description, 'down', 3, (r) => tools.cutSprite(r, SPRITE_PX));
          const ids = down.every(Boolean) ? await Promise.all(down.map((f) => k.assets.put(f))) : [];
          if (ids.length) frames = { down: ids, left: ids, right: ids, up: ids };
        } else {
          const sheet = await atelier.walkSheet(base, description);
          if (sheet) {
            const cells = await tools.cutGrid(sheet, 3, 4, SPRITE_PX, { key: true });
            // A frame much emptier or shorter than the standing sprite is a cut figure: its row goes.
            if (tools.measure) {
              const b = await tools.measure(base);
              for (let i = 0; i < cells.length; i++) {
                if (!cells[i]) continue;
                const f = await tools.measure(cells[i]);
                if (f.ink < b.ink * 0.5 || f.h < b.h * 0.7) cells[i] = '';
              }
            }
            // A direction with a dirty frame is dropped; without any clean direction the sprite stays still.
            const rows = await Promise.all(DIRECTIONS.map(async (d, r) => [d, cells.slice(r * 3, r * 3 + 3).every(Boolean) ? await Promise.all(cells.slice(r * 3, r * 3 + 3).map((c) => k.assets.put(c))) : null] as const));
            const clean = rows.filter(([, ids]) => ids);
            if (clean.length) frames = Object.fromEntries(clean.map(([d, ids]) => [d, ids!]));
            if (clean.length < 4) k.council.say('kernel', 'scarta', `camminata di ${man.name}: ${4 - clean.length} direzioni con lo sfondo sporco scartate`, 'artista');
          }
        }
        if (frames) k.council.say('artista', 'dipinge', `${man.name}: camminata (${mode === 'frames' ? 'fotogramma per fotogramma' : 'foglio 4×3'})`);
      } catch (e) {
        if (e instanceof BudgetError) throw e;
        k.council.say('artista', 'errore', `camminata di ${man.name}: ${(e as Error).message}`);
      }
    }
    this.writeJson(entry.manifestPath, (m) => {
      m.appearance = { ...m.appearance, sprite, ...(frames ? { frames } : {}) };
    });
    this.writeJson(BOOK_PATH, (b) => {
      b.pairs = [...(b.pairs ?? []), { description, kind, sprite }].slice(-12);
    });
    this.commit(`sprite di ${man.name}`);
  }

  /** Up to 16 icons in one image, anchored to the previous sheet's style. */
  async icons(ids: string[]): Promise<void> {
    const k = this.k;
    const tools = k.imageTools!;
    for (const id of ids) this.skip.add(`ico:${id}`);
    const defs = ids.map((id) => k.content.get(id)!).filter(Boolean);
    const ref = this.book().iconSheet ? await k.assets.get(this.book().iconSheet!) : undefined;
    k.council.say('artista', 'dipinge', `${defs.length} icone: ${defs.slice(0, 6).map((d) => d.name).join(', ')}${defs.length > 6 ? '…' : ''}`);
    const raw = await new Atelier(k.council).icons(defs.map((d) => ({ name: d.name, description: d.iconPrompt ?? d.description })), ref);
    if (!raw) return;
    const cells = await tools.cutGrid(raw, 4, 4, ICON_PX, { key: true });
    const icons = await Promise.all(cells.slice(0, defs.length).map((c) => (c ? k.assets.put(c) : Promise.resolve(''))));
    const sheet = await k.assets.put(await tools.downscale(raw, 512));
    defs.forEach((d, i) => {
      if (!icons[i]) return;
      const src = k.content.itemSource.get(d.id);
      const entry = src ? k.modules.get(src) : undefined;
      if (!entry) return;
      this.writeJson(entry.manifestPath, (m) => {
        if (m.kind === 'item') m.appearance = { ...m.appearance, sprite: icons[i] };
        else {
          const it = (m.items ?? []).find((x: any) => x.id === d.id);
          if (it) it.icon = icons[i];
        }
      });
    });
    this.writeJson(BOOK_PATH, (b) => (b.iconSheet = sheet));
    this.commit(`${defs.length} icone`);
  }
}
