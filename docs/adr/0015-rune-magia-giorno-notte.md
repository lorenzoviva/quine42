# ADR-0015 — Una runa per casella, magia, incantesimi, giorno e notte

Data: 2026-10-20 · Stato: accettato

## Contesto
Le rune occupavano una casella per lettera («carpet» = 6 caselle), erano troppe, e le rune per fermare
il tappeto erano subito disponibili (dal primo chunk). L'autore chiede rune su una sola casella, più
rare, e una magia: brandire rune per creare effetti (terreno, fuoco, luce, cure, scudi…), incantesimi.

## Decisione
- **Una runa = una casella**, disegnata come pietra con un glifo: le rune magiche hanno il proprio glifo
  e colore; i token brevi (operatori, cifre, `x`) sono il proprio segno; le parole lunghe hanno una
  lettera runica stabile con la parola scritta in piccolo (`runeGlyph` in `runes.ts`).
- **Rarità**: al massimo 1 riga di codice per luogo (2 lontano dall'origine); le righe con token del
  tappeto (`carpet active strength rate ox oy`) solo a ≥ 3 chunk dall'origine e con probabilità 1/2.
  Il luogo iniziale offre `x`, `speed = speed` e la runa magica `luce`. Il giocatore impara la logica
  delle rune prima di poter uscire.
- **Rune magiche** (`magic.runes`: `luce fuoco acqua terra vita scudo vento`): sono anche identificatori
  Lua (valgono `nil` finché qualcuno non li definisce). Tenute in mano, **T** le pronuncia in ordine:
  è un **incantesimo**. Quelli noti (`spells`) si lanciano subito; una sequenza nuova viene nominata una
  volta dal Narratore (`spell.name`), con effetti dello stesso insieme chiuso (ADR-0014), validata e
  committata in `magic.spells`. Costa energia. Gli effetti agiscono su ciò che hai davanti.
- **Giorno e notte**: `kernel.daylight()` (giornata di 10 minuti, si nasce al mattino); il renderer
  oscura il mondo e apre la luce attorno a fuochi, luci evocate e lampade (componente `luce`).

## Conseguenze
- Le frasi incise sono più corte e leggibili; il tappeto si ferma solo dopo aver esplorato.
- La magia è codice dell'universo (dati + `core.effects`): riscrivibile, quindi anche rompibile.
