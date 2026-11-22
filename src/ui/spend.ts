// The spending of the session in play (T496, D69.4): what the models cost since the page opened and at what pace an hour, for the master and
// for whoever pays, in the profile (P) and in the Council's panel. Out of the world (rule 0): only the interface says it, never a content.

import { PACE_SECONDS, usd, type SpendView } from '../kernel/ai/usage';

/** The lines of the spending: the session, its pace an hour, the lobby's estimate (alone), the common expenses (where everyone pays). */
export function spendLines(v: SpendView, opts: { estimate?: number; local?: boolean } = {}): string[] {
  const out: string[] = [];
  const pace = v.hour !== undefined ? `al ritmo di questa sessione circa ${usd(v.hour)} l’ora` : `il ritmo orario dopo i primi ${Math.round(PACE_SECONDS / 60)} minuti di gioco`;
  if (v.whose === 'world') out.push(`Questa sessione: ${usd(v.session)} di modelli; ${pace}.`);
  else if (v.whose === 'master') out.push(`Le tue richieste in questa sessione: ${usd(v.session)}, le paga il master; ${pace}.`);
  else {
    out.push(`Le tue richieste in questa sessione: ${usd(v.session)}; ${pace}.`);
    if (v.common !== undefined) out.push(`Le spese comuni del mondo in questa sessione: ${usd(v.common)}, divise fra chi gioca.`);
  }
  if (opts.estimate !== undefined) out.push(`La stima della lobby per queste regolazioni: circa ${usd(opts.estimate)} l’ora.`);
  if (opts.local && v.session === 0) out.push('Con i modelli locali non si spende niente.');
  return out;
}

/** The pace alone, for a line that is short (the Council's panel): «· 3,80 $/h», or nothing before the pace is known. */
export const paceTag = (v: SpendView): string => (v.hour !== undefined ? ` · ${usd(v.hour)}/h` : '');
