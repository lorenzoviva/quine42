# ADR-0096 — Rune nuove dal Concilio

Data: 2026-11-01 · Stato: accettato (task T57b del backlog) · Estende ADR-0015 (la magia), ADR-0018 (le rune come oggetti) ·
Riferimenti: ADR-0025 (la quarta parete), ADR-0056 (le carte), T57a (le formule come programmi)

## Contesto
Le rune magiche erano le sette del seme (`luce fuoco acqua terra vita scudo vento`). La richiesta del 24/10 (T57) vuole che il Concilio
sappia di poterne inventare altre («sangue»), perché le formule sono infinite e un elemento che nessuna runa ha non si può comporre.
Una runa nuova tocca molte cose: il codice (il suo token è una parola del tappeto), il canone (`world/canone.md`, con ogni compito
narrativo), il bottino, il mondo (dove le rune stanno), le carte.

## Decisione
1. **Il compito** `rune.invent` (Narratore, `inventRune` in `agents/effects.ts`): token, nome antico, glifo, colore, elemento, cosa
   significa e una riga del canone, dato il motivo e le rune che ci sono. Lo chiedono due vie:
   - la **sessione del Concilio** (`councilSession`), con l'intervento `runa` e l'elemento nella `richiesta` (paga il mondo, `comune`);
   - una **formula** pronunciata la prima volta: `nameSpell` ha il campo facoltativo `runa_nuova` (quasi sempre vuoto; `SPELL_GUIDE` lo
     spiega), e dopo l'incantesimo il kernel chiede la runa (paga chi l'ha pronunciata).
2. **Il validatore** (`src/kernel/magic.ts`, `validateNewRune`, puro): rifiuta, con il motivo al Narratore (due tentativi), un token che
   non è una parola di 3-12 lettere (minuscole, senza accenti: è un identificatore Lua), che è già una runa, riservato (Lua, `Host`,
   binding, token del tappeto, `concilio`) o simile a un'altra runa; un nome simile a un altro (`similarNames` della società); un testo
   che rompe la quarta parete (`metaBreak` con le parole del lessico); oltre `MAX_MAGIC_RUNES` (16) rune. **Ripara** la forma: il glifo
   (un solo segno, non una lettera delle rune non magiche, `FUTHARK` in `runes.ts`, non già usato; altrimenti il primo libero del blocco
   runico), il colore (`#rrggbb`, altrimenti uno dal token), le lunghezze.
3. **Dove entra** (`kernel.inventRune`): `modules/magic.runes/manifest.json` (la runa in `runes`, una voce `rune:<token>` di peso 1 nella
   tabella di bottino `magia`), `world/canone.md` (una riga sotto «Le rune trovate dopo», `canonWithRune`; `canonSummary` la elenca anche
   tra le rune magiche), un commit `runa nuova: …` con la carta `runa:<token>` (`CardKind` `runa`), la voce nel registro. Una alla volta,
   mai nel kernel specchio.
4. **Nel mondo come le altre**: i luoghi scelgono le rune magiche da `content.runes` (rare, 30 % per luogo), il bottino `magia` la dà, si
   raccoglie, si incide e si compone in formule che il Narratore nomina una volta. Nessuna API Lua nuova, nessun effetto nuovo.

## Conseguenze
- Il canone resta vero: «nessuno ha mai visto una runa nascere» — le rune nuove si **trovano**, prima nessuno le aveva viste.
- Il tetto di 16 tiene le rune rare e il canone corto (va con ogni compito narrativo).
- Le rune del seme non hanno carta; le nuove sì, di chi ha pagato la chiamata.
