// The profile page of the site (T102, ADR-0095): signing in (Firebase Auth with Google or anonymously, the game's own
// `src/session/login.ts`; a server without accounts takes a wanderer's id), who the wanderer is in a universe (account,
// whether they are in the world now, credits) and their look: name, cloak, seed of the program `viandante` and a few
// lines, with a three.js preview of the real model (the universe's program run by src/mj/, meshed by `meshVoxels`).
// What is chosen goes to the server (/api/viandante, server/wanderer.ts), which repairs it as the world does.

import * as THREE from 'three';
import { makeRenderer } from '../src/render/gpu';
import { runForm, VPT } from '../src/kernel/forms';
import { meshVoxels } from '../src/mj/mesh';
import { boxOf, classOf } from '../src/mj/classes';
import { PROFILE_LIMITS, repairProfile, type Profile } from '../src/kernel/wanderers';
import { keepProfile } from '../src/session/socket';
import { $, alertBox, formatCredits, hideAlert, initNav, pageLogin, pageSignOut, pickUniverse, playLink, universes, UNIVERSE_KEY, store, stored, type Who } from './shared';
import { SKIN_EVENT, skinColor } from './skin-core';

export { formatCredits, pickUniverse, playLink };

/** What the server says of a wanderer (server/wanderer.ts, `WandererView`). */
export interface WandererView {
  id: string;
  universo: string;
  account: 'google' | 'anonimo' | 'locale';
  anonimo: boolean;
  profilo?: Profile;
  crediti: number;
  nelMondo: boolean;
  noto: boolean;
  modello?: { xml: string; semi: number; tinta?: string };
}

/** The cloaks offered at a click: the site's neons and the world's own rust. All within what the world accepts. */
export const CLOAKS = ['#ff2a85', '#00f0ff', '#ffe600', '#05ffa1', '#9d00ff', '#ff6c00', '#c06030'];
/** The colour the world gives a wanderer who chose none (the profile panel of the game, T44a). */
export const DEFAULT_CLOAK = '#c06030';
/** The colour the world will really paint: a too dark, light or dull one is moved within the limits (`repairProfile`). */
export function worldCloak(hex: string): string {
  return repairProfile({ tinta: hex }, 'sito', [], 1).profilo.tint ?? DEFAULT_CLOAK;
}

/** The seed of a profile within the program's seeds (1 … n). */
export function clampSeed(seed: unknown, seeds: number): number {
  const n = Math.max(1, Math.floor(seeds) || 1);
  const s = Math.floor(Number(seed));
  return Number.isFinite(s) && s >= 1 ? Math.min(n, s) : 1;
}

// ── The 3D preview ──────────────────────────────────────────────────────────────────────────────────────────────────

/** The wanderer's model in three.js: dragged it turns, left alone it turns slowly; it sleeps off screen. */
class AvatarViewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  private turntable = new THREE.Group();
  private mesh?: THREE.Mesh;
  private cache = new Map<string, THREE.BufferGeometry>();
  private material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  private yaw = 0.6;
  private spin = 0.35;
  private dragging = false;
  private lastX = 0;
  private visible = true;
  private last = performance.now();
  private height = 1.5;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = makeRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x2a1440, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 4, 3);
    const rim = new THREE.DirectionalLight(skinColor('--skin-accent-2', '#ff2a85'), 1.4);
    rim.position.set(-3, 2, -2);
    this.scene.add(key, rim);
    // A floor ring of neon under the feet.
    const ringColor = new THREE.MeshBasicMaterial({ color: skinColor('--skin-accent', '#00f0ff'), side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.62, 48), ringColor);
    // The stage follows the picker.
    document.addEventListener(SKIN_EVENT, () => {
      rim.color.set(skinColor('--skin-accent-2', '#ff2a85'));
      ringColor.color.set(skinColor('--skin-accent', '#00f0ff'));
    });
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    this.scene.add(ring, this.turntable);
    this.frame();

    canvas.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      this.yaw += (e.clientX - this.lastX) * 0.012;
      this.lastX = e.clientX;
    });
    const up = () => (this.dragging = false);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    new ResizeObserver(() => this.resize()).observe(canvas.parentElement ?? canvas);
    new IntersectionObserver((es) => (this.visible = es.some((e) => e.isIntersecting))).observe(canvas);
    this.resize();
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - this.last) / 1000);
      this.last = t;
      if (this.visible && !document.hidden) {
        if (!this.dragging) this.yaw += this.spin * dt;
        this.turntable.rotation.y = this.yaw;
        this.renderer.render(this.scene, this.camera);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private resize(): void {
    const box = this.canvas.parentElement ?? this.canvas;
    const w = Math.max(1, box.clientWidth);
    const h = Math.max(1, box.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** The camera frames a figure of this height. */
  private frame(): void {
    const h = this.height;
    this.camera.position.set(0, h * 0.62, h * 2.6);
    this.camera.lookAt(0, h * 0.48, 0);
  }

  /** Shows the program with a seed and a cloak. Returns false if the program does not run. */
  show(look: NonNullable<WandererView['modello']>, seed: number, cloak: string): boolean {
    const key = `${seed}#${cloak}#${look.xml.length}`;
    let geo = this.cache.get(key);
    if (!geo) {
      try {
        const persona = classOf('persona');
        const size = /<\w+[^>]*\ssize="/.test(look.xml) || !persona ? undefined : boxOf(persona);
        const r = runForm({ xml: look.xml, seed, vpt: VPT, model: 'viandante', ...(size ? { size } : {}), ...(look.tinta ? { tint: { symbol: look.tinta, color: cloak } } : {}) });
        const m = meshVoxels(r.grid, r.palette, { vpt: VPT });
        geo = new THREE.BufferGeometry();
        // Engine axes (x, y, z up) are three.js (x, z, y) in meshVoxels already.
        geo.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
        geo.setIndex(new THREE.BufferAttribute(m.indices, 1));
        geo.computeBoundingBox();
        this.cache.set(key, geo);
      } catch {
        return false;
      }
    }
    if (!this.mesh) {
      this.mesh = new THREE.Mesh(geo, this.material);
      this.turntable.add(this.mesh);
    } else this.mesh.geometry = geo;
    const bb = geo.boundingBox;
    this.height = bb ? Math.max(0.5, bb.max.y - bb.min.y) : 1.5;
    this.frame();
    return true;
  }
}

// ── The page ────────────────────────────────────────────────────────────────────────────────────────────────────────

async function askServer(who: Who, universo: string, profilo?: Partial<Profile>): Promise<{ ok: boolean; viandante?: WandererView; profilo?: Profile; riparato?: string[]; motivo?: string; status: number }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (who.signed) headers.Authorization = `Bearer ${who.signed.token}`;
  const q = new URLSearchParams({ universo });
  if (who.localId) q.set('viandante', who.localId);
  try {
    const r = profilo
      ? await fetch('/api/viandante', { method: 'POST', headers, body: JSON.stringify({ universo, profilo, ...(who.localId ? { viandante: who.localId } : {}) }) })
      : await fetch(`/api/viandante?${q}`, { headers, cache: 'no-store' });
    const body = (await r.json().catch(() => ({}))) as { ok?: boolean; viandante?: WandererView; profilo?: Profile; riparato?: string[]; motivo?: string };
    return { ...body, ok: r.ok && !!body.ok, status: r.status };
  } catch {
    return { ok: false, motivo: 'il mondo non risponde', status: 0 };
  }
}

class ProfilePage {
  private view?: WandererView;
  private viewer?: AvatarViewer;
  private seed = 1;
  private cloak = DEFAULT_CLOAK;
  private name = $<HTMLInputElement>('profile-name');
  private intro = $<HTMLTextAreaElement>('profile-intro');
  private range = $<HTMLInputElement>('seed-range');
  private custom = $<HTMLInputElement>('cloak-custom');
  private universe = $<HTMLSelectElement>('universe-select');

  constructor(private who: Who) {
    this.name.maxLength = PROFILE_LIMITS.nome[1];
    this.intro.maxLength = PROFILE_LIMITS.presentazione;
    this.intro.rows = PROFILE_LIMITS.righe;
    try {
      this.viewer = new AvatarViewer($<HTMLCanvasElement>('avatar-canvas'));
    } catch {
      $('avatar-badge').textContent = 'SENZA 3D';
    }
    const palette = $('cloak-palette');
    for (const c of CLOAKS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'color-swatch';
      b.style.background = c;
      b.dataset.color = c;
      b.title = c;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', `mantello ${c}`);
      b.onclick = () => this.setCloak(c);
      palette.append(b);
    }
    this.custom.addEventListener('input', () => this.setCloak(this.custom.value));
    this.range.addEventListener('input', () => this.setSeed(Number(this.range.value)));
    $('btn-rand-seed').onclick = () => {
      const n = this.view?.modello?.semi ?? 1;
      let s = 1 + Math.floor(Math.random() * n);
      if (n > 1 && s === this.seed) s = (s % n) + 1;
      this.setSeed(s);
    };
    $('btn-save').onclick = () => void this.save();
    this.universe.onchange = () => void this.load(this.universe.value);
    $('btn-sign-out').onclick = () => void this.signOut();
    $('nav-out').onclick = () => void this.signOut();
    $('nav-out').hidden = false;
    const link = $('btn-link-google');
    link.onclick = () => {
      this.who.signed?.linkGoogle().catch((e: Error) => alertBox('error', 'ZAP!', e.message));
    };
  }

  async start(): Promise<void> {
    const list = await universes();
    if (!list) return alertBox('error', 'ZAP!', 'Il mondo non risponde: riprova tra poco.');
    if (!list.length) return alertBox('warning', 'NESSUN UNIVERSO', 'Su questo server non c’è ancora nessun universo: entra nel gioco per crearne uno.');
    this.universe.replaceChildren(
      ...list.map((name) => {
        const o = document.createElement('option');
        o.value = name;
        o.textContent = name;
        return o;
      }),
    );
    const chosen = pickUniverse(list, new URLSearchParams(location.search).get('universo'), stored(UNIVERSE_KEY))!;
    this.universe.value = chosen;
    await this.load(chosen);
  }

  private async load(universo: string): Promise<void> {
    store(UNIVERSE_KEY, universo);
    const r = await askServer(this.who, universo);
    if (!r.ok || !r.viandante) {
      $('profile-grid').hidden = true;
      if (r.status === 401) return alertBox('error', 'ZAP!', 'Accesso scaduto: ricarica la pagina per entrare di nuovo.');
      return alertBox('error', 'ZAP!', r.motivo ?? 'Non è stato possibile leggere il viandante.');
    }
    hideAlert();
    this.fill(r.viandante);
    $('profile-grid').hidden = false;
  }

  private fill(v: WandererView): void {
    this.view = v;
    const p = v.profilo;
    $('wanderer-id').textContent = v.id;
    const badge = $('account-badge');
    badge.className = `comic-badge ${v.account === 'google' ? 'green' : v.account === 'anonimo' ? 'yellow' : 'purple'}`;
    badge.textContent = v.account === 'google' ? 'ACCOUNT GOOGLE' : v.account === 'anonimo' ? 'ANONIMO' : 'SENZA ACCOUNT';
    $('account-kind').textContent =
      v.account === 'google' ? 'Google: il viandante ti segue ovunque' : v.account === 'anonimo' ? 'Anonimo: legalo a Google per non perderlo' : 'Identificativo diretto (server senza account)';
    $('wanderer-name').textContent = p?.name ?? 'non ancora scelto';
    $('wanderer-where').textContent = v.nelMondo ? 'sì, in cammino adesso' : v.noto ? 'no, il viandante riposa' : 'non è mai entrato in questo universo';
    $('wallet-amount').textContent = formatCredits(v.crediti);
    $('wallet-note').textContent = v.anonimo ? 'Un viandante anonimo non ha crediti: gioca con i modelli locali.' : 'Si ricarica dalla pagina dei crediti.';
    $('btn-link-google').hidden = v.account !== 'anonimo';
    const recharge = $<HTMLAnchorElement>('btn-recharge');
    recharge.hidden = v.anonimo;
    recharge.href = `./pagamenti.html?${new URLSearchParams({ universo: v.universo, ...(v.account === 'locale' ? { viandante: v.id } : {}) })}`;
    $<HTMLAnchorElement>('btn-play-universe').href = playLink(v.universo, v);
    $<HTMLAnchorElement>('nav-play').href = playLink(v.universo, v);
    const semi = v.modello?.semi ?? 1;
    this.range.max = String(semi);
    this.range.disabled = semi <= 1;
    this.name.value = p?.name && p.name !== 'Viandante' ? p.name : '';
    this.intro.value = p?.introduction ?? '';
    this.seed = clampSeed(p?.seed ?? 1, semi);
    this.setCloak(p?.tint ?? DEFAULT_CLOAK, false);
    this.setSeed(this.seed);
  }

  private setSeed(seed: number): void {
    this.seed = clampSeed(seed, this.view?.modello?.semi ?? 1);
    this.range.value = String(this.seed);
    $('seed-badge').textContent = `SEME ${this.seed}`;
    this.paint();
  }

  private setCloak(hex: string, paint = true): void {
    const real = worldCloak(hex);
    this.cloak = real;
    this.custom.value = real;
    const label = $('current-color-label');
    label.textContent = real === hex.toLowerCase() ? real : `${real} (aggiustato: ${hex.toLowerCase()} è troppo scuro, chiaro o spento)`;
    label.style.color = real;
    for (const b of document.querySelectorAll<HTMLElement>('.color-swatch')) {
      const on = b.dataset.color === real;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-checked', String(on));
    }
    if (paint) this.paint();
  }

  private paint(): void {
    const look = this.view?.modello;
    if (!look || !this.viewer) return;
    if (!this.viewer.show(look, this.seed, this.cloak)) $('avatar-badge').textContent = 'MODELLO NON DISPONIBILE';
  }

  private async save(): Promise<void> {
    const v = this.view;
    if (!v) return;
    const btn = $<HTMLButtonElement>('btn-save');
    btn.classList.add('is-loading');
    btn.disabled = true;
    const r = await askServer(this.who, v.universo, { name: this.name.value, seed: this.seed, tint: this.cloak, introduction: this.intro.value });
    btn.classList.remove('is-loading');
    btn.disabled = false;
    if (!r.ok || !r.profilo) {
      if (r.status === 401) return alertBox('error', 'ZAP!', 'Accesso scaduto: ricarica la pagina per entrare di nuovo.');
      return alertBox('error', 'ZAP!', r.motivo ?? 'Non è stato possibile salvarlo.');
    }
    // The game's client brings this profile too when it enters (T44c); the server's wins anyway.
    keepProfile(v.universo, v.id, r.profilo);
    if (r.viandante) this.fill(r.viandante);
    const fixed = r.riparato?.length ? ` Il mondo ha aggiustato: ${r.riparato.join('; ')}.` : '';
    alertBox(fixed ? 'warning' : 'success', 'SALVATO!', `Il viandante è pronto per il cammino.${fixed}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private signOut(): Promise<void> {
    return pageSignOut(this.who);
  }
}

async function start(): Promise<void> {
  initNav();
  const who = await pageLogin($('profile-grid'));
  if (who) await new ProfilePage(who).start();
}

if (typeof document !== 'undefined' && document.getElementById('profile-grid')) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void start());
  else void start();
}
