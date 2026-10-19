# ADR-0003 — Sandbox, moduli e il kernel come pavimento

Data: 2026-10-19 · Stato: accettato

## Contesto
Lua deve poter rompere l'universo ma mai il kernel; la logica deve essere ricaricabile a caldo
senza perdere lo stato; i contenuti devono essere moduli autosufficienti.

## Decisione
- **Un solo stato Lua.** `prelude.lua` (parte del kernel) cattura `debug`, `load` ecc. in variabili
  locali e crea l'ambiente dell'universo `U`: copie di `math/string/table/utf8`, funzioni base sicure,
  le API (`ecs`, `input`, `world`, `bus`, `log`, `hash`) e i **binding vivi** tramite metatabella.
- **Moduli**: ogni `logic.lua` gira in un ambiente proprio con `__index = U`; le sue globali non
  sporcano `U`. Restituisce una tabella `M`; hot reload = rimpiazzare `M`.
- **Rune**: girano direttamente in `U`. Possono riassegnare `carpet`, `ecs`, `math`… e rompere i
  moduli che li usano. È una conseguenza voluta del "codice vero".
- **Binding**: con setter (`x`, `y`, `speed`) la scrittura passa dal kernel, che rifiuta valori non
  numerici sollevando un errore Lua; senza setter (`carpet`, `time`) la scrittura crea un override che
  sostituisce il simbolo (fino al rollback).
- **guarded()**: ogni chiamata nel codice dell'universo è `pcall` + hook di conteggio (2M istruzioni).
  Superato il budget l'hook passa a "fallisci a ogni istruzione", così nemmeno un `pcall` in ciclo può
  ingoiarlo; il frame del kernel è esente.
- **Fault invece di crash**: gli errori arrivano al kernel via `host.fault`, finiscono in `Faults` e si
  cancellano da soli quando il codice torna a girare pulito.
- **sanitize()** a fine tick: posizione e tappeto non finiti vengono ripristinati all'ultimo valore
  buono; il giocatore non può uscire dal bordo esterno della corona.
- **Manifest** (`types.ts`): dichiara logica, aspetto, fisica, componenti, spawn, interazioni, prompt.
  Nessun registro centrale: il kernel scopre `modules/*/manifest.json`.

## Conseguenze
- Nessun accesso a `_G`, `debug`, `load`, `os`, `io`, `package`, `string.dump` dal codice dell'universo.
- L'hook di conteggio rallenta Lua di ~1.5×: accettato in cambio della garanzia "non si blocca mai".
- Le API del `Host` restituiscono `undefined` e non `null` (wasmoon controlla `.then` sui risultati).
- Le chiamate dal kernel a Lua non devono annidarsi dentro altre chiamate Lua (es. `tileAt` non genera
  mai chunk: la generazione avviene solo in `updateChunks`).
