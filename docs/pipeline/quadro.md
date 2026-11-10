# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md). Il quadro lungo di prima, con le voci delle epoche 191-219: `git show 940570f:docs/pipeline/quadro.md`.

Aggiornato il 10/11/2026, epoca 340 (claude). Crediti: vedi `stato`.

## Stato attuale

- **NPC coeso (autore, 06/11 sera):** T327 integrato (facciata `Npc` in `src/kernel/npc/`, kernel 0.5.3, ADR-0166) → **T332 integrato** (chi dorme non saluta, kernel 0.5.4) → T245g-i.
- **Carte fatte a mano (autore, 05/11, step 41):** T293 integrato (ADR-0161) → **T294 integrato** (laboratori giocatori, ADR-0169) → **T295 integrato** (carte prima della Genesi, radice del contratto, `cardChoice`, ADR-0170, kernel 0.5.6, V-033 chiusa) → **T296 integrato** (carte guaste isolate, «Togli» del master, ADR-0172, kernel 0.5.8). Restano fuori: universi senza radice, modelli scolpiti prima di 0.5.6 senza carta, `npm run genera` non sceglie carte.
- **Gemini (autore, 06/11 sera):** consumare Gemini finché orchestro con task non troppo difficili. T322, T323, T326 integrati; T320 (controllo 2 piani) integrato (`86acd5f`, kernel 0.4.3, ADR-0162) → T321 sbloccato.
- **Inglese lingua interna (step 42):** … T308b (contratto 0.5.0) → T309 (kernel 0.5.1) → **T310 integrato** (prompt del Concilio in inglese, `universe.json → language`, kernel 0.5.2, ADR-0165) → **T310b proposto** (campi degli schemi, legame come id, contratto 0.6; da approvare).
- **T319 e T156 integrati** (`7d9ee13`, kernel 0.4.1, ADR-0160): prompt procedurale Scultore sul contratto 0.4; allineato T156 a fatto nel backlog → sbloccati T88, T242, T303.
- **Oggetti e mobili (autore, 05/11, step 40):** T288 integrato (in mano, ADR-0167) → **T289 integrato** (banco vestiti, D47: consiglio C+B) → T290 attende D47; **T292 integrato** (mobili da prendere e posare, `takeable`, ADR-0168, kernel 0.5.5); T291 integrato via T301 (ADR-0150); T292 `takeable`.
- **Tre vesti del sito per la beta (autore, 05/11):** T283 integrato (ADR-0145); D41 A: T284, T285, T286 rifatti da Claude v2 → T287. T233 dipende da T287.
- **T275 integrato via T282** (`7b0d821`, kernel 0.1.6, ADR-0143, ADR-0144). T207 integrato con T275.
- **T280 e T297 integrati via T300** (`d4dc0c6`, kernel 0.1.9; ADR-0147..0149).
- **T276 integrato** (`ed092eb`, ADR-0142): MarkovJunior 10-22x più veloce a Enorme.
- **T255 integrato** (`23147ca`, ADR-0146): provider e sforzo in `- Pipeline:`.

## Pronti e priorità

0. **Decisioni autore 04/11:** D32 SemVer `X.Y.Z`. Step 32: T260, T262 → T245a → T263/T245b → T245c-f. T265 prima della beta.
1. T324 (immagini Jev: utile come filtro dei difetti visivi, non per il giudizio dell'Artista) integrato via T329.
2. **Nodi MJ:** T333 integrato (ADR-0171, kernel 0.5.7; lo Scultore non lo conosce ancora); **T334 integrato via T340/T341** (field/temperature/observe/search, ADR-0173, kernel 0.5.9). **T335 integrato** (ADR-0174, kernel 0.5.10). **T342 integrato** (simboli `#<numero>`, ADR-0175, contratto 0.6, kernel 0.6.0) → **T336 integrato via T343** (validatore accetta i nodi nuovi entro `WORLD_NODE_LIMITS`, ADR-0176, kernel 0.6.1; corretto «piani: 0» delle strutture procedurali). **T339 integrato via T344** (nodo `<pieces>`, griglie grandi a pezzi, kernel 0.6.2, ADR-0178; `worldNodeErrors` anche nei figli di `pieces`). **T331 integrato** (studio GPU, `docs/design/gpu.md`: WebGPU non ora; 4 task proposti da approvare: mesh senza allocazioni, corona solo quando serve, scatti all’arrivo, rimisurare). **T337 integrato** (scheletro copiato 78-92 %, metodo a zone; D48). **T338 integrato** (strutture a regole a 20 voxel per casella fino a 200 di lato, misure minime abitabili nello Scultore, ADR-0179, kernel 0.6.3; non provato su Gemini). **Pronti:** nessuno. Da approvare: T310b.
3. **Crediti (10/11):** Claude 5h 11 %, settimana 11 % (reset 12/11 16:00); Gemini 99-100 %, agy 100 %; Argon fermo fino all'11/11.

## Attese dall'autore

- **Domande aperte in `domande/aperte.md`:** D34 (lingue), D35 (piano lancio, account D3.1), **D47 (vestiti addosso, T289)**, **D48 (prompt Scultore strutture, T337)**. Chiuse: D36, D37, D38 A, D46 B+C. Aperta D45 (Jev), ampliata da T325 (integrato, `lab/banco/jev/casi-d-uso.md`: ordine, guardie, battute, Attore, stima lobby). Proposta aperta: `piani.google.pro.moltiplicatoreStima` 2,5 → 1.
- **Autonomia autore confermata fino al 06/11 18:00 locali.**

## Regole attive

- Tetti dell'autore (3 Claude, 1 agy); finestra 5h protetta dallo script; nessun ripiego; Argon solo task piccoli; Fable solo difficili.
- Domande per intero in chat con raccomandazione. Finestra 5h con l'ora del reset. Sforzo: qualità prima del tempo. Mai `git commit -a` nel base.

## Ultime 2 epoche

- **339 (claude):** T344 e T339 integrati; T338 pronto.
- **338 (claude):** T339 finito; `integra` in conflitto con T336 → T344 lanciato. T88 integrato (generatore sui crediti avanzati, ADR-0177).
