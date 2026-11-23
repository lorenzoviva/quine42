# Le run della beta da soli, sul kernel di oggi (T501)

Qualche ora di gioco registrata, da soli sul PC, con Gemini vero, sugli universi generati portati al kernel di oggi. È la seconda
guida dopo [`run-1.md`](run-1.md): stessa forma, un branch e un worktree nuovi, cinque copie pronte invece di una, il consumo che il gioco
ora dichiara. Non è una parte della pagina delle istruzioni: resta fuori dalla build.

## In breve

| | |
|---|---|
| Branch | `beta/run-2`, fuori dalla pipeline: la testa di `3d` del 23/11 (`f0988ff8`, kernel 0.10.28: il raggio, il riuso delle strutture, il consumo dichiarato, gli strati, la rete, gli oggetti con un uso, l'arrampicata) più le tre correzioni di T501 (kernel 0.10.29) e questa guida |
| Worktree | `H:\projects\rune\.claude\worktrees\beta-run-2` (con `node_modules` suo, la build in `dist/` già fatta sulla testa del branch, il `.env`) |
| Universi | **`orichalcum`** per primo, poi `sidera`, `neapolis`, `mesa`; `aurora` no (vedi sotto). Tutti copie, da soli, viandante nuovo, tag `prima-della-run-2` |
| Tetto | `GEMINI_TETTO_GIORNALIERO=6` dollari al giorno (stima della lobby a pieno dettaglio: 3,50 $/h; misurata sul cammino della run 1 col kernel di oggi: 4,15 $/h); TypeSafe 0,50 $ al giorno |
| Comando | `npx vite preview --port 4820 --strictPort` dal worktree della run |
| Indirizzo | `http://localhost:4820/?universo=orichalcum` |

## Il comando

In PowerShell:

```powershell
cd H:\projects\rune\.claude\worktrees\beta-run-2
netstat -ano | findstr :4820          # niente: la porta è libera
npx vite preview --port 4820 --strictPort
```

Poi in Chrome uno degli indirizzi qui sotto. **Senza `?universo=` si apre `aurora`**, l'universo di prova del seme.

| ordine | universo | indirizzo |
|---|---|---|
| 1 | `orichalcum` | `http://localhost:4820/?universo=orichalcum` |
| 2 | `sidera` | `http://localhost:4820/?universo=sidera` |
| 3 | `neapolis` | `http://localhost:4820/?universo=neapolis` |
| 4 | `mesa` | `http://localhost:4820/?universo=mesa` |
| — | `aurora` | `http://localhost:4820/?universo=aurora` (solo per confronto) |

La preview serve `dist/` e, dallo stesso processo, il varco di Gemini (`/api/gemini`), quello di TypeSafe e i repository degli universi.
Se cambi qualcosa nel codice, prima `npm run build`.

**Usa sempre la porta 4820**, e non la 4800 di run-1 né la 4810 della prova di T501. Ciò che il gioco non riesce a consegnare al server
quando chiudi la scheda resta nel browser per quell'indirizzo e parte alla prossima apertura dello stesso indirizzo (ADR-0122): su una
porta nuova non c'è niente in attesa. La prima apertura su una porta nuova rifà le forme dei modelli (la cache del browser è per indirizzo):
i primi secondi sono più pesanti, poi passa.

## Che cosa c'è nel worktree

- **Gli universi** in `universes/`, copiati con `git clone --no-hardlinks` da quelli del base
  (`H:\projects\rune\.claude\worktrees\step8.2A-lab3d\universes\`, che non sono stati toccati), senza remote: niente può tornare agli
  originali. Su ognuno:
  - **una partita da soli** (`game.mode: single`, senza `master`; gli originali restano in multigiocatore, tranne `aurora` che era già da
    soli), un commit nella copia;
  - **il viandante nuovo**: tolto `world/players/me.json` (in `orichalcum` era salvato morto, in `neapolis` a sete 7, in `sidera` a metà,
    in `aurora` trasceso); il kernel fa nascere un viandante nuovo nella piazza. Le persone ricordano ancora ciò che il viandante di prima ha
    fatto (ha lo stesso id, `me`);
  - **il kernel di oggi**: la prima apertura ha fatto i commit del kernel (l'aggiornamento dal seme, in `aurora` la migrazione 0.9 → 0.10,
    la riparazione dei veicoli e degli oggetti senza uso); così non finiscono nella storia della run;
  - **il tag `prima-della-run-2`** sullo stato di partenza.
- **Controllati** senza chiamate, sul kernel della run:
  - `lab/scripts/controlla-universo.ts`: 25 piani letti dal kernel e 0 guasti in `orichalcum`, `neapolis`, `sidera`, `mesa`; 1664 in `aurora`;
  - `npm run mancanze`: le stesse 12 richieste non riuscite di run-1 (riscolpiture di strutture rimaste col programma di prima, un concetto
    della coda in `mesa`, un ambiente da ritagliare in `neapolis`); nessuna ferma il gioco;
  - `lab/scripts/oggetti-uso.ts`: gli oggetti generati con un uso il 71 % in `orichalcum` (84 su 118), 76 % in `sidera`, 61 % in `neapolis`,
    74 % in `mesa`; gli altri la riparazione li marca da tenere (`decoration`, ADR-0251);
  - `lab/scripts/veicoli-finti.ts`: la riparazione dà `vehicle` alla chiatta a vapore di `orichalcum` e al gozzo di `neapolis`.
- **Il `.env`** del worktree (non nel repository): la chiave di Google dalla cartella principale, quella di TypeSafe dal base (le stesse di
  run-1), `GEMINI_TETTO_GIORNALIERO=6`, `TYPESAFE_TETTO_GIORNALIERO=0.5`, `QUINE_PAGAMENTI=spenti`; niente OpenRouter né Stripe.
  Controllato che nessuna chiave sia in `dist/`. **Non aprirlo mentre registri.**

## Gli universi, in ordine

| | `orichalcum` | `sidera` | `neapolis` | `mesa` | `aurora` |
|---|---|---|---|---|---|
| tema | le Città del Vapore (Fornace Alta) | Neon sulla Pioggia | la Grande Città, anni Novanta | Polvere e Binari, il far west | il Regno di Valmora (il seme) |
| in salute | sì | sì | sì (con la correzione delle missioni) | sì, ma si chiama `aurora` | sì, ma è di prova |
| luoghi | 25 del Cartografo + 4 della prova, 18 di mare aperto | 25 + 1 | 25 + 1 | 25 | 1664 dei modelli locali |
| persone | 27 (2 attese) | 28 (2 attese) | 29 (3 attese) | 10 (8 attese) | 70 |
| trame e missioni | 8, 8 missioni da dare | 8, 8 da dare | 8, 7 da dare e una accettata | nessuna | nessuna |
| modelli | 224 | 225 | 223 | 188 | 140 |
| veicoli | la chiatta a vapore alla Darsena delle Chiatte (luogo -2,2), si sale e si guida | nessuno | il gozzo tirato a secco (Scalo dei Pescatori, Darsena dei Granili): ora ha `vehicle`, ma è della classe delle strutture e nel controllo senza chiamate non è nato; da vedere | nessuno | nessuno |
| morte | media (2) | media (2) | media (2) | dura (3) | dura (3) |

1. **`orichalcum` per primo.** Il più provato e il più ricco, con la chiatta da guidare a due luoghi dalla piazza. Ed è lo stesso mondo di
   run-1: lo stesso percorso dice subito che cosa hanno cambiato il raggio, il riuso delle strutture e il consumo dichiarato (run-1: 2,93 $
   in 18 minuti).
2. **`sidera`**: ricco quanto `orichalcum`, un altro tema; le persone parlano col lessico del mondo («Bonombo!»); i luoghi nuovi della prova
   hanno riusato due strutture del mondo col seme del luogo, senza Scultore.
3. **`neapolis`**: la città degli anni Novanta, la più viva di trame (Marco De Luca, Rosaria Vitale, Ciro Amitrano…). La prova ha
   accettato la missione di Marco De Luca: il viandante nuovo la trova nel diario («porta Coccio antico a Marco De Luca»); il coccio sta
   nelle casse del cantiere della Linea 2. È la prova della correzione delle missioni (vedi sotto).
4. **`mesa`**: il far west, il tema più diverso, ma il più povero (10 persone, nessuna trama) e con un difetto di nascita: il suo
   `universe.json` dice `name: aurora` e il seme 1337, come `aurora`. Col server non mescola niente (i piani stanno nella sua cartella), ma
   il nome che il gioco mostra è «aurora». Per una run breve va bene; non per quella da mostrare.
5. **`aurora`** no: è il medioevo di prova del seme, coi luoghi dei modelli locali.

## Le regolazioni della lobby

All'apertura compare «Prima di entrare» (le regolazioni si fissano entrando e non cambiano fino alla ricarica della pagina; si salvano
nell'universo col commit «il master regola il mondo, prima di entrare»). Consiglio:

- **Dettaglio**, **modello del Concilio** (`gemini-3.1-flash-lite`), **ragionamento** (basso): come sono.
- **Scultore delle strutture**: `standard · Argon` (circa 0,31 $ a struttura di un concetto nuovo). Gli altri Scultori come sono.
- **Attore**: spento (acceso, la stima sale a 3,86 $/h). Se vuoi sentirlo è una scelta di gioco, non di stabilità.
- **Chiamate di testo per sessione**: **1200** al posto di 800: la stima di un'ora è 960 chiamate, e 800 possono finire prima.
- **Strutture nuove all'ora**: 2, come è (con 0 la stima scende a 2,97 $/h e i luoghi nuovi riusano solo le strutture che il mondo ha).
- La stima oraria in alto deve dire circa **$3.496 (960 chiamate/ora)** ([cattura](catture/run-2-lobby.png)).

Poi **Entra nel mondo**.

## Che cosa è cambiato da run-1

- **Il consumo si vede in gioco**: il pannello `P` (il tuo viandante) dice «Questa sessione: $… di modelli» e, dopo due minuti di gioco, il
  ritmo orario, con accanto la stima della lobby ([cattura](catture/run-2-pannello-p.jpg)); la riga in testa al registro del Concilio (`G`)
  dice «sessione · oggi · in tutto».
- **Il raggio**: il Concilio lavora solo per i luoghi che puoi raggiungere presto; un luogo ai bordi della vista resta una bozza finché non
  ti avvicini. Un luogo nuovo arriva in 4-5 secondi.
- **Il riuso delle strutture**: un luogo nuovo veste di preferenza una struttura che il mondo ha già, col seme del luogo; la stella del
  modello generico che aspetta lo Scultore si vede meno.
- **Gli oggetti hanno un uso**: l'inventario, «Esamina» e «Usa» lo dicono; «Crea» mostra solo ciò che si può fare con ciò che porti. Nel
  registro del Concilio «Kernel scarta → Narratore … non ha un'azione con effetti» è il validatore che rimanda indietro: normale.
- **Le missioni «portami»** (correzione di T501): l'oggetto va trovato. Prima chi dava la missione ti consegnava lui stesso l'oggetto e la
  missione si compiva appena accettata ([cattura di prima](catture/run-2-missione-prima.jpg), [di dopo](catture/run-2-missione-dopo.jpg)).
  Una consegna a un altro («porta questa cella a Teo Sardi») ti dà ancora l'oggetto.
- **I veicoli**: la chiatta di `orichalcum` si prende col menu della casella (E): «Sali a bordo», poi «Prendi il timone» e i tasti; «Leva
  l'ancora»; «Tuffati» per scendere ([cattura](catture/run-2-chiatta.jpg)).
- **L'arrampicata**: un dirupo fino a tre caselle si sale con la corda o con lo stato che «Altro…» dà («Arrampicati» nel menu della casella).

## Prima di premere Rec

1. Il worktree è quello della run: `git -C H:\projects\rune\.claude\worktrees\beta-run-2 branch --show-current` dice `beta/run-2`.
2. La porta 4820 è libera e il comando è partito senza errori (dice `Local: http://localhost:4820/`).
3. `http://localhost:4820/api/gemini/status` risponde `{"available":true}`.
4. La copia è al punto di partenza: `git -C universes\orichalcum describe --tags` dice `prima-della-run-2` e
   `universes\orichalcum\world\players\me.json` non c'è (lo stesso per l'universo che registri).
5. La spesa del giorno: `universes\.gemini-spend.json` (`giorno` è la data UTC). Il 23/11 la prova di T501 ne ha già usati 0,33: se
   registri lo stesso giorno (fino all'1:00 di notte, ora italiana) restano 5,67 $ di tetto.
6. **Lo spazio su C:**: il 23/11 c'erano 2 GB liberi. Il registratore salvi su D: o H:, non su C:. (Anche Chrome tiene la cache su C:.)
7. Chrome: una finestra normale, zoom 100 %, nessun'altra scheda su `localhost:4820`, a schermo intero (F11). L'audio del gioco c'è:
   decidi se registrarlo.
8. Il registratore è pronto (risoluzione, audio, dove salva); il `.env` e i terminali con i percorsi delle chiavi non sono in vista.
9. Un foglio per gli appunti (vedi sotto) e un orologio per i minuti.
10. Apri l'indirizzo, premi un tasto sul titolo, regola la lobby, **Rec**, poi **Entra nel mondo** (così la lobby resta nel video).

## Che cosa annotare durante la registrazione

Con il minuto del video:

- **Il costo**: il pannello `P` (sessione e ritmo orario) e la riga del registro del Concilio, all'ingresso e a 15, 30, 45 e 60 minuti. Il
  ritmo orario va confrontato con la stima della lobby (3,50 $/h).
- **Le persone**: a chi parli, quanto aspetti la risposta (nella prova 4-5 secondi), se resta nel mondo, se ricorda, se dà una missione.
- **Le missioni**: quale accetti, dove trovi l'oggetto, se la consegna funziona.
- **I luoghi nuovi**: nome, se è del tema, quanto ci mette ad arrivare, se la struttura è una del mondo (riusata) o un modello nuovo (la
  stella del generico, poi la forma).
- **I veicoli**: salire, governare, l'ancora, scendere; dove la costa ferma.
- **Gli errori**: le righe rosse del registro («errore»), gli avvisi dell'HUD, un guasto (il glitch), le cose che non si raggiungono, i muri
  attraversati, ciò che resta invisibile.
- **Le prestazioni**: scatti, quando succedono (all'arrivo di un luogo? mentre lo Scultore lavora? alla prima apertura sulla porta nuova?).
- **Le morti**: come sono arrivate e come sono state raccontate.
- Ciò che ti è piaciuto e ciò che hai cercato senza trovarlo.

## Se qualcosa va male

- **Un guasto** (il mondo si incrina, l'HUD lo dice): `R` torna com'era: le rune incise tornano in mano, il codice non committato si scarta,
  i guasti si chiudono; i dati del gioco restano quelli dell'ultimo salvataggio.
- **La pagina si blocca o resta nera**: ricaricala (F5). Il gioco salva da solo ogni 2 minuti e all'uscita; ciò che non è arrivato parte
  alla riapertura dello stesso indirizzo. La lobby ricompare con le regolazioni scelte: controlla e rientra.
- **Il server si è fermato** (il terminale è tornato al prompt): rilancia lo stesso comando sulla stessa porta e ricarica la pagina.
- **Un universo non va**: passa al successivo dell'ordine (`?universo=sidera`).
- **Il tetto è troppo basso e vuoi continuare**: ferma il server (Ctrl+C), alza `GEMINI_TETTO_GIORNALIERO` nel `.env` del worktree (per
  due run nello stesso giorno: 10), rilancia. La spesa già fatta nel giorno resta contata. Al tetto il gioco non si rompe: le persone
  rispondono «(… ti guarda in silenzio — …)» e i luoghi nuovi restano bozze.
- **Rifare una run da capo** (solo la copia: cancella ciò che la run ha scritto in quell'universo), a server fermo:

  ```powershell
  git -C universes\orichalcum reset --hard prima-della-run-2
  git -C universes\orichalcum clean -fd
  ```

  Prima di cancellare una run che vuoi analizzare, segnala il suo stato: `git -C universes\orichalcum tag dopo-la-run-2a`.

**Dove guardare**:

- il terminale della preview (il server: il varco di Gemini, git, gli avvisi);
- la console del browser (F12 → Console; le eccezioni «message channel closed» vengono dalle estensioni di Chrome, non dal gioco);
- il registro del Concilio nel gioco (`G`) e il pannello `P`;
- la console del master (F2) si apre solo dopo essere usciti una volta dal cerchio; ricaricando con `&dev` si apre sempre, ma l'aiuto
  (`H`) mostra anche ciò che sta oltre il bordo: tienilo per un'emergenza.

## Come fermare

1. Chiudi la scheda (o aspetta l'ultimo salvataggio automatico, ogni 2 minuti, e poi chiudi).
2. Nel terminale della preview, Ctrl+C. Se non risponde: `netstat -ano | findstr :4820` e `Stop-Process -Id <pid> -Force` sul processo in
   ascolto.
3. Ferma il registratore.

## Per l'analisi, dopo

Tutto sta nella copia dell'universo registrato e nella cartella `universes\` del worktree della run:

- **la storia della run**: `git -C universes\<universo> log --oneline prima-della-run-2..` (ogni lavoro del Concilio è un commit, ogni
  «salvataggio della partita» dice dove era il viandante);
- **il registro dei consumi**: `universes\<universo>\world\usage.json` (`days` → giorno → modello → compito: chiamate, token, cache, `usd`;
  `payers` per chi ha pagato; `specialties` per i mestieri dello Scultore); si salva coi commit del gioco;
- **la spesa vera del varco**: `universes\.gemini-spend.json`, il totale del giorno UTC: conta anche le chiamate rimaste in volo quando si
  chiude una pagina. TypeSafe: `universes\.typesafe-spend.json`;
- senza chiamate, dal worktree della run:
  - `npx vite-node lab/scripts/consumi-run.ts -- universes/<universo> --tag prima-della-run-2 --giorno <AAAA-MM-GG>`: che cosa la run ha
    pagato e che cosa il viandante ne ha visto, col percorso ricostruito dai salvataggi (T488);
  - `npx vite-node lab/scripts/cache-registro.ts -- universes/<universo> --da <AAAA-MM-GG>`: quanto ha servito la cache di Google (T496);
  - `npx vite-node lab/scripts/oggetti-uso.ts -- universes/<universo> --tag prima-della-run-2`: a che cosa servono gli oggetti nati nella
    run (T489);
- il video e gli appunti.

## La prova breve (23/11, T501)

Sul worktree della run, con Gemini vero e il tetto del varco a 0,45 $ per la prova: suite (298 file, 3979 test; un file fallito per lo
spazio su C:, `site-video.test.ts`, verde con la cartella temporanea su H:), typecheck, build e `npm run test:sicurezza` (34 file, 688 test;
due fallite per i tempi sotto carico, verdi rifatte da sole) sulla testa di `3d`; con le correzioni di T501, 299 file e 4001 test verdi
(la cartella temporanea va tenuta fuori dal repository: i test del kit di sicurezza vi costruiscono progetti usa e getta).

- **`orichalcum`**: la lobby ([cattura](catture/run-2-lobby.png), con «Strutture nuove all'ora» a 0 solo per la prova), dentro alla Piazza
  della Pesa; Raniero Ramelli risponde nel personaggio in pochi secondi; alla Darsena delle Chiatte la chiatta a vapore, «Sali a bordo» e il
  menu del timone; al luogo 0,-3 il Cartografo pianifica in 4 secondi il «Bacino di Raffreddamento delle Ramelli», con un'officina che è una
  struttura del mondo (il commit «lo stesso programma di un'altra taglia», nessuna chiamata dello Scultore); il pannello `P`: 0,06 $ di
  sessione, stima 2,97 $/h. 29 chiamate, 0,19 $, salvataggi nel repository della copia, nessun guasto.
- **`sidera`**: Ruben Kessler risponde in 4,6 secondi; al luogo 3,0 le «Cupole di Serralta — Il nodo di raccolta» con due strutture del
  mondo vestite col seme del luogo ([cattura](catture/run-2-sidera-riuso.jpg)). 19 chiamate, 0,07 $.
- **`neapolis`**: Marco De Luca dà la missione, ti affida lui stesso il Coccio antico e la missione si compie da sola: corretto nel kernel
  (0.10.29), la copia riportata a prima, la scena rifatta: la missione resta nel diario da compiere. Il Cartografo riusa l'Osservatorio
  civico al «Colle dei Gelsi — Belvedere dei Pini». 13 chiamate, 0,04 $ (più 0,03 della prima sessione, tolta).
- **`mesa`** e **`aurora`**, coi modelli locali (`&offline`, senza spesa): si aprono, nessun errore, nessun guasto ([cattura di
  `mesa`](catture/run-2-mesa.jpg)). In `mesa` però la Fucina dei modelli locali ha forgiato e salvato «Erba» per una cosa nuova di un piano
  del Concilio: corretto nel kernel (sopra un mondo che non è il loro i modelli locali non chiedono niente ai luoghi del Concilio), la
  copia riportata a prima, la riapertura non scrive più niente.
- Nessun errore del gioco in console nelle cinque. **Costo: 0,333 $ al varco** (0,304 $ nei registri delle copie e 0,030 $ della sessione di
  `neapolis` tolta: tornano), meno di un millesimo su TypeSafe.

Che cosa ha cambiato, oltre alle copie: tre commit su `beta/run-2` (e su `task/T501` per il base): le missioni «portami» (kernel 0.10.29,
`tests/missione-porta.test.ts`), la chat che diceva «(Marco De Luca quest)» con l'id dell'azione, i modelli locali che salvavano in un mondo
del Concilio (`tests/offline-altrove.test.ts`); e `lab/scripts/veicoli-finti.ts`, che si rompeva quando un veicolo nasceva e usciva dal
mondo col suo luogo.

Da guardare nella run: in `orichalcum` due revisioni della Fucina (`forge.review`, 3.1 Flash-Lite) hanno ragionato 32 000 token l'una, 0,05 $
a revisione (nella run 1 erano 350-700 token): metà del costo della sessione. Se ricapita, il registro dei consumi lo mostra (`thoughts`).
