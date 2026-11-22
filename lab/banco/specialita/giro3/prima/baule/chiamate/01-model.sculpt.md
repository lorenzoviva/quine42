# model.sculpt · primo · gemini-3.1-flash-lite · 9 s · 7505 token d'ingresso (4076 in cache), 408 d'uscita, 3143 di ragionamento · $0.0063

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BNnIS" size="20 20 20" symmetry="(xy)" name="Baule da viaggio">
  <color symbol="N" value="8a5a30" name="legno"/>
  <color symbol="n" value="5e3c20" name="venature"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="S" value="c8a040" name="serratura"/>

  <!-- Main Body -->
  <box at="10 10 0" size="18 14 10" color="N"/>

  <!-- Domed Lid -->
  <box at="10 10 10" size="18 14 1" color="N"/>
  <box at="10 10 11" size="16 12 1" color="N"/>
  <box at="10 10 12" size="14 10 1" color="N"/>
  <box at="10 10 13" size="12 8 1" color="N"/>

  <!-- Iron Bands -->
  <box at="5 10 0" size="2 14 11" color="I"/>
  <box at="15 10 0" size="2 14 11" color="I"/>

  <!-- Lock (Placed on the front, overriding global symmetry) -->
  <one in="N/B" out="*/S" symmetry="()" steps="1"/>

  <!-- Wood Grain Texture -->
  <prl in="N" out="n" p="0.05" steps="1"/>
</sequence>
