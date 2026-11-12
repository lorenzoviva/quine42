# ADR-0180 — Ciò che si indossa si vede sul corpo: i colori del kernel per tutto, la sezione `<worn>` dove lo Scultore la scrive

Data: 2026-11-12 · Stato: accettato (task T290 del backlog) · Riferimenti: decisione dell'autore su D47 (10/11, epoca 347; banco di T289
in `lab/banco/indossati.md`, domanda in `docs/pipeline/domande/T289.md`), ADR-0167 (ciò che si impugna), ADR-0041 (ogni aspetto è un
programma), ADR-0108 (la cache delle forme), ADR-0109 (ciò che esce, a elenco), ADR-0136 (la versione del kernel), ADR-0165 (i prompt in
inglese), regola 11, `docs/pipeline/domande/T232.md` (non rigenerare i modelli)

## Contesto

T288 mostra in mano ciò che si impugna, con la mesh di terra. Per vestiti e armature l'autore ha voluto prima un banco (T289): tre vie
sugli stessi tre oggetti (un elmo, una corazza, un mantello) e su 27 corpi del seme e generati. Ha scelto la via **C + B** (D47, 10/11):
**C** subito per tutto ciò che esiste (i colori dell'oggetto sulle zone del corpo, senza rigenerare i modelli, la regola di T232), **B**
(una sezione `<worn>` nel programma dell'oggetto: regole che riscrivono il corpo di chi lo indossa) per ciò che lo Scultore scolpisce da
ora in poi, **C come ripiego garantito** quando B manca o fallisce; e sì alle quattro sotto-domande: indossare rifà la mesh del corpo nel
worker a ogni cambio; gli oggetti di oggi con C; in T290 testa, busto e schiena, gambe, piedi e mani dopo; gli individui dopo, da una
fonte loro (la scheda del Narratore, il mestiere).

Prima di T290 indossare non esisteva: «Usa» su un capo diceva «Indossi…» e niente cambiava; i pannelli delle meccaniche (ADR-0028)
tengono capi nei loro slot, senza aspetto.

## Decisione

1. **Indossare è un segno nell'inventario**, come impugnare (`Inventory.worn`: zona → tasca, `src/kernel/inventory.ts`). Il capo resta
   nell'inventario: il suo peso conta; spostato, il segno lo segue (`moveSlot`); gettato, dato o messo in una borsa non è più indossato
   (`emptied`); `removeItem` lo toglie per ultimo. Tre zone: `head`, `torso`, `back`. `Kernel.wearSlot(i)` mette il capo della tasca
   nella sua zona, al posto di ciò che c'era (che resta nell'inventario), o lo toglie se c'è già; un capo indossato si lascia dalla mano,
   impugnare un capo indossato lo toglie. «Usa», il doppio clic e i tasti 1–6 su un capo lo mettono o lo tolgono, salvo un `on_use` del
   suo modulo. Nell'inventario: «Indossa» / «Togli», un segno ◆ verde sulla tasca (e nella barra rapida), «si indossa sulla testa». Si
   salva con l'inventario (`world/players/<id>.json`); al caricamento i segni che non reggono più si lasciano (`keepWornMarks`).
2. **La zona viene dal posto dell'oggetto** (`ItemDef.slot`, il `posto` dei pacchetti del Narratore; `SLOT_ZONES` in
   `src/kernel/wearing.ts`): `testa`, `capo`, `head` → testa; `corpo`, `busto`, `petto`, `torso`, `body`, `chest` → busto; `schiena`,
   `spalle`, `back`, `shoulders` → schiena. Un capo (`clothing`) senza posto dalle parole del nome, in italiano e in inglese come legge la
   quarta parete (ADR-0165), la prima detta (`GARMENT_WORDS`): il mantello del seme va sulla schiena, gli stivali no. Un posto di un'altra
   zona (piedi, mani, gambe, collo, anello) non si indossa ancora.
3. **Le zone del corpo** (`bodyOf`, `src/mj/worn.ts`), dal banco: dai voxel e dal rig, senza una tabella per corpo; tre zampe o più a
   quattro zampe, il collo dove il nucleo si stringe (o la parte `head` della tavolozza), il busto dai fianchi al collo, la schiena la
   sua metà dietro (sopra, a quattro zampe). Il sistema della zona: un busto a quattro zampe si gira di un quarto attorno a x (`turnUp`),
   così si scrive una volta per ogni corpo.
4. **La via C**, il pavimento: i voxel esterni della zona nei due colori principali dell'oggetto (`mainColors`: la lettera più usata e
   la più usata che non ne è una sfumatura; senza modello il generico tinto col colore del pacchetto) e, per chi sta in piedi, la caduta
   del mantello fino a terra (le sole celle aggiunte). **La via B**: la sezione `<worn zone="…">` del programma, accanto alla radice (o
   dentro, come un'azione), fatta programma a sé con le lettere e i colori della forma dell'oggetto, tinta compresa (`wornProgram`), e
   le quattro lettere del kernel nascoste: `z` la zona, `o` il resto del corpo, `r` l'aria dove l'oggetto può stare, `m` quell'aria sulla
   linea di mezzo. Le lettere del corpo le regole non le vedono (caratteri che nessun programma scrive); ciò che scrivono su `o` non
   resta; un voxel del corpo non si toglie mai. Solo `one all prl sequence markov convolution` e le loro regole (`WORN_NODES`: niente
   forme né coordinate, il corpo non si conosce; niente file, `map`, `path`, inferenza), 20 000 passi e 1 s (`WORN_STEPS`,
   `WORN_TIME_MS`). Se la sezione per quella zona manca, non compila, non finisce o non scrive niente su quel corpo, C (`dressBody`;
   `Change.fault` dice perché). Più capi dal più esterno: schiena, busto, testa; uno dopo non scrive su uno prima.
5. **Il corpo vestito si fa nel worker** (`dressMeshes`, `src/render/formmeshes.ts`; il messaggio `dress` di `src/render/worker.ts`;
   `WorkerRunner.dress`, dopo le letture e prima dei programmi): la griglia del corpo dell'istanza, con le azioni fatte, in una scatola
   di `PAD` (4) voxel più grande attorno e sopra, con lo stesso centro e lo stesso suolo; le mesh con il **rig del corpo nudo** spostato
   lì: gli stessi arti attorno agli stessi giunti, quindi ciò che si impugna resta in mano (ADR-0167) e ciò che è ricolorato su un arto
   si muove con lui, ciò che è aggiunto resta col corpo. Nessun programma rigira; niente animazione finché la figura indossa qualcosa.
   `dressedFor` (`src/render/dressed.ts`) lo chiede quando cambia ciò che una figura indossa, o la sua forma, o la forma di un capo;
   finché non arriva la figura resta com'era (nessun sostituto a ogni cambio), poi `Entities` e `Wanderer` la rifanno (`modelObject` con
   `dressed`). La chiave è la forma del corpo, le sue azioni e le forme dei capi: **gli stessi capi sulla stessa forma sono un corpo
   solo**, condiviso da chi li indossa. Il worker tiene i corpi vestiti fino a 32 MB (`DRESSED_MEMORY_BYTES`), mai su disco; le
   geometrie stanno con quelle delle forme (`keepGeometry`) e vanno come loro quando nulla le disegna (`trimGeometries`).
6. **Il filo** (regola 8f): il messaggio `item` ha l'operazione `wear` (`Kernel.wearSlot` sul server), che il client sottile fa anche
   da sé subito, come `wield` (anche «Usa» su un capo, che va come `wear`); il proprio inventario arriva intero in `MyState`, segni
   compresi. Agli altri `OtherView.worn` porta zona → id dei capi indossati, letti come li legge il kernel (`wornItems`): dell'inventario
   nient'altro. Il client sottile li mette in `remote.worn` (`readWorn`: solo le tre zone, testi tagliati a 120 caratteri) e ne fa il
   corpo con i suoi file; un capo che il client non conosce non si vede (come in mano).
7. **Lo Scultore** scrive la sezione: il suo prompt ha «Worn things» (in inglese, nella parte comune, non in quella delle strutture);
   la richiesta di un oggetto indossato dice la zona (`SculptRequest.worn`: il `ModelDirector` la mette per i modelli propri dei capi e
   per la forma comune dei cappelli, `shape-hat`; riscolpire un capo, o un programma che ha la sezione, la tiene). I suoi controlli
   (`checkProgram`) e il validatore (`modelErrors`) provano ogni sezione su due corpi fatti dal kernel, uno in piedi e uno a quattro
   zampe (`trialBodies`, `wornErrors`): una zona per sezione e una delle tre, dopo la radice (il kernel scrive la scatola sul primo
   elemento), nessuna delle lettere `z o r m` fra quelle della cosa, compila con i nodi ammessi, finisce, scrive su almeno uno.
   L'invalido torna allo Scultore col motivo (regola 2); un programma senza sezione resta buono (C). Il compilatore salta `<worn>` nella
   corsa a terra (`ASIDE_TAGS`, come animazioni e azioni): ogni modello di oggi è voce per voce lo stesso. Offline lo Scultore scrive
   una sezione semplice per la zona (`mockWorn`).
8. Sale `Z`: kernel **0.6.4**. Gli universi della 0.6 restano buoni: un campo facoltativo nuovo nell'inventario, un elemento nuovo
   accanto alla radice dei programmi, un'operazione e un campo nuovi sul filo.

## Alternative scartate

- **A, due programmi per oggetto** (il banco): un modello in più per ogni capo, gli oggetti di oggi invisibili finché non si
  riscolpiscono, una scatola stirata sui corpi non umani.
- **I capi fuori dall'inventario, in un componente a parte** (come gli slot dei pannelli): peso, filo, salvataggio, morte e doni
  avrebbero un caso in più; il segno nell'inventario passa già dappertutto, come `equipped`.
- **Vestire anche ciò che sta negli slot dei pannelli delle meccaniche**: gli slot sono dell'Ingegnere, con nomi e `accepts` suoi; due
  modi di vestirsi sullo stesso corpo. Si indossa dall'inventario; una meccanica legge il bonus dal suo slot com'era.
- **Il corpo vestito sul thread della pagina** (come `changedBody` per le azioni): da 2 a 40 ms a cambio sul viandante e sul lupo, e
  sessanta viandanti che si cambiano insieme farebbero perdere fotogrammi.
- **Il rig del corpo vestito**: un mantello che tocca terra diventerebbe gamba per una figura senza `part`, e gli arti di un corpo
  vestito non sarebbero quelli del nudo (le mani di ADR-0167 si cercano per giunto).
- **Una tabella di parole per ogni lingua del mondo** per i capi senza posto: i pacchetti scrivono il posto; le parole servono solo per
  ciò che esiste già senza (il seme ne ha uno), in italiano e in inglese.

## Conseguenze

- `tests/indossare.test.ts`: le zone su tutti i corpi del seme (gli otto semi del viandante, contadina, fabbro, gerboa, gatto, lupo) e
  sui due di prova; C e B (elmo, corazza e mantello del banco, copiati in `tests/fixtures/worn/`) su viandante, lupo, gatto e gerboa, senza
  un voxel del corpo tolto né scritto fuori dalla zona; il ripiego su C (sezione che non compila, che non scrive, di un'altra zona,
  lettere del kernel); il programma a terra uguale con la sezione accanto o dentro la radice; le mesh vestite con gli stessi arti e
  giunti; il runner che veste una volta per chiave e il worker che risponde a `dress` con i buffer; il posto e le parole; i segni che
  seguono il capo; il kernel nelle tre zone (un elmo al posto di un altro, «Usa», ciò che non si indossa, spostare, gettare, impugnare);
  il salvataggio e il ritorno; il renderer in Node (il viandante vestito con B e con C e poi svestito, ciò che impugna in mano, un
  individuo con segni, uno con segni scritti male, sessanta figure con un corpo solo); due viandanti (ciò che una indossa l'altro lo
  vede, sul filo nient'altro dell'inventario); il validatore e lo Scultore (il ruolo, la richiesta, i controlli, la sezione offline, le
  richieste del `ModelDirector`).
- **Nel browser** (build, `vite preview`, `?skip&offline`, Claude in Chrome; catture in `docs/catture/T290/`): i tre capi del banco portati
  con `addModel` (il validatore ha provato le loro sezioni) e indossati sul viandante (seme 6): l'elmo con la cresta e l'orlo d'ottone, il
  viso libero, la corazza con la costola e la gorgiera, il mantello che cade fino a terra; al loro posto il mantello del seme, un berretto
  e una giubba senza modello (via C, i colori dei pacchetti) con un'ascia nella mano alzata; nell'inventario il segno ◆ sulle tasche
  indossate, «si indossa sulla testa (indossato)», «Togli» al posto di «Usa»; tolto tutto, il corpo di prima. Il corpo vestito arriva dal
  worker in qualche frazione di secondo (nella scheda di Claude in Chrome i tempi non si misurano, `#convalida-browser`); nessun errore
  della pagina.
- **Ciò che manca**: gambe, piedi, mani (gli arti del rig) e il collo; gli **individui** non hanno segni (nessuna fonte ancora: la scheda
  del Narratore o il mestiere, un task dopo; sul filo `EntityView` non li porta: andrebbero aggiunti a elenco); i capi negli slot dei
  pannelli non si vedono; il cappello a tesa larga del viandante diventa di ferro sotto l'elmo e le orecchie del gerboa si corazzano (le
  zone seguono il corpo così com'è); le zone sono euristiche (il cane randagio passa per uno in piedi, il busto del ragno meccanico
  scende lungo le zampe: T289); **nessun modello vero ha ancora scritto una sezione `<worn>`**: la qualità di B si misura sul banco
  dello Scultore (T154) con poche chiamate prima di fidarsene; un corpo che indossa qualcosa non anima i suoi fotogrammi.
- **Il costo** (misurato, in Node su questa macchina con altri agenti al lavoro; mediane di tre, gli otto semi del viandante e i quattro
  degli animali). Vestire elmo, corazza e mantello, cioè la funzione del worker intera (zone, regole o colori, mesh del corpo e degli
  arti): con B 14,7 ms il viandante, 12 la contadina, 8,7 il gatto, 32 il lupo, 44 il gerboa; con C 9,7, 7, 4,8, 23, 23 ms; come il banco
  (14 e 9 ms il viandante, 34 e 23 il lupo). Si paga nel worker, una volta per forma e capi, solo quando qualcuno si cambia. Un corpo
  vestito pesa 413 KB con B e 373 con C contro 365 nudo (il viandante), 954 e 786 contro 786 (il lupo), 1334 e 763 contro 743 (il
  gerboa, le cui orecchie si corazzano). Un fotogramma delle entità con sessanta figure ferme: 0,53 ms nude, 0,74 ms vestite (ognuna
  legge a ogni fotogramma ciò che indossa e la chiave del suo corpo; nessuna geometria si rifà); otto corpi vestiti diversi fatti tutti
  insieme senza worker 120 ms, che nel browser stanno nei worker. Nessuna chiamata di disegno in più: il corpo vestito sostituisce
  quello nudo. Nessun modello e nessuna chiamata allo Scultore per gli oggetti di oggi; per uno nuovo da indossare il banco stimava
  +263 token in uscita e un paragrafo del prompt, circa un millesimo di dollaro.
- Sicurezza: nessuna superficie nuova fuori dal gioco. `wear` sta nel messaggio `item` che c'era, con la tasca controllata dal server
  (`slot`) e il ritmo dei messaggi di sempre; il kernel decide se un capo si indossa e dove. `OtherView.worn` dice ciò che un viandante
  ha addosso, che chi è vicino vede comunque; il client lo legge solo come tre testi tagliati. Le regole di una sezione girano nel worker
  delle forme del client, nei tetti di passi, griglia e tempo e senza file né inferenza; il validatore le prova prima che entrino.
