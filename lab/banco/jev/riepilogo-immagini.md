# Il banco di Jev con le immagini (T324): le tabelle

Generato da `npx vite-node lab/scripts/jev-banco.ts -- --rapporto` dal registro `consumi.jsonl` (i giri `img…` e `prova-immagini`). Il metodo e le conclusioni sono in [`README.md`](README.md), «Le immagini».

Spesa di T324: TypeSafe $0.2800 in 2846 chiamate (6.67 milioni di token in ingresso); Gemini $0.4772 in 576 righe (1.31 milioni di token in ingresso).

## Tutti i compiti

| gruppo | compito | variante | modello | chiamate | decisioni | giuste | per domanda | $ per 1000 decisioni | token in / out medi | ms mediana (p90) |
|---|---|---|---|---|---|---|---|---|---|---|
| immagini | artista | griglia | jev-1.13.0 | 28 | 224 | 52 % | riconosce 68 %, regge 0 %, lati 93 %, tetto 68 %, colori 89 %, dettaglio 32 %, passa 32 %, voto 32 % | 0.0125 | 2380 / 122 | 206 (236) |
| immagini | artista | griglia | jev-1.14.0 | 28 | 224 | 42 % | riconosce 46 %, regge 0 %, lati 82 %, tetto 50 %, colori 79 %, dettaglio 11 %, passa 32 %, voto 36 % | 0.0125 | 2380 / 122 | 223 (318) |
| immagini | artista | lati4 | gemini-3.1-flash-lite | 123 | 490 | 48 % | riconosce 79 %, regge 64 %, lati 93 %, tetto 49 %, colori 64 %, dettaglio 89 %, passa 27 %, voto 27 % | 0.1024 | 2133 / 190 | 1396 (1752) |
| immagini | artista | lati4 | jev-1.13.0 | 123 | 490 | 71 % | riconosce 64 %, regge 40 %, lati 82 %, tetto 47 %, colori 77 %, dettaglio 36 %, passa 84 %, voto 82 % | 0.0125 | 2381 / 122 | 217 (286) |
| immagini | artista | lati4 | jev-1.14.0 | 123 | 490 | 69 % | riconosce 43 %, regge 40 %, lati 68 %, tetto 51 %, colori 79 %, dettaglio 11 %, passa 85 %, voto 85 % | 0.0125 | 2381 / 122 | 230 (338) |
| immagini | artista | lato1 | jev-1.13.0 | 28 | 224 | 29 % | riconosce 57 %, regge 0 %, lati 0 %, tetto 32 %, colori 64 %, dettaglio 11 %, passa 32 %, voto 32 % | 0.0079 | 1504 / 122 | 230 (341) |
| immagini | artista | lato1 | jev-1.14.0 | 28 | 224 | 28 % | riconosce 46 %, regge 0 %, lati 4 %, tetto 46 %, colori 54 %, dettaglio 11 %, passa 32 %, voto 32 % | 0.0079 | 1504 / 122 | 196 (311) |
| immagini | artista | separate | jev-1.13.0 | 28 | 224 | 50 % | riconosce 75 %, regge 0 %, lati 93 %, tetto 39 %, colori 86 %, dettaglio 32 %, passa 36 %, voto 43 % | 0.0128 | 2446 / 122 | 213 (254) |
| immagini | artista | separate | jev-1.14.0 | 28 | 224 | 45 % | riconosce 54 %, regge 0 %, lati 93 %, tetto 57 %, colori 79 %, dettaglio 11 %, passa 32 %, voto 32 % | 0.0128 | 2446 / 122 | 305 (333) |
| immagini | concetto | griglia | jev-1.13.0 | 28 | 28 | 79 % | building 79 % | 0.0732 | 1742 / 77 | 201 (233) |
| immagini | concetto | griglia | jev-1.14.0 | 28 | 28 | 96 % | building 96 % | 0.0732 | 1742 / 78 | 260 (333) |
| immagini | concetto | lati4 | gemini-3.1-flash-lite | 28 | 28 | 100 % | building 100 % | 0.5284 | 1396 / 120 | 1274 (1570) |
| immagini | concetto | lati4 | jev-1.13.0 | 28 | 28 | 86 % | building 86 % | 0.0732 | 1743 / 77 | 230 (368) |
| immagini | concetto | lati4 | jev-1.14.0 | 28 | 28 | 89 % | building 89 % | 0.0732 | 1743 / 78 | 205 (310) |
| immagini | concetto | lato1 | jev-1.13.0 | 28 | 28 | 75 % | building 75 % | 0.0364 | 866 / 78 | 218 (341) |
| immagini | concetto | lato1 | jev-1.14.0 | 28 | 28 | 64 % | building 64 % | 0.0364 | 866 / 77 | 183 (292) |
| immagini | confronto | lati4 | gemini-3.1-flash-lite | 56 | 56 | 70 % | better 70 % | 0.8141 | 2492 / 127 | 1101 (1496) |
| immagini | confronto | lati4 | jev-1.13.0 | 56 | 56 | 77 % | better 77 % | 0.1192 | 2838 / 31 | 220 (277) |
| immagini | confronto | lati4 | jev-1.14.0 | 56 | 56 | 75 % | better 75 % | 0.1192 | 2838 / 31 | 249 (332) |
| immagini | difetto | griglia | jev-1.13.0 | 114 | 570 | 73 % | tetto 76 %, rumore 99 %, mezzo 18 %, grigio 88 %, porta 82 % | 0.0137 | 1635 / 89 | 210 (267) |
| immagini | difetto | griglia | jev-1.14.0 | 114 | 570 | 89 % | tetto 88 %, rumore 100 %, mezzo 87 %, grigio 89 %, porta 82 % | 0.0137 | 1635 / 89 | 211 (324) |
| immagini | difetto | lati4 | gemini-3.1-flash-lite | 114 | 570 | 89 % | tetto 89 %, rumore 96 %, mezzo 82 %, grigio 95 %, porta 83 % | 0.1136 | 1382 / 148 | 1461 (1855) |
| immagini | difetto | lati4 | jev-1.13.0 | 114 | 570 | 74 % | tetto 82 %, rumore 99 %, mezzo 18 %, grigio 88 %, porta 82 % | 0.0138 | 1643 / 89 | 206 (259) |
| immagini | difetto | lati4 | jev-1.14.0 | 114 | 570 | 88 % | tetto 85 %, rumore 100 %, mezzo 82 %, grigio 89 %, porta 82 % | 0.0138 | 1643 / 89 | 229 (326) |
| immagini | difetto | lato1 | jev-1.13.0 | 114 | 570 | 74 % | tetto 82 %, rumore 97 %, mezzo 19 %, grigio 89 %, porta 82 % | 0.0064 | 762 / 89 | 183 (260) |
| immagini | difetto | lato1 | jev-1.14.0 | 114 | 570 | 84 % | tetto 85 %, rumore 99 %, mezzo 77 %, grigio 89 %, porta 70 % | 0.0064 | 762 / 89 | 181 (289) |
| immagini | migliore | lati4 | gemini-3.1-flash-lite | 19 | 19 | 32 % | better 32 % | 1.4511 | 4752 / 191 | 1217 (2399) |
| immagini | migliore | lati4 | jev-1.13.0 | 19 | 19 | 79 % | better 79 % | 0.2250 | 5357 / 45 | 253 (357) |
| immagini | migliore | lati4 | jev-1.14.0 | 19 | 19 | 74 % | better 74 % | 0.2250 | 5357 / 45 | 313 (437) |
| immagini | modello-foto | foto50 | jev-1.13.0 | 37 | 73 | 73 % | model 70 %, fits 75 % | 0.2872 | 13675 / 484 | 355 (476) |
| immagini | modello-foto | foto50 | jev-1.14.0 | 37 | 73 | 74 % | model 68 %, fits 81 % | 0.2872 | 13675 / 485 | 415 (474) |
| immagini | modello-foto | foto8 | gemini-3.1-flash-lite | 14 | 28 | 89 % | model 86 %, fits 93 % | 1.3246 | 9301 / 216 | 1639 (2766) |
| immagini | modello-foto | foto8 | jev-1.13.0 | 37 | 73 | 77 % | model 73 %, fits 81 % | 0.1268 | 6038 / 107 | 259 (317) |
| immagini | modello-foto | foto8 | jev-1.14.0 | 37 | 73 | 73 % | model 59 %, fits 86 % | 0.1268 | 6038 / 107 | 337 (423) |
| immagini | modello-foto | nomi8 | gemini-3.1-flash-lite | 37 | 73 | 95 % | model 95 %, fits 94 % | 0.1759 | 609 / 133 | 986 (1197) |
| immagini | modello-foto | nomi8 | jev-1.13.0 | 37 | 73 | 92 % | model 86 %, fits 97 % | 0.0181 | 861 / 121 | 167 (209) |
| immagini | modello-foto | nomi8 | jev-1.14.0 | 37 | 73 | 93 % | model 86 %, fits 100 % | 0.0181 | 861 / 121 | 166 (191) |
| immagini | quarta-parete-foto | lati4 | gemini-3.1-flash-lite | 67 | 128 | 94 % | modern 94 %, belongs 94 % | 0.2690 | 1363 / 131 | 1058 (1467) |
| immagini | quarta-parete-foto | lati4 | jev-1.13.0 | 67 | 128 | 80 % | modern 97 %, belongs 64 % | 0.0243 | 1156 / 36 | 187 (252) |
| immagini | quarta-parete-foto | lati4 | jev-1.14.0 | 67 | 128 | 92 % | modern 95 %, belongs 89 % | 0.0243 | 1156 / 36 | 200 (289) |
| immagini | riconosci | lati4 | gemini-3.1-flash-lite | 50 | 50 | 66 % | model 66 % | 0.6743 | 2008 / 115 | 1303 (1539) |
| immagini | riconosci | lati4 | jev-1.13.0 | 50 | 50 | 44 % | model 44 % | 0.0932 | 2219 / 563 | 198 (236) |
| immagini | riconosci | lati4 | jev-1.14.0 | 50 | 50 | 42 % | model 42 % | 0.0932 | 2219 / 563 | 202 (311) |

## L'Artista: passa o no

`passa` sui 28 programmi giudicati (quelli che passano il giudizio delle foto e quelli che no) e sui programmi che passano con un difetto fatto apposta (non devono passare); «voto ≥ 7» è il livello del voto dall'alto. AUC: quanto spesso la probabilità del sì è più alta su uno che passa che su uno che non passa (0,5 è il caso; per Flash-Lite la probabilità è 0 o 1).

| modello | forma | giudicati: passano detti sì | giudicati: non passano detti no | AUC giudicati | soglia migliore sui giudicati (passano sì / non passano sì) | difettosi detti no | AUC interi contro difettosi | p(sì) media: passano / non passano / difettosi | voto ≥ 7 giusto (giudicati / difettosi) |
|---|---|---|---|---|---|---|---|---|---|
| gemini-3.1-flash-lite | lati4 | 19/19 | 0/9 | 0.50 | 0.50 (19/19 / 9/9) | 14/95 | 0.57 | 1.00 / 1.00 / 0.85 | 19/28 / 14/95 |
| gemini-3.5-flash | oggi | 3/3 | 2/4 | 0.83 | 0.80 (3/3 / 2/4) | 1/3 | 0.78 | 0.83 / 0.65 / 0.63 | 5/7 / 1/3 |
| jev-1.13.0 | lati4 | 0/19 | 9/9 | 0.77 | 0.26 (17/19 / 5/9) | 94/95 | 0.57 | 0.35 / 0.27 / 0.34 | 9/28 / 92/95 |
| jev-1.13.0 | lato1 | 0/19 | 9/9 | 0.77 | 0.16 (17/19 / 5/9) | 0/0 | — | 0.23 / 0.18 / — | 9/28 / 0/0 |
| jev-1.13.0 | griglia | 0/19 | 9/9 | 0.71 | 0.26 (18/19 / 6/9) | 0/0 | — | 0.39 / 0.31 / — | 9/28 / 0/0 |
| jev-1.13.0 | separate | 1/19 | 9/9 | 0.69 | 0.24 (18/19 / 6/9) | 0/0 | — | 0.37 / 0.31 / — | 12/28 / 0/0 |
| jev-1.14.0 | lati4 | 0/19 | 9/9 | 0.72 | 0.15 (17/19 / 4/9) | 95/95 | 0.58 | 0.22 / 0.17 / 0.20 | 9/28 / 95/95 |
| jev-1.14.0 | lato1 | 0/19 | 9/9 | 0.62 | 0.06 (19/19 / 7/9) | 0/0 | — | 0.14 / 0.12 / — | 9/28 / 0/0 |
| jev-1.14.0 | griglia | 0/19 | 9/9 | 0.68 | 0.15 (18/19 / 6/9) | 0/0 | — | 0.24 / 0.20 / — | 10/28 / 0/0 |
| jev-1.14.0 | separate | 0/19 | 9/9 | 0.68 | 0.15 (19/19 / 6/9) | 0/0 | — | 0.25 / 0.21 / — | 9/28 / 0/0 |

I criteri visti da fuori, sui giudicati (giuste / votate); fra parentesi la risposta più frequente del giudizio, che da sola prende:

| modello | forma | riconosce (79 %) | regge (100 %) | lati (93 %) | tetto (82 %) | colori (96 %) | dettaglio (89 %) |
|---|---|---|---|---|---|---|---|
| gemini-3.1-flash-lite | lati4 | 79 % | 100 % | 93 % | 82 % | 96 % | 89 % |
| jev-1.13.0 | lati4 | 64 % | 0 % | 82 % | 46 % | 86 % | 36 % |
| jev-1.13.0 | lato1 | 57 % | 0 % | 0 % | 32 % | 64 % | 11 % |
| jev-1.13.0 | griglia | 68 % | 0 % | 93 % | 68 % | 89 % | 32 % |
| jev-1.13.0 | separate | 75 % | 0 % | 93 % | 39 % | 86 % | 32 % |
| jev-1.14.0 | lati4 | 43 % | 0 % | 68 % | 46 % | 75 % | 11 % |
| jev-1.14.0 | lato1 | 46 % | 0 % | 4 % | 46 % | 54 % | 11 % |
| jev-1.14.0 | griglia | 46 % | 0 % | 82 % | 50 % | 79 % | 11 % |
| jev-1.14.0 | separate | 54 % | 0 % | 93 % | 57 % | 79 % | 11 % |

## I difetti fatti apposta

Per ogni difetto: quante volte il modello lo vede dove c'è (sensibilità) e quante volte lo dice dove non c'è (falsi allarmi, sugli interi e sugli altri difetti); le cinque domande sono in ogni richiesta.

| modello | forma | tetto: visto / falsi | rumore: visto / falsi | mezzo: visto / falsi | grigio: visto / falsi | porta: visto / falsi | interi senza allarmi |
|---|---|---|---|---|---|---|---|
| gemini-3.1-flash-lite | lati4 | 37 % / 1 % | 79 % / 0 % | 11 % / 3 % | 74 % / 1 % | 0 % / 0 % | 18/19 |
| jev-1.13.0 | lati4 | 63 % / 15 % | 100 % / 1 % | 100 % / 99 % | 26 % / 0 % | 32 % / 8 % | 0/19 |
| jev-1.13.0 | lato1 | 47 % / 11 % | 100 % / 3 % | 100 % / 97 % | 32 % / 0 % | 37 % / 9 % | 1/19 |
| jev-1.13.0 | griglia | 68 % / 22 % | 100 % / 1 % | 100 % / 98 % | 26 % / 0 % | 11 % / 4 % | 1/19 |
| jev-1.14.0 | lati4 | 11 % / 0 % | 100 % / 0 % | 74 % / 17 % | 37 % / 0 % | 11 % / 4 % | 17/19 |
| jev-1.14.0 | lato1 | 11 % / 0 % | 100 % / 1 % | 68 % / 21 % | 32 % / 0 % | 26 % / 21 % | 13/19 |
| jev-1.14.0 | griglia | 26 % / 0 % | 100 % / 0 % | 68 % / 9 % | 37 % / 0 % | 0 % / 1 % | 18/19 |

Jev dà una probabilità: quanto ogni domanda separa le foto col suo difetto da quelle intere, a qualunque soglia (AUC; 1 è perfetto, 0,5 il caso), e la soglia del sì che lo dimostra (la migliore sui dati: da rifare su casi nuovi prima di usarla).

| modello | forma | tetto: AUC (soglia, visto / falsi sugli interi) | rumore: AUC (soglia, visto / falsi sugli interi) | mezzo: AUC (soglia, visto / falsi sugli interi) | grigio: AUC (soglia, visto / falsi sugli interi) | porta: AUC (soglia, visto / falsi sugli interi) |
|---|---|---|---|---|---|---|
| jev-1.13.0 | lati4 | 0.89 (0.23, 95 % / 26 %) | 1.00 (0.50, 100 % / 0 %) | 0.83 (0.86, 100 % / 42 %) | 1.00 (0.02, 100 % / 0 %) | 0.71 (0.38, 68 % / 26 %) |
| jev-1.13.0 | lato1 | 0.81 (0.28, 84 % / 37 %) | 1.00 (0.50, 100 % / 0 %) | 0.68 (0.94, 37 % / 5 %) | 1.00 (0.02, 100 % / 0 %) | 0.83 (0.40, 84 % / 21 %) |
| jev-1.13.0 | griglia | 0.85 (0.33, 95 % / 37 %) | 1.00 (0.50, 100 % / 0 %) | 0.77 (0.86, 100 % / 47 %) | 1.00 (0.01, 100 % / 5 %) | 0.73 (0.32, 74 % / 32 %) |
| jev-1.14.0 | lati4 | 0.93 (0.14, 100 % / 32 %) | 1.00 (0.50, 100 % / 0 %) | 0.90 (0.43, 100 % / 21 %) | 1.00 (0.05, 100 % / 0 %) | 0.53 (0.34, 63 % / 47 %) |
| jev-1.14.0 | lato1 | 0.92 (0.15, 74 % / 5 %) | 1.00 (0.50, 100 % / 0 %) | 0.75 (0.44, 84 % / 26 %) | 1.00 (0.03, 100 % / 0 %) | 0.59 (0.39, 68 % / 42 %) |
| jev-1.14.0 | griglia | 0.97 (0.14, 100 % / 16 %) | 1.00 (0.50, 100 % / 0 %) | 0.95 (0.44, 89 % / 5 %) | 1.00 (0.04, 100 % / 0 %) | 0.59 (0.29, 84 % / 58 %) |

## Quale è migliore

Coppie: un edificio intero contro un suo difetto (in tutti e due gli ordini), e un edificio che passa il giudizio contro uno dello stesso bersaglio che non passa; il quattro: l'intero fra tre suoi difetti. «Coppie giuste in tutti e due gli ordini»: la stessa scelta comunque si presentino.

| modello | intero contro difetto | giudizio contro giudizio | coppie giuste in tutti e due gli ordini | sceglie A | uno su quattro |
|---|---|---|---|---|---|
| gemini-3.1-flash-lite | 25/38 (66 %) | 14/18 (78 %) | 16/28 | 63 % | 6/19 (32 %) |
| jev-1.13.0 | 31/38 (82 %) | 12/18 (67 %) | 18/28 | 52 % | 15/19 (79 %) |
| jev-1.14.0 | 30/38 (79 %) | 12/18 (67 %) | 16/28 | 61 % | 14/19 (74 %) |

## L'oggetto → il modello della libreria, con le foto

Gli stessi 37 casi di T313. `nomi8`: gli otto candidati che i nomi mettono prima (con quelli giusti), per nome; `foto8`: gli stessi otto, solo foto da quattro lati, chiavi opache; `foto50`: tutta la libreria (50 modelli del mondo), solo la foto del davanti. «Composta»: la scelta vale solo se `fits` ≥ 0,5, altrimenti «nuovo» (il companion Noul di T313).

| modello | forma | scelta | `fits` | composta | token in medi | $/1000 decisioni | ms mediana |
|---|---|---|---|---|---|---|---|
| jev-1.13.0 | foto50 | 70 % | 75 % | 68 % | 13675 | 0.2872 | 355 |
| jev-1.14.0 | foto50 | 68 % | 81 % | 68 % | 13675 | 0.2872 | 415 |
| gemini-3.1-flash-lite | foto8 | 86 % | 93 % | 86 % | 9301 | 1.3246 | 1639 |
| jev-1.13.0 | foto8 | 73 % | 81 % | 65 % | 6038 | 0.1268 | 259 |
| jev-1.14.0 | foto8 | 59 % | 86 % | 65 % | 6038 | 0.1268 | 337 |
| gemini-3.1-flash-lite | nomi8 | 95 % | 94 % | 95 % | 609 | 0.1759 | 986 |
| jev-1.13.0 | nomi8 | 86 % | 97 % | 97 % | 861 | 0.0181 | 167 |
| jev-1.14.0 | nomi8 | 86 % | 100 % | 100 % | 861 | 0.0181 | 166 |

## Quanto costa un'immagine

Le richieste dei difetti (lo stesso testo in ogni forma): pixel, token in ingresso e dollari, in mediana. Jev conta circa due token per riquadro di 28 × 28 pixel e un centinaio a immagine (≈ 390 pixel a token), al prezzo del testo (0,042 $ al milione); Gemini 3.1 Flash-Lite ~1100 token per foto qualunque sia la misura (0,25 $ al milione, più il ragionamento e l'uscita).

| modello | forma | pixel mediani | token in mediani | $ per richiesta (mediana) |
|---|---|---|---|---|
| gemini-3.1-flash-lite | lati4 | 419616 | 1394 | $0.000566 |
| jev-1.13.0 | lato1 | 110032 | 753 | $0.000032 |
| jev-1.13.0 | lati4 | 419616 | 1593 | $0.000067 |
| jev-1.13.0 | griglia | 431568 | 1581 | $0.000066 |
| jev-1.14.0 | lato1 | 110032 | 753 | $0.000032 |
| jev-1.14.0 | lati4 | 419616 | 1593 | $0.000067 |
| jev-1.14.0 | griglia | 431568 | 1581 | $0.000066 |

## Stabilità tra due giri

Le stesse richieste rifatte (il giro `…-ripeti`): risposte uguali, e di quanto si muove la probabilità di un sì (mediana, 90° percentile).

| modello | compito | risposte uguali | Δp mediana | Δp al 90 % |
|---|---|---|---|---|
| gemini-3.1-flash-lite | artista | 224/224 (100 %) | 0.00 | 0.00 |
| jev-1.13.0 | artista | 941/984 (96 %) | 0.01 | 0.02 |
| jev-1.13.0 | concetto | 28/28 (100 %) | — | — |
| jev-1.13.0 | confronto | 53/56 (95 %) | — | — |
| jev-1.13.0 | difetto | 558/570 (98 %) | 0.01 | 0.04 |
| jev-1.13.0 | migliore | 18/19 (95 %) | — | — |
| jev-1.13.0 | quarta-parete-foto | 127/134 (95 %) | 0.01 | 0.03 |
| jev-1.13.0 | riconosci | 50/50 (100 %) | — | — |
| jev-1.14.0 | artista | 935/984 (95 %) | 0.01 | 0.03 |
| jev-1.14.0 | concetto | 27/28 (96 %) | — | — |
| jev-1.14.0 | confronto | 56/56 (100 %) | — | — |
| jev-1.14.0 | difetto | 551/570 (97 %) | 0.01 | 0.04 |
| jev-1.14.0 | migliore | 16/19 (84 %) | — | — |
| jev-1.14.0 | quarta-parete-foto | 132/134 (99 %) | 0.01 | 0.07 |
| jev-1.14.0 | riconosci | 41/50 (82 %) | — | — |
