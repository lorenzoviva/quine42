# model.sculpt · primo · gemini-3.1-flash-lite · 9 s · 5972 token d'ingresso (0 in cache), 733 d'uscita, 2722 di ragionamento · $0.0067

## Richiesta

Sculpt: Baule da viaggio
What it looks like: un baule di legno coi cerchi di ferro e il coperchio bombato
Class: furniture · box 20 × 20 × 20 voxels

## Risposta

<sequence values="BNISK" size="20 20 20" name="Baule da viaggio">
  <color symbol="N" value="8b5a2b" name="legno"/>
  <color symbol="I" value="4a4f5a" name="ferro"/>
  <color symbol="S" value="d4a017" name="serratura"/>
  <color symbol="K" value="8b5a2b" name="coperchio"/>

  <!-- Corpo principale -->
  <box at="10 10 4" size="16 12 8" color="N"/>

  <!-- Coperchio bombato (gradini) -->
  <box at="10 10 12" size="16 12 1" color="K"/>
  <box at="10 10 13" size="14 10 1" color="K"/>
  <box at="10 10 14" size="12 8 1" color="K"/>
  <box at="10 10 15" size="10 6 1" color="K"/>

  <!-- Cerchi di ferro (verticali) -->
  <box at="4 10 4" size="1 12 8" color="I"/>
  <box at="16 10 4" size="1 12 8" color="I"/>
  <box at="4 10 12" size="1 12 1" color="I"/>
  <box at="16 10 12" size="1 12 1" color="I"/>
  <box at="4 10 13" size="1 10 1" color="I"/>
  <box at="16 10 13" size="1 10 1" color="I"/>
  <box at="4 10 14" size="1 8 1" color="I"/>
  <box at="16 10 14" size="1 8 1" color="I"/>
  <box at="4 10 15" size="1 6 1" color="I"/>
  <box at="16 10 15" size="1 6 1" color="I"/>

  <!-- Cerchio centrale e serratura -->
  <box at="10 10 4" size="1 12 8" color="I"/>
  <box at="10 10 12" size="1 12 1" color="I"/>
  <box at="10 10 13" size="1 10 1" color="I"/>
  <box at="10 10 14" size="1 8 1" color="I"/>
  <box at="10 10 15" size="1 6 1" color="I"/>
  <box at="10 16 8" size="2 1 2" color="S"/>
</sequence>
