# Il banco dello Scenografo (T259)

Due modi di arredare un edificio il cui scheletro cambia a ogni seme, con le stesse protezioni e le stesse misure prima e dopo. Il progetto e
la raccomandazione sono in [`docs/design/scenografo.md`](../../../docs/design/scenografo.md).

```bash
npx vite-node lab/scripts/banco-scenografo.ts -- [--semi 5] [--solo palazzina,locanda] [--out lab/banco/scenografo]   # nessuna chiamata
npx vitest run lab/tests/scenografo.test.ts
```

| file | cosa |
|---|---|
| `scenografo.ts` | le classi dello strato dei piedi (`piante`), il programma d'arredo (`programmaArredo`, `arredaProgramma`), i mobili come dati (`catalogo`, `CATALOGO`, `arredaDati`), la guardia del kernel (`Guardia`), la ripetizione (`arredaValidato`), il confronto (`confronta`, `regge`, `varianzaInterna`) |
| `riepilogo.md`, `riepilogo.json` | la tabella del giro: 6 edifici, 5 semi, due vie |
| `<edificio>.png` | il piano terra tagliato sopra la testa: vuoto, col programma, coi modelli; un seme per colonna |
