# Il giro di conferma (T173): misure e foto

Quattordici tentativi col prompt di T155, invariato (`prompt.md`, uguale a `lab/banco/prompt.md`): i sette bersagli, due per ciascuno, entro due richieste. **Non passa: 12 su 14.** Falliscono `futuristica/2` (il gioco rifiuta la seconda richiesta) e `pagoda/2` (le foto).

Il giudizio è di una sessione che non ha scritto il prompt, ma è lo stesso modello che lo ha scritto (Claude Opus 5.5) e non ha giocato i modelli: va riletto dall'autore. Il voto sui salti viene da `sezioni.png`, dalle misure e, per alcuni, da `pianta.png`.

Colonne: i criteri di `lab/banco/README.md`. Serve «sì» ovunque, al più un «parte». I file della seconda richiesta sono in `<bersaglio>/<n>/seconda/`, con `richiesta.txt`: il messaggio intero. I problemi rimandati sono in `<bersaglio>/<n>/problemi.md`.

| tentativo | esito | misure | 1 riconosce | 2 regge | 3 lati | 4 tetto | 5 dentro | 6 colori | 7 salti | 8 dettaglio | cosa si vede |
|---|---|---|---|---|---|---|---|---|---|---|---|
| moderna/1 | **alla prima** | sì | sì | sì | sì | sì | parte | sì | sì | sì | parete di vetro, pannelli, terrazza; soggiorno e cucina poco leggibili |
| moderna/2 | **alla prima** | sì | sì | sì | sì | sì | parte | sì | sì | sì | scala esterna alla terrazza, tetto arredato; piano terra poco arredato |
| steampunk/1 | **alla prima** | sì | sì | sì | sì | sì | parte | sì | sì | sì | caldaia, ciminiere, tubi e ingranaggi; dentro scuro al piano sopra |
| steampunk/2 | **alla prima** | sì | sì | sì | sì | sì | parte | sì | sì | sì | finestre ad arco, ingranaggi in facciata; la sala macchine si legge poco |
| futuristica/1 | prima: no | sì | parte | sì | sì | sì | no | sì | sì | parte | due blocchi, non una torre; dentro nessuna stanza si riconosce |
| futuristica/1 seconda | **alla seconda** | sì | sì | sì | sì | sì | parte | sì | sì | sì | ora una torre con le fasce e una piattaforma; dentro schermi e luci, ancora grigio |
| futuristica/2 | prima: no | sì | parte | sì | sì | sì | no | sì | sì | parte | ammasso di blocchi, dentro nero, riquadri neri che sembrano buchi |
| futuristica/2 seconda | **fallita** | **no** | — | — | — | — | — | — | — | — | il gioco lo rifiuta: un `at` con due numeri alla riga 120; niente foto |
| locanda/1 | prima: no | sì | sì | sì | sì | parte | parte | sì | sì | sì | ala col tetto piano vuoto; sala comune grigia e vuota |
| locanda/1 seconda | **alla seconda** | sì | sì | sì | sì | sì | parte | sì | sì | sì | l'ala è una terrazza con botti e tavoli, sala con tappeto e camino; al limite: il blocco di pietra resta massiccio |
| locanda/2 | **alla prima** | sì | sì | sì | sì | sì | parte | sì | sì | sì | graticcio, insegna, balcone, botti in cantina |
| tempio/1 | **alla prima** | sì | sì | sì | sì | sì | parte | sì | sì | sì | terrazze, scalinate, colonne, bracieri; sale ampie e spoglie |
| tempio/2 | **alla prima** | sì | sì | sì | sì | sì | parte | sì | sì | sì | come il primo, statue sulle colonne; celle spoglie |
| rocca/1 | **alla prima** | sì | sì | sì | sì | sì | parte | sì | sì | sì | mura, quattro torri, mastio, pozzo, scala sulle mura; armeria poco leggibile |
| rocca/2 | **alla prima** | sì | sì | sì | sì | sì | parte | sì | sì | sì | tetti diversi, cortile, pozzo; armeria poco leggibile |
| pagoda/1 | prima: no | sì | parte | sì | parte | parte | parte | sì | sì | sì | un solo grande tetto, punte che non si vedono, lati simili |
| pagoda/1 seconda | **alla seconda** | sì | sì | sì | sì | sì | parte | sì | sì | sì | i tetti si leggono, punte rialzate nette, ballatoi: la correzione più riuscita |
| pagoda/2 | prima: no | **no** | — | — | — | — | — | — | — | — | `piani` 1, `stanze` 2, `murato` 0,68: la scala non porta al piano sopra |
| pagoda/2 seconda | **fallita** | sì | parte | sì | sì | parte | parte | sì | sì | sì | la scala ora porta su, l'aspetto è uguale a prima: un grande tetto squadrato, punte che non si vedono, stanze spoglie |

Criterio 5: in tutti i tentativi che passano è «parte», mai «sì». Sono le stanze chieste che si riconoscono poco, come in T155: questo giudizio consuma su quel criterio l'unico «parte» ammesso di ogni tentativo.

Riassunto e costi: `docs/pipeline/domande/T173.md`.
