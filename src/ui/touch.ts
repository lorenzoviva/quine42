// The game by touch (T387): a stick at the bottom left, the scene under the fingers, the keys as buttons at the bottom right.
//
// Only with a finger: the layer shows when a pointer of type `touch` touches (or the main pointer of the device is coarse,
// a phone) and goes away when a mouse clicks; on a desktop nothing changes. Nothing here is a new way into the kernel:
// the stick holds the four screen directions of WASD (`Input.setHeld`, so in a game of many the same `keys`, ADR-0139);
// the buttons press the keys themselves (a keydown on the page, as a real key with nothing in focus, so every window
// that listens to the keys answers as it does); the fingers on the scene are the mouse's buttons (a tap is the left
// one, a long press the right one, one finger dragged the middle one, two fingers the wheel, with its limits:
// src/render/camera.ts). The arithmetic is in src/ui/gestures.ts.

import type { Kernel } from '../kernel/kernel';
import type { Renderer } from '../render/renderer';
import { pinchDistance } from '../render/camera';
import { axesKeys, SCREEN_DIRECTIONS, SceneGestures, stickAxes, stickKnob, type SceneGesture } from './gestures';
import { el } from './dom';

/** A key of the panel of the controls, as a button. */
interface TouchKey {
  code: string;
  key: string;
  shift?: boolean;
  glyph: string;
  label: string;
  /** The menu stays open after it: a key one presses more times in a row. */
  stay?: boolean;
  /** Only for who has been beyond the edge (or a developer), as F2 and G. */
  beyond?: boolean;
}

/** Always on screen: the keys one uses most. */
export const TOUCH_MAIN: readonly TouchKey[] = [
  { code: 'KeyE', key: 'e', glyph: 'E', label: 'usa' },
  { code: 'Space', key: ' ', glyph: '⤒', label: 'salta' },
  { code: 'KeyT', key: 't', glyph: 'T', label: 'magia' },
  { code: 'KeyI', key: 'i', glyph: 'I', label: 'borsa' },
];

/** In the menu (⋯): the other keys of the panel of the controls. */
export const TOUCH_MORE: readonly TouchKey[] = [
  { code: 'KeyP', key: 'p', glyph: 'P', label: 'il tuo viandante' },
  { code: 'KeyF', key: 'f', glyph: 'F', label: 'usa ciò che impugni' },
  { code: 'KeyQ', key: 'q', glyph: 'Q', label: 'incidi le rune' },
  { code: 'KeyX', key: 'x', glyph: 'X', label: 'posa' },
  { code: 'KeyZ', key: 'z', glyph: 'Z', label: 'runa precedente', stay: true },
  { code: 'KeyC', key: 'c', glyph: 'C', label: 'runa successiva', stay: true },
  { code: 'KeyZ', key: 'Z', shift: true, glyph: '⇧Z', label: 'sposta la runa indietro', stay: true },
  { code: 'KeyC', key: 'C', shift: true, glyph: '⇧C', label: 'sposta la runa avanti', stay: true },
  { code: 'Comma', key: ',', glyph: ',', label: 'gira la vista ⟲', stay: true },
  { code: 'Period', key: '.', glyph: '.', label: 'gira la vista ⟳', stay: true },
  { code: 'KeyV', key: 'v', glyph: 'V', label: 'calpestabile' },
  { code: 'KeyR', key: 'r', glyph: 'R', label: "torna com'era" },
  { code: 'KeyH', key: 'h', glyph: 'H', label: 'aiuto' },
  { code: 'KeyG', key: 'g', glyph: 'G', label: 'registro del Concilio', beyond: true },
  { code: 'F2', key: 'F2', glyph: 'F2', label: 'console', beyond: true },
];

const ESCAPE: TouchKey = { code: 'Escape', key: 'Escape', glyph: '✕', label: 'chiudi' };

/** How long the description of what a tap touched stays, in ms. */
const TAP_HINT_MS = 2500;
/** How long after a finger the mouse's own events are the finger's (a browser's long-press menu, a late click), in ms. */
const MOUSE_ECHO_MS = 800;

/** A key pressed as the keyboard presses it: on the page, with nothing in focus, down and up. */
export function pressKey(k: Pick<TouchKey, 'code' | 'key' | 'shift'>): void {
  const init: KeyboardEventInit = { code: k.code, key: k.key, shiftKey: !!k.shift, bubbles: true, cancelable: true };
  document.body.dispatchEvent(new KeyboardEvent('keydown', init));
  document.body.dispatchEvent(new KeyboardEvent('keyup', init));
}

const isField = (t: EventTarget | null): t is HTMLElement =>
  t instanceof HTMLElement && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && !['checkbox', 'radio', 'range', 'button'].includes((t as HTMLInputElement).type)) || t.isContentEditable);

export interface TouchOptions {
  kernel: Kernel;
  renderer: Renderer;
  canvas: HTMLCanvasElement;
  /** Whether a window covers the game (inventory, chat, menu, help…): the stick and the keys give way to «chiudi». */
  covered: () => boolean;
  /** Whether the menu offers the registry and the console (G, F2). */
  beyond: () => boolean;
}

export class TouchControls {
  /** Whether the layer is on: the last pointer was a finger. */
  on = false;
  private root = el('div', { id: 'touch' });
  private stick = el('div', { class: 'stick', 'aria-label': 'cammina' });
  private knob = el('div', { class: 'knob' });
  private pad = el('div', { class: 'pad' });
  private menu = el('div', { class: 'menu', hidden: '' });
  private close = el('button', { class: 'close', type: 'button', 'aria-label': 'chiudi' });
  private gestures = new SceneGestures();
  private stickPointer?: number;
  private pinch?: { distance: number; span: number };
  private pressTimer?: ReturnType<typeof setTimeout>;
  private lastTouch = -Infinity;
  private tapHint?: { x: number; y: number };
  private tapHintUntil = 0;
  private wasCovered = false;

  constructor(private o: TouchOptions) {
    this.stick.append(this.knob);
    for (const k of TOUCH_MAIN) this.pad.append(this.keyButton(k, `key key-${k.code.toLowerCase()}`));
    const more = el('button', { class: 'key more', type: 'button', 'aria-label': 'altri comandi' }, el('b', {}, '⋯'), el('small', {}, 'altro'));
    this.quiet(more);
    more.addEventListener('click', () => this.toggleMenu());
    this.pad.append(more);
    for (const k of TOUCH_MORE) {
      const b = el('button', { type: 'button', 'data-beyond': k.beyond ? '1' : '' }, el('kbd', {}, k.glyph), ` ${k.label}`);
      this.quiet(b);
      b.addEventListener('click', () => {
        pressKey(k);
        if (!k.stay) this.menu.hidden = true;
      });
      this.menu.append(b);
    }
    this.close.append(el('b', {}, ESCAPE.glyph), el('small', {}, ESCAPE.label));
    this.quiet(this.close);
    this.close.addEventListener('click', () => pressKey(ESCAPE));
    this.root.append(this.stick, this.pad, this.menu, this.close);
    document.body.append(this.root);

    this.attachStick();
    this.attachScene();
    this.attachHotbar();
    this.attachKeyboard();
    // A finger turns the layer on, a mouse off; a phone has it from the start.
    window.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType === 'touch') this.show(true);
        else if (e.pointerType === 'mouse') this.show(false);
      },
      true,
    );
    if (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) this.show(true);
  }

  /** Whether a mouse event is the echo of a finger (the browser's long-press menu, a click after a tap): the finger has already done it. */
  ownsMouse(e: MouseEvent): boolean {
    return (e as PointerEvent).pointerType === 'touch' || this.gestures.active || performance.now() - this.lastTouch < MOUSE_ECHO_MS;
  }

  /** Once a frame: windows that open and close, the description of a tap that has had its time. */
  update(now: number = performance.now()): void {
    if (this.tapHint && now > this.tapHintUntil) {
      if (this.o.renderer.mouse === this.tapHint) this.o.renderer.mouse = null;
      this.tapHint = undefined;
    }
    if (!this.on) return;
    const covered = this.o.covered();
    if (covered === this.wasCovered) return;
    this.wasCovered = covered;
    this.root.classList.toggle('covered', covered);
    if (covered) {
      this.releaseStick();
      this.menu.hidden = true;
    }
  }

  private show(on: boolean): void {
    if (on === this.on) return;
    this.on = on;
    document.documentElement.classList.toggle('touch', on);
    if (!on) {
      this.releaseStick();
      this.menu.hidden = true;
    }
    const press = document.querySelector('#intro .press');
    if (press) press.textContent = on ? 'tocca per entrare' : 'premi un tasto';
  }

  /** A button that does not take the focus (a field keeps it) nor leaves a mouse event behind. */
  private quiet(b: HTMLElement): void {
    b.addEventListener('pointerdown', (e) => e.preventDefault());
    b.tabIndex = -1;
  }

  private keyButton(k: TouchKey, cls: string): HTMLButtonElement {
    const b = el('button', { class: cls, type: 'button', 'aria-label': k.label }, el('b', {}, k.glyph), el('small', {}, k.label));
    this.quiet(b);
    b.addEventListener('click', () => {
      this.menu.hidden = true;
      pressKey(k);
    });
    return b;
  }

  private toggleMenu(): void {
    const opening = this.menu.hidden;
    if (opening) {
      const beyond = this.o.beyond();
      for (const b of this.menu.querySelectorAll<HTMLElement>('[data-beyond="1"]')) b.hidden = !beyond;
    }
    this.menu.hidden = !opening;
  }

  // --- The stick: the four directions of WASD, held while the thumb is out of the dead zone.

  private attachStick(): void {
    const s = this.stick;
    const move = (e: PointerEvent) => {
      const r = s.getBoundingClientRect();
      const radius = r.width / 2;
      const dx = e.clientX - (r.left + radius);
      const dy = e.clientY - (r.top + radius);
      const knob = stickKnob(dx, dy, radius);
      this.knob.style.transform = `translate(${knob.x}px, ${knob.y}px)`;
      const keys = axesKeys(stickAxes(dx, dy, radius));
      for (const d of SCREEN_DIRECTIONS) this.o.kernel.input.setHeld(d, keys.includes(d));
      s.classList.toggle('held', keys.length > 0);
    };
    s.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.stickPointer !== undefined) return;
      this.stickPointer = e.pointerId;
      this.menu.hidden = true;
      try {
        s.setPointerCapture(e.pointerId);
      } catch {
        /* a pointer the browser does not know (one made by a test) */
      }
      move(e);
    });
    s.addEventListener('pointermove', (e) => e.pointerId === this.stickPointer && move(e));
    const end = (e: PointerEvent) => e.pointerId === this.stickPointer && this.releaseStick();
    s.addEventListener('pointerup', end);
    s.addEventListener('pointercancel', end);
    s.addEventListener('lostpointercapture', end);
  }

  private releaseStick(): void {
    if (this.stickPointer === undefined) return;
    this.stickPointer = undefined;
    this.knob.style.transform = '';
    this.stick.classList.remove('held');
    for (const d of SCREEN_DIRECTIONS) this.o.kernel.input.setHeld(d, false);
  }

  // --- The scene: the fingers as the mouse's buttons and wheel.

  private attachScene(): void {
    const c = this.o.canvas;
    const at = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    c.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      // No mouse events after it (the tap is the finger's) and no text to select.
      e.preventDefault();
      this.menu.hidden = true;
      try {
        c.setPointerCapture(e.pointerId);
      } catch {
        /* a pointer the browser does not know (one made by a test) */
      }
      const p = at(e);
      this.apply(this.gestures.down(e.pointerId, p.x, p.y, performance.now()));
      this.armPress();
    });
    c.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch') return;
      const p = at(e);
      this.apply(this.gestures.move(e.pointerId, p.x, p.y, performance.now()));
    });
    const up = (cancel: boolean) => (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      this.lastTouch = performance.now();
      this.apply(this.gestures.up(e.pointerId, this.lastTouch, cancel));
    };
    c.addEventListener('pointerup', up(false));
    c.addEventListener('pointercancel', up(true));
    window.addEventListener('blur', () => this.apply(this.gestures.reset()));
  }

  /** The long press comes by itself, without waiting for the finger to move or lift. */
  private armPress(): void {
    clearTimeout(this.pressTimer);
    const at = this.gestures.pressAt;
    if (at === undefined) return;
    this.pressTimer = setTimeout(() => this.apply(this.gestures.due(performance.now())), Math.max(0, at - performance.now()) + 5);
  }

  private apply(gestures: SceneGesture[]): void {
    const { kernel, renderer } = this.o;
    for (const g of gestures) {
      switch (g.kind) {
        case 'tap': {
          // The left button there, and what the mouse would say passing over it.
          const r = renderer.toReal(g.x, g.y);
          kernel.clickStudio(r.x, r.y);
          this.tapHint = { x: g.x, y: g.y };
          this.tapHintUntil = performance.now() + TAP_HINT_MS;
          renderer.mouse = this.tapHint;
          break;
        }
        case 'press': {
          // The right button there: the menu of a tile near you.
          const r = renderer.toReal(g.x, g.y);
          kernel.contextAt(r.x, r.y);
          try {
            navigator.vibrate?.(12);
          } catch {
            /* a browser that does not vibrate */
          }
          break;
        }
        case 'orbitStart':
          renderer.dragStart(g.x, g.y);
          break;
        case 'orbit':
          renderer.dragMove(g.x, g.y);
          break;
        case 'orbitEnd':
          renderer.dragEnd();
          break;
        case 'pinchStart':
          this.pinch = { distance: renderer.distance, span: g.span };
          break;
        case 'pinch':
          // As the wheel: not while a window has the keys.
          if (this.pinch && kernel.input.enabled) renderer.zoomTo(pinchDistance(this.pinch.distance, this.pinch.span, g.span, renderer.canFreeOrbit()));
          break;
        case 'pinchEnd':
          this.pinch = undefined;
          break;
      }
    }
    if (!this.gestures.active) clearTimeout(this.pressTimer);
  }

  // --- The hotbar: its six cells are 1–6.

  private attachHotbar(): void {
    const bar = document.getElementById('hotbar');
    bar?.addEventListener('click', (e) => {
      if (!this.on) return;
      const cell = (e.target as HTMLElement | null)?.closest?.('.hot');
      const i = cell ? [...bar.children].indexOf(cell) : -1;
      if (i >= 0 && i < 9) pressKey({ code: `Digit${i + 1}`, key: String(i + 1) });
    });
  }

  // --- The keyboard on the screen: the field one writes in stays above it.

  private attachKeyboard(): void {
    const html = document.documentElement;
    const vv = window.visualViewport;
    // What the keyboard hides of the page, where the browser does not make the page smaller (`interactive-widget`, in index.html).
    const fit = () => {
      const hidden = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
      html.style.setProperty('--keyboard', `${hidden}px`);
    };
    vv?.addEventListener('resize', fit);
    vv?.addEventListener('scroll', fit);
    document.addEventListener('focusin', (e) => {
      if (!this.on || !isField(e.target)) return;
      html.classList.add('typing');
      const field = e.target;
      // After the keyboard has come up: the field in sight within its window.
      setTimeout(() => {
        fit();
        if (document.activeElement === field) field.scrollIntoView({ block: 'nearest' });
      }, 350);
    });
    document.addEventListener('focusout', (e) => {
      if (isField(e.target)) html.classList.remove('typing');
    });
  }
}

