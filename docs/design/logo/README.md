# Il materiale per il nuovo logo

Tutto ciò che serve per chiedere il logo di QUINE42 a Claude Design o a Gemini, dalle loro interfacce web, e scegliere tra le alternative. Ciò che sta qui può finire su servizi esterni: niente chiavi, dati di account, universi dell'autore o codice del kernel.

## Cosa c'è

| File | A cosa serve |
|---|---|
| [`brief.md`](brief.md) | Il progetto spiegato a chi non ne sa nulla, le 8 direzioni, lo stile, ciò che va evitato. Si incolla così com'è |
| [`prompt-claude-design.md`](prompt-claude-design.md) | Una richiesta unica: tutte le direzioni in una pagina HTML con gli SVG |
| [`prompt-gemini.md`](prompt-gemini.md) | Un prompt breve per direzione, con le immagini da allegare a ciascuna |
| [`immagini/`](immagini/) | I riferimenti, numerati nell'ordine in cui allegarli |
| [`proposte/`](proposte/) | Dove mettere i loghi che tornano |

## Le immagini

Foto del gioco attuale (`?skip&offline`, modelli locali) e del sito, senza pannelli.

| File | Cosa mostra |
|---|---|
| [`01-il-cerchio-e-la-corona.jpg`](immagini/01-il-cerchio-e-la-corona.jpg) | Il cerchio del mondo e attorno la corona, con gli edifici e le insegne al neon |
| [`02-il-mondo-a-voxel.jpg`](immagini/02-il-mondo-a-voxel.jpg) | Il viandante su un sentiero tra le case, di giorno |
| [`03-rune-a-terra.jpg`](immagini/03-rune-a-terra.jpg) | Le lastre delle rune a terra: la magica `fuoco`, e `x` `=` |
| [`04-i-gerboa-del-concilio.png`](immagini/04-i-gerboa-del-concilio.png) | Quattro gerboa di profilo, ognuno con il suo cappello, foto dei modelli |
| [`05-la-sala-del-concilio.jpg`](immagini/05-la-sala-del-concilio.jpg) | La sala rotonda: i gerboa al tavolo con l'universo che gira, griglia al neon |
| [`06-la-torre-che-brilla.jpg`](immagini/06-la-torre-che-brilla.jpg) | Un modello che brilla: la Torre della Magia e la sua insegna |
| [`07-hero-markovjunior.jpg`](immagini/07-hero-markovjunior.jpg) | La testata del sito con un programma MarkovJunior che cresce a voxel, e la scritta di oggi |
| [`08-componenti-del-sito.jpg`](immagini/08-componenti-del-sito.jpg) | Pannelli, etichette e ombre nette del sito |
| [`09-palette-e-font.jpg`](immagini/09-palette-e-font.jpg) | I colori di `src/theme.css` con gli esadecimali e i tre font |

## Come si usa

**Claude Design**

1. Crea un progetto e allega tutte le immagini.
2. Incolla il blocco di `prompt-claude-design.md`, poi il testo di `brief.md`.
3. Controlla la pagina che torna, poi esportala come HTML autonomo e salvala in `proposte/`.

**Gemini**

1. Una chat nuova per direzione, con le immagini indicate in `prompt-gemini.md`.
2. Incolla il preambolo e il prompt della direzione.
3. Controlla le lettere, poi salva l'immagine in `proposte/`.

I loghi che tornano vanno in [`proposte/`](proposte/), con un nome come `claude-design-giro1.html` o `gemini-3-voxel-1.png`. Formati, limiti e dubbi di ogni strumento sono in testa al suo file di prompt.

## Come confrontare i risultati

Per ogni logo, cinque prove da superare. Se ne manca una, è fuori.

| Prova | Come si fa |
|---|---|
| **Dice QUINE42** | Leggilo lettera per lettera: Q U I N E 4 2 |
| **Si legge a 32 px** | Rimpicciolisci l'icona a 32 × 32 px e guardala al 100 %, sul fondo scuro e su quello chiaro. Con Gemini non basta guardare il riquadro: va ridotta davvero |
| **Si riconosce in bianco e nero** | Guarda la versione a un colore, o togli la saturazione: senza bagliori e senza colori il segno deve restare |
| **È legato al gioco** | Coprendo il nome, ricorda qualcosa di QUINE42 o potrebbe essere il logo di qualunque altro gioco? |
| **Si usa nella landing e nel gioco** | Sta nella barra in cima al sito e sulla schermata iniziale, su fondo `#090514` |

Tra quelli che restano, sceglie l'autore. Sostituire il logo nel gioco e nel sito è un altro task.
