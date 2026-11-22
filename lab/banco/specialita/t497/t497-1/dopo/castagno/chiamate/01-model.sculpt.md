# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 5725 token d'ingresso (0 in cache), 560 d'uscita, 1798 di ragionamento · $0.0050

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTgVs" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="g" value="00e436" name="foglie"/>
  <color symbol="V" value="4b692f" name="foglie in ombra"/>
  <color symbol="s" hidden="True"/>
  <color symbol="r" hidden="True"/>

  <!-- Seed and trunk growth -->
  <box at="20 20 0" size="1 1 1" color="s"/>
  <one steps="50">
    <rule in="s B" out="T s"/>
    <rule in="s T" out="T s"/>
  </one>
  <all in="s" out="T"/>
  
  <!-- Trunk thickening -->
  <cylinder at="20 20 0" size="6 6 48" color="T" on="B"/>
  <cylinder at="20 20 0" size="10 10 6" color="T" on="B"/>

  <!-- Crown volume -->
  <ellipsoid at="20 20 45" size="36 36 24" color="g" on="B"/>
  
  <!-- Fill and organic smoothing -->
  <convolution neighborhood="Moore" steps="3">
    <rule in="B g" out="g g" sum="5..26"/>
  </convolution>
  
  <!-- Leaf variation -->
  <prl steps="1" in="g" out="V" p="0.4"/>
  <prl steps="1" in="g" out="g" p="0.2"/>

  <!-- Root system -->
  <box at="20 20 0" size="12 12 2" color="r" on="B"/>
  <all in="r" out="T"/>

  <!-- Cleanup floating bits -->
  <convolution neighborhood="NoCorners" steps="2">
    <rule in="g" out="B" values="B" sum="0..1"/>
  </convolution>

  <!-- Final detail: Bark/Texture hint -->
  <prl steps="1" in="T" out="T" p="0.05"/>
</sequence>
