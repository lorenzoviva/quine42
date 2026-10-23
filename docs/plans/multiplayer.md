# Piano — Multiplayer

> Stato: **piano approvato, non implementato** (ADR-0050). Le decisioni dell'autore sono quelle del to-do del
> 22/10/2026 (sezione «Multiplayer» di [`docs/userchats/to-do-2026-10-22.md`](../userchats/to-do-2026-10-22.md));
> per ogni criticità che l'autore non ha citato vale la proposta della prima bozza, qui riportata. I task sono nel
> [backlog](backlog.md), sezione «Multiplayer» (T33-T45).

## L'idea

Prima della partita c'è un **master** (il Dungeon Master, ADR-0025): siede al tavolo del Concilio, gli altri
vivono nel mondo. Ogni giocatore ha **il proprio tappeto** e vede gli altri come avatar, con il loro modello del
viandante. Il multiplayer serve anche a sostenere il gioco: un server nostro fa da proxy verso i provider di IA e
custodisce gli universi, i giocatori pagano in **crediti** ciò che fanno generare, e ogni contenuto generato
diventa una **carta** di chi l'ha pagato.

## Le decisioni

1. **Due modalità.** *Singola*: tutto resta come oggi (corona, Concilio, tappeto, rollback), solo che le chiamate
   all'IA passano dal nostro server. *Multigiocatore*: un master e dei giocatori; per i giocatori la corona e il
   Concilio **non esistono**.
2. **Il server è l'unica fonte di verità.** Il kernel gira sul server; i client disegnano lo stato che ricevono e
   mandano la propria posizione e le proprie azioni. La casualità viene da semi predeterminati e condivisi: ciò che
   un client calcola in anticipo coincide con ciò che calcola il server.
3. **Il server** è ospitato su Google Cloud: fa da proxy verso i provider con la nostra chiave (P#1: l'1% del costo
   di generazione), tiene privati i repository degli universi e, per i mondi sempre accesi, fa riunire il Concilio
   anche quando il master non è collegato.
4. **Crediti.** Si gioca comprando crediti, o in modalità *offline* su un universo già generato. Chi fa generare
   paga: i luoghi che esplora, le sue chat, i suoi «Altro…». Le decisioni del Concilio che toccano il mondo intero
   (trame orizzontali, sessioni, regole) si dividono tra tutti i giocatori. Chi finisce i crediti lo sa e sceglie:
   ricarica, continua offline o abbandona.
5. **La lobby.** Prima di entrare in un universo il giocatore fissa un tetto di crediti, sceglie i modelli dei vari
   agenti ed eventualmente i coefficienti di generazione per tipo di contenuto. Chi crea un universo multigiocatore
   può imporre dei minimi (le strutture non sotto Gemini 3.8 Flash), fissare un modello, o chiedere una spesa minima
   una tantum per entrare.
6. **Carte (P#2).** Ogni contenuto generato (un luogo, un modello, una persona, un oggetto, una trama, una regola) è
   registrato come carta del giocatore che l'ha pagato; la proprietà legale resta nostra. Un contenuto pagato da
   tutti va a uno di loro, estratto a sorte. Fuori dalla partita il giocatore vede la sua collezione di carte con gli
   utilizzi; un domani può ricevere una piccola percentuale di crediti quando una sua carta è usata in un'altra
   storia. Si prepara subito, anche se non viene retribuito.
7. **Il master** non cambia: chi crea l'universo multigiocatore lo resta. Per cambiare master si clona l'universo
   (le carte restano a chi le ha generate). Il master gira per il mondo con il suo aspetto da viandante, in
   **god mode** (non muore, non ha bisogni, non subisce danni); ha una sola runa del tappeto, quella che lo porta
   nella Sala del Concilio, e ogni altra runa la chiede al Referente. Solo lui fa i rollback.
8. **Le rune dei giocatori** sono quelle che non rompono la partita degli altri (le magiche: `luce fuoco acqua terra
   vita scudo vento`, e le parole che non scrivono i binding del tappeto). Le rune del tappeto (`CARPET_TOKENS` in
   `runes.ts`) e quelle che scrivono `x y speed carpet time` non vengono generate per loro.
9. **Prima della Genesi, per sempre.** Alcune scelte si fanno creando l'universo e non si cambiano più, perché il
   Concilio e l'Ingegnere ci costruiscono sopra meccaniche che non si possono disfare:
   - **quanto è punitiva la morte**, in singola e in multigiocatore: un campo di testo libero, o «molto
     punitiva» / «poco punitiva». Va al Concilio come principio: se ha introdotto le abilità e la morte è molto
     punitiva, può decidere di toglierle tutte;
   - **PvP** sì o no;
   - **«Altro…» tra giocatori** sì o no.
10. **Interazioni tra giocatori**: tutte possibili per il kernel. «Altro…» su un altro giocatore si giudica come un
    «Altro…» su una persona del mondo; il PvP segue la scelta dell'universo; gli scambi di oggetti e la chat tra
    avatar vicini (fumetti) ci sono sempre. I giocatori possono fare meta-gioco tra loro: la quarta parete vale per
    il Concilio, non per le persone vere.
11. **Account**: autenticazione e pagamenti sicuri, un profilo ricco e il viandante personalizzabile.

## Cosa dà per scontato il gioco a un giocatore

| Oggi | In multigiocatore |
|---|---|
| Il kernel gira nel browser, il server di Vite salva i file e fa da proxy | Il kernel gira sul server; il client disegna, ascolta i tasti e predice il proprio passo |
| Un solo `playerId`; `world/stato.json` è *il* viandante | Uno stato per giocatore (`world/giocatori/<id>.json`): inventario, bisogni, stati, slot, frase di rune, carte |
| Un cerchio di simulazione attorno al viandante (tappeto con un offset) | N cerchi, tutti sul server; NPC, fuoco e contenitori dove si sovrappongono sono simulati una volta sola |
| Binding delle rune `x y speed carpet time` | Per i giocatori `carpet`, `x`, `y`, `time` non si scrivono; `time` è del server |
| `Math.random` e semi locali in kernel e Lua | Ogni estrazione da un seme condiviso (universo, tick, entità): stesso input, stesso stato |
| `R` riporta l'intero repository all'ultimo commit valido | Il rollback del repository è solo del master; quello di un giocatore riguarda il suo tappeto e la sua frase |
| Morte → continua o ricomincia dal seme (ADR-0026) | La punizione è quella scelta alla Genesi; ricominciare dal seme è solo del master |
| Ricordi, legami, figli e missioni parlano di «il viandante» | Indicizzati per giocatore; il Narratore riceve il nome del viandante con cui si parla |
| I luoghi nuovi li genera il client che ci arriva | Li genera il server, una volta, a nome (e a spese) del primo che ci arriva |
| Il registro dei consumi è per giorno, modello e compito (ADR-0039) | Anche per giocatore, con la divisione delle spese comuni |
| Un fault isola il modulo e si mostra (regola 3) | Il fault di un giocatore resta nel suo tappeto; un fault di un modulo condiviso lo ripara l'Ingegnere sul server |
| L'aspetto di ogni cosa è un programma della libreria, generato una volta per tipo | Uguale: la libreria è una sola per universo, i client ricevono i programmi e li eseguono nei worker |

## Architettura

**Il server.** Un processo Node per universo con il kernel headless (lo stesso che oggi gira nei test con
`MockModels`), il repository git dell'universo (`universeStore`), il proxy dei provider e un WebSocket
(`/api/session`). In sviluppo resta il server di Vite, con più schede del browser come giocatori.

- **Stato.** Il server tiene l'unico stato del mondo: entità, persone, trame, regole, terreno cambiato, contenitori,
  ora del giorno, i tappeti di tutti. Ogni client riceve all'ingresso un'istantanea (i file dell'universo come oggi da
  `/api/universe`, più lo stato) e poi i cambiamenti, a circa 10 aggiornamenti al secondo per le entità vicine.
- **Determinismo.** `rng` del kernel e `hash` di Lua prendono il seme da (universo, tick, entità); niente orologio di
  sistema nella simulazione. Il client può far girare in anticipo ciò che vede (il vagare delle persone, il vento, le
  animazioni) e coincide con il server; se diverge, vince il server.
- **Il passo del giocatore.** Il client sposta il viandante subito (il tappeto compensa come oggi) e manda la
  posizione; il server la controlla con la stessa collisione (regola 10: velocità, terreno, voxel) e la corregge se
  serve. Azioni, frasi di rune, chat e «Altro…» sono messaggi al server, che risponde con l'esito: il client lo mostra
  subito e lo annulla se il server rifiuta (l'oggetto l'ha già preso un altro).
- **Avatar.** Ogni altro giocatore è un'entità `remote` con il modello del viandante, il suo seme e il suo colore
  (dal profilo), interpolata sul client, con gli arti e i fumetti di una persona.
- **Generazione con lock.** Il primo che entra in un luogo nuovo lo chiede al server; il server lo genera una volta,
  lo committa in `maps/` e lo addebita a lui. Chi arriva dopo lo riceve pronto. Il Concilio (Narratore, Cartografo,
  Fucina, Scultore, sessioni) gira solo sul server.
- **Il client del giocatore** non contiene la corona, lo studio, il pannello del Concilio, il registro, la console né
  l'editor: si caricano solo nel client del master (import dinamici), e il server non manda ai giocatori il registro
  del Concilio né i file dello studio. `window.rune` del giocatore espone solo il client.

**La modalità singola** usa lo stesso server per le chiamate (proxy e crediti), ma il kernel può restare nel
browser come oggi: è la strada più corta e non cambia nulla del gioco. Spostarlo sul server anche lì è una scelta
successiva.

## Il master

- **Chi è**: chi crea l'universo multigiocatore. Non si cambia; si clona l'universo con un altro master.
- **God mode**: gira nel mondo con l'aspetto del suo viandante, visibile agli altri; non muore, non ha bisogni, non
  subisce danni né effetti dei giocatori.
- **La runa del Concilio**: una sola runa del tappeto, illimitata, che lo porta nella Sala del Concilio (il tappeto
  lo lascia andare, come oggi oltre il cerchio). Ogni altra runa la chiede al Referente. Per gli altri non esiste.
- **Il kernel ignora le scritture** di `carpet`, `x`, `y`, `time` dei non master, anche se una runa del genere ci
  arrivasse per errore (un universo nato in singola, un oggetto vecchio): chi rompe il gioco lo rompe solo per sé.
- **Dalla corona** il master vede i giocatori sull'atlante e può seguirne uno; senza, il DM gioca alla cieca.
- **Modifiche in prova** (proposta approvata): le modifiche del master (editor, rune scritte nella corona,
  richieste al Referente) vanno su un ramo `master`; lui le prova da solo e le **pubblica** con un gesto esplicito
  (merge e diffusione ai client). Il Concilio automatico committa direttamente, perché passa dal validatore.
- **Mondi sempre accesi**: il Concilio si riunisce sul server anche senza master (sessioni ogni 12 luoghi, trame).

## Uscire dal tappeto

- Il master esce con la sua runa: per gli altri il suo avatar sparisce finché non torna nel mondo.
- I giocatori non possono uscire. Se succede comunque (un bug, un fault), il server li riporta sul tappeto con un
  messaggio nel mondo («ti risvegli sulla strada»).

## Spesa, crediti e carte

- **Chi paga**: ogni chiamata ha un `chi` (il giocatore) o è *comune*. Il registro dei consumi (ADR-0039) la conta
  per giocatore; le comuni si dividono tra i giocatori dell'universo (quelli collegati? tutti? — domanda 3).
- **Tetto**: il tetto della lobby si somma ai budget di oggi (`ai.maxText`, `maxForges`, `maxPacks`, `maxCast`,
  `maxModels`): quando un giocatore lo raggiunge, ciò che chiede si fa con i modelli locali o non si fa, come senza
  chiave.
- **Modelli per agente**: oggi `ai.textModel` e la tabella delle classi dello Scultore (3.1 Flash-Lite, 3.8 Flash,
  Argon) sono dell'universo; diventano scelte della lobby, entro i minimi dell'universo.
- **Carte**: ogni contenuto generato porta l'autore e il pagante nell'`origin` (moduli, modelli in
  `models/index.json`, luoghi in `maps/`, persone, trame, regole) e un contatore di utilizzi. La collezione si
  costruisce dal repository; «usato in un'altra storia» vuol dire in un altro universo (un clone, o una libreria
  comune di contenuti — domanda 2).
- **Offline**: un universo già generato, senza chiamate; ciò che manca si fa con i modelli locali di `MockModels`.

## Altre criticità (proposte approvate)

1. **Rollback (`R`)**: per un giocatore annulla solo il suo tappeto e la sua frase di rune, mai il repository.
2. **Tempo**: l'ora è una sola, del server; i pannelli aperti non fermano più il mondo.
3. **Morte**: il Concilio applica la punizione scelta alla Genesi (cosa si perde, dove si riparte: di solito
   l'ultimo villaggio); ricominciare dal seme è solo del master.
4. **Memoria delle persone**: ricordi, legami, figli e missioni per giocatore; «mi ricordo di te» vale per quello
   giusto. Nel grafo del mondo ogni giocatore è un nodo (oggi c'è solo il viandante).
5. **Latenza**: le azioni sullo stato condiviso si mostrano subito e si annullano se il server rifiuta.
6. **Moduli Lua**: girano solo sul server; il client, se predice, usa gli stessi semi.
7. **Interni**: gli interni delle strutture del mondo sono condivisi; la corona e gli interni dello studio
   (`INTERIOR_X`) esistono solo per il master.
8. **Costi**: N giocatori moltiplicano le chat e i luoghi nuovi. Oltre ai tetti per giocatore, un limite di luoghi
   nuovi al minuto per universo. La libreria dei modelli è un programma per tipo, condiviso: più giocatori non la
   rendono più cara.
9. **Ingresso e uscita**: chi entra a partita in corso scarica l'istantanea; chi si ricollega ritrova il suo stato
   (l'id è quello dell'account). Se il server cade la sessione si sospende.
10. **Numero di giocatori**: da 2 a 4 per cominciare (crediti, persone per luogo, banda).
11. **Sicurezza**: il proxy non è mai pubblico senza un account; la chiave non lascia il server (regola 9).

## Fasi

0. **Da soli, utile anche senza rete** (T33-T37): configurazione dell'universo alla Genesi; il viandante con un id e
   lo stato per giocatore; semi condivisi e determinismo; autore e pagante di ogni contenuto; rune e binding per ruolo.
1. **Server unica fonte di verità** (T38-T41): kernel headless sul server con il WebSocket; client sottile con
   predizione e avatar; generazione con lock; client del giocatore senza corona né Concilio.
2. **Il master** (T42): ruolo fisso, god mode, runa del Concilio, giocatori dalla corona, ramo `master` e
   pubblicazione, clone con un nuovo master.
3. **Tra giocatori** (T43): «Altro…» sugli avatar, PvP, scambi, chat, morte in multigiocatore.
4. **La piattaforma** (T44-T45): account e profilo; crediti, lobby, carte e server su Google Cloud.

Ogni fase ha test headless: più kernel client e un kernel server nello stesso processo, collegati da un finto
trasporto, che devono arrivare allo stesso stato.

## Domande per l'autore

1. **Account e pagamenti**: quale fornitore (Firebase Auth / Identity Platform di Google Cloud, Stripe per i
   pagamenti, altro)?
2. **«Usato in un'altra storia»**: i contenuti passano tra universi diversi (una libreria comune da cui il Concilio
   pesca), o solo nei cloni?
3. **Spese comuni**: si dividono tra i giocatori collegati in quel momento o tra tutti quelli dell'universo? E il
   master paga la sua parte?
4. **Coefficienti di generazione**: cosa regolano (quanti contenuti per luogo, quante revisioni dello Scultore,
   la classe dei modelli)? Proposta: un moltiplicatore per tipo sui budget di `ai`.
