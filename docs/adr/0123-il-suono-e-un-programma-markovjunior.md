# ADR-0123 — Il suono è un programma MarkovJunior: XML, una partitura, una sola fonte dei campioni

Data: 2026-11-03 · Stato: accettato · Riferimenti: ADR-0036, ADR-0037 (solo testo), ADR-0038, ADR-0041 (la libreria dei modelli), ADR-0103 (percorsi ammessi), T221

## Contesto

L'autore vuole colonna sonora ed effetti generati con MarkovJunior, scritti dall'IA, e ha scelto il suono di un mockup di Argon (`docs/userchats/mj_3d_soundlab_sintetizzatore_musicale_markovjunior.html`): un secondo motore in JavaScript, programmi in JSON, Web Audio dal vivo e `Math.random` per il rumore. Nel gioco i programmi sono solo XML, il motore è uno e un agente deve poter misurare ciò che il giocatore sente.

## Decisione

- **La lingua è l'XML del motore vero.** Un programma sonoro è un programma qualunque con un `<sound>` sulla radice: `bpm scale root swing cutoff space` e i `<track y instrument volume>`. Fuori range torna a chi l'ha scritto con la riga (`soundSettings`, `src/mj/sound.ts`). Nessun secondo motore, nessun JSON.
- **La griglia è la partitura.** X il tempo (un sedicesimo per cella), Y la traccia, Z l'altezza sulla scala. Suonano N S A G K H C; ogni altra lettera è un segno muto. `scoreOf` è una funzione pura griglia → eventi, con un tetto di eventi.
- **Una sola fonte del suono.** `renderScore` (`src/mj/synth.ts`) è una funzione pura partitura + seme → campioni: niente Web Audio, orologio né `Math.random`. Gira in Node e in un worker; il browser suona quei campioni (`Sfx.playSamples`). Il seme fa il rumore di rullante e hi-hat. Il programma si ferma a un numero di passi, non a un tempo: l'orologio non sceglie le note.
- **Il grafo del mockup rifatto in aritmetica**: stessi numeri, filtri con le formule di Web Audio (il Q in dB per passa-basso e passa-alto), oscillatori limitati in banda, delay con retroazione nel passa-banda, compressore con la curva statica dei browser e il suo makeup. Una differenza voluta: se il picco passa 0,98 tutto il suono si scala, perché il grafo vero superava 1 (fino a 1,42) e il browser tagliava.
- **Il ciclo**: si rendono due passate più la coda, e `loopStart`..`loopEnd` è l'ultima, che contiene già le code della prima. Il suono è mono, come il grafo del mockup.
- **I programmi sonori stanno in `models/`** (`models/suono-<id>.xml`), con `classe: "suono"` in `index.json` (`SOUND_CLASS`): restano nell'elenco di `paths.ts`, hanno la loro carta, passano dal validatore e dagli aggiornamenti dal seme come ogni modello. `suono` non è in `CLASSES`: non ha scatola e non entra nelle scelte dello Scultore né della Fucina. Il validatore riconosce un programma sonoro da `<sound>` e chiede che finisca e che la partitura non sia vuota, non che stia in piedi.
- **Il motore aveva già tutto ciò che il mockup usa** (`one all prl sequence markov`, `path` con `inertia` e `longest`, `convolution`, che è il suo `conv`, `union`, `steps`, le forme, `map`): `engine.ts` non cambia. Mancava all'XML solo la `map` che tiene la griglia: `clear="False"`, predefinito come prima.

## Che cosa si è misurato

Le stesse partiture dei quattro preset, suonate in Chrome dalle funzioni del mockup in un `OfflineAudioContext` con il suo grafo, contro `renderScore`: correlazione dell'inviluppo (RMS ogni 25 ms) tra 0,973 e 0,999, della parte sopra 1,5 kHz tra 0,969 e 0,998. Le differenze di livello sono quelle della scalatura sotto il picco (nel preset con picco 1,42 il rapporto è 0,68, 0,98/1,42 = 0,69). È una misura fatta una volta, non un test: in Node non c'è Web Audio. Nessuno ha ancora ascoltato il risultato.

## La traduzione dei preset

Tutti e quattro, con i parametri e la palette del mockup. Due scostamenti, entrambi commentati nell'XML o qui:
- **Sentiero Melodico nel mockup non compila**: l'ultima regola ha `in` di uno strato e `out` di tre, e il motore del mockup la rifiuta (verificato in Chrome). Qui è scritta come diceva il commento: sopra la cassa, due quote più in alto, a volte una nota di basso. Il mockup dichiarava anche l'unione `?`, mai usata: tolta.
- **Architettura Frattale** poteva restare senza pad con un seme su sedici: la prima colonna ora è sempre completa.

## Scartato

- **Web Audio nel browser e una copia per i test**: due fonti, e ciò che si misura non è ciò che si sente.
- **Un elemento o una cartella a parte per i suoni** (`sounds/`): `paths.ts` è un elenco, una cartella nuova va ammessa ovunque, e non porta niente.
- **Mettere `suono` in `CLASSES`**: lo Scultore e la Fucina lo offrirebbero alle cose del mondo.
- **Un limitatore sul segnale**: colora il suono, e l'intero buffer è già in mano; basta scalarlo.

## Limiti

- MarkovJunior non è tutto qui: `wfc`, `convchain`, `observe` e `field` restano non supportati, come prima. Il mockup non li usa.
- Niente pagina né agente che scriva programmi sonori: sono i pezzi successivi. `Sfx.playSamples` è provato solo dal typecheck.
- I file `suono-*` appaiono nella Galleria come ogni file di `models/` e, sul sito, come carte di tipo `modello` con la griglia in voxel.
- In un altro motore JavaScript le funzioni matematiche potrebbero differire nell'ultimo bit: l'identità dei campioni è provata in Node.
