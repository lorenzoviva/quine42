# model.sculpt · primo · gemini-3.1-flash-lite · 6 s · 5678 token d'ingresso (2035 in cache), 595 d'uscita, 1747 di ragionamento · $0.0045

## Richiesta

Sculpt: Castagno
What it looks like: un albero dal tronco largo e la chioma tonda
Class: tree · box 40 × 40 × 60 voxels · at least 48 tall

## Risposta

<sequence values="BT L D k C r" size="40 40 60" symmetry="(xy)" name="Castagno">
  <color symbol="T" value="6b4a2e" name="tronco"/>
  <color symbol="L" value="4b8f4a" name="chioma"/>
  <color symbol="D" value="1f4a2c" name="ombra"/>
  <color symbol="k" hidden="True" name="altezza"/>
  <color symbol="C" hidden="True" name="sagoma"/>
  <color symbol="r" hidden="True" name="ramo"/>

  <!-- Scelta altezza -->
  <box at="20 20 48" size="1 1 12" color="k"/>
  <one in="k" out="k" steps="1"/>
  <all in="k" out="B"/>

  <!-- Tronco robusto e largo -->
  <cylinder at="20 20 0" size="8 8 20" color="T" on="B"/>
  
  <!-- Sagoma della chioma -->
  <ellipsoid at="20 20 40" size="32 32 24" color="C" on="B"/>
  
  <!-- Rami che si espandono nella chioma -->
  <one steps="300">
    <rule in="C T" out="T T"/>
    <rule in="C B" out="r B" p="0.1"/>
  </one>
  <all in="r" out="T"/>
  
  <!-- Crescita foglie dentro la sagoma -->
  <all steps="2" symmetry="(xyz)">
    <rule in="C B" out="L C"/>
    <rule in="C T" out="L T"/>
  </all>
  <all in="C" out="L"/>
  
  <!-- Smussatura e riempimento -->
  <convolution neighborhood="Moore" steps="2">
    <rule in="B" out="L" values="L" sum="12..26"/>
    <rule in="L" out="B" values="B" sum="0..4"/>
  </convolution>
  
  <!-- Dettagli di ombra -->
  <prl steps="1" symmetry="(xyz)">
    <rule in="L B" out="D B" p="0.3"/>
    <rule in="B L" out="D L" p="0.3"/>
  </prl>
</sequence>
