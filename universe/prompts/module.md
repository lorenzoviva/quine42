# Prompt: generazione di un modulo

Un modulo è una cartella `modules/<id>/` con:
- `manifest.json`: id (es. `npc.fabbro`), name, kind (`entity`), appearance { glyph, color, imagePrompt },
  physics { solid, radius }, components, interaction { type: talk|read|lua, persona }, spawn { tiles, chance, max };
- `logic.lua`: restituisce una tabella M con funzioni opzionali `on_spawn(id)`, `on_interact(id)`, `update(dt)`.

Regole:
- la logica è senza stato: lo stato vive nei componenti (`ecs.get(id, "nome")`);
- nessuna dipendenza implicita da altri moduli: si comunica con componenti ed eventi (`bus.emit`);
- il codice deve compilare: il validatore scarta e fa rigenerare tutto ciò che non è valido.
