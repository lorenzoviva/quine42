# ADR-0035 — Laboratorio voxel: l'Architetto commissiona i blocchi (pianta prima, configurazioni, vuoti di tipo diverso)

Data: 2026-10-22 · Stato: sperimentale (fuori dal gioco); modifica ADR-0033 e ADR-0034

## Contesto
Nella rocca dello step 8D l'autore nota due difetti: il pozzo ha un pezzetto di prato in un angolo, e le
torri che guardano il cortile interno hanno l'acqua ai piedi. Propone che l'Architetto commissioni le
caselle allo Scultore invece di ereditarle ciecamente.

Le cause:
- **Pozzo**: le caselle dei blocchi «nel cortile» (pozzo, alberi) non erano dipinte. Il cortile ci entrava
  allargandosi dai vicini, ma la strada non si allargava, e un angolo restava scoperto.
- **Torri**: dove due cortili quasi si toccano, le mura fanno un nodo. Il WFC ci metteva torri d'angolo con
  il lato «acqua» verso il cortile. Per le prese il cortile e la campagna erano la stessa casella vuota, e
  questa accetta «acqua» perché il fossato deve poter guardare fuori.
- Più in generale: le prese vedono solo i quattro lati. Un angolo con il fossato fuori e un nodo fra due
  cortili hanno lati uguali e diagonali diverse. Lo sa chi ha scritto la pianta, non chi ha scolpito i
  blocchi prima di vederla.

## Decisione
- **Ordine invertito** (`lab/mj3d/architect.ts`): `planStructure` → `sculptBlocks(…, ordine)` →
  `compose(…, pianta)`.
  1. L'Architetto scrive la pianta senza blocchi: zone con `describe` (a cosa servono) e vuoti di tipo
     diverso.
  2. Il kernel ricava la **commissione** (`lab/mj3d/commission.ts`). Per ogni zona elenca le
     configurazioni: cosa c'è sui quattro lati, sulle quattro diagonali, sopra e sotto, a meno di un
     quarto di giro, con quante volte compaiono e una casella d'esempio.
  3. Lo Scultore dei blocchi riceve la commissione e scrive il catalogo; ogni blocco dichiara `serves`,
     cioè le configurazioni («W3») o le zone intere («A») per cui è fatto. Il kernel rifiuta il catalogo
     se una configurazione resta scoperta. Nella fase dei programmi lo Scultore vede le configurazioni di
     ogni blocco (dove va l'acqua, dove il cortile).
  4. La composizione usa la pianta così com'è; nelle zone senza blocchi elencati ogni casella sceglie solo
     fra i blocchi della sua configurazione (o, se nessuno la serve da solo, fra quelli della zona). Se
     qualcosa non va, l'Architetto corregge la pianta vedendo i blocchi.
- **Ordini a posteriori** (`orderMissing`, `buildStructure`): se componendo restano configurazioni senza un
  blocco che ci stia (`LayoutResult.missing`: le cause trovate dalla propagazione, non le caselle rimaste vuote
  per effetto), il kernel le rimanda allo Scultore come nuovo ordine, fino a due giri, e ricompone la stessa
  pianta. Solo se resta qualcosa l'Architetto ritocca la pianta. La pianta esprime l'intenzione; un pezzo
  che manca è un buco del vocabolario, e lo colma chi fa i blocchi. Un blocco del tutto dimenticato lo
  ferma già il controllo del catalogo; l'ordine a posteriori serve quando un blocco c'è ma non ci sta.
- **Vuoti di tipo diverso** (`Layout.open`): un segno della pianta (cortile, strada interna, orto) è una
  casella vuota che accetta solo le prese elencate. Il fuori accetta le prese aperte del catalogo.
  Nel catalogo ogni tipo è una variante vuota con le sue compatibilità.
- **Terreno sotto i blocchi** (`paint.under`): il cortile si dipinge anche sotto mura, torri, pozzo e
  alberi; niente più allargamento dai vicini.
- **Diagnosi prima del collasso**: il kernel propaga i vincoli fino in fondo (arc consistency) e, se una
  casella resta senza blocchi, ne nomina la configurazione: «nessun blocco della zona W (mura) può stare
  in (13,7,0), configurazione W19: n cortile · e mura · s mura · o mura…; serve un blocco commissionato
  o una pianta che non la crei». Prima il WFC falliva più tardi, svuotando caselle innocenti lontano
  dalla causa. Lo stesso messaggio elenca, a collasso fallito, le configurazioni rimaste vuote.
- **La rocca scritta a mano** segue lo stesso principio:
  - regole di contesto separano angolo convesso (`T`), concavo (`I`), nodo fra cortili (`Q`), incrocio a T
    sul cortile (`E`), incrocio a T sul fossato (`D`) e incrocio a croce (`S`);
  - per nodi e incroci ci sono quattro blocchi nuovi «commissionati»: torre di raccordo `C` senz'acqua e
    torri d'incrocio `E`, `D`, `S`;
  - strada interna `s` e strada esterna `r` sono segni diversi (la seconda può costeggiare il fossato).
  - I modelli offline seguono il nuovo ordine: la pianta senza blocchi, i blocchi con `serves`.

## Conseguenze
- Nessun lato d'acqua verso il cortile (verificato su 8 semi della rocca 24 × 24). Il pozzo e gli alberi
  stanno sul cortile.
- Nessun errore su 30 semi della rocca 18 × 18, 30 della 24 × 24, 10 della 30 × 30 e 30 della cripta.
- Le istruzioni dell'Architetto pesano ~7.300 token con i due esempi.
- La commissione può essere lunga: la roccia di un sotterraneo ha centinaia di configurazioni. Il testo
  ne mostra le più frequenti per zona; per zone omogenee basta un blocco che serva l'intera zona.
- Configurazioni speculari sono due ordini distinti (i blocchi si girano, non si specchiano).

## Aggiornamento (stesso giorno): prove con Gemini e correzioni

Prove con `gemini-3.5-flash`, ragionamento `low`, su quattro strutture lontane dagli esempi (borgo di
pescatori, monastero, miniera, fortino). Le prime prove hanno mostrato errori di contratto più che di
generazione, e il kernel ora li toglie di mezzo:
- **Prese ricavate dalla pianta** (`socketsOf`, `Block.auto`): lo Scultore inventava etichette diverse per
  zone che si toccano, e niente combaciava. Ora un lato verso un'altra zona si chiama come l'incontro
  delle due zone («z:A|z:W»), un lato verso un vuoto come il tipo di vuoto («W~k:…»). Lo Scultore può
  omettere le prese e disegna il blocco orientato come la configurazione è scritta; l'orientamento si
  sceglie prima sui lati, poi sulle diagonali, così configurazioni con gli stessi lati condividono il
  blocco. Vale anche nelle zone che elencano blocchi senza prese.
- **Materiali scelti dall'Architetto** (`Layout.materials`): il dettaglio, scritto prima dei blocchi,
  nominava zone invece di materiali. Ora la tavolozza sta nella pianta, lo Scultore la usa (il kernel ne
  impone i colori) e il dettaglio può nominare solo materiali, segni dipinti e colori suoi.
- **Nodi che non fanno niente**: il kernel esegue la pianta con sei semi e rimanda i nodi mai applicati,
  dicendo perché («in quel momento non c'erano celle "w"», «le celle di partenza non toccavano nessuna
  cella "on"»). `optional: true` per i casi rari. Gemini spesso non riesce a correggerli: all'ultimo
  tentativo diventano una nota e la catena prosegue. Il controllo ha trovato anche un errore nella rocca
  scritta a mano (gli orti non comparivano mai: le case prendevano tutto lo spazio).
- **Pesi** (`Block.weight`): fra più blocchi della stessa configurazione la scelta era alla pari, e il
  lago si riempiva di barche.
- **Giro di miglioramento** (`improveStructure`, `--improve`): sotto 6/10 l'Architetto riscrive la pianta
  vedendo l'immagine e la critica; i blocchi restano, le configurazioni nuove si ordinano allo Scultore;
  si tiene la versione che si compone meglio.

Risultati dell'ultima tornata (voti dell'Artista, primo giro; il miglioramento non ha mai fatto meglio):
monastero 5/10 (chiostro con portico, giardino e pozzo, cinta: leggibile ma a rettangoli concentrici),
miniera 3/10 (gallerie e camere collegate, vene d'oro, scale: buona pianta, blocchi piatti), fortino 3/10
(palizzata e torri, cortile quasi vuoto), borgo 2/10 (i pontili invadono il lago). Costo dell'ultima
tornata: 71 chiamate di testo, ~655k token in input (173k dalla cache), 162k in risposta, 32k di ragionamento.

Cosa resta: lo Scultore di `gemini-3.5-flash` scrive blocchi poveri (quasi solo scatole); l'Architetto
riproduce gli schemi degli esempi (anelli concentrici) e cade spesso in crescite che riempiono una zona; il
giro di miglioramento, ripianificando, tende a rompere ciò che funzionava (configurazioni nuove senza
blocchi). Strade possibili: esempi di blocchi più ricchi e per ruolo, miglioramento che corregge la pianta
invece di riscriverla, e un modello più capace solo per lo Scultore.
