# Varianza tra concetti e tra semi: nodi

2 programmi, 5 semi, taglia large; le misure sono in `lab/banco/concetti.ts`.

## In breve

| | impronta | profilo | pieni | distanza |
|---|---|---|---|---|
| tra i semi di un programma (mediana) | 0,55 | 0,36 | 0,19 | 0,34 |
| tra concetti diversi (mediana) | 0,54 | 0,33 | 0,17 | 0,34 |
| separazione (fra / dentro) | 0,99 | 0,92 | 0,87 | 1,00 |

Vicini: 0 % delle esecuzioni hanno come esecuzione più vicina un altro seme dello stesso programma.

## Per programma

| programma | semi | impronta | profilo | pieni | distanza | voxel | colore | copertura | pieno | alt. media | alt. max | cortile | quote | torri | righe | dallo scheletro | scheletro tenuto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| castello/1 | 5 | 0,54 | 0,36 | 0,20 | 0,35 | 0,74 | 0,15 | 0,49 | 0,27 | 0,73 | 1,00 | 0,00 | 21,0 | 1,2 | 94 | 85 % | 95 % |
| villetta/1 | 5 | 0,55 | 0,37 | 0,19 | 0,33 | 0,71 | 0,13 | 0,48 | 0,24 | 0,72 | 1,00 | 0,00 | 20,4 | 0,6 | 85 | 92 % | 92 % |

## Concetto per concetto (distanza mediana; sulla diagonale, tra i semi)

| | castello | villetta |
|---|---|---|
| castello | 0,35 | 0,34 |
| villetta | 0,34 | 0,33 |

## Rifiutati

- rocca/1: seme 1: il simbolo "#4" non ha colore nella palette di MarkovJunior: dagliene uno con <color symbol="#4" value="rrggbb"/>; seme 2: il simbolo "#4" non ha colore nella palette di MarkovJunior: dagliene uno con <color symbol="#4" value="rrggbb"/>; seme 3: il simbolo "#4" non ha colore nella palette di MarkovJunior: dagliene uno con <color symbol="#4" value="rrggbb"/>; seme 4: il simbolo "#4" non ha colore nella palette di MarkovJunior: dagliene uno con <color symbol="#4" value="rrggbb"/>; seme 5: il simbolo "#4" non ha colore nella palette di MarkovJunior: dagliene uno con <color symbol="#4" value="rrggbb"/>

