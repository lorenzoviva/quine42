# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md). Il quadro lungo di prima, con le voci delle epoche 191-219: `git show 940570f:docs/pipeline/quadro.md`.

Aggiornato il 06/11/2026, epoca 318 (gemini). Crediti: vedi `stato`.

## Stato attuale

- **NPC coeso (autore, 06/11 sera):** basso accoppiamento, alta coesione dell'oggetto NPC. T326 integrato (`87255e5`, sezione 10 in `docs/design/comportamento-npc.md`, confine `src/kernel/npc/`, facciata `NpcSubsystem`) → T327 (claude extra, dopo T308b/T328) → T245g-i.
- **Carte fatte a mano (autore, 05/11, step 41):** T293 integrato (`7e6c4e6`, ADR-0161, kernel 0.4.2): archivio `universes/.handmade/`, rotte `/api/handmade` sotto `gate` e `laboratori`, controllo programmi, V-030..V-032 chiuse → T294 (laboratori giocatori) e T295 (carte prima della Genesi) sbloccati.
- **Gemini (autore, 06/11 sera):** consumare Gemini finché orchestro con task non troppo difficili. T322, T323, T326 integrati; T320 (controllo 2 piani) assegnato e in corso su Gemini 3.8 Flash (high).
- **Inglese lingua interna (autore, 05/11 sera, D34 chiusa, step 42):** T306 (0.1.12) → T307a (0.2) → T307b (0.3) → T308a (0.4) integrati. **T308b (0.5) fatto**, conflitti con T319/T156 → **T328 integrare** (claude, p1, attende reset finestra 5h), poi T309 → T310.
- **T319 e T156 integrati** (`7d9ee13`, kernel 0.4.1, ADR-0160): prompt procedurale Scultore sul contratto 0.4. T320 in corso sblocca T321.
- **Oggetti e mobili (autore, 05/11, step 40):** T288 in mano → T289 banco vestiti → T290 in attesa foto; T291 integrato via T301 (ADR-0150); T292 `takeable`.
- **Tre vesti del sito per la beta (autore, 05/11):** T283 integrato (ADR-0145); D41 A: T284, T285, T286 rifatti da Claude v2 → T287. T233 dipende da T287.
- **T275 integrato via T282** (`7b0d821`, kernel 0.1.6, ADR-0143, ADR-0144). T207 aspetta T156 integrato per sbloccare T88.
- **T280 e T297 integrati via T300** (`d4dc0c6`, kernel 0.1.9; ADR-0147..0149).
- **T276 integrato** (`ed092eb`, ADR-0142): MarkovJunior 10-22x più veloce a Enorme.
- **T255 integrato** (`23147ca`, ADR-0146): provider e sforzo in `- Pipeline:`.

## Pronti e priorità

0. **Decisioni autore 04/11:** D32 SemVer `X.Y.Z`. Step 32: T260, T262 → T245a → T263/T245b → T245c-f. T265 prima della beta.
1. **In corso:** T320 (gemini, Scultore 2 piani).
2. **Pronti:** T328 (integrare T308b, claude p1, attende finestra 5h, reset 21:59 UTC); T325 (casi d'uso Jev, claude p2, max); T324 (immagini Jev, claude p3); T294 (laboratori giocatori, claude p3); T295 (carte prima della Genesi, claude p3); T315 (veste futuristica, p4); T281 (placeInside bloccati, p5, browser); T288 (armi/attrezzi in mano, p6, browser).
3. **Crediti (19:34 UTC):** Claude 5h 6 % (reset 21:59 UTC), settimana 60 % (reset 12/11); Gemini 5h 80 %, settimana 89 %; agy 100 %; Argon fermo fino all'11/11.

## Attese dall'autore

- **Domande aperte in `domande/aperte.md`:** D34 (lingue), D35 (piano lancio, account D3.1). Chiuse: D36, D37, D38 A, D46 B+C. Aperta D45 (Jev, T325 la informa). Proposta aperta: `piani.google.pro.moltiplicatoreStima` 2,5 → 1.
- **Autonomia autore confermata fino al 06/11 18:00 locali.**

## Regole attive

- Tetti dell'autore (3 Claude, 1 agy); finestra 5h protetta dallo script; nessun ripiego; Argon solo task piccoli; Fable solo difficili.
- Domande per intero in chat con raccomandazione. Finestra 5h con l'ora del reset. Sforzo: qualità prima del tempo. Mai `git commit -a` nel base.

## Ultime 2 epoche

- **318 (gemini):** T326 integrato (`87255e5`), T293 integrato (`7e6c4e6`), lanciato T320 su Gemini.
- **317 (claude):** T323 integrato.
