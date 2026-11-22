# model.sculpt · primo · gemini-3.8-flash · 11 s · 5903 token d'ingresso (0 in cache), 1439 d'uscita, 0 di ragionamento · $0.0098

## Richiesta

Sculpt: Gatto rosso
What it looks like: un gatto tigrato, la coda alta
Class: animal · box 15 × 20 × 15 voxels · at least 9 tall

## Risposta

```xml
<sequence values="BICTUNERKJLQAZS" size="15 20 15" symmetry="()" name="Gatto rosso">
  <!-- Palette stilizzata: pelo fulvo/rosso caldo, strisce scure ben distinte, muso crema -->
  <color symbol="I" value="d96826" name="pelo fulvo"/>
  <color symbol="S" value="8a3311" name="tigratura scura"/>
  <color symbol="C" value="fae2c8" name="petto panna"/>
  <color symbol="T" value="d96826" name="testa fulva" part="head"/>
  <color symbol="U" value="fae2c8" name="musetto panna" part="head"/>
  <color symbol="N" value="e66a77" name="nasino rosa" part="head"/>
  <color symbol="E" value="5ba33b" name="occhi verdi" part="head"/>
  <color symbol="R" value="f09990" name="interno orecchie" part="head"/>
  <color symbol="K" value="8a3311" name="tigratura testa" part="head"/>
  <color symbol="J" value="fae2c8" name="zampa anteriore sx" part="leg"/>
  <color symbol="L" value="fae2c8" name="zampa anteriore dx" part="leg"/>
  <color symbol="Q" value="d96826" name="zampa posteriore sx" part="leg"/>
  <color symbol="A" value="d96826" name="zampa posteriore dx" part="leg"/>
  <color symbol="Z" value="d96826" name="coda fulva" part="tail"/>

  <!-- Quattro zampe separate (movimento kernel) con calzini chiari davanti -->
  <box at="4 13 0" size="2 2 5" color="J"/>
  <box at="10 13 0" size="2 2 5" color="L"/>
  <box at="4 4 0" size="2 3 5" color="Q"/>
  <box at="10 4 0" size="2 3 5" color="A"/>

  <!-- Corpo morbido e tozzo, allungato su y -->
  <ellipsoid at="7 8 4" size="8 10 6" color="I"/>
  <box at="7 8 4" size="6 8 5" color="I" on="B"/>
  
  <!-- Petto e pancia crema -->
  <box at="7 12 4" size="5 3 4" color="C"/>
  <box at="7 8 3" size="4 6 2" color="C"/>

  <!-- Tigrature sul dorso -->
  <box at="7 5 7" size="7 1 1" color="S" on="I"/>
  <box at="7 7 7" size="7 1 1" color="S" on="I"/>
  <box at="7 9 7" size="7 1 1" color="S" on="I"/>

  <!-- Coda alta, arcuata verso l'alto (z fino a 14) -->
  <line at="7 3 5" to="7 2 9" r="1" color="Z"/>
  <line at="7 2 9" to="7 2 13" r="1" color="Z"/>
  <box at="7 3 13" size="1 2 1" color="Z"/>
  <!-- Punteggiatura / anelli tigrati sulla coda -->
  <box at="7 2 7" size="2 1 1" color="S" on="Z"/>
  <box at="7 2 10" size="2 1 1" color="S" on="Z"/>
  <box at="7 2 12" size="2 1 1" color="S" on="Z"/>

  <!-- Testa proporzionata e accogliente rivolta verso grande y -->
  <ellipsoid at="7 14 7" size="9 7 7" color="T"/>
  <box at="7 14 7" size="7 6 6" color="T" on="B"/>

  <!-- Musetto, tartufo rosa e guance panna -->
  <box at="7 17 6" size="5 2 3" color="U"/>
  <box at="7 18 7" size="1 1 1" color="N"/>

  <!-- Occhi verdi espressivi -->
  <box at="5 17 8" size="1 1 2" color="E"/>
  <box at="9 17 8" size="1 1 2" color="E"/>

  <!-- Orecchie a punta con interno rosa -->
  <cone at="4 14 11" size="3 2 3" color="T"/>
  <cone at="10 14 11" size="3 2 3" color="T"/>
  <box at="4 15 11" size="1 1 2" color="R"/>
  <box at="10 15 11" size="1 1 2" color="R"/>

  <!-- Striature tigrate sulla fronte -->
  <box at="7 14 11" size="3 1 1" color="K" on="T"/>
  <box at="7 15 10" size="1 2 1" color="K" on="T"/>
  <box at="4 16 9" size="1 1 1" color="K" on="T"/>
  <box at="10 16 9" size="1 1 1" color="K" on="T"/>
</sequence>
```
