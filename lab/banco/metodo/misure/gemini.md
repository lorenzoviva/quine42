# Varianza tra concetti e tra semi: gemini

4 programmi, 5 semi, taglia large; le misure sono in `lab/banco/concetti.ts`.

## In breve

| | impronta | profilo | pieni | distanza |
|---|---|---|---|---|
| tra i semi di un programma (mediana) | 0,54 | 0,37 | 0,15 | 0,33 |
| tra concetti diversi (mediana) | 0,52 | 0,35 | 0,27 | 0,37 |
| separazione (fra / dentro) | 0,97 | 0,95 | 1,79 | 1,13 |

Vicini: 0 % delle esecuzioni hanno come esecuzione più vicina un altro seme dello stesso programma.

## Per programma

| programma | semi | impronta | profilo | pieni | distanza | voxel | colore | copertura | pieno | alt. media | alt. max | cortile | quote | torri | righe | dallo scheletro | scheletro tenuto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| steampunk/1/seconda | 5 | 0,55 | 0,36 | 0,11 | 0,33 | 0,66 | 0,18 | 0,48 | 0,18 | 0,66 | 0,92 | 0,00 | 4,0 | 0,2 | 95 | 69 % | 79 % |
| futuristica/1 | 5 | 0,54 | 0,38 | 0,15 | 0,33 | 0,69 | 0,17 | 0,48 | 0,19 | 0,66 | 0,89 | 0,00 | 6,4 | 0,2 | 90 | 87 % | 95 % |
| rocca/1/seconda | 5 | 0,54 | 0,38 | 0,16 | 0,34 | 0,76 | 0,14 | 0,48 | 0,23 | 0,70 | 1,00 | 0,00 | 6,0 | 5,0 | 91 | 80 % | 86 % |
| pagoda/1/seconda | 5 | 0,52 | 0,35 | 0,16 | 0,32 | 0,68 | 0,15 | 0,51 | 0,19 | 0,72 | 0,95 | 0,00 | 9,4 | 0,2 | 89 | 75 % | 80 % |

## Concetto per concetto (distanza mediana; sulla diagonale, tra i semi)

| | steampunk | futuristica | rocca | pagoda |
|---|---|---|---|---|
| steampunk | 0,33 | 0,31 | 0,39 | 0,37 |
| futuristica | 0,31 | 0,33 | 0,38 | 0,35 |
| rocca | 0,39 | 0,38 | 0,34 | 0,39 |
| pagoda | 0,37 | 0,35 | 0,39 | 0,32 |

## Rifiutati

- moderna/1/seconda: seme 1: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 2: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 3: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 4: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 5: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values
- locanda/1/seconda: seme 1: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 2: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 3: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 4: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 5: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values
- tempio/1/seconda: seme 1: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 2: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 3: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 4: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values; seme 5: nessun programma: il primo elemento è il nodo radice (sequence, markov, one…) con values

