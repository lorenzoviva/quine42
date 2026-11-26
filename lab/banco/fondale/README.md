# Il fondale nel browser (T507, verifica di T480, ADR-0259)

Build di produzione del kernel 0.10.35 (`task/T507`, nato dopo l'integrazione di T480), `vite preview` sulla porta 4857, Claude in Chrome,
modelli locali (`?offline`). Un universo nuovo con una Genesi offline del tema Pirati (`t507-pirati`: `geography: 'archipelago'`,
`relief: 'true'`), poi il seme (`?skip&offline`, `aurora`). Il viandante si sposta fermando il tappeto e assegnando `carpet().ox/oy`; il
nuoto coi tasti (`keydown` di S sulla finestra).

## Che cosa si vede

| Prova | Esito |
|---|---|
| Trasparenza graduata | sponda a (-30, 23), il letto scende da -3 a -25 livelli in sette caselle: l'acqua è chiara sopra il letto vicino e scurisce verso il blu dove il letto è profondo; i gradini del letto si leggono attraverso l'acqua (`01`); in mare aperto il letto a -26/-28 si intravede appena, nebbioso (`02`) |
| Bande degli strati | le pareti sommerse dei gradini mostrano due bande, una chiara in alto e una scura sotto (gli strati del luogo: sabbia compatta, fango, calcare), viste attraverso l'acqua (`04`) |
| Schiuma sopra l'acqua trasparente | le linee bianche della schiuma corrono sulle rive e attorno ai gradini, sopra l'acqua chiara (`01`, `03`, `04`) |
| Oggetto sul letto (`underwater`) | un oggetto (`obj.pane`) iniettato nel piano del luogo (-2,1) con `where: 'underwater'`, il luogo scaricato e ricaricato: il kernel lo posa a (-29.5, 25.5) con `pos.z = -1` e il componente `below { z: -1 }` (il letto a -4 livelli); si vede sotto l'acqua, sul gradino (`03`) |
| Nuotare sopra | da riva tenendo S il viandante nuota da y 24,5 a y 53 a passo costante (~2,4 caselle/s), sopra il letto che scende fino a -28: niente lo ferma |
| Il seme | `aurora` (`Hills`): `hasCliffs()` falso, `hasBedAt` falso su tutta l'acqua caricata (1 798 caselle): il fiume resta opaco, come prima (`05`) |
| La lava | sei caselle di lava (`v`) posate con `setTile` accanto al fiume del seme: opaca, arancione, come prima (`05`) |
| Console | nessun errore del gioco (solo i messaggi dell'estensione del browser), nessun guasto in `k.faults` |

## Non provato

- **Secche e porto**: la palette del mondo Pirati offline non ha i terreni secca (`y`, `depth: reef`) né molo (`i`): i modelli locali
  della Genesi scrivono una palette loro (come in T503, dove il molo era `p` «tratturo»), quindi le bande e il letto delle secche e del
  porto non si vedono offline. Servono una Genesi vera, o una palette offline dei Pirati che porti le secche.
- **La scia sopra l'acqua trasparente**: il mondo offline non ha veicoli (nessun modulo con `vehicle`), e la scia la lascia solo uno scafo.
- **Il Cartografo che chiede `underwater` da sé**: offline lo chiede solo con la cassa `obj.chest` nel catalogo del luogo, che il mondo
  Pirati offline non ha (il catalogo di (-2,1) è `npc.vecchio`, `obj.pane`); l'oggetto è stato iniettato nel piano per provare il percorso
  del kernel.
- Il multigiocatore (`ChunkView.bed` ai client sottili).

## Task proposti

1. Nella Genesi offline dei Pirati (o di ogni mondo con l'arcipelago) i terreni del seme `y` (secca) e `i` (molo) nella palette, e la
   cassa nel catalogo, così che secche, porto e il posto `underwater` si vedano e si provino senza Gemini.
