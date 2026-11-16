| Scultore | taglia | riuscite | costo totale | costo per riuscita | chiamate (media) | tempo (media, max) | chiamate oltre 120 s | voti | fattorie con merli | forti con merli |
|---|---|---|---|---|---|---|---|---|---|---|
| claude-opus-5-5 via OpenRouter | huge | 2 su 2 (2 entro 120 s a chiamata) | 1,40 $ | 0,70 $ | 5,00 | 255 s, 368 s | 0 su 10 | 8, 6 | 0 su 1 | 1 su 1 |
| claude-opus-5-5 via OpenRouter | large | 2 su 2 (1 entro 120 s a chiamata) | 1,03 $ | 0,51 $ | 3,50 | 202 s, 225 s | 1 su 7 | 8, 9 | 0 su 1 | 1 su 1 |
| claude-opus-5-5 via OpenRouter | tutte | 4 su 4 (3 entro 120 s a chiamata) | 2,42 $ | 0,61 $ | 4,25 | 228 s, 368 s | 1 su 17 | 8, 8, 6, 9 | 0 su 2 | 2 su 2 |
| gemini-3.8-flash (T355) | large | 0 su 6 (0 entro 120 s a chiamata) | 0,51 $ | — | 4,00 | 98 s, 106 s | 0 su 24 | — | — | — |
| gemini-3.8-flash (T355) | tutte | 0 su 6 (0 entro 120 s a chiamata) | 0,51 $ | — | 4,00 | 98 s, 106 s | 0 su 24 | — | — | — |
| gemini-4-argon (T355) | huge | 5 su 6 (5 entro 120 s a chiamata) | 1,70 $ | 0,34 $ | 5,17 | 192 s, 273 s | 0 su 31 | 6, 6, 9, 6, 7 | 3 su 3 | 2 su 2 |
| gemini-4-argon (T355) | large | 1 su 2 (1 entro 120 s a chiamata) | 0,51 $ | 0,51 $ | 4,50 | 177 s, 199 s | 0 su 9 | 7 | 1 su 1 | — |
| gemini-4-argon (T355) | tutte | 6 su 8 (6 entro 120 s a chiamata) | 2,21 $ | 0,37 $ | 5,00 | 188 s, 273 s | 0 su 40 | 6, 6, 9, 6, 7, 7 | 4 su 4 | 2 su 2 |

Scarti del kernel (un programma può cadere per più motivi) e richieste senza risposta:

| Scultore | piani | porta | stanza | varietà fra le taglie | pezzi staccati o sospesi | sintassi | altro |
|---|---|---|---|---|---|---|---|
| claude-opus-5-5 via OpenRouter | 0 | 0 | 1 | 2 | 0 | 0 | 0 |
| gemini-3.8-flash (T355) | 8 | 5 | 6 | 2 | 3 | 0 | 1 |
| gemini-4-argon (T355) | 6 | 9 | 2 | 1 | 0 | 1 | 0 |

Registro di lab\banco\taglie\modelli\openrouter: $2.42 di Gemini a listino (tetto $10.00).
