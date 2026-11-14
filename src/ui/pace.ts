// The pace of the world in the master's tools (T373, ADR-0188 §3): the console («Concilio») and the Direction have the same row. Three buttons, the one
// in use lit; what the world took, or why not, beside them until the next change. Only the master sees it.

import type { Kernel } from '../kernel/kernel';
import { PACE_MODES, PACE_NAME, placesPerMinute, type PaceMode } from '../kernel/worldPace';
import { el } from './dom';

/** What was said of the last change, for every row of the page: the console redraws often. */
let said = '';

/** What the pace means now, in a line: the places a minute of a slow world, never above the lobby's. */
export function paceLine(k: Kernel): string {
  const p = k.worldPace();
  const lobby = k.manyPlayers() ? (k.config.ai.placesPerMinute ?? 20) : Infinity;
  if (p.mode === 'hold') return 'in pausa: i luoghi nuovi restano abbozzati e il mondo non fa niente da sé (modelli, brani, trame, dialoghi fra individui, sessioni); le risposte ai viandanti continuano. I giocatori lo vedono scritto.';
  if (p.mode === 'slow') return `lento: ${placesPerMinute(p, lobby)} luoghi nuovi al minuto, le pause dello Scultore e del Musicista raddoppiate.`;
  return `normale: ciò che è stato regolato entrando${Number.isFinite(lobby) ? ` (${lobby} luoghi nuovi al minuto)` : ''}.`;
}

/** The row: «Ritmo: normale · lento · in pausa», and what it means. `changed` redraws who shows it. */
export function paceRow(k: Kernel, changed: () => void): HTMLElement {
  const now = k.worldPace().mode;
  const button = (mode: PaceMode) => {
    const b = el('button', { class: mode === now ? 'primary' : '', 'data-pace': mode }, PACE_NAME[mode]);
    b.onclick = () => {
      if (mode === k.worldPace().mode) return;
      b.setAttribute('disabled', '');
      void k
        .setPace({ mode })
        .then((r) => (said = r.ok ? `✓ ritmo ${PACE_NAME[r.pace.mode]}` : `✗ ${r.reason}`))
        .catch((e: Error) => (said = `✗ ${e.message}`))
        .finally(changed);
    };
    return b;
  };
  return el(
    'div',
    { class: 'pace', 'data-pace-row': '' },
    el('div', { class: 'row' }, 'Ritmo del mondo: ', ...PACE_MODES.map(button)),
    el('div', { class: 'note' }, `${paceLine(k)} Solo verso il basso: mai più di quanto deciso entrando.${said ? ` ${said}` : ''}`),
  );
}
