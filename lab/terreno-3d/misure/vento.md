# La risoluzione del vento (T484)

Node v22.19.0, 100 ripetizioni, finestra 108 × 90 caselle, bilancio 2 ms/tick.

## Il passo intero del vento, da solo

| cella (caselle) | celle | mediana ms | p95 ms | ns/cella | ms/tick a 10 Hz | statico ms/tick |
|---:|---:|---:|---:|---:|---:|---:|
| 0.5 | 38880 | 4.389 | 7.272 | 112.876 | 0.731 | 0.745 |
| 1 | 9720 | 1.093 | 2.039 | 112.469 | 0.182 | 0.186 |
| 2 | 2430 | 0.274 | 0.279 | 112.716 | 0.046 | 0.047 |
| 3 | 1080 | 0.122 | 0.129 | 112.963 | 0.02 | 0.021 |

## Un tick con l’acqua a due celle (60 Hz) e il vento accanto (10 Hz)

| vento, cella | passo | tick mediana ms | p95 ms | massimo ms |
|---:|---|---:|---:|---:|
| 1 | intero | 1.285 | 2.426 | 11.283 |
| 1 | spezzato | 1.482 | 2.472 | 2.991 |
| 2 | intero | 1.285 | 2.294 | 3.189 |
| 2 | spezzato | 1.328 | 1.666 | 2.403 |
| 3 | intero | 1.277 | 1.656 | 2.751 |
| 3 | spezzato | 1.308 | 2.595 | 2.734 |
| 0.5 | spezzato | 2.083 | 3.04 | 4.001 |

## Il vento da solo, spezzato nei tick fra due passi

| cella | ms a tick, mediana | p95 | massimo |
|---:|---:|---:|---:|
| 1 | 0.203 | 0.222 | 0.32 |
| 2 | 0.054 | 0.058 | 0.087 |
| 3 | 0.026 | 0.029 | 0.369 |

## Il carico statico contro il bilancio

| vento, cella | acqua + vento ms/tick | entra | + fumo e fuoco ms/tick | entra |
|---:|---:|---|---:|---|
| 0.5 | 2.106 | no | 2.19 | no |
| 1 | 1.547 | sì | 1.631 | sì |
| 2 | 1.407 | sì | 1.492 | sì |
| 3 | 1.382 | sì | 1.466 | sì |

## La vista grossolana ai client

1080 celle (una ogni 3 caselle su 108 × 90), farla 1.52 ms (p95 2.004), 2953 byte a messaggio, 5906 al secondo a 2 Hz.
