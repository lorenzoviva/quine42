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
import { DEFAULT_SCULPTORS, type SculptorModels } from '../src/kernel/agents/sculptor';
import { bundledFiles } from '../src/kernel/bundle';
import { SEED_FILE, seedHashes } from '../src/kernel/universes';

export interface ActiveSessionRecord {
  name: string;
  active: boolean;
  clients: number;
  wanderers: string[];
}

export interface RealmView {
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
  tettoMinimo: number;
  description: string;
}

/** Escapes special HTML characters to prevent XSS. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

/** Parses a snapshot of files into a RealmView descriptor. */
export function parseRealmSnapshot(name: string, files: FileMap, active?: ActiveSessionRecord): RealmView {
  const { config } = readConfig(files);
  const ai = config.ai;
  const master = config.partita?.master ?? 'io';
  const coef = repairCoefficients(ai.coefficienti);
  const sculpt: SculptorModels = { ...DEFAULT_SCULPTORS, ...(ai.scultori ?? {}) };
  const estimate = hourlyEstimate(ai);

  const presetLabel = isLowDetail(coef)
    ? 'Economico (Low Detail)'
    : COEFFICIENT_KEYS.every((k) => coef[k] === 1)
      ? 'Pieno Dettaglio'
      : `Standard (D: ${coef.dialoghi.toFixed(1)} · I: ${coef.cose.toFixed(1)})`;

  const sculptorSummary =
    sculpt.figura === 'gemini-3.1-flash-lite'
      ? `${ai.textModel} (Low Detail)`
      : `${ai.textModel} + ${sculpt.figura}`;

  const tettoMinimo = ai.minimi?.tetto ?? 1.0;

  let description = 'Reame multigiocatore vivo generato con algoritmi MarkovJunior e intelligenza artificiale.';
  try {
    if (files['world/bible.json']) {
      const bible = JSON.parse(files['world/bible.json']);
      if (typeof bible.concetto === 'string' && bible.concetto.trim()) {
        description = bible.concetto.trim();
      } else if (typeof bible.tema === 'string' && bible.tema.trim()) {
        description = bible.tema.trim();
      }
    }
  } catch {
    /* fallback to default */
  }

  return {
    name,
    seed: config.seed,
    master,
    isMine: master === 'io' || master === 'Master',
    live: !!active?.active,
    clients: active?.clients ?? 0,
    textModel: ai.textModel,
    sculptorSummary,
    coefficientsLabel: presetLabel,
    hourlyCost: estimate.dollari,
    tettoMinimo,
    description,
  };
}

/** Fetches snapshot of a specific universe and parses it. */
export async function fetchRealmDetails(
  name: string,
  activeSessions: Map<string, ActiveSessionRecord>,
  base = '',
): Promise<RealmView | null> {
  try {
    const res = await fetch(`${base}/api/universe/${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const snap = await res.json();
    if (!snap.exists || !snap.files) return null;
    return parseRealmSnapshot(name, snap.files, activeSessions.get(name));
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

  cfg.partita = {
    modalita: 'multigiocatore',
    morte,
    pvp,
    altroTraGiocatori: true,
    master: options.master ?? 'io',
  };

  // AI profile configuration
  if (options.aiProfile === 'low') {
    cfg.ai = {
      ...cfg.ai,
      textModel: 'gemini-3.1-flash-lite',
      scultori: { ...LOW_DETAIL.scultori },
      coefficienti: { ...LOW_DETAIL.coefficienti },
      minimi: { tetto: 0.5, textModel: 'gemini-3.1-flash-lite' },
    };
  } else if (options.aiProfile === 'high') {
    cfg.ai = {
      ...cfg.ai,
      textModel: 'gemini-3.8-flash',
      scultori: {
        semplice: 'gemini-3.8-flash',
        figura: 'gemini-3.8-flash',
        importante: 'gemini-4-argon',
        artista: 'gemini-3.8-flash',
      },
      coefficienti: { ...FULL_DETAIL },
      minimi: { tetto: 2.0, textModel: 'gemini-3.8-flash' },
    };
  } else {
    // standard
    cfg.ai = {
      ...cfg.ai,
      textModel: 'gemini-3.1-flash-lite',
      scultori: {
        semplice: 'gemini-3.1-flash-lite',
        figura: 'gemini-3.8-flash',
        importante: 'gemini-4-argon',
        artista: 'gemini-3.1-flash-lite',
      },
      coefficienti: {
        sessioni: 0.8,
        dialoghi: 0.8,
        trame: 0.8,
        revisioni: 0.75,
        modelli: 0.8,
        persone: 0.8,
        abitanti: 0.8,
        pacchetti: 0.8,
        cose: 0.8,
      },
      minimi: { tetto: 1.0, textModel: 'gemini-3.1-flash-lite' },
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
    const res = await fetch(`${base}/api/universe/${encodeURIComponent(options.name)}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files,
        message: `Genesi nuovo reame git «${options.name}» (seme ${options.seed})`,
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

/** Renders a single realm card HTMLElement. */
export function renderRealmCard(realm: RealmView): HTMLElement {
  const card = document.createElement('div');
  card.className = 'realm-card';
  card.dataset.category = `${realm.live ? 'live ' : ''}${realm.isMine ? 'mine ' : ''}`.trim();

  const liveBadge = realm.live
    ? `<span class="comic-badge green">LIVE · ${realm.clients} ${realm.clients === 1 ? 'VIANDANTE' : 'VIANDANTI'}</span>`
    : `<span class="comic-badge yellow">IN PAUSA</span>`;

  card.innerHTML = `
    <div class="realm-card-header">
      <div>
        ${liveBadge}
        <h3 class="comic-title" style="font-size: 1.6rem; margin: 8px 0 0;">${escapeHtml(realm.name.toUpperCase())}</h3>
      </div>
      <span class="arcade-text text-cyan" style="font-size: 0.65rem;">SEME #${realm.seed}</span>
    </div>
    <div class="realm-card-body">
      <p style="font-size: 0.88rem; color: var(--comic-paper); margin: 0 0 12px; line-height: 1.4;">
        ${escapeHtml(realm.description)}
      </p>
      <table class="realm-spec-table">
        <tbody>
          <tr>
            <td class="text-dim">Master titolare:</td>
            <td><b class="text-cyan">${escapeHtml(realm.master)}</b></td>
          </tr>
          <tr>
            <td class="text-dim">Modelli IA:</td>
            <td><b class="text-yellow">${escapeHtml(realm.sculptorSummary)}</b></td>
          </tr>
          <tr>
            <td class="text-dim">Coefficienti:</td>
            <td><b>${escapeHtml(realm.coefficientsLabel)}</b></td>
          </tr>
          <tr>
            <td class="text-dim">Spesa oraria:</td>
            <td><b class="text-green">~$${realm.hourlyCost.toFixed(2)} / ora</b></td>
          </tr>
          <tr>
            <td class="text-dim">Tetto minimo:</td>
            <td><b>$${realm.tettoMinimo.toFixed(2)} USD</b></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="realm-card-footer">
      <span class="arcade-text text-dim" style="font-size: 0.65rem;">${realm.live ? 'PORTA 5173' : 'OFFLINE'}</span>
      <a href="../index.html?universo=${encodeURIComponent(realm.name)}" class="comic-btn arcade cyan sm">
        ENTRA NELLA LOBBY
      </a>
    </div>
  `;
  return card;
}

// --- DOM Wiring & Interactive Application ---
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const realmsGrid = document.getElementById('realms-grid');
    const filterTabs = document.querySelectorAll('#realm-filter-tabs .comic-tab');
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

    let allRealms: RealmView[] = [];

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
      const cards = realmsGrid?.querySelectorAll<HTMLElement>('.realm-card');
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

    // Load and render all available realms
    async function loadRealms() {
      if (!realmsGrid) return;
      realmsGrid.innerHTML = `
        <div class="realm-loading">
          <span class="comic-badge yellow">CARICAMENTO</span>
          <p class="arcade-text" style="font-size: 0.8rem; margin-top: 12px;">INTERROGAZIONE REAMI E SESSIONI ATTIVE…</p>
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

      const realmPromises = Array.from(namesToLoad).map((name) =>
        fetchRealmDetails(name, activeSessions),
      );

      const results = await Promise.all(realmPromises);
      allRealms = results.filter((r): r is RealmView => r !== null);

      realmsGrid.innerHTML = '';

      if (allRealms.length === 0) {
        realmsGrid.innerHTML = `
          <div class="realm-empty">
            <span class="comic-badge yellow">NESSUN REAME TROVATO</span>
            <h3 class="comic-title" style="font-size: 1.8rem; margin: 12px 0 6px;">NESSUN UNIVERSO DISPONIBILE</h3>
            <p>Non è ancora stato creato alcun reame su questo server.<br />Avvia subito la Genesi del tuo primo mondo git!</p>
            <button class="comic-btn pink" id="btn-empty-create">+ CREA IL PRIMO UNIVERSO</button>
          </div>
        `;
        document.getElementById('btn-empty-create')?.addEventListener('click', openModal);
        return;
      }

      for (const realm of allRealms) {
        realmsGrid.appendChild(renderRealmCard(realm));
      }

      // Update count on active tab
      const currentTab = document.querySelector('#realm-filter-tabs .comic-tab.active');
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
              <span>Inserisci un nome slug per il nuovo reame.</span>
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
        void loadRealms();
      }, 700);
    });

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    navToggle?.addEventListener('click', () => {
      navLinks?.classList.toggle('is-open');
    });

    void loadRealms();
  });
}
