# Catture della verifica nel browser di T292 (ADR-0168)

Prendere e spostare i mobili. Build di produzione, `?skip&offline` (e `?classica` per la 13), Chrome con la scheda di Claude in Chrome, universo del seme generato offline sulla porta della preview. Gli spostamenti del viandante sono fatti dalla console (`docs/architettura-dettagli.md#convalida-browser`); le azioni con i tasti veri (`E`, `1`, `F`, `I`) o con le funzioni che quei tasti chiamano.

- **01**: il menu della credenza di un luogo (origine `-1,0#o1`): «Prendi», «Apri», «Esamina», «Altro…».
- **02**: «Prendi» su quella credenza mai aperta: si riempie come l'aprirebbe (due sidri), e la frase del mondo dice di vuotarla prima.
- **03**: il primo tentativo, **scartato**: la credenza vuotata e presa, sopra la testa a grandezza piena. Dalla camera a 3/4 nasconde quasi tutto il viandante.
- **04**: con `F` la credenza va giù davanti al viandante (la casella a 1,2 caselle), girata con la fronte verso di lui, a un quarto di giro: «Posi Credenza.».
- **05**: dopo il salvataggio e la ricarica della pagina: una sola credenza con quell'origine, al posto nuovo (2,5; 17,5), vuota; dove la faceva il luogo (−1,5; 17,5) non c'è niente.
- **06**: davanti alla porta di una casa (la porta del lotto in 7, 13; la casella davanti 6, 13): «Davanti a una porta Credenza chiuderebbe il passaggio.», e la credenza resta in mano.
- **07**: il menu del pozzo: niente «Prendi».
- **08-10**: le proporzioni scelte (il lato più largo al più 0,48 e l'altezza al più 0,5 dell'altezza del corpo: la credenza a circa 0,7): di fronte, verso destra, in cammino. Il viandante di quel seme ha un braccio solo nel rig, già alzato dal modello: resta com'è; un braccio lungo il fianco si alza (provato nei test sugli otto semi).
- **11-12**: il menu di una casella con la credenza in mano («Posa Credenza qui»), e la credenza posata lì (era sera: la luce cala).
- **13**: `?classica`, la credenza sopra la testa.
- **14**: l'inventario: l'icona è la foto del modello, «si porta sopra la testa (F per posare)», «Riponi», «Posa davanti a te».
- **15**: una strettoia fra gli alberi del luogo di partenza (−2, 3), trovata chiedendo al kernel dove la posa spezzerebbe il luogo: «Lì Credenza chiuderebbe il passaggio.». Un controllo intero (con la connessione su 21 × 21 caselle) costa circa 4 ms in questa scheda.

Non fatto nel browser: il multigiocatore con due schede (serve il server di sviluppo); la doppia presa, ciò che esce sul filo e la posa vista dall'altro sono provati in `tests/spostare.test.ts` con il server e due client sottili.
