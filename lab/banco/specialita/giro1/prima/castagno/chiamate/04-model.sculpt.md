# model.sculpt · primo · gemini-3.1-flash-lite · 3 s · 7263 token d'ingresso (4075 in cache), 670 d'uscita, 125 di ragionamento · $0.0021

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTFLNhkVrx" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="5d4037" name="tronco"/>
  <color symbol="F" value="2e7d32" name="foglie"/>
  <color symbol="L" value="4caf50" name="foglie al sole"/>
  <color symbol="N" value="1b5e20" name="foglie in ombra"/>
  <color symbol="h" hidden="True"/>
  <color symbol="k" hidden="True"/>
  <color symbol="V" hidden="True"/>
  <color symbol="r" hidden="True"/>
  <color symbol="x" hidden="True"/>

  <!-- Height logic: 48 to 60 -->
  <box at="0 0 48" size="1 1 12" color="h"/>
  <one in="h" out="k" steps="1"/>
  <all in="h" out="B"/>

  <!-- Wide trunk base -->
  <box at="20 20 0" size="6 6 1" color="T"/>
  <box at="20 20 1" size="4 4 20" color="T"/>
  <box at="20 20 21" size="2 2 20" color="r"/>

  <!-- Crown shape: rounded -->
  <ellipsoid at="20 20 40" size="38 38 30" color="V" on="B"/>
  
  <!-- Branching growth within the crown -->
  <one steps="800">
    <rule in="r V" out="r T" p="0.5"/>
    <rule in="r* *V" out="r* *T" p="0.1"/>
  </one>
  <all in="r" out="T"/>

  <!-- Fill crown with leaves -->
  <all steps="2" symmetry="(xyz)">
    <rule in="TV" out="TF"/>
    <rule in="FV" out="FF"/>
  </all>
  <one steps="3000" symmetry="(xyz)" in="FV" out="FF"/>
  
  <!-- Cleanup -->
  <all in="V" out="B"/>

  <!-- Shading and coloring -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="F" out="B" values="B" sum="15..26" p="0.3"/>
  </convolution>
  <prl steps="1">
    <rule in="B F" out="B L" p="0.6"/>
    <rule in="F B" out="N B" p="0.7"/>
  </prl>
</sequence>
