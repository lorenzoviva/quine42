# model.sculpt · primo · gemini-3.1-flash-lite · 7 s · 7263 token d'ingresso (4075 in cache), 571 d'uscita, 1781 di ragionamento · $0.0044

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTGNDV" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="G" value="5a9e3e" name="chioma"/>
  <color symbol="N" value="2d5420" name="chioma ombra"/>
  <color symbol="D" value="1a3312" name="chioma profonda"/>
  <color symbol="V" hidden="True"/>

  <!-- Base del tronco larga -->
  <cylinder at="20 20 0" size="12 12 8" color="T"/>
  
  <!-- Crescita del tronco verso l'alto -->
  <box at="20 20 8" size="8 8 32" color="T"/>
  
  <!-- Volume della chioma tonda -->
  <ellipsoid at="20 20 44" size="36 36 28" color="V" on="B"/>

  <!-- Riempimento chioma -->
  <all steps="15">
    <rule in="V B" out="V G" p="0.8"/>
    <rule in="V T" out="T V"/>
  </all>

  <!-- Rifinitura volume -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="B" out="G" values="G" sum="10..26"/>
  </convolution>

  <!-- Rimozione helper -->
  <all in="V" out="G"/>

  <!-- Ombreggiatura e dettaglio -->
  <prl steps="1">
    <rule in="G G G" out="G N G" p="0.4"/>
    <rule in="G" out="N" p="0.3"/>
  </prl>
  <prl steps="1">
    <rule in="N" out="D" p="0.2"/>
  </prl>

  <!-- Pulizia bordi -->
  <convolution neighborhood="Moore" steps="1">
    <rule in="G" out="B" values="B" sum="0..4"/>
  </convolution>
  <convolution neighborhood="Moore" steps="1">
    <rule in="N" out="B" values="B" sum="0..3"/>
  </convolution>
</sequence>
