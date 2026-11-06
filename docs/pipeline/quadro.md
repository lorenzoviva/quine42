# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md). Il quadro lungo di prima, con le voci delle epoche 191-219: `git show 940570f:docs/pipeline/quadro.md`.

Aggiornato il 06/11/2026, epoca 314 (claude). Crediti: vedi `stato`.

## Stato attuale

- **T319 e T156 integrati** (`7d9ee13`, kernel 0.4.1, ADR-0160): prompt procedurale dello Scultore sul contratto 0.4. Resta la cartella `worktrees/t156` (bloccata, branch tolto). `lab/banco/prompt.md` ancora con `suolo`.
- **T308a integrato** (`130810f`, contratto 0.4.0, ADR-0159 migrazione 0.3→0.4): campi e percorsi file universo in inglese, `server/folders.ts`.
- **T307b integrato via T318** (contratto 0.3.0, ADR-0158 migrazione 0.2→0.3; T313 ADR-0157 Jev).
- **T302 integrato** (`93a6442`, ADR-0152, kernel 0.1.11): `universe.json → kernels`, etichetta «kernel X.Y–X.Y». T312 integrato via T317. Installare i 4 universi (`npm run universi:cloud`) lo fa l'autore.
- **Inglese lingua interna (autore, 05/11 sera, D34 chiusa, step 42):** T306 (0.1.12) → T307a (0.2) → T307b (0.3) → T308a (0.4) integrati. **T308b (0.5) in corso**, poi T309 → T310. Ognuno da solo.
- **Carte fatte a mano (autore, 05/11, step 41, Fase I, p7):** T293 archivio e rotte (D40 A, aspetta T255) → T294 i tre laboratori ai giocatori; T295 carte prima della Genesi (D39 A) → T296 eliminare la carta problematica. Scelte mie: interruttore `laboratori`, quote come ADR-0084, import gratis.
- **Oggetti e mobili (autore, 05/11, tutto `max`, step 40):** T288 in mano → T289 banco vestiti → T290 in attesa foto; T291 integrato via T301 (ADR-0150, 0.1.10); T292 `takeable`.
- **Tre vesti del sito per la beta (autore, 05/11):** T283 integrato (ADR-0145); D41 A: T284, T285, T286 rifatti da Claude v2 → T287. T233 dipende da T287. Aperta D38.
- **T275 integrato via T282** (`7b0d821`, kernel 0.1.6, ADR-0143 generazione differita, ADR-0144 fila scritture; T264, T265, T267, T207 `fatto`). T207 aspetta T156 integrato per sbloccare T88.
- **T278 integrato** (`112b736`): reami spazio, pirati, cowboy in `lab/banco/coming-soon-cloud/`. T239 e T240 restano in attesa (D34, D35).
- **T279 integrato** (`c5ecbd8`, T273 e T277 `fatto`): 4 universi con strutture Cloud. D36 per installare in `universes/`.
- **T276 integrato** (`ed092eb`, ADR-0142): motore MarkovJunior 10-22x più veloce a Enorme. D33 chiusa A, T258 fatto. T259 in attesa (D37).
- **T280 e T297 integrati via T300** (`d4dc0c6`, kernel 0.1.9; ADR-0147, ADR-0148, ADR-0149). T298 (p5) e T299 (p6) pronti.
- **T255 integrato** (`23147ca`, ADR-0146): provider e sforzo nella riga `- Pipeline:`. T300 primo lancio con sforzo.
- **Rinomine finite: R1-R17 integrate, T205 integrato:** `buildings`→`lots`, nessuna correzione al codice.
- **T211 integrato** (ADR-0122): fila commit `UniverseClient`.
- **T175, T212, T215 integrati** (ADR-0108): tetti alla cache delle forme.
- **T106 integrato:** tema pop art/arcade nelle interfacce in gioco.
- **T226 integrato** (ADR-0124): corona solo fuori dal cerchio o nello studio.
- **T222-T225, T227, T228 integrati** (ADR-0125-0127): SoundLab, musica ed effetti, Musicista e ScoreDirector.
- **Cartone finito, T89b-e integrati** (ADR-0093).
- **T230, T238 integrati** (ADR-0128, ADR-0130): `docs/fasi.md` e `world/mancanze.json`.
- **T244 integrato** (ADR-0131): home, video `/api/video`, istruzioni `docs/beta/`.
- **T247 (via T251) e T152 integrati** (ADR-0133, ADR-0134): consumo in lobby, 4 temi Genesi.
- **T269-T272 integrati da Claude Cloud** in `lab/banco/`: 24 strutture, 24 modelli, 40 props, 44 suoni, 3 universi.

## Pronti e priorità

0. **Decisioni autore 04/11:** D32 SemVer `X.Y.Z`. Step 32: T260, T262 → T245a → T263/T245b → T245c-f. T265 prima della beta.
1. **In corso:** T308b (contratto 0.5 filo e Lua). **Pronti:** T320 (controllo due piani, p3) → T321 (prompt Scultore Gemini, p4); T315, T281, T288, T293.
2. **Crediti (17:12 UTC):** Claude 5h 97 % libero (reset 22:00 UTC), settimana 66 % (reset 12/11); Gemini 5h 100 %, settimana 95 %; agy 100 %; Argon fermo fino all'11/11.

## Attese dall'autore

- **Domande aperte in `domande/aperte.md`:** D34 (lingue), D35 (piano lancio, account D3.1). Chiuse: D36 (T302), D37 (T303), D38 A (vesti), D46 B+C (T320, T321). Aperta D45 (Jev). Proposta aperta: `piani.google.pro.moltiplicatoreStima` 2,5 → 1.
- **Autonomia autore confermata fino al 06/11 18:00 locali.**

## Regole attive

- Tetti dell'autore (3 Claude, 1 agy); la finestra 5h la protegge lo script; nessun ripiego; Argon solo task piccoli; Fable solo difficili.
- Domande per intero in chat con raccomandazione. Prevedi finestra 5h: dillo con l'ora del reset. Sforzo: qualità prima del tempo. Mai `git commit -a` nel base.

## Ultime 2 epoche

- **314 (claude):** T319 e T156 integrati (kernel 0.4.1); T308b in corso.
- **312 (gemini):** T308a integrato nel base (contratto 0.4.0).
