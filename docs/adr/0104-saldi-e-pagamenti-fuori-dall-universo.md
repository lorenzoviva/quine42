# ADR-0104 — Saldi e pagamenti fuori dall'universo

Stato: accettato (T125, V-005 e V-010; 02/11/2026). Modifica ADR-0081 (dove stanno i crediti, chi li ricarica) e ADR-0083 (dove stanno i pagamenti).

## Contesto

I crediti sono l'unica cosa del gioco che non si deve poter modificare (`docs/sicurezza/README.md`), ma stavano in
`world/giocatori/<id>.json` e `world/pagamenti.json`, dentro il repository dell'universo: un `checkout`, un ramo pubblicato, un clone
li portavano con sé. Il kit di T137 lo ha misurato: il ritorno a un commit riportava indietro il saldo, un ramo pubblicato lo cambiava,
il master riceveva nei file i saldi di tutti. Il controllo «questo evento è già accreditato?» stava in un file letto e riscritto fuori da
ogni coda: 8 consegne dello stesso evento, 2 accrediti (V-005.a). E la risposta del Referente, testo di un modello, diventava `giveCredits` senza tetto.

## Decisione

**Un archivio del server** (`server/ledger.ts`): `universes/.saldi/<nome>.json`, uno per universo, fuori da ogni repository (la cartella
comincia con un punto: nessun universo può chiamarsi così e nessun elenco la mostra). Dice `saldi`, `eventi` (i pagamenti accreditati, con
l'id dell'evento di Stripe), `ricariche` (i doni del master). Il kernel conosce solo `Ledger` (`src/kernel/credits.ts`, `KernelOptions.ledger`):
sul server l'archivio, in uno specchio o in un test la memoria.

**Atomico.** Ogni operazione è un passo solo, sincrono, sotto un file di lucchetto (`wx`) che vale tra processi e thread: rilegge il libro, cambia, scrive un
file temporaneo, `fsync`, rinomina. Ciò che controlla e ciò che scrive non si separano: lo stesso evento in contemporanea accredita una volta, da
qualunque via arrivi (mondo acceso o disco, sono lo stesso archivio). Un lucchetto più vecchio di 15 s è di un processo morto. **Un archivio che non si legge
non è un archivio vuoto**: non si scrive sopra, l'accredito fallisce, il webhook risponde 500 e Stripe riconsegna; una lettura di saldo dà l'ultimo noto e non ferma il mondo.

**Nessuna via da dentro.** `Ledger` non ha un'operazione che metta un saldo a un numero. `Host` non ha nulla che ci arrivi, quindi Lua nemmeno; il kernel non legge
più `crediti` dai file (`readWandererState` lo toglie, `wandererState` non lo scrive) e non scrive più nulla nella storia per un addebito. Quindi: rollback, ramo
pubblicato, commit del Concilio o del mondo, codice generato non cambiano un saldo. Il clone non porta saldi: nasce con un archivio vuoto (prima li duplicava).
«Ripartire dal seme» non li tocca: il cestino prende l'universo, l'archivio resta, e chi ha pagato non perde ciò che ha pagato.

**Il Concilio non muove denaro.** L'incarico `crediti` del Referente non c'è più (schema, prompt, kernel, `SessionServer`): una risposta di un modello, che
un testo può dettare, non diventa mai un accredito, nemmeno se dice ancora `crediti`.

**La ricarica a mano.** La fa solo il master dell'universo, in multigiocatore, dalla console (scheda «Universo»): messaggio `ricarica {viandante, quanti}`, sul server
`kernel.grantCredits`, a un viandante che il mondo conosce e non anonimo; scritta in `ricariche` con chi, a chi, quanto, quando. **Il tetto vale per universo e per
giorno (UTC), sommando tutti i destinatari**: `QUINE_TETTO_RICARICHE` nel `.env` (dollari); se non c'è, **20 senza account** (server locale: il master è chi sta sulla
macchina, spende la sua chiave) e **0 con gli account**. Con gli account chiunque può fare un universo e diventarne master, e un dono di crediti spende la chiave di chi tiene il
server: si apre solo se lo decide lui. Il tetto di `GeminiGate` (ADR-0099) resta sotto, comunque.

**Migrazione.** La prima volta che il server incontra un universo senza archivio (`ledgerOf`), legge dai file saldi (tranne gli anonimi) e pagamenti: è l'unica lettura, poi
quei file non contano più. Poi `sweepBalances` toglie `world/pagamenti.json` e il campo `crediti` dai viandanti, con un commit di quei soli file. Lo stesso dopo un `checkout`, che può riportarli: non
contano nulla e non restano. Un universo fatto dopo (`create`, `clone`) ha subito un archivio vuoto (`sealLedger`), così ciò che i suoi file dicono non entra mai.

Ai client il server manda il saldo di ciascuno solo a lui (`stato.crediti`, `/api/viandante`, `/api/crediti`); al master arrivano i nomi degli altri, non i loro saldi.

## Alternative

- **Un database** (`node:sqlite`, ancora sperimentale in Node 22, o un pacchetto nativo): più di quanto serve per pochi viandanti per universo, e una dipendenza da compilare su Windows.
  Se i pagamenti crescono, `Ledger` è il punto da sostituire. Il file si riscrive intero a ogni addebito: al ritmo delle chiamate ai modelli va bene.
- **Riscrivere la storia per togliere i saldi vecchi**: no. La storia è dell'universo e la si fa vedere (linea del tempo, `R`). Restano quindi leggibili al master, nei commit di prima della migrazione, i
  saldi di allora: informazione vecchia, che non muove nulla. Accettato.
- **Tenere il Referente con un tetto**: resta un modello che decide di denaro, per un risparmio di un clic.
- **Un accredito in coda (`serial`) invece del lucchetto**: non basterebbe. I moduli caricati con `ssrLoadModule` non sono le stesse istanze del server, e T127 metterà i mondi in worker.

## Conseguenze

- `crediti` non esiste più in `WandererState`, `world/pagamenti.json` non si crea più; `creditFile` (ADR-0102) resta a difesa dello stato del viandante.
- T127: un mondo in un worker può tenere il suo `FileLedger` (nessun segreto dentro, il lucchetto regge), oppure chiedere al processo principale.
- I test: `tests/sicurezza/saldi.test.ts`. La corsa è forzata in tre modi: 8 consegne con un commit in mezzo per più giri, metà attraverso il mondo acceso e metà no, quattro processi veri sullo stesso archivio.
- Non provato: `kill -9` nel mezzo di una scrittura su un disco che mente sull'`fsync`; un disco condiviso in rete, dove il lucchetto `wx` può non valere: l'archivio sta su un disco locale.
