# ADR-0125 — Il suono si misura in testo con soglie calibrate sui preset

- Stato: accettato
- Data: 2026-11-03
- Task: T223

## Contesto

Un agente non sente. Dopo ADR-0123 il suono è una funzione pura partitura + seme → campioni, quindi si può misurare ciò che sente il giocatore; serviva dire da un XML cosa suona e cosa non va, senza browser né modelli, con soglie valide anche per il validatore del Concilio.

## Decisione

- **Una funzione sola, in `src/mj/soundanalysis.ts`** (`analyzeSound`, `soundIssues`, `soundReportText`): legge la partitura di `scoreOf` e i campioni di `renderScore`. Il comando (`lab/scripts/mjx-sound.ts`) aggiunge WAV e traccia. Il rapporto è deterministico: nessun orologio, numeri a precisione fissa. `RenderedSound` dice anche `rawPeak`, il picco prima della scalatura; i campioni non cambiano.
- **Sei difetti**: `vuoto`, `piatto`, `ripetitivo`, `stonato`, `fuori volume` e `giuntura`, con i limiti in `SOUND_THRESHOLDS`, calibrati sui quattro preset (2000 semi per la partitura, 150 per il segnale; i numeri in `lab/banco/suono.md`).
- **A maggioranza dei semi**: un limite parla quando lo passa più di metà dei semi. I preset, su semi rari, arrivano al 92 % di coppie aspre o a un periodo di mezza battuta: un seme non condanna un programma. Solo «non finisce» e «partitura vuota» bastano su un seme.
- **Tonalità effettiva diversa dalla dichiarata: un dato, non un difetto**. Scontro Finale non suona mai la sua tonica e la stima su una battuta è instabile. `stonato` guarda le note fuori scala (solo il tetto MIDI può farle) e le coppie simultanee a semitono o tritono.
- **Sotto una battuta è un effetto**: `piatto`, `ripetitivo` e il minimo di eventi non valgono, così un programma di una nota sola resta possibile.
- **Il validatore usa le stesse soglie** (`soundErrors`): i semi 1, 2, 3 per la partitura, il segnale solo sul primo e nessun rendering se la partitura basta già a rifiutare. Un limite di eventi per passo tiene basso il costo dei rendering più cari. Il tempo di `modelErrors` si divide fra i tre semi.

## Conseguenze

- Un programma del Concilio noioso per misura (una nota, stessa partitura a ogni seme, una battuta che ridice mezza battuta) torna all'agente col motivo. Un programma senza difetti non è per questo bello: la guida dice cosa le misure non possono dire.
- Soglie su quattro preset sono poche: passando a un genere diverso (per esempio un drone) `piatto` può sbagliare. Si ricalibrano quando ci sono altri programmi approvati dall'autore.
- `giuntura` e la dinamica minima sono provate solo su campioni costruiti: il sintetizzatore oggi non lascia a un programma il modo di arrivarci.
- Una terna di semi a caso può, raramente, dare un falso difetto su Architettura Frattale (4 terne su 598); il validatore ha semi fissi.
