# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 7505 token d'ingresso (4076 in cache), 578 d'uscita, 2151 di ragionamento · $0.0051

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BNIKLS" size="20 20 20" symmetry="(x)">
  <color symbol="N" value="8a5a30" name="legno"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="K" value="9a6a3a" name="coperchio"/>
  <color symbol="S" value="c8a040" name="serratura"/>
  <color symbol="L" value="5e3c20" name="venature"/>

  <!-- Base -->
  <box at="10 10 0" size="18 16 10" color="N"/>

  <!-- Lid -->
  <box at="10 10 10" size="18 16 6" color="K"/>
  
  <!-- Dome: erode corners of the lid -->
  <all steps="2" symmetry="(x)">
    <rule in="K B" out="B K"/>
    <rule in="B K" out="K B"/>
  </all>
  <all in="K B" out="B B" symmetry="(x)"/>

  <!-- Iron bands -->
  <all in="N" out="I" symmetry="(x)">
    <rule in="I N" out="I I"/>
    <rule in="N I" out="I I"/>
  </all>
  <all in="K" out="I" symmetry="(x)">
    <rule in="I K" out="I I"/>
    <rule in="K I" out="I I"/>
  </all>
  
  <!-- Iron bands - vertical decoration -->
  <box at="10 10 0" size="2 18 16" color="I"/>
  <box at="4 10 0" size="2 18 16" color="I"/>
  <box at="16 10 0" size="2 18 16" color="I"/>
  
  <!-- Lock -->
  <one in="N" out="S" symmetry="()" steps="1">
    <rule in="N" out="S"/>
  </one>
  <box at="10 19 5" size="2 2 2" color="S"/>

  <!-- Texture -->
  <prl in="N" out="L" p="0.1" steps="1"/>
</sequence>
