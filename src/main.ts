import wasmUri from 'wasmoon/dist/glue.wasm?url';
import { Kernel } from './kernel/kernel';
import { bundledFiles } from './kernel/bundle';
import { localStore, memoryStore } from './kernel/repo';
import { SEED_FILE, seedHashes, UniverseChunks, UniverseClient, upgradeFromSeed, type PastCommit } from './kernel/universes';
import type { FileMap } from './kernel/types';
import { readConfig } from './kernel/universe';
import { IdbChunks } from './kernel/chunks';
import { GeminiModels } from './kernel/ai/gemini';
import { MockModels } from './kernel/ai/mock';
import type { Models } from './kernel/ai/models';
import { Renderer } from './render/renderer';
import { WorkerRunner } from './render/forms';
import { Thumbs } from './render/thumbs';
import { Hud, icons } from './ui/hud';
import { Editor } from './ui/editor';
import { Console } from './ui/console';
import { InventoryPanel } from './ui/inventory';
import { Chat } from './ui/chat';
import { FeedPanel } from './ui/feed';
import { GenesisScreen } from './ui/genesis';
import { ActionMenu } from './ui/actions';
import { StudioPanel } from './ui/studio';
import { AtlasPanel } from './ui/atlas';
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
  const models: Models = online ? new GeminiModels({ textModel: ai.textModel, limits: { text: ai.maxText }, thinking: ai.thinking, timeout: (ai.timeout ?? 120) * 1000 }) : new MockModels();
  // Two repositories (ADR-0021): the kernel's seed (bundled) and the universe's, on disk.
  const name = readConfig(bundledFiles).config.name;
  const client = await UniverseClient.connect(name);
  let files: FileMap = bundledFiles;
  let past: PastCommit[] = [];
  if (client) {
    loading.textContent = `apertura dell'universo «${name}»…`;
    let snap = await client.load();
    if (!snap.exists) {
      // A world played before this version lived in the browser: it becomes the universe's first commit.
      const legacy = (() => {
        try {
          const d = JSON.parse(localStore.load(`rune:repo:${name}`) ?? 'null');
          const head = d?.commits?.find((c: { id: string }) => c.id === d.head);
          return head ? { files: head.files as FileMap, genesis: d.commits.some((c: { message: string }) => c.message.startsWith('genesi:')) } : null;
        } catch {
          return null;
        }
      })();
      const start = { ...(legacy?.files ?? bundledFiles), [SEED_FILE]: JSON.stringify(seedHashes(bundledFiles), null, 1) + '\n' };
      await client.create(start, legacy ? `genesi: mondo portato dal browser${legacy.genesis ? '' : ' (senza genesi)'}` : 'nasce dal seme del kernel');
      if (legacy) {
        try {
          localStorage.removeItem(`rune:repo:${name}`);
        } catch {
          /* nothing to free */
        }
      }
      snap = await client.load();
    }
    const up = upgradeFromSeed(snap.files ?? {}, bundledFiles);
    if (Object.keys(up.changes).length) await client.commit(up.changes, `aggiornamento dal kernel: ${up.updated.slice(0, 6).join(', ') || 'seme'}${up.updated.length > 6 ? '…' : ''}`, 'kernel');
    files = up.files;
    past = snap.log ?? [];
  }
  const chunks = client ? new UniverseChunks(client, new IdbChunks()) : new IdbChunks();
  const kernel = await Kernel.boot({ files, store: client ? memoryStore() : localStore, models, chunks, forms: new WorkerRunner(), wasmUri, backend: client ?? undefined, past });
  // Leaving: the state of play goes into the universe (if it is valid).
  window.addEventListener('pagehide', () => {
    kernel.saveState();
    kernel.saveUsage();
  });
  const renderer = new Renderer($<HTMLCanvasElement>('#world'), $<HTMLCanvasElement>('#overlay'), kernel);
  const thumbs = new Thumbs(kernel);
  icons.get = (item) => thumbs.icon(item);
  icons.model = (model, tint) => thumbs.model(model, tint);
  const hud = new Hud(kernel, renderer);
  const editor = new Editor(kernel);
  const konsole = new Console(kernel);
  const inventory = new InventoryPanel(kernel);
  const chat = new Chat(kernel);
  const feed = new FeedPanel($('#hud'), kernel);
  const genesis = new GenesisScreen(kernel);
  const actions = new ActionMenu(kernel);
  const studio = new StudioPanel(kernel);
  // Right click on a tile near you: its context menu (with what stands on it, and "Altro…").
  $<HTMLCanvasElement>('#world').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const r = renderer.toReal(e.offsetX, e.offsetY);
    kernel.contextAt(r.x, r.y);
  });
  // The camera turns by quarter turns (, and .) or with the middle button dragged (ADR-0047).
  kernel.input.onTurn = () => renderer.fitView();
  $<HTMLCanvasElement>('#world').addEventListener('mousedown', (e) => {
    if (e.button !== 1) return;
    e.preventDefault();
    renderer.dragStart(e.clientX);
  });
  window.addEventListener('mousemove', (e) => renderer.dragMove(e.clientX));
  window.addEventListener('mouseup', (e) => e.button === 1 && renderer.dragEnd());
  const atlas = new AtlasPanel(kernel);
  // Death: the session ends; continue in the same universe or start again from the seed.
  const deathEl = $('#death');
  kernel.bus.on('ui:death', ({ cause }: { cause: string }) => {
    const again = document.createElement('button');
    again.className = 'primary';
    again.textContent = 'Continua in questo universo';
    again.onclick = () => {
      deathEl.hidden = true;
      kernel.continueAfterDeath();
      syncFocus();
    };
    const restart = document.createElement('button');
    restart.className = 'danger';
    restart.textContent = 'Ricomincia da capo (nuovo universo)';
    restart.onclick = async () => {
      await kernel.repo.backend?.reset().catch(() => undefined);
      try {
        localStorage.removeItem(`rune:repo:${kernel.config.name}`);
      } catch {
        /* nothing to remove */
      }
      location.reload();
    };
    const t = document.createElement('div');
    t.className = 'title';
    t.textContent = 'SEI MORTO';
    const why = document.createElement('div');
    why.className = 'why';
    why.textContent = cause === 'sete' ? 'La sete ti ha vinto. La strada era lunga e i pozzi lontani.' : cause === 'fame' ? 'La fame ti ha vinto. Le dispense erano vuote, i campi lontani.' : 'Le ferite ti hanno vinto.';
    const row = document.createElement('div');
    row.className = 'row';
    row.append(again, restart);
    deathEl.replaceChildren(t, why, row);
    deathEl.hidden = false;
    syncFocus();
  });
  const sfx = new Sfx();
  konsole.dev = dev;
  (window as any).rune = kernel;
  // The 3D view, for the console (camera distance, scene).
  (window as any).view = renderer;

  const syncFocus = () => {
    kernel.input.enabled = !editor.isOpen && !konsole.isOpen && !inventory.isOpen && !chat.isOpen && !genesis.isOpen && !actions.isOpen && !studio.isOpen && !atlas.isOpen && !kernel.dead;
    if (!kernel.input.enabled) kernel.input.releaseAll();
  };
  editor.onClose = syncFocus;
  konsole.onClose = syncFocus;
  inventory.onClose = syncFocus;
  chat.onClose = syncFocus;
  actions.onClose = syncFocus;
  studio.onClose = syncFocus;
  atlas.onClose = syncFocus;
  konsole.onEdit = (path) => {
    konsole.close();
    editor.open(path);
    syncFocus();
  };
  studio.onEdit = (path) => {
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
  const helpBeyond = $('#help-beyond');
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
  $('#models').textContent = online ? `Gemini · ${ai.textModel}` : 'offline: luoghi abbozzati, agenti locali';
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
  kernel.bus.on('spell:cast', () => sfx.chord([330, 494, 740, 988], 0.5));
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
      case 'cast':
        void kernel.castSpell();
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
        hud.message(renderer.showWalk ? 'In rosso, dove non si passa (V per nascondere).' : 'Vista normale.');
        break;
      case 'help':
        // What lies beyond the edge (the Council, the code) is told only to those who have been there.
        helpBeyond.hidden = !dev && !kernel.exitedOnce;
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
