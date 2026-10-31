# ADR-0087 — Un task per provider: tetti e slot dinamici

Data: 2026-10-30 · Stato: accettato · Estende ADR-0072 e ADR-0079.

## Contesto
`maxParalleli` (5) era un tetto solo per tutta la pipeline, e sotto `sogliaUnSolo` partiva comunque un task per provider. Troppi
task insieme: due lasciati a metà al reset costano più di uno finito, i cambi di provider moltiplicano il costo, crescono i
conflitti, i crediti finiscono in modo imprevedibile e la macchina rallenta.

## Decisione
1. **Il tetto lo decide l'autore**: `limiti` in `tools/pipeline/config.json`, per CLI (`limiti.provider`: `claude`, `agy`) e per
   modello (`limiti.modello`: le voci di `providers`, `claude gemini argon`), all'inizio 1 ciascuno. Il tetto di un provider è il
   più basso tra il suo, quello della sua CLI e `maxParalleli` (`ceilingOf`); i task in corso sulla stessa CLI non superano il suo.
   L'orchestratore non lo alza né fa eccezioni senza un'istruzione esplicita dell'autore (`orchestra.md`).
2. **Slot dinamici sotto il tetto** (`budget.json → slot`, da 1 al tetto): a ogni controllo `esegui` aggiunge un
   campione del residuo settimanale (`storia`, gli ultimi `giorniStoria` giorni, uno ogni `usoSecondi`) e prevede quando la
   settimana arriva al 100 % al ritmo degli ultimi `giorniPrevisione` giorni, dall'ultimo reset (un residuo che risale)
   (`forecastEmpty`). Se la previsione cade **dopo** il reset settimanale (il contatore della settimana di `/usage`, o
   `resetSettimanale`; `weeklyResetOf`), o il provider non consuma, aggiunge uno slot; se cade **prima** lo toglie (`nextSlot`),
   ma **mai sotto 1** (T96: nessun modello con crediti va a zero slot per la previsione); a 0 si va solo con crediti esauriti o
   provider fermo per quota (429). La decisione di non dare nuovi task a un provider per un po' spetta all'orchestratore con i
   comandi `sospendi <provider> [fino a <data>]` / `riattiva <provider>` scritti in `budget.json` e mostrati da `stato`;
   al più uno spostamento ogni `usoSecondi`; senza un reset noto restano. Così, se l'abbonamento cresce, gli slot salgono da soli
   fino al tetto. Conta solo la settimana (Argon non ha le 5 ore).
3. **Vicino a 0 %** (sotto `sogliaUnSolo`, settimana o 5 ore): nessun task nuovo, al più uno in corso (un sospeso può riprendere
   se non ce n'è un altro), nessuno sul provider dell'orchestratore (`capOf`).
4. **La riserva per l'autore**: un task a priorità 0 (riservata alle richieste urgenti dell'autore) può usare uno slot oltre quelli
   dinamici, mai oltre il tetto.
5. **Il programma** (`demandOf`): gli slot non salgono oltre i task che il provider ha in programma, cioè in corso, pronti e
   bloccati solo da altri task del backlog; non contano quelli che aspettano l'autore (`in attesa`, anche attraverso le dipendenze).
6. `stato`, `PIANO.md` e l'interfaccia web mostrano per provider tetto, slot, task in programma, esaurimento previsto e reset.
   `esegui` ora scrive `budget.json` a ogni controllo (storia e slot; anche `letto`, così `/usage` non si rilegge a ogni minuto).

## Conseguenze
- Con i tetti a 1 gira al più un task su Claude e uno su `agy` (Gemini o Argon) alla volta.
- Alzare il parallelismo è una scelta dell'autore in `config.json`; dentro il tetto lo regola il consumo vero.
- La previsione è lineare e ha bisogno di almeno un'ora di campioni; prima, gli slot salgono come se il provider non consumasse
  (fino al tetto e al programma).
