// The corona and the studio as the renderer draws them (T41): the ring of the campus, the rooms with their
// showcases, the situation table, the wall of screens, the chain, the bench and the Council's avatars. Only the
// master's client loads this module (with the rest of src/master.ts): a player's never sees the corona.

import * as THREE from 'three';
import type { Kernel } from '../kernel/kernel';
import { cellNear } from '../kernel/corona';
import { animateRing, Avatars, buildCoronaRing, buildRoom, buildShowcase, buildSituation, campusKey } from './corona3d';
import { ScreenWall } from './screens';
import { ChainView } from './chain';
import { BenchView } from './bench';
import { TornioView } from './tornio';
import type { Overlay } from './overlay';

export type StudioRoom = ReturnType<Kernel['corona']['roomAt']>;

export class CoronaView {
  /** Everything of the corona hangs from here, in real space. */
  readonly root = new THREE.Group();
  private avatars = new Avatars(this.root);
  private ring?: THREE.Group;
  /** What the campus wore when the ring was built (its buildings' models). */
  private ringKey = '';
  private rooms = new Map<string, { group: THREE.Group; globe?: THREE.Object3D; version: number }>();
  /** The marks on the Direction's situation table (T46a): what they show, when it was last read, what pulses. */
  private sit?: { key: string; at: number; group: THREE.Group; pulse: THREE.Object3D[] };
  /** The Direction's wall of screens (T46b), for the room it stands in. */
  private wall?: { room: string; view: ScreenWall };
  /** The Systems Room's chain (T27a), for the room it stands in. */
  private chain?: { room: string; view: ChainView };
  /** The Systems Room's bench (T27b): built again when the case, its code or its run change. */
  private bench?: { key: string; at: number; view: BenchView };
  /** The Sculptor's lathe in the Artist's gallery (T48a): turntable rotating with the selected model. */
  private tornio?: { key: string; at: number; view: TornioView };
  /** What the showcases of the studio show (T21), by building: rebuilt when the choice or the models change. */
  private shows = new Map<string, { key: string; group: THREE.Group; spin?: THREE.Object3D; bubbles?: THREE.Object3D[]; silo: boolean }>();

  constructor(private kernel: Kernel) {
    this.kernel.bus.on('studio:rules_wall', () => {
      const key = 'mondo#0';
      const r = this.rooms.get(key);
      if (r) {
        this.root.remove(r.group);
        this.rooms.delete(key);
      }
    });
  }

  /** The universe's files changed: the ring and the rooms are built again. */
  reset(): void {
    if (this.ring) this.root.remove(this.ring);
    this.ring = undefined;
    for (const r of this.rooms.values()) this.root.remove(r.group);
    this.rooms.clear();
    for (const v of this.shows.values()) this.root.remove(v.group);
    this.shows.clear();
    if (this.tornio) {
      this.root.remove(this.tornio.view.group);
      this.tornio.view.dispose();
      this.tornio = undefined;
    }
  }

  update(t: number, studio: StudioRoom, revealed: boolean, interior: boolean): void {
    const k = this.kernel;
    const campus = revealed ? campusKey(k) : this.ringKey;
    if (this.ring && campus !== this.ringKey) {
      this.root.remove(this.ring);
      this.ring = undefined;
    }
    if (revealed && !this.ring) {
      this.root.add((this.ring = buildCoronaRing(k)));
      this.ringKey = campus;
    }
    if (this.ring) {
      this.ring.visible = revealed && !interior;
      if (this.ring.visible) animateRing(this.ring, t, k);
    }
    for (const [key, r] of this.rooms) r.group.visible = !!studio && key === `${studio.building.id}#${studio.floor.index}`;
    if (studio) {
      const key = `${studio.building.id}#${studio.floor.index}`;
      let r = this.rooms.get(key);
      // A room with things on show is built again when their models are ready.
      if (r && r.version !== k.forms.version && studio.floor.items.some((i) => i.kind === 'sprite')) {
        this.root.remove(r.group);
        r = undefined;
      }
      if (!r) {
        this.rooms.set(key, (r = { ...buildRoom(k, studio.building, studio.floor), version: k.forms.version }));
        this.root.add(r.group);
      }
      r.group.visible = true;
      if (r.globe) r.globe.rotation.y = t * 0.4;
    }
    for (const [id, v] of this.shows) v.group.visible = studio?.building.id === id && studio.floor.index === 0;
    const show = studio?.floor.items.find((i) => i.kind === 'showcase');
    if (studio && show) {
      const now = k.showcaseOf(studio.building.id);
      // A place in miniature (T26) read from its saved plan arrives later.
      const key = now ? `${now.entry.id}|${k.forms.version}|${now.entry.place ? `${k.miniatureVersion}|${now.phase}` : 0}` : '';
      let v = this.shows.get(studio.building.id);
      if (v?.key !== key) {
        if (v) this.root.remove(v.group);
        v = undefined;
        if (now) {
          v = { key, ...buildShowcase(k, show, now.entry, studio.building.color, now.phase), silo: show.device === 'silos' };
          this.shows.set(studio.building.id, v);
          this.root.add(v.group);
        } else this.shows.delete(studio.building.id);
      }
      if (v?.spin) {
        // In the silo's thick liquid (T23) it turns and floats slowly, swaying a little.
        v.spin.rotation.y = t * (v.silo ? 0.25 : 0.6);
        if (v.silo) {
          v.spin.position.y = 0.55 + Math.sin(t * 0.7) * 0.12;
          v.spin.rotation.z = Math.sin(t * 0.45) * 0.05;
        }
      }
      for (const b of v?.bubbles ?? []) {
        const { x, z, speed, phase } = b.userData as { x: number; z: number; speed: number; phase: number };
        b.position.set(x + Math.sin(t * 0.8 + phase * 9) * 0.05, 0.35 + ((phase + t * speed * 0.5) % 1) * 1.9, z);
      }
    }
    const table = studio?.floor.items.find((i) => i.kind === 'situazione');
    if (this.sit) this.sit.group.visible = !!table;
    if (studio && table) {
      // Read again once a second; built again only when something changed.
      if (!this.sit || t - this.sit.at > 1) {
        const s = k.situation();
        const key = `${table.x},${table.y}|${JSON.stringify(s)}`;
        if (this.sit?.key !== key) {
          if (this.sit) this.root.remove(this.sit.group);
          this.sit = { key, at: t, ...buildSituation(table, s, studio.building.color) };
          this.root.add(this.sit.group);
        } else this.sit.at = t;
      }
      for (const [i, m] of this.sit.pulse.entries()) m.scale.y = 1 + 2.5 * (0.5 + 0.5 * Math.sin(t * 4 + i));
    }
    const wall = studio?.floor.items.filter((i) => i.kind === 'parete') ?? [];
    const here = studio ? `${studio.building.id}#${studio.floor.index}` : '';
    if (this.wall && (this.wall.room !== here || !wall.length)) {
      this.root.remove(this.wall.view.group);
      this.wall.view.dispose();
      this.wall = undefined;
    }
    if (studio && wall.length) {
      if (!this.wall) {
        this.wall = { room: here, view: new ScreenWall(wall, studio.building.color, studio.floor) };
        this.root.add(this.wall.view.group);
      }
      // Read twice a second (the arrows answer at once enough); a field is drawn again only when it changed.
      if (t - this.wall.view.at > 0.5) {
        this.wall.view.at = t;
        this.wall.view.draw(k.screens());
      }
      this.wall.view.blink(t);
    }
    const stations = studio?.floor.items.filter((i) => i.kind === 'stazione') ?? [];
    // Built again when a system joins or leaves the chain.
    const line = `${here}|${stations.map((i) => `${i.target}@${i.x}+${i.w}`).join(',')}`;
    if (this.chain && (this.chain.room !== line || !stations.length)) {
      this.root.remove(this.chain.view.group);
      this.chain.view.dispose();
      this.chain = undefined;
    }
    if (studio && stations.length) {
      if (!this.chain) {
        this.chain = { room: line, view: new ChainView(stations, studio.building.color) };
        this.root.add(this.chain.view.group);
      }
      // The measures change once a second (the meter's window).
      if (t - this.chain.view.at > 0.5) {
        this.chain.view.at = t;
        this.chain.view.draw(k.chain());
      }
      this.chain.view.run(t);
    }
    const bench = studio?.floor.items.find((i) => i.kind === 'banco');
    if (this.bench && !bench) {
      this.root.remove(this.bench.view.group);
      this.bench.view.dispose();
      this.bench = undefined;
    }
    if (studio && bench && (!this.bench || t - this.bench.at > 0.3)) {
      // Read three times a second: the run arrives from the kernel in miniature a moment after the case is chosen.
      const now = k.benchOf();
      const key = now ? `${here}|${now.key}|${!!now.run}` : '';
      if (this.bench?.key !== key) {
        if (this.bench) {
          this.root.remove(this.bench.view.group);
          this.bench.view.dispose();
          this.bench = undefined;
        }
        if (now) {
          const arrow = (kind: string) => studio.floor.items.find((i) => i.kind === kind && i.target === 'banco');
          this.bench = { key, at: t, view: new BenchView(bench, now, studio.building.color, arrow('prev'), arrow('next')) };
          this.root.add(this.bench.view.group);
        }
      } else if (this.bench) this.bench.at = t;
    }
    this.bench?.view.update(t);
    const tornio = studio?.floor.items.find((i) => i.kind === 'tornio');
    if (this.tornio && !tornio) {
      this.root.remove(this.tornio.view.group);
      this.tornio.view.dispose();
      this.tornio = undefined;
    }
    if (studio && tornio && (!this.tornio || t - this.tornio.at > 0.3)) {
      const now = k.tornioOf();
      const key = now ? `${here}|${now.entry.id}|${now.index}` : '';
      if (this.tornio?.key !== key) {
        if (this.tornio) {
          this.root.remove(this.tornio.view.group);
          this.tornio.view.dispose();
          this.tornio = undefined;
        }
        if (now) {
          const arrow = (kind: string) => studio.floor.items.find((i) => i.kind === kind && i.target === 'tornio');
          this.tornio = { key, at: t, view: new TornioView(tornio, now, studio.building.color, arrow('prev'), arrow('next')) };
          this.root.add(this.tornio.view.group);
        }
      } else if (this.tornio) this.tornio.at = t;
    }
    this.tornio?.view.update(t);
    this.avatars.update(k, t);
  }

  /** The names over the doors, the Council at work, and in a room what is near and what changed lately. */
  overlay(o: Overlay, t: number, studio: StudioRoom, revealed: boolean, interior: boolean, distance: number): void {
    const k = this.kernel;
    if (revealed && !interior) for (const b of k.corona.buildings) o.label(b.door.x + 0.5, 2.1, b.door.y + 0.5, b.floors.length > 1 ? `${b.name} (${b.floors.length} piani)` : b.name, b.color, 12, true);
    for (const a of k.archive.avatars.values()) {
      if (Math.hypot(a.x - k.playerPos().x, a.y - k.playerPos().y) > distance * 2) continue;
      o.label(a.x, 1.45, a.y, `${a.sigil} ${a.name}`, a.color, 11);
      if (a.say) o.bubble(a.x, 1.75, a.y, a.say, true);
    }
    if (!studio) return;
    const near = k.corona.itemNear(k.playerPos().x, k.playerPos().y);
    const recent = k.recentChanges();
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    for (const it of studio.floor.items) if (it.path && recent.has(it.path)) o.cell(it.x, it.y, `rgba(255, 220, 120, ${0.4 + 0.4 * pulse})`, `rgba(255, 220, 120, ${0.1 + 0.15 * pulse})`, 0.4);
    if (near) {
      const c = cellNear(near, k.playerPos().x, k.playerPos().y);
      o.cell(c.x, c.y, '#ffcf5c', undefined, 0.42);
    }
    const fl = studio.floor;
    o.title(`${studio.building.name.toUpperCase()}${studio.building.floors.length > 1 ? `  ·  PIANO ${fl.index + 1}/${studio.building.floors.length}` : ''}`, studio.building.color);
    const shown = near?.kind === 'showcase' ? k.showcaseOf(near.target!) : undefined;
    const tried = near?.kind === 'banco' ? k.benchOf() : undefined;
    const read = near?.kind === 'leggio' ? k.bibleOf() : undefined;
    const sculpted = near?.kind === 'tornio' ? k.tornioOf() : undefined;
    if (shown) o.caption(`E: guarda «${shown.entry.label}» (${shown.index + 1}/${shown.count})`);
    else if (tried) o.caption(`E: il banco di prova, ${tried.entry.name}: «${tried.entry.case.titolo}» (${tried.index + 1}/${tried.count})`);
    else if (read) o.caption(`E: sfoglia la bibbia, «${read.page.titolo}» (${read.index + 1}/${read.count})`);
    else if (sculpted) o.caption(`E: il tornio dello Scultore, «${sculpted.entry.name}» (${sculpted.index + 1}/${sculpted.count})`);
    else if (near?.kind === 'lastra') o.caption(near.rule ? `E: la tavola della regola «${near.rule.testo}» (${near.rule.possibile ? 'si può' : 'non si può'}${near.marked ? ' · recente' : ''})` : `E: ${near.label}`);
    else if (near && near.kind !== 'desk') o.caption(`E: ${near.kind === 'file' ? `apri ${near.label}` : near.kind === 'sprite' || near.kind === 'tile' || near.kind === 'layout' ? `guarda «${near.label}»` : near.label}`);
  }
}
