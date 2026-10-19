# ADR-0001 — Stack: Vite + TypeScript + Canvas 2D + Lua 5.4 (wasmoon)

Data: 2026-10-19 · Stato: accettato

## Contesto
Il design chiede un kernel TypeScript immutabile, logica di gioco in Lua completo in sandbox nel
browser (wasmoon o Fengari), grafica volutamente semplice e hot reload senza riavvii.

## Decisione
- **Vite 5 + TypeScript strict**, nessun framework UI. Canvas 2D per il mondo, DOM per HUD, editor e console.
- **wasmoon** (Lua 5.4 reale compilato in WebAssembly) invece di Fengari: è Lua vero (interi a 64 bit,
  operatori bitwise, `debug.sethook` per il budget), più veloce, con proxy bidirezionali JS↔Lua.
- **Vitest** in Node: wasmoon gira anche lì, quindi il kernel intero (tappeto, rune, rollback, agente)
  si testa headless.
- Persistenza in `localStorage` (sufficiente per snapshot di decine di KB).

## Conseguenze
- Il file `glue.wasm` (~270 KB) va servito come asset (`?url` in `main.ts`).
- Ogni accesso a un campo di un componente da Lua attraversa un proxy: costa ~µs. Va tenuto d'occhio
  (vedi "Prestazioni" in `AGENTS.md`).
- Nessuna dipendenza runtime oltre a wasmoon.
