# model.sculpt · primo · gemini-3.1-flash-lite · 7 s · 7505 token d'ingresso (4076 in cache), 523 d'uscita, 1953 di ragionamento · $0.0047

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BNnIS" size="20 20 20" symmetry="(x)" name="Baule da viaggio">
  <color symbol="N" value="8a5a30" name="legno"/>
  <color symbol="n" value="5e3c20" name="venature"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="S" value="c8a040" name="serratura"/>

  <!-- Struttura base del baule -->
  <box at="10 10 0" size="18 16 10" color="N"/>

  <!-- Coperchio bombato a strati -->
  <box at="10 10 10" size="18 16 2" color="N"/>
  <box at="10 10 12" size="14 12 2" color="N"/>
  <box at="10 10 14" size="10 8 1" color="N"/>

  <!-- Cerchi di ferro verticali (strutturali) -->
  <box at="5 10 0" size="2 16 12" color="I"/>
  <box at="15 10 0" size="2 16 12" color="I"/>

  <!-- Cerchi di ferro sul coperchio -->
  <box at="5 10 10" size="2 16 5" color="I"/>
  <box at="15 10 10" size="2 16 5" color="I"/>

  <!-- Serratura frontale -->
  <box at="10 18 6" size="2 2 4" color="S"/>
  <box at="10 18 11" size="2 2 1" color="S"/>

  <!-- Texture del legno -->
  <prl in="N" out="n" p="0.05" steps="10"/>
  
  <!-- Pulizia bordi per contorni netti -->
  <all in="I N" out="I I" steps="1"/>
</sequence>
