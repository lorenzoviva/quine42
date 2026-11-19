# ADR-0221 — La frontiera, le isole e la colonia: tre ambientazioni senza kernel nuovo

Data: 2026-11-19 · Stato: accettato (task T184 del backlog; richiesta 4 dell'autore del 03/11, sbloccata il 19/11) · Riferimenti: ADR-0134
(le ambientazioni della Genesi su un seme solo), ADR-0140 (i mestieri come programmi), ADR-0213 (la casa che usa la Grande)

## Contesto

ADR-0134 ha dato alla Genesi quattro testi (medievale, steampunk, moderno, futuristico) su un seme solo. L'autore ne vuole altri tre: il far
west, i pirati, lo spazio. Il cowboy serve subito al generatore (T185, l'universo `mesa`); pirati e spazio chiedono cose che il kernel non
ha: navigare sull'acqua, il vuoto, l'aria che manca, la gravità. Quella specifica è di T432.

## Decisione

1. **Tre testi in più in `WORLD_THEMES`** (`src/kernel/themes.ts`), col metodo di ADR-0134: `western` («Far West»), `pirates` («Pirati»),
   `space` («Spazio»), in inglese come ogni prompt; id inglesi, come ogni nome nuovo (ADR-0153; i quattro di prima restano com'erano, sono
   i nomi che `npm run genera -- --tema` e il generatore della pipeline conoscono).
2. **Ciò che il kernel non sa fare oggi non si chiede.** Le isole dei pirati sono vicine e unite da secche, scogli e ponti di corda, si
   camminano da un'insenatura all'altra; le navi stanno all'ancora nella baia e il mare si attraversa nei racconti del molo. Lo spazio è la
   superficie di un mondo lontano con l'aria che si respira, sottile e fredda: la nave resta in orbita, le navette scendono al campo. Un test
   tiene fuori dai tre testi la vela, il vuoto e l'assenza di peso. Quando T432 darà acqua e vuoto, i testi cresceranno.
3. **Il modo più piccolo per ciò che il censimento non aveva considerato**: i nomi dei mestieri delle tre epoche nei programmi del seme
   (`vicesceriffo`, `bovaro`, `telegrafista`, `nostromo`, `carpentiere`, `contrabbandiera`, `piantatrice`…, ADR-0140); gli edifici delle tre
   epoche che la Fucina riconosce come ambienti del Cartografo (`saloon`, `ranch`, `faro`, `molo`, `cantiere navale`, `fortino`, `serra`…,
   `STRUCTURES`); il saloon e il ranch sono abitazioni (`isDwelling`, ADR-0213); gli esempi dei terreni della Genesi per la frontiera, le
   isole e un mondo lontano. Niente seme separato, niente filtro della quarta parete allentato (`computer` resta vietato anche tra le navette:
   le parole del mondo sono calcolatore, terminale).

## Conseguenze

- Il generatore può fare `mesa` con `--tema western` appena il task è integrato. Il kernel sale a 0.9.18 (le parole riconosciute).
- Cosa può tradire il tema, cosa dello spazio funziona e cosa no: `docs/temi-censimento.md`, sezione T184. Il cielo resta azzurro di giorno,
  la bozza naturale ha boschi e il mare dove la dice lei, non un arcipelago: le isole e il pianeta li fanno gli ambienti e i terreni.
