# QUINE42 — Template Grafico del Sito Web (`docs/design/sito/`)

> **Master Template Statico (HTML + CSS) per il sito web e le interfacce utente.**  
> Realizzato per il task **T109** (richiesta dell'autore del 01/11/2026, risposta (a) in `docs/pipeline/domande/T97.md`).  
> Riferimenti architetturali: [ADR-0095](../../adr/0095-il-sito-progetto-pagine-e-stile.md), [ADR-0025](../../adr/0025-due-tavoli-e-quarta-parete.md), [ADR-0056](../../adr/0056-le-carte.md), [ADR-0058](../../adr/0058-il-multigiocatore.md), [ADR-0082](../../adr/0082-l-account.md), [ADR-0083](../../adr/0083-i-pagamenti-con-stripe.md), [ADR-0084](../../adr/0084-l-eredita-dei-cloni.md), [ADR-0086](../../adr/0086-la-lobby-multigiocatore.md).

---

## 1. Visione e Filosofia di Design

Questo template rappresenta il design system completo ed esportabile per il portale web e le interfacce di QUINE42.
È concepito come codice **HTML5 + CSS puro e statico**, a zero dipendenze esterne e senza framework monolitici (niente React né Angular), perfettamente integrabile nell'architettura multi-entry di Vite (`site/*.html`) e coerente con il kernel TypeScript.

### I quattro cardini visivi:
1. **Pop Art a Fumetti**: Tratti a inchiostro deciso (`--border-ink-thick`), ombre nette ad angolo retto senza sfocatura (`--shadow-hard-cyan`, `--shadow-hard-pink`), pattern a mezze tinte Ben-Day dots radiali (`--halftone-cyan`, `--halftone-pink`).
2. **Retro Arcade**: Tipografia pixel 8-bit (`Press Start 2P`, `VT323`), badge incisi, bottoni tattili con feedback di spinta 3D.
3. **Neon Punk & Synthwave**: Colori saturi e fluorescenti (Pink `#ff2a85`, Cyan `#00f0ff`, Yellow `#ffe600`, Green `#05ffa1`, Purple `#9d00ff`) che risaltano sullo sfondo notte profondo (`--synth-bg: #090514`), griglia prospettica al tramonto nel footer.
4. **Il Segreto dei Gerboa (ADR-0095)**: Nel footer, al centro della linea d'orizzonte al neon, spuntano unicamente le due sagome delle orecchie lunghe dei gerboa (`.jerboa-peek-container`), con tooltip allusivo e senza alcuna rottura della quarta parete o svelamento dello studio (Regola inviolabile 0).

---

## 2. Mappa dei File del Template

| File | Scopo e Schermata | Task Corrispondente |
|---|---|---|
| [`template.css`](./template.css) | Foglio di stile master: palette, token, font locali, bottoni, pannelli, modali, tabelle, animazioni CSS 3D | Tutti (T101-T106) |
| [`landing.html`](./landing.html) / [`index.html`](./index.html) | Landing page con hero banner 3D, pilastri del mondo, vetrina interattiva delle carte e anteprima moduli | **T101** |
| [`login.html`](./login.html) | Portale d'accesso con login Google Firebase, accesso rapido anonimo e demo stati | **T102** |
| [`profilo.html`](./profilo.html) | Scheda identità viandante, saldo crediti e personalizzazione estetica avatar 3D con mantello e seme | **T102** |
| [`sessioni.html`](./sessioni.html) | Hub reami multigiocatore attivi, specifiche master/modelli e modale wizard «Crea Nuovo Universo» | **T103** |
| [`carte.html`](./carte.html) | Galleria carte collezionabili 3D animate con lamina olografica prismatica, flip bifacciale e quote ereditate | **T104** |
| [`pagamenti.html`](./pagamenti.html) | Cruscotto saldo crediti, selettore tagli di ricarica rapida Stripe Checkout e cronologia transazioni | **T105** |
| [`componenti.html`](./componenti.html) | Style guide e catalogo dei componenti: palette, tipografia, bottoni, badge, input, modali, alert | Tutti (T101-T106) |

---

## 3. Guida Operativa per i Task T101-T106

Ciascun task successivo della pipeline trova in questo template il modello esatto da copiare e collegare alla logica TypeScript.

### T101 · Landing Page e Hero 3D con Three.js
- **File di riferimento**: [`landing.html`](./landing.html), [`template.css`](./template.css).
- **Destinazione nel gioco**: `site/index.html`, `site/site.css`, `site/landing.ts`.
- **Cosa fare**:
  1. Copiare la struttura HTML di `landing.html` in `site/index.html`.
  2. Sostituire il placeholder statico `.hero-mockup-3d` con il canvas interattivo Three.js animato in tempo reale da `site/landing.ts` (sfondo orbitale a voxel procedurali MarkovJunior).
  3. Mantenere la carta demo 3D in CSS interattiva con flip fronte/retro.
  4. Garantire che la CTA «GIOCA SUBITO» punti a `../index.html` e che il footer contenga la silhouette SVG dei gerboa.

### T102 · Login e Profilo Viandante con Visualizzatore 3D
- **File di riferimento**: [`login.html`](./login.html), [`profilo.html`](./profilo.html).
- **Destinazione nel gioco**: `site/profilo.html` e modulo TS associato.
- **Cosa fare**:
  1. Adottare il layout a due colonne di `profilo.html`: colonna sinistra per i dettagli account (ID, stato, crediti, pulsante lega a Google riusando `linkWithPopup` da `src/session/login.ts`); colonna destra per la personalizzazione estetica.
  2. Collegare il box `.avatar-preview-box` al visualizzatore Three.js con il modello voxel dell'avatar renderizzato da `src/mj/mesh.ts`.
  3. Collegare la tavolozza `.color-swatch` per impostare il colore del mantello e lo slider `.comic-slider` per impostare il seme generativo MarkovJunior.
  4. Integrare gli stati di `login.html` (accesso Google o anonimo) in un pannello o schermata di login.

### T103 · Hub Sessioni Multigiocatore e Creazione Nuovo Universo
- **File di riferimento**: [`sessioni.html`](./sessioni.html).
- **Destinazione nel gioco**: `site/sessioni.html` e modulo TS associato.
- **Cosa fare**:
  1. Interrogare `/api/universe` per elencare i reami git disponibili e `/api/session` per lo stato in tempo reale delle sessioni attive.
  2. Renderizzare le schede reame `.realm-card` popolando dinamicamente master, modelli IA, coefficienti, spesa stimata e tetto minimo.
  3. Collegare il wizard modale `.comic-modal` al flusso di creazione di un nuovo universo git via API di `server/universeStore.ts`, con nome slug, seme e profilo IA.

### T104 · Area Carte Collezionabili 3D Animate
- **File di riferimento**: [`carte.html`](./carte.html).
- **Destinazione nel gioco**: `site/carte.html` e modulo TS associato.
- **Cosa fare**:
  1. Leggere la collezione del viandante tramite `collectionOf` da `src/kernel/cards.ts` e `world/carte.json`.
  2. Renderizzare ciascuna carta nella griglia `.card-collection-grid` usando la struttura `.retro-card` in CSS 3D con lamina olografica prismatica (`.card-holo-foil`).
  3. Fronte della carta: nome, classe di rarità (`.comic-badge`), miniatura d'arte voxel, descrizione e contatori vivi di utilizzo (luoghi, trame, prompt, totale).
  4. Retro della carta (flip su clic): stemma QUINE42, codice MinHash e catena genealogica dei cloni titolari con relative quote economiche di eredità (ADR-0084).

### T105 · Area Pagamenti e Cruscotto Crediti Stripe
- **File di riferimento**: [`pagamenti.html`](./pagamenti.html).
- **Destinazione nel gioco**: `site/pagamenti.html` e modulo TS associato.
- **Cosa fare**:
  1. Visualizzare il saldo crediti in dollari ($ USD) del viandante.
  2. Implementare la selezione dei tagli di ricarica prefissati ($5, $10, $20, $50) o importo personalizzato tramite i componenti `.tier-card` e `.comic-input`.
  3. Connettere il pulsante d'acquisto all'endpoint protetto `/api/stripe/checkout` per avviare la sessione di pagamento Stripe.
  4. Renderizzare la tabella cronologica `.comic-table` leggendo le registrazioni da `world/pagamenti.json`.

### T106 · Applicazione del Tema alle Interfacce In-Game
- **File di riferimento**: [`template.css`](./template.css), [`componenti.html`](./componenti.html).
- **Destinazione nel gioco**: `src/style.css`, `src/ui/hud.ts`, `src/ui/inventory.ts`, `src/ui/lobby.ts`, `src/ui/profile.ts`, `src/ui/chat.ts`, `src/ui/creditdialog.ts`.
- **Cosa fare**:
  1. Applicare le classi utility e i token di stile alle finestre del gioco: bordi a inchiostro netto `--border-ink-thick`, ombre neon cyan/pink `--shadow-hard-cyan`, pulsanti arcade retrò `.comic-btn.arcade`.
  2. Introdurre il pattern a mezze tinte Ben-Day dots (`--halftone-cyan`) sul fondale delle modali in-game (inventario, dialogo crediti esauriti, pannello lobby).
  3. Utilizzare i badge arcade `.comic-badge` per le etichette di stato e il font display `Bangers` per le notifiche e gli annunci del mondo.

---

## 4. Regole Inviolabili e Linee Guida per i Testi

- **Regola 0 (Due Tavoli, ADR-0025)**: Niente meta-gioco nei testi per il pubblico. Nessuna allusione alla software house, al Concilio come agenti IA, alla simulazione come inganno o al raggio di 42 passi del tappeto.
- **Il segreto dei gerboa**: Sempre e solo allusivo, come nell'ADR-0095. Le orecchie lunghe sono visibili come silhouette nell'orizzonte notturno, comprensibili solo per chi ha superato il tappeto nel gioco.
- **Font locali**: Nessuna richiesta a domini esterni (`fonts.googleapis.com` o `fonts.gstatic.com`). I font provengono dai file `.woff2` locali serviti da `/fonts/`.
- **Lingua**: Tutti i testi e le interfacce utente sono in italiano puro, autentico e immersivo.
