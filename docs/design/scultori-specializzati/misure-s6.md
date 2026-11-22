# Le parti del mondo offline (T472, S6 di T458)

Data: 2026-11-22 · `npx vite-node lab/scripts/parti-mondo.ts -- --conta` · token di `countTokens` (Gemini, gratis) · nessuna chiamata ai modelli.

Lo Scultore locale (`mockPart`: l'ultimo nodo di regole della `<sequence>` radice) taglia una parte da 16 dei 54 programmi del seme che sono cose del mondo;
16 su 16 danno la stessa griglia, voxel per voxel, su ogni seme che il mondo dà loro (tre almeno). La richiesta di `model.part` è in media
7035 token (4820 di sistema, il prefisso che la cache serve alle sculture dello stesso mestiere),
8.20 millesimi di dollaro sul modello della classe con 1200 token di uscita; la riga che una parte aggiunge a ogni richiesta del suo mestiere
71 token in media (al più 79).

| modello | classe | mestiere | righe | semi | stessa griglia | richiesta | sistema | riga | $ |
|---|---|---|---|---|---|---|---|---|---|
| beast | beast | Figurinista | 136-140 | 4 | sì | 8327 | 4599 | 74 | 0.01075 |
| tree | tree | Paesaggista | 52-55 | 3 | sì | 6197 | 4625 | 70 | 0.00272 |
| quercia | tree | Paesaggista | 64-66 | 3 | sì | 6461 | 4625 | 70 | 0.00279 |
| palma | tree | Paesaggista | 56-60 | 3 | sì | 6316 | 4625 | 75 | 0.00275 |
| bush | bush | Paesaggista | 31-34 | 3 | sì | 5740 | 4625 | 73 | 0.00261 |
| cespuglio-con-bacche | bush | Paesaggista | 30-30 | 3 | sì | 5750 | 4625 | 79 | 0.00261 |
| falo | furniture | Mobiliere | 45-45 | 3 | sì | 6303 | 4677 | 64 | 0.00274 |
| letto | furniture | Mobiliere | 77-77 | 3 | sì | 6727 | 4677 | 68 | 0.00285 |
| banco | furniture | Mobiliere | 67-67 | 3 | sì | 6528 | 4677 | 67 | 0.00280 |
| credenza | furniture | Mobiliere | 63-63 | 3 | sì | 6465 | 4677 | 65 | 0.00278 |
| pozzo | building | Capomastro | 112-112 | 3 | sì | 7866 | 4760 | 65 | 0.02231 |
| building | building | Capomastro | 94-98 | 3 | sì | 7847 | 4760 | 71 | 0.02227 |
| monument | monument | Capomastro | 73-73 | 3 | sì | 6642 | 4760 | 65 | 0.01986 |
| structure | structure | Architetto | 83-85 | 3 | sì | 10651 | 7052 | 73 | 0.02526 |
| fantasy-libreria-alchemica | furniture | Mobiliere | 67-70 | 3 | sì | 7148 | 4677 | 77 | 0.00296 |
| fantasy-bancarella-mercato | furniture | Mobiliere | 90-90 | 3 | sì | 7589 | 4677 | 74 | 0.00307 |
