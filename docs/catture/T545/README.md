# T545 — La copertura dei terreni (ADR-0268)

`node lab/scripts/misura-frame.mjs <porta> --sottobosco --gioco --foto docs/catture/T545 --json docs/catture/T545/frame.json` su una
preview della build (kernel 0.10.43), il seme offline, la partenza («Campagna del Primo Passo»), il tappeto fermo, la stessa ora del mondo
in ogni foto e misura. Chrome headless su ANGLE (NVIDIA GeForce RTX 2070, Direct3D11), 1904 × 985, 12 core logici, timer query della GPU
sì; altri agenti al lavoro sulla stessa macchina (fra due giri uguali la GPU in mediana si sposta di ±0,3 ms). Otto secondi per riga, la
camera più lontana (`ZOOM.max`), il kernel a 60 tick al secondo, senza vsync.

| riga | istanze | draw call | triangoli a frame (tutte le passate) | GPU, mediana (p95) | JS a frame, mediana (p95) | fps |
|---|---:|---:|---:|---|---|---:|
| lo strato della copertura nascosto (com'era prima) | — | 179 | 4,33 M | 2,15 (3,33) ms | 2,1 (4,0) ms | 363 |
| la copertura del seme (12 forme, 459k triangoli) | 1 810 | 203 | 5,24 M | 2,37 (3,57) ms | 2,2 (3,9) ms | 355 |
| il prato più fitto a mondo acceso (`setCover`: ciuffi 4, arbusti 0,5, sassolini 0,5 a casella) | 4 896 | 206 | 6,77 M | 2,67 (3,25) ms | 2,4 (4,3) ms | 327 |

Lo strato si fa in 0,8 ms (1,6 ms col prato fitto), solo quando la copertura di un luogo cambia. Le draw call crescono di una per forma in
ogni passata (12 forme, due passate), non coi luoghi; il tetto di 20 000 istanze qui non si tocca (la finestra della partenza ne ha 4 896 al
più fitto), lo provano i test (`tests/copertura.test.ts`).

A mondo acceso, nella stessa sessione:

- **un'istanza diventa una cosa**: l'istanza più vicina al viandante (un ciuffo, `cover-tuft` n. 0) diventa una cassa del seme
  (`uncover`), posata nel suo punto col suo programma, il suo seme e il suo verso; lo strato passa da 1 810 a 1 809 istanze;
- **un tipo in più, un'altra densità**: `setCover('g', …)` con un commit del Concilio («copertura di «prato»: Ciuffo d'erba 4 a casella,
  Arbusto basso 0,5 a casella, Sassolini 0,5 a casella»); i luoghi si rifanno con la copertura nuova.

| foto | che cosa |
|---|---|
| `1-senza-copertura.jpg`, `1-senza-copertura-vicino.jpg` | la partenza con lo strato nascosto: il prato è un quadrato di un colore |
| `2-con-la-copertura.jpg`, `2-con-la-copertura-vicino.jpg` | la copertura del seme: ciuffi, arbusti e sassolini sul prato; sentieri, lotti, bosco e rune nudi |
| `3-istanza-promossa-vicino.jpg` | il ciuffo diventato una cosa (il segno «E» sopra di lui) |
| `4-prato-fitto.jpg`, `4-prato-fitto-vicino.jpg` | il prato reso più fitto a mondo acceso; le rune restano leggibili |

La prima prova mostrava i ciuffi sopra le rune del terreno: da qui le rune sono fra ciò che la copertura non copre (`coverMask`).
