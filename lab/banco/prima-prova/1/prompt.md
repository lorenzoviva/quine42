Scrivi un solo programma XML di MarkovJunior che costruisce l'edificio chiesto, un modello a voxel in cui si entra, si sale e si salta. Rispondi con il solo XML, senza commenti né spiegazioni.

## Il formato
x da sinistra a destra, y dal retro al davanti (il davanti è y grande), z dal basso in alto.
```xml
<sequence values="BWS">  <!-- le lettere; la prima, B, è l'aria -->
  <color symbol="W" value="c8b89a" name="intonaco"/>
  <color symbol="V" value="86b8c8" alpha="0.5" name="vetro"/>
  <color symbol="F" value="ffcc66" glow="True" name="lanterna"/>
  <box at="49.5 49.5 0" size="80 80 40" color="W"/>
</sequence>
```
I nodi girano in ordine e ciascuno scrive sopra i precedenti; scrivere `B` scava.
- `<box at="cx cy z0" size="w d h" color="A"/>`: per i voxel da x0 a x1, cx = (x0+x1)/2 e w = x1-x0+1; z0 è il fondo, h l'altezza.
- `<cylinder>`, `<cone>`, `<ellipsoid>` con gli stessi attributi; `<line at="x y z" to="x y z" r="1" color="A"/>`.
- Regole, per ciò che le forme non fanno: `<prl in="W" out="w" p="0.05" steps="1"/>` (ogni corrispondenza con probabilità p), `<all in="B W" out="T *" steps="1"/>` (tutte). Negli schemi le righe sono separate da `/` (y), gli strati da spazio e il primo strato è quello in alto; `*` è una cella qualunque, o lasciata com'è. Ogni regola che cresce ha `steps`.

## Il corpo
Il messaggio dice le misure della scatola e del corpo. Il corpo cammina solo su pavimenti: passa da una colonna alla vicina se il dislivello è al più un gradino, e non ci passa se fra lui e l'altezza della sua testa c'è qualcosa. Tutto ciò che è più stretto del passaggio non esiste per lui.

## Ciò che deve esserci
- **Porta**: sul lato del davanti, in mezzo, alta come una persona e larga almeno un passaggio più 2 voxel, senza nulla davanti. Dal suolo al pavimento interno al più un gradino. Lasciala aperta (aria).
- **Piani**: almeno 2 piani coperti, ciascuno con il soffitto ad almeno una persona dal pavimento. Fai i conti in z prima di scrivere: pavimento, altezza libera, solaio, altro piano, tetto devono stare nella scatola.
- **Scale**: da un piano all'altro una scala o rampa larga almeno un passaggio più 4 voxel, ogni gradino alto al più un gradino del corpo. Sopra la scala il solaio è scavato. L'ultimo gradino arriva al pavimento di sopra con un dislivello al più di un gradino, e accanto c'è pavimento su cui uscire.
- **Stanze**: almeno 3 in tutto, ciascuna larga almeno 2 caselle in entrambi i lati, divise da muri con varchi larghi al più una casella e collegate. Nessun piano o stanza chiuso senza accesso; un sottotetto irraggiungibile va riempito.
- **Salti**: almeno 2 posti piani (casse, banchi, davanzali, piattaforme, ballatoi) in cima ai quali si salta da un pavimento piano: almeno due passaggi di lato, più alti di un gradino e non più del salto, a una distanza di salto da dove si stacca. Lascia libero lo spazio per lo slancio e la testa sopra.
- **Finestre**: almeno 6, su almeno 3 lati: un foro nel muro o una lettera con `alpha` o `glow`, ciascuna almeno 2 × 2, sopra i piedi.
- **Varietà**: almeno 6 materiali, ciascuno visibile, e il più usato non oltre il 60 % dei voxel; ogni lato ha cornici, lesene, travi o altri pezzi piccoli (di almeno 2 voxel: niente puntini sparsi come unico dettaglio); almeno il 12 % delle facciate fuori dal loro piano principale (aggetti, gronde, nicchie); il tetto non è piatto: almeno 4 altezze diverse, ciascuna su un buon tratto; occupa almeno un terzo della pianta della scatola.
- **Solido**: tutto attaccato al corpo principale, che poggia sul fondo; il programma finisce in pochi secondi.

## Come farlo
Decidi prima la pianta e le quote, come numeri. Scrivi in quest'ordine: masse piene, scavo degli interni, solai, muri interni e varchi, scale, arredi per i salti, porta, finestre, dettagli di facciata, tetto. Controlla che i dettagli scritti dopo non chiudano porta, varchi e scale. Tieni il programma compatto: l'edificio deve riconoscersi dallo stile chiesto, in forma, colori e pezzi.
