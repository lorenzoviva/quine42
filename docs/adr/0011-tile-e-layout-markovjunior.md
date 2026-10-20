# ADR-0011 — Mappe a tile e layout con regole stile MarkovJunior

Data: 2026-10-20 · Stato: accettato · Sostituisce: la pittura per chunk di ADR-0008

## Contesto
Con un'immagine dipinta per ogni chunk (ADR-0008) si vedevano i bordi tra i chunk, spesso non si
trovava un percorso e non era chiaro cosa fosse calpestabile: la collisione era "indovinata" da un
dipinto (rilievo del Fisico). Ed era la parte più costosa del gioco. L'autore ha proposto
MarkovJunior (https://github.com/mxgmn/MarkovJunior) oppure l'inpainting con un bordo più grande; le
tile devono comunque nascere con l'IA, per avere ambienti diversi (anche interni ed esterni).

## Decisione
- **La mappa si compone da tile.** Ogni terreno ha una texture ripetibile dipinta dall'Artista (4 per
  immagine, rese seamless dal kernel con traslazione di mezza tile e sfumatura radiale), allineata
  alle coordinate del mondo: i chunk si raccordano senza cuciture per costruzione. Transizioni
  procedurali (bordi irregolari) tra terreni naturali; muri con facciata e ombra; acqua con riva;
  ostacoli (alberi, rocce) come sprite in piedi sulla loro casella, ordinati per profondità; tetti
  sugli edifici che spariscono quando ci entri. Grafica e collisione derivano dalla stessa griglia:
  ciò che sembra invalicabile lo è. `V` mostra la calpestabilità. Offline: texture e ostacoli procedurali.
- **Strati dei terreni** (`layer`): ground, floor (indoor), wall, door, liquid, vegetation, rock.
  I codici base `g p t w r h f d` hanno significato fisso (il motore dipende da loro).
- **Layout = programmi di riscrittura** (`src/kernel/mj.ts`): nodi `one`, `all`, `prl`, `sequence`,
  `markov`, `path`; regole 2D con `*`, classi `[gp]`, simmetrie. `prl` vale una volta salvo `steps`
  (una probabilità scritta da un modello va intesa così). I programmi sono dati dell'universo
  (`modules/world.layouts`), scritti dal Cartografo alla Genesi e **provati dal kernel** su bozze reali
  prima di essere accettati (compilano, scrivono solo codici noti, terminano, lasciano spazio).
- **Pipeline di un chunk** (`src/kernel/layout.ts`): bozza continua (Lua) → varchi deterministici su
  ogni lato (uguali per i due chunk che condividono il lato) → programma dell'ambiente con il bordo
  congelato (continuità) → **connettività garantita**: si scavano sentieri di costo minimo da ogni
  varco, porta e zona calpestabile non minuscola (prima vegetazione, poi acqua e roccia, mai muri) →
  riconoscimento degli edifici.
- Il Cartografo non disegna più caselle: per ogni luogo sceglie l'ambiente, nome e descrizione, cosa
  c'è e dove (dentro/fuori/ovunque) e quali rune; il kernel posiziona tutto su celle raggiungibili.

## Alternative considerate
- **Inpainting con bordo più grande**: già usato (cornice di 2 caselle) in ADR-0008; riduce ma non
  elimina le cuciture, non risolve collisione né costo (un'immagine per chunk).
- **Port completo di MarkovJunior** (campi, inferenza, WFC): rinviato; il sottoinsieme attuale basta
  per borghi, campi, rovine, interni a più stanze, ed è facile da scrivere per un LLM.

## Conseguenze
- Costo immagini per mondo: ~3 per le texture, 1-2 per gli ostacoli, invece di una per chunk.
- I luoghi in cache conservano solo il piano; il layout si ricostruisce deterministicamente.
- Le texture dipinte dopo la generazione dei chunk compaiono a caldo (cambia solo la grafica).
