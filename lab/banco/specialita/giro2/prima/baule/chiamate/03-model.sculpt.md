# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 7505 token d'ingresso (4076 in cache), 438 d'uscita, 2546 di ragionamento · $0.0054

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BNnILS" size="20 20 20" symmetry="(xy)" name="Baule da viaggio">
  <color symbol="N" value="8a5a30" name="legno"/>
  <color symbol="n" value="5e3c20" name="venature"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="L" value="a07040" name="legno coperchio"/>
  <color symbol="S" value="c8a040" name="serratura"/>

  <!-- Corpo principale -->
  <box at="10 10 0" size="18 16 12" color="N"/>

  <!-- Coperchio bombato -->
  <box at="10 10 12" size="18 16 4" color="L"/>
  <box at="10 10 16" size="14 12 2" color="L"/>
  
  <!-- Cerchi di ferro -->
  <box at="10 10 0" size="2 16 18" color="I"/>
  <box at="4 10 0" size="2 16 18" color="I"/>
  <box at="16 10 0" size="2 16 18" color="I"/>
  
  <!-- Decorazione e serratura -->
  <one in="I" out="S" steps="1"/>
  <prl in="N" out="n" p="0.05" steps="10"/>
  
  <!-- Arrotondamento finale -->
  <convolution neighborhood="NoCorners" steps="1">
    <rule in="B L" out="L B"/>
  </convolution>
</sequence>
