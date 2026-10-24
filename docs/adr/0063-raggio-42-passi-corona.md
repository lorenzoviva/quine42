# ADR-0063 — Il raggio 42: i 42 passi verso la corona

Data: 2026-10-24 · Stato: accettato (task T60 del backlog) · Modifica: ADR-0004, ADR-0009

## Contesto
Con l'adozione del nome QUINE42 (ADR-0062, tributo al quine e alla *Guida Galattica per gli Autostoppisti*),
il cerchio di simulazione trova il suo allineamento naturale: il raggio del cerchio passa da 44 a 42 caselle.
In precedenza, per varcare il cerchio e accedere alla corona (lo studio della software house) occorrevano
44 passi dal centro (0,0) dopo aver fermato il tappeto con `carpet.active = false`. Con 42, l'intero universo
risponde alla cifra simbolica 42: servono esattamente 42 passi per varcare il confine della simulazione.

## Decisione
1. **Configurazione dell'universo e default nel kernel**:
   - In `universe/universe.json` il valore di `circleRadius` è impostato a `42`.
   - In `src/kernel/universe.ts` il valore di fallback in `DEFAULT_CONFIG` è impostato a `42`.
2. **Invisibilità e frustum**:
   - Confermato il principio di ADR-0009: `coronaRevealed()` si attiva solo quando la distanza del giocatore dal
     centro supera il 45% del raggio (`42 * 0.45 = 18.9` caselle). Finché il tappeto è attivo, il giocatore è
     mantenuto a raggio < 2 dal centro; la corona è invisibile e nessun elemento del campus viene renderizzato
     o risulta raggiungibile.
   - Con la telecamera prospettica in 3/4 a distanza 15 e visuale nominale di circa 20 caselle, dal centro (0,0)
     nessuna struttura, viale o luce del campus entra nel frustum finché il tappeto è attivo.
3. **Filtro quarta parete**:
   - `src/kernel/fourthwall.ts` include `42 passi|quarantadue passi` tra le espressioni vietate nei contenuti
     narrativi generati per proteggere la finzione diegetica dei due tavoli (ADR-0025).
4. **Documentazione e test**:
   - Aggiornato `README.md` (spoiler di uscita: 42 passi anziché 44), `AGENTS.md` e le suite di test
     (`tests/corona.test.ts`, `tests/kernel.test.ts`).

## Conseguenze
- Fermando il tappeto, bastano esattamente 42 passi in linea retta dal centro (0,0) per varcare il cerchio e rivelare il campus della corona.
- Coerenza totale tra il titolo QUINE42 e la misura fondamentale del mondo.
