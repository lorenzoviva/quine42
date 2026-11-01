# Prompt per Gemini

Un prompt breve per direzione, una chat nuova per ciascuna: così un'idea non contamina la successiva.

## Formati e limiti: cosa si sa

- Allegati: la [guida di Gemini](https://support.google.com/gemini/answer/14903178), letta il 01/11/2026, dice fino a **10 file per prompt**, secondo disponibilità, e fino a 100 MB per i tipi di file che non hanno un limite a parte. Le immagini di questa cartella stanno sotto i 200 KB.
- **Dubbi, che non ho potuto verificare**: quale modello di immagini offre il tuo account, se il fondo trasparente è disponibile e la risoluzione d'uscita. Gemini dà immagini raster: un logo scelto andrà poi ridisegnato in vettoriale.
- I prompt non sono stati provati. Se le lettere vengono sbagliate più di due volte, chiedi solo il segno, senza scritta, e il nome lo si compone dopo.

## Come usarli

1. Allega le immagini indicate per la direzione: sono poche di proposito, più riferimenti spingono a copiare la scena.
2. Incolla il **preambolo** seguito dal prompt della direzione.
3. **Controlla le lettere**: Gemini gestisce male il testo. Deve esserci scritto QUINE42, sette caratteri, nell'ordine. Se è sbagliato, rispondi: «Le lettere sono sbagliate: deve dire esattamente Q U I N E 4 2. Rifai solo questo, senza cambiare il resto.»
4. L'icona a 32 px va provata a mano: Gemini non sa consegnare a quella misura. Vedi il [README](README.md).

## Il preambolo, uguale per tutte

```text
Disegna un logo per un videogioco chiamato QUINE42 (esattamente questi sette caratteri: Q U I N E 4 2, tutto maiuscolo, attaccati). Quine è un programma che stampa il proprio codice; 42 sono i passi per uscire dal cerchio in cui si gioca. Il gioco è a voxel, visto dall'alto, con un mondo fatto del proprio codice. Stile: pop art a fumetti, retro arcade, neon punk, retrowave; inchiostro deciso, ombre nette. Colori: #ff2a85 #00f0ff #ffe600 #05ffa1 #9d00ff su fondo #090514.
Le immagini allegate mostrano solo il mondo e lo stile: non ricopiarne le scene né i testi.
Un'unica immagine divisa in 4 riquadri uguali: in alto a sinistra il logo su fondo scuro #090514; in alto a destra il logo su fondo chiaro #fff5ea; in basso a sinistra il logo a un solo colore, nero piatto su bianco, senza sfumature né bagliori; in basso a destra l'icona quadrata, semplicissima, che si legga anche piccolissima.
L'unico testo ammesso è QUINE42: niente slogan, sottotitoli o altre lettere. Niente rune fantasy, niente draghi o spade, niente la parola RUNE. Sfondi piatti, nessun mockup.
```

## Le 8 direzioni

### 1. La scritta
Allega: `07`, `09`.
```text
Direzione: solo il nome, senza simboli. Un lettering a fumetto pop art disegnato apposta, potente e un po' storto, in cui la Q e il 42 hanno il carattere più forte. Icona: la sola Q.
```

### 2. Lo stemma
Allega: `08`, `09`.
```text
Direzione: un emblema chiuso come una toppa ricamata o un gettone, con il nome dentro e al centro un segno geometrico semplice. Deve stare bene su una carta collezionabile. Icona: il solo segno centrale.
```

### 3. I voxel
Allega: `02`, `07`.
```text
Direzione: le lettere del nome costruite con cubetti in 3D isometrico, facce a tre toni, come se il nome fosse un oggetto solido del gioco. I cubetti devono essere pochi e grossi, così le lettere si leggono. Icona: un solo blocco voxel con la Q.
```

### 4. Il cerchio e il tappeto
Allega: `01`.
```text
Direzione: un cerchio visto dall'alto con una figura piccolissima esattamente al centro, e linee di movimento concentriche, come un tappeto che la riporta sempre lì. Il cerchio è anche la pancia della lettera Q. Icona: il cerchio con il punto al centro.
```

### 5. Il quine
Allega: `09`.
```text
Direzione: un logo che contiene sé stesso. Una grande lettera Q la cui coda diventa una Q più piccola, che a sua volta ne contiene una più piccola ancora, come un programma che stampa sé stesso. Accanto, il nome QUINE42. Icona: la Q dentro la Q.
```

### 6. La runa è codice
Allega: `03`, `06`.
```text
Direzione: una lastra quadrata a bordi arrotondati, incisa a terra e luminosa, con sopra un solo glifo geometrico inventato che ricorda un segno di programmazione come = o < e nasce dalla forma del 42. Non è un alfabeto antico: è codice che brilla. Sotto la lastra, il nome QUINE42. Icona: la lastra con il glifo.
```

### 7. Il gerboa
Allega: `04`, `05`.
```text
Direzione: una mascotte, un gerboa in stile fumetto (piccolo roditore del deserto: orecchie lunghissime, zampe posteriori lunghe, coda sottile con un ciuffo in punta), simpatico e pacioccoso, con un piccolo cappello. Oppure soltanto le sue due lunghe orecchie che spuntano da dietro il nome, se funziona meglio. Icona: le due orecchie.
```

### 8. L'arcade
Allega: `07`, `09`.
```text
Direzione: l'insegna di un cabinato arcade anni '80. Il nome a grandi pixel squadrati, una griglia prospettica retrowave e un sole al tramonto a strisce dietro. Nessun'altra parola. Icona: la Q a pixel su una griglia di 16 × 16 quadretti ben visibili.
```
