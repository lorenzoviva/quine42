# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 5678 token d'ingresso (0 in cache), 538 d'uscita, 2443 di ragionamento · $0.0059

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTFLhkrC" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="F" value="2f6b3a" name="foglie"/>
  <color symbol="L" value="4b8f4a" name="foglie al sole"/>
  <color symbol="N" value="1f4a2c" name="foglie in ombra"/>
  <color symbol="h" hidden="True"/>
  <color symbol="k" hidden="True"/>
  <color symbol="r" hidden="True"/>
  <color symbol="C" hidden="True"/>

  <!-- Choose height -->
  <box at="0 0 48" size="1 1 12" color="h"/>
  <one in="h" out="k" steps="1"/>
  <all in="h" out="B"/>

  <!-- Thick trunk base -->
  <cylinder at="20 20 0" size="8 8 12" color="T"/>

  <!-- Trunk growth -->
  <box at="20 20 12" size="6 6 1" color="r"/>
  <one steps="35">
    <rule in="B r" out="r T" p="0.9"/>
    <rule in="B r" out="r r" p="0.1"/>
  </one>
  <all in="r" out="T"/>

  <!-- Canopy volume -->
  <ellipsoid at="20 20 42" size="36 36 24" color="C"/>
  <all in="B C" out="F"/>
  <all in="C" out="B"/>

  <!-- Refine canopy shape -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="F B" out="F F" p="0.4"/>
  </convolution>

  <!-- Lighting and texture -->
  <prl steps="1">
    <rule in="B F" out="B L" p="0.3"/>
    <rule in="F B" out="N B" p="0.3"/>
  </prl>
</sequence>
