# ADR-0125 — Il suono nel gioco è del client: un direttore puro, un worker con la cache, nessun messaggio

Data: 2026-11-03 · Stato: accettato · Riferimenti: ADR-0123 (il suono è un programma), ADR-0108 (la cache delle forme), ADR-0124 (la corona), T224

## Contesto

Con T221 un programma sonoro diventa campioni e con T222 l'autore li scrive in laboratorio, ma il gioco suonava ancora i blip di `Sfx`, fatti con oscillatori e `Math.random`. Un pezzo di musica costa da uno a due secondi di calcolo: sul thread della pagina fermerebbe il mondo. E la musica potrebbe tradire ciò che il cerchio nasconde: nella corona ha un altro carattere.

## Decisione

- **Il suono è del client.** Il direttore (`SoundDirector`, `src/audio/director.ts`) legge ciò che il client sa già: `coronaRevealed()`, l'ambiente del luogo, il momento del giorno, il seme dell'universo. Nessun messaggio nuovo sul filo, nessuno stato in un file dell'universo; in multigiocatore due viandanti nello stesso luogo e momento sentono lo stesso brano, senza che nessuno sincronizzi l'istante.
- **La scelta è una funzione pura** (`chooseMusic`). Un programma per tipo, l'istanza è un seme (regola 11): il seme viene dall'universo, dall'ambiente, dal momento e dalla variante. Il tempo di pagina dice soltanto *quando* cambiare (l'attesa ai confini, le varianti): non tocca la simulazione e non sceglie mai le note.
- **Dal cerchio la musica non dice nulla della corona** (regola 8): il brano di fuori si sceglie solo da `coronaRevealed()`, e lì non dipende dal luogo né dall'ora.
- **Che cosa è per che cosa sta nell'indice**: `models/index.json → suono` (`uso`, `ambienti`, `momenti`, `oltre`, `effetti`), un campo che arriva già a tutti con i modelli. Un programma senza `suono` è solo del SoundLab, come i quattro preset. Così il Musicista (T225) potrà aggiungere programmi senza toccare il kernel, e gli universi esistenti li ricevono da `upgradeFromSeed`.
- **Il rendering è in un worker** (`src/audio/worker.ts`), uno solo, con la musica davanti agli effetti. Il worker tiene anche la cache su disco (IndexedDB `quine-suoni`, 256 MB, la meno usata fuori per prima, e solo sulle origini di `keepsFormsOnDisk`, per lo stesso motivo di ADR-0108), perché leggere un valore da IndexedDB è decodificarlo e deve restare fuori dalla pagina. La pagina tiene 64 MB in memoria (`SoundRenders`). Le chiavi dicono testo del programma, seme, uso e `SOUND_CACHE_VERSION`: un test inchioda una resa a quel numero, così chi cambia il sintetizzatore deve alzarlo.
- **Di un brano resta solo il passaggio che gira**: il secondo dei due, che contiene già le code del primo. Di un effetto si taglia il silenzio finale.
- **Ciò che fallisce tace** (regola 7): un programma rotto, un worker che muore o che non finisce in 20 s danno `undefined`, si ricordano e non si rilanciano finché il testo non cambia. Un effetto che arriva con più di 250 ms di ritardo si lascia cadere.
- **`Sfx` diventa solo l'uscita** (`src/audio/sfx.ts`): guadagni, dissolvenze, volume, muto, un analizzatore per chi misura. Nessuna voce e nessun oscillatore: i blip sono diventati programmi (`suono-effetto-*`). Volume e muto stanno nel pannello d'aiuto, l'unico menu del gioco che parla del gioco, e restano in `localStorage`.

## Alternative scartate

- **Il kernel sceglie il brano e lo dice ai client**: un messaggio in più per qualcosa che ogni client ricava da solo; e la musica entrerebbe nello stato del mondo.
- **Un AudioWorklet o la sintesi dal vivo**: un secondo modo di fare il suono, contro «una sola fonte» di ADR-0123.
- **Riusare la coda dei worker delle forme**: un programma di forma può occupare un worker per secondi e la musica aspetterebbe; e un worker che si uccide per un suono non deve portarsi via una forma.
- **Nessuna cache su disco**: ogni avvio ricalcolerebbe un secondo per pezzo, e il disco costa poco.

## Conseguenze

- Il primo avvio calcola il primo brano e gli effetti nel worker: il primo suono arriva dopo circa un secondo. Le misure sono in `docs/architettura-dettagli.md#suono`.
- Ciò che un client di molti non riceve come evento (`item:crafted`, `forge:done`, il salto) resta muto per lui: nessun messaggio nuovo era la condizione.
- `Sfx.blip`, `noise`, `chord` e `playSamples` spariscono; `src/audio.ts` diventa `src/audio/sfx.ts`.
