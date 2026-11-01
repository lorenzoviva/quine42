# Prompt per Claude Design

Una sola richiesta con tutte le direzioni. Il testo qui sotto è pronto: incolla il blocco, poi il contenuto di [`brief.md`](brief.md).

## Cosa allegare

Tutte le immagini di [`immagini/`](immagini/), nell'ordine dei numeri (9 file, ciascuno sotto i 200 KB).

## Formati e limiti: cosa si sa

Dalla [guida di Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), letta il 01/11/2026:

- si possono caricare schermate e documenti; **numero e peso massimo degli allegati non sono scritti**. Se le 9 immagini non passano, togli per prime la 08 e la 02;
- l'esportazione offre `.zip`, PDF, PPTX, Google Slides e HTML autonomo; **l'SVG non è citato**. Per questo il prompt chiede una pagina HTML con gli SVG dentro: l'SVG si ricava dal sorgente della pagina. Non l'ho provato: al primo giro controlla che gli `<svg>` ci siano davvero.

## Il testo

```text
Devi disegnare il logo di un videogioco. Sotto trovi il brief completo; le immagini allegate mostrano il gioco e il suo stile, numerate così:
01 il cerchio e la corona, 02 il mondo a voxel, 03 le rune a terra, 04 i gerboa, 05 la sala dove lavorano i gerboa, 06 un edificio al neon, 07 il sito con l'animazione a voxel, 08 i componenti del sito, 09 palette e font.
Non ricopiare i testi delle immagini: l'unico testo ammesso nel logo è QUINE42.

Fai una sola pagina HTML, autonoma e senza dipendenze esterne, con tutte le 8 direzioni del brief, una sezione per direzione, in quest'ordine:
- il nome della direzione e una riga sul perché;
- la versione su fondo scuro (#090514);
- la versione su fondo chiaro (#fff5ea);
- la versione a un colore (solo #07040d su #fff5ea, senza sfumature né bagliori);
- l'icona, mostrata a 32 × 32 px reali e, accanto, ingrandita a 128 × 128 px.

Ogni logo e ogni icona deve essere un <svg> vettoriale scritto dentro la pagina, con viewBox e un id come dir3-scuro, dir3-chiaro, dir3-uncolore, dir3-icona: niente immagini raster, niente canvas. Le lettere devono essere tracciati (<path>), non testo con un font: il logo deve restare uguale senza nessun font installato. Se per una versione non riesci, dimmelo nella riga di quella direzione.

Le 8 direzioni devono essere davvero diverse tra loro per idea e per costruzione, non lo stesso segno con colori diversi. Una direzione che regge solo grazie al bagliore non va bene: la versione a un colore è la prova. Prima di consegnare controlla in ogni logo, carattere per carattere, che il nome sia QUINE42, e che ogni icona si legga davvero a 32 px: a quella misura togli i dettagli invece di rimpicciolirli.

Non fare altro oltre a questa pagina: niente sito, niente animazioni, niente testi di marketing.

Ecco il brief:
```

Dopo il blocco incolla tutto `brief.md`.

## Per il secondo giro

Quando ne hai scelte due o tre:

```text
Tengo le direzioni N e M. Per ciascuna fammi tre variazioni che cambiano la costruzione del segno, non i colori, sempre con le quattro versioni e gli stessi id. Controlla di nuovo le lettere di QUINE42 e l'icona a 32 px.
```
