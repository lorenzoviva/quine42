# ADR-0192 — Individui e trame dichiarati dal master: l'incarico `individual` del Referente, gli attesi nel piano del loro luogo, «Scrivi trama» e «Modifica» sul leggio

Data: 2026-11-14 · Stato: **accettato** (T376, step 43) · Riferimenti: [ADR-0188](0188-la-campagna-del-master.md) § 5.2-5.4 (lo studio
[`campagna-master.md`](../design/campagna-master.md), § 6 riga 6, § 7 punto 8), [ADR-0191](0191-le-direttive-del-master.md) (le direttive,
D54.5: il testo del master mai a Jev), ADR-0166 (le persone come un oggetto solo), ADR-0161 (`cleanText`), ADR-0025 (i due tavoli)

## Contesto

ADR-0188 vuole che il master dica **chi** c'è nel mondo e **che cosa** succede, non solo come si fa: un individuo preciso («Gualtiero, il
fabbro, ha nascosto la chiave nel pozzo, vive a Valdorso»), una trama scritta a mano, la bibbia cambiata dal leggio. Oggi l'individuo dietro
un personaggio lo scrive il Narratore quando lo si incontra (`npc.individuate`), a caso fra i tipi di abitanti che un luogo mette; le trame le
intreccia solo il Narratore (`plot.weave`); il leggio apre la bibbia nell'editor con un bottone che chiunque nella corona vedeva. Restava da
decidere come un individuo dichiarato arriva nel luogo detto, anche quando quel luogo non è ancora fatto, e come una trama del master entra
nel giro delle altre senza un validatore nuovo.

## Decisione

1. **L'incarico `individual` del Referente** (accanto a `directive`): nella risposta i fatti in `request`, il nome in `name`, il luogo o la
   regione in `target`. Il kernel (`Kernel.declareIndividual`) lo fa solo per il master (`isMaster`), pulisce i fatti come un testo di un
   giocatore (`cleanText`, una riga, al più 600 caratteri) e li passa dal filtro locale della quarta parete (`metaBreak`; mai Jev, D54.5),
   trova il luogo (un luogo già pianificato per nome, altrimenti una regione dell'atlante; il nome come lo dice il master, senza accenti né
   maiuscole) e il tipo di abitante (quello del mondo le cui parole i fatti condividono di più, le persone prima degli animali). Ciò che non
   regge torna al master col motivo e la mancanza è scritta (`invalid`, del Narratore).
2. **Il Narratore lo scrive coi fatti dati**: la stessa chiamata `npc.individuate`, con i fatti come affermazioni da tenere (`facts` nel
   contesto; il nome detto è il suo, qualunque cosa risponda), pagata da chi chiede (`chi`), la manopola `people`. L'individuo scritto passa
   ancora da `metaBreak`; un nome già preso non entra. Va in `world/people.json` con **`declared`**: dove sta (`place`, il nome detto, e
   `at`, il luogo, o `region`, la regione); un commit di contenuto del Narratore.
3. **Gli attesi nel piano del loro luogo**: un individuo dichiarato senza `origin` è atteso. Quando un luogo si applica (`applyPlan`: appena
   pianificato o riletto) o subito, se è già caricato, il kernel (`settleDeclared`) aggiunge al suo piano un personaggio del tipo
   dell'individuo **marcato col suo nome** (`individual` sull'oggetto del piano, scritto solo dal kernel: un piano riletto non lo aggiunge due
   volte), salva il piano e dà all'individuo l'origine di quel personaggio (`<luogo>#o<n>`). Chi nasce lì è lui senza altre chiamate (il
   registro lo ritrova per origine e tipo, come chi si incontra di nuovo); la varietà dei tipi e la manopola delle persone non lo tolgono. Una
   regione accoglie l'atteso nel primo suo luogo che si applica. Il grafo segna gli attesi (`atteso`, `dichiarato`), lo Studio dei
   Personaggi li mostra nel silos («atteso», «Dichiarato dal master»).
4. **«Scrivi trama» nella Direzione**: sul tavolo della situazione, solo per il master, un titolo, il mistero e fino a 8 tappe (il giorno da
   0 a 4, il momento, chi fra le persone del registro, dove, che cosa fa, che cosa dice). Il kernel (`Kernel.writePlot`) la controlla con
   `masterPlot`: i testi con `cleanText`, giorni, momenti e posti del mondo, poi il validatore delle trame di oggi (`reviewPlot`: le persone
   esistono, un animale tace, i legami sono quelli del registro, le rune fanno ciò che dice il canone, la quarta parete col filtro locale).
   Niente si ripara in silenzio: tutto ciò che non regge torna al master. Niente missioni (sono del Narratore). Nessuna chiamata. La trama va
   in `world/plots.json` come un file del master (`saveFile`: un commit da soli, il suo ramo in una partita di molti) e le tappe accadono
   come quelle del Narratore.
5. **«Modifica» sul leggio**: il bottone del leggio apre la bibbia nell'editor, solo per il master; nessun compito nuovo.
6. **La versione**: kernel 0.7.3. `declared` e `individual` sono campi nuovi e facoltativi, ignorati da chi non li conosce: un universo di
   prima resta buono, nessuna migrazione.

## Alternative considerate

- **La lista `expected` per gli attesi**, come dice lo studio: la riscrive `repairSociety` a ogni individuo nuovo dai legami (chi è nominato e
  non incontrato), e un atteso dichiarato ne sarebbe uscito al primo. Scartata: l'individuo sta nel registro con `declared`, e «atteso» è chi
  non ha ancora un'origine.
- **Ripianificare il luogo caricato** per farcelo comparire: rifarebbe le entità del luogo e perderebbe ciò che è successo lì. Scartata: il
  kernel mette solo il personaggio nuovo, dove il piano lo mette.
- **L'individuo scritto dal kernel senza il Narratore** (solo i fatti): mancherebbero la routine, la persona per parlare, ciò che porta.
  Scartata: una chiamata, coi fatti come vincoli.
- **Le trame del master riparate come quelle del Narratore** (le tappe di chi non esiste tolte): il master non saprebbe che cosa è entrato.
  Scartata: il motivo torna a lui, tutto.

## Conseguenze

- `AGENTS.md`: la tabella del Concilio (il Referente porta gli individui al Narratore), l'indice (`#societa`); `docs/architettura-dettagli.md`
  (`#societa`); il glossario («Individuo dichiarato»).
- Sicurezza: nessuna superficie nuova. I fatti del master arrivano al Narratore come ogni richiesta al Referente, puliti e passati dal filtro
  locale; non vanno a Jev. Le trame e gli individui li scrive il kernel con i validatori di oggi, solo per il master (studio § 7 punto 8).
- In una partita di molti il Referente del master lavora sul suo ramo (T42e): l'individuo vi entra come la direttiva e nel mondo quando
  pubblica; il personaggio compare dove il mondo applica il piano. Non provato con due client (solo da soli e con `as`).
