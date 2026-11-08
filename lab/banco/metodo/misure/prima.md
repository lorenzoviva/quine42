# Varianza tra concetti e tra semi: prima

5 programmi, 5 semi, taglia large; le misure sono in `lab/banco/concetti.ts`.

## In breve

| | impronta | profilo | pieni | distanza |
|---|---|---|---|---|
| tra i semi di un programma (mediana) | 0,55 | 0,37 | 0,18 | 0,34 |
| tra concetti diversi (mediana) | 0,54 | 0,34 | 0,30 | 0,38 |
| separazione (fra / dentro) | 0,99 | 0,92 | 1,61 | 1,11 |

Vicini: 0 % delle esecuzioni hanno come esecuzione più vicina un altro seme dello stesso programma.

## Per programma

| programma | semi | impronta | profilo | pieni | distanza | voxel | colore | copertura | pieno | alt. media | alt. max | cortile | quote | torri | righe | dallo scheletro | scheletro tenuto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tempio/1 | 5 | 0,56 | 0,37 | 0,21 | 0,34 | 0,72 | 0,11 | 0,48 | 0,29 | 0,76 | 1,00 | 0,00 | 17,2 | 0,8 | 99 | 82 % | 96 % |
| rocca/1 | 5 | 0,55 | 0,38 | 0,15 | 0,34 | 0,69 | 0,14 | 0,48 | 0,19 | 0,67 | 0,96 | 0,00 | 6,6 | 0,2 | 89 | 92 % | 97 % |
| castello/1 | 5 | 0,51 | 0,34 | 0,19 | 0,32 | 0,68 | 0,18 | 0,49 | 0,25 | 0,71 | 0,97 | 0,00 | 22,0 | 0,2 | 99 | 78 % | 91 % |
| palazzina/1 | 5 | 0,55 | 0,37 | 0,15 | 0,36 | 0,68 | 0,19 | 0,48 | 0,18 | 0,66 | 0,91 | 0,00 | 5,2 | 0,2 | 86 | 84 % | 86 % |
| villetta/1 | 5 | 0,55 | 0,37 | 0,19 | 0,34 | 0,70 | 0,14 | 0,48 | 0,25 | 0,72 | 1,00 | 0,00 | 23,2 | 0,6 | 90 | 86 % | 91 % |

## Concetto per concetto (distanza mediana; sulla diagonale, tra i semi)

| | tempio | rocca | castello | palazzina | villetta |
|---|---|---|---|---|---|
| tempio | 0,34 | 0,42 | 0,36 | 0,44 | 0,35 |
| rocca | 0,42 | 0,34 | 0,37 | 0,34 | 0,38 |
| castello | 0,36 | 0,37 | 0,32 | 0,39 | 0,33 |
| palazzina | 0,44 | 0,34 | 0,39 | 0,36 | 0,40 |
| villetta | 0,35 | 0,38 | 0,33 | 0,40 | 0,34 |

