import wasmUri from 'wasmoon/dist/glue.wasm?url';
import { Kernel } from './kernel/kernel';
import { bundledFiles } from './kernel/bundle';
import { localStore, memoryStore } from './kernel/repo';
import { SEED_FILE, seedHashes, UniverseChunks, UniverseClient, upgradeFromSeed, WANDERER_HEADER, type PastCommit, type UniverseSnapshot } from './kernel/universes';
import type { FileMap } from './kernel/types';
import { readConfig } from './kernel/universe';
import { IdbChunks } from './kernel/chunks';
import { GeminiAiModels } from './kernel/ai/gemini';
import { MockAiModels } from './kernel/ai/mock';
import type { AiModels } from './kernel/ai/models';
import { describeQueue, describeSubscriptions, QueueAiModels, RoutedAiModels, SUBSCRIPTIONS, subscriptionsOf, usesSubscriptions, type Provider } from './kernel/ai/subscription';
import { Renderer } from './render/renderer';
import { WorkerRunner } from './render/forms';
import { Thumbs } from './render/thumbs';
import { Hud, icons } from './ui/hud';
import { InventoryPanel } from './ui/inventory';
import { Chat } from './ui/chat';
import { ActionMenu } from './ui/actions';
import { SessionClient } from './session/client';
import { ThinClient } from './session/thin';
import { keepProfile, savedProfile, socketLink, tabWanderer } from './session/socket';
import { accountConfig, signIn, type SignedIn } from './session/login';
import { accountWanderer } from './session/account';
import { ProfilePanel } from './ui/profile';
import { LobbyScreen } from './ui/lobby';
import { CreditExhaustedModal } from './ui/creditdialog';
import { Sfx } from './audio';
import { $ } from './ui/dom';
import type { MasterTools } from './master';
import './style.css';

const DT = 1 / 60;
const params = new URLSearchParams(location.search);
const dev = import.meta.env.DEV || params.has('dev');

/** A game alone: the kernel runs here, on the universe's repository (or in the browser's storage, without the server). */
async function bootAlone(client: UniverseClient | null, snap: UniverseSnapshot | undefined, name: string): Promise<{ kernel: Kernel; online: boolean }> {
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
  const ai = readConfig(files).config.ai;
  const online = !params.has('offline') && (await GeminiAiModels.available());
  const baseAiModels: AiModels = online ? new GeminiAiModels({ textModel: ai.textModel, limits: { text: ai.maxText }, thinking: ai.thinking, timeout: (ai.timeout ?? 120) * 1000 }) : new MockAiModels();
  const table = subscriptionsOf(ai);
  let models: AiModels = baseAiModels;
  if (usesSubscriptions(table)) {
    const queues: Partial<Record<Exclude<Provider, 'api'>, AiModels>> = {};
    for (const p of SUBSCRIPTIONS) {
      if (table.provider === p || Object.values(table.agenti).includes(p)) {
        if (await QueueAiModels.available(p)) {
          queues[p] = new QueueAiModels({ provider: p });
        }
      }
    }
    if (Object.keys(queues).length > 0) {
      models = new RoutedAiModels(baseAiModels, table, queues);
    }
  }
  const chunks = client ? new UniverseChunks(client, new IdbChunks()) : new IdbChunks();
  const kernel = await Kernel.boot({ files, store: client ? memoryStore() : localStore, ai: models, chunks, forms: new WorkerRunner(), wasmUri, backend: client ?? undefined, past });
  return { kernel, online };
}

/** The account this tab signed in with, in a game of many on a server with accounts (T44b). */
let account: SignedIn | undefined;

/**
 * A game of many (T39, ADR-0059): the world runs on the server, this tab is one of its wanderers. The kernel here
 * is a mirror the thin client fills with what the server tells.
 */
async function joinMany(name: string, lobbyChoice?: { tetto?: number; offline?: boolean; attore?: { acceso: boolean; modello?: string } }): Promise<ThinClient> {
  // With accounts (T44b) the wanderer is the account's: the server makes the id from the token.
  const config = await accountConfig();
  if (!account) account = config ? await signIn(config) : undefined;
  const id = account ? accountWanderer(account.uid) : tabWanderer(params);
  const session = new SessionClient(socketLink(name, params.has('offline') || !!lobbyChoice?.offline), {
    id,
    profilo: savedProfile(name, id),
    ...(account ? { token: account.token, freshToken: account.freshToken } : {}),
    ...(typeof lobbyChoice?.tetto === 'number' ? { tetto: lobbyChoice.tetto } : {}),
  });
  await session.ready;
  if (session.refused || !session.me) throw new Error(session.refused ?? 'il mondo non risponde');
  // The Actor (T157): the lobby's choice is the master's; the server refuses it to anyone else.
  if (lobbyChoice?.attore && session.master) void session.act({ t: 'attore', ...lobbyChoice.attore });
  const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), forms: new WorkerRunner(), wasmUri, mirror: true });
  return new ThinClient(mirror, session);
}

async function main() {
  const loading = $('#loading');
  loading.textContent = 'avvio del kernel…';
  const ai = readConfig(bundledFiles).config.ai;
  // Two repositories (ADR-0021): the kernel's seed (bundled) and the universe's, on disk. ?universo=<name> opens another
  // universe: the site's links say it, the way back from a payment too (T133). What it may read and write the server decides.
  const other = params.get('universo');
  const name = other && /^[a-z0-9][a-z0-9-]{0,40}$/.test(other) ? other : readConfig(bundledFiles).config.name;
  const client = await UniverseClient.connect(name);
  if (client) loading.textContent = `apertura dell'universo «${name}»…`;
  const snap = client ? await client.load() : undefined;
  const snapFiles = snap?.files;
  const many = !!snapFiles && readConfig(snapFiles).config.partita?.modalita === 'multigiocatore';
  let lobbyChoice: { tetto?: number; offline?: boolean; attore?: { acceso: boolean; modello?: string } } | undefined;
  if (many && snapFiles && !params.has('skip')) {
    loading.hidden = true;
    const config = await accountConfig();
    if (!account) account = config ? await signIn(config) : undefined;
    const id = account ? accountWanderer(account.uid) : tabWanderer(params);
    // The store gives nobody else's balance, nor anyone's in the universe's snapshot (T120): the wanderer's own view does.
    const seen = await fetch(`/api/viandante?universo=${encodeURIComponent(name)}${account ? '' : `&viandante=${encodeURIComponent(id)}`}`, { headers: account ? { Authorization: `Bearer ${account.token}` } : {}, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : undefined))
      .catch(() => undefined);
    const credits = Number(seen?.viandante?.crediti) || 0;
    const isAnon = account?.anonimo ?? false;
    const lobby = new LobbyScreen({
      name,
      files: snapFiles,
      wandererId: id,
      wandererName: seen?.viandante?.profilo?.nome,
      credits,
      isAnonymous: isAnon,
      onRecharge: async (amount: number) => {
        const token = account?.token;
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            universo: name,
            wandererId: id,
            crediti: amount,
            token,
            returnUrl: window.location.href,
          }),
        });
        return (await res.json()) as { ok: boolean; url?: string; motivo?: string };
      },
    });
    lobbyChoice = await lobby.open();
    loading.hidden = false;
  }
  if (many) loading.textContent = `ingresso nel mondo di «${name}»…`;
  const thin = many ? await joinMany(name, lobbyChoice) : undefined;
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
  // Who the wanderer is (T44a): in a game of many the server repairs it and tells the others; alone the kernel keeps it.
  const profile = new ProfilePanel(
    kernel,
    async (p) => {
      if (thin) {
        const o = await thin.setProfile(p);
        if (o.profilo) keepProfile(name, thin.session.id, o.profilo);
        return o;
      }
      const r = kernel.setProfile(kernel.wanderer().id, p);
      if (!r) return { ok: false, motivo: 'Non è stato possibile.' };
      kernel.saveState();
      return { ok: true, profilo: r.profilo, testo: r.riparato.join('; ') };
    },
    () => (thin ? thin.session.profilo : kernel.profileOf(kernel.wanderer().id)),
    account && thin
      ? {
          anonimo: thin.session.anonimo,
          linkGoogle: () => account!.linkGoogle(),
          signOut: () => account!.signOut(),
          crediti: () => kernel.creditsOf(),
          recharge: async (amount: number) => {
            const token = account?.token;
            const res = await fetch('/api/stripe/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                universo: name,
                wandererId: kernel.wanderer().id,
                crediti: amount,
                token,
                returnUrl: window.location.href,
              }),
            });
            return (await res.json()) as { ok: boolean; url?: string; motivo?: string };
          },
        }
      : undefined,
  );
  // Credit exhaustion modal in multiplayer (T45d): recharge, offline, or abandon
  const creditModal = thin
    ? new CreditExhaustedModal({
        onRecharge: async () => {
          const id = kernel.wanderer().id;
          const token = account?.token;
          const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              universo: name,
              wandererId: id,
              crediti: 5,
              token,
              returnUrl: window.location.href,
            }),
          });
          const data = (await res.json()) as { ok: boolean; url?: string; motivo?: string };
          if (data.url) window.location.href = data.url;
        },
        onOffline: () => {
          kernel.message('Stai giocando in modalità offline con i modelli locali.', 'info');
        },
        onAbandon: () => {
          thin.session.leave();
          window.location.reload();
        },
      })
    : undefined;

  if (thin && creditModal) {
    kernel.bus.on('ui:credits:exhausted', (e: { motivo?: 'finiti' | 'tetto'; testo?: string }) => {
      creditModal.show(e);
    });
  }
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
  // Death in a game of many (T44c): the server has already decided; the screen says what was lost and where one wakes up.
  kernel.bus.on('ui:died', ({ cause, testo, perso, dove }: { cause: string; testo: string; perso: string[]; dove: 'qui' | 'piazza' }) => {
    const on = document.createElement('button');
    on.className = 'primary';
    on.textContent = 'Continua';
    on.onclick = () => {
      deathEl.hidden = true;
      syncFocus();
    };
    const t = document.createElement('div');
    t.className = 'title';
    t.textContent = 'SEI MORTO';
    const lines = [
      cause === 'sete' ? 'La sete ti ha vinto.' : cause === 'fame' ? 'La fame ti ha vinto.' : 'Le ferite ti hanno vinto.',
      perso.length ? `Hai perso: ${perso.join(', ')}.` :'Non hai perso nulla di ciò che portavi.',
      dove === 'piazza' ? 'Riparti dalla piazza.' : 'Riparti da dove sei caduto.',
      testo,
    ].filter(Boolean);
    const why = lines.map((l) => {
      const d = document.createElement('div');
      d.className = 'why';
      d.textContent = l;
      return d;
    });
    const row = document.createElement('div');
    row.className = 'row';
    row.append(on);
    deathEl.replaceChildren(t, ...why, row);
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
    kernel.input.enabled = !tools?.isOpen && !inventory.isOpen && !chat.isOpen && !actions.isOpen && !profile.isOpen && !kernel.dead;
    if (!kernel.input.enabled) kernel.input.releaseAll();
  };
  inventory.onClose = syncFocus;
  chat.onClose = syncFocus;
  profile.onClose = syncFocus;
  if (thin?.session.profilo) keepProfile(name, thin.session.id, thin.session.profilo);
  if (thin?.session.riparato.length) hud.message(`Il tuo profilo: ${thin.session.riparato.join('; ')}.`, 'warn');
  actions.onClose = syncFocus;
  const runGenesis = async () => tools?.runGenesis(online, syncFocus);
  // A universe that was never generated waits for its genesis before the Council paints anything.
  if (!thin) kernel.generationHeld = online && kernel.needsGenesis() && !params.has('skip');
  if (tools) tools.konsole.onGenesis = () => void runGenesis();
  // Another master is another universe (T42d): the store copies this one, from the main line on disk.
  if (tools && thin && client) {
    client.identify(account ? { Authorization: `Bearer ${account.token}` } : { [WANDERER_HEADER]: thin.session.id });
    tools.konsole.onClone = (nome, master, titolari) => client.clone(nome, master, titolari);
  }
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
  const updateAiModelsHud = async () => {
    if (thin) {
      $('#models').textContent = `partita di molti · ${thin.session.nome} (${thin.session.id})${thin.session.anonimo ? ' · anonimo: modelli locali' : ''}`;
      return;
    }
    const base = online ? `Gemini · ${ai.textModel}` : 'offline: luoghi abbozzati, agenti locali';
    if (kernel.ai instanceof RoutedAiModels) {
      const firstQueue = Object.values(kernel.ai.queues)[0] as QueueAiModels | undefined;
      const qState = await QueueAiModels.queryState(firstQueue?.endpoint, firstQueue?.fetchImpl);
      $('#models').textContent = `${base} · ${describeSubscriptions(kernel.ai.table)} · ${describeQueue(qState)}`;
    } else {
      $('#models').textContent = base;
    }
  };
  void updateAiModelsHud();
  kernel.bus.on('usage', () => void updateAiModelsHud());
  if (params.has('skip')) intro.hidden = true;
  if (params.has('ricarica')) {
    const outcome = params.get('ricarica');
    if (outcome === 'successo') {
      hud.message('Ricarica completata! I crediti verranno accreditati dal server.', 'info');
    } else if (outcome === 'annullata') {
      hud.message('Ricarica annullata.', 'warn');
    }
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('ricarica');
    cleanUrl.searchParams.delete('session_id');
    window.history.replaceState({}, '', cleanUrl.toString());
  }
  // Dev: ?dev&teleport=46,0 stops the carpet and drops you at real coordinates (e.g. in the corona).
  const tp = dev && params.get('teleport')?.split(',').map(Number);
  if (tp && tp.length === 2 && tp.every(Number.isFinite)) {
    kernel.carpet()!.active = false;
    Object.assign(kernel.wandererPos(), { x: tp[0], y: tp[1] });
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
      case 'jump':
        // Space jumps in the simulation (T56b); in the corona and the studio it still does what E does.
        if (kernel.jump()) break;
        hud.hideDialog();
        void kernel.interact();
        break;
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
      case 'profile':
        profile.toggle();
        syncFocus();
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
        else if (profile.isOpen) profile.close();
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
