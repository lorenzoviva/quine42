# ADR-0222 — I modelli locali fuori dal loro mondo, e gli ambienti del seme fuori dal medioevo

Data: 2026-11-19 · Stato: accettato (task T433 del backlog, dalle proposte A ed E di T153) · Riferimenti: ADR-0134 (le ambientazioni della
Genesi, `TIMELESS_LAYOUTS`), ADR-0156 (la sola lettura), ADR-0201 (le regioni trattenute), ADR-0196 (il ritmo del mondo), ADR-0211 (gli ambienti
di un universo restano suoi)

## Contesto

T153 ha letto `orichalcum`, `neapolis` e `sidera` dopo la rigenerazione dei modelli (`lab/banco/universi-t153/README.md`) e ha trovato due
cose fuori tema:

1. **I luoghi e le persone dei modelli locali.** La maggior parte dei luoghi (98 su 114, 88 su 107, 37 su 56) si chiama «Prato di Valmora»,
   «Borgo del Re Muto»; una parte degli individui sono locandieri, pastori, tessitrici. Vengono dalle sessioni `?offline` giocate sui repository
   veri: i modelli locali (`MockAiModels`) scrivono sempre Valmora, il Cartografo locale pianificava i luoghi che il viandante avvicinava, il
   Narratore locale faceva nascere le persone dei loro personaggi, e il kernel li salvava come fossero del Concilio.
2. **Gli ambienti del seme medievale.** orichalcum e neapolis hanno nel manifest i 20 ambienti del seme accanto ai propri (castello, fortezza,
   tana del drago, piramide, caserma…), e i luoghi dei modelli locali li usano. La causa non è la Genesi (ADR-0134 tiene, con meno di tre
   ambienti, solo quelli senza epoca) ma l'aggiornamento dal seme: `upgradeFromSeed` dà a un manifest che l'universo ha riscritto le voci nuove
   del seme che non ha (`mergeKeyed`: terreni, ambienti, rune, incantesimi), e per un manifest riscritto «nuove» erano tutte quelle che mancano.
   L'installatore di T273 lo applica come il browser: orichalcum (che aveva i suoi e gli otto senza epoca) e neapolis (solo i suoi) hanno
   ricevuto il resto del seme al primo caricamento. sidera no: non ha un modulo `world.layouts`, i suoi ambienti stanno in
   `world.ambienti-sidera`. Lo stesso valeva per ogni universo nato da una Genesi: il primo caricamento gli rimetteva i castelli.

## Decisione

1. **I modelli dicono quale mondo scrivono** (`AiModels.world`): i modelli locali scrivono solo Valmora (`LOCAL_WORLD`, il titolo della
   bibbia della loro Genesi e del seme); gli altri (Gemini, OpenRouter, la coda, i modelli instradati) nessuno in particolare.
2. **Fuori dal loro mondo non pianificano e non fanno nascere** (`Kernel.localModelsAbroad`: modelli con un mondo, una bibbia con un altro
   titolo, non uno specchio). Un luogo senza piano resta bozza, trattenuto come in una regione trattenuta e non richiesto a ogni tick
   (`develop`, `pumpDevelopment`); un piano salvato si legge come sempre, e quello il cui ambiente manca (ADR-0134 punto 7) resta bozza anche lui, non lo rifanno i modelli locali. Un
   personaggio senza individuo resta il suo archetipo (il nome del modulo, nessuna chiamata, niente in `world/people.json`); la scheda
   dell'Attore non si scrive. Nella sessione non si vede niente di Valmora, e nessun commit né piano lo porta al repository: il salvataggio
   della partita resta (posizione, inventario, stato). La Genesi offline, aurora e Valmora restano come prima: la loro bibbia è quella dei
   modelli locali. Un test che vuole i modelli locali al posto del Concilio su un altro mondo mette `world = undefined`.
3. **Un universo di un'altra epoca riceve dal seme solo gli ambienti senza epoca** (`seedAged`, `TIMELESS_LAYOUTS`, ora in `themes.ts`): il
   medioevo del seme è il tema medievale così com'è (`themeOfText`), o il tema da cui l'universo è nato (l'impronta in `seed.json`, gli universi
   di prima di T310 col tema italiano), o nessun tema; ogni altro, anche un medievale scritto a mano, è un mondo suo. Gli ambienti che un
   universo ha già restano (ADR-0211): togliere quelli che orichalcum e neapolis hanno ricevuto è la pulizia di D66, con i luoghi che li usano.

## Alternative scartate

- **Tutta la sessione in sola lettura** (come ADR-0156): niente più arriva al repository, ma si perde anche il salvataggio della partita, e la
  sessione mostra comunque i luoghi di Valmora.
- **Piani dei modelli locali salvati e segnati**, da rifare alla prima sessione coi modelli del mondo: un segno nuovo nei piani, e intanto il
  mondo mostra Valmora; i luoghi che restano bozze non costano niente e il Cartografo vero li fa quando torna.
- **Il tema dal titolo o dalla bibbia**: la bibbia cambia giocando; `prompts/theme.md` lo scrive solo la Genesi.

## Conseguenze

- Offline un universo del Concilio si prova solo nei luoghi già fatti: oltre, il terreno della bozza. Le altre cose che i modelli locali
  scrivono su richiesta del viandante (un'azione libera giudicata, un «Esamina») restano come prima: le chiede lui.
- Le installazioni di T273 (`npm run universi:cloud`) non riportano più i castelli negli universi che non li hanno. Kernel 0.9.19.
