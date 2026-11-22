# model.sculpt · primo · gemini-3.1-flash-lite · 3 s · 5972 token d'ingresso (2035 in cache), 754 d'uscita, 126 di ragionamento · $0.0024

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BNnIKSwahk" size="20 20 20" symmetry="(x)" name="Baule da viaggio">
  <!-- Palette -->
  <color symbol="N" value="8a5a30" name="assi"/>
  <color symbol="n" value="5e3c20" name="fessure"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="K" value="7a4a20" name="coperchio"/>
  <color symbol="S" value="c8a040" name="serratura"/>
  <color symbol="w" hidden="True" name="work"/>
  <color symbol="a" hidden="True" name="cassa_base"/>
  <color symbol="h" hidden="True" name="altezza_cassa"/>
  <color symbol="k" hidden="True" name="marcatore_coperchio"/>

  <!-- 1. Main Box Body -->
  <box at="10 10 0" size="16 14 10" color="a"/>
  <all in="a" out="N"/>
  
  <!-- Add planks details -->
  <prl in="N" out="n" p="0.1" steps="2"/>
  <all in="n/N" out="*/n" steps="4" symmetry="(x)"/>

  <!-- 2. Arched Lid (Bombato) -->
  <!-- We place a helper block on top to shape the arch -->
  <box at="10 10 10" size="16 14 1" color="k"/>
  
  <!-- Grow the arch: layers of decreasing width -->
  <all in="k" out="K"/>
  <all in="K" out="K" symmetry="()">
    <rule in="K/B" out="K/K"/>
    <rule in="K/K" out="K/K"/>
  </all>
  
  <!-- Shape the curve (erosion/rounding) -->
  <all in="K/B" out="B/B" symmetry="(x)"/>
  <all in="B/K" out="B/B" symmetry="(x)"/>
  
  <!-- 3. Iron Bands -->
  <!-- We put 3 bands across the width -->
  <box at="5 10 0" size="2 14 11" color="I"/>
  <box at="10 10 0" size="2 14 11" color="I"/>
  <box at="15 10 0" size="2 14 11" color="I"/>
  
  <!-- 4. Lock -->
  <!-- Place it on the front face -->
  <one in="N" out="S" steps="1">
    <rule in="N" out="S"/>
  </one>
  <all in="S" out="S" symmetry="()">
    <rule in="N/S" out="N/S"/>
    <rule in="S" out="S"/>
  </all>
  
  <!-- Cleanup -->
  <all in="k" out="B"/>
</sequence>
