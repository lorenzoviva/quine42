# Piano — Multiplayer (bozza, non implementato)

> Stato: **piano**, da discutere prima di scrivere codice. Quando le decisioni saranno prese
> diventerà un ADR e una sezione di `AGENTS.md`.

## La proposta (dall'autore)

1. Prima della partita si elegge un **master** (il Dungeon Master). Solo lui ha le rune che fermano il
   tappeto, illimitate; per gli altri non compaiono. Gli altri giocatori non vedono il Concilio
   (pannello `G`, registro, console), così non ricevono spoiler.
2. Ogni giocatore ha **il proprio tappeto**. Gli altri giocatori li vede come avatar simili agli NPC, che
   ripetono le loro azioni.
3. Chi esce dal tappeto **sparisce** per gli altri; lui vede solo la sezione di tappeto congelata.

L'idea regge e si sposa con i due tavoli (ADR-0025): il master siede al tavolo del Concilio, gli altri
vivono nel mondo. Sotto ci sono però parecchi punti che l'architettura attuale dà per scontati con un solo
giocatore. Qui sotto sono raccolti per tema; ciascuno ha una proposta e, dove serve, una **domanda aperta**.

## Cosa dà per scontato il gioco a un giocatore

| Oggi | Problema con più giocatori |
|---|---|
| Un solo `playerId`; `world/stato.json` è *il* viandante | Inventario, bisogni, stati, slot, frase di rune e trascendenza vanno salvati **per giocatore** |
| Il kernel simula un cerchio attorno al viandante (tappeto in (0,0) con un offset) | Ci sono N cerchi. Chi simula gli NPC, il fuoco e i contenitori dove i cerchi si sovrappongono, o in una zona dove non c'è nessuno? |
| Binding delle rune `x y speed carpet time` | `time` è globale: chi lo cambia cambia la notte per tutti. `carpet` è del singolo |
| `R` / rollback riportano l'**intero repository** all'ultimo commit valido | Il rollback di uno cancellerebbe i luoghi, gli oggetti e le modifiche degli altri |
| Morte → «ricomincia dal seme» mette l'universo nel cestino | Non può farlo un giocatore qualsiasi |
| Ricordi, legami, figli e missioni degli NPC parlano di «il viandante» | Serve sapere *quale* viandante |
| La Genesi e i nuovi luoghi li genera il client che ci arriva | Due giocatori sullo stesso luogo nuovo lo genererebbero due volte |
| La chiave Gemini sta sul server del giocatore | Tutti i giocatori consumano la chiave (e il budget) del master |
| Il giocatore può rompere il gioco (regola 3): fault, glitch | Un fault del master in un modulo condiviso diventa il fault di tutti |

## Architettura proposta

**Server autoritativo = il server Vite del master** (lo stesso che oggi ospita `universeStore` e il proxy
Gemini), con un WebSocket in più (`/api/session`). Ogni giocatore apre l'URL del master.

- **Repository**: uno solo, quello del master. I client lo ricevono all'ingresso (snapshot dei file come
  oggi da `/api/universe`) e poi ricevono i **commit** per diff; li caricano a caldo, come l'hot reload di
  oggi. Solo il server committa.
- **Simulazione locale, stato condiviso sul server**: ogni client simula il proprio cerchio (rune, tappeto,
  movimento, Lua dei moduli) come oggi. Lo stato che deve essere **uno solo** sta sul server e passa per
  messaggi:
  - oggetti raccolti (`consumati`), contenitori, terreno cambiato;
  - persone (`people.json`: ricordi, legami, nascite), trame e missioni;
  - ora del giorno, regole (`rules.json`).

  Il server arbitra: se due giocatori aprono la stessa cassa, vince il primo.
- **NPC**: ogni NPC ha un **proprietario**, il giocatore più vicino che lo ha caricato. Lui lo simula e ne
  manda posizione e attività; gli altri lo interpolano. Quando il proprietario si allontana, l'NPC passa
  a un altro. Senza nessuno vicino resta congelato, come oggi fuori dal cerchio.
- **Generazione con lock**: il primo che entra in un luogo nuovo chiede al server; il server genera (o
  delega e aspetta) e committa la mappa in `maps/`. Gli altri ricevono la mappa già pronta.
  - Il Concilio gira sul server: Narratore, Fucina, sessioni.
  - Le chiamate per giocatore passano dal proxy con un **budget per giocatore**: chat, «Esamina»,
    «Altro…».
- **Avatar**: un'entità `remote` per ogni altro giocatore.
  - Riceve circa 10 pacchetti al secondo: posizione nel mondo (offset del tappeto + posizione locale),
    direzione, attività, battuta.
  - Si disegna con il proprio sprite. Ogni giocatore ha un viandante con abiti propri, come gli
    individui NPC.
  - Si interpola sul client.
- **Stato per giocatore**: `world/giocatori/<id>.json` sostituisce `world/stato.json` (che resta per il
  gioco da soli). L'id è stabile (nome + segreto locale nel browser), così chi si ricollega ritrova lo
  zaino.

## Il master

- **Elezione**: chi ospita è il master. È la scelta più semplice, perché ha il repository e la chiave.
  Altre forme (votazione, passaggio del ruolo a metà partita) richiedono di spostare il repository:
  le rimanderei.
- **Rune del tappeto**: oggi i token del tappeto (`CARPET_TOKENS`: `carpet active strength rate ox oy`)
  sono rari e generati nei luoghi. In multiplayer:
  - non vengono generati per i giocatori;
  - il master li ha come scorta illimitata nella borsa delle rune.
- **Non basta togliere le rune**: un giocatore che ne ha già nella borsa, o che le compone (`x = 9999`,
  `speed = 50`), può comunque scappare. Il kernel deve quindi **ignorare le scritture al binding
  `carpet`** dei non master e limitare `x`/`y` a spostamenti locali. Chi vuole rompere il gioco lo rompe
  solo per sé: un fault isolato, un rollback solo suo.
- **Nascondere il Concilio** ai giocatori:
  - pannello `G`, registro, console ed editor;
  - Galleria e studi (sono nella corona, quindi già irraggiungibili);
  - messaggi dell'HUD che citano gli agenti.

  Un browser però non si può blindare: `window.rune` in DevTools mostra tutto. Si nasconde in
  produzione; tra amici è accettabile.
- **Cosa vede il master dalla corona**: i giocatori sull'atlante (segnaposti) e una vista che può seguire
  un giocatore. Senza questo il DM gioca alla cieca.
- **Modifiche del master in prova**: il master può rompere il gioco (regola 3), ma la rottura non deve
  arrivare a tutti.
  - Le modifiche del master (editor, rune scritte nella corona, richieste al Referente) vanno su un
    **ramo `master`**.
  - Il master le prova da solo e le **pubblica** con un gesto esplicito (merge e diffusione).
  - Il Concilio automatico invece committa direttamente, perché passa dal validatore.

## Uscire dal tappeto

- Chi esce sparisce per gli altri: il server smette di inoltrare il suo avatar.
- Lui vede la sezione di tappeto congelata, cioè il proprio cerchio fermo. Per il master è il modo di
  passare dietro le quinte.
- **Punto aperto**: oggi i non master non possono uscire. Se succede comunque (un bug, un fault), si
  riporta il giocatore sul tappeto o lo si lascia nella corona? Proposta: lo si riporta, con un messaggio
  nel mondo («ti risvegli sulla strada»).

## Altre criticità (oltre a quelle viste dall'autore)

1. **Rollback (`R`)**: per un giocatore annulla solo le sue azioni locali (frase di rune, fault del suo
   cerchio), mai il repository. Il rollback del repository resta del master, sul ramo `master`.
2. **Tempo**: l'ora del giorno è una sola, del server. Il binding `time` dei giocatori non ha effetto, o
   ce l'ha solo su ciò che vedono loro, come un'allucinazione. Le pause (pannelli aperti) non fermano più
   il mondo.
3. **Morte**: ricominciare dal seme è solo del master. Il giocatore morto riparte da un luogo noto
   (l'ultimo villaggio), perde una parte dello zaino, oppure resta spettatore fino alla fine della
   sessione. È una **decisione di design**.
4. **Memoria degli NPC**: ricordi, legami, figli e missioni vanno indicizzati per giocatore. «Mi
   ricordo di te» deve valere per la persona giusta. I prompt del Narratore ricevono il nome del
   viandante con cui si parla.
5. **Azioni tra giocatori**:
   - un «Altro…» rivolto all'avatar di un altro (colpirlo, abbracciarlo, dargli un oggetto) produce
     effetti su un client remoto: il server li inoltra e il destinatario li applica;
   - servono anche gli scambi di oggetti;
   - **PvP sì o no?**
6. **Parlare tra giocatori**: chat di testo tra avatar vicini (fumetti). I giocatori umani possono fare
   meta-gioco a voce: il filtro della quarta parete vale solo per il Concilio.
7. **Costi**: N giocatori moltiplicano le chiamate a Gemini, soprattutto per i luoghi nuovi esplorati in
   direzioni diverse e per le chat. Servono budget per giocatore e un limite di luoghi nuovi al minuto
   per l'intera sessione; le immagini restano condivise.
8. **Latenza e coerenza**: le azioni sullo stato condiviso (raccogliere, aprire, cambiare il terreno)
   diventano asincrone. Il client mostra l'esito subito e lo annulla se il server rifiuta (ad esempio
   l'oggetto è già stato preso).
9. **Moduli Lua e determinismo**: due client che simulano lo stesso fuoco o lo stesso NPC divergono.
   Il proprietario unico dell'entità (vedi NPC) lo evita; il fuoco che si propaga è stato condiviso.
10. **Ingresso e uscita**: chi entra a partita in corso scarica lo snapshot più lo stato condiviso. Se il
    master cade la sessione si sospende: non c'è migrazione dell'host.
11. **Interni**: gli interni degli edifici del mondo sono condivisi (stesse coordinate). Gli interni
    della corona, con lo studio a `INTERIOR_X`, sono solo del master.
12. **Rete di casa**: il server Vite ascolta su `localhost`. Per giocare in LAN serve `--host`; per
    Internet serve un tunnel o un relay. Se il server è esposto, va protetto con una password di
    sessione: la chiave Gemini resta sul server, ma il proxy diventerebbe pubblico.
13. **Numero di giocatori**: da 2 a 4 per cominciare (budget Gemini, NPC per luogo, banda).

## Fasi proposte

0. **Preparazione da soli** (utile anche senza rete):
   - un id per il viandante;
   - stato per giocatore (`world/giocatori/`);
   - ricordi e missioni indicizzati per giocatore;
   - binding `carpet` controllato dal kernel;
   - rollback locale separato da quello del repository.
1. **Co-op senza master**:
   - WebSocket sul server;
   - avatar;
   - stato condiviso (consumati, contenitori, terreno, persone, ora);
   - generazione con lock;
   - proprietario degli NPC.
2. **Il master**:
   - ruolo e rune del tappeto;
   - Concilio nascosto agli altri;
   - giocatori visibili dalla corona;
   - ramo `master` e pubblicazione.
3. **Tra giocatori**: scambi, chat, azioni sugli avatar, morte in multiplayer, ricollegamento.

Ogni fase ha test headless: due kernel nello stesso processo collegati da un finto trasporto.

## Domande per l'autore

1. Il master è sempre chi ospita, o vuoi poterlo cambiare a metà partita?
2. Morte di un giocatore: riparte da un luogo noto, perde qualcosa, o diventa spettatore?
3. PvP: i giocatori possono farsi del male?
4. Il master gioca anche nel mondo (ha un avatar visibile quando è sul tappeto) o fa solo il DM?
5. Il master vede gli NPC e i giocatori dalla corona in tempo reale, o solo sull'atlante?
6. LAN tra amici o anche Internet (tunnel/relay)?
