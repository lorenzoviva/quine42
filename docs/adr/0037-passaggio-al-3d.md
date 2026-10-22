# ADR-0037 — Si passa al 3D

Data: 2026-10-22 · Stato: **attuato** (decisione dell'autore, step 8.2C; attuata nello step 9, branch `3d`,
riassunto in [`docs/reports/step9.md`](../reports/step9.md)).
Sostituisce: ADR-0011 (mappe a tile con texture), ADR-0017 per la parte
grafica (Atelier, sprite, camminate dipinte), ADR-0030 (prospettiva 3/4 e scontorno), ADR-0031…0035
(laboratorio voxel: sprite fotografati e strutture a blocchi).

## Contesto
Gli step 8.2A e 8.2B hanno mostrato, nella sandbox `lab/3d/`, che un mondo fatto di modelli MarkovJunior
interi in 3D funziona (terreno, alberi, persone, case in cui si entra, porte che si aprono con una regola) e
costa meno del 2D: un tipo di oggetto è un programma di testo da $0,01-0,16, contro $0,0336 per ogni
immagine dipinta, e le varianti sono gratis ([report dei costi](../reports/costi-step8.2B.md)). L'autore
decide di passare al 3D e conferma le proposte di [`docs/plans/universo-continuo.md`](../plans/universo-continuo.md)
e del report dei costi.

## Decisione
1. **Il gioco diventa 3D.** Il rendering 2D (canvas, tile con texture, sprite, scontorno, Atelier delle
   immagini, ArtDirector che dipinge) si toglie interamente, su un branch nuovo. Restano i concetti di gioco
   (tappeto, corona, rune, magia, Concilio, società, trame, due tavoli), riportati nel 3D.
2. **Gli asset sono programmi MarkovJunior** nell'XML letto alla lettera (ADR-0036): ogni tipo di oggetto ha
   un programma, una classe (scatola fissa) e i suoi semi; persone e animali hanno gli arti (`part`), le
   strutture hanno le azioni (`<action>`) e le animazioni (`<animation>`). Niente modelli di immagine.
3. **Lo spazio è una scala di griglie** (proposta C di `universo-continuo.md`): regione (atlante) → piano del
   Cartografo a scala di casella, con lotti e ancore → modello a 20 voxel per casella → corpi in posizione
   continua. Posizione e rotazione dei modelli libere; collisione e «sotto i piedi» dai voxel; i chunk restano
   come unità tecnica (generazione, caricamento, salvataggio), senza materializzarne i voxel.
4. **Costi** (report 8.2B): Scultore per classe (3.1 Flash-Lite per vegetazione, rocce, oggetti, con più
   programmi indipendenti invece di giri di miglioramento; 3.8 Flash per figure e strutture; Argon solo per
   ciò che conta, prima del 1/12/2026), ragionamento `low` esplicito, istruzioni stabili per la cache,
   registro dei consumi nel kernel con il costo in dollari, niente ripetizioni dopo un tempo scaduto.
5. **Il laboratorio** smette di essere il luogo degli esperimenti delle sessioni 8A-8.2B: diventa (proposta)
   il laboratorio di MarkovJunior, per analizzare e correggere i programmi che non riescono (modelli e
   strutture), con la sandbox come banco di prova. Il resto (strutture a blocchi, WFC, sprite fotografati)
   si toglie: resta nella storia di git e negli ADR.
6. **Gli universi 2D** (`universes/valmora` e le copie) vanno in un backup fuori dal progetto attivo.

## Conseguenze
- Lo step 9 è grande: va pianificato prima (fasi, ognuna con i test verdi e un commit).
- Molti ADR passano a «sostituito»; AGENTS.md va riscritto nelle parti di rendering, contenuti e Cartografo.
- Il Concilio cambia lavoro: niente immagini; lo Scultore entra nel Concilio; il Cartografo produce lotti e
  ancore; l'Artista giudica i modelli invece di dipingerli.

## Attuazione (step 9, 22/10/2026)
Fatta in nove fasi (F0-F8 del [piano](../plans/step9-3d.md), poi i task T01-T06 del [backlog](../plans/backlog.md)),
con gli ADR 0038 (MarkovJunior nel gioco, laboratorio), 0039 (registro dei consumi), 0040 (renderer three.js),
0041 (asset come programmi), 0042 (Scultore e Artista), 0043 (lotti e strutture), 0044 (azioni come regole).
Diverso da qui: le **ancore** del piano non sono fatte (i lotti sì); il piano dei luoghi resta il MarkovJunior a
caselle in JSON (l'XML 2D o «Hills» è un passo successivo); invece di «al massimo 3 strutture importanti per
mondo», una per zona di 56 × 56 luoghi (risposta dell'autore: il mondo cresce esplorando). Gli universi 2D sono
copiati in `H:/projects/rune-backup/universi-2d/` (la cancellazione degli originali aspetta l'autore).
