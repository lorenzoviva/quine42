# Il diario del prompt (T155)

Un giro: prompt cambiato → prove → foto e misure. Si corregge il prompt, mai un XML. Token di input: `inputTotale` del banco (prompt + bersaglio).

| giro | cosa è cambiato | input | prove | misure passate | cosa si vede |
|---|---|---|---|---|---|
| T154 | prima versione | 2750 | 2 | 1 | tetto a strisce, massa unica, lati uguali |
| g01 | nuova sezione «L'aspetto»: masse, tetto a una tinta, lati diversi, tema da fuori | ~3270 | 4 | 0 | salto netto: masse sfalsate, tetti pensati; stanze contate 0-1 (arredi al centro), porta della rocca ostruita |
| g02 | stanze con un rettangolo sgombro; linea dritta dalla porta; grate che non spezzano le finestre | ~3400 | 7 | 4 | quattro passano; tempio basso di soffitto, rocca col portone ostruito, locanda con la cantina persa |
| g03 | soffitto +2 voxel; androne per il portone; aria sulle scale; riscavo finale di porta, varchi, scale | ~3480 | 3 | 1 | la rocca passa ed è il modello più bello fin qui; ponte sopra la porta del tempio |
| g04 | niente ponti sopra la porta; regola delle botti in cantina. **Tolti** i numeri di «Varietà» | ~3470 | 8 (limite delle 5 ore) | 6 | togliere il tetto al materiale dominante costa: rocca al 71 %, torna (in forma breve) |
| g05 | gradino di cantina profondo mezzo passaggio + 1. **Tolta** la riga delle regole `prl`/`all` (nessuno dei 14 modelli le usava) | ~3380 | 14 | 10 | scale che non sboccano e fessure nei solai. **Errore del banco**: `murato` contava l'aria sotto il piano terra, che nel gioco è terra piena; corretto. Nuova misura `cantina` |
| g06 | una regola per i solai (scatola continua, scavi fra pavimento e soffitto); sbocco in linea delle scale | ~3480 | 14 | 12 | restano due locande: un `at` con due numeri e una cantina troppo piccola |
| g07 | cantina sgombra 2 × 2; `at` ha tre numeri. **Tolte** tre frasi che non cambiavano nulla | ~3430 | 14 | 12 | steampunk: macchina in mezzo alla sala (stanze) e un salto solo |
| g08 | margine sopra la soglia: 4 stanze e 3 salti; macchine contro i muri | ~3470 | 13 (CLI senza risultato) | 11 | stanze e salti tengono; scala con il foro del solaio dalla parte sbagliata, stanza murata |
| g09 | controllo finale «ripercorri il cammino a numeri» | ~3590 | 7 (limite delle 5 ore) | 5 | **non serve**: sbagli uguali e output fino a 102 mila token; esce |
| g10 | **al posto del controllo**, un esempio numerico di scala col suo foro (+200 token), solo sui due bersagli deboli | ~3800 | 4 | 3 | steampunk 2 su 2, cantina raggiunta 2 su 2; una locanda con un muro davanti al primo gradino |
| g11 | nessun muro o arredo davanti al primo gradino | ~3790 | 14 | 11 | un `at` con due numeri (di nuovo, nonostante la frase), un pavimento non raggiunto, un piano non raggiunto. Foto: 7 degli 11 passano (`finale/giudizio.md`) |

I prompt di g05-g11 non sono uguali: la misura `cantina` e la correzione di `murato` valgono da g06, g05 è stato rimisurato solo per la locanda. I conteggi sono quelli scritti da ogni giro al momento.

## Dove si è fermato

Soglia non raggiunta. Il giro 12 non è stato fatto: vedi `docs/pipeline/domande/T155.md`.

- **Cosa si è guadagnato i token**: «L'aspetto» (il salto di qualità delle foto, ~500 token); i margini sopra la soglia (4 stanze, 3 salti): nel giro 11 nessun tentativo cade più su stanze o salti da soli; le regole di solai, sbocchi e cantina. L'esempio di scala è probabile ma non dimostrato: due giri, pochi tentativi, e nel giro 11 una scala è fallita lo stesso.
- **Cosa è uscito senza danno visibile**: la riga delle regole `prl`/`all`, i numeri di `dettagli`, `rilievo`, `sagoma`, `ingombro`, tre frasi. **Non ha portato nulla**: il controllo a numeri del cammino.
- **Cosa non è potuto uscire**: il tetto al materiale dominante (senza, una rocca è arrivata al 71 %).
- **Ciò che resta**: sbagli del singolo tentativo su bersagli che altre volte passano. Giri 5-11: 64 tentativi su 80 passano le misure. A questo ritmo 14 su 14 nello stesso giro è raro: il prompt da solo difficilmente ci arriva.
- **Il costo**: 102 chiamate; input 3770-3832 token per modello al giro 11 (2750 il prompt di T154), output in media 57 mila, ragionamento compreso; ~114 dollari a listino secondo la CLI, pagati con l'abbonamento. Molto oltre la stima dell'8 % del limite settimanale; il limite delle 5 ore è scattato due volte.
