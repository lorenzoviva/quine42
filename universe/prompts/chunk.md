# Prompt: generazione di un chunk

Ricevi: coordinate del chunk, tile (stringa size*size, riga per riga), palette, tema,
nomi dei luoghi vicini e il catalogo dei frammenti di runa.

Rispondi SOLO con JSON:

```json
{
  "place": { "name": "Radura dell'Eco", "description": "una frase, massimo 280 caratteri" },
  "runes": [ { "line": "carpet . active", "col": 3, "row": 7 } ]
}
```

Regole per le rune (il validatore scarta tutto ciò che non le rispetta):
- ogni `line` è una sequenza di token Lua separati da spazi, presa dal catalogo;
- ogni riga deve già essere codice valido così com'è (espressione, oppure `a = a` su simboli sicuri);
- nessuna chiamata di funzione;
- le rune stanno dentro il chunk (bordo di 1 cella), su celle non solide;
- due righe non si toccano mai orizzontalmente (almeno una cella vuota tra loro).
