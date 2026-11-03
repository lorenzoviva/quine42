# Leggere un programma sonoro senza orecchie (T223)

Per chi scrive programmi sonori (`docs/architettura-dettagli.md#suono`) e non può ascoltarli. Niente browser e niente modelli:

```bash
npx vite-node lab/scripts/mjx-sound.ts -- suono-fuga-cellulare                # un id di universe/models o un file .xml
npx vite-node lab/scripts/mjx-sound.ts -- mio.xml --semi 1,2,3 --out lab/out/suono/prova --tetto 4000
```

Stampa il rapporto e scrive in `lab/out/suono/<nome>/` `rapporto.md`, `seme-<n>.wav` e `traccia-<n>.txt` (la traccia di `traccia.md`: quale nodo ha fatto cosa). Esce con 1 se trova un difetto. Stesso programma e stessi semi danno gli stessi byte. Le misure leggono i campioni che sente il giocatore, non una copia.

## Come si lavora

1. **Verdetto**: se c'è un difetto, il messaggio dice il numero e il limite.
2. **La partitura**, una parola per passo: `D4` nota, `D4!` accento, `d4` ghost, `~3` durata in passi, `K H O C` cassa, hi-hat, hi-hat aperto, rullante, `.` niente, `+` insieme. Sono le note che usciranno: si confrontano con ciò che il programma doveva dire.
3. **La traccia**, se la partitura non è quella voluta: dice quale nodo non ha agito o ha riempito troppo.
4. **Più semi**, almeno cinque: un programma per tipo, le istanze sono semi diversi. Un seme fortunato non dice niente.

## I difetti e le soglie

Un limite parla quando **lo passa più di metà dei semi**: anche un buon programma, su un seme raro, esce dai limiti. Solo «non finisce» e «partitura vuota» bastano su un seme. Sotto una battuta (16 passi) il programma è un **effetto**: `piatto` e `ripetitivo` e il minimo di eventi non valgono. I numeri stanno in `SOUND_THRESHOLDS` (`src/mj/soundanalysis.ts`).

| Difetto | Quando | Limite | Nei preset |
|---|---|---|---|
| `vuoto` | eventi per battuta | < 4 | 25-99 |
| | traccia dichiarata e muta | sulla maggioranza dei semi | mai |
| | silenzio nel ciclo (sotto -50 dBFS) | > 75 % | fino a 43 % |
| | note sotto i 20 Hz | > 25 % | 0 |
| `piatto` | note diverse | < 3 | 5-21 |
| | dinamica tra i passi (10° e 90° percentile) | < 3 dB | 4,8-50 dB |
| | energia in una banda | > 97 % | fino a 92 % |
| `ripetitivo` | la partitura si ripete ogni metà o meno | periodo ≤ passi/2 | raro: periodo 8 in Architettura Frattale |
| | distanza tra i semi (0 uguali, 1 niente in comune) | < 0,05 | 0,35-0,88 |
| `stonato` | note sulla scala dichiarata | < 90 % | 100 % |
| | coppie simultanee a semitono o tritono | > 60 % | mediana 14-29 %, su semi rari fino a 92 % |
| `fuori volume` | eventi a passo, o partitura tagliata | > 16 | fino a 6,2 |
| | RMS del ciclo | fuori da -32..-8 dBFS | -25,9..-15,7 |
| | picco | < -18 dBFS | -3,5..-0,2 |
| | picco grezzo, prima della scalatura a 0,98 | > 3,5 | 0,67-2,6 |
| | campioni al limite (≥ 0,97) | > 0,1 % | sotto lo 0,05 % |
| `giuntura` | salto alla giuntura, contro i salti più grandi del ciclo (99,9° percentile) | > 1,5 | fino a 0,14 |

**Calibrazione**: i quattro preset, 2000 semi per la partitura e 150 per il segnale. Passano tutti con i semi predefiniti, con quelli di `tests/sound.test.ts` e con 40 semi di fila. Con tre semi di fila, su 598 terne, Architettura Frattale raggiunge due semi aspri o periodici 4 volte: un agente che prende una terna a caso può, raramente, vedere un falso `stonato` o `ripetitivo` su quel preset; gli altri tre 0 volte. Il validatore usa sempre i semi 1, 2, 3, e i preset con quelli passano.

Il validatore (`soundErrors`) rimanda indietro gli stessi difetti: tre semi per la partitura, il segnale solo sul primo, e nessun rendering se la partitura basta già a rifiutare. Su un preset costa 150-300 ms.

## I programmi del gioco (T228)

I 7 brani e i 9 effetti del seme (`suono-musica-*`, `suono-effetto-*`) non hanno calibrato niente: sono la prima prova delle soglie su programmi scritti dopo. Sui semi 1-5, sui semi 100-139 e su altri cinque sparsi passano tutti, tranne `suono-effetto-morte`: distanza 0 tra i semi, `ripetitivo`, tenuto così dall'autore (lo preferisce all'ascolto). Stanno ben dentro i limiti: RMS da -27,4 a -19,1 dBFS, picco grezzo da 0,29 a 1,06, silenzio fino al 48 %, giuntura al più 0,04, coppie aspre al più il 27 %.

**L'analisi non sa che un programma è un effetto**: lo deduce dalla lunghezza, e sotto i 16 passi è un effetto. Un effetto di una battuta o più si misura come un brano: chiede 4 eventi a battuta e semi diversi. `suono-effetto-soglia` (24 passi) è stata corretta per questo: la nota d'arrivo la sceglie il seme tra due, e l'ottava in più nel pad porta 8 eventi; il seme 1, quello del gioco, resta com'era con quell'ottava in più.

**Il validatore costa di più sui brani veri**: da 1 a 1,9 s su un brano del gioco, contro i 150-300 ms di un preset; sugli effetti al più 250 ms.

## Cosa le misure non possono dire

- **Se è bello.** Nessuna soglia riconosce una melodia che resta in testa. Quattro preset calibrano il «non è rotto», non il gusto: un programma senza difetti può essere noioso, e uno buono e strano può essere segnalato. Sopra le soglie, decide chi ascolta.
- **Se è adatto.** Le misure non sanno se è una battaglia o un villaggio: l'umore lo dicono al più bpm, scala e densità, che si leggono ma non si giudicano.
- **La tonalità percepita.** «Effettiva» è l'accordo fra le note, pesate per durata e forza, e una forma di scala: una stima. In una battuta sola sbaglia spesso, e Scontro Finale non suona mai la tonica dichiarata (quota 0 % su ogni seme): dunque effettiva diversa da dichiarata **non è un difetto**, è un dato. Le altezze vengono dalla scala per costruzione, quindi «fuori scala» capita solo sul tetto MIDI.
- **La dissonanza voluta.** Semitoni e tritoni contano allo stesso modo, in una cadenza o in un errore; le scale frigia e hirajoshi ne sono piene. Non guarda timbro né registro.
- **La sensazione del ritmo.** Densità e periodo non dicono se il groove regge. Lo swing si dichiara e il sintetizzatore lo applica, ma il rapporto non lo giudica.
- **Lo spettro come timbro.** Un cutoff di 100 Hz suona ovattato e non è segnalato: `medi` e il centro in Hz lo mostrano, ma i preset vanno da 144 a 786 Hz e non danno un limite pulito.
- **Il mix col gioco.** Il rapporto misura un programma da solo, non sopra gli altri suoni o sul tuo altoparlante.

**Non provati dai programmi**: `giuntura` e la dinamica sotto i 3 dB sono provate solo su campioni costruiti a mano. Il sintetizzatore allinea i passaggi del ciclo al campione e ogni inviluppo decade, quindi nessun programma provato ci arriva (il più alto: 0,61 di giuntura, con quattro passi a 400 bpm). Stanno lì a controllare il sintetizzatore, se un giorno cambierà.
