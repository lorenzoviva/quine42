# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 7505 token d'ingresso (4076 in cache), 488 d'uscita, 2489 di ragionamento · $0.0054

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BNIKSn" size="20 20 20" symmetry="(xy)" name="Baule da viaggio">
  <color symbol="N" value="8a5a30" name="assi"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="K" value="8a5a30" name="coperchio"/>
  <color symbol="S" value="e4bb40" name="serratura"/>
  <color symbol="n" value="5e3c20" name="fessure"/>

  <!-- Corpo principale del baule -->
  <box at="10 10 0" size="20 18 12" color="N"/>

  <!-- Coperchio bombato (gradini per simulare la curva) -->
  <box at="10 10 12" size="20 18 2" color="K"/>
  <box at="10 10 14" size="18 16 2" color="K"/>
  <box at="10 10 16" size="14 12 2" color="K"/>

  <!-- Cerchi di ferro verticali -->
  <box at="5 10 0" size="2 18 18" color="I"/>
  <box at="15 10 0" size="2 18 18" color="I"/>
  
  <!-- Fascia di ferro orizzontale di chiusura -->
  <box at="10 10 12" size="20 18 1" color="I"/>

  <!-- Serratura frontale -->
  <box at="10 19 8" size="3 2 4" color="S"/>

  <!-- Dettagli: venature e fessure del legno -->
  <prl in="N" out="n" p="0.05"/>
  <prl in="K" out="n" p="0.05"/>
</sequence>
