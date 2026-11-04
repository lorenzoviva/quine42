# La pagina delle istruzioni e i video del sito

Guida per l'autore (ADR-0131). Nessuno dei due passi tocca il codice.

## Le istruzioni

- `docs/beta/guida.md` è la prima parte. Se il file non c'è, o è vuoto, la pagina non compare: niente link, niente `site/istruzioni.html` nella build.
- `docs/beta/la-corona.md` è la seconda parte. Resta fuori dalla build, testo compreso, finché è spenta.
- **Per accendere la seconda parte**: in `site/beta.json` scrivi `{ "laCorona": true }`, poi fai build e deploy (`npm run build`). In `npm run dev` basta ricaricare la pagina.
- Il Markdown è quello delle notizie: titoli, paragrafi, elenchi, citazioni, codice, `**forte**`, `*corsivo*`, link. Niente immagini né tabelle; l'HTML si legge come testo.
- Controllo che non ci sia: dopo la build, `grep -r "una frase della seconda parte" dist/` non trova nulla.

## I video

I file non stanno nel repository né in `dist/`, ma in una cartella del server.

1. Nel `.env` del server (e in quello di `npm run dev`): `QUINE_VIDEO=<percorso della cartella>`, fuori dal progetto. Serve un riavvio solo la prima volta.
2. Copia nella cartella il file, `.mp4` o `.webm`. Nel nome solo lettere, cifre, `.`, `_`, `-`.
3. Nella stessa cartella, in `video.json`, aggiungi una riga. L'ordine è quello del file; `descrizione` è facoltativa:

```json
{
  "video": [
    { "file": "il-progetto.mp4", "titolo": "Il progetto, raccontato", "descrizione": "Da dove viene e dove va." },
    { "file": "gameplay.mp4", "titolo": "Una partita" }
  ]
}
```

Il video appare al prossimo caricamento della home: niente build né riavvio. Si vede solo ciò che è nell'elenco e ha il suo file; senza nessun video la sezione non c'è.

Un `.mp4` lungo parte e salta in avanti subito se l'indice sta in testa al file: `ffmpeg -i ingresso.mp4 -c copy -movflags +faststart il-progetto.mp4`.
