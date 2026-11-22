# model.sculpt · primo · gemini-3.1-flash-lite · 9 s · 5972 token d'ingresso (2035 in cache), 418 d'uscita, 3250 di ragionamento · $0.0065

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BNnIKS" name="Baule da viaggio" size="20 20 20">
  <color symbol="N" value="8a5a30"/>
  <color symbol="n" value="5e3c20"/>
  <color symbol="I" value="4a4f5a"/>
  <color symbol="K" value="9a6a3a"/>
  <color symbol="S" value="c8a040"/>

  <!-- Base -->
  <box at="10 10 0" size="16 12 8" color="N"/>

  <!-- Lid (domed effect via layers) -->
  <box at="10 10 8" size="16 12 1" color="K"/>
  <box at="10 10 9" size="14 10 1" color="K"/>
  <box at="10 10 10" size="12 8 1" color="K"/>
  <box at="10 10 11" size="10 6 1" color="K"/>

  <!-- Iron Bands -->
  <box at="6 10 0" size="1 12 12" color="I"/>
  <box at="14 10 0" size="1 12 12" color="I"/>

  <!-- Lock -->
  <box at="10 16 4" size="2 1 2" color="S"/>

  <!-- Texture -->
  <prl in="N" out="n" p="0.05" steps="1"/>
  <prl in="K" out="n" p="0.05" steps="1"/>
</sequence>
