# model.sculpt · primo · gemini-3.1-flash-lite · 7 s · 7263 token d'ingresso (0 in cache), 450 d'uscita, 1970 di ragionamento · $0.0054

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTENeG" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="N" value="4a3424" name="corteccia"/>
  <color symbol="E" value="008751" name="foglie"/>
  <color symbol="e" value="125359" name="ombra_foglie"/>
  <color symbol="G" value="00e436" name="luce_foglie"/>

  <!-- Base del tronco, solido e largo -->
  <cylinder at="20 20 0" size="10 10 20" color="T"/>
  <cylinder at="20 20 20" size="6 6 15" color="T"/>

  <!-- Chioma tonda -->
  <ellipsoid at="20 20 45" size="38 38 28" color="E"/>

  <!-- Dettaglio corteccia -->
  <prl steps="800" in="T" out="N" p="0.08"/>

  <!-- Variazione tonale nella chioma -->
  <prl steps="2000" in="E" out="e" p="0.2"/>
  <prl steps="1500" in="E" out="G" p="0.15"/>

  <!-- Rifinitura forma chioma -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="E" out="B" values="B" sum="20..26"/>
  </convolution>
  <convolution neighborhood="Moore" steps="1">
    <rule in="B" out="E" values="E" sum="12..26"/>
  </convolution>
</sequence>
