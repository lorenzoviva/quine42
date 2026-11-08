# ADR-0178 — La griglia a pezzi: modelli grandi a parti coerenti

Data: 2026-11-08 · Stato: accettato (task T339 del backlog, step 30) · Riferimenti: l'autore in chat (07/11, epoca 328,
[`docs/userchats/to-do-2026-11-07.md`](../userchats/to-do-2026-11-07.md)), ADR-0032…0036 (le strutture a blocchi e perché sono state
lasciate), ADR-0049 (la densità dei modelli grandi), ADR-0092 (le taglie), ADR-0108 (la cache delle forme), ADR-0142 (il censimento, il
motore che non cambia un voxel), ADR-0160 (le strutture procedurali), ADR-0171 (`<import>`), ADR-0174 (`wfc`); il banco
[`lab/banco/pezzi/`](../../lab/banco/pezzi/README.md)

## Contesto

L'autore (07/11): le misure massime dei modelli sono limitate perché MarkovJunior lavora sull'intera griglia, e una fattoria di 50 × 50
caselle con il pascolo non entra; una prova passata con due griglie di misure diverse è fallita perché i pezzi da assemblare quasi mai
combaciavano; le parti devono restare compatibili e coerenti: «crearle insieme nella stessa griglia e poi separarle, oppure inventati
qualcosa».

**La prova di prima** sono le strutture a blocchi degli step 8A-8E (ADR-0032…0035, `lab/mj3d/`, commit `23323f18`): uno Scultore dei
blocchi scriveva blocchi di una casella per un livello, ognuno con il suo programma nella sua griglia e con le prese sui sei lati; un
Architetto li componeva con un WFC su una pianta a blocchi; il kernel controllava le prese e i voxel delle facce. Non combaciavano per
quattro ragioni, scritte allora: i blocchi nascevano prima della pianta e separati, e i loro bordi si incontravano solo se le prese
dichiarate e i voxel coincidevano (lo Scultore dava nomi diversi alle zone che si toccano: «niente combaciava», ADR-0035); le prese
vedono quattro lati, non le diagonali né il contesto (le torri con l'acqua verso il cortile); l'Architetto inventava adiacenze che i
modelli 3D non avevano (ADR-0036); nessuna regola vedeva oltre il bordo di un blocco (ADR-0034). ADR-0036 ha lasciato quella strada per
il modello intero: è da lì che viene il tetto di oggi.

**Il tetto di oggi**, misurato (`lab/scripts/misura-tetto.ts`, tabelle in `lab/banco/pezzi/README.md`):

- le scatole delle classi si fermano a 120 voxel di lato (`MAX_SIDE` di `src/mj/classes.ts`, ADR-0049): una struttura Gargantuesca è
  10 × 10 caselle a 12 voxel per casella, e una più grande sarebbe più rada;
- `FORM_LIMITS`: 512 di lato e 8 milioni di celle; una fattoria di 50 × 50 caselle a 10 voxel per casella (500 × 500 × 50, 12,5 milioni)
  il gioco la rifiuta;
- il motore no: col censimento di ADR-0142 un programma che decide su un piano gira sulla griglia intera in 1,3 s a 12,5 milioni di
  celle (67 MB di picco) e in 4 s a 50 milioni; i programmi del seme in scatole fino a 480 di lato restano sotto 1 s, perché non le
  riempiono. Ciò che sulla griglia intera cresce con le celle sono i timbri, il buffer di `all` e le corrispondenze di tutta la griglia:
  a 50 milioni di celle la corsa lascia sul heap più del doppio (384 MB contro 169 a pezzi); a 12,5 milioni i pezzi costano anzi un po'
  di più (96 MB di picco), per la copia della griglia e le finestre;
- la mesh: un quadrato per faccia visibile (`meshVoxels`), anche sotto il suolo: la fattoria di 50 × 50 fa 1,8 milioni di vertici e
  80 MB, quasi due terzi di ciò che un `WorkerRunner` tiene per tutte le forme (128 MB). È il costo più grande, come in T331.

## Decisione

1. **Il piano decide, i pezzi rifiniscono.** Le parti si creano insieme nella stessa griglia: il piano grossolano, una cella per
   casella (dove stanno casa, campi, recinti, sentieri; quanto è alto un muro), che una `map` porta ai voxel disegnando i bordi fra le
   zone dalle celle del piano, uguali per i due lati. Il dettaglio a piena scala gira **a pezzi**: è la via (a) del task. Le parti
   combaciano per costruzione perché vengono dallo stesso piano e girano le stesse regole, ognuna con il margine che le serve.

2. **`<pieces piece="x y" margin time>`** (MarkovJunior non ce l'ha; `src/mj/engine.ts`, `src/mj/model.ts`): i suoi nodi girano su un
   pezzo della griglia alla volta (`piece` celle per lato, tutta l'altezza, in righe dal fondo), ognuno su una finestra che è il pezzo
   più `margin` celle attorno (8 se non detto, al più 64), dall'inizio, col suo generatore (da una sola estrazione della corsa), il suo
   censimento, le sue corrispondenze e il suo tempo (`time`); della finestra torna nella griglia solo il pezzo. Ogni pezzo legge la
   griglia com'era quando il nodo è cominciato (i pezzi non dipendono l'uno dall'altro: si potrebbero fare in parallelo) e il margine
   cresce con le regole del pezzo, poi si butta. Ne viene la proprietà su cui si regge tutto: **una regola che dà lo stesso risultato in
   qualunque ordine e guarda non più lontano del margine dà nei pezzi ciò che dà la griglia intera, voxel per voxel**
   (`tests/mj-pieces.test.ts`: tetti a padiglione, scale di trenta gradini, quattro semi e tre tagli). Il resto è il prezzo del caso:
   - `one` sceglie solo dove cambia il pezzo: i suoi `steps` sono per pezzo (il forte del banco mette `steps="5"` alle feritoie per i
     nove pezzi al posto dei 40 della griglia intera);
   - ciò che è a caso e largo più celle (un'impronta, una finestra a impacchettamento) può essere tagliato dove due pezzi si incontrano:
     i pezzi si allineano alle celle del piano (130 voxel nella fattoria, celle da 10) e ciò che si timbra sta dentro una cella;
   - una corrispondenza a cavallo del bordo è una corrispondenza (una scala che esce dal pezzo cresce nel margine come nella griglia
     intera, e il pezzo accanto, che la fa anche lui, tiene il resto);
   - dentro non vanno `map` e `wfc` (fanno un'altra griglia), le forme (coordinate della griglia intera), `observe` e `search` (il
     futuro di tutta la griglia) né un altro `pieces`; `pieces` non va in un'azione o un'animazione: il compilatore lo dice con la riga.
   Il motore: `PiecesRunner`; `pieceGuard` dice per ogni cella della finestra se è del pezzo, del margine che cresce o di uno fermo;
   `write` non cambia mai una cella ferma e una regola non corrisponde dove ne cambierebbe una. Fuori da un pezzo `pieceGuard` è vuoto e
   ogni corsa è quella di sempre: `tests/mj-engine-determinism.test.ts` non cambia.

3. **Le due vie, misurate** (`lab/scripts/banco-pezzi.ts`, la fattoria e il forte a quattro semi, contro la griglia intera; lo stesso
   seme dà lo stesso piano, quindi si confronta il solo dettaglio):
   - **(a)**, la scelta (`halo="before"`, margine che cresce): tetti, traverse, paletti e cancelli della fattoria identici alla griglia
     intera (0 voxel diversi a ogni seme), sentieri e recinti negli stessi pezzi, nessun salto in più dove i pezzi si incontrano; il
     forte uguale (le scale non hanno attraversato bordi nei quattro semi, il test sì);
   - **(b)**, la griglia generata a finestre che scorrono con i bordi già scritti come ingresso (`halo="written"`: un pezzo legge ciò che
     hanno scritto i pezzi prima, che restano fermi): sulla fattoria uguale ad (a), ma **spezza ciò che cresce da un pezzo al successivo**
     (il test: una scala nata nel pezzo prima arriva al bordo senza testa, perché il pezzo prima l'ha finita nel suo margine, che ha
     buttato); non dà niente in cambio sui bordi;
   - **il margine fermo** (`edge="frozen"`, in tutte e due): 4.000-10.500 voxel di tetto sbagliati per seme nella fattoria (il tetto del
     fienile in due falde dove passa il bordo, `lab/banco/pezzi/fattoria-bordo.png`).
   Le vie non si equivalgono: (a). Le due varianti restano scrivibili (`halo`, `edge`) perché il banco le rifà; il predefinito è (a).

4. **I tetti.** Chi fa girare un programma può dare ai pezzi una griglia più grande e un tempo loro (`GridLimits.pieces`, `PieceLimits`):
   il gioco lo fa solo dove fa le forme (`runForm` con `FORM_RUN_LIMITS`: `FORM_LIMITS` più `FORM_PIECES`: 1024 di lato, 32 milioni di
   celle, 4 s a pezzo, 45 s in tutto, 1024 pezzi, 5 milioni di passi a pezzo) e il tempo dei pezzi non è quello del modello
   (`MODEL_TIME`, `tempo`). Un pezzo che sfora si ferma, gli altri girano, la corsa **non è finita** (e la cache non la tiene). Il caso
   peggiore, 30 s di modello più 45 di pezzi, sta sotto il cane da guardia del worker (120 s). Il validatore e le carte fatte a mano
   non danno niente in più: un programma con i pezzi lì gira nei limiti e nel tempo di sempre, quindi nel gioco non fa più di ciò che ha
   passato. La chiave della cache (`formKey`) è il testo: cambia con il nodo. I tetti del mondo sui nodi nuovi (ADR-0176, `worldNodeErrors`)
   valgono anche per i nodi dentro `<pieces>`, che ogni pezzo fa girare (T344, integrando con T336).

5. **Kernel 0.6.2** (sale `Z`: nessun programma del seme cambia, il contratto no; la 0.6.1 è di T336 su `3d`).

## Conseguenze

- La fattoria di 50 × 50 caselle (500 × 500 × 50) gira in 1,7 s in 16 pezzi (il più lento 0,2-0,3 s), il forte di 32 × 32 caselle
  (384 × 384 × 96) in 1,4 s in 9 pezzi; la griglia intera, coi limiti allargati, in 1,3 e 1,1 s. I pezzi non vanno più veloci e a
  queste misure non risparmiano memoria: tengono ogni pezzo in un tempo e in una memoria che non crescono col modello (un nodo che costa
  quanto la griglia a ogni passo, come `path`, costa quanto il pezzo), danno a ogni pezzo il suo tempo e fanno combaciare le parti; è
  questo che permette di alzare il tetto solo per loro.
- Il prossimo tetto è la mesh (1,8 milioni di vertici e 80 MB per la fattoria): una mesh per pezzo (il renderer ne disegna solo quelle
  in vista) e niente facce sotto il suolo sono il passo dopo, fuori da questo task.
- Nel mondo un modello più grande di un luogo (18 × 18 caselle) non ha ancora un lotto: la fattoria di 50 × 50 c'è come modello (la
  libreria, la cache, il worker, l'impronta e i pavimenti la trattano come ogni altro), non come struttura che il Cartografo posa.
- Lo Scultore non conosce `<pieces>` e il validatore non dà ai programmi generati la griglia più grande: è il lavoro di T338 (le
  strutture che si adattano alla taglia) o di un task dopo, con il prompt e il tetto del validatore.
- Integrando con T336 (`worldNodeErrors` sostituisce `newNodesRefusal`): il suo `visit` deve entrare anche nei figli di `pieces`, come
  fanno qui `inferenceIn` e `newNodesIn`.
