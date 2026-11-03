# Varianza e scala: 33 programmi, 5 semi, taglie grande, enorme, gargantuesca

31 statici su 33; 0 variano quanto chiede la soglia; 1 reggono le misure a ogni seme e a ogni taglia. Tempo: 182 s per 495 esecuzioni misurate (368 ms l'una, 5.5 s a programma), su un solo processo.

Le quote sono le mediane delle coppie di semi alla taglia del bersaglio: `voxel` è la forma, `colore` non conta. Per ogni taglia: semi che passano tutte le misure, e quali cadono.

| programma | voxel | colore | pianta | perimetro | interno | architetture | grande | enorme | gargantuesca |
|---|---|---|---|---|---|---|---|---|---|
| finale/moderna/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, stanze, murato, salti | 0/5: piani, murato, salti |
| finale/moderna/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, murato | 0/5: piani, murato |
| finale/steampunk/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, stanze, murato | 0/5: piani, stanze, murato |
| finale/steampunk/2 | — | — | — | — | — | — | 0/5: rifiutato | 0/5: rifiutato | 0/5: rifiutato |
| finale/futuristica/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, stanze, murato | 0/5: piani, stanze, murato, salti |
| finale/futuristica/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, murato | 0/5: piani, murato |
| finale/locanda/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 0/5: murato | 0/5: piani, stanze, cantina, murato | 0/5: piani, stanze, cantina, murato, salti |
| finale/locanda/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, stanze, cantina, murato, porta | 0/5: piani, stanze, cantina, murato, salti |
| finale/tempio/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani | 0/5: piani, murato |
| finale/tempio/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, murato | 0/5: piani, murato |
| finale/rocca/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 0/5: porta | 5/5 | 0/5: piani, murato |
| finale/rocca/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 0/5: piani, stanze, murato, porta | 0/5: piani, murato, finestre | 0/5: piani, murato, finestre |
| finale/pagoda/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, stanze, murato | 0/5: piani, stanze, murato |
| finale/pagoda/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, murato | 0/5: piani, stanze, murato |
| conferma/moderna/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, stanze, murato | 0/5: piani, stanze, murato, salti |
| conferma/moderna/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, stanze, murato | 0/5: piani, stanze, murato |
| conferma/steampunk/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, stanze, murato | 0/5: piani, murato |
| conferma/steampunk/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, murato | 0/5: piani, murato |
| conferma/futuristica/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 5/5 | 0/5: piani, murato |
| conferma/futuristica/1/seconda | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 5/5 | 5/5 |
| conferma/futuristica/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, murato | 0/5: piani, murato |
| conferma/futuristica/2/seconda | — | — | — | — | — | — | 0/5: rifiutato | 0/5: rifiutato | 0/5: rifiutato |
| conferma/locanda/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, testa, stanze, cantina, murato, porta | 0/5: piani, stanze, cantina, murato, porta, salti |
| conferma/locanda/1/seconda | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, testa, stanze, cantina, murato, porta | 0/5: piani, stanze, cantina, murato, porta, salti |
| conferma/locanda/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, testa, stanze, cantina, murato, porta | 0/5: piani, testa, stanze, cantina, murato, porta, salti |
| conferma/tempio/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, murato | 0/5: piani, murato |
| conferma/tempio/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, murato | 0/5: piani, murato |
| conferma/rocca/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 0/5: porta | 5/5 | 0/5: piani, murato |
| conferma/rocca/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 0/5: stanze, porta | 5/5 | 0/5: piani, murato |
| conferma/pagoda/1 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, murato | 0/5: piani, murato |
| conferma/pagoda/1/seconda | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani | 0/5: piani, murato |
| conferma/pagoda/2 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 0/5: piani, stanze, murato | 0/5: piani, stanze, murato | 0/5: piani, stanze, murato |
| conferma/pagoda/2/seconda | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1/5 | 5/5 | 0/5: piani, stanze, murato | 0/5: piani, stanze, murato |
