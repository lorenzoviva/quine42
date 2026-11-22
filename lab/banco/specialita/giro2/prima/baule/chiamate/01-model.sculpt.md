# model.sculpt · primo · gemini-3.1-flash-lite · 7 s · 7505 token d'ingresso (4076 in cache), 421 d'uscita, 2269 di ragionamento · $0.0050

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BWISDC" size="20 20 20" symmetry="(xy)" name="Baule da viaggio">
  <color symbol="W" value="8a5a30"/>
  <color symbol="I" value="4a4f5a"/>
  <color symbol="S" value="c8a040"/>
  <color symbol="D" value="5e3c20"/>
  <color symbol="C" value="a07040"/>

  <!-- Corpo del baule -->
  <box at="10 10 0" size="16 14 10" color="W"/>

  <!-- Coperchio bombato (gradini) -->
  <box at="10 10 10" size="16 14 2" color="C"/>
  <box at="10 10 12" size="14 12 2" color="C"/>
  <box at="10 10 14" size="12 10 2" color="C"/>
  <box at="10 10 16" size="10 8 2" color="C"/>

  <!-- Cerchi di ferro (la simmetria crea l'altro lato) -->
  <box at="5 10 0" size="2 14 18" color="I"/>
  <box at="10 10 9" size="16 2 2" color="I"/>

  <!-- Serratura frontale -->
  <box at="10 17 5" size="2 2 3" color="S"/>

  <!-- Texture del legno -->
  <prl in="W" out="D" p="0.05" steps="1"/>
</sequence>
