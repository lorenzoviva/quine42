# Pirati — L'Arcipelago delle Sette Secche

«Isole senza mappa e velieri da abbordare.» Un reame di Step 37 (T184/T185), scritto a mano e verificato offline:
`npx vite-node lab/banco/coming-soon-cloud/verifica.ts -- pirati`. Non è un universo generato: è il banco di ciò che un
universo dei pirati deve contenere e di ciò che il kernel di oggi regge. Si usa sovrapponendolo al seme (`realmUniverse`).

| cosa | dove | quanti |
|---|---|---:|
| tema, bibbia, stile, lessico (il filo comune + 3 usanze), canone | `prompts/theme.md`, `world/` | — |
| rune magiche e incantesimi | `modules/magic.runes/` (sostituisce quello del seme), `world/canone.md` | 10 + 2 formule |
| regioni dell'atlante | `world/atlas.json` | 8 |
| individui (15 persone e il gatto di bordo), legami in entrambi i versi | `world/people.json` | 16 |
| trame (3 con una missione) | `world/plots.json` | 6 |
| regole già giudicate | `world/rules.json` | 5 |
| moduli con Lua | `modules/pirati.*` | 12 |
| merci, ricetta del rum, bottino di contrabbando e di bordo | `modules/items.pirati/` | 14 oggetti |
| modelli MarkovJunior | `models/*.xml` | 10 |
| programmi sonori (4 brani, 2 effetti) | `models/suono-pirati-*.xml` | 6 |

## I moduli

Cannone di bordata (palla, polvere, scovolo: senza polvere tace, senza palla spara a salve), chiesuola con bussola (la
rotta verso il molo, un punto segnato e la strada fatta), tavolo del cartografo (una carta per tavolo, una copia sola),
bancone della taverna (rum a pagamento o segnato sul conto, le voci del porto), scialuppa (la falla, il varo solo con
l'acqua a due passi), cassa di contrabbando (il lucchetto cede, poi diventa un contenitore con il suo bottino), pappagallo
sul trespolo (impara una parola solo a pancia piena), ruota del timone, botte di rum (sei fiaschi, si rabbocca),
forziere sepolto (tre palate, il contenuto deciso dal seme dell'entità), pennone con bandiera, lanterna del faro (fa luce
davvero, con il componente `luce`).

## Ciò che funziona e ciò che no

- Funziona con il kernel di oggi: tutto ciò che sta in `on_act` e nei componenti (stato per entità), i contenitori creati
  da Lua, la luce, gli oggetti dati e tolti, le rune e gli incantesimi a effetti chiusi.
- Gli ambienti sono quelli del seme, rinominati dall'atlante: il porto è un `borgo_mattoni`, le grotte un `dungeon`, la secca
  un `deserto`, l'isola una `giungla`. Il terreno resta quello del seme (prato, sabbia, mare): non ci sono moli né ponti di
  nave come terreno. Un Cartografo vero li scriverebbe alla Genesi; qui non si chiama nessun modello.
- La scialuppa non naviga: il kernel non tiene un corpo su un altro (lo misura T183, `mech.barca`). Il varo è un fatto
  raccontato e uno stato.
- I due effetti sonori (`cannone`, `campana`) non hanno un evento che li suoni: il direttore del suono ascolta solo gli
  eventi del kernel (ADR-0126) e Lua non può chiedere un suono. È una primitiva mancante («un modulo chiede un effetto»).
- I brani del reame stanno nell'indice dopo quelli del seme: per gli stessi ambienti e momenti il direttore sceglie il primo.
  In un universo del reame i brani del seme non ci sarebbero.
