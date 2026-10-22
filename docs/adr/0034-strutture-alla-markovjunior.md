# ADR-0034 — Laboratorio voxel: strutture scritte come gli esempi di MarkovJunior (crescita, contorno, dettaglio sulla struttura intera)

Data: 2026-10-22 · Stato: sperimentale (fuori dal gioco); estende ADR-0033

## Contesto
Dopo lo step 8C l'autore osserva che le strutture complesse «ancora non ci sono»: il meccanismo non sfrutta
la potenza di MarkovJunior, e gli esempi del repository di MJ sono molto più belli con poco sforzo.
Confrontando il laboratorio con gli esempi ufficiali (Apartemazements, DungeonGrowth, ModernHouse, SeaVilla,
PillarsOfEternity) si vedono tre differenze:

1. **La pianta non era generativa.** `castle()` disegnava anelli con `shape` (fossato, mura, cortile vuoto,
   mastio 2×2): ogni seme dava lo stesso castello. Il sotterraneo era rumore del WFC. In MJ la forma nasce
   dalle regole: stanze come timbri, crescita da un seme, `path` che collega, pulizie con `all`, cicli
   `markov` che ripetono finché tutto è collegato.
2. **Mancava il passo che rende belli gli esempi.** In MJ, dopo il nodo `wfc` con un tileset, altre regole
   girano **sulla griglia fine composta**: colonne, finestre allineate e fuse da una tessera all'altra, scale,
   terra ed erba. Da noi i blocchi venivano fotografati uno per uno e nessuna regola vedeva oltre il bordo di
   un blocco.
3. **I blocchi erano CAD, non MJ**: quasi solo `shape box`, e i prompt spingevano in quella direzione («prima
   le masse con shape»). Al motore mancavano `union`, `map` e le opzioni di `path`.

## Decisione
- **Motore** (`lab/mj3d/engine.ts`):
  - `unions` nel programma: un simbolo per un insieme di codici negli ingressi (`{"#": "RSD"}`);
  - `map`: scala la griglia di fattori interi; ogni cella diventa un blocco di sé, poi regole con ingresso
    sulla griglia vecchia e uscita scalata; i nodi dopo lavorano alla nuova risoluzione;
  - `path` come in MJ: campo di distanza dai `to`, discesa dal `from`; `inertia` (dritto finché può),
    `longest` (dal `from` più lontano); dentro un `markov` con `steps` alto si ripete;
  - `runOn`: esegue un programma su una griglia che esiste già.
- **Strutture** (`lab/mj3d/structure.ts`), due campi nuovi della pianta:
  - `paint`: segni del programma dipinti sul terreno della loro casella (cortile, strada, orto);
  - `detail`: un programma sui voxel della struttura composta (come le regole dentro il `wfc` di MJ). Le
    regole vedono oltre i bordi dei blocchi. I materiali tengono la loro lettera in tutti i blocchi (R è la
    pietra ovunque), così le regole li possono nominare. `finish()` compone, dipinge ed esegue; oltre 24
    milioni di voxel il dettaglio non gira e la struttura si fotografa ancora per blocchi.
- **Esempi scritti a mano** (`lab/programs/`):
  - `rocca.ts`: il cortile cresce da un seme come rettangoli sovrapposti; poi pulizia (niente buchi né
    strozzature); mura e fossato sono il contorno; il WFC trova le torri a ogni svolta, convessa o concava;
    il portone va dove il muro corre dritto e il `path` porta la strada al bordo e al mastio. Mastio, case,
    orti, alberi e pozzo sono timbri che chiedono spazio attorno. Il dettaglio aggiunge muschio dall'acqua,
    edera dal cortile, ciottoli, erba, solchi negli orti, porte dove la strada tocca un muro, stendardi.
  - `cripta.ts`: stile DungeonGrowth: stanze tagliate nella roccia con un margine, un ciclo `markov`
    (allaga il collegato, poi `path` dalla stanza non collegata più vicina) fino a collegare tutto. Poi
    porte dove un corridoio entra dritto in una stanza, file di pilastri, scrigni, una scala tra i livelli
    (il secondo livello cresce dall'arrivo della scala). Il dettaglio fa la roccia ruvida, le torce con la
    luce a terra, le macerie, le ossa e il muschio attorno alle pozze.
  - `castello.ts` e `sotterraneo.ts` restano per confronto («prima»).
- **Prompt**: l'Architetto impara gli idiomi di MJ (crescere da un seme, contorno con le regole, pezzi unici
  dove il contesto è giusto, timbri con spazio attorno, `path`, il ciclo che collega) e scrive `paint` e
  `detail`. Lo Scultore dei blocchi usa una lettera per materiale e regole anche dentro i blocchi; il
  linguaggio documenta `unions`, `map`, `inertia` e `longest`. Gli esempi dei prompt e i modelli offline
  usano la rocca e la cripta.
- La verifica dei lati tra un gruppo di blocchi e l'altro accetta una faccia se continua l'altra
  specchiata **o** diritta: il fianco di una falda incontra solo il fianco opposto. Le altezze sbagliate si
  vedono comunque, e la pianta controlla le facce che si toccano davvero.

## Conseguenze
- Ogni seme dà una pianta diversa. Nessun errore su 30 semi della rocca 18 × 18, 10 della 30 × 30 e 30 della
  cripta 20 × 20 × 2: zero prese sbagliate, zero giunture storte, sotterraneo sempre tutto collegato.
- Costi del kernel: pianta e WFC in pochi millisecondi. Il dettaglio richiede 3-4 s sulla rocca 18 × 18
  (7,8 milioni di voxel), ~10 s sulla 30 × 30 e ~1,6 s sulla cripta. La pagina lo esegue nel worker.
- Le istruzioni dell'Architetto pesano ~5.500 token con i due esempi (le piante generative sono più lunghe
  di quelle con le `shape`).
- Nessuna prova con Gemini: è da vedere quanto gli agenti imparino questi idiomi dagli esempi.
- Limiti noti: torri d'angolo interne vicine si raggruppano dove il cortile fa gradini stretti; oltre 24
  milioni di voxel il dettaglio non gira (servirebbero riquadri con un bordo in comune, nei worker).
