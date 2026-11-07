# Catture della verifica nel browser di T288 (ADR-0167)

Ciò che si impugna si vede addosso. Build di produzione, `?skip&offline` (e `?classica` per le 12-13), Chrome con la scheda di Claude in Chrome, camera a 3,4 caselle.

- **01-05**: la spada nella mano lungo il fianco (seme 1 del viandante): ferma di fronte, di profilo, di spalle; in cammino, nelle due fasi del passo (il braccio oscilla e la spada con lui).
- **06-07**: l'ascia, ferma di fronte e in cammino con la camera da nord.
- **08**: le forbici del seme (il loro modello `forbici`, l'unico oggetto impugnabile del seme con un modello suo): per i manici di legno.
- **09-10**: lo scudo (`slot: scudo`) legato all'avambraccio, la faccia fuori: di fronte si vede di taglio, di profilo di faccia.
- **11**: la spada nella mano alzata (seme 3: il braccio libero alzato in saluto).
- **12-13**: lo stesso con `?classica`.
- **14-16**: multigiocatore, server di sviluppo, universo di prova `prova-t288` con due schede (`viandante=me`, il master, e `viandante=bruno`): ciascuno vede in mano all'altro ciò che impugna (la spada di `me`, l'ascia di Bruno); Bruno passa alle forbici e il master lo vede in circa un quarto di secondo, senza ricaricare; quando le ripone la mano si svuota anche per l'altro.

Nel seme nessun oggetto impugnabile ha un modello suo oltre alle forbici (offline gli altri usano il sacco generico, `object`). Spada, ascia e scudo sono stati scritti come li scriverebbe lo Scultore «domani», con `kernel.addModel` e un pacchetto (`items.prova-t288`) nell'universo locale della preview, ignorato da git: **non sono modelli del seme**. Programmi usati:

```xml
<sequence values="BCGHs" size="12 12 12" name="Lama"><color symbol="C" value="c8d0d8" name="lama"/><color symbol="s" value="7f8894" name="filo"/><color symbol="G" value="d8b048" name="elsa"/><color symbol="H" value="6b4626" name="impugnatura"/>
<box at="0 6 0" size="1 3 1" color="G"/><box at="2 6 0" size="3 1 1" color="H"/><box at="4 6 0" size="1 7 1" color="G"/><box at="7.5 6 0" size="6 3 1" color="C"/><box at="7.5 6 0" size="6 1 1" color="s"/><box at="11 6 0" size="1 1 1" color="C"/></sequence>

<sequence values="BHIi" size="12 12 12" name="Attrezzo"><color symbol="H" value="7a5532" name="manico"/><color symbol="I" value="6e737c" name="testa"/><color symbol="i" value="c0c8d0" name="filo"/>
<box at="6 5.5 0" size="1 12 1" color="H"/><box at="4 9.5 0" size="3 4 2" color="I"/><box at="2 9.5 0" size="1 4 2" color="i"/></sequence>

<sequence values="BPGN" size="12 12 12" name="Scudo"><color symbol="P" value="3f6aa0" name="tavole dipinte"/><color symbol="N" value="5a3a20" name="bordo"/><color symbol="G" value="d8b048" name="umbone"/>
<cylinder at="6 6 0" size="11 11 1" color="N"/><cylinder at="6 6 0" size="9 9 1" color="P"/><cylinder at="6 6 1" size="3 3 1" color="G"/></sequence>
```

La spada ha la tinta `C` e l'oggetto il colore `hsl(210 25% 74%)`, come i pacchetti del Narratore: la lama si vede perché la tinta ora si legge (`hexColor`).
