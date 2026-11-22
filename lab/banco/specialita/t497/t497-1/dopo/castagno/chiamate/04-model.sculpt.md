# model.sculpt · primo · gemini-3.1-flash-lite · 8 s · 5725 token d'ingresso (2035 in cache), 589 d'uscita, 1900 di ragionamento · $0.0047

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTGgHhRrKk" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="G" value="4b692f" name="foglie"/>
  <color symbol="g" value="84a956" name="foglie al sole"/>
  <color symbol="H" value="2d4420" name="foglie in ombra"/>
  <color symbol="R" hidden="True"/>
  <color symbol="K" hidden="True"/>
  <color symbol="r" hidden="True"/>

  <!-- Base del tronco robusta -->
  <cylinder at="20 20 0" size="8 8 8" color="T"/>
  
  <!-- Crescita del tronco -->
  <box at="20 20 8" size="1 1 30" color="r"/>
  <one steps="40">
    <rule in="B r" out="T r" p="0.9"/>
    <rule in="B* *r" out="r* *T" p="0.05"/>
  </one>
  <all in="r" out="T"/>

  <!-- Volume della chioma tonda -->
  <ellipsoid at="20 20 40" size="34 34 22" color="K" on="B"/>
  <all in="TK" out="TG"/>

  <!-- Espansione della chioma -->
  <one steps="1500" symmetry="(xyz)">
    <rule in="G B" out="G G" p="0.6"/>
    <rule in="G G" out="G G" p="0.2"/>
  </one>
  
  <!-- Pulizia volumi segnaposto -->
  <all in="K" out="B"/>

  <!-- Dettaglio: luce e ombra sulle foglie -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="G" out="g" values="B" sum="0..6"/>
    <rule in="G" out="H" values="B" sum="18..26"/>
  </convolution>

  <!-- Rimozione foglie sospese -->
  <convolution neighborhood="Moore" steps="3">
    <rule in="G" out="B" values="B" sum="20..26"/>
  </convolution>
</sequence>
