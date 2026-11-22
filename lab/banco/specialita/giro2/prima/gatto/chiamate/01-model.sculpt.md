# model.sculpt · primo · gemini-3.8-flash · 9 s · 7514 token d'ingresso (5469 in cache), 1261 d'uscita, 0 di ragionamento · $0.0067

## Richiesta

Sculpt: Gatto rosso
What it looks like: un gatto tigrato, la coda alta
Class: animal · box 15 × 20 × 15 voxels · at least 9 tall

## Risposta

```xml
<sequence values="BICTUNEJKLPQAZDF" size="15 20 15" symmetry="(xy)" name="Gatto rosso">
  <color symbol="I" value="cf5822" name="pelo fulvo scuro"/>
  <color symbol="C" value="f7ddbe" name="petto chiaro"/>
  <color symbol="T" value="e06f28" name="testa fulva" part="head"/>
  <color symbol="U" value="f7ddbe" name="musetto chiaro" part="head"/>
  <color symbol="N" value="e07b7b" name="naso rosa" part="head"/>
  <color symbol="E" value="38872b" name="occhi smeraldo" part="head"/>
  <color symbol="D" value="e5968d" name="interno orecchie" part="head"/>
  <color symbol="F" value="7a2c0f" name="striature testa" part="head"/>
  <color symbol="J" value="f7ddbe" name="zampa ant sx" part="leg"/>
  <color symbol="L" value="f7ddbe" name="zampa ant dx" part="leg"/>
  <color symbol="P" value="e06f28" name="zampa post sx" part="leg"/>
  <color symbol="Q" value="e06f28" name="zampa post dx" part="leg"/>
  <color symbol="A" value="e06f28" name="coda alta" part="tail"/>
  <color symbol="Z" value="7a2c0f" name="punta coda" part="tail"/>
  <color symbol="K" value="7a2c0f" name="striature corpo"/>

  <!-- Zampe anteriori con calzini chiari -->
  <box at="4 13 0" size="2 3 5" color="J"/>
  <box at="10 13 0" size="2 3 5" color="L"/>

  <!-- Zampe posteriori accucciate/pronte allo scatto -->
  <box at="3 4 0" size="3 3 5" color="P"/>
  <box at="9 4 0" size="3 3 5" color="Q"/>

  <!-- Corpo morbido e tozzo -->
  <ellipsoid at="7 8 4" size="8 12 7" color="I"/>
  <box at="7 8 4" size="6 10 5" color="I" on="B"/>

  <!-- Pettorina e ventre chiaro -->
  <box at="7 12 4" size="5 3 4" color="C"/>
  <box at="7 8 2" size="4 6 2" color="C"/>

  <!-- Testa rotonda stile chibi -->
  <ellipsoid at="7 14 7" size="9 8 7" color="T"/>

  <!-- Muso chiaro sporgente verso +y -->
  <box at="7 17 6" size="5 3 3" color="U"/>
  <box at="7 18 7" size="1 1 1" color="N"/>

  <!-- Occhi verdi vispi -->
  <box at="5 17 8" size="1 1 2" color="E"/>
  <box at="9 17 8" size="1 1 2" color="E"/>

  <!-- Orecchie a punta -->
  <cone at="4 14 11" size="3 3 3" color="T"/>
  <cone at="10 14 11" size="3 3 3" color="T"/>
  <box at="4 15 11" size="1 1 2" color="D"/>
  <box at="10 15 11" size="1 1 2" color="D"/>

  <!-- Coda alta ed espressiva eretta verso l'alto -->
  <line at="7 3 5" to="7 2 9" r="1" color="A"/>
  <line at="7 2 9" to="7 3 13" r="1" color="A"/>
  <line at="7 3 13" to="7 4 14" r="1" color="Z"/>

  <!-- Striature tigrate scure sul dorso -->
  <box at="7 5 7" size="7 1 1" color="K" on="I"/>
  <box at="7 7 8" size="7 1 1" color="K" on="I"/>
  <box at="7 9 7" size="7 1 1" color="K" on="I"/>
  <box at="7 11 6" size="6 1 1" color="K" on="I"/>

  <!-- Striature tigrate sulla fronte -->
  <box at="7 14 11" size="3 1 1" color="F" on="T"/>
  <box at="7 15 10" size="1 2 1" color="F" on="T"/>
</sequence>
```
