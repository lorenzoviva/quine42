# Le domande aperte per l'autore

L'elenco unico (richiesta dell'autore, 04/11): l'orchestratore lo tiene aggiornato e lo riporta in chat. I numeri non cambiano; una risposta toglie la riga.

## Architettura e Step 32

- **D32 (T260, T261 — Versioni del kernel e universi):** con la tua decisione («se vuoi giocare sul nuovo kernel devi iniziare un nuovo universo»; gli universi vecchi girano sul server con la versione del kernel su cui sono nati, o in futuro migrano via IA a pagamento), proponiamo di separare ciò che in T183 legava le mani ai kernel futuri da ciò che serve invece *dentro la stessa versione del kernel (0.9.0)* quando si chiude e si riapre la partita:
  1. **Annullare T261 (`plan.tiles`, salvare le caselle di ogni luogo):** serviva *solo* a congelare le caselle contro cambi di `hash32`/MarkovJunior/`layout` tra un kernel e il successivo, e bloccherebbe evoluzioni come il tuo esempio dell'immersione in acqua. Dentro lo stesso kernel 0.9.0 `(piano, seme) + plan.edits` è già deterministico.
  2. **Riscrivere e ridurre T260 (da 6 % a 3 %):** togliere tutte le regole che congelano API, caso, MJ e formati tra versioni del kernel; tenere solo: (a) `universe.json → kernel` che registra la versione del kernel dell'universo e avvisa/rifiuta se lo si apre su una versione incompatibile, (b) un guasto chiaro quando un effetto non ha chi lo applica (utile già in 0.9.0), (c) l'ADR che registra la tua decisione (nuovo kernel = nuovo universo, o server dedicato alla versione precedente / futura migrazione IA a pagamento) e aggiorna il criterio 5 di Fase I in `docs/fasi.md`.
  3. **Lasciare invariati T262, T263 e T245a-f:** non riguardano il cambio di kernel, ma servono dentro la *stessa* versione 0.9.0 perché una partita riaperta il giorno dopo non perda i dati dei moduli (`world.store_get/set` in T245a, salvataggio che non si blocca per un fault in T262) e funzioni in multigiocatore (`W` e `K` in T263).
  *(Raccomandazione: approvare 1, 2 e 3.)*

## Rimandate per tua scelta
T45f a fine Fase I (progetto GCP, hosting, regione); T93 in Fase IV (Managed Payments).
