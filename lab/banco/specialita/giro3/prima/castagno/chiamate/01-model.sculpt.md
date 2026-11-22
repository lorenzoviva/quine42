# model.sculpt · primo · gemini-3.1-flash-lite · 3 s · 7263 token d'ingresso (0 in cache), 693 d'uscita, 131 di ragionamento · $0.0031

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTFLNhkVrx" size="40 40 60" symmetry="(xy)" name="Castagno">
  <!-- Colors for a sturdy, round chestnut tree -->
  <color symbol="T" value="5d4037" name="tronco"/>
  <color symbol="F" value="2e7d32" name="chioma"/>
  <color symbol="L" value="4caf50" name="chioma al sole"/>
  <color symbol="N" value="1b5e20" name="chioma in ombra"/>
  <color symbol="h" hidden="True" name="altezze possibili della punta"/>
  <color symbol="k" hidden="True" name="la quota scelta"/>
  <color symbol="V" hidden="True" name="la sagoma a cupola"/>
  <color symbol="r" hidden="True" name="punta che cresce"/>
  <color symbol="x" hidden="True" name="radici e base"/>

  <!-- Chestnut trees are tall (48-58) -->
  <box at="0 0 48" size="1 1 10" color="h"/>
  <one in="h" out="k" steps="1"/>
  <all in="h" out="B"/>
  <all in="kB" out="kk"/>

  <!-- Sturdy trunk growing upward -->
  <box at="20 20 0" size="4 4 1" color="r"/>
  <one steps="50">
    <rule in="B r" out="r T" p="0.9"/>
    <rule in="B* *r" out="r* *T" p="0.1"/>
  </one>
  <all in="r" out="T"/>
  <all in="k" out="B"/>
  
  <!-- The broad canopy shape (a sphere/ellipsoid atop the trunk) -->
  <ellipsoid at="20 20 40" size="38 38 30" color="V" on="B"/>
  
  <!-- Fill the canopy with leaves -->
  <all steps="2" symmetry="(xyz)">
    <rule in="TV" out="TF"/>
    <rule in="FV" out="FF"/>
  </all>
  <one steps="3000" symmetry="(xyz)" in="FV" out="FF"/>
  
  <!-- Clean up the silhouette -->
  <all in="V" out="B"/>

  <!-- Add texture: light and shadow on the leaves -->
  <prl steps="1">
    <rule in="B F" out="B L" p="0.4"/>
    <rule in="F B" out="N B" p="0.6"/>
  </prl>

  <!-- Add some base roots/width -->
  <box at="18 18 0" size="6 6 2" color="T"/>
</sequence>
