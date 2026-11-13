# Il riuso dei modelli su una Genesi offline (T349)

Generato da `npx vite-node lab/scripts/riuso-modelli.ts` (tema «un regno di pastori», la Genesi e 12 luoghi, modelli locali, un Jev finto). I dollari sono le chiamate
contate per i prezzi di oggi, con i pesi della stima della lobby: una scultura 0.0102 $, un giudizio 0.0040 $.

| variante | modelli chiesti | domande a Jev | riusati | `model.sculpt` | `model.judge` | Scultore e Artista | Jev |
|---|---|---|---|---|---|---|---|
| regola di oggi (senza chiave) | 15 | 0 | 0 | 25 | 25 | 0.3556 $ | — |
| Jev dice sempre «nessuno» | 15 | 6 | 0 | 25 | 25 | 0.3556 $ | 0.0001 $ |
| Jev riusa il 40 % delle domande (`REUSE_HIT`) | 15 | 6 | 2 | 21 | 21 | 0.2987 $ | 0.0001 $ |
| Jev riusa sempre (il tetto) | 15 | 6 | 6 | 14 | 14 | 0.1991 $ | 0.0001 $ |

- **Chiesti a Jev**: 6 modelli su 15 (40 %; `REUSE_ASKED` nella stima è 0.4), per classe: furniture 1, building 1, tree 2, rock 2.
  Le persone, gli animali, le bestie e gli oggetti non si chiedono (D45.2).
- **Una domanda** pesa in media 1030 byte, circa 303 token: 0.000013 $ a domanda.
- **Il risparmio** con il tasso del banco: 0.0568 $ su 0.3556 $ (16 %); il tetto: 0.1564 $.
