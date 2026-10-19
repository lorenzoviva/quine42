# ADR-0005 — Gateway IA e validazione

Data: 2026-10-19 · Stato: accettato

## Contesto
I contenuti sono illimitati e generati da IA, ma l'IA non deve mai rompere il gioco. Le rune
generate sono codice attivo nel momento in cui appaiono. I provider reali non sono ancora scelti.

## Decisione
- Interfaccia `AIProvider` con `generateChunk`, `generateText`, `generateModule`, `generateImage`.
  `AIGateway` la avvolge e tiene un log (visibile in console → Gateway IA).
- **Validazione nel kernel, non nel provider**: il provider è considerato non affidabile. Per ogni
  risposta: validare → se invalida, scartare e richiedere (`attempt + 1`), max 3, poi fallback sicuro.
- Vincoli sulle rune generate: token validi; compilano; nessuna chiamata; le istruzioni sono solo
  identità su simboli sicuri (`speed = speed`, `x = x`, `carpet . rate = carpet . rate`); dentro il
  chunk con margine 1; su celle non solide; mai a contatto orizzontale con altre righe.
- I frammenti disponibili sono un **catalogo nell'universo** (`runes.fragments`), quindi riscrivibile.
- Moduli generati dall'agente: un solo manifest, solo `kind: entity`, id nuovo, Lua che compila.
- Provider attuale: `MockProvider`, deterministico e offline, a tema; corrompe di proposito ~15%
  delle prime risposte (tranne il chunk iniziale) per esercitare il percorso di scarto.
- Il chunk (0,0) contiene sempre `x`, `speed = speed` e `carpet . active`: c'è sempre una via d'ingresso.

## Conseguenze
- Aggiungere un provider reale = implementare `AIProvider` e passarlo a `Kernel.boot` in `main.ts`.
  I prompt sono già nell'universo (`prompts/theme.md`, `prompts/chunk.md`, `prompts/module.md`).
- Le immagini oggi non sono usate (tutto è glifo); `ImageRequest` prevede già il contesto per
  l'inpainting dai bordi dei chunk adiacenti.
- Un chunk impiega fino a 3 andate e ritorno al provider: con un LLM reale servirà prefetch più ampio e cache persistente.
