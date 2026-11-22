# model.sculpt · primo · gemini-3.1-flash-lite · 7 s · 5972 token d'ingresso (2035 in cache), 358 d'uscita, 2376 di ragionamento · $0.0051

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BNIKH" size="20 20 20" name="Baule da viaggio" symmetry="(x)">
  <color symbol="N" value="ab5236"/>
  <color symbol="I" value="1d2b53"/>
  <color symbol="K" value="ab5236"/>
  <color symbol="H" value="e4bb40"/>
  
  <!-- Base box -->
  <box at="10 10 0" size="16 12 10" color="N"/>
  
  <!-- Rounded lid (stepped) -->
  <box at="10 10 10" size="16 12 1" color="K"/>
  <box at="10 10 11" size="14 10 1" color="K"/>
  <box at="10 10 12" size="12 8 1" color="K"/>
  
  <!-- Iron bands -->
  <box at="4 10 0" size="2 12 11" color="I"/>
  <box at="16 10 0" size="2 12 11" color="I"/>
  <box at="10 10 0" size="2 12 11" color="I"/>
  
  <!-- Lock -->
  <box at="10 16 5" size="2 1 2" color="H"/>
</sequence>
