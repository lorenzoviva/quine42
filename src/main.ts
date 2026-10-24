import wasmUri from 'wasmoon/dist/glue.wasm?url';
import { Kernel } from './kernel/kernel';
import { bundledFiles } from './kernel/bundle';
import { localStore, memoryStore } from './kernel/repo';
import { SEED_FILE, seedHashes, UniverseChunks, UniverseClient, upgradeFromSeed, type PastCommit, type UniverseSnapshot } from './kernel/universes';
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
import { InventoryPanel } from './ui/inventory';
import { Chat } from './ui/chat';
import { ActionMenu } from './ui/actions';
import { SessionClient } from './session/client';
import { ThinClient } from './session/thin';
import { socketLink, tabWanderer } from './session/socket';
import { Sfx } from './audio';
import { $ } from './ui/dom';
import type { MasterTools } from './master';
import './style.css';

const DT = 1 / 60;
const params = new URLSearchParams(location.search);
const dev = import.meta.env.DEV || params.has('dev');

/** A game alone: the kernel runs here, on the universe's repository (or in the browser's storage, without the server). */
async function bootAlone(client: UniverseClient | null, snap: UniverseSnapshot | undefined, name: string): Promise<{ kernel: Kernel; online: boolean }> {
  const ai = readConfig(bundledFiles).config.ai;
  const online = !params.has('offline') && (await GeminiModels.available());
  const models: Models = online ? new GeminiModels({ textModel: ai.textModel, limits: { text: ai.maxText }, thinking: ai.thinking, timeout: (ai.timeout ?? 120) * 1000 }) : new MockModels();
  let files: FileMap = bundledFiles;
  let past: PastCommit[] = [];
  if (client && snap) {
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
  return { kernel, online };
}

/**
 * A game of many (T39, ADR-0059): the world runs on the server, this tab is one of its wanderers. The kernel here
 * is a mirror the thin client fills with what the server tells.
 */
async function joinMany(name: string): Promise<ThinClient> {
  const session = new SessionClient(socketLink(name, params.has('offline')), { id: tabWanderer(params) });
  await session.ready;
  if (session.refused || !session.me) throw new Error(session.refused ?? 'il mondo non risponde');
  const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), models: new MockModels(), forms: new WorkerRunner(), wasmUri, mirror: true });
  return new ThinClient(mirror, session);
}

async function main() {
  const loading = $('#loading');
  loading.textContent = 'avvio del kernel…';
  const ai = readConfig(bundledFiles).config.ai;
  // Two repositories (ADR-0021): the kernel's seed (bundled) and the universe's, on disk. Dev: ?universo=<name>
  // opens another universe of universes/ (a game of many to try, T39).
  const other = dev ? params.get('universo') : null;
  const name = other && /^[a-z0-9][a-z0-9-]{0,40}$/.test(other) ? other : readConfig(bundledFiles).config.name;
  const client = await UniverseClient.connect(name);
  if (client) loading.textContent = `apertura dell'universo «${name}»…`;
  const snap = client ? await client.load() : undefined;
  const many = !!snap?.files && readConfig(snap.files).config.partita?.modalita === 'multigiocatore';
  if (many) loading.textContent = `ingresso nel mondo di «${name}»…`;
  const thin = many ? await joinMany(name) : undefined;
  // The corona, the studio, the Council's feed, the console and the editor are the master's (T41): alone always, in a
  // game of many only the wanderer who made the universe. A player's client never fetches them.
  const master = !thin || thin.session.master;
  const tooling = master ? import('./master') : undefined;
  const { kernel, online } = thin ? { kernel: thin.k, online: false } : await bootAlone(client, snap, name);
  // Leaving: the state of play goes into the universe (if it is valid); in a game of many the server keeps it.
  window.addEventListener('pagehide', () => {
    if (thin) return thin.session.leave();
    kernel.saveState();
    kernel.saveUsage();
  });
  const renderer = new Renderer($<HTMLCanvasElement>('#world'), $<HTMLCanvasElement>('#overlay'), kernel);
  if (params.has('god') || params.has('master') || (thin && thin.session.master)) {
    renderer.godMode = true;
  }
  const thumbs = new Thumbs(kernel);
  icons.get = (item) => thumbs.icon(item);
  icons.model = (model, tint, seed) => thumbs.model(model, tint, seed);
  const hud = new Hud(kernel, renderer);
  const inventory = new InventoryPanel(kernel);
  const chat = new Chat(kernel);
  const actions = new ActionMenu(kernel);
  const tools: MasterTools | undefined = tooling && new (await tooling).MasterTools(kernel, renderer, dev, () => syncFocus());
  // Right click on a tile near you: its context menu (with what stands on it, and "Altro…").
  $<HTMLCanvasElement>('#world').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const r = renderer.toReal(e.offsetX, e.offsetY);
    kernel.contextAt(r.x, r.y);
  });
  // The camera turns by quarter turns (, and .) or with the middle button dragged freely (T55).
  kernel.input.onTurn = () => {
    renderer.yawGoal = kernel.input.angle;
    renderer.fitView();
  };
  $<HTMLCanvasElement>('#world').addEventListener('mousedown', (e) => {
    // A left click in the studio: a showcase or its arrows (T21).
    if (e.button === 0) {
      const r = renderer.toReal(e.offsetX, e.offsetY);
      kernel.clickStudio(r.x, r.y);
      return;
    }
    if (e.button !== 1) return;
    e.preventDefault();
    renderer.dragStart(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', (e) => renderer.dragMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', (e) => e.button === 1 && renderer.dragEnd());
  // Death: the session ends; continue in the same universe or start again from the seed.
  const deathEl = $('#death');
  kernel.bus.on('ui:death', ({ cause, punizione }: { cause: string; punizione: { nome: string; testo: string } }) => {
    const again = document.createElement('button');
    again.className = 'primary';
    again.textContent = 'Continua in questo universo';
    again.onclick = async () => {
      // The Narrator decides what the punishment takes: wait for the verdict.
      again.disabled = true;
      await kernel.continueAfterDeath();
      deathEl.hidden = true;
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
    const cost = document.createElement('div');
    cost.className = 'why';
    cost.textContent = `In questo universo la morte è ${punizione.nome}: ${punizione.testo}.`;
    const row = document.createElement('div');
    row.className = 'row';
    row.append(again, restart);
    deathEl.replaceChildren(t, why, cost, row);
    deathEl.hidden = false;
    syncFocus();
  });
  const sfx = new Sfx();
  // A player's console sees only the client (T41): what the server told this tab. The master's sees the kernel too.
  (window as any).rune = master ? kernel : thin;
  (window as any).quine = (window as any).rune;
  (window as any).quine42 = (window as any).rune;
  // The session of a game of many (T39): what this tab knows of the server's world.
  if (thin && master) (window as any).session = thin;
  // The 3D view, for the console (camera distance, scene).
  (window as any).view = renderer;
  Object.defineProperty(kernel, 'godMode', {
    get: () => renderer.godMode,
    set: (v: boolean) => { renderer.godMode = !!v; },
    configurable: true,
  });

  const syncFocus = () => {
    kernel.input.enabled = !tools?.isOpen && !inventory.isOpen && !chat.isOpen && !actions.isOpen && !kernel.dead;
    if (!kernel.input.enabled) kernel.input.releaseAll();
  };
  inventory.onClose = syncFocus;
  chat.onClose = syncFocus;
  actions.onClose = syncFocus;
  const runGenesis = async () => tools?.runGenesis(online, syncFocus);
  // A universe that was never generated waits for its genesis before the Council paints anything.
  if (!thin) kernel.generationHeld = online && kernel.needsGenesis() && !params.has('skip');
  if (tools) tools.konsole.onGenesis = () => void runGenesis();
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
    if (!thin && kernel.needsGenesis() && !params.has('skip')) void runGenesis();
  };
  window.addEventListener('keydown', startGame);
  intro.addEventListener('click', startGame);
  $('#models').textContent = thin ? `partita di molti · ${thin.session.nome} (${thin.session.id})` : online ? `Gemini · ${ai.textModel}` : 'offline: luoghi abbozzati, agenti locali';
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
        tools?.feed.toggle();
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
        if (!tools || (!dev && !kernel.exitedOnce)) {
          hud.message('Niente risponde.', 'warn');
          break;
        }
        if (!tools.editor.isOpen) tools.konsole.toggle();
        syncFocus();
        break;
      case 'escape':
        if (tools?.editor.isOpen) tools.editor.close();
        else if (chat.isOpen) chat.close();
        else if (inventory.isOpen) inventory.close();
        else if (tools?.konsole.isOpen) tools.konsole.close();
        else if (!help.hidden) help.hidden = true;
        else hud.hideDialog();
        syncFocus();
        break;
      default:
        if (a.startsWith('hot')) kernel.hotbar(Number(a.slice(3)) - 1);
    }
  };

  window.addEventListener(
    'wheel',
    (e) => {
      if (!kernel.input.enabled) return;
      if ((e.target as HTMLElement)?.closest?.('.panel, .dialog, #editor, #console, #inventory')) return;
      e.preventDefault();
      renderer.zoom(e.deltaY);
    },
    { passive: false }
  );

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
    thin?.frame(elapsed);
    renderer.render(elapsed);
    hud.update(elapsed);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  loading.hidden = true;

  if (import.meta.hot) {
    import.meta.hot.accept('./kernel/bundle', (mod) => {
      if (mod && !thin) kernel.syncFromDisk(mod.bundledFiles);
    });
  }
}

main().catch((e) => {
  console.error(e);
  $('#loading').textContent = `KERNEL PANIC: ${(e as Error).message}`;
});
