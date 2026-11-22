# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 5725 token d'ingresso (2035 in cache), 854 d'uscita, 1759 di ragionamento · $0.0049

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BNGEJhkVrx" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="N" value="6b4a2e" name="tronco"/>
  <color symbol="J" value="4b692f" name="foglie"/>
  <color symbol="G" value="00e436" name="foglie sole"/>
  <color symbol="E" value="008751" name="foglie ombra"/>
  <color symbol="h" hidden="True" name="altezze possibili"/>
  <color symbol="k" hidden="True" name="quota scelta"/>
  <color symbol="V" hidden="True" name="volume chioma"/>
  <color symbol="r" hidden="True" name="tracciante crescita"/>
  <color symbol="x" hidden="True" name="piede"/>

  <!-- Scelta dell'altezza (minimo 48) -->
  <box at="0 0 48" size="1 1 12" color="h"/>
  <one in="h" out="k" steps="1"/>
  <all in="h" out="B"/>
  <all in="kB" out="kk"/>

  <!-- Tronco robusto e base larga -->
  <cylinder at="20 20 0" size="8 8 2" color="N" on="B"/>
  <box at="20 20 0" size="1 1 1" color="r"/>
  <one steps="50">
    <rule in="B r" out="r N" p="1"/>
    <rule in="B* *r" out="r* *N" p="0.05"/>
  </one>
  <all in="r" out="N"/>
  <all in="k" out="B"/>

  <!-- Volume della chioma tonda -->
  <ellipsoid at="20 20 40" size="32 32 30" color="V" on="B"/>
  <box at="20 20 0" size="40 40 5" color="x" on="[BV]"/>

  <!-- Rami all'interno della chioma -->
  <one steps="400" symmetry="(xyz)">
    <rule in="N V" out="N N"/>
    <rule in="V* *N" out="N* *N" p="0.1"/>
  </one>

  <!-- Riempimento foglie -->
  <all steps="2" symmetry="(xyz)">
    <rule in="NV" out="NJ"/>
    <rule in="JV" out="JJ"/>
  </all>
  <one steps="2500" symmetry="(xyz)" in="JV" out="JJ"/>
  
  <!-- Pulizia volumi di servizio -->
  <all in="[Vx]" out="B"/>

  <!-- Arrotondamento e dettaglio -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="J" out="B" values="B" sum="15..26" p="0.5"/>
  </convolution>
  <convolution neighborhood="Moore" steps="2">
    <rule in="J" out="B" values="B" sum="20..26"/>
  </convolution>

  <!-- Luci e ombre sulle foglie -->
  <prl steps="1">
    <rule in="B J" out="B G" p="0.6"/>
    <rule in="J B" out="E B" p="0.7"/>
  </prl>
</sequence>
