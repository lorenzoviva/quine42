# ADR-0051 — Lo Studio del Cartografo è l'Ufficio dei luoghi

Data: 2026-10-23 · Stato: accettato (task T26c del backlog) · Modifica ADR-0016 e ADR-0022 (gli edifici della corona) e
ADR-0027 (i teletrasporti della Sala del Concilio).

## Contesto
Nella corona il Cartografo aveva due edifici: l'**Ufficio dei luoghi** (`luoghi`, i moduli `world.*`: terreni, ambienti;
dentro, da T26a e T26b, il plastico di un luogo con le sei fasi) e lo **Studio del Cartografo** (`cartografia`, senza file:
i campioni dei terreni e l'atlante). Stessa squadra, stesso lavoro, due posti; e ogni edificio in più restringe il settore
degli altri sull'anello. L'autore ha deciso di unirli (23/10/2026, [`corona-proposte.md`](../plans/corona-proposte.md) §1).

## Decisione
1. **Niente più edificio `cartografia`** (`ROOMS` in `src/kernel/corona.ts`): il campus ha un settore in meno.
2. **L'Ufficio dei luoghi è anche lo studio del Cartografo** (`SAMPLES = 'luoghi'`):
   - i **terreni** (gli `Exhibit` di `Corona.build(files, gallery, terrains)`) stanno nel **campionario**: dopo i file,
     da un piano loro (le pagine di file e di terreni non si mescolano); la scala che ci porta si chiama «il campionario
     dei terreni». Il pannello e «riscolpisci» sono quelli di prima;
   - l'**atlante** sta su un tavolo contro la parete di fondo del piano terra (`ATLAS_AT`: riga 1, quattro caselle al centro,
     si legge dalla riga 2), lontano dal plastico, dallo schermo e dall'uscita.
3. **Il posto del Cartografo al tavolo del Concilio porta all'Ufficio dei luoghi** (`SEATS`).

## Conseguenze
- Mappa dei file sugli edifici invariata (`folderOf` non mandava nulla a `cartografia`); cambia solo dove stanno terreni e
  atlante. Un universo vecchio non ha nulla da migrare: lo studio si ricostruisce dai file.
- Un modello `models/corona-cartografia.xml`, se qualcuno lo scrivesse, non verrebbe più usato.
- Il campionario degli ambienti (un riquadro per ambiente con il suo programma su una bozza di prova) resta da fare (T26d).
