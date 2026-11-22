# ADR-0241 — Le parti dei mestieri: la ruota, le finestre, le ante, offerte per specialità

Data: 2026-11-22 · Stato: accettato (task T471 del backlog, S5 dello studio T458, step 44) · Riferimenti: ADR-0171 (`<import>`), ADR-0176 (i tetti
del mondo), ADR-0178 (la griglia a pezzi), ADR-0182 (le parti abitabili come sottoblocchi del seme), ADR-0183 (lo Scultore delle strutture senza
scheletro), ADR-0239 (lo Scultore a specialità e le parti del mondo, punto 9), ADR-0136 (la versione del kernel), lo studio
[`docs/design/scultori-specializzati.md`](../design/scultori-specializzati.md) § 4 e § 6 (S5)

## Contesto

ADR-0239 ha dato il nome alle **parti del mondo** e le regole (punto 9): programmi `models/part-<nome>.xml` di una specialità, col contratto nel
primo commento, che i modelli della stessa specialità includono con `<import>` invece di riscriverli; prima scritte a mano nel seme, poi
estratte dallo Scultore da un suo modello buono (T472, S6). Fino a T471 le parti del seme erano cinque, tutte delle strutture che crescono a
regole (`part-stair`, `part-door`, `part-battlements`, `part-slits`, `part-cellar`), e `partResources` le elencava solo all'Architetto: i
mestieri che scolpiscono in una scatola sola (il Capomastro, il Mobiliere, il Carrozziere) scrivevano ogni volta da capo ciò che il loro
mestiere ripete (le file di finestre, le ante che si aprono, le ruote), e la sezione del Mobiliere (T470) chiede di segnare «dove vanno» le ante
aperte senza dire come.

## Decisione

1. **Tre parti dei mestieri nel seme**, scritte a mano come le cinque abitabili e dallo stesso generatore (`lab/banco/taglie/parti.mjs`), ognuna
   col contratto nel primo paragrafo del commento e la scena di prova dall'origine `S`, così il validatore la prova da sola:
   - **`part-wheel`**, la ruota: chi include segna il mozzo `H` sull'asse o appena oltre la sua fine, con aria ai due lati attraverso l'asse e
     sotto (due `H` affiancati lungo l'asse: una ruota spessa due). La ruota cresce nel piano attraverso l'asse (lungo x o lungo y), grande
     quanto il mozzo è alto su ciò che ha sotto (terra, un pavimento, un ponte), e lo tocca: cerchione e mozzo di ferro `I`, quarti e otto
     razze `J`. Un mozzo senz'aria sotto non fa ruota.
   - **`part-window`**, le finestre: chi include segna `U`, una fascia dei muri per tutto il loro spessore, col muro sopra e sotto. Su ogni tratto
     dritto di una faccia con l'aria davanti e oltre i due capi (un angolo, una porta) la parte centra una finestra (8 di larghezza su un tratto
     pari, 9 su uno dispari), poi verso fuori pilastri di 6 e finestre di 8 finché 3 di muro restano al capo; un tratto libero da un capo solo
     (l'altro sul bordo della scatola) le ha da quel capo; nessuna sulle facce di un angolo interno (le stanze, l'interno di una L). Telaio `N`
     col davanzale che sporge di uno, vetro `G`, il muro aperto dietro il vetro; il resto della fascia resta `U` e chi include lo rende al muro.
     Si include fuori da `<pieces>` (misura muri interi, come i merli) e prima di `part-slits` (le feritoie sono `U`).
   - **`part-leaf`**, le ante e i coperchi: chi include scrive l'anta chiusa `L`, uno spessore su una faccia con l'aria davanti, e il cardine
     `#80` nell'aria davanti al capo su cui gira, a ogni strato (un coperchio: sopra il suo bordo di dietro). La parte scrive `#81`, nascosta,
     dove l'anta va aperta, girata sul cardine fuori nell'aria quanto è larga (due cardini ai capi di una fila di `L` se la dividono, la
     cella di mezzo di una fila dispari a tutte e due, uguale a ogni strato); i coperchi si alzano. `open` e `close` restano azioni di chi
     include (le azioni di un file incluso non entrano, ADR-0171): `L` → `#82` nascosta e `#81` → `#83` col colore di `L`, e all'indietro.

2. **Le lettere.** I marcatori privati delle parti del seme restano `#90`-`#97`, e la scena `S`: la richiesta dice ancora «never use S nor
   #90-#97». Ciò che una parte legge e scrive sono lettere del contratto, che chi include colora e **non usa per altro** (la riga della
   richiesta lo dice); dove un'azione scambia gli stati (l'anta) sono simboli numerati, `#80`-`#83`, che un programma non usa per caso.

3. **Per specialità.** La voce di una parte in `models/index.json` dice a chi serve: `specialty`, una specialità o un elenco
   (`ModelInfo.specialty`), letto senza fidarsi da `partSpecialties` (ciò che non è una specialità si scarta, mai `actions`; senza niente,
   l'Architetto, come ogni parte di prima). `partResources(files, specialty, fortified)` elenca alla richiesta le parti del suo mestiere, al più
   `MAX_PARTS` (otto), in ordine di nome; le parti del forte solo a una fortificazione come prima. Nel seme: l'Architetto le cinque abitabili e
   `part-window`, il Capomastro `part-window` e `part-leaf`, il Mobiliere `part-leaf` e `part-wheel`, il Carrozziere `part-wheel`; il Paesaggista,
   il Sarto, il Figurinista e le azioni nessuna.

4. **La richiesta.** All'Architetto la riga di prima; agli altri mestieri `TRADE_PARTS`: si include una parte dove la cosa ne ha una, invece di
   scriverla; si costruisce ciò che legge, si segna ciò che chiede, si include, se ne colorano le lettere e non si usano per altro. Le sezioni
   dei mestieri non cambiano (le istruzioni stanno nella richiesta, che le porta solo dove servono); il prompt dell'Architetto nomina
   `part-window` per le finestre al posto della ricetta delle finestre a caso (`<one steps="14">` nella fascia): la sua misura resta sotto
   quella di prima (ADR-0210, il test della misura).

5. **Gli universi di prima.** Le voci che un universo ha restano sue (`mergeEntries` porta solo quelle nuove): le cinque parti senza
   `specialty` restano dell'Architetto, le tre nuove arrivano col seme con la loro. Il contratto non cambia: kernel **0.10.18**.

## Conseguenze

- Il Mobiliere, il Capomastro e il Carrozziere ricevono le loro parti: 416, 491 e 216 token in più a richiesta, l'Architetto 178 (219 nella
  richiesta per `part-window`, 41 in meno nel suo prompt, che nomina la parte al posto della ricetta delle finestre a caso); le righe sono
  170-215 token l'una, sopra la stima di 60-120 dello studio (un contratto più corto diceva meno di ciò che serve). Pesati sul lavoro degli universi veri, 320 token a chiamata: 0,016 $ l'ora oggi e 0,030 $ dall'1/12
  sulla via di Google, quasi tutto del Capomastro, che scolpisce su Argon (`countTokens`, `docs/design/scultori-specializzati/misure-s5.md`):
  la metà di ciò che T468 aveva tolto, per parti che lo Scultore non doveva più scrivere da capo.
- La villetta offline riscritta con `part-window` (la copia del banco, `lab/banco/parti/villetta.ts`) passa i controlli a Grande e a Enorme con
  31 finestre; ai controlli costa mezzo secondo in più. La villetta del seme e la risposta offline non cambiano.
- Ciò che i pattern non vedono resta fuori: una faccia sul bordo della scatola non ha aria davanti e non ha finestre; un tratto chiuso da un
  palo davanti alla facciata le ha solo dal capo libero; le ruote stanno su assi lungo x o lungo y.
- Non è provato che lo Scultore le usi bene coi modelli veri (la prova pagata, T473, S7). Le parti estratte dai modelli buoni, il controllo
  della stessa griglia e il viaggio delle parti con le carte sono di T472 (S6).
- Sicurezza: nessuna superficie nuova. Le parti sono file di `models/` del seme, che passano dal validatore come ogni modello; il campo nuovo
  dell'indice si legge senza fidarsi e decide solo quali righe vanno nella richiesta.

## Alternative scartate

- **Le parti nelle sezioni dei mestieri**: la sezione è nel sistema e va a ogni richiesta del mestiere, anche quando l'universo non ha la parte;
  la richiesta le porta solo dove ci sono, e una parte del mondo (S6) vi entra senza toccare il prompt.
- **Una specialità sola per parte**: la finestra serve all'Architetto e al Capomastro, l'anta al Mobiliere e al Capomastro; un elenco costa
  niente.
- **Le finestre dagli angoli, come i merli**: sui lati corti la finestra unica cadeva da una parte secondo il seme; dal mezzo la facciata è
  simmetrica.
- **La ruota al Capomastro**: gli edifici con una ruota sono rari, e la riga va a ogni sua richiesta.
- **Le lettere del giorno per gli stati dell'anta** (`l`, `u`, `U` come nell'esempio della sezione del Mobiliere): `U` è la fascia delle finestre
  e le feritoie, e un'azione che scambia una lettera la scambia in tutto il modello.
