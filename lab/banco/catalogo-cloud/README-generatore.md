# Catalogo cloud: 24 strutture procedurali (cantiere 1)

> **Il catalogo gemello** (T273). Questo è il cantiere parallelo, nato su un altro ramo (`claude/quine42-3d-structures-catalog-3l6ejl`) e unito qui
> accanto al primo ([`README.md`](README.md)): i suoi strumenti hanno il suffisso `-generatore` dove il nome si scontrava (`catalogo-generatore.ts`,
> `valida-generatore.ts`, questo file); `struttura.ts`, `genera.ts`, `scrivi.ts`, `indice.ts` e `risultati.json` sono suoi. Tre strutture avevano
> il nome di una del primo catalogo e qui ne hanno un altro: `casa-del-borgomastro` → `fantasy/residenza-del-borgomastro`, `mercato-coperto` →
> `moderno/mercato-a-padiglione`, `laboratorio-di-fusione` → `futuristico/laboratorio-del-plasma` (programmi identici, solo il nome).

24 programmi MarkovJunior di strutture (`classe` grande, bersaglio `struttura`), 6 per ciascuna delle 4 ambientazioni, **12 con la cantina** (`suolo="E"`, `ground="Z"`, `sotto: 1`, ADR-0135). Ognuno è stato misurato con le funzioni del banco (`../misure.ts`, `../varianza.ts`) su **5 semi (1-5) e 2 taglie (Grande ed Enorme)** e passa tutto:

- tutte le misure di `giudica` a ogni seme e taglia (piani, testa, stanze, cantina, murato, porta, salti, materiali, dominante, finestre, dettagli, rumore, sagoma, rilievo, ingombro);
- in più, per il catalogo: **0 voxel staccati** dal corpo principale, **nessun piano coperto non raggiunto** (`persi` vuoto, `murato` 0), cantina raggiunta ≥ 1,2 caselle²;
- varianza sopra le soglie di `varianza.ts` alle due taglie, **perimetro compreso**;
- **meno di 4500 ms a ogni seme**, anche a Enorme con la cantina (120×120×112): il più lento è 2,9 s.

Ogni struttura ha il suo `<ambientazione>/<nome>.xml` e il rapporto `<nome>.md` (tabella delle misure alle due taglie, varianza, piani del seme 1, traccia del seme 1 con `src/mj/trace.ts`). I numeri di tutte sono in `risultati.json`.

```bash
npx vite-node lab/banco/catalogo-cloud/scrivi.ts                       # riscrive i 24 XML da catalogo-generatore.ts
npx vite-node lab/banco/catalogo-cloud/valida-generatore.ts -- lab/banco/catalogo-cloud/fantasy/*.xml --rapporto   # misura e scrive i .md (uno alla volta: i tempi contano)
npx vite-node lab/banco/catalogo-cloud/indice.ts                       # la tabella qui sotto da risultati.json
```

## Tabella comparativa

Semi che passano tutto (su 5) e tempo massimo in ms per taglia; varianza come mediana delle coppie di semi (soglie: perimetro e pianta ≥ 0,15, interno ≥ 0,35, architetture ≥ 3).

<!-- tabella -->
| ambientazione | struttura | cosa è | cantina | Grande: semi, ms max | Enorme: semi, ms max | perimetro G / E | pianta G / E | interno G / E | architetture G / E | esito |
|---|---|---|---|---|---|---|---|---|---|---|
| fantasy | [locanda-del-cinghiale](fantasy/locanda-del-cinghiale.md) | Locanda con la cantina | sì | 5/5, 1804 | 5/5, 2635 | 0,20 / 0,31 | 0,33 / 0,34 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| fantasy | [tempio-della-luna](fantasy/tempio-della-luna.md) | Tempio a gradoni | — | 5/5, 837 | 5/5, 1553 | 0,35 / 0,23 | 0,56 / 0,35 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| fantasy | [torre-del-mago](fantasy/torre-del-mago.md) | Torre con il sotterraneo | sì | 5/5, 1677 | 5/5, 2673 | 0,15 / 0,28 | 0,34 / 0,37 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| fantasy | [fucina-nanica](fantasy/fucina-nanica.md) | Fucina con la cantina | sì | 5/5, 2213 | 5/5, 2492 | 0,19 / 0,30 | 0,33 / 0,34 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| fantasy | [residenza-del-borgomastro](fantasy/residenza-del-borgomastro.md) | Residenza a due piani | — | 5/5, 957 | 5/5, 1878 | 0,37 / 0,23 | 0,55 / 0,33 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| fantasy | [forte-di-frontiera](fantasy/forte-di-frontiera.md) | Forte con le torri | — | 5/5, 822 | 5/5, 1746 | 0,35 / 0,20 | 0,56 / 0,38 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| steampunk | [taverna-delle-caldaie](steampunk/taverna-delle-caldaie.md) | Taverna con la cantina | sì | 5/5, 1374 | 5/5, 2440 | 0,19 / 0,30 | 0,33 / 0,34 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| steampunk | [cattedrale-degli-ingranaggi](steampunk/cattedrale-degli-ingranaggi.md) | Cattedrale a gradoni | — | 5/5, 814 | 5/5, 1911 | 0,35 / 0,19 | 0,56 / 0,35 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| steampunk | [faro-a-vapore](steampunk/faro-a-vapore.md) | Faro con il sotterraneo | sì | 5/5, 1450 | 5/5, 2766 | 0,15 / 0,28 | 0,34 / 0,37 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| steampunk | [officina-meccanica](steampunk/officina-meccanica.md) | Officina con la cantina | sì | 5/5, 1582 | 5/5, 2811 | 0,19 / 0,30 | 0,33 / 0,34 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| steampunk | [palazzina-degli-inventori](steampunk/palazzina-degli-inventori.md) | Palazzina a due piani | — | 5/5, 826 | 5/5, 1718 | 0,37 / 0,23 | 0,56 / 0,33 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| steampunk | [stazione-ferroviaria](steampunk/stazione-ferroviaria.md) | Stazione coperta | — | 5/5, 783 | 5/5, 1341 | 0,35 / 0,20 | 0,56 / 0,34 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| moderno | [trattoria-con-cantina](moderno/trattoria-con-cantina.md) | Trattoria con la cantina dei vini | sì | 5/5, 1599 | 5/5, 2556 | 0,19 / 0,30 | 0,33 / 0,34 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| moderno | [chiesa-moderna](moderno/chiesa-moderna.md) | Chiesa a gradoni | — | 5/5, 911 | 5/5, 1885 | 0,35 / 0,19 | 0,56 / 0,35 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| moderno | [osservatorio-civico](moderno/osservatorio-civico.md) | Osservatorio con il sotterraneo | sì | 5/5, 1392 | 5/5, 2808 | 0,15 / 0,28 | 0,34 / 0,37 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| moderno | [laboratorio-artigiano](moderno/laboratorio-artigiano.md) | Laboratorio con la cantina | sì | 5/5, 1493 | 5/5, 2913 | 0,19 / 0,30 | 0,33 / 0,34 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| moderno | [condominio](moderno/condominio.md) | Condominio a due piani | — | 5/5, 729 | 5/5, 1744 | 0,36 / 0,23 | 0,55 / 0,33 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| moderno | [mercato-a-padiglione](moderno/mercato-a-padiglione.md) | Mercato coperto | — | 5/5, 803 | 5/5, 1588 | 0,35 / 0,18 | 0,56 / 0,35 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| futuristico | [bar-orbitale](futuristico/bar-orbitale.md) | Bar con la cantina | sì | 5/5, 1516 | 5/5, 2519 | 0,19 / 0,30 | 0,33 / 0,34 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| futuristico | [santuario-quantico](futuristico/santuario-quantico.md) | Santuario a gradoni | — | 5/5, 757 | 5/5, 1510 | 0,35 / 0,19 | 0,56 / 0,35 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| futuristico | [faro-al-plasma](futuristico/faro-al-plasma.md) | Faro con il sotterraneo | sì | 5/5, 1468 | 5/5, 2831 | 0,15 / 0,28 | 0,34 / 0,37 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| futuristico | [laboratorio-del-plasma](futuristico/laboratorio-del-plasma.md) | Laboratorio con la cantina | sì | 5/5, 1437 | 5/5, 2450 | 0,19 / 0,30 | 0,33 / 0,34 | 0,73 / 0,81 | 5/5 / 5/5 | passa |
| futuristico | [residenza-modulare](futuristico/residenza-modulare.md) | Residenza a due piani | — | 5/5, 682 | 5/5, 1547 | 0,36 / 0,23 | 0,55 / 0,33 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
| futuristico | [stazione-di-transito](futuristico/stazione-di-transito.md) | Stazione coperta | — | 5/5, 744 | 5/5, 1505 | 0,35 / 0,20 | 0,56 / 0,37 | 0,68 / 0,62 | 5/5 / 4/5 | passa |
<!-- /tabella -->

## Le tipologie

| tipologia | cantina | cosa la distingue (`catalogo-generatore.ts`) |
|---|---|---|
| locanda / taverna / trattoria / bar | sì | insegna sopra la porta, comignolo, tetto a padiglione (fantasy, moderno), tubi (steampunk), neon (futuristico); botti o serbatoi in cantina |
| tempio / cattedrale / chiesa / santuario | no | tetto a gradoni, lesene fitte, un campanile o una guglia a punta su un angolo |
| torre / faro / osservatorio | sì | due torri 9×9 agli angoli, alte fino a 72 strati, con la lanterna accesa in cima; merli (fantasy) |
| fucina / officina / laboratorio | sì | due o tre camini alti fino a 15 strati sopra il tetto, tubi e condotti sulle facciate |
| residenza / palazzina / condominio | no | più campate alte (`alte` 0,4-0,5), balconi con ringhiera sul piano di sopra, tetto basso a gradoni |
| forte / stazione / mercato coperto | no | forte: mura merlate e quattro torri; stazione: grande tetto a padiglione, torre dell'orologio, piloni con i fari; mercato: campate basse sotto un tetto a padiglione |

I materiali cambiano per ambientazione: pietra, coppi e quercia (fantasy); mattoni, rame, ottone e ghisa (steampunk); cemento, vetro e acciaio (moderno); metallo bianco, vetro scuro e neon (futuristico).

## Come è fatto: un generatore, non 24 file a mano

I programmi li scrive `scrivi.ts` da `catalogo-generatore.ts` (24 schede), con `struttura.ts` (lo scheletro) e `genera.ts` (le regole in XML). L'XML che ne esce è un programma qualunque, che gira da solo. Lo scheletro è quello di `../riferimento/cantiere.xml` (`../pattern.md`, pattern 13) con la cantina di `../riferimento/cantina.xml`, nodo per nodo; le schede aggiungono tetti, torri, merli, camini, tubi, balconi, insegne, neon, lesene e i colori.

## Perché è veloce

Misurato con un profilatore per nodo (una copia strumentata del motore, fuori dal repository): il motore, quando un nodo parte, **scandisce tutta la griglia una volta per ogni variante di simmetria di ogni regola** (1,6 milioni di posizioni a Enorme con la cantina, ~11-16 ms l'una), poi aggiorna solo le celle cambiate. `cantina.xml` faceva 389 di queste scansioni: 5,8 s dei suoi 6,9. Quattro cambi, ciascuno misurato:

1. **Le colonne in un colpo** (pattern 5 di `pattern.md`): ogni lettera della pianta scrive tutta la sua colonna con una regola sola, un passo, invece di una testa che sale di uno strato per passo sotto una ventina di nodi da 12-20 regole. Da ~2,3 s a 0,15 s. La colonna sta in una stringa: `t: 'S F .30 S F .30 S R'` in `struttura.ts`.
2. **Pattern alti sulla pianta**: una regola della pianta (uno strato sul suolo) riceve sopra di sé strati di `*` fino a 80 (o quanto permettono le 1728 celle). Un pattern alto D si prova solo a Z − D + 1 altezze: a Enorme con la cantina 33 invece di 112. Non vale per i nodi con migliaia di corrispondenze: ognuna costa D × area celle (il bordo del lotto resta corto).
3. **La prima cella rara**: il motore legge per prima la cella in basso, dietro, a sinistra, e si ferma alla prima che non corrisponde. Nei pattern della pianta `*` diventa `0`, l'unione delle lettere della pianta (mai l'aria): fuori dal suolo si ferma subito. La scala della cantina cerca il pozzo (`l`) invece dell'aria: da 0,9 s a 0,06 s.
4. **`prl` invece di `all`** per ciò che si scrive in un passo (i muri, la pulizia), e meno marcatori da pulire: le lettere che restano (fasce, teste della scala, basi delle panche) hanno il colore di ciò che rappresentano.

Risultato: lo scheletro con la cantina da 6,9 s a ~2,4 s a Enorme; con tutto ciò che le schede aggiungono, al più 2,9 s.

## Cosa è cambiato nella ricetta della cantina

- **Il pozzo è profondo 12 strati a ogni taglia**, non fino al fondo: 4 gradini da 3 con pedata 6 (sopra il pozzo ogni colonna sotto il corpo deve stare entro un gradino dai piedi, `rampBlocks`) stanno in una campata. La cantina resta sotto il suolo (pavimento a 10 strati sotto, 0,5-0,6 caselle), le fondazioni scendono fino in fondo senza `steps`.
- **Due campate di pozzo, la seconda da qualunque lato della prima** invece che in linea: in linea il pozzo stava solo lungo un bordo e a Grande la pianta non variava (perimetro 0,00-0,10); così 0,15-0,20 a Grande e 0,28-0,31 a Enorme.
- **Le porte fra campate alte accettano la zona di rispetto** (`[tv]`): con la porta della cantina in un angolo della campata davanti, la porta fra la campata della scala e quella d'arrivo non trovava posto e il piano terra restava murato.
- **Le staccionate da saltare stanno a metà di un muro esterno**, al più una per muro: sul suolo della cantina le panche nel lotto galleggiavano (9 pezzi staccati), e due staccionate vicine chiudevano un recinto senza salti.

## Limiti

- Il perimetro a Grande delle strutture con la cantina e le torri è sopra la soglia di poco (0,15-0,16): a Grande la scatola di 3×3 campate lascia poco spazio a un contorno diverso.
- Le torri e le balconate si mettono solo dove c'è spazio libero: a Grande il margine fuori dal reticolo è di 4 voxel, quindi una torre nasce solo verso una campata non costruita, e in qualche seme manca.
- Le misure sono quelle del banco; le foto dei semi (`npx vite-node lab/scripts/banco-varianza.ts -- --xml <file> --bersagli locanda`) non sono nel repository e nessuno le ha giudicate con i criteri di `../README.md`.
- Non provato nel gioco: come per `../riferimento/`, un programma con `suolo` e `sotto` si scolpisce nel gioco solo con T156 (ADR-0135).
