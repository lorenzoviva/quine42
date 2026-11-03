# ADR-0124 — La corona si disegna solo fuori dal cerchio, per chiunque e con qualunque camera

- Stato: accettato
- Data: 2026-11-03
- Task: T226. Modifica: ADR-0009

## Contesto

`coronaRevealed()` era vero già a 0,45 del raggio (ADR-0009), e da lì la corona si disegnava, il mondo si tagliava sul cerchio e la camera passava all'orbita libera. Chi stava dentro il cerchio oltre quella soglia la vedeva: l'autore, entrando in un edificio in single player. Il tappeto riporta verso il centro chi cammina, anche dentro una struttura (fermato da un test), quindi la soglia si supera solo con il tappeto fermo o spostato; la sequenza esatta che l'autore ha visto non si è riprodotta. La camera non deve poter mostrare ciò che il mondo nasconde, chiunque la muova: un edificio alto, un'attività che chiede l'orbita, il master, chi è già uscito e tornato.

Attraversare il bordo ha però un prezzo: con la corona in scena la scheda sale a 1,4-1,6 GB (T175), e three carica geometrie e programmi al primo disegno, quindi nel fotogramma del passaggio.

## Decisione

1. **Una sola decisione**: `coronaShown(x, y, raggio)` in `corona.ts`, pura, dalla sola posizione: fuori dal cerchio (distanza `>= circleRadius`) o in una stanza dello studio. `kernel.coronaRevealed()` è l'unico che la usa, e dà falso anche a chi segue un giocatore. Non riceve né il ruolo né la camera: non può dipenderne.
2. **Tutto da lì**: `CoronaView.root.visible` (anello, stanze, avatar), il taglio del mondo, sfondo e luce, etichette, suolo sotto il mouse, `hoverAt`. Dentro il cerchio la simulazione è senza taglio, come per chi non è mai uscito.
3. **La camera**: `canFreeOrbit()` non guarda più `coronaRevealed()`. Orbita e zoom liberi a god mode (il master), a chi segue un giocatore, nella corona e nello studio. Chi torna dentro riprende la 3/4. Oggi nessuna attività chiede l'orbita: quando accadrà basta una riga in `canFreeOrbit()`. Il giro attorno al viandante col tasto centrale resta anche nella 3/4 (T55): fermi sono inclinazione e zoom.
4. **Il passaggio**: da `CORONA_READY_AT` (0,3 del raggio) l'anello si costruisce invisibile e si carica sulla GPU: `Renderer.loadRing` disegna copie delle mesh, una per coppia di geometria e materiale, in un bersaglio di 1 pixel con le luci e la nebbia della scena, 6 ms a fotogramma. Lontano dal bordo da 60 s si butta (`RING_IDLE`, come ADR-0108): chi il tappeto tiene entro una casella dal centro non lo paga mai.
5. **Una sola nebbia, sempre accesa**: nella corona e nello studio è spostata lontanissimo. Toglierla (`scene.fog = null`) cambiava il programma di ogni materiale, e il fotogramma del bordo aspettava 5-7 compilazioni.
6. **Il mondo caricato** (`wantChunks`) resta come dentro fino a 6 caselle oltre il cerchio (`WORLD_BEYOND_EDGE`): prima era limitato già da 0,45 del raggio, e ora si vedrebbe un buco dentro il cerchio e al ritorno.

## Misure

Chrome headless con la GPU vera (RTX 2070, 60 fps), a passo di viandante (6 caselle/s), scheda fresca a ogni prova.

| | fotogramma più lungo al bordo (±0,5 s) |
|---|---|
| senza preparazione | 104 · 168 · 332 ms |
| anello costruito prima, solo `visible = false` | 234 · 370 ms |
| anello già caricato, nebbia ancora tolta | 172 · 173 · 286 ms (5-7 programmi compilati nel fotogramma) |
| anello già caricato, una sola nebbia | 53 · 54 · 55 · 55 ms (nessun programma), con la cache vuota 188-207 ms |

L'anello con i suoi modelli è pronto 3,3-4,5 s dopo l'inizio (le forme arrivano in 2,2-3,5 s, la ricostruzione entro 1 s); a 0,3 del raggio al bordo mancano 4,9 s, a 0,45 solo 3,9 s: per questo la soglia è 0,3.

## Conseguenze

- Il blocco non sparisce, si sposta: durante la preparazione, lontano dal bordo, il fotogramma più lungo è di 115-477 ms (costruire l'anello è sul thread della pagina).
- Chi arriva oltre il bordo senza camminare (`x = 9999`, `teleport`) salta la preparazione e paga tutto insieme, come prima.
- Al bordo il cambio resta netto, per scelta: da un passo all'altro il cielo del giorno diventa quello della corona e il campus appare intero.
- Il primo arrivo con la cache vuota resta più lento di quelli dopo.
- La memoria in fondo è quella di prima (scheda 1,3-1,5 GB di heap oltre il bordo, 80-350 MB al centro), solo che ora si paga da 0,3 del raggio per chi ha fermato il tappeto.
