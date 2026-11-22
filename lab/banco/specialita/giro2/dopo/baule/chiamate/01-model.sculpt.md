# model.sculpt · primo · gemini-3.1-flash-lite · 2 s · 5972 token d'ingresso (0 in cache), 565 d'uscita, 121 di ragionamento · $0.0025

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BNIhkf" size="20 20 20" name="Baule da viaggio">
  <color symbol="B" value="000000"/>
  <color symbol="N" value="8a5a30" name="assi legno"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="h" hidden="True"/>
  <color symbol="k" hidden="True"/>
  <color symbol="f" hidden="True"/>

  <!-- Base box -->
  <box at="10 10 0" size="16 12 8" color="N"/>

  <!-- Rounded lid construction -->
  <!-- We define a profile for the lid -->
  <box at="10 10 8" size="16 12 1" color="N"/>
  <box at="10 10 9" size="14 10 1" color="N"/>
  <box at="10 10 10" size="12 8 1" color="N"/>
  <box at="10 10 11" size="10 6 1" color="N"/>

  <!-- Iron bands -->
  <!-- Vertical bands on the main body -->
  <box at="4 10 0" size="2 12 8" color="I"/>
  <box at="10 10 0" size="2 12 8" color="I"/>
  <box at="16 12 0" size="2 12 8" color="I"/>

  <!-- Horizontal bands on the lid -->
  <box at="10 10 8" size="18 1 1" color="I"/>
  <box at="10 10 11" size="12 1 1" color="I"/>

  <!-- Add some texture/cracks -->
  <prl in="N" out="n" p="0.05" steps="1"/>
  <color symbol="n" value="5e3c20"/>

  <!-- Lock -->
  <box at="10 16 4" size="2 1 2" color="I"/>
  <box at="10 16 5" size="1 1 1" value="c8a040"/>
</sequence>
