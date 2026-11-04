# ADR-0134 — Le ambientazioni della Genesi: testo tra cui scegliere, un seme solo

Data: 2026-11-04 · Stato: accettato (task T152 del backlog) · Riferimenti: ADR-0025 (due tavoli), ADR-0041 (ogni aspetto è un programma), ADR-0043 (i lotti), ADR-0075 (il lessico, uguale in ogni ambientazione)

## Contesto

L'autore vuole quattro universi tra cui scegliere: medievale (quello che c'è), steampunk, moderno (grande città, anni 90), futuristico (neonpunk). Il tema era già testo libero nella schermata della Genesi, ma il seme presupponeva il medioevo in più punti: i prompt, gli esempi, il canone, le case comuni. Il censimento con file e riga è in [`docs/temi-censimento.md`](../temi-censimento.md).

## Decisione

1. **Un'ambientazione è testo.** `WORLD_THEMES` (`src/kernel/themes.ts`) sono quattro testi offerti da una tendina nella Genesi: scelto uno riempie il riquadro, che resta modificabile; un testo riscritto è «Su misura». Il kernel non sa quale è stato scelto: di una Genesi resta `prompts/theme.md`, come sempre, e l'epoca la portano bibbia e stile. Niente seme per ambientazione, niente campo nuovo in `universe.json`. Il medievale è uguale al seme (`prompts/theme.md`, un test lo controlla).
2. **Il seme resta Valmora; diventa neutro ciò che sopravvive alla Genesi.** I prompt degli agenti, i principi e il canone parlano di epoca, con esempi di più epoche. Bibbia, stile, ambienti e moduli di esempio non si toccano: la Genesi li sostituisce.
3. **Le rune valgono ovunque** con una sezione del canone, «In ogni epoca»: le stesse rune, «magia» come parola più comune, e ogni mondo ne parla a modo suo. Il tema dice come le vede la gente, senza maghi né metagioco.
4. **Il filtro della quarta parete non si allenta.** `META_RE` vieta parole e può colpire «il programma alla radio» o «computer» in una città: i principi chiedono parole del mondo (trasmissione, calcolatore, terminale). Costa una riga ritirata o una bibbia richiesta, mai la quarta parete. Parole diverse per tema vorrebbero un tema noto al kernel, e il tema è testo libero.
5. **Le case comuni dipendono dal mondo.** Erano la cosa più visibile che tradiva il tema: ogni lotto senza struttura chiesta mostrava la casetta di paglia del seme. L'Artista, nella guida di stile, dice `case_comuni` solo se in quest'epoca non sono casette; il kernel lo scrive in `commonHouse` del manifest dei terreni e i lotti comuni chiedono allo Scultore un modello, uno per classe di lotto (`commonHouseModel`), davanti a ogni altro nella coda del `ModelDirector`. Senza il campo tutto è come prima: gli universi esistenti e un mondo medievale non hanno un lotto diverso né una chiamata in più.
6. **Una Genesi con troppo pochi ambienti tiene solo quelli senza epoca** (`TIMELESS_LAYOUTS`), non un castello tra i neon. Vale per tutte le ambientazioni: anche il medievale, in quel caso degenere, perde il castello.
7. **Un piano salvato il cui ambiente non c'è più si rifà** (`develop`): è di un altro mondo, una Genesi con lo stesso titolo (la firma di un luogo è il titolo della bibbia). Prima si applicava senza ambiente.
8. **`?offline` può fare una Genesi con i modelli locali**, solo per le prove (`show(online, local)`): il tema resta scritto e ogni passo si compie, ma i modelli locali scrivono sempre Valmora e la schermata lo dice. Senza `?offline` e senza chiave il bottone resta spento, come prima.

## Conseguenze

- Un universo esistente non cambia: tema, bibbia, stile, ambienti, lotti restano; riceve solo i prompt e il canone più neutri, se non li ha riscritti, come ogni miglioramento del seme (`upgradeFromSeed`).
- I nomi dei timbri (`castello`, `tana`…) restano: sono l'API dei programmi su disco. La loro forma resta (un fossato è un fossato).
- Il viandante resta col suo mantello in ogni mondo; la bozza resta natura e una città si fa con gli ambienti.
- Una Genesi non medievale costa due modelli di struttura in più, dentro `ai.maxModels`.
- Quanto il tema tenga davvero nei contenuti si vede solo con Gemini: la lista di cosa guardare è nel censimento, per T153.
