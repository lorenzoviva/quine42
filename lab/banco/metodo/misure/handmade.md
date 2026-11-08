# Varianza tra concetti e tra semi: handmade

12 programmi, 5 semi, ognuno alla taglia del suo bersaglio (o nella sua scatola); le misure sono in `lab/banco/concetti.ts`.

## In breve

| | impronta | profilo | pieni | distanza |
|---|---|---|---|---|
| tra i semi di un programma (mediana) | 0,00 | 0,00 | 0,00 | 0,00 |
| tra concetti diversi (mediana) | 0,69 | 0,81 | 0,69 | 0,65 |
| separazione (fra / dentro) | ∞ | ∞ | ∞ | ∞ |

Vicini: 92 % delle esecuzioni hanno come esecuzione più vicina un altro seme dello stesso programma.

## Per programma

| programma | semi | impronta | profilo | pieni | distanza | voxel | colore | copertura | pieno | alt. media | alt. max | cortile | quote | torri |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| albero-luce | 5 | 0,32 | 0,31 | 0,16 | 0,27 | 0,51 | 0,37 | 0,29 | 0,41 | 0,59 | 0,75 | 0,00 | 8,6 | 0,0 |
| circuito-3D | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,12 | 0,32 | 1,00 | 0,74 | 0,74 | 0,00 | 1,0 | 0,0 |
| circuito-mormale | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,46 | 0,10 | 1,00 | 0,95 | 0,96 | 0,89 | 1,0 | 0,0 |
| circuito | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,46 | 0,10 | 1,00 | 0,95 | 0,96 | 0,89 | 1,0 | 0,0 |
| drone-piu2 | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,01 | 0,60 | 0,39 | 0,59 | 0,63 | 0,00 | 3,0 | 0,0 |
| drone-xl | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,01 | 0,72 | 0,35 | 0,61 | 0,88 | 0,00 | 4,0 | 0,0 |
| drone | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,01 | 0,60 | 0,44 | 0,43 | 0,50 | 0,00 | 4,0 | 0,0 |
| falo | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,24 | 0,39 | 0,78 | 0,63 | 0,92 | 0,00 | 10,0 | 2,0 |
| guida | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,11 | 1,00 | 1,00 | 1,00 | 0,00 | 1,0 | 0,0 |
| lampione | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,03 | 0,61 | 0,19 | 0,88 | 0,95 | 0,00 | 10,0 | 0,0 |
| schermo-scritte | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,91 | 1,00 | 0,97 | 0,97 | 0,00 | 1,0 | 0,0 |
| schermo-struttura | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,03 | 0,83 | 0,97 | 1,00 | 1,00 | 0,00 | 1,0 | 0,0 |

## Concetto per concetto (distanza mediana; sulla diagonale, tra i semi)

| | albero-luce | circuito-3D | circuito-mormale | circuito | drone-piu2 | drone-xl | drone | falo | guida | lampione | schermo-scritte | schermo-struttura |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| albero-luce | 0,27 | 0,71 | 0,87 | 0,87 | 0,62 | 0,62 | 0,69 | 0,49 | 0,88 | 0,72 | 0,77 | 0,74 |
| circuito-3D | 0,71 | 0,00 | 0,62 | 0,62 | 0,75 | 0,74 | 0,75 | 0,61 | 0,69 | 0,72 | 0,57 | 0,55 |
| circuito-mormale | 0,87 | 0,62 | 0,00 | 0,00 | 0,88 | 0,84 | 0,90 | 0,77 | 0,61 | 0,89 | 0,60 | 0,58 |
| circuito | 0,87 | 0,62 | 0,00 | 0,00 | 0,88 | 0,84 | 0,90 | 0,77 | 0,61 | 0,89 | 0,60 | 0,58 |
| drone-piu2 | 0,62 | 0,75 | 0,88 | 0,88 | 0,00 | 0,26 | 0,57 | 0,62 | 0,89 | 0,60 | 0,64 | 0,63 |
| drone-xl | 0,62 | 0,74 | 0,84 | 0,84 | 0,26 | 0,00 | 0,61 | 0,64 | 0,86 | 0,63 | 0,63 | 0,59 |
| drone | 0,69 | 0,75 | 0,90 | 0,90 | 0,57 | 0,61 | 0,00 | 0,69 | 0,85 | 0,54 | 0,68 | 0,71 |
| falo | 0,49 | 0,61 | 0,77 | 0,77 | 0,62 | 0,64 | 0,69 | 0,00 | 0,83 | 0,68 | 0,62 | 0,58 |
| guida | 0,88 | 0,69 | 0,61 | 0,61 | 0,89 | 0,86 | 0,85 | 0,83 | 0,00 | 0,88 | 0,65 | 0,64 |
| lampione | 0,72 | 0,72 | 0,89 | 0,89 | 0,60 | 0,63 | 0,54 | 0,68 | 0,88 | 0,00 | 0,63 | 0,62 |
| schermo-scritte | 0,77 | 0,57 | 0,60 | 0,60 | 0,64 | 0,63 | 0,68 | 0,62 | 0,65 | 0,63 | 0,00 | 0,18 |
| schermo-struttura | 0,74 | 0,55 | 0,58 | 0,58 | 0,63 | 0,59 | 0,71 | 0,58 | 0,64 | 0,62 | 0,18 | 0,00 |

