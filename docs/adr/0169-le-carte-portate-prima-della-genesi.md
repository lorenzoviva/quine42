# ADR-0169 — Le carte portate prima della Genesi: la radice del contratto, la scelta aperta, ciò che una carta diventa dove entra

Data: 2026-11-07 · Stato: accettato (task T295 del backlog, step 41) · Riferimenti: testo dell'autore in `docs/userchats/to-do-2026-11-05.md` («A regime: come usare le carte create a mano»), decisione D39 A (05/11), ADR-0056 (le carte), ADR-0068 (il clone), ADR-0084 (l'eredità dei cloni), ADR-0102 (chi chiede e cosa può), ADR-0103 (git solo da `server/git.ts`), ADR-0104 (i saldi fuori dall'universo), ADR-0109 (ciò che esce è un elenco), ADR-0110 (i mondi senza segreti), ADR-0112 (il server di produzione), ADR-0133 (le regolazioni si fissano entrando), ADR-0136 (la versione del kernel), ADR-0143 (la generazione differita), ADR-0160 (le strutture per taglia), ADR-0161 (le carte fatte a mano)

## Contesto

Oggi i modelli e i suoni di un universo passano a un altro solo clonandolo. L'autore vuole aggiungere carte, fatte a mano o generate, solo
all'inizio, prima della Genesi, e solo tra universi con un antenato comune nell'albero di git: meno collisioni, e la Genesi non rigenera ciò
che c'è. Pianificando si è visto che le due condizioni non erano mai vere insieme: ogni universo nato dal seme faceva il suo `git init`
(nessun antenato in comune con nessuno), e il clone copia un mondo già generato, senza Genesi. Con D39 A l'autore ha scelto: il primo commit
dal seme è identico per lo stesso seme e la stessa `X.Y`, così gli universi nuovi sono parenti; per un clone si sceglie prima che entri il
primo viandante; gli universi che esistono già restano fuori. Facendolo è emerso anche che i modelli scolpiti dal `ModelDirector` non erano
carte (`addModel` senza timbro, al contrario dei brani del Musicista): non ci sarebbe stato niente da portare.

## Decisione

1. **La radice del contratto** (`server/git.ts`): un universo che nasce dal seme (`create` dello store) comincia da un commit fisso, scritto
   come i byte dell'oggetto di git (`hash-object -t commit`): l'albero vuoto, autore e committente `Kernel <kernel@rune.local>` del
   2026-11-07 a mezzanotte UTC, il messaggio «radice degli universi del contratto X.Y» (`rootCommitText`, `rootCommitId`, `plantRoot`).
   Niente della macchina (configurazione di git, firma, orologio) lo cambia: per la `0.5` è `3beeaaa…` su ogni disco. Il seme e ciò che è
   dell'universo (il master, il nome) vengono nel commit dopo, come prima. **Dipende solo da `X.Y`**, non dal testo del seme: il seme cambia
   più volte al giorno dentro uno stesso contratto (62 commit su `universe/` in due settimane), e con la radice fatta del seme due universi
   nati a un giorno di distanza non sarebbero stati parenti, contro il «così tutti gli universi nuovi sono parenti» di D39 A; lo stesso seme e
   la stessa `X.Y` danno la stessa radice, che è ciò che D39 chiede. «Antenato comune» si controlla confrontando le radici
   (`rootsOf`: `git rev-list --max-parents=0 HEAD`, solo da `server/git.ts`), senza portare la storia dell'altro universo. Un clone copia la
   cartella e tiene la radice. La radice non è uno stato dell'universo: non è nel registro del master (`log` la salta) e il ritorno a lei è
   rifiutato («commit non valido»). Un universo nato prima non ha la radice del contratto: resta fuori, e lo dice la scelta.

2. **La scelta aperta**: `universe.json → cardChoice`, `seed` o `clone`, assente vale chiusa (così ogni universo di prima). La scrive lo
   store quando un universo nasce (`seed`) e `cloneChanges` quando si clona (`clone`); la toglie il kernel, con un commit suo («la scelta
   delle carte si chiude: …»), quando la Genesi comincia (`runGenesis`, prima di scegliere la partita: se la Genesi fallisce le carte venute
   restano e la scelta resta chiusa) e al primo ingresso (`lockSettings`: in singola alla fine della Genesi o chiudendo la lobby, in un mondo
   di molti al primo `join`, chiunque entri; giocare l'universo di esempio è entrare). Uno specchio, il banco e un universo che si legge
   soltanto non la toccano. Lo store la ricontrolla da sé (`choiceOf`): la scelta scritta, lo stesso contratto, nessuna Genesi dietro un
   universo dal seme (un commit `genesi:`), nessun mondo acceso né una generazione in corso (`universes/.running/`, `.generation/`).

3. **Chi sceglie e cosa** (`GET /api/universe/<nome>/kin`, `server/bring.ts`): solo chi possiede l'universo (`owns`: il master, mai un
   anonimo; in singola questa macchina), mai il mondo (il suo token è rifiutato, come per il clone). La risposta dice se la scelta è aperta
   (e perché no), i **parenti** (gli universi con una radice in comune) con la loro versione e, se sono di questo contratto, le loro carte che
   si possono portare (`kinCards`: le voci di `models/index.json` con una `card` e il programma; il seme no, è già in ogni universo), e con i
   laboratori aperti le carte fatte a mano di questo contratto, come `handmadeSummary` le dice (la firma, mai l'autore; regola 8f). «Dalla
   sua collezione» e «da quelle fatte a mano» sono così coperte tutte e due le letture: le carte fatte a mano dell'account e degli altri, e le
   carte del master negli universi parenti.

4. **Ogni carta ripassa** (`POST /api/universe/<nome>/bring { cards }`): il client dice solo **dove** (`{universe, model}` o
   `{handmade}`, al più 24, `readBringRefs`); ciò che la carta è lo legge il server dal disco (la voce, il programma, il timbro, la catena).
   Una carta viene se: il suo universo ha una radice in comune e il contratto di questo kernel, letto sul disco com'è (`universe.json →
   kernel`; un universo di un altro contratto si apre prima con questo kernel); è una carta; il suo nome passa (`cleanBroughtName`: una riga
   di al più 120 caratteri, niente markup né caratteri invisibili, la quarta parete); il suo timbro e la sua catena si leggono (nomi
   semplici, al più 32 anelli); il suo programma passa il **controllo delle carte fatte a mano** (`ProgramChecker`, `handmadeProgramErrors`:
   ogni seme della classe nella scatola che il gioco gli dà, azioni e animazioni, le soglie del suono, i tetti misurati sul seme; nel server di
   produzione in un processo per controllo, ADR-0161), che contiene ciò che il validatore chiede a un modello (`modelErrors`) ed è più stretto;
   una carta fatta a mano solo con i laboratori aperti e del contratto di questo kernel. **Due carte con lo stesso id**, o un id che
   l'universo ha già, si dicono prima di partire (`doubles`, nel pannello mentre si sceglie e di nuovo nello store, 409): niente si rinomina.
   **Tutto o niente**: una carta che non può entrare ferma la scelta (422, con il motivo di ognuna) e niente si scrive. Ciò che passa entra in
   **un commit del kernel** dei soli `models/<id>.xml` e `models/index.json` («carte portate prima della Genesi: …»). In singola il kernel
   del browser prende gli stessi file dalla risposta (`Kernel.bringCards`) e il suo commit dopo li trova sul disco; in un clone il mondo non è
   acceso e li legge quando parte. Con gli account un ritmo per master (`BRINGS`: sei, poi una al minuto); nel server di produzione le rotte
   stanno sotto `HEAVY` come tutto `/api/universe/<nome>/…`.

5. **Ciò che una carta diventa** (`broughtEntry`, `src/kernel/bring.ts`): la voce rifatta campo per campo, solo ciò che il gioco legge di
   un modello (la classe, la taglia di D&D e la densità a cui gira ricalcolata, la cantina, i semi, il voto, la lettera della tinta,
   l'autore del programma, lo scopo di un suono): non il suo tempo (`time` lascerebbe girare un programma più a lungo nei browser di chi
   gioca), non i consigli e i problemi dell'Artista di un altro mondo. In più `brought`: l'universo da cui viene, o `.handmade`. L'id resta
   quello della carta (una carta fatta a mano è già un id di modello, ADR-0161). La sua **carta**: autore e pagante restano; il **titolare è
   il master che la porta**; la **catena** (`origins`) si allunga di un anello, come in un clone che passa le carte al nuovo master
   (`titolari: 'master'`, ADR-0084): chi la teneva dove era, quell'universo (o `.handmade` per una carta fatta a mano, un nome che nessun
   universo può avere) e l'impronta del contenuto come entra. Una carta fatta a mano si misura sul suo **programma**, qui come nell'archivio
   (`allCards` lo fa per ogni id `handmade-…`, ADR-0161); ogni altro modello sulla sua voce (ADR-0084). Da quel momento le quote seguono
   ADR-0084: una copia mai cambiata dà indietro metà di ogni utilizzo. L'autore di una carta fatta a mano è nella sua catena con il suo id
   di viandante, come ogni titolare di una carta di un universo (la `card` si legge da chiunque, ADR-0102).

6. **Importare non costa crediti, e nessun saldo si muove** (regola 8d): né la scelta né l'ingresso leggono o scrivono un archivio dei saldi;
   le quote, come per i cloni, si contano e si mostrano (`receivedBy`), i crediti che si muovono davvero non sono di questo task.

7. **La Genesi e i direttori non rifanno ciò che c'è**: il `ModelDirector` non scolpisce un id che la libreria ha (come sempre) e, prima di
   scolpire, prende un modello portato della stessa classe, taglia e nome di una richiesta (`reused`: il suo programma sotto l'id della
   richiesta, con la stessa carta, nessuna chiamata; `free`, ciò che non costa niente, insieme ai programmi condivisi tra taglie); il
   `ScoreDirector` non scrive un brano per un ambiente che un programma nomina già; `runDeferred` apre l'universo con ciò che c'è e passa
   dallo stesso `free` prima di scolpire. **Sanno che esistono e li usano**: il Cartografo, nel piano di ogni
   luogo, ha le strutture portate per concetto e taglia («scrivi esattamente il suo concetto») e il kernel veste il lotto con la struttura
   portata con quel nome a quella taglia, qualunque sia il suo id (`structureModelFor`); alla Genesi il Cartografo sa per quali ambienti c'è
   già una musica (gli dà un id che la contenga); il Narratore, scegliendo i primi abitanti e le prime cose, sa quali figure e cose hanno già
   il loro aspetto (le chiede con quel nome, e il `ModelDirector` le prende); lo Scultore impara prima dai programmi scritti a mano, poi da
   quelli portati (`examplesFor`). Mai da quale universo vengono: dentro il mondo niente viene da altrove (ADR-0025).

8. **L'Artista e la guida di stile**: alla Genesi l'Artista scrive la guida per il mondo nuovo sapendo quali modelli ci sono già («fatti
   prima di questa guida, restano come sono: la palette e le forme li accolgano, senza nominarli»). I modelli portati **non si giudicano di
   nuovo** (costerebbe una chiamata con le foto per ognuno: proprio ciò che si vuole risparmiare); tengono il voto di dove sono nati. Se uno
   stona, «Riscolpiscilo» lo rifà nello stile nuovo (una richiesta del master, a pagamento come oggi).

9. **I modelli dello Scultore sono carte**: il `ModelDirector` committa ciò che scolpisce (e ciò che condivide tra taglie) con la carta di
   `model.sculpt` (ADR-0056: lo paga il mondo, il titolare estratto col seme), come il Musicista per i brani. Prima non lo faceva: i modelli
   scolpiti fino al kernel 0.5.5 non sono carte e non si portano.

10. **La versione**: `KERNEL_VERSION` 0.5.6. Gli universi del contratto 0.5 restano buoni: `cardChoice`, `brought` e la carta dei modelli
    sono campi facoltativi, la radice riguarda solo gli universi che nascono; nessun formato cambia senso. Per questo `Y` non sale: un
    contratto nuovo avrebbe chiesto un universo nuovo, e questi universi nuovi sono proprio quelli che avranno la radice.

## Alternative scartate

- **La radice fatta del seme** (albero = i file del seme): letteralmente «lo stesso seme», ma il seme cambia a ogni task che tocca
  `universe/` dentro lo stesso contratto; le famiglie si sarebbero spezzate più volte al giorno, e in produzione a ogni rilascio. Il
  contratto è già il confine di ciò che un universo legge di un altro; il controllo di `X.Y` resta comunque, carta per carta.
- **Un commit fisso con un file dentro**: un ritorno a lui darebbe un universo senza ciò che lo fa partire; con l'albero vuoto la radice
  non contiene niente da fraintendere, e il ritorno si rifiuta.
- **La scelta in `world/cards.json`**: lo scrive il kernel da `CardUses` prima di ogni commit e ciò che non conosce si perderebbe; ed è un
  dato del gioco, non dell'universo che nasce. In `universe.json` sta con il contratto e la partita, che si scelgono anche loro all'inizio.
- **La finestra ricavata dalla storia** (nessun commit di un viandante dopo la nascita o il clone): un salvataggio alla ricarica della
  pagina, offline, l'avrebbe chiusa mentre il master sceglieva; un campo scritto da chi apre e tolto da chi entra non dipende dai messaggi.
- **Il kernel che porta le carte da ciò che il client gli dà**: catena e impronta dette dal client metterebbero chiunque nella catena di
  chiunque (ADR-0161), e un mondo di molti non può leggere gli altri universi (ADR-0110). Lo store legge il disco, controlla e scrive; il
  kernel prende i file che lo store ha scritto.
- **Rinominare una carta doppia**: due carte con lo stesso id sono spesso lo stesso modello di due parenti; si sceglie quale, prima.
- **Giudicare di nuovo i modelli portati con l'Artista**: il risparmio sparirebbe in buona parte (le foto da quattro lati costano più del
  programma di una cosa semplice).
- **Accettare anche i modelli generati senza carta** (scolpiti prima di 0.5.6): non hanno un titolare, quindi nessuna catena; resterebbero
  di nessuno nell'universo che li prende, contro «entrano con la loro carta».

## Conseguenze

- **Il risparmio, misurato** (`tests/bring.test.ts`, offline con `MockAiModels` che si dicono in linea, così i direttori lavorano): un
  universo generato dal seme chiede allo Scultore 21 programmi per gli 11 modelli che la sua Genesi nomina (21 giudizi dell'Artista), 68
  chiamate in tutto tra Genesi e Scultore; lo stesso mondo con le carte di quel primo universo portate prima della Genesi non chiama lo
  Scultore né l'Artista (0 e 0), 26 chiamate in tutto; nessun guasto. Offline i mondi sono uguali e gli id coincidono; con Gemini la parte
  che si risparmia è quella che il Cartografo e il Narratore scelgono di riusare (le strutture per concetto, le figure e le cose per nome, la
  musica per ambiente) più le forme comuni degli oggetti (`shape-…`, gli stessi id in ogni universo): è lì che il prompt li indirizza.
- Ciò che i prompt dicono è nei test: la guida di stile, gli ambienti con la musica, i primi abitanti, le strutture nel piano di un luogo.
- `tests/bring.test.ts`: la radice uguale per due universi e diversa per un altro contratto o un universo di prima, il registro senza la
  radice e il ritorno rifiutato, il clone che la tiene con la scelta aperta anche con una Genesi alle spalle (ciò che ha copiato c’è già, una carta di un parente entra «prima del primo ingresso», il titolare il nuovo master); la voce che diventa, la carta fatta a mano misurata sul
  programma con le quote, i doppioni, la scelta in `universe.json`; con lo store vero: i parenti, un modello e un suono che entrano (commit
  del kernel, carta del master, catena, quote, nessun saldo), ciò che c'è già e due carte con un id, chi non ha la stessa radice o è di un
  altro contratto o è del seme, la scelta chiusa a Genesi fatta, dopo il primo ingresso e con il mondo acceso, le carte fatte a mano con
  l'interruttore; sul kernel la Genesi e il primo ingresso che chiudono la scelta (uno specchio no), e la Genesi offline con e senza carte.
  `tests/sicurezza/carte-portate.test.ts`: V-033.
- Il pannello «Le carte da portare» (`src/ui/cardchoice.ts`) sta nella schermata della Genesi (singola) e nella lobby del master di un
  clone in cui nessuno è entrato; le carte entrano premendo «Genera il mondo» o «Entra nel mondo», prima del resto.
- Restano fuori: gli universi nati prima (nessuna radice in comune) e i modelli scolpiti prima di 0.5.6 (nessuna carta); la generazione
  differita (`npm run genera`) non sceglie carte da sé: si portano prima con la rotta, poi si genera; la Fucina non sceglie per id un modello
  portato (lo fa per nome, attraverso il Narratore e il `ModelDirector`); la carta che si rompe nel mondo e la sua eliminazione sono T296; i
  laboratori per i giocatori, da cui nascono le carte fatte a mano, T294.
