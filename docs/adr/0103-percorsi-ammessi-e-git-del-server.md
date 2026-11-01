# ADR-0103 — I percorsi ammessi in un universo e il git del server

Stato: accettato (T121, V-003; 01/11/2026)

## Contesto

Il server scrive i file di un universo in una cartella in cui poi lancia git. Scrivere nella cartella di git (la configurazione,
gli hook) è quindi eseguire codice su questa macchina: è uscire dal gioco. Le difese di prima confrontavano `.git` alla lettera
(`safePath` in `universeStore.ts`, `cleanBranch` in `session/server.ts`); il kit di T137 ha misurato su Windows che `.GIT`, `.Git`,
`GIT~1` e `.git::$INDEX_ALLOCATION` arrivano lì. Dopo ADR-0102 può farlo solo il master o chi sta su questa macchina, ma in una partita
di molti il master è un giocatore qualunque del server: non deve poter uscire dal suo mondo.

## Decisione

**Un elenco di ciò che è ammesso, non di ciò che è vietato** (`src/kernel/paths.ts`, puro: lo usano magazzino, mondo e client).
Un percorso è ammesso se:

- è `universe.json` o `seed.json`, oppure sta in `modules/ models/ world/ maps/ prompts/` (scritte esattamente così);
- ogni segmento è fatto di lettere e cifre ASCII, `_ - .`, non comincia con un punto e non finisce con un punto;
- nessun segmento è un nome riservato di Windows (`con prn aux nul clock com0-9 lpt0-9`), con o senza estensione;
- al più 200 caratteri.

Niente quindi da normalizzare: maiuscole della cartella, punti e spazi finali, flussi NTFS (`:`), nomi corti (`~`), barre di Windows, percorsi
assoluti, `..`, Unicode che un file system ripiega, virgole (`--cacheinfo` di git) non sono una forma da ricondurre a un'altra: sono rifiutati.
L'elenco viene da ciò che il kernel scrive davvero, guardato nel codice e negli universi su disco. Fuori restano `assets/` del vecchio 2D (resta
su disco, nessuno la scrive più) e `.gitattributes` (la scrive il magazzino da sé, alla creazione). Un `.gitattributes`, `.gitignore` o `.gitmodules` più in
basso non passa: comincia con un punto.

Il controllo sta nel punto che scrive (`safePath`) e prima: un commit, un ramo o una creazione con un percorso rifiutato rispondono 400 e **non scrivono nulla**, nemmeno gli
altri file; `cleanBranch` rifiuta il ramo intero; le mappe (`PUT map`) passano dallo stesso controllo.
Lo stesso vale per i nomi che diventano un file o una cartella: `UNIVERSE_NAME_RE` (unica, ora in `paths.ts`) e `validWandererId` non sono dispositivi; l'id di un modulo nemmeno (validatore).

**Il client non perde un commit per un percorso solo.** Un commit porta solo ciò che è cambiato: se il magazzino lo rifiutasse per un file che il giocatore ha chiamato male, gli altri
non arriverebbero più su disco. `UniverseClient` toglie i percorsi non ammessi, lo dice (`lastError`, console) e manda il resto; il file resta in memoria, nel gioco, finché non si ricarica (regola 3).

**Il server lancia git da un punto solo** (`server/git.ts`, `runGit`; lo usano `universeStore`, `stripe`, `wanderer`), con, a ogni comando:

- `core.hooksPath=/dev/null`. **Non vuoto**, come diceva il task: provato con git 2.46 su Windows, un valore vuoto fa cercare `/pre-commit` alla radice del disco;
- `core.fsmonitor=false` (un comando che git lancerebbe da solo);
- `core.protectNTFS=true`, `core.protectHFS=true`: voci degli alberi che sono la cartella di git sotto altro nome, rifiutate su ogni sistema;
- `GIT_CEILING_DIRECTORIES` sulla cartella di sopra: **git non risale** a cercare un repository. `universes/` sta dentro il repository del kernel: un `commit` su un universo senza `.git`
  avrebbe fatto `git add -A` e `git commit` nel progetto. Ora dà errore, e il `commit` su un universo che non c'è è rifiutato prima di scrivere.

Le opzioni `-c` vincono sulla configurazione del repository: anche una configurazione già toccata non sceglie più hook né monitor (la prova: un hook vero e un `core.hooksPath`
scritti nel repository non girano col server, e girano con un git lasciato a sé).

## Alternative

- **Normalizzare e poi vietare `.git`** (ciò che il task accennava): ogni file system ha le sue equivalenze; quelle di oggi le ha trovate il kit, le prossime no. Con l'elenco non serve conoscerle.
- **Vietare i soli nomi pericolosi su Windows**: gli universi si spostano tra macchine; lo stesso elenco ovunque.
- **`GIT_CONFIG_*`/`safe.directory` al posto di `-c`**: `GIT_CONFIG_NOSYSTEM` e un `GIT_CONFIG_GLOBAL` vuoto non toccano la configurazione del repository, che è quella in gioco.

## Conseguenze

- Un file nuovo a un altro livello dell'universo (una cartella nuova) è una riga in `paths.ts`, e chi la aggiunge decide con questo ADR davanti.
- Un id con più di 200 caratteri di percorso o con caratteri fuori elenco non arriva su disco. Gli id generati stanno già dentro (`ID_RE`, `MODEL_RE`).
- Ciò che T130 (V-013) chiede al Concilio, scrivere solo in un elenco di percorsi, è più stretto di questo e resta suo: qui si decide ciò che **può stare** in un universo, non chi scrive cosa.
- Non coperto: i link simbolici. Nessuna via del server ne crea (i file si scrivono con `fs.writeFile`, gli alberi dei rami sono tutti `100644`); chi ha già accesso alla macchina è fuori dal modello di ADR-0102.
