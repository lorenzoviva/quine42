# model.sculpt · primo · gemini-3.1-flash-lite · 7 s · 5678 token d'ingresso (2035 in cache), 716 d'uscita, 1696 di ragionamento · $0.0046

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BTFLGex" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="F" value="008751" name="foglie"/>
  <color symbol="L" value="00e436" name="foglie al sole"/>
  <color symbol="G" value="125359" name="foglie in ombra"/>
  <color symbol="e" hidden="True" name="costruzione"/>
  <color symbol="x" hidden="True" name="radici"/>

  <!-- Scelta altezza tra 48 e 55 -->
  <box at="0 0 48" size="1 1 8" color="e"/>
  <one in="e" out="x" steps="1"/>
  <all in="e" out="B"/>

  <!-- Tronco robusto -->
  <box at="20 20 0" size="4 4 2" color="T"/>
  <box at="20 20 2" size="2 2 1" color="T"/>
  <one steps="55">
    <rule in="T B" out="T T" p="0.95"/>
    <rule in="T B" out="T B" p="0.05"/>
  </one>
  <all in="x" out="T"/>

  <!-- Rami principali che si allargano -->
  <one steps="100" symmetry="(xyz)">
    <rule in="T B" out="T T" p="0.1"/>
  </one>

  <!-- Sagoma della chioma (ellissoide) -->
  <ellipsoid at="20 20 45" size="28 28 20" color="F" on="B"/>
  <ellipsoid at="20 20 45" size="28 28 20" color="F" on="T"/>

  <!-- Riempimento chioma -->
  <all in="B F" out="F F" steps="15"/>
  
  <!-- Arrotondamento della chioma -->
  <convolution neighborhood="Moore" steps="3">
    <rule in="B" out="F" values="F" sum="10..26"/>
    <rule in="F" out="B" values="B" sum="0..8"/>
  </convolution>

  <!-- Dettaglio colori (luce e ombra) -->
  <prl steps="1" symmetry="(xyz)">
    <rule in="F" out="L" p="0.2"/>
    <rule in="F" out="G" p="0.2"/>
  </prl>

  <!-- Pulizia finale -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="F" out="B" values="B" sum="20..26"/>
  </convolution>
</sequence>
