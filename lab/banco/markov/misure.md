# Le misure di T498

Fatte il 22/11/2026 col kernel 0.10.22 e MarkovJunior di mxgmn al commit `42aaf24` (SDK .NET 6.0.300), con
`lab/scripts/markov-originale.ts` (il README dice come rifarle). «La copia» è il nostro motore coi rami dell'originale (README); ≠ dove
la griglia non è quella che stampa l'originale.

## Le differenze, una per programma

| programma | l’originale (C#) | la copia col flusso dell’originale | il nostro motore |
|---|---|---|---|
| d1-contatori-radice | `RRRBBBBBBBGG` 4 passi | `RRRBBBBBBBGG` 4 passi | `RRRRRRRRGGGG` 10 passi ≠ |
| d1b-contatori-annidati | `RRRRRRRRGGGG` 15 passi | `RRRRRRRRGGGG` 15 passi | `RRRRRRRRGGGG` 10 passi |
| d2-sequenza-nel-ciclo | `RRRRRRGGGGGG` 17 passi | `RRRRRRGGGGGG` 17 passi | `RRRRRRRRRRRG` 10 passi ≠ |
| d3-sequenza-nella-sequenza | `RRRRRRRRRRRG` 21 passi | `RRRRRRRRRRRG` 21 passi | `RRBBBBBBBBGG` 2 passi ≠ |
| d4-il-ramo-tiene-il-turno | `Rcaaaaaaaa` 15 passi | `Rcaaaaaaaa` 15 passi | `RcBBBBBBBB` 2 passi ≠ |
| d5-sequenza-rientrata | `RRRRRRRRRRRG` 22 passi | `RRRRRRRRRRRG` 22 passi | `RRRRRRGGGGGG` 10 passi ≠ |
| d6-prl-conta-i-giri-vuoti | `WWGBB` 4 passi | `WWGBB` 4 passi | `WWWGB` 5 passi ≠ |
| d6b-prl-annidata | `WWWWW` 13 passi | `WWWWW` 13 passi | `WWWGB` 5 passi ≠ |
| d7-one-che-non-cambia | `RGBB` 3 passi | `RGBB` 2 passi | `RGBB` 1 passi |
| d8-prl-che-non-cambia | `RBBB` 200 passi, non finisce | `RGBB` 2 passi ≠ | `RGBB` 1 passi ≠ |
| d9-one-e-p | `RRRRRBBBBGGG` 7 passi | `RBBBBGGGGGGG` 7 passi ≠ | `RBBBBGGGGGGG` 6 passi ≠ |
| d10-prl-p-zero | `RBBB` 1 passi | `RGBB` 2 passi ≠ | `RGBB` 1 passi ≠ |

## I quattro cicli del forte, 400 semi

| programma | misura | l’originale (C#) | la copia | il nostro motore | la copia dà la nostra griglia |
|---|---|---|---|---|---|
| l1-braccia | celle del cortile | media 1894.1 (13-9089) (400 semi) | media 2077.05 (18-10099) | media 2080.5 (18-10099) | 182 su 400 |
| l2-braccia-dagli-estremi | celle del cortile | media 5030.18 (931-10228) (400 semi) | media 5065.5 (769-10372) | media 5051.62 (1166-10356) | 96 su 400 |
| l3-mastio | celle del mastio | media 251.65 (100-254); 100: 1, 121: 1, 144: 1, 169: 3, 196: 3, 225: 4, 254: 387 (400 semi) | media 249.13 (100-254); 100: 2, 121: 3, 144: 3, 169: 8, 196: 1, 225: 6, 254: 377 | media 249.13 (100-254); 100: 2, 121: 3, 144: 3, 169: 8, 196: 1, 225: 6, 254: 377 | 400 su 400 |
| l3b-mastio-probabile | celle del mastio | media 98.41 (25-254); 25: 22, 36: 36, 49: 50, 64: 60, 81: 53, 100: 44, 121: 39, 144: 27, 169: 28, 196: 14, 225: 14, 254: 13 (400 semi) | media 95.56 (25-254); 25: 23, 36: 31, 49: 44, 64: 59, 81: 61, 100: 54, 121: 47, 144: 26, 169: 24, 196: 13, 225: 12, 254: 6 | media 95.56 (25-254); 25: 23, 36: 31, 49: 44, 64: 59, 81: 61, 100: 54, 121: 47, 144: 26, 169: 24, 196: 13, 225: 12, 254: 6 | 400 su 400 |
| l4-piani | piani | media 15 (15-15), 400 su 400 non finiscono; 15: 400 (400 semi) | media 15 (15-15), 400 su 400 non finiscono; 15: 400 | media 1.95 (1-9); 1: 212, 2: 93, 3: 52, 4: 18, 5: 11, 6: 4, 7: 8, 8: 1, 9: 1 | 0 su 400 |


## Il forte dell’autore (copia del 22/11), alla sua scatola

| seme | motore | finito | passi | ms | griglia | solai `F` (strati con un solaio, a gruppi) | il mastio (`K` o `k`) fino allo strato | uguale |
|---|---|---|---|---|---|---|---|---|
| 1 | il nostro | sì | 865 | 7612 | 500×500×168 | 2 | 99 | no |
| 1 | col flusso dell’originale | no (120 s) | 138636 | 120046 | 125×125×42 | 6 | 23 | no |
| 2 | il nostro | sì | 454 | 6817 | 500×500×168 | 0 | 39 | no |
| 2 | col flusso dell’originale | no (120 s) | 131886 | 120036 | 125×125×42 | 6 | 18 | no |
| 3 | il nostro | sì | 705 | 6672 | 500×500×168 | 1 | 75 | no |
| 3 | col flusso dell’originale | no (120 s) | 109840 | 120039 | 125×125×42 | 6 | 38 | no |

