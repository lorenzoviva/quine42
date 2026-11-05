# ADR-0137 — Il salvataggio che non si ferma: un guasto invalida il codice, non i dati

Data: 2026-11-05 · Stato: accettato (task T262 del backlog) · Riferimenti: D9 dell'autore (04/11), T183 (`docs/design/espressivita.md`, primitiva 3 della divisione e `TRAP: every module that calls it`), ADR-0021 (due repository), regole 3 e 6 di `AGENTS.md`

## Contesto

La regola 6 diceva «si committano solo stati validi», e il kernel la leggeva come «con un guasto aperto non si salva nulla»: `saveState` e `saveUsage` tornavano `false` a ogni guasto, di qualunque modulo e di qualunque giocatore. Una runa rotta di un viandante fermava i salvataggi di tutti; un modulo generato che fallisce a runtime fermava la partita finché l'Ingegnere non lo riparava. In una vita di mesi è la perdita più probabile. L'autore (D9): un guasto a runtime di un modulo invalida il codice, non i dati della partita.

D'altra parte un commit prendeva sempre tutti i file di lavoro: il codice che il giocatore scrive dall'editor senza commit (un manifest rotto, scritto lo stesso perché è un suo diritto) finiva nel primo commit di qualcun altro, del Concilio o del salvataggio, e diventava uno stato «valido».

## Decisione

1. **Ciò che non è uno stato valido è trattenuto da ogni commit.** Il kernel tiene `unsaved`: i file che il giocatore ha scritto senza commit (`saveFile` rifiutato o con l'universo rotto). `Repo.withheld` li consegna al repository, che a ogni commit li prende come li ha HEAD (o non li prende, se HEAD non li ha). Restano nei file di lavoro, dove il mondo li esegue e l'editor li mostra. Escono da `unsaved` quando diventano validi (`saveFile` con il commit, `publish`) o quando si torna indietro (`R`, un commit di una sessione di prima).
2. **Con un guasto aperto stato, viandanti, consumi, carte e piani si salvano.** `saveState` e `saveUsage` non guardano più i guasti; i piani dei luoghi (`putMap`) non li guardavano già. Il guasto di un giocatore non ferma i salvataggi degli altri.
3. **Non si salva niente di un universo che non è di questo mondo**: `universe.json` illeggibile (`universe:config`, il mondo gira sulla configurazione predefinita) o di un altro kernel (`universe:kernel`, ADR-0136). Lì i dati in memoria non sono dell'universo.
4. **`R` e l'Ingegnere restano come sono.** `R` torna all'ultimo commit (o a quello scelto) come prima, e svuota `unsaved`. La riparazione dell'Ingegnere non tocca un file che il giocatore ha cambiato (regola 3): `lastAuthorOf` lo vede come suo finché è diverso da HEAD.
5. **Chi torna all'ultimo stato valido del codice tiene i dati dell'ultimo salvataggio.** Poiché i salvataggi con il guasto aperto sono commit, l'ultimo commit ha il codice valido e i dati più recenti: `R` senza argomento rimette il codice com'era e lascia stato e viandanti come li ha salvati l'ultimo `saveState` (al più due minuti di gioco indietro, o il salvataggio dell'uscita). Un `R` verso un commit più vecchio riporta anche i dati di quel momento, come sempre: è un ritorno nel tempo.

## Alternative scartate

- **Due rami, uno del codice e uno dei dati**: un commit dell'universo è uno stato intero, che `R` e il clone (ADR-0068) usano tutto insieme; due storie da tenere allineate sono un formato nuovo.
- **Salvare solo `world/`** con un guasto aperto: lascerebbe fuori i file che il kernel scrive altrove e farebbe salvare un `world/rules.json` scritto a mano e rotto; trattenere ciò che è rotto è più preciso di indovinare ciò che è dati.
- **Fermare il Concilio con un guasto aperto**: il Concilio scrive moduli validati; ciò che rompe il mondo è il codice non valido, che ora non entra in nessun commit.

## Conseguenze

- La regola 6 di `AGENTS.md` dice la distinzione.
- `tests/espressivita/`: `LIMIT (lasting state): one fault anywhere and nothing is saved` e `TRAP: every module that calls it` ora affermano che il salvataggio continua.
- Sicurezza: nessuna superficie nuova. Nessuna rotta né messaggio cambia; un commit contiene ora meno di prima (mai il codice trattenuto), e ciò che si salva in più sono gli stessi file di sempre (`world/stato.json`, `world/giocatori/`, consumi e carte).
