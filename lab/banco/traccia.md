# La traccia di un programma, in testo (T179)

Chi scrive un programma vede solo il risultato: le foto dicono cosa è venuto fuori, non cosa hanno fatto `one all prl convolution path` passo per passo.
La traccia lo dice in testo, senza immagini e senza chiamate: `src/mj/trace.ts` (ADR-0118), sul motore vero, osservato.

```bash
npx vite-node lab/scripts/mjx-trace.ts -- lab/banco/conferma/moderna/1/modello.xml --bersaglio moderna           # la predefinita
npx vite-node lab/scripts/mjx-trace.ts -- modello.xml --size "33 33 17" --forma sezioni --passo 120 --tetto 2000 # un'altra forma, un fotogramma scelto
npx vite-node lab/scripts/mjx-trace.ts -- --confronto                                                            # la tabella qui sotto
npx vite-node lab/scripts/mjx-trace-prova.ts                                                                     # la prova cieca (consuma l'abbonamento)
npx vite-node lab/scripts/banco-strutture.ts -- --seconda --giro <giro> --traccia [--tetto 4000]                 # nella seconda richiesta
```

## Che cosa dice

Sempre: griglia, passi, se ha finito, quante celle per lettera alla fine e, **per ogni nodo eseguito**, il tipo, la regola, quante volte ha agito, quante celle ha cambiato, la
scatola di ciò che ha cambiato, i passi e, se ha più regole, quante volte si è applicata ognuna. In fondo i nodi senza effetto, con il perché quando il motore lo sa. Un **fotogramma** è un
passo: la griglia dopo quei passi. Le forme aggiungono:

| forma | cosa aggiunge | esempio |
|---|---|---|
| `nodi` | niente | `#5 all .../.W. → .W./.W. (+2): ×34, 14048 celle x1-27 y1-27 z1-27, passi 103-136` |
| (a) `sezioni` | le sezioni di un fotogramma, piano per piano, con le lettere di MarkovJunior | `z0-1:` / `y1-3 . R×3 .` |
| (b) `differenze` | fra un gruppo di nodi e il successivo, per coppia di lettere, le celle e le scatole (al più 4, le più grandi); un'unità di almeno 32 passi anche per quarti | `.→W 4397: x2-4 y4 z9-19; …; +1083 scatole, 4299 celle` |
| (c) `scatole` | un fotogramma come modello statico, la proposta dell'autore: i voxel di ogni lettera in scatole che non si sovrappongono | `R 18: x1-3 y1-3 z0-1` |

## I numeri

Token **stimati** (`estimateTokens`) sul fotogramma finale, seme 1. Le colonne (a) e (c) sono il solo fotogramma, senza tetto; la (b) è la traccia intera, nodi compresi, senza tetto ma con al più 4 scatole per coppia di lettere.

| modello | passi | nodi | (a) sezioni grezze | (a) sezioni piegate | (b) differenze | (c) scatole | ms |
|---|---|---|---|---|---|---|---|
| futuristica | 113 | 121 | 424804 | 26557 | 10944 | 6526 | 209 |
| locanda | 171 | 187 | 523880 | 37219 | 15966 | 7647 | 232 |
| moderna | 114 | 120 | 421889 | 18139 | 9831 | 3892 | 234 |
| pagoda | 208 | 210 | 429918 | 38540 | 17611 | 8189 | 159 |
| rocca | 336 | 351 | 698334 | 69520 | 29406 | 10866 | 280 |
| steampunk | 256 | 258 | 429708 | 89017 | 26655 | 26887 | 215 |
| tempio | 170 | 175 | 430668 | 27463 | 15524 | 4787 | 184 |
| Growth | 24388 | 1 | 15468 | 19 | 618 | 23 | 57 |
| ParallelGrowth | 42 | 1 | 15468 | 19 | 574 | 23 | 35 |
| MazeGrowth | 2196 | 1 | 18304 | 15976 | 756 | 43062 | 9 |
| MazeTrail | 4489993 | 1 | 18364 | 15335 | 559 | 20968 | 20001 |
| NoDeadEnds | 729 | 5 | 6942 | 5717 | 1141 | 14854 | 11 |
| RegularSAW | 267 | 1 | 5896 | 2732 | 681 | 2544 | 2 |
| RegularSAWRestart | 728 | 3 | 6935 | 5649 | 1045 | 14290 | 71 |
| OpenCave3D | 57 | 4 | 39060 | 14327 | 1139 | 11009 | 786 |
| Hills | 8017 | 5 | 11653 | 1514 | 1053 | 1514 | 155 |
| River | 13876 | 11 | 5493 | 6471 | 2901 | 11913 | 40 |
| Voronoi | 68 | 4 | 118174 | 30322 | 1204 | 44918 | 698 |
| StochasticVoronoi | 125000 | 4 | 68614 | 28395 | 1265 | 60704 | 409 |
| StrangeDungeon | 146 | 7 | 19543 | 14072 | 1560 | 11044 | 174 |
| Noise | 12674 | 4 | 9362 | 1990 | 1151 | 2158 | 41 |
| Counting | 1 | 1 | 492 | 128 | 520 | 356 | 1 |
| OddScale3D | 3247 | 12 | 62452 | 41323 | 1549 | 62702 | 102 |

I primi sette sono i modelli di `conferma/` (tentativo 1), gli altri i modelli ufficiali di MarkovJunior. `MazeTrail` ha esaurito i 20 s della traccia.

Si legge così:

- **(a) grezze sono impossibili** (oltre 420 mila token per un edificio): piegare file, righe e piani uguali toglie il 79-96 % sui modelli di `conferma/`, ma ne restano 18-89 mila. Sotto un tetto si perdono piani interi.
- **(c) è la più corta per un modello fatto di `box`** (moderna 3892 contro 18139 delle sezioni piegate) **e la più lunga per un programma di regole** (OddScale3D 62702, StochasticVoronoi 60704, MazeGrowth 43062): il rumore fa quasi una scatola per voxel. E non dice nulla dell'ordine: è una foto in testo.
- **(b) dipende dai nodi, non dalla griglia**: 520-2900 token sui programmi di regole, qualunque cosa generino. Sui modelli di `conferma/` ne costa 10-29 mila senza tetto perché quei programmi sono centinaia di `box`, e lì il tetto fonde i `box` vicini.

**I token reali.** La stima gira offline. Contro i token che il modello ha davvero contato (colonna `token reali` di `traccia-prova/riepilogo.md`, la base senza traccia sottratta) sta sopra del 5-25 % in tutte le otto tracce misurate. La prima versione stava sotto (il reale era il 20-36 % in più): da lì `TOKEN_SCALE`. Otto misure su due programmi: il margine non è garantito su altri testi.

## Ciò che fanno capire: la prova cieca

Stesse sei domande per programma, con la risposta calcolata dalla griglia, a `claude -p` Sonnet isolato (`lab/banco/claude.ts`), con il programma e una forma al tetto di 4000 stimati. Testi e risposte in `traccia-prova/`. Il punteggio è mio, leggendo `riepilogo.md`; «non si può» conta come non risposta.

| domanda | nodi | (a) | (b) | (c) |
|---|---|---|---|---|
| **StrangeDungeon: regole, 7 nodi** | | | | |
| quale regola di #5 più volte, e quante | sì | sì | sì | sì |
| quante volte ha agito #7 | sì | sì | sì | sì |
| #5 cambia di più nella prima o nella seconda metà | no | no | **sì** | no |
| lettera finale in una cella vuota | no | no | no | no |
| lettera finale in una cella piena | no | no | no | **sì** |
| quante W alla fine | sì | sì | sì | sì |
| **moderna: 120 nodi, quasi tutti `box`** | | | | |
| quale nodo cambia più celle, e quante | sì | sì | sì | sì |
| quale nodo mette R su L | sì | no | sì | sì |
| quanti nodi senza effetto | sì | sì | sì | sì |
| lettera finale in una cella (prima) | sì | sì | sì | sì |
| lettera finale in una cella (seconda) | sì | sì | sì | sì |
| quante V alla fine | sì | sì | sì | sì |
| **totale su 12** | 9 | 8 | 10 | 10 |

Senza traccia: 0 su 12, sempre «non si può», nessuna risposta inventata. Va letta per quello che è: **un solo seme, due programmi, 12 domande scelte da me, un giudice solo**. Non dice che una forma vale un punto più dell'altra. Su moderna il modello ha anche l'XML e deduce da lì parte delle risposte (lo scrive, per (c)). Dice tre cose:

1. Solo (b) risponde a «quando»: è l'unica che vede lo scorrere di una crescita, cioè ciò per cui la traccia nasce. Ma il giro prima, con lo stesso tetto, (b) ha indicato il nodo vicino (#97 invece di #98) per «quale nodo mette R su L»: un gruppo fuso dice i suoi nodi, non quale di loro.
2. Nessuna forma, sotto il tetto, dice la lettera di una cella qualsiasi di un programma rumoroso: per quello serve una sezione chiesta apposta, con `--forma sezioni --passo`, e anche lì i piani possono mancare.
3. «Quante celle per lettera alla fine» è nell'intestazione perché il giro prima nodi, (a) e (b) non sapevano rispondere su moderna: è stata aggiunta dopo aver visto la domanda, quindi quei «sì» non misurano nulla.

Non misurato: se la traccia fa scrivere programmi migliori. Lo dirà T182, che è il suo uso.

## La scelta

**Predefinita: (b) `differenze`, con un tetto di 4000 token stimati** (`DEFAULT_FORM`, `DEFAULT_CEILING`), dello stesso ordine di ciò che il programma stesso costa nella seconda richiesta (moderna: XML di 6660 caratteri).
Su `conferma/moderna/1`: **3799 token stimati, 3405 reali, 5114 caratteri**; rocca 2893 stimati. Le altre due forme restano, per guardare un fotogramma: (c) sui programmi di `box`, (a) sui piani che interessano.

La compressione, nell'ordine, finché non sta sotto il tetto:

1. **Fotogrammi vicini**: si fondono i gruppi adiacenti, prima i `box` che cambiano meno celle, per ultimi i nodi di regole; `map` mai. Il testo dice `#12-14 box×3`, le differenze sono nette.
2. **Scatole**: da 4 a 1 per coppia di lettere, le più grandi, e il resto si dice (`+1083 scatole, 4299 celle`).
3. **Piani uguali e righe uguali** piegati (`sezioni`), file di una lettera `C×12`; oltre il tetto, piani a intervalli regolari, e quanti ne mancano.
4. **Il taglio** delle ultime righe, se ancora non basta: `… tagliato`.

Il tetto è in token stimati, sempre rispettato (`lab/tests/trace.test.ts`: ogni forma a 300, 1500 e 4000 su rocca, steampunk e StrangeDungeon).

## Il costo

Una traccia sono al più cinque esecuzioni del programma (una per i nodi, fino a quattro per i tentativi del tetto in `differenze`), senza modelli. Su rocca, 351 nodi, 9 s compreso l'avvio di `vite-node`. Il motore non cambia risultato: griglia e passi identici con e senza traccia su 15 modelli ufficiali e su moderna (`MazeTrail` escluso: finisce per tempo, non per regole).
