
# Analisi sperimentale: MarkovJunior 3D rendering

Stiamo sviluppando questo gioco "Rune", dove tutti i contenuti di gioco, eccetto il kernel, sono generati tramite l'IA.
Anche le mappe, gli edifici, i sotterranei e i personaggi sono generati tramite IA. La generazione grafica degli asset, tuttavia, è molto dispendiosa e produce risultati non sempre soddisfacenti in termini di coerenza visiva.

### MarkovJunior

Per la generazione delle tiles e dei chunk del gioco, il "cartografo" (agente deputato al disegno delle mappe) scrive un programma nel linguaggio di progrmmazione logico di MarkovJunior.

Vorremmo adottare un uso più estensivo di questo approccio per la generazione di altri elementi di gioco: edifici, sotterranei, personaggi, e oggetti. 
Tuttavia avendo cambiato la prospettiva a 3/4 (sempre in top-down), l'approccio precedente non garantisce più risultati soddisfacenti. 

### render 3D di markovjunior

Per fortuna MarkovJunior ha un render 3D integrato che permette di esportare le immagini. Si potrebbe in teoria sfruttare questa caratteristica per generare i modelli 3D, metterli nella corretta prospettiva e "fotografarli" per ottenere gli sprite finali.

In questo modo si otterrebbe: 
1. Coerenza tra i modelli 3D
2. maggiore varietà di pose e direzioni di ripresa
3. risparmio economico (inferiore costo per l'uso di API rispetto alla generazione diretta di immagini 2D per tutti gli sprite)

Cosa ci serve

Sviluppare una serie di strumenti e procedure per:

1. generare i modelli 3D in markovjunior: creare un agente che scrive il codice in MarkovJunior (probabilistic programming language). Il codice deve essere in grado di generare un modello 3D di un oggetto/edificio/tile. 
2. esporli nella prospettiva corretta
3. generarne i vari sprite (partendo da 4 immagini per ogni modello: 1 frontale, 1 destra, 1 retro, 1 sinistra)
4. restituire lo sprite all'artista che decide se va bene


Vogliamo valiare questa possibilità senza integrarla ancora all'interno del gioco, per vedere se gli agenti sanno scrivere codice in mj in modo da generare modelli 3d sensati. 
Iniziamo creando una pagina separata, sullo stesso server, in cui proviamo a rigenerare i vari assets dell'universo di valmora. 

Il punto 1 è fondamentale: se non sono in grado di generare modelli sensati non ha senso proseguire con gli altri punti. 
I punti da affrontare sono in ordine: 
1. generare modelli 3d di elementi semplici (oggetti, rocce, alberi). Ad esempio prova a generare rocce di varia forma e dimensione, e vari tipi di alberi (di alto fusto e cespugli, ecc...). 
2. se ci riusciamo, passando ad elementi più complessi: edifici, colonne, porte, ecc... 
3. se riusciamo anche con questo, proviamo con i personaggi e i mostri (il problema qui sarà la posabilità, dovremo essere sicuri di generare pose che non creino artefatti grafici e che siano coerenti con la prospettiva a 3/4. 
4. una volta che ci riusciamo con tutte queste categorie, penseremo a come integrare il tutto nel gioco, a come generare i vari sprite e a come integrare l'opzione nel pannello di amministrazione. 

Tieni tutta la logica aggiunta separata, in modo da poter tornare indietro facilmente.