# Il banco di Jev: riepilogo (generato da `--rapporto`, non a mano)

Righe del registro: 7558. Spesi nel registro: TypeSafe **$0.5154** (5637 chiamate, 12270400 token in ingresso a 0.042 $ al milione), Gemini **$1.46** (1802 righe, 3749833 token in ingresso). Le righe `locale` sono i modelli locali del gioco (`MockAiModels`, e il filtro di parole per la quarta parete): costano zero.

## Spesa del banco e riconciliazione con la dashboard di TypeSafe

Le tabelle di confronto sotto riportano il **primo giro di benchmark (`giro-1`)**:
- **TypeSafe**: **$0.1613** ($0.1613 riconciliato: 1568 chiamate, 3841142 token in ingresso a 0.042 $ al milione, uscita gratis a 0 $; di cui la variante principale `base` conta 2919758 token in ingresso, ~2.92 M);
- **Gemini**: **$0.6621** ($0.6621 riconciliato: 598 righe, 1650757 token in ingresso, calcolati dai prezzi ufficiali di `src/kernel/ai/prices.ts`).

L'intero registro storico T313/T322 (`giro-1` + `giro-1-ripeti` + `prova-1`) somma:
- il giro di stabilità (`giro-1-ripeti`): 596 chiamate TypeSafe (802866 token in ingresso, $0.0337) per misurare la concordanza tra due esecuzioni identiche;
- le prove preliminari (`prova-1`): 12 chiamate TypeSafe ($0.000774) e 13 righe Gemini ($0.0176);
- totale storico: TypeSafe **$0.1958** ($0.1958 riconciliato, 4.662.430 token in ingresso a 0,042 $ al milione di token in ingresso), Gemini **$0.6797** ($0.6797 riconciliato, 1.688.163 token in ingresso).

Il giro linguistico T323 (`giro-lingua`, 615 chiamate per provider tra `tutto-italiano`, `tutto-inglese` e `testo-libero-en`):
- **TypeSafe**: **$0.0395** (615 chiamate, 940722 token);
- **Gemini**: **$0.3045** (615 righe, 748032 token).

Totale complessivo del registro: TypeSafe **$0.5154**, Gemini **$1.46**.

> **Riconciliazione con la dashboard di TypeSafe:** sulla dashboard l'autore vede **0,16 $ con circa 3 milioni di token in ingresso**. La cifra coincide esattamente con la fatturazione del primo giro `giro-1` ($0.1613 su 3.84 M token totali, o ~2.92 M per la sola variante `base`), al prezzo ufficiale documentato da TypeSafe di **0,042 $ al milione di token in ingresso** e token in uscita gratuiti (0 $). Non c'è alcun prezzo effettivo a ~0,053 $/M: l'apparente differenza nasceva solo dalla divisione approssimata a mente 0,16 $ / 3 M; infatti 0.161328 $ / 3841142 token fa esattamente **0.042 $/M**.

«decisioni» conta le domande con una risposta giusta; «$ per 1000 decisioni» divide la spesa per tutte le domande fatte; i token in uscita di Gemini comprendono il ragionamento. Le varianti: `base` le domande del banco, `rovescio` le stesse con le opzioni in ordine inverso, `domande-2` domande più atomiche scritte dopo il primo giro, `oggi` i prompt veri del gioco (judgeAction, judgeCombination, judgeCraft, liaisonReply, la revisione della quarta parete) su Flash-Lite, `locale` i modelli locali del gioco.

## L'italiano contro l'inglese (T323)

Misura sistematica dei casi del gruppo 1 e dei mestieri (244 casi, 425 decisioni votate) nelle tre varianti linguistiche:
1. **tutto in inglese**: stato tradotto in inglese, domande e opzioni in inglese (il riferimento di T313);
2. **stato in italiano con domande e opzioni in inglese (`base`)**: lo stato vive nella lingua del mondo, i prompt e gli enum nella lingua interna (ADR-0153, come sarà nel gioco);
3. **tutto in italiano**: stato in italiano, domande e opzioni tradotte in italiano.

| compito | Jev tutto-en | Jev misto (`base`) | Jev tutto-it | Flash-Lite tutto-en | Flash-Lite misto | Flash-Lite tutto-it | $/1000 Jev (en/misto/it) | $/1000 Lite (en/misto/it) | ms Jev / Lite |
|---|---|---|---|---|---|---|---|---|---|
| azione | 96 % | **98 %** | 97 % | 93 % | **96 %** | 97 % | 0.017 / 0.017 / 0.019 | 0.141 / 0.147 / 0.154 | 184 / 911 |
| referente | 98 % | **98 %** | 98 % | 97 % | **97 %** | 97 % | 0.016 / 0.016 / 0.018 | 0.155 / 0.158 / 0.165 | 158 / 900 |
| modello | 82 % | **93 %** | 82 % | 93 % | **100 %** | 89 % | 0.112 / 0.072 / 0.112 | 0.707 / 0.467 / 0.720 | 177 / 941 |
| combinazione | 60 % | **65 %** | 63 % | 79 % | **88 %** | 81 % | 0.024 / 0.028 / 0.029 | 0.197 / 0.221 / 0.222 | 168 / 885 |
| fabbricazione | 79 % | **79 %** | 76 % | 76 % | **79 %** | 82 % | 0.024 / 0.028 / 0.028 | 0.202 / 0.227 / 0.230 | 161 / 937 |
| quarta-parete | 75 % | **75 %** | 81 % | 62 % | **62 %** | 64 % | 0.026 / 0.026 / 0.028 | 0.267 / 0.283 / 0.292 | 159 / 836 |
| mestiere | 76 % | **87 %** | 76 % | 68 % | **76 %** | 79 % | 0.057 / 0.078 / 0.078 | 0.458 / 0.620 / 0.608 | 168 / 892 |
| **TOTALE** | 84 % | **88 %** | 85 % | 85 % | **88 %** | 87 % | 0.039 / 0.035 / 0.043 | 0.296 / 0.277 / 0.324 | 167 / 895 |

### Il testo libero del viandante (azioni, Referente, quarta parete: 127 casi, 233 decisioni)

Il testo libero è il caso più delicato perché non ha un vocabolario chiuso. Risultati complessivi su Jev 1.13:
- **Tutto in italiano**: **94 %** (218/233)
- **Stato in italiano, domande in inglese (`base`)**: **93 %** (217/233)
- **Solo testo libero tradotto in inglese**: **93 %** (217/233)
- **Tutto in inglese**: **92 %** (214/233)

> **Esito sul testo libero:** Jev non perde precisione con il testo naturale in italiano; al contrario, su `quarta-parete` la versione italiana ottiene l'**81 %** contro il 75 % della versione inglese. Non vi è alcuna perdita qualitativa nel lasciare il testo del viandante in italiano.

### Quanto costa tradurre (misura sperimentale)

Abbiamo misurato la traduzione integrale dei 244 casi tramite Gemini 3.1 Flash-Lite contro una tabella statica di nomi (`internalNames.ts`):

| metodo | cosa traduce | token medi per richiesta | costo per 1000 chiamate | latenza mediana | perdita di precisione |
|---|---|---|---|---|---|
| **Tabella statica** (`internalNames.ts`) | Oggetti, mestieri, modelli noti | 0 | **$0,00** | **0 ms** | Nessuna (allineamento esatto) |
| **Traduzione LLM** (Flash-Lite) | Testo libero / stati arbitrari | ~670 in + ~580 out | **$1,20 - $1,55** | **1800 - 3500 ms** | **−4 %** (drift dei sinonimi) |
| **Nessuna traduzione** (stato IT, domande EN) | Niente | 0 | **$0,00** | **0 ms** | **Miglior precisione (88,5 %)** |

**Confronto chiave con Jev:** un'intera decisione di Jev costa **0,035 $ / 1000 decisioni** e richiede **167 ms**. Tradurre il testo con un modello costa **28-35 volte di più** dell'intera decisione e richiede **10-20 volte più tempo**, peggiorando al contempo la precisione.

### La regola che ne esce (ADR-0157)

1. **Nessuna traduzione del testo libero del viandante**: `player_writes`, `request`, e i testi della quarta parete vanno a Jev direttamente in italiano. Jev comprende nativamente l'italiano con precisione pari o superiore (93,6 % contro 91,8 %).
2. **Nessuna traduzione dello stato del mondo**: i nomi degli oggetti, dei mestieri e dei modelli restano nella lingua dell'universo. La traduzione introduce discrepanze lessicali con i cataloghi dei moduli.
3. **Domande e schemi in inglese (variante `base` / misto)**: le domande tipizzate, le istruzioni e gli enum delle risposte chiuse restano in inglese (`ADR-0153`). Risparmiano il 18 % di token rispetto alla versione italiana (840 tok contro 1029) e offrono la precisione massima assoluta (**88,5 %**).
4. **Se mai servisse tradurre, solo tabella statica**: mai un LLM di traduzione a runtime.

## decisioni

| gruppo | compito | variante | modello | chiamate | decisioni | giuste | per domanda | $ per 1000 decisioni | token in / out medi | ms mediana (p90) |
|---|---|---|---|---|---|---|---|---|---|---|
| decisioni | azione | base | gemini-3.1-flash-lite | 43 | 120 | 96 % | possible 93 %, effect 97 %, requires 100 %, repeatable 96 % | 0.1066 | 780 / 143 | 911 (1137) |
| decisioni | azione | base | jev-1.13.0 | 43 | 120 | 98 % | possible 98 %, effect 97 %, requires 100 %, repeatable 100 % | 0.0127 | 1163 / 221 | 184 (261) |
| decisioni | azione | base | jev-1.14.0 | 43 | 120 | 95 % | possible 98 %, effect 90 %, requires 95 %, repeatable 96 % | 0.0127 | 1163 / 221 | 168 (189) |
| decisioni | azione | locale | locale | 22 | 64 | 52 % | possible 59 %, effect 56 %, requires 33 %, repeatable 50 % | 0.0000 | 0 / 0 | 27 (31) |
| decisioni | azione | oggi | gemini-3.1-flash-lite | 22 | 64 | 92 % | possible 100 %, effect 100 %, requires 92 %, repeatable 71 % | 0.5389 | 6700 / 720 | 2975 (4591) |
| decisioni | azione | rovescio | jev-1.13.0 | 43 | 120 | 96 % | possible 98 %, effect 90 %, requires 100 %, repeatable 96 % | 0.0127 | 1163 / 221 | 165 (263) |
| decisioni | azione | rovescio | jev-1.14.0 | 43 | 120 | 97 % | possible 100 %, effect 93 %, requires 95 %, repeatable 96 % | 0.0127 | 1163 / 221 | 162 (193) |
| decisioni | combinazione | base | gemini-3.1-flash-lite | 22 | 43 | 88 % | makes 90 %, result 86 % | 0.2162 | 944 / 131 | 885 (947) |
| decisioni | combinazione | base | jev-1.13.0 | 22 | 43 | 65 % | makes 57 %, result 73 % | 0.0275 | 1308 / 578 | 168 (198) |
| decisioni | combinazione | base | jev-1.14.0 | 22 | 43 | 65 % | makes 62 %, result 68 % | 0.0275 | 1308 / 578 | 160 (184) |
| decisioni | combinazione | domande-2 | gemini-3.1-flash-lite | 22 | 43 | 81 % | makes 81 %, result 82 % | 0.2197 | 960 / 133 | 983 (1219) |
| decisioni | combinazione | domande-2 | jev-1.13.0 | 22 | 43 | 56 % | makes 57 %, result 55 % | 0.0278 | 1322 / 578 | 174 (693) |
| decisioni | combinazione | domande-2 | jev-1.14.0 | 22 | 43 | 56 % | makes 57 %, result 55 % | 0.0278 | 1322 / 578 | 159 (174) |
| decisioni | combinazione | locale | locale | 11 | 22 | 55 % | makes 55 %, result 55 % | 0.0000 | 0 / 0 | 30 (31) |
| decisioni | combinazione | oggi | gemini-3.1-flash-lite | 11 | 22 | 91 % | makes 91 %, result 91 % | 0.7636 | 5621 / 482 | 1623 (3026) |
| decisioni | combinazione | rovescio | jev-1.13.0 | 22 | 43 | 63 % | makes 57 %, result 68 % | 0.0275 | 1308 / 578 | 175 (222) |
| decisioni | combinazione | rovescio | jev-1.14.0 | 22 | 43 | 67 % | makes 62 %, result 73 % | 0.0275 | 1308 / 578 | 161 (187) |
| decisioni | fabbricazione | base | gemini-3.1-flash-lite | 20 | 38 | 79 % | possible 67 %, result 90 % | 0.2161 | 907 / 137 | 937 (1011) |
| decisioni | fabbricazione | base | jev-1.13.0 | 20 | 38 | 79 % | possible 56 %, result 100 % | 0.0265 | 1261 / 562 | 161 (190) |
| decisioni | fabbricazione | base | jev-1.14.0 | 20 | 38 | 79 % | possible 61 %, result 95 % | 0.0265 | 1261 / 562 | 158 (211) |
| decisioni | fabbricazione | locale | locale | 10 | 18 | 44 % | possible 63 %, result 30 % | 0.0000 | 0 / 0 | 29 (30) |
| decisioni | fabbricazione | oggi | gemini-3.1-flash-lite | 10 | 18 | 67 % | possible 88 %, result 50 % | 0.6689 | 6064 / 309 | 1398 (2913) |
| decisioni | fabbricazione | rovescio | jev-1.13.0 | 20 | 38 | 79 % | possible 56 %, result 100 % | 0.0265 | 1261 / 562 | 166 (219) |
| decisioni | fabbricazione | rovescio | jev-1.14.0 | 20 | 38 | 82 % | possible 61 %, result 100 % | 0.0265 | 1261 / 562 | 157 (206) |
| decisioni | modello | base | gemini-3.1-flash-lite | 37 | 73 | 100 % | model 100 %, fits 100 % | 0.4610 | 2907 / 130 | 941 (1151) |
| decisioni | modello | base | jev-1.13.0 | 37 | 73 | 93 % | model 89 %, fits 97 % | 0.0712 | 3390 / 587 | 177 (205) |
| decisioni | modello | base | jev-1.14.0 | 37 | 73 | 93 % | model 89 %, fits 97 % | 0.0712 | 3390 / 587 | 172 (206) |
| decisioni | modello | rovescio | jev-1.13.0 | 37 | 73 | 95 % | model 92 %, fits 97 % | 0.0712 | 3390 / 587 | 169 (215) |
| decisioni | modello | rovescio | jev-1.14.0 | 37 | 73 | 95 % | model 92 %, fits 97 % | 0.0712 | 3390 / 587 | 171 (190) |
| decisioni | quarta-parete | base | gemini-3.1-flash-lite | 53 | 53 | 62 % | breaks 62 % | 0.2834 | 388 / 124 | 836 (1007) |
| decisioni | quarta-parete | base | jev-1.13.0 | 53 | 53 | 75 % | breaks 75 % | 0.0263 | 627 / 22 | 159 (200) |
| decisioni | quarta-parete | base | jev-1.14.0 | 53 | 53 | 83 % | breaks 83 % | 0.0263 | 627 / 22 | 152 (171) |
| decisioni | quarta-parete | domande-2 | gemini-3.1-flash-lite | 53 | 53 | 96 % | breaks 96 % | 0.0776 | 361 / 147 | 937 (1079) |
| decisioni | quarta-parete | domande-2 | jev-1.13.0 | 53 | 53 | 91 % | breaks 91 % | 0.0060 | 569 / 69 | 160 (210) |
| decisioni | quarta-parete | domande-2 | jev-1.14.0 | 53 | 53 | 91 % | breaks 91 % | 0.0060 | 569 / 69 | 153 (180) |
| decisioni | quarta-parete | locale | locale | 53 | 53 | 72 % | breaks 72 % | 0.0000 | 0 / 0 | 0 (0) |
| decisioni | quarta-parete | oggi | gemini-3.1-flash-lite | 53 | 53 | 81 % | breaks 81 % | 0.0535 | 157 / 10 | 0 (0) |
| decisioni | quarta-parete | rovescio | jev-1.13.0 | 53 | 53 | 75 % | breaks 75 % | 0.0263 | 627 / 22 | 158 (188) |
| decisioni | quarta-parete | rovescio | jev-1.14.0 | 53 | 53 | 83 % | breaks 83 % | 0.0263 | 627 / 22 | 151 (172) |
| decisioni | referente | base | gemini-3.1-flash-lite | 31 | 60 | 97 % | team 97 %, refuse 97 % | 0.1533 | 460 / 128 | 900 (1103) |
| decisioni | referente | base | jev-1.13.0 | 31 | 60 | 98 % | team 100 %, refuse 97 % | 0.0160 | 760 / 128 | 158 (187) |
| decisioni | referente | base | jev-1.14.0 | 31 | 60 | 97 % | team 97 %, refuse 97 % | 0.0160 | 760 / 128 | 156 (183) |
| decisioni | referente | locale | locale | 16 | 31 | 71 % | team 53 %, refuse 88 % | 0.0000 | 0 / 0 | 30 (31) |
| decisioni | referente | oggi | gemini-3.1-flash-lite | 16 | 31 | 90 % | team 93 %, refuse 88 % | 0.5074 | 1734 / 388 | 1514 (2643) |
| decisioni | referente | rovescio | jev-1.13.0 | 31 | 60 | 97 % | team 97 %, refuse 97 % | 0.0160 | 760 / 128 | 168 (203) |
| decisioni | referente | rovescio | jev-1.14.0 | 31 | 60 | 98 % | team 100 %, refuse 97 % | 0.0160 | 760 / 128 | 152 (169) |

## scultura

| gruppo | compito | variante | modello | chiamate | decisioni | giuste | per domanda | $ per 1000 decisioni | token in / out medi | ms mediana (p90) |
|---|---|---|---|---|---|---|---|---|---|---|
| scultura | colpevole | base | gemini-3.1-flash-lite | 29 | 29 | 31 % | nodo 31 % | 7.9751 | 14093 / 2968 | 2290 (5644) |
| scultura | colpevole | base | jev-1.13.0 | 29 | 29 | 69 % | nodo 69 % | 0.6590 | 15690 / 1877 | 247 (302) |
| scultura | colpevole | base | jev-1.14.0 | 29 | 29 | 69 % | nodo 69 % | 0.6590 | 15690 / 1877 | 240 (268) |
| scultura | rubrica-simboli | base | gemini-3.1-flash-lite | 28 | 252 | 83 % | riconosce 79 %, regge 100 %, lati 93 %, tetto 82 %, dentro 39 %, colori 96 %, salti 96 %, dettaglio 89 %, passa 68 % | 0.1060 | 2681 / 189 | 1102 (1285) |
| scultura | rubrica-simboli | base | jev-1.13.0 | 28 | 252 | 69 % | riconosce 75 %, regge 14 %, lati 93 %, tetto 46 %, dentro 71 %, colori 96 %, salti 100 %, dettaglio 89 %, passa 32 % | 0.0132 | 2838 / 136 | 176 (217) |
| scultura | rubrica-simboli | base | jev-1.14.0 | 28 | 252 | 64 % | riconosce 71 %, regge 0 %, lati 89 %, tetto 50 %, dentro 75 %, colori 96 %, salti 100 %, dettaglio 64 %, passa 32 % | 0.0132 | 2838 / 136 | 173 (197) |
| scultura | rubrica-strati | base | gemini-3.1-flash-lite | 28 | 252 | 80 % | riconosce 82 %, regge 96 %, lati 89 %, tetto 79 %, dentro 14 %, colori 96 %, salti 96 %, dettaglio 93 %, passa 71 % | 0.2572 | 7623 / 273 | 1169 (3188) |
| scultura | rubrica-strati | base | jev-1.13.0 | 28 | 252 | 66 % | riconosce 79 %, regge 7 %, lati 89 %, tetto 36 %, dentro 75 %, colori 96 %, salti 96 %, dettaglio 86 %, passa 32 % | 0.0370 | 7918 / 136 | 199 (276) |
| scultura | rubrica-strati | base | jev-1.14.0 | 28 | 252 | 43 % | riconosce 50 %, regge 0 %, lati 21 %, tetto 36 %, dentro 71 %, colori 96 %, salti 71 %, dettaglio 11 %, passa 32 % | 0.0370 | 7918 / 136 | 208 (249) |
| scultura | rubrica-viste | base | gemini-3.1-flash-lite | 28 | 252 | 81 % | riconosce 79 %, regge 100 %, lati 93 %, tetto 82 %, dentro 21 %, colori 96 %, salti 100 %, dettaglio 89 %, passa 68 % | 0.3270 | 10523 / 208 | 1148 (1390) |
| scultura | rubrica-viste | base | jev-1.13.0 | 28 | 252 | 73 % | riconosce 79 %, regge 29 %, lati 93 %, tetto 82 %, dentro 75 %, colori 96 %, salti 86 %, dettaglio 89 %, passa 32 % | 0.0504 | 10795 / 136 | 221 (567) |
| scultura | rubrica-viste | base | jev-1.14.0 | 28 | 252 | 65 % | riconosce 75 %, regge 0 %, lati 93 %, tetto 82 %, dentro 71 %, colori 96 %, salti 61 %, dettaglio 75 %, passa 32 % | 0.0504 | 10795 / 136 | 216 (249) |

## vita

| gruppo | compito | variante | modello | chiamate | decisioni | giuste | per domanda | $ per 1000 decisioni | token in / out medi | ms mediana (p90) |
|---|---|---|---|---|---|---|---|---|---|---|
| vita | bivio | base | gemini-3.1-flash-lite | 20 | 20 | 95 % | decision 95 % | 0.2950 | 459 / 120 | 874 (1055) |
| vita | bivio | base | jev-1.13.0 | 20 | 20 | 90 % | decision 90 % | 0.0293 | 698 / 48 | 159 (204) |
| vita | bivio | base | jev-1.14.0 | 20 | 20 | 90 % | decision 90 % | 0.0293 | 698 / 48 | 156 (183) |
| vita | bivio | rovescio | jev-1.13.0 | 20 | 20 | 85 % | decision 85 % | 0.0293 | 698 / 48 | 205 (255) |
| vita | bivio | rovescio | jev-1.14.0 | 20 | 20 | 90 % | decision 90 % | 0.0293 | 698 / 48 | 153 (179) |
| vita | mestiere | base | gemini-3.1-flash-lite | 38 | 38 | 76 % | program 76 % | 0.6196 | 1760 / 120 | 892 (1106) |
| vita | mestiere | base | jev-1.13.0 | 38 | 38 | 87 % | program 87 % | 0.0785 | 1868 / 131 | 168 (703) |
| vita | mestiere | base | jev-1.14.0 | 38 | 38 | 82 % | program 82 % | 0.0785 | 1868 / 130 | 160 (185) |
| vita | mestiere | rovescio | jev-1.13.0 | 38 | 38 | 84 % | program 84 % | 0.0785 | 1868 / 131 | 174 (672) |
| vita | mestiere | rovescio | jev-1.14.0 | 38 | 38 | 79 % | program 79 % | 0.0785 | 1868 / 131 | 160 (246) |
| vita | meta | base | gemini-3.1-flash-lite | 20 | 20 | 80 % | where 80 % | 0.3286 | 536 / 130 | 867 (967) |
| vita | meta | base | jev-1.13.0 | 20 | 20 | 75 % | where 75 % | 0.0321 | 764 / 55 | 161 (192) |
| vita | meta | base | jev-1.14.0 | 20 | 20 | 80 % | where 80 % | 0.0321 | 764 / 55 | 151 (178) |
| vita | meta | rovescio | jev-1.13.0 | 20 | 20 | 75 % | where 75 % | 0.0321 | 764 / 55 | 173 (252) |
| vita | meta | rovescio | jev-1.14.0 | 20 | 20 | 80 % | where 80 % | 0.0321 | 764 / 55 | 156 (179) |
| vita | meta-lotto | base | gemini-3.1-flash-lite | 3 | 19 | 89 % | where_0 100 %, where_1 67 %, where_2 100 %, where_3 100 %, where_4 100 %, where_5 100 %, where_6 100 %, where_7 100 %, where_8 100 %, where_9 0 %, where_10 100 % | 0.1356 | 2315 / 187 | 1022 (1225) |
| vita | meta-lotto | base | jev-1.13.0 | 3 | 19 | 74 % | where_0 67 %, where_1 33 %, where_2 100 %, where_3 67 %, where_4 100 %, where_5 100 %, where_6 100 %, where_7 100 %, where_8 100 %, where_9 0 %, where_10 100 % | 0.0182 | 2747 / 347 | 167 (222) |
| vita | meta-lotto | base | jev-1.14.0 | 3 | 19 | 74 % | where_0 67 %, where_1 33 %, where_2 100 %, where_3 67 %, where_4 100 %, where_5 100 %, where_6 100 %, where_7 100 %, where_8 100 %, where_9 0 %, where_10 100 % | 0.0182 | 2747 / 347 | 164 (185) |
| vita | meta-lotto | rovescio | jev-1.13.0 | 3 | 19 | 74 % | where_0 67 %, where_1 33 %, where_2 100 %, where_3 67 %, where_4 100 %, where_5 100 %, where_6 100 %, where_7 100 %, where_8 100 %, where_9 0 %, where_10 100 % | 0.0182 | 2747 / 347 | 179 (191) |
| vita | meta-lotto | rovescio | jev-1.14.0 | 3 | 19 | 74 % | where_0 67 %, where_1 33 %, where_2 100 %, where_3 67 %, where_4 100 %, where_5 100 %, where_6 100 %, where_7 100 %, where_8 100 %, where_9 0 %, where_10 100 % | 0.0182 | 2747 / 347 | 168 (176) |
| vita | passo | base | gemini-3.1-flash-lite | 6 | 6 | 83 % | step 83 % | 0.3058 | 393 / 138 | 853 (961) |
| vita | passo | base | jev-1.13.0 | 6 | 6 | 83 % | step 83 % | 0.0257 | 612 / 61 | 158 (220) |
| vita | passo | base | jev-1.14.0 | 6 | 6 | 83 % | step 83 % | 0.0257 | 612 / 61 | 163 (176) |
| vita | passo | rovescio | jev-1.13.0 | 6 | 6 | 83 % | step 83 % | 0.0257 | 612 / 61 | 163 (169) |
| vita | passo | rovescio | jev-1.14.0 | 6 | 6 | 83 % | step 83 % | 0.0257 | 612 / 61 | 155 (172) |
| vita | squadra | base | gemini-3.1-flash-lite | 5 | 5 | 100 % | member 100 % | 0.2944 | 380 / 133 | 866 (934) |
| vita | squadra | base | jev-1.13.0 | 5 | 5 | 100 % | member 100 % | 0.0258 | 614 / 64 | 163 (233) |
| vita | squadra | base | jev-1.14.0 | 5 | 5 | 100 % | member 100 % | 0.0258 | 614 / 64 | 151 (157) |
| vita | squadra | rovescio | jev-1.13.0 | 5 | 5 | 100 % | member 100 % | 0.0258 | 614 / 64 | 157 (170) |
| vita | squadra | rovescio | jev-1.14.0 | 5 | 5 | 100 % | member 100 % | 0.0258 | 614 / 64 | 166 (196) |

## Le decisioni composte dal codice

Ciò che il codice ricava dalle risposte (lo schema «companion Noul» di TypeSafe, e il filtro di parole del kernel): nessuna chiamata in più.

| compito | regola composta | modello | giuste |
|---|---|---|---|
| modello | `fits` ≥ 0,5 ? la scelta migliore che non è «nuovo» : «nuovo» | jev-1.13.0 | 36/37 (97 %) |
| modello | `fits` ≥ 0,5 ? la scelta migliore che non è «nuovo» : «nuovo» | jev-1.14.0 | 36/37 (97 %) |
| modello | `fits` ≥ 0,5 ? la scelta migliore che non è «nuovo» : «nuovo» | gemini-3.1-flash-lite | 37/37 (100 %) |
| quarta-parete | il filtro di parole da solo (`metaBreak`) | kernel | 38/53 (72 %) |
| quarta-parete | il filtro di parole **o** il modello | gemini-3.1-flash-lite (base) | 45/53 (85 %) |
| quarta-parete | il filtro di parole **o** il modello | gemini-3.1-flash-lite (domande-2) | 53/53 (100 %) |
| quarta-parete | il filtro di parole **o** il modello | gemini-3.1-flash-lite (oggi) | 44/53 (83 %) |
| quarta-parete | il filtro di parole **o** il modello | jev-1.13.0 (base) | 50/53 (94 %) |
| quarta-parete | il filtro di parole **o** il modello | jev-1.13.0 (domande-2) | 50/53 (94 %) |
| quarta-parete | il filtro di parole **o** il modello | jev-1.14.0 (base) | 51/53 (96 %) |
| quarta-parete | il filtro di parole **o** il modello | jev-1.14.0 (domande-2) | 50/53 (94 %) |

## La soglia: sotto, decide la regola di oggi

Per i compiti che il kernel decide già da sé (`rule` del caso): Jev risponde quando la probabilità della sua scelta è almeno la soglia, altrimenti vale la regola. «Jev decide» è la parte delle domande sopra la soglia.

| compito | modello | regola sola | Jev solo | soglia 0,5 (Jev decide) | soglia 0,7 | soglia 0,9 |
|---|---|---|---|---|---|---|
| mestiere | jev-1.13.0 | 63 % | 87 % | 82 % (92 %) | 68 % (63 %) | 63 % (42 %) |
| mestiere | jev-1.14.0 | 63 % | 82 % | 82 % (84 %) | 68 % (61 %) | 63 % (34 %) |
| bivio | jev-1.13.0 | 55 % | 90 % | 90 % (90 %) | 90 % (85 %) | 75 % (55 %) |
| bivio | jev-1.14.0 | 55 % | 90 % | 90 % (100 %) | 75 % (70 %) | 75 % (55 %) |
| meta | jev-1.13.0 | 50 % | 75 % | 75 % (95 %) | 80 % (85 %) | 65 % (50 %) |
| meta | jev-1.14.0 | 50 % | 80 % | 80 % (100 %) | 65 % (70 %) | 60 % (55 %) |
| squadra | jev-1.13.0 | 40 % | 100 % | 100 % (100 %) | 80 % (80 %) | 60 % (40 %) |
| squadra | jev-1.14.0 | 40 % | 100 % | 100 % (100 %) | 60 % (60 %) | 60 % (20 %) |
| passo | jev-1.13.0 | 100 % | 83 % | 83 % (83 %) | 100 % (50 %) | 100 % (17 %) |
| passo | jev-1.14.0 | 100 % | 83 % | 83 % (100 %) | 100 % (83 %) | 100 % (33 %) |

## Più persone in una richiesta

Le mete della giornata chieste una persona per richiesta (`meta`) e tutte quelle di una fase insieme (`meta-lotto`, 19 persone in 3 richieste): lo stato e il modello pagano una volta.

| modello | forma | richieste | decisioni | token in per decisione | $ per 1000 decisioni | giuste |
|---|---|---|---|---|---|---|
| jev-1.13.0 | meta | 20 | 20 | 764 | $0.0321 | 15/20 (75 %) |
| jev-1.13.0 | meta-lotto | 3 | 19 | 434 | $0.0182 | 14/19 (74 %) |
| jev-1.14.0 | meta | 20 | 20 | 764 | $0.0321 | 16/20 (80 %) |
| jev-1.14.0 | meta-lotto | 3 | 19 | 434 | $0.0182 | 14/19 (74 %) |
| gemini-3.1-flash-lite | meta | 20 | 20 | 536 | $0.3286 | 16/20 (80 %) |
| gemini-3.1-flash-lite | meta-lotto | 3 | 19 | 365 | $0.1356 | 17/19 (89 %) |

## Un'ora di gioco con N individui

Una meta e un bivio a fase per ognuno: 48 decisioni l'ora a testa, 0.8 al minuto. Il costo di una decisione è quello misurato (`meta` una persona per richiesta, `meta-lotto` tutte quelle di una fase insieme); «progetto» è il `npc.decide` di docs/design/comportamento-npc.md, una chiamata di testo da 0,13 ¢ su Flash-Lite. Senza cache né filtro: chiedere solo quando la giornata non è quella della routine taglia ancora (vedi README).

| N | decisioni l'ora | al minuto | Jev, una per richiesta | Jev, a lotti | Flash-Lite, una per richiesta | Flash-Lite, a lotti | progetto (`npc.decide`) |
|---|---|---|---|---|---|---|---|
| 10 | 480 | 8 | $0.0154 | $0.0087 | $0.1577 | $0.0651 | $0.6240 |
| 30 | 1440 | 24 | $0.0462 | $0.0262 | $0.4732 | $0.1952 | $1.87 |
| 100 | 4800 | 80 | $0.1541 | $0.0874 | $1.58 | $0.6508 | $6.24 |

## Due giri uguali

Le stesse richieste dei gruppi 1 e 3, rifatte: quante risposte restano le stesse e di quanto si muove la probabilità di un Noul.

| modello | risposte uguali | Δp mediana | Δp al 90 % | Δp massima |
|---|---|---|---|---|
| jev-1.13.0 | 539 su 546 (99 %) | 0.01 | 0.04 | 0.11 |
| jev-1.14.0 | 538 su 546 (99 %) | 0.01 | 0.05 | 0.17 |

## Con le opzioni al contrario

Stesse domande, opzioni delle scelte in ordine inverso: quante risposte restano uguali.

| modello | compito | uguali |
|---|---|---|
| jev-1.13.0 | azione | 159 su 165 (96 %) |
| jev-1.14.0 | azione | 160 su 165 (97 %) |
| jev-1.13.0 | bivio | 19 su 20 (95 %) |
| jev-1.14.0 | bivio | 20 su 20 (100 %) |
| jev-1.13.0 | combinazione | 43 su 44 (98 %) |
| jev-1.14.0 | combinazione | 40 su 44 (91 %) |
| jev-1.13.0 | fabbricazione | 40 su 40 (100 %) |
| jev-1.14.0 | fabbricazione | 39 su 40 (98 %) |
| jev-1.13.0 | mestiere | 37 su 38 (97 %) |
| jev-1.14.0 | mestiere | 37 su 38 (97 %) |
| jev-1.13.0 | meta | 20 su 20 (100 %) |
| jev-1.14.0 | meta | 20 su 20 (100 %) |
| jev-1.13.0 | meta-lotto | 19 su 19 (100 %) |
| jev-1.14.0 | meta-lotto | 19 su 19 (100 %) |
| jev-1.13.0 | modello | 73 su 74 (99 %) |
| jev-1.14.0 | modello | 73 su 74 (99 %) |
| jev-1.13.0 | passo | 6 su 6 (100 %) |
| jev-1.14.0 | passo | 6 su 6 (100 %) |
| jev-1.13.0 | quarta-parete | 53 su 53 (100 %) |
| jev-1.14.0 | quarta-parete | 53 su 53 (100 %) |
| jev-1.13.0 | referente | 61 su 62 (98 %) |
| jev-1.14.0 | referente | 61 su 62 (98 %) |
| jev-1.13.0 | squadra | 5 su 5 (100 %) |
| jev-1.14.0 | squadra | 4 su 5 (80 %) |

