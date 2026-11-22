# model.sculpt · primo · gemini-3.1-flash-lite · 10 s · 5725 token d'ingresso (2035 in cache), 491 d'uscita, 2570 di ragionamento · $0.0056

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTGdkCr" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="G" value="00e436" name="foglie"/>
  <color symbol="d" value="49333b" name="ombra foglie"/>
  <!-- Hidden markers -->
  <!-- k: height choice, C: crown volume, r: growth -->
  <box at="0 0 48" size="1 1 12" color="k"/>
  <one in="k" out="r" steps="1"/>
  <all in="k" out="B"/>

  <!-- Trunk base -->
  <box at="20 20 0" size="3 3 2" color="T"/>
  
  <!-- Trunk growth -->
  <one steps="50">
    <rule in="B r" out="T r" p="0.8"/>
    <rule in="B r" out="T B" p="0.2"/>
    <rule in="T r" out="T T" p="0.9"/>
    <rule in="T r" out="T B" p="0.1"/>
  </one>
  <all in="r" out="T"/>

  <!-- Crown volume -->
  <ellipsoid at="20 20 45" size="32 32 24" color="C" on="B"/>

  <!-- Internal branches -->
  <one steps="30" symmetry="(xyz)">
     <rule in="T C" out="T T"/>
  </one>

  <!-- Foliage -->
  <all in="C" out="G"/>

  <!-- Shading and texture -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="G" out="d" values="G" sum="0..12" p="0.4"/>
  </convolution>

  <!-- Cleanup -->
  <all in="C" out="B"/>
</sequence>
