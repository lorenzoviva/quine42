import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { collectionOf } from '../src/kernel/cards';
import { addBudgetFromCap } from '../src/kernel/credits';
import { repairMinimums } from '../src/kernel/universe';
import { KERNEL_VERSION } from '../src/kernel/version';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { LobbyScreen } from '../src/ui/lobby';
import { CreditExhaustedModal } from '../src/ui/creditdialog';
import type { TextCall } from '../src/kernel/ai/models';

const DT = 1 / 60;

async function bootMany(extraCfg: Record<string, unknown> = {}): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = {
    ...bundledFiles,
    'universe.json': JSON.stringify(
      {
        ...cfg,
        game: { mode: 'multiplayer', death: 3 },
        ...extraCfg,
      },
      null,
      2,
    ),
  };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}

async function thin(
  server: SessionServer,
  id: string,
  opts: { tetto?: number } = {},
): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, ...(opts.tetto !== undefined ? { cap: opts.tetto } : {}) });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
  return new ThinClient(k, session);
}

function run(server: SessionServer, clients: ThinClient[], frames: number) {
  for (let i = 0; i < frames; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

describe('lobby requirements, minimums and tetto budgets (T45d)', () => {
  it('repairMinimums cleans universe quality and budget minimums', () => {
    expect(repairMinimums(null)).toBeUndefined();
    expect(repairMinimums({})).toBeUndefined();

    const clean = repairMinimums({
      textModel: ' gemini-3.8-flash ',
      scultori: { struttura: 'gemini-3.8-flash' },
      tetto: 1.5,
      coefficienti: { sessioni: 0.5 },
    });
    expect(clean).toBeDefined();
    expect(clean!.textModel).toBe('gemini-3.8-flash');
    expect(clean!.sculptors?.structure).toBe('gemini-3.8-flash');
    expect(clean!.cap).toBe(1.5);
    expect(clean!.coefficients?.sessions).toBe(0.5);
  });

  it('addBudgetFromCap expands the session AI limits proportionally', () => {
    const ai = {
      textModel: 'gemini-3.1-flash-lite',
      maxText: 800,
      maxForges: 3,
      maxPacks: 4,
      maxCast: 3,
      maxModels: 40,
    };

    expect(addBudgetFromCap(ai, 0)).toEqual({ textCalls: 0, forges: 0, packs: 0, cast: 0, models: 0 });
    expect(ai.maxText).toBe(800);

    const added = addBudgetFromCap(ai, 2.0);
    expect(added.textCalls).toBe(1500); // 2.0 * 750
    expect(added.forges).toBe(4);
    expect(added.packs).toBe(4);
    expect(added.cast).toBe(2);
    expect(added.models).toBe(10);

    expect(ai.maxText).toBe(2300);
    expect(ai.maxForges).toBe(7);
    expect(ai.maxPacks).toBe(8);
    expect(ai.maxCast).toBe(5);
    expect(ai.maxModels).toBe(50);
  });

  it('entrant credit spending cap (tetto) adds to universe AI budgets upon joining', async () => {
    const k = await bootMany();
    const initialTextLimit = k.ai.limits.text;
    const initialMaxText = k.config.ai.maxText;

    const server = new SessionServer(k);
    const master = await thin(server, 'me');
    // The ceiling stays within the balance (T120).
    k.giveCredits('carlo', 5);
    const player = await thin(server, 'carlo', { tetto: 1.0 });
    run(server, [master, player], 6);

    expect(k.sessionCapOf('carlo')).toBe(1.0);
    expect(k.sessionSpentOf('carlo')).toBe(0);

    // AI budget increased by 750 calls from $1.00 tetto
    expect(k.ai.limits.text).toBe(initialTextLimit + 750);
    expect(k.config.ai.maxText).toBe(initialMaxText + 750);
  });

  it('spending cap (tetto) reached: requests fallback to local models and notice sent to client', async () => {
    class TrackingAiModels extends MockAiModels {
      onlineCalls: string[] = [];
      async text(call: TextCall): Promise<string> {
        this.onlineCalls.push(call.task);
        return super.text(call);
      }
    }

    const online = new TrackingAiModels();
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = {
      ...bundledFiles,
      'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2),
    };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: online });
    k.giveCredits('carlo', 10.0); // Has plenty of credits

    const server = new SessionServer(k);
    const master = await thin(server, 'me');
    // Carlo enters with tetto of 0.05 USD
    const carlo = await thin(server, 'carlo', { tetto: 0.05 });
    run(server, [master, carlo], 6);

    expect(k.hasCredits('carlo')).toBe(true);

    // Call 1: prompt costing $0.025 (+1% fee = $0.02525)
    k.ai.onCall!({
      model: 'gemini-3.1-flash-lite',
      agent: 'narrator',
      task: 'npc.reply',
      prompt: 100_000,
      cached: 0,
      output: 0,
      thoughts: 0,
      who: 'carlo',
    });

    expect(k.sessionSpentOf('carlo')).toBeCloseTo(0.02525, 5);
    expect(k.hasCredits('carlo')).toBe(true);

    // Call 2: another $0.02525 -> total spent $0.0505 > tetto ($0.05)
    k.ai.onCall!({
      model: 'gemini-3.1-flash-lite',
      agent: 'narrator',
      task: 'npc.reply',
      prompt: 100_000,
      cached: 0,
      output: 0,
      thoughts: 0,
      who: 'carlo',
    });

    expect(k.sessionSpentOf('carlo')).toBeGreaterThan(0.05);
    // Carlo still has credit balance > 9 USD, but reached session tetto!
    expect(k.creditsOf('carlo')).toBeGreaterThan(9.0);
    expect(k.hasCredits('carlo')).toBe(false);

    // Council feed reports tetto reached
    expect(
      k.feed().some((f) => f.kind === 'info' && f.text.includes('ha raggiunto il tetto di crediti fissato')),
    ).toBe(true);

    // Propagate server update to client
    run(server, [master, carlo], 6);

    // Client carlo received the 'credits' notice, with the reason 'cap'
    const creditNotice = carlo.session.notices.find((n) => n.type === 'credits');
    expect(creditNotice).toBeDefined();
    expect(creditNotice?.reason).toBe('cap');

    // Subsequent call uses local models, NOT online
    online.onlineCalls = [];
    await k.council.write('narrator', 'npc.reply', 'Dimmi ancora qualcosa', { chi: 'carlo' });
    expect(online.onlineCalls).not.toContain('npc.reply');
  });

  it('cards collection outside of the match with usages (T45d)', () => {
    const files = {
      ...bundledFiles,
      'world/cards.json': JSON.stringify({
        utilizzi: {
          'kind:custom_forge': { luoghi: 5, trame: 2, prompt: 10 },
          'item:spada_runica': { luoghi: 3, trame: 1, prompt: 4 },
        },
        luoghi: {
          '0_0': {
            author: 'cartographer',
            payer: 'carlo',
            holder: 'carlo',
          },
        },
      }),
      'modules/custom.forge/manifest.json': JSON.stringify({
        id: 'custom_forge',
        name: 'Forgia Antica',
        kind: 'sistema',
        card: {
          author: 'engineer',
          payer: 'carlo',
          holder: 'carlo',
        },
      }),
      'modules/core.items/manifest.json': JSON.stringify({
        id: 'core.items',
        name: 'Oggetti Base',
        kind: 'data',
        items: [
          {
            id: 'spada_runica',
            name: 'Spada Runica',
            description: 'Lama scintillante.',
            category: 'arma',
            weight: 3,
            stack: 1,
            tags: ['arma'],
            glyph: '⚔',
            color: '#c0c0c0',
            card: {
              author: 'narrator',
              payer: 'carlo',
              holder: 'carlo',
            },
          },
        ],
      }),
    };

    const cards = collectionOf(files, 'carlo');
    expect(cards.length).toBeGreaterThanOrEqual(3);

    const forgeCard = cards.find((c) => c.id === 'kind:custom_forge');
    expect(forgeCard).toBeDefined();
    expect(forgeCard?.tipo).toBe('module');
    expect(forgeCard?.nome).toBe('Forgia Antica');
    expect(forgeCard?.author).toBe('engineer');
    expect(forgeCard?.payer).toBe('carlo');
    expect(forgeCard?.holder).toBe('carlo');
    expect(forgeCard?.uses).toEqual({ chunks: 5, plots: 2, prompt: 10 });

    const swordCard = cards.find((c) => c.id === 'item:spada_runica');
    expect(swordCard).toBeDefined();
    expect(swordCard?.tipo).toBe('item');
    expect(swordCard?.nome).toBe('Spada Runica');
    expect(swordCard?.uses).toEqual({ chunks: 3, plots: 1, prompt: 4 });

    const chunkCard = cards.find((c) => c.id === 'chunk:0_0');
    expect(chunkCard).toBeDefined();
    expect(chunkCard?.tipo).toBe('chunk');
    expect(chunkCard?.holder).toBe('carlo');

    // Wanderer with no cards gets an empty list
    expect(collectionOf(files, 'unknown_wanderer')).toEqual([]);
  });

  it('LobbyScreen and CreditExhaustedModal UI workflow and choices', async () => {
    class FakeElement {
      tagName: string;
      className = '';
      hidden = false;
      disabled = false;
      value = '';
      private _text = '';
      children: FakeElement[] = [];
      attributes: Record<string, string> = {};
      onclick?: (e?: any) => void;

      constructor(tag: string) {
        this.tagName = tag.toUpperCase();
      }

      get textContent(): string {
        if (this.children.length === 0) return this._text;
        return this.children.map((c) => c.textContent).join('');
      }

      set textContent(v: string) {
        this._text = v;
        this.children = [];
      }

      setAttribute(k: string, v: string) {
        this.attributes[k] = v;
        if (k === 'hidden') this.hidden = true;
        if (k === 'disabled') this.disabled = true;
      }

      removeAttribute(k: string) {
        delete this.attributes[k];
        if (k === 'hidden') this.hidden = false;
        if (k === 'disabled') this.disabled = false;
      }

      getAttribute(k: string) {
        return this.attributes[k];
      }

      append(...items: (FakeElement | string)[]) {
        for (const item of items) {
          if (typeof item === 'string') {
            const text = new FakeElement('span');
            text.textContent = item;
            this.children.push(text);
          } else if (item) {
            this.children.push(item);
          }
        }
      }

      appendChild(item: FakeElement) {
        this.append(item);
        return item;
      }

      replaceChildren(...items: (FakeElement | string)[]) {
        this.children = [];
        this._text = '';
        this.append(...items);
      }

      querySelector(sel: string): FakeElement | null {
        // `tag[attr='value']`: the tag with that attribute (the lobby has more than one input, T157).
        const withAttr = /^(\w+)\[(\w+)='([^']*)'\]$/.exec(sel);
        for (const c of this.children) {
          if (sel.startsWith('.') && c.className.split(' ').includes(sel.slice(1))) return c;
          if (sel.startsWith('#') && c.attributes['id'] === sel.slice(1)) return c;
          if (withAttr ? c.tagName.toLowerCase() === withAttr[1] && c.attributes[withAttr[2]] === withAttr[3] : c.tagName.toLowerCase() === sel) return c;
          const found = c.querySelector(sel);
          if (found) return found;
        }
        return null;
      }

      querySelectorAll(sel: string): FakeElement[] {
        const out: FakeElement[] = [];
        for (const c of this.children) {
          if (sel.startsWith('.') && c.className.split(' ').includes(sel.slice(1))) out.push(c);
          if (sel.startsWith('#') && c.attributes['id'] === sel.slice(1)) out.push(c);
          if (c.tagName.toLowerCase() === sel) out.push(c);
          out.push(...c.querySelectorAll(sel));
        }
        return out;
      }
    }

    const elements = new Map<string, FakeElement>();
    const body = new FakeElement('body');
    (globalThis as any).document = {
      body,
      getElementById(id: string) {
        return elements.get(id) ?? null;
      },
      createElement(tag: string) {
        const el = new FakeElement(tag);
        return el as unknown as HTMLElement;
      },
    };

    try {
      // 1. Test LobbyScreen
      const files = {
        ...bundledFiles,
        'universe.json': JSON.stringify({
          name: 'mondo-multi',
          kernel: KERNEL_VERSION,
          game: { mode: 'multiplayer', master: 'me' },
          ai: {
            textModel: 'gemini-3.1-flash-lite',
            maxText: 800,
            maxForges: 3,
            minimi: { tetto: 1.0 },
          },
        }),
      };

      const lobby = new LobbyScreen({
        name: 'mondo-multi',
        files,
        wandererId: 'carlo',
        wandererName: 'Carlo',
        credits: 5.0,
      });

      const openPromise = lobby.open();
      expect(lobby.isOpen).toBe(true);

      const root = (lobby as any).root as FakeElement;
      expect(root.textContent).toContain('LOBBY MULTIGIOCATORE');
      expect(root.textContent).toContain('mondo-multi');
      expect(root.textContent).toContain('Carlo');
      expect(root.textContent).toContain('$5.00');

      // Tetto input
      const input = root.querySelector("input[type='number']") as FakeElement;
      expect(input).toBeDefined();

      // Enter with tetto below minimum (e.g. 0.50 < 1.00)
      input.value = '0.50';
      const btnEnter = root.querySelector('.primary') as FakeElement;
      btnEnter.onclick!();
      expect(lobby.isOpen).toBe(true); // still open due to error
      const statusEl = root.querySelector('.lobby-status') as FakeElement;
      expect(statusEl.textContent).toContain('tetto minimo');

      // Enter with valid tetto (2.00)
      input.value = '2.00';
      btnEnter.onclick!();
      const choice = await openPromise;
      expect(choice).toEqual({ tetto: 2.0 });
      expect(lobby.isOpen).toBe(false);
      // A universe of this kernel says nothing of its kernels; one out of its range shows the label, and is entered all the same (T302).
      expect(root.textContent).not.toContain('gira su altri kernel');
      const old = new LobbyScreen({ name: 'vecchio', files: { ...files, 'universe.json': JSON.stringify({ ...JSON.parse(files['universe.json']), kernel: '0.0.2', kernels: { from: '0.0' } }) }, wandererId: 'me', credits: 5.0, alone: true });
      const oldOpen = old.open();
      const oldRoot = (old as any).root as FakeElement;
      expect(oldRoot.textContent).toContain('kernel 0.0–0.0: questo universo gira su altri kernel');
      (oldRoot.querySelector('.primary') as FakeElement).onclick!();
      await oldOpen;

      // 2. Test CreditExhaustedModal
      let recharged = false;
      let offlined = false;
      let abandoned = false;

      const modal = new CreditExhaustedModal({
        onRecharge: () => {
          recharged = true;
        },
        onOffline: () => {
          offlined = true;
        },
        onAbandon: () => {
          abandoned = true;
        },
      });

      modal.show({ reason: 'exhausted' });
      expect(modal.isOpen).toBe(true);
      const modalRoot = (modal as any).root as FakeElement;
      expect(modalRoot.textContent).toContain('Crediti esauriti');

      const btns = modalRoot.querySelectorAll('button');
      expect(btns.length).toBe(3);

      // Offline click
      btns[1].onclick!();
      expect(offlined).toBe(true);
      expect(modal.isOpen).toBe(false);

      // Show tetto modal
      modal.show({ reason: 'cap' });
      expect(modal.isOpen).toBe(true);
      expect(modalRoot.textContent).toContain('Tetto di spesa raggiunto');

      // Abandon click
      btns[2].onclick!();
      expect(abandoned).toBe(true);
      expect(modal.isOpen).toBe(false);

      // Recharge click
      modal.show({ reason: 'exhausted' });
      await btns[0].onclick!();
      expect(recharged).toBe(true);
    } finally {
      delete (globalThis as any).document;
    }
  });
});
