# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md). Il quadro lungo di prima, con le voci delle epoche 191-219: `git show 940570f:docs/pipeline/quadro.md`.

Aggiornato il 06/11/2026, epoca 322 (claude). Crediti: vedi `stato`.

## Stato attuale

- **NPC coeso (autore, 06/11 sera):** T326 integrato (`87255e5`, confine `src/kernel/npc/`, facciata `NpcSubsystem`) → **T327 pronto** (claude extra) → T245g-i.
- **Carte fatte a mano (autore, 05/11, step 41):** T293 integrato (`7e6c4e6`, ADR-0161, kernel 0.4.2): archivio `universes/.handmade/`, rotte `/api/handmade` sotto `gate` e `laboratori`, controllo programmi, V-030..V-032 chiuse → T294 (laboratori giocatori) e T295 (carte prima della Genesi) sbloccati.
- **Gemini (autore, 06/11 sera):** consumare Gemini finché orchestro con task non troppo difficili. T322, T323, T326 integrati; T320 (controllo 2 piani) integrato (`86acd5f`, kernel 0.4.3, ADR-0162) → T321 sbloccato.
- **Inglese lingua interna (step 42):** T306 → T307a → T307b → T308a → **T308b (contratto 0.5.0, ADR-0163) integrato via T328** (`4537848`) → **T309 pronto** → T310.
- **T319 e T156 integrati** (`7d9ee13`, kernel 0.4.1, ADR-0160): prompt procedurale Scultore sul contratto 0.4; allineato T156 a fatto nel backlog → sbloccati T88, T242, T303.
- **Oggetti e mobili (autore, 05/11, step 40):** T288 in mano → T289 banco vestiti → T290 in attesa foto; T291 integrato via T301 (ADR-0150); T292 `takeable`.
- **Tre vesti del sito per la beta (autore, 05/11):** T283 integrato (ADR-0145); D41 A: T284, T285, T286 rifatti da Claude v2 → T287. T233 dipende da T287.
- **T275 integrato via T282** (`7b0d821`, kernel 0.1.6, ADR-0143, ADR-0144). T207 integrato con T275.
- **T280 e T297 integrati via T300** (`d4dc0c6`, kernel 0.1.9; ADR-0147..0149).
- **T276 integrato** (`ed092eb`, ADR-0142): MarkovJunior 10-22x più veloce a Enorme.
- **T255 integrato** (`23147ca`, ADR-0146): provider e sforzo in `- Pipeline:`.

## Pronti e priorità

0. **Decisioni autore 04/11:** D32 SemVer `X.Y.Z`. Step 32: T260, T262 → T245a → T263/T245b → T245c-f. T265 prima della beta.
1. **In corso:** T325 (casi d'uso Jev, claude max).
2. **Pronti:** T309 (inglese, dopo 0.5); T327 (NPC coeso, claude extra); T324 (immagini Jev, claude p3); T294 (laboratori giocatori, claude p3); T295 (carte prima della Genesi, claude p3); T315 (veste futuristica, p4); T321 (Scultore su Flash, claude p4); T281 (placeInside bloccati, p5, browser); T303 (misura Scenografo, claude p5); T288 (armi/attrezzi in mano, p6, browser); T242 (rapporto aureo, p33); T88 (generazione differita crediti che avanzano, p60).
3. **Crediti (22:14 UTC):** Claude finestra 5h nuova (reset 02:59 UTC 07/11), settimana 60 % (reset 12/11); Gemini 5h 69 % (reset 23:14 UTC), settimana 86 %; agy 100 %; Argon fermo fino all'11/11.

## Attese dall'autore

- **Domande aperte in `domande/aperte.md`:** D34 (lingue), D35 (piano lancio, account D3.1). Chiuse: D36, D37, D38 A, D46 B+C. Aperta D45 (Jev, T325 la informa). Proposta aperta: `piani.google.pro.moltiplicatoreStima` 2,5 → 1.
- **Autonomia autore confermata fino al 06/11 18:00 locali.**

## Regole attive

- Tetti dell'autore (3 Claude, 1 agy); finestra 5h protetta dallo script; nessun ripiego; Argon solo task piccoli; Fable solo difficili.
- Domande per intero in chat con raccomandazione. Finestra 5h con l'ora del reset. Sforzo: qualità prima del tempo. Mai `git commit -a` nel base.

## Ultime 2 epoche

- **322 (claude):** T328 e T308b integrati (`4537848`, contratto 0.5.0, ADR-0163); sbloccati T309 e T327; T325 in corso.
- **320 (gemini):** T320 integrato (`86acd5f`, kernel 0.4.3, ADR-0162); sbloccati T321, T88, T242, T303.
