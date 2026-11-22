# Il terreno che sfarfalla (T492)

La segnalazione dell'autore dal video della prima run (`docs/userchats/sfarfallio-2026-11-22-1.png` e `-2.png`): per un fotogramma
sparisce tutto il suolo (terra, molo, mare), restano mobili, strutture, individui, rune e luci.

## La causa, con la prova

Ogni commit del Concilio (un pacchetto, un modello, un luogo pianificato) ricarica i file dell'universo (`applyFiles`) ed emette
`universe:reloaded`; il renderer (`reset` in `src/render/renderer.ts`) toglieva allora **tutte** le mesh dei luoghi e le rifaceva tre a
fotogramma: sulla pagina prima di T486, nel worker del terreno dopo (una dozzina di fotogrammi). Nella cattura dell'autore il registro
dice proprio «Kernel approva pacchetto 3 … → commit», e l'angolo in alto a destra ha già un luogo rifatto.

Misurato nella preview della build (`?skip&offline`), contando a ogni fotogramma i luoghi caricati senza mesh in scena (`window.view`):

- prima della correzione, dopo `quine.applyFiles({ ...quine.repo.working })`: 32 luoghi su 32 senza mesh al fotogramma dopo, 29 a quello
  dopo ancora; camminando fra i luoghi senza toccare niente, l'unica perdita (31 luoghi) cade nel fotogramma dopo un `universe:reloaded`
  emesso dal Concilio offline che pianifica un luogo nuovo. Camminare, caricare e scaricare luoghi, l'acqua che scorre: nessun'altra perdita;
- dopo: le stesse prove, e un giro lungo con quattro ricariche del Concilio strada facendo e sull'acqua (72 passi, metà a nuoto): zero
  luoghi che perdono la mesh.

## Le catture

- `prima-normale.jpg`, `prima-ricarica-senza-terreno.jpg`: prima della correzione, lo stesso punto prima e dopo una ricarica dei file
  (le risposte del worker trattenute per tenere il fotogramma a schermo: è quello dell'autore, solo il cielo dove era il suolo);
- `dopo-ricarica-terreno-resta.jpg`, `dopo-ricarica-sull-acqua.jpg`: dopo la correzione, la ricarica con le risposte del worker trattenute
  (tutte le mesh vecchie): il suolo e il mare restano;
- `dopo-normale-sull-acqua.jpg`: lo stesso punto con le mesh rifatte.

Il test è `tests/sfarfallio.test.ts`.
