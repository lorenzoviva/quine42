# ADR-0177 — Il generatore sui crediti che avanzano: la generazione differita lanciata dalla pipeline

Data: 2026-11-08 · Stato: accettato (task T88 del backlog, step 31) · Riferimenti: ADR-0087 (tetti e slot dinamici), ADR-0090 (spegnere la pipeline), ADR-0119 (la finestra delle 5 ore), ADR-0143 (la generazione differita), ADR-0077 e ADR-0106 (la coda degli abbonamenti)

## Contesto

La generazione differita (T207, ADR-0143: `npm run genera`) genera un universo prima che qualcuno lo giochi, solo dagli abbonamenti. Costa
crediti ma non macchina: è il lavoro giusto per ciò che a fine settimana resterebbe inutilizzato. L'autore (03/11) vuole che la pipeline la
lanci da sola quando avanza, senza togliere niente ai task. `config.json → generazione` elenca gli universi (nome, ambientazione, tetto per
universo in percentuale della settimana).

## Decisione

- **Quando parte**: a ogni controllo di `esegui` (anche dentro `orchestra`) la pipeline stima **l'avanzo al reset a slot pieni**:
  il ritmo della settimana degli ultimi `giorniPrevisione` giorni (gli stessi campioni di `forecastEmpty`), moltiplicato per `tetto / slot`
  (come se ogni slot fosse occupato), fino al reset settimanale; avanzo = residuo − ritmo × tempo al reset. Il generatore parte se l'avanzo
  è almeno `generatore.minimo` (10 %), la finestra delle 5 ore almeno `sessioneMinima` (30 %), il provider non è fermo né sospeso, c'è un
  posto sotto il tetto della sua CLI (`limiti.provider`, che **non cambia**: il generatore ne occupa uno) e nessun task pronto della stessa
  CLI partirebbe. Senza un ritmo misurato (meno di un'ora di campioni) o senza reset non parte: un avanzo che non si misura non si spende.
- **Su cosa**: il primo universo di `generazione` che non è finito, non ha già raggiunto il suo tetto questa settimana e non è in errore
  da meno di 6 ore. Il tetto dato al comando (`--tetto`) è `min(tettoSettimana, speso questa settimana + avanzo − riserva)`: lo speso lo
  dice il file del progresso della generazione (`universes/.generation/<nome>.json → consumo`), che misura dal contatore di `/usage`.
  Se nessuno serve la coda (il battito `servitore-<provider>.json` di `universes/.queue/`), la pipeline avvia anche `npm run abbonamento`
  e lo ferma con il generatore; l'isolamento della CLI (ADR-0106) non cambia.
- **Quando si ferma**: un task pronto (o sospeso da riprendere) della stessa CLI che partirebbe senza il generatore (`generatorPlace`:
  `fitsOn` e `holdBack` come per i task); la finestra delle 5 ore sotto `sessioneArresto` (15 %); l'avanzo previsto sotto la riserva;
  il provider fermo o sospeso; l'autore che lo spegne; lo spegnimento della pipeline (`ferma --ora|--dopo`, Ctrl+C). Fermarlo uccide il
  processo: il passo in corso non si scrive, quelli prima restano (ADR-0143, `StepGate`), e la volta dopo riprende da lì.
- **Come finisce**: `finito` → l'universo non torna; `tetto` con lo speso al tetto dell'universo → fuori fino al reset, si passa al
  prossimo; `tetto` per l'avanzo di questa esecuzione → niente cambia; `errore` (o un'uscita senza esito) → riprova dopo 6 ore e intanto
  il prossimo.
- **Lo stato** è della pipeline, in `.pipeline/generatore.json` (in corso: universo, pid, log, tetto, speso all'avvio; l'ultima
  esecuzione; gli universi fuori); l'interruttore dell'autore in un file suo (`.pipeline/generatore-spento.json`), così non si scontra
  con la pipeline che scrive lo stato. Il processo è staccato come i task: un `esegui` riavviato lo ritrova dal pid. `stato` e
  `generatore` dicono acceso o spento, cosa genera, quanto ha speso in questa esecuzione e per universo questa settimana, perché aspetta.
- **Acceso e spento**: `node tools/pipeline/pipeline.mjs generatore spegni|accendi`; per sempre `generatore.acceso: false` in
  `config.json`. Non gira con `esegui --task` o `--solo`.

## Scartato

- **Uno slot in più sopra il tetto** per il generatore: l'autore ha detto che il tetto non cambia.
- **Fermarlo dopo il passo in corso** (un segnale che `genera` leggerebbe): una Genesi sono decine di chiamate, e il task pronto
  aspetterebbe; uccidere il processo non perde niente di scritto.
- **Contare il generatore tra i task del backlog**: non ha worktree, branch né esito da integrare.

## Conseguenze

- Il ritmo misurato include il generatore stesso: mentre gira l'avanzo previsto scende, e si ferma da solo prima di mangiare la riserva.
- La stima `tetto / slot` è prudente (un ritmo misurato con pochi slot si moltiplica): meglio non spendere che togliere ai task.
- Il comando del generatore e quello della coda stanno in `config.json → generatore.comando`, `generatore.coda`, con i segnaposto
  `{universo}`, `{ambientazione}`, `{partita}`, `{tetto}` (solo nomi semplici e numeri).
