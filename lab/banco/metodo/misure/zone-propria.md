# Varianza tra concetti e tra semi: zone-propria

5 programmi, 5 semi, ognuno alla taglia del suo bersaglio (o nella sua scatola); le misure sono in `lab/banco/concetti.ts`.

## In breve

| | impronta | profilo | pieni | distanza |
|---|---|---|---|---|
| tra i semi di un programma (mediana) | 0,27 | 0,15 | 0,04 | 0,16 |
| tra concetti diversi (mediana) | 0,57 | 0,46 | 0,42 | 0,46 |
| separazione (fra / dentro) | 2,15 | 3,07 | 11,08 | 2,84 |

Vicini: 100 % delle esecuzioni hanno come esecuzione più vicina un altro seme dello stesso programma.

## Per programma

| programma | semi | impronta | profilo | pieni | distanza | voxel | colore | copertura | pieno | alt. media | alt. max | cortile | quote | torri | righe | dallo scheletro | scheletro tenuto |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tempio/1 | 5 | 0,03 | 0,03 | 0,01 | 0,02 | 0,24 | 0,07 | 0,83 | 0,48 | 0,55 | 1,00 | 0,00 | 8,0 | 1,0 | 133 | 2 % | 3 % |
| rocca/1 | 5 | 0,46 | 0,30 | 0,07 | 0,27 | 0,56 | 0,45 | 0,45 | 0,79 | 0,44 | 0,82 | 0,20 | 7,4 | 5,4 | 154 | 1 % | 3 % |
| castello/1 | 5 | 0,33 | 0,24 | 0,02 | 0,20 | 0,54 | 0,20 | 0,53 | 0,65 | 0,49 | 0,79 | 0,21 | 12,2 | 6,0 | 142 | 1 % | 3 % |
| palazzina/1 | 5 | 0,21 | 0,11 | 0,04 | 0,12 | 0,39 | 0,07 | 0,50 | 0,38 | 0,77 | 1,00 | 0,21 | 6,4 | 0,0 | 162 | 1 % | 1 % |
| villetta/1 | 5 | 0,37 | 0,19 | 0,14 | 0,23 | 0,51 | 0,11 | 0,46 | 0,48 | 0,52 | 1,00 | 0,00 | 14,6 | 1,0 | 129 | 1 % | 1 % |

## Concetto per concetto (distanza mediana; sulla diagonale, tra i semi)

| | tempio | rocca | castello | palazzina | villetta |
|---|---|---|---|---|---|
| tempio | 0,02 | 0,45 | 0,41 | 0,39 | 0,43 |
| rocca | 0,45 | 0,27 | 0,41 | 0,59 | 0,62 |
| castello | 0,41 | 0,41 | 0,20 | 0,60 | 0,62 |
| palazzina | 0,39 | 0,59 | 0,60 | 0,12 | 0,41 |
| villetta | 0,43 | 0,62 | 0,62 | 0,41 | 0,23 |

