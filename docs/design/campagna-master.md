# La Campagna del Master: spese, invito, ritmo, memoria e controllo del Concilio (T347)

Data: 2026-11-13 · Step 43, Fase IV · ADR proposto: [ADR-0188](../adr/0188-la-campagna-del-master.md) (non applicato:
decide l'autore) · Richiesta: `docs/userchats/to-do-2026-11-10.md` («Gestione delle spese dell'universo», «Gestione della campagna da
master») · Studio gemello: [`open-beta.md`](open-beta.md) (ADR-0184, le chiavi dei giocatori e il verificatore a inviti)

Niente codice: questo documento dice cosa cambierebbe, perché, quanto costa e in che ordine. Le misure dei token sono fatte sulle
richieste vere del Concilio registrate offline (`lab/scripts/prompt-tokens.ts -- --capture`, § 4.3).

## In breve

1. **Il master paga tutto** è una regola della partita, `universe.json → game.expenses` (`shared` oggi, `master` per la campagna), scelta
   dal master nella lobby e ferma a partita in corso come il resto. Non cambia chi *chiede* (`chi`, regola 8i, le carte, i ritmi): cambia solo
   chi viene **addebitato**, in un punto solo, `charge`. I giocatori entrano senza crediti; il tetto che conta è quello del master; a crediti
   finiti del master il mondo passa ai modelli locali per tutti. Da sola questa opzione invita all'abuso: va insieme all'universo privato.
2. **L'universo privato su invito** sta fuori dall'universo, come i saldi: `universes/.campaign/<nome>.json` (gli ospiti per id, gli inviti
   come impronte di token con scadenza e usi, scritto solo dal master). L'ammissione sta dove già si verifica il token (`admit` in
   `server/session.ts`), prima che il mondo si accenda; le letture di un universo privato (`carte`, `publicFiles`, l'elenco del sito) solo a
   master e ospiti. Lo stesso token serve all'invito del self-hosting di ADR-0184 §8.
3. **Il ritmo del mondo** (`pace`: `pausa`, `lento`, `normale`, con i luoghi al minuto) è una manopola del master **che scende soltanto**:
   sotto le regolazioni della lobby, mai sopra. Perciò non tocca `ai` e non contraddice la regola 8b-bis: chi è entrato con una stima
   non può spendere di più, solo di meno. Si cambia da dentro il gioco in ogni momento (console, Direzione, sito) e resta su disco. In
   pausa i luoghi nuovi **restano bozze** (il terreno procedurale, senza cose né persone), non vengono scritti dai modelli locali: ciò che i
   modelli locali scrivono diventa canone, e per una campagna è un danno. `?offline` resta ciò che è.
4. **La memoria delle richieste del master** è un file, `world/campaign.md`, a **sezioni per competenza** (per tutti, Narratore,
   Cartografo, Scultore e Artista, Ingegnere e Fisico, Musicista), iniettato nella parte stabile di ogni richiesta dell'agente, che la cache
   serve; l'Arbitro e il Referente leggono tutto. Lo scrive il master nell'editor o il Referente da una conversazione (`incarico:
   direttiva`), con il filtro della quarta parete. Misurato: 0,014 $ l'ora in cache (0,042 $ al prezzo pieno) per 900 token di direttive, il
   4 % dell'ora di oggi; un orchestratore nuovo costerebbe dieci volte tanto e raddoppierebbe le chiamate; il solo Referente non raggiunge
   i compiti che il mondo fa da sé.
5. **Il controllo esteso** parte da ciò che c'è: l'atlante **già** impone l'ambiente ai luoghi di una regione. Il master dichiara regioni
   (centro, raggio, ambiente, descrizione) nell'Ufficio dei luoghi, senza chiamate; una regione `mare` dà luoghi d'acqua scritti dal kernel,
   a costo zero, dove il gruppo esce dalla trama; una regione `trattenuta` resta bozza finché lui non la libera. Individui, popoli e trame
   dichiarati entrano nei file che gli agenti leggono già (`people.json`, `plots.json`, la bibbia), scritti dal Narratore coi fatti dati.
6. **Sette task**, circa il 25 % di una settimana (§ 6). Nessuna superficie nuova in questo task; quelle che nasceranno sono al § 7.

---

## 0. Che cosa vuole fare un master, e che cosa glielo impedisce oggi

Lo scenario dell'autore: una campagna come in D&D, un libro-gioco a storia dinamica, il gioco di un content creator dentro QUINE42. Il
master scrive storia, popoli, individui, relazioni, geografia e architettura; i giocatori li vivono; il Concilio riempie ciò che il master
non ha scritto, nel modo che il master ha detto. Oggi:

| Serve | Oggi | Dove sta il limite |
|---|---|---|
| I giocatori entrano senza pagare | ogni viandante paga le sue chiamate, le comuni si dividono fra i collegati (ADR-0081); senza crediti risponde il modello locale | `payerOf`, `charge`, `splitCost`; il tetto per viandante (`setSessionCap`) |
| Solo chi è invitato entra | con gli account entra chiunque abbia un token valido; il sito elenca tutti gli universi | `admit` (`server/session.ts`), `join`, `/api/universe`, il launcher |
| Fermare o rallentare il mondo | le manopole si fissano entrando (ADR-0133); `placesPerMinute` è della lobby; la pausa esiste solo per la lobby e la Genesi (`generationHeld`); `?offline` passa ai modelli locali | `settingsLocked`, `pumpDevelopment`, `chunkQuota`, `ModelDirector` |
| Gli agenti ricordano ciò che il master ha chiesto | la conversazione con un agente vive in memoria (`agentTalks`, 8 turni) e sparisce con il mondo; ciò che il master scrive nei file (bibbia, stile, regole, atlante) gli agenti lo leggono già | `Council.context`, `rulesSummary`, `environmentsFor` |
| Dire prima dove sta un villaggio, un'isola, il mare | le regioni dell'atlante le disegna il Cartografo alla Genesi e su richiesta; il master può solo chiedere un ambiente al Referente | `genesis.atlas`, `cartographer.environment`, `world/atlas.json` |
| Individui, popoli, trame decisi dal master | il Referente forgia un «personaggio» (un tipo), non un individuo con nome e segreti; le trame le intreccia il Narratore | `askLiaison`, `npc.individuate`, `plot.weave` |

I vincoli da rispettare, o da cambiare con l'ADR: regola 0 (le direttive non portano meta-gioco nel mondo), 8b e 8j (`gate`, `admit`:
l'identità la verifica il server), 8b-bis (a partita in corso nessuno cambia `ai`), 8d (i soldi fuori dall'universo), 8e (i ritmi per
viandante), 8f (ciò che esce è a elenco), 8i (chi paga si dice, non si ricava).

---

## 1. Il master paga tutto

### 1.1 Come si paga oggi

Ogni chiamata ha un `chi` (ADR-0056, ADR-0113): il viandante che agisce, o `comune` per ciò che il mondo fa da sé (Genesi, sessioni, trame,
dialoghi, modelli, pacchetti, revisioni: `COMMON_TASK` in `cards.ts`). `charge` (`kernel.ts`) addebita a `chi` costo più commissione;
`comune` si divide in parti uguali fra i collegati non anonimi (`splitCost`). Il tetto di ogni viandante (`cap` nel `join`, `setSessionCap`)
limita ciò che spende e **incrementa i budget del mondo** (`addBudgetFromCap`); il master chiede un tetto minimo (`ai.minimums.cap`). A
crediti esauriti le richieste personali vanno ai modelli locali; un anonimo ha 0 crediti e non ricaricabili. Il saldo sta nel ledger
(`universes/.balances/<nome>.json`, ADR-0104), che il mondo apre come file suo (`ledgerFile` in `worldHost.ts`). Le carte: `payer` è chi
ha pagato, `holder` chi le tiene (per le comuni un viandante estratto col seme), e le quote dell'eredità (ADR-0084) seguono il titolare.

### 1.2 La proposta: chi chiede resta chi chiede, cambia solo chi viene addebitato

- **Un campo della partita**: `universe.json → game.expenses`, `shared` (oggi, assente vale così) o `master`. È una regola della partita
  come `pvp`: la sceglie il master nella lobby (arriva nel `join` con le regolazioni, `settings.game.expenses`, riparata come le altre), si
  fissa quando entra il primo viandante e si sblocca quando esce l'ultimo (ADR-0133 la copre così com'è: è un cambio che i giocatori
  devono vedere prima di entrare). Va in `GAME_FIELDS` (`files.ts`): la lobby e il sito scrivono «in questo mondo paga il master».
- **`chi` non cambia** (8i): chi ha chiesto è chi ha chiesto, per le carte, per i ritmi (`heavy` è per viandante, non per pagante), per le
  mancanze, per il registro. Cambia un punto solo: in `charge`, con `expenses = master`, ogni addebito, personale o comune, va al master
  (`deductCredits(master, total)`), senza `splitCost`. Il registro dei consumi (`world/usage.json`) continua a dire `chi`; il portafoglio del
  master (`/api/crediti`) mostra le righe «pagate per <viandante>».
- **Il tetto che conta è quello del master**: il suo `cap` incrementa i budget come oggi; i `cap` dei giocatori non contano e il server non
  rifiuta più chi entra sotto il minimo (`least`) in un mondo dove paga il master. A crediti del master esauriti (`creditsOf(master) <= 0`)
  **tutti** passano ai modelli locali, con l'avviso di oggi nel feed (`stato.crediti`), come per `comune` senza paganti.
- **Gli anonimi**: oggi hanno i modelli locali perché non possono pagare. Con il master che paga potrebbero avere i modelli, ma allora dieci
  schede anonime svuotano il master in un'ora. Regola: con `expenses = master` gli anonimi restano ai modelli locali **a meno che** l'universo
  sia privato (§ 2): un ospite è stato invitato, anonimo o no, e il master risponde di lui. È il motivo per cui le due opzioni vanno insieme.
- **Le carte**: `payer` dice il vero (il master); `holder` resta chi ha chiesto, come oggi un contenuto comune è di un viandante estratto e non
  di chi l'ha pagato. Così la collezione dei giocatori si riempie (è il bello della campagna) e le quote dell'eredità (ADR-0084) seguono il
  titolare. Il master che sceglie `master` lo sa: la lobby lo dice. (Domanda 2 per l'autore: in alternativa `holder = master` per tutto.)
- **Il ledger non cambia** (8d): un saldo solo si muove, quello del master; nessun trasferimento fra viandanti; le ricariche come oggi.
- **In open beta** (ADR-0184): «il master paga» è «tutte le chiamate sulla chiave del master», il turno delle comuni (§ 1.4 A di quello
  studio) non si usa; la scelta della chiave da `chi` diventa la scelta dal **pagante**, risolto dalla stessa politica.
- **Da soli** non c'è nulla da scegliere (`payerNow()` è `me`).

### 1.3 Ciò che resta vero

8i: fuori da un `as` il pagante è `comune`, e `comune` con `expenses = master` è il master: `charge` lo risolve, `payerNow` no. 8e: i ritmi
e la coda `heavy` sono per viandante che chiede, quindi il master che paga non rallenta chi gioca e un giocatore solo non consuma il mondo
(il tetto del master è il tetto, i ritmi restano). 8j: nulla cambia nell'ammissione. Un giocatore che vuole pagare da sé in un mondo dove
paga il master non può: una scelta per universo, chiara.

---

## 2. L'universo privato su invito

### 2.1 Chi entra oggi

Con `FIREBASE_PROJECT_ID` chiunque abbia un token di Firebase entra in qualunque universo di molti (`admit` verifica il token, conta i
socket per account, `starts` limita gli avvii, poi `open(name)` e `session.connect`). Senza account vale l'id detto da questa macchina. Il
sito elenca tutti gli universi (`/api/universe`, il launcher di T233); `/api/universe/<nome>/carte` e i `publicFiles` li legge chiunque
passi da `gate`; un account è master di al più `QUINE_UNIVERSI_PER_ACCOUNT` universi.

### 2.2 La proposta: la lista fuori dall'universo, l'ammissione dove si verifica il token

- **Dove sta**: `universes/.campaign/<nome>.json` (una cartella nuova in `SERVER_FOLDERS`, `campaign`), scritto atomico sotto lucchetto
  come i saldi; mai nell'universo perché: riguarda account, non il mondo; non deve viaggiare con un clone, un export o una carta portata
  (un clone ha un altro master e altri ospiti); non deve tornare indietro con `R` (un ospite tolto non rientra per un rollback); Lua, il
  Concilio, i rami non ci arrivano (8d vale anche qui). Forma:

  ```json
  { "private": true,
    "guests": { "<id del viandante>": { "since": 1794600000, "by": "<id del master>", "note": "Anna" } },
    "invites": { "<sha256 del token>": { "made": 1794600000, "expires": 1795200000, "uses": 1, "left": 1, "note": "per il gruppo del giovedì" } },
    "pace": { "mode": "normal" } }
  ```

  (`pace` è del § 3: lo stesso file tiene ciò che del mondo è del server e non del mondo.)
- **Due vie per entrare**: l'id del viandante (l'uid dell'account, `accountWanderer`) nella lista, o un **invito**: un token di 32 byte
  casuali che il master crea, dato come link (`?invito=<token>`), con scadenza (predefinita 7 giorni) e usi (predefinito 1). Il client lo
  mette nel `join` (`invite`); il server lo verifica contro l'impronta, consuma un uso e **aggiunge l'id agli ospiti**: da lì in poi entra
  per id. Un invito non è un'identità: l'identità resta il token di Firebase (8b); senza account (self-hosting, ADR-0184 §8) l'invito è
  l'unica prova e il verificatore a inviti di quello studio ne fa un'identità: stesso formato, stesso file.
- **Dove si controlla**: in `admit` (`server/session.ts`), dopo il token e prima di `open(name)`: il mondo non si accende per chi non entra
  (V-026 resta), e il mondo non deve sapere di ospiti (8g: niente file del server nel processo del mondo). Il master entra sempre; chi non è
  ospite riceve `refusal` «questo mondo è su invito» senza dire altro. Il mondo, già acceso, riceve `join` solo da chi è passato.
- **Le letture**: `owns` resta del master; una funzione accanto, `guestOf(who, campaign)`, ammette gli ospiti a ciò che oggi legge chiunque
  di un universo (`carte`, `publicFiles`, `/api/viandante`); un universo privato non compare nell'elenco a chi non è ospite (il launcher lo
  mostra come «su invito» solo a chi lo è; a un estraneo non esiste: niente enumerazione dei nomi).
- **Chi scrive la lista**: solo il master, con una rotta `/api/universe/<nome>/guests` (`GET` la lista e gli inviti vivi senza i token;
  `POST` aggiunge un ospite o crea un invito, e il token esce **una volta sola** nella risposta; `DELETE` toglie un ospite o revoca un
  invito). `gate`, `callerOf`, `owns`, JSON soltanto, sotto `FRONT_RATES`. Togliere un ospite collegato chiude il suo socket. Nel gioco la
  console del master (scheda `universe`: «Ospiti e inviti») e nel sito la pagina della sessione.
- **Nasce pubblico**: un universo nuovo e un clone nascono `private: false`; la privatezza si accende dal master quando vuole, anche a
  partita in corso (non è `ai`, e un ospite in più non cambia la stima di nessuno).

### 2.3 Con il master che paga

Privato e «paga il master» insieme sono la campagna: il master sa chi ha invitato e paga per loro; chi non è invitato non costa. L'uno
senza l'altro è ammesso (un mondo privato dove ognuno paga; un mondo pubblico dove paga il master, con gli anonimi ai modelli locali).

---

## 3. Il ritmo e la pausa della generazione

### 3.1 Che cosa decide la velocità oggi

Sette cose, in ordine di forza: le manopole (`ai.coefficients`, quante chiamate passano, fisse a partita in corso); i budget per sessione
(`maxText`, `maxForges`…, incrementati dai tetti); `placesPerMinute` (20) per i mondi di molti (`chunkQuota`, i luoghi oltre restano
`held` e il registro lo dice); tre luoghi in lavorazione alla volta (`developers`); le pause dello Scultore e del Musicista (`modelGap`,
`pieceGap`); `generationHeld`, che ferma tutto durante la lobby e la Genesi; e `?offline`, i modelli locali. Un luogo non ancora pianificato
è una **bozza**: il terreno procedurale (`g p t w r`, i biomi), camminabile, senza cose, persone né rune; l'atlante lo dice «abbozzato».
Mentre il Cartografo scrive, il viandante ci cammina già: la bozza è già ciò che si vede «quando un luogo non c'è ancora».

### 3.2 Che cosa vuol dire «pausa» per un master

Due cose diverse che oggi si confondono:

- **I modelli locali** (`?offline`, le manopole a 0, i crediti finiti): il mondo va avanti e ciò che è nuovo lo scrivono i modelli locali,
  **e resta**: il piano di «Terra senza nome» va in `maps/`, l'individuo senza scheda in `people.json`. Per chi gioca senza spendere va
  bene. Per un master è il contrario di ciò che vuole: un luogo scritto male mentre lui pensava è canone, e lo deve rifare.
- **Trattenere**: i luoghi nuovi restano bozze, nessuno scrive niente, niente si committa; quando il master libera, il Cartografo pianifica
  da dove i giocatori sono. È ciò che fa `generationHeld` nella lobby, e ciò che la campagna vuole in gioco: «aspetta, sto scrivendo».

### 3.3 La proposta: una manopola che scende soltanto

- **`pace`**, il ritmo del mondo: `{ mode: 'normal' | 'slow' | 'hold', placesPerMinute?: number }`. `hold`: i luoghi nuovi restano bozze
  (`pumpDevelopment` non parte), i modelli, i brani, le trame, le sessioni e i dialoghi nuovi aspettano, ciò che è in volo finisce; le
  risposte alle parole del viandante (`npc.reply`, «Altro…», «Esamina») **continuano**: sono la partita, e la pausa ferma ciò che il mondo
  fa da sé, non ciò che i giocatori fanno. `slow`: `placesPerMinute` più basso di quello della lobby (predefinito 4), le pause dello
  Scultore e del Musicista raddoppiate. `normal`: le regolazioni della lobby.
- **Perché non tocca 8b-bis**: la regola di ADR-0133 protegge chi è entrato con una stima: nessuno gli fa spendere più di quanto ha visto.
  `pace` non alza mai nulla: `placesPerMinute` di `pace` è al più quello della lobby, le pause solo più lunghe, le manopole intatte. Un
  master può solo far spendere **meno**. È un'eccezione che va scritta (ADR-0188 §3): «a partita in corso il master può rallentare o
  fermare ciò che il mondo fa da sé, mai accelerarlo oltre la lobby». Le manopole «non sicure» (alzare una quota, cambiare modello, accendere
  l'Attore) restano della lobby.
- **Da dove**: il messaggio `pace` del protocollo (solo il master, `isMaster`, rifiutato agli altri con il motivo), dalla console del master
  (scheda `ai`: «Ritmo: normale · lento · in pausa»), dalla Direzione (il tavolo della situazione mostra i luoghi in coda: accanto il
  ritmo), dal sito (la pagina della sessione, con la rotta `/api/universe/<nome>/pace` che la porta al mondo per `WorldCalls`). Da soli lo
  stesso `pace` nel kernel del browser. Non passa dal Referente: è un comando del kernel, senza chiamate e senza ambiguità.
- **Su disco**: in `universes/.campaign/<nome>.json → pace` (§ 2.2), così un mondo che riparte al `join` di un giocatore non ricomincia a
  generare mentre il master dorme; il server lo passa al mondo con le opzioni dell'avvio (`worldEnv`), mai come file nel processo.
- **Che cosa vede il viandante** in un luogo trattenuto: la bozza, come oggi mentre il Cartografo scrive. Niente testo nel mondo (regola
  0: nessuna «nebbia che non si è alzata», nessun «qui il mondo non è ancora scritto» detto da una persona). Fuori dal mondo sì: l'HUD può
  dire «il mondo è in pausa: il master lo sta scrivendo», come oggi avverte dei crediti e la lobby dice «i modelli locali». E l'atlante del
  master mostra i luoghi trattenuti.
- **Cosa resta uguale**: `?offline` e i modelli locali; la generazione differita (`npm run genera`, ADR-0143) che non convive con un mondo
  acceso; i budget e i tetti.

---

## 4. La memoria delle richieste del master

### 4.1 Che cosa ricordano gli agenti oggi

Nessuno «ricorda» una conversazione: `agentTalks` tiene gli ultimi 8 turni con ogni agente, in memoria, e sparisce quando il mondo si
ferma. Ma gli agenti leggono **file** a ogni richiesta (`Council.context`): la bibbia (Narratore, Cartografo, Arbitro, Referente), lo
stile (Scultore, Artista, Arbitro), le regole (`rulesSummary`: anche quelle che il Referente scrive da una richiesta, `incarico: regola`),
il canone e il lessico, l'atlante (il Cartografo: nome, ambiente, centro e raggio di ogni regione), il catalogo, e in fondo il vicinato del
grafo (`focus`, ~700 token). Il master può già scrivere questi file nell'editor e pubblicarli (ADR-0066): un master che riscrive la bibbia
cambia ciò che il Narratore sa. Ciò che manca è un posto per il **come**: «i nomi dei luoghi in lingua d'oïl», «niente draghi finché non lo
dico io», «le case di pietra a nord del fiume, di legno a sud», «gli elfi non parlano con gli umani». Oggi finisce in una regola del mondo
(che il Narratore legge e il Cartografo no) o si perde.

### 4.2 Le cinque vie

| Via | Chi la legge | Come arriva | Pro | Contro |
|---|---|---|---|---|
| **A. Memoria per agente** | ogni agente la sua | un file per agente (`prompts/agents/<agente>.memory.md`) che l'agente riscrive dopo ogni richiesta del master | ognuno ricorda ciò che gli serve | dieci memorie divergono (il Cartografo ricorda il villaggio a nord, il Narratore a sud); costa una chiamata di riscrittura; il master non vede che cosa hanno capito |
| **B. Un testo letto da tutti** | tutti, tutto | `world/campaign.md` intero in ogni richiesta | semplice, una verità sola | il doppio dei token della via E, e gli agenti leggono ciò che non li riguarda (lo Scultore legge le trame) |
| **C. Solo il Referente ricorda** | il Referente | il Referente tiene il testo e smista | pochi token | non raggiunge i compiti che il mondo fa da sé (il piano di un luogo, l'individuo nuovo, la trama, il modello): proprio quelli da pilotare; ogni direttiva vuole una chiamata di smistamento |
| **D. Un orchestratore nuovo** | un agente nuovo prima di ogni chiamata | sceglie che cosa iniettare in ogni richiesta | la selezione più fine | raddoppia le chiamate (una in più per ognuna delle 363 dell'ora), latenza, un agente in più da far parlare e tenere nello studio |
| **E. Direttive a sezioni per competenza** (la via dell'epoca 347) | ogni agente la sua sezione più quella di tutti; Arbitro e Referente tutto | `world/campaign.md` con sezioni per squadra, iniettato in `Council.context` | una verità sola, letta da chi la deve applicare, nella parte che la cache serve; il master vede e corregge il testo | la sezione sbagliata non arriva (il Referente deve smistare bene: ma il master la può spostare) |

### 4.3 La misura

Le richieste vere: `npx vite-node lab/scripts/prompt-tokens.ts -- --capture lab/out/t347-prompts.json` (una Genesi offline e i primi
luoghi: 42 richieste, 18 compiti), token a 3,26 caratteri (la media di T325 con `countTokens`); l'ora di gioco dalla stima della lobby
(`hourlyEstimate`, manopole a 1, Flash-Lite: **363 chiamate, 1,04 $**); l'ipotesi di una campagna seria: **900 token di direttive** (circa
600 parole), 250 per tutti e il resto diviso (Narratore 250, Cartografo 200, Scultore e Artista 100 ciascuno, Ingegnere e Fisico 50,
Musicista 50; Arbitro e Referente tutto). Lo script dell'analisi non è nel repository (`lab/out/`): si rifà in dieci righe dal file
registrato.

| | richieste | token in ingresso (media) |
|---|---:|---:|
| Cartografo | 20 | 4.363 |
| Narratore | 8 | 5.449 |
| Arbitro | 5 | 5.122 |
| Fisico | 5 | 2.035 |
| Ingegnere | 3 | 4.280 |
| Artista | 1 | 2.469 |
| **tutte** | 42 | **4.332** |

Chiamate in un'ora (stima della lobby): Narratore 188, Scultore 91, Cartografo 67, Arbitro 12, Musicista 5.

| Via | token in più l'ora | $/ora al prezzo pieno | $/ora con la cache implicita (75 %) | chiamate in più l'ora |
|---|---:|---:|---:|---:|
| A. memoria per agente | 168.150 | 0,042 | 0,014 | 0,5 (le riscritture) |
| B. un testo per tutti | 326.790 | 0,082 | 0,027 | 0 |
| C. solo il Referente | ~0 | 0,004 | 0,004 | 5 (gli smistamenti) |
| D. un orchestratore | 199.705 | 0,186 | 0,152 | **363** |
| **E. sezioni per competenza** | 168.150 | **0,042** | **0,014** | 0 |

Le direttive della via E sono il 6 % dei token di una richiesta media (250-500 su 4.332) e il 4 % dell'ora di oggi al prezzo pieno, 1,3 %
in cache. Il costo cresce in proporzione: 3.000 token di direttive sono 0,14 $ l'ora pieni. La via D costa dieci volte tanto e raddoppia
le chiamate; la via C costa niente perché non fa niente dove serve.

### 4.4 La raccomandazione: la via E

- **`world/campaign.md`**, nella lingua del mondo, con le sezioni `## Per tutti`, `## Narratore`, `## Cartografo`, `## Scultore e Artista`,
  `## Ingegnere e Fisico`, `## Musicista`; un tetto per sezione (4.000 caratteri, ~1.200 token) e uno per il file. Non è in `playerFiles`
  né in `publicFiles`: è del master, come i prompt. Non è una carta. Entra in `councilMayWrite` solo per ciò che il kernel vi scrive per
  conto del Referente.
- **Dove entra nella richiesta**: in `Council.context(agent)` dopo il riassunto della partita, prima del contesto dell'agente, cioè nella
  parte stabile che la cache implicita (e quella esplicita dell'Attore, ADR-0186) serve: la sezione cambia di rado. L'Attore riceve solo
  `## Per tutti` (interpreta, non inventa fatti). Le decisioni chiuse (Jev) non la ricevono: stato del mondo soltanto (D45).
- **Chi la scrive**: il master nell'editor (e pubblica, come la bibbia); oppure il Referente, con un incarico nuovo `direttiva` accanto a
  `regola`: capisce a quale sezione va, la riscrive in una riga nei termini del mondo, e il kernel la **appende** con la data del mondo. Il
  kernel la passa dal filtro della quarta parete (`metaBreak` sul testo nella lingua del mondo): una direttiva che dice «i giocatori»,
  «il gioco», «la simulazione» non entra com'è; il Referente la riformula («i viandanti», «il regno») o la rifiuta col motivo. Le parole
  del master che citano il meta-gioco sono legittime al tavolo del Dungeon Master, ma gli agenti copiano le parole che leggono: meglio che
  nel file non ci siano.
- **Che cosa ci va e che cosa no**: le direttive sono **intenzioni e modi** («niente draghi», «le città sul fiume», «parlata arcaica»). I
  **fatti** («Orm, fabbro di Tarn, odia il conte») vanno dove sono già: bibbia, `people.json`, `plots.json`, l'atlante, e da lì nel grafo e
  nel `focus`. Il Referente che riceve un fatto lo porta alla squadra (la Fucina, il Narratore) come oggi; una direttiva la scrive.
- **Il ricordo di ciò che è stato fatto**: ogni smistamento del Referente lascia già una riga nel registro e, se produce contenuto, una
  carta e un nodo del grafo. Non serve una memoria in più: il file dice il come, il grafo dice il cosa.
- **Perché non A**: la stessa quantità di token, più una chiamata ogni due richieste, e dieci versioni della campagna che nessuno vede. **Non
  B**: il doppio dei token per dare allo Scultore le trame. **Non C**: le richieste del mondo (il piano di un luogo, l'individuo, la trama)
  sono la maggior parte delle 363 chiamate e non passano dal Referente. **Non D**: 0,15-0,19 $ l'ora in più, il doppio delle chiamate e la
  latenza su ogni risposta di una persona.

---

## 5. Il controllo esteso: cartografia, individui, popoli, narrativa

### 5.1 La cartografia: l'atlante è già lo strumento

`environmentsFor` (`kernel.ts`): un luogo dentro una regione dell'atlante prende **l'ambiente della regione**, e `chunk.plan` riceve
nome e descrizione della regione. Oggi le regioni le scrive il Cartografo (alla Genesi e quando il Referente gli chiede un ambiente) e il
master le vede nell'Ufficio dei luoghi (l'atlante sul muro, `src/ui/atlas.ts`). La proposta:

- **Regioni dichiarate dal master**: nell'Ufficio dei luoghi, su un chunk dell'atlante, «Dichiara regione»: nome, descrizione, raggio,
  ambiente scelto fra quelli del mondo (o «chiedi al Cartografo un ambiente nuovo», che è `cartographer.environment` di oggi). Il kernel
  scrive `world/atlas.json` (commit `atlas`, senza chiamate: costo zero) e la Direzione la mostra. Un luogo già pianificato nella regione
  resta com'è (si ripianifica solo svuotando la cache, come oggi); i luoghi nuovi la seguono. È così che «il villaggio sta a (3, −2)» e
  «l'isola è a nord-est» diventano regole prima che qualcuno ci arrivi.
- **La regione `mare`**: ambiente speciale del kernel, non un programma: i luoghi dentro sono scritti dal kernel (`fallbackPlan` d'acqua:
  la bozza interamente `o`, nessuna cosa, nessuna runa, nessuna chiamata) e committati come piani normali. È la risposta a «il gruppo esce
  dalla trama: fateci solo mare»: il master la dichiara dalla Direzione quando vede i giocatori andare dove non vuole, senza spendere. Il
  mare è solido (non si nuota): i viandanti vedono acqua fino all'orizzonte e tornano. Non è un «confine invalicabile» raccontato (regola
  0): è mare, e il mondo ha già mare (`relief.sea`). Un'isola, dopo, è una regione dentro il mare.
- **La regione `trattenuta`**: come `hold` (§ 3) ma locale: i luoghi dentro restano bozze finché il master non la libera o la cambia. È il
  modo di dire «questa valle la scrivo io, dopo».
- **Nel sito** l'atlante del master con le stesse azioni (la pagina della sessione), per chi prepara la campagna senza entrare.

Costo: zero chiamate per dichiarare; i luoghi nelle regioni costano come oggi (`chunk.plan`), ma con un contesto che li tiene in trama;
il mare costa zero.

### 5.2 Individui, popoli, razze

Oggi: un tipo di abitante nasce dalla Fucina (`forge.concept` → modulo con `persona`, il modello dallo Scultore); l'individuo dietro ogni
entità lo scrive il Narratore quando serve (`npc.individuate`, dalla bibbia e dal grafo); il Referente sa forgiare un «personaggio» (un
tipo), non un individuo preciso.

- **I popoli** («razze»): sono tipi di abitanti con una voce nella bibbia e nelle direttive. Il master li dichiara in `campaign.md`
  (`## Per tutti`: chi sono, dove vivono, come si trattano; `## Scultore e Artista`: come appaiono) e li fa forgiare al Referente come oggi
  («un elfo delle rive, alto, grigio»). Il Cartografo, con la sezione sua, li mette solo dove la direttiva dice. Nessun compito nuovo.
- **Gli individui dichiarati**: un incarico nuovo del Referente, `individuo`: il Narratore scrive l'individuo **coi fatti dati** (nome,
  mestiere, famiglia, segreto, dove sta) in `people.json`, come `npc.individuate` ma con i fatti del master come affermazioni da tenere, e
  lo mette nel luogo o nella regione detta (se il luogo non è pianificato, l'individuo aspetta in una lista `expected` che il piano
  consuma: il grafo ha già «gli attesi»). Lo Studio dei Personaggi li mostra nel silos. Costo: una chiamata del Narratore per individuo
  (`npc.individuate`, manopola `people`).
- **Le relazioni**: fanno parte dell'individuo (legami in `people.json`); un legame fra due individui dichiarati lo scrive la stessa
  chiamata.

### 5.3 La narrativa

Oggi le trame le intreccia il Narratore (`plot.weave`, manopola `plots`), con tappe fra individui e luoghi, e la bibbia è la sua memoria.

- **La trama della campagna** va in `## Narratore` di `campaign.md` come atti e svolte («primo atto: la siccità; il conte nega l'acqua;
  i viandanti trovano la sorgente murata»): il Narratore intreccia trame che la servono e non la contraddicono. Costo: zero chiamate in più.
- **Una trama scritta dal master**: nella Direzione (dove le trame aperte si vedono già), «Scrivi trama»: titolo, individui, tappe; il
  kernel la mette in `plots.json` passando dal validatore delle trame, senza chiamate. Il Narratore la porta avanti come le sue.
- **La bibbia**: la Biblioteca del Mondo (il leggio) oggi la sfoglia; l'editor la cambia. Basta un «Modifica» sul leggio che apre il file
  nell'editor: nessun compito nuovo.
- **Le regole**: restano l'`incarico: regola` del Referente, che il Narratore legge (`rulesSummary`); la direttiva è il suo gemello per il
  «come» e per le altre squadre.

### 5.4 Gli strumenti dello studio, in una tabella

| Dove | Oggi | Proposto |
|---|---|---|
| Referente (ingresso) | incarichi `oggetto cosa personaggio ambiente oggetti meccanica regola runa musica riscolpisci` | `direttiva` (→ `campaign.md`), `individuo` (→ `people.json`) |
| Ufficio dei luoghi (atlante) | si guarda | «Dichiara regione» (ambiente, `mare`, `trattenuta`), «Libera» |
| Direzione (tavolo della situazione) | i luoghi in coda, le trame, i giocatori | il ritmo (`pace`), «Scrivi trama», «Mare qui» su un luogo in coda |
| Biblioteca (leggio) | sfoglia la bibbia | «Modifica» (l'editor sul file) |
| Studio dei Personaggi (silos) | tipi e individui | gli individui dichiarati e gli attesi |
| Console del master | log, guasti, commit, moduli, ai, agente, universo | «Ospiti e inviti» (§ 2), «Ritmo» (§ 3), «Spese: paga il master» in lobby (§ 1) |
| Sito (pagina della sessione) | profilo, crediti | ospiti e inviti, ritmo, l'atlante con le regioni, `campaign.md` |

---

## 6. I task che ne nascono

In ordine; la stima è nella scala della pipeline (percentuale della settimana). Tutti nello step 43. Il primo aspetta che l'autore accetti
ADR-0188.

| # | Task | Stima | Dipende da | Fatto quando |
|---|---|---|---|---|
| 1 | **Il master paga tutto**: `game.expenses` nel `join` e in `GAME_FIELDS`, `charge` con il pagante risolto dalla politica, il tetto del master, gli anonimi, il portafoglio e la lobby che lo dicono; la versione del kernel; glossario («spese della partita») | 3 % | ADR-0188 accettato | due viandanti senza crediti in un mondo di molti giocano con i modelli mentre il saldo del master scende; a saldo zero tutti ai modelli locali; i test dei crediti di oggi invariati |
| 2 | **L'universo privato**: `universes/.campaign/`, gli ospiti e gli inviti, `admit`, `guestOf` sulle letture e sull'elenco, la rotta `guests`, la console; la voce nel registro della sicurezza | 5 % | — | un terzo account è rifiutato, entra con un invito a un uso, non rientra con lo stesso, sparisce se tolto; l'elenco non lo mostra a chi non è ospite; il kit `tests/sicurezza/` |
| 3 | **Il ritmo del mondo**: `pace` (messaggio, kernel, `pumpDevelopment` e i direttori), su disco in `.campaign`, dalla console, dalla Direzione e dalla rotta; l'avviso dell'HUD; ADR-0133 con l'eccezione «solo verso il basso» | 3 % + browser | 2 | in pausa i luoghi restano bozze e nessuna chiamata parte; «normale» riprende da dove sono i giocatori; `pace` non alza mai `placesPerMinute` sopra la lobby (test) |
| 4 | **Le direttive**: `world/campaign.md` a sezioni in `Council.context`, l'incarico `direttiva` del Referente con la quarta parete, i tetti, l'editor; la misura in `lab/scripts/prompt-tokens.ts` (`--campaign`) e `tests/regolazioni.test.ts` sui prompt | 4 % | — | ogni agente riceve la sua sezione e quella di tutti (test sulle richieste registrate); una direttiva con meta-gioco è rifiutata col motivo; l'Attore riceve solo «Per tutti» |
| 5 | **Le regioni del master**: «Dichiara regione» nell'Ufficio dei luoghi e nella Direzione, `mare` e `trattenuta` nel kernel (`environmentsFor`, `fallbackPlan` d'acqua, i luoghi trattenuti), l'atlante del master | 4 % + browser | 3 | un luogo in una regione dichiarata prende l'ambiente senza chiamate; `mare` dà acqua a costo zero; `trattenuta` resta bozza finché non si libera |
| 6 | **Individui e trame dichiarati**: l'incarico `individuo` (il Narratore coi fatti dati, gli attesi), «Scrivi trama» nella Direzione, «Modifica» sul leggio | 4 % | 4 | un individuo dichiarato compare nel luogo detto con i fatti dati; una trama scritta a mano avanza come le altre |
| 7 | **La campagna nel sito**: ospiti e inviti, ritmo, atlante e `campaign.md` nella pagina della sessione; la guida della beta (`docs/beta/`) | 2 % + browser | 2, 3, 5 | la pagina fa tutto ciò che fa la console, con il server di produzione vero (`tools/produzione/laboratori.ts`) |

Totale: circa 25 % di una settimana, più tre verifiche nel browser. Il task 2 è lo stesso varco che ADR-0184 §8 chiede per il self-hosting
(task 6 di quello studio): uno solo dei due lo fa.

---

## 7. Le superfici di sicurezza che il progetto aprirà

Questo task non tocca codice: nessuna superficie nuova. Quelle dei task del § 6, da registrare in `docs/sicurezza/registro.md` quando
nascono:

1. **Il pagante risolto dalla politica** (task 1): un mondo compromesso che fa addebitare al master chiamate che nessuno ha chiesto. Oggi
   `chi` viene dal kernel del mondo (ADR-0113) e il tetto del master e i ritmi per viandante lo contengono; `charge` resta nel kernel e il
   ledger non accetta un pagante che non sia nel mondo.
2. **La rotta `guests`** (task 2): solo il master (`owns`), JSON, ritmo per indirizzo e per account; i token escono una volta e si
   conservano come impronte; scadenza e usi; togliere un ospite chiude il socket; il master non si toglie.
3. **L'invito nell'URL** (task 2): un link si copia; scadenza breve e un uso per predefinito, il token mai nei log (V-020), consumato al
   primo `join` buono.
4. **L'enumerazione** (task 2): un universo privato non esiste per chi non è ospite (404 come per un nome ignoto, non 403); il ritmo degli
   avvii (`starts`) resta.
5. **Il file `.campaign`** (task 2, 3): scritto atomico sotto lucchetto, mai nel processo del mondo (8g), letto dal server soltanto; `pace`
   passato al mondo per valore.
6. **Il messaggio `pace`** (task 3): solo il master, valori riparati (mai sopra la lobby), un ritmo suo (`LIMITS`).
7. **Le direttive** (task 4): testo del master che entra nei prompt: la quarta parete e `cleanText` (una riga per direttiva, niente markup,
   tetti); non arrivano a Jev né ai client; l'editor le scrive solo dal master (`owns`).
8. **Le regioni, le trame e gli individui dichiarati** (task 5, 6): scritti dal kernel con i validatori di oggi (`validatePlan` non cambia;
   le trame dal validatore delle trame), mai dal client in un mondo di molti se non per il master.

---

## 8. Le domande per l'autore

Sono nell'ADR (§ Domande). Le due che cambiano il disegno: se il titolare delle carte, quando paga il master, resta chi ha chiesto (la
raccomandazione) o diventa il master; e se la pausa ferma anche i dialoghi fra individui e le trame (la raccomandazione: sì, ferma ciò che
il mondo fa da sé, non ciò che i giocatori fanno).
