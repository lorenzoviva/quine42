Giri: t497-1, t497-2, t497-3 · 6 modelli chiesti · kernel e modelli del gioco (Scultore gemini-3.1-flash-lite, gemini-3.8-flash, gemini-4-argon; Artista gemini-3.5-flash).

### Concetto per concetto

| giro | concetto | specialità | modello | braccio | fatto | voto | voti dell’Artista | primo colpo | chiamate (Scultore + Artista) | ingresso dello Scultore (in cache) | uscita + ragionamento | $ | s |
|---|---|---|---|---|---|---:|---|---|---|---:|---:|---:|---:|
| t497-1 | castagno | Paesaggista | gemini-3.1-flash-lite | dopo | sì | 6 | 6, 6 | 0 su 2 | 4 + 2 | 24 147 (10 179) | 9202 | 0,033 | 39 |
| t497-1 | baule | Mobiliere | gemini-3.1-flash-lite | dopo | sì | 6 | 4, 6 | 1 su 2 | 4 + 2 | 27 232 (12 223) | 12 261 | 0,037 | 44 |
| t497-2 | castagno | Paesaggista | gemini-3.1-flash-lite | dopo | no | — | — | 0 su 2 | 6 + 0 | 37 272 (20 361) | 11 092 | 0,021 | 35 |
| t497-2 | baule | Mobiliere | gemini-3.1-flash-lite | dopo | sì | 6 | 6 | 1 su 2 | 4 + 1 | 27 108 (16 296) | 12 278 | 0,029 | 38 |
| t497-3 | castagno | Paesaggista | gemini-3.1-flash-lite | dopo | sì | 6 | 6 | 0 su 2 | 6 + 1 | 37 593 (20 362) | 15 390 | 0,034 | 52 |
| t497-3 | baule | Mobiliere | gemini-3.1-flash-lite | dopo | sì | 6 | 6, 6 | 2 su 2 | 2 + 2 | 12 830 (8146) | 6822 | 0,027 | 30 |

### I due bracci

| | modelli fatti | programmi al primo colpo | voto finale medio (voti) | chiamate dello Scultore | ingresso della prima chiamata (media) | ingresso in cache | uscita + ragionamento | costo | chiamate oltre 120 s |
|---|---|---|---|---|---:|---:|---:|---|---|
| **dopo** | 5 su 6 | 4 su 12 (33 %) | 6,0 (6, 6, 6, 6, 6) | 26 (4,3 a modello) | 6070 | 53 % | 67 045 | 0,181 $ (0,036 a modello fatto) | 0 su 26 |
| t497-1, dopo | 2 su 2 | 1 su 4 (25 %) | 6,0 (6, 6) | 8 (4,0 a modello) | 6070 | 44 % | 21 463 | 0,070 $ (0,035 a modello fatto) | 0 su 8 |
| t497-2, dopo | 1 su 2 | 1 su 4 (25 %) | 6,0 (6) | 10 (5,0 a modello) | 6070 | 57 % | 23 370 | 0,050 $ (0,050 a modello fatto) | 0 su 10 |
| t497-3, dopo | 2 su 2 | 2 su 4 (50 %) | 6,0 (6, 6) | 8 (4,0 a modello) | 6070 | 57 % | 22 212 | 0,061 $ (0,031 a modello fatto) | 0 su 8 |

### Mestiere per mestiere

| mestiere, braccio | modelli fatti | programmi al primo colpo | voto finale medio (voti) | chiamate dello Scultore | ingresso della prima chiamata (media) | ingresso in cache | uscita + ragionamento | costo | chiamate oltre 120 s |
|---|---|---|---|---|---:|---:|---:|---|---|
| Paesaggista, dopo | 2 su 3 | 0 su 6 (0 %) | 6,0 (6, 6) | 16 (5,3 a modello) | 5725 | 51 % | 35 684 | 0,088 $ (0,044 a modello fatto) | 0 su 16 |
| Mobiliere, dopo | 3 su 3 | 4 su 6 (67 %) | 6,0 (6, 6, 6) | 10 (3,3 a modello) | 6415 | 55 % | 31 361 | 0,093 $ (0,031 a modello fatto) | 0 su 10 |

### La cache implicita di Gemini (le chiamate dello Scultore)

| modello | braccio | chiamate | ingresso | in cache | prime chiamate di un concetto servite dalla cache |
|---|---|---:|---:|---:|---|
| gemini-3.1-flash-lite | dopo | 26 | 166 182 | 87 567 (53 %) | 4 su 6 |

### Perché il kernel ha scartato i programmi

| braccio | sintassi o nodi | troppo basso o pieno | staccati o sospesi |
|---|---:|---:|---:|
| prima | 0 | 0 | 0 |
| dopo | 7 | 8 | 3 |

### Le istruzioni dei mestieri, braccio per braccio

| mestiere | che cosa si conta | prima | dopo |
|---|---|---|---|
| Paesaggista | scarti perché la chioma galleggia o si stacca, su tutti gli scarti | 0 su 0 | 2 su 13 |
| Paesaggista | castagni tenuti senza `<animation>` (il vento lo fa il kernel) | 0 su 0 | 2 su 2 |
| Paesaggista | varietà fra i semi 1 e 2 (0 uguali, 1 niente in comune), media | — | 0,65 |
| Mobiliere | bauli con `open` e il coperchio aperto in una lettera nascosta | 0 su 0 | 3 su 3 |
| Mobiliere | … e anche `close` | 0 su 0 | 2 su 3 |
| le azioni | «Apri le ante» al primo colpo | 0 su 0 | 0 su 0 |
| Sarto | cappelli la cui sezione `<worn>` va (via B) sui due corpi del kernel | 0 su 0 | 0 su 0 |
| Figurinista | mugnaie in cui il rig trova 2 gambe, 2 braccia e la testa | 0 su 0 | 0 su 0 |
| Figurinista | gatti in cui il rig trova 4 zampe, la coda e la testa | 0 su 0 | 0 su 0 |
| Capomastro | casette con la porta che si apre e si chiude (`open`, `close`) | 0 su 0 | 0 su 0 |
| Capomastro | casette con le finestre di vetro (una lettera traslucida) | 0 su 0 | 0 su 0 |
| Carrozziere | barche con le vele che si ammainano e si issano (`furl`, `hoist`) | 0 su 0 | 0 su 0 |
| Carrozziere | barche con le aree `boarding`, `helm` e `hold` | 0 su 0 | 0 su 0 |
| Architetto | risposte con una trama `<convchain>` (anche scartate) | 0 su 0 | 0 su 0 |
| Architetto | risposte con un ciclo `<markov><sequence>` | 0 su 0 | 0 su 0 |
| Architetto | risposte che scavano la cantina con `part-cellar` | 0 su 0 | 0 su 0 |
| Architetto | rocche passate (con la cantina che regge) | 0 su 0 (0 con la cantina) | 0 su 0 (0 con la cantina) |
| Architetto | contro il forte dell’autore (la scala di T371, su 10), media | — | — |

### Che cosa mostrano i programmi delle istruzioni del loro mestiere

| giro | concetto | braccio | indicatori |
|---|---|---|---|
| t497-1 | castagno | dopo | voxel 9513 · finisce true · convolution 2 · nascoste 2 · colori 3 · semi 0.609 |
| t497-1 | baule | dopo | voxel 1560 · finisce true · azioni open · import part-leaf · nascoste 10 · colori 6 · semi 0.066 |
| t497-2 | baule | dopo | voxel 2454 · finisce true · azioni open/close · import part-leaf · nascoste 10 · colori 4 |
| t497-3 | castagno | dopo | voxel 6575 · finisce true · convolution 2 · nascoste 1 · colori 4 · semi 0.688 |
| t497-3 | baule | dopo | voxel 2034 · finisce true · azioni open/close · import part-leaf · nascoste 10 · colori 7 · semi 0.081 |

Registro di lab\banco\specialita\t497: $0.18 in tutto (Gemini a listino, OpenRouter come l'ha detto).
