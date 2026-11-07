# Catture della verifica nel browser di T295 (ADR-0170)

Le carte portate prima della Genesi. Build di produzione (`npm run build`), `npx vite preview` su una porta libera, `?offline`, Chrome con la
scheda di Claude in Chrome. Gli spostamenti del viandante sono fatti dalla console (`docs/architettura-dettagli.md#convalida-browser`).

Preparazione: `?universo=t295-alfa&offline` nasce dallo store con la radice del contratto 0.5 (`3beeaaa…`, il primo commit) e la scelta aperta
(`cardChoice: "seed"`); la sua Genesi offline la chiude («la scelta delle carte si chiude: comincia la Genesi»). Poi dalla console tre carte
di alfa, come le farebbero lo Scultore e il Musicista (`addModel` con la carta di `model.sculpt`, `composing.make`): `npc-vecchio` con il
programma del gerboa del Narratore, `obj-pane` con quello del cristallo arcano (così si riconoscono a colpo d'occhio), e il brano «Il bosco
che canta» per l'ambiente `stazzo`.

- **01**: `?universo=t295-beta&offline`, un universo nuovo: la stessa radice di alfa. Nella Genesi il pannello «Le carte da portare» mostra
  «Da «t295-alfa» (kernel 0.5.6)» con le tre carte (classe, voto, id; il suono con il suo ambiente); scelte tutte e tre, «3 carte scelte».
- **02**: «Genera il mondo con i modelli locali»: le carte entrano prima (un commit del Kernel, «carte portate prima della Genesi: «Vecchio»
  (t295-alfa), «Pane» (t295-alfa), «Il bosco che canta» (t295-alfa)»), poi la Genesi. Nel mondo di beta il Vecchio porta il modello di
  alfa (il gerboa, a destra) e il pane il suo (il cristallo, in basso): lo Scultore non li ha rifatti (`sculpting.missing()` non li ha). Il
  titolare delle tre carte in beta è `me`, la catena `me@t295-alfa`.
- **03**: dopo la ricarica della pagina (`&dev&teleport=…`): gli stessi modelli, dal disco, il Vecchio al lavoro accanto al cristallo.

Non in catture, detto dalla console: nell'ambiente `stazzo` di beta (il luogo «Prato di Valmora») il direttore del suono suona
`sound-music-il-bosco-che-canta` (`window.suono.director.now`), il brano venuto con le carte; la storia di beta è radice → nascita → carte
portate → il kernel le prende → la scelta si chiude → Genesi.

Non fatto nel browser: la lobby di un clone (serve il server di sviluppo per il multigiocatore) e le carte fatte a mano (l'interruttore dei
laboratori è spento): li provano `tests/bring.test.ts` e `tests/sicurezza/carte-portate.test.ts`.
