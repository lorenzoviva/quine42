# ADR-0220 — La stella di ciò che non ha un modello

Data: 2026-11-19 · Stato: accettato (task T430 del backlog; richiesta dell'autore del 18/11) · Riferimenti: ADR-0037 (solo testo, niente
immagini), ADR-0041 (ogni aspetto è un programma), ADR-0049 (la densità detta dalla voce), ADR-0021 (l'universo prende il seme)

## Contesto

Un oggetto senza un modello suo veste il modello generico della classe `object` (`Forms.resolve`, `Kernel.itemLook`), nel suo colore (la tinta
`C`). Quel programma era un sacco legato in cima: in ogni universo l'autore ci vedeva una pozione, cioè una cosa che esiste e che il giocatore
cerca di riconoscere. L'autore vuole una forma semplice e non associabile a niente: una stella a quattro punte, come quella di Gemini o il lampo
di uno schermo a tubo che si spegne, che gira e si deforma in altezza e larghezza.

## Decisione

1. **Il generico della classe `object` è una stella** (`universe/models/object.xml`, a mano): in piedi, le quattro punte che si
   assottigliano a gradini (ogni `box` è un gradino della curva |x|^0,65 + |z|^0,65 = 1; a 0,55 le punte erano fili e da lontano si leggeva
   una croce), più spessa verso il mezzo come una lente e con una scintilla chiara che sporge dalle due facce; la lettera `C` resta la tinta,
   così il colore è quello dell'oggetto, e un oggetto che non dice il suo colore ne ha uno dal suo id (`itemLook`, una tinta `hsl`). 17 voxel di lato per avere le punte, alla densità 32
   della sua voce (`vpt`, ADR-0049): 0,53 caselle; a 28 (0,6 caselle, la scatola della classe) non entrava sul coperchio del barile, dove il
   vaso di prima entrava (`findSpot`, ADR-0150). Non è luminosa: i simboli che brillano nel terreno sono le
   rune (regola 0).
2. **Il movimento è del renderer**, al suo fotogramma e mai a ogni tick del kernel: `starPulse` (`src/render/star.ts`, pura) dà il giro, la
   larghezza e l'altezza, con un respiro (più larga mentre è più bassa) e ogni tanto una stretta rapida, il lampo che si chiude; ogni oggetto ha
   la sua fase. `entities.ts` la applica agli oggetti a terra che vestono la stella (`isStar`), attorno al loro mezzo; posati su un mobile restano
   fermi (ADR-0150). L'icona dell'inventario è la foto della stella (`thumbs.ts`) e si muove con un'animazione CSS (`.icon.star`), fuori fase per
   oggetto e ferma con `prefers-reduced-motion`.
3. **Gli universi la prendono dal seme**: chi non ha riscritto `models/object.xml` riceve il programma nuovo da `upgradeFromSeed` come ogni file
   del seme; e la voce di un programma appena preso dal seme ora segue quella del seme (`mergeEntries` con i programmi presi: i campi del seme
   vincono, quelli che ha solo l'universo restano). Senza, un universo con l'indice riscritto dallo Scultore avrebbe la stella nuova alla densità
   di prima, 0,85 caselle. Un universo che ha riscritto la sua cosa la tiene, con la sua voce. Il contratto non cambia: kernel 0.9.16.

## Alternative scartate

- **Voxel casuali in forma e colore** (la seconda proposta dell'autore): da tenere se la stella non si leggesse a quella misura; a 17 voxel le
  quattro punte e i lati curvi si leggono, e un ammasso casuale sarebbe un aspetto diverso per ogni oggetto, cioè una cosa da riconoscere.
- **Una geometria three.js fissa al posto del programma**: viola la regola 11 (ogni aspetto è un programma MarkovJunior) e lascerebbe fuori le
  foto, le impronte sui ripiani e il resto di ciò che il gioco misura dalla forma.
- **Un modello nuovo solo per gli oggetti da raccogliere**: il generico `object` serve anche le entità della classe senza modello, che avevano lo
  stesso difetto; un id nuovo avrebbe voluto cambiare `resolve` e i suoi chiamanti per lo stesso risultato.

## Conseguenze

- Anche un'entità della classe `object` senza modello (un vaso del Narratore che lo Scultore non ha ancora scolpito) è una stella, ferma.
- Un programma del seme che cambia la sua densità porta con sé la voce negli universi che lo prendono.
- `tests/star.test.ts` afferma la forma, il movimento e il passaggio agli universi; `tests/posare.test.ts` che la stella si posa su ogni
  mobile del seme, e prova i ripiani con il vaso di prima come modello solo del test; le impronte di `object` nelle fixture del motore
  (`mj-engine-hashes.json`, `griglie-visive.json`) sono riscritte, il motore non cambia.
