# ADR-0135 — La lettera del suolo: il kernel segna dove sta il suolo, lo stesso programma serve ogni taglia

Data: 2026-11-04 · Stato: accettato (task T258 del backlog) · Riferimenti: ADR-0091 (i sotterranei), ADR-0092 (le taglie), ADR-0108 (la cache delle forme), T182 (`docs/pipeline/domande/T182.md`, domanda 1, opzione A)

## Contesto

Un modello con `sotto: N` gira in una scatola più alta di `N · vpt` voxel: a Grande il suolo è a z=20, a Enorme a z=16. Il programma non sa quale delle due riceve, e con un programma solo la cantina non reggeva due taglie: a Enorme il pavimento doveva stare entro un gradino dal suolo, a Grande nelle stesse colonne non doveva esserci niente sotto z=20. Per questo la locanda era fuori dai 12 bersagli di T182. L'autore ha scelto che il kernel segni il suolo.

## Decisione

1. **`suolo="E"` sulla radice del programma**: prima che il programma parta il kernel scrive quella lettera su tutto lo strato `base` (`Form.base`, `sotto · vpt`), e `origin="bottom"` sta al centro di quello strato. Il programma sceglie la lettera, come per `ground`, che resta com'è e riempie z=0. Se sono lo stesso strato (nessuna cantina) vince `suolo`, e il risultato è quello di `ground`.
2. **È opzionale, e chi non lo dice non cambia.** `Forms.request` mette `base` nella richiesta solo se la radice dice `suolo` e il modello ha una cantina. `formKey` aggiunge `base` solo se c'è: la richiesta, la chiave e i voxel di ogni altro programma restano quelli di prima (`lab/tests/suolo.test.ts`, misurati prima della modifica). Per questo **`FORMS_DB_VERSION` non cambia**: ciò che i browser tengono resta buono, nessun modello si rigenera, e un programma con `suolo` è un testo nuovo, quindi una chiave nuova. La profondità sta nella chiave perché due voci possono dare lo stesso testo con una `size` scritta e due `sotto`.
3. **`base` viaggia con il modello compilato** (`compileMjx(xml, { base })`, `Program3.soil`, `soilAt`): chi riesegue il programma, come la traccia e le foto del banco, trova lo stesso suolo. Chi compila senza `base` (il validatore, lo Scultore, il Tornio) ha il suolo in fondo: il programma gira, come un modello senza cantina. Una scatola senza posto per `base` ha il suolo in fondo, come `Forms.get` posa il modello.
4. **`suolo` e `map` non vanno insieme**: `base` conta i voxel del modello finito, e sulla griglia grossa di una `map` sarebbe un'altra quota. Il programma torna con il motivo.
5. **Sotto il suolo si scava con regole senza `steps`, che si fermano al fondo** (`ground="Z"`): è ciò che rende indifferente la profondità. La ricetta è in `lab/banco/prompt.md` e `lab/banco/riferimento/cantina.xml`.

## Alternative scartate

- **Una lettera riservata per tutti i programmi**: cambierebbe l'alfabeto e i voxel dei modelli già scolpiti, o costringerebbe a una migrazione.
- **`sotto` in voxel e non in caselle** (T182, opzione C): a Enorme una cantina più bassa in caselle, e `testa` può cadere.
- **Una cantina a una taglia sola** (T182, opzione B): una deroga alla soglia di T180.

## Conseguenze

- La locanda può tornare fra i bersagli a due taglie, che T182 aveva dovuto lasciare fuori.
- `checkProgram` dello Scultore non passa ancora `base`, e `withSize` scrive la scatola senza la cantina: **per scolpire nel gioco un programma con `suolo` e `sotto` serve T156**, che porta il prompt procedurale nello Scultore. Oggi nessun modello dell'universo usa `suolo`.
- `lab/banco/riferimento/cantiere.xml` e lo scheletro del prompt dicono `suolo="E"` invece di `ground="E"`: a `base` 0 è lo stesso programma, voxel per voxel.
