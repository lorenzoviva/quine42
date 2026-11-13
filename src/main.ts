import wasmUri from 'wasmoon/dist/glue.wasm?url';
import { Kernel } from './kernel/kernel';
import { bundledFiles } from './kernel/bundle';
import { localStore, memoryStore } from './kernel/repo';
import { prepareUniverse, SEED_FILE, seedHashes, UniverseChunks, UniverseClient, WANDERER_HEADER, type PastCommit, type UniverseSnapshot } from './kernel/universes';
import type { FileMap } from './kernel/types';
import { readConfig } from './kernel/universe';
import { IdbChunks } from './kernel/chunks';
import { GeminiAiModels } from './kernel/ai/gemini';
import { JevDecisionModels } from './kernel/ai/decisions';
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
import { LobbyScreen, type LobbyResult } from './ui/lobby';
import { CreditExhaustedModal } from './ui/creditdialog';
import { rechargesAvailable } from './ui/recharges';
import { Sfx } from './audio/sfx';
import { readPrograms, SoundDirector, type SoundCue } from './audio/director';
import { SoundRenders } from './audio/renders';
import { bindSoundMenu } from './ui/soundmenu';
import { dayPhase } from './kernel/npc/model';
import { keepsFormsOnDisk } from './render/forms';
import { $ } from './ui/dom';
import { applyTeleport, teleportTarget } from './kernel/teleport';
import type { MasterTools } from './master';
import type { BringRef } from './kernel/bring';
import { breakReason } from './kernel/brokencards';
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
    // A universe of an older contract is ported first (T307a), then takes the seed: one commit says both.
    const up = prepareUniverse(snap.files ?? {}, bundledFiles);
    if (Object.keys(up.changes).length) await client.commit(up.changes, `${up.applied.length ? `migrazione ${up.applied.map((a) => a.split(':')[0]).join(', ')}; ` : ''}aggiornamento dal kernel: ${up.updated.slice(0, 6).join(', ') || 'seme'}${up.updated.length > 6 ? '…' : ''}`, 'kernel');
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
  // The closed decisions (ADR-0157): Jev through the route of this machine, if the server has its key; otherwise the rule of today.
  const decisions = !params.has('offline') && (await JevDecisionModels.available()) ? new JevDecisionModels() : undefined;
  const kernel = await Kernel.boot({ files, store: client ? memoryStore() : localStore, ai: models, decisions, chunks, forms: new WorkerRunner(), wasmUri, backend: client ?? undefined, past });
  return { kernel, online };
}

/** The account this tab signed in with, in a multiplayer game on a server with accounts (T44b). */
let account: SignedIn | undefined;

/**
 * A multiplayer game (T39, ADR-0059): the world runs on the server, this tab is one of its wanderers. The kernel here
 * is a mirror the thin client fills with what the server tells.
 */
async function joinMany(name: string, lobbyChoice?: LobbyResult): Promise<ThinClient> {
  // With accounts (T44b) the wanderer is the account's: the server makes the id from the token.
  const config = await accountConfig();
  if (!account) account = config ? await signIn(config) : undefined;
  const id = account ? accountWanderer(account.uid) : tabWanderer(params);
  const session = new SessionClient(socketLink(name, params.has('offline') || !!lobbyChoice?.offline), {
    id,
    profile: savedProfile(name, id),
    ...(account ? { token: account.token, freshToken: account.freshToken } : {}),
    ...(typeof lobbyChoice?.tetto === 'number' ? { cap: lobbyChoice.tetto } : {}),
    // The master's settings go in with them: the server fixes them on entering, and refuses them if a match is under way (T247).
    ...(lobbyChoice?.regolazioni ? { settings: lobbyChoice.regolazioni } : {}),
  });
  await session.ready;
  if (session.refused || !session.me) throw new Error(session.refused ?? 'il mondo non risponde');
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
  const many = !!snapFiles && readConfig(snapFiles).config.game?.mode === 'multiplayer';
  // Whether this server takes top-ups (ADR-0189): without payments (the open beta) no button of the lobby, the panel P or the credits' modal leads to one.
  const recharges = many && (await rechargesAvailable());
  let lobbyChoice: LobbyResult | undefined;
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
    // The master of a clone nobody entered yet may still bring cards (T295): asked of the store as the master, before the world starts.
    const asMaster = client && readConfig(snapFiles).config.game?.master === id && !isAnon;
    if (asMaster) client.identify(account ? { Authorization: `Bearer ${account.token}` } : { [WANDERER_HEADER]: id });
    const lobby = new LobbyScreen({
      ...(asMaster ? { cards: { load: () => client.kin().catch(() => undefined), bring: (refs: BringRef[]) => client.bring(refs), has: (m: string) => snapFiles[`models/${m}.xml`] !== undefined } } : {}),
      name,
      files: snapFiles,
      wandererId: id,
      wandererName: seen?.viandante?.profilo?.nome,
      credits,
      isAnonymous: isAnon,
      inCorso: !!seen?.viandante?.inCorso,
      onRecharge: !recharges ? undefined : async (amount: number) => {
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
  // multiplayer game only the wanderer who made the universe. A player's client never fetches them.
  const master = !thin || thin.session.master;
  const tooling = master ? import('./master') : undefined;
  const { kernel, online } = thin ? { kernel: thin.k, online: false } : await bootAlone(client, snap, name);
  // Leaving: the state of play goes into the universe (if it is valid); in a multiplayer game the server keeps it.
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
  // Who the wanderer is (T44a): in a multiplayer game the server repairs it and tells the others; alone the kernel keeps it.
  const profile = new ProfilePanel(
    kernel,
    async (p) => {
      if (thin) {
        const o = await thin.setProfile(p);
        if (o.profile) keepProfile(name, thin.session.id, o.profile);
        return o;
      }
      const r = kernel.setProfile(kernel.wanderer().id, p);
      if (!r) return { ok: false, reason: 'Non è stato possibile.' };
      kernel.saveState();
      return { ok: true, profile: r.profilo, text: r.riparato.join('; ') };
    },
    () => (thin ? thin.session.profile : kernel.profileOf(kernel.wanderer().id)),
    account && thin
      ? {
          anonimo: thin.session.anonymous,
          linkGoogle: () => account!.linkGoogle(),
          signOut: () => account!.signOut(),
          crediti: () => kernel.creditsOf(),
          recharge: !recharges ? undefined : async (amount: number) => {
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
        onRecharge: !recharges ? undefined : async () => {
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
    kernel.bus.on('ui:credits:exhausted', (e: { reason?: 'exhausted' | 'cap'; text?: string }) => {
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
  // Death in a multiplayer game (T44c): the server has already decided; the screen says what was lost and where one wakes up.
  kernel.bus.on('ui:died', ({ cause, text, lost, where }: { cause: string; text: string; lost: string[]; where: 'here' | 'square' }) => {
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
      lost.length ? `Hai perso: ${lost.join(', ')}.` : 'Non hai perso nulla di ciò che portavi.',
      where === 'square' ? 'Riparti dalla piazza.' : 'Riparti da dove sei caduto.',
      text,
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
  const renders = new SoundRenders(undefined, keepsFormsOnDisk(location));
  const sound = new SoundDirector(sfx, renders);
  // A brought sound that stays silent here is a card that does not work (T296): the kernel isolates it and the master sees why.
  sound.onFail = (id, reason) => void kernel.cardBroke(id, 'mute', breakReason('mute', { error: reason }));
  (window as any).suono = { sfx, director: sound, renders };
  bindSoundMenu(sfx, $<HTMLInputElement>('#sound-volume'), $<HTMLInputElement>('#sound-mute'));
  const unlockSound = () => {
    sfx.unlock();
    sound.unlock();
  };
  // A player's console sees only the client (T41): what the server told this tab. The master's sees the kernel too.
  (window as any).rune = master ? kernel : thin;
  (window as any).quine = (window as any).rune;
  (window as any).quine42 = (window as any).rune;
  // The session of a multiplayer game (T39): what this tab knows of the server's world.
  if (thin && master) (window as any).session = thin;
  // The 3D view, for the console (camera distance, scene).
  (window as any).view = renderer;
  // The GPU in use (T330): whether the browser took the dedicated one. It stays in this tab.
  (window as any).gpu = renderer.gpu;
  if (renderer.gpu) console.info('[gpu] ' + renderer.gpu);
  Object.defineProperty(kernel, 'godMode', {
    get: () => renderer.godMode,
    set: (v: boolean) => { renderer.godMode = !!v; },
    configurable: true,
  });

  let soloLobby: LobbyScreen | undefined;
  const syncFocus = () => {
    kernel.input.enabled = !soloLobby?.isOpen && !tools?.isOpen && !inventory.isOpen && !chat.isOpen && !actions.isOpen && !profile.isOpen && !kernel.dead;
    if (!kernel.input.enabled) kernel.input.releaseAll();
  };
  inventory.onClose = syncFocus;
  chat.onClose = syncFocus;
  profile.onClose = syncFocus;
  if (thin?.session.profile) keepProfile(name, thin.session.id, thin.session.profile);
  if (thin?.session.repaired.length) hud.message(`Il tuo profilo: ${thin.session.repaired.join('; ')}.`, 'warn');
  const settled = thin?.session.settingsAnswer;
  if (settled && !settled.ok) hud.message(`Regolazioni non applicate: ${settled.reason}.`, 'warn');
  else if (settled?.repaired?.length) hud.message(`Regolazioni riparate: ${settled.repaired.join('; ')}.`, 'warn');
  actions.onClose = syncFocus;
  const runGenesis = async () => tools?.runGenesis(online, syncFocus, params.has('offline'));
  // A universe that was never generated waits for its genesis before the Council paints anything.
  // Alone, nothing is asked of the models until the settings are fixed on entering (T247): the lobby, or the Genesis.
  const entersWithLobby = !thin && !params.has('skip') && !kernel.needsGenesis() && (online || params.has('lobby'));
  if (!thin) kernel.generationHeld = (online && kernel.needsGenesis() && !params.has('skip')) || entersWithLobby;
  // With `?skip` there is no screen before the world: the match starts now.
  if (!thin && params.has('skip')) kernel.lockSettings();
  if (tools) tools.konsole.onGenesis = () => void runGenesis();
  // Another master is another universe (T42d): the store copies this one, from the main line on disk.
  if (tools && thin && client) {
    client.identify(account ? { Authorization: `Bearer ${account.token}` } : { [WANDERER_HEADER]: thin.session.id });
    // A token that expired is renewed and the write tried again (T265).
    const signed = account;
    if (signed) client.renewAuth = async () => ({ Authorization: `Bearer ${await signed.freshToken()}` });
    tools.konsole.onClone = (nome, master, titolari) => client.clone(nome, master, titolari);
  }
  kernel.bus.on('genesis:done', ({ title }) => hud.showBanner(title.toUpperCase(), 'Un nuovo universo è stato scritto. Il tappeto ti riporta al centro.', 4000));

  kernel.input.attach(window);
  kernel.input.onAny = unlockSound;
  window.addEventListener('pointerdown', unlockSound);
  const intro = $('#intro');
  const help = $('#help');
  const helpBeyond = $('#help-beyond');
  const startGame = () => {
    if (intro.hidden) return;
    intro.classList.add('out');
    setTimeout(() => (intro.hidden = true), 700);
    unlockSound();
    sound.cue('start');
    if (!thin && kernel.needsGenesis() && !params.has('skip')) void runGenesis().then(() => kernel.lockSettings());
    else if (entersWithLobby) void enterAlone();
    else if (!thin) kernel.lockSettings();
  };
  // Alone (T247): the same lobby, without what is about other people; it comes back with every new load of the page, which is what ends a match alone.
  const enterAlone = async () => {
    soloLobby = new LobbyScreen({ name, files: kernel.files, wandererId: kernel.wanderer().id, credits: 0, alone: true, decisions: kernel.council.decisions !== kernel.council.localAiModels });
    const chosen = soloLobby.open();
    syncFocus();
    const choice = await chosen;
    if (choice.regolazioni) kernel.applySettings(choice.regolazioni);
    kernel.lockSettings();
    kernel.generationHeld = false;
    syncFocus();
  };
  window.addEventListener('keydown', startGame);
  intro.addEventListener('click', startGame);
  const updateAiModelsHud = async () => {
    if (thin) {
      $('#models').textContent = `partita di molti · ${thin.session.name} (${thin.session.id})${thin.session.anonymous ? ' · anonimo: modelli locali' : ''}`;
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
  // Dev: ?dev&teleport=46,0 stops the carpet and drops you at real coordinates (e.g. in the corona), always the same
  // point: the offset saved by pagehide does not apply (T264).
  const tp = teleportTarget(params, dev);
  if (tp) applyTeleport(kernel, tp);

  for (const cue of ['rune:picked', 'item:picked', 'item:placed', 'item:used', 'item:action', 'ui:container', 'item:crafted', 'rune:inscribed', 'spell:cast', 'rollback', 'forge:done'] as SoundCue[]) kernel.bus.on(cue, () => sound.cue(cue));
  kernel.bus.on('fault', ({ isNew }) => isNew && sound.cue('fault'));
  kernel.bus.on('zone', ({ zone }) => zone === 'corona' && kernel.coronaRevealed() && sound.cue('beyond'));
  kernel.bus.on('wanderer:jumped', () => sound.cue('jump'));
  kernel.bus.on('ui:death', () => sound.cue('death'));
  kernel.bus.on('ui:died', () => sound.cue('death'));

  // What the music looks at, twice a second. The sound must not be able to stop the frame, whatever the world's state.
  let soundFiles: unknown;
  let soundIndex: unknown;
  let soundAt = 0;
  const updateSound = (now: number) => {
    if (now - soundAt < 500) return;
    soundAt = now;
    try {
      if (kernel.files !== soundFiles || kernel.files['models/index.json'] !== soundIndex) {
        soundFiles = kernel.files;
        soundIndex = kernel.files['models/index.json'];
        sound.setPrograms(readPrograms(kernel.files));
      }
      const here = kernel.wandererCarpet();
      sound.update({ beyond: kernel.coronaRevealed(), environment: kernel.chunkAt(here.x, here.y)?.plan?.layout, phase: dayPhase(kernel.time, Kernel.DAY_SECONDS), seed: kernel.config.seed });
    } catch {
      /* silence, and the game goes on */
    }
  };

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
        kernel.inscribePhrase();
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
    updateSound(now);
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
