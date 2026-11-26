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

# La Genesi offline dei Pirati (T540)

Build di produzione del kernel 0.10.36 (`task/T540`), `vite preview` sulla porta 4871, Claude in Chrome, modelli locali (`?offline`).
Due universi nuovi (`t540-pirati`, `t540-pirati2`) con la Genesi lanciata dalla console (`quine.runGenesis` col testo del tema Pirati):
`geography: 'archipelago'`, `relief: 'true'`. Da T540 i modelli locali danno a un arcipelago il molo `i` e la secca `y` del seme
(`ISLAND_TERRAINS`) e tra le prime cose un forziere da nave e una barca a remi (`ISLAND_CAST`); il piano di un luogo col fondale vi affonda il
forziere (`where: 'underwater'`).

| Prova | Esito |
|---|---|
| Palette | `i` «molo» (`floor`, `walk`, non `indoor`), `y` «secca» (`liquid`, `swim`, `depth: reef`); catalogo `npc.vecchio`, `obj.forziere` (mobile), `obj.pane`; `obj.barca` con `vehicle` sull'acqua |
| Porto e molo | il luogo (2,0) «Prato delle Rune», ambiente `harbour`: il molo di tre caselle `i` da (40,4) a (42,4), la testa sull'acqua profonda `o` (`pierTouches`); il viandante in testa al molo, la barca ormeggiata accanto (`06`) |
| Secca | tre caselle `y` a (41-43, 8), il letto a −0,25 contro −3,5 dell'acqua profonda vicina: la striscia verde-acqua accanto alla riva, sotto il molo (`09`) |
| Il forziere sul fondale | a (45,5, 3,5) con `pos.z = below.z = −6,25` (il letto), e un altro a (41,5, −10,5) a −3,25; si intravede sotto chi nuota (`07`, `08`) |
| Nuotarci sopra | da (41,5, −7,5) tenendo W il viandante nuota fino a y −14,9 a passo costante, oltre il forziere: niente lo ferma |
| La barca e la scia | sul ponte della barca (z 0,56), al timone da poppa (`takeHelm`), W: da x 42,5 a 53,4 fino a 2,5 caselle/s sopra il forziere affondato, la scia a V dietro lo scafo (`10`) |
| Console | nessun guasto (`k.faults`), nessun errore dopo l'avvio del tracciamento |

## Ciò che la verifica ha trovato e corretto

- **Il forziere affondato fermava lo scafo**: `hullFits` contava il piede della cassa sul fondale (−6,25) come se fosse a galla, e la barca si
  fermava («Lo scafo urta») appena la sua prua ci arrivava sopra. Ora ciò che sta sotto la superficie passa sotto la chiglia se la sua cima
  non arriva più su (`KEEL`, `underKeel` in `src/kernel/vehicle.ts`): la barca va oltre, come chi nuota.
- **`obj.cassa` spariva alla ricarica**: è l'id italiano della cassa del seme prima di T307b, e la migrazione dei piani lo riscrive in
  `obj.chest`, che nel mondo dei Pirati non c'è. Offline la cosa si chiama forziere (`obj.forziere`). Lo stesso può capitare alla Fucina vera
  con un nome che coincide con un vecchio id del seme: non provato, da guardare (vedi l'esito del task).

## Non provato

- Salire a bordo dalla testa del molo col menu («Sali a bordo»: `boardingSpot` non trova posto sulla barca del generico `vessel` che
  aspetta il suo modello); il viandante è stato messo sul ponte dalla console.
- Il multigiocatore.
