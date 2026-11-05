# ADR-0145 — Il sito ha una base comune e tante vesti: una cartella per veste, un attributo sulla radice

Data: 2026-11-05 · Stato: accettato · Riferimenti: ADR-0095 (il sito), ADR-0111 (la CSP), ADR-0112 (il server di produzione), ADR-0131 (la home per la beta), T232, T241, T283

## Contesto

L'autore vuole confrontare tre filoni grafici del sito (futuristico, fumetto, sobrio) e, se nessuno prevale, farli scegliere ai beta tester. In `site/site.css` struttura e aspetto erano la stessa cosa: una palette dai nomi di un solo aspetto (`--neon-cyan`, `--comic-ink`), colori scritti a mano, misure fuori scala e una classe `home` che dava un altro aspetto a due pagine sole. Una veste doveva poter cambiare tutto l'aspetto senza toccare la struttura, e la CSP vieta gli script scritti nell'HTML, cioè il modo solito di applicare una scelta prima del primo disegno.

## Decisione

- **La veste** (`skin` nel codice: «tema» indica già le ambientazioni e `src/theme.css`) è una cartella, `site/skins/<id>/`, con `skin.json` (`nome`, `descrizione`, `icona`), `skin.css`, l'icona e, se servono, font e sfondi; `effects.ts` è facoltativo (`start()` e, come ritorno, come fermarsi). Aggiungerne una non tocca la base: la trovano il plugin (`server/skins.ts`) e il selettore (`site/skin.ts`). Una cartella che non è una veste resta fuori, e la build dice perché.
- **Si sceglie con un attributo sulla radice**, `<html data-skin="…">`. I token stanno sotto `:root[data-skin='<id>']`, ogni altra regola della veste sotto `[data-skin='<id>']`.
- **Il contratto non è un elenco da tenere aggiornato**: è ogni `--skin-*` che la base legge (CSS, pagine, TS). La base non ne dichiara nessuno e non ha colori propri. `tests/site-skins.test.ts` controlla che ogni veste li dichiari tutti, senza un secondo elenco che possa invecchiare.
- **Nomi di ruolo, non di colore** (`--skin-accent`, `--skin-on-bright`, `--skin-title-shadow`): `--neon-cyan` in una veste che non lo è mentirebbe. `src/theme.css` e i nomi del gioco restano com'erano: il gioco non ha vesti.
- **Niente lampeggio: uno script esterno all'inizio di `<head>`**, `/skins/boot.js`, generato dal plugin con le vesti trovate. Sceglie tra gli id noti e scrive il foglio con `document.write`: un foglio incontrato dal parser blocca il primo disegno, uno aggiunto con `createElement` no. Ciò che il browser ricorda serve solo a scegliere tra gli id noti e non finisce mai nella pagina. Misurato: `renderBlockingStatus` del foglio è `blocking`, e si scarica solo la veste scelta con i suoi font.
- **Nessuna rotta**: i file sono file di `dist/skins/`, serviti da `buildFile`, con gli stessi indirizzi in sviluppo. `skin.json` ed `effects.ts` non si servono così: li porta Vite, ed `effects.ts` è un pezzo a parte caricato solo per la veste in uso. `skin.css` non passa da Vite: i suoi `url()` sono relativi alla cartella.
- **Il selettore** ricorda la scelta in `localStorage` (`quine:sito:veste`). Cambiando veste, il foglio vecchio se ne va solo quando è arrivato quello nuovo. Voti e rotte sono di T287. I palchi three.js leggono i token e seguono l'evento `quine:skin`: i quattro colori che leggono devono essere esadecimali.
- **La griglia comune**: spazi, corpi e interlinea del sito solo dalla scala aurea, in base e vesti, con un test come per HUD e pannelli; larghezza di pagina 1364 (Lucas), colonne φ:1. La scala guadagna `--space-55`, `--space-89`, `--measure-1364`.
- **La veste di partenza è la sobria**: l'aspetto della home di T244. La classe `home` non c'è più e quell'aspetto vale per tutte le pagine, che è ciò che chiede «tutte le pagine la seguono». Fumetto e futuristica nascono come prime stesure (solo colori, font, ombre, sfondi): il loro carattere è di T285 e T284, il logo della sobria di T286.
- **Senza JavaScript** vale la veste di partenza (`<noscript>`), con `vite-ignore` perché Vite non provi a raccoglierla.

## Alternative scartate

- **Tutte le vesti in un foglio solo, scelte dal selettore CSS.** Niente `document.write`, ma ogni pagina scaricherebbe tutte le vesti e le loro regole: il task chiede di caricare solo ciò che serve.
- **Il foglio con `blocking="render"`.** Non è supportato da tutti i browser, e altrove tornerebbe il lampeggio.
- **Nascondere la pagina finché la veste non è pronta.** Se qualcosa va storto la pagina resta vuota; oggi resta il testo.
- **Le vesti in `public/`.** Niente plugin, ma una veste starebbe in due posti (i file lì, `effects.ts` qui) e l'elenco di `boot.js` andrebbe tenuto a mano, cioè si toccherebbe la base per aggiungerne una.
- **Tenere i nomi `--neon-*` e cambiarne i valori.** Meno righe di diff, ma nomi falsi per sempre.

## Conseguenze

- Una veste nuova è una cartella; ciò che la base chiede in più si scopre dal test, per tutte le vesti, nello stesso commit.
- `document.write` resta in uno script solo, ed è una scelta: se un browser smettesse di onorarlo, si vedrebbe un lampeggio, non un guasto.
- Le pagine diverse dalla home perdono l'aspetto a fumetti sotto la sobria: ora è nella veste fumetto.
- Sicurezza: nessuna rotta né superficie nuova in produzione. In sviluppo il plugin serve solo nomi semplici di `site/skins/`, con le estensioni di un elenco.
