# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 5678 token d'ingresso (0 in cache), 636 d'uscita, 2069 di ragionamento · $0.0055

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTLSVhrk" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="L" value="2f6b3a" name="chioma"/>
  <color symbol="S" value="1f4a2c" name="chioma in ombra"/>
  <color symbol="H" value="4b8f4a" name="chioma al sole"/>
  <color symbol="V" hidden="True"/>
  <color symbol="h" hidden="True"/>
  <color symbol="r" hidden="True"/>
  <color symbol="k" hidden="True"/>

  <!-- Scelta altezza -->
  <box at="20 20 48" size="1 1 12" color="h"/>
  <one in="h" out="k" steps="1"/>
  <all in="h" out="B"/>

  <!-- Tronco robusto e base -->
  <cylinder at="20 20 0" size="10 10 20" color="T" on="B"/>
  <box at="20 20 20" size="1 1 1" color="r"/>
  
  <!-- Ramificazione -->
  <one steps="400" symmetry="(xy)">
    <rule in="B r" out="r T" p="0.8"/>
    <rule in="B* *r" out="r* *T" p="0.2"/>
  </one>
  <all in="r" out="T"/>

  <!-- Volume chioma -->
  <ellipsoid at="20 20 45" size="38 38 25" color="V" on="B"/>

  <!-- Riempimento chioma -->
  <all in="TV" out="TL"/>
  <one steps="3000" symmetry="(xyz)">
    <rule in="B L" out="L L" p="0.6"/>
    <rule in="L B" out="L L" p="0.4"/>
  </one>

  <!-- Pulizia e dettagli -->
  <all in="V" out="B"/>
  <convolution neighborhood="Moore" steps="2">
    <rule in="L" out="B" values="B" sum="1..6" p="0.3"/>
  </convolution>
  <prl steps="1">
    <rule in="B L" out="B H" p="0.3"/>
    <rule in="L B" out="S B" p="0.4"/>
  </prl>
</sequence>
