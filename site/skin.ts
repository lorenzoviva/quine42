// The picker of the site's skins (T283, ADR-0145). The first skin of a page is put on by /skins/boot.js before anything is drawn; from there on, it is here.
// Only the browser remembers the choice: no route and no vote (T287).

import { SKIN_EVENT, SKIN_KEY, checkManifest, orderSkins, type SkinManifest } from './skin-core';

/** A skin's optional `effects.ts`: starts what moves, and gives back how to stop it. Loaded only for the skin in use. */
interface SkinEffects {
  start?: () => (() => void) | void;
}

const manifests = import.meta.glob('./skins/*/skin.json', { eager: true, import: 'default' });
const effects = import.meta.glob<SkinEffects>('./skins/*/effects.ts');

const skins = new Map<string, SkinManifest>();
for (const [file, raw] of Object.entries(manifests)) {
  const manifest = checkManifest(raw);
  if (typeof manifest !== 'string') skins.set(file.split('/')[2], manifest);
}

const root = document.documentElement;
let stopEffects: (() => void) | void;
/** The last skin asked for: a stylesheet that arrives after another choice is dropped. */
let asked = root.dataset.skin;

async function runEffects(id: string): Promise<void> {
  stopEffects?.();
  stopEffects = undefined;
  const load = effects[`./skins/${id}/effects.ts`];
  if (!load) return;
  try {
    const module = await load();
    // Another skin was chosen while this one was on its way.
    if (asked === id) stopEffects = module.start?.();
  } catch {
    /* an effect that does not start leaves the page as it is */
  }
}

function setIcon(id: string): void {
  const icon = skins.get(id)?.icona;
  const link = document.getElementById('skin-icon') as HTMLLinkElement | null;
  if (icon && link) link.href = `/skins/${id}/${icon}`;
}

function remember(id: string): void {
  try {
    localStorage.setItem(SKIN_KEY, id);
  } catch {
    /* a browser that keeps nothing: the skin lasts until the page closes */
  }
}

/** Puts a skin on: the old stylesheet goes only when the new one is here, so the page is never without one. */
function wear(id: string, select: HTMLSelectElement): void {
  asked = id;
  remember(id);
  const old = document.getElementById('skin-sheet');
  const sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = `/skins/${id}/skin.css`;
  sheet.onload = () => {
    if (asked !== id) return void sheet.remove();
    root.dataset.skin = id;
    old?.remove();
    sheet.id = 'skin-sheet';
    setIcon(id);
    document.dispatchEvent(new CustomEvent(SKIN_EVENT));
    void runEffects(id);
  };
  sheet.onerror = () => {
    sheet.remove();
    if (asked !== id) return;
    // The file did not come: the picker goes back to what the page is wearing.
    asked = root.dataset.skin;
    select.value = asked ?? '';
    if (asked) remember(asked);
  };
  document.head.append(sheet);
}

function addPicker(): void {
  const nav = document.querySelector('.site-nav');
  // One skin is nothing to choose from.
  if (!nav || skins.size < 2) return;
  const label = document.createElement('label');
  label.className = 'skin-picker';
  const word = document.createElement('span');
  word.className = 'skin-picker-word';
  word.textContent = 'Veste';
  const select = document.createElement('select');
  select.className = 'skin-picker-select';
  for (const id of orderSkins([...skins.keys()])) {
    const skin = skins.get(id) as SkinManifest;
    const option = document.createElement('option');
    option.value = id;
    option.textContent = skin.nome;
    option.title = skin.descrizione;
    select.append(option);
  }
  select.value = root.dataset.skin ?? '';
  select.addEventListener('change', () => wear(select.value, select));
  label.append(word, select);
  nav.insertBefore(label, document.getElementById('nav-toggle'));
}

addPicker();
if (asked) void runEffects(asked);
