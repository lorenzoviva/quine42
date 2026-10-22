# Caselle, chunk o spazio continuo? (step 8.2B, proposta)

Richiesta in [`docs/userchats/step8.2B.md`](../userchats/step8.2B.md): con i modelli MarkovJunior interi in
3D, il Cartografo deve disporre case, alberi, fontane, ponti. Serve ancora quantizzare lo spazio in caselle
e chunk, o si passa a un universo non quantizzato? I modelli sono comunque a voxel; viandante e NPC hanno già
una posizione continua.

## Oggi

| scala | gioco (2D) | sandbox 3D (`lab/3d`) |
|---|---|---|
| chunk 18 × 18 caselle | unità di generazione, caricamento e salvataggio; un luogo per chunk | — (un mondo solo, 44 × 44 caselle) |
| casella | grafica, collisione, terreno, rune (una per casella, righe eseguite), menu delle caselle, luoghi del Cartografo | solo il terreno (il modello `River` a scala di casella) e il piano di disposizione |
| voxel (1/20 di casella) | — | forma, collisione (colonne all'altezza del corpo), pavimenti e soglie, porte che si aprono |
| continuo | viandante, NPC | viandante, NPC, **e la posizione e la rotazione di ogni modello** |

Nella sandbox la casella non decide più né la forma né la collisione: un albero può stare a mezza casella e
ruotato di 37°, la fattoria occupa 5 × 5 caselle e il suo cancello è dove il suo stesso programma l'ha messo.
La casella è rimasta solo dove serve **decidere** (il piano del terreno, dove va cosa).

## Tre strade

**A. Caselle come catasto.** Il Cartografo continua a ragionare per caselle (zone, destinazioni, sentieri),
ma ciò che vi mette è un modello con posizione e rotazione continue, che può occupare più caselle;
collisione e interazione vengono dai voxel. Cambia poco del Cartografo di oggi.

**B. Tutto continuo.** Il Cartografo dispone oggetti per coordinate (metri), con vincoli (distanze minime,
strade come curve, campionamento di Poisson). Nessuna griglia di pianificazione. È il modello dei motori
3D classici; ma toglie al Cartografo il suo strumento migliore, MarkovJunior, che lavora su griglie, e
rende più difficile per un modello linguistico ragionare sullo spazio («a nord della piazza, due caselle»).

**C. Una scala di griglie (consigliata).** È ciò che fa MarkovJunior stesso con `map` e che la sandbox già
fa: ogni scala ha la sua griglia, e la quantizzazione di una scala è la libertà di quella sotto.
1. **Regione** (l'atlante): una cella per chunk o per gruppo di chunk; biomi, strade principali, città.
2. **Piano** (il Cartografo): una cella per casella, programma MarkovJunior come oggi (zone, sentieri,
   acqua, lotti), più **ancore**: «qui una fattoria 5 × 5 con l'ingresso a sud», «qui un ponte lungo 7».
3. **Modello**: il suo programma, a 20 voxel per casella, nella scatola che il piano gli assegna. Posizione
   all'interno del lotto e rotazione libere, di un voxel in un voxel (5 cm): per l'occhio è continuo.
4. **Corpi**: posizione continua (come ora).

Nessuna scala è un vincolo per quella sotto: il Cartografo non disegna caselle di muro, chiede «una casa
qui»; il modello non conosce le caselle; chi cammina non conosce i voxel se non come pavimento e ostacolo.

## Perché la C

- **I programmi MarkovJunior non dipendono dalla misura**: la stessa fattoria gira su 100 × 100 o su
  140 × 90, lo stesso ponte su 7 o su 12 caselle. Il Cartografo può quindi commissionare «un ponte lungo
  quanto il fiume qui» e il kernel passa la scatola giusta: niente adiacenze da dichiarare, niente blocchi.
- **Le giunture le legge il kernel dal modello**, non le dichiara nessuno: la porta è dove sono le lettere
  della porta, il cancello dove è finito il sentiero. Il kernel collega i sentieri del piano a quei punti
  (`path` di MarkovJunior a scala di casella, poi a scala di voxel nell'ultima casella).
- **I modelli linguistici ragionano bene su griglie piccole e nomi** (lo vediamo con il Cartografo e con lo
  Scultore) e male su coordinate continue: il piano resta una griglia, la libertà sta sotto.
- **Le rune restano una scrittura**: una frase è una riga di simboli; serve una griglia, ma può essere la
  griglia di una superficie (il pavimento di una piazza, una lastra, la parete di una cripta) invece che
  quella del mondo. Il linguaggio non cambia; cambia dove si può scrivere.

## E i chunk?

Restano, ma come unità **tecnica** (generazione su richiesta, caricamento, salvataggio, lavoro dei worker),
non come confine visibile:
- un modello appartiene al chunk della sua ancora; le strutture grandi le prenota il piano della regione,
  che vede più chunk, prima che i chunk si generino (come già fa l'atlante per le regioni);
- non si materializzano i voxel del chunk (18 × 18 caselle a 20 voxel e alte 4 caselle sarebbero 10 milioni
  di celle): il terreno resta un campo a scala di casella (con l'altezza, in futuro), i modelli restano
  griglie a parte con le loro impronte, come nella sandbox. Il costo in memoria è quello dei modelli
  presenti, e i modelli uguali (stesso programma e seme) si condividono.

## Cosa cambierebbe nel gioco

1. `ItemDef`/manifest: l'aspetto diventa un programma MarkovJunior (con classe e scatola) invece di uno sprite.
2. Il Cartografo produce lotti e ancore oltre al terreno; il kernel posa i modelli (posizione, rotazione,
   scatola), li esegue nei worker e collega sentieri e ingressi.
3. Collisione e «sotto i piedi» dai voxel (impronte e pavimenti, già scritti in `lab/3d/mesh.ts`); il menu
   delle caselle diventa il menu di ciò che si guarda (un modello, una sua parte: la porta, il pozzo).
4. Le azioni sono regole sul modello (già nella sandbox): «Altro…» può generare nuove regole invece che
   nuovi effetti codificati.
5. Il rendering passa a 3D (three.js, come la sandbox), con la camera in 3/4 del gioco attuale.

## Rischi

- Il passaggio a 3D tocca quasi tutto il client: renderer, HUD sopra il mondo, scelta del bersaglio.
- Gli NPC devono trovare la strada fra modelli che non sono caselle: serve una navigazione (una griglia di
  navigazione a mezza casella ricavata dalle impronte basta per cominciare).
- Il costo di generazione si sposta dalle immagini al testo (vedi il report dei costi dello step 8.2B): ogni
  tipo di oggetto è un programma, riusato con semi diversi.

## Proposta di prossimo passo

Un Cartografo di prova nella sandbox: dalla descrizione di un luogo («un borgo di pescatori sul fiume»)
scrive il piano MarkovJunior a scala di casella con lotti e ancore; il kernel commissiona i modelli
mancanti allo Scultore, li posa e collega i sentieri. Misura: quante chiamate e quanto costa un luogo.
