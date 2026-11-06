// site/sessioni.ts — Hub delle sessioni multigiocatore e wizard di creazione nuovo universo (T103, ADR-0095)

import type { FileMap } from '../src/kernel/types';
import { readConfig } from '../src/kernel/universe';
import {
  COEFFICIENT_KEYS,
  FULL_DETAIL,
  hourlyEstimate,
  isLowDetail,
  LOW_DETAIL,
  repairCoefficients,
} from '../src/kernel/coefficients';
import { DEFAULT_SCULPTORS, type SculptorAiModels } from '../src/kernel/agents/sculptor';
import { internalSculptors } from '../src/kernel/internalNames';
import { bundledFiles } from '../src/kernel/bundle';
import { SEED_FILE, seedHashes, WANDERER_HEADER } from '../src/kernel/universes';
import { rangeLabel } from '../src/kernel/version';
import { SOLO } from '../src/kernel/wanderers';
import { accountConfig, signIn } from '../src/session/login';
import { escapeHtml } from './shared';

export interface ActiveSessionRecord {
  name: string;
  active: boolean;
  clients: number;
}

export interface UniverseView {
  name: string;
  seed: number;
  master: string;
  isMine: boolean;
  live: boolean;
  clients: number;
  textModel: string;
  sculptorSummary: string;
  coefficientsLabel: string;
  hourlyCost: number;
  minCap: number;
  description: string;
  /** When this kernel does not run it, the range of the kernels it runs on, «kernel 0.1–0.1» (T302): it is shown, never deleted. */
  kernels?: string;
}

/** Fetches active sessions from /api/session. */
export async function fetchActiveSessions(base = ''): Promise<Map<string, ActiveSessionRecord>> {
  const map = new Map<string, ActiveSessionRecord>();
  try {
    const res = await fetch(`${base}/api/session`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.sessions)) {
        for (const s of data.sessions) {
          if (s?.name) map.set(s.name, s);
        }
      }
    }
  } catch (err) {
    console.warn('[sessioni] impossibile recuperare sessioni attive:', err);
  }
  return map;
}

/** Fetches the list of universe folders from /api/universe. */
export async function fetchUniverses(base = ''): Promise<string[]> {
  try {
    const res = await fetch(`${base}/api/universe`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.universes)) {
        return data.universes;
      }
    }
  } catch (err) {
    console.warn('[sessioni] impossibile recuperare elenco universi:', err);
  }
  return [];
}

/** A number from a universe's files, which may say anything: what is not one counts as nothing, and never reaches the page as text. */
const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Parses a snapshot of files into a UniverseView descriptor. */
export function parseUniverseSnapshot(name: string, files: FileMap, active?: ActiveSessionRecord): UniverseView {
  const { config } = readConfig(files);
  const ai = config.ai;
  const kernels = rangeLabel(config);
  const master = config.game?.master ?? 'me';
  const coef = repairCoefficients(ai.coefficients);
  const sculpt: SculptorAiModels = { ...DEFAULT_SCULPTORS, ...internalSculptors(ai.sculptors ?? {}) };
  const estimate = hourlyEstimate(ai);

  const presetLabel = isLowDetail(coef)
    ? 'Economico (Low Detail)'
    : COEFFICIENT_KEYS.every((k) => coef[k] === 1)
      ? 'Pieno Dettaglio'
      : `Standard (D: ${coef.dialogues.toFixed(1)} · I: ${coef.entities.toFixed(1)})`;

  const sculptorSummary =
    sculpt.figure === 'gemini-3.1-flash-lite'
      ? `${ai.textModel} (Low Detail)`
      : `${ai.textModel} + ${sculpt.figure}`;

  const minCap = toNumber(ai.minimums?.cap ?? 1.0);

  let description = 'Universo multigiocatore vivo generato con algoritmi MarkovJunior e intelligenza artificiale.';
  try {
    if (files['world/bible.json']) {
      const bible = JSON.parse(files['world/bible.json']);
      if (typeof bible.concept === 'string' && bible.concept.trim()) {
        description = bible.concept.trim();
      } else if (typeof bible.theme === 'string' && bible.theme.trim()) {
        description = bible.theme.trim();
      }
    }
  } catch {
    /* fallback to default */
  }

  return {
    name,
    seed: toNumber(config.seed),
    master,
    isMine: master === 'me' || master === 'Master',
    live: !!active?.active,
    clients: toNumber(active?.clients),
    textModel: ai.textModel,
    sculptorSummary,
    coefficientsLabel: presetLabel,
    hourlyCost: toNumber(estimate.dollari),
    minCap,
    description,
    ...(kernels ? { kernels } : {}),
  };
}

/** Fetches snapshot of a specific universe and parses it. */
export async function fetchUniverseDetails(
  name: string,
  activeSessions: Map<string, ActiveSessionRecord>,
  base = '',
): Promise<UniverseView | null> {
  try {
    const res = await fetch(`${base}/api/universe/${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const snap = await res.json();
    if (!snap.exists || !snap.files) return null;
    return parseUniverseSnapshot(name, snap.files, activeSessions.get(name));
  } catch {
    return null;
  }
}

/** Builds files for a newly initialized universe based on wizard options. */
export function buildNewUniverseFiles(options: {
  name: string;
  seed: number;
  mode: 'narrativa' | 'sopravvivenza' | 'sfida';
  aiProfile: 'standard' | 'low' | 'high';
  master?: string;
}): FileMap {
  const files: FileMap = { ...bundledFiles };
  const cfg = JSON.parse(files['universe.json'] ?? '{}');

  cfg.name = options.name;
  cfg.seed = options.seed;

  // Rules and death punishment
  let morte = 3;
  let pvp = false;
  if (options.mode === 'narrativa') {
    morte = 1;
    pvp = false;
  } else if (options.mode === 'sfida') {
    morte = 4;
    pvp = true;
  } else {
    morte = 3;
    pvp = false;
  }

  cfg.game = {
    mode: 'multiplayer',
    death: morte,
    pvp,
    freeActionsBetweenPlayers: true,
    master: options.master ?? 'me',
  };

  // AI profile configuration
  if (options.aiProfile === 'low') {
    cfg.ai = {
      ...cfg.ai,
      textModel: 'gemini-3.1-flash-lite',
      sculptors: { ...LOW_DETAIL.sculptors },
      coefficients: { ...LOW_DETAIL.coefficients },
      minimums: { cap: 0.5, textModel: 'gemini-3.1-flash-lite' },
    };
  } else if (options.aiProfile === 'high') {
    cfg.ai = {
      ...cfg.ai,
      textModel: 'gemini-3.8-flash',
      sculptors: {
        simple: 'gemini-3.8-flash',
        figure: 'gemini-3.8-flash',
        important: 'gemini-4-argon',
        artist: 'gemini-3.8-flash',
      },
      coefficients: { ...FULL_DETAIL },
      minimums: { cap: 2.0, textModel: 'gemini-3.8-flash' },
    };
  } else {
    // standard
    cfg.ai = {
      ...cfg.ai,
      textModel: 'gemini-3.1-flash-lite',
      sculptors: {
        simple: 'gemini-3.1-flash-lite',
        figure: 'gemini-3.8-flash',
        important: 'gemini-4-argon',
        artist: 'gemini-3.1-flash-lite',
      },
      coefficients: {
        sessions: 0.8,
        dialogues: 0.8,
        plots: 0.8,
        reviews: 0.75,
        models: 0.8,
        people: 0.8,
        inhabitants: 0.8,
        packs: 0.8,
        entities: 0.8,
      },
      minimums: { cap: 1.0, textModel: 'gemini-3.1-flash-lite' },
    };
  }

  files['universe.json'] = JSON.stringify(cfg, null, 2) + '\n';
  files[SEED_FILE] = JSON.stringify(seedHashes(bundledFiles), null, 1) + '\n';
  return files;
}

/** Calls the /api/universe/<name>/create endpoint to create a git universe repository. */
export async function createUniverse(
  options: {
    name: string;
    seed: number;
    mode: 'narrativa' | 'sopravvivenza' | 'sfida';
    aiProfile: 'standard' | 'low' | 'high';
  },
  base = '',
): Promise<{ ok: boolean; error?: string; head?: string }> {
  const slugRegex = /^[a-z0-9][a-z0-9-]{0,40}$/;
  if (!slugRegex.test(options.name)) {
    return { ok: false, error: 'Il nome deve contenere solo caratteri minuscoli, numeri o trattini (max 40).' };
  }

  const files = buildNewUniverseFiles(options);
  try {
    // Whoever makes a universe is its master, and the server is who says who they are (T120, ADR-0102).
    const config = await accountConfig();
    const signed = config ? await signIn(config) : undefined;
    const res = await fetch(`${base}/api/universe/${encodeURIComponent(options.name)}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(signed ? { Authorization: `Bearer ${signed.token}` } : { [WANDERER_HEADER]: SOLO }) },
      body: JSON.stringify({
        files,
        message: `Genesi nuovo universo git «${options.name}» (seme ${options.seed})`,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error ?? `Errore HTTP ${res.status}` };
    }
    return { ok: true, head: data.head };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Renders a single universe card HTMLElement. */
export function renderUniverseCard(universe: UniverseView): HTMLElement {
  const card = document.createElement('div');
  card.className = 'universe-card';
  card.dataset.category = `${universe.live ? 'live ' : ''}${universe.isMine ? 'mine ' : ''}`.trim();

  const liveBadge = universe.live
    ? `<span class="comic-badge green">LIVE · ${universe.clients} ${universe.clients === 1 ? 'VIANDANTE' : 'VIANDANTI'}</span>`
    : `<span class="comic-badge yellow">IN PAUSA</span>`;
  // Out of the kernels it runs on (T302): the label, and it opens with the fault that says why.
  const kernelBadge = universe.kernels ? ` <span class="comic-badge pink" title="Questo universo gira su altri kernel: si apre con il guasto che lo dice, e non si salva">${escapeHtml(universe.kernels.toUpperCase())}</span>` : '';

  card.innerHTML = `
    <div class="universe-card-header">
      <div>
        ${liveBadge}${kernelBadge}
        <h3 class="comic-title" style="font-size: var(--text-29); margin: var(--space-8) 0 0;">${escapeHtml(universe.name.toUpperCase())}</h3>
      </div>
      <span class="arcade-text text-cyan" style="font-size: var(--text-11);">SEME #${universe.seed}</span>
    </div>
    <div class="universe-card-body">
      <p style="font-size: var(--text-13); color: var(--skin-text); margin: 0 0 var(--space-13); line-height: var(--leading-snug);">
        ${escapeHtml(universe.description)}
      </p>
      <table class="universe-spec-table">
        <tbody>
          <tr>
            <td class="text-dim">Master titolare:</td>
            <td><b class="text-cyan">${escapeHtml(universe.master)}</b></td>
          </tr>
          <tr>
            <td class="text-dim">Modelli IA:</td>
            <td><b class="text-yellow">${escapeHtml(universe.sculptorSummary)}</b></td>
          </tr>
          <tr>
            <td class="text-dim">Coefficienti:</td>
            <td><b>${escapeHtml(universe.coefficientsLabel)}</b></td>
          </tr>
          <tr>
            <td class="text-dim">Spesa oraria:</td>
            <td><b class="text-green">~$${universe.hourlyCost.toFixed(2)} / ora</b></td>
          </tr>
          <tr>
            <td class="text-dim">Tetto minimo:</td>
            <td><b>$${universe.minCap.toFixed(2)} USD</b></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="universe-card-footer">
      <span class="arcade-text text-dim" style="font-size: var(--text-11);">${universe.live ? (globalThis.location?.port ? `PORTA ${location.port}` : '') : 'OFFLINE'}</span>
      <a href="../index.html?universo=${encodeURIComponent(universe.name)}" class="comic-btn arcade cyan sm">
        ENTRA NELLA LOBBY
      </a>
    </div>
  `;
  return card;
}

// --- DOM Wiring & Interactive Application ---
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const universesGrid = document.getElementById('universes-grid');
    const filterTabs = document.querySelectorAll('#universe-filter-tabs .comic-tab');
    // Here and not in the HTML: the pages' policy (ADR-0111) runs no inline handler.
    document.getElementById('form-create-universe')?.addEventListener('submit', (e) => e.preventDefault());
    const btnOpenWizard = document.getElementById('btn-open-wizard');
    const btnCloseWizard = document.getElementById('btn-close-wizard');
    const btnCancelWizard = document.getElementById('btn-cancel-wizard');
    const btnConfirmWizard = document.getElementById('btn-confirm-wizard');
    const wizardModal = document.getElementById('wizard-modal');
    const btnRandSeed = document.getElementById('btn-wizard-rand-seed');
    const inputName = document.getElementById('new-univ-name') as HTMLInputElement | null;
    const inputSeed = document.getElementById('new-univ-seed') as HTMLInputElement | null;
    const selectMode = document.getElementById('new-univ-mode') as HTMLSelectElement | null;
    const selectAi = document.getElementById('new-univ-ai') as HTMLSelectElement | null;
    const statusMsg = document.getElementById('wizard-status-msg');

    let allUniverses: UniverseView[] = [];

    function openModal() {
      if (wizardModal) {
        wizardModal.classList.add('is-open');
        if (inputName) {
          inputName.value = '';
          inputName.focus();
        }
        if (inputSeed) inputSeed.value = String(Math.floor(Math.random() * 9000) + 1000);
        if (statusMsg) statusMsg.innerHTML = '';
      }
    }

    function closeModal() {
      if (wizardModal) wizardModal.classList.remove('is-open');
    }

    btnOpenWizard?.addEventListener('click', openModal);
    btnCloseWizard?.addEventListener('click', closeModal);
    btnCancelWizard?.addEventListener('click', closeModal);
    wizardModal?.addEventListener('click', (e) => {
      if (e.target === wizardModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wizardModal?.classList.contains('is-open')) {
        closeModal();
      }
    });

    btnRandSeed?.addEventListener('click', () => {
      if (inputSeed) inputSeed.value = String(Math.floor(Math.random() * 9000) + 1000);
    });

    // Filtering logic
    function applyFilter(filter: string) {
      const cards = universesGrid?.querySelectorAll<HTMLElement>('.universe-card');
      cards?.forEach((card) => {
        if (filter === 'all') {
          card.style.display = 'flex';
        } else {
          const category = card.dataset.category || '';
          card.style.display = category.includes(filter) ? 'flex' : 'none';
        }
      });
    }

    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.getAttribute('data-filter') || 'all';
        applyFilter(filter);
      });
    });

    // Load and render all available universes
    async function loadUniverses() {
      if (!universesGrid) return;
      universesGrid.innerHTML = `
        <div class="universe-loading">
          <span class="comic-badge yellow">CARICAMENTO</span>
          <p class="arcade-text" style="font-size: var(--text-13); margin-top: var(--space-13);">INTERROGAZIONE UNIVERSI E SESSIONI ATTIVE…</p>
        </div>
      `;

      const [activeSessions, universeNames] = await Promise.all([
        fetchActiveSessions(),
        fetchUniverses(),
      ]);

      // If universeNames is empty, check if any active session or seed universe exists
      const namesToLoad = new Set<string>(universeNames);
      for (const activeName of activeSessions.keys()) {
        namesToLoad.add(activeName);
      }

      // If still empty, check the default seed universe
      if (namesToLoad.size === 0) {
        namesToLoad.add('aurora');
      }

      const universePromises = Array.from(namesToLoad).map((name) =>
        fetchUniverseDetails(name, activeSessions),
      );

      const results = await Promise.all(universePromises);
      allUniverses = results.filter((r): r is UniverseView => r !== null);

      universesGrid.innerHTML = '';

      if (allUniverses.length === 0) {
        universesGrid.innerHTML = `
          <div class="universe-empty">
            <span class="comic-badge yellow">NESSUN UNIVERSO TROVATO</span>
            <h3 class="comic-title" style="font-size: var(--text-29); margin: var(--space-13) 0 var(--space-5);">NESSUN UNIVERSO DISPONIBILE</h3>
            <p>Non è ancora stato creato alcun universo su questo server.<br />Avvia subito la Genesi del tuo primo mondo git!</p>
            <button class="comic-btn pink" id="btn-empty-create">+ CREA IL PRIMO UNIVERSO</button>
          </div>
        `;
        document.getElementById('btn-empty-create')?.addEventListener('click', openModal);
        return;
      }

      for (const universe of allUniverses) {
        universesGrid.appendChild(renderUniverseCard(universe));
      }

      // Update count on active tab
      const currentTab = document.querySelector('#universe-filter-tabs .comic-tab.active');
      const currentFilter = currentTab?.getAttribute('data-filter') || 'all';
      applyFilter(currentFilter);
    }

    // Wizard confirmation handler
    btnConfirmWizard?.addEventListener('click', async () => {
      const name = (inputName?.value || '').trim().toLowerCase();
      const seed = parseInt(inputSeed?.value || '42', 10);
      const mode = (selectMode?.value || 'sopravvivenza') as 'narrativa' | 'sopravvivenza' | 'sfida';
      const aiProfile = (selectAi?.value || 'standard') as 'standard' | 'low' | 'high';

      if (!name) {
        if (statusMsg) {
          statusMsg.innerHTML = `
            <div class="comic-alert error">
              <span class="comic-badge pink">ERRORE</span>
              <span>Inserisci un nome slug per il nuovo universo.</span>
            </div>
          `;
        }
        return;
      }

      btnConfirmWizard.classList.add('is-loading');
      if (statusMsg) {
        statusMsg.innerHTML = `
          <div class="comic-alert info">
            <span class="comic-badge cyan">GENESI</span>
            <span>Creazione repository git e commit iniziale in corso…</span>
          </div>
        `;
      }

      const result = await createUniverse({ name, seed, mode, aiProfile });
      btnConfirmWizard.classList.remove('is-loading');

      if (!result.ok) {
        if (statusMsg) {
          statusMsg.innerHTML = `
            <div class="comic-alert error">
              <span class="comic-badge pink">ERRORE</span>
              <span>${escapeHtml(result.error ?? 'Creazione fallita.')}</span>
            </div>
          `;
        }
        return;
      }

      if (statusMsg) {
        statusMsg.innerHTML = `
          <div class="comic-alert success">
            <span class="comic-badge green">COMPLETATO</span>
            <span>Universo «${escapeHtml(name)}» creato con successo (commit: ${escapeHtml(result.head ?? 'head')})!</span>
          </div>
        `;
      }

      setTimeout(() => {
        closeModal();
        void loadUniverses();
      }, 700);
    });

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    navToggle?.addEventListener('click', () => {
      navLinks?.classList.toggle('is-open');
    });

    void loadUniverses();
  });
}
