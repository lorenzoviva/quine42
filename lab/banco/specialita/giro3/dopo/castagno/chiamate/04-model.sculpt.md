# model.sculpt · primo · gemini-3.1-flash-lite · 9 s · 5678 token d'ingresso (2035 in cache), 459 d'uscita, 2498 di ragionamento · $0.0054

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTLEH" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="L" value="008751" name="foglie"/>
  <color symbol="D" value="4b692f" name="foglie in ombra"/>
  <color symbol="H" hidden="True" name="volume chioma"/>

  <!-- Base and Trunk -->
  <box at="20 20 0" size="8 8 3" color="T"/>
  <cylinder at="20 20 3" size="5 5 35" color="T"/>
  
  <!-- Crown Volume -->
  <ellipsoid at="20 20 40" size="36 36 24" color="H"/>

  <!-- Populate Crown -->
  <all in="H" out="L"/>

  <!-- Fluffing the edges and adding variation -->
  <one steps="1500" symmetry="(xyz)">
    <rule in="L" out="B" p="0.15"/>
    <rule in="B L" out="L L" p="0.05"/>
  </one>

  <!-- Smooth the crown shape -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="B L" out="L L" sum="12..26"/>
    <rule in="L" out="B" sum="0..5"/>
  </convolution>

  <!-- Add shading/depth to the leaves -->
  <prl steps="1" in="L" out="D" p="0.3"/>

  <!-- Cleanup: ensure no floating leaves -->
  <convolution neighborhood="VonNeumann" steps="2">
    <rule in="L" out="B" values="B" sum="0..0"/>
  </convolution>
</sequence>
