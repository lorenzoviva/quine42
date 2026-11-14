// Every window of the game has a way out by a finger (T393): a cross at the top right, big enough for a finger, and,
// where nothing would be lost, a touch outside it. The census below says, window by window, how it opens and how it
// closes; tests/pannelli-tocco.test.ts holds it to that. With a mouse nothing changes but the cross where there was none.

import { el } from './dom';

/** Whether a touch outside a window closes it: always, never (what is in it would be lost), or while nothing is written in it. */
export type Outside = 'yes' | 'no' | 'unlessTyped';

/** A way out of a window by a finger. None of them is a key. */
export type TouchExit = 'cross' | 'outside' | 'choice' | 'turn' | 'self';

export interface PanelEntry {
  /** A short id, for the registry of the touches outside. */
  id: string;
  /** Its name, as the author calls it. */
  name: string;
  /** What it is: a window over the game, a choice that has to be made, or something that does not cover the game. */
  kind: 'window' | 'choice' | 'light';
  /** The element that is shown and hidden. */
  root: string;
  /** The part of it that is the window (outside it is outside); the root itself if absent. */
  window?: string;
  /** Where its cross is built (`closeButton`), for the windows. */
  file?: string;
  opens: string;
  /** How it closed by a finger before T393. */
  before: string;
  /** How it closes by a finger now (besides the cross and the touch outside, where they are). */
  closes: string;
  outside: Outside;
  /** Why a touch outside does not close it. */
  why?: string;
  /** For a choice or what does not cover the game: its own way out, without a key. */
  exit?: Exclude<TouchExit, 'cross' | 'outside'>;
}

const INVENTORY_WHY = 'con qualcosa scritto in «Altro…» (Crea, combinare) un tocco fuori lo perderebbe';

/** The windows of the game and how a finger gets out of each (the census of T393). */
export const PANELS: readonly PanelEntry[] = [
  {
    id: 'inventory',
    name: 'inventario',
    kind: 'window',
    root: '#inventory',
    window: '.window',
    file: 'src/ui/inventory.ts',
    opens: 'I o Tab, il pulsante «borsa»',
    before: 'il ✕ «chiudi» dei pulsanti al tocco, un tocco sul velo attorno se c\'era posto',
    closes: 'la croce, il ✕ dei pulsanti, un tocco fuori, I, Tab, Esc',
    outside: 'unlessTyped',
    why: INVENTORY_WHY,
  },
  { id: 'bag', name: 'borsa delle rune e le sacche', kind: 'window', root: '#inventory', window: '.window', file: 'src/ui/inventory.ts', opens: 'aprire una sacca o la borsa delle rune', before: 'come l\'inventario; «Chiudi» torna all\'inventario', closes: 'come l\'inventario', outside: 'unlessTyped', why: INVENTORY_WHY },
  { id: 'container', name: 'contenitori', kind: 'window', root: '#inventory', window: '.window', file: 'src/ui/inventory.ts', opens: 'E su una cassa, un mobile', before: 'come l\'inventario', closes: 'come l\'inventario', outside: 'unlessTyped', why: INVENTORY_WHY },
  { id: 'module-panels', name: 'pannelli dei moduli (`ui`)', kind: 'window', root: '#inventory', window: '.window', file: 'src/ui/inventory.ts', opens: 'una scheda dell\'inventario', before: 'come l\'inventario', closes: 'come l\'inventario', outside: 'unlessTyped', why: INVENTORY_WHY },
  {
    id: 'actions',
    name: 'menu delle azioni (e «Altro…»)',
    kind: 'window',
    root: '#actions',
    file: 'src/ui/actions.ts',
    opens: 'E davanti a qualcosa, tasto destro o tocco lungo',
    before: 'il ✕ dei pulsanti al tocco, scegliere un\'azione',
    closes: 'la croce, il ✕ dei pulsanti, un tocco fuori, una scelta, E, Esc',
    outside: 'unlessTyped',
    why: 'con «Altro…» scritto un tocco fuori perderebbe l\'azione',
  },
  {
    id: 'chat',
    name: 'chat',
    kind: 'window',
    root: '#chat',
    file: 'src/ui/chat.ts',
    opens: 'parlare con qualcuno, il Concilio nella corona',
    before: 'il × piccolo in testa, il ✕ dei pulsanti (nascosti mentre si scrive)',
    closes: 'la croce, il ✕ dei pulsanti, Esc',
    outside: 'no',
    why: 'una conversazione: toccare la scena per chiudere la tastiera non deve chiuderla',
  },
  {
    id: 'profile',
    name: 'il tuo viandante (profilo)',
    kind: 'window',
    root: '#profile',
    file: 'src/ui/profile.ts',
    opens: 'P, il menu ⋯',
    before: 'il × piccolo in testa',
    closes: 'la croce, il ✕ dei pulsanti, P, Esc',
    outside: 'no',
    why: 'nome, aspetto e presentazione non salvati andrebbero persi',
  },
  {
    id: 'help',
    name: 'aiuto',
    kind: 'window',
    root: '#help',
    file: 'src/main.ts',
    opens: 'H o F1, «Tutto l\'aiuto», il menu ⋯',
    before: 'il ✕ dei pulsanti al tocco, nessuna croce',
    closes: 'la croce, il ✕ dei pulsanti, un tocco fuori, H, Esc',
    outside: 'yes',
  },
  {
    id: 'keyhelp',
    name: 'comandi («?»)',
    kind: 'window',
    root: '#keyhelp',
    file: 'src/ui/hud.ts',
    opens: '«?» in alto a destra',
    before: 'il ✕ piccolo in testa, il ✕ dei pulsanti, «?»',
    closes: 'la croce, il ✕ dei pulsanti, un tocco fuori, «?», Esc',
    outside: 'yes',
  },
  {
    id: 'dialog',
    name: 'dialoghi (il fumetto di chi parla)',
    kind: 'light',
    root: '#dialog',
    file: 'src/ui/hud.ts',
    opens: 'qualcuno dice qualcosa',
    before: 'sparisce da solo dopo 8 s; E o Esc',
    closes: 'la croce, da solo dopo 8 s, E, Esc',
    outside: 'no',
    why: 'non copre il gioco: la scena sotto resta da toccare',
    exit: 'self',
  },
  {
    id: 'studio',
    name: 'pannelli dello studio (vetrine, Direzione, Sala sistemi, Biblioteca, tornio)',
    kind: 'window',
    root: '#studio',
    window: '.window',
    file: 'src/ui/studio.ts',
    opens: 'E su ciò che è esposto nella corona',
    before: 'il × piccolo in alto, il ✕ dei pulsanti',
    closes: 'la croce, il ✕ dei pulsanti, un tocco fuori, E, Esc',
    outside: 'unlessTyped',
    why: 'una richiesta scritta (al Referente, all\'Artista) andrebbe persa',
  },
  { id: 'atlas', name: 'mappa (l\'atlante)', kind: 'window', root: '#atlas', window: '.window', file: 'src/ui/atlas.ts', opens: 'E sul plastico dell\'atlante nella corona', before: 'il × piccolo in alto, il ✕ dei pulsanti', closes: 'la croce, il ✕ dei pulsanti, un tocco fuori, E, Esc', outside: 'yes' },
  { id: 'graph', name: 'grafo del mondo', kind: 'window', root: '#graph', window: '.window', file: 'src/ui/graph.ts', opens: 'il Nucleo nella corona, la console', before: 'il × piccolo in alto, il ✕ dei pulsanti', closes: 'la croce, il ✕ dei pulsanti, un tocco fuori, E, Esc', outside: 'yes' },
  {
    id: 'console',
    name: 'console',
    kind: 'window',
    root: '#console',
    file: 'src/ui/console.ts',
    opens: 'F2 o \\, il menu ⋯ (oltre il bordo)',
    before: 'il × piccolo in testa, il ✕ dei pulsanti',
    closes: 'la croce, il ✕ dei pulsanti, F2, Esc',
    outside: 'no',
    why: 'quasi tutto lo schermo, con campi da scrivere',
  },
  {
    id: 'editor',
    name: 'editor dei file',
    kind: 'window',
    root: '#editor',
    file: 'src/ui/editor.ts',
    opens: 'E su un libro dello studio, la console',
    before: '«Chiudi» in testa, il ✕ dei pulsanti',
    closes: 'la croce, «Chiudi», il ✕ dei pulsanti, Esc',
    outside: 'no',
    why: 'il codice non salvato andrebbe perso',
  },
  { id: 'credits', name: 'crediti esauriti', kind: 'choice', root: '#credit-dialog', opens: 'quando i crediti o il tetto finiscono', before: 'i suoi pulsanti', closes: 'ricaricare, giocare coi modelli locali o abbandonare', outside: 'no', why: 'è una scelta: chiuderla non direbbe come continuare', exit: 'choice' },
  { id: 'death', name: 'morte', kind: 'choice', root: '#death', opens: 'la morte del viandante', before: 'i suoi pulsanti', closes: 'continuare o ricominciare', outside: 'no', why: 'è una scelta', exit: 'choice' },
  { id: 'lobby', name: 'lobby', kind: 'choice', root: '#lobby', opens: 'entrando in un universo', before: 'i suoi pulsanti', closes: 'entrare', outside: 'no', why: 'è la porta della partita', exit: 'choice' },
  { id: 'genesis', name: 'Genesi', kind: 'choice', root: '#genesis', opens: 'un universo mai generato', before: 'i suoi pulsanti', closes: 'generare', outside: 'no', why: 'è la porta della partita', exit: 'choice' },
  { id: 'login', name: 'entrare (account)', kind: 'choice', root: '#login', opens: 'un universo con gli account', before: 'i suoi pulsanti', closes: 'Google o anonimo', outside: 'no', why: 'è la porta della partita', exit: 'choice' },
  { id: 'watch', name: 'segui un viandante (il master)', kind: 'light', root: '#watch', opens: 'il master segue qualcuno', before: '«Torna»', closes: '«Torna», Esc', outside: 'no', why: 'non copre il gioco', exit: 'choice' },
  { id: 'feed', name: 'registro del Concilio', kind: 'light', root: '#feed', opens: 'G, il menu ⋯ (oltre il bordo)', before: '«Concilio» lo ripiega, G nel menu ⋯', closes: '«Concilio», G nel menu ⋯', outside: 'no', why: 'non copre il gioco', exit: 'choice' },
  { id: 'touch-menu', name: 'menu ⋯ dei pulsanti al tocco', kind: 'light', root: '#touch .menu', opens: '⋯', before: '⋯, un comando, la levetta, la scena', closes: 'come prima', outside: 'no', why: 'si chiude già da sé al primo tocco altrove', exit: 'self' },
  { id: 'rotate', name: '«Gira il telefono»', kind: 'light', root: '#rotate', opens: 'il telefono in verticale', before: 'girare il telefono', closes: 'girare il telefono', outside: 'no', why: 'dice di girare il telefono', exit: 'turn' },
];

/** How a finger gets out of a window: never by a key. */
export function touchExits(p: PanelEntry): TouchExit[] {
  const out: TouchExit[] = [];
  if (p.kind === 'window') out.push('cross');
  if (p.outside !== 'no') out.push('outside');
  if (p.exit) out.push(p.exit);
  return out;
}

/** Whether a touch outside closes a window, given whether something is written in it. */
export function closesOnTouchOutside(outside: Outside, typed: boolean): boolean {
  return outside === 'yes' || (outside === 'unlessTyped' && !typed);
}

/** Whether something is written in a window: a field of text that is not empty. */
export function typedIn(root: Element): boolean {
  for (const f of root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('textarea, input')) {
    if (f instanceof HTMLInputElement && !['text', 'search', ''].includes(f.type)) continue;
    if (!f.disabled && f.value.trim()) return true;
  }
  return false;
}

/** The cross of a window: at its top right, a finger's size when fingers play (`.touch .cross`, src/style.css). It takes no focus. */
export function closeButton(close: () => void): HTMLButtonElement {
  const b = el('button', { class: 'close cross', type: 'button', 'aria-label': 'chiudi', title: 'chiudi' }, '✕');
  b.tabIndex = -1;
  b.addEventListener('pointerdown', (e) => e.preventDefault());
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });
  return b;
}

/** A window that a touch outside may close. */
interface Watched {
  entry: PanelEntry;
  root: HTMLElement;
  isOpen: () => boolean;
  close: () => void;
}

/** How long after a touch that closed a window its click is the closing's, in ms. */
const SWALLOW_MS = 600;

/**
 * The touches outside the windows (T393). Only fingers: a touch outside the topmost open window closes it if its entry
 * says so, and does nothing else (not a tap on the scene, not a click under it). The touch layer (`#touch`) is never
 * outside: its ✕ closes on its own.
 */
export class OutsideTouches {
  private watched: Watched[] = [];
  private swallowUntil = 0;

  constructor(target: Window = window) {
    target.addEventListener('pointerdown', (e) => this.down(e), true);
    target.addEventListener(
      'click',
      (e) => {
        if (performance.now() < this.swallowUntil) {
          e.stopPropagation();
          e.preventDefault();
        }
        this.swallowUntil = 0;
      },
      true,
    );
  }

  watch(id: string, root: HTMLElement | null | undefined, isOpen: () => boolean, close: () => void): void {
    const entry = PANELS.find((p) => p.id === id);
    if (!entry || !root) return;
    this.watched.push({ entry, root, isOpen, close });
  }

  /** The open window on top: the highest z-index, the latest watched among equals. */
  private top(): Watched | undefined {
    let best: Watched | undefined;
    let bestZ = -Infinity;
    for (const w of this.watched) {
      if (!w.root.isConnected || !w.isOpen()) continue;
      const z = Number(getComputedStyle(w.root).zIndex) || 0;
      if (z >= bestZ) {
        best = w;
        bestZ = z;
      }
    }
    return best;
  }

  private down(e: PointerEvent): void {
    if (e.pointerType !== 'touch') return;
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('#touch')) return;
    const w = this.top();
    if (!w) return;
    const win = (w.entry.window && w.root.querySelector(w.entry.window)) || w.root;
    if (target && win.contains(target)) return;
    if (!closesOnTouchOutside(w.entry.outside, typedIn(win))) return;
    // The touch was the closing: nothing under it hears it.
    e.preventDefault();
    e.stopPropagation();
    this.swallowUntil = performance.now() + SWALLOW_MS;
    w.close();
  }
}
