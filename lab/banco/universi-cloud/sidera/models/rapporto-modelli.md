# Sidera: le prove dei modelli e dei suoni

Scritto da `lab/banco/universi-cloud/sidera/strumenti/modelli.ts`. Per ogni modello: il validatore del gioco (`modelErrors`), la scatola della classe
come la dà `Forms` con l'analisi a terra e l'altezza minima della classe, sui semi 1, 2, 3, 4, 5; la varianza è la mediana, sulle coppie di semi,
dei voxel pieni in uno solo dei due sopra quelli pieni in almeno uno (soglia > 0.15). Per ogni suono: il validatore e l'analisi su dieci terne
di semi (1,2,3 · 4,5,6 · 7,8,9 · 10,11,12 · 13,14,15 · 16,17,18 · 19,20,21 · 22,23,24 · 25,26,27 · 28,29,30). Per tutti: il filtro della quarta parete.

| id | classe | errori | varianza (mediana) | secondi |
|---|---|---|---|---|
| sidera-cupola | edificio | 0 | 0.271 | 0.4 |
| sidera-torre-telemetria | monumento | 0 | 0.193 | 0.1 |
| sidera-modulo-abitativo | edificio | 0 | 0.214 | 0.2 |
| sidera-drone | oggetto | 0 | 0.216 | 0.0 |
| sidera-reattore | mobile | 0 | 0.179 | 0.0 |
| sidera-sintetizzatore | mobile | 0 | 0.180 | 0.0 |
| sidera-capsula-criogenica | mobile | 0 | 0.164 | 0.0 |
| sidera-serra-idroponica | mobile | 0 | 0.338 | 0.0 |
| sidera-estrattore-plasma | mobile | 0 | 0.195 | 0.0 |
| sidera-camera-equilibrio | monumento | 0 | 0.216 | 0.0 |
| sidera-faro | mobile | 0 | 0.309 | 0.0 |
| sidera-felce-spirale | cespuglio | 0 | 0.324 | 0.0 |
| sidera-albero-vetro | albero | 0 | 0.337 | 0.3 |
| sidera-cristallo | roccia | 0 | 0.188 | 0.0 |
| sidera-colono | persona | 0 | 0.179 | 0.0 |
| sidera-relitto | monumento | 0 | 0.295 | 0.0 |
| suono-sidera-pioggia | suono | 0 | - | 41.1 |
| suono-sidera-serre | suono | 0 | - | 44.1 |
| suono-sidera-cristalli | suono | 0 | - | 51.1 |
| suono-sidera-sera | suono | 0 | - | 46.3 |
| suono-sidera-notte | suono | 0 | - | 54.5 |
| suono-sidera-effetto-runa | suono | 0 | - | 0.7 |
| suono-sidera-effetto-incantesimo | suono | 0 | - | 2.3 |
| suono-sidera-effetto-soglia | suono | 0 | - | 2.4 |

**Passano tutti.**
