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
- `<box at="cx cy z0" size="w d h" color="A"/>`: per i voxel da x0 a x1, cx = (x0+x1)/2 e w = x1-x0+1; z0 è il fondo, h l'altezza; `at` ha sempre tre numeri.
- `<cylinder>`, `<cone>`, `<ellipsoid>` con gli stessi attributi; `<line at="x y z" to="x y z" r="1" color="A"/>`.

## Il corpo
Il corpo cammina solo su pavimenti: passa da una colonna alla vicina se il dislivello è al più un gradino, e non ci passa se fra lui e l'altezza della sua testa c'è qualcosa. Tutto ciò che è più stretto del passaggio non esiste per lui.

## Ciò che deve esserci
- **Porta**: sul lato del davanti, in mezzo, alta come una persona e larga almeno un passaggio più 2 voxel; da lei una linea dritta sgombra e scoperta fino al bordo del davanti (con un cortile: portone e porta dell'edificio sulla stessa x, niente tettoia, portico, ponte o balcone sopra di lei, a nessuna altezza). Dentro un muro di cinta il portone è un androne coperto, largo e profondo almeno 1,7 caselle, che arriva al bordo del davanti. Dal suolo al pavimento interno al più un gradino.
- **Piani**: almeno 2 piani coperti, ciascuno con il soffitto a una persona più 2 voxel dal pavimento. Fai i conti in z prima di scrivere: pavimento, altezza libera, solaio, altro piano, tetto devono stare nella scatola.
- **Scale**: da un piano all'altro una scala o rampa larga almeno un passaggio più 4 voxel, ogni gradino alto al più un gradino del corpo. Sopra la scala l'aria è libera per una persona più 2 gradini, muri e solai compresi, anche in cima e in fondo. In cima e in fondo sbocca in linea su pavimento libero, largo come lei per almeno 2 passaggi, a non più di un gradino; parapetti solo sui lati lunghi, nessun muro o arredo davanti al primo gradino. Esempio con gradino 4: pavimento di sotto a z=2, solaio z=34-35, pavimento di sopra a z=36; la scala occupa x 70-84, y 30-65 e sale verso y piccolo, il foro del solaio è esattamente sopra di lei e si scrive prima di lei:
```xml
<box at="77 47.5 34" size="15 36 2" color="B"/>
<box at="77 64 2" size="15 4 4" color="S"/>   <!-- y 62-65, cima z=6 -->
<box at="77 60 2" size="15 4 8" color="S"/>   <!-- y 58-61, cima z=10; così via, -4 in y e +4 in h -->
<box at="77 32 2" size="15 4 32" color="S"/>  <!-- y 30-33, cima z=34; a y 29 si è sul pavimento di sopra -->
```
- **Solai**: una sola scatola continua fino ai muri, poi il foro della scala. Ogni scavo con `B` sta fra pavimento e soffitto del suo piano: una fessura di un voxel nel solaio ferma il corpo come un muro.
- **Stanze**: almeno 4 in tutto, ciascuna con un rettangolo sgombro (niente arredi, scale, colonne) di almeno 1,7 × 1,7 caselle: muri sottili, arredi e macchine, anche grandi, contro i muri, mai in mezzo; nessun tratto di pavimento resta isolato dietro di loro. Divise da muri con varchi larghi al più una casella e collegate. Nessun piano o stanza chiuso senza accesso; un sottotetto irraggiungibile va riempito.
- **Cantina**, se la scatola ne ha una: uno spazio sgombro di almeno 2 × 2 caselle. Il kernel la annulla se sotto il suolo c'è un solo pavimento irraggiungibile. Botti e casse arrivano almeno a un gradino sotto il suolo e stanno contro i muri, senza fessure dietro o fra loro. La sua scala ha ogni gradino profondo almeno mezzo passaggio più 1 voxel: sopra la tromba il corpo non sta oltre un gradino sotto i piedi.
- **Salti**: almeno 3 posti dove il salto serve. Si atterra solo su pavimenti a cui si arriva anche a piedi: sulla cima di una cassa non si sta. Quindi: un ostacolo basso (cassa, banco, tubo; più alto di un gradino, non più di quanto sale il salto, profondo da mezza casella a una e mezza) da scavalcare verso il pavimento al di là; oppure un vuoto, largo meno del salto, fra due pavimenti raggiungibili (ballatoi, il pozzo della scala). Prima e dopo, pavimento piano per almeno due passaggi.
- **Finestre**: almeno 6, su almeno 3 lati: un foro nel muro o una lettera con `alpha` o `glow`, ciascuna almeno 2 × 2, sopra i piedi; grate e montanti non la spezzano in riquadri più stretti di 3 voxel.
- **Varietà**: almeno 6 materiali visibili, il più usato sotto il 50 % dei voxel; dettagli di almeno 2 voxel, niente puntini sparsi.
- **Solido**: tutto attaccato al corpo principale, che poggia sul fondo.

## L'aspetto
Il gioco lo guarda dall'alto in 3/4: il tetto è metà di ciò che si vede.
- **Masse**: mai un parallelepipedo unico. 2-4 volumi di altezza e pianta diverse, sfalsati di almeno una casella (corpo, ala, torre, avancorpo), che lasciano libero il 20-50 % della pianta: cortile, terrazza, tettoia, recinto.
- **Tetto**: un solo materiale per falda, mai strisce di colori alterni. A falde: scatole sovrapposte che rientrano poco a ogni quota, stesso colore, con gronda sporgente e colmo scuro sottile. Se la scatola è bassa, il tetto scende dentro il piano alto. Su di esso pezzi che raccontano l'edificio: comignoli, abbaini, lucernari, ciminiere, macchine.
- **Lati**: ogni lato ha una cosa che gli altri non hanno (ingresso, loggia, scala esterna, tubi, contrafforti, insegna); niente griglie ripetute uguali.
- **Il tema si vede da fuori**: ciò che il testo chiede come elemento distintivo sta fuori, grande, con proporzioni vere (una ciminiera è alta e snella).
- **Dentro**: ogni stanza chiesta si riconosce dagli arredi, anche ai piani alti; niente piani vuoti.
- **Colori**: 2-3 toni dominanti e 2-3 d'accento usati poco; niente puntinato sui muri.

## Come farlo
Decidi prima la pianta e le quote, come numeri. Scrivi in quest'ordine: masse piene, scavo degli interni, solai, muri interni e varchi, scale, arredi per i salti, porta, finestre, dettagli di facciata, tetto. Per ultimi, ripassa con `B` l'aria di porta, varchi e scale, così nessun dettaglio li chiude.
