import wasmUri from 'wasmoon/dist/glue.wasm?url';
import { Kernel } from './kernel/kernel';
import { bundledFiles } from './kernel/bundle';
import { localStore } from './kernel/repo';
import { readConfig } from './kernel/universe';
import { IdbAssets, IdbChunks } from './kernel/assets';
import { GeminiModels } from './kernel/ai/gemini';
import { MockModels } from './kernel/ai/mock';
import type { Models } from './kernel/ai/models';
import { Renderer } from './render/renderer';
import { BrowserImageTools, ImageCache } from './render/imagetools';
import { Hud } from './ui/hud';
import { Editor } from './ui/editor';
import { Console } from './ui/console';
import { InventoryPanel } from './ui/inventory';
import { Chat } from './ui/chat';
import { FeedPanel } from './ui/feed';
import { GenesisScreen } from './ui/genesis';
import { ActionMenu } from './ui/actions';
import { Sfx } from './audio';
import { $ } from './ui/dom';
import './style.css';

const DT = 1 / 60;
const params = new URLSearchParams(location.search);
const dev = import.meta.env.DEV || params.has('dev');

async function main() {
  const loading = $('#loading');
  loading.textContent = 'avvio del kernel…';
  const ai = readConfig(bundledFiles).config.ai;
  const online = !params.has('offline') && (await GeminiModels.available());
  const models: Models = online ? new GeminiModels({ textModel: ai.textModel, imageModel: ai.imageModel, limits: { text: ai.maxText, images: ai.maxImages } }) : new MockModels();
  const assets = new IdbAssets();
  const kernel = await Kernel.boot({ files: bundledFiles, store: localStore, models, assets, chunks: new IdbChunks(), imageTools: new BrowserImageTools(), wasmUri });
  const images = new ImageCache((id) => assets.get(id));
  const renderer = new Renderer($<HTMLCanvasElement>('#world'), kernel, images);
  const hud = new Hud(kernel, renderer, images);
  const editor = new Editor(kernel);
  const konsole = new Console(kernel);
  const inventory = new InventoryPanel(kernel, images);
  const chat = new Chat(kernel);
  const feed = new FeedPanel($('#hud'), kernel);
  const genesis = new GenesisScreen(kernel);
  const actions = new ActionMenu(kernel);
  const sfx = new Sfx();
  konsole.dev = dev;
  (window as any).rune = kernel;

  const syncFocus = () => {
    kernel.input.enabled = !editor.isOpen && !konsole.isOpen && !inventory.isOpen && !chat.isOpen && !genesis.isOpen && !actions.isOpen;
    if (!kernel.input.enabled) kernel.input.releaseAll();
  };
  editor.onClose = syncFocus;
  konsole.onClose = syncFocus;
  inventory.onClose = syncFocus;
  chat.onClose = syncFocus;
  actions.onClose = syncFocus;
  konsole.onEdit = (path) => {
    konsole.close();
    editor.open(path);
    syncFocus();
  };
  const runGenesis = async () => {
    kernel.generationHeld = true;
    syncFocus();
    await genesis.show(online);
    kernel.generationHeld = false;
    syncFocus();
  };
  // A universe that was never generated waits for its genesis before the Council paints anything.
  kernel.generationHeld = online && kernel.needsGenesis() && !params.has('skip');
  konsole.onGenesis = () => void runGenesis();
  kernel.bus.on('ui:edit', ({ path, line }) => {
    editor.open(path, line);
    syncFocus();
  });
  kernel.bus.on('genesis:done', ({ title }) => hud.showBanner(title.toUpperCase(), 'Un nuovo universo è stato scritto. Il tappeto ti riporta al centro.', 4000));

  kernel.input.attach(window);
  kernel.input.onAny = () => sfx.unlock();
  const intro = $('#intro');
  const help = $('#help');
  const startGame = () => {
    if (intro.hidden) return;
    intro.classList.add('out');
    setTimeout(() => (intro.hidden = true), 700);
    sfx.unlock();
    sfx.chord([220, 330, 440]);
    if (kernel.needsGenesis() && !params.has('skip')) void runGenesis();
  };
  window.addEventListener('keydown', startGame);
  intro.addEventListener('click', startGame);
  $('#models').textContent = online ? `Gemini · ${ai.textModel} · ${ai.imageModel}` : 'offline: luoghi abbozzati, agenti locali';
  if (params.has('skip')) intro.hidden = true;
  // Dev: ?dev&teleport=46,0 stops the carpet and drops you at real coordinates (e.g. in the corona).
  const tp = dev && params.get('teleport')?.split(',').map(Number);
  if (tp && tp.length === 2 && tp.every(Number.isFinite)) {
    kernel.carpet()!.active = false;
    Object.assign(kernel.playerPos(), { x: tp[0], y: tp[1] });
  }

  kernel.bus.on('rune:picked', () => sfx.blip(660, 0.07));
  kernel.bus.on('item:picked', () => sfx.blip(520, 0.09, 'triangle'));
  kernel.bus.on('item:crafted', () => sfx.chord([523, 659], 0.2));
  kernel.bus.on('rune:inscribed', () => sfx.chord([440, 554, 659], 0.25));
  kernel.bus.on('fault', ({ isNew }) => isNew && sfx.noise(0.3));
  kernel.bus.on('rollback', () => sfx.chord([660, 440, 330], 0.3));
  kernel.bus.on('forge:done', () => sfx.chord([392, 494, 587], 0.4));
  kernel.bus.on('zone', ({ zone }) => zone === 'corona' && sfx.chord([196, 294, 392, 587], 1.2));

  const handle = (a: string) => {
    switch (a) {
      case 'interact':
        hud.hideDialog();
        void kernel.interact();
        break;
      case 'inscribe':
        kernel.inscribeHand();
        break;
      case 'drop':
        kernel.dropSelected();
        break;
      case 'rollback':
        kernel.rollback();
        break;
      case 'prev':
        kernel.select(-1);
        break;
      case 'next':
        kernel.select(1);
        break;
      case 'movePrev':
        kernel.select(-1, true);
        break;
      case 'moveNext':
        kernel.select(1, true);
        break;
      case 'action':
        kernel.action();
        break;
      case 'inventory':
        inventory.toggle();
        syncFocus();
        break;
      case 'feed':
        feed.toggle();
        break;
      case 'walk':
        renderer.showWalk = !renderer.showWalk;
        hud.message(renderer.showWalk ? 'Caselle invalicabili in rosso (V per nascondere).' : 'Vista normale.');
        break;
      case 'help':
        help.hidden = !help.hidden;
        break;
      case 'console':
        // The simulator's console belongs to those who left the simulation (or to developers).
        if (!dev && !kernel.exitedOnce) {
          hud.message('Niente risponde.', 'warn');
          break;
        }
        if (!editor.isOpen) konsole.toggle();
        syncFocus();
        break;
      case 'escape':
        if (editor.isOpen) editor.close();
        else if (chat.isOpen) chat.close();
        else if (inventory.isOpen) inventory.close();
        else if (konsole.isOpen) konsole.close();
        else if (!help.hidden) help.hidden = true;
        else hud.hideDialog();
        syncFocus();
        break;
      default:
        if (a.startsWith('hot')) kernel.hotbar(Number(a.slice(3)) - 1);
    }
  };

  window.addEventListener('wheel', (e) => kernel.input.enabled && kernel.select(e.deltaY > 0 ? 1 : -1), { passive: true });

  let last = performance.now();
  let acc = 0;
  const frame = (now: number) => {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    for (const a of kernel.input.drain()) handle(a);
    acc += elapsed;
    let steps = 0;
    while (acc >= DT && steps < 4) {
      kernel.tick(DT);
      acc -= DT;
      steps++;
    }
    if (steps === 4) acc = 0;
    renderer.render(elapsed);
    hud.update(elapsed);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  loading.hidden = true;

  if (import.meta.hot) {
    import.meta.hot.accept('./kernel/bundle', (mod) => {
      if (mod) kernel.syncFromDisk(mod.bundledFiles);
    });
  }
}

main().catch((e) => {
  console.error(e);
  $('#loading').textContent = `KERNEL PANIC: ${(e as Error).message}`;
});
