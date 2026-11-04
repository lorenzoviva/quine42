# Varianza e scala: 4 programmi, 5 semi, taglie grande, enorme

0 statici su 4; 0 variano quanto chiede la soglia; 0 reggono le misure a ogni seme e a ogni taglia. Tempo: 320 s per 40 esecuzioni misurate (7994 ms l'una, 79.9 s a programma), su un solo processo.

Le quote sono le mediane delle coppie di semi alla taglia del bersaglio: `voxel` è la forma, `colore` non conta. Per ogni taglia: semi che passano tutte le misure, e quali cadono.

| programma | voxel | colore | pianta | perimetro | interno | architetture | grande | enorme |
|---|---|---|---|---|---|---|---|---|
| suolo/locanda/1 | 0,67 | 0,36 | 0,06 | 0,10 | 0,74 | 4/5 | 0/5: finisce, valido, piani, cantina, murato, salti, finestre, sagoma, stanze | 0/5: finisce, valido, piani, cantina, murato, finestre, sagoma, testa, porta, salti |
| suolo/locanda/1/seconda | 0,59 | 0,17 | 0,18 | 0,04 | 0,60 | 3/5 | 4/5: finisce, valido | 0/5: finisce, valido, piani, cantina, murato, finestre, sagoma |
| suolo/locanda/2 | 0,54 | 0,11 | 0,17 | 0,12 | 0,52 | 3/5 | 0/5: finisce, valido, cantina, murato, salti, finestre | 0/5: finisce, valido, cantina, murato, salti, finestre, piani |
| suolo/locanda/2/seconda | 0,54 | 0,20 | 0,18 | 0,05 | 0,62 | 3/5 | 4/5: cantina | 0/5: finisce, valido, piani, cantina, murato, salti, finestre |
