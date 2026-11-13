# Edifici che non sembrano tutti lo stesso: varianza e qualità dallo Scultore (T337)

L'autore (07/11): con l'IA vengono bene solo palazzine e villette futuristiche, il forte sembra una prigione (resta il merlo, la forma è persa),
gli edifici sembrano tutti lo stesso. Qui: perché succede, misurato; un metodo per lo Scultore, provato con lui; il ritorno in testo dopo ogni
blocco al posto del «guardare»; un giro su forte, castello, tempio, palazzina e villetta prima e dopo. La raccomandazione è in
`docs/pipeline/domande/T337.md`.

## In breve

- **Perché**: lo scheletro del prompt. Col prompt di oggi due concetti diversi distano quanto due semi dello stesso (separazione 1,11), nessuna
  esecuzione ha per vicina un seme del suo programma, e il 78-92 % di ogni programma è lo scheletro copiato: lo stesso seme dà lo stesso edificio
  al forte, al tempio e alla villetta (`misure/prima.png`). Aggiungere al prompt i nodi dell'originale non cambia niente (`nodi/`: non li usa).
- **Il metodo provato**: niente scheletro, la composizione per concetto su una griglia a 1/4 (`map`, `field`), attrezzi corti provati a mano
  (`pilota/`) e, al posto del guardare, un ritorno in testo dopo ogni blocco (`blocchi.ts`). Con lo Scultore (`zone/`): **i concetti si
  separano** (separazione 3,73, vicini 100 %, `misure/zone.png`) e la forma è quella del concetto alla prima richiesta; **le misure abitabili
  no** (stanze, porta, piani: nessuno regge a ogni seme dopo tre richieste) e **fra i semi cambia meno** (0,11 contro 0,34). Costa 2,5-4,2 $ a
  modello contro 0,2-1 $.
- **Cosa portare nel prompt**: togliere lo scheletro, comporre per concetto sulla griglia grossa, il ritorno in testo; e le parti abitabili come
  sottoblocchi provati del seme, che lo Scultore include e non riscrive (§ 5, `docs/pipeline/domande/T337.md`). Gemini non si è potuto provare.
- **Fatto dopo**: le parti come sottoblocchi del seme (T346, ADR-0182); il prompt del gioco senza scheletro, con gli attrezzi sul piano a 1/5
  (le scatole di oggi non si dividono per 4), le parti del seme nella richiesta e i due blocchi col ritorno in testo, che ora sta nel kernel
  (`src/mj/views.ts`, da `viste.ts` di qui; T354, ADR-0183); i programmi di prova scritti come lo Scultore in `lab/banco/taglie/`
  (`scultore-villetta`, `scultore-rocca`). Il giro su Gemini è T355.

## 1. Perché convergono: la misura tra concetti e tra semi

`lab/banco/concetti.ts` (lo script è `lab/scripts/banco-concetti.ts`) confronta le esecuzioni di più programmi, ognuna con 5 semi, su griglie
portate alla stessa scala (una pianta di 48 × 48, le altezze come quota della scatola), con tre distanze che non vedono i colori:

| distanza | cosa guarda |
|---|---|
| **impronta** | la pianta: 1 − IoU delle colonne occupate sopra i piedi |
| **profilo** | la sagoma: la colonna più alta lungo x (dal davanti) e lungo y (di lato) e la mappa delle altezze, come 1 − Σmin/Σmax |
| **pieni** | pieni e vuoti per altezza: in 8 fasce, i voxel pieni sulle colonne della pianta (un tempio di pietra, una casa di muri e stanze, un forte di mura e cortile danno vettori diversi) |

`distanza` è la loro media. Per un insieme di programmi: **tra semi** (mediana delle coppie di semi di un programma), **tra concetti** (mediana
delle coppie di esecuzioni di due concetti diversi), la **separazione** (il loro rapporto: vicino a 1 vuol dire che due concetti non
differiscono più di due semi dello stesso, «tutti lo stesso edificio») e i **vicini** (le esecuzioni la cui esecuzione più vicina è un altro
seme dello stesso programma). Per i programmi scritti dallo scheletro anche quanto ne copiano alla lettera (righe dei nodi, colori esclusi).

| insieme | chi l'ha scritto | tra semi | tra concetti | separazione | vicini | righe copiate dallo scheletro |
|---|---|---|---|---|---|---|
| `conferma/` (T173) | Claude, solo `<box>` | 0,00 | 0,25 | ∞ | 100 % | — |
| `procedurale/` (T182) | Claude, prompt con lo scheletro | 0,29 | 0,40 | 1,36 | 37 % | 35-68 % |
| `gemini/` (T156) | Gemini 3.8 Flash, lo stesso prompt | 0,33 | 0,37 | 1,13 | 0 % | 69-87 % |
| **`prima/`** (qui) | Claude, il prompt del gioco di oggi | 0,34 | 0,38 | **1,11** | **0 %** | **78-92 %** |
| `riferimento/` (T181) | a mano, col metodo del cantiere | 0,28 | 0,52 | 1,85 | 90 % | — |
| `handmade/` | l'autore, nell'editor (non edifici) | 0,00 di forma (le lettere sì: 0,01-0,46) | 0,65 | ∞ | 92 % | — |

Le tabelle intere e i fogli (una riga per programma, un seme per colonna) sono in `misure/`. Ciò che dicono:

1. **I programmi dello Scultore di oggi variano, ma da un concetto all'altro non cambiano.** Nel giro `prima/` (cinque concetti, il prompt del
   gioco) la rocca e la palazzina distano 0,34, quanto due semi dello stesso programma; nessuna esecuzione su 25 ha per vicina un altro seme del
   suo programma. Nel foglio `misure/prima.png` **ogni colonna è lo stesso edificio in tutte e cinque le righe**: il seme 2 dà la stessa torre
   al tempio, alla rocca, al castello, alla palazzina e alla villetta; il seme 5 lo stesso blocco a T. Cambiano colori, tetti e merli.
2. **La causa è lo scheletro.** Dal 78 al 92 % delle righe di ogni programma di `prima/` è lo scheletro del prompt alla lettera (`scheletro.xml`,
   «the starting point, not the result»), e ne resta dall'86 al 97 %. Lo scheletro decide la composizione (un reticolo di 3 × 3 campate da 30
   voxel, 5 cresciute dalla campata della porta, la scala nella campata davanti, i piani da 32): **un programma uguale fino ai colori consuma i
   numeri casuali allo stesso modo**, e lo stesso seme sceglie le stesse campate per ogni concetto. Il concetto entra solo come decorazione
   (merli, tetti a falde, colori): il forte resta la palazzina con i merli, «una prigione».
3. **Il prompt non lascia altra strada.** «No `<box>`, no coordinates»: la rappresentazione buona che il modello ha di un forte (che i
   programmi statici di `conferma/` mostrano: cortile, torri, mastio) non ha più un modo di scriversi; le misure della soglia (2 piani, stanze,
   porta, scale, salti) le risolve lo scheletro una volta per tutte, e allontanarsene costa difetti. Gemini copia di più (69-87 %) di Claude
   (35-68 % in T182).
4. **Dove sta la varianza dell'autore.** I modelli fatti a mano (`lab/mjx/models/handmade/`) non cambiano forma fra i semi (0,00, tranne
   l'albero di luce, 0,27): dove cambiano, cambiano **le lettere**, cioè i tracciati disegnati su una forma ferma (i circuiti 0,12-0,46 di voxel
   di un'altra lettera, il falò 0,24, l'albero 0,37; droni, lampione e schermi quasi niente, 0,00-0,03). Fra loro i concetti sono lontanissimi
   (0,65): ognuno ha la sua composizione, scritta a mano. I riferimenti scritti a mano col metodo del cantiere (T181) sono la cosa più vicina a
   ciò che si chiede: variano fra i semi quanto lo Scultore (0,28) e restano concetti diversi (0,52, separazione 1,85, 90 %).

Quindi il bersaglio è: **tra semi almeno 0,25** (un edificio che cambia), **tra concetti sopra 0,5 e separazione sopra 1,8** (un forte non è una
palazzina), **vicini sopra l'80 %**, e le misure della soglia rette.

## 2. Il metodo provato: comporre per concetto, su una griglia grossa

### I nodi dell'originale
Il primo da provare. Ciò che dice il motore (T333-T335) e il prompt di un solo programma:

- **`map` frazionaria sì**: `map scale="1/4 1/4 1/4"` e dentro `map scale="4 4 4"` tornano alla scatola della classe a ogni taglia (100 × 100 × 80,
  120 × 120 × 96: tutte divisibili per 4, provato nel banco); sopra la griglia grossa (25 × 25 × 20, 30 × 30 × 24) la composizione si scrive con
  numeri piccoli (un piano è 8 strati, una torre 5 × 5) e si guarda in una vista di testo di 30 caratteri. `soil` non vale con `map`: si usa
  `ground`. **Nel gioco però un programma con `map` tiene la sua scatola** (`withSize` e `shareableProgram` in `sculptor.ts`: «a program that maps
  up keeps its own size»): uno che scende e risale non è più condiviso fra le taglie. Va corretto dove si apre (T336/T338).
- **`field` sì**: mette una cosa dove è più lontana (o più vicina) da un'altra, senza coordinate: «il mastio il più lontano possibile dal
  portone» è `<one in="x" out="K" steps="1"><field for="K" from="v" on="xv"/></one>` (da `Keys`). È il sostituto delle coordinate relative che
  i programmi statici usano bene. Il validatore del gioco non lo prende finché T336 non lo apre.
- **`observe` e `search`**: per un cammino che deve arrivare; lenti sulle griglie grandi, utili solo su quella grossa.
- **`wfc` e `convchain` no, oggi**: leggono tessere e campioni da altri file di `models/` (`<wfc tileset="x">`, `sample="y"`), e lo Scultore
  scrive un XML solo; il campione a sovrapposizione e `convchain` girano solo su una griglia piana (Z = 1), mentre un edificio è 3D; `wfc` a
  tessere fa la griglia nuova (S − overlap)·M, cioè decide la scatola. Per usarli lo Scultore dovrebbe poter scrivere i file accanto al
  programma (o il motore leggere un campione scritto dentro il nodo): è una decisione di T336/T339.

### Il forte pilota (`pilota/forte.xml`)
Scritto a mano per provare gli attrezzi prima di darli allo Scultore, guardandolo **solo** con il ritorno in testo (`banco-ritorno.ts`): è stato
anche la prova che il ritorno basta a correggere, per chi sa che cosa misura la soglia. Tre livelli: **A**, sulla griglia grossa, la composizione del concetto (lotto con margine, un
cortile come unione di due rettangoli con i lati a caso, una cinta di tre celle con l'anello esterno, torri 5 × 5 sugli angoli convessi, dal
centro al davanti il portone e un androne coperto, il mastio il più lontano dal portone con `field`, porte con lo spazio libero davanti, la
scala per il cammino di ronda contro un muro, abbeveratoi da saltare); **B**, le altezze come colonne (un piano 8 strati grossi), la scala del
mastio in una striscia contro un muro con il foro nel solaio; **C**, la `map` 4 4 4, i gradini, i merli, le feritoie, la pulizia. Cosa si è
imparato, che è finito nel prompt:

- **Una lettera, un significato**: i gradini scritti con `T`, che a piena scala era la pietra delle torri, hanno preso un merlo in cima alla scala.
- **La scala**: piano di 8 strati grossi, solaio pieno sotto e vuoto sopra (B/F/F/F), partenza al secondo voxel della striscia, 17 passi: lo
  sbocco è in linea a ogni taglia, perché è contato in voxel. Una striscia nel mezzo di una stanza lascia un corridoio di 8 voxel: il corpo non
  passa; contro un muro sì.
- **La porta di un forte è l'androne**: la misura vuole un pavimento coperto grande come una stanza dietro la porta; un passaggio di 12 × 20
  voxel non lo è; nel pilota un androne di 7 × 4 celle unito al passaggio nella cinta basta in quasi tutti i semi, ma da solo no: a Enorme
  servono circa 310 posizioni del corpo coperte, cioè 8 × 9 celle (§ 4).
- **Gli ostacoli da saltare** vanno tenuti lontani dalle porte con un marcatore, o chiudono il passaggio.

**Dove è arrivato** (`pilota/misure.json`, `varianza.json`, `semi.png`, `lati.png`; nel renderer vero dell'editor
`browser/pilota-forte-editor.jpg`): la forma è quella di un forte a ogni seme e varia molto (voxel 0,72, pianta 0,60, perimetro 0,26 a
Enorme e 0,55 a Gargantuesca, interno 0,94-0,97, 5 architetture su 5; 0,4 s a esecuzione). Le misure funzionali no: il seme 1 regge tutto a
Gargantuesca e manca solo le stanze a Enorme; gli altri cadono su piani e stanze (il mastio raggiunto ma la scala o le porte nel posto
sbagliato per quel seme), il seme 2 anche sulla porta (la seconda ala del cortile sposta il cammino del portone). Ciò che resta da fare è
**funzionale, non di composizione**: è lì che servono parti già provate (§ 5).

## 3. Il ritorno dopo ogni blocco (`lab/banco/blocchi.ts`)

Dopo ogni blocco il programma scritto fin lì gira con 3 semi e torna, in testo (3-10 mila token):

- ciò che il gioco rifiuta, col motivo;
- le **viste** del primo seme (`viste.ts`): la pianta (la lettera in cima a ogni colonna), le altezze in cifre, il fronte e il lato, e le
  **sezioni** a un terzo di ogni piano, dove si vedono porte, stanze e scale; degli altri semi la pianta e le altezze affiancate, per vedere se
  la composizione varia e resta il concetto;
- le misure della forma (`concetti.ts`: copertura, cortili, picchi, altezze, quanto differiscono i semi);
- la traccia del primo seme nodo per nodo (`src/mj/trace.ts`, entro 2 500 token);
- all'ultimo blocco le misure del banco a 5 semi e alle due taglie, come le dà la seconda richiesta di T173.

Il giro a blocchi (`lab/scripts/banco-blocchi.ts`) fa tre richieste: **1** la composizione sulla griglia grossa; **2** corregge la composizione e
aggiunge altezze e piena scala; **3** corregge ciò che le misure dicono. Si ferma alla seconda se tutto regge e varia.

## 4. I giri: prima, nodi, zone

Stessi cinque bersagli (`bersagli.ts`: `rocca` è il forte, Enorme; `castello` Enorme; `tempio`, `palazzina`, `villetta` Grandi), stesso modello
(Claude Opus 5.5 in abbonamento, `claude -p` isolato come nel banco), varianza a 5 semi e alla taglia successiva. **Gemini non si è potuto
provare**: il suo abbonamento era al 100 % fino al 15/11.

| giro | prompt | richieste | passano misure e varianza | tra semi | tra concetti | separazione | vicini | dallo scheletro |
|---|---|---|---|---|---|---|---|---|
| `prima/` | il prompt delle strutture del gioco di oggi (`prompt-prima.md`) | 1 | 4 su 5 (il castello cade sul perimetro, 0,09) | 0,34 | 0,38 | 1,11 | 0 % | 78-92 % |
| `nodi/` | lo stesso, più i nodi dell'originale (`prompt-nodi.md`) | 1 | 1 su 3 (la rocca rifiutata: un `#4` senza colore) | 0,34 | 0,34 | 1,00 | 0 % | 85-92 % |

**I nodi dell'originale, da soli, non cambiano niente**: nessuno dei tre programmi di `nodi/` usa `map`, `field` od `observe`; restano lo
scheletro ridipinto. Con lo scheletro nel prompt il modello non ha motivo di uscirne.

### Il giro a zone (`zone/`, `prompt-zone.md`, tre richieste con il ritorno)

| bersaglio | richieste | regge a ogni seme | cosa cade ancora | input | output | $ a listino | tempo |
|---|---|---|---|---|---|---|---|
| rocca (forte) | 3 | no | piani, stanze, porta; il perimetro a Enorme | 47 746 | 109 112 | 2,49 | 19 min |
| castello | 3 | 1 seme su 5 a Gargantuesca | stanze, finestre su un lato solo; il perimetro a Enorme | 48 034 | 142 986 | 3,17 | 25 min |
| tempio | 3 | no | piani a Grande, stanze, finestre, salti; pianta e perimetro | 54 761 | 191 208 | 4,15 | 34 min |
| palazzina | 3 | 1 seme su 5 a Enorme | stanze, salti, rilievo; pianta e perimetro | 55 193 | 123 841 | 2,80 | 22 min |
| villetta | 3 | no | piani, stanze, porta, testa; il perimetro a Grande (0,09) | 49 640 | 174 721 | 3,78 | 31 min |
| **totale** | 15 | nessuno a ogni seme e taglia | | 255 374 | 741 868 | **16,39** | 2 h 11 min in somma (2 alla volta: 1 h 20) |

Per confronto: il giro `prima/` 5 richieste, 46 421 di input, 103 625 di output, **2,32 $** in tutto, e 4 su 5 reggono; `nodi/` 3 richieste,
1,50 $.

Cosa si vede (fogli `zone/<bersaglio>/1/semi.png`, quattro lati in `lati.png`, nel renderer vero `browser/zone-rocca-blocco2-editor.jpg`):

1. **La composizione è del concetto, alla prima richiesta.** Il forte: cinta merlata, quattro torri d'angolo, androne con i corpi di guardia,
   mastio e armeria nei due angoli di fondo scelti con `field`, la scala delle mura, pozzo e abbeveratoi. Il castello: torri alte coi tetti a cono
   d'ardesia e gli stendardi, torri a metà dei lati, il mastio grande, la cappella addossata alla cinta. Il tempio: gradoni concentrici (il
   secondo ristretto di tre celle), la scalinata sull'asse, il vestibolo, le celle laterali, la cella alta col tetto d'oro. La palazzina: un
   blocco a più piani col tetto piano, balconi, finestre in fila e il portone con la pensilina. La villetta: un corpo a due piani e un'ala bassa coi tetti di coppi, il portico, il giardino con
   la siepe e il vialetto. Dello scheletro restano solo righe comuni come la pulizia (1-2 %).
2. **Il ritorno basta per la forma, non per le misure abitabili.** Fra il blocco 1 e il 2 lo Scultore ha corretto la composizione da ciò che
   vedeva (pianta e altezze di tre semi); fra il 2 e il 3 le misure: il castello ha sistemato la porta (da nessun seme a tutti) e i due piani (da nessun seme a 4 su 5), il forte no,
   e le **stanze** cadono per tutti. Il ritorno dice che cosa cade, non perché («porta: nessuna» quando l'androne ha 160 posizioni coperte delle
   310 che servono), e **due misure il mio prompt le dava sbagliate**: l'androne di 7 × 4 celle non basta a Enorme, e la misura minima di una
   stanza (8 × 8 celle sgombre) non c'era. Corretti nel file dopo il giro; il ritorno ora porta anche il significato di ogni difetto, come la
   seconda richiesta di T173.
3. **Fra i semi cambia meno.** Forte e castello variano (voxel 0,54-0,56, pianta 0,34-0,47, 5 architetture su 5), ma il contorno esterno
   poco (perimetro 0-0,04 a Enorme): il rettangolo del cortile tocca il margine del lotto. Tempio e palazzina quasi non variano nella pianta
   (0,05-0,20) e mai nel perimetro: lo Scultore ha fatto un rettangolo e ha lasciato ai semi solo le posizioni di scale e porte. Il prompt
   dice «i semi deformano la composizione», ma non lo misura nel ritorno del primo blocco; il banco lo dice solo alla fine.
4. **Costa tre volte di più e gira dieci volte più in fretta.** Tre richieste, 2,5-4,2 $ a listino a modello contro 0,2-1 $ dello scheletro
   (una richiesta), 20-35 minuti; i programmi però girano in 0,2-1 s a esecuzione contro 2-7 s dello scheletro (la composizione su 25 × 25
   costa poco, e la piena scala sono `map` e regole locali).

### Prima e dopo, con la misura tra concetti (`misure/prima.md`, `misure/zone.md`)

| giro | tra semi | tra concetti | separazione | vicini | dallo scheletro | impronta (semi / concetti) | pieni (semi / concetti) |
|---|---|---|---|---|---|---|---|
| `prima/`, tutti a Grande | 0,34 | 0,38 | 1,11 | 0 % | 78-92 % | 0,55 / 0,54 | 0,18 / 0,30 |
| **`zone/`, tutti a Grande** | **0,11** | **0,43** | **3,73** | **100 %** | **1-2 %** | 0,20 / 0,55 | 0,03 / 0,43 |
| `prima/`, ognuno alla sua taglia | 0,34 | 0,50 | 1,46 | 24 % | | 0,55 / 0,55 | 0,13 / 0,53 |
| `zone/`, ognuno alla sua taglia | 0,16 | 0,46 | 2,84 | 100 % | | 0,27 / 0,57 | 0,04 / 0,42 |
| il forte pilota (a mano) | 0,40 (3 semi, a Enorme) | | | | | | |

«Tutti a Grande» toglie l'effetto della scatola (una rocca Enorme e una palazzina Grande differiscono già per la proporzione della scatola);
«alla sua taglia» è come il gioco li userebbe. I fogli `misure/prima.png` e `misure/zone.png` (una riga per concetto, un seme per colonna)
dicono la stessa cosa a occhio: **prima ogni colonna era lo stesso edificio in cinque righe; dopo ogni riga è un altro edificio**, e dentro una
riga i semi si somigliano. Il tempio è quasi fermo (0,02), il forte 0,11, la palazzina 0,12, il castello 0,18, la villetta 0,23 (perimetro 0,09-0,15,
5 architetture su 5). I pieni ora dicono il concetto: un forte di mura spesse (0,79 della sua sagoma piena), un castello 0,63, un tempio e una villetta
0,48, una palazzina di stanze 0,38; prima stavano tutti fra 0,17 e 0,29.

**Il guadagno è la composizione, la perdita è la varianza tra semi**, e nessuno dei due viene dal motore: il pilota, scritto con gli stessi
attrezzi, varia fra i semi come lo scheletro (0,40) restando un forte. Lo Scultore, lasciato libero, fa un rettangolo e un'ala sola; con lo
scheletro i semi cambiavano le campate, ma per tutti i concetti allo stesso modo.

## 5. Che cosa portare nel prompt dello Scultore

La domanda all'autore, con le opzioni, è `docs/pipeline/domande/T337.md`. In breve, ciò che le misure premiano:

1. **Togliere lo scheletro unico.** È la causa misurata dello «stesso edificio»: finché c'è, il modello lo ricopia (78-92 %) e non usa nemmeno
   i nodi nuovi.
2. **Comporre per concetto su una griglia grossa**, con gli attrezzi corti di `prompt-zone.md` (rettangoli e ali con i lati a caso, cinte, torri
   sugli angoli, l'asse della porta, «il più lontano da» con `field`, terrazze per erosione, colonne di 8 strati) e la richiesta esplicita che i
   semi cambino le masse (ali, rientranze, altezze), da misurare già nel ritorno del primo blocco.
3. **Il ritorno in testo dopo ogni blocco**: pianta, altezze, fronte, lato e sezioni di tre semi, le misure col loro significato, la traccia
   (`blocchi.ts`, 3-10 mila token). Nel gioco la richiesta di revisione porta già la traccia e la foto dell'Artista (Gemini vede le immagini): le
   viste in testo le si aggiungono a poco prezzo.
4. **Le parti abitabili già fatte, non riscritte.** La forma la sa fare; le stanze, l'androne, la scala con il foro e lo sbocco, i piani sono
   ciò che sbaglia ed è ciò che il ritorno non riesce a far correggere in tre richieste. Vanno date come sottoblocchi provati del seme
   (`<import>` di T333, nei `models/` dell'universo, con le misure minime di T338): lo Scultore mette un marcatore e una lettera dove vuole la
   scala o la stanza, il sottoblocco la costruisce a ogni taglia.
5. **Prima, nel kernel**: un programma che scende a 1/4 e risale deve essere condiviso fra le taglie (`withSize`, `shareableProgram`); `field` aperto
   nel validatore (T336); la porta `open` in `reachableStoreys`. Poi un giro su Gemini, che qui non si è potuto fare (non prima del 15/11).

## Gli strumenti

```bash
npx vite-node lab/scripts/banco-concetti.ts -- --radici lab/banco/metodo/prima --nome prima --taglia large --scheletro lab/banco/metodo/scheletro.xml --out lab/banco/metodo/misure
npx vite-node lab/scripts/banco-concetti.ts -- --handmade lab/mjx/models/handmade --nome handmade
npx vite-node lab/scripts/banco-ritorno.ts -- --xml lab/banco/metodo/pilota/forte.xml --bersaglio rocca --semi 1,2,3 [--finale]   # ciò che lo Scultore riceverebbe
npx vite-node lab/scripts/banco-blocchi.ts -- --bersagli rocca,castello,tempio,palazzina,villetta --giro zone --dir lab/banco/metodo --prompt lab/banco/metodo/prompt-zone.md --insieme 2
npx vite-node lab/scripts/banco-rimisura.ts -- --dir lab/banco/metodo/prima    # rimisura un giro già chiesto, senza chiamate
```

**Un difetto del banco, corretto qui**: dal contratto 0.5 (T308b) l'azione della porta si chiama `open`, ma `esegui` la apriva solo se il
nome cominciava con `apr…`; col prompt di oggi ogni porta restava chiusa e ogni edificio risultava «0 piani, nessuna porta» (il primo
riepilogo di `prima/` lo mostra, il secondo è rimisurato). La stessa riga è in `reachableStoreys` di `src/kernel/forms.ts`, il controllo dei
piani dello Scultore nel gioco: lì sullo scheletro passa comunque, ma va corretta (la proposta è nella domanda).
