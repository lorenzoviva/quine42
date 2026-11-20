# La prima run della closed beta (T457)

Un'ora di gioco registrata, con Gemini vero, su una versione ferma del progetto. Questa guida dice che cosa lanciare, come regolare,
che cosa guardare e che cosa fare se qualcosa va storto. Non è una parte della pagina delle istruzioni: resta fuori dalla build.

## In breve

| | |
|---|---|
| Branch | `beta/run-1`, fuori dalla pipeline: la testa di `3d` del 20/11 (`ff2ca4e2`, kernel 0.10.6) più la correzione di T457 (kernel 0.10.7, ADR-0231) e questa guida |
| Worktree | `H:\projects\rune\.claude\worktrees\beta-run-1` (con `node_modules` suo, la build in `dist/` già fatta, il `.env`) |
| Universo | **`orichalcum`** (la copia), da soli sul PC, senza account; di riserva **`sidera`** (la copia) |
| Tetto | `GEMINI_TETTO_GIORNALIERO=6` dollari al giorno (stima a pieno dettaglio: 2,38 $/h); TypeSafe 0,50 $ al giorno |
| Comando | `npx vite preview --port 4800 --strictPort` dal worktree della run |
| Indirizzo | `http://localhost:4800/?universo=orichalcum` |

## Il comando

In PowerShell:

```powershell
cd H:\projects\rune\.claude\worktrees\beta-run-1
netstat -ano | findstr :4800          # niente: la porta è libera (altrimenti scegline un'altra e usala sempre quella)
npx vite preview --port 4800 --strictPort
```

Poi in Chrome: `http://localhost:4800/?universo=orichalcum`. **Senza `?universo=` si apre `aurora`**, l'universo di prova del seme.

La preview serve la build di `dist/` (già fatta sul commit della run) e, dallo stesso processo, il varco di Gemini (`/api/gemini`), quello di
TypeSafe e il repository dell'universo. Non serve `npm run dev`: da soli la build è più stabile e più leggera. Se cambi qualcosa nel codice,
prima `npm run build`.

**Usa sempre la stessa porta.** Ciò che il gioco non riesce a consegnare al server quando chiudi la scheda (l'ultimo salvataggio) resta nel
browser per quell'indirizzo e parte alla prossima apertura dello stesso indirizzo (ADR-0122). Un'altra porta è un altro indirizzo: quelle
scritture aspetterebbero lì.

## Che cosa c'è nel worktree

- **Gli universi** in `universes/`, copiati con `git clone` da quelli del base (`H:\projects\rune\.claude\worktrees\step8.2A-lab3d\universes\`,
  che non sono stati toccati), senza remote: niente può tornare agli originali.
  - `orichalcum` e `sidera`: **riportati a una partita da soli** (`game.mode: single`, un commit nella copia; gli originali restano in
    multigiocatore) e **col viandante nuovo**: in `orichalcum` era salvato morto di sete da una prova di prima, in `sidera` a metà sete;
    senza `world/players/me.json` il kernel fa nascere un viandante nuovo nella piazza (fame e sete 85, la borsa delle rune). Il tag
    `prima-della-run-1` segna lo stato di partenza di tutte e due.
  - `neapolis` e `mesa` restano in multigiocatore (vedi sotto); `aurora` è il medioevo di prova, migrato al primo caricamento (0.9 → 0.10).
  - Controllati con `lab/scripts/controlla-universo.ts`: 25 piani letti dal kernel e 0 guasti in `orichalcum`, `neapolis`, `sidera`, `mesa`
    (1664 in `aurora`). Le mancanze (`npm run mancanze`): 12 richieste non riuscite, quasi tutte riscolpiture di strutture rimaste col
    programma di prima (in `orichalcum` la Taverna della Caldaia, il capannone dei telai al primo giro); nessuna blocca il gioco.
  - `mesa` (il far west) dice `name: aurora` e il seme 1337 in `universe.json`, come `aurora`: è nato così dalla generazione differita. Va
    bene per aprirlo, ma non è l'universo da registrare.
- **Il `.env`** del worktree (non nel repository): la chiave di Google dalla cartella principale, quella di TypeSafe dal base,
  `GEMINI_TETTO_GIORNALIERO=6`, `TYPESAFE_TETTO_GIORNALIERO=0.5`, `QUINE_PAGAMENTI=spenti`; niente OpenRouter (il gioco va su Gemini) né
  Stripe. Controllato che nessuna chiave sia in `dist/`. **Non aprirlo mentre registri.**

## Perché `orichalcum`, da soli

- **`orichalcum`** (l'età del vapore, Fornace Alta): 25 luoghi del Cartografo vero, 27 individui con figure proprie, 8 trame, 218 modelli,
  le strutture civili riscolpite senza merli (T455), le Fonderie Ramelli a due passi dalla piazza di partenza. La Piazza della Pesa nomina
  la cattedrale degli ingranaggi e una taverna ma ha un lotto solo e non le mostra (T455; lo stesso vale per la Piazza dei Viadotti di
  `sidera`, T153). `sidera` è ricco uguale; `neapolis` veste gli individui col corpo generico del fabbro.
- **Da soli sul PC, senza account** è la via più semplice: il kernel gira nella pagina, paga la chiave del server entro il tetto del giorno,
  niente crediti né processi a parte.
- **Il multigiocatore regge** (provato offline sulla copia di `neapolis`, senza spesa): con `npx vite --port <n> --strictPort` (non la
  preview, che non apre il WebSocket) e `?universo=neapolis&viandante=me` si apre la lobby di molti (il master sceglie anche chi paga la
  partita), il mondo parte nel suo processo in una ventina di secondi e il client sottile entra; nessun errore del gioco. Con Gemini però
  **ogni viandante paga coi suoi crediti** (`universes/.balances/`), e il master parte da 0 $: prima va ricaricato a mano dalla console del
  master (F2, scheda Concilio), entro `QUINE_TETTO_RICARICHE` (20 $ al giorno senza account); a crediti finiti si passa ai modelli locali.
  Darebbe in più ciò che vedrà il server della beta: il mondo sul server, la lobby di molti, chi paga, una seconda scheda come secondo
  viandante (`&viandante=<altro>`), i doni e il ritmo del mondo. Meglio una seconda run, dopo questa.

## Le regolazioni della lobby

All'apertura di un universo già generato compare «Prima di entrare» (le regolazioni si fissano entrando e non cambiano fino alla ricarica
della pagina). Consiglio:

- **Dettaglio**, **modello del Concilio** (`gemini-3.1-flash-lite`), **ragionamento** (basso): come sono.
- **Scultore delle strutture**: `standard · Argon` (circa 0,29 $ a struttura di un concetto nuovo). Gli altri Scultori come sono.
- **Attore**: spento (acceso, le persone le recita 3.8 Flash dalle schede del Narratore: circa +0,25 $/h). Se vuoi sentirlo, accendilo: è
  una scelta di gioco, non di stabilità.
- **Chiamate di testo per sessione**: **1200** al posto di 800. L'arrivo nel mondo ne fa una trentina nei primi tre minuti; esplorando molto,
  800 possono finire prima dell'ora. Il limite vero della spesa resta il tetto del giorno.
- Gli altri budget e le manopole: come sono. La stima oraria in alto deve dire circa **2,38 $** (439 chiamate l'ora).

Poi **Entra nel mondo**.

## Prima di premere Rec

1. Il worktree è quello della run: `git -C H:\projects\rune\.claude\worktrees\beta-run-1 branch --show-current` dice `beta/run-1`.
2. La porta 4800 è libera e il comando è partito senza errori (dice `Local: http://localhost:4800/`).
3. `http://localhost:4800/api/gemini/status` risponde `{"available":true}`.
4. La copia è al punto di partenza: `git -C universes\orichalcum describe --tags` dice `prima-della-run-1` e
   `universes\orichalcum\world\players\me.json` non c'è.
5. La spesa del giorno: `universes\.gemini-spend.json` (`giorno` è la data UTC). Il 20/11 la prova ne ha già usati 0,53: se registri lo
   stesso giorno (fino all'1:00 di notte, ora italiana) restano 5,47 $ di tetto.
6. Chrome: una finestra normale, zoom 100 %, nessun'altra scheda su `localhost:4800`, a schermo intero (F11). L'audio del gioco c'è (il
   Musicista): decidi se registrarlo.
7. Il registratore è pronto (risoluzione, audio, dove salva); il `.env` e i terminali con i percorsi delle chiavi non sono in vista.
8. Un foglio per gli appunti (vedi sotto) e un orologio per i minuti.
9. Apri l'indirizzo, premi un tasto sul titolo, regola la lobby, **Rec**, poi **Entra nel mondo** (così la lobby resta nel video).

## Che cosa aspettarsi (dalla prova)

- **I primi minuti**: il Concilio lavora (sessione, una trama, una meccanica, abitanti e oggetti nuovi, una struttura, un brano). La prima
  risposta di una persona può arrivare dopo una ventina di secondi; poi va più svelta.
- **La sete e la fame**: la sete scende di 0,18 al secondo (di più correndo): da 85 a zero in circa 8 minuti, poi la salute cala e si
  muore in altri 3. Da bere: bottiglie d'acqua termale, gazzose, caffè, birra, latte, nei contenitori (E) e da chi commercia; si mangia
  pane, zuppa, salsicce. In `orichalcum` la morte è media (livello 2): si riaprono gli occhi nella piazza e si perde una parte di ciò che si porta (le cose di valore, le provviste); il racconto della morte è una chiamata.
- **I luoghi nuovi**: il Cartografo li pianifica mentre ti avvicini (il mare aperto lo fa il kernel, senza chiamate). Nella prova sono nati
  il Molo delle Scorie di Ramelli, il Molo delle Vaporiere col porto, le Miniere Termali di Solfara.
- **Al tetto o a budget finito** il gioco non si rompe: il registro del Concilio dice «budget di sessione esaurito per …», le persone
  rispondono «(… ti guarda in silenzio — …)» e, da questa versione, i luoghi nuovi restano bozze («Il Cartografo sta disegnando») invece di
  diventare «Terra senza nome» per sempre (ADR-0231).
- **«Fucina: … tempo scaduto (non ripetuta)»** può comparire quando molte chiamate partono insieme (il browser ne porta sei alla volta e il
  tempo massimo, 120 s, conta anche l'attesa): una cosa nuova in meno, nient'altro.

## Che cosa annotare durante la registrazione

Con il minuto del video:

- **Il costo**: la riga in testa al registro del Concilio (`G` lo mostra e lo nasconde): «sessione · oggi · in tutto», all'ingresso e a 15,
  30, 45 e 60 minuti.
- **Le persone**: a chi parli, quanto aspetti la risposta, se resta nel mondo (niente gioco, codice, simulazione), se ricorda.
- **I luoghi nuovi**: nome, se è dell'età del vapore, le strutture e quanto ci mette un modello nuovo ad apparire (prima la stella del
  generico, poi la forma).
- **Gli errori**: le righe rosse del registro («errore»), gli avvisi dell'HUD, un guasto (il glitch), le cose che non si raggiungono, i
  muri attraversati, ciò che resta invisibile.
- **Le prestazioni**: scatti, quando succedono (all'arrivo di un luogo? mentre lo Scultore lavora?).
- **Le morti**: come sono arrivate e come sono state raccontate.
- Ciò che ti è piaciuto e ciò che hai cercato senza trovarlo.

## Se qualcosa va male

- **Un guasto** (il mondo si incrina, l'HUD lo dice): `R` torna com'era: le rune che hai inciso ti tornano in mano, il codice non
  committato si scarta, i guasti si chiudono; i dati del gioco restano quelli dell'ultimo salvataggio.
- **La pagina si blocca o resta nera**: ricaricala (F5). Il gioco salva da solo ogni 2 minuti e all'uscita; ciò che non è arrivato parte
  alla riapertura dello stesso indirizzo. La lobby ricompare con le regolazioni scelte (sono in `universe.json`, commit «il master regola il mondo, prima di entrare»): controlla e rientra.
- **Il server si è fermato** (il terminale è tornato al prompt): rilancia lo stesso comando sulla stessa porta e ricarica la pagina.
- **Un universo non si apre o non va**: `http://localhost:4800/?universo=sidera` (la riserva, da soli, viandante nuovo).
- **Il tetto è troppo basso e vuoi continuare**: ferma il server (Ctrl+C), alza `GEMINI_TETTO_GIORNALIERO` nel `.env` del worktree,
  rilancia. La spesa già fatta nel giorno resta contata.
- **Ricominciare dalla copia di partenza** (solo la copia, cancella ciò che la run ha scritto in quell'universo):
  `git -C universes\orichalcum reset --hard prima-della-run-1` e `git -C universes\orichalcum clean -fd`, a server fermo.

**Dove guardare**:

- il terminale della preview (il server: il varco di Gemini, git, gli avvisi);
- la console del browser (F12 → Console; le eccezioni «message channel closed» vengono dalle estensioni di Chrome, non dal gioco);
- il registro del Concilio nel gioco (`G`);
- la console del master (F2, schede Log, Anomalie, Commit, Concilio…) si apre solo dopo essere usciti una volta dal cerchio; ricaricando con
  `&dev` si apre sempre, ma l'aiuto (`H`) mostra anche ciò che sta oltre il bordo: tienilo per un'emergenza;
- **il registro dei consumi**: `universes\orichalcum\world\usage.json` (per giorno, modello e compito; si salva con i commit del gioco) e
  `universes\.gemini-spend.json`, il totale del giorno del varco: è il numero vero, perché conta anche le chiamate interrotte (una pagina
  ricaricata mentre una chiamata era in volo) che il registro dell'universo non vede. TypeSafe: `universes\.typesafe-spend.json`.
- la storia dell'universo: `git -C universes\orichalcum log --oneline` (ogni lavoro del Concilio è un commit).

## Come fermare

1. Chiudi la scheda (o aspetta l'ultimo salvataggio automatico, ogni 2 minuti, e poi chiudi).
2. Nel terminale della preview, Ctrl+C. Se non risponde: `netstat -ano | findstr :4800` e
   `Stop-Process -Id <pid> -Force` sul processo in ascolto.
3. Ferma il registratore.
4. Per l'analisi: `git -C universes\orichalcum log --oneline prima-della-run-1..`, `world\usage.json`, `universes\.gemini-spend.json`, il video
   e gli appunti.

## La prova breve (20/11, T457)

Sul worktree della run, con Gemini vero e il tetto a 0,50 $: suite (269 file, 3683 test), typecheck, build e `npm run test:sicurezza` (32 file,
680 test) verdi prima della correzione;
`orichalcum` aperto, la lobby da soli ([cattura](catture/run-1-lobby.png)), dentro alla Piazza della Pesa, una domanda a Raniero Ramelli
alle Fonderie (risposta nel personaggio in una ventina di secondi, [cattura](catture/run-1-raniero.jpg)), il viandante portato al bordo
dei 25 luoghi: sono nati 23 luoghi nuovi: una dozzina col nome del Cartografo vero (8 chiamate: moli, miniere, il Giardino della Fuliggine, la Torre
d'Ormeggio di Vetta Bruna), 7 di mare aperto dal kernel e i 4 di cui sotto, il Concilio ha scritto una trama, una meccanica, due abitanti, oggetti, un capanno e un brano, tutto committato nella copia; la
console del master ([cattura](catture/run-1-console-concilio.jpg)) diceva 75 chiamate su 800, 3 scadute, 0,24 $. Nessun errore del gioco
in console, nessun guasto. **Costo: 0,534 $ al varco** (0,245 $ nel registro dell'universo; il resto, credo, sono chiamate rimaste in volo quando ho
lasciato due pagine, la prima col viandante morto e una di `aurora` aperta per sbaglio: il varco le conta, il registro della pagina no), più meno di un millesimo su TypeSafe: tre centesimi oltre il mezzo dollaro, perché il
varco ferma le chiamate nuove al tetto ma lascia finire quelle partite.

Che cosa ha cambiato: il viandante salvato morto (tolto dalle copie); quattro luoghi «Terra senza nome» con ambienti a caso (`dungeon`,
`ruins`) salvati quando il Cartografo si è fermato al tetto, tolti dalla copia di `orichalcum` e corretti nel kernel (ADR-0231, kernel
0.10.7: al tetto i luoghi restano bozze, [cattura](catture/run-1-bozze-al-tetto.jpg), provata su `aurora` col tetto già raggiunto).
